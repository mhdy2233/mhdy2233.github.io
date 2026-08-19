#!/usr/bin/env node
/**
 * sync-halo.js — 把 Halo 2.x 已发布文章同步为 Hexo 博客的 Markdown 源文件
 *
 * 使用方式：
 *   HALO_BASE_URL=https://your-halo.example.com \
 *   HALO_PAT=<个人访问令牌> \
 *   node scripts/sync-halo.js
 *
 * 流程：
 *   1. 分页拉取 Halo 已发布文章列表（/apis/api.content.halo.run/v1alpha1/posts）
 *   2. 逐篇调用 console API 的 release-content 接口拿已发布正文（markdown 原文）
 *   3. 拉取分类/标签列表，把 metadata.name 映射为 displayName
 *   4. 生成 Hexo front-matter Markdown 写入 source/_posts/
 *   5. 删除本地存在但 Halo 已不存在的旧文章文件（增量同步）
 *
 * 注意：公开 API 的 /apis/api.content.halo.run/v1alpha1/snapshots 在 Halo 2.x 中不存在，
 * 正文必须走 console API：/apis/api.console.halo.run/v1alpha1/posts/{name}/release-content
 * （需要 PAT 认证，Halo 后台「个人资料 → 个人令牌」创建，带 api 或 console 权限）。
 *
 * 环境变量：
 *   HALO_BASE_URL  必填，Halo 站点地址，如 https://blog.example.com
 *   HALO_PAT       必填，Halo 个人访问令牌（后台「个人资料 → 个人令牌」创建）
 *   HALO_SKIP_HTTPS_CHECK 可选，设为 1 时忽略 TLS 证书校验（自签名证书用）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE = (process.env.HALO_BASE_URL || '').replace(/\/+$/, '');
const PAT = process.env.HALO_PAT || '';
const SKIP_TLS = process.env.HALO_SKIP_HTTPS_CHECK === '1';
const POSTS_DIR = path.join(__dirname, '..', 'source', '_posts');

if (!BASE || !PAT) {
  console.error('错误：需要设置 HALO_BASE_URL 和 HALO_PAT 环境变量');
  process.exit(1);
}

/** 请求 Halo API，自动分页，返回 items 数组 */
async function request(pathname, page = 0, size = 50) {
  const url = new URL(BASE + pathname);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  url.searchParams.set('publishPhase', 'published');
  const lib = url.protocol === 'https:' ? https : http;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: 'application/json',
    },
  };
  if (SKIP_TLS && url.protocol === 'https:') {
    options.rejectUnauthorized = false;
  }
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GET ${pathname} -> ${res.statusCode}: ${body.slice(0, 300)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`GET ${pathname} 返回非 JSON: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/** 拉取全部页 */
async function fetchAll(pathname) {
  const items = [];
  let page = 0;
  for (;;) {
    const data = await request(pathname, page, 50);
    const list = data.items || [];
    items.push(...list);
    if (list.length < 50) break;
    page += 1;
  }
  return items;
}

/** 取单个资源（pathSuffix 拼在 pathname 后，用于拿 release-content 正文） */
async function fetchOne(pathname, pathSuffix) {
  const url = new URL(`${BASE}${pathname}/${pathSuffix}`);
  const lib = url.protocol === 'https:' ? https : http;
  const options = {
    method: 'GET',
    headers: { Authorization: `Bearer ${PAT}`, Accept: 'application/json' },
  };
  if (SKIP_TLS && url.protocol === 'https:') options.rejectUnauthorized = false;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GET ${pathname}/${name} -> ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/** 把 Markdown 正文中 Halo 附件相对链接补全为绝对地址 */
function rewriteMedia(md, postPermalink) {
  if (!md) return md;
  // 附件引用形如 attachments/mhdy2233/xxxx.png（相对当前文章路径）
  const base = new URL(BASE);
  return md.replace(/!\[([^\]]*)\]\((attachments\/[^)\s]+)\)/g, (m, alt, rel) => {
    const abs = new URL(`/upload/${rel.replace(/^attachments\//, '')}`, base);
    return `![${alt}](${abs.href})`;
  }).replace(/(src|href)=["'](\/upload\/[^"']+)["']/g, (m, attr, rel) => {
    const abs = new URL(rel, base);
    return `${attr}="${abs.href}"`;
  });
}

