# Architecture State

> **AI 协同开发中心：[docs/AI_CONTEXT_RECOVERY.md](AI_CONTEXT_RECOVERY.md)**
> 新 AI 接手时请先阅读该文件。

---

## 当前阶段：Phase 10 — 最终私用产品完善 + 自托管能力 + 长期可持续维护架构 ✅

---

## 架构概览

```
Next.js 15 App Router
├── Server Components
│   ├── layout.tsx          → metadata + viewport + RootLayout HTML
│   └── page.tsx            → HomePage + BottomPlayer (static import)
│
├── Client Components (由 AudioProvider 包裹)
│   ├── AudioProvider       → 挂载 4 个全局 hooks
│   ├── HomePage / SearchBar / SongRow / RecommendSection / HotSongsSection / RecentPlaysSection
│   ├── PlayerBar / PlayerFullscreen / LyricsView / ProgressBar / AlbumCover / PlayerControls / VolumeSlider
│   └── UI Base: GlassCard / LazyImage / Skeleton / IconButton
│
├── AudioManager (单例, lib/audio/AudioManager.ts)
│   ├── Core API: load / play / pause / resume / seek / setVolume / setPlaybackRate / destroy
│   ├── RAF Engine: requestAnimationFrame loop, 200ms throttle (~5fps)
│   ├── Auto start/stop: play→RAF on, pause→RAF off
│   ├── Visibility: Page Visibility API → stop RAF when hidden
│   ├── Events → AudioEventCallbacks:
│   │   ├── onTimeUpdate      → musicPlayerStore.syncTime()
│   │   ├── onEnded           → musicPlayerStore.next()
│   │   ├── onLoadStateChange → musicPlayerStore.setLoadingState()
│   │   ├── onBufferedChange  → musicPlayerStore.setBuffered()
│   │   └── onError           → console.error + setLoadingState("error")
│   └── Lifecycle: lazy init (getInstance), destroy on unmount
│
├── Zustand Stores
│   ├── musicPlayerStore (Phase 2 ★ 当前核心)
│   │   ├── State: currentSong / isPlaying / currentTime / duration
│   │   ├── State: volume / isMuted / playbackRate
│   │   ├── State: playMode / queue / queueIndex
│   │   ├── State: buffered / loadingState
│   │   ├── State: lyrics / currentLyricIndex
│   │   └── 23 Actions (见上文)
│   ├── playerStore (Phase 1 — legacy, 保留不删)
│   │   └── playlist / currentIndex / mode (旧 API, 不再使用)
│   └── uiStore (Phase 1 — 仍活跃)
│       └── isPlayerExpanded / isSearchOpen / searchQuery + 5 actions
│
├── Hooks (按依赖关系排列)
│   ├── useAudioPlayer (NEW ★) — musicPlayerStore ←→ AudioManager
│   │   └── 4 effects (song/play/volume/rate) + 1 subscribe (seek detect)
│   ├── usePlayerControls (NEW ★) — 15 useCallback actions for UI
│   ├── useLyricsSync (NEW ★) — currentTime → lyric index
│   │   └── useLyricsLoader: loadLyrics(lrcText) / clearLyrics()
│   ├── useAudio (Phase 1 — legacy bridge, AudioProvider 中挂载)
│   │   └── playerStore ←→ AudioEngine + audiointerruption event
│   └── useMediaSession (Phase 1 — iOS 控制中心, 锁屏)
│       └── navigator.mediaSession: metadata + action handlers
│
├── LyricParser (lib/lyrics/LyricParser.ts)
│   ├── parse(lrc: string) → LyricLine[]
│   │   └── 支持: 标准LRC / 多标签行 / 按时间排序
│   ├── parseEnhanced (Phase 3 预留, 当前 fallback 到 parse)
│   └── findCurrentIndex(lines, timeMs) → index (二分查找 O(log n))
│
└── Supabase (Phase 1 — schema ready, 数据连接未启用)
    ├── PostgreSQL (8 tables: profiles / songs / playlists / playlist_songs / liked_songs / play_history / recently_played / favorite_playlists)
    ├── RLS enabled (row-level security policies per table)
    ├── 6 indexes (songs.play_count / playlists.user_id / play_history / liked_songs / recently_played / favorite_playlists)
    └── songService (client-side CRUD: getHotSongs / getSongById / recordPlay / toggleLike)

├── Phase 4 Stores (NEW ★)
│   ├── userStore (src/stores/userStore.ts) — 认证状态
│   │   └── user / isAuthenticated / isAnonymous / isLoading + setUser/clearAuth/setLoading
│   ├── libraryStore (src/stores/libraryStore.ts) — 乐观更新状态
│   │   └── likedSongIds(Set) / recentPlayIds / favoritePlaylistIds + optimistic toggle actions
│   └── playlistStore (src/stores/playlistStore.ts) — UI modal 状态
│       └── editingPlaylistId / isCreateModalOpen / isAddSongModalOpen / pendingSongId

├── Phase 4 Hooks (NEW ★)
│   ├── useAuth — 匿名登录 + 会话初始化 + 状态监听
│   ├── useLikedSongs — React Query liked songs + optimistic toggle
│   ├── usePlaylist — 歌单 CRUD (create/delete/addSong/removeSong)
│   ├── useRecentPlayed — 自动记录 + 查询最近播放
│   └── useLibrary — 收藏歌单聚合查询

├── Phase 4 Services (NEW ★)
│   ├── authService — signInAnonymously/getSession/getCurrentUser/signOut/onAuthStateChange
│   ├── likedSongsService — getLikedSongs/getLikedSongIds/toggleLike/isLiked
│   ├── playlistService — CRUD playlists + addSong/removeSong + toggleFavorite
│   └── recentPlayedService — recordPlay (upsert) + getRecentPlays

├── Phase 4 Components (NEW ★)
│   ├── AuthProvider (React Query + Auth 初始化)
│   ├── LibraryPage (tabs: 喜欢/歌单/最近 + 新建歌单 modal)
│   ├── LikedSongsList / PlaylistList / RecentPlaysList / PlaylistCard
│   └── MobileNav (底部 tab bar: 发现/我的)

├── Phase 5 System (NEW ★ — Comments + Social + Detail Pages)
│   ├── DB: song_comments / comment_likes / comment_replies + RPC functions + RLS
│   ├── services/social/ → commentService / likeService / replyService
│   ├── stores/socialStore.ts → commentSortType / currentCommentSongId / activeReplyId
│   ├── hooks/
│   │   ├── useComments → infinite query (cursor pagination + sort)
│   │   ├── useCommentLike → liked comment IDs + toggle mutation
│   │   ├── useReplies → per-comment reply query + mutations
│   │   └── useSongDetail → single song detail query
│   ├── components/comments/ → CommentCard / CommentList / CommentInput / ReplyCard
│   └── pages:
│       ├── /song/[id] → SongDetailPage (cover + info + comments)
│       └── /playlist/[id] → PlaylistDetailPage (enhanced: bg blur + cover + actions)

├── Music Source Layer (Phase 3 ★ NEW — Provider Adapter Architecture)
│   ├── types/provider.ts → MusicProvider interface (8 methods: search/getSongDetail/getPlayUrl/getLyrics/getPlaylist/getArtist/...)
│   ├── providers/
│   │   └── mock/MockProvider.ts → 52 mock songs + 12 playlists + 10 artists + 5 LRC lyrics + 20 hot keywords
│   ├── cache/SearchCache.ts → 内存缓存 (Map + 时间戳 + 请求去重)
│   ├── services/SearchService.ts → 统一数据入口 (缓存 + 去重 + provider fallback)
│   ├── hooks/
│   │   ├── useMusicProvider.ts → Provider 单例 + SearchService 初始化
│   │   ├── useSearch.ts → 300ms debounce + suggestions + results + cancel
│   │   ├── useSearchHistory.ts → localStorage 搜索历史 (≤20条)
│   │   └── useHotKeywords.ts → 热门搜索词加载
│   └── core/index.ts → getProvider() / getService() 单例访问

├── Search System (Phase 3 ★ NEW)
│   ├── stores/searchStore.ts → Zustand (query/suggestions/hotKeywords/history/results/activeView + 11 actions)
│   └── components/search/
│       ├── SearchPage.tsx → 全屏 overlay (毛玻璃 bar + auto-focus + slide-up)
│       ├── HotKeywords.tsx → 热门搜索词流式布局
│       ├── SearchHistory.tsx → 搜索历史 (单条删除 + 清除全部)
│       └── SearchResultsView.tsx → 结果 (SongRow 复用 + 歌单 grid + 艺术家横向滚动)
```

