'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cheerio = require('cheerio');
const frontMatter = require('hexo-front-matter');
const Hexo = require('hexo');
const { loadDocs, docRoutes, renderDocPages } = require('../tools/halo-docs');
const API = '/apis/api.minidocs.halo.run/v1alpha1/knowledgebases';
const date = '2026-01-02T03:04:05Z';
const book = (id = 'book', slug = 'docker bug') => ({
  metadata: { name: id, creationTimestamp: date },
  spec: { slug, displayName: '<img onerror=alert(1)>', description: '<script>unsafe</script>', publicVisible: true, creationTime: date }
});
const doc = (id, slug, parentName, priority = 1) => ({
  metadata: { name: id, creationTimestamp: date },
  spec: { knowledgeBaseName: 'book', slug, title: id, parentName, priority, phase: 'published',
    content: '<p>正文</p>', raw: '', publishTime: date, updateTime: date }
});
const opts = { baseUrl: 'https://example.com', postLinks: new Map() };

test('public docs loading filters visibility and only tolerates the initial 404', async () => {
  const calls = [];
  const kb = book();
  const docs = [doc('published', '文档'), { ...doc('deleted', 'deleted'), metadata: { name: 'deleted', deletionTimestamp: date } },
    { ...doc('draft', 'draft'), spec: { ...doc('draft', 'draft').spec, phase: 'draft' } }];
  const result = await loadDocs(async endpoint => {
    calls.push(endpoint);
    if (endpoint === API) return [kb, { ...book('private'), spec: { ...kb.spec, publicVisible: false } },
      { ...book('deleted-book'), metadata: { name: 'deleted-book', deletionTimestamp: date } }];
    return docs;
  });
  assert.equal(result.available, true);
  assert.deepEqual(result.books[0].documents.map(item => item.metadata.name), ['published']);
  assert.deepEqual(calls, [API, API + '/docker%20bug/docs']);
  assert.equal(kb.documents, undefined);
  assert.deepEqual(await loadDocs(async () => { throw { status: 404 }; }), { available: false, books: [] });
  for (const status of [403, 500]) await assert.rejects(loadDocs(async () => { throw { status }; }));
  await assert.rejects(loadDocs(async endpoint => {
    if (endpoint === API) return [book()];
    throw { status: 404 };
  }));
});

