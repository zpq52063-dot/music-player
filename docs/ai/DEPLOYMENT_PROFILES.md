# Deployment Profiles

> Phase 10 — 部署模式 | 2026-05-24

---

## 四种模式

| 模式 | 数据库 | 缓存 | 文件 | API代理 |
|------|--------|------|------|---------|
| local | Supabase(本地) | IndexedDB | local | API Routes |
| vercel | Supabase(云) | IndexedDB | Vercel Blob | API Routes |
| cloudflare | D1 | none | R2 | Workers |
| hybrid | Supabase(云) | IndexedDB | Vercel Blob | CF Workers |

---

## 检测方法

```typescript
import { detectDeploymentMode, getDeploymentProfile, isProductionMode } from "@/platform";

const mode = detectDeploymentMode();
// "local" | "vercel" | "cloudflare" | "hybrid"

const profile = getDeploymentProfile();
// { mode, name, description, envVars, features, storage }

if (isProductionMode()) {
  // 隐藏调试功能
}
```

---

## 模式切换

模式由代码根据运行环境自动检测:
- localhost → local
- vercel.app → vercel
- workers.dev → cloudflare
- CF_WORKER_URL 存在 → hybrid

无需手动配置。