├── Phase 6 System (NEW ★ — PWA + Offline + Background Playback)
│   ├── systemStore → network/install/cache/background state
│   ├── storage/ (IndexedDB): CacheDB + metadataStore + offlineStore + historyStore + lyricCacheStore
│   ├── services/cache/ → audioCacheService + imageCacheService + lyricCacheService
│   ├── hooks/ → usePWAInstall + useNetworkState + useOfflineCache + useAudioCache
│   ├── components/pwa/ → InstallDetector + InstallPrompt
│   ├── Service Worker (sw.ts) → CacheFirst/StaleWhileRevalidate/NetworkFirst
│   └── MediaSession (rewritten) → musicPlayerStore + positionState + multi-size artwork
```

---

## 组件树（当前真实结构）

```
RootLayout (src/app/layout.tsx) — Server Component
├── metadata: title="Music", PWA capable, apple-mobile-web-app
├── viewport: device-width, no-scale, viewport-fit=cover, theme #0a0a0a
└── <html lang="zh-CN" class="dark">
    └── <body class="antialiased">
        └── AudioProvider (src/components/layout/AudioProvider.tsx) — Client ★
            ├── useAudio()            → playerStore ←→ AudioEngine (legacy)
            ├── useAudioPlayer()      → musicPlayerStore ←→ AudioManager (Phase 2 core)
            ├── useMediaSession()     → navigator.mediaSession (iOS control center)
            └── useLyricsSync()       → currentTime → LyricParser.findCurrentIndex (lyric sync)
            └── <main class="mx-auto min-h-dvh max-w-md">
                │
                ├── HomePage (src/components/home/HomePage.tsx) — Client
                │   ├── SearchBar → uiStore.toggleSearch()
                │   ├── RecommendSection
                │   │   └── GlassCard × 6 (2x3 grid, 渐变色块 + 名称, mock data)
                │   ├── HotSongsSection
                │   │   └── SongRow × 8 (mock data, musicPlayerStore.play/togglePlay)
                │   └── RecentPlaysSection
                │       └── SongRow × 3 (mock data)
                │
                └── BottomPlayer (src/components/layout/BottomPlayer.tsx) — Client
                    └── [currentSong 存在时渲染]
                        │
                        ├── PlayerBar (src/components/player/PlayerBar.tsx)
                        │   └── <div class="glass-heavy mx-2 mb-2 rounded-apple-xl">
                        │       ├── 缓冲指示条 (loadingState === "loading" 时显示)
                        │       ├── ProgressBar (currentTime/duration/onSeek)
                        │       ├── AlbumCover (size="md"=56px, spin on play)
                        │       ├── 歌曲名(.text-truncate) + 艺术家(.text-secondary)
                        │       └── PlayerControls (size="sm")
                        │
                        └── [isPlayerExpanded 时] PlayerFullscreen (src/components/player/PlayerFullscreen.tsx)
                            └── <div class="fixed inset-0 z-50 animate-fade-in bg-background">
                                ├── 模糊背景层
                                │   ├── <div cover_url bg-cover blur-2xl scale-110 opacity-40>
                                │   └── <div bg-black/60> (叠加)
                                ├── 顶部栏 (safe-area-inset-top)
                                │   ├── IconButton(ChevronDown) → collapsePlayer
                                │   ├── "正在播放" + 专辑名
                                │   └── IconButton(Dots) → (预留菜单)
                                ├── 中间区域 (flex-1)
                                │   ├── [有歌词 lyrics.length > 0]
                                │   │   └── LyricsView (src/components/player/LyricsView.tsx)
                                │   │       ├── 顶部渐变遮罩 (bg-gradient-to-b from-background)
                                │   │       ├── 顶部40vh留白 <div>
                                │   │       ├── 歌词行 × N:
                                │   │       │   ├── 当前行: text-primary text-2xl font-semibold scale-105
                                │   │       │   ├── 已播行: text-tertiary
                                │   │       │   └── 未播行: text-secondary
                                │   │       ├── 底部40vh留白
                                │   │       └── 底部渐变遮罩 (bg-gradient-to-t from-background)
                                │   └── [无歌词]
                                │       └── AlbumCover (size="xl"=280px, 唱片样式+中间圆孔, spin)
                                │           └── 歌曲信息: 歌名(text-xl) + 艺术家 + 操作按钮
                                └── 底部控制区 (safe-area-inset-bottom)
                                    ├── ProgressBar + 缓冲指示器
                                    ├── PlayerControls (size="lg")
                                    └── VolumeSlider

                └── [isSearchOpen 时] SearchPage (src/components/search/SearchPage.tsx) — Client ★ Phase 3
                    └── <div class="fixed inset-0 z-40 animate-slide-up bg-background">
                        ├── 搜索栏 (glass bar + auto-focus input + clear + close buttons)
                        ├── [activeView=hot] HotKeywords (流式布局 tags) + SearchHistory (列表可删)
                        ├── [activeView=suggestions] 搜索建议列表 (带搜索图标)
                        ├── [activeView=results] SearchResultsView
                        │   ├── 歌曲: SongRow × N (复用现有)
                        │   ├── 歌单: GlassCard 2xN grid
                        │   └── 艺术家: 横向滚动头像列表
                        └── [isSearching] Loading spinner

                ├── [路由: /song/[id]] SongDetailPage (Client) ★ Phase 5
                │   ├── 背景层 (封面 blur-2xl + gradient)
                │   ├── Header (返回 + 分享 + 更多)
                │   ├── 信息区
                │   │   ├── AlbumCover (280px, spin on play)
                │   │   ├── 歌名 + 艺术家 + 元数据
                │   │   ├── 播放按钮 + 喜欢按钮
                │   │   └── 时长/风格/年份
                │   └── 评论区
                │       ├── 排序 tabs (热门/最新)
                │       ├── CommentList (infinite scroll)
                │       │   └── CommentCard (头像 + 名字 + 内容 + 赞/回复)
                │       │       └── ReplyList → ReplyCard (内嵌)
                │       └── CommentInput (fixed bottom)

                └── [路由: /playlist/[id]] PlaylistDetailPage (Client) ★ Phase 5 Enhanced
                    ├── 背景层 (封面 blur + gradient)
                    ├── Header (返回 + 分享 + 更多)
                    ├── 信息区
                    │   ├── LazyImage (200px cover)
                    │   ├── 歌单名 + 描述 + 歌曲数
                    │   └── 播放全部 + 收藏 + 删除
                    └── SongRow × N (复用)
