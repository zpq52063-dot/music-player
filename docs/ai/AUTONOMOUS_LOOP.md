# Autonomous Maintenance Loop

> Phase 13 — 自治维护循环 | 2026-05-24

---

## 概述

`AutonomousMaintenanceLoop` 是项目的**自主心跳**。它周期性执行10种维护任务，确保系统在无人干预下长期健康运行。

核心模块: `src/frozen-runtime/AutonomousMaintenanceLoop.ts`

---

## 10 种维护任务

| 任务 | 频率 | 优先级 | 自动恢复 |
|------|------|--------|---------|
| `provider_health_check` | 5min | high | ✅ |
| `cache_governance` | 10min | normal | ✅ |
| `runtime_integrity` | 15min | high | ❌ |
| `recovery_test` | 30min | normal | ❌ |
| `snapshot_generation` | 1h | normal | ❌ |
| `debt_detection` | 2h | low | ❌ |
| `isolation_check` | 5min | high | ✅ |
| `bootstrap_verify` | 24h | critical | ❌ |
| `governance_full` | 30min | high | ❌ |
| `disaster_drill` | 7d | low | ❌ |

---

## 生命周期

```typescript
import { getMaintenanceLoop } from "@/frozen-runtime";

const loop = getMaintenanceLoop();
loop.start(); // 启动所有定时任务
loop.stop();  // 停止

// 手动触发完整周期
const report = await loop.runFullCycle();

// 手动触发单个任务
await loop.runTask("provider_health_check");
```

---

## 自动恢复

对于标记 `autoRecover: true` 的任务：
- 失败后自动重试 (maxRetries次)
- 成功恢复计入 `totalRecoveries`
- 恢复失败后记录为失败

---

## 报告格式

每个完整周期生成 `MaintenanceReport`:
- `overallHealth`: excellent/good/fair/poor/critical
- `completedTasks`: 每项任务的执行结果
- `recommendations`: 改进建议

报告持久化到 localStorage (`music_maintenance_last_report`)。

---

## 与现有系统的关系

- 使用 Phase 9 `CacheGovernance` 进行缓存清理
- 使用 Phase 12 `GovernancePipeline` 进行治理检查
- 使用 Phase 12 `DegradedRuntime` 进行降级评估
- 使用 Phase 13 `FrozenRuntimeManager` 进行完整性检查
- 使用 Phase 13 `RuntimeIsolationLayer` 进行隔离检查

---

> 此循环是项目能够"永续运行"的核心。一旦停止，系统会逐渐退化。
> Phase 13 — 最终长期冻结版 | 2026-05-24
