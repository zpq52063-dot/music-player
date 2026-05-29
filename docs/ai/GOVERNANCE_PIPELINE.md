# Governance Pipeline

> Phase 12 — 自动化治理管道 | 2026-05-24

---

## 概述

`GovernancePipeline` 是自动化系统巡检管道，周期性检查5个关键领域。

核心模块: `src/ecosystem/ai-autonomy/GovernancePipeline.ts`

---

## 5 阶段检查

### Stage 1: Module Consistency (模块一致性)
- 核心保护模块存在性
- Ecosystem 模块完整性
- 依赖层数检查

### Stage 2: Store Dependency (Store依赖)
- Store 数量上限 (≤15)
- 依赖方向正确性 (单向)
- React Query 集成状态

### Stage 3: Provider Status (Provider状态)
- Fallback 链完整性
- MockProvider 兜底存在
- Provider 健康评分

### Stage 4: Recovery Status (恢复状态)
- PlaybackWatchdog 可用
- ProviderSelfHealing 可用
- DisasterRecovery 可用
- 恢复检查点存在

### Stage 5: Cache Status (缓存状态)
- 内存缓存状态
- IndexedDB 条目数
- Service Worker 缓存

---

## 结果分类

| 状态 | 条件 |
|------|------|
| `healthy` | 0 个检查失败 |
| `degraded` | < 3 个检查失败 |
| `unhealthy` | ≥ 3 个检查失败 |

---

## 使用方式

```typescript
import { getGovernancePipeline } from "@/ecosystem/ai-autonomy";

const pipeline = getGovernancePipeline();
const result = await pipeline.run();

// 检查结果
console.log(result.overallStatus);   // "healthy" | "degraded" | "unhealthy"
console.log(result.totalPassed);     // 通过数
console.log(result.totalFailed);     // 失败数
console.log(result.recommendations); // 建议列表

// Markdown 报告
const report = pipeline.generateMarkdownReport(result);
```

---

## 自动调度

由 `AIAutonomyManager` 每30分钟自动执行一次。

```typescript
autonomy.start(); // 自动包含 governance_check 定时任务
```

---

## 与现有治理的关系

此Pipeline是对 Phase 11 `RuntimeGovernanceManager` 的增强:
- Phase 11: 治理检查执行器
- Phase 12: 治理管道编排器 (编排多个检查阶段)

---

> GovernancePipeline 确保系统长期运行时的一致性不会悄悄退化。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
