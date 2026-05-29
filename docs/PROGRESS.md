# Progress

> **AI 协同开发中心：[docs/AI_CONTEXT_RECOVERY.md](AI_CONTEXT_RECOVERY.md)**
> 新 AI 接手时请先阅读该文件。

---

## Phase 1 — 基础框架 ✅ 已完成

**完成时间**: 2026-05-23

### 项目初始化
- [x] package.json, tsconfig.json (strict), tailwind.config.ts, eslint, prettier
- [x] Next.js 15 App Router 配置

### 主题与布局
- [x] 全局样式体系（Apple Music 深色主题 + 毛玻璃 + 卡片 + 骨架屏）
- [x] Root Layout（PWA metadata + viewport + max-w-md 居中）
- [x] PWA（manifest.json + serwist service worker + iOS meta tags）

### 类型系统
- [x] `song.ts` — Song (12 fields: id/title/artist/album/cover_url/audio_url/duration/genre/release_year/play_count/created_at), SongWithMeta
- [x] `playlist.ts` — Playlist (8 fields), PlaylistWithSongs
- [x] `user.ts` — Profile (6 fields), PlayHistory (4 fields)
- [x] `player.ts` — PlayMode, PlayerState, PlayerActions, PlayerStore
- [x] `index.ts` — 统一 re-export

### 状态管理
- [x] `playerStore.ts` — Phase 1 播放器 store (playlist-based, 6 mode cycle)
- [x] `uiStore.ts` — UI 状态 (isPlayerExpanded, isSearchOpen, searchQuery)
- [x] `stores/index.ts` — Phase 1 stores 导出

### UI 基础组件 (零业务依赖)
- [x] `GlassCard.tsx` — 毛玻璃卡片 (forwardRef, 3 variants, 4 paddings, interactive)
- [x] `LazyImage.tsx` — 懒加载图片 (next/image + skeleton fallback)
- [x] `Skeleton.tsx` — 骨架屏 (text/circular/rectangular, shimmer)
- [x] `IconButton.tsx` — 图标按钮 (forwardRef, 3 sizes, 2 variants, active:scale-90)

### 播放器组件 (Phase 1 版本)
- [x] `PlayerBar.tsx` — 底部迷你播放器 (使用 playerStore)
- [x] `ProgressBar.tsx` — 进度条 (mouse drag + touch)
- [x] `AlbumCover.tsx` — 专辑封面 (4 sizes, spin animation)
- [x] `PlayerControls.tsx` — 播放控制 (4 mode icons, loading spinner)

### 首页组件
- [x] `HomePage.tsx` — 首页容器
- [x] `SearchBar.tsx` — 搜索入口
- [x] `SongRow.tsx` — 单行歌曲 (使用 playerStore)
- [x] `RecommendSection.tsx` — 推荐歌单 2x3 grid (mock 6 playlists)
- [x] `HotSongsSection.tsx` — 热门歌曲 (mock 8 songs)
- [x] `RecentPlaysSection.tsx` — 最近播放 (mock 3 songs)

### 音频系统 (Phase 1)
- [x] `AudioEngine.ts` — 简化 HTML5 Audio 封装 (单例, RAF 驱动)
- [x] `useAudio.ts` — playerStore ↔ AudioEngine 桥接
- [x] `useMediaSession.ts` — iOS 控制中心 + 锁屏

### 后端
- [x] Supabase 客户端 (`client.ts` + `server.ts`)
- [x] DB Schema (6 tables + RLS + 4 indexes)
- [x] `songService.ts` — 歌曲 CRUD (getHotSongs, getSongById, recordPlay, toggleLike)

### 文档
- [x] 5 份项目文档 (PROJECT_RULES, PROGRESS, MODULE_MAP, ARCHITECTURE_STATE, AI_CONTEXT_RECOVERY)

---

## Phase 2 — 音乐播放器核心系统 ✅ 已完成

**完成时间**: 2026-05-23

### 核心架构
- [x] **types/music.ts** — Phase 2 类型定义
  - `LoadingState`, `LyricLine`, `AudioState`, `QueueState`, `PlayerSnapshot`, `AudioEventCallbacks`
  - re-export `PlayMode` from player.ts
- [x] **AudioManager** (`lib/audio/AudioManager.ts`) — 全局单例音频管理器
  - `load()` / `play()` / `pause()` / `resume()` / `seek()` / `setVolume()` / `setPlaybackRate()` / `destroy()`
  - RAF 驱动时间更新（200ms throttle, ~5fps）
  - 播放时自动启动 RAF, 暂停时自动停止
  - Page Visibility API 节能（tab 不可见时停止 RAF）
  - 缓冲进度上报（progress 事件）
  - 加载状态管理（idle → loading → ready / error, waiting → loading, playing → ready）
  - 导出 `getAudioManager()` 便捷函数
