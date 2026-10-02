#!/usr/bin/env node
/**
 * sync-halo.js — 把 Halo 2.x 已发布文章同步为 Hexo HTML 文章源文件
 *
 * 使用方式：
 *   HALO_BASE_URL=https://your-halo.example.com \
 *   HALO_PAT=<个人访问令牌> \
 *   node tools/sync-halo.js
 *
 * 流程：
 *   1. 分页拉取 Halo 已发布文章列表（/apis/api.content.halo.run/v1alpha1/posts）
 *   2. 取公开详情正文；有 PAT 时优先取 console release-content
 *   3. 拉取分类/标签列表，把 metadata.name 映射为 displayName
 *   4. 适配富文本并生成 Hexo front-matter HTML 写入 source/_posts/
 *   5. 删除本地存在但 Halo 已不存在的旧文章文件（增量同步）
 *   6. 同步站点头像与背景图到 source/images/，并写入主题配置
 *
 * 不读取草稿快照，不将 PAT 写入静态产物。任何正文读取失败都在写文件前中止。
 *
 * 环境变量：
 *   HALO_BASE_URL  必填，Halo 站点地址，如 https://blog.example.com
 *   HALO_PAT       可选，Halo 个人访问令牌
 *   HALO_SKIP_HTTPS_CHECK 可选，设为 1 时忽略 TLS 证书校验（自签名证书用）
 *   HALO_AVATAR_URL     可选，直接指定头像地址，跳过自动探测
 *   HALO_BACKGROUND_URL 可选，直接指定背景图地址，跳过自动探测
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const cheerio = require('cheerio');
const { selectContent, renderContent, postPath, stripCodeTools } = require('./halo-content');
const { loadDocs, docRoutes, renderDocPages } = require('./halo-docs');

const BASE = (process.env.HALO_BASE_URL || '').replace(/\/+$/, '');
const PAT = process.env.HALO_PAT || '';
const SKIP_TLS = process.env.HALO_SKIP_HTTPS_CHECK === '1';
const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const DOCS_DIR = path.join(ROOT, 'source', 'docs');
const IMAGES_DIR = path.join(ROOT, 'source', 'images');
const DATA_DIR = path.join(ROOT, 'source', '_data');
const CONFIG_FILE = path.join(ROOT, '_config.yml');

if (require.main === module && !BASE) {
  console.error('错误：需要设置 HALO_BASE_URL 环境变量');
  process.exit(1);
}
if (require.main === module && !PAT) {
  console.log('[sync] 未提供 HALO_PAT，仅使用 Halo 公开 API 的已发布正文');
}

/** 发起 GET 请求，返回 { status, body }；不跟随重定向 */
function httpGet(url, { auth = true, accept = 'application/json' } = {}) {
  const u = url instanceof URL ? url : new URL(url);
  const lib = u.protocol === 'https:' ? https : http;
  const headers = { Accept: accept };
  if (auth && PAT && u.origin === new URL(BASE).origin) headers.Authorization = `Bearer ${PAT}`;
  const options = { method: 'GET', headers };
  if (SKIP_TLS && u.protocol === 'https:') options.rejectUnauthorized = false;
  return new Promise((resolve, reject) => {
    const req = lib.request(u, options, (res) => {
      // Decode across chunk boundaries; Buffer -> string per chunk corrupts CJK.
      res.setEncoding('utf8');
      let body = '';
      res.on('error', reject);
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error(`GET ${u.href} 超时`)));
    req.end();
  });
}

/** GET 并解析 JSON；非 2xx 抛错，错误对象带 status（3xx 通常是 Halo 未认证时重定向到登录页） */
async function getJSON(url, opts) {
  const { status, body } = await httpGet(url, opts);
  if (status < 200 || status >= 300) {
    const err = new Error(`GET ${url} -> ${status}: ${body.slice(0, 200)}`);
    err.status = status;
    throw err;
  }
  try {
    return JSON.parse(body);
  } catch (e) {
    const err = new Error(`GET ${url} 返回非 JSON: ${body.slice(0, 200)}`);
    err.status = status;
    throw err;
  }
}

