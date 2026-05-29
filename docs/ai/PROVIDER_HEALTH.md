# Provider Health

> Phase 9 — Provider 健康状态与自愈 | 2026-05-24

---

## Provider 评分体系

每个 Provider 有三个评分维度：

| 维度 | 权重 | 计算方式 |
|------|------|---------|
| Latency Score | 30% | avgLatency: <200ms=100, >3000ms=0 |
| Health Score | 70% | successRate (0-100) |
| Failure Penalty | — | 每次连续失败 -15, 上限 -60 |
| Cooldown Penalty | — | cooldown期间 compositeScore 上限 20 |

Composite Score = max(0, latencyScore * 0.3 + healthScore * 0.7 - failurePenalty)

---

## 评分区间

| Score | 状态 | 行为 |
|-------|------|------|
| 70-100 | Healthy | 正常使用，优先选择 |
| 30-69 | Degraded | 仍可用，降级警告 |
| 0-29 | Critical | 自动降级，禁止使用 |

---

## Provider 当前状态

| Provider | 类型 | 优先级 | 数据源 | 状态 |
|----------|------|--------|--------|------|
| NeteaseProvider | netease | P0 | /api/music/* 代理 → 外部API | 🔲 需真实API URL |
| QQProvider | qq | P1 | /api/music/* 代理 → 外部API | 🔲 需真实API URL |
| KuwoProvider | kuwo | P2 | /api/music/* 代理 → 外部API | 🔲 需真实API URL |
| BilibiliProvider | bilibili | P3 | 直接实现 MusicProvider | 🔲 预留骨架 |
| MockProvider | mock | P99 | 本地mock数据 (52首歌) | ✅ 永久兜底 |

---

## Fallback 链路

```
netease (P0) → qq (P1) → kuwo (P2) → mock (P99)
```

规则：
- 当前 Provider 失败 → 自动尝试下一个
- 连续3次失败 → 标记 unhealthy → 30s 探测恢复
- 连续2次探测成功 → 恢复 healthy → 自动切回
- mock 永不降级，作为最终兜底

---

## 自愈机制

### 降级触发
- compositeScore < 30
- 连续失败 >= 3
- 冷却期: 5分钟

### 恢复触发
- compositeScore >= 70
- 连续失败 = 0
- 成功率 >= 80%

### 探测策略
- 每30s 用 getHotKeywords() 轻量探测
- 不消耗大量资源
- 恢复后自动提升优先级

---

## 评分查询

```typescript
import { getProviderSelfHealing } from "@/system";

const selfHealing = getProviderSelfHealing();
const scores = selfHealing.getScores();        // 所有 Provider 评分
const neteaseScore = selfHealing.getScore("netease"); // 单个 Provider
const sorted = selfHealing.getSortedPriorities();    // 按评分排序
```

---

## 健康检查

在 `/diagnostics` → Provider tab 查看实时评分和健康状态。
