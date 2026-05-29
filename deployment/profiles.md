# Deployment Profiles

> Phase 10 — 部署模式配置

---

## 四种部署模式

### 1. Local (本地开发)
```bash
NEXT_PUBLIC_RELEASE_MODE=debug
npm run dev
```
- Next.js dev server (localhost:3000)
- 本地 Supabase (或 Mock)
- 全部调试功能开启
- Provider: Mock (默认)

### 2. Vercel (推荐生产)
```bash
NEXT_PUBLIC_RELEASE_MODE=release
```
- Vercel Serverless Functions
- Supabase 数据库
- Edge Functions (ISR/SWR)
- 环境变量通过 Vercel Dashboard

### 3. Cloudflare (预留)
```bash
NEXT_PUBLIC_RELEASE_MODE=release
```
- Cloudflare Workers
- D1 数据库 / R2 存储
- 静态导出 (next build + next export)

### 4. Hybrid (混合)
```bash
NEXT_PUBLIC_RELEASE_MODE=release
CF_WORKER_URL=https://xxx.workers.dev
```
- Vercel (前端) + Cloudflare Workers (API代理)
- Supabase (数据库)
- 最优: Vercel SSR + Cloudflare Edge API

---

## 模式检测

代码自动检测当前部署模式:
```typescript
import { detectDeploymentMode } from "@/platform";

const mode = detectDeploymentMode();
// "local" | "vercel" | "cloudflare" | "hybrid"
```

---

## 环境变量模板

见 `.env.example` 完整模板.
