# mhdy2233.github.io — Hexo 源码 + Halo 同步

本仓库 `source` 分支存放 Hexo 源码工程，`master` 分支为 GitHub Pages 部署产物（由 GitHub Actions 自动生成，**不要手改 master**）。

## 架构

```
Halo 2.x (你的博客后台)
   │  文章 (REST API + PAT)
   ▼
scripts/sync-halo.js ──► source/_posts/*.md (Hexo 源文件)
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

### Halo 发布后自动触发
在 Halo 后台的「链接/集成」或「Webhook」功能里，配置发布事件调用：

```
POST https://api.github.com/repos/mhdy2233/mhdy2233.github.io/dispatches
Authorization: Bearer <GitHub PAT>
Content-Type: application/json
{"event_type": "halo-publish"}
```

（需在 GitHub 创建一个有 repo 权限的 PAT 作为 Bearer。）

### 本地开发
```bash
npm install
npm run sync      # 从 Halo 拉文章（需设置 HALO_BASE_URL / HALO_PAT）
node run-hexo.js clean   # 清缓存
node run-hexo.js generate # 生成到 public/
```

## 说明

- `sync-halo.js` 拉取 Halo 已发布文章（`publishPhase=published`），正文走 console API 的 `release-content` 接口（服务端合并快照链后直接返回 markdown 原文，`/apis/api.console.halo.run/v1alpha1/posts/{name}/release-content`），分类/标签按 `displayName` 映射
- 部署时 `rsync --delete` 以构建产物为准，并删除 master 上的 `2023/` 旧文章与 `index1.html` 旧首页，只保留 Halo 内容
- 发布页（原手写 index.html）已废弃，站点根路径现在直接是博客首页
