'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const Hexo = require('hexo');
const cheerio = require('cheerio');
const { frontMatter } = require('../tools/sync-halo');
const { selectContent, renderContent, normalizePostPath } = require('../tools/halo-content');
const run = promisify(execFile);

test('real Hexo HTML rendering preserves template syntax, code fences and heading anchors', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'halo-hexo-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const hexo = new Hexo(root, { silent: true });
  await hexo.init();
  hexo.extend.filter.register('post_permalink', normalizePostPath, 20);
  assert.equal(hexo.execFilterSync('post_permalink', { __permalink: 'archives/hello/' }, { context: hexo }), 'archives/hello/');
  t.after(() => hexo.exit());
  const code = 'Example:\n```html\n<tag> {{ code }}\n```\n~~~\ntext\n~~~';
  const html = selectContent({ raw: '## Heading\n\n````markdown\n' + code + '\n````', rawType: 'markdown' });
  const content = renderContent(html + '<p>{{ user }} {% unknown %}</p><a href="https://example.com/~user">link</a>', {
    baseUrl: 'https://example.com', permalink: '/archives/a'
  });
  const result = await hexo.post.render(path.join(root, 'a.html'), {
    content, disableNunjucks: true
  });
  assert.match(result.content, /\{\{ user \}\} \{% unknown %\}/);
  assert.match(result.content, /&lt;tag&gt; \{\{ code \}\}/);
  assert.match(result.content, /<h2 id="Heading">/);
  assert.doesNotMatch(result.content, /&lt;h2/);
  const $ = cheerio.load(result.content);
  assert.equal($('pre code').text().trim(), code);
  assert.equal($('pre figure').length, 0);
  assert.equal($('a').attr('href'), 'https://example.com/~user');
  const toc = cheerio.load(hexo.extend.helper.get('toc')(result.content));
  assert.equal(toc('a').attr('href'), '#Heading');
});

test('CLI stages every body before replacement and migrates old Markdown only after success', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'halo-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const toolsDir = path.join(root, 'tools');
  fs.mkdirSync(toolsDir);
  // Avoid Node 24's native Windows cpSync crash on mounted source volumes.
  for (const name of ['sync-halo.js', 'halo-content.js', 'halo-docs.js']) {
    fs.writeFileSync(path.join(toolsDir, name), fs.readFileSync(path.join(__dirname, '../tools', name)));
  }
  const postsDir = path.join(root, 'source/_posts');
  fs.mkdirSync(postsDir, { recursive: true });
  fs.writeFileSync(path.join(root, '_config.yml'), 'title: test\n');
  fs.writeFileSync(path.join(postsDir, 'old.md'), 'existing article');
  const docsDir = path.join(root, 'source/docs');
  fs.mkdirSync(docsDir);
  fs.writeFileSync(path.join(docsDir, 'doc-old.html'), 'existing document');
  const post = id => ({
    metadata: { name: id },
    spec: { title: id, slug: id, publish: true, visible: 'PUBLIC', publishTime: '2026-01-01T00:00:00Z' },
    status: { permalink: `/archives/${id}` }
  });
  let fail = true;
  let docsStatus = 200;
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (/\/knowledgebases$/.test(pathname)) {
      res.statusCode = docsStatus;
      return res.end(JSON.stringify(docsStatus === 200 ? { items: [], hasNext: false } : {}));
    }
    if (/\/posts$/.test(pathname)) return res.end(JSON.stringify({ items: [post('one'), post('two')], hasNext: false }));
    if (/\/(tags|categories)$/.test(pathname)) return res.end(JSON.stringify({ items: [], hasNext: false }));
    if (/\/posts\/one$/.test(pathname)) return res.end(JSON.stringify({ content: { content: '<p>one</p>' } }));
    if (/\/posts\/two$/.test(pathname)) return res.end(JSON.stringify({ content: { content: fail ? '' : '<p>two</p>' } }));
    res.statusCode = 404;
    res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const options = {
    env: { ...process.env, NODE_PATH: path.join(__dirname, '../node_modules'), HALO_BASE_URL: `http://127.0.0.1:${server.address().port}`, HALO_PAT: '' }
  };
  await assert.rejects(run(process.execPath, [path.join(root, 'tools/sync-halo.js')], options));
  assert.deepEqual(fs.readdirSync(postsDir), ['old.md']);
  assert.equal(fs.readFileSync(path.join(postsDir, 'old.md'), 'utf8'), 'existing article');
  assert.equal(fs.readFileSync(path.join(docsDir, 'doc-old.html'), 'utf8'), 'existing document');
  fail = false;
  for (const status of [404, 500]) {
    docsStatus = status;
    await assert.rejects(run(process.execPath, [path.join(root, 'tools/sync-halo.js')], options));
    assert.deepEqual(fs.readdirSync(postsDir), ['old.md']);
    assert.equal(fs.readFileSync(path.join(docsDir, 'doc-old.html'), 'utf8'), 'existing document');
  }
  docsStatus = 200;
  await run(process.execPath, [path.join(root, 'tools/sync-halo.js')], options);
  assert.deepEqual(fs.readdirSync(postsDir), ['one.html', 'two.html']);
  assert.deepEqual(fs.readdirSync(docsDir), ['index.html']);
  assert.equal(fs.readFileSync(path.join(postsDir, 'one.html'), 'utf8'), frontMatter(post('one'), {}, {}, renderContent('<p>one</p>', {
    baseUrl: options.env.HALO_BASE_URL, permalink: '/archives/one'
  })));
});
