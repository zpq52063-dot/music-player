# Runtime Architecture

> Phase 10 — 运行时架构 | 2026-05-24

---

## 系统分层

```
应用层 (UI)
  ├── SettingsPage (runtime config UI)
  ├── DiagnosticsPage (system health UI)
  └── DebugOverlay (real-time state)

平台层 (src/platform/)
  ├── RuntimeConfigManager    ← 动态配置中心
  ├── ProviderHotReloadSystem ← Provider 热更新
  ├── BackupManager           ← 数据备份
  ├── MigrationPipeline       ← 数据迁移
  ├── MemoryMonitor           ← 内存监控
  ├── SystemIntegrity         ← 完整性检查
  └── DisasterRecovery        ← 灾难恢复

系统层 (src/system/)
  ├── PlaybackWatchdog        ← 播放看门狗
  ├── ProviderSelfHealing     ← Provider 自愈
  ├── CacheGovernance         ← 缓存治理
  ├── TelemetryService        ← 遥测
  └── StartupRecoveryPipeline ← 启动恢复
```

---

## 启动顺序

```
1. AuthProvider mount
2. AudioProvider mount
3. useSystemWatchdog()
   ├── TelemetryService.start()
   ├── CacheGovernance.start()
   ├── PlaybackWatchdog.start()
   ├── ProviderSelfHealing init
   └── StartupRecoveryPipeline.execute()
4. Platform systems (lazy init on first access)
   ├── RuntimeConfigManager (first getRuntimeConfig() call)
   ├── ProviderHotReloadSystem (first getProviderHotReload() call)
   ├── MigrationPipeline (first getMigrationPipeline() call)
   └── MemoryMonitor.start() (optional, debug mode only)
```

---

## Runtime Config 生效链

```
localStorage (music_runtime_config)
  → RuntimeConfigManager.loadConfig()
    → ENV overrides (NEXT_PUBLIC_*)
      → Runtime overrides (applyOverride)
        → merged config
          → ProviderHotReloadSystem
          → CacheGovernance
          → Debug settings
```

---

## 备份链路

```
用户触发导出
  → BackupManager.createBackup(scope)
    → exportPlaylists() (IndexedDB)
    → exportLikedSongs() (localStorage)
    → exportConfig() (localStorage)
    → exportCacheIndex() (IndexedDB)
    → computeChecksum()
    → JSON.stringify(bundle)
      → download / copy / restore
```

---

## 灾难恢复链路

```
Nuclear Reset:
  → DisasterRecovery.nuclearReset()
    → RuntimeConfigManager.resetToDefaults()
    → ProviderHotReloadSystem.reset()
    → 清除 localStorage (保留 auth)
    → 删除所有 IndexedDB
    → 清除恢复检查点
    → window.location.reload()

Quick Recovery:
  → DisasterRecovery.quickRecover()
    → 恢复 RuntimeConfig
    → 重置 Provider 热更新
```
