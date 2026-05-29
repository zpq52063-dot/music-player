# Final Project Structure

> Phase 10 — 最终项目结构全景 | 2026-05-24

---

## 完整目录树

```
music-player/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # RootLayout (Server)
│   │   ├── page.tsx                  # Home (Server)
│   │   ├── loading.tsx               # 加载动画
│   │   ├── error.tsx                 # 错误边界
│   │   ├── globals.css               # Apple Music 主题
│   │   ├── sw.ts                     # Service Worker
│   │   ├── diagnostics/
│   │   │   └── page.tsx              # /diagnostics (Phase 9)
│   │   ├── library/
│   │   │   └── page.tsx              # /library (Phase 4)
│   │   ├── playlist/
│   │   │   └── [id]/page.tsx         # /playlist/[id] (Phase 5)
│   │   ├── song/
│   │   │   └── [id]/page.tsx         # /song/[id] (Phase 5)
│   │   ├── settings/
│   │   │   └── page.tsx              # /settings (Phase 8)
│   │   └── api/music/                # API Routes (Phase 7, 11 端点)
│   │
│   ├── types/                        # TypeScript 类型 (零依赖)
│   │   ├── song.ts                   # Song (12 fields)
│   │   ├── playlist.ts               # Playlist (8 fields)
│   │   ├── user.ts                   # Profile, PlayHistory
│   │   ├── player.ts                 # Phase 1 types
│   │   ├── music.ts                  # Phase 2 types
│   │   ├── library.ts                # Phase 4 types
│   │   ├── social.ts                 # Phase 5 types
│   │   ├── system.ts                 # Phase 6 types
│   │   ├── provider.ts               # Phase 7 types
│   │   ├── recovery.ts               # Phase 8 types
│   │   ├── download.ts               # Phase 8 types
│   │   ├── phase9.ts                 # Phase 9 types
│   │   ├── phase10.ts                # Phase 10 types ★
│   │   └── index.ts                  # 统一导出
│   │
│   ├── stores/                       # Zustand 状态管理
│   │   ├── musicPlayerStore.ts       # Phase 2 ★ 播放器核心
│   │   ├── uiStore.ts                # Phase 1 UI状态
│   │   ├── playerStore.ts            # Phase 1 legacy
│   │   ├── searchStore.ts            # Phase 3 搜索
│   │   ├── userStore.ts              # Phase 4 认证
│   │   ├── libraryStore.ts           # Phase 4 乐观更新
│   │   ├── playlistStore.ts          # Phase 4 歌单UI
│   │   ├── socialStore.ts            # Phase 5 社交
│   │   ├── systemStore.ts            # Phase 6 系统
│   │   ├── providerStore.ts          # Phase 7 Provider
│   │   ├── settingsStore.ts          # Phase 8 设置
│   │   └── index.ts                  # Phase 1 exports
│   │
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useAudioPlayer.ts         # Phase 2 ★ 核心音频桥接
│   │   ├── usePlayerControls.ts      # Phase 2 播放控制
│   │   ├── useLyricsSync.ts          # Phase 2 歌词同步
│   │   ├── useMediaSession.ts        # Phase 6 iOS控制中心
│   │   ├── useAuth.ts                # Phase 4 匿名认证
│   │   ├── useLikedSongs.ts          # Phase 4 喜欢歌曲
│   │   ├── usePlaylist.ts            # Phase 4 歌单CRUD
│   │   ├── useRecentPlayed.ts        # Phase 4 最近播放
│   │   ├── useLibrary.ts             # Phase 4 收藏歌单
│   │   ├── useComments.ts            # Phase 5 评论
│   │   ├── useCommentLike.ts         # Phase 5 点赞
│   │   ├── useReplies.ts             # Phase 5 回复
│   │   ├── useSongDetail.ts          # Phase 5 歌曲详情
│   │   ├── usePWAInstall.ts          # Phase 6 PWA安装
│   │   ├── useNetworkState.ts        # Phase 6 网络检测
│   │   ├── useOfflineCache.ts        # Phase 6 离线缓存
│   │   ├── useAudioCache.ts          # Phase 6 音频缓存
│   │   └── usePlaybackRecovery.ts    # Phase 8 播放恢复
│   │
│   ├── lib/                          # 核心库
│   │   ├── audio/
│   │   │   ├── AudioEngine.ts        # Phase 1 legacy
│   │   │   └── AudioManager.ts       # Phase 2 ★ 单例音频
│   │   ├── lyrics/
│   │   │   └── LyricParser.ts        # Phase 2 歌词解析
│   │   ├── supabase/
│   │   │   ├── client.ts             # 浏览器端 Supabase
│   │   │   └── server.ts             # 服务端 Supabase
│   │   ├── logs/
│   │   │   └── Logger.ts             # Phase 8 日志系统
│   │   ├── constants.ts              # API_PREFIX, 默认值
│   │   └── utils.ts                  # cn(), formatTime()
│   │
│   ├── services/                     # 数据服务层
│   │   ├── songService.ts            # Phase 2 歌曲服务
│   │   ├── authService.ts            # Phase 4 认证服务
│   │   ├── likedSongsService.ts      # Phase 4 喜欢服务
│   │   ├── playlistService.ts        # Phase 4 歌单服务
│   │   ├── recentPlayedService.ts    # Phase 4 播放记录
│   │   ├── social/                   # Phase 5 社交服务
│   │   │   ├── commentService.ts
│   │   │   ├── likeService.ts
│   │   │   └── replyService.ts
│   │   ├── cache/                    # Phase 6 缓存服务
│   │   │   ├── audioCacheService.ts
│   │   │   ├── imageCacheService.ts
│   │   │   └── lyricCacheService.ts
│   │   ├── recovery/
│   │   │   └── PlaybackRecoverySystem.ts # Phase 8
│   │   └── download/
│   │       └── DownloadManager.ts    # Phase 8 预留
│   │
│   ├── storage/                      # Phase 6 IndexedDB
│   │   ├── CacheDB.ts                # 核心封装
│   │   ├── metadataStore.ts
│   │   ├── offlineStore.ts
│   │   ├── historyStore.ts
│   │   └── lyricCacheStore.ts
│   │
│   ├── components/                   # UI 组件
│   │   ├── ui/                       ★ 零业务依赖
│   │   │   ├── GlassCard.tsx
│   │   │   ├── LazyImage.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── IconButton.tsx
│   │   ├── player/                   # 播放器
│   │   ├── home/                     # 首页
│   │   ├── search/                   # Phase 3 搜索
│   │   ├── library/                  # Phase 4 我的音乐
│   │   ├── comments/                 # Phase 5 评论
│   │   ├── pwa/                      # Phase 6 PWA
│   │   ├── error/                    # Phase 8 错误边界
│   │   ├── settings/                 # Phase 8 设置
│   │   ├── seo/                      # Phase 8 SEO
│   │   ├── provider/                 # Phase 7 Provider UI
│   │   ├── debug/                    # Phase 7 调试
│   │   ├── layout/                   # 布局
│   │   └── auth/                     # 认证
│   │
│   ├── music-source/                 # Phase 3/7 音源抽象
│   │   ├── types/provider.ts         # MusicProvider 接口
│   │   ├── providers/
│   │   │   ├── mock/                 # 永久兜底
│   │   │   ├── netease/              # Phase 7
│   │   │   ├── qq/                   # Phase 7
│   │   │   ├── kuwo/                 # Phase 7
│   │   │   ├── bilibili/             # Phase 7 预留
│   │   │   └── provider-manager/     # Phase 7 管理核心
│   │   ├── cache/                    # SearchCache + APICache
│   │   ├── services/                 # SearchService + PlaybackStabilizer
│   │   └── hooks/                    # 音源 hooks
│   │
│   ├── system/                       # Phase 9 系统层
│   │   ├── watchdog/
│   │   │   └── PlaybackWatchdog.ts
│   │   ├── recovery/
│   │   │   ├── ProviderSelfHealing.ts
│   │   │   └── StartupRecoveryPipeline.ts
│   │   ├── cleanup/
│   │   │   └── CacheGovernance.ts
│   │   ├── telemetry/
│   │   │   └── TelemetryService.ts
│   │   ├── monitor/
│   │   │   ├── useSystemWatchdog.ts
│   │   │   └── ReleaseMode.ts
│   │   └── diagnostics/
│   │       ├── DevDiagnosticsPage.tsx
│   │       ├── DebugOverlay.tsx
│   │       └── DebugOverlayWrapper.tsx
│   │
│   ├── platform/                     # Phase 10 ★ 平台层
│   │   ├── config/
│   │   │   └── RuntimeConfigManager.ts
│   │   ├── backup/
│   │   │   └── BackupManager.ts
│   │   ├── migration/
│   │   │   └── MigrationPipeline.ts
│   │   ├── update/
│   │   │   └── ProviderHotReload.ts
│   │   ├── runtime/
│   │   │   ├── DeploymentMode.ts
│   │   │   ├── MemoryMonitor.ts
│   │   │   └── SystemIntegrity.ts
│   │   └── recovery/
│   │       └── DisasterRecovery.ts
│   │
│   └── server/api/
│       └── proxy-helper.ts           # Phase 7
│
├── public/                           # 静态资源
│   ├── manifest.json                 # PWA
│   ├── sw.js                         # SW 编译产物
│   └── icons/                        # PWA 图标
│
├── supabase/migrations/              # 数据库迁移
│   ├── 001_initial_schema.sql
│   ├── 002_phase4_schema.sql
│   └── 003_phase5_schema.sql
│
├── mobile/                           # Phase 8 Capacitor
│   ├── capacitor.config.ts
│   ├── ios-config/
│   └── scripts/
│
├── workers/                          # Phase 7 Cloudflare Workers (预留)
│
├── docs/                             # 项目文档
│   ├── AI_CONTEXT_RECOVERY.md         ★ 核心恢复文件
│   ├── ai/                           # AI 协同开发中心
│   │   ├── API_MAP.md
│   │   ├── STORE_MAP.md
│   │   ├── PROVIDER_MAP.md
│   │   ├── CACHE_ARCHITECTURE.md
│   │   ├── PLAYBACK_FLOW.md
│   │   ├── SYSTEM_HEALTH.md
│   │   ├── PROVIDER_HEALTH.md
│   │   ├── CURRENT_BOTTLENECKS.md
│   │   ├── DEBUG_GUIDE.md
│   │   ├── FAILURE_RECOVERY_GUIDE.md
│   │   ├── DEPLOYMENT_STATE.md
│   │   ├── CURRENT_TASK.md
│   │   ├── KNOWN_ISSUES.md
│   │   ├── RUNTIME_ARCHITECTURE.md   ★ Phase 10
│   │   ├── RECOVERY_PIPELINE.md      ★ Phase 10
│   │   ├── PROVIDER_RUNTIME.md       ★ Phase 10
│   │   ├── CACHE_RUNTIME.md          ★ Phase 10
│   │   ├── DEPLOYMENT_PROFILES.md    ★ Phase 10
│   │   ├── BACKUP_STRATEGY.md        ★ Phase 10
│   │   └── MIGRATION_GUIDE.md        ★ Phase 10
│   ├── self-host/
│   │   └── INDEX.md                  ★ Phase 10
│   ├── deployment/
│   │   ├── VERCEL_DEPLOY.md
│   │   ├── SUPABASE_CONFIG.md
│   │   ├── TESTFLIGHT_GUIDE.md
│   │   └── CAPACITOR_BUILD.md
│   ├── PROJECT_RULES.md
│   ├── ARCHITECTURE_STATE.md
│   ├── MODULE_MAP.md
│   ├── PROGRESS.md
│   └── FINAL_PROJECT_STRUCTURE.md    ★ Phase 10
│
├── release/
│   └── RELEASE_CHECKLIST.md          ★ Phase 10
│
├── deployment/
│   └── profiles.md                   ★ Phase 10
│
├── .env.example                      # Phase 9
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .eslintrc.json
```