/** 认证失败（未登录/无权限）：Halo 对未认证的 console 请求会 302 到登录页 */
function isAuthFailure(err) {
  return err.status === 401 || err.status === 403 || (err.status >= 300 && err.status < 400);
}

/** 请求 Halo 内容 API 的某一页 */
function request(pathname, page = 1, size = 50) {
  const url = new URL(BASE + pathname);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  url.searchParams.set('publishPhase', 'published');
  return getJSON(url, { auth: false });
}

/** 拉取全部页 */
async function fetchAll(pathname, requestPage = request) {
  const items = [];
  const seen = new Set();
  let page = 1;
  for (;;) {
    const data = await requestPage(pathname, page, 50);
    if (!Array.isArray(data.items)) throw new Error(`${pathname} 返回无效列表`);
    const list = data.items;
    for (const item of list) {
      if (!item.metadata?.name || seen.has(item.metadata.name)) throw new Error(`${pathname} 返回重复或无效资源`);
      seen.add(item.metadata.name);
    }
    items.push(...list);
    if (data.hasNext === false || data.last === true) break;
    if (data.hasNext !== true && (Number.isFinite(data.total) ? items.length >= data.total : list.length < 50)) break;
    if (!list.length || page >= 10000) throw new Error(`${pathname} 分页未结束`);
    page += 1;
  }
  return items;
}

/** 取单个资源（pathSuffix 拼在 pathname 后，用于拿 release-content 正文） */
function fetchOne(pathname, pathSuffix, opts) {
  return getJSON(new URL(`${BASE}${pathname}/${pathSuffix}`), opts);
}

function yamlQuote(s) {
  return JSON.stringify(String(s ?? ''));
}

/**
 * 生成首页摘要：优先 Halo 文章的摘要（excerpt.raw），
 * 否则取正文纯文本前 120 字。首页用 description 显示预览 + 阅读全文按钮。
 */
function buildExcerpt(post, raw) {
  if (post.spec.excerpt && post.spec.excerpt.raw && !post.spec.excerpt.autoGenerate) {
    return post.spec.excerpt.raw;
  }
  const text = cheerio.load(stripCodeTools(raw), {}, false).text().replace(/\s+/g, ' ').trim();
  const excerpt = text.length > 120 ? text.slice(0, 120) + '…' : text;
  // NexT inserts descriptions as HTML; decoded code examples must remain text.
  return cheerio.load('<p></p>', {}, false)('p').text(excerpt).html();
}

/** 生成 YAML front-matter */
function frontMatter(post, categories, tags, raw) {
  const date = post.spec.publishTime || post.metadata.creationTimestamp || '';
  const dateStr = date ? new Date(date).toISOString() : '';
  const updated = post.status?.lastModifyTime || date;
  const lines = ['---'];
  lines.push(`title: ${yamlQuote(post.spec.title)}`);
  lines.push(`date: ${dateStr}`);
  lines.push(`updated: ${updated ? new Date(updated).toISOString() : dateStr}`);
  lines.push('layout: post');
  lines.push('disableNunjucks: true');
  lines.push(`permalink: ${yamlQuote(postPath(post).slice(1))}`);
  const excerpt = buildExcerpt(post, raw);
  if (excerpt) lines.push(`description: ${yamlQuote(excerpt)}`);
  const cats = (post.spec.categories || []).map((c) => categories[c]).filter(Boolean);
  if (cats.length) lines.push(`categories:\n${cats.map((c) => `  - ${yamlQuote(c)}`).join('\n')}`);
  const tgs = (post.spec.tags || []).map((t) => tags[t]).filter(Boolean);
  if (tgs.length) lines.push(`tags:\n${tgs.map((t) => `  - ${yamlQuote(t)}`).join('\n')}`);
  // Halo 源信息（用于溯源与去重）
  lines.push(`halo_post_name: ${yamlQuote(post.metadata.name)}`);
  lines.push('---');
  return lines.join('\n') + '\n\n' + raw.trim() + '\n';
}

