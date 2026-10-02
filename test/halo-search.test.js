'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cheerio = require('cheerio');
const Hexo = require('hexo');

test('search removes code tools without changing posts, metadata, order or content:false', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'halo-search-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const hexo = new Hexo(root, { silent: true });
  await hexo.init();
  t.after(() => hexo.exit());
  await hexo.loadPlugin(path.join(__dirname, '../scripts/halo-content-style.js'));
  assert.equal(hexo.extend.generator.get('json'), undefined);
  hexo.config.search = { path: 'search.json', field: 'post', content: true };
  await hexo.loadPlugin(require.resolve('hexo-generator-search'));
  const original = hexo.extend.generator.get('json');
  await hexo.loadPlugin(path.join(__dirname, '../scripts/halo-content-style.js'));
  const generate = hexo.extend.generator.get('json');
  const code = '  const x = "<tag>";\n\tconsole.log(x);\n\n';
  const escaped = cheerio.load('<code></code>', {}, false)('code').text(code).html();
  const html = `<nav class="halo-docs-breadcrumb">其它文档标题</nav><details class="halo-docs-directory"><summary>目录</summary>其它文档标题</details><nav class="halo-docs-adjacent">上一篇标题</nav><p>文章内容</p><details class="halo-code-details"><summary>JS 自动 3 行</summary><figure class="highlight javascript"><div class="halo-code-toolbar">复制</div><div class="halo-code-body"><div class="gutter" aria-hidden="true"><pre>1\n2\n3</pre></div><div class="code"><pre><code>${escaped}</code></pre></div></div></figure></details>`;
  const posts = [1, 2].map(day => ({
    title: `Post ${day}`, path: `archives/post-${day}/`, date: new Date(`2026-01-0${day}`),
    _content: html, tags: [{ name: 'tag' }], categories: [{ name: 'category' }]
  }));
  const locals = { posts: new (hexo.model('Post').Query)(posts) };
  const baseline = await original.call(hexo, locals);
  const result = await generate.call(hexo, locals);
  assert.equal(result.path, baseline.path);
  const entries = JSON.parse(result.data);
  const metadata = data => JSON.parse(data).map(({ content, ...entry }) => entry);
  assert.deepEqual(metadata(result.data), metadata(baseline.data));
  assert.deepEqual(entries.map(entry => entry.title), ['Post 2', 'Post 1']);
  for (const entry of entries) {
    const $ = cheerio.load(entry.content);
    assert.equal($('code').text(), code);
    assert.equal($('p').text(), '文章内容');
    assert.equal($('details, summary, .gutter, .halo-code-toolbar').length, 0);
    assert.doesNotMatch($.root().text(), /其它文档标题|上一篇标题/);
  }
  assert.ok(posts.every(post => post._content === html));
  hexo.config.search.content = false;
  assert.deepEqual(await generate.call(hexo, locals), await original.call(hexo, locals));
  assert.ok(JSON.parse((await generate.call(hexo, locals)).data).every(entry => !Object.hasOwn(entry, 'content')));
  hexo.config.search = { ...hexo.config.search, field: 'all', content: true };
  locals.pages = new (hexo.model('Page').Query)([
    { title: 'Document', path: 'docs/book/page/index.html', permalink: 'https://example.com/docs/book/page/', _content: html },
    { title: 'Earlier', path: 'docs/book/earlier/index.html', permalink: 'https://example.com/docs/book/earlier/', _content: html },
    { title: 'Styles', path: 'css/halo-content.css', permalink: 'https://example.com/css/halo-content.css', _content: '.halo-docs-directory {}' },
    { title: 'Script', path: 'js/halo-docs.js', permalink: 'https://example.com/js/halo-docs.js', _content: 'const x = 1;' }
  ]);
  const indexed = await generate.call(hexo, locals);
  const all = JSON.parse(indexed.data);
  assert.deepEqual(all.map(entry => entry.title), ['Post 2', 'Post 1', 'Earlier', 'Document']);
  assert.doesNotMatch(all[2].content, /halo-docs-directory/);
  assert.equal(locals.pages.first().title, 'Document');
  locals.pages = new (hexo.model('Page').Query)(locals.pages.toArray().reverse());
  assert.deepEqual(await generate.call(hexo, locals), indexed);
});
