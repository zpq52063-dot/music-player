# Long-Term Stability

> Phase 13 — 长期稳定性治理 | 2026-05-24

---

## 概述

长期稳定性体系确保项目在**开发者长期离开后**仍能稳定运行。

---

## 稳定性评分体系

由 `SelfHealingGovernance` 计算，5个维度:

| 维度 | 权重 | 评估方式 |
|------|------|---------|
| Provider稳定性 | 30% | ProviderManager健康状态 |
| Cache稳定性 | 15% | CacheGovernance运行状态 |
| Recovery稳定性 | 25% | 恢复系统可用性 |
| Runtime稳定性 | 20% | FrozenRuntime完整性评分 |
| Autonomy稳定性 | 10% | 维护循环运行状态 |

---

## 趋势分析

整体评分趋势:

| 评分范围 | 趋势 | 含义 |
|---------|------|------|
| ≥ 80 | stable | 系统健康 |
| 60-79 | declining | 需要注意 |
| 40-59 | declining | 需要干预 |
| < 40 | critical | 立即干预 |

---

## 自愈治理

`SelfHealingGovernance` 提供:

1. **自动诊断** — 每5分钟重新计算稳定性评分
2. **治愈建议** — 针对低分维度生成治愈动作
3. **自动治愈** — 执行 `autoExecute: true` 的治愈动作
4. **历史追踪** — 所有治愈尝试的成功/失败统计

---

## 治愈动作类型

| 类型 | 描述 | 示例目标 |
|------|------|---------|
| `restart` | 重启模块 | autonomy_loop, maintenance_loop |
| `reload` | 重载配置 | provider_config, runtime_config |
| `fallback` | 切换到兜底 | providers, degraded_mode |
| `reset` | 重置状态 | cache, issues |
| `reinitialize` | 重新初始化 | isolation_layer, frozen_runtime |
| `quarantine` | 隔离问题域 | (任意隔离域) |

---

## 长期指标

| 指标 | 含义 | 存储 |
|------|------|------|
| 系统运行时间 | 自上次重启 | 内存 |
| 自治循环次数 | 已完成维护周期 | localStorage |
| 总恢复次数 | 成功恢复的次数 | localStorage |
| 总快照数 | 创建的快照总数 | localStorage |
| 总隔离次数 | 域隔离触发次数 | localStorage |
| 平均健康分 | 历史健康评分均值 | 计算值 |
| Provider运行时间 | 每个Provider的可用率 | ProviderManager |

---

## 冻结治理

`FrozenGovernanceManager` 提供:

- 修改请求评估 — 检查目标是否在冻结/危险区域
- 变更审批 — 基于稳定性评分决定是否允许变更
- 决策历史 — 所有治理决策持久化保存

```typescript
import { getFrozenGovernance } from "@/frozen-runtime/governance";

const fg = getFrozenGovernance();
const decision = await fg.evaluateModificationRequest(
  "src/lib/audio/AudioManager.ts",
  "需要修复内存泄漏",
);
// decision.type: "reject" (冻结模块)
```

---

## 项目冻结状态

参见 `docs/ai/FINAL_FREEZE_STATE.md`:
- 最终架构快照
- 冻结模块列表
- 禁止修改区域
- 永久限制
- 长期维护建议

---

> 长期稳定性不是一次性工作，而是持续运行的自治系统。
> Phase 13 — 最终长期冻结版 | 2026-05-24