/**
 * 取已发布 HTML；仅无渲染结果时才按 rawType 处理原文。
 * 无 PAT 直接公开请求；console 认证失败则匿名回退。其他错误中止同步。
 */
async function resolveContent(postName, { token = PAT, fetch = fetchOne } = {}) {
  const name = encodeURIComponent(postName);
  if (!token) {
    const vo = await fetch('/apis/api.content.halo.run/v1alpha1/posts', name, { auth: false });
    return selectContent(vo?.content);
  }
  try {
    const wrapper = await fetch(
      '/apis/api.console.halo.run/v1alpha1/posts',
      `${name}/release-content`,
    );
    return selectContent(wrapper);
  } catch (e) {
    if (isAuthFailure(e)) {
      console.log(`[fallback] release-content 无权限(${e.status})，改用公开接口`);
      const vo = await fetch('/apis/api.content.halo.run/v1alpha1/posts', name, { auth: false });
      return selectContent(vo?.content);
    }
    throw e;
  }
}

/** 把可能是相对路径的资源地址补成绝对地址 */
function absoluteUrl(src) {
  if (!src) return '';
  try {
    return new URL(src, BASE + '/').href;
  } catch (e) {
    return '';
  }
}

/**
 * 头像地址：取 Halo 用户头像（文章列表里的 owner.avatar，公开可读）。
 * 站点 Logo 语义上不是头像，因此只在用户没设头像时才退回用它。
 */
async function resolveAvatarUrl(posts) {
  if (process.env.HALO_AVATAR_URL) return process.env.HALO_AVATAR_URL;
  const owner = posts.map((p) => p.owner).find((o) => o && o.avatar);
  if (owner) return absoluteUrl(owner.avatar);
  try {
    const info = await getJSON(`${BASE}/actuator/globalinfo`, { auth: false });
    return absoluteUrl(info.favicon);
  } catch (e) {
    return '';
  }
}

/**
 * 背景图地址。Halo 本身没有「站点背景图」这个设置项，它属于各主题自己的配置，
 * 所以按可靠性依次尝试：
 *   1. HALO_BACKGROUND_URL 环境变量（最确定）
 *   2. 当前启用主题的配置（console API，需 PAT）里键名含 bg/background/banner/cover 的图片地址
 *   3. 抓 Halo 首页 HTML 内联样式里的 background-image（公开，主题换了也大多还在）
 */
async function resolveBackgroundUrl() {
  if (process.env.HALO_BACKGROUND_URL) return process.env.HALO_BACKGROUND_URL;

  const isImage = (v) => typeof v === 'string' && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(v);
  try {
    const active = await getJSON(`${BASE}/apis/api.console.halo.run/v1alpha1/themes/-/activation`);
    const themeName = active && active.metadata && active.metadata.name;
    if (themeName) {
      const config = await getJSON(
        `${BASE}/apis/api.console.halo.run/v1alpha1/themes/${encodeURIComponent(themeName)}/json-config`,
      );
      const hit = findByKey(config, /bg|background|banner|cover|header/i, isImage);
      if (hit) {
        console.log(`[site] 背景图取自主题「${themeName}」配置`);
        return absoluteUrl(hit);
      }
    }
  } catch (e) {
    if (!isAuthFailure(e)) console.log(`[site] 读取主题配置失败（${e.message.slice(0, 80)}），改从首页探测`);
  }

  try {
    const { status, body } = await httpGet(`${BASE}/`, { auth: false, accept: 'text/html' });
    if (status >= 200 && status < 300) {
      for (const m of body.matchAll(/background-image:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
        if (isImage(m[1])) {
          console.log('[site] 背景图从 Halo 首页样式探测得到');
          return absoluteUrl(m[1]);
        }
      }
    }
  } catch (e) {
    // 探测失败就保留仓库里现有的背景
  }
  return '';
}

/** 深度遍历对象，找出键名匹配 keyRe 且值满足 valueOk 的第一个值 */
function findByKey(obj, keyRe, valueOk) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [k, v] of Object.entries(obj)) {
    if (keyRe.test(k) && valueOk(v)) return v;
    if (v && typeof v === 'object') {
      const hit = findByKey(v, keyRe, valueOk);
      if (hit) return hit;
    }
  }
  return null;
}