- [x] **musicPlayerStore** (`stores/musicPlayerStore.ts`) — Phase 2 播放器状态
  - 23 actions: play/pause/togglePlay/seek/setVolume/toggleMute/setPlaybackRate
  - syncTime/setBuffered/setLoadingState（由 AudioManager 回调驱动）
  - setQueue/addToQueue/removeFromQueue/clearQueue（数组操作 + 索引重算）
  - next/prev（4 种播放模式 + shuffle Fisher-Yates + sequential stop）
  - setPlayMode/cycleMode（4 mode rotation）
  - setLyrics/setCurrentLyricIndex
  - `play(song)`: song 已在 queue 中则直接切换；否则追加到 queue 末尾
  - `next()`: shuffle 避开当前索引；sequential 到末尾停止播放
  - `prev()`: currentTime > 3s 重播当前；<= 3s 去上一首
- [x] **LyricParser** (`lib/lyrics/LyricParser.ts`) — LRC 歌词解析器
  - `parse(lrc)` → LyricLine[]: 标准 LRC + 多标签行 + 按时间排序
  - `parseEnhanced(lrc)` → LyricLine[]: Phase 3 预留, 当前 fallback 到 parse()
  - `findCurrentIndex(lines, timeMs)` → number: 二分查找 O(log n)

### Hooks (Phase 2)
- [x] **useAudioPlayer** — store ↔ AudioManager 核心桥接 (4 effects + 1 subscribe)
  - Effect 1: `[currentSong?.id, audio_url]` → load new audio + play
  - Effect 2: `[isPlaying]` → play/pause
  - Effect 3: `[volume, isMuted]` → setVolume
  - Effect 4: `[playbackRate]` → setPlaybackRate
  - Subscribe: 检测 seek 跳变 (diff > 1.5s) → AudioManager.seek()
- [x] **usePlayerControls** — UI 组件控制层
  - 15 个 useCallback 稳定引用
  - 返回: isPlaying, isLoading, hasError, playMode, currentSong + 12 actions
- [x] **useLyricsSync** — currentTime → LyricParser.findCurrentIndex → setCurrentLyricIndex
- [x] **useLyricsLoader** — loadLyrics(lrcText) / clearLyrics()

### UI 组件 (Phase 2)
- [x] **PlayerFullscreen** — 全屏播放器
  - 背景：专辑封面 blur-2xl + 黑色叠加 60%
  - 顶部栏：关闭(Collapse) + "正在播放" + 专辑名 + 菜单
  - 中部：封面 280px (唱片样式: 带圆孔) / 歌词视图
  - 底部：ProgressBar + PlayerControls(lg) + VolumeSlider
  - fade-in 动画 + safe-area inset
- [x] **LyricsView** — 歌词滚动视图
  - 当前行高亮: text-primary + text-2xl + font-semibold + scale-105
  - 已播行: text-tertiary; 未播行: text-secondary
  - 自动 scrollIntoView (smooth, center)
  - 点击行 seek (time/1000 转秒)
  - 上下毛玻璃渐变遮罩
  - 顶部 40vh 留白（让首行能滚到中间）
- [x] **VolumeSlider** — 音量滑块
  - mouse + touch drag
  - 静音按钮 + 3 级图标 (0 / <0.5 / >=0.5)
  - effVol = isMuted ? 0 : volume

### 集成与迁移
- [x] `PlayerBar.tsx` 切换至 musicPlayerStore
- [x] `SongRow.tsx` 切换至 musicPlayerStore + 播放动画指示器
- [x] `BottomPlayer.tsx` 集成 PlayerFullscreen 条件渲染
- [x] `AudioProvider.tsx` 挂载 4 个 hooks (useAudio + useAudioPlayer + useMediaSession + useLyricsSync)
- [x] `types/index.ts` 新增 music.ts 导出
- [x] Phase 1 代码保持不动（AudioEngine, playerStore, useAudio）

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] ESLint 零 error (warnings only — intentional hook deps)
- [x] `next build` production build 成功

---

## Phase 3 — 搜索系统 + 音源抽象层 🚧 进行中

**开始时间**: 2026-05-23

