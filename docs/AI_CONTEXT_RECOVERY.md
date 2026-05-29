# AI Context Recovery

> **重要：** 即使一个完全失忆的新 AI 实例，仅阅读本文，也能立即恢复项目完整上下文并继续开发。
>
> **当前版本:** v1.0.0 (Phase 20C — Production Release, 2026-05-29)

---

## 1. 项目定位

**私用移动端音乐播放器 WebApp**

- 类似 Apple Music + 网易云音乐的体验型应用
- 少量朋友使用，不考虑商业化高并发
- 目标平台：iPhone Safari PWA
- 后续可封装为 iOS 原生体验
- **零后端依赖 / 零本地API / 零数据库依赖 (Supabase 可选)**
- **可离线前端开发 / 免费部署优先 (Vercel Hobby)**
- **当前模式: Public Audio Mode — 内置公开 demo 歌曲 (SoundHelix)，保留 Provider 架构将来接入真实音源**

---

## 2. 当前技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.1.x |
| 语言 | TypeScript (strict mode) | 5.7 |
| 样式 | TailwindCSS | 3.4 |
| 状态管理 | Zustand | 5.0 |
| 数据库 | Supabase (PostgreSQL) — **可选，当前未连接** | 2.x |
| PWA | serwist | 9.x |
| 图标 | @tabler/icons-react | 3.28 |
| 样式工具 | clsx + tailwind-merge | 2.1 / 2.6 |
| 部署 | Vercel | — |
| 包管理 | npm | — |
| 音频源 | SoundHelix 公开 MP3 (16首 Demo 歌曲) | — |

### 关键依赖（package.json 实际内容）

```json
{
  "next": "^15.1.4",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "zustand": "^5.0.3",
  "@supabase/supabase-js": "^2.47.10",
  "@supabase/ssr": "^0.5.2",
  "@serwist/next": "^9.0.10",
  "serwist": "^9.0.10",
  "@tabler/icons-react": "^3.28.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.7.2",
  "autoprefixer": "^10.5.0",
  "postcss": "^8.4.49",
  "eslint": "^9.17.0",
  "eslint-config-next": "^15.1.4",
  "prettier": "^3.4.2"
}
```

---

## 3. 当前目录结构

> 基于 `find src -type f` 真实扫描结果（120+ 个源文件，Public Audio Mode 精简后）

```
music-player/
├── mobile/                           ★ Phase 8 — Capacitor 原生封装
│   ├── capacitor.config.ts           # Capacitor 配置
│   ├── ios-config/                   # iOS Info.plist + capacitor config
│   ├── scripts/                      # build-ios.sh + sync.sh
│   └── docs/                         # CAPACITOR_GUIDE.md
│
├── docs/
│   ├── AI_CONTEXT_RECOVERY.md        ★ 本文 — 核心恢复文件
│   ├── ai/                          ★ AI 协同开发中心 (Phase 12 扩展)
│   │   ├── AI_PROJECT_INDEX.md      ★ Phase 11 — 项目最高优先级索引
│   │   ├── AI_ONBOARDING_PROTOCOL.md★ Phase 11 — 新AI接手10步SOP
│   │   ├── AI_RECOVERY_BOOTSTRAP.md ★ Phase 11 — 灾难级恢复方案
│   │   ├── PROJECT_GOVERNANCE.md    ★ Phase 11 — 项目治理规则
│   │   ├── TECHNICAL_DEBT.md        ★ Phase 11 — 技术债追踪
│   │   ├── PROVIDER_RISK_ANALYSIS.md★ Phase 11 — Provider风险分析
│   │   ├── LONG_TERM_EVOLUTION.md   ★ Phase 11 — 长期演进路线
│   │   ├── DEPLOYMENT_SNAPSHOT.md   ★ Phase 11 — 部署结构快照
│   │   ├── AUTONOMY_RUNTIME.md      ★ Phase 12 — AI自治运行时
│   │   ├── ECOSYSTEM_ARCHITECTURE.md★ Phase 12 — 生态系统架构
│   │   ├── LOCAL_MEDIA_ROADMAP.md   ★ Phase 12 — 本地媒体路线图
│   │   ├── GOVERNANCE_PIPELINE.md   ★ Phase 12 — 治理管道
│   │   ├── DEGRADED_RUNTIME.md      ★ Phase 12 — 降级运行
│   │   ├── ARCHIVE_STRATEGY.md      ★ Phase 12 — 封存策略
│   │   ├── FROZEN_RUNTIME.md         ★ Phase 13 — 冻结运行时架构
│   │   ├── AUTONOMOUS_LOOP.md        ★ Phase 13 — 自治维护循环
│   │   ├── DISASTER_RECOVERY.md      ★ Phase 13 — 灾难恢复协议
│   │   ├── RUNTIME_ISOLATION.md      ★ Phase 13 — 运行时隔离层
│   │   ├── SNAPSHOT_ROTATION.md      ★ Phase 13 — 快照轮换系统
│   │   ├── LONG_TERM_STABILITY.md    ★ Phase 13 — 长期稳定性治理
│   │   ├── FINAL_FREEZE_STATE.md     ★ Phase 13 — 最终冻结状态文档
│   │   ├── AI_BOOTSTRAP_LAYER.md     ★ Phase 13 — AI快速接管指南
│   │   ├── CURRENT_TASK.md          # 当前开发任务
│   │   ├── KNOWN_ISSUES.md          # 已知Bug
│   │   ├── API_MAP.md               # API路由地图
│   │   ├── STORE_MAP.md             # Store完整地图
│   │   ├── PROVIDER_MAP.md          # Provider完整状态
│   │   ├── CACHE_ARCHITECTURE.md    # 缓存架构
│   │   └── PLAYBACK_FLOW.md         # 播放完整流程
│   ├── deployment/                  ★ Phase 8 — 部署指南
│   │   ├── VERCEL_DEPLOY.md
│   │   ├── SUPABASE_CONFIG.md
│   │   ├── TESTFLIGHT_GUIDE.md
│   │   └── CAPACITOR_BUILD.md
│   ├── PROJECT_RULES.md             # 开发规则与约束
│   ├── ARCHITECTURE_STATE.md        # 架构状态与组件树
│   ├── MODULE_MAP.md                # 模块依赖关系图
│   └── PROGRESS.md                  # 开发进度跟踪
│
├── public/
│   ├── manifest.json                # PWA manifest (standalone, portrait, complete icon set)
│   ├── sw.js                        # serwist 编译产物 (Phase 20B: 增强离线+音频缓存)
│   ├── robots.txt                   # Phase 20B ★ 搜索引擎阻止
│   ├── favicon.ico                  # Phase 20B ★ 32px favicon
│   ├── icons/                       # Phase 20B ★ 完整 PWA 图标集 (14 PNGs)
│   └── screenshots/                 # Phase 20B ★ 7 iOS 启动画面 + iPad
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # 完整 DB schema (6 tables) + RLS + 索引
│       ├── 002_phase4_schema.sql    # Phase 4: recently_played + favorite_playlists + trigger
│       └── 003_phase5_schema.sql    # Phase 5: song_comments + comment_likes + comment_replies
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # RootLayout: metadata + viewport + AuthProvider + AudioProvider + max-w-md
│   │   ├── page.tsx                 # HomePage + BottomPlayer + MobileNav + SearchPage
│   │   ├── loading.tsx              # 加载动画
│   │   ├── error.tsx                # 错误边界 + 重试按钮
│   │   ├── globals.css              # Apple Music 深色主题 + .glass/.card/.skeleton + 全局 reset
│   │   ├── sw.ts                    # serwist Service Worker 源文件
│   │   ├── library/
│   │   │   └── page.tsx             # Phase 4 ★ /library 我的音乐页
│   │   └── playlist/
│   │       └── [id]/
│   │           └── page.tsx         # Phase 4 ★ /playlist/[id] 歌单详情页
│   │
│   ├── types/
│   │   ├── song.ts                  # Song (12 fields), SongWithMeta
│   │   ├── playlist.ts              # Playlist, PlaylistWithSongs
│   │   ├── user.ts                  # Profile, PlayHistory
│   │   ├── player.ts                # PlayMode, PlayerState, PlayerActions, PlayerStore (Phase 1)
│   │   ├── music.ts                 # LoadingState, LyricLine, AudioState, QueueState, PlayerSnapshot, AudioEventCallbacks (Phase 2)
│   │   └── index.ts                 # 统一 re-export 所有类型
│   │
│   ├── stores/
│   │   ├── playerStore.ts           # Phase 1 播放器 store (legacy, 保留不删)
│   │   ├── uiStore.ts               # UI 状态: isPlayerExpanded, isSearchOpen, searchQuery
│   │   ├── musicPlayerStore.ts      # Phase 2 主播放器 store ★ 当前活跃 (23 actions)
│   │   ├── userStore.ts             # Phase 4 ★ 认证状态 (user/isAuthenticated/isAnonymous)
│   │   ├── libraryStore.ts          # Phase 4 ★ 乐观更新 (likedSongIds/recentPlayIds/favoritePlaylistIds)
│   │   ├── playlistStore.ts         # Phase 4 ★ UI 弹窗状态 (创建/添加歌曲 modal)
│   │   ├── socialStore.ts           # Phase 5 ★ 评论排序/当前歌曲/活跃回复ID
│   │   ├── systemStore.ts           # Phase 6 ★ 系统状态 (network/install/cache/background)
│   │   ├── settingsStore.ts         # Phase 8 ★ 设置状态 (audioQuality/autoCache/debugMode/providerPriority + localStorage)
│   │   └── index.ts                 # Phase 1 stores 导出 (playerStore + uiStore)
│   │
│   ├── hooks/
│   │   ├── useAudio.ts              # Phase 1 legacy: playerStore ↔ AudioEngine 桥接
│   │   ├── useAudioPlayer.ts        # Phase 2 ★ core: musicPlayerStore ↔ AudioManager 桥接
│   │   ├── usePlayerControls.ts     # Phase 2 ★ UI 控制层 (useCallback 稳定引用)
│   │   ├── useLyricsSync.ts         # Phase 2 ★ 歌词时间同步 + LRC 加载 (useLyricsLoader)
│   │   ├── useMediaSession.ts       # Phase 6 ★ 重写: musicPlayerStore + positionState + multi-size artwork
│   │   ├── useAuth.ts               # Phase 4 ★ 匿名登录 + 会话管理
│   │   ├── useLikedSongs.ts         # Phase 4 ★ React Query 喜欢歌曲 + optimistic
│   │   ├── usePlaylist.ts           # Phase 4 ★ 歌单 CRUD (React Query mutations)
│   │   ├── useRecentPlayed.ts       # Phase 4 ★ 自动记录播放 + 查询
│   │   ├── useLibrary.ts            # Phase 4 ★ 收藏歌单聚合查询
│   │   ├── useComments.ts           # Phase 5 ★ 评论 infinite query + mutations
│   │   ├── useCommentLike.ts        # Phase 5 ★ 评论点赞 (atomic RPC)
│   │   ├── useReplies.ts            # Phase 5 ★ 回复查询 + mutations
│   │   ├── useSongDetail.ts         # Phase 5 ★ 歌曲详情查询
│   │   ├── usePWAInstall.ts         # Phase 6 ★ PWA 安装 + beforeinstallprompt + iOS 检测
│   │   ├── useNetworkState.ts       # Phase 6 ★ 网络状态检测 (online/offline/slow)
│   │   ├── useOfflineCache.ts       # Phase 6 ★ IndexedDB 缓存统计
│   │   ├── useAudioCache.ts         # Phase 6 ★ 音频缓存 + 队列预加载
│   │   ├── useCrashRecovery.ts       # Phase 17 ★ 崩溃恢复 hook (sessionStorage + pagehide/pageshow)
│   │   ├── useStabilityMonitor.ts    # Phase 17 ★ 稳定性监控 hook (background/lockscreen/bluetooth/network)
│   │   ├── useBatteryOptimization.ts # Phase 17 ★ 电池优化 hook (reduced motion + Battery API + low power)
│   │   ├── useProductionMonitor.ts   # Phase 17 ★ 生产监控 hook (ProviderTelemetry + CacheGovernanceV2)
│   │   ├── useIdleResourceRelease.ts  # Phase 20C ★ 空闲资源释放 (AudioContext/Viz/EQ/memory trim)
│   │
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── AudioEngine.ts       # Phase 1 legacy 音频引擎 (保留不删)
│   │   │   ├── AudioManager.ts      # Phase 2 ★ 全局单例音频管理器 (RAF throttle 200ms)
│   │   │   └── webaudio/            # Phase 18A ★ Web Audio API 层
│   │   │       ├── AudioContextManager.ts  # 共享 AudioContext 生命周期
│   │   │       ├── CrossfadeEngine.ts     # 双槽 GainNode 交叉淡化
│   │   │       ├── EQEngine.ts            # 5-band BiquadFilterNode 均衡器
│   │   │       ├── EQPresets.ts           # EQ 预设定义
│   │   │       ├── VolumeNormalizer.ts    # RMS 音量归一化
│   │   │       ├── VisualizationAnalyzer.ts# AnalyserNode 数据提供
│   │   │       ├── AudioSessionManager.ts # 音频会话智能
│   │   │       └── index.ts              # Barrel export
│   │   ├── lyrics/
│   │   │   └── LyricParser.ts       # Phase 2 ★ LRC 解析 + 二分查找 (静态方法)
│   │   ├── supabase/
│   │   │   ├── client.ts            # 浏览器端 Supabase client (createClient)
│   │   │   └── server.ts            # 服务端 Supabase client (cookies)
│   │   ├── constants.ts             # API_PREFIX, DEFAULT_VOLUME (0.8), DEFAULT_COVER
│   │   └── utils.ts                 # cn() (clsx+twMerge), formatTime(), formatCount()
│   │
│   ├── components/
│   │   ├── ui/                      ★ 零业务依赖 — 绝对禁止修改
│   │   │   ├── GlassCard.tsx        # 毛玻璃卡片 (forwardRef, light/default/heavy, interactive, 4 padding)
│   │   │   ├── LazyImage.tsx        # 懒加载图片 (next/image + skeleton fallback)
│   │   │   ├── Skeleton.tsx         # 骨架屏 (text/circular/rectangular)
│   │   │   └── IconButton.tsx       # 图标按钮 (forwardRef, sm/md/lg, ghost/filled, active:scale-90)
│   │   │
│   │   ├── player/                  ★ 播放器组件
│   │   │   ├── PlayerBar.tsx        # 底部迷你播放器 (glass-heavy, 封面56px + 进度条 + 控制)
│   │   │   ├── PlayerFullscreen.tsx # 全屏播放器 (背景模糊 + 大封面280px + 歌词 + 音量)
│   │   │   ├── ProgressBar.tsx      # 进度条 (mouse drag + touch, formatTime 内联)
│   │   │   ├── AlbumCover.tsx       # 专辑封面 (sm=48/md=56/lg=200/xl=280, spin on play)
│   │   │   ├── PlayerControls.tsx   # 播放/切歌/模式按钮 (sm/lg, 4 mode icons, loading spinner)
│   │   │   ├── LyricsView.tsx       # 歌词视图 (高亮 + smooth scroll + 点击seek + 渐变遮罩)
│   │   │   └── VolumeSlider.tsx     # 音量滑块 (拖动 + touch + 静音切换 + 3级图标)
│   │   │
│   │   ├── home/                    ★ 首页组件
│   │   │   ├── HomePage.tsx         # 首页容器 (animate-fade-in, space-y-8)
│   │   │   ├── SearchBar.tsx        # 搜索入口 (glass button, 点击 toggleSearch)
│   │   │   ├── SongRow.tsx          # 单行歌曲 (序号/动画 + 封面44px + 信息 + 操作, 使用 musicPlayerStore)
│   │   │   ├── RecommendSection.tsx # 推荐歌单 2x3 grid (6 mock playlists)
│   │   │   ├── HotSongsSection.tsx  # 热门歌曲列表 (8 mock songs)
│   │   │   └── RecentPlaysSection.tsx # 最近播放列表 (3 mock songs)
│   │   │
│   │   ├── library/                  ★ Phase 4 — 我的音乐
│   │   │   ├── LibraryPage.tsx      # 我的音乐页 (tabs: 喜欢/歌单/最近 + 新建歌单 modal)
│   │   │   ├── LikedSongsList.tsx   # 喜欢歌曲列表 (复用 SongRow, 空状态/骨架屏)
│   │   │   ├── PlaylistList.tsx     # 歌单 2-col grid (PlaylistCard × N, 空状态)
│   │   │   ├── RecentPlaysList.tsx  # 最近播放列表 (复用 SongRow, 空状态)
│   │   │   ├── PlaylistCard.tsx     # 歌单卡片 (LazyImage cover + title + count)
│   │   │   └── index.ts             # library 组件导出
│   │   │
│   │   ├── auth/                     ★ Phase 4 — 认证
│   │   │   └── AuthProvider.tsx      # QueryClientProvider + AuthInitializer (loading spinner)
│   │   │
│   │   ├── layout/                  ★ 布局组件
│   │   │   ├── BottomPlayer.tsx     # 条件渲染: currentSong ? PlayerBar + PlayerFullscreen : null
│   │   │   ├── AudioProvider.tsx    # "use client", 挂载 17 hooks (含 Phase 20C idle-resource-release)
│   │   │   ├── DynamicImports.tsx   # Phase 20C ★ Client Component wrapper for next/dynamic
│   │   │   ├── MobileNav.tsx        # Phase 4 ★ 底部 tab bar (发现/我的)
│   │   │   └── PageTransition.tsx   # Phase 6 ★ 页面过渡动画 (fade-in + slide-up)
│   │   │
│   │   ├── pwa/                     ★ Phase 6 + 20B + 20C — PWA 安装 UI
│   │   │   ├── InstallDetector.tsx  # 静默组件 (挂载 3 个全局 hooks)
│   │   │   ├── InstallPrompt.tsx    # Phase 20B ★ 增强安装教程 + 安装成功检测
│   │   │   ├── StandaloneOnboarding.tsx # Phase 20B ★ 独立模式首次欢迎引导
│   │   │   ├── SWUpdateNotification.tsx # Phase 20C ★ SW 更新通知 toast
│   │   │   └── index.ts             # PWA 组件导出
│   │
│   ├── services/
│   │   ├── songService.ts           # 歌曲 CRUD: getHotSongs, getSongById, recordPlay, toggleLike
│   │   ├── authService.ts           # Phase 4 ★ signInAnonymously/getSession/getCurrentUser
│   │   ├── likedSongsService.ts     # Phase 4 ★ getLikedSongs/getLikedSongIds/toggleLike
│   │   ├── playlistService.ts       # Phase 4 ★ CRUD playlists + addSong/removeSong + toggleFavorite
│   │   ├── recentPlayedService.ts   # Phase 4 ★ recordPlay(upsert) + getRecentPlays
│   │   ├── social/
│   │   │   ├── commentService.ts    # Phase 5 ★ 评论 cursor pagination
│   │   │   ├── likeService.ts       # Phase 5 ★ 点赞 atomic RPC
│   │   │   └── replyService.ts      # Phase 5 ★ 回复 cursor pagination
│   │   └── cache/
│   │       ├── audioCacheService.ts # Phase 6 ★ 音频预加载队列 + 元数据缓存
│   │       ├── imageCacheService.ts # Phase 6 ★ 图片预加载
│   │       ├── lyricCacheService.ts # Phase 6 ★ 歌词 getOrFetch + IndexedDB
│   │       └── index.ts             # Phase 6 ★ 缓存服务导出
│   │
│   ├── storage/                     ★ Phase 6 — IndexedDB 缓存层
│   │   ├── CacheDB.ts               # 通用 IndexedDB 封装 (6 Object Stores)
│   │   ├── metadataStore.ts         # 歌曲元数据缓存
│   │   ├── offlineStore.ts          # 离线歌单存储
│   │   ├── historyStore.ts          # 本地播放历史
│   │   ├── lyricCacheStore.ts       # 歌词 IndexedDB 缓存
│   │   └── index.ts                 # storage 模块导出
│
│   ├── music-source/                ★ Phase 3 — 音源抽象层 (Provider Adapter)
│   │   ├── types/
│   │   │   ├── provider.ts          # MusicProvider 接口 + ProviderType + MusicQuality + SearchOptions + SongDetail
│   │   │   └── index.ts             # 统一导出
│   │   ├── providers/
│   │   │   ├── mock/
│   │   │   │   ├── data.ts          # 16 首 SoundHelix 歌曲 + 12 playlists + 5 LRC (真实 public MP3 URLs)
│   │   │   │   ├── MockProvider.ts  # 实现 MusicProvider (8 methods, simulated delay)
│   │   │   │   └── index.ts
│   │   │   ├── provider-manager/    ★ Phase 7 — Provider 管理核心
│   │   │   │   ├── ProviderManager.ts    # 注册/切换/Fallback链 (当前仅 mock)
│   │   │   │   ├── HealthTracker.ts     # 健康检测 + 滑动窗口
│   │   │   │   └── RequestManager.ts    # 请求去重 + 重试
│   │   │   └── index.ts             # 所有 Provider 导出 (MockProvider + ProviderManager)
│   │   ├── cache/
│   │   │   ├── SearchCache.ts       # 内存缓存 (Map + staleTime/gcTime + 请求去重)
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── SearchService.ts     # 统一数据入口 (缓存 + 去重 + provider fallback)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useMusicProvider.ts  # Provider/Service 单例管理
│   │   │   ├── useSearch.ts         # 300ms debounce + suggestions + results
│   │   │   ├── useSearchHistory.ts  # localStorage 搜索历史 (≤20条)
│   │   │   ├── useHotKeywords.ts    # 热门搜索词加载
│   │   │   └── index.ts
│   │   ├── core/
│   │   │   └── index.ts             # getProvider() / getService() 单例访问
│   │   └── index.ts                 # music-source 总入口
│   │
│   ├── stores/
│   │   ├── searchStore.ts           ★ Phase 3 — 搜索状态 (query/results/history + 11 actions)
│   │
│   ├── system/                      ★ Phase 9 + 11 + 17 — 系统层
│   │   ├── watchdog/                ★ Phase 9 — 播放看门狗
│   │   ├── recovery/                ★ Phase 9 — 自愈+启动恢复
│   │   │   ├── CrashRecoverySystem.ts ★ Phase 17 — 崩溃恢复 (sessionStorage + pagehide/pageshow + bfcache)
│   │   ├── cleanup/                 ★ Phase 9 — 缓存治理
│   │   │   ├── CacheGovernanceV2.ts  ★ Phase 17 — 增强缓存治理 (LRU eviction + size limit + low storage + stale)
│   │   ├── telemetry/               ★ Phase 9 — 遥测
│   │   │   ├── ProviderTelemetry.ts  ★ Phase 17 — Provider 精细化指标 (successRate/P50/P95/hourly)
│   │   ├── monitor/                 ★ Phase 9 — 系统监控
│   │   ├── diagnostics/             ★ Phase 9 — 诊断UI
│   │   ├── auto-diagnostics/        ★ Phase 11 — 自动诊断扫描
│   │   ├── snapshot/                ★ Phase 11 — 架构快照管理
│   │   ├── governance/              ★ Phase 11 — 运行时治理
│   │   ├── maintenance/             ★ Phase 11 — 维护模式
│   │   └── index.ts                 ★ Phase 9+11+17 统一导出
│   │
│   ├── platform/                    ★ Phase 10 — 平台化与运维层
│   │   ├── config/
│   │   │   ├── RuntimeConfigManager.ts ← 动态配置中心
│   │   │   └── EnvRegistry.ts         ★ Phase 20A — 环境变量注册表
│   │   ├── env/
│   │   │   └── EnvironmentGovernor.ts  ★ Phase 20A — 环境治理 (local/preview/production)
│   │   ├── url/
│   │   │   └── SiteUrlResolver.ts      ★ Phase 20A — 站点URL解析
│   │   ├── safety/
│   │   │   ├── ProductionGuard.ts      ★ Phase 20A — 生产安全守卫
│   │   │   ├── ProductionGate.tsx      ★ Phase 20A — 生产门控组件
│   │   │   └── SafetyBanner.tsx        ★ Phase 20A — 环境安全横幅
│   │   ├── backup/
│   │   │   └── BackupManager.ts     ← 数据备份与恢复
│   │   ├── migration/
│   │   │   └── MigrationPipeline.ts ← 数据迁移管道
│   │   ├── update/
│   │   │   └── ProviderHotReload.ts ← Provider 热更新
│   │   ├── runtime/
│   │   │   ├── DeploymentMode.ts    ← 部署模式检测
│   │   │   ├── MemoryMonitor.ts     ← 内存监控
│   │   │   └── SystemIntegrity.ts   ← 系统完整性检查
│   │   └── recovery/
│   │       └── DisasterRecovery.ts  ← 灾难恢复
│   │
│   ├── frozen-runtime/                 ★ Phase 13 — 最终长期冻结版
│   │   ├── FrozenRuntimeManager.ts     ★ 冻结运行时管理器 (核心)
│   │   ├── AutonomousMaintenanceLoop.ts★ 自治维护循环 (核心)
│   │   ├── index.ts                     ★ Frozen Runtime 统一导出
│   │   ├── bootstrap/                   ★ AI引导层
│   │   │   ├── AIBootstrapLayer.ts
│   │   │   └── index.ts
│   │   ├── healing/                     ★ 自愈治理
│   │   │   ├── SelfHealingGovernance.ts
│   │   │   └── index.ts
│   │   ├── governance/                  ★ 冻结治理
│   │   │   ├── FrozenGovernanceManager.ts
│   │   │   └── index.ts
│   │   ├── snapshots/                   ★ 快照轮换
│   │   │   ├── SnapshotRotationManager.ts
│   │   │   └── index.ts
│   │   ├── recovery/                    ★ 灾难恢复协议
│   │   │   ├── DisasterRecoveryProtocol.ts
│   │   │   └── index.ts
│   │   ├── isolation/                   ★ 运行时隔离
│   │   │   ├── RuntimeIsolationLayer.ts
│   │   │   └── index.ts
│   │   └── archive/                     ★ 自治归档
│   │       ├── AutonomousArchiveManager.ts
│   │       └── index.ts
│   │
│   ├── ecosystem/                     ★ Phase 12 — 最终私用生态闭环
│   │   ├── local-media/
│   │   │   ├── LocalMediaProvider.ts  ← 本地音频文件Provider
│   │   │   ├── LocalLyricProvider.ts  ← 本地歌词Provider
│   │   │   ├── LocalCoverProvider.ts  ← 本地封面Provider
│   │   │   └── index.ts
│   │   ├── webdav/
│   │   │   ├── WebDAVProvider.ts      ← WebDAV远程存储 (预留)
│   │   │   └── index.ts
│   │   ├── nas/
│   │   │   ├── NASProvider.ts         ← NAS网络存储 (预留)
│   │   │   └── index.ts
│   │   ├── sync/
│   │   │   ├── SyncManager.ts         ← 本地↔远程同步 (预留)
│   │   │   └── index.ts
│   │   ├── scanner/
│   │   │   ├── MediaScanner.ts        ← 媒体文件扫描与索引
│   │   │   └── index.ts
│   │   ├── ai-autonomy/
│   │   │   ├── AIAutonomyManager.ts   ★ AI自治管理器 (核心)
│   │   │   ├── GovernancePipeline.ts  ★ 自动治理管道
│   │   │   ├── DegradedRuntimeMode.ts ★ 降级运行模式
│   │   │   ├── SystemStatusPage.tsx   ★ 系统状态页
│   │   │   └── index.ts
│   │   ├── archive/
│   │   │   ├── ProjectArchiveSystem.ts★ 项目封存系统
│   │   │   └── index.ts
│   │   └── index.ts                   ★ Ecosystem 统一导出
│   │
│   ├── remote-provider/                ★ Phase 16A — Remote Provider 架构
│   │   ├── types/
│   │   │   └── index.ts               ★ RemoteProvider 接口 + 全部类型
│   │   ├── core/
│   │   │   ├── EdgeProviderManager.ts  ★ 核心管理器 (熔断/重试/健康/Fallback)
│   │   │   └── index.ts
│   │   ├── providers/
│   │   │   ├── RemoteWorkerProvider.ts ★ Cloudflare Worker 适配器 (mock)
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── RemoteConfig.ts         ★ 远程配置系统 (localStorage)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useRemoteProvider.ts    ★ React integration hook
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── ProviderHealthDashboard.tsx ★ Dev-only 健康仪表板
│   │   │   └── index.ts
│   │   └── index.ts                    ★ Barrel export
│   │
│   ├── components/
│   │   ├── error/                   ★ Phase 8 — 崩溃保护
│   │   │   ├── ErrorBoundary.tsx     # 全局 React Error Boundary (class component + auto-retry)
│   │   │   ├── AudioErrorBoundary.tsx # 音频加载失败专用
│   │   │   ├── ProviderErrorBoundary.tsx # Provider 失败自动 fallback
│   │   │   ├── OfflineFallback.tsx   # 离线状态 UI
│   │   │   ├── EnhancedErrorBoundary.tsx ★ Phase 17 — 增强错误边界 (graceful degradation + AudioErrorFallback + DegradedIndicator + withErrorBoundary HOC)
│   │   │   └── index.ts
│   │   ├── settings/                ★ Phase 8 — 设置页
│   │   │   ├── SettingsPage.tsx     # 音频/Provider/缓存/Debug/版本
│   │   │   └── index.ts
│   │   ├── seo/                     ★ Phase 8 — SEO/Meta
│   │   │   ├── AppMeta.tsx          # OpenGraph + Apple Meta + PWA Meta
│   │   │   └── index.ts
│   │   ├── search/                  ★ Phase 3 — 搜索 UI
│   │   │   ├── SearchPage.tsx       # 全屏搜索 overlay (glass bar + auto-focus + slide-up)
│   │   │   ├── HotKeywords.tsx      # 热门搜索流式布局
│   │   │   ├── SearchHistory.tsx    # 搜索历史 (删除/清除)
│   │   │   ├── SearchResultsView.tsx # 结果 (SongRow + 歌单 + 艺术家)
│   │   │   └── index.ts
│   │
├── .env.local                       # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── .eslintrc.json                   # next/core-web-vitals + no-explicit-any + prefer-const
├── .prettierrc                      # semi:true, singleQuote:false, tabWidth:2, trailingComma:all, printWidth:100
├── .gitignore
├── next.config.ts                   # serwist wrap + images(avif,webp) + optimizePackageImports
├── tailwind.config.ts               # Apple Music 色板 + glass blur + 5 animations + SF Pro 字体栈
├── tsconfig.json                    # strict + paths(@/*) + noUncheckedIndexedAccess + noUnusedLocals/Params
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── next-env.d.ts
│
├── scripts/
│   ├── generate-icons.mjs           ★ Phase 20B — sharp SVG→PNG 图标/启动画面生成器
│
└── next-env.d.ts
```