```

---

## 数据流（完整播放生命周期）

```
┌─────────────────────────────────────────────────────────────┐
│                         用户操作                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  musicPlayerStore       │
              │  .play(song)            │
              │  → currentSong = song   │
              │  → isPlaying = true     │
              │  → queue = [...]        │
              │  → lyrics = []          │
              │  → currentLyricIndex=-1 │
              └───────────┬────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    [React Effect]  [UI re-render]  [useLyricsSync]
           │              │              │
           ▼              ▼              │
    useAudioPlayer   PlayerBar      (waiting for
    Effect 1         PlayerFullscreen lyrics)
    [song.audio_url]
           │
           ▼
    AudioManager.load(url, callbacks)
    → new Audio(url)
    → bind events
    → AudioManager.play()
           │
           ▼
    ┌─────────────────────────────────────┐
    │         HTML5 Audio Element          │
    │  ┌───────────────────────────────┐  │
    │  │ RAF tick (200ms throttle)      │  │
    │  │  → callbacks.onTimeUpdate(t,d) │  │
    │  │    → store.syncTime(t,d)       │  │
    │  │      → UI更新 (ProgressBar)    │──┼──→ ProgressBar re-render
    │  │                                │  │
    │  │  → callbacks.onEnded()         │  │
    │  │    → store.next()              │  │
    │  │      → 新 currentSong           │──┼──→ goto Effect 1
    │  │                                │  │
    │  │  → callbacks.onBufferedChange  │  │
    │  │    → store.setBuffered(pct)    │  │
    │  │                                │  │
    │  │  → callbacks.onLoadStateChange │  │
    │  │    → store.setLoadingState(s)  │  │
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    store.syncTime   store.next()   LyricsView
    (currentTime)    (on ended)     update
           │
           ▼
    useLyricsSync Effect
    [currentTime, lyrics]
    → LyricParser.findCurrentIndex(lyrics, currentTime*1000)
    → store.setCurrentLyricIndex(idx)
    → LyricsView re-render + scrollIntoView
```

### 搜索数据流 (Phase 3 ★)

```
用户点击 SearchBar / 输入搜索词
  │
  ▼
uiStore.toggleSearch() → isSearchOpen = true → <SearchPage /> mounted
  │
  ▼
Search Input (auto-focus)
  ├── [空输入] → activeView = "hot"
  │   ├── useHotKeywords() → SearchService.getHotKeywords() → hot keywords UI
  │   └── useSearchHistory() → localStorage → 搜索历史 UI
  │
  └── [有输入] → useSearch.setQuery(q)
      └── debounce 300ms
          ├── SearchService.search(keyword)
          │   ├── 1. 检查 pendingRequests (去重)
          │   ├── 2. 检查 cache (fresh hit → 直接返回)
          │   ├── 3. provider.search(keyword) → 模糊匹配 title/artist/album
          │   ├── 4. cache.set(key, result)
          │   └── 5. searchStore.setResults(result) → activeView = "results"
          │
          └── SearchService.getSearchSuggestions(keyword)
              └── searchStore.setSuggestions(items) → activeView = "suggestions"

搜索结果:
  ├── songs[] → SongRow × N (复用, musicPlayerStore.play on click)
  ├── playlists[] → GlassCard grid
  └── artists[] → 横向滚动头像
