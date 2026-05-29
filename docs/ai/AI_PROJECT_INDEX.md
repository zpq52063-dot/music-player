# AI Project Index

> **最高优先级文档** — 新 AI 只看此文件即可理解整个项目。
> Phase 11 | 2026-05-24

---

## 1. 项目摘要

**私用移动端音乐播放器 WebApp** — 类似 Apple Music + 网易云音乐体验。

- 目标平台: iPhone Safari PWA → Capacitor iOS
- 用户规模: 少量朋友使用，不考虑商业化
- 当前阶段: **Phase 11 — AI原生最终工程体系**
- 源文件数: 174 (.ts/.tsx/.css)

---

## 2. 当前技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.1.x |
| 语言 | TypeScript (strict) | 5.7 |
| 样式 | TailwindCSS | 3.4 |
| 状态 | Zustand | 5.0 |
| 数据库 | Supabase (PostgreSQL) | 2.x |
| PWA | serwist | 9.x |
| 图标 | @tabler/icons-react | 3.28 |
| 部署 | Vercel | — |

---

## 3. 当前架构全景

```
┌────────────────────────────────────────────┐
│                   UI 层                     │
│  pages/ ← components/ ← hooks/ ← stores/   │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────┴─────────────────────────┐
│                服务层                        │
│  services/ ← music-source/ ← lib/          │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────┴─────────────────────────┐
│              系统 & 平台层                   │
│  system/ (Phase 9) + platform/ (Phase 10)  │
│  watchdog / self-healing / recovery /      │
│  config / backup / migration               │
└──────────────────┬─────────────────────────┘
                   │
┌──────────────────┴─────────────────────────┐
│              基础设施                        │
│  Supabase / IndexedDB / SW Cache           │
│  Vercel / Capacitor / Cloudflare(预留)      │
└────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → Component → Hook → Service → Supabase
                 ↘ Store → UI 更新

搜索:
  用户输入 → useSearch(debounce 300ms)
    → SearchService(缓存+去重)
      → Provider(音源)
        → API Route(/api/music/*)
```

---

## 4. 核心目录树 (精简)

```
src/
├── app/           # Next.js App Router (6 routes)
├── types/         # TypeScript 类型 (15文件, 零依赖)
├── stores/        # Zustand (12 stores)
├── hooks/         # 自定义 Hooks (20 files)
├── lib/           # 核心库 (AudioManager/LyricParser/Logger)
├── components/    # UI (14个子目录)
├── services/      # 数据服务 (supabase + social + cache + recovery)
├── storage/       # IndexedDB (5 Object Stores)
├── music-source/  # 音源抽象层 (Provider Adapter)
├── system/        # Phase 9 系统层 (watchdog/recovery/cleanup/telemetry)
├── platform/      # Phase 10 平台层 (config/backup/migration/update/runtime/recovery)
└── server/api/    # API Routes (11 端点, Phase 7)

docs/
├── ai/            ★ AI 协同开发中心 (核心文档 + runtime/)
├── deployment/    # 部署指南
├── self-host/     # 自托管指南
└── PROJECT_RULES.md / ARCHITECTURE_STATE.md / MODULE_MAP.md / PROGRESS.md
```

---

## 5. Store 关系图 (12 个)

```
musicPlayerStore  ← 播放核心 (23 actions)
uiStore           ← UI 开关 (5 actions)
searchStore       ← 搜索状态 (11 actions)
userStore         ← 认证状态 (3 actions)
libraryStore      ← 乐观更新 ID (6 actions)
playlistStore     ← 歌单 UI 弹窗 (5 actions)
socialStore       ← 评论 UI (3 actions)
systemStore       ← 系统元状态 (9 actions)
providerStore     ← Provider UI (6 actions)
settingsStore     ← 用户设置 (7 actions, localStorage)
+ React Query     ← 服务端状态 (AuthProvider包裹)
```

**依赖方向:** types/ → stores/ → hooks/ → components/ → app/

---

## 6. Provider 状态矩阵

| Provider | 优先级 | 来源类型 | 健康检测 | Fallback |
|----------|--------|---------|---------|----------|
| netease  | P0     | 代理 (API Route) | 滑动窗口评分 | → qq |
| qq       | P1     | 代理 (API Route) | 滑动窗口评分 | → kuwo |
| kuwo     | P2     | 代理 (API Route) | 滑动窗口评分 | → mock |
| mock     | P99    | 本地数据 (52首) | 始终健康 | 无 (最终兜底) |
| bilibili | 预留   | 代理 (API Route) | — | — |

**Fallback 链:** netease → qq → kuwo → mock (自动降级，用户无感知)

---

## 7. Recovery 链路

```
Layer 1: 自动恢复 (秒级)
  PlaybackWatchdog → 2s检测 → resume/reload/skip
  ProviderSelfHealing → 评分→降级→探测→恢复

Layer 2: 启动恢复 (启动时)
  StartupRecoveryPipeline → 恢复配置/音量/模式/歌曲

Layer 3: 灾难恢复 (手动)
  DisasterRecovery → Quick/Full/Nuclear 三级
```

---

## 8. 部署结构

| 服务 | 状态 | 用途 |
|------|------|------|
| Vercel | 待部署 | Next.js 应用托管 |
| Supabase | Schema ready | PostgreSQL + Auth + RLS |
| Cloudflare Workers | 架构预留 | API 代理 + 缓存 |
| Capacitor iOS | 配置完成 | TestFlight 分发 |
| IndexedDB | ✅ 运行中 | 5 Object Stores 本地缓存 |
| Service Worker | ✅ 运行中 | 分层缓存 (static/images/api/fonts) |

**环境变量:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_RELEASE_MODE

---

## 9. 禁止修改区域

