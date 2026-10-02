'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const cheerio = require('cheerio');
const { selectContent, renderContent, postPath } = require('../tools/halo-content');
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
  assert.match(html, /<h1>Heading/);
  assert.match(html, /<table>/);
  assert.match(html, /<s>old/);
  assert.match(html, /language-js/);
});
test('HTML fallback is not wrapped in Markdown code', () => {
  assert.equal(selectContent({ raw: '<p>正文</p>', rawType: 'html' }), '<p>正文</p>');
  assert.equal(selectContent({ raw: '<p>正文</p>' }), '<p>正文</p>');
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
  const $ = render('<img data-src="/upload/a.png" data-srcset="/upload/a.png 1x, //cdn.example.com/b.png 2x"><video src="../v.mp4" poster="/p.png" autoplay></video><audio src="/a.mp3"></audio><a href="#local">local</a><a href="/docs/topic">docs</a>');
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
  assert.equal($('details summary').text(), '展开代码');
  assert.equal($('details code').text(), '{{ literal }} <b>');
  assert.equal($('td').attr('colspan'), '2');
  assert.match($('p').attr('style'), /color:#60a5fa/);
  assert.doesNotMatch($('p').attr('style'), /position/);
  assert.equal($('input').attr('disabled'), 'disabled');
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
