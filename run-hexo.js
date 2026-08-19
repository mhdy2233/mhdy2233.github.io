// 本地/CI 构建入口：程序化调用 hexo（无需全局 hexo-cli）
const Hexo = require('hexo');
const cmd = process.argv[2] || 'generate';
const hexo = new Hexo(process.cwd(), { silent: false });
hexo.env.init = true;
hexo.env.cmd = cmd;
(async () => {
  await hexo.init();
  await hexo.load();
  await hexo.call(cmd, {});
  console.log('[run-hexo] done');
  process.exit(0);
})().catch(e => { console.error('[run-hexo] 失败:', e.message); process.exit(1); });