### 音源抽象层 (Provider Adapter Architecture)
- [x] **types/provider.ts** — MusicProvider 统一接口 + ProviderType + MusicQuality + SearchOptions + SongDetail
- [x] **providers/mock/** — MockProvider (52 首 mock 歌曲 + 12 歌单 + 10 艺术家 + 5 完整 LRC 歌词 + 20 热门关键词)
- [x] **cache/SearchCache.ts** — 内存缓存层 (Map + 时间戳), 请求去重 (pendingRequests), 按类型 staleTime/gcTime
- [x] **services/SearchService.ts** — 统一搜索入口 (缓存 + 去重 + fallback 预留)

### 搜索状态管理
- [x] **stores/searchStore.ts** — Zustand store (query/suggestions/hotKeywords/history/results/isSearching/activeView + 11 actions)
- [x] **hooks/useMusicProvider.ts** — Provider 单例管理 + SearchService 初始化
- [x] **hooks/useSearch.ts** — 300ms debounce + 搜索建议 + 结果查询 + cancel 机制
- [x] **hooks/useSearchHistory.ts** — localStorage 搜索历史 (最多 20 条)
- [x] **hooks/useHotKeywords.ts** — 热门搜索词加载

### 搜索 UI
- [x] **components/search/SearchPage.tsx** — 全屏搜索页 (毛玻璃 search bar, auto-focus, animate-slide-up)
- [x] **components/search/HotKeywords.tsx** — 热门搜索词流式布局
- [x] **components/search/SearchHistory.tsx** — 搜索历史列表 (单条删除 + 清除全部)
- [x] **components/search/SearchResultsView.tsx** — 搜索结果 (歌曲复用 SongRow + 歌单 grid + 艺术家横向滚动)

### 类型扩展
- [x] **types/music.ts** — 新增 Artist, Album, SearchResult
- [x] **types/index.ts** — 导出新增类型

### 集成
- [x] **page.tsx** — 集成 SearchPage 条件渲染
- [x] SearchBar 触发 uiStore.toggleSearch() → SearchPage overlay

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] ESLint 零新增 error (pre-existing warnings only)
- [x] `next build` production build 成功

---

## Phase 4 — 用户系统 + 收藏 + 歌单 ✅ 已完成

**完成时间**: 2026-05-23

### 数据库
- [x] Migration 002: `recently_played` 表 + `favorite_playlists` 表
- [x] `handle_new_user()` trigger — 自动创建 profile

### 类型系统
- [x] **types/library.ts** — UserState, UserInfo, LikedSongRecord, RecentlyPlayedRecord, UserPlaylist, PlaylistWithSongsDetail, FavoritePlaylistRecord, PlaylistSongRecord, LibraryData
- [x] **types/index.ts** — 导出所有新类型

### 服务层
- [x] **authService.ts** — signInAnonymously, getSession, getCurrentUser, signOut, onAuthStateChange
- [x] **likedSongsService.ts** — getLikedSongs, getLikedSongIds, toggleLike, isLiked
- [x] **playlistService.ts** — getUserPlaylists, getPlaylistDetail, createPlaylist, deletePlaylist, addSong, removeSong, toggleFavorite, getFavoritePlaylists
- [x] **recentPlayedService.ts** — recordPlay (upsert), getRecentPlays, getRecentPlayIds

### Zustand Stores
- [x] **userStore.ts** — user/setUser/clearAuth/setLoading
- [x] **libraryStore.ts** — likedSongIds(Set)/recentPlayIds/favoritePlaylistIds + optimistic toggle
- [x] **playlistStore.ts** — 编辑/创建/添加歌曲 modal 状态

### Hooks
- [x] **useAuth.ts** — 匿名登录 + 会话管理 + 状态监听
- [x] **useLikedSongs.ts** — React Query + optimistic update
- [x] **usePlaylist.ts** — 歌单 CRUD (React Query mutations)
- [x] **useRecentPlayed.ts** — 自动记录播放 + 查询
- [x] **useLibrary.ts** — 收藏歌单 + 聚合查询

### 组件
- [x] **AuthProvider** — QueryClientProvider + AuthInitializer (loading spinner)
- [x] **LibraryPage** — 我的音乐 (tabs: 喜欢/歌单/最近 + 新建歌单 modal)
- [x] **LikedSongsList** — 喜欢歌曲列表 (复用 SongRow)
- [x] **PlaylistList** — 用户歌单 2-col grid (PlaylistCard × N)
- [x] **RecentPlaysList** — 最近播放列表 (复用 SongRow)
- [x] **PlaylistCard** — 歌单卡片 (LazyImage cover + title + count)
- [x] **MobileNav** — 底部导航栏 (发现/我的)

### 页面路由
- [x] `/library` — 我的音乐页
- [x] `/playlist/[id]` — 歌单详情页 (播放全部 + 收藏 + 删除)

### 集成
- [x] `layout.tsx` — AuthProvider 包裹 AudioProvider
- [x] `page.tsx` — 添加 MobileNav
- [x] `BottomPlayer.tsx` — PlayerBar 上移到 MobileNav 上方
- [x] `HomePage.tsx` — 底部 padding 适配

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] ESLint 零新增 error (pre-existing warnings only)
- [x] `next build` production build 成功

### 新增文件统计: 22 个

### P0 — 真实数据 + 部署（待开发）
- [ ] **真实数据连接** — 替换所有 mock 数据为 Supabase 查询
- [ ] **Vercel 部署** — 项目上线

### P1 — 增强（待开发）
- [x] **Netease/QQ/Kuwo Provider** — Phase 7 ✅
- [ ] **真实 API 端点** — 在各 API Route 中接入真实音乐 API URL
- [ ] **邮箱登录** — 预留接口，实现 email/password 登录

### P2 — 可延后
- [x] **评论系统** — Phase 5 ✅
- [ ] 用户个人页 (`/profile`)
- [ ] 双语歌词 (parseEnhanced 实现)
- [ ] 队列可视化编辑 (拖拽排序)

### P3 — 长远
- [ ] Cloudflare Workers API 中间层
- [ ] iOS 原生 WKWebView 封装
- [ ] iPad 横屏适配

---

---

## Phase 5 — 评论系统 + 社交互动基础 + 歌曲详情页 ✅ 已完成

**完成时间**: 2026-05-24

### 数据库
- [x] Migration 003: `song_comments` + `comment_likes` + `comment_replies` tables + RPC functions + RLS

### 类型系统
- [x] **types/social.ts** — CommentRecord, CommentWithProfile, CommentUserProfile, CommentLikeRecord, CommentReplyRecord, CommentReplyWithProfile, PageParam, CommentPage, ReplyPage, CommentSortType, SocialState
- [x] **types/index.ts** — 导出所有新社交类型

### 服务层
- [x] **services/social/commentService.ts** — getComments (cursor pagination + sort), createComment, deleteComment
- [x] **services/social/likeService.ts** — getLikedCommentIds, toggleLike (atomic RPC count)
- [x] **services/social/replyService.ts** — getReplies (cursor pagination), createReply, deleteReply

### Zustand Store
- [x] **socialStore.ts** — commentSortType / currentCommentSongId / activeReplyId + 3 actions

### Hooks
- [x] **useComments.ts** — React Query useInfiniteQuery (cursor pagination, sort switching) + add/delete mutations
- [x] **useCommentLike.ts** — React Query liked comment IDs + toggleLike mutation
- [x] **useReplies.ts** — React Query replies (lazy per comment) + add/delete mutations
- [x] **useSongDetail.ts** — React Query single song detail fetch

### UI 组件
- [x] **CommentCard.tsx** — 头像 + 用户名 + 时间 + 内容 + 点赞/回复/删除 actions
- [x] **CommentList.tsx** — 排序切换(hot/newest) + infinite scroll + 空状态 + skeleton + input
- [x] **CommentInput.tsx** — 圆角 input + send button + Enter submit + 16px font
- [x] **ReplyCard.tsx** — 内嵌回复 (小头像 + 用户名 + 时间 + 内容)
- [x] **components/comments/index.ts** — 统一导出

### 页面路由
- [x] `/song/[id]` — SongDetailPage (大封面 + bg blur + 歌曲信息 + 播放/喜欢 + 评论区)
- [x] `/playlist/[id]` — 增强 PlaylistDetailPage (bg blur + 大封面 + 收藏/删除 + 歌曲列表)

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] ESLint 零新增 error (pre-existing warnings only)
- [x] `next build` production build 成功

### 新增文件统计: 14 个

---

## Phase 6 — PWA增强 + iPhone体验优化 + 离线能力 + 后台播放 ✅ 已完成

**完成时间**: 2026-05-24

### 类型系统
- [x] **types/system.ts** — NetworkState, CacheStats, InstallState, SystemState, SystemActions, SystemStore
- [x] **types/index.ts** — 导出所有新系统类型

### Zustand Store
- [x] **systemStore.ts** — isOffline/networkState/installState/cacheStats/backgroundPlayback + 9 actions

### IndexedDB 缓存层 (src/storage/)
- [x] **CacheDB.ts** — 通用 IndexedDB 封装 (openDB + CRUD + getByIndex + count + clear)
- [x] **metadataStore.ts** — 歌曲元数据缓存 (cacheSong/getCachedSong/getAll/remove/count)
- [x] **offlineStore.ts** — 离线歌单存储 (save/getAll/remove/count)
- [x] **historyStore.ts** — 本地播放历史 (record/get/clear)
- [x] **lyricCacheStore.ts** — 歌词 IndexedDB 缓存 (cache/get/remove/count)
- [x] **storage/index.ts** — 统一导出

### 缓存服务层 (src/services/cache/)
- [x] **audioCacheService.ts** — 音频元数据缓存 + 预加载队列 (MAX_CONCURRENT=1, preloadQueueNext)
- [x] **imageCacheService.ts** — 图片预加载 (preload/preloadImages/isPreloaded)
- [x] **lyricCacheService.ts** — 歌词缓存 (getOrFetchLyric with fallback)
- [x] **services/cache/index.ts** — 统一导出

### Hooks
- [x] **usePWAInstall.ts** — PWA 安装提示 + beforeinstallprompt + iOS 检测 + standalone 检测
- [x] **useNetworkState.ts** — 网络状态检测 (online/offline/slow + Network Information API)
- [x] **useOfflineCache.ts** — IndexedDB 缓存统计 + refresh
- [x] **useAudioCache.ts** — 自动缓存当前歌曲 + 队列预加载

### Media Session 重写
- [x] **useMediaSession.ts** — 切换到 musicPlayerStore + positionState 定时更新 + 完整 action handlers

### Service Worker 增强
- [x] **sw.ts** — 分层运行时缓存策略: static(CacheFirst), images(StaleWhileRevalidate), api(NetworkFirst), fonts(CacheFirst), navigation(NetworkFirst)

### PWA 增强
- [x] **manifest.json** — 增强 (display_override + categories + shortcuts + lang + dir)
- [x] **layout.tsx** — iOS splash screens (5个尺寸, apple-touch-startup-image)
- [x] **layout.tsx** — InstallDetector + InstallPrompt 集成

### UI 组件
- [x] **InstallDetector.tsx** — 静默组件, 挂载 usePWAInstall + useNetworkState + useOfflineCache
- [x] **InstallPrompt.tsx** — iOS 安装教程弹窗 (30s 后触发, 步骤说明, 永久关闭)
- [x] **PageTransition.tsx** — 页面过渡动画组件 (fade-in + slide-up, routeKey 驱动)
- [x] **components/pwa/index.ts** — PWA 组件导出

### 样式增强
- [x] **globals.css** — .offline-badge, .pb-safe/.pt-safe/.px-safe, .page-enter/.page-enter-active/.page-exit
- [x] **tailwind.config.ts** — slide-down + pulse-glow 动画

### 布局增强
- [x] **AudioProvider.tsx** — 挂载 useAudioCache (Phase 6)
- [x] **layout.tsx** — InstallDetector 包裹 AudioProvider, InstallPrompt 渲染

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] ESLint 零新增 error (pre-existing warnings only)
- [x] `next build` production build 成功

### 新增文件统计: 14 个

### P0 — 真实数据 + 部署（待开发）
- [ ] **真实数据连接** — 替换所有 mock 数据为 Supabase 查询
- [ ] **Vercel 部署** — 项目上线

### P1 — 音源 + 增强（待开发）
- [ ] **真实音频文件** — Supabase Storage 上传
- [ ] **Netease Provider** — 接入网易云音乐 API
- [ ] **邮箱登录** — 预留接口，实现 email/password 登录

### P2 — 可延后
- [ ] 用户个人页 (`/profile`)
- [ ] 双语歌词 (parseEnhanced 实现)
- [ ] 队列可视化编辑 (拖拽排序)

### P3 — 长远
- [ ] Cloudflare Workers 部署 (架构已预留)
- [ ] iOS 原生 WKWebView 封装
- [ ] iPad 横屏适配

---

## Phase 7 — 真实音源接入 + Provider动态切换 + API代理层 + 稳定性系统 ✅ 已完成

**完成时间**: 2026-05-24

### Provider 管理系统
- [x] **Provider Manager** — 全局单例 (注册/切换/健康检测/fallback/重试/恢复探测)
- [x] **HealthTracker** — 滑动窗口健康检测 (延迟/成功率/连续失败)
- [x] **RequestManager** — 请求管理 (重试3次+指数退避/超时10s/去重/AbortController)

### 真实 Provider 实现
- [x] **NeteaseProvider** — 网易云音乐 (基于 BaseProxyProvider)
- [x] **QQProvider** — QQ音乐 (基于 BaseProxyProvider)
- [x] **KuwoProvider** — 酷我音乐 (基于 BaseProxyProvider)
- [x] **BilibiliProvider** — B站预留骨架
- [x] **BaseProxyProvider** — 代理基础类 (所有方法通过 API Routes)

### API 代理层
- [x] **API Routes** (11 个端点): search/suggestions/hotkeywords/song/play/lyrics/playlist/artist/health
- [x] **proxy-helper.ts** — 统一响应格式 + 限流 + 缓存头
- [x] **/api/provider/health** — Provider 健康状态 API