/** 下载资源到本地，返回站内相对路径（如 /images/halo-avatar.png） */
async function download(url, baseName) {
  const { status, body } = await new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const options = { method: 'GET', headers: { Accept: 'image/*' } };
    if (SKIP_TLS && u.protocol === 'https:') options.rejectUnauthorized = false;
    const req = lib.request(u, options, (res) => {
      // 图片 CDN 常带 301/302，跟随一次
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(new URL(res.headers.location, u).href, baseName).then(
          (p) => resolve({ status: 200, redirected: p }),
          reject,
        );
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
  if (status < 200 || status >= 300) throw new Error(`下载 ${url} -> ${status}`);
  if (!body) return null; // 已由重定向分支处理

  const ext = (path.extname(new URL(url).pathname).toLowerCase().match(/^\.(jpe?g|png|webp|gif|avif|svg)$/) || [])[0]
    || '.png';
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const fileName = `${baseName}${ext}`;
  fs.writeFileSync(path.join(IMAGES_DIR, fileName), body);
  return `/images/${fileName}`;
}

/** 把 _config.yml 里 theme_config.avatar.url 换成新路径 */
function patchAvatarConfig(localPath) {
  const yml = fs.readFileSync(CONFIG_FILE, 'utf8');
  const patched = yml.replace(
    /(^\s{2}avatar:\n\s{4}url:\s*)(\S*)/m,
    (m, prefix) => `${prefix}${localPath}`,
  );
  if (patched === yml) {
    console.log('[site] 未在 _config.yml 找到 theme_config.avatar.url，跳过写入');
    return;
  }
  fs.writeFileSync(CONFIG_FILE, patched, 'utf8');
}

/** 生成背景图样式（NexT 通过 custom_file_path.style 注入），沿用旧站的半透明观感 */
function writeBackgroundStyle(localPath) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const styl = localPath
    ? `// 由 tools/sync-halo.js 从 Halo 同步生成，请勿手改
body {
  background: url(${localPath}) no-repeat fixed 50% 50%;
  background-size: cover;
}

.header-inner, .sidebar { opacity: .8; }
.content { opacity: .7; }
`
    : '// 未探测到 Halo 背景图\n';
  fs.writeFileSync(path.join(DATA_DIR, 'styles.styl'), styl, 'utf8');
}

/** 同步站点头像与背景图 */
async function syncSiteAssets(posts) {
  const [avatarUrl, backgroundUrl] = await Promise.all([
    resolveAvatarUrl(posts),
    resolveBackgroundUrl(),
  ]);

  if (avatarUrl) {
    try {
      const local = await download(avatarUrl, 'halo-avatar');
      if (local) {
        patchAvatarConfig(local);
        console.log(`[site] 头像 ${avatarUrl} -> ${local}`);
      }
    } catch (e) {
      console.log(`[site] 头像下载失败，保留现有配置：${e.message}`);
    }
  } else {
    console.log('[site] 未找到 Halo 头像，保留现有配置');
  }

  let backgroundLocal = '';
  if (backgroundUrl) {
    try {
      backgroundLocal = (await download(backgroundUrl, 'halo-background')) || '';
      if (backgroundLocal) console.log(`[site] 背景图 ${backgroundUrl} -> ${backgroundLocal}`);
    } catch (e) {
      console.log(`[site] 背景图下载失败：${e.message}`);
    }
  } else {
    console.log('[site] 未探测到 Halo 背景图');
  }
  writeBackgroundStyle(backgroundLocal);
}

async function main() {
  console.log(`[sync] 从 ${BASE} 同步已发布文章...`);

  // 1. 分类 / 标签 name -> displayName 映射
  const [catList, tagList, docs] = await Promise.all([
    fetchAll('/apis/api.content.halo.run/v1alpha1/categories'),
    fetchAll('/apis/api.content.halo.run/v1alpha1/tags'),
    loadDocs(fetchAll),
  ]);
  if (!docs.available) throw new Error('MiniDocs 公开接口不可用，停止同步以免发布缺失文档的站点');
  const categories = {};
  for (const c of catList) categories[c.metadata.name] = c.spec.displayName;
  const tags = {};
  for (const t of tagList) tags[t.metadata.name] = t.spec.displayName;
  console.log(`[sync] 分类 ${Object.keys(categories).length} 个，标签 ${Object.keys(tags).length} 个`);

  // 2. 拉取全部已发布文章
  const posts = (await fetchAll('/apis/api.content.halo.run/v1alpha1/posts'))
    .filter(post => post.spec?.publish !== false && !post.spec?.deleted &&
      (!post.spec?.visible || post.spec.visible === 'PUBLIC'));
  console.log(`[sync] 已发布文章 ${posts.length} 篇`);

  fs.mkdirSync(POSTS_DIR, { recursive: true });

  // 3. Resolve every body before touching existing posts. Any failed/empty
  // response aborts the build instead of publishing or deleting partial content.
  const written = new Set();
  const pending = new Map();
  const postLinks = new Map(posts.map(post => [postPath(post).replace(/\/+$/, ''), postPath(post)]));
  if (postLinks.size !== posts.length) throw new Error('文章 permalink 冲突，停止同步');
  for (const [source, target] of docRoutes(docs.books)) {
    if (postLinks.has(source)) throw new Error(`文档路径冲突: ${source}`);
    postLinks.set(source, target);
  }
  for (const post of posts) {
    const name = post.metadata.name;
    const html = await resolveContent(name);
    const content = renderContent(html, {
      baseUrl: BASE,
      permalink: post.status?.permalink || postPath(post),
      postLinks
    });
    const document = frontMatter(post, categories, tags, content);
    // A resource ID is stable across title/slug changes and cannot escape _posts.
    const file = path.join(POSTS_DIR, `${encodeURIComponent(name)}.html`);
    pending.set(file, document);
    written.add(file);
    console.log(`[ok] ${post.spec.title} -> ${path.basename(file)}`);
  }
  const writtenDocs = new Set();
  for (const [name, document] of renderDocPages(docs.books, { baseUrl: BASE, postLinks })) {
    const file = path.join(DOCS_DIR, name);
    pending.set(file, document);
    writtenDocs.add(file);
  }
  for (const [file, document] of pending) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.tmp', document, 'utf8');
    fs.renameSync(file + '.tmp', file);
  }

  // 4. 清理本地多余文件（Halo 已删除/未发布的文章）
  for (const f of fs.readdirSync(POSTS_DIR)) {
    const full = path.join(POSTS_DIR, f);
    if (/\.(md|html)$/.test(f) && !written.has(full)) {
      fs.unlinkSync(full);
      console.log(`[del] ${f}`);
    }
  }
  for (const f of fs.readdirSync(DOCS_DIR)) {
    const full = path.join(DOCS_DIR, f);
    if (/^(index|kb-.+|doc-.+)\.html$/.test(f) && !writtenDocs.has(full)) {
      fs.unlinkSync(full);
      console.log(`[del] docs/${f}`);
    }
  }

  console.log(`[sync] 完成，共写入 ${written.size} 篇文章、${docs.books.length} 个知识库、${docs.books.reduce((sum, book) => sum + book.documents.length, 0)} 篇文档`);

  // 5. 同步站点头像与背景图
  await syncSiteAssets(posts);
}

if (require.main === module) main().catch((e) => {
  console.error('[sync] 失败:', e.message);
  process.exit(1);
});

module.exports = { fetchAll, resolveContent, frontMatter, httpGet, main };