### 绝对禁止 (删除或修改会导致系统崩溃)

- `src/lib/audio/AudioEngine.ts` — Phase 1 legacy
- `src/stores/playerStore.ts` — Phase 1 legacy
- `src/components/ui/` — 全部4个基础组件 (GlassCard/LazyImage/Skeleton/IconButton)
- `src/music-source/types/provider.ts` — MusicProvider 接口定义
- `src/music-source/providers/mock/MockProvider.ts` — 永久兜底
- `src/music-source/providers/provider-manager/ProviderManager.ts` — Fallback链核心
- `src/system/watchdog/PlaybackWatchdog.ts` — 自动恢复核心
- `src/system/recovery/ProviderSelfHealing.ts` — 自愈算法
- `src/platform/recovery/DisasterRecovery.ts` — 灾难恢复
- `src/services/recovery/PlaybackRecoverySystem.ts` — 播放恢复
- `src/components/error/ErrorBoundary.tsx` — 崩溃保护
- `src/stores/settingsStore.ts` — localStorage持久化核心
- `src/storage/CacheDB.ts` — IndexedDB核心封装
- `src/app/globals.css` — 全局样式体系 (.glass/.card/.skeleton)

### 可扩展但不重构

- `src/stores/musicPlayerStore.ts` — 可新增字段/actions，不可改已有API
- `src/lib/audio/AudioManager.ts` — 可新增方法，不可改已有API
- `src/music-source/providers/` — 可新增Provider，不可改接口
- `src/music-source/hooks/` — 可新增hooks，不可改已有返回值
- `src/components/library/` — 可新增tab，不可改已有逻辑

完整清单见 [AI_CONTEXT_RECOVERY.md §9](../AI_CONTEXT_RECOVERY.md#9-当前禁止重构模块)

---

## 10. 当前已知风险

| 风险 | 等级 | 影响 |
|------|------|------|
| 真实数据未连接 | P0 | 应用数据来自MockProvider (52首) |
| Vercel 未部署 | P0 | 无法通过URL访问 |
| 零单元测试 | P1 | 重构风险高 |
| Provider API 代理未接入真实URL | P1 | Provider 实际不可用 |
| iOS 首次播放需手势 | Medium | Safari AudioContext 策略 |
| Audio 单例限制 | Low | 快速切歌短暂静默 (已由Watchdog缓解) |

详见 [PROVIDER_RISK_ANALYSIS.md](PROVIDER_RISK_ANALYSIS.md) 和 [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)

---

## 11. 技术债概览

| 债项 | 类型 | 优先级 |
|------|------|--------|
| Mock数据替代Supabase真实查询 | 数据 | P0 |
| 零测试覆盖 | 质量 | P1 |
| React Query Cache Key 硬编码 | 架构 | P2 |
| 下载功能仅预留 | 功能 | P2 |
| Cloudflare Workers 未部署 | 部署 | P3 |
| iPad 横屏未适配 | 体验 | P3 |

详见 [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)

---

## 12. 维护优先级

| 优先级 | 项目 | 状态 |
|--------|------|------|
| P0 | Supabase 真实数据连接 | 待实施 |
| P0 | Vercel 生产部署 | 待实施 |
| P1 | 真实 API URL 配置 | 待实施 |
| P1 | 单元测试 (vitest) | 待实施 |
| P1 | Capacitor iOS 实机构建 | 待实施 |
| P2 | 用户个人页 | 待实施 |
| P2 | 双语歌词 | 待实施 |
| P3 | Cloudflare Workers 部署 | 待实施 |
| P3 | iPad 横屏适配 | 待实施 |

---

## 13. 长期路线图

```
Phase 11 (当前)  → AI原生工程体系 + 自动运维
Phase 12 (未来)  → 真实数据连接 + Vercel部署
Phase 13 (未来)  → 单元测试 + CI/CD
Phase 14 (未来)  → 多设备同步 + NAS音源
Phase 15 (未来)  → WebDAV + 自建音源 + 家庭共享
```

详见 [LONG_TERM_EVOLUTION.md](LONG_TERM_EVOLUTION.md)

---

## 14. 快速链接

| 文档 | 用途 |
|------|------|
| [AI_CONTEXT_RECOVERY.md](../AI_CONTEXT_RECOVERY.md) | 完整上下文恢复 (2015行) |
| [AI_ONBOARDING_PROTOCOL.md](AI_ONBOARDING_PROTOCOL.md) | 新AI接手10步SOP |
| [AI_RECOVERY_BOOTSTRAP.md](AI_RECOVERY_BOOTSTRAP.md) | 灾难级恢复方案 |
| [PROJECT_GOVERNANCE.md](PROJECT_GOVERNANCE.md) | 项目治理规则 |
| [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | 技术债追踪 |
| [PROVIDER_RISK_ANALYSIS.md](PROVIDER_RISK_ANALYSIS.md) | Provider风险评估 |
| [DEPLOYMENT_SNAPSHOT.md](DEPLOYMENT_SNAPSHOT.md) | 部署结构快照 |
| [LONG_TERM_EVOLUTION.md](LONG_TERM_EVOLUTION.md) | 长期演进路线 |
| [RUNTIME_ARCHITECTURE.md](RUNTIME_ARCHITECTURE.md) | 运行时架构 |
| [RECOVERY_PIPELINE.md](RECOVERY_PIPELINE.md) | 恢复管线 |
| [PROVIDER_RUNTIME.md](PROVIDER_RUNTIME.md) | Provider运行时 |
| [SYSTEM_HEALTH.md](SYSTEM_HEALTH.md) | 系统健康状态 |

---

> **这份文件是项目最高的索引文档。保持更新，永远不要让它过时。**
> Phase 11 — AI原生最终工程体系 | 2026-05-24