### 类型系统
- [x] **types/provider.ts** — ProviderHealthSnapshot, ProviderState, ProviderStore, RetryConfig, ProxyConfig
- [x] **types/index.ts** — 导出所有新类型
- [x] **ProviderType** 扩展: 新增 "bilibili"

### 缓存系统升级
- [x] **APICache** — SWR 缓存 (stale-while-revalidate + 分组 TTL)
- [x] 缓存分类: search(2min)/suggestion(1min)/hotKeywords(30min)/songDetail(5min)/lyrics(30min)/playUrl(10min)/playlist(5min)

### Zustand Store
- [x] **providerStore.ts** — 当前provider/健康数据/fallback状态/请求状态 + 7 actions

### Hooks
- [x] **useProvider** — Provider 生命周期管理 + 回调注册
- [x] **useProviderHealth** — 健康监控 + 定时轮询 (10s)
- [x] **useFallbackPlayer** — Fallback-aware 播放 + URL缓存 + 预加载
- [x] **useMusicSource** — 高层数据源 (SWR + 自动 fallback + 缓存)

### Cloudflare Workers 预留
- [x] **workers/config.ts** — Worker 配置结构
- [x] **workers/proxy/music-proxy.ts** — 音乐 API 代理骨架
- [x] **workers/cache/edge-cache.ts** — Edge 缓存策略定义
- [x] **workers/health/provider-check.ts** — 健康检测 + Cron trigger

