# Provider Map

> Phase 8 — 所有 Provider 完整状态 | 2026-05-24

---

## Provider 注册 (ProviderManager)

**Fallback 优先级链:** netease → qq → kuwo → mock

```
ProviderManager (单例)
├── NeteaseProvider (P0) — 网易云音乐
├── QQProvider     (P1) — QQ音乐
├── KuwoProvider   (P2) — 酷我音乐
├── BilibiliProvider (P3) — B站 (预留骨架)
└── MockProvider   (P99) — 永久兜底
```

---

## Provider 详情

### NeteaseProvider
- **文件:** `src/music-source/providers/netease/NeteaseProvider.ts`
- **基类:** BaseProxyProvider
- **数据通道:** 通过 `/api/music/*` 代理路由 → 外部 API
- **健康状态:** 需真实 API URL
- **状态:** ✅ 架构完整，待配置真实 API URL

### QQProvider
- **文件:** `src/music-source/providers/qq/QQProvider.ts`
- **基类:** BaseProxyProvider
- **健康状态:** 需真实 API URL
- **状态:** ✅ 架构完整

### KuwoProvider
- **文件:** `src/music-source/providers/kuwo/KuwoProvider.ts`
- **基类:** BaseProxyProvider
- **健康状态:** 需真实 API URL
- **状态:** ✅ 架构完整

### BilibiliProvider
- **文件:** `src/music-source/providers/bilibili/BilibiliProvider.ts`
- **基类:** MusicProvider (直接实现)
- **状态:** 🔲 预留骨架，未实现

### MockProvider
- **文件:** `src/music-source/providers/mock/MockProvider.ts`
- **数据:** 52 首 mock 歌曲、12 个歌单、10 位艺术家、5 首 LRC 歌词、20 个热门词
- **状态:** ✅ 完整实现，永久兜底，**不可删除**

---

## Provider 管理核心

### ProviderManager
- **文件:** `src/music-source/providers/provider-manager/ProviderManager.ts`
- **功能:** 注册/注销/切换 Provider、Fallback 链管理、健康恢复探测
- **规则:** 所有 Provider 请求必须通过 `manager.execute()` 调用

### HealthTracker
- **文件:** `src/music-source/providers/provider-manager/HealthTracker.ts`
- **算法:** 滑动窗口 (最近 10 次请求)
- **判定:** 连续 3 次失败 → unhealthy; 连续 2 次成功 → recovered
- **探测:** 每 30s 探测一次不健康 Provider

### RequestManager
- **文件:** `src/music-source/providers/provider-manager/RequestManager.ts`
- **重试:** max 3 次，指数退避 (1s, 2s, 4s)
- **超时:** 10s
- **去重:** pendingRequests Map

---

## 缓存层

### SearchCache (Phase 3)
- **文件:** `src/music-source/cache/SearchCache.ts`
- **存储:** 内存 Map
- **TTL:** search(2min)/suggestion(1min)/hotKeywords(30min)/songDetail(5min)/playlist(5min)
- **去重:** pendingRequests Map

### APICache (Phase 7)
- **文件:** `src/music-source/cache/APICache.ts`
- **策略:** SWR (stale-while-revalidate)
- **增强:** 分组 TTL + 自动 revalidate

---

## 播放稳定性

### PlaybackStabilizer
- **文件:** `src/music-source/services/PlaybackStabilizer.ts`
- **功能:** URL 缓存 (10min TTL)、失败自动换源、预加载队列、状态保存/恢复

---

## Provider Hooks

| Hook | 功能 |
|------|------|
| useProvider | Provider 生命周期管理 + 回调注册 |
| useProviderHealth | 健康监控 (10s 轮询) |
| useFallbackPlayer | Fallback-aware 播放 + URL 缓存 |
| useMusicSource | 高层数据源 (SWR + auto fallback + cache) |

---

## Provider UI

| 组件 | 功能 |
|------|------|
| ProviderInit | 启动时注册所有 Provider (layout.tsx) |
| ProviderStatusBar | 当前音源状态指示条 |
| FallbackNotice | 降级通知弹窗 (4s 自动消失) |
| ProviderDebugPanel | 开发调试面板 (仅 debug 模式) |
