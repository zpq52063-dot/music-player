# Recovery Pipeline

> Phase 10 — 恢复管线全景 | 2026-05-24

---

## 三层恢复体系

### Layer 1: 自动恢复 (Watchdog + SelfHealing)
- **触发:** 系统检测到异常 (卡顿/超时/URL失效)
- **动作:** 自动 resume→reload→skip→provider_fallback
- **用户:** 无感知

### Layer 2: 启动恢复 (StartupRecoveryPipeline)
- **触发:** 应用启动
- **动作:** 恢复音量/模式/静音/歌曲ID/队列/Provider
- **用户:** 看到上次播放状态

### Layer 3: 灾难恢复 (DisasterRecovery)
- **触发:** 用户手动 / 系统严重异常
- **动作:** Quick/Full/Nuclear 三种级别
- **用户:** 主动操作

---

## 恢复优先级矩阵

| 故障类型 | Layer1 | Layer2 | Layer3 | 用户干预 |
|---------|--------|--------|--------|---------|
| 播放卡死 | ✅ Watchdog | — | — | 可选跳过 |
| 加载超时 | ✅ Watchdog | — | — | 可选重新播放 |
| URL失效 | ✅ Watchdog | — | — | 无需 |
| Provider失效 | ✅ SelfHealing | — | — | 可调整优先级 |
| 应用崩溃 | ✅ ErrorBoundary | ✅ StartupRecovery | ✅ Nuclear | 刷新页面 |
| 数据损坏 | — | — | ✅ FullRecover | 导入备份 |
| 存储满 | ✅ CacheGovernance | — | ✅ Nuclear | 清除缓存 |

---

## 恢复检查点

DisasterRecovery 维护 5 个最近检查点:
- 创建时机: 关键操作前 (配置变更/Provider切换)
- 存储: localStorage (music_recovery_checkpoints)
- 内容: RuntimeConfig + ProviderState + Settings + BackupBundle

```typescript
import { getDisasterRecovery } from "@/platform";

const dr = getDisasterRecovery();

// 创建检查点
await dr.createCheckpoint("full");

// 恢复
await dr.quickRecover();  // 快速: 配置 + Provider
await dr.fullRecover();   // 完整: 配置 + Provider + 数据
await dr.nuclearReset();  // 核选项: 全部重置
```