### 播放稳定性
- [x] **PlaybackStabilizer** — URL缓存 + 失败换源 + 预加载队列 + 状态保存/恢复

### UI 增强
- [x] **ProviderDebugPanel** — 开发调试面板 (provider状态/健康/缓存)
- [x] **ProviderStatusBar** — 音源状态指示条
- [x] **FallbackNotice** — 降级通知弹窗 (4s自动消失)
- [x] **ProviderInit** — 应用启动时注册所有 Provider

### 集成
- [x] **layout.tsx** — 集成 ProviderInit + FallbackNotice + ProviderDebugPanel

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] `next build` production build 成功
- [x] 13 个 API Routes 全部注册

### 新增文件统计: 23 个

### P0 — 真实数据 + 部署（待开发）
- [ ] **真实数据连接** — 替换所有 mock 数据为 Supabase 真实查询
- [ ] **Vercel 部署** — 项目上线

### P1 — 增强（待开发）
- [ ] **真实 API 端点** — 在各 API Route 中接入真实音乐 API URL
- [ ] **邮箱登录** — 预留接口，实现 email/password 登录
- [x] **iOS封装 + TestFlight** — Phase 8 ✅

---

## Phase 8 — iOS封装预留 + TestFlight准备 + 私用稳定化 + 最终产品化 ✅ 已完成