---

## 模块依赖图

```
types/ (零依赖)
  ↓
stores/ ← types/
  ↓
lib/ ← types/ (AudioManager, LyricParser, Logger)
  ↓
hooks/ ← stores/ + lib/
  ↓
components/ ← hooks/ + stores/ + ui/
  ↓
app/ ← components/ + hooks/

services/ ← lib/supabase/ + types/
  ↑ (被 hooks/ 消费)

music-source/ ← types/
  ↑ (被 hooks/ + components/ 消费)

system/ ← stores/ + lib/ + music-source/  (Phase 9)
  ↑ (被 AudioProvider 挂载)

platform/ ← stores/ + lib/ + system/  (Phase 10)
  ↑ (被 Settings + Diagnostics 使用)
```

---

## 数据流图

```
用户操作
  → UI Component (点击/输入)
    → Hook (useXxx)
      → Service (xxxService)
        → Supabase (数据库)
      → Store (Zustand)
        → UI 更新 (React re-render)

或:
  → UI Component
    → Hook (useSearch)
      → SearchService (缓存+去重)
        → Provider (音源)
          → API Route (代理)
            → 外部 API
```

---

## Store 关系图

```
musicPlayerStore  ← 播放核心
uiStore           ← UI 开关
searchStore       ← 搜索状态
userStore         ← 认证状态
libraryStore      ← 乐观更新 ID
playlistStore     ← 歌单 UI 弹窗
socialStore       ← 评论 UI
systemStore       ← 系统元状态
providerStore     ← Provider UI
settingsStore     ← 用户设置
```

---

## Recovery 链路图

```
故障检测
  ├── PlaybackWatchdog (Phase 9) → 自动恢复
  ├── ProviderSelfHealing (Phase 9) → 自动降级/恢复
  ├── ErrorBoundary (Phase 8) → 崩溃恢复
  ├── StartupRecoveryPipeline (Phase 9) → 启动恢复
  └── DisasterRecovery (Phase 10) → 手动恢复
      ├── Quick: 配置 + Provider
      ├── Full: 配置 + Provider + 数据
      └── Nuclear: 全部重置
```

---

> **源文件: 174 个 (.ts/.tsx/.css)** | Phase 10 — 最终产品形态
