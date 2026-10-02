'use strict';

const cheerio = require('cheerio');
const sanitizeHtml = require('sanitize-html');
const MarkdownIt = require('markdown-it');
const parseSrcset = require('parse-srcset');
const markdown = new MarkdownIt({ html: true, linkify: true }).use(
  require('hexo-renderer-markdown-it/lib/anchors'),
  { level: 1, collisionSuffix: '', case: 0, separator: '-' }
);

/** Prefer Halo's published rendering, not editor-specific raw data. */
function selectContent(wrapper) {
  if (typeof wrapper?.content === 'string' && wrapper.content.trim()) {
    return wrapper.content;
  }
  const raw = wrapper?.raw;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('已发布正文缺失或为空');
  const type = String(wrapper.rawType || '').toLowerCase();
  if (type.includes('html') || (!type && /^\s*<[a-z][\s\S]*>/i.test(raw))) return raw;
  if (!type || type.includes('markdown')) return markdown.render(raw);
  throw new Error(`不支持的正文类型 ${type}，且缺少已渲染 HTML`);
}

function postPath(post) {
  // Retain the source URL instead of deriving routes from a lossy filename.
  const permalink = post.status?.permalink;
  const pathname = permalink ? new URL(permalink, 'https://halo.invalid').pathname
    : `/archives/${encodeURIComponent(post.spec.slug || post.metadata.name)}`;
  if (!pathname.startsWith('/archives/') || /[\\\0]/.test(pathname)) {
    throw new Error(`不支持的文章路径: ${pathname}`);
  }
  return pathname.replace(/\/+$/, '') + '/';
}

function renderContent(html, { baseUrl, permalink, postLinks = new Map() }) {
  const $ = cheerio.load(html, { xmlMode: false }, false);
  const source = new URL(baseUrl);
  const articleUrl = new URL(permalink, source);
  function url(value, isLink = false) {
    if (!value || value.startsWith('#')) return value;
    try {
      const resolved = new URL(value, articleUrl);
      if (isLink && resolved.origin === source.origin) {
        const local = postLinks.get(resolved.pathname.replace(/\/+$/, ''));
        if (local) return local + resolved.search + resolved.hash;
      }
      return resolved.href;
    } catch {
      return '';
    }
  }

  // The Halo plugin runtime is absent on Pages. Use native, accessible links
  // rather than empty custom elements or remote scripts.
  $('hyperlink-card, hyperlink-inline-card').each((_, el) => {
    const card = $(el);
    const anchor = $('<a></a>');
    anchor.attr('href', card.attr('href') || card.find('a').attr('href') || '');
    anchor.attr('target', card.attr('target') || '_blank');
    anchor.addClass(el.name === 'hyperlink-card' ? 'halo-link-card' : 'halo-inline-card');
    anchor.text(card.attr('custom-title') || card.attr('title') || card.text().trim() || anchor.attr('href'));
    card.replaceWith(anchor);
  });
  $('pre[collapsed="true"]').each((_, el) => {
    const pre = $(el);
    pre.removeAttr('collapsed');
    pre.wrap('<details class="halo-code-details"></details>');
    pre.before('<summary>展开代码</summary>');
  });
  $('table').wrap('<div class="halo-table-scroll"></div>');
  $('*').each((_, el) => {
    const node = $(el);
    for (const attr of ['href', 'src', 'poster']) {
      if (node.attr(attr)) node.attr(attr, url(node.attr(attr), attr === 'href'));
    }
    if (el.name === 'img') {
      if (node.attr('data-src')) node.attr('src', url(node.attr('data-src')));
      const srcset = node.attr('data-srcset') || node.attr('srcset');
      if (srcset) {
        node.attr('srcset', parseSrcset(srcset).map(candidate => {
          const descriptor = candidate.w ? ` ${candidate.w}w` : candidate.d ? ` ${candidate.d}x` : '';
          return url(candidate.url) + descriptor;
        }).join(', '));
      }
      node.attr('loading', 'lazy').attr('decoding', 'async');
    }
    if (el.name === 'a' && node.attr('target') === '_blank') {
      node.attr('rel', 'noopener noreferrer');
    }
    if (['video', 'audio'].includes(el.name)) {
      node.attr('controls', '').attr('preload', 'metadata').removeAttr('autoplay');
    }
    if (el.name === 'iframe') {
      node.attr('sandbox', 'allow-scripts allow-presentation');
      node.attr('loading', 'lazy').attr('referrerpolicy', 'no-referrer');
      if (!node.attr('title')) node.attr('title', '嵌入内容');
    }
  });
  const clean = sanitizeHtml($.html(), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'video', 'audio', 'source', 'track', 'iframe', 'details', 'summary',
      'input', 'del', 's', 'u', 'sub', 'sup', 'mark'
    ]),
    allowedAttributes: {
      '*': ['id', 'class', 'style', 'title', 'lang', 'dir'],
      a: ['href', 'target', 'rel', 'download'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      video: ['src', 'poster', 'controls', 'preload', 'width', 'height', 'loop', 'muted'],
      audio: ['src', 'controls', 'preload', 'loop', 'muted'],
      source: ['src', 'type', 'media'],
      track: ['src', 'kind', 'srclang', 'label', 'default'],
      iframe: ['src', 'title', 'width', 'height', 'sandbox', 'loading', 'referrerpolicy', 'allowfullscreen'],
      details: ['open'],
      input: ['type', 'checked', 'disabled'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start', 'reversed'],
      li: ['value']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowedStyles: {
      '*': {
        color: [/^#[\da-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
        'background-color': [/^#[\da-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
        'text-align': [/^(left|right|center|justify)$/],
        'text-decoration': [/^(underline|line-through|none)$/],
        'font-weight': [/^(bold|normal|[1-9]00)$/],
        'font-style': [/^(italic|normal)$/],
        width: [/^\d+(\.\d+)?(px|%|em|rem)$/],
        height: [/^(auto|\d+(\.\d+)?(px|%|em|rem))$/]
      }
    },
    transformTags: {
      input: (_tag, attrs) => ({ tagName: 'input', attribs: { type: 'checkbox', disabled: '', ...(Object.hasOwn(attrs, 'checked') ? { checked: '' } : {}) } })
    }
  });
  // Hexo runs its Markdown fence filter even on HTML; entities keep the text literal.
  return `<div class="halo-content">\n${clean.replaceAll('`', '&#96;').replaceAll('~', '&#126;')}\n</div>`;
}

// Hexo 6 adds "/" to explicit permalinks, but generators concatenate root+path.
function normalizePostPath(value) {
  return typeof value === 'string' && value.startsWith('/archives/') ? value.slice(1) : value;
}

module.exports = { selectContent, renderContent, postPath, normalizePostPath };