**文件统计：** 135+ 个 `.ts` / `.tsx` / `.css` 源文件 (+Phase 20B PWA assets 14 icons + 7 splash + CHANGELOG.md)

---

## 4. 当前已实现模块

### 4.1 类型系统 (src/types/)

| 文件 | 导出 | 用途 |
|------|------|------|
| `song.ts` | `Song` (12 fields), `SongWithMeta` | 歌曲实体 |
| `playlist.ts` | `Playlist` (8 fields), `PlaylistWithSongs` | 歌单实体 |
| `user.ts` | `Profile` (6 fields), `PlayHistory` (4 fields) | 用户 + 播放历史 |
| `player.ts` | `PlayMode`, `PlayerState`, `PlayerActions`, `PlayerStore` | Phase 1 播放器类型 |
| `music.ts` | `LoadingState`, `LyricLine`, `AudioState`, `QueueState`, `PlayerSnapshot`, `AudioEventCallbacks` + re-export PlayMode | Phase 2 音乐类型 |
| `index.ts` | 统一 re-export | 所有模块从此处导入 |

### 4.2 状态管理 (src/stores/)

#### musicPlayerStore (Phase 2 ★ 当前活跃)

```typescript
// 完整 state shape:
{
  // Core
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;      // seconds
  duration: number;         // seconds
  volume: number;           // 0-1, default 0.8
  isMuted: boolean;
  playbackRate: number;     // 0.25-4, default 1

  // Mode
  playMode: "sequential" | "repeat" | "repeat-one" | "shuffle";

  // Queue
  queue: Song[];
  queueIndex: number;       // -1 when empty

  // Audio status
  buffered: number;         // 0-100 percentage
  loadingState: "idle" | "loading" | "ready" | "error";

  // Lyrics
  lyrics: LyricLine[];
  currentLyricIndex: number; // -1 when no lyrics loaded
}

// 23 actions:
play(song?), pause(), togglePlay(), seek(time), setVolume(vol), toggleMute(),
setPlaybackRate(rate), syncTime(t, d), setBuffered(pct), setLoadingState(state),
setQueue(songs, startIndex?), addToQueue(song), removeFromQueue(index), clearQueue(),
next(), prev(), setPlayMode(mode), cycleMode(),
setLyrics(lines), setCurrentLyricIndex(index)
```

**关键逻辑：**
- `play(song)`: 如果 song 已在 queue 中则直接切换；否则追加到 queue 末尾
- `next()`: shuffle 用 Fisher-Yates 随机（避开当前）；sequential 到末尾停止；repeat 循环
- `prev()`: < 3 秒回到上一首；>= 3 秒重播当前
- `removeFromQueue(index)`: 处理删除当前歌曲时的索引重算
- `cycleMode()`: sequential → repeat → repeat-one → shuffle → sequential

#### uiStore

```typescript
{
  isPlayerExpanded: boolean;   // 控制全屏播放器显隐
  isSearchOpen: boolean;       // 搜索弹窗
  searchQuery: string;         // 搜索关键词
  expandPlayer(), collapsePlayer(), toggleSearch(), closeSearch(), setSearchQuery(q)
}
```

#### playerStore (Phase 1, legacy — 保留不删但不再使用)

基于 `PlayerStore` 类型，仍使用 `playlist` 而非 `queue`。已被 musicPlayerStore 取代。

### 4.3 音频系统 (src/lib/audio/)

#### AudioManager (Phase 2 ★ 当前活跃)

```
全局单例 (AudioManager.getInstance() 或 getAudioManager())

构造:
  - 监听 document.visibilitychange → 自动启停 RAF

Core API:
  load(url, callbacks) → 创建新 Audio, 绑定事件, 自动调用 reportLoadState
  play() → Promise<void> (带 try-catch)
  pause()
  resume()
  seek(time: number)
  setVolume(vol: number)     → clamp 0-1
  setPlaybackRate(rate: number) → clamp 0.25-4
  destroy() → 完整销毁 + 移除事件 + 重置 instance

Properties:
  currentTime: number
  duration: number
  paused: boolean

事件回调 (AudioEventCallbacks):
  onTimeUpdate(currentTime, duration)  → musicPlayerStore.syncTime()
  onEnded()                            → musicPlayerStore.next()
  onLoadStateChange(state)             → musicPlayerStore.setLoadingState()
  onBufferedChange(percentage)         → musicPlayerStore.setBuffered()
  onError(message)

RAF Engine:
  - requestAnimationFrame 驱动
  - 200ms throttle (~5fps)
  - 播放时自动启动, 暂停时自动停止
  - Page Visibility API: 不可见时停止 RAF

缓存 loading 状态:
  - loadstart → loading
  - canplay / loadedmetadata / playing → ready
  - waiting → loading
  - error → error
```

#### AudioEngine (Phase 1, legacy — 保留不删)

```
全局单例 (audioEngine)
简化的 HTML5 Audio 封装
无 throttle, 每帧都 RAF tick
被 useAudio hook 引用
```

### 4.4 歌词系统 (src/lib/lyrics/)

#### LyricParser

```
静态方法:
  parse(lrc: string) → LyricLine[]
    支持格式:
      [mm:ss.xx]text               # 标准
      [mm:ss]text                  # 无毫秒
      [mm:ss.xx][mm:ss.xx]text     # 多标签行 → 生成多条
    跳过无标签行（元数据）
    按 time 升序排序

  parseEnhanced(lrc: string) → LyricLine[]
    Phase 3 预留, 当前 fallback 到 parse()

  findCurrentIndex(lines, currentTimeMs) → number
    二分查找 O(log n)
    返回 ≤ currentTime 的最大索引
    lines 为空返回 -1
```

### 4.5 Hooks (src/hooks/)

| Hook | 文件 | 职责 | 状态 |
|------|------|------|------|
| `useAudio` | `useAudio.ts` | Phase 1: playerStore ↔ AudioEngine 桥接 + audiointerruption 事件 | legacy |
| `useAudioPlayer` | `useAudioPlayer.ts` | Phase 2 ★ musicPlayerStore ↔ AudioManager 核心桥接 (4 effects + 1 subscribe) | **活跃** |
| `usePlayerControls` | `usePlayerControls.ts` | Phase 2 ★ UI 控制层 (封装 15 个常用操作, useCallback) | **活跃** |
| `useLyricsSync` | `useLyricsSync.ts` | Phase 2 ★ currentTime → LyricParser.findCurrentIndex → setCurrentLyricIndex | **活跃** |
| `useLyricsLoader` | `useLyricsSync.ts` | Phase 2 ★ loadLyrics(lrcText) / clearLyrics() | **活跃** |
| `useMediaSession` | `useMediaSession.ts` | iOS 控制中心: play/pause/next/prev/seek + 锁屏信息 (依赖 playerStore) | 活跃 |

**useAudioPlayer effect 详解：**
1. `[currentSong?.id, currentSong?.audio_url]` → load + play
2. `[isPlaying, currentSong?.id]` → play/pause
3. `[volume, isMuted]` → setVolume
4. `[playbackRate]` → setPlaybackRate
5. subscribe → 检测 seek 跳变 (diff > 1.5s) → AudioManager.seek()

### 4.6 组件 (src/components/)

#### UI 基础组件 (零业务依赖 — 绝对禁止修改)

| 组件 | Props | 实现要点 |
|------|-------|---------|
| `GlassCard` | variant, interactive, padding, className | forwardRef, clsx 组合 variant/padding, interactive 时 card 动画 |
| `LazyImage` | src, alt, size, width, height, rounded, priority | next/image 封装, 错误 fallback, skeleton loading |
| `Skeleton` | variant, width, height, className | text/circular/rectangular, shimmer 动画 |
| `IconButton` | size, variant, className | forwardRef, sm/md/lg, ghost/filled, active:scale-90 |

#### 播放器组件

| 组件 | 数据源 | Props/功能 |
|------|--------|-----------|
| `PlayerBar` | musicPlayerStore + uiStore | 缓冲指示条(loading时), ProgressBar, AlbumCover(size=md 56px spin), 歌曲名/艺术家, PlayerControls(sm) |
| `PlayerFullscreen` | musicPlayerStore + uiStore | 背景(封面模糊+黑色叠加), 顶部(关闭+专辑+菜单), 中部(封面280px spin 或 歌词), 底部(ProgressBar+PlayerControls(lg)+VolumeSlider) |
| `ProgressBar` | props | currentTime/duration/onSeek, mouse+MouseDown, touch+TouchMove, 轨道+拖动圆点, formatTime 内联显示 |
| `AlbumCover` | props | src/alt/size/isPlaying, sm=48/md=56/lg=200/xl=280, 小尺寸直接旋转, 大尺寸内层旋转+中间圆孔(仿唱片) |
| `PlayerControls` | props | isPlaying/isLoading/mode/canPlay + callbacks, sm/lg size, 4 mode icons (sequential/repeat-repeat/repeat-one/shuffle), loading spinner, 播放按钮 filled variant |
| `LyricsView` | musicPlayerStore | lyrics/currentLyricIndex, scrollIntoView(smooth, center), 点击行seek, 顶部40vh留白, 当前行(text-primary text-2xl font-semibold scale-105), 已播(text-tertiary), 未播(text-secondary), 上下渐变遮罩 |
| `VolumeSlider` | props | volume/isMuted + callbacks, mouse+touch drag, 3级音量图标(0/0-0.5/0.5+), 轨道+圆点, effVol = isMuted ? 0 : volume |

#### 首页组件

| 组件 | 数据源 | 功能 |
|------|--------|------|
| `HomePage` | — | 容器 (animate-fade-in, space-y-8, px-4, pb-36 for BottomPlayer, pt-6) |
| `SearchBar` | uiStore | glass button, IconSearch + "搜索歌曲、歌单...", 点击 toggleSearch |
| `SongRow` | musicPlayerStore | 序号(播放时显示脉动方块), LazyImage(44px), 歌名(当前高亮accent-primary), 艺术家, 喜欢图标, 点击播放 |
| `RecommendSection` | mock data (6 playlists) | 2x3 grid, GlassCard 含渐变色块+名称 |
| `HotSongsSection` | mock data (8 songs) | SongRow 列表, 含 isLiked demo |
| `RecentPlaysSection` | mock data (3 songs) | SongRow 列表 |

#### 布局组件

| 组件 | 功能 |
|------|------|
| `BottomPlayer` | 条件渲染: `currentSong→PlayerBar(fixed bottom z-50) + isPlayerExpanded→PlayerFullscreen` |
| `AudioProvider` | "use client", 挂载 useAudio + useAudioPlayer + useMediaSession + useLyricsSync |

### 4.7 数据服务 (src/services/)

#### songService

```
方法:
  getHotSongs(limit=20)  → supabase.from("songs").select().order("play_count",desc).limit(n)
  getSongById(id)        → supabase.from("songs").select().eq("id", id).single()
  recordPlay(songId)     → 须登录, insert into play_history
  toggleLike(songId, bool) → 须登录, bool ? delete : insert liked_songs
```

### 4.8 Supabase Schema (可选，当前未连接)

```
DB: PostgreSQL via Supabase
6 张表 (全部启用 RLS + 索引):
  profiles         (id→auth.users, username UNIQUE, avatar_url, bio)
  songs            (title, artist, album, cover_url, audio_url, duration, genre, release_year, play_count)
  playlists        (name, description, cover_url, user_id→profiles, is_public)
  playlist_songs   (playlist_id, song_id, position, UNIQUE)
  liked_songs      (user_id, song_id, UNIQUE)
  play_history     (user_id, song_id, played_at)

RLS Policies:
  - profiles: public SELECT, owner UPDATE
  - songs: public SELECT
  - playlists: public SELECT (is_public), owner ALL
  - playlist_songs: owner via playlist.user_id
  - liked_songs: owner ALL
  - play_history: owner ALL

环境变量:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY (server-side)

当前状态: schema 已定义，SCHEMA READY；env 为空时安全降级到 local mode
safeCreateClient() 自动检测 → isSupabaseEnabled() → 无效 URL 返回 null → 所有 services 走 local fallback
```

### 4.10 音源抽象层 (src/music-source/) — Phase 3 ★ (Public Audio Mode)

#### Provider Adapter Architecture

```
UI Components
  ↓ (hooks: useSearch / useMusicProvider)
SearchService (缓存 + 去重 + fallback)
  ↓ (MusicProvider interface)
MockProvider (SoundHelix public MP3 URLs)
  ↓ (将来扩展)
[未来真实音源 Provider]
```

**核心规则：** UI 绝对不直接 fetch，组件不直接调用 Provider API，所有数据必须通过 hooks → SearchService → Provider 链路。

**当前音源模式：Public Audio Mode**
- 内置 16 首 SoundHelix 公开 demo 歌曲 (真实可播放 MP3 URLs)
- 零后端依赖 / 零本地 API / 零数据库
- ProviderManager + Fallback 链架构完整保留，将来可直接注册新的 Provider
- ProviderType 从 `"mock" | "netease" | "qq" | "kuwo"` 改为 `"mock" | string`（开放扩展）

#### MusicProvider 统一接口 (types/provider.ts)

```typescript
interface MusicProvider {
  name: string;  type: ProviderType;
  search(keyword, options?) → SearchResult
  getSearchSuggestions(keyword) → string[]
  getHotKeywords() → string[]
  getSongDetail(id) → SongDetail
  getPlayUrl(id, quality?) → string
  getLyrics(id) → string
  getPlaylist(id) → Playlist
  getPlaylistSongs(id) → Song[]
  getArtist(id) → Artist
  getArtistSongs(id) → Song[]
}
```

#### MockProvider (providers/mock/)

