# System Health

> Phase 9 — 系统健康状态 | 2026-05-24

---

## 当前系统状态

| 指标 | 状态 |
|------|------|
| 构建 | ✅ TypeScript 0 errors, ESLint 0 errors, Build success |
| 源文件数 | 166 个 (.ts/.tsx/.css) |
| 阶段 | Phase 9 — 最终稳定化完成 |

---

## 核心系统健康

### Watchdog (PlaybackWatchdog)

| 项目 | 值 |
|------|-----|
| 检测间隔 | 2s |
| 卡顿阈值 | 5s (currentTime 无变化) |
| 超时阈值 | 30s (loading 状态) |
| 自动恢复 | resume → reload → skip_to_next |
| 文件 | `src/system/watchdog/PlaybackWatchdog.ts` |

### Provider Self-Healing

| 项目 | 值 |
|------|-----|
| 评分引擎 | latency(30%) + health(70%) |
| 降级阈值 | compositeScore < 30 |
| 恢复阈值 | compositeScore >= 70 |
| 失败冷却 | 5min |
| 探测间隔 | 30s |
| 文件 | `src/system/recovery/ProviderSelfHealing.ts` |

### Cache Governance

| 项目 | 值 |
|------|-----|
| 清理间隔 | 10min |
| 歌词最大天数 | 7天 |
| 历史最大条目 | 500 |
| 元数据最大天数 | 30天 |
| IndexedDB 总上限 | 2000条目 |
| 文件 | `src/system/cleanup/CacheGovernance.ts` |

### Telemetry

| 项目 | 值 |
|------|-----|
| 存储 | localStorage 环形buffer |
| 最大条目 | 1000 |
| 持久化间隔 | 30s |
| Provider 指标 | requests/success/fail/latency |
| 播放指标 | plays/stalls/skips/errors/recoveries |
| 文件 | `src/system/telemetry/TelemetryService.ts` |

---

## 已注册的全局单例

```
PlaybackWatchdog         → system/watchdog/PlaybackWatchdog.ts
ProviderSelfHealingSystem → system/recovery/ProviderSelfHealing.ts
CacheGovernanceSystem     → system/cleanup/CacheGovernance.ts
TelemetryService          → system/telemetry/TelemetryService.ts
StartupRecoveryPipeline   → system/recovery/StartupRecoveryPipeline.ts
```

---

## 挂载点

```
AudioProvider (src/components/layout/AudioProvider.tsx)
  └── useSystemWatchdog()  ← Phase 9 总Hook
      ├── PlaybackWatchdog.start()
      ├── CacheGovernance.start()
      ├── Telemetry.start()
      ├── ProviderSelfHealing.evaluate()
      └── StartupRecoveryPipeline.execute()
```

---

## 当前 Release Mode

默认 `debug` 模式。通过 `NEXT_PUBLIC_RELEASE_MODE` 环境变量控制。

| 模式 | Debug Overlay | Diagnostics Page | Watchdog | Telemetry | Logging |
|------|--------------|-----------------|----------|-----------|---------|
| debug | ✅ | ✅ | ✅ | ✅ | ✅ |
| internal | ❌ | ✅ | ✅ | ✅ | ❌ |
| release | ❌ | ❌ | ✅ | ❌ | ❌ |
