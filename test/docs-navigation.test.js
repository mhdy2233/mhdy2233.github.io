'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('MiniDocs query URLs resolve only known local documents and retain query and hash', () => {
  const script = fs.readFileSync(path.join(__dirname, '../source/js/halo-docs.js'), 'utf8');
  const link = { dataset: { haloDocSlug: '问题', haloDocId: 'doc-id' }, getAttribute: () => '/docs/docker%20bug/%E9%97%AE%E9%A2%98/' };
  function redirect(url, href = link.getAttribute(), hasNav = true) {
    let destination;
    const context = {
      URL,
      window: { location: { href: url, replace: value => { destination = value; } } },
      document: {
        addEventListener: (event, callback) => callback(),
        querySelector: () => hasNav ? { querySelectorAll: () => [{ ...link, getAttribute: () => href }] } : null
      }
    };
    vm.runInNewContext(script, context);
    return destination;
  }
  assert.equal(redirect('https://mirror.test/docs/view/docker%20bug/?docSlug=%E9%97%AE%E9%A2%98&from=post#part'),
    'https://mirror.test/docs/docker%20bug/%E9%97%AE%E9%A2%98/?from=post#part');
  assert.equal(redirect('https://mirror.test/docs/view/docker%20bug?docSlug=doc-id'),
    'https://mirror.test/docs/docker%20bug/%E9%97%AE%E9%A2%98/');
  assert.equal(redirect('https://mirror.test/docs/view/docker%20bug?docSlug=unknown'), undefined);
  assert.equal(redirect('https://mirror.test/archives/post/?docSlug=doc-id'), undefined);
  assert.equal(redirect('https://mirror.test/docs/view/docker%20bug?docSlug=doc-id', 'https://other.test/page'), undefined);
  assert.equal(redirect('https://mirror.test/docs/view/docker%20bug?docSlug=doc-id', undefined, false), undefined);
});
