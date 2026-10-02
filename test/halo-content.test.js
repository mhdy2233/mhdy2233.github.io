'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const cheerio = require('cheerio');
const { selectContent, renderContent, postPath, stripCodeTools } = require('../tools/halo-content');
const { escapeHTML } = require('hexo-util');
const { resolveContent, fetchAll, frontMatter, httpGet } = require('../tools/sync-halo');
const opts = {
  baseUrl: 'https://blog.example.com',
  permalink: '/archives/hello',
  postLinks: new Map([['/archives/other', '/archives/other/']])
};
const render = html => cheerio.load(renderContent(html, opts));

test('published HTML wins over editor JSON and Markdown raw', () => {
  assert.equal(selectContent({ content: '<p>published</p>', raw: '{"draft":true}', rawType: 'json' }), '<p>published</p>');
});
test('Markdown fallback renders headings, tables, code and strikethrough', () => {
  const html = selectContent({ raw: '# Heading\n\n~~old~~\n\n|a|b|\n|-|-|\n|1|2|\n\n```js\nconst x = 1;\n```', rawType: 'markdown' });
  assert.match(html, /<h1 id="Heading">Heading/);
  assert.match(html, /<table>/);
  assert.match(html, /<s>old/);
  assert.match(html, /language-js/);
});
test('HTML fallback is not wrapped in Markdown code', () => {
  assert.equal(selectContent({ raw: '<p>正文</p>', rawType: 'html' }), '<p>正文</p>');
  assert.equal(selectContent({ raw: '<p>正文</p>' }), '<p>正文</p>');
});