```

---

## Phase 3 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `src/music-source/types/provider.ts` | MusicProvider 接口 + ProviderType + MusicQuality + SearchOptions + SongDetail | 类型定义 |
| `src/music-source/types/index.ts` | 统一导出 provider types | 导出 |
| `src/music-source/providers/mock/data.ts` | 52 mock songs + 12 playlists + 10 artists + 5 LRC + 20 hot keywords | Mock 数据 |
| `src/music-source/providers/mock/MockProvider.ts` | MockProvider 实现 (实现 MusicProvider 全部 8 方法) | Class |
| `src/music-source/providers/mock/index.ts` | Mock 模块导出 | 导出 |
| `src/music-source/providers/index.ts` | 所有 Provider 统一导出 | 导出 |
| `src/music-source/cache/SearchCache.ts` | 内存缓存 (Map + 时间戳 + staleTime/gcTime + 请求去重) | Class |
| `src/music-source/cache/index.ts` | Cache 导出 | 导出 |
| `src/music-source/services/SearchService.ts` | 统一数据服务 (缓存 + 去重 + provider fallback) | Class |
| `src/music-source/services/index.ts` | 服务导出 | 导出 |
| `src/music-source/hooks/useMusicProvider.ts` | Provider/Service 单例管理 | Hook |
| `src/music-source/hooks/useSearch.ts` | 300ms debounce 搜索 + suggestions | Hook |
| `src/music-source/hooks/useSearchHistory.ts` | localStorage 搜索历史 CRUD | Hook |
| `src/music-source/hooks/useHotKeywords.ts` | 热门搜索词加载 | Hook |
| `src/music-source/hooks/index.ts` | Hooks 统一导出 | 导出 |
| `src/music-source/core/index.ts` | getProvider() / getService() 单例访问 | 入口 |
| `src/music-source/index.ts` | music-source 模块总入口 | 入口 |
| `src/stores/searchStore.ts` | 搜索状态 (Zustand, 11 actions) | Zustand Store |
| `src/components/search/SearchPage.tsx` | 全屏搜索页 overlay | Component |
| `src/components/search/HotKeywords.tsx` | 热门搜索词流式布局 | Component |
| `src/components/search/SearchHistory.tsx` | 搜索历史列表 (删除/清除) | Component |
| `src/components/search/SearchResultsView.tsx` | 搜索结果 (SongRow + 歌单 + 艺术家) | Component |
| `src/components/search/index.ts` | 搜索组件导出 | 导出 |

## Phase 3 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/music.ts` | 新增 Artist, Album, SearchResult |
| `src/types/index.ts` | 导出新增类型 (Artist, Album, SearchResult) |
| `src/app/page.tsx` | 集成 SearchPage 条件渲染 |

---

## Phase 2 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `src/types/music.ts` | LoadingState, LyricLine, AudioState, QueueState, PlayerSnapshot, AudioEventCallbacks + re-export PlayMode | 类型定义 |
| `src/lib/audio/AudioManager.ts` | 全局单例音频管理器 (RAF throttle, visibility, buffer, load states) | Class |
| `src/lib/lyrics/LyricParser.ts` | LRC 歌词解析 (parse + findCurrentIndex 二分查找) | 静态 Class |
| `src/stores/musicPlayerStore.ts` | Phase 2 播放器状态 (23 actions, queue/lyrics/audio state) | Zustand Store |
| `src/hooks/useAudioPlayer.ts` | musicPlayerStore ←→ AudioManager 核心桥接 | Hook |
| `src/hooks/usePlayerControls.ts` | UI 组件控制层 (15 useCallback actions) | Hook |
| `src/hooks/useLyricsSync.ts` | 歌词时间同步 (useLyricsSync + useLyricsLoader) | Hook |
| `src/components/player/PlayerFullscreen.tsx` | 全屏播放器 (背景模糊 + 封面 + 歌词 + 音量) | Component |
| `src/components/player/LyricsView.tsx` | 歌词滚动视图 (高亮 + 自动滚动 + 点击seek + 渐变遮罩) | Component |
| `src/components/player/VolumeSlider.tsx` | 音量滑块 (拖动 + 静音 + 图标状态) | Component |

## Phase 2 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 music.ts 所有导出 |
| `src/components/layout/AudioProvider.tsx` | 新增 useAudioPlayer + useLyricsSync 挂载 |
| `src/components/layout/BottomPlayer.tsx` | 切换至 musicPlayerStore, 新增 PlayerFullscreen 条件渲染 |
| `src/components/player/PlayerBar.tsx` | 从 playerStore 切换至 musicPlayerStore |
| `src/components/home/SongRow.tsx` | 从 playerStore 切换至 musicPlayerStore + 播放动画指示器 |

## 已保留不动的文件

| 文件 | 原因 |
|------|------|
| `src/lib/audio/AudioEngine.ts` | Phase 1 引擎 — useAudio 仍依赖 |
| `src/stores/playerStore.ts` | Phase 1 store — stores/index.ts 导出 |
| `src/stores/index.ts` | Phase 1 stores 导出 |
| `src/hooks/useAudio.ts` | Phase 1 bridge — AudioProvider 中挂载 |
| `src/types/player.ts` | Phase 1 类型 — music.ts re-export PlayMode |
| `src/types/song.ts` | 基础 Song 类型 — 全项目引用 |
| `src/types/playlist.ts` | 基础 Playlist 类型 |
| `src/types/user.ts` | 基础 Profile/PlayHistory 类型 |
| `src/components/ui/GlassCard.tsx` | 基础组件 — 零业务依赖 |
| `src/components/ui/LazyImage.tsx` | 基础组件 — AlbumCover/SongRow 使用 |
| `src/components/ui/Skeleton.tsx` | 基础组件 — loading 状态 |
| `src/components/ui/IconButton.tsx` | 基础组件 — PlayerControls/PlayerFullscreen 使用 |
| `src/components/player/ProgressBar.tsx` | 进度条 — 纯 props, UI 稳定 |
| `src/components/player/AlbumCover.tsx` | 封面 — 纯 props, UI 稳定 |
| `src/components/player/PlayerControls.tsx` | 播放控制 — 纯 props, UI 稳定 |
| `src/components/home/RecommendSection.tsx` | 推荐歌单 — mock 数据, UI 稳定 |
| `src/components/home/HotSongsSection.tsx` | 热门歌曲 — mock 数据, UI 稳定 |
| `src/components/home/RecentPlaysSection.tsx` | 最近播放 — mock 数据, UI 稳定 |
| `src/app/globals.css` | 全局样式体系 — 全站依赖 |
| `src/services/songService.ts` | 数据服务 — API 稳定 |
| `src/lib/constants.ts` | 常量 — 全局引用 |
| `src/lib/utils.ts` | 工具函数 — cn/formatTime/formatCount |

---

