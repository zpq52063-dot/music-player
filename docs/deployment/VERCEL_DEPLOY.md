# Vercel 部署指南

> Phase 8 — 生产环境部署 | 2026-05-24
> 
> **注意:** 本项目同时支持 Cloudflare Pages 部署。参见 [CLOUDFLARE_PAGES.md](./CLOUDFLARE_PAGES.md)。

---

## 前置条件

1. GitHub 仓库 (项目已 push)
2. Vercel 账号 (vercel.com)
3. Supabase 项目 (supabase.com)
4. 域名 (可选)

---

## Step 1: 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

```
NEXT_PUBLIC_SUPABASE_URL          = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY         = eyJxxxx...  (仅供 server-side)
```

**注意:** SUPABASE_SERVICE_ROLE_KEY 严禁暴露到 `NEXT_PUBLIC_*` 变量中。

---

## Step 2: 导入项目

```bash
# 方式 A: Vercel CLI
npm i -g vercel
vercel login
vercel

# 方式 B: Vercel Dashboard
# Import Git Repository → 选择 GitHub 仓库
# Framework Preset: Next.js
# Build Command: npm run build
# Output Directory: .next
```

---

## Step 3: 部署配置

Vercel 自动检测 Next.js 项目，无需额外配置。

`next.config.ts` 中已有的配置：
- serwist (Service Worker)
- images (AVIF, WebP)
- optimizePackageImports

---

## Step 4: 域名配置 (可选)

```bash
# 添加自定义域名
vercel domains add music.example.com

# DNS 配置 (在域名提供商处)
# CNAME music.example.com → cname.vercel-dns.com
```

---

## Step 5: 验证部署

```bash
# 检查部署状态
vercel ls

# 查看生产环境日志
vercel logs --production

# 回滚到上一个版本 (如有问题)
vercel rollback
```

---

## 环境分离

| 环境 | 域名 | 用途 |
|------|------|------|
| Production | music.vercel.app | 生产 (或自定义域名) |
| Preview | *.vercel.app (每次 PR) | PR 预览 |
| Development | localhost:3000 | 本地开发 |

---

## 部署后检查

- [ ] 首页加载正常
- [ ] 搜索功能可用
- [ ] 播放器正常播放
- [ ] PWA 安装 (manifest.json 可访问)
- [ ] Supabase 连接正常
- [ ] Service Worker 已注册
- [ ] API Routes 响应正常
- [ ] SSL 证书有效
