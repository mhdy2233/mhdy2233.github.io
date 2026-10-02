'use strict';

const { normalizePostPath } = require('../tools/halo-content');
hexo.extend.filter.register('post_permalink', normalizePostPath, 20);

hexo.extend.injector.register('head_end', () =>
  `<link rel="stylesheet" href="${hexo.config.root}css/halo-content.css">`, 'default');