function yamlQuote(s) {
  if (s == null) return '""';
  const str = String(s);
  if (/[:#\[\]{}&*!|>'"%@`\n]/.test(str) || /^\s|\s$/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

/** 从 markdown 正文提取纯文本（去标记），用于自动生成首页摘要 */
function plainText(md) {
  return String(md || '')
    .replace(/<!--[\s\S]*?-->/g, '')          // HTML 注释
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')     // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // 链接保留文字
    .replace(/^[>\-\*\+ ]+/gm, '')            // 引用/列表符号
    .replace(/[#`_~|]+/g, '')                 // 标题/代码/强调标记
    .replace(/<[^>]+>/g, '')                  // HTML 标签
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成首页摘要：优先 Halo 文章的摘要（excerpt.raw），
 * 否则取正文纯文本前 120 字。首页用 description 显示预览 + 阅读全文按钮。
 */
function buildExcerpt(post, raw) {
  if (post.spec.excerpt && post.spec.excerpt.raw && !post.spec.excerpt.autoGenerate) {
    return post.spec.excerpt.raw;
  }
  const text = plainText(raw);
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
}

/** 生成 YAML front-matter */
function frontMatter(post, categories, tags, raw) {
  const date = post.spec.publishTime || post.metadata.creationTimestamp || '';
  const dateStr = date ? date.replace(/\.\d+Z$/, 'Z').replace('Z', '+08:00').replace('T', ' ') : '';
  const lines = ['---'];
  lines.push(`title: ${yamlQuote(post.spec.title)}`);
  lines.push(`date: ${dateStr}`);
  lines.push(`updated: ${dateStr}`);
  const excerpt = buildExcerpt(post, raw);
  if (excerpt) lines.push(`description: ${yamlQuote(excerpt)}`);
  const cats = (post.spec.categories || []).map((c) => categories[c]).filter(Boolean);
  if (cats.length) lines.push(`categories:\n${cats.map((c) => `  - ${yamlQuote(c)}`).join('\n')}`);
  const tgs = (post.spec.tags || []).map((t) => tags[t]).filter(Boolean);
  if (tgs.length) lines.push(`tags:\n${tgs.map((t) => `  - ${yamlQuote(t)}`).join('\n')}`);
  // Halo 源信息（用于溯源与去重）
  lines.push(`halo_post_name: ${post.metadata.name}`);
  lines.push('---');
  return lines.join('\n') + '\n\n' + raw.trim() + '\n';
}

/**
 * 取已发布正文（markdown 原文）。
 *
 * 首选 console API 的 release-content 接口：服务端按 releaseSnapshot + baseSnapshot
 * 合并快照链后直接返回完整内容。返回体 ContentWrapper：{ raw, content, rawType }，
 * raw 即 markdown 原文。
 *
 * 若 console API 因权限返回 401/403，回退到公开只读接口
 * /apis/api.content.halo.run/v1alpha1/posts/{name}（匿名可读，返回 PostVo，
 * 其 content.raw 同样为 markdown 原文）。
 */
async function resolveContent(postName) {
  try {
    const wrapper = await fetchOne(
      '/apis/api.console.halo.run/v1alpha1/posts',
      `${postName}/release-content`,
    );
    return (wrapper && wrapper.raw) || '';
  } catch (e) {
    const status = Number((e.message.match(/(\d{3})/) || [])[1]);
    if (status === 401 || status === 403) {
      console.log(`[fallback] release-content 无权限(${status})，改用公开接口`);
      const vo = await fetchOne('/apis/api.content.halo.run/v1alpha1/posts', postName);
      return (vo && vo.content && vo.content.raw) || '';
    }
    throw e;
  }
}

async function main() {
  console.log(`[sync] 从 ${BASE} 同步已发布文章...`);

  // 1. 分类 / 标签 name -> displayName 映射
  const [catList, tagList] = await Promise.all([
    fetchAll('/apis/api.content.halo.run/v1alpha1/categories'),
    fetchAll('/apis/api.content.halo.run/v1alpha1/tags'),
  ]);
  const categories = {};
  for (const c of catList) categories[c.metadata.name] = c.spec.displayName;
  const tags = {};
  for (const t of tagList) tags[t.metadata.name] = t.spec.displayName;
  console.log(`[sync] 分类 ${Object.keys(categories).length} 个，标签 ${Object.keys(tags).length} 个`);

  // 2. 拉取全部已发布文章
  const posts = await fetchAll('/apis/api.content.halo.run/v1alpha1/posts');
  console.log(`[sync] 已发布文章 ${posts.length} 篇`);

  fs.mkdirSync(POSTS_DIR, { recursive: true });

  // 3. 逐篇拉正文 + 生成 Markdown
  const written = new Set();
  for (const post of posts) {
    const name = post.metadata.name;
    const raw = await resolveContent(name);
    if (!raw.trim()) {
      console.log(`[skip] ${post.spec.title} 正文为空，跳过`);
      continue;
    }
    const md = frontMatter(post, categories, tags, raw);
    const slug = post.spec.slug || name;
    // 文件名 = 纯标题（Hexo 用文件名作 slug，生成 /YYYY/MM/DD/<标题>/ 与旧站 URL 一致）
    const safeTitle = slug.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || name;
    const file = path.join(POSTS_DIR, `${safeTitle}.md`);
    fs.writeFileSync(file, md, 'utf8');
    written.add(file);
    console.log(`[ok] ${post.spec.title} -> ${path.basename(file)}`);
  }

  // 4. 清理本地多余文件（Halo 已删除/未发布的文章）
  for (const f of fs.readdirSync(POSTS_DIR)) {
    const full = path.join(POSTS_DIR, f);
    if (f.endsWith('.md') && !written.has(full)) {
      fs.unlinkSync(full);
      console.log(`[del] ${f}`);
    }
  }

  console.log(`[sync] 完成，共写入 ${written.size} 篇`);
}

main().catch((e) => {
  console.error('[sync] 失败:', e.message);
  process.exit(1);
});
