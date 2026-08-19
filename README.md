# mhdy2233.github.io — Hexo 源码 + Halo 同步

本仓库 `source` 分支存放 Hexo 源码工程，`master` 分支为 GitHub Pages 部署产物（由 GitHub Actions 自动生成，**不要手改 master**）。

## 架构

```
Halo 2.x (你的博客后台)
   │  文章 (REST API + PAT)
   ▼
tools/sync-halo.js ──► source/_posts/*.md (Hexo 源文件)
   │
   ▼
hexo generate ──► public/ (静态站点)
   │
   ▼
GitHub Actions ──► push 到 master ──► GitHub Pages (https://mhdy2233.github.io)
```

- 内容完全由 Halo 同步而来：`source/_posts/` 由 `sync-halo.js` 每次运行时生成/覆盖，本地不手动维护文章
- 部署时 `rsync --delete` 以构建产物为准，并删除 master 上的 `2023/` 旧文章与 `index1.html` 旧首页，只保留 Halo 内容

## 首次部署

1. 把本工程推送到仓库的 `source` 分支（保留现有 master 不动）：

   ```bash
   git init
   git checkout -b source
   git add -A
   git commit -m "Hexo source + Halo sync"
   git remote add origin https://github.com/mhdy2233/mhdy2233.github.io.git
   git push -u origin source
   ```

2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `HALO_BASE_URL`：你的 Halo 站点地址，如 `https://halo.example.com`
   - `HALO_PAT`：Halo 个人访问令牌（后台「个人资料 → 个人令牌」创建）

3. 在 GitHub 仓库 Settings → Pages 把 Source 设为 `master` 分支（/root）。

4. 手动触发一次 Actions（Actions 页 → Build & Deploy → Run workflow），验证部署成功。

## 日常使用

### 手动同步 + 部署
在 Actions 页面点「Run workflow」即可：脚本从 Halo 拉取已发布文章 → 生成 Markdown → hexo 构建 → 部署到 master。

### 定时同步（默认方式）
工作流每 30 分钟（`:17` / `:47`）自动跑一遍，Halo 有新发布/改动就部署，没有就什么都不提交。
在 Halo 里发文章后不用做任何事，最迟半小时上线；想立刻上线就手动点一次 Run workflow。

两点注意：
- 定时任务只在**默认分支**上生效，所以本仓库默认分支必须是 `source`
- GitHub 规定公开仓库「60 天无仓库活动」会自动停用定时任务，届时会收到邮件，点一下重新启用即可

### 想做到「发布即上线」
GitHub 触发接口要求请求体里有 `event_type` 字段：

```
POST https://api.github.com/repos/mhdy2233/mhdy2233.github.io/dispatches
Authorization: Bearer <GitHub PAT，需 repo 权限>
Accept: application/vnd.github+json
{"event_type": "halo-publish"}
```

Halo 的 [plugin-webhook](https://github.com/wxyShine/plugin-webhook) 只能配 URL 和请求头，
请求体是插件自己固定的 `{eventType, eventTypeName, hookTime, data}`，没有 `event_type`，
直接指向上面的地址会被 GitHub 以 422 拒掉（插件不处理响应错误，界面上还看不出失败）。
要用它就得中间加一层转发（Cloudflare Worker 之类），把请求体换成 GitHub 要的格式：

```js
export default {
  async fetch(request, env) {
    if (request.headers.get('x-halo-token') !== env.HALO_TOKEN) {
      return new Response('forbidden', { status: 403 });
    }
    return fetch('https://api.github.com/repos/mhdy2233/mhdy2233.github.io/dispatches', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'halo-relay',
      },
      body: JSON.stringify({ event_type: 'halo-publish' }),
    });
  },
};
```

Halo 插件里填 Worker 地址，加一个 `x-halo-token` 请求头做校验；GitHub PAT 只存在 Worker 环境变量里，不落在 Halo 配置中。

### 本地开发
```bash
npm install
npm run sync      # 从 Halo 拉文章与站点图片（需设置 HALO_BASE_URL，HALO_PAT 可选）
node run-hexo.js clean   # 清缓存
node run-hexo.js generate # 生成到 public/
```

## 说明

- `tools/sync-halo.js` 拉取 Halo 已发布文章（`publishPhase=published`），正文走 console API 的 `release-content` 接口（服务端合并快照链后直接返回 markdown 原文，`/apis/api.console.halo.run/v1alpha1/posts/{name}/release-content`），分类/标签按 `displayName` 映射
- 没配 `HALO_PAT` 时全程走 Halo 公开 API（正文取 `/apis/api.content.halo.run/v1alpha1/posts/{name}` 的 `content.raw`），功能不受影响
- 首页摘要：优先用 Halo 文章自带摘要，没写就取正文前 120 字，写进 front-matter 的 `description`
- 头像取 Halo 用户头像；背景图 Halo 没有对应设置项（属于各主题自己的配置），按「`HALO_BACKGROUND_URL` 环境变量 → 启用主题的配置 → Halo 首页内联样式」依次探测。两张图都会下载到 `source/images/`，不外链
- 部署时 `rsync --delete` 以构建产物为准，并删除 master 上的 `2023/` 旧文章与 `index1.html` 旧首页，只保留 Halo 内容
- 构建产物是可复现的：产物和 master 上现有内容完全一致时不提交，所以 master 的历史只记录真正的内容变更。为此做了两处修正——`scripts/deterministic-taxonomy.js` 把每篇文章的 tag/分类顺序固定为按名称排序（Hexo 原本的顺序取决于源文件并发处理完的先后），以及把 NexT 侧栏社交链接圆点的 `random-color()` 换成主题色（原本每次构建 `main.css` 都不一样）
- 站点标题、副标题、菜单等站点级设置在 `_config.yml`，不随 Halo 同步（两边标题本来就不同）
- 发布页（原手写 index.html）已废弃，站点根路径现在直接是博客首页
