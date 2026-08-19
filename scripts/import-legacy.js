#!/usr/bin/env node
/**
 * import-legacy.js — 从旧产物仓库逆向现有文章为 Hexo Markdown 源文件
 *
 * 用法：
 *   node scripts/import-legacy.js <旧产物目录> [输出目录]
 *
 * 例：
 *   node scripts/import-legacy.js ../blog source/_posts
 *
 * 原理：读取 <产物>/2023/09/23/<文章名>/index.html，
 *       提取 post-body 里的 HTML，转成 Markdown，生成带 date/slug 的 front-matter。
 * 注意：老文章图片为相对路径，逆向后保持相对路径（图片文件在原仓库，部署时保留 2023/ 目录即可）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = process.argv[2];
const OUT = process.argv[3] || path.join(__dirname, '..', 'source', '_posts');
if (!SRC) {
  console.error('用法: node scripts/import-legacy.js <旧产物目录> [输出目录]');
  process.exit(1);
}

/** 用 pandoc 把 HTML 片段转 Markdown；无 pandoc 则退化为纯文本 */
function htmlToMarkdown(html) {
  try {
    return execSync(`pandoc -f html -t gfm-raw_html --wrap=none`, { input: html, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    console.warn('  [warn] 未找到 pandoc，用简易 HTML->Markdown 转换');
    return html
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n# $1\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n$1\n')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '\n![]($1)\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n');
  }
}

const postsDir = path.join(SRC, '2023');
if (!fs.existsSync(postsDir)) {
  console.error(`错误: ${postsDir} 不存在`);
  process.exit(1);
}

// 递归找所有文章 index.html（在 2023/09/23/<文章名>/index.html）
const candidates = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html' && /2023[\\/]\d{2}[\\/]\d{2}[\\/]/.test(p)) candidates.push(p);
  }
}
walk(postsDir);
console.log(`找到 ${candidates.length} 篇旧文章`);

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const htmlFile of candidates) {
  const dir = path.dirname(htmlFile);
  const slug = path.basename(dir);
  const html = fs.readFileSync(htmlFile, 'utf8');
  // 提取正文：<div class="post-body" itemprop="articleBody"> 到 文章末尾 <footer class="post-footer"> 之前
  const bodyStart = html.indexOf('class="post-body"');
  let bodyHtml = '';
  if (bodyStart >= 0) {
    const startTagEnd = html.indexOf('>', bodyStart) + 1;
    const footerIdx = html.indexOf('<footer class="post-footer"', startTagEnd);
    const endIdx = footerIdx > -1 ? footerIdx : html.indexOf('<!--noindex-->', startTagEnd);
    bodyHtml = html.slice(startTagEnd, endIdx > -1 ? endIdx : undefined);
  } else {
    bodyHtml = html;
  }
  // 提取标题与时间
  const titleMatch = html.match(/<title>([^<]+)/) || html.match(/class="post-title"[^>]*>([^<]+)</);
  const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*欢迎来到剃蛙铽.*/, '').trim() : slug;
  const dateMatch = html.match(/datetime="([^"]+)"/);
  const dt = dateMatch ? dateMatch[1].replace('+08:00', '') : '2023-09-23T00:00:00';
  const dateStr = dt.slice(0, 10) + ' ' + dt.slice(11, 19);

  const mdBody = htmlToMarkdown(bodyHtml)
    // 文章内图片相对路径修正：原产物里图片就在文章目录下
    .replace(/!\[\]\((?![a-z]+:|\/)([^)]+)\)/g, (m, rel) => `![](${path.basename(rel)})`);

  const front = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `date: ${dateStr}`,
    `updated: ${dateStr}`,
    '---',
    '',
    mdBody,
    '',
  ].join('\n');

  // 文件名用 Hexo 惯例：日期_标题
  const file = path.join(OUT, `${dateStr.slice(0, 10)}-${slug.replace(/[\\/:*?"<>|\s]+/g, '-')}.md`);
  fs.writeFileSync(file, front, 'utf8');
  console.log(`[ok] ${title} -> ${path.basename(file)}`);
  n++;
}
console.log(`完成，导入 ${n} 篇`);
