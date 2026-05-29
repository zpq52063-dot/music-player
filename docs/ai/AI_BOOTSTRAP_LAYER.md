# AI Bootstrap Layer

> **新AI最短路径接管项目** | Phase 13 — 2026-05-24
>
> 任何新AI实例，阅读本文后5分钟内即可理解项目并开始工作。

---

## 第一步: 必读文档 (按优先级)

| # | 文档 | 阅读时间 | 为什么 |
|---|------|---------|--------|
| 1 | [AI_CONTEXT_RECOVERY.md](../AI_CONTEXT_RECOVERY.md) | 3min | **最重要** — 项目完整上下文 |
| 2 | [AI_PROJECT_INDEX.md](AI_PROJECT_INDEX.md) | 1min | 项目最高优先级索引 |
| 3 | [FINAL_FREEZE_STATE.md](FINAL_FREEZE_STATE.md) | 1min | 冻结架构+禁止修改 |
| 4 | [PROJECT_GOVERNANCE.md](PROJECT_GOVERNANCE.md) | 1min | 分层治理规则 |
| 5 | [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | 1min | 已知技术债+永久风险 |

---

## 第二步: 理解架构 (5层)

```
Layer 0 — types/               零依赖，所有上层依赖此层
Layer 1 — stores/ + lib/       状态管理 + 核心库
Layer 2 — hooks/ + services/   桥接层 + 数据层
Layer 3 — components/ + app/   UI层 + 路由层
Layer 4 — system/ + platform/ + ecosystem/ + frozen-runtime/
          ↑ 系统层 (只读监控 + 自动恢复)  ← 最高层
```

---

## 第三步: 核心模块速览

### 绝对不能动 (37个)
```
src/lib/audio/AudioManager.ts              — 音频唯一单例
src/music-source/types/provider.ts         — Provider接口
src/music-source/providers/mock/           — 永久兜底
src/music-source/providers/provider-manager/ — Provider管理核心
src/system/watchdog/                        — 播放看门狗
src/system/recovery/                        — 自愈系统
src/platform/recovery/                      — 灾难恢复
src/ecosystem/ai-autonomy/                  — AI自治核心
src/frozen-runtime/                         — 冻结运行时 (Phase 13新增)
src/components/ui/                          — 基础UI组件
src/storage/CacheDB.ts                      — IndexedDB核心
src/app/sw.ts                               — SW缓存策略
```

### 可以扩展
- `src/stores/` — 可新增Store (不改已有签名)
- `src/hooks/` — 可新增hook
- `src/components/` — 可新增组件
- `src/music-source/providers/` — 可新增Provider实现
- `src/services/` — 可新增服务

---

## 第四步: 当前状态一览

| 系统 | 状态 |
|------|------|
| FrozenRuntime | 🔒 active |
| AutonomousMaintenanceLoop | 🔄 running |
| RuntimeIsolation | 🛡️ active |
| SelfHealingGovernance | 💚 active |
| DisasterRecoveryProtocol | ✅ ready |
| Deploy Status | local dev |
| Data | Mock (未连接Supabase) |

---

## 第五步: 核心约束

1. ⛔ 禁止修改 `MusicProvider` 接口
2. ⛔ 禁止删除 `MockProvider`
3. ⛔ 禁止修改 `ProviderManager` fallback 链
4. ⛔ 禁止删除/禁用恢复系统
5. ✅ 新功能通过**扩展**实现，不通过修改实现
6. ✅ 所有数据请求通过 `hooks → SearchService` 链路
7. ✅ 使用简体中文进行所有沟通

---

## 第六步: 快速诊断命令

```typescript
// 查看系统健康
import { getAIAutonomy } from "@/ecosystem/ai-autonomy";
const report = await getAIAutonomy().generateSystemHealthReport();

// 查看冻结状态
import { getFrozenRuntime } from "@/frozen-runtime";
const state = getFrozenRuntime().getState();

// 运行治理检查
import { getGovernancePipeline } from "@/ecosystem/ai-autonomy";
const result = await getGovernancePipeline().run();

// 查看维护状态
import { getMaintenanceLoop } from "@/frozen-runtime";
const report = getMaintenanceLoop().getLastReport();
```

---

> **你不需要记住所有细节。只需要记住: 冻结模块不能动，其他都可以通过扩展实现。**
> Phase 13 — 最终长期冻结版 | 2026-05-24