**完成时间**: 2026-05-24

### Capacitor 封装
- [x] capacitor.config.ts — Capacitor 配置
- [x] iOS Info.plist 模板 (音频后台 + 状态栏 + WKWebView)
- [x] 构建脚本 (build-ios.sh, sync.sh)
- [x] Capacitor 部署指南

### 播放恢复系统
- [x] types/recovery.ts — RecoveryState/RecoveryResult 类型
- [x] PlaybackRecoverySystem — save/restore/clear + auto-save + emergencySave
- [x] usePlaybackRecovery — 5s 自动保存 + beforeunload 紧急保存

### 崩溃保护
- [x] ErrorBoundary — 全局 React Error Boundary (class component, auto-retry)
- [x] AudioErrorBoundary — 音频加载失败专用
- [x] ProviderErrorBoundary — Provider 失败自动 fallback
- [x] OfflineFallback — 离线状态 UI

### 日志系统
- [x] Logger — 分类日志 (audio/provider/playback/cache/debug) + localStorage 持久化
- [x] 开发模式调试 + 生产环境静默

### 设置页
- [x] settingsStore — audioQuality/autoCache/debugMode/providerPriority
- [x] SettingsPage — 音频质量/自动缓存/音源优先级排序/缓存管理/Debug模式/版本信息
- [x] 清除所有缓存 (IndexedDB + localStorage)
- [x] /settings 路由
- [x] MobileNav 新增"设置" tab

### 下载系统预留
- [x] types/download.ts — DownloadTask/DownloadQueue/DownloadProgress 类型
- [x] DownloadManager — 队列管理 (enqueue/pause/resume/cancel + progress)

### 性能优化
- [x] usePerformanceCleanup — 定时 GC (10min), 清理过期歌词 (>7d), 历史限制 (500条)

### SEO / Meta
- [x] AppMeta — OpenGraph + Twitter Card + Apple Meta + PWA Meta + Security headers

### AI 长期维护体系
- [x] CURRENT_TASK.md — 当前开发任务和状态
- [x] KNOWN_ISSUES.md — 已知 Bug 和技术债务
- [x] API_MAP.md — 所有 API 路由完整地图
- [x] STORE_MAP.md — 所有 Zustand Store 完整地图
- [x] PROVIDER_MAP.md — Provider 完整状态和架构
- [x] CACHE_ARCHITECTURE.md — 多层缓存架构
- [x] PLAYBACK_FLOW.md — 播放系统完整流程

### 部署文档
- [x] VERCEL_DEPLOY.md — Vercel 部署指南
- [x] SUPABASE_CONFIG.md — Supabase 配置指南
- [x] TESTFLIGHT_GUIDE.md — TestFlight 分发指南
- [x] CAPACITOR_BUILD.md — Capacitor 构建指南

### 集成
- [x] layout.tsx — 集成 AppMeta SEO 组件
- [x] AudioProvider.tsx — 挂载 usePlaybackRecovery + usePerformanceCleanup
- [x] types/index.ts — 导出 recovery/download 类型
- [x] MobileNav — 新增设置 tab

### 新增文件统计: 22 个

---

## Phase 9 — 系统最终稳定化 + 自动化维护体系 + 私用长期运行架构 ✅ 已完成

**完成时间**: 2026-05-24

### Watchdog 系统
- [x] PlaybackWatchdog — 播放卡死/超时/URL失效/Provider失效检测 + 自动恢复 (resume→reload→skip)
- [x] 每2s巡检，5s卡顿阈值，30s超时阈值

### Provider 自愈系统
- [x] ProviderSelfHealingSystem — 自动评分 (latency+health) + 自动降级 + 自动恢复
- [x] 失败冷却 (5min) + 探测恢复 (30s间隔)
- [x] 评分公式: latencyScore(30%) + healthScore(70%) - failurePenalty

### 缓存治理系统
- [x] CacheGovernanceSystem — 定期清理过期 IndexedDB 数据
- [x] LRU 策略 + 总条目上限 2000 + 歌词7天 + 历史上限500 + 元数据30天
- [x] 定时触发 (10min) + 启动时检查

### 启动恢复管道
- [x] StartupRecoveryPipeline — 上次播放/队列/Provider/用户偏好恢复
- [x] quickSave 方法 + 恢复耗时跟踪

### 遥测系统
- [x] TelemetryService — Provider/播放/缓存/启动指标收集
- [x] localStorage 环形buffer (1000条) + JSON导出
- [x] Provider请求/播放事件/卡顿/恢复指标

### Diagnostics Center
- [x] DevDiagnosticsPage — 5个Tab (总览/Provider/播放/缓存/日志)
- [x] Provider评分可视化 + 健康状态 + Fallback链
- [x] /diagnostics 路由

