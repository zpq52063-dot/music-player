# Ecosystem Architecture

> Phase 12 — 生态系统架构 | 2026-05-24

---

## 架构全景

```
┌─────────────────────────────────────────────────────┐
│                   Ecosystem Layer                     │
│                                                       │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Local Media │  │ WebDAV   │  │ NAS           │   │
│  │ Provider    │  │ Provider │  │ Provider      │   │
│  │ (active)    │  │ (预留)    │  │ (预留)         │   │
│  └──────┬──────┘  └────┬─────┘  └───────┬───────┘   │
│         │              │                │            │
│         └──────────────┼────────────────┘            │
│                        │                             │
│  ┌─────────────────────┼─────────────────────────┐   │
│  │              MediaScanner                       │   │
│  │         (文件扫描 / hash / metadata)            │   │
│  └─────────────────────┼─────────────────────────┘   │
│                        │                             │
│  ┌─────────────────────┼─────────────────────────┐   │
│  │            AI Autonomy Layer                    │   │
│  │  ┌────────────────┐  ┌──────────────────────┐  │   │
│  │  │ AIAutonomy     │  │ GovernancePipeline   │  │   │
│  │  │ Manager        │  │ (5-stage auto check) │  │   │
│  │  └───────┬────────┘  └──────────┬───────────┘  │   │
│  │          │                      │               │   │
│  │  ┌───────┴────────┐  ┌─────────┴───────────┐   │   │
│  │  │ DegradedRuntime│  │ SystemStatusPage    │   │   │
│  │  │ Mode           │  │ (UI component)      │   │   │
│  │  └────────────────┘  └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                             │
│  ┌─────────────────────┼─────────────────────────┐   │
│  │           ProjectArchiveSystem                  │   │
│  │    (配置/状态/Provider/Docs 导出与封存)          │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                             │
│  ┌─────────────────────┼─────────────────────────┐   │
│  │              SyncManager (预留)                  │   │
│  │        (本地 ↔ 远程 数据同步)                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 模块依赖

```
ecosystem/
├── local-media/     ← 依赖 types/ (Phase 12 类型)
├── webdav/          ← 依赖 types/
├── nas/             ← 依赖 types/
├── sync/            ← 依赖 types/
├── scanner/         ← 依赖 types/
├── ai-autonomy/     ← 依赖 types/ + system/ + music-source/
└── archive/         ← 依赖 types/ + music-source/
```

**单向依赖** — ecosystem 是顶层，可依赖所有下层模块，但下层模块不可依赖 ecosystem。

---

## 与现有架构的关系

```
types/ (Phase 12 types added)
  ↑
stores/ / lib/ / music-source/
  ↑
hooks/ / services/
  ↑
components/ / app/
  ↑
system/ (Phase 9 + 11) ← ecosystem 可调用
  ↑
platform/ (Phase 10)   ← ecosystem 可调用
  ↑
ecosystem/ (Phase 12)  ★ 新顶层 — 生态闭环
```

---

## 核心单例

| 单例 | 获取方式 | 文件 |
|------|---------|------|
| LocalMediaProvider | `getLocalMediaProvider()` | `ecosystem/local-media/` |
| MediaScanner | `getMediaScanner()` | `ecosystem/scanner/` |
| AIAutonomyManager | `getAIAutonomy()` | `ecosystem/ai-autonomy/` |
| GovernancePipeline | `getGovernancePipeline()` | `ecosystem/ai-autonomy/` |
| DegradedRuntimeMode | `getDegradedRuntime()` | `ecosystem/ai-autonomy/` |
| ProjectArchiveSystem | `getArchiveSystem()` | `ecosystem/archive/` |
| WebDAVProvider | `getWebDAVProvider()` | `ecosystem/webdav/` |
| NASProvider | `getNASProvider()` | `ecosystem/nas/` |
| SyncManager | `getSyncManager()` | `ecosystem/sync/` |

---

## 运行时模式

通过 `DegradedRuntimeMode` 自动切换:

```
full_online → partial (部分Provider失效)
           → severe (所有远程Provider失效)
           → offline (网络断开)
```

每种模式有明确的功能限制和可用Provider。

---

> 此架构确保项目可在任何条件下运行，从完整在线到完全离线。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
