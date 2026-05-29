# Cache Runtime

> Phase 10 — 缓存运行时管理 | 2026-05-24

---

## 四层缓存架构

```
L1: Memory Cache (SearchCache + APICache)
  - 最快
  - 易失 (页面刷新丢失)
  - 容量: ~5MB (200 entries)

L2: IndexedDB Cache (5 Object Stores)
  - 持久化
  - 容量: ~50MB
  - 治理: CacheGovernanceSystem

L3: Service Worker Cache
  - 离线可用
  - 容量: 取决于浏览器
  - 策略: 分层 (CacheFirst/NetworkFirst/StaleWhileRevalidate)

L4: localStorage
  - 配置/settings/telemetry
  - 容量: ~5MB
```

---

## 缓存治理 (自动)

```typescript
const cfg = getRuntimeConfig().getCacheConfig();
// {
//   cleanupIntervalMs: 600000,  // 10分钟
//   lyricMaxAgeDays: 7,
//   metadataMaxAgeDays: 30,
//   historyMaxEntries: 500,
//   indexedDBMaxEntries: 2000,
//   memoryMaxEntries: 200
// }
```

---

## 运行时调整缓存策略

```typescript
import { getRuntimeConfig } from "@/platform";

const rc = getRuntimeConfig();

// 调整清理间隔
rc.updateCacheConfig({ cleanupIntervalMs: 300000 }); // 5分钟

// 调整历史保留数
rc.updateCacheConfig({ historyMaxEntries: 300 });

// 调整歌词保留天数
rc.updateCacheConfig({ lyricMaxAgeDays: 14 });
```

---

## 缓存压力治理

MemoryMonitor 检测内存压力 → 触发 CacheGovernance 更频繁清理:
- Warning (50MB) → 清理间隔缩短到 5min
- Critical (80MB) → 立即全量清理