### Debug Overlay
- [x] DebugOverlay — 浮动调试面板 (Provider/Audio/Cache/Memory)
- [x] 三指双击唤出 + Ctrl+Shift+D 快捷键
- [x] DebugOverlayWrapper 条件渲染 (仅debug模式)

### Release Mode
- [x] ReleaseMode 管理 (debug/internal/release)
- [x] 功能开关 (debugOverlay/diagnosticsPage/watchdog/telemetry/logging)
- [x] NEXT_PUBLIC_RELEASE_MODE 环境变量控制

### .env.example
- [x] 完整环境变量模板 (Supabase/Provider/Debug/Cache/Recovery/Performance/Telemetry)

### AI 长期维护体系
- [x] SYSTEM_HEALTH.md — 系统健康状态快照
- [x] PROVIDER_HEALTH.md — Provider评分和健康
- [x] CURRENT_BOTTLENECKS.md — 性能瓶颈点
- [x] DEBUG_GUIDE.md — 调试指南
- [x] FAILURE_RECOVERY_GUIDE.md — 故障恢复指南
- [x] DEPLOYMENT_STATE.md — 部署状态

### AI_CONTEXT_RECOVERY.md 升级
- [x] 新增 §16-§23: 系统健康/Provider评分/瓶颈/Watchdog架构/缓存健康/部署状态/iOS兼容/长期维护
- [x] Phase 9 文件索引 + 接手规则更新

### 构建验证
- [x] TypeScript strict mode 编译通过 (0 errors)
- [x] `next build` production build 成功
- [x] /diagnostics 路由正常注册

### 新增文件统计: 14 个

---

---

## Phase 10 — 最终私用产品完善 + 自托管能力 + 长期可持续维护架构 ✅ 已完成

**完成时间**: 2026-05-24

### 平台层 (src/platform/)

- [x] **RuntimeConfigManager** (`platform/config/RuntimeConfigManager.ts`)
  - 动态 Provider/Cache/Debug/Experiment 配置
  - local config + remote config 预留 + env merge + runtime override
  - 配置变更自动通知订阅者

- [x] **ProviderHotReloadSystem** (`platform/update/ProviderHotReload.ts`)
  - 动态启停 Provider (不需重启APP)
  - 热切换 + 自动替换 (健康原因)
  - 优先级实时调整 + 切换历史记录

- [x] **BackupManager** (`platform/backup/BackupManager.ts`)
  - 5 种备份范围: full/playlists/liked/config/cache_index
  - JSON export + download + restore from file
  - SHA-256 checksum 校验
  - IndexedDB 完整快照导出

- [x] **MigrationPipeline** (`platform/migration/MigrationPipeline.ts`)
  - 幂等迁移执行 (带 down() 回滚)
  - 迁移记录持久化追踪
  - 内置 v2/v3 迁移
  - 按目标筛选运行

- [x] **DeploymentMode** (`platform/runtime/DeploymentMode.ts`)
  - 4 种模式自动检测: local/vercel/cloudflare/hybrid
  - Profile-based 特性切换

- [x] **MemoryMonitor** (`platform/runtime/MemoryMonitor.ts`)
  - 30s 采样内存使用
  - Warning(50MB)/Critical(80MB) 压力检测
  - 保留最近 120 个快照 (1 小时)

- [x] **SystemIntegrity** (`platform/runtime/SystemIntegrity.ts`)
  - 7 项完整性检查 (localStorage/IndexedDB/AudioContext/SW/RuntimeConfig/ProviderConfig/StorageQuota)
  - 自动生成建议

- [x] **DisasterRecovery** (`platform/recovery/DisasterRecovery.ts`)
  - Quick/Full/Nuclear 三级恢复
  - 5 个恢复检查点
  - 核选项: 完全重置到出厂状态

### 类型定义

- [x] `src/types/phase10.ts` — 全部 Phase 10 类型
- [x] `src/types/index.ts` — 新增 phase10 导出

### 模块导出

- [x] `src/platform/index.ts` — 平台模块统一导出

### 文档 (新增 10 份)

- [x] `docs/ai/RUNTIME_ARCHITECTURE.md` — 运行时架构全景
- [x] `docs/ai/RECOVERY_PIPELINE.md` — 三层恢复管线
- [x] `docs/ai/PROVIDER_RUNTIME.md` — Provider 运行时管理
- [x] `docs/ai/CACHE_RUNTIME.md` — 四层缓存运行时
- [x] `docs/ai/DEPLOYMENT_PROFILES.md` — 部署模式详解
- [x] `docs/ai/BACKUP_STRATEGY.md` — 备份策略与校验
- [x] `docs/ai/MIGRATION_GUIDE.md` — 数据迁移指南
- [x] `docs/self-host/INDEX.md` — 自托管完整指南
- [x] `docs/FINAL_PROJECT_STRUCTURE.md` — 最终项目结构全景
- [x] `deployment/profiles.md` — 部署配置文件
- [x] `release/RELEASE_CHECKLIST.md` — 发布检查清单

### 文档更新 (4 份)

