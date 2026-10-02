'use strict';

const cheerio = require('cheerio');
const sanitizeHtml = require('sanitize-html');
const MarkdownIt = require('markdown-it');
const parseSrcset = require('parse-srcset');
const highlightJs = require('highlight.js');
// Hexo mutates the shared highlighter's class prefix; keep our HTML rendering isolated.
const highlighter = highlightJs.newInstance();
for (const name of highlightJs.listLanguages()) {
  highlighter.registerLanguage(name, require(`highlight.js/lib/languages/${name}`));
}
const autoLanguages = ['javascript', 'typescript', 'json', 'bash', 'shell', 'powershell', 'python', 'yaml', 'ini', 'xml', 'css', 'sql', 'diff'];
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
  $('.halo-content').each((_, el) => $(el).replaceWith($(el).contents()));
  const source = new URL(baseUrl);
  const articleUrl = new URL(permalink, source);
  function url(value, isLink = false) {
    if (!value || value.startsWith('#')) return value;
    try {
      const resolved = new URL(value, articleUrl);
      if (isLink && resolved.origin === source.origin) {
        const pathname = resolved.pathname.replace(/%[\da-f]{2}/gi, part => part.toUpperCase()).replace(/\/+$/, '');
        const docSlug = resolved.searchParams.get('docSlug');
        const isDocQuery = docSlug && pathname.startsWith('/docs/view/');
        const local = postLinks.get(isDocQuery ? `${pathname}?docSlug=${encodeURIComponent(docSlug)}` : pathname);
        if (local && isDocQuery) resolved.searchParams.delete('docSlug');
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
  $('pre').each((_, el) => {
    const pre = $(el);
    if (pre.closest('figure.highlight').length) return;
    const code = pre.children('code').first();
    const text = (code.length ? code : pre).text();
    const declared = [code, pre].map(node => node.attr('data-language') || node.attr('data-lang') ||
      node.attr('language') || node.attr('lang') ||
      (node.attr('class') || '').match(/(?:^|\s)(?:language|lang)-(\S+)/)?.[1] ||
      (node.hasClass('nohighlight') ? 'plaintext' : '')).find(Boolean)?.trim().toLowerCase();
    let result;
    try {
      if (declared) {
        if (highlighter.getLanguage(declared)) result = highlighter.highlight(text, { language: declared, ignoreIllegals: true });
      } else {
        const detected = highlighter.highlightAuto(text, autoLanguages);
        if (detected.language && detected.relevance > 0) result = detected;
      }
    } catch {
      // An unsupported grammar must not discard the original code or stop the mirror.
    }
    const language = result?.language || 'plaintext';
    const grammar = highlighter.getLanguage(language);
    const label = grammar === highlighter.getLanguage('plaintext') ? 'TEXT' : grammar?.name || 'TEXT';
    const lines = Math.max(1, text.replace(/\n$/, '').split('\n').length);
    const details = $('<details class="halo-code-details"></details>');
    if (pre.attr('id')) details.attr('id', pre.attr('id'));
    if (pre.attr('collapsed') === 'false' || (pre.attr('collapsed') !== 'true' && lines <= 30)) details.attr('open', '');
    const summary = $('<summary></summary>')
      .append($('<span class="halo-code-language"></span>').text(label))
      .append($('<span class="halo-code-meta"></span>').text(`${result && !declared ? '自动 · ' : ''}${lines} 行`))
      .append('<span class="halo-code-actions"><span class="halo-code-expand">展开代码</span><span class="halo-code-collapse">收起代码</span><span class="halo-code-toolbar"></span></span>');
    const figure = $('<figure class="highlight"></figure>').addClass(language);
    const highlighted = $('<code class="hljs"></code>').addClass(`language-${language}`);
    if (code.attr('id')) highlighted.attr('id', code.attr('id'));
    if (result) highlighted.html(result.value);
    else highlighted.text(text);
    const body = $('<div class="halo-code-body"></div>')
      .append($('<div class="gutter" aria-hidden="true"></div>').append($('<pre></pre>').text(Array.from({ length: lines }, (_, i) => i + 1).join('\n'))))
      .append($('<div class="code"></div>').append($('<pre tabindex="0" aria-label="代码，可横向滚动"></pre>').append(highlighted)));
    figure.append(body);
    details.append(summary, figure);
    pre.replaceWith(details);
  });
  $('table').filter((_, el) => !$(el).closest('figure.highlight, .halo-table-scroll').length)
    .wrap('<div class="halo-table-scroll"></div>');
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
      div: ['aria-hidden'],
      pre: ['tabindex', 'aria-label'],
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
  return `<div class="halo-content">\n${clean.trim().replaceAll('`', '&#96;').replaceAll('~', '&#126;')}\n</div>`;
}

// Summaries and search should contain the code, not its display controls or line numbers.
function stripCodeTools(html) {
  const $ = cheerio.load(String(html || ''), {}, false);
  $('.halo-docs-directory, .halo-docs-breadcrumb, .halo-docs-adjacent').remove();
  $('.halo-code-details').each((_, el) => {
    const code = $(el).find('.code code').first();
    if (code.length) $(el).replaceWith($('<pre></pre>').append(code));
  });
  return $.html();
}

// Hexo 6 adds "/" to explicit permalinks, but generators concatenate root+path.
function normalizePostPath(value) {
  return typeof value === 'string' && value.startsWith('/archives/') ? value.slice(1) : value;
}

module.exports = { selectContent, renderContent, postPath, normalizePostPath, stripCodeTools };