## Phase 4 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `supabase/migrations/002_phase4_schema.sql` | recently_played + favorite_playlists + trigger | Migration |
| `src/types/library.ts` | UserState/UserInfo/LikedSongRecord/RecentlyPlayedRecord/UserPlaylist/PlaylistWithSongsDetail/FavoritePlaylistRecord/PlaylistSongRecord/LibraryData | 类型定义 |
| `src/services/authService.ts` | signInAnonymously/getSession/getCurrentUser/signOut/onAuthStateChange | Service |
| `src/services/likedSongsService.ts` | getLikedSongs/getLikedSongIds/toggleLike/isLiked | Service |
| `src/services/playlistService.ts` | CRUD playlists + addSong/removeSong + toggleFavorite/getFavoritePlaylists | Service |
| `src/services/recentPlayedService.ts` | recordPlay(upsert) + getRecentPlays/getRecentPlayIds | Service |
| `src/stores/userStore.ts` | 认证状态 (user/isAuthenticated/isAnonymous/isLoading + 3 actions) | Zustand Store |
| `src/stores/libraryStore.ts` | 乐观更新状态 (likedSongIds/recentPlayIds/favoritePlaylistIds + 6 actions) | Zustand Store |
| `src/stores/playlistStore.ts` | UI 弹窗状态 (isCreateModalOpen/isAddSongModalOpen + 5 actions) | Zustand Store |
| `src/hooks/useAuth.ts` | 匿名登录 + 会话初始化 + onAuthStateChange 监听 | Hook |
| `src/hooks/useLikedSongs.ts` | React Query liked songs + optimistic toggle | Hook |
| `src/hooks/usePlaylist.ts` | 歌单 CRUD (React Query mutations) | Hook |
| `src/hooks/useRecentPlayed.ts` | 自动记录播放 + 查询 (React Query) | Hook |
| `src/hooks/useLibrary.ts` | 收藏歌单聚合查询 (React Query) | Hook |
| `src/components/auth/AuthProvider.tsx` | QueryClientProvider + AuthInitializer | Component |
| `src/components/library/LibraryPage.tsx` | 我的音乐 (tabs: 喜欢/歌单/最近 + 新建歌单 modal) | Component |
| `src/components/library/LikedSongsList.tsx` | 喜欢歌曲列表 (复用 SongRow) | Component |
| `src/components/library/PlaylistList.tsx` | 用户歌单 2-col grid | Component |
| `src/components/library/RecentPlaysList.tsx` | 最近播放列表 (复用 SongRow) | Component |
| `src/components/library/PlaylistCard.tsx` | 歌单卡片 (LazyImage + title + count) | Component |
| `src/components/library/index.ts` | library 组件导出 | 导出 |
| `src/components/layout/MobileNav.tsx` | 底部 tab bar (发现/我的) | Component |
| `src/app/library/page.tsx` | /library 页面路由 | Page |
| `src/app/playlist/[id]/page.tsx` | /playlist/[id] 歌单详情页 | Page |

## Phase 4 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 library.ts 所有新类型导出 |
| `src/app/layout.tsx` | AuthProvider 包裹 AudioProvider |
| `src/app/page.tsx` | 添加 MobileNav |
| `src/components/layout/BottomPlayer.tsx` | PlayerBar 上移 bottom-14 适配 MobileNav |
| `src/components/home/HomePage.tsx` | 底部 padding 从 pb-36 → pb-44 适配 MobileNav |
| `package.json` | 新增 @tanstack/react-query 依赖 |

---

## Phase 5 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `supabase/migrations/003_phase5_schema.sql` | song_comments + comment_likes + comment_replies + RPC + RLS | Migration |
| `src/types/social.ts` | CommentRecord/CommentWithProfile/CommentLikeRecord/CommentReplyRecord/CommentReplyWithProfile/PageParam/CommentPage/ReplyPage/CommentSortType/SocialState | 类型定义 |
| `src/services/social/commentService.ts` | getComments(cursor pagination+sort)/createComment/deleteComment | Service |
| `src/services/social/likeService.ts` | getLikedCommentIds/toggleLike(atomic RPC) | Service |
| `src/services/social/replyService.ts` | getReplies(cursor pagination)/createReply/deleteReply | Service |
| `src/stores/socialStore.ts` | commentSortType/currentCommentSongId/activeReplyId + 3 actions | Zustand Store |
| `src/hooks/useComments.ts` | infinite query (cursor + sort switching) + add/delete mutations | Hook |
| `src/hooks/useCommentLike.ts` | liked comment IDs query + toggle mutation | Hook |
| `src/hooks/useReplies.ts` | per-comment reply query + add/delete mutations | Hook |
| `src/hooks/useSongDetail.ts` | single song detail query | Hook |
| `src/components/comments/CommentCard.tsx` | 头像+用户名+时间+内容+点赞/回复/删除 | Component |
| `src/components/comments/CommentList.tsx` | 排序+infinite scroll+空状态+skeleton+input | Component |
| `src/components/comments/CommentInput.tsx` | 圆角input+send+Enter submit+16px font | Component |
| `src/components/comments/ReplyCard.tsx` | 内嵌回复(小头像+用户名+时间+内容) | Component |
| `src/components/comments/index.ts` | comments 统一导出 | 导出 |
| `src/app/song/[id]/page.tsx` | /song/[id] 歌曲详情页 (cover+info+comments) | Page |

## Phase 5 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 social.ts 所有新类型导出 |
| `src/app/playlist/[id]/page.tsx` | 增强: bg blur + 大封面 + 收藏/删除按钮 + 描述展示 |

---

## Phase 6 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `src/types/system.ts` | NetworkState/CacheStats/InstallState/SystemState/SystemActions/SystemStore | 类型定义 |
| `src/stores/systemStore.ts` | 系统状态 (network/install/cache/background) + 9 actions | Zustand Store |
| `src/storage/CacheDB.ts` | IndexedDB 通用封装 (openDB + CRUD + getByIndex + count + clear) | Library |
| `src/storage/metadataStore.ts` | 歌曲元数据 IndexedDB 缓存 | Storage |
| `src/storage/offlineStore.ts` | 离线歌单 IndexedDB 存储 | Storage |
| `src/storage/historyStore.ts` | 本地播放历史 IndexedDB 存储 | Storage |
| `src/storage/lyricCacheStore.ts` | 歌词 IndexedDB 缓存 | Storage |
| `src/storage/index.ts` | storage 模块统一导出 | 导出 |
| `src/services/cache/audioCacheService.ts` | 音频缓存 + 预加载队列 (MAX_CONCURRENT=1) | Service |
| `src/services/cache/imageCacheService.ts` | 图片预加载 (并行, Set 去重) | Service |
| `src/services/cache/lyricCacheService.ts` | 歌词 getOrFetchLyric (IndexedDB + fallback) | Service |
| `src/services/cache/index.ts` | cache 服务统一导出 | 导出 |
| `src/hooks/usePWAInstall.ts` | beforeinstallprompt + iOS 检测 + standalone 检测 | Hook |
| `src/hooks/useNetworkState.ts` | 网络状态检测 (online/offline/slow + Connection API) | Hook |
| `src/hooks/useOfflineCache.ts` | IndexedDB 缓存统计 + refresh | Hook |
| `src/hooks/useAudioCache.ts` | 当前歌曲自动缓存 + 队列预加载 2 首 | Hook |
| `src/components/pwa/InstallDetector.tsx` | 静默组件 (挂载 usePWAInstall/useNetworkState/useOfflineCache) | Component |
| `src/components/pwa/InstallPrompt.tsx` | iOS 安装教程弹窗 (30s 触发, 步骤说明, 永久关闭) | Component |
| `src/components/pwa/index.ts` | PWA 组件导出 | 导出 |
| `src/components/layout/PageTransition.tsx` | 页面过渡动画 (fade-in + slide-up, routeKey 驱动) | Component |

