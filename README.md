# mhdy2233.github.io — Hexo 源码 + Halo 同步

本仓库 `source` 分支存放 Hexo 源码工程，`master` 分支为 GitHub Pages 部署产物（由 GitHub Actions 自动生成，**不要手改 master**）。

## 架构

```
Halo 2.x (你的博客后台)
   │  已发布文章 (公开 REST API；PAT 可选)
   ▼
tools/sync-halo.js ──► source/_posts/*.html (Hexo 文章源文件，带 front-matter)
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
   - `HALO_PAT`：可选，Halo 个人访问令牌（后台「个人资料 → 个人令牌」创建）

3. 在 GitHub 仓库 Settings → Pages 把 Source 设为 `master` 分支（/root）。

4. 手动触发一次 Actions（Actions 页 → Build & Deploy → Run workflow），验证部署成功。

## 日常使用

### 手动同步 + 部署
在 Actions 页面点「Run workflow」即可：脚本从 Halo 拉取已发布文章 → 生成 HTML 文章源文件 → hexo 构建 → 部署到 master。

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
npm test         # 离线回归测试，无需 PAT
npm run sync      # 从 Halo 拉文章与站点图片（需设置 HALO_BASE_URL，HALO_PAT 可选）
node run-hexo.js clean   # 清缓存
node run-hexo.js generate # 生成到 public/
```

## 说明

- `tools/sync-halo.js` 从第 1 页开始拉取公开已发布文章，按 `hasNext` / `total` 分页，分类/标签按 `displayName` 映射。私有、删除和未发布文章不会输出
- 未设置 `HALO_PAT` 时正文直接取公开 `/apis/api.content.halo.run/v1alpha1/posts/{name}`；设置时优先取 console `release-content`，认证失败则匿名回退。优先使用已渲染的 `content`，仅在其缺失时处理 HTML / Markdown `raw`，不会把编辑器 JSON 当正文
- 正文生成 `.html` 并关闭 Nunjucks 解析，避免富文本被 Markdown 二次解释，以及代码示例中的 `{{ ... }}` / `{% ... %}` 触发模板解析。文件名使用资源 ID，文章 URL 保留 Halo `/archives/.../` 路径
- Markdown 回退复用现有 Hexo 标题锚点规则；代码中的反引号和波浪号以 HTML 实体保留，避免 Hexo 的前置围栏过滤器再次解析。NexT 目录兼容原始 ID 和编码后的片段链接。
- 关闭 NexT 入场动画，正文不再因动画尚未启动而隐藏；即使第三方脚本加载失败也可直接阅读静态正文
- 全部正文获取成功后才写入并清理旧 `.md` / `.html`；任何缺失、空正文、服务器错误或无效分页都会中止同步，不继续部署不完整站点。缺失 `HALO_BASE_URL` 时 CI 直接失败
- 首页摘要：优先用 Halo 文章自带摘要，没写就取正文前 120 字，写进 front-matter 的 `description`
- 头像取 Halo 用户头像；背景图 Halo 没有对应设置项（属于各主题自己的配置），按「`HALO_BACKGROUND_URL` 环境变量 → 启用主题的配置 → Halo 首页内联样式」依次探测。两张图都会下载到 `source/images/`，不外链
- 部署时 `rsync --delete` 以构建产物为准，并删除 master 上的 `2023/` 旧文章与 `index1.html` 旧首页，只保留 Halo 内容
- 构建产物是可复现的：产物和 master 上现有内容完全一致时不提交，所以 master 的历史只记录真正的内容变更。为此做了两处修正——`scripts/deterministic-taxonomy.js` 把每篇文章的 tag/分类顺序固定为按名称排序（Hexo 原本的顺序取决于源文件并发处理完的先后），以及把 NexT 侧栏社交链接圆点的 `random-color()` 换成主题色（原本每次构建 `main.css` 都不一样）
- `scripts/deterministic-taxonomy.js` 还固定 sitemap 的标签、分类和相同更新时间条目的顺序。sitemap 插件原有的生成日期语义保留，因此跨日构建仍可能更新其中的日期。
- 站点标题、副标题、菜单等站点级设置在 `_config.yml`，不随 Halo 同步（两边标题本来就不同）
- 发布页（原手写 index.html）已废弃，站点根路径现在直接是博客首页

## 富文本兼容范围

- 保留标题、列表、引用、表格、代码、强调、删除线、文字颜色、对齐、图片尺寸与图注。
- Halo `hyperlink-card` / `hyperlink-inline-card` 转为可点击的原生链接，保留自定义标题；`pre[collapsed=true]` 转为原生折叠代码，无需 Halo 插件脚本。
- 支持图片懒加载及 `srcset`，优先使用 `data-src` / `data-srcset` 替换占位图；支持音视频原生控件、受沙箱限制的 iframe、禁用的任务复选框。
- 相对图片、附件、海报及媒体链接基于源文章 URL 补全。已同步文章之间的链接留在镜像；未同步 `/docs` 等页面仍指向 Halo，不伪造本地页面。
- 删除脚本、事件属性、危险 URL、任意定位样式；不加载 Halo 主题或插件运行时。iframe 沙箱可能限制需要登录或同源权限的播放器。
- 自定义卡片采用静态降级外观，不请求远端站点元数据；不宣称完整复刻所有 Halo 插件。公式、图表、第三方专用组件需要单独适配。
- 媒体正文仍引用原文件地址，不是完整离线备份。源文件失效、跨域或防盗链限制仍可能影响媒体加载。

## 回归检查

`npm test` 包括正文选择、HTML/Markdown 回退、匿名读取、PAT 路径与认证回退、分页、
媒体 URL、卡片、折叠代码、安全过滤、日期、UTF-8 分块，以及真实 Hexo 渲染和 CLI
同步失败保留旧文件、成功迁移旧 Markdown 的测试。PR 检查不读取 secrets、不部署；
现有部署工作流也会先运行测试。合并到 `source` 后手动触发部署或等待原定时任务。
