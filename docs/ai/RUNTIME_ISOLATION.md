# Runtime Isolation

> Phase 13 — 运行时隔离层 | 2026-05-24

---

## 核心原则

**单个模块崩溃不影响全局。**

核心模块: `src/frozen-runtime/isolation/RuntimeIsolationLayer.ts`

---

## 6 个隔离域

| 域 | 隔离级别 | 最大失败 | 自动隔离 | 隔离时长 |
|-----|---------|---------|---------|---------|
| `provider` | full | 5 | ✅ | 5min |
| `audio` | full | 3 | ✅ | 2min |
| `cache` | partial | 5 | ✅ | 10min |
| `recovery` | partial | 3 | ❌ | 5min |
| `governance` | none | 10 | ❌ | 10min |
| `autonomy` | partial | 5 | ✅ | 30min |

---

## 隔离机制

1. **失败累计** — 每次失败 `failureCount++`
2. **达到阈值** — 自动隔离该域
3. **隔离期** — 该域内所有操作被阻止
4. **自动释放** — 隔离期结束自动解除
5. **手动释放** — 可提前手动解除

---

## 使用方式

```typescript
import { getRuntimeIsolation } from "@/frozen-runtime/isolation";

const iso = getRuntimeIsolation();

// 报告失败
iso.reportFailure("audio", "AudioManager加载超时");

// 检查是否隔离
if (iso.isIsolated("audio")) {
  // 使用降级方案
}

// 在隔离保护下执行
const result = await iso.executeWithIsolation(
  "provider",
  async () => { /* 正常操作 */ },
  async () => { /* fallback */ },
);
```

---

## 隔离报告

```typescript
const report = iso.generateIsolationReport();
// {
//   timestamp: ...,
//   isolatedDomains: ["provider"],
//   activeQuarantines: 1,
//   totalIsolations: 3,
//   totalAutoReleases: 2,
//   domains: [...]
// }
```

---

## 持久化

隔离状态持久化到 localStorage (`music_isolation_state`)。
重启后自动恢复隔离定时器。

---

> 隔离层确保系统在部分模块异常时仍能继续运行，是实现"长期稳定"的关键。
> Phase 13 — 最终长期冻结版 | 2026-05-24