## Phase 6 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 system.ts 所有新类型导出 |
| `src/hooks/useMediaSession.ts` | 完全重写: playerStore → musicPlayerStore + positionState + 多尺寸 artwork |
| `src/app/sw.ts` | 分层运行时缓存策略: CacheFirst/StaleWhileRevalidate/NetworkFirst |
| `public/manifest.json` | 增强: display_override/categories/shortcuts/lang/dir |
| `src/app/layout.tsx` | iOS splash screens (5 尺寸) + InstallDetector + InstallPrompt 集成 |
| `src/app/globals.css` | .offline-badge/.pb-safe/.pt-safe/.px-safe/.page-enter/.page-exit |
| `tailwind.config.ts` | slide-down + pulse-glow 动画 |
| `src/components/layout/AudioProvider.tsx` | 挂载 useAudioCache (Phase 6) |

---

## Phase 5 新增文件

（见上方 Phase 5 表格，此处不再重复）

---

## Phase 7 — 真实音源接入 + Provider Manager + API 代理层 ★

### 架构概览

```
Provider Manager System (Phase 7 ★ NEW)
├── ProviderManager (单例) → 注册/切换/健康检测/Fallback/恢复探测
│   ├── HealthTracker → 滑动窗口 (成功率/延迟/连续失败)
│   ├── RequestManager → 重试 (3次+指数退避) + 超时 (10s) + 去重 + Abort
│   └── Fallback Chain: netease → qq → kuwo → mock
│
├── Real Providers
│   ├── NeteaseProvider / QQProvider / KuwoProvider → BaseProxyProvider
│   └── BilibiliProvider → 预留骨架
│
├── API Proxy Layer (Next.js API Routes)
│   ├── /api/music/search → GET
│   ├── /api/music/search/suggestions → GET
│   ├── /api/music/hotkeywords → GET
│   ├── /api/music/song/[id] → GET
│   ├── /api/music/song/[id]/play → GET
│   ├── /api/music/song/[id]/lyrics → GET
│   ├── /api/music/playlist/[id] → GET
│   ├── /api/music/playlist/[id]/songs → GET
│   ├── /api/music/artist/[id] → GET
│   ├── /api/music/artist/[id]/songs → GET
│   └── /api/provider/health → GET
│
├── Cache Upgrade
│   ├── APICache → SWR (stale-while-revalidate) + 分组 TTL
│   └── PlaybackStabilizer → URL 缓存 (10min TTL) + 失败换源
│
├── Stores
│   └── providerStore → currentProvider/health/fallback/requestStatus + 7 actions
│
├── Hooks
│   ├── useProvider → Provider 生命周期 + 回调
│   ├── useProviderHealth → 健康监控 + 定时轮询 (10s)
│   ├── useFallbackPlayer → Fallback 播放 + URL 缓存 + 预加载
│   └── useMusicSource → 高层数据源 (SWR + fallback + cache)
│
├── UI Components
│   ├── ProviderInit → 注册所有 Provider (启动时)
│   ├── ProviderStatusBar → 音源状态指示条
│   ├── FallbackNotice → 降级通知弹窗 (4s)
│   └── ProviderDebugPanel → 开发调试面板
│
├── Playback Stability
│   └── PlaybackStabilizer → URL 预取 + 失败换源 + 状态保存
│
└── Cloudflare Workers (预留)
    ├── workers/proxy/music-proxy.ts → 音乐 API 代理
    ├── workers/cache/edge-cache.ts → Edge 缓存策略
    └── workers/health/provider-check.ts → 定时健康检测
```

### Phase 7 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `src/types/provider.ts` | ProviderHealthSnapshot/ProviderState/ProviderStore/RetryConfig/ProxyConfig | 类型定义 |
| `src/music-source/providers/BaseProxyProvider.ts` | 代理基础类 (所有真实 Provider 的基类) | Class |
| `src/music-source/providers/netease/NeteaseProvider.ts` | 网易云音乐 Provider | Class |
| `src/music-source/providers/netease/index.ts` | 导出 | 导出 |
| `src/music-source/providers/qq/QQProvider.ts` | QQ音乐 Provider | Class |
| `src/music-source/providers/qq/index.ts` | 导出 | 导出 |
| `src/music-source/providers/kuwo/KuwoProvider.ts` | 酷我音乐 Provider | Class |
| `src/music-source/providers/kuwo/index.ts` | 导出 | 导出 |
| `src/music-source/providers/bilibili/BilibiliProvider.ts` | B站预留骨架 | Class |
| `src/music-source/providers/bilibili/index.ts` | 导出 | 导出 |
| `src/music-source/providers/provider-manager/ProviderManager.ts` | Provider 管理器 (注册/切换/fallback/恢复) | Class |
| `src/music-source/providers/provider-manager/HealthTracker.ts` | 健康检测 (滑动窗口) | Class |
| `src/music-source/providers/provider-manager/RequestManager.ts` | 请求管理 (重试/超时/去重/取消) | Class |
| `src/music-source/providers/provider-manager/index.ts` | 导出 | 导出 |
| `src/music-source/cache/APICache.ts` | SWR 缓存 (stale-while-revalidate) | Class |
| `src/music-source/services/PlaybackStabilizer.ts` | 播放稳定性 (URL缓存+换源+状态恢复) | Class |
| `src/music-source/hooks/useProvider.ts` | Provider 生命周期管理 | Hook |
| `src/music-source/hooks/useProviderHealth.ts` | Provider 健康监控 | Hook |
| `src/music-source/hooks/useFallbackPlayer.ts` | Fallback-aware 播放 | Hook |
| `src/music-source/hooks/useMusicSource.ts` | 高层音乐数据源 | Hook |
| `src/stores/providerStore.ts` | Provider UI 状态 (Zustand) | Store |
| `src/server/api/proxy-helper.ts` | API 代理辅助工具 | Library |
| `src/components/provider/ProviderInit.tsx` | 注册所有 Provider | Component |
| `src/components/provider/ProviderStatusBar.tsx` | 音源状态指示条 | Component |
| `src/components/provider/FallbackNotice.tsx` | 降级通知弹窗 | Component |
| `src/components/provider/index.ts` | provider 组件导出 | 导出 |
| `src/components/debug/ProviderDebugPanel.tsx` | 开发调试面板 | Component |
| `src/components/debug/index.ts` | debug 组件导出 | 导出 |
| `workers/config.ts` | CF Worker 配置 | Config |
| `workers/proxy/music-proxy.ts` | CF 音乐 API 代理骨架 | Worker |
| `workers/cache/edge-cache.ts` | CF Edge 缓存策略 | Module |
| `workers/health/provider-check.ts` | CF 健康检测 + Cron | Module |
| `src/app/api/music/search/route.ts` | API: 搜索 | Route |
| `src/app/api/music/search/suggestions/route.ts` | API: 搜索建议 | Route |
| `src/app/api/music/hotkeywords/route.ts` | API: 热门关键词 | Route |
| `src/app/api/music/song/[id]/route.ts` | API: 歌曲详情 | Route |
| `src/app/api/music/song/[id]/play/route.ts` | API: 播放 URL | Route |
| `src/app/api/music/song/[id]/lyrics/route.ts` | API: 歌词 | Route |
| `src/app/api/music/playlist/[id]/route.ts` | API: 歌单详情 | Route |
| `src/app/api/music/playlist/[id]/songs/route.ts` | API: 歌单歌曲 | Route |
| `src/app/api/music/artist/[id]/route.ts` | API: 艺术家详情 | Route |
| `src/app/api/music/artist/[id]/songs/route.ts` | API: 艺术家歌曲 | Route |
| `src/app/api/provider/health/route.ts` | API: Provider 健康 | Route |

