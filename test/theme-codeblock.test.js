'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cheerio = require('cheerio');

const source = fs.readFileSync(path.join(__dirname, '../themes/next/source/js/utils.js'), 'utf8');

function page(html, clipboard, hljswrap = true) {
  const $ = cheerio.load(html, {}, false);
  const nodes = new WeakMap();
  function dom(node) {
    if (!node) return null;
    if (nodes.has(node)) return nodes.get(node);
    const el = $(node);
    const adapter = {
      node,
      listeners: {},
      querySelector: selector => dom(el.find(selector)[0]),
      querySelectorAll: selector => el.find(selector).toArray().map(dom),
      closest: selector => dom(el.closest(selector)[0]),
      addEventListener(type, callback) {
        (this.listeners[type] ||= []).push(callback);
      },
      insertAdjacentHTML(position, value) { el[position === 'beforeend' ? 'append' : 'prepend'](value); },
      insertAdjacentElement(position, value) { this.insertAdjacentHTML(position, value.node); },
      wrap(wrapper) { el.wrap(wrapper.node); },
      get className() { return el.attr('class') || ''; },
      set className(value) { el.attr('class', value); },
      get textContent() { return el.text(); },
      set textContent(value) { el.text(value); },
      get innerText() { return cheerio.load((el.html() || '').replace(/<br\s*\/?>/gi, '\n'), {}, false).text(); },
      set innerText(value) { el.text(value); },
      classList: {
        [Symbol.iterator]: () => (el.attr('class') || '').split(/\s+/).filter(Boolean)[Symbol.iterator](),
        forEach(callback) { [...this].forEach(callback); },
        contains: name => el.hasClass(name),
        add: name => el.addClass(name),
        replace: (oldName, newName) => el.removeClass(oldName).addClass(newName)
      }
    };
    nodes.set(node, adapter);
    return adapter;
  }
  const context = {
    HTMLElement: class {},
    NexT: {},
    CONFIG: { hljswrap, codeblock: { copy_button: { enable: true, style: 'flat' }, fold: { enable: false }, language: true } },
    navigator: { clipboard },
    window: { getComputedStyle: () => ({ height: '100px' }) },
    document: {
      addEventListener() {},
      querySelectorAll: selector => $(selector).toArray().map(dom),
      createElement: tag => dom($(`<${tag}></${tag}>`)[0])
    },
    setTimeout: callback => callback()
  };
  vm.runInNewContext(source, context);
  return { $, utils: context.NexT.utils, dom: selector => dom($(selector)[0]) };
}

test('Halo code registers one native copy button and preserves exact text, including empty code', async () => {
  for (const hljswrap of [true, false]) {
    for (const code of ['  <tag> 中文\t\n\n', '']) {
      const copied = [];
      const p = page('<article><details class="halo-code-details"><summary>语言与行数</summary><figure class="highlight html"><div class="halo-code-toolbar"></div><div class="halo-code-body"><div class="gutter"><pre>1\n2\n3</pre></div><div class="code"><pre><code><span class="hljs-keyword"></span></code></pre></div></div></figure></details></article>', { writeText: async text => copied.push(text) }, hljswrap);
      p.$('code span').text(code);
      p.utils.registerCodeblock();
      p.utils.registerCodeblock();
      p.utils.registerCodeblock(p.dom('article'));
      assert.equal(p.$('.halo-code-toolbar > button[type="button"].copy-btn').length, 1);
      assert.equal(p.$('.copy-btn-label[role="status"][aria-live="polite"]').length, 1);
      assert.equal(p.$('button i[aria-hidden="true"]').length, 1);
      assert.equal(p.$('.code-container, .code-lang, .fold-cover, .expand-btn').length, 0);
      assert.equal(p.$('code span').attr('class'), 'hljs-keyword');
      const button = p.dom('.copy-btn');
      assert.equal(button.listeners.click.length, 1);
      assert.equal(p.dom('figure').listeners.mouseleave.length, 1);
      // Enter and Space invoke the native button click; no custom key handler is needed.
      assert.equal(button.listeners.keydown, undefined);
      await button.listeners.click[0]();
      assert.deepEqual(copied, [code]);
      assert.equal(p.$('.copy-btn-label').text(), '已复制');
    }
  }
});

test('copy retains ordinary Hexo and explicit Mermaid text and reports clipboard failure', async () => {
  const copied = [];
  const p = page('<figure class="highlight js"><table><tr><td class="gutter"><pre>1\n2</pre></td><td class="code"><pre><span class="line"><span class="keyword">let</span> x = 1;</span><br><span class="line">next();</span></pre></td></tr></table></figure><div class="mermaid-box"></div>', { writeText: async text => copied.push(text) });
  p.utils.registerCodeblock();
  assert.equal(p.$('.code-lang').text(), 'JS');
  assert.equal(p.$('.code .hljs-keyword').length, 1);
  await p.dom('.copy-btn').listeners.click[0]();
  assert.deepEqual(copied, ['let x = 1;\nnext();']);
  p.utils.registerCopyButton(p.dom('.mermaid-box'), p.dom('.mermaid-box'), 'graph TD;\n A --> B\n');
  await p.dom('.mermaid-box button').listeners.click[0]();
  assert.equal(copied.at(-1), 'graph TD;\n A --> B\n');

  const empty = page('<div></div>', { writeText: async text => copied.push(text) });
  empty.utils.registerCopyButton(empty.dom('div'), empty.dom('div'), '');
  await empty.dom('button').listeners.click[0]();
  assert.equal(copied.at(-1), '');
  for (const clipboard of [undefined, { writeText: async () => { throw new Error('denied'); } }]) {
    const failed = page('<div></div>', clipboard);
    failed.utils.registerCopyButton(failed.dom('div'), failed.dom('div'), 'code');
    await assert.doesNotReject(failed.dom('button').listeners.click[0]());
    assert.equal(failed.$('.copy-btn-label').text(), '复制失败，请手动选择');
  }
});

test('table wrapping skips code tables and already wrapped tables', () => {
  const p = page('<table id="plain"></table><div class="table-container"><table id="wrapped"></table></div><figure class="highlight"><table id="code"></table></figure>');
  p.utils.wrapTableWithBox();
  p.utils.wrapTableWithBox();
  assert.equal(p.$('#plain').parents('.table-container').length, 1);
  assert.equal(p.$('#wrapped').parents('.table-container').length, 1);
  assert.equal(p.$('#code').parents('.table-container').length, 0);
});
