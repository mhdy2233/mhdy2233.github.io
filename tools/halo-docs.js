'use strict';

const cheerio = require('cheerio');
const { renderContent, selectContent } = require('./halo-content');
const API = '/apis/api.minidocs.halo.run/v1alpha1/knowledgebases';
const epoch = '1970-01-01T00:00:00.000Z';

function identity(item) {
  if (!item || typeof item.metadata?.name !== 'string' || !item.metadata.name.trim() ||
      !item.spec || typeof item.spec !== 'object' || /[\x00-\x1f]/.test(item.metadata.name) ||
      encodeURIComponent(item.metadata.name).length > 220) throw new Error('无效的知识库资源');
}

function segment(value) {
  if (typeof value !== 'string' || !value || value !== value.trim() || /[. ]$/.test(value) ||
      value === '.' || value === '..' || /[<>:"/\\|?*%\x00-\x1f\x7f]/.test(value) ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) {
    throw new Error(`不支持的知识库路径: ${value}`);
  }
  return encodeURIComponent(value);
}

const bookPath = book => `/docs/view/${segment(book.spec.slug)}`;
const documentPath = (book, doc) => `/docs/${segment(book.spec.slug)}/${segment(doc.spec.slug)}`;
const folded = value => decodeURIComponent(value).normalize('NFC').toLowerCase();
const compare = (a, b) => (a.spec.priority ?? 0) - (b.spec.priority ?? 0) ||
  (a.metadata.name > b.metadata.name ? 1 : a.metadata.name < b.metadata.name ? -1 : 0);

function timestamps(item) {
  const spec = item.spec;
  const date = spec.publishTime || spec.creationTime || item.metadata.creationTimestamp || epoch;
  return [new Date(date).toISOString(), new Date(spec.updateTime || date).toISOString()];
}

function treeFor(book) {
  const nodes = new Map(book.documents.map(doc => [doc.metadata.name, { doc, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node.doc.spec.parentName);
    (parent ? parent.children : roots).push(node);
  }
  const ordered = [];
  const visited = new Set();
  function walk(nodes) {
    nodes.sort((a, b) => compare(a.doc, b.doc));
    for (const node of nodes) {
      if (visited.has(node.doc.metadata.name)) throw new Error('文档父子关系循环');
      visited.add(node.doc.metadata.name);
      ordered.push(node.doc);
      walk(node.children);
    }
  }
  walk(roots);
  if (ordered.length !== nodes.size) throw new Error('文档父子关系循环');
  return { roots, ordered, nodes };
}

function docRoutes(books) {
  if (!Array.isArray(books)) throw new Error('无效的知识库列表');
  const routes = new Map([['/docs', '/docs/']]);
  const ids = new Set();
  const paths = new Set(['/docs']);
  function resource(item, title) {
    identity(item);
    const id = item.metadata.name.normalize('NFC').toLowerCase();
    if (ids.has(id)) throw new Error('知识库资源 ID 冲突');
    ids.add(id);
    if (typeof title !== 'string' || !title.trim()) throw new Error('知识库标题缺失');
    if (item.spec.priority != null && !Number.isFinite(item.spec.priority)) throw new Error('知识库排序无效');
    timestamps(item);
  }
  function route(key, target, canonical = false) {
    const path = folded(key);
    if (canonical && paths.has(path)) throw new Error('知识库路径冲突');
    if (canonical) paths.add(path);
    if (routes.has(key) && routes.get(key) !== target) throw new Error('知识库路径别名冲突');
    routes.set(key, target);
  }
  for (const book of books) {
    resource(book, book.spec?.displayName);
    if (!Array.isArray(book.documents)) throw new Error('知识库文档列表缺失');
    route(bookPath(book), `${bookPath(book)}/`, true);
    for (const doc of book.documents) {
      resource(doc, doc.spec?.title);
      const spec = doc.spec;
      if (spec.knowledgeBaseName !== book.metadata.name ||
          (spec.parentName != null && typeof spec.parentName !== 'string')) throw new Error('文档所属知识库或父文档无效');
      if ((spec.content != null && typeof spec.content !== 'string') ||
          (spec.raw != null && typeof spec.raw !== 'string') ||
          (typeof spec.content !== 'string' && typeof spec.raw !== 'string')) throw new Error('文档正文格式无效');
      const target = `${documentPath(book, doc)}/`;
      // This directory would conflict with the /docs/index.html landing page.
      if (book.spec.slug.toLowerCase() === 'index.html') throw new Error('知识库路径冲突');
      route(documentPath(book, doc), target, true);
      for (const alias of [doc.spec.slug, doc.metadata.name]) {
        route(`${bookPath(book)}?docSlug=${encodeURIComponent(alias)}`, target);
      }
    }
    treeFor(book);
  }
  return routes;
}

async function loadDocs(fetchAll) {
  let items;
  try {
    items = await fetchAll(API);
  } catch (error) {
    if (error.status === 404) return { available: false, books: [] };
    throw error;
  }
  if (!Array.isArray(items)) throw new Error('无效的知识库列表');
  const books = [];
  for (const book of items) {
    identity(book);
    if (book.metadata.deletionTimestamp || book.spec.publicVisible !== true) continue;
    const documents = await fetchAll(`${API}/${segment(book.spec.slug)}/docs`);
    if (!Array.isArray(documents)) throw new Error('无效的知识库文档列表');
    documents.forEach(identity);
    books.push({ ...book, documents: documents.filter(doc =>
      !doc.metadata.deletionTimestamp && doc.spec.phase === 'published') });
  }
  docRoutes(books);
  return { available: true, books: books.sort(compare) };
}

function renderDocPages(books, { baseUrl, postLinks }) {
  docRoutes(books);
  const pages = new Map();
  const $ = cheerio.load('', {}, false);
  const link = (title, href) => $('<a></a>').text(title).attr('href', href);
  function documentLink(book, doc) {
    return link(doc.spec.title, `${documentPath(book, doc)}/`)
      .attr('data-halo-doc-slug', doc.spec.slug).attr('data-halo-doc-id', doc.metadata.name);
  }
  function navigation(book, roots) {
    function list(nodes) {
      const ul = $('<ul></ul>');
      for (const node of nodes) {
        const li = $('<li></li>').append(documentLink(book, node.doc));
        if (node.children.length) li.append(list(node.children));
        ul.append(li);
      }
      return ul;
    }
    return $('<nav class="halo-docs-nav" aria-label="知识库目录"></nav>').append(list(roots));
  }
  function page(filename, title, url, dates, content, indexing = true) {
    // Page permalinks are filesystem paths: Hexo encodes the public URL itself.
    const metadata = { title: $('<span></span>').text(title).html(), layout: 'page', disableNunjucks: true, comments: false, breadcrumb: false,
      permalink: decodeURIComponent(url.slice(1)), date: dates[0], updated: dates[1], indexing };
    pages.set(filename, '---\n' + Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n') +
      '\n---\n\n' + content.replaceAll('`', '&#96;').replaceAll('~', '&#126;') + '\n');
  }
  const index = $('<div class="halo-docs-index"></div>');
  const allDates = books.flatMap(book => [book, ...book.documents]).map(timestamps);
  const indexDates = [allDates.map(d => d[0]).sort()[0] || epoch,
    allDates.map(d => d[1]).sort().at(-1) || epoch];
  const list = $('<ul></ul>');
  for (const book of [...books].sort(compare)) {
    list.append($('<li></li>').append(link(book.spec.displayName, `${bookPath(book)}/`))
      .append($('<span></span>').text(`（${book.documents.length} 篇）`)));
    const { roots, ordered, nodes } = treeFor(book);
    const landing = $('<div></div>').append(link('知识库', '/docs/'));
    if (book.spec.description) landing.append($('<p></p>').text(book.spec.description));
    landing.append(navigation(book, roots));
    if (!ordered.length) landing.append($('<p></p>').text('暂无公开文档。'));
    page(`kb-${encodeURIComponent(book.metadata.name)}.html`, book.spec.displayName,
      `${bookPath(book)}/`, timestamps(book), landing.html(), false);
    for (const [i, doc] of ordered.entries()) {
      const container = $('<div></div>');
      const crumbs = $('<nav class="halo-docs-breadcrumb" aria-label="当前位置"></nav>')
        .append(link('知识库', '/docs/')).append(' / ').append(link(book.spec.displayName, `${bookPath(book)}/`));
      const ancestors = [];
      let parent = nodes.get(doc.spec.parentName);
      while (parent) { ancestors.unshift(parent.doc); parent = nodes.get(parent.doc.spec.parentName); }
      for (const ancestor of ancestors) crumbs.append(' / ').append(documentLink(book, ancestor));
      crumbs.append(' / ').append($('<span></span>').text(doc.spec.title));
      container.append(crumbs).append($('<details class="halo-docs-directory"></details>')
        .append($('<summary></summary>').text('本知识库目录')).append(navigation(book, roots)));
      const spec = doc.spec;
      const html = spec.content?.trim() || spec.raw?.trim()
        ? selectContent({ content: spec.content, raw: spec.raw, rawType: 'markdown' }) : '';
      const rendered = renderContent(html, { baseUrl,
        permalink: `${bookPath(book)}?docSlug=${encodeURIComponent(spec.slug)}`, postLinks });
      const body = cheerio.load(rendered, {}, false);
      if (!body.root().text().trim() && !body('img,video,audio,iframe,table,pre,hr').length) {
        body('.halo-content').append($('<p></p>').text('暂无正文。'));
      }
      container.append(body.html());
      const adjacent = $('<nav class="halo-docs-adjacent" aria-label="前后文档"></nav>');
      if (ordered[i - 1]) adjacent.append(link(`上一篇：${ordered[i - 1].spec.title}`, `${documentPath(book, ordered[i - 1])}/`));
      if (ordered[i + 1]) adjacent.append(' ').append(link(`下一篇：${ordered[i + 1].spec.title}`, `${documentPath(book, ordered[i + 1])}/`));
      container.append(adjacent);
      page(`doc-${encodeURIComponent(doc.metadata.name)}.html`, doc.spec.title,
        `${documentPath(book, doc)}/`, timestamps(doc), container.html());
    }
  }
  index.append(list);
  if (!books.length) index.append($('<p></p>').text('暂无公开知识库。'));
  page('index.html', '知识库', '/docs/', indexDates, index.html(), false);
  return pages;
}

module.exports = { loadDocs, docRoutes, renderDocPages };
