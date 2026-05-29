# AI Autonomy Runtime

> Phase 12 — AI自治运行时说明 | 2026-05-24

---

## 概述

AI自治系统让项目可长期自主维护，无需人工持续介入。

核心模块: `src/ecosystem/ai-autonomy/AIAutonomyManager.ts`

---

## 自治任务

| 任务类型 | 频率 | 描述 |
|----------|------|------|
| `system_report` | 每小时 | 生成系统健康报告 |
| `governance_check` | 每30分钟 | 运行治理管道检查 |
| `snapshot_capture` | 每2小时 | 捕获架构快照 |
| `provider_health` | 按需 | Provider健康检查 |
| `issue_tracker` | 按需 | 问题扫描与追踪 |
| `maintenance_advice` | 按需 | 生成维护建议 |
| `debt_scan` | 按需 | 技术债扫描 |

---

## 单例

```typescript
import { getAIAutonomy } from "@/ecosystem/ai-autonomy";
const autonomy = getAIAutonomy();
```

## 生命周期

```typescript
autonomy.start();  // 启动所有定时任务
autonomy.stop();   // 停止所有定时任务
```

启动时自动执行一次 governance_check。

---

## 系统健康报告

`generateSystemHealthReport()` 生成包含以下内容的报告:

- Provider健康评分 (基于 successRate + latency)
- 缓存健康状态 (memory / indexeddb / sw)
- Store健康状态
- Recovery系统状态 (3层)
- 未解决问题列表
- 维护建议

报告持久化到 localStorage (`music_ai_last_report`)。

---

## 问题追踪

```typescript
autonomy.addIssue({
  title: "Provider netease 响应超时",
  category: "provider",
  severity: "high",
  description: "连续5次请求超时",
  recommendation: "检查API代理状态或切换Provider",
});

autonomy.resolveIssue("issue-1234567890");

// 获取未解决问题
const openIssues = autonomy.getOpenIssues();
```

问题分类: provider / cache / store / recovery / performance / security

---

## 配置

参见 `DEFAULT_AI_AUTONOMY_CONFIG` in `types/phase12.ts`:

```typescript
{
  enabled: true,
  autoReportInterval: 3600000,       // 1h
  autoGovernanceCheckInterval: 1800000, // 30min
  autoSnapshotInterval: 7200000,     // 2h
  autoDocUpdateEnabled: true,
  maxIssueHistory: 500,
  persistReports: true,
}
```

---

> 此系统确保未来任何新AI接手时，可通过系统历史报告立即了解项目当前健康状态。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