### Phase 7 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 provider.ts 所有新类型导出 |
| `src/music-source/types/provider.ts` | ProviderType 新增 "bilibili" |
| `src/music-source/providers/index.ts` | 新增所有真实 Provider 和 ProviderManager 导出 |
| `src/music-source/cache/index.ts` | 新增 APICache 导出 |
| `src/music-source/hooks/index.ts` | 新增 4 个 Phase 7 hooks 导出 |
| `src/music-source/index.ts` | 新增所有 Phase 7 模块导出 |
| `src/music-source/services/index.ts` | 新增 PlaybackStabilizer 导出 |
| `src/app/layout.tsx` | 集成 ProviderInit + FallbackNotice + ProviderDebugPanel |
| `tsconfig.json` | exclude workers/ 目录 (CF Workers 有独立类型) |

---

## Phase 8 — iOS封装预留 + 播放恢复 + 崩溃保护 + 设置页 + 长期维护体系 ★

### 架构概览

```
Phase 8 System (NEW ★)
├── mobile/ (Capacitor)
│   ├── capacitor.config.ts → Capacitor 配置
│   ├── ios-config/ → Info.plist + capacitor.config.json
│   ├── scripts/ → build-ios.sh + sync.sh
│   └── docs/ → CAPACITOR_GUIDE.md
│
├── Recovery System
│   ├── types/recovery.ts → RecoveryState/RecoveryResult
│   ├── services/recovery/PlaybackRecoverySystem.ts → save/restore/clear
│   └── hooks/usePlaybackRecovery.ts → auto-save + restore on mount
│
├── Error Protection
│   ├── components/error/ErrorBoundary.tsx → Global React Error Boundary
│   ├── components/error/AudioErrorBoundary.tsx → Audio-specific
│   ├── components/error/ProviderErrorBoundary.tsx → Provider fail recovery
│   └── components/error/OfflineFallback.tsx → Offline state UI
│
├── Settings System
│   ├── stores/settingsStore.ts → audioQuality/autoCache/debugMode/providerPriority
│   ├── components/settings/SettingsPage.tsx → Full settings UI
│   └── app/settings/page.tsx → /settings route
│
├── Logger System
│   └── lib/logs/Logger.ts → Category-based logging (audio/provider/playback/cache/debug)
│
├── Download System (预留)
│   ├── types/download.ts → DownloadTask/DownloadQueue
│   └── services/download/DownloadManager.ts → Queue management stub
│
├── Performance
│   └── hooks/usePerformanceCleanup.ts → Periodic cache GC + old data cleanup
│
├── SEO/Meta
│   └── components/seo/AppMeta.tsx → OpenGraph + Apple Meta + PWA Meta
│
└── AI Maintenance System
    └── docs/ai/ (extended)
        ├── CURRENT_TASK.md → Current development status
        ├── KNOWN_ISSUES.md → Bug tracker + tech debt
        ├── API_MAP.md → All API routes map
        ├── STORE_MAP.md → All Zustand stores map
        ├── PROVIDER_MAP.md → Provider architecture + status
        ├── CACHE_ARCHITECTURE.md → Multi-layer cache design
        └── PLAYBACK_FLOW.md → Complete playback lifecycle
```

### Phase 8 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `mobile/capacitor.config.ts` | Capacitor 配置 | Config |
| `mobile/ios-config/App-Info.plist` | iOS Info.plist 模板 | Config |
| `mobile/ios-config/capacitor.config.json` | iOS 专属 Capacitor 配置 | Config |
| `mobile/scripts/build-ios.sh` | iOS 构建脚本 | Script |
| `mobile/scripts/sync.sh` | Capacitor 同步脚本 | Script |
| `mobile/docs/CAPACITOR_GUIDE.md` | Capacitor 封装指南 | Doc |
| `src/types/recovery.ts` | RecoveryState/RecoveryResult 类型 | 类型 |
| `src/types/download.ts` | DownloadTask/DownloadQueue 类型 | 类型 |
| `src/services/recovery/PlaybackRecoverySystem.ts` | 播放恢复核心 | Service |
| `src/hooks/usePlaybackRecovery.ts` | 播放恢复 Hook | Hook |
| `src/hooks/usePerformanceCleanup.ts` | 性能清理 Hook | Hook |
| `src/components/error/ErrorBoundary.tsx` | 全局错误边界 | Component |
| `src/components/error/AudioErrorBoundary.tsx` | 音频错误边界 | Component |
| `src/components/error/ProviderErrorBoundary.tsx` | Provider 错误边界 | Component |
| `src/components/error/OfflineFallback.tsx` | 离线兜底UI | Component |
| `src/components/error/index.ts` | error 组件导出 | 导出 |
| `src/components/settings/SettingsPage.tsx` | 设置页 | Component |
| `src/components/settings/index.ts` | settings 组件导出 | 导出 |
| `src/components/seo/AppMeta.tsx` | SEO/Meta 组件 | Component |
| `src/components/seo/index.ts` | seo 组件导出 | 导出 |
| `src/stores/settingsStore.ts` | 设置状态 | Store |
| `src/lib/logs/Logger.ts` | 日志系统 | Library |
| `src/lib/logs/index.ts` | logs 导出 | 导出 |
| `src/services/download/DownloadManager.ts` | 下载管理器 (预留) | Service |
| `src/app/settings/page.tsx` | /settings 路由 | Page |
| `docs/ai/CURRENT_TASK.md` | 当前开发任务 | Doc |
| `docs/ai/KNOWN_ISSUES.md` | 已知Bug | Doc |
| `docs/ai/API_MAP.md` | API路由地图 | Doc |
| `docs/ai/STORE_MAP.md` | Store完整地图 | Doc |
| `docs/ai/PROVIDER_MAP.md` | Provider完整状态 | Doc |
| `docs/ai/CACHE_ARCHITECTURE.md` | 缓存架构 | Doc |
| `docs/ai/PLAYBACK_FLOW.md` | 播放完整流程 | Doc |
| `docs/deployment/VERCEL_DEPLOY.md` | Vercel部署指南 | Doc |
| `docs/deployment/SUPABASE_CONFIG.md` | Supabase配置指南 | Doc |
| `docs/deployment/TESTFLIGHT_GUIDE.md` | TestFlight分发指南 | Doc |
| `docs/deployment/CAPACITOR_BUILD.md` | Capacitor构建指南 | Doc |

