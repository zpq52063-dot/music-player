# Project Governance

> Phase 11 — 项目治理规则 | 2026-05-24

---

## 治理总则

本项目采用**分层治理**模型。每层有独立的治理规则，层间通过明确接口通信。

---

## 1. 模块治理

### 分层架构治理

```
types/ (零依赖层)
  ← 被所有上层依赖，本身不依赖任何业务模块
  治理: 类型定义不可包含运行时逻辑

stores/ (状态层)
  ← 依赖 types/，不依赖 hooks/components/services
  治理: Action 使用 get() 而非闭包 state

lib/ (核心库层)
  ← 依赖 types/，不依赖 stores/components
  治理: 单例模式，不可创建多个实例

hooks/ (桥接层)
  ← 依赖 stores/ + lib/，不依赖 components/services
  治理: 逻辑与 UI 分离，返回数据 + actions

services/ (数据层)
  ← 依赖 lib/supabase/ + types/，不依赖 hooks/components
  治理: 所有外部数据操作必须经 services

components/ (UI层)
  ← 依赖 hooks/ + stores/ + ui/，不依赖 services
  治理: ui/ 零业务依赖，其他组件按功能域划分

app/ (路由层)
  ← 依赖 components/ + hooks/，不依赖 services/stores
  治理: Server Component 用于数据，Client Component 用于交互

system/ (系统层, Phase 9)
  ← 依赖 stores/ + lib/ + music-source/
  治理: 只读监控，自动恢复，不可修改业务状态

platform/ (平台层, Phase 10)
  ← 依赖 stores/ + lib/ + system/
  治理: 配置管理，热更新，备份恢复
```

### 跨层违规检测

| 违规 | 检测方式 | 示例 |
|------|---------|------|
| 循环依赖 | ESLint import/no-cycle | A → B → A |
| 反向依赖 | RuntimeGovernanceChecker | component → service (应走 hook) |
| 越级依赖 | 代码审查 | component → supabase (应走 service → hook) |

---

## 2. Store 治理

### 注册规则

1. 新 Store 文件放在 `src/stores/`，命名 `xxxStore.ts`
2. 类型定义在 `src/types/xxx.ts`
3. Store 导出 hook 函数 (`useXxxStore`)，不直接导出 store
4. 不要添加到 `src/stores/index.ts` (那是 Phase 1 的导出文件)

### 数据流规则

```
Server State (Supabase)
  → React Query (useQuery/useMutation)
    → Hook → Component

Client State (local)
  → Zustand Store
    → Hook → Component

界限:
  - 服务端数据 → React Query (不要放进 Zustand)
  - UI 状态 → Zustand (不要放进 React Query)
```

### Store 数量控制

- 当前: 12 个 Stores
- 上限: 15 个 (超过需要架构审查)
- 新 Store 必须有明确的单一职责

---

## 3. Provider 治理

### 注册规则

1. 所有 Provider 实现 `MusicProvider` 接口
2. 注册到 `ProviderManager` (通过 `providers/index.ts`)
3. MockProvider 永远排在最后 (P99)
4. 移除 Provider 前必须先有替代方案

### Fallback 链治理

```
优先级顺序 (不可更改):
  netease (P0) → qq (P1) → kuwo (P2) → mock (P99)

修改条件:
  - 新增 Provider 可插队 (调整优先级数字)
  - mock 永远在最后
  - 至少保留 2 个真实 Provider + 1 个 mock
```

### Provider 健康治理

| 参数 | 值 | 不可修改 |
|------|-----|---------|
| 评分公式 | latency(30%) + health(70%) | ✅ |
| 降级阈值 | compositeScore < 30 | 可调 |
| 恢复阈值 | compositeScore >= 70 | 可调 |
| 探测间隔 | 30s | 可调 |
| 失败冷却 | 5min | 可调 |

---

## 4. Recovery 治理

### 三层恢复不可降级

| Layer | 系统 | 要求 |
|-------|------|------|
| L1 自动 | Watchdog + SelfHealing | 必须始终运行 |
| L2 启动 | StartupRecoveryPipeline | 应用启动时执行 |
| L3 手动 | DisasterRecovery | 用户可触发 |

### 恢复检查点

- 在关键操作前创建: 配置变更、Provider 切换
- 最多保留 5 个检查点
- 存储: localStorage (`music_recovery_checkpoints`)

---

## 5. Cache 治理

### 三层缓存

| 层 | 技术 | 治理 |
|----|------|------|
| L1 Memory | SearchCache + APICache | GC 自动 + CacheGovernance 10min |
| L2 IndexedDB | 5 Object Stores | 歌词7天、历史500条上限 |
| L3 SW | Cache API | sw.ts 定义的分层策略 |

### 清理规则

```
歌词缓存: > 7天 → 清理
播放历史: > 500条 → 清理
元数据: > 30天 → 清理
IndexedDB 总量: > 2000条目 → 清理最旧
```

---

## 6. 代码变更治理

### 变更分类

| 类型 | 审批要求 | 示例 |
|------|---------|------|
| 文档 | 无 | 更新 .md 文件 |
| Bug 修复 | 验证构建 | 修复已知问题 |
| 功能新增 | 计划审核 | 新 Phase 开发 |
| 架构变更 | 严格审核 | 修改禁止区域 |
| 依赖升级 | 测试验证 | 升级 package |

### 禁止区域修改流程

如果必须修改禁止区域:
1. 先更新本文相关规则
2. 在 `docs/AI_CONTEXT_RECOVERY.md` 中更新禁止清单
3. 运行全量构建 + 手动验证
4. 记录变更原因

---

## 7. 发布治理

### Release Mode

| 模式 | 条件 | 行为 |
|------|------|------|
| debug | `NEXT_PUBLIC_RELEASE_MODE=debug` | 全部调试功能启用 |
| internal | `NEXT_PUBLIC_RELEASE_MODE=internal` | 内部测试 |
| release | `NEXT_PUBLIC_RELEASE_MODE=release` | 生产环境，无调试功能 |

### 发布检查清单

参见 `release/RELEASE_CHECKLIST.md`

---

## 8. 文档治理

### 必须保持更新的文件

| 文件 | 触发器 | 优先级 |
|------|--------|--------|
| docs/AI_CONTEXT_RECOVERY.md | 任何代码变更 | 最高 |
| AI_PROJECT_INDEX.md | Phase 变更 | 最高 |
| PROGRESS.md | 完成开发任务 | 高 |
| ARCHITECTURE_STATE.md | 架构变化 | 高 |
| MODULE_MAP.md | 新模块/依赖变更 | 中 |
| TECHNICAL_DEBT.md | 新发现技术债 | 中 |
| PROJECT_GOVERNANCE.md | 规则变更 | 低 |

---

> **治理不是限制，是让项目可持续。** 违反治理规则的技术债在未来会被追缴。
> Phase 11 — AI原生最终工程体系 | 2026-05-24
