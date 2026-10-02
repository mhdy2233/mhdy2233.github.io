'use strict';

const { normalizePostPath, stripCodeTools } = require('../tools/halo-content');
hexo.extend.filter.register('post_permalink', normalizePostPath, 20);

hexo.extend.injector.register('head_end', () =>
  `<link rel="stylesheet" href="${hexo.config.root}css/halo-content.css">`, 'default');

// Search indexes code, not its generated toolbar, language label or line numbers.
const generateSearch = hexo.extend.generator.get('json');
if (generateSearch) {
  hexo.extend.generator.register('json', async function (locals) {
    const result = await generateSearch.call(this, locals);
    const entries = JSON.parse(result.data);
    for (const entry of entries) {
      if (typeof entry.content === 'string') entry.content = stripCodeTools(entry.content);
    }
    return { ...result, data: JSON.stringify(entries) };
  });
}