### Phase 8 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 recovery.ts + download.ts 导出 |
| `src/app/layout.tsx` | 集成 AppMeta SEO 组件 |
| `src/components/layout/AudioProvider.tsx` | 挂载 usePlaybackRecovery + usePerformanceCleanup |
| `src/components/layout/MobileNav.tsx` | 新增"设置" tab |

---

## Phase 9 — 系统最终稳定化 + 自动化维护体系 + 私用长期运行架构 ★

### 架构概览

```
Phase 9 System (NEW ★)
├── src/system/watchdog/
│   └── PlaybackWatchdog.ts → 播放卡死/超时/URL失效检测 + 自动恢复 (resume→reload→skip)
│
├── src/system/recovery/
│   ├── ProviderSelfHealing.ts → 自动评分 + 降级 + 恢复 + 冷却
│   └── StartupRecoveryPipeline.ts → 启动时恢复音量/模式/队列/Provider
│
├── src/system/cleanup/
│   └── CacheGovernance.ts → 定期清理过期 IndexedDB (歌词/历史/元数据)
│
├── src/system/telemetry/
│   └── TelemetryService.ts → Provider/播放/缓存/启动指标收集 (环形buffer)
│
├── src/system/diagnostics/
│   ├── DevDiagnosticsPage.tsx → 5Tab诊断中心 (总览/Provider/播放/缓存/日志)
│   ├── DebugOverlay.tsx → 浮动调试面板 (三指双击唤出)
│   └── DebugOverlayWrapper.tsx → 条件渲染 (仅debug模式)
│
├── src/system/monitor/
│   ├── useSystemWatchdog.ts → 总Hook (挂载所有Phase 9系统)
│   └── ReleaseMode.ts → debug/internal/release 模式管理
│
├── src/types/phase9.ts → Watchdog/SelfHealing/CacheGov/Telemetry/ReleaseMode 类型
├── src/app/diagnostics/page.tsx → /diagnostics 路由
└── .env.example → 完整环境变量模板
```

### Phase 9 新增文件

| 文件 | 用途 | 类型 |
|------|------|------|
| `src/types/phase9.ts` | Watchdog/SelfHealing/CacheGov/Telemetry/ReleaseMode 类型 | 类型定义 |
| `src/system/watchdog/PlaybackWatchdog.ts` | 播放看门狗 (单例) | Class |
| `src/system/recovery/ProviderSelfHealing.ts` | Provider自愈系统 (单例) | Class |
| `src/system/recovery/StartupRecoveryPipeline.ts` | 启动恢复管道 (单例) | Class |
| `src/system/cleanup/CacheGovernance.ts` | 缓存治理系统 (单例) | Class |
| `src/system/telemetry/TelemetryService.ts` | 遥测服务 (单例) | Class |
| `src/system/monitor/useSystemWatchdog.ts` | 系统监控总Hook + useSystemHealth | Hook |
| `src/system/monitor/ReleaseMode.ts` | 发布模式管理 | Library |
| `src/system/diagnostics/DevDiagnosticsPage.tsx` | 诊断中心页面 | Component |
| `src/system/diagnostics/DebugOverlay.tsx` | 调试浮层 | Component |
| `src/system/diagnostics/DebugOverlayWrapper.tsx` | 调试浮层条件渲染 | Component |
| `src/system/index.ts` | system 模块统一导出 | 导出 |
| `src/app/diagnostics/page.tsx` | /diagnostics 路由 | Page |
| `.env.example` | 环境变量模板 | Config |

### Phase 9 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 phase9.ts 所有新类型导出 |
| `src/components/layout/AudioProvider.tsx` | 挂载 useSystemWatchdog (Phase 9) |
| `src/app/layout.tsx` | 集成 DebugOverlayWrapper |
| `src/lib/logs/Logger.ts` | LogCategory 新增 watchdog/startup/system |

---

## Phase 10 — 最终私用产品完善 + 自托管能力 + 长期可持续维护架构 ★

### Phase 10 新增文件

| 文件 | 说明 | 类型 |
|------|------|------|
| `src/types/phase10.ts` | Phase 10 全部类型定义 (RuntimeConfig/Backup/Migration/ProviderHotReload/Deployment/Recovery) | TypeScript |
| `src/platform/index.ts` | platform 模块统一导出 | 导出 |
| `src/platform/config/RuntimeConfigManager.ts` | 动态配置中心 (单例) | Class |
| `src/platform/update/ProviderHotReload.ts` | Provider 热更新系统 (单例) | Class |
| `src/platform/backup/BackupManager.ts` | 数据备份与恢复 (单例) | Class |
| `src/platform/migration/MigrationPipeline.ts` | 数据迁移管道 (单例) | Class |
| `src/platform/runtime/DeploymentMode.ts` | 部署模式自动检测 | Library |
| `src/platform/runtime/MemoryMonitor.ts` | 内存占用监控 (单例) | Class |
| `src/platform/runtime/SystemIntegrity.ts` | 系统完整性检查 (单例) | Class |
| `src/platform/recovery/DisasterRecovery.ts` | 灾难恢复 (单例) | Class |

### Phase 10 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 phase10.ts 所有类型 + DEFAULT_RUNTIME_CONFIG/DEPLOYMENT_PROFILES 导出 |

---

> **最后更新：** 2026-05-24 | Phase 10 最终产品形态完成 | 174 源文件