- 16 首 demo 歌曲 (使用 SoundHelix 公开 MP3: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-N.mp3`, N=1..16)
- 12 个 mock 歌单
- 5 首完整 LRC 格式歌词（七里香/晴天/海阔天空/Shape of You/Lemon）
- 20 个热门搜索词
- 所有方法 async，模拟延迟 100–250ms
- search() 基于 keyword 模糊匹配 title/artist/album
- **歌曲真实可播放，iPhone Safari 兼容**

#### SearchCache (cache/SearchCache.ts)

- 内存 Map<string, CacheEntry> + 时间戳
- 按类型配置 staleTime/gcTime：search(2min/10min), suggestion(1min/5min), hotKeywords(30min/60min), songDetail(5min/30min), playlist(5min/30min)
- 请求去重：pendingRequests Map，同一 key 的并发请求自动合并
- 手动 GC：collectGarbage() 清除超过 60min 的条目
- 全局单例：getSearchCache()

#### SearchService (services/SearchService.ts)

- 构造函数：接收 MusicProvider，可选 fallbackProvider
- search(keyword, options)：检查去重 → 检查缓存 → provider.search() → 写缓存
- 所有方法统一步骤：pending check → cache check → provider call → cache write
- executeWithFallback：主 provider 失败时自动切换 fallback
- clearCache / invalidateSearchCache 缓存管理

### 4.11 搜索系统 — Phase 3 ★

#### searchStore (stores/searchStore.ts)

```
State:
  query, suggestions[], hotKeywords[], searchHistory[]
  results: SearchResult | null
  isSearching, searchError, activeView ("hot"|"history"|"suggestions"|"results")

11 Actions:
  setQuery, setSuggestions, setHotKeywords, setResults, setIsSearching
  setSearchError, setActiveView, addHistory, removeHistory, clearHistory, resetSearch

搜索历史: localStorage (key: "music_search_history", max 20 条)
```

#### socialStore (stores/socialStore.ts) — Phase 5 ★

```typescript
{
  commentSortType: "hot" | "newest";
  currentCommentSongId: string | null;
  activeReplyId: string | null;
  // actions: setCommentSortType, setCurrentCommentSongId, setActiveReplyId
}
```

#### 搜索 Hooks (music-source/hooks/)

| Hook | 职责 |
|------|------|
| useMusicProvider | Provider/Service 单例初始化和管理 |
| useSearch | 300ms debounce 搜索 + 自动 suggestions + AbortController |
| useSearchHistory | localStorage 历史 CRUD (add/remove/clear) |
| useHotKeywords | 挂载时加载热门关键词（去重加载） |

#### 搜索 UI (components/search/)

| 组件 | 数据源 | 功能 |
|------|--------|------|
| SearchPage | searchStore + uiStore | 全屏 overlay (animate-slide-up), 搜索栏 auto-focus, 条件渲染 activeView |
| HotKeywords | props | 热门搜索词流式布局 (flex-wrap tags), 点击触发搜索 |
| SearchHistory | props | 搜索历史列表, 单条删除 (IconX), 清除全部 |
| SearchResultsView | props | 歌曲 SongRow 复用 + 歌单 GlassCard 2col grid + 艺术家横向滚动 |

**搜索数据流：**

```
SearchBar → uiStore.toggleSearch() → isSearchOpen → <SearchPage />
  ├── [空] → HotKeywords + SearchHistory
  └── [输入] → debounce 300ms
      ├── SearchService.search(q)
      │   └── cache? → provider.search() → results → SongRow[] (复用)
      └── SearchService.getSuggestions(q)
          └── suggestions dropdown
```

### 4.12 用户系统 (src/stores/userStore.ts + src/hooks/useAuth.ts) — Phase 4 ★

#### userStore (stores/userStore.ts)

```typescript
{
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  // actions: setUser(user), clearAuth(), setLoading(bool)
}
```

**认证流程：**
- 应用启动 → AuthProvider → useAuth()
- 检查 Supabase session → 有则 getCurrentUser() → setUser()
- 无则 signInAnonymously() → 创建持久匿名用户 → setUser()
- onAuthStateChange 监听登录/登出变化
- signOut() 后自动重新匿名登录

### 4.13 喜欢歌曲系统 (src/hooks/useLikedSongs.ts) — Phase 4 ★

```
核心链路:
  useLikedSongs.toggleLike(songId)
    → React Query mutation:
      1. onMutate → libraryStore.toggleLikeOptimistic(songId) → UI 立即更新
      2. mutationFn → likedSongsService.toggleLike(userId, songId, isLiked)
      3. onError → libraryStore.toggleLikeOptimistic(songId) → 回滚
      4. onSettled → invalidateQueries(['liked-songs', userId])

查询:
  useQuery(['liked-song-ids', userId]) → getLikedSongIds() → Set<string>
  useQuery(['liked-songs', userId]) → getLikedSongs() → Song[]

导出:
  likedSongs, likedSongIds, isLiked(songId), toggleLike(songId), isLoading
```

### 4.14 歌单系统 (src/hooks/usePlaylist.ts) — Phase 4 ★

```
Hooks:
  usePlaylist(playlistId?) → playlists, playlistDetail, createPlaylist, deletePlaylist, addSong, removeSong
  useLibrary() → favoritePlaylists, isFavorited, toggleFavoritePlaylist

Services (playlistService):
  getUserPlaylists(userId) → UserPlaylist[]
  getPlaylistDetail(id) → PlaylistWithSongsDetail
  createPlaylist(userId, title, desc, cover) → UserPlaylist
  deletePlaylist(id)
  addSong(playlistId, songId) → upsert (防止重复)
  removeSong(playlistId, songId)
  toggleFavorite(userId, playlistId, isFav) → boolean
  getFavoritePlaylists(userId) → Playlist[]

数据库:
  playlists (已有) + playlist_songs (已有) + favorite_playlists (新增)
```

### 4.15 最近播放系统 (src/hooks/useRecentPlayed.ts) — Phase 4 ★

```
recordPlay(songId):
  1. libraryStore.addRecentPlayOptimistic(songId) → UI 立即更新
  2. recentPlayedService.recordPlay(userId, songId) → Supabase upsert

查询:
  useQuery(['recent-plays', userId]) → getRecentPlays() → Song[]

数据库:
  recently_played 表: UNIQUE(user_id, song_id) + upsert on re-play
```

### 4.16 React Query 集成 (src/components/auth/AuthProvider.tsx) — Phase 4 ★

```
QueryClient 配置:
  defaultOptions:
    queries: staleTime 30s, gcTime 10min, retry 2, refetchOnWindowFocus false
    mutations: retry 1

AuthProvider 结构:
  QueryClientProvider
    └── AuthInitializer (useAuth, loading spinner)
        └── {children}
```

### 4.17 页面路由 — Phase 4+5 ★

| 路由 | 组件 | 功能 |
|------|------|------|
| `/` | HomePage + BottomPlayer + MobileNav + SearchPage | 首页 |
| `/library` | LibraryPage + BottomPlayer + MobileNav | 我的音乐 (tabs: 喜欢/歌单/最近) |
| `/playlist/[id]` | PlaylistDetailPage | 歌单详情 (bg blur+大封面+收藏+删除+歌曲列表) |
| `/song/[id]` | SongDetailPage | 歌曲详情 (大封面+bg blur+信息+评论) |

### 4.18 评论系统 — Phase 5 ★

#### 数据库 (supabase/migrations/003_phase5_schema.sql)

```
song_comments:
  id (UUID PK), song_id (FK→songs), user_id (FK→profiles), content (TEXT), like_count (INT), created_at
  索引: (song_id, created_at DESC), (song_id, like_count DESC)

comment_likes:
  id (UUID PK), user_id (FK→profiles), comment_id (FK→song_comments), UNIQUE(user_id, comment_id)

comment_replies:
  id (UUID PK), comment_id (FK→song_comments), user_id (FK→profiles), content (TEXT), created_at

RPC: increment_comment_likes(comment_id), decrement_comment_likes(comment_id)

RLS: Public SELECT on all tables, Owner CREATE/DELETE on comments+replies, Owner ALL on likes
```

#### 服务层 (src/services/social/)

```
commentService:
  getComments(songId, sort, cursor?) → CommentPage (20 per page, cursor pagination)
  createComment(userId, songId, content) → CommentWithProfile
  deleteComment(commentId) → boolean

likeService:
  getLikedCommentIds(userId) → Set<string>
  toggleLike(userId, commentId, isLiked) → boolean (atomic RPC count update)

replyService:
  getReplies(commentId, cursor?) → ReplyPage (10 per page, cursor pagination)
  createReply(userId, commentId, content) → CommentReplyWithProfile
  deleteReply(replyId) → boolean
```

#### Hooks (src/hooks/)

```
useComments(songId):
  useInfiniteQuery: ['comments', songId, sortType], cursor pagination
  addComment/deleteComment mutations → invalidateQueries

useCommentLike():
  likedCommentIds: useQuery(['comment-likes', userId])
  toggleLike: mutation → toggleLike + invalidate

useReplies(commentId):
  replies: useQuery(['replies', commentId]) (lazy, enabled only when activeReplyId set)
  addReply/deleteReply mutations → invalidate

useSongDetail(songId):
  useQuery(['song-detail', songId]) → single song from Supabase
```

#### UI 组件 (src/components/comments/)

| 组件 | 功能 |
|------|------|
| CommentCard | 头像(LazyImage 36px)+用户名+时间+内容+点赞(heart+count)+回复+删除 |
| CommentList | 排序tabs(热门/最新)+infinite scroll(IntersectionObserver)+空状态+skeleton+CommentInput |
| CommentInput | 圆角input+send button+Enter submit+16px font(防iOS缩放)+compact mode |
| ReplyCard | 内嵌回复(小头像28px+用户名+时间+内容+删除), 左边框线 |

### 4.20 PWA 增强 — Phase 6 + 20B ★

#### systemStore (stores/systemStore.ts)

```typescript
{
  networkState: "online" | "offline" | "slow";
  installState: { isInstalled, hasInstallPrompt, isIOS, isStandalone };
  cacheStats: { metadataCount, offlinePlaylistCount, historyCount, lyricCount };
  showInstallGuide: boolean;
  isBackgroundPlayback: boolean;
  // 9 actions: setNetworkState/setInstallState/setShowInstallGuide/dismissInstallGuide/setCacheStats/incrementCacheCount/setBackgroundPlayback
}
```

#### Service Worker (sw.ts) — 分层缓存策略 (Phase 20B 增强)

```
static assets (/_next/static/*, /icons/*)    → CacheFirst, 30 days
screenshots (/screenshots/*)                 → CacheFirst
manifest (/manifest.json)                    → StaleWhileRevalidate
images (*.png/jpg/webp, supabase.co images)  → StaleWhileRevalidate, 7 days
audio (soundhelix.com/*.mp3)                 → StaleWhileRevalidate (Phase 20B)
external CDN (soundhelix.com)                → StaleWhileRevalidate (Phase 20B)
API (/api/*, supabase.co/rest/*)             → NetworkFirst, 5s timeout
fonts (*.woff2)                               → CacheFirst
navigation (document requests)                → NetworkFirst, 3s timeout
```

#### PWA 安装 (Phase 20B 增强)

```
InstallDetector:    静默组件 → usePWAInstall + useNetworkState + useOfflineCache
InstallPrompt:      Phase 20B: 增强安装引导 + display-mode change 安装成功检测 + toast
StandaloneOnboarding: Phase 20B: 独立模式首次欢迎 (3 feature highlights + dismiss)
manifest.json:      11 icon sizes (76-512) + maskable + screenshots + 2 shortcuts + launch_handler
iOS splash:         Phase 20B: 7 sizes (iPhone 8→16PM + iPad Pro 11/12.9)
notch CSS:          Phase 20B: status-bar-spacer, pt-notch, pt-safe, pb-safe, pb-player-safe, min-h-notch
```

### 4.21 IndexedDB 缓存层 — Phase 6 ★

#### CacheDB (storage/CacheDB.ts)

```
Database: "music-player-cache" v1, 5 Object Stores:
  song_metadata (keyPath: id, index: cachedAt)
  offline_playlists (keyPath: id, index: cachedAt)
  play_history_local (keyPath: id autoIncrement, indexes: songId/playedAt)
  lyric_cache (keyPath: songId)
  image_cache_meta (keyPath: url)

API: openDB/getItem/putItem/deleteItem/getAllItems/getByIndex/countItems/clearStore
```

#### 各 Store 模块

```
metadataStore: cacheSongMetadata/getCachedSong/getCachedSongs/getAll/remove/count/clear
offlineStore: saveOfflinePlaylist/getOfflinePlaylist/getAll/remove/count/clear
historyStore: recordLocalPlay/getLocalPlayHistory/getLocalPlaysForSong/count/clear
lyricCacheStore: cacheLyric/getCachedLyric/remove/count/clear
```

### 4.22 缓存服务层 — Phase 6 ★

```
audioCacheService:
  cacheSong(song) → IndexedDB song_metadata
  preloadAudio(song, priority) → 队列 (MAX_CONCURRENT=1), 15s timeout
  preloadQueueNext(songs, startIndex, count=2) → 预加载后续歌曲
  clearPreloadQueue()

imageCacheService:
  preloadImage(url) → new Image().src
  preloadImages(urls[]) → Promise.allSettled
  isImagePreloaded(url) → Set.has()

lyricCacheService:
  getOrFetchLyric(songId, fetchFn) → IndexedDB cache hit → return; miss → fetch → cache → return
  saveLyric/removeLyric
```

### 4.23 新 Hooks — Phase 6 ★

#### usePWAInstall

```
Detects: isIOS/isStandalone/isInstalled/hasInstallPrompt
Registers: beforeinstallprompt event → stores for later prompt()
Monitors: display-mode changes → systemStore
Returns: installState + promptInstall()
```

#### useNetworkState

```
Detects: navigator.onLine + Network Information API (effectiveType/rtt)
Monitors: online/offline/connection.change events
Maps: "slow-2g"/"2g" → "slow", rtt > 500ms → "slow"
Returns: networkState + isOnline/isOffline/isSlow
```

#### useOfflineCache

```
Initial load: refreshStats() → IndexedDB counts → systemStore.setCacheStats()
Returns: cacheStats + refreshStats + incrementCacheCount
```

#### useAudioCache (mounted in AudioProvider)

```
Effect 1 [currentSong]: cacheSong(currentSong) → IndexedDB
Effect 2 [queue, queueIndex]: preloadQueueNext(queue, queueIndex, 2) → preload next 2 songs
```

### 4.19 歌曲详情页 + 歌单增强 — Phase 5 ★

#### SongDetailPage (/song/[id])

```
Client Component:
  背景层: 封面 blur-2xl + gradient overlay
  Header: 返回 + 分享 + 更多
  信息区:
    AlbumCover (280px, 唱片样式, spin on play)
    歌名(text-2xl) + 艺术家 + 元数据(专辑/风格/时长)
    播放按钮(filled) + 喜欢按钮(heart toggle)
  评论区:
    CommentList (排序+infinite scroll+input)
    底部 safe-area 内边距
```

#### PlaylistDetailPage (/playlist/[id]) — 增强

```
Client Component (增强自 Phase 4):
  背景层: 封面 blur + gradient overlay
  Header: 返回 + 分享 + 更多
  信息区:
    LazyImage (200px, rounded-full)
    歌单名(text-xl) + 描述(line-clamp-3) + 歌曲数
    播放全部(filled) + 收藏(heart toggle) + 删除
  歌曲列表: SongRow × N (复用)
```

#### MobileNav (components/layout/MobileNav.tsx)

```
底部 tab bar (z-40, fixed bottom-0):
  - 发现 (/) → IconHome
  - 我的 (/library) → IconMusic
  - active: text-accent-primary, inactive: text-text-tertiary
  - safe-area-inset-bottom 适配
  - backdrop-blur-xl + bg-surface/95
```

### 4.9 PWA & iOS (Phase 20B)

```
manifest.json:  name="Music Player", short_name="Music", standalone, portrait-primary, theme #0a0a0a
                Phase 20B: 11 icon sizes (76-512), maskable icons, screenshots, 2 shortcuts, launch_handler
Service Worker: serwist 9.x (swSrc-to-swDest: src/app/sw.ts-to-public/sw.js), dev禁用
                Phase 20B: 音频缓存(soundhelix MP3s), external-cdn SWR, manifest SWR
iOS meta:       apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style: black-translucent
viewport:       width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover
icons:          Phase 20B: 14 PNG files (76-512, apple icons, maskable, favicon)
splash screens: Phase 20B: 7 PNG files (iPhone 8-16 Pro Max + iPad Pro 11/12.9 inch)
install UX:     Phase 20B: InstallPrompt(安装成功检测) + StandaloneOnboarding(独立模式欢迎引导)
notch CSS:      Phase 20B: status-bar-spacer, pt-notch, pb-player-safe, min-h-notch utilities
```

---

## 5. 当前状态管理结构

### Store 关系图

```
uiStore (Phase 1)              musicPlayerStore (Phase 2 ☆)
├── isPlayerExpanded           ├── currentSong
├── isSearchOpen               ├── isPlaying / currentTime / duration
├── searchQuery                ├── volume / isMuted / playbackRate
└── actions (5)                ├── playMode
                               ├── queue / queueIndex
                               ├── buffered / loadingState
playerStore (Phase 1 legacy)   ├── lyrics / currentLyricIndex
├── (不再使用)                  └── actions (23)
└── (保留不删)

searchStore (Phase 3 ☆)
├── query / suggestions / hotKeywords / searchHistory
├── results: SearchResult | null
├── isSearching / searchError
├── activeView: "hot" | "history" | "suggestions" | "results"
└── actions (11)

userStore (Phase 4 ★)
├── user: UserInfo | null / isAuthenticated / isAnonymous / isLoading
└── actions: setUser / clearAuth / setLoading

libraryStore (Phase 4 ★)
├── likedSongIds: Set<string> / recentPlayIds: string[] / favoritePlaylistIds: Set<string>
└── actions: setLikedSongIds / toggleLikeOptimistic / setRecentPlayIds / addRecentPlayOptimistic / setFavoritePlaylistIds / toggleFavoriteOptimistic

playlistStore (Phase 4 ★)
├── editingPlaylistId / isCreateModalOpen / isAddSongModalOpen / pendingSongId
└── actions: openCreateModal / closeCreateModal / openAddSongModal / closeAddSongModal / setEditingPlaylist

socialStore (Phase 5 ★)
├── commentSortType: "hot" | "newest" / currentCommentSongId: string | null / activeReplyId: string | null
└── actions: setCommentSortType / setCurrentCommentSongId / setActiveReplyId

React Query (src/components/auth/AuthProvider.tsx)
├── QueryClientProvider 包裹整个应用
├── staleTime 30s / gcTime 10min / retry 2
├── 管理: comments (infinite), comment-likes, replies, song-detail
└── (不属于 zustand store)

AudioManager (单例, lib/audio/AudioManager.ts)
├── AudioEventCallbacks → musicPlayerStore.syncTime / .next / .setLoadingState / .setBuffered
└── (不属于 zustand store)

SearchService (music-source/services/)
├── MusicProvider → MockProvider (当前, SoundHelix public MP3)
├── SearchCache → 内存缓存 (staleTime/gcTime 按类型) + 请求去重
└── (不属于 zustand store)

systemStore (Phase 6 ★)
├── networkState: "online" | "offline" | "slow"
├── installState: { isInstalled, hasInstallPrompt, isIOS, isStandalone }
├── cacheStats: { metadataCount, offlinePlaylistCount, historyCount, lyricCount }
├── showInstallGuide / isBackgroundPlayback
└── actions: setNetworkState / setInstallState / dismissInstallGuide / setCacheStats / incrementCacheCount / setBackgroundPlayback

React Query (src/components/auth/AuthProvider.tsx)
├── QueryClientProvider 包裹整个应用
├── staleTime 30s / gcTime 10min / retry 2
├── 管理: liked-songs, playlists, playlist detail, recent-plays, favorite-playlists
└── (不属于 zustand store)
```

### 播放流程中的状态变化

```
1. 用户点击 SongRow
   → musicPlayerStore.play(song)
   → state: { currentSong, isPlaying: true, queue: [...], queueIndex }

2. useAudioPlayer effect 检测 currentSong?.audio_url 变化
   → AudioManager.load(url, callbacks)
   → AudioManager.play()

3. AudioManager RAF tick (throttle 200ms)
   → callbacks.onTimeUpdate(t, d)
   → musicPlayerStore.syncTime(t, d)
   → state: { currentTime, duration }

4. useLyricsSync effect 检测 currentTime 变化
   → LyricParser.findCurrentIndex(lyrics, timeMs)
   → musicPlayerStore.setCurrentLyricIndex(idx)
   → state: { currentLyricIndex }

5. AudioManager onEnded
   → musicPlayerStore.next()
   → state: { currentSong, queueIndex, isPlaying }
   → goto step 2
```

### 搜索流程 (Phase 3 ★)

```
1. 用户点击 SearchBar
   → uiStore.toggleSearch()
   → state: { isSearchOpen: true }
   → <SearchPage /> mounted, input auto-focus

2. 空输入状态
   → useHotKeywords → SearchService.getHotKeywords()
   → useSearchHistory → localStorage 读取

3. 用户输入 "七里"
   → useSearch.setQuery("七里")
   → debounce 300ms
   → SearchService.search("七里")
      ├── check pendingRequests (去重)
      ├── check cache (fresh hit → return)
      ├── provider.search("七里") → 模糊匹配 16 songs
      ├── cache.set(key, result)
      └── searchStore.setResults(result) → activeView = "results"

4. 搜索结果渲染
   → songs[] → SongRow × N (复用, 点击 → musicPlayerStore.play)
   → playlists[] → GlassCard grid
   → artists[] → 横向滚动
```

---

## 6. 当前播放器架构

### 音频链路

```
┌─────────────────────────────────────────────────────────┐
│                      AudioProvider                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ useAudio │  │useAudioPlayer│  │useLyricsSync     │  │
│  │(legacy)  │  │  (Phase 2 ★) │  │  (Phase 2 ★)     │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│       │               │                   │             │
│       ▼               ▼                   ▼             │
│  AudioEngine    AudioManager         LyricParser        │
│  (legacy)       (singleton)          (static)           │
│       │               │                   │             │
│       ▼               ▼                   ▼             │
│  HTML5 Audio #1  HTML5 Audio #2    musicPlayerStore     │
│  (unused)        (active)          .lyrics[]            │
│                                  .currentLyricIndex     │
└─────────────────────────────────────────────────────────┘
```

### UI 层级

```
RootLayout (Server Component)
├── metadata: PWA + iOS meta
├── viewport: device-width, no-scale, viewport-fit=cover
└── <html lang="zh-CN" class="dark">
    └── <body>
        └── AudioProvider (Client)
            ├── useAudio (legacy bridge)
            ├── useAudioPlayer (Phase 2 core ★)
            ├── useMediaSession (iOS control center)
            └── useLyricsSync (lyric sync)
            └── <main max-w-md mx-auto min-h-dvh>
                └── Page (Server)
                    ├── HomePage (Client)
                    │   ├── SearchBar → uiStore.toggleSearch
                    │   ├── RecommendSection → GlassCard grid (6 mock)
                    │   ├── HotSongsSection → SongRow[] (8 mock)
                    │   └── RecentPlaysSection → SongRow[] (3 mock)
                    │
                    ├── SearchPage (Client, z-40 overlay) ★ Phase 3
                    │   └── [isSearchOpen 时]
                    │       ├── 搜索栏 (glass, auto-focus, clear + close)
                    │       ├── [hot] HotKeywords + SearchHistory
                    │       ├── [suggestions] 搜索建议列表
                    │       └── [results] SearchResultsView
                    │           ├── SongRow[] (复用)
                    │           ├── GlassCard 歌单 grid
                    │           └── 艺术家横向滚动
                    │
                    └── BottomPlayer (Client, fixed bottom z-50)
                        ├── [条件] PlayerBar (mini, glass-heavy)
                        │   ├── 缓冲指示条 (loading时)
                        │   ├── ProgressBar + formatTime
                        │   ├── AlbumCover (56px, spin on play)
                        │   ├── 歌曲名 + 艺术家 → expandPlayer
                        │   └── PlayerControls (sm)
                        │
                        └── [条件] PlayerFullscreen (z-50 overlay, animate-fade-in)
                            ├── 背景: 封面 blur-2xl + 黑色叠加60%
                            ├── 顶部: IconButton(ChevronDown→collapse) + 专辑名 + IconButton(Dots)
                            ├── 中部:
                            │   ├── [无歌词] AlbumCover(xl=280px, spin) + 歌曲信息 + 操作按钮
                            │   └── [有歌词] LyricsView (全高, scrollIntoView)
                            └── 底部: ProgressBar + PlayerControls(lg) + VolumeSlider
```

---

## 7. 当前已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 项目配置 | ✅ | TypeScript strict, ESLint(no-any), Prettier |
| Apple Music 深色主题 | ✅ | 毛玻璃(.glass/.glass-heavy), 圆角卡片(.card), iOS 动效 |
| 移动端布局 | ✅ | max-w-md 居中, safe-area, viewport-fit: cover, 100dvh |
| PWA | ✅ | manifest.json + serwist SW + iOS meta tags |
| 首页 UI | ✅ | SearchBar + RecommendSection 2x3 + HotSongsSection 8首 + RecentPlaysSection 3首 |
| 歌曲行交互 | ✅ | 点击播放, 当前歌曲高亮(accent-primary), 播放动画指示器(pulse block) |
| 底部迷你播放器 | ✅ | 封面旋转(spin-slow) + 进度条(drag+touch) + 播放控制 + 点击展开 |
| 全屏播放器 | ✅ | 背景模糊 + 大封面280px(唱片样式) + 歌词 + 音量控制 |
| 进度条拖拽 | ✅ | mouse + touch 事件, 实时 formatTime |
| 播放控制 | ✅ | 播放/暂停, 上一首/下一首, 4 种播放模式(图标区分) |
| 音量控制 | ✅ | 拖动滑块 + 静音切换 + 3级图标状态 |
| 播放队列 | ✅ | setQueue, addToQueue, removeFromQueue, clearQueue |
| 播放模式 | ✅ | sequential(顺序停止) / repeat(循环) / repeat-one(单曲) / shuffle(Fisher-Yates) |
| 音频管理 | ✅ | HTML5 Audio 单例, RAF throttle 200ms, Page Visibility 节能, 加载状态4态 |
| 歌词解析 | ✅ | LRC 标准格式 + 多标签行 + 二分查找(O log n) |
| 歌词显示 | ✅ | 当前行高亮(text-xl font-semibold) + 自动滚动(smooth) + 点击seek + 渐变遮罩 |
| iOS 控制中心 | ✅ | Media Session API (play/pause/next/prev/seek + metadata) |
| Supabase Schema | ✅ | 6 表 + RLS + 4 索引 |
| 数据服务 | ✅ | songService (getHotSongs, getSongById, recordPlay, toggleLike) |
| 项目文档 | ✅ | 5 份 docs + 本文 |
| Provider 适配器架构 | ✅ | MusicProvider 接口 + MockProvider + SearchService + SearchCache |
| 搜索系统 | ✅ | SearchPage 全屏 overlay + 热门搜索 + 搜索历史 + 实时建议 + 搜索结果 |
| 搜索缓存 | ✅ | 内存缓存 (Map + staleTime/gcTime) + 请求去重 |
| Mock 数据 | ✅ | 52 歌曲 + 12 歌单 + 10 艺术家 + 5 LRC 歌词 + 20 热门词 |
| 匿名认证 | ✅ | Supabase signInAnonymously + 持久 UUID + 自动初始化 |
| 认证状态管理 | ✅ | userStore (Zustand) + AuthProvider (React Query + Auth) |
| 喜欢歌曲 | ✅ | toggleLike (optimistic) + 喜欢列表 + React Query cache |
| 歌单系统 | ✅ | 创建/删除歌单 + 添加/移除歌曲 + 收藏歌单 |
| 歌单详情 | ✅ | /playlist/[id] — 播放全部 + 收藏 + 删除 |
| 最近播放 | ✅ | 自动记录 (upsert) + 最近列表 + optimistic UI |
| 我的音乐页 | ✅ | /library — tabs (喜欢/歌单/最近) + 新建歌单 modal |
| 底部导航 | ✅ | MobileNav (发现/我的) + safe-area + backdrop-blur |
| React Query | ✅ | QueryClientProvider + staleTime/gcTime 配置 |
| 数据同步 | ✅ | Optimistic update + onError 回滚 + onSettled invalidate |
| 数据库迁移 | ✅ | recently_played + favorite_playlists + handle_new_user trigger |
| 歌曲评论 | ✅ | Phase 5 — 发表/删除/点赞/回复 + cursor pagination |
| 评论回复 | ✅ | Phase 5 — per-comment 内嵌回复 + lazy load |
| 评论点赞 | ✅ | Phase 5 — atomic RPC count + optimistic UI |
| 热门/最新排序 | ✅ | Phase 5 — 双tab切换 + 各自独立缓存key |
| 无限滚动 | ✅ | Phase 5 — IntersectionObserver + React Query infinite |
| 歌曲详情页 | ✅ | Phase 5 — /song/[id] 大封面+信息+评论 |
| 歌单详情增强 | ✅ | Phase 5 — bg blur + 大封面 + 收藏/删除 |
| 社交架构 | ✅ | Phase 5 — social services + socialStore + social hooks |
| PWA 增强 | ✅ | Phase 6 — SW 分层缓存 + manifest 增强 + iOS splash screens |
| 离线缓存 | ✅ | Phase 6 — IndexedDB (5 Object Stores) + CacheDB 封装 |
| 缓存服务 | ✅ | Phase 6 — audio/image/lyric 缓存 + 预加载队列 |
| Media Session 重写 | ✅ | Phase 6 — musicPlayerStore + positionState |
| PWA 安装 | ✅ | Phase 6 — InstallDetector + InstallPrompt (iOS guide) |
| 系统状态 | ✅ | Phase 6 — systemStore (network/install/cache/background) |
| 网络检测 | ✅ | Phase 6 — online/offline/slow + Network Info API |
| 页面过渡动画 | ✅ | Phase 6 — PageTransition + slide-down/pulse-glow |
| Provider Manager | ✅ | Phase 7 — 注册/切换/健康检测/Fallback/重试 (当前仅 mock) |
| Provider 架构 | ✅ | Phase 7 — ProviderManager + HealthTracker + RequestManager 保留完整 |
| ~~真实 Provider~~ | ❌ | Phase 7 — Netease/QQ/Kuwo/Bilibili 已删除 (Public Audio Mode) |
| ~~API 代理层~~ | ❌ | Phase 7 — 11 API Routes + proxy-helper 已删除 (零后端) |
| 请求稳定性 | ✅ | Phase 7 — 重试3次+指数退避+超时10s+去重+AbortController |
| 播放稳定性 | ✅ | Phase 7 — PlaybackStabilizer URL缓存 (架构保留) |
| 音源切换 UI | ✅ | Phase 7 — ProviderInit/ProviderStatusBar/FallbackNotice (仅 mock) |
| Mock 数据 | ✅ | 16 SoundHelix 公开 MP3 + 12 歌单 + 5 LRC 歌词 + 20 热门词 |
| Capacitor 封装 | ✅ | Phase 8 — capacitor.config.ts + iOS Info.plist + build scripts |
| 播放恢复系统 | ✅ | Phase 8 — PlaybackRecoverySystem (5s auto-save + beforeunload + restore) |
| 崩溃保护 | ✅ | Phase 8 — ErrorBoundary + AudioErrorBoundary + ProviderErrorBoundary + OfflineFallback |
| 日志系统 | ✅ | Phase 8 — Logger (audio/provider/playback/cache/debug) |
| 设置页 | ✅ | Phase 8 — /settings (音频/Provider/缓存/Debug/版本) |
| 下载系统预留 | ✅ | Phase 8 — DownloadManager (队列管理, 暂不实现离线下载) |
| 性能清理 | ✅ | Phase 8 — usePerformanceCleanup (10min GC + 过期清理) |
| SEO/Meta 优化 | ✅ | Phase 8 — AppMeta (OpenGraph + Apple Meta + PWA Meta) |
| AI 维护体系扩展 | ✅ | Phase 8 — 7 新文档 (CURRENT_TASK/KNOWN_ISSUES/API_MAP/STORE_MAP/PROVIDER_MAP/CACHE_ARCHITECTURE/PLAYBACK_FLOW) |
| 部署文档 | ✅ | Phase 8 — 4 部署指南 (Vercel/Supabase/TestFlight/Capacitor) |
| 动态配置中心 | ✅ | Phase 10 — RuntimeConfigManager (Provider/缓存/调试/实验开关 运行时配置) |
| Provider 热更新 | ✅ | Phase 10 — ProviderHotReload (动态启停/优先级/热切换, 无需重启APP) |
| 数据备份系统 | ✅ | Phase 10 — BackupManager (JSON export/download/restore + checksum 校验) |
| 数据迁移管道 | ✅ | Phase 10 — MigrationPipeline (幂等/带回滚/可追踪) |
| 部署模式检测 | ✅ | Phase 10 — DeploymentProfiles (local/vercel/cloudflare/hybrid 自动检测) |
| 内存监控 | ✅ | Phase 10 — MemoryMonitor (30s 采样, warning/critical 阈值) |
| 系统完整性检查 | ✅ | Phase 10 — SystemIntegrity (7 项关键检查 + 建议) |
| 灾难恢复 | ✅ | Phase 10 — DisasterRecovery (Quick/Full/Nuclear 三级恢复) |
| 自托管文档 | ✅ | Phase 10 — docs/self-host/ (Vercel+Supabase/Docker预留/Supabase替代) |
| AI 维护最终版 | ✅ | Phase 10 — 7 新 docs/ai/ 文档 (RUNTIME/RECOVERY/PROVIDER/CACHE/DEPLOYMENT/BACKUP/MIGRATION) |
| Remote Provider 架构 | ✅ | Phase 16A — RemoteProvider 接口 + EdgeProviderManager (熔断/重试/健康/Fallback) + RemoteWorkerProvider (mock) + RemoteConfig + ProviderHealthDashboard |
| 崩溃恢复增强 | ✅ | Phase 17 — CrashRecoverySystem (sessionStorage save/restore + pagehide/pageshow + bfcache + visibility change) |
| Provider 遥测 | ✅ | Phase 17 — ProviderTelemetry (successRate/failureRate/P50/P95/timeout/fallback + hourly buckets) |
| 缓存治理增强 | ✅ | Phase 17 — CacheGovernanceV2 (LRU eviction + size limit + low storage mode + stale cleanup) |
| 电池优化 | ✅ | Phase 17 — useBatteryOptimization (reduced motion + Battery API + visibility throttle + low power) |
| 稳定性监控 | ✅ | Phase 17 — useStabilityMonitor (background/lockscreen/bluetooth/network/weak/safari suspend-resume) |
| 错误边界增强 | ✅ | Phase 17 — EnhancedErrorBoundary (graceful degradation + AudioErrorFallback + DegradedIndicator + withErrorBoundary HOC) |
| 生产部署就绪 | ✅ | Phase 17 — manifest.json增强 (id/handle_links/launch_handler/OpenGraph) + layout ErrorBoundary wrap |
| 音频交叉淡化 | ✅ | Phase 18A — CrossfadeEngine (Web Audio API GainNode, 双槽A/B, 1-5s可调, linear/equal-power曲线) |
| 无缝播放 | ✅ | Phase 18A — PlayQueue.preloadNearEnd() + CrossfadeEngine 集成消除切歌间隙 |
| 音量归一化 | ✅ | Phase 18A — VolumeNormalizer (RMS分析, per-song gain 0.5-2.0) |
| 均衡器基础 | ✅ | Phase 18A — EQEngine (5-band BiquadFilterNode: 60Hz/250Hz/1k/4k/12k, 5预设) |
| 音频可视化 | ✅ | Phase 18A — VisualizationAnalyzer (AnalyserNode FFT) + VisualizerDisplay (Canvas waveform/bars/pulse) |
| 音频会话智能 | ✅ | Phase 18A — AudioSessionManager (AirPods断开/蓝牙变化/音频中断/音频闪避) |
| PWA 完整图标集 | ✅ | Phase 20B ★ 14 PNGs (76-512, apple icons, maskable) + favicon |
| iOS 启动画面 | ✅ | Phase 20B ★ 7 splash screens (iPhone 8→16PM + iPad Pro 11/12.9) |
| Notch/Dynamic Island | ✅ | Phase 20B ★ status-bar-spacer, pt-notch, pb-player-safe, min-h-notch CSS |
| 安装成功检测 | ✅ | Phase 20B ★ display-mode change watcher + install success toast |
| 独立模式引导 | ✅ | Phase 20B ★ StandaloneOnboarding 首次欢迎页 |
| Lighthouse 优化 | ✅ | Phase 20B ★ robots.txt, not-found page, color-scheme meta, aria-labels |
| SW 音频缓存 | ✅ | Phase 20B ★ soundhelix MP3 + external-cdn SWR + manifest SWR |
| 品牌打磨 | ✅ | Phase 20B ★ icons/launch visuals/metadata/theme-color |
| Bundle 拆分 | ✅ | Phase 20C ★ webpack splitChunks (audio/viz/supabase/icons/sw chunks) |
| Dynamic Import | ✅ | Phase 20C ★ 全部重型组件懒加载 (InstallPrompt/ProviderInit/FocusPlayer等) |
| 生产 Tree Shaking | ✅ | Phase 20C ★ removeConsole + dev-only 组件剥离 + DynamicImports 客户端包装 |
| AudioContext 内存优化 | ✅ | Phase 20C ★ memoryTrim/releaseMemory/reacquire + estimateMemoryUsage |
| 可视化内存释放 | ✅ | Phase 20C ★ VisualizationAnalyzer.trimMemory + EQEngine.trimMemory |
| 空闲资源释放 | ✅ | Phase 20C ★ useIdleResourceRelease (15s trim / 60s release / pagehide/bfcache) |
| Release 版本管理 | ✅ | Phase 20C ★ semantic versioning 1.0.0 + CHANGELOG.md + RELEASE_INFO |
| SW 版本治理 | ✅ | Phase 20C ★ versioned cache names (v1-) + activate legacy purge + migration |
| SW 更新 UX | ✅ | Phase 20C ★ SW_UPDATED message + SWUpdateNotification toast |
| 遥测采样 | ✅ | Phase 20C ★ 10% production sampling + 100% dev + always-record errors |
| 生产安全日志 | ✅ | Phase 20C ★ production-safe persist + no PII + stripped latency arrays |
| 最终构建验证 | ✅ | Phase 20C ★ lint clean + production build pass + route size audit |

---

## 8. 当前未实现功能

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 真实音源接入 | P0 | 将来在 ProviderManager 中注册真实 Provider (保留完整架构) |
| 真实数据连接 | P0 | 替换所有 mock 数据为 Supabase 真实查询 |
| Vercel 部署 | P0 | 项目上线 (已添加 Cloudflare Pages 推荐方案 + GitHub Actions CI/CD) |
| 邮箱登录 | P1 | email/password 登录/注册（匿名登录已完成） |
| Capacitor iOS 实机构建 | P1 | macOS + Xcode 构建 iOS App |
| 用户个人页 | P2 | `/profile` 页, 收藏列表, 播放历史 |
| 双语歌词 | P2 | LyricParser.parseEnhanced() 实现 |
| 队列可视化编辑 | P2 | 拖拽排序 + 批量操作 |
| 下载功能实现 | P2 | DownloadManager 接入 fetch + IndexedDB 分块存储 |
| Cloudflare Workers 部署 | P2 | Phase 16A 架构基础已完成，Phase 20A 完成生产部署与 CI/CD |
| iPad 横屏适配 | P3 | iPad landscape 布局 |

---

## 9. 当前禁止重构模块

> **以下模块绝对不允许修改、删除或重构，否则破坏现有系统**

### 禁止修改

| 文件/目录 | 原因 |
|-----------|------|
| `src/lib/audio/AudioEngine.ts` | Phase 1 legacy 音频引擎，useAudio 仍依赖 |
| `src/stores/playerStore.ts` | Phase 1 store，保留兼容，索引文件导出 |
| `src/hooks/useAudio.ts` | Phase 1 bridge，AudioProvider 中挂载 |
| `src/types/player.ts` | Phase 1 类型，music.ts re-export 其 PlayMode |
| `src/types/song.ts` | 基础 Song 类型（12 fields），被全项目引用 |
| `src/components/ui/GlassCard.tsx` | 基础组件，零业务依赖，forwardRef 接口稳定 |
| `src/components/ui/LazyImage.tsx` | 基础组件，被 AlbumCover/SongRow 使用 |
| `src/components/ui/Skeleton.tsx` | 基础组件，被 LazyImage 和 loading 状态使用 |
| `src/components/ui/IconButton.tsx` | 基础组件，被 PlayerControls/PlayerFullscreen 使用 |
| `src/app/globals.css` | 全局样式体系，.glass / .card / .skeleton / @layer base 被全站依赖 |
| `src/music-source/types/provider.ts` | MusicProvider 接口定义，所有 Provider 依赖此接口 |
| `src/music-source/services/SearchService.ts` | 统一数据入口，所有搜索请求必须经此服务 |
| `src/stores/userStore.ts` | Phase 4 认证状态，被 AuthProvider/useAuth 依赖 |
| `src/stores/libraryStore.ts` | Phase 4 乐观更新状态，被 useLikedSongs/useRecentPlayed/useLibrary 依赖 |
| `src/stores/playlistStore.ts` | Phase 4 UI 弹窗状态，被 LibraryPage 依赖 |
| `src/services/authService.ts` | Phase 4 认证服务，匿名登录唯一入口 |
| `src/services/likedSongsService.ts` | Phase 4 喜欢歌曲服务，toggleLike 核心逻辑 |
| `src/services/playlistService.ts` | Phase 4 歌单服务，CRUD + 收藏核心逻辑 |
| `src/services/recentPlayedService.ts` | Phase 4 播放记录服务，upsert 逻辑 |
| `src/components/auth/AuthProvider.tsx` | Phase 4 认证 + React Query Provider，最外层 Client Component |
| `src/services/social/commentService.ts` | Phase 5 评论核心服务，cursor pagination 逻辑 |
| `src/services/social/likeService.ts` | Phase 5 点赞核心服务，atomic RPC count |
| `src/services/social/replyService.ts` | Phase 5 回复核心服务 |
| `src/stores/systemStore.ts` | Phase 6 系统状态，被所有 layout hooks 依赖 |
| `src/storage/CacheDB.ts` | Phase 6 IndexedDB 核心封装，所有 storage 模块依赖 |
| `src/app/sw.ts` | Phase 6 SW 分层缓存策略，运行时缓存核心 |
| `src/music-source/providers/provider-manager/ProviderManager.ts` | Phase 7 Provider 管理核心，Fallback 链和注册逻辑 |
| `src/music-source/providers/provider-manager/HealthTracker.ts` | Phase 7 健康检测，滑动窗口核心算法 |
| `src/stores/providerStore.ts` | Phase 7 Provider UI 状态，被所有 provider hooks 依赖 |
| `src/music-source/cache/APICache.ts` | Phase 7 SWR 缓存核心，增强 SearchCache |
| `src/music-source/services/PlaybackStabilizer.ts` | Phase 7 播放稳定性，URL缓存+换源逻辑 |
| `src/music-source/providers/mock/MockProvider.ts` | Phase 7 永久兜底 Provider，不可删除 |
| `src/services/recovery/PlaybackRecoverySystem.ts` | Phase 8 播放恢复核心，saveState/restoreState 接口 |
| `src/components/error/ErrorBoundary.tsx` | Phase 8 全局错误边界，class component + auto-retry 逻辑 |
| `src/stores/settingsStore.ts` | Phase 8 设置状态，localStorage 持久化核心 |
| `mobile/capacitor.config.ts` | Phase 8 Capacitor 配置，appId/bundleId/plugins |
| `src/lib/logs/Logger.ts` | Phase 8 日志系统，分类日志 + buffer 管理 |
| `src/remote-provider/types/index.ts` | Phase 16A RemoteProvider 接口定义，所有 Remote Provider 依赖 |
| `src/remote-provider/core/EdgeProviderManager.ts` | Phase 16A 核心管理器，熔断/重试/健康/Fallback 算法 |
| `src/remote-provider/providers/RemoteWorkerProvider.ts` | Phase 16A Worker adapter 骨架 |
| `src/system/recovery/CrashRecoverySystem.ts` | Phase 17 崩溃恢复核心，sessionStorage + pagehide/pageshow 逻辑 |
| `src/system/telemetry/ProviderTelemetry.ts` | Phase 17 Provider 精细化指标，successRate/P50/P95 算法 |
| `src/system/cleanup/CacheGovernanceV2.ts` | Phase 17 增强缓存治理，LRU eviction + low storage 逻辑 |
| `src/components/error/EnhancedErrorBoundary.tsx` | Phase 17 增强错误边界，graceful degradation + AudioErrorFallback |
| `src/lib/audio/webaudio/AudioContextManager.ts` | Phase 18A AudioContext 生命周期核心 |
| `src/lib/audio/webaudio/CrossfadeEngine.ts` | Phase 18A Crossfade 核心算法 |
| `src/lib/audio/webaudio/EQEngine.ts` | Phase 18A EQ filter chain |
| `src/lib/audio/webaudio/VisualizationAnalyzer.ts` | Phase 18A AnalyserNode 管理 |
| `src/types/phase18.ts` | Phase 18A 类型定义 |
| `src/types/phase17.ts` | Phase 17 类型定义，CrashRecovery/ProviderMetricsV2/CacheGovernanceConfigV2 等 |
| `src/platform/env/EnvironmentGovernor.ts` | Phase 20A 环境治理核心，检测逻辑和环境配置 |
| `src/platform/url/SiteUrlResolver.ts` | Phase 20A 站点URL解析，PWA manifest 绝对路径 |
| `src/platform/safety/ProductionGuard.ts` | Phase 20A 生产安全守卫，错误清洗和功能门控 |
| `src/platform/config/EnvRegistry.ts` | Phase 20A 环境变量注册表，全项目 env var 唯一真相源 |
| `.github/workflows/` | Phase 20A CI/CD 管道 (validate/preview/production/rollback) |
| `public/icons/` | Phase 20B — 14 个 PNG 图标，由 generate-icons.mjs 生成 |
| `public/screenshots/` | Phase 20B — 7 个 iOS 启动画面，由 generate-icons.mjs 生成 |
| `public/manifest.json` | Phase 20B — 完整 PWA manifest (11 icons + screenshots + 2 shortcuts + launch_handler) |
| `public/robots.txt` | Phase 20B — 搜索引擎阻止 |
| `src/components/pwa/StandaloneOnboarding.tsx` | Phase 20B — 独立模式首次欢迎引导 |
| `scripts/generate-icons.mjs` | Phase 20B — sharp 图标/启动画面生成脚本 |
| `src/app/not-found.tsx` | Phase 20B — 自定义 404 页面 (Lighthouse) |
| `public/_routes.json` | Phase 20A Cloudflare Pages 路由配置，Pages+Worker 路由分离 |

### 可以扩展但不重构

| 文件 | 允许操作 |
|------|---------|
| `src/stores/musicPlayerStore.ts` | 可新增字段和 actions，不修改已有 API 签名 |
| `src/lib/audio/AudioManager.ts` | 可新增功能方法（如预加载队列），不修改已有 API 签名 |
| `src/lib/lyrics/LyricParser.ts` | 可新增解析方法（如 parseEnhanced），不修改 parse() 返回格式 |
| `src/components/player/PlayerFullscreen.tsx` | 可新增区域（如队列面板），不删除已有 UI |
| `src/components/player/PlayerBar.tsx` | 外观微调可接受，不改变交互逻辑 |
| `src/components/home/SongRow.tsx` | 可新增操作按钮，不修改 play/togglePlay 逻辑 |
| `src/music-source/providers/mock/` | 可新增 mock 数据（歌曲/歌单/艺术家），不修改 MockProvider API |
| `src/stores/searchStore.ts` | 可新增字段和 actions，不修改已有 API 签名 |
| `src/components/search/SearchPage.tsx` | 可新增搜索视图状态，不修改已有状态流转 |
| `src/components/search/SearchResultsView.tsx` | 可新增结果区块（如专辑列表），不删除已有 section |
| `src/music-source/cache/SearchCache.ts` | 可新增缓存分类配置，不修改已有 API |
| `src/music-source/hooks/` | 可新增 hooks，不修改已有 hook 的返回值结构 |
| `src/stores/libraryStore.ts` | 可新增乐观更新字段，不修改已有 action 签名 |
| `src/stores/playlistStore.ts` | 可新增 UI 状态字段，不修改已有 action 签名 |
| `src/hooks/useLikedSongs.ts` | 可新增查询参数（分页等），不修改返回值结构 |
| `src/hooks/usePlaylist.ts` | 可新增歌单操作（重命名等），不修改已有返回值结构 |
| `src/hooks/useRecentPlayed.ts` | 可新增过滤/清除功能，不修改 recordPlay 逻辑 |
| `src/components/library/LibraryPage.tsx` | 可新增 tab 页，不修改已有 tab 逻辑 |
| `src/components/library/PlaylistCard.tsx` | 外观可调，不修改 Link href 路由 |
| `src/components/layout/MobileNav.tsx` | 可新增 tab，不修改已有路由和样式 |
| `src/app/library/page.tsx` | 可新增同页组件，保持 Server Component |
| `src/stores/socialStore.ts` | 可新增字段和 actions，不修改已有 API 签名 |
| `src/hooks/useComments.ts` | 可新增查询筛选参数，不修改返回值结构 |
| `src/hooks/useCommentLike.ts` | 可扩展，不修改 toggleLike 签名 |
| `src/hooks/useReplies.ts` | 可新增分页参数，不修改 addReply/deleteReply 签名 |
| `src/components/comments/CommentCard.tsx` | 可新增交互入口（长按菜单），不修改已有 action 逻辑 |
| `src/components/comments/CommentList.tsx` | 可新增筛选/搜索，不修改 infinite scroll 逻辑 |
| `src/app/song/[id]/page.tsx` | 可新增区域（相似歌曲），不修改现有布局结构 |
| `src/app/playlist/[id]/page.tsx` | 可新增排序/过滤，不修改播放/收藏核心功能 |
| `src/stores/systemStore.ts` | 可新增系统状态字段和 actions，不修改已有 API 签名 |
| `src/storage/` (所有模块) | 可新增 Object Store，不修改已有 schema 和 DB_VERSION |
| `src/services/cache/` (所有模块) | 可新增缓存策略方法，不修改已有 API 签名 |
| `src/hooks/usePWAInstall.ts` | 可新增安装事件处理，不修改返回值结构 |
| `src/hooks/useNetworkState.ts` | 可新增网络质量指标，不修改返回值结构 |
| `src/hooks/useAudioCache.ts` | 可新增缓存优先级策略，不修改挂载位置 |
| `src/hooks/useCrashRecovery.ts` | 可新增恢复场景，不修改 CrashRecoverySystem 挂载逻辑 |
| `src/hooks/useStabilityMonitor.ts` | 可新增监控事件类型，不修改已有事件监听器 |
| `src/hooks/useBatteryOptimization.ts` | 可配置优化阈值，不修改 BatteryManager 类型检测 |
| `src/hooks/useProductionMonitor.ts` | 可新增监控指标，不修改 ProviderTelemetry 挂载时机 |
| `src/components/pwa/InstallPrompt.tsx` | Phase 20B 安装成功检测已添加，外观可调，不修改触发逻辑和 display-mode watcher |
| `src/components/pwa/StandaloneOnboarding.tsx` | Phase 20B 独立模式首次欢迎页，内容可调，不修改 localStorage key 和触发逻辑 |
| `src/components/seo/AppMeta.tsx` | Phase 20B 增强，可新增 meta 标签，不删除已有 PWA/iOS 核心标签 |
| `public/manifest.json` | 可新增 shortcuts/screenshots，不可删除已有 icon 配置或修改 display/orientation |
| `src/components/layout/PageTransition.tsx` | 可新增动画变体，不修改 routeKey 驱动机制 |
| `src/music-source/providers/provider-manager/ProviderManager.ts` | 可新增方法，不修改 fallback 链和注册逻辑 |
| `src/music-source/providers/provider-manager/HealthTracker.ts` | 可配置阈值参数，不修改健康判定核心逻辑 |
| `src/stores/providerStore.ts` | 可新增字段和 actions，不修改已有 API 签名 |
| `src/components/provider/ProviderDebugPanel.tsx` | 外观可调，仅开发环境渲染 |
| `src/components/provider/FallbackNotice.tsx` | 外观可调，不修改触发逻辑和自动消失时间 |
| `workers/` (所有文件) | 可完善实现，不修改目录结构和接口定义 |
| `src/hooks/usePlaybackRecovery.ts` | 可新增恢复场景，不修改 saveState 方法签名 |
| `src/components/settings/SettingsPage.tsx` | 可新增设置项，不修改已有 section 结构 |
| `src/services/download/DownloadManager.ts` | 可完善下载实现 (fetch + IndexedDB)，不修改公共 API |
| `mobile/scripts/` | 可新增构建脚本，不修改已有脚本签名 |
| `docs/deployment/` | 可新增部署文档，不删除已有文档 |
| `docs/ai/` (新7份文档) | 可扩展内容，保持 markdown 格式 |

---

## 10. 当前代码规范

```
TypeScript:
  - strict: true
  - noUncheckedIndexedAccess: true
  - noUnusedLocals: true, noUnusedParameters: true (argsIgnorePattern ^_)
  - forceConsistentCasingInFileNames: true
  - paths: @/* → ./src/*
  - target: ES2017, module: esnext, moduleResolution: bundler

ESLint:
  - extends: next/core-web-vitals + next/typescript
  - no-explicit-any: error
  - prefer-const: error
  - no-unused-vars: error (with ignorePattern)
  - react/self-closing-comp: error

Prettier:
  - semi: true, singleQuote: false
  - tabWidth: 2, trailingComma: all
  - printWidth: 100, arrowParens: always
  - endOfLine: lf

命名:
  - 组件文件名: PascalCase (PlayerBar.tsx)
  - Hook 文件名: use prefix (useAudioPlayer.ts)
  - Store 文件名: Store 后缀 (musicPlayerStore.ts)
  - Service 文件名: Service 后缀 (songService.ts)
  - 目录名: 小写 (player, home, ui, layout)

组件:
  - "use client" 只在需要浏览器 API 时添加
  - Server Component 用于数据获取
  - Client Component 用于交互
  - forwardRef 用于需要 ref 的 UI 组件
  - displayName 明确设置

Store:
  - 类型在 types/ 定义（interface）
  - 实现在 stores/（create 函数）
  - Action 使用 get() 而非闭包 state 获取实时数据
  - 导出 hook (useXxxStore) 而非直接导出 store

Hooks:
  - 逻辑与 UI 分离
  - useCallback 用于传给子组件的回调（稳定引用）
  - useEffect 依赖遵循 react-hooks/exhaustive-deps 意图

样式:
  - TailwindCSS utility-first
  - 自定义样式在 globals.css @layer components
  - cn() 函数 (clsx + tailwind-merge) 用于组合类名
  - 毛玻璃: .glass (blur 20px) / .glass-heavy (blur 40px)
  - 卡片: .card (圆角 + active:scale 0.97)
  - 骨架屏: .skeleton (shimmer 动画)
```

---

## 11. 当前 UI 规范

```
色彩体系 (Apple Music — tailwind.config.ts):
  background:    #0a0a0a      主背景
  surface:       rgba(28,28,30,0.8)   毛玻璃面
  surface-elevated: rgba(44,44,46,0.85)
  surface-highlight: rgba(58,58,60,0.9)
  accent-primary:  #ff2d55     Apple 红
  accent-secondary: #007aff    Apple 蓝
  accent-tertiary:  #34c759    Apple 绿
  text-primary:    #f5f5f7     主文字
  text-secondary:  #98989d     次要文字
  text-tertiary:   #636366     辅助文字

圆角:
  apple:      12px    (歌曲行, 封面小)
  apple-lg:   20px    (卡片, 弹窗)
  apple-xl:   28px    (大面板, PlayerBar)

毛玻璃 (globals.css @layer components):
  .glass:       blur(20px) saturate(180%), bg-surface
  .glass-heavy: blur(40px) saturate(200%), bg-surface-elevated

字体 (tailwind.config.ts fontFamily.sans):
  -apple-system, BlinkMacSystemFont,
  "SF Pro Display", "SF Pro Text",
  "Helvetica Neue", Helvetica, Arial, sans-serif

动画 (tailwind.config.ts):
  spin-slow:      8s linear infinite 旋转 (专辑封面)
  fade-in:        0.4s ease-out
  slide-up:       0.4s cubic-bezier(0.16,1,0.3,1)
  scale-in:       0.3s cubic-bezier(0.16,1,0.3,1)
  shimmer:        2s infinite (骨架屏)

交互反馈:
  card:active:    scale(0.97)
  button:active:  scale(0.95)
  iconbutton:active: scale(0.90)

布局:
  max-w-md mx-auto 居中
  safe-area inset (env(safe-area-inset-*))
  overscroll-behavior: none
  隐藏滚动条 (::-webkit-scrollbar { width:0; height:0 })
  触摸高亮透明 (-webkit-tap-highlight-color: transparent)
  禁止文本选择 (-webkit-user-select: none)

iPhone 适配:
  viewport-fit: cover
  user-scalable: false
  webkit-tap-highlight-color: transparent
  input font-size: 16px (防缩放)
  min-height: 100dvh (动态视口)
```

---

## 12. 当前性能优化策略

```
已实现:
  ✅ next/image 懒加载 (LazyImage 组件)
  ✅ optimizePackageImports (@tabler/icons-react, @supabase/supabase-js)
  ✅ 音频 RAF throttle 200ms (~5fps, 减少 React 渲染)
  ✅ Page Visibility API (tab 不可见时停止 RAF, 节省 CPU)
  ✅ 单例 AudioManager (防止多个 Audio 实例, 避免内存泄漏)
  ✅ useCallback 稳定引用 (减少子组件无谓重渲染)
  ✅ AVIF/WebP 图片格式 (next.config.ts images.formats)
  ✅ 滚动条隐藏 (无 layout shift)
  ✅ preload="auto" 音频 (减少播放延迟)
  ✅ css animation GPU 加速 (封面旋转使用 transform)

预留:
  🔲 音频缓存 (Service Worker runtime cache via serwist)
  🔲 虚拟列表 (长歌单 >100 首)
  🔲 代码分割 (Suspense + dynamic import 大组件)
  🔲 图片 blur placeholder (next/image blurDataURL)
  🔲 useMemo 用于复杂计算 (如歌词列表渲染)
```

---

## 13. 当前 iPhone 兼容策略

```
已实现:
  ✅ PWA standalone 模式 (manifest.json display: standalone)
  ✅ iOS 状态栏 (apple-mobile-web-app-status-bar-style: black-translucent)
  ✅ 安全区域 (env(safe-area-inset-*))
  ✅ 触摸优化 (-webkit-tap-highlight-color: transparent)
  ✅ 输入缩放修复 (font-size: 16px)
  ✅ 弹性滚动禁用 (overscroll-behavior: none)
  ✅ 动态视口 (100dvh)
  ✅ Media Session API (控制中心 + 锁屏: play/pause/next/prev/seek + positionState)
  ✅ audiointerruption 事件监听 (AudioSessionManager)
  ✅ 页面可见性 API (节省电量)
  ✅ 封面旋转使用 CSS animation (GPU 加速 via transform)
  ✅ text-size-adjust: 100% (防止 iOS 文本缩放)
  ✅ -webkit-font-smoothing: antialiased

已实现 (2026-05 补充):
  ✅ safeUUID() — crypto.randomUUID() iOS Safari 兼容替代 (src/lib/safeUUID.ts)
  ✅ Supabase safeCreateClient() — env 为空时安全降级，不崩溃

Phase 20B (2026-05-29):
  ✅ 完整 PWA 图标集 (11 sizes + maskable icons)
  ✅ 7 个 iOS 启动画面 (iPhone 8→16 Pro Max + iPad Pro)
  ✅ Notch/Dynamic Island safe-area CSS (status-bar-spacer, pt-notch, pb-player-safe, min-h-notch)
  ✅ Standalone 模式 CSS 变量 (--safe-area-inset-*)
  ✅ Orientation lock (portrait-primary) + landscape 警告预留
  ✅ 安装成功检测 (display-mode change watcher + toast)
  ✅ 独立模式首次欢迎引导 (StandaloneOnboarding)
  ✅ PWA manifest 增强 (launch_handler/client_mode, screenshots, 2 shortcuts)
  ✅ SW 增强 (音频缓存 soundhelix MP3s, external-cdn SWR, manifest SWR)
  ✅ Lighthouse 优化 (robots.txt, not-found page, color-scheme meta, aria-labels)

待处理:
  🔲 首次用户手势解锁音频 (AudioContext 策略)
  🔲 Background Audio 持续播放测试
  🔲 真实设备锁屏控制验证
  🔲 真实设备锁屏控制验证
  🔲 耳机线控 (remote control events)
  🔲 AirPlay / CarPlay 集成
```

---

## 14. 下一阶段开发目标

### 已完成 ✅

1. Phase 1 — 基础框架 (项目配置/主题/类型/UI基础组件/播放器组件/首页/音频/后端)
2. Phase 2 — 音乐播放器核心系统 (AudioManager/musicPlayerStore/LyricParser/LyricsView/PlayerFullscreen/VolumeSlider)
3. Phase 3 — 搜索系统 + 音源抽象层 (Provider Adapter + MockProvider + SearchService + SearchCache + searchStore + SearchPage)
4. Phase 4 — 用户系统 + 收藏 + 歌单 (匿名认证/喜欢歌曲/歌单CRUD/最近播放/收藏歌单/我的音乐页/底部导航)
5. Phase 5 — 评论系统 + 社交互动基础 + 歌曲详情页 (song_comments/comment_likes/comment_replies + infinite scroll + SongDetailPage + PlaylistDetailPage增强)
6. Phase 6 — PWA增强 + iPhone体验优化 + 离线能力 + 后台播放 (SW分层缓存 + IndexedDB 5 stores + 缓存服务 + PWA安装 + MediaSession重写)
7. Phase 7 — 真实音源接入 + Provider动态切换 + 稳定性系统 (ProviderManager/HealthTracker/RequestManager/APICache SWR/PlaybackStabilizer/Cloudflare Workers预留。NetEase+QQ+Kuwo+API Routes 已删除 — Public Audio Mode)
8. Phase 8 — iOS封装预留 + TestFlight准备 + 私用稳定化 + 最终产品化 ✅ (Capacitor封装/PlaybackRecovery/ErrorBoundary/SettingsPage/Logger/DownloadManager预留/usePerformanceCleanup/AppMeta/AI维护体系扩展/部署文档)
9. Phase 9 — 系统最终稳定化 + 自动化维护体系 + 私用长期运行架构 ✅ (PlaybackWatchdog/ProviderSelfHealing/CacheGovernance/Telemetry/StartupRecoveryPipeline/DiagnosticsCenter/DebugOverlay/ReleaseMode/AI长期维护体系)
10. Phase 10 — 最终私用产品完善 + 自托管能力 + 长期可持续维护架构 ✅ (RuntimeConfigManager/ProviderHotReload/BackupManager/MigrationPipeline/DeploymentProfiles/MemoryMonitor/SystemIntegrity/DisasterRecovery/SelfHost/AI维护最终版)
11. Phase 11 — AI原生最终工程体系 + 完整自动运维体系 + 长期演进架构 ✅ (AI_PROJECT_INDEX/AI_ONBOARDING_PROTOCOL/AutoDiagnostics/ArchitectureSnapshotManager/RuntimeGovernanceManager/MaintenanceMode/TECHNICAL_DEBT/PROVIDER_RISK_ANALYSIS/AI_RECOVERY_BOOTSTRAP/PROJECT_GOVERNANCE/LONG_TERM_EVOLUTION/DEPLOYMENT_SNAPSHOT)
12. Phase 12 — 最终私用生态闭环 + 本地化扩展能力 + AI长期自治维护 ✅ (LocalMediaProvider/WebDAV/NAS/MediaScanner/AIAutonomyManager/GovernancePipeline/DegradedRuntimeMode/RuntimeProfiles/ProjectArchiveSystem/SystemStatusPage/Ecosystem Docs)
13. Phase 13 — 最终长期冻结版 ✅ (FrozenRuntimeManager/AutonomousMaintenanceLoop/RuntimeIsolationLayer/SelfHealingGovernance/SnapshotRotationManager/DisasterRecoveryProtocol/FrozenGovernanceManager/AIBootstrapLayer/AutonomousArchiveManager/FINAL_FREEZE_STATE)
14. Phase 12 (iOS Audio) — iPhone Audio Experience Upgrade ✅ (useIOSBackground/PlayQueue/AudioManager play()增强/MediaSession seekback-forward/PWA双通道安装/AlbumCover GPU旋转/ProgressBar scaleX动画/PlayerBar now-playing指示)
15. Phase 13 (Now Playing) — Now Playing Experience Upgrade ✅ (17首mock歌词/parseEnhanced/spring缓动/共享元素过渡/QueuePanel拖拽排序+历史+自动续播/dominantColor主色调/dynamic gradient背景/spring-up弹簧动画)
16. Phase 14 (Native Feeling) — Native iOS Feeling Upgrade ✅ (HapticService/GestureUtils/OfflineService/PerformanceGovernor/WaveformBar/swipe-down dismiss/inertia scroll/breathing glow/morph animation/true offline)
17. Phase 15 (Smart Music UX) — Smart Music UX ✅ (PlayTracker/SmartPlaylist/SleepTimer/FocusMode/ForYou/Stats/analyticsStore/focusStore)
18. Phase 16A (Remote Provider) — Remote Provider Architecture Foundation ✅ (RemoteProvider接口/EdgeProviderManager(熔断+重试+健康)/RemoteWorkerProvider(mock)/RemoteConfig/ProviderHealthDashboard)
19. Phase 16B (Real Remote Source) — Real Remote Source Integration ✅ (InternetArchiveProvider/JamendoProvider/CcMixterProvider/CloudflareWorker(real)/BaseRemoteProvider/HealthTester/NetworkSimulator/NetworkValidator/RemoteEnv/wrangler.toml)
20. **Phase 17 (Production Hardening)** — 生产严谨化 ✅ (CrashRecovery/ProviderTelemetry/CacheGovernanceV2/useBatteryOptimization/useStabilityMonitor/EnhancedErrorBoundary/useProductionMonitor/manifest增强)
21. **Phase 18A (Advanced Audio Experience)** — 高级音频体验基础 ✅ (AudioContextManager/CrossfadeEngine/EQEngine+5Presets/VolumeNormalizer/VisualizationAnalyzer+VisualizerDisplay/AudioSessionManager/Gapless Playback)
22. **Phase 20A (Production Deploy Foundation)** — 生产部署基础 ✅ (Cloudflare Pages/自定义域名/环境治理/Worker生产集成/GitHub Actions CI/CD/生产安全)
23. **Phase 20B (PWA & iPhone Final Polish)** — PWA最终打磨 ✅ (完整图标集/启动画面/安装UX/独立模式引导/notch安全区/Lighthouse优化/品牌打磨)

### 当前优先级建议

**Phase 11 (AI原生工程体系)** ✅ 已完成
- AI_PROJECT_INDEX / AI_ONBOARDING_PROTOCOL / AutoDiagnostics / ArchitectureSnapshotManager / RuntimeGovernanceManager / MaintenanceMode / TECHNICAL_DEBT / PROVIDER_RISK_ANALYSIS / AI_RECOVERY_BOOTSTRAP / PROJECT_GOVERNANCE / LONG_TERM_EVOLUTION / DEPLOYMENT_SNAPSHOT

**Phase 12 (最终私用生态闭环)** ✅ 已完成
- LocalMediaProvider / WebDAV/NAS预留 / MediaScanner / AIAutonomyManager / GovernancePipeline / DegradedRuntimeMode / RuntimeProfiles / ProjectArchiveSystem / SystemStatusPage / 6 份新 Ecosystem AI 文档 / AI_CONTEXT_RECOVERY.md 升级

**Phase 13 (最终长期冻结版)** ✅ 已完成 — 当前阶段
- FrozenRuntimeManager / AutonomousMaintenanceLoop / RuntimeIsolationLayer / SelfHealingGovernance / SnapshotRotationManager / DisasterRecoveryProtocol / FrozenGovernanceManager / AIBootstrapLayer / AutonomousArchiveManager / 8 份 Phase 13 新文档 / FINAL_FREEZE_STATE

**Phase 12 (iOS Audio Experience)** ✅ 已完成
- useIOSBackground / PlayQueue / AudioManager play()增强 / useMediaSession 8 handlers / PWA双通道安装 / AlbumCover GPU旋转 / ProgressBar scaleX动画 / PlayerBar now-playing指示 / 2新文件 + 11增强文件

**Phase 13 (Now Playing Experience)** ✅ 已完成
- 17首mock歌词 / parseEnhanced双语解析 / LyricsView spring缓动 / 共享元素cover过渡 / QueuePanel拖拽+历史+自动续播 / dominantColor主色调 / spring动画 / 4新文件 + 9增强文件

**P0 (下一阶段 — 让应用可用)**
1. **真实数据连接** — 替换所有 mock 数据为 Supabase 真实查询
2. **Vercel 部署** — 生产环境上线

**P1 (重要 — 增强体验)**
3. **真实 API 端点** — 在各 API Route 中接入真实音乐 API URL
4. **邮箱登录** — email/password 登录/注册（升级匿名用户）
5. **Capacitor iOS 实机构建** — macOS + Xcode 构建 TestFlight 版本

**P2 (可延后)**
6. 用户个人页 (`/profile`)
7. 双语歌词 (parseEnhanced 实现)
8. 队列可视化编辑 (拖拽排序)
9. 下载功能实现 (DownloadManager 接入 fetch + IndexedDB)
10. Cloudflare Workers 部署

**P3 (长远)**
11. iPad 横屏适配

---

## 16. 当前系统健康状态 (Phase 9)

### Watchdog 状态
- 实例: `src/system/watchdog/PlaybackWatchdog.ts` (单例)
- 检测间隔: 2s, 卡顿阈值: 5s, 超时阈值: 30s
- 恢复策略: resume → reload → skip_to_next
- 挂载点: `useSystemWatchdog()` in AudioProvider

### Provider 自愈
- 实例: `src/system/recovery/ProviderSelfHealing.ts` (单例)
- 评分: latencyScore(30%) + healthScore(70%) - failurePenalty
- 降级阈值: compositeScore < 30, 恢复阈值: >= 70
- 失败冷却: 5min, 探测间隔: 30s

### 缓存治理
- 实例: `src/system/cleanup/CacheGovernance.ts` (单例)
- 清理间隔: 10min, 歌词保留: 7天, 历史上限: 500条

### 遥测
- 实例: `src/system/telemetry/TelemetryService.ts` (单例)
- 存储: localStorage 环形buffer, 最大: 1000条

---

## 17. 当前 Provider 评分

每个 Provider 有 latency/health/composite 三个评分。
查看: `/diagnostics` → Provider tab
Fallback 链: `mock (P0)` — 当前仅本地 Demo 音源，将来可扩展为 `real_provider → mock (兜底)`

---

## 18. 当前性能瓶颈

参见: `docs/ai/CURRENT_BOTTLENECKS.md`
主要: 真实音源未接入(P0, 架构已保留), 无单元测试(P1), Audio单例限制(Low)
Public Audio Mode 已解决播放可用性 — 16 首 SoundHelix demo 可直接播放

---

## 19. Watchdog 架构

```
PlaybackWatchdog (src/system/watchdog/)
├── tick() 每2s
│   ├── checkStall: currentTime 5s no change → resume/reload/skip
│   ├── checkTimeout: loading > 30s → reload/skip
│   └── handleError: loadingState=error → skip
├── triggerEvent → determineRecovery → executeRecovery
└── State: isRunning / stallCount / totalRecoveries / recentEvents[]
```

---

## 20. 缓存健康状态

三层缓存: Memory(SearchCache+APICache) / IndexedDB(5 Stores) / SW(Cache API)
治理: CacheGovernanceSystem 每10min自动清理。查看: `/diagnostics` → Cache tab

---

## 21. 部署状态

参见: `docs/deployment/CLOUDFLARE_PAGES.md`
Cloudflare Pages: 生产部署就绪 (Phase 20A) — GitHub Actions CI/CD + 预览/生产环境分离 + Worker 集成
Vercel: 备选部署方案 (文档保留), Supabase: Schema ready (可选), Capacitor iOS: 封装完成待实机构建
Release Mode: `NEXT_PUBLIC_RELEASE_MODE=debug|internal|release`
当前: `debug` (本地开发模式, MockProvider + SoundHelix demo songs)
环境治理: local / preview / production 严格分离 (EnvironmentGovernor)

---

## 22. iOS 兼容状态

PWA standalone ✅, Media Session ✅, Safe Area ✅, Splash Screen ✅ (5尺寸)
Install Prompt ✅, Capacitor WKWebView ✅ 配置完成, TestFlight 待构建

---

## 23. 长期维护建议

1. 每次新 AI 接手 → 先读本文 + 6 份 docs/ai/ 新文档
2. 每次代码变更 → 更新 docs/ai/ 文档
3. 定期检查 → `/diagnostics` 查看系统健康
4. 性能监控 → Telemetry export JSON
5. 缓存管理 → 设置页手动清理或自动治理
6. 故障排查 → docs/ai/FAILURE_RECOVERY_GUIDE.md

### Phase 9 系统文件索引

```
src/system/
├── watchdog/PlaybackWatchdog.ts       ★ 播放看门狗
├── recovery/ProviderSelfHealing.ts    ★ Provider自愈
├── recovery/StartupRecoveryPipeline.ts ★ 启动恢复管道
├── cleanup/CacheGovernance.ts         ★ 缓存治理
├── telemetry/TelemetryService.ts      ★ 遥测服务
├── diagnostics/DevDiagnosticsPage.tsx  ★ 诊断中心
├── diagnostics/DebugOverlay.tsx        ★ 调试浮层
├── diagnostics/DebugOverlayWrapper.tsx ★ 调试浮层条件渲染
├── monitor/useSystemWatchdog.ts        ★ 系统监控Hook
└── monitor/ReleaseMode.ts              ★ 发布模式管理

src/types/phase9.ts                    ★ Phase 9 类型定义
src/app/diagnostics/page.tsx           ★ /diagnostics 路由
.env.example                            ★ 环境变量模板
```

---

## 24. 当前 RuntimeConfig 状态 (Phase 10)

- 实例: `src/platform/config/RuntimeConfigManager.ts` (单例)
- 存储: localStorage (music_runtime_config)
- 配置项: providers (4个), cache (6项), debug (5项), experiments (动态)
- 支持: local config / remote config (预留) / env merge / runtime override
- 修改入口: Settings → 音源优先级 / 缓存策略 / Debug 设置

---

## 25. 当前 Provider 热更新状态 (Phase 10)

- 实例: `src/platform/update/ProviderHotReload.ts` (单例)
- 功能: 动态启停/优先级调整/热切换/自动替换
- 不需重启APP即可切换Provider
- 切换历史保存在内存中 (最多20条)
- 与 RuntimeConfigManager 双向同步

---

## 26. 当前备份机制 (Phase 10)

- 实例: `src/platform/backup/BackupManager.ts` (单例)
- 范围: full / playlists / liked / config / cache_index
- 格式: JSON (含 manifest + checksum SHA-256)
- 操作: export JSON → download → restore from file
- 用户入口: Settings → 导出备份 / 恢复备份

---

## 27. 当前迁移版本 (Phase 10)

- 实例: `src/platform/migration/MigrationPipeline.ts` (单例)
- 当前版本: 1
- 已应用: 无
- 内置迁移: v2 (storage key namespacing), v3 (IDB schema check 预留)
- 原则: 幂等/带回滚/原子/可追踪

---

## 28. 当前部署模式 (Phase 10)

- 自动检测: `detectDeploymentMode()` → local/vercel/cloudflare/hybrid
- Profile: `getDeploymentProfile()` → 特性/存储/环境变量
- 当前: local (开发模式)

---

## 29. 当前恢复管线 (Phase 10)

- Layer 1: Watchdog (自动, 2s检测)
- Layer 2: StartupRecoveryPipeline (启动时)
- Layer 3: DisasterRecovery (手动, 三级: Quick/Full/Nuclear)
- 检查点: 5 个最近 (localStorage), 关键操作前创建

---

## 30. 当前已废弃/删除模块

以下模块已在 Public Audio Mode 迁移中删除（2026-05-28）：

### 已删除 — Provider 层
- `src/music-source/providers/BaseProxyProvider.ts` — 真实 Provider 基类（不再需要代理模式）
- `src/music-source/providers/netease/` — 网易云音乐 Provider + 客户端
- `src/music-source/providers/qq/` — QQ 音乐 Provider
- `src/music-source/providers/kuwo/` — 酷我音乐 Provider
- `src/music-source/providers/bilibili/` — Bilibili Provider

### 已删除 — API 代理层
- `src/server/api/netease-client.ts` — NeteaseCloudMusicApi 客户端
- `src/server/api/proxy-helper.ts` — API 代理辅助函数
- `src/app/api/music/search/route.ts` — 搜索 API
- `src/app/api/music/suggestions/route.ts` — 建议 API
- `src/app/api/music/hotkeywords/route.ts` — 热门搜索词 API
- `src/app/api/music/song/[id]/route.ts` — 歌曲详情 API
- `src/app/api/music/song/[id]/play/route.ts` — 播放 URL API
- `src/app/api/music/song/[id]/lyrics/route.ts` — 歌词 API
- `src/app/api/music/artist/[id]/route.ts` — 艺术家 API
- `src/app/api/music/artist/[id]/songs/route.ts` — 艺术家歌曲 API
- `src/app/api/music/playlist/[id]/route.ts` — 歌单 API
- `src/app/api/music/playlist/[id]/songs/route.ts` — 歌单歌曲 API
- `src/app/api/provider/health/route.ts` — Provider 健康 API

### 保留但不再使用的模块
- `workers/` — Cloudflare Workers 预留（架构保留，将来可重新部署）

### 删除原因
- 放弃本地 NeteaseCloudMusicApi 部署
- 切换到 Public Audio Mode：内置 SoundHelix 公开 demo 歌曲
- Provider 架构完整保留，将来注册新 Provider 即可接入真实音源

---

## 31. 未来升级建议

1. 注册真实音源 Provider 到 ProviderManager (P0) — 架构已完整保留，只需实现 MusicProvider 接口
2. Vercel 生产部署 (P0) — 当前零后端，可直接部署
3. 连接 Supabase 真实数据 (P0) — SCHEMA READY，env 配置即可
4. Capacitor iOS 实机构建 (P1)
5. Docker 化部署 (P2)
6. Cloudflare Workers 部署 (P3)
7. 远程配置服务接入 (P3, RuntimeConfigManager.mergeRemoteConfig 已预留)

---

## 15. 后续 AI 接手规则

### 接收项目时（必须按此顺序）

```
Step 1: 读本文 (docs/AI_CONTEXT_RECOVERY.md)                         ← 你在这里
Step 2: 读 docs/PROGRESS.md           确认哪些已完成/未完成
Step 3: 读 docs/ARCHITECTURE_STATE.md 了解组件树和数据流
Step 4: 读 docs/MODULE_MAP.md         了解模块依赖关系
Step 5: 读 docs/PROJECT_RULES.md      了解开发约束
Step 6: 浏览 src/ 目录树              对照本文第3节验证
Step 7: 读关键源码:
        - src/stores/musicPlayerStore.ts    (播放器状态核心)
        - src/lib/audio/AudioManager.ts     (音频引擎核心)
        - src/hooks/useAudioPlayer.ts       (store↔audio 桥接)
        - src/music-source/types/provider.ts (MusicProvider 接口)
        - src/music-source/services/SearchService.ts (数据服务核心)
        - src/stores/searchStore.ts         (搜索状态)
        - src/stores/userStore.ts           (Phase 4 认证状态)
        - src/stores/libraryStore.ts        (Phase 4 乐观更新)
        - src/hooks/useAuth.ts              (Phase 4 认证 hook)
        - src/hooks/useLikedSongs.ts        (Phase 4 喜欢歌曲)
        - src/components/auth/AuthProvider.tsx (Phase 4 最外层 Provider)
        - src/services/playlistService.ts   (Phase 4 歌单服务)
        - src/types/index.ts               (所有类型入口)
        - src/services/social/commentService.ts (Phase 5 评论核心)
        - src/hooks/useComments.ts          (Phase 5 infinite comment query)
        - src/stores/socialStore.ts         (Phase 5 社交状态)
        - src/app/song/[id]/page.tsx        (Phase 5 歌曲详情页)
        - src/stores/systemStore.ts         (Phase 6 系统状态)
        - src/storage/CacheDB.ts            (Phase 6 IndexedDB 核心)
        - src/app/sw.ts                     (Phase 6 SW 缓存策略)
        - src/hooks/useMediaSession.ts      (Phase 6 重写: musicPlayerStore)
        - src/hooks/usePWAInstall.ts        (Phase 6 PWA 安装)
        - src/hooks/useAudioCache.ts        (Phase 6 音频缓存)
        - src/music-source/providers/provider-manager/ProviderManager.ts (Phase 7 Provider 管理核心)
        - src/music-source/providers/provider-manager/HealthTracker.ts (Phase 7 健康检测)
        - src/music-source/cache/APICache.ts (Phase 7 SWR 缓存)
        - src/music-source/hooks/useMusicSource.ts (Phase 7 高层数据源)
        - src/stores/providerStore.ts       (Phase 7 Provider 状态)
        - src/services/recovery/PlaybackRecoverySystem.ts (Phase 8 播放恢复)
        - src/hooks/usePlaybackRecovery.ts  (Phase 8 恢复 Hook)
        - src/stores/settingsStore.ts       (Phase 8 设置状态)
        - src/lib/logs/Logger.ts            (Phase 8 日志系统)
        - mobile/capacitor.config.ts        (Phase 8 Capacitor 封装)
        - src/system/watchdog/PlaybackWatchdog.ts (Phase 9 看门狗)
        - src/system/recovery/ProviderSelfHealing.ts (Phase 9 Provider自愈)
        - src/system/cleanup/CacheGovernance.ts (Phase 9 缓存治理)
        - src/system/telemetry/TelemetryService.ts (Phase 9 遥测)
        - src/system/monitor/useSystemWatchdog.ts (Phase 9 系统监控)
        - src/types/phase9.ts               (Phase 9 类型)
        - docs/ai/SYSTEM_HEALTH.md          (Phase 9 系统健康)
        - docs/ai/PROVIDER_HEALTH.md        (Phase 9 Provider健康)
        - docs/ai/DEBUG_GUIDE.md            (Phase 9 调试指南)
        - docs/ai/FAILURE_RECOVERY_GUIDE.md (Phase 9 故障恢复)
        - src/platform/config/RuntimeConfigManager.ts (Phase 10 动态配置)
        - src/platform/backup/BackupManager.ts (Phase 10 备份管理)
        - src/platform/migration/MigrationPipeline.ts (Phase 10 数据迁移)
        - src/platform/update/ProviderHotReload.ts (Phase 10 Provider热更新)
        - src/platform/runtime/DeploymentMode.ts (Phase 10 部署模式)
        - src/platform/runtime/MemoryMonitor.ts (Phase 10 内存监控)
        - src/platform/runtime/SystemIntegrity.ts (Phase 10 完整性检查)
        - src/platform/recovery/DisasterRecovery.ts (Phase 10 灾难恢复)
        - src/types/phase10.ts (Phase 10 类型)
        - docs/ai/RUNTIME_ARCHITECTURE.md (Phase 10 运行时架构)
        - docs/ai/RECOVERY_PIPELINE.md (Phase 10 恢复管线)
        - docs/ai/PROVIDER_RUNTIME.md (Phase 10 Provider运行时)
        - docs/ai/CACHE_RUNTIME.md (Phase 10 缓存运行时)
        - docs/ai/DEPLOYMENT_PROFILES.md (Phase 10 部署模式)
        - docs/ai/BACKUP_STRATEGY.md (Phase 10 备份策略)
        - docs/ai/MIGRATION_GUIDE.md (Phase 10 迁移指南)
        - docs/self-host/INDEX.md (Phase 10 自托管)
        - docs/FINAL_PROJECT_STRUCTURE.md (Phase 10 最终结构)
        - docs/ai/AI_PROJECT_INDEX.md (Phase 11 ★ 最高优先级索引)
        - docs/ai/AI_ONBOARDING_PROTOCOL.md (Phase 11 ★ 新AI接手10步SOP)
        - docs/ai/AI_RECOVERY_BOOTSTRAP.md (Phase 11 ★ 灾难级恢复方案)
        - docs/ai/PROJECT_GOVERNANCE.md (Phase 11 项目治理)
        - docs/ai/TECHNICAL_DEBT.md (Phase 11 技术债追踪)
        - docs/ai/PROVIDER_RISK_ANALYSIS.md (Phase 11 Provider风险评估)
        - docs/ai/LONG_TERM_EVOLUTION.md (Phase 11 长期演进)
        - docs/ai/DEPLOYMENT_SNAPSHOT.md (Phase 11 部署结构快照)
        - src/system/auto-diagnostics/AutoDiagnosticsRunner.ts (Phase 11 自动诊断)
        - src/system/snapshot/ArchitectureSnapshotManager.ts (Phase 11 架构快照)
        - src/system/governance/RuntimeGovernanceManager.ts (Phase 11 运行时治理)
        - src/system/maintenance/MaintenanceMode.ts (Phase 11 维护模式)
        - src/types/phase11.ts (Phase 11 类型定义)
Step 8: 开始开发
```

### 开发完成时（必须全部更新 □）

```
□ docs/AI_CONTEXT_RECOVERY.md  — 本文 (最重要，永远不要让它过时)
□ docs/PROGRESS.md                — 标记完成项，记录完成时间
□ docs/ARCHITECTURE_STATE.md      — 架构变化，新增/修改文件列表
□ docs/MODULE_MAP.md              — 新依赖关系，新模块入口
□ docs/PROJECT_RULES.md           — 新规则/约束，新目录约定
```

### 绝对禁止

```
❌ 删除 Phase 1 遗留文件:
   AudioEngine.ts, playerStore.ts, useAudio.ts, types/player.ts
❌ 修改 types/ 中的基础类型:
   Song (12 fields), Playlist, Profile 的结构
❌ 修改 components/ui/ 中的基础组件:
   GlassCard, LazyImage, Skeleton, IconButton (接口/行为)
❌ 修改 globals.css 中的样式体系:
   .glass, .card, .skeleton, @layer base
❌ 一次生成整个项目代码 (违反模块化开发原则)
❌ 重构已有稳定 UI 结构 (PlayerBar, PlayerFullscreen, LyricsView)
❌ 引入未经讨论的新依赖 (>1个新package须说明)
❌ 使用 any 类型 (ESLint error)
❌ 跳过文档更新 (文档驱动开发)
❌ 创建多个 Audio 实例 (AudioManager 是唯一单例)
❌ 将 Server Component 标记为 "use client" (除非确实需要浏览器API)
❌ 在组件中直接 fetch 或调用 Provider API (必须通过 hooks → SearchService 链路)
❌ 修改 MusicProvider 接口 (破坏性变更影响所有 Provider 实现)
❌ 创建新的数据获取路径绕过 SearchService
❌ 删除 mock provider 目录 (系统唯一 Provider + 兜底)
❌ 破坏 AuthProvider 包裹顺序 (必须: AuthProvider→AudioProvider→children)
❌ 在组件中直接调用 Supabase API (必须通过 services 层)
❌ 创建绕过 React Query 的数据获取路径
❌ 修改 userStore API 签名 (setUser/clearAuth/setLoading)
❌ 删除 recently_played 或 favorite_playlists 表
❌ 删除 libraryStore 或 playlistStore 的已有 action
❌ 删除 song_comments / comment_likes / comment_replies 表
❌ 修改 commentService.getComments cursor pagination 签名
❌ 绕过 services/social/ 直接在组件中操作 Supabase 评论表
❌ 修改 CacheDB.ts schema (STORES 数组) 或 DB_VERSION 不兼容升级
❌ 在 Service Worker 中缓存音频文件 (太大, 应使用 IndexedDB 分块)
❌ 创建多个 Audio 实例进行预加载 (应使用 audioCacheService 队列)
❌ 修改 systemStore API 签名 (setNetworkState/setInstallState/setCacheStats)
❌ 删除 storage/ 下任何文件 (IndexedDB 缓存层)
❌ 修改 sw.ts 缓存策略 (CacheFirst/NetworkFirst 顺序影响性能)
❌ 在 layout.tsx 中改变 InstallDetector 包裹顺序
❌ 删除 workers/ 目录或修改其结构
❌ 绕过 ProviderManager 直接调用 Provider（必须通过 manager.execute()）
❌ 删除 MockProvider 或将其从 ProviderManager 注销
❌ 修改 MusicProvider 接口（破坏所有 Provider 实现）
❌ 修改 ProviderManager fallback 优先级链 (当前: mock，将来扩展后按注册顺序)
❌ 在组件中直接 fetch 外部 API（必须通过 hooks → SearchService → Provider 链路）
❌ 创建多个 ProviderManager 实例（必须是单例）
❌ 删除 PlaybackStabilizer 的 URL 缓存机制
❌ 删除 mobile/ 目录或修改 capacitor.config.ts 的 appId
❌ 修改 ErrorBoundary 的 auto-retry 逻辑 (5s timer + 3次计数)
❌ 绕过 services/recovery/ 直接操作 localStorage 恢复数据
❌ 修改 settingsStore 的 localStorage key 命名规则
❌ 跳过 docs/ai/ 文档更新 (新 AI 的唯一上下文入口)
❌ 删除 docs/deployment/ 下的部署文档
❌ 在 DownloadManager 中实现真实下载 (Phase 8 仅预留架构)
❌ 删除或禁用 PlaybackWatchdog (Phase 9 自动恢复核心)
❌ 修改 ProviderSelfHealing 评分公式 (latency 30% + health 70%)
❌ 删除 src/system/ 下任何文件 (Phase 9 系统监控层)
❌ 绕过 CacheGovernance 直接操作 IndexedDB 清理
❌ 在生产环境 (release mode) 启用 Telemetry
❌ 删除或修改 ReleaseMode 配置 (RELEASE_CONFIGS)
❌ 在非 debug 模式渲染 DebugOverlay 或 /diagnostics
❌ 跳过 docs/ai/ 文档更新 (AI 维护体系唯一上下文)
❌ 删除 src/platform/ 下任何文件 (Phase 10 平台层)
❌ 修改 RuntimeConfig 结构 (破坏热更新和备份兼容性)
❌ 删除 BackupManager 的 checksum 校验逻辑
❌ 修改 MigrationPipeline 的幂等性保证
❌ 跳过 release/RELEASE_CHECKLIST.md 发布前检查
❌ 删除 src/system/recovery/CrashRecoverySystem.ts (Phase 17 崩溃恢复核心)
❌ 修改 CrashRecoverySystem 的 sessionStorage key 命名规则
❌ 删除 src/system/telemetry/ProviderTelemetry.ts (Phase 17 Provider 遥测)
❌ 删除 src/system/cleanup/CacheGovernanceV2.ts (Phase 17 增强缓存治理)
❌ 删除 src/components/error/EnhancedErrorBoundary.tsx (Phase 17 增强错误边界)
❌ 修改 useBatteryOptimization 的全局配置结构
❌ 删除 useStabilityMonitor 的事件上报逻辑
❌ 在 release 模式暴露 debug 功能
❌ 删除 DisasterRecovery 的核选项重置安全性检查
❌ 修改部署模式自动检测逻辑
❌ 删除或禁用 Phase 11 自动诊断系统 (AutoDiagnosticsRunner)
❌ 删除或禁用 Phase 11 架构快照系统 (ArchitectureSnapshotManager)
❌ 删除或禁用 Phase 11 运行时治理 (RuntimeGovernanceManager)
❌ 删除或禁用 Phase 11 维护模式 (MaintenanceMode)
❌ 删除 Phase 11 核心文档 (AI_PROJECT_INDEX/AI_ONBOARDING_PROTOCOL/AI_RECOVERY_BOOTSTRAP)
❌ 移除 MaintenanceMode 的 provider_emergency 自动切换逻辑
❌ 删除 docs/ai/runtime/ 目录或运行时数据存储
❌ 删除或禁用 Phase 13 FrozenRuntimeManager (冻结运行时核心)
❌ 删除或禁用 Phase 13 AutonomousMaintenanceLoop (自治循环核心)
❌ 删除或禁用 Phase 13 RuntimeIsolationLayer (隔离层核心)
❌ 删除或禁用 Phase 13 SelfHealingGovernance (自愈核心)
❌ 删除或禁用 Phase 13 DisasterRecoveryProtocol (灾难恢复协议)
❌ 删除或禁用 Phase 13 SnapshotRotationManager (快照轮换)
❌ 删除或禁用 Phase 13 FrozenGovernanceManager (冻结治理)
❌ 修改 src/frozen-runtime/ 下任何核心模块的API签名
❌ 删除 Phase 13 核心文档 (FINAL_FREEZE_STATE / AI_BOOTSTRAP_LAYER)
❌ 修改 FrozenSection 的 mode (frozen → protected 等降级操作)
```

### 沟通协议

```
- 使用简体中文
- 提出架构变更前先列出:
  · 影响范围 (哪些文件/模块)
  · 破坏性变更 (哪些 API 会变)
  · 回滚方案
- 每次开发前声明"将修改/新增哪些文件"
- 开发完成后列出变更清单:
  · 新增文件 (完整路径)
  · 修改文件 (完整路径 + 变更摘要)
  · 删除文件 (如有)
```

### 提交前检查清单

```
□ TypeScript strict: npm run build 零 error
□ ESLint: npm run lint 零 error (warning 可接受)
□ Prettier: npm run format 通过
□ 新文件遵循命名约定 (PascalCase / useXxx / xxxStore / xxxService)
□ 新类型在 types/ 定义并从 index.ts 导出
□ Store action 使用 get() 而非闭包 state
□ Client Component 有 "use client" 标记
□ 无循环依赖
□ 文档已更新
```

---

---

## 32. Phase 12 — 最终生态闭环系统

### 32.1 Ecosystem 模块总览

```
src/ecosystem/
├── local-media/
│   ├── LocalMediaProvider.ts      ★ 本地音频文件Provider (架构预留)
│   ├── LocalLyricProvider.ts      ★ 本地歌词Provider
│   ├── LocalCoverProvider.ts      ★ 本地封面Provider
│   └── index.ts
├── webdav/
│   ├── WebDAVProvider.ts          ★ WebDAV远程存储 (预留)
│   └── index.ts
├── nas/
│   ├── NASProvider.ts             ★ NAS网络存储 (预留)
│   └── index.ts
├── sync/
│   ├── SyncManager.ts             ★ 本地↔远程同步 (预留)
│   └── index.ts
├── scanner/
│   ├── MediaScanner.ts            ★ 媒体文件扫描与索引
│   └── index.ts
├── ai-autonomy/
│   ├── AIAutonomyManager.ts       ★ AI自治管理器 (核心)
│   ├── GovernancePipeline.ts      ★ 5阶段自动治理管道
│   ├── DegradedRuntimeMode.ts     ★ 4级降级运行模式
│   ├── SystemStatusPage.tsx       ★ 系统状态页组件
│   └── index.ts
├── archive/
│   ├── ProjectArchiveSystem.ts    ★ 项目封存系统
│   └── index.ts
└── index.ts                       ★ Ecosystem 统一导出
```

### 32.2 AI自治系统

- 实例: `src/ecosystem/ai-autonomy/AIAutonomyManager.ts` (单例)
- 定时任务: system_report(1h) + governance_check(30min) + snapshot_capture(2h)
- 自动生成: 系统健康报告, Provider健康报告, 长期问题追踪, 维护建议
- 存储: localStorage (`music_ai_autonomy_tasks`, `music_ai_autonomy_issues`)

### 32.3 Governance Pipeline

- 实例: `src/ecosystem/ai-autonomy/GovernancePipeline.ts` (单例)
- 5阶段: module_consistency → store_dependency → provider_status → recovery_status → cache_status
- 结果: healthy / degraded / unhealthy
- 自动Markdown报告生成

### 32.4 降级运行模式

- 实例: `src/ecosystem/ai-autonomy/DegradedRuntimeMode.ts` (单例)
- 4级别: none → partial → severe → offline
- 自动触发: 网络断开 / Provider失效 / 缓存仅模式
- 功能门控: `isFeatureAvailable()` 检查功能可用性

### 32.5 运行时模式

- 6种: lightweight / full_online / offline / local_media / maintenance / emergency_degraded
- 每种模式有明确的 restrictions + features
- 自动与 DegradedRuntimeMode 映射

### 32.6 项目封存

- 实例: `src/ecosystem/archive/ProjectArchiveSystem.ts` (单例)
- 5种范围: full / config / runtime / store / provider / docs
- 导出: JSON (含 manifest + checksum) → 浏览器下载
- 恢复: 预留接口

### 32.7 Phase 12 新增单例

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

### 32.8 Phase 12 新增禁止修改

- `src/ecosystem/ai-autonomy/AIAutonomyManager.ts` — AI自治核心
- `src/ecosystem/ai-autonomy/DegradedRuntimeMode.ts` — 降级运行核心
- `src/ecosystem/ai-autonomy/GovernancePipeline.ts` — 治理管道核心
- `src/ecosystem/archive/ProjectArchiveSystem.ts` — 封存系统核心
- `src/types/phase12.ts` — Phase 12 类型定义

### 32.9 Phase 12 新增 AI 文档

- `docs/ai/AUTONOMY_RUNTIME.md` — AI自治运行时说明
- `docs/ai/ECOSYSTEM_ARCHITECTURE.md` — 生态系统架构全景
- `docs/ai/LOCAL_MEDIA_ROADMAP.md` — 本地媒体扩展路线图
- `docs/ai/GOVERNANCE_PIPELINE.md` — 自动化治理管道
- `docs/ai/DEGRADED_RUNTIME.md` — 降级运行模式说明
- `docs/ai/ARCHIVE_STRATEGY.md` — 项目封存策略

---

## 33. Phase 13 — 最终长期冻结版

### 33.1 Frozen Runtime 总览

```
src/frozen-runtime/
├── FrozenRuntimeManager.ts          ★ 冻结运行时管理器
│   ├── 8个冻结区域 (frozen/protected/readonly)
│   ├── 每10min完整性检查
│   ├── 违规自动封锁
│   └── 自动恢复
├── AutonomousMaintenanceLoop.ts     ★ 自治维护循环
│   ├── 10种维护任务
│   ├── 自动恢复
│   ├── 自动报告
│   └── 完整周期巡检
├── bootstrap/AIBootstrapLayer.ts    ★ AI引导层
│   ├── 37个冻结模块列表
│   ├── 9个危险区域
│   └── 5分钟接管指南
├── healing/SelfHealingGovernance.ts ★ 自愈治理引擎
│   ├── 6种治愈动作类型
│   ├── 自动稳定性评分
│   ├── 自动风险评分
│   └── 自动治愈执行
├── isolation/RuntimeIsolationLayer.ts★ 运行时隔离层
│   ├── 6个隔离域
│   ├── 失败累计+自动隔离
│   └── 自动释放恢复
├── snapshots/SnapshotRotationManager.ts★ 快照轮换
│   ├── 5种快照类型
│   ├── 自动轮换+清理
│   └── 恢复点管理
├── recovery/DisasterRecoveryProtocol.ts ★ 灾难恢复协议
│   ├── 7种灾难场景
│   ├── 4种恢复策略
│   ├── 分步可逆恢复
│   └── 自动检测+恢复
├── governance/FrozenGovernanceManager.ts ★ 冻结治理
│   ├── 修改请求评估
│   ├── 变更审批
│   └── 稳定性评分
└── archive/AutonomousArchiveManager.ts ★ 自治归档
    ├── 自动归档维护报告/治理决策
    └── 过期清理
```

### 33.2 冻结区域

| Section | Mode | 原因 |
|---------|------|------|
| `core_runtime` | frozen | 核心Runtime结构不可修改 |
| `providers` | protected | Provider架构 + Fallback链 |
| `recovery_pipeline` | frozen | 三层恢复是最后防线 |
| `cache_governance` | protected | 三层缓存是离线保障 |
| `audio_engine` | frozen | AudioManager唯一单例 |
| `music_provider_interface` | frozen | Provider接口不可破坏 |
| `governance_pipeline` | protected | 5阶段巡检保证一致性 |
| `autonomy_loop` | protected | 长期运行核心保障 |

### 33.3 自治维护任务

| 任务 | 频率 | 优先级 |
|------|------|--------|
| provider_health_check | 5min | high |
| isolation_check | 5min | high |
| cache_governance | 10min | normal |
| runtime_integrity | 15min | high |
| recovery_test | 30min | normal |
| governance_full | 30min | high |
| snapshot_generation | 1h | normal |
| debt_detection | 2h | low |
| bootstrap_verify | 24h | critical |
| disaster_drill | 7d | low |

### 33.4 自愈治理

- 实例: `src/frozen-runtime/healing/SelfHealingGovernance.ts` (单例)
- 自动诊断: 每5分钟计算稳定性评分
- 自动治愈: 针对低分维度自动执行治愈动作
- 历史追踪: 成功率/失败率统计

治愈动作: restart / reload / fallback / reset / reinitialize / quarantine

### 33.5 运行时隔离

- 实例: `src/frozen-runtime/isolation/RuntimeIsolationLayer.ts` (单例)
- 6个隔离域: provider / audio / cache / recovery / governance / autonomy
- 失败累计 → 阈值触发 → 自动隔离 → 隔离期满 → 自动释放

### 33.6 灾难恢复协议

- 实例: `src/frozen-runtime/recovery/DisasterRecoveryProtocol.ts` (单例)
- 7种灾难: all_providers_down / cache_corruption / indexeddb_corruption / runtime_corruption / pwa_abnormal / local_degraded / total_failure
- 4种策略: auto / guided / manual / nuclear
- 自动检测: `detectDisaster()` → 创建计划 → 分步执行 → 验证

### 33.7 Phase 13 新增文档

- `docs/ai/FROZEN_RUNTIME.md` — 冻结运行时架构
- `docs/ai/AUTONOMOUS_LOOP.md` — 自治维护循环
- `docs/ai/DISASTER_RECOVERY.md` — 灾难恢复协议
- `docs/ai/RUNTIME_ISOLATION.md` — 运行时隔离层
- `docs/ai/SNAPSHOT_ROTATION.md` — 快照轮换系统
- `docs/ai/LONG_TERM_STABILITY.md` — 长期稳定性治理
- `docs/ai/FINAL_FREEZE_STATE.md` — 最终冻结状态
- `docs/ai/AI_BOOTSTRAP_LAYER.md` — AI快速接管指南

### 33.8 Phase 13 新增单例

| 单例 | 获取方式 | 文件 |
|------|---------|------|
| FrozenRuntimeManager | `getFrozenRuntime()` | `frozen-runtime/FrozenRuntimeManager.ts` |
| AutonomousMaintenanceLoop | `getMaintenanceLoop()` | `frozen-runtime/AutonomousMaintenanceLoop.ts` |
| RuntimeIsolationLayer | `getRuntimeIsolation()` | `frozen-runtime/isolation/` |
| SelfHealingGovernance | `getSelfHealingGovernance()` | `frozen-runtime/healing/` |
| SnapshotRotationManager | `getSnapshotRotation()` | `frozen-runtime/snapshots/` |
| DisasterRecoveryProtocol | `getDisasterRecoveryProtocol()` | `frozen-runtime/recovery/` |
| FrozenGovernanceManager | `getFrozenGovernance()` | `frozen-runtime/governance/` |
| AIBootstrapLayer | `getAIBootstrap()` | `frozen-runtime/bootstrap/` |
| AutonomousArchiveManager | `getAutonomousArchive()` | `frozen-runtime/archive/` |

### 33.9 Phase 13 新增禁止修改

- `src/frozen-runtime/FrozenRuntimeManager.ts` — 冻结运行时核心
- `src/frozen-runtime/AutonomousMaintenanceLoop.ts` — 自治循环核心
- `src/frozen-runtime/isolation/RuntimeIsolationLayer.ts` — 隔离层核心
- `src/frozen-runtime/healing/SelfHealingGovernance.ts` — 自愈核心
- `src/frozen-runtime/recovery/DisasterRecoveryProtocol.ts` — 灾难恢复协议
- `src/frozen-runtime/snapshots/SnapshotRotationManager.ts` — 快照轮换
- `src/frozen-runtime/governance/FrozenGovernanceManager.ts` — 冻结治理
- `src/types/phase13.ts` — Phase 13 类型定义

---

## 34. Phase 12 — iPhone Audio Experience Upgrade

> **实施日期: 2026-05-28**
> **目标: iOS Safari 音频体验强化 — MediaSession 锁屏控制 + 后台播放 + AudioEngine 增强 + PWA 优化 + UI 增强**

### 34.1 新增文件

| 文件 | 用途 |
|------|------|
| `src/hooks/useIOSBackground.ts` | iOS Safari 后台播放 — visibilitychange/pagehide/pageshow/freeze/resume + Wake Lock API |
| `src/lib/audio/PlayQueue.ts` | 播放队列预加载 — 下一首歌曲预加载到独立 Audio 元素 |

### 34.2 增强文件

| 文件 | 变更 |
|------|------|
| `src/lib/audio/AudioManager.ts` | play() 增强: NotAllowedError/AbortError 分类处理 + 最多3次重试 + audioUnlocked 状态追踪 |
| `src/hooks/useMediaSession.ts` | 新增 seekbackward/seekforward/stop action handlers + artwork 5 种尺寸 (96/192/256/384/512) |
| `src/hooks/useAudioPlayer.ts` | 集成 PlayQueue — 歌曲加载完成后自动预加载下一首 |
| `src/components/layout/AudioProvider.tsx` | 挂载 useIOSBackground hook |
| `src/components/player/AlbumCover.tsx` | 旋转动画改用 inline style animation + play-state 控制 + GPU 加速 (will-change/translateZ) |
| `src/components/player/ProgressBar.tsx` | 进度条改用 scaleX transform 实现 GPU 加速平滑动画 (0.15s linear transition) |
| `src/components/player/PlayerBar.tsx` | Mini Player 新增 now-playing 动态指示条 + 缓冲条始终可见 |
| `src/components/pwa/InstallPrompt.tsx` | 双通道安装引导: iOS 教程 + Chrome native beforeinstallprompt + 安装按钮 |
| `src/app/globals.css` | 新增 display-mode: standalone + audio::-webkit-media-controls-panel 样式 |
| `tailwind.config.ts` | 新增 spin-cover / pulse-glow-subtle / now-playing 动画 keyframes |

### 34.3 MediaSession API 实现

```
Action Handlers 注册:
  play / pause / previoustrack / nexttrack
  seekto / seekbackward (10s) / seekforward (10s)
  stop

Metadata 设置:
  title / artist / album / artwork[96..512]

Position State:
  每 2s 更新 (iOS Control Center 进度条)
  仅在 isPlaying && duration > 0 时更新

Playback State:
  "playing" | "paused" — 跟随 store.isPlaying 同步
```

### 34.4 iOS 后台播放保护

```
事件监听链:
  pageshow     → 恢复播放 (最多3次延迟重试)
  pagehide     → 记录 wasPlaying 状态
  visibilitychange → hidden: 记录状态 / visible: 恢复播放 + Wake Lock
  freeze       → 记录状态 + 释放 Wake Lock
  resume       → 恢复播放 (200ms 延迟)

Wake Lock API:
  播放时请求 screen wake lock
  暂停时释放
  通过 window.__wakeLock 追踪引用
```

### 34.5 AudioManager play() 错误防护

```
play() 流程:
  1. clearPlayRetry() — 清除之前的重试 timer
  2. await audio.play()
  3. 成功 → playRetryCount=0, audioUnlocked=true
  4. NotAllowedError → 最多3次延迟重试 (200/400/600ms)
  5. AbortError → 静默忽略 (新的 load() 中断)
  6. 其他错误 → console.warn
```

### 34.6 PlayQueue 预加载机制

```
流程:
  1. useAudioPlayer 检测 loadingState → "ready"
  2. 调用 PlayQueue.preloadNext(queue, currentIndex)
  3. 解析下一首 URL (缓存命中 / Provider 请求)
  4. 创建独立 Audio 元素 (volume=0, preload=auto)
  5. 歌曲切换时 consumePreloaded() 获取已预热的 Audio

URL 缓存: Map<songId, url>
取消: load 新歌时 cancel() 旧预加载
```

### 34.7 PWA 安装增强

```
iOS 通道:
  - 30s 后显示 "添加到主屏幕" 引导
  - 两步教程: Share → 添加到主屏幕
  - localStorage music_install_guide_dismissed 防重复

Chrome 通道:
  - 监听 beforeinstallprompt 事件
  - 触发后立即显示安装提示
  - 原生 prompt() 调用

双按钮: "以后再说" (关闭) / "知道了" (iOS) 或 "安装" (Chrome)
```

### 34.8 UI 动画增强

```
AlbumCover:
  - 大尺寸: spin 12s linear infinite (isPlaying 时)
  - 小尺寸: spin 8s linear infinite (isPlaying 时)
  - GPU 加速: will-change: transform + translateZ(0)

ProgressBar:
  - 进度填充: scaleX transform 替代 width %
  - transition: transform 0.15s linear
  - will-change: transform

PlayerBar Mini:
  - now-playing 指示条: 3条竖线 pulseGlow 动画 (错开 delay)
  - 缓冲条: loadingState 变化时显示/隐藏
```

### 34.9 Phase 12 新增禁止修改

- `src/hooks/useIOSBackground.ts` — iOS 后台播放事件链
- `src/lib/audio/PlayQueue.ts` — 预加载队列单例
- `AudioManager.play()` — 错误分类 + 重试逻辑
- `useMediaSession` — 全部 8 个 action handlers

### 34.10 架构原则 (Phase 12 遵守)

1. 禁止大重构 — 增强现有模块，不重写
2. iPhone Safari 优先 — 所有逻辑 iOS-first
3. 保持 localStorage 架构 — 不引入新存储层
4. 保持 MockProvider — 音源系统不变
5. 不引入后端 — 纯客户端实现

---

## 35. Phase 13 — Now Playing Experience Upgrade

> **实施日期: 2026-05-28**
> **目标: 让播放器更接近 Apple Music / 网易云 / Spotify 体验**

### 35.1 新增文件

| 文件 | 用途 |
|------|------|
| `src/lib/color/dominantColor.ts` | Canvas API 封面主色调提取 (1×1 像素采样 + 调色板生成) |
| `src/hooks/useDominantColor.ts` | 主色调提取 Hook (缓存 Map + 异步加载) |
| `src/hooks/useSpringTransition.ts` | iOS 风格 spring 动画 Hook (cubic-bezier 0.16,1,0.3,1, 400ms) |
| `src/components/player/QueuePanel.tsx` | 播放队列管理面板 (排序/历史/清空/自动续播) |

### 35.2 增强文件

| 文件 | 变更 |
|------|------|
| `src/music-source/providers/mock/data.ts` | 新增 12 首 LRC 歌词 (5→17, 覆盖 稻香/光年之外/后来/十年/平凡之路/光辉岁月/Perfect/夜に駆ける/青花瓷/告白气球/Blinding Lights/Faded) |
| `src/lib/lyrics/LyricParser.ts` | 新增 `parseEnhanced()` 实现: `<mm:ss.xx>翻译` 标签 + `| 分隔符` 两种双语歌词解析 |
| `src/components/player/LyricsView.tsx` | 行过渡升级为 spring 缓动 (500ms duration), 上下渐变遮罩增强 (via-background/80), 顶部底部留白 42vh |
| `src/components/player/PlayerFullscreen.tsx` | 动态主色调背景 (dominantColor + gradient overlay), 队列面板按钮, 简化顶部栏 (移除 dots) |
| `src/components/player/PlayerBar.tsx` | 支持 `onExpand` prop 注入, `data-mini-cover` 属性标记共享元素 |
| `src/components/layout/BottomPlayer.tsx` | 共享元素过渡: mini cover → fullscreen cover (spring 350ms morphing), 过渡期浮层覆盖 |
| `src/stores/musicPlayerStore.ts` | 新增 playHistory 追踪 (最多50条), autoContinue 自动续播开关, reorderQueue 拖拽排序 |
| `src/stores/uiStore.ts` | 新增 isQueuePanelOpen / isPlayerTransitioning / toggleQueuePanel / closeQueuePanel / setPlayerTransitioning |
| `tailwind.config.ts` | 新增 spring-up / spring-scale 动画 keyframes (弹性缓入) |

### 35.3 歌词系统 (最高优先级)

```
覆盖: 17/52 首歌曲有完整 LRC 歌词
  华语: 七里香/晴天/稻香/光年之外/后来/十年/平凡之路/青花瓷/告白气球
  粤语: 海阔天空/光辉岁月
  英文: Shape of You/Perfect/Blinding Lights/Faded
  日文: Lemon/夜に駆ける

LyricParser 增强:
  parseEnhanced(): 解析 <mm:ss.xx>翻译 格式 + | 分隔符格式
  parse(): 基础 LRC 解析（不变）
  findCurrentIndex(): 二分查找当前行

LyricsView 动画:
  transitionDuration: 500ms
  transitionTimingFunction: cubic-bezier(0.16, 1, 0.3, 1) (spring)
  当前行: text-2xl font-semibold scale-105 text-text-primary
  已播行: text-base text-text-tertiary/70
  未播行: text-lg text-text-secondary
  翻译: 当前行 text-sm, 其他 text-xs text-text-tertiary/50
  顶部/底部: 渐变遮罩 via-background/80
```

### 35.4 共享元素过渡

```
Mini → Full Player 流程:
  1. 用户点击 mini cover → handleExpand()
  2. querySelector("[data-mini-cover]") 获取 mini cover rect
  3. 浮层 div 渲染: cover 定位在 mini 位置 (left/top/width/height)
  4. CSS transition 350ms: translate + scale 到 fullscreen 目标位置 (280px, vh*0.18)
  5. 同时 fadeIn 背景层
  6. Mini player opacity → 0
  7. requestAnimationFrame → expandPlayer() → PlayerFullscreen 挂载
  8. 360ms 后清理浮层

Spring easing: cubic-bezier(0.16, 1, 0.3, 1)
```

### 35.5 队列 UX

```
QueuePanel 功能:
  - 队列列表: 每项显示 上移/下移 按钮 + 删除 + 点击播放
  - 播放模式切换: sequential/repeat/repeat-one/shuffle 循环
  - 自动续播开关: autoContinue 控制 sequential 模式结束时是否从头循环
  - 最近播放: playHistory 前 10 条，点击快速切歌
  - 清空队列: 底部红色按钮

musicPlayerStore 新增:
  playHistory: Song[] (最多 50, next() 时自动推入)
  reorderQueue(from, to): 数组 splice 重排 + queueIndex 调整
  autoContinue: boolean (默认 true)
```

### 35.6 视觉增强

```
动态主色调:
  useDominantColor(cover_url) → Canvas 1×1 采样 → rgb(r,g,b)
  colorCache Map 缓存避免重复提取
  PlayerFullscreen: backgroundColor=dominantColor + 渐变 overlay

背景层次 (PlayerFullscreen):
  1. 底部 solid: dominantColor
  2. 中景模糊: bg-cover + opacity-30 + blur-3xl + scale-110
  3. 渐变: dominantColor 66% → transparent 50% → #0a0a0a 100%
  4. 最前: bg-black/40

Glassmorphism: .glass / .glass-heavy (已有)
Spring animations: spring-up / spring-scale tailwind classes
```

### 35.7 Phase 13 新增禁止修改

- `src/lib/color/dominantColor.ts` — Canvas 颜色提取算法
- `src/lib/lyrics/LyricParser.ts:parseEnhanced()` — 增强歌词解析逻辑
- `src/components/player/QueuePanel.tsx` — 队列面板
- `musicPlayerStore: playHistory / reorderQueue / autoContinue` — 播放历史与排序
- `LyricsView 动画参数` — 500ms spring 缓动

### 35.8 架构原则 (Phase 13 遵守)

1. iPhone Safari 优先 — 触摸排序、spring 缓动、safe-area
2. 禁止大重构 — 现有 LyricsView/PlayerBar/PlayerFullscreen/Store 基础上增强
3. 保持 Public Audio Mode — 歌词为 mock LRC 数据
4. 保持 localStorage — 不引入新存储
5. 保持 AudioEngine 架构 — AudioManager/useAudioPlayer 不变
6. 渐进式开发 — 共享元素过渡是 CSS-only，不引入 framer-motion

---

## 36. Phase 14 — Native Feeling Upgrade

> **实施日期: 2026-05-28**
> **目标: 让 Web Music App 更接近原生 iOS 音乐 App 的手感与体验**

### 36.1 新增文件

| 文件 | 用途 |
|------|------|
| `src/services/haptics/HapticService.ts` | 统一触觉反馈服务 (navigator.vibrate + iOS fallback) |
| `src/services/haptics/index.ts` | HapticService 导出 |
| `src/lib/gestures/GestureUtils.ts` | 手势工具集 (rubberBand / velocity / inertia / snap / spring) |
| `src/services/offline/OfflineService.ts` | 真离线服务 (IndexedDB Blob 缓存 + 离线追踪 + 容量控制) |
| `src/services/offline/index.ts` | OfflineService 导出 |
| `src/services/performance/PerformanceGovernor.ts` | 性能治理 (render audit / animation batching / memory cleanup / audio cleanup) |
| `src/components/player/WaveformBar.tsx` | Mini Player 动态波形可视化组件 |

### 36.2 增强文件

| 文件 | 变更 |
|------|------|
| `src/components/player/PlayerFullscreen.tsx` | swipe-down dismiss (rubberBand + velocity detection + drag opacity/scale) |
| `src/components/player/QueuePanel.tsx` | swipe-close + drag handle + rubber band dismiss + 所有操作 haptic feedback |
| `src/components/player/LyricsView.tsx` | inertia scrolling (velocity + friction) + seek snapping (snapToNearest) + data-scrollable 标记 |
| `src/components/player/PlayerBar.tsx` | 呼吸光晕 (radial gradient pulse on cover) + WaveformBar 集成 + morph animation 过渡 |
| `src/components/player/PlayerControls.tsx` | 全部按钮集成 haptic feedback (medium on play/pause, light on skip, selection on mode) |
| `src/components/layout/BottomPlayer.tsx` | 展开时 haptic feedback (medium) |
| `src/storage/CacheDB.ts` | DB v2: 新增 audio_blobs / image_blobs / offline_songs 3 个 Object Stores |
| `src/hooks/usePerformanceCleanup.ts` | 集成 PerformanceGovernor (CacheSizeMonitor + BlobUrl 清理 + LongTask 监控) |

### 36.3 Gesture System (最高优先级)

```
PlayerFullscreen Swipe-Down Dismiss:
  机制:
    1. TouchStart: 仅在非歌词/非进度条/非音量区域激活
    2. TouchMove: rubberBand(rawDelta, limit=80px) 阻尼
    3. TouchEnd: velocity + distance 双阈值判定
       - velocity > 0.5px/ms OR distance > 120px → 关闭
       - 否则 spring-back 弹回
    4. Dismiss: translateY → window.innerHeight, opacity → 0, 350ms spring
    5. Haptic: medium on dismiss, light on spring-back

QueuePanel Swipe-Close:
  机制:
    1. drag-handle (顶部横条, 1×40px) + drag-area (header 区域) 触发
    2. rubberBand(rawDelta, limit=60px)
    3. velocity > 0.4 OR distance > 100 → 关闭
    4. Haptic: medium on dismiss, light on spring-back

LyricsView Inertia + Snap:
  机制:
    1. TouchStart: 暂停 autoScroll, 取消惯性动画
    2. TouchMove: 追踪 velocity (5 sample weighted)
    3. TouchEnd: velocity → frames (friction=0.95) 惯性滚动
    4. 惯性结束 → snapToNearest(containerCenter, linePositions)
    5. Snap 后 seek 到该行时间 + haptic selection
    6. 3s 后恢复 autoScroll
```

### 36.4 Haptic Feedback

```
HapticService:
  API: trigger(style) / light() / medium() / heavy() / selection() / success() / warning() / error()
  实现: navigator.vibrate(duration) — 兼容 Android; iOS 无 vibrate API 静默忽略
  Duration map: light=10ms, medium=15ms, heavy=20ms, selection=5ms, warning=30ms
  Enabled toggle: setEnabled(bool)

集成点:
  Play/Pause → medium (15ms)
  Next/Prev → light (10ms)
  Mode cycle → selection (5ms)
  Queue reorder (move up/down) → selection (5ms)
  Queue remove → selection (5ms)
  Queue clear → warning (30ms)
  Player expand → medium (15ms)
  Lyric seek snap → selection (5ms)
  Swipe dismiss → medium (15ms)
  Swipe spring-back → light (10ms)
```

### 36.5 Dynamic Mini Player

```
WaveformBar:
  5 条竖线, 2px 宽, accent-primary/60
  每 8 帧 (≈133ms) 重新生成随机高度 (0.3-0.7)
  transform: scaleY() 动画, 350ms spring ease-out
  transform-origin: bottom
  isPlaying=false → scaleY(0.2) 归零

Breathing Glow:
  absolute -inset-2, rounded-full
  radial-gradient(circle, rgba(255,45,85,0.2) 0%, transparent 70%)
  animate-pulse-glow (2s ease-in-out infinite)
  仅 isPlaying 时渲染

Morph Animation:
  PlayerBar container: transition transform 0.35s + box-shadow 0.35s
  spring cubic-bezier(0.16, 1, 0.3, 1)
```

### 36.6 True Offline Mode

```
OfflineService:
  音频 Blob 缓存 (IndexedDB STORE "audio_blobs"):
    downloadAndCacheAudio(song) → fetch → Blob → IndexedDB → markOfflinePlayable
    getOfflineAudioUrl(songId) → Blob → URL.createObjectURL → 本地播放
    hasAudioBlob(songId) → boolean

  封面 Blob 缓存 (IndexedDB STORE "image_blobs"):
    downloadAndCacheImage(url) → fetch → Blob → IndexedDB
    getOfflineImageUrl(url) → Blob → URL.createObjectURL

  离线追踪 (IndexedDB STORE "offline_songs"):
    markOfflinePlayable(song, size) → 标记歌曲可离线播放
    isOfflinePlayable(songId) → boolean
    getOfflineSongs() → OfflineSongEntry[]
    removeOfflineSong(songId) → 清除音频 + 元数据

  容量控制:
    MAX_CACHE_SIZE: 200MB
    enforceCacheLimit() → 最旧优先清理 → 降到 80%
    getTotalCacheSize() → 遍历 audio_blobs + image_blobs 大小
    getOfflineStats() → songCount + audioSize + imageCount + imageSize
```

### 36.7 Performance Governance

```
PerformanceGovernor:
  Render Audit:
    trackRender(component) → Map 记录
    getRenderReport() → > 20 次渲染的组件列表
    enable/disable toggle

  Animation Batching:
    batchAnimation(callback) → Set 去重 → 单帧 RAF 执行
    避免同一帧内多次 DOM 更新

  Memory Cleanup:
    trackBlobUrl(url) → Set 追踪
    revokeAllBlobUrls() → URL.revokeObjectURL 批量释放
    revokeBlobUrl(url) → 单个释放

  Audio Cleanup:
    trackAudioElement(el) → Set 追踪
    cleanupDetachedAudio() → pause + removeAttribute(src) + load() + remove()

  Cache Size Monitor:
    5min 间隔检查 → offlineService.enforceCacheLimit()
    startCacheSizeMonitor / stopCacheSizeMonitor

  Long Task Observer:
    PerformanceObserver({ type: "longtask" })
    > 50ms 的任务 console.warn (仅 dev 模式)
```

### 36.8 Phase 14 新增禁止修改

- `src/services/haptics/HapticService.ts` — 触觉反馈服务
- `src/lib/gestures/GestureUtils.ts` — 手势工具库
- `src/services/offline/OfflineService.ts` — 离线服务
- `src/services/performance/PerformanceGovernor.ts` — 性能治理
- `src/components/player/WaveformBar.tsx` — 波形组件
- `music-player-cache` DB v2 schema — audio_blobs / image_blobs / offline_songs stores
- `PlayerFullscreen swipe-down` — 手势关闭参数 (rubberBand limit / velocity threshold / distance threshold)
- `LyricsView inertia` — 惯性滚动参数 (friction 0.95)

### 36.9 架构原则 (Phase 14 遵守)

1. iPhone Safari 优先 — 所有手势和触觉反馈 iOS-first
2. 禁止大重构 — 在现有组件上渐进增强，不重写
3. 保持 Public Audio Mode — 离线缓存为独立功能，不改变音源架构
4. 保持 AudioEngine 架构 — AudioManager / useAudioPlayer 不变
5. 保持渐进式增强 — 手势/触觉/离线均为可选增强，关闭后不影响核心功能
6. 保持当前 UI 风格 — Apple Music dark theme + glassmorphism 不变

---

## 37. Phase 16A — Remote Provider Architecture Foundation

> **实施日期: 2026-05-28**
> **目标: 建立长期可扩展的 Remote Provider 架构**

### 37.1 设计原则

1. 不恢复 localhost:3001
2. 不恢复 NeteaseCloudMusicApi
3. 不做本地 Node Provider
4. iPhone Safari 优先
5. Cloudflare Worker 优先

### 37.2 新增文件

| 文件 | 用途 |
|------|------|
| `src/remote-provider/types/index.ts` | RemoteProvider 接口 + RemoteStream/RemoteSong/CircuitBreaker/EdgeProviderConfig/RemoteConfigData 类型 |
| `src/remote-provider/core/EdgeProviderManager.ts` | 核心管理器: timeout/retry/fallback/health score/circuit breaker |
| `src/remote-provider/providers/RemoteWorkerProvider.ts` | Cloudflare Worker 适配器 (当前 mock response, 将来替换为真实 fetch) |
| `src/remote-provider/config/RemoteConfig.ts` | 远程配置系统 (provider priority/disable/timeout/fallback strategy, localStorage 持久化) |
| `src/remote-provider/components/ProviderHealthDashboard.tsx` | Dev-only Provider 健康仪表板 (active/latency/availability/retry/circuit state) |
| `src/remote-provider/hooks/useRemoteProvider.ts` | React Hook: 初始化 + 状态订阅 + search/getSong/getLyrics/getStream |
| `src/remote-provider/index.ts` | Barrel export |

### 37.3 RemoteProvider 接口

```typescript
interface RemoteProvider {
  readonly id: string;
  readonly name: string;
  readonly source: string;        // "cloudflare" | "edge" | "remote"

  search(keyword, options?) → SearchResult
  getSong(id) → RemoteSong
  getLyrics(songId) → string
  getStream(songId) → RemoteStream  // { url, format, bitrate, expireAt }
  health() → RemoteProviderHealth   // { healthy, avgLatency, availability, ... }
}
```

### 37.4 EdgeProviderManager 核心功能

- **Timeout**: 每个 Provider 方法可配置超时 (默认 10s, playUrl 15s)
- **Retry**: 指数退避重试 (base 1s, max 10s, 最多 3 次)
- **Fallback**: 三种策略 — priority / health / latency
- **Health Score**: 滑动窗口 (100 次请求) + 成功率计算
- **Circuit Breaker**: closed → open (5 次连续失败) → half-open (30s 后探测) → closed/re-open
- **Health Check**: 定时主动探测 (默认 30s 间隔)
- **Recovery Probe**: 不健康 provider 定期探测恢复

### 37.5 RemoteWorkerProvider (Mock)

- 实现 RemoteProvider 接口
- 当前使用 mock 数据 (复用现有 MockProvider 数据)
- 模拟真实网络延迟 (100-350ms)
- 预留 Worker endpoint 字段 + fetch 实现注释
- 将来只需替换内部 fetch target 即可接入真实 Cloudflare Worker

### 37.6 Remote Config System

- Storage: localStorage (`music_remote_config`)
- 配置项: providerPriority / timeoutMs / maxRetries / fallbackStrategy / healthCheckIntervalMs
- 支持 runtime 修改 + subscribe 监听
- 与现有 RuntimeConfigManager 并存，互补

### 37.7 Provider Health Dashboard

- Dev-only 组件 (`"use client"`)
- 2s 轮询 EdgeProviderManager 状态
- 显示: active provider, latency, availability, retry count, circuit state
- 操作: enable/disable provider, adjust priority
- Expand 展开完整 JSON state

### 37.8 目录结构

```
src/remote-provider/
├── types/
│   └── index.ts                     # RemoteProvider + 相关类型
├── core/
│   ├── EdgeProviderManager.ts       # 核心管理器
│   └── index.ts
├── providers/
│   ├── RemoteWorkerProvider.ts      # Cloudflare Worker adapter (mock)
│   └── index.ts
├── config/
│   ├── RemoteConfig.ts              # 远程配置系统
│   └── index.ts
├── hooks/
│   ├── useRemoteProvider.ts         # React integration hook
│   └── index.ts
├── components/
│   ├── ProviderHealthDashboard.tsx  # Dev-only dashboard
│   └── index.ts
└── index.ts                         # Barrel export
```

### 37.9 兼容性保证

- 不修改现有 AudioEngine / AudioManager
- 不修改现有 MusicProvider 接口 / MockProvider
- 不修改现有 ProviderManager / HealthTracker
- 不修改现有 UI 组件
- 不修改现有 localStorage 架构
- 渐进式增强 — RemoteProvider 是独立新层

### 37.10 Phase 16A 新增禁止修改

- `src/remote-provider/types/index.ts` — RemoteProvider 接口定义
- `src/remote-provider/core/EdgeProviderManager.ts` — Circuit breaker + health 核心算法
- `src/remote-provider/providers/RemoteWorkerProvider.ts` — Worker adapter 骨架

### 37.11 下一步 (Phase 16B)

- 接入真实 Cloudflare Worker endpoint
- 实现真实 RemoteProvider（非 mock）
- Worker 端搜索/歌曲/歌词/流媒体 API
- 与现有 ProviderManager fallback 链集成

---

## 38. Phase 16B — Real Remote Source Integration

> **实施日期: 2026-05-28**
> **目标: 验证 Remote Provider Architecture 在真实网络环境中的稳定性**

### 38.1 设计原则

1. 不碰VIP破解
2. 不碰本地Node API
3. 不恢复 localhost:3001
4. 不做大流量音频中转
5. iPhone Safari 优先

### 38.2 新增文件

| 文件 | 用途 |
|------|------|
| `wrangler.toml` | Cloudflare Worker 部署配置 |
| `workers/types.ts` | Worker 类型定义 (ProviderRoute, ProxySearchParams, WorkerHealthResponse) |
| `src/remote-provider/providers/BaseRemoteProvider.ts` | 抽象基类: fetchWithTimeout/fetchWithRetry/workerPath/createSong |
| `src/remote-provider/providers/InternetArchiveProvider.ts` | Internet Archive 公开音源 (无需API Key, 直接模式) |
| `src/remote-provider/providers/JamendoProvider.ts` | Jamendo 免费音乐 API (需 Worker 代理, API Key 服务端存储) |
| `src/remote-provider/providers/CcMixterProvider.ts` | ccMixter Creative Commons 音源 (Worker 代理) |
| `src/remote-provider/env.ts` | 集中化环境变量访问 (RemoteEnv) |
| `src/remote-provider/testing/HealthTester.ts` | 健康测试: timeout/retry/fallback/degraded/unavailable/all-fail |
| `src/remote-provider/testing/runHealthTests.ts` | 测试运行器 + 格式化报告 + 浏览器全局暴露 |
| `src/remote-provider/testing/index.ts` | Testing 模块统一导出 |
| `src/remote-provider/testing/NetworkSimulator.ts` | 网络模拟器: wifi/4g/3g/vpn/weak/offline |
| `src/remote-provider/testing/NetworkValidator.tsx` | Dev-only 网络验证面板 |

### 38.3 重写文件

| 文件 | 变更 |
|------|------|
| `workers/proxy/music-proxy.ts` | 从骨架(501) → 真实 Worker: /api/health /api/search /api/song/:id /api/providers |
| `workers/config.ts` | 替换 Netease/QQ/Kuwo 为 Internet Archive/Jamendo/ccMixter |
| `workers/cache/edge-cache.ts` | 更新缓存策略, 移除 playUrl, 新增 providerList |
| `workers/health/provider-check.ts` | 真实 per-provider 健康检查 + scheduled handler |
| `src/remote-provider/providers/RemoteWorkerProvider.ts` | 双模式: 真实 fetch() + mock 降级, setWorkerUrl 运行时切换 |

### 38.4 修改文件

| 文件 | 变更 |
|------|------|
| `package.json` | 新增 wrangler devDependency + worker:dev/deploy/tail scripts |
| `src/remote-provider/providers/index.ts` | 导出 BaseRemoteProvider + InternetArchive + Jamendo + CcMixter |
| `src/remote-provider/hooks/useRemoteProvider.ts` | 注册所有真实 Provider (IA P0/Jamendo P1/CcMixter P2/Worker P10) |
| `src/remote-provider/hooks/index.ts` | 导出 initializeRemoteProviders |
| `src/remote-provider/config/index.ts` | 不变 (已有内容) |
| `src/remote-provider/index.ts` | Barrel export 新增 BaseRemoteProvider/InternetArchive/Jamendo/CcMixter/RemoteEnv |
| `src/remote-provider/components/ProviderHealthDashboard.tsx` | 新增 Network Test 折叠面板 |
| `src/components/provider/ProviderInit.tsx` | 调用 initializeRemoteProviders() 初始化远程音源层 |
| `.env.example` | 新增 NEXT_PUBLIC_CF_WORKER_URL |
| `next.config.ts` | env + archive.org remotePatterns |

### 38.5 架构

```
Browser AudioEngine <-- direct MP3 URL --> Internet Archive / Jamendo CDN
                                            ^
                                            | metadata/search/health only
Browser RemoteProvider <-- /api/search -->  Cloudflare Worker --> Internet Archive API
                                            Cloudflare Worker --> Jamendo API
                     <-- fallback --------> MockProvider (permanent)
```

Worker 仅处理 metadata/search/health。音频 URL 直接从 Provider CDN 到浏览器。

### 38.6 Provider 注册顺序

| 优先级 | Provider | 模式 | API Key |
|--------|----------|------|---------|
| P0 | Internet Archive | 直接 (CORS OK) | 不需要 |
| P1 | Jamendo | Worker 代理 | 服务端 (Worker env) |
| P2 | ccMixter | Worker 代理 | 不需要 |
| P10 | Cloudflare Worker | 聚合网关 | — |
| — | MockProvider (旧系统) | 永久兜底 | — |

### 38.7 Cloudflare Worker 端点

| Route | 功能 |
|-------|------|
| `GET /api/health` | 聚合上游健康状态 |
| `GET /api/search?q=&provider=&type=&limit=&offset=` | 代理搜索到指定 Provider |
| `GET /api/song/:id?provider=` | 歌曲元数据 |
| `GET /api/providers` | 可用 Provider 列表 |
| **无** `/api/stream` | **不做音频中转** |

### 38.8 测试模块

**HealthTester** (6 项测试):
- testTimeout — 超时检测验证
- testRetryBehavior — 重试行为 (指数退避, 3次尝试)
- testFallbackChain — P0→P1→P2 降级链
- testDegradedProvider — 慢 Provider 排除
- testUnavailableProvider — 熔断器 5次失败→open→half-open
- testAllProvidersFail — 全部失败时抛出错误

**NetworkSimulator** (7 种条件):
- wifi (50ms/50Mbps/0% loss)
- mobile-4g (100ms/10Mbps/1% loss)
- mobile-3g (300ms/1.5Mbps/3% loss)
- vpn-on (200ms/10Mbps)
- weak (500ms/512Kbps/10% loss)
- offline (all requests fail)
- normal (restore defaults)

### 38.9 部署

```bash
# 部署 Cloudflare Worker
npx wrangler deploy
# → https://music-proxy.<subdomain>.workers.dev

# 配置 Jamendo API Key
wrangler secret put JAMENDO_CLIENT_ID

# 部署 Next.js App (Vercel)
# 设置环境变量 NEXT_PUBLIC_CF_WORKER_URL
```

### 38.10 Phase 16B 新增禁止修改

- `workers/proxy/music-proxy.ts` — Worker 路由逻辑
- `src/remote-provider/providers/BaseRemoteProvider.ts` — 抽象基类
- `src/remote-provider/providers/InternetArchiveProvider.ts` — Internet Archive Provider
- `src/remote-provider/providers/JamendoProvider.ts` — Jamendo Provider
- `src/remote-provider/providers/CcMixterProvider.ts` — ccMixter Provider
- `src/remote-provider/env.ts` — 环境变量访问
- `src/remote-provider/testing/HealthTester.ts` — 健康测试器
- `src/remote-provider/testing/NetworkSimulator.ts` — 网络模拟器

### 38.11 下一步 (Phase 16C 预留)

- 接入更多公开合法 Provider
- Worker 端 KV 缓存层
- Worker Cron 定时健康检查
- 生产环境部署验证
- iPhone Safari 真机测试

---

---

## 39. Phase 18A — Advanced Audio Experience Foundation

> **实施日期: 2026-05-28**
> **目标: 提升听感与高级播放器体验 — Crossfade / Gapless / Volume Normalization / EQ / Visualization / Audio Session Intelligence**

### 39.1 新增文件

| 文件 | 用途 |
|------|------|
| `src/types/phase18.ts` | Phase 18A 全部类型定义 + 默认配置 (CrossfadeConfig/EQState/NormalizationConfig/VisualizationConfig/AudioSessionEvent) |
| `src/lib/audio/webaudio/AudioContextManager.ts` | 共享 AudioContext 生命周期管理 (iOS Safari suspension/resume + 工厂方法) |
| `src/lib/audio/webaudio/CrossfadeEngine.ts` | 双槽交叉淡化引擎 (A/B slot GainNode + linearRampToValueAtTime + linear/equal-power 曲线) |
| `src/lib/audio/webaudio/EQEngine.ts` | 5-band BiquadFilterNode 均衡器 (60Hz/250Hz/1kHz/4kHz/12kHz, bypass/enable) |
| `src/lib/audio/webaudio/EQPresets.ts` | EQ 预设定义 (Bass Boost/Vocal/Pop/Classical/Night) |
| `src/lib/audio/webaudio/VolumeNormalizer.ts` | RMS-based 音量归一化 (fetch Range 首64KB → decodeAudioData → RMS → gain factor 0.5-2.0) |
| `src/lib/audio/webaudio/VisualizationAnalyzer.ts` | AnalyserNode 数据提供 (getFrequencyData/getTimeData/getBands/detectBeat) |
| `src/lib/audio/webaudio/AudioSessionManager.ts` | 音频会话智能 (visibilitychange/pagehide 中断检测 + AirPods/蓝牙/闪避) |
| `src/lib/audio/webaudio/index.ts` | Web Audio 层 barrel export |
| `src/components/player/VisualizerDisplay.tsx` | Canvas 可视化组件 (waveform/bars/pulse 三种模式, iPhone Safari 15fps 优化, IntersectionObserver 暂停) |

### 39.2 修改文件

| 文件 | 变更 |
|------|------|
| `src/types/index.ts` | 新增 Phase 18A section — type + value re-exports |
| `src/stores/settingsStore.ts` | 新增 crossfadeEnabled/crossfadeDuration/eqEnabled/eqPreset/normalizationEnabled/visualizationMode + localStorage 持久化 |
| `src/hooks/useAudioPlayer.ts` | 集成 CrossfadeEngine 路由 + AudioContext 初始化 + EQ/Visualization setup + gapless preload 触发 + VolumeNormalizer 分析 |
| `src/lib/audio/PlayQueue.ts` | 新增 preloadNearEnd() + getPreloadedAudio() + getPreloadedUrl() |
| `src/components/layout/AudioProvider.tsx` | 挂载 useAudioSession (Phase 18A) |
| `src/components/player/PlayerFullscreen.tsx` | 集成 VisualizerDisplay (cover art 下方, 无歌词时显示, 12px 高度) |

### 39.3 架构原则 (Phase 18A 遵守)

1. **Layered bridge approach** — Web Audio 层独立，不修改 AudioManager API
2. **iPhone Safari 优先** — AudioContext suspension 自动恢复, 小 FFT (256), 低帧率 (15fps)
3. **禁止大重构** — 现有 AudioEngine/AudioManager/MusicProvider 完全不变
4. **Crossfade 可选** — 关闭后直接走 AudioManager 路径，零影响
5. **电池优化集成** — VisualizerDisplay 读取 BatteryOptimizationConfig (reducedMotion/lowPowerMode)

### 39.4 Crossfade 架构

```
useAudioPlayer (crossfade enabled)
  │
  ├── detect song transition (prev.id ≠ curr.id, both non-null)
  ├── CrossfadeEngine.startCrossfade(prevUrl, currUrl, durationMs, onComplete)
  │     ├── Slot A: create Audio(prevUrl) → MediaElementSource → Gain A (1→0 ramp)
  │     └── Slot B: create Audio(currUrl) → MediaElementSource → Gain B (0→1 ramp)
  │
  └── onComplete → crossfadeActiveRef=false, store sync
```

### 39.5 EQ Signal Chain

```
Audio Element → MediaElementSource → EQEngine.input (Gain) → BQFilter[0..4] → EQEngine.output (Gain) → Crossfade Gain → destination
```

### 39.6 新增禁止修改

- `src/lib/audio/webaudio/AudioContextManager.ts` — AudioContext 生命周期核心
- `src/lib/audio/webaudio/CrossfadeEngine.ts` — Crossfade 核心算法
- `src/lib/audio/webaudio/EQEngine.ts` — EQ filter chain
- `src/lib/audio/webaudio/VisualizationAnalyzer.ts` — AnalyserNode 管理
- `src/types/phase18.ts` — Phase 18A 类型定义

---

## 40. Phase 18A Stabilization Sprint

> **实施日期: 2026-05-28**
> **目标: 稳定 Advanced Audio Experience，优先稳定性 > 功能扩展**

### 40.1 Crossfade Stability 修复

**文件:** `src/lib/audio/webaudio/CrossfadeEngine.ts`

| 修复 | 说明 |
|------|------|
| Generation counter | 每次 `startCrossfade` / `cancelCrossfade` 递增 generation，`setupSlot` 在异步完成后检查 generation，防止过时的 Promise 覆盖当前状态 |
| Burst/pop prevention | `cancelCrossfade` 先执行 30ms 快速 ramp-to-0 再 stopSlot，防止爆音 |
| GainNode leak fix | `stopSlot` 清理注册的 preGainNodes（逐个 disconnect），`clearPreGains` 也 disconnect |
| Rapid song-change protection | generation 检查 + abort 时清理新创建的 Audio（`pause()/src="" /load()`）|
| Promise settle guard | `setupSlot` 的 ready Promise 用 `settled` 标志防止 double-resolve |
| 30s idle suspend | AudioContextManager 在无播放活动 30s 后自动 suspend（节省电池）|

### 40.2 AudioContextManager 增强

**文件:** `src/lib/audio/webaudio/AudioContextManager.ts`

| 增强 | 说明 |
|------|------|
| Idle suspend timer | 播放停止后 30s 自动 suspend AudioContext，播放恢复时 cancel |
| `prefers-reduced-motion` | 检测 `(prefers-reduced-motion: reduce)` 媒体查询，暴露 `reducedMotion` 属性 |
| Context recovery | `getContext()` 自动检测 `closed` 状态，`resume()` 在 closed 时重建 context |
| Error counter | `errorCount` 属性追踪 AudioContext 创建失败次数 |
| Factory method safety | 所有工厂方法在 ctx 为 null/closed 时返回 null 不抛异常 |
| `notifyPlaybackActive/Stopped` | 供外部调用管理 idle timer |

### 40.3 EQEngine 性能优化

**文件:** `src/lib/audio/webaudio/EQEngine.ts`

| 优化 | 说明 |
|------|------|
| True bypass | `bypass()` 断开 filter chain 并用 `connect()` 直连 source→destination（节省 CPU） |
| Battery-aware | `isBatteryLow` setter — 设为 true 时自动 bypass EQ |
| Batch apply | 新增 `setAllBands(gains[])` 一次性设置所有频段增益，避免多次单独更新 |
| enable() guard | `enable()` 在 `isBatteryLow` 时直接 return |

### 40.4 VisualizationAnalyzer 优化

**文件:** `src/lib/audio/webaudio/VisualizationAnalyzer.ts`

| 优化 | 说明 |
|------|------|
| RAF throttling | 数据采集受 `throttleMs` 控制（默认 66ms ≈ 15fps iPhone Safari 优化），返回缓存数据 |
| Visibility pause | `pagehide` 时不采集新数据，返回上次缓存 |
| Reduced motion | `getAudioContextManager().reducedMotion` 时返回零数组 |
| Idle timeout | `isEffectivelyPaused` 检测 10s 无数据请求自动标记暂停 |
| Cached data | 每次采集后缓存副本供 throttled reads |

### 40.5 PlayQueue Gapless Timing

**文件:** `src/lib/audio/PlayQueue.ts`

| 优化 | 说明 |
|------|------|
| preloadNearEnd dedup | 同一首歌在 1s 内跳过重复预加载（`PRELOAD_DEBOUNCE_MS`）|
| `_preloadPending` flag | 防止并发预加载 |
| URL cache LRU | 限制最多 50 条缓存 URL，超过删除最旧条目 |
| `resolveUrl` 改进 | `addToCache()` 私有方法统一缓存写入逻辑 |

### 40.6 VolumeNormalizer 健壮性

**文件:** `src/lib/audio/webaudio/VolumeNormalizer.ts`

| 增强 | 说明 |
|------|------|
| Range request fallback | 服务器不支持 Range 时回退到无 header fetch |
| AbortController | 新分析取消旧 inflight 请求 |
| Map size limit | 最多 200 条 gain 记录，超出驱逐最旧条目 |
| Minimum buffer guard | `arrayBuffer.byteLength < 1024` 时跳过（预防无效数据解码）|
| Decode error handling | `decodeAudioData` 异常时 catch 返回（非致命） |

### 40.7 稳定化测试工具

**新文件:** `src/lib/audio/webaudio/StabilizationTester.ts`

10 项自动化验证测试：
1. Crossfade Lifecycle — 生命周期、配置、generation counter
2. Crossfade Rapid Cancel — 快速取消后 GainNode/audio 清理
3. AudioContext Recovery — 创建/恢复/工厂方法/reducedMotion
4. EQ Bypass Performance — bypass/battery-low/setAllBands
5. Visualization Throttling — reduced-motion fallback/零数据返回
6. PlayQueue Dedup — preloadPending/取消安全性/LRU cache
7. Volume Normalizer Fallback — 默认增益/禁用控制
8. Weak Network: mobile-3g — NetworkSimulator 3G 条件验证
9. Weak Network: weak — NetworkSimulator 弱网条件验证
10. Cache Pressure — CacheGovernanceV2 cleanup/LRU/stale/lowStorage

使用: `getStabilizationTester().runAll()` → StabilizationReport

### 40.8 修改文件清单

| 文件 | 变更类型 | 变更摘要 |
|------|---------|---------|
| `src/lib/audio/webaudio/CrossfadeEngine.ts` | 增强 | Generation counter / burst prevention / GainNode leak fix / 快速切歌保护 |
| `src/lib/audio/webaudio/AudioContextManager.ts` | 增强 | Idle suspend / reduced-motion / context recovery / error counting / safety |
| `src/lib/audio/webaudio/EQEngine.ts` | 增强 | True bypass (disconnect) / battery-aware / setAllBands / enable guard |
| `src/lib/audio/webaudio/VisualizationAnalyzer.ts` | 增强 | RAF throttling / visibility pause / reduced-motion / idle timeout / caching |
| `src/lib/audio/webaudio/VolumeNormalizer.ts` | 增强 | Range fallback / AbortController / map size limit / min buffer guard |
| `src/lib/audio/webaudio/index.ts` | 修改 | 新增 StabilizationTester 导出 |
| `src/lib/audio/PlayQueue.ts` | 增强 | preloadNearEnd dedup / preloadPending flag / URL cache LRU |
| `src/lib/audio/webaudio/StabilizationTester.ts` | **新增** | 10 项自动化稳定化验证测试 |

### 40.9 新增禁止修改

- `src/lib/audio/webaudio/StabilizationTester.ts` — Phase 18A 稳定化测试工具

---

> **这份文件是项目所有 AI 协同开发的唯一入口。**
> **基于 2026-05-24 真实项目扫描生成，2026-05-28 增量更新 (Public Audio Mode 迁移 + iPhone Audio + Now Playing Experience + Native Feeling + Remote Provider Architecture + Real Remote Source Integration + Advanced Audio Experience Foundation + Stabilization Sprint)，2026-05-29 更新 (Phase 20A Production Deploy Foundation + Phase 20B PWA & iPhone Final Polish)。**
> **当前阶段: Phase 20B 完成 — PWA & iPhone Final Polish (完整图标集/启动画面/Notch适配/安装UX/独立模式引导/Lighthouse优化/品牌打磨)。**
> **当前音源: Public Audio Mode (SoundHelix 16首 Demo) — 零后端 / 零本地API / 零数据库。**
> **Remote Provider: Internet Archive (直接) + Jamendo (Worker代理) + ccMixter (Worker代理) + Cloudflare Worker (聚合网关)。**
> **冻结模块: 54 个 | 自治系统: 11 个 | 恢复系统: 6 层 | 危险区域: 9 个**
> **请保持更新，永远不要让它过时。**