test('Markdown headings use the existing Hexo anchor rules and reset for each post', () => {
  const raw = '## 中文标题\n\n## 中文标题\n\n[text](#中文标题)';
  for (let i = 0; i < 2; i++) {
    const $ = render(selectContent({ raw, rawType: 'markdown' }));
    assert.deepEqual($('h2').map((_, el) => $(el).attr('id')).get(), ['中文标题', '中文标题-2']);
    assert.equal(decodeURIComponent($('a').attr('href').slice(1)), $('h2').first().attr('id'));
  }
});
test('missing, empty and unknown raw types fail closed', () => {
  for (const wrapper of [undefined, {}, { raw: '' }, { raw: '{}', rawType: 'json' }]) {
    assert.throws(() => selectContent(wrapper));
  }
});
test('no PAT means only an anonymous public detail request', async () => {
  const calls = [];
  const html = await resolveContent('a/b', { token: '', fetch: async (...args) => {
    calls.push(args);
    return { content: { content: '<p>public</p>' } };
  } });
  assert.equal(html, '<p>public</p>');
  assert.deepEqual(calls, [['/apis/api.content.halo.run/v1alpha1/posts', 'a%2Fb', { auth: false }]]);
});
test('console published content with PAT', async () => {
  await resolveContent('post', { token: 'fixture', fetch: async (path, suffix) => {
    assert.match(path, /console/);
    assert.equal(suffix, 'post/release-content');
    return { content: '<p>published</p>' };
  } });
});
test('401, 403 and login redirect fall back anonymously; server failures do not', async () => {
  for (const status of [302, 401, 403, 500]) {
    let count = 0;
    const promise = resolveContent('post', { token: 'fixture', fetch: async (path, suffix, options) => {
      if (++count === 1) throw Object.assign(new Error('failed'), { status });
      assert.equal(options.auth, false);
      return { content: { content: '<p>fallback</p>' } };
    } });
    if (status === 500) {
      await assert.rejects(promise);
      assert.equal(count, 1);
    } else {
      assert.equal(await promise, '<p>fallback</p>');
      assert.equal(count, 2);
    }
  }
});
test('pagination starts at 1 and respects hasNext for short pages', async () => {
  const pages = [];
  const list = await fetchAll('/posts', async (_, page) => {
    pages.push(page);
    return { items: [{ metadata: { name: `post-${page}` } }], hasNext: page < 3 };
  });
  assert.deepEqual(pages, [1, 2, 3]);
  assert.equal(list.length, 3);
});
test('pagination rejects duplicate or malformed results', async () => {
  await assert.rejects(fetchAll('/posts', async () => ({ items: [{ metadata: { name: 'same' } }], hasNext: true })));
  await assert.rejects(fetchAll('/posts', async () => ({})));
});
test('cards become native links with custom titles and no nested anchors', () => {
  const $ = render('<hyperlink-card href="/archives/other#part" custom-title="标题"><a href="/wrong">wrong</a></hyperlink-card><hyperlink-inline-card href="https://example.com">inline</hyperlink-inline-card>');
  assert.equal($('hyperlink-card').length, 0);
  assert.equal($('.halo-link-card').attr('href'), '/archives/other/#part');
  assert.equal($('.halo-link-card').text(), '标题');
  assert.equal($('.halo-link-card a').length, 0);
  assert.match($('.halo-inline-card').attr('rel'), /noopener/);
});
test('media, relative links, srcset and lazy images are normalized', () => {
  const $ = render('<img src="/placeholder.gif" srcset="/placeholder.gif 1x" data-src="/upload/a.png" data-srcset="/upload/a.png 1x, //cdn.example.com/b.png 2x"><video src="../v.mp4" poster="/p.png" autoplay></video><audio src="/a.mp3"></audio><a href="#local">local</a><a href="/docs/topic">docs</a>');
  assert.equal($('img').attr('src'), 'https://blog.example.com/upload/a.png');
  assert.equal($('img').attr('srcset'), 'https://blog.example.com/upload/a.png 1x, https://cdn.example.com/b.png 2x');
  assert.equal($('video').attr('src'), 'https://blog.example.com/v.mp4');
  assert.equal($('video').attr('poster'), 'https://blog.example.com/p.png');
  assert.equal($('video').attr('autoplay'), undefined);
  assert.equal($('audio').attr('controls'), 'controls');
  assert.equal($('a').first().attr('href'), '#local');
  assert.equal($('a').last().attr('href'), 'https://blog.example.com/docs/topic');
});
test('code, table, formatting, checklist and collapsed code survive', () => {
  const $ = render('<pre collapsed="true"><code>{{ literal }} &lt;b&gt;</code></pre><table><tr><td colspan="2">cell</td></tr></table><p style="color: #60a5fa; text-align: center; position: fixed"><strong>bold</strong><del>old</del></p><input type="checkbox" checked>');
  assert.equal($('details summary .halo-code-expand').text(), '展开代码');
  assert.equal($('details').attr('open'), undefined);
  assert.equal($('details code').text(), '{{ literal }} <b>');
  assert.equal($('td').attr('colspan'), '2');
  assert.match($('p').attr('style'), /color:#60a5fa/);
  assert.doesNotMatch($('p').attr('style'), /position/);
  assert.equal($('input').attr('disabled'), 'disabled');
});

test('code languages support explicit aliases, auto detection and safe plaintext fallback', () => {
  const $ = render('<pre data-language="js"><code>const answer = 42;</code></pre>' +
    '<pre><code>{"answer": 42, "enabled": true}</code></pre>' +
    '<pre language="not-a-language"><code>const answer = 42;</code></pre>');
  const blocks = $('.halo-code-details');
  assert.equal(blocks.eq(0).find('.halo-code-language').text(), 'JavaScript');
  assert.doesNotMatch(blocks.eq(0).find('summary').text(), /自动/);
  assert.ok(blocks.eq(0).find('.hljs-keyword').length);
  assert.match(blocks.eq(1).find('summary').text(), /自动/);
  assert.equal(blocks.eq(2).find('.halo-code-language').text(), 'TEXT');
  assert.equal(blocks.eq(2).find('code span').length, 0);
});

test('code keeps exact whitespace, IDs and literal HTML despite Hexo highlighter state', () => {
  const text = '    const x = 1;\n\t// <img src=x onerror=alert(1)> & {{ literal }}\n\n```html\n<tag>\n```\n~~~\n\n';
  const shared = require('highlight.js');
  shared.configure({ classPrefix: '' });
  try {
    const $ = render(`<pre id="example"><code id="source" class="language-js">${escapeHTML(text)}</code></pre>`);
    assert.equal($('.code code').text(), text);
    assert.equal($('details').attr('id'), 'example');
    assert.equal($('code').attr('id'), 'source');
    assert.ok($('.hljs-keyword').length);
    assert.equal($('img, script, [onerror]').length, 0);
    assert.equal($('.gutter').attr('aria-hidden'), 'true');
    assert.equal($('.code pre').attr('tabindex'), '0');
    assert.equal($('.halo-code-toolbar').text(), '');
  } finally {
    shared.configure({ classPrefix: 'hljs-' });
  }
});

test('code folds above 30 display lines, honors explicit folding and renders only once', () => {
  const thirty = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n') + '\n';
  const thirtyOne = thirty + 'line 30\n';
  const html = renderContent(`<pre><code>${thirty}</code></pre><pre><code>${thirtyOne}</code></pre>` +
    `<pre collapsed="true"><code>short</code></pre><pre collapsed="false"><code>${thirtyOne}</code></pre><pre><code></code></pre>`, opts);
  const $ = cheerio.load(html);
  const blocks = $('.halo-code-details');
  assert.deepEqual(blocks.map((_, el) => $(el).attr('open') !== undefined).get(), [true, false, false, true, true]);
  assert.equal(blocks.eq(0).find('.gutter pre').text().split('\n').length, 30);
  assert.equal(blocks.eq(1).find('.gutter pre').text().split('\n').length, 31);
  assert.equal(blocks.eq(4).find('code').text(), '');
  assert.equal(renderContent(html, opts), html);
});

test('code display controls never enter automatic excerpts or searchable code', () => {
  const text = '    const answer = 42;\n\n';
  const html = renderContent(`<pre data-language="js"><code>${text}</code></pre>`, opts);
  const clean = cheerio.load(stripCodeTools(html));
  assert.equal(clean('pre code').text(), text);
  assert.equal(clean('summary, .gutter, .halo-code-toolbar').length, 0);
  const post = { metadata: { name: 'code' }, spec: { title: 'Code', slug: 'code' } };
  const fm = frontMatter(post, {}, {}, html);
  assert.ok(fm.includes('description: "const answer = 42;"'));
});
test('scripts, events, unsafe URLs and embedded documents are stripped', () => {
  const $ = render('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><iframe src="https://example.com/embed" srcdoc="<script>alert(1)</script>" onload="alert(1)"></iframe>');
  assert.equal($('script, [onerror], [onload], [srcdoc]').length, 0);
  assert.equal($('a').attr('href'), undefined);
  assert.equal($('iframe').attr('sandbox'), 'allow-scripts allow-presentation');
});
test('permalink and YAML strings preserve slugs, numeric titles and timestamps', () => {
  const post = { metadata: { name: '../id' }, spec: { title: 'true', slug: 'hello', publishTime: '2026-01-01T00:00:00.000Z', tags: ['n'] }, status: { permalink: '/archives/hello', lastModifyTime: '2026-02-01T00:00:00Z' } };
  assert.equal(postPath(post), '/archives/hello/');
  const fm = frontMatter(post, {}, { n: '123' }, '<p>body</p>');
  assert.match(fm, /title: "true"/);
  assert.match(fm, /- "123"/);
  assert.match(fm, /date: 2026-01-01T00:00:00.000Z/);
  assert.match(fm, /updated: 2026-02-01T00:00:00.000Z/);
  assert.match(fm, /disableNunjucks: true/);
  const text = 'Use `code` and ~/dir &amp; &lt;img src=x onerror=alert(1)&gt;';
  const html = renderContent('<p>Use `code` and ~/dir &amp; &lt;img src=x onerror=alert(1)&gt;</p>', opts);
  assert.ok(frontMatter(post, {}, {}, html).includes(`description: ${JSON.stringify(text)}`));
});
test('UTF-8 survives a response split inside a Chinese character', async t => {
  const body = Buffer.from('原神');
  const server = http.createServer((req, res) => {
    res.write(body.subarray(0, 2));
    setTimeout(() => res.end(body.subarray(2)), 5);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  assert.equal((await httpGet(`http://127.0.0.1:${server.address().port}`, { auth: false })).body, '原神');
});
