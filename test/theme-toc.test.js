'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('theme TOC resolves literal and encoded IDs without breaking on missing or malformed fragments', () => {
  const ids = ['%E4%B8%AD', '中', '中文', '目录', '100%', 'a#b?c', 'broken%', 'piclist%2Brclone', '%E6%89%8B%E6%9C%BA%2F%E5%AE%89%E5%8D%93'];
  const targets = new Map(ids.map((id, index) => [id, { getBoundingClientRect: () => ({ top: index * 50 }) }]));
  const cases = [
    [null, null],
    ['', null],
    ['#', null],
    ['#missing%', null],
    ['#%E4%B8%AD', '%E4%B8%AD'],
    ['#%E4%B8%AD%E6%96%87', '中文'],
    ['#目录', '目录'],
    ['#100%25', '100%'],
    ['#a%23b%3Fc', 'a#b?c'],
    ['#broken%', 'broken%'],
    ['#piclist+rclone', 'piclist%2Brclone'],
    ['#%E6%89%8B%E6%9C%BA/%E5%AE%89%E5%8D%93', '%E6%89%8B%E6%9C%BA%2F%E5%AE%89%E5%8D%93'],
    ['#missing', null]
  ];
  const links = cases.map(([href]) => ({
    href,
    getAttribute: () => href,
    addEventListener(type, listener) {
      assert.equal(type, 'click');
      this.click = listener;
    }
  }));
  const scrolls = [];
  const historyUrls = [];
  const context = {
    HTMLElement: class {},
    NexT: {},
    document: {
      title: 'test',
      addEventListener() {},
      querySelectorAll: () => links,
      querySelector: () => null,
      getElementById: id => targets.get(id) || null
    },
    window: { scrollY: 20, scrollTo: (...args) => scrolls.push(args) },
    history: { pushState: (state, title, url) => historyUrls.push(url) }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../themes/next/source/js/utils.js'), 'utf8'), context);
  assert.doesNotThrow(() => context.NexT.utils.registerSidebarTOC());
  assert.equal(context.NexT.utils.sections.length, links.length);
  cases.forEach(([href, id], index) => {
    const target = targets.get(id) || null;
    assert.equal(context.NexT.utils.sections[index], target, href);
    if (!target) {
      assert.equal(links[index].click, undefined);
      return;
    }
    let prevented = false;
    links[index].click({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(scrolls.pop(), [0, target.getBoundingClientRect().top + 20]);
    assert.equal(historyUrls.pop(), href);
  });
});
