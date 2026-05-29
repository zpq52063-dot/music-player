# Cloudflare Pages 部署指南

> Phase 20A — Production Deploy Foundation | 2026-05-29

---

## 架构概览

```
Browser → Cloudflare Pages (Next.js App) → Cloudflare Worker (API Proxy) → Internet Archive / Jamendo / ccMixter
```

- **Cloudflare Pages**: 托管 Next.js 前端应用 (通过 `@cloudflare/next-on-pages`)
- **Cloudflare Worker**: 托管音乐 API 代理 (搜索/歌曲/健康检查)
- **Supabase** (可选): PostgreSQL 数据库

---

## 前置条件

1. [Cloudflare 账号](https://dash.cloudflare.com)
2. [GitHub 仓库](https://github.com) (项目已 push)
3. Cloudflare Pages 项目已创建 (`music-player`)
4. Worker `music-proxy` 已部署
5. 自定义域名 (推荐) — 在 Cloudflare DNS 中管理

---

## Step 1: GitHub Secrets

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Pages + Workers 权限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `NEXT_PUBLIC_RELEASE_MODE` | `release` (生产) |
| `NEXT_PUBLIC_SITE_URL` | 自定义域名, 如 `https://music.example.com` |
| `NEXT_PUBLIC_CF_WORKER_URL` | Worker 生产 URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL (可选) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 (可选) |
| `NEXT_PUBLIC_DEBUG_OVERLAY` | `false` |
| `NEXT_PUBLIC_TELEMETRY_ENABLED` | `false` |

---

## Step 2: 创建 Cloudflare Pages 项目

```bash
# 通过 CLI 创建
npx wrangler pages project create music-player --production-branch=main

# 或通过 Dashboard: Workers & Pages → Create → Pages → Connect to Git
```

---

## Step 3: 部署 Worker

```bash
# 部署到生产环境
npx wrangler deploy --env production

# 设置 Jamendo API Key (可选)
wrangler secret put JAMENDO_CLIENT_ID --env production
```

验证 Worker 运行:
```bash
curl https://music-proxy-production.<subdomain>.workers.dev/api/health
# → {"status":"ok","timestamp":...,"providers":{...}}
```

---

## Step 4: 部署到 Cloudflare Pages

推送 `main` 分支自动触发生产部署，或手动部署:

```bash
# 1. 构建 Next.js
npm run build

# 2. 构建 Cloudflare Pages 输出
npm run cf:build

# 3. 部署
npx wrangler pages deploy .vercel/output/static --project-name=music-player --branch=main
```

PR 分支自动部署为预览环境。

---

## Step 5: 自定义域名

```bash
# 1. 添加自定义域名到 Pages 项目
npx wrangler pages project create music-player

# 2. 通过 Dashboard 操作:
#    Workers & Pages → music-player → Custom domains → Add domain
#    输入: music.example.com

# 3. Cloudflare DNS 会自动配置 (如果域名在 Cloudflare 上管理)
#    非 Cloudflare DNS: 添加 CNAME record → music-player.pages.dev
```

---

## Step 6: Worker 路由集成

`public/_routes.json` 已配置 Worker API 路由排除:

```json
{
  "include": ["/*"],
  "exclude": [
    "/api/health",
    "/api/search", 
    "/api/song/*",
    "/api/providers"
  ]
}
```

Pages 处理所有 Next.js 路由, Worker 处理 `/api/*` 路由。

---

## 环境分离

| 环境 | 域名 | 触发 | Release Mode |
|------|------|------|-------------|
| **Local** | `localhost:3000` | `npm run dev` | `debug` |
| **Preview** | `*.music-player.pages.dev` | PR | `internal` |
| **Production** | `music.example.com` | push main | `release` |

---

## 回滚

```bash
# 回滚 Pages
npx wrangler pages deployment rollback --project-name=music-player

# 回滚 Worker
npx wrangler rollback --env production

# 或通过 GitHub Actions:
# Actions → Rollback → Run workflow
```

---

## 监控

```bash
# Worker 日志
npx wrangler tail

# Pages 部署历史
npx wrangler pages deployments list --project-name=music-player

# Cloudflare Analytics
# Dashboard → Workers & Pages → music-player → Analytics
```

---

## 部署后验证

- [ ] 生产 URL 可访问 (自定义域名 HTTPS)
- [ ] PWA manifest.json 加载正确 (绝对 URL)
- [ ] Worker `/api/health` 返回健康状态
- [ ] Worker `/api/search?q=test` 返回搜索结果
- [ ] 搜索功能正常 (音乐可搜索)
- [ ] 播放器正常播放 (音频 URL 可访问)
- [ ] Service Worker 已注册 (PWA)
- [ ] SSL 证书有效 (Cloudflare 自动管理)
- [ ] 安全横幅不显示 (生产环境隐藏)
- [ ] 调试面板不渲染 (生产环境禁用)
