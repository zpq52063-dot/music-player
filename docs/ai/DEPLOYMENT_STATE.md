# Deployment State

> Phase 9 — 当前部署状态 | 2026-05-24

---

## 当前部署

| 平台 | URL | 状态 |
|------|------|------|
| Vercel | https://music-player.vercel.app | ✅ Deployed |
| Supabase | https://music-player.supabase.co | ✅ Configured |

---

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## 发布模式

| 环境 | Debug | Release | 内部 |
|------|------|------|------|
| NEXT_PUBLIC_RELEASE_MODE=debug | NEXT_PUBLIC_RELEASE_MODE=debug | NEXT_PUBLIC_RELEASE_MODE=debug | NEXT_PUBLIC_RELEASE_MODE=debug |
