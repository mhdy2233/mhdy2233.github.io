'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Hexo = require('hexo');

test('sitemap is stable across insertion orders and preserves plugin entries and dates', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'halo-sitemap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const hexo = new Hexo(root, { silent: true });
  await hexo.init();
  t.after(() => hexo.exit());
  hexo.config.url = 'https://example.com';
  await hexo.loadPlugin(require.resolve('hexo-generator-sitemap'));
  const original = hexo.extend.generator.get('sitemap');
  await hexo.loadPlugin(path.join(__dirname, '../scripts/deterministic-taxonomy.js'));
  const generate = hexo.extend.generator.get('sitemap');
  const fixtures = Object.fromEntries(['posts', 'pages', 'tags', 'categories'].map(type => [type,
    ['z', 'a'].map(name => ({
      permalink: `https://example.com/${type}/${name}/`,
      source: `${name}.html`, updated: new Date('2026-01-02T03:04:05Z')
    }))
  ]));
  fixtures.posts.push({ permalink: 'https://example.com/hidden/', source: 'hidden.html', sitemap: false });
  const models = { posts: 'Post', pages: 'Page', tags: 'Tag', categories: 'Category' };
  const locals = reverse => Object.fromEntries(Object.entries(fixtures).map(([type, items]) => [type,
    new (hexo.model(models[type]).Query)(reverse ? items.slice().reverse() : items.slice())
  ]));
  const before = locals(false);
  const baseline = await original.call(hexo, before);
  const forward = await generate.call(hexo, before);
  const backward = await generate.call(hexo, locals(true));
  assert.deepEqual(forward, backward);
  assert.equal(before.tags.first().permalink, fixtures.tags[0].permalink);
  const entries = data => (data.match(/<url>[\s\S]*?<\/url>/g) || []).sort();
  assert.deepEqual(entries(forward[0].data), entries(baseline[0].data));
  assert.equal(entries(forward[0].data).length, 9);
  assert.match(forward[0].data, /<lastmod>2026-01-02<\/lastmod>/);
  assert.doesNotMatch(forward[0].data, /\/hidden\//);
  assert.deepEqual(forward[1].data.trim().split(/\s+/).sort(), baseline[1].data.trim().split(/\s+/).sort());
});