test('routes and generated navigation preserve hierarchy, empty pages, encoded slugs and safe HTML', () => {
  const root = doc('root', '目录', undefined, 2);
  root.spec.content = '<div></div>';
  const child = doc('child', 'jm _image', 'root');
  child.spec.title = 'Child <script>alert(1)</script>';
  const code = '\ttext\n```html\n<img onerror=alert(1)>\n```\n';
  const escaped = cheerio.load('<code></code>', {}, false)('code').text(code).html();
  child.spec.content = `<h2 id="%E6%A0%87%E9%A2%98">标题</h2><pre><code>${escaped}</code></pre><a href="../app/Consts/Hook.php">source</a><script>alert(1)</script>`;
  const orphan = doc('orphan', 'Orphan', 'unpublished-parent', 1);
  const books = [{ ...book(), documents: [child, root, orphan] }];
  const routes = docRoutes(books);
  const canonical = '/docs/docker%20bug/jm%20_image/';
  assert.equal(routes.get('/docs'), '/docs/');
  assert.equal(routes.get('/docs/view/docker%20bug?docSlug=jm%20_image'), canonical);
  assert.equal(routes.get('/docs/view/docker%20bug?docSlug=child'), canonical);
  assert.equal(routes.get(canonical.slice(0, -1)), canonical);
  const pages = renderDocPages(books, { ...opts, postLinks: routes });
  assert.deepEqual([...pages.keys()].sort(), ['doc-child.html', 'doc-orphan.html', 'doc-root.html', 'index.html', 'kb-book.html']);
  const parsed = frontMatter.parse(pages.get('doc-child.html'));
  const $ = cheerio.load(parsed._content);
  assert.equal(parsed.permalink, 'docs/docker bug/jm _image/');
  assert.equal(parsed.title, 'Child &lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(parsed.disableNunjucks, true);
  assert.equal(parsed.comments, false);
  assert.equal(parsed.breadcrumb, false);
  assert.equal(parsed.indexing, true);
  assert.equal(parsed.title, 'Child &lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal($('script,[onerror]').length, 0);
  assert.equal($('.code code').text(), code);
  assert.equal($('h2').attr('id'), '%E6%A0%87%E9%A2%98');
  assert.equal($('a').filter((_, el) => $(el).text() === 'source').attr('href'), 'https://example.com/docs/app/Consts/Hook.php');
  assert.equal($('.halo-docs-nav li li a').attr('data-halo-doc-id'), 'child');
  assert.equal($('.halo-docs-nav li li a').attr('data-halo-doc-slug'), 'jm _image');
  assert.ok($('.halo-docs-breadcrumb').text().includes('root'));
  const kb = cheerio.load(frontMatter.parse(pages.get('kb-book.html'))._content);
  assert.deepEqual(kb('.halo-docs-nav a').map((_, el) => kb(el).attr('data-halo-doc-id')).get(), ['orphan', 'root', 'child']);
  assert.match(pages.get('doc-root.html'), /暂无正文/);
  assert.equal(frontMatter.parse(pages.get('index.html')).indexing, false);
  assert.equal(frontMatter.parse(pages.get('kb-book.html')).indexing, false);
  assert.deepEqual(renderDocPages(books, opts), pages);
});

test('Docs suppress only NexT filesystem breadcrumbs, retaining normal page behavior', () => {
  const template = fs.readFileSync(path.join(__dirname, '../themes/next/layout/_partials/page/breadcrumb.njk'), 'utf8');
  const nunjucks = require('nunjucks');
  const data = { page: { path: 'docs/view/book/index.html', breadcrumb: false }, theme: { menu_map: new Map() }, url_for: value => value, __: value => value };
  assert.equal(nunjucks.renderString(template, data).trim(), '');
  delete data.page.breadcrumb;
  assert.match(nunjucks.renderString(template, data), /href="\/docs\/view\/"/);
});

test('invalid identities, body shapes, paths, cycles and aliases fail before output', async () => {
  const valid = () => [{ ...book(), documents: [doc('one', 'one')] }];
  for (const slug of ['.', '..', 'a/b', 'a\\b', 'a\0b', 'a:b', 'a?b', 'a|b', 'a*b', 'CON', 'a.', 'a ', '%2e%2e']) {
    const books = valid(); books[0].documents[0].spec.slug = slug;
    assert.throws(() => docRoutes(books), /路径/);
  }
  const malformed = valid(); malformed[0].documents[0].spec.content = {};
  assert.throws(() => docRoutes(malformed), /正文/);
  delete malformed[0].documents[0].spec.content; delete malformed[0].documents[0].spec.raw;
  assert.throws(() => docRoutes(malformed), /正文/);
  const collision = valid(); collision[0].documents.push(doc('two', 'ONE'));
  assert.throws(() => docRoutes(collision), /路径冲突/);
  const alias = valid(); alias[0].documents.push(doc('two', 'one-id')); alias[0].documents[0].metadata.name = 'one-id';
  assert.throws(() => docRoutes(alias), /别名冲突/);
  const duplicate = valid(); duplicate[0].documents[0].metadata.name = 'book';
  assert.throws(() => docRoutes(duplicate), /ID 冲突/);
  const cycle = valid(); cycle[0].documents[0].spec.parentName = 'one';
  assert.throws(() => docRoutes(cycle), /循环/);
  const missing = valid(); missing[0].metadata.name = '';
  assert.throws(() => docRoutes(missing), /无效/);
  await assert.rejects(loadDocs(async () => ({})), /列表/);
});

test('real Hexo pages produce decoded filesystem routes and encoded public URLs', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'halo-docs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const books = [{ ...book(), documents: [doc('one', '问题')] }];
  const pages = renderDocPages(books, opts);
  const directory = path.join(root, 'source/docs');
  fs.mkdirSync(directory, { recursive: true });
  for (const [filename, content] of pages) fs.writeFileSync(path.join(directory, filename), content);
  const hexo = new Hexo(root, { silent: true });
  await hexo.init();
  t.after(() => hexo.exit());
  hexo.config.url = opts.baseUrl;
  await hexo.source.process();
  const page = hexo.model('Page').findOne({ source: 'docs/doc-one.html' });
  assert.equal(page.path, 'docs/docker bug/问题/index.html');
  assert.equal(page.permalink, 'https://example.com/docs/docker%20bug/%E9%97%AE%E9%A2%98/index.html');
  assert.equal(page.date.toISOString(), '2026-01-02T03:04:05.000Z');
  assert.equal(page.updated.toISOString(), '2026-01-02T03:04:05.000Z');
  const generated = hexo.extend.generator.get('page').call(hexo, { pages: hexo.model('Page').find({}) });
  assert.ok((await generated).some(item => item.path === page.path));
});