- [x] `docs/AI_CONTEXT_RECOVERY.md` — Phase 10 + Sections 24-31 + 源码列表更新
- [x] `docs/PROGRESS.md` — Phase 10 完成记录
- [x] `docs/ARCHITECTURE_STATE.md` — Phase 10 架构章节
- [x] `docs/MODULE_MAP.md` — Phase 10 模块索引

### 构建验证

- [x] TypeScript strict mode 零 error
- [x] ESLint 零 error (3 pre-existing warnings)
- [x] `next build` production build 成功

### 新增文件统计: 8 源文件 + 11 文档

---

---

## Phase 11 — AI原生最终工程体系 + 完整自动运维体系 + 长期演进架构 ✅ 已完成

**完成时间**: 2026-05-24

### AI 工程索引系统

- [x] **AI_PROJECT_INDEX.md** — 项目最高优先级索引 (项目摘要/技术栈/架构/Store关系/Provider/Recovery/部署/禁止区域/风险/路线图)
- [x] **AI_ONBOARDING_PROTOCOL.md** — 新AI接手10步SOP (上下文恢复→环境验证→架构边界→禁止清单→已知问题→开发阶段→安全区域→调试→部署→恢复)
- [x] **AI_RECOVERY_BOOTSTRAP.md** — 灾难级恢复方案 (8个Phase: 紧急评估→上下文恢复→恢复播放→恢复部署→恢复Provider→恢复数据→项目重建→自我修复清单)

### 自动诊断系统 (src/system/auto-diagnostics/)

- [x] **AutoDiagnosticsRunner.ts** — 自动扫描 providers/cache/playback/stores + 生成 DiagnosticsReport
- [x] Provider 健康扫描 (读取 ProviderManager 状态)
- [x] 缓存扫描 (Memory + IndexedDB + Service Worker 三层)
- [x] 播放状态扫描 (Watchdog状态 + 恢复统计)
- [x] Store 注册状态扫描 (12个Store)
- [x] 支持按 scope 扫描 + 整体状态计算

### 架构快照系统 (src/system/snapshot/)

- [x] **ArchitectureSnapshotManager.ts** — 抓取项目架构快照 + 对比变化
- [x] 目录/Store/Provider/依赖关系快照
- [x] localStorage 持久化 (最近3次)
- [x] Markdown 报告生成
- [x] 快照对比 diff 功能

### 运行时治理系统 (src/system/governance/)

- [x] **RuntimeGovernanceManager.ts** — 配置/Store/Provider/Recovery 一致性检查
- [x] ConfigConsistency: RuntimeConfig + ENV + settingsStore
- [x] StoreConsistency: 12个Store注册验证
- [x] ProviderGovernance: MockProvider兜底 + Fallback链完整性
- [x] RecoveryGovernance: 三层恢复全部验证
- [x] Markdown 治理报告生成

### 维护模式系统 (src/system/maintenance/)

- [x] **MaintenanceMode.ts** — 4种运行模式 (release/maintenance/degraded/provider_emergency)
- [x] 每种模式 7 项功能限制 (Restrictions)
- [x] 自动 Provider 紧急模式检测
- [x] 模式切换持久化

### 文档系统

- [x] **TECHNICAL_DEBT.md** — 7项技术债追踪 (TD-001~TD-007) + 优先级矩阵
- [x] **PROVIDER_RISK_ANALYSIS.md** — 5个Provider稳定性分析 + 风险矩阵 + 缓解措施
- [x] **PROJECT_GOVERNANCE.md** — 8大类治理规则 (模块/Store/Provider/Recovery/Cache/变更/发布/文档)
- [x] **LONG_TERM_EVOLUTION.md** — Phase 12-20 演进路线图
- [x] **DEPLOYMENT_SNAPSHOT.md** — 当前部署全景 (Vercel/Supabase/Capacitor/Workers/Storage/API Routes)
- [x] **docs/ai/runtime/** — AI运行时数据目录 (snapshots/diagnostics/architecture/governance/recovery/onboarding)

### 类型系统

- [x] **types/phase11.ts** — 50+ Phase 11 类型定义
- [x] Diagnostics/Audit/Snapshot/Governance/Maintenance 全部类型化
- [x] **types/index.ts** — 新增 phase11 导出

### 模块导出

- [x] **system/index.ts** — 新增 Phase 11 4个子模块导出
- [x] **auto-diagnostics/index.ts** — AutoDiagnosticsRunner 导出
- [x] **snapshot/index.ts** — ArchitectureSnapshotManager 导出
- [x] **governance/index.ts** — RuntimeGovernanceManager 导出
- [x] **maintenance/index.ts** — MaintenanceMode 导出

### 文档更新

- [x] **AI_CONTEXT_RECOVERY.md** — Phase 11 全部更新 (已完成列表/目录树/文档清单/禁止规则/接手规则/文件统计)
- [x] **PROGRESS.md** — Phase 11 完成记录
- [x] **CURRENT_TASK.md** — 更新为 Phase 11

### 构建验证

- [x] TypeScript strict mode 零 error
- [x] ESLint 零新增 error
- [x] `next build` production build 成功

### 新增文件统计: 4 源文件 + 8 文档 + 1 运行时目录

---

> **最后更新：** 2026-05-24 | Phase 11 AI原生最终工程体系完成 | 185+ 源文件
