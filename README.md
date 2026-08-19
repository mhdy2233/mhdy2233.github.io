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

- 老文章（2023 年 10 篇）已逆向为 Markdown 放在 `source/_posts/`，URL 与原站完全一致（`/2023/09/23/<标题>/`）
- 老文章的图片资源（`2023/` 目录）保留在 master 分支，部署时由 workflow 增量保留

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

- `sync-halo.js` 拉取 Halo 已发布文章（`publishPhase=published`），正文从 Snapshot 获取（`releaseSnapshot` → `rawPatch`），分类/标签按 `displayName` 映射
- 部署时 `rsync --exclude=2023/ --exclude=index1.html` 保留老文章图片与旧首页留档，其余以新构建为准
- 发布页（原手写 index.html）已废弃，站点根路径现在直接是博客首页
