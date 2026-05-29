# Module Map

> **AI 协同开发中心：[docs/AI_CONTEXT_RECOVERY.md](AI_CONTEXT_RECOVERY.md)**
> 新 AI 接手时请先阅读该文件。

---

## 依赖关系图

```
src/types/         ← 零依赖（纯类型定义）
  ├── song.ts           → Song (12 fields), SongWithMeta
  ├── playlist.ts       → Playlist (8 fields), PlaylistWithSongs
  ├── user.ts           → Profile (6 fields), PlayHistory (4 fields)
  ├── player.ts         → PlayMode, PlayerState, PlayerActions, PlayerStore (Phase 1)
  ├── music.ts          → LoadingState, LyricLine, AudioState, QueueState, PlayerSnapshot, AudioEventCallbacks + Artist + Album + SearchResult (Phase 2/3)
  ├── library.ts        → UserState/UserInfo + Liked/Recent/Favorite records (Phase 4)
  ├── social.ts         → CommentRecord/CommentWithProfile/CommentLikeRecord/CommentReplyRecord/CommentReplyWithProfile/CommentPage/ReplyPage/CommentSortType/SocialState (Phase 5)
  └── index.ts          → 统一导出所有类型 (唯一导入入口)

src/stores/              ← 依赖 types/
  ├── playerStore.ts    → Phase 1 PlayerStore (legacy — 保留不删, 不再使用)
  ├── uiStore.ts         → isPlayerExpanded / isSearchOpen / searchQuery + 5 actions
  ├── musicPlayerStore.ts → Phase 2 MusicPlayerStore (23 actions, 当前活跃 ★)
  ├── searchStore.ts     → Phase 3 ★ 搜索状态 (query/suggestions/hotKeywords/history/results + 11 actions)
  ├── userStore.ts       → Phase 4 ★ 认证状态 (user/isAuthenticated/isAnonymous/isLoading)
  ├── libraryStore.ts    → Phase 4 ★ 乐观更新 (likedSongIds/recentPlayIds/favoritePlaylistIds)
  ├── playlistStore.ts   → Phase 4 ★ UI 弹窗状态 (create/add song modals)
  ├── socialStore.ts     → Phase 5 ★ 评论排序/当前歌曲/活跃回复ID
  └── index.ts           → Phase 1 导出: playerStore + uiStore

src/lib/
  ├── supabase/
  │   ├── client.ts      → @supabase/ssr, createClient (浏览器端)
  │   └── server.ts      → @supabase/ssr, cookies (服务端)
  ├── audio/
  │   ├── AudioEngine.ts → Phase 1 legacy (单例 audioEngine, RAF 无 throttle)
  │   └── AudioManager.ts → Phase 2 ★ 全局单例 (RAF 200ms throttle, Page Visibility)
  ├── lyrics/
  │   └── LyricParser.ts → static: parse() + findCurrentIndex() (二分查找 O log n)
  ├── constants.ts        → API_PREFIX, DEFAULT_VOLUME (0.8), DEFAULT_COVER
  └── utils.ts            → cn() (clsx+twMerge), formatTime(), formatCount()

src/hooks/               ← 依赖 stores/ + lib/ + services/
  ├── useAudio.ts           → playerStore ←→ AudioEngine (Phase 1 legacy, AudioProvider 中挂载)
  ├── useAudioPlayer.ts     → musicPlayerStore ←→ AudioManager (Phase 2 ★ 4 effects + 1 subscribe)
  ├── usePlayerControls.ts  → musicPlayerStore (Phase 2 ★ 15 useCallback actions)
  ├── useLyricsSync.ts      → musicPlayerStore + LyricParser (Phase 2 ★ useLyricsSync + useLyricsLoader)
  ├── useMediaSession.ts    → playerStore (Phase 1, iOS control center, navigator.mediaSession)
  ├── useAuth.ts            → Phase 4 ★ userStore + authService (匿名登录 + 会话管理)
  ├── useLikedSongs.ts      → Phase 4 ★ React Query + likedSongsService + libraryStore
  ├── usePlaylist.ts        → Phase 4 ★ React Query + playlistService + playlistStore
  ├── useRecentPlayed.ts    → Phase 4 ★ React Query + recentPlayedService + libraryStore
  ├── useLibrary.ts         → Phase 4 ★ React Query + playlistService + libraryStore
  ├── useComments.ts        → Phase 5 ★ infinite query + add/delete mutations
  ├── useCommentLike.ts     → Phase 5 ★ liked comment IDs + toggle mutation
  ├── useReplies.ts         → Phase 5 ★ per-comment reply query + add/delete
  └── useSongDetail.ts      → Phase 5 ★ single song detail fetch

src/services/            ← 依赖 lib/supabase/ + types/
  ├── songService.ts       → getHotSongs / getSongById / recordPlay / toggleLike
  ├── authService.ts       → Phase 4 ★ signInAnonymously / getSession / getCurrentUser / signOut
  ├── likedSongsService.ts → Phase 4 ★ getLikedSongs / getLikedSongIds / toggleLike / isLiked
  ├── playlistService.ts   → Phase 4 ★ CRUD playlists + addSong/removeSong + toggleFavorite
  ├── recentPlayedService.ts → Phase 4 ★ recordPlay(upsert) + getRecentPlays
  └── social/
      ├── commentService.ts → Phase 5 ★ getComments(cursor+sort) / createComment / deleteComment
      ├── likeService.ts    → Phase 5 ★ getLikedCommentIds / toggleLike(atomic RPC)
      └── replyService.ts   → Phase 5 ★ getReplies(cursor) / createReply / deleteReply

src/music-source/        ← Phase 3 ★ 音源抽象层 (Provider Adapter Architecture)
  ├── types/
  │   ├── provider.ts     → MusicProvider 接口 + ProviderType + MusicQuality + SearchOptions + SongDetail
  │   └── index.ts        → 统一导出 provider types
  ├── providers/
  │   ├── mock/data.ts    → 52 mock songs + 12 playlists + 10 artists + 5 LRC + 20 hot keywords
  │   ├── mock/MockProvider.ts → 实现 MusicProvider (8 methods, async + simulated delay)
  │   ├── mock/index.ts   → mock 模块导出
  │   └── index.ts        → 所有 Provider 统一导出
  ├── cache/
  │   ├── SearchCache.ts  → 内存缓存 (Map + staleTime/gcTime + 请求去重)
  │   └── index.ts        → cache 导出
  ├── services/
  │   ├── SearchService.ts → 统一数据入口 (缓存 + 去重 + provider fallback)
  │   └── index.ts        → 服务导出
  ├── hooks/
  │   ├── useMusicProvider.ts → Provider/Service 单例管理
  │   ├── useSearch.ts     → 300ms debounce + suggestions + results
  │   ├── useSearchHistory.ts → localStorage 搜索历史 CRUD
  │   ├── useHotKeywords.ts  → 热门搜索词加载
  │   └── index.ts        → hooks 导出
  ├── core/index.ts       → getProvider() / getService() 单例访问
  └── index.ts            → music-source 模块总入口

src/components/ui/       ← ★ 零业务依赖 — 绝对禁止修改 ★
  ├── GlassCard.tsx      → forwardRef, clsx, 3 variants + 4 paddings + interactive
  ├── LazyImage.tsx      → next/image + skeleton fallback
  ├── Skeleton.tsx       → text/circular/rectangular + shimmer
  └── IconButton.tsx     → forwardRef, 3 sizes + 2 variants, active:scale-90

src/components/player/   ← 依赖 ui/ + stores/
  ├── ProgressBar.tsx          → 纯 props (currentTime/duration/onSeek), mouse+touch drag
  ├── AlbumCover.tsx           → ui/LazyImage, sm=48/md=56/lg=200/xl=280, spin animation
  ├── PlayerControls.tsx       → 纯 props (isPlaying/isLoading/mode + callbacks), 4 mode icons
  ├── PlayerBar.tsx            → musicPlayerStore + uiStore + AlbumCover + ProgressBar + PlayerControls
  ├── PlayerFullscreen.tsx     → musicPlayerStore + uiStore + AlbumCover + PlayerControls + ProgressBar + LyricsView + VolumeSlider
  ├── LyricsView.tsx           → musicPlayerStore (lyrics/currentLyricIndex), scrollIntoView, click→seek
  └── VolumeSlider.tsx         → 纯 props (volume/isMuted + callbacks), mouse+touch + 3-level icon

src/components/home/     ← 依赖 ui/ + stores/
  ├── SearchBar.tsx         → uiStore (toggleSearch)
  ├── SongRow.tsx           → musicPlayerStore (play/togglePlay/currentSong/isPlaying), ui/LazyImage
  ├── RecommendSection      → ui/GlassCard, mock Playlist data (6 items, 2x3 grid)
  ├── HotSongsSection       → SongRow, mock SongWithMeta data (8 songs)
  ├── RecentPlaysSection    → SongRow, mock SongWithMeta data (3 songs)
  └── HomePage.tsx          → all home/*, animate-fade-in container

src/components/search/   ← Phase 3 ★ 依赖 ui/ + stores/ + music-source/hooks/
  ├── SearchPage.tsx        → searchStore + useSearch + useSearchHistory + useHotKeywords + uiStore
  ├── HotKeywords.tsx       → 纯 props, 热门搜索词流式布局
  ├── SearchHistory.tsx     → 纯 props, 搜索历史列表 (删除/清除)
  ├── SearchResultsView.tsx → 纯 props, 结果 (复用 SongRow + 歌单 GlassCard + 艺术家横滚)
  └── index.ts              → 搜索组件导出

src/components/library/  ← Phase 4 ★ 依赖 ui/ + stores/ + hooks/
  ├── LibraryPage.tsx       → usePlaylist + usePlaylistStore + tabs + create modal
  ├── LikedSongsList.tsx    → useLikedSongs + SongRow
  ├── PlaylistList.tsx      → usePlaylist + PlaylistCard
  ├── RecentPlaysList.tsx   → useRecentPlayed + SongRow
  ├── PlaylistCard.tsx      → Link + GlassCard + LazyImage
  └── index.ts              → library 组件导出

src/components/comments/ ← Phase 5 ★ 依赖 ui/ + hooks/
  ├── CommentCard.tsx       → LazyImage + IconButton + formatRelativeTime
  ├── CommentList.tsx       → useComments + useCommentLike + useReplies + useSocialStore + infinite scroll
  ├── CommentInput.tsx      → 纯 props (placeholder/onSubmit/compact)
  ├── ReplyCard.tsx         → LazyImage + IconButton + formatRelativeTime
  └── index.ts              → comments 组件导出

src/components/auth/     ← Phase 4 ★ 依赖 hooks/
  └── AuthProvider.tsx      → QueryClientProvider + useAuth (loading spinner)

src/components/layout/   ← 依赖 player/ + hooks/
  ├── BottomPlayer.tsx   → musicPlayerStore + uiStore + PlayerBar + PlayerFullscreen
  ├── AudioProvider.tsx  → useAudio + useAudioPlayer + useMediaSession + useLyricsSync (4 hooks)
  └── MobileNav.tsx      → Phase 4 ★ next/navigation + cn() (发现/我的 tab bar)

src/app/                 ← 依赖 components/ + hooks/
  ├── layout.tsx       → RootLayout (Server): metadata + viewport + AuthProvider + AudioProvider + max-w-md
  ├── page.tsx         → Page (Server): HomePage + BottomPlayer + MobileNav + SearchPage
  ├── loading.tsx      → 加载动画
  ├── error.tsx        → 错误边界 + 重试
  ├── globals.css      → @tailwind + @layer base/components (.glass/.card/.skeleton)
  ├── sw.ts            → serwist Service Worker 源 (编译到 public/sw.js)
  ├── library/
  │   └── page.tsx     → Phase 4 ★ LibraryPage + BottomPlayer + MobileNav
  ├── playlist/
  │   └── [id]/
  │       └── page.tsx → Phase 5 ★ Enhanced PlaylistDetailPage (bg blur + cover + 收藏/删除)
  └── song/
      └── [id]/
          └── page.tsx → Phase 5 ★ SongDetailPage (cover + info + comments)
```

---

## 关键依赖路径

### 播放链路 (Phase 2 ★)

```
SongRow.onClick
  → musicPlayerStore.play(song)
    → state: { currentSong, isPlaying, queue, queueIndex }

useAudioPlayer Effect 1 [currentSong?.audio_url]
  → AudioManager.load(url, callbacks)
    → new Audio(url), 绑定 load/play/error/progress/ended 事件
    → AudioManager.play()
      → audio.play()
        → RAF tick (200ms throttle)
          → callbacks.onTimeUpdate(t, d)
            → musicPlayerStore.syncTime(t, d)
              → UI re-render (ProgressBar, currentTime display)

useLyricsSync Effect [currentTime]
  → LyricParser.findCurrentIndex(lyrics, currentTime * 1000)
    → musicPlayerStore.setCurrentLyricIndex(idx)
      → LyricsView re-render + scrollIntoView

AudioManager 'ended' event
  → callbacks.onEnded()
    → musicPlayerStore.next()
      → state: { currentSong, queueIndex, currentTime: 0, lyrics: [], isPlaying }
        → goto useAudioPlayer Effect 1
```

### 全屏播放器链路

```
PlayerBar 封面/歌名 click
  → uiStore.expandPlayer()
    → BottomPlayer: isPlayerExpanded === true
      → <PlayerFullscreen /> rendered
        → 背景层: 封面图 blur-2xl 拉伸
        → 内容层: AlbumCover(xl) / LyricsView
        → 底部: ProgressBar + PlayerControls(lg) + VolumeSlider

关闭: IconButton(ChevronDown) → uiStore.collapsePlayer()
```

### 搜索链路 (Phase 3 ★)

```
SearchBar.onClick
  → uiStore.toggleSearch()
    → isSearchOpen = true
      → <SearchPage /> rendered

SearchPage Input onChange
  → useSearch.setQuery(q)
    → debounce 300ms
      → SearchService.search(keyword)
        ├── check pendingRequests (去重)
        ├── check cache (fresh hit → return)
        ├── provider.search(keyword) → 模糊匹配
        ├── cache.set(key, result)
        └── searchStore.setResults(result)
      → SearchService.getSuggestions(keyword)
        └── searchStore.setSuggestions(items)

点击 SongRow:
  → musicPlayerStore.play(song)  (复用 Phase 2 播放链路)
```

### Seek 链路

```
ProgressBar drag/touch
  → onSeek(time)
    → musicPlayerStore.seek(time)
      → state: { currentTime } (immediate UI update)

useAudioPlayer Subscribe [state.currentTime diff > 1.5s]
  → AudioManager.seek(state.currentTime)
    → audio.currentTime = time
```

---

## 模块间依赖规则

| 规则 | 说明 |
|------|------|
| 1. `types/` 不被修改 | 所有模块只读引用，类型变更是破坏性的 |
| 2. `stores/` 被 hooks 和 components 消费 | 不依赖 lib/ |
| 3. `components/ui/` 零业务依赖 | 不引用 stores, hooks, services, lib |
| 4. `lib/` 不依赖 stores 和 components | 仅依赖 types/ 和第三方库 |
| 5. 禁止循环依赖 | `A → B → A` 模式将破坏构建 |
| 6. 新模块不修改旧模块 | Phase 1 文件保持不动 |

---

## 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| 应用入口 | `src/app/layout.tsx` | Server Component |
| 首页 | `src/app/page.tsx` → `src/components/home/HomePage.tsx` | Server → Client |
| 播放器状态 (Phase 2) | `src/stores/musicPlayerStore.ts` | Zustand Store |
| UI 状态 | `src/stores/uiStore.ts` | Zustand Store |
| 音频管理器 | `src/lib/audio/AudioManager.ts` | 单例 Class |
| 歌词解析 | `src/lib/lyrics/LyricParser.ts` | 静态 Class |
| 核心音频 Hook | `src/hooks/useAudioPlayer.ts` | Client Hook |
| 播放控制 Hook | `src/hooks/usePlayerControls.ts` | Client Hook |
| 歌词同步 Hook | `src/hooks/useLyricsSync.ts` | Client Hook |
| 全屏播放器 | `src/components/player/PlayerFullscreen.tsx` | Client Component |
| 迷你播放器 | `src/components/player/PlayerBar.tsx` | Client Component |
| 音频 Provider | `src/components/layout/AudioProvider.tsx` | Client Component |
| 底部容器 | `src/components/layout/BottomPlayer.tsx` | Client Component |
| 数据服务 | `src/services/songService.ts` | Service |
| 搜索服务 | `src/music-source/services/SearchService.ts` | Service |
| 搜索状态 | `src/stores/searchStore.ts` | Zustand Store |
| 音源 Provider 接口 | `src/music-source/types/provider.ts` | TypeScript |
| Mock Provider | `src/music-source/providers/mock/MockProvider.ts` | Class |
| 搜索缓存 | `src/music-source/cache/SearchCache.ts` | Class |
| 搜索页 | `src/components/search/SearchPage.tsx` | Client Component |
| Supabase 客户端 | `src/lib/supabase/client.ts` | Library |
| 全局样式 | `src/app/globals.css` | CSS |
| 类型入口 | `src/types/index.ts` | TypeScript |
| 音源模块入口 | `src/music-source/index.ts` | 模块入口 |
| 认证状态 | `src/stores/userStore.ts` | Zustand Store |
| 乐观更新状态 | `src/stores/libraryStore.ts` | Zustand Store |
| 歌单 UI 状态 | `src/stores/playlistStore.ts` | Zustand Store |
| 匿名认证 Hook | `src/hooks/useAuth.ts` | Client Hook |
| 喜欢歌曲 Hook | `src/hooks/useLikedSongs.ts` | Client Hook |
| 歌单操作 Hook | `src/hooks/usePlaylist.ts` | Client Hook |
| 最近播放 Hook | `src/hooks/useRecentPlayed.ts` | Client Hook |
| 收藏歌单 Hook | `src/hooks/useLibrary.ts` | Client Hook |
| 认证 Provider | `src/components/auth/AuthProvider.tsx` | Client Component |
| 我的音乐页 | `src/components/library/LibraryPage.tsx` | Client Component |
| 歌单详情页 | `src/app/playlist/[id]/page.tsx` | Client Component |
| 类型扩展 | `src/types/library.ts` | TypeScript |
| 社交类型 | `src/types/social.ts` | TypeScript |
| 评论 Hook | `src/hooks/useComments.ts` | Client Hook |
| 点赞 Hook | `src/hooks/useCommentLike.ts` | Client Hook |
| 回复 Hook | `src/hooks/useReplies.ts` | Client Hook |
| 歌曲详情 Hook | `src/hooks/useSongDetail.ts` | Client Hook |
| 评论服务 | `src/services/social/commentService.ts` | Service |
| 点赞服务 | `src/services/social/likeService.ts` | Service |
| 回复服务 | `src/services/social/replyService.ts` | Service |
| 社交 Store | `src/stores/socialStore.ts` | Zustand Store |
| 歌曲详情页 | `src/app/song/[id]/page.tsx` | Client Component |
| 评论组件 | `src/components/comments/index.ts` | Component |

---

## Phase 5 依赖路径 (NEW ★)

### 评论加载链路

```
用户打开 SongDetailPage:
  → useComments(songId) → useInfiniteQuery(['comments', songId, sortType])
    → commentService.getComments(songId, sort, cursor?)
      → supabase.from("song_comments").select(*, profiles(username, avatar_url))
        .eq("song_id", songId).order(orderCol).limit(21)
    → hasMore → getNextPageParam → nextCursor
    → IntersectionObserver → fetchNextPage()
```

### 评论发表链路

```
CommentInput.onSubmit(content)
  → useComments.addComment(content)
    → mutationFn → commentService.createComment(userId, songId, content)
      → supabase.from("song_comments").insert() + profiles fetch
    → onSuccess → invalidateQueries(['comments', songId, sortType])
```

### 评论点赞链路

```
CommentCard.♥ click
  → useCommentLike.toggleLike(commentId)
    → mutationFn → likeService.toggleLike(userId, commentId, isLiked)
      → isLiked ? delete(comment_likes) : insert(comment_likes)
      → supabase.rpc("increment_comment_likes" | "decrement_comment_likes")
    → onSuccess → invalidateQueries(['comment-likes', userId])
```

### 回复链路

```
CommentCard.回复 click
  → socialStore.setActiveReplyId(commentId)
    → useReplies(commentId) → useQuery(['replies', commentId])
      → replyService.getReplies(commentId, cursor?)
    → ReplyCard × N 渲染
  → ReplyInput.onSubmit(content)
    → useReplies.addReply(content)
      → replyService.createReply(userId, commentId, content)
      → invalidateQueries(['replies', commentId])
```

---

## Phase 4 依赖路径 (NEW ★)

### 认证链路

```
App 启动
  → AuthProvider (QueryClientProvider + AuthInitializer)
    → useAuth()
      → authService.getSession() → 有 → getCurrentUser() → userStore.setUser()
      → authService.getSession() → 无 → signInAnonymously() → userStore.setUser()
        → 持久匿名 UUID 存入 localStorage (Supabase SDK 管理)
      → authService.onAuthStateChange() → 监听登录/登出

所有数据操作:
  userStore.user.id → services → Supabase (RLS: auth.uid() = user_id)
```

### 喜欢歌曲链路

```
SongRow / PlayerFullscreen → ♥ click
  → useLikedSongs.toggleLike(songId)
    → React Query mutation:
      1. onMutate → libraryStore.toggleLikeOptimistic(songId) → UI 立即更新
      2. mutationFn → likedSongsService.toggleLike(userId, songId, isLiked)
      3. onError → libraryStore.toggleLikeOptimistic(songId) → 回滚
      4. onSettled → invalidateQueries(['liked-songs', userId])
```

### 歌单链路

```
创建歌单:
  LibraryPage "新建" → playlistStore.openCreateModal()
    → usePlaylist.createPlaylist(title) → playlistService.createPlaylist()

歌单详情:
  /playlist/[id] → PlaylistDetailPage
    → useQuery(['playlist', id]) → playlistService.getPlaylistDetail(id)

播放记录:
  musicPlayerStore.play(song)
    → useRecentPlayed.recordPlay(songId) → libraryStore.addRecentPlayOptimistic(songId)
    → recentPlayedService.recordPlay(userId, songId) → Supabase upsert
```

---

## 新增模块指南

在 Phase 6+ 新增模块时，请按以下规则添加：

1. **新类型** → `src/types/new-feature.ts` + 更新 `index.ts` 导出
2. **新 Store** → `src/stores/newStore.ts` (不要加到 `stores/index.ts`)
3. **新 Hook** → `src/hooks/useNewFeature.ts`
4. **新 UI 组件** → `src/components/ui/` (零依赖) 或 `src/components/feature/` (有依赖)
5. **新服务** → `src/services/newService.ts`
6. **新存储** → `src/storage/newStore.ts` (IndexedDB 封装)
7. **新缓存服务** → `src/services/cache/newCache.ts`
8. **新页面** → `src/app/new-route/page.tsx`
9. 更新本文（MODULE_MAP.md）

---

## Phase 6 新增模块

### 新增目录

```
src/storage/              ← Phase 6 ★ IndexedDB 缓存层
  ├── CacheDB.ts           → 通用 IndexedDB 封装 (openDB, CRUD, count, clear)
  ├── metadataStore.ts     → 歌曲元数据缓存
  ├── offlineStore.ts      → 离线歌单存储
  ├── historyStore.ts      → 本地播放历史
  ├── lyricCacheStore.ts   → 歌词 IndexedDB 缓存
  └── index.ts             → 统一导出

src/services/cache/        ← Phase 6 ★ 缓存服务层
  ├── audioCacheService.ts → 音频预加载队列 + 元数据缓存
  ├── imageCacheService.ts → 图片预加载
  ├── lyricCacheService.ts → 歌词 getOrFetchLyric
  └── index.ts             → 统一导出

src/components/pwa/        ← Phase 6 ★ PWA 安装 UI
  ├── InstallDetector.tsx   → 静默组件 (挂载 3 个全局 hooks)
  ├── InstallPrompt.tsx     → iOS 安装教程弹窗 (30s 触发)
  └── index.ts             → PWA 组件导出
```

### Phase 6 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| 系统类型 | `src/types/system.ts` | TypeScript |
| 系统 Store | `src/stores/systemStore.ts` | Zustand Store |
| IndexedDB 封装 | `src/storage/CacheDB.ts` | Library |
| 元数据缓存 | `src/storage/metadataStore.ts` | Storage |
| 离线歌单 | `src/storage/offlineStore.ts` | Storage |
| 本地历史 | `src/storage/historyStore.ts` | Storage |
| 歌词缓存 | `src/storage/lyricCacheStore.ts` | Storage |
| 存储入口 | `src/storage/index.ts` | 导出 |
| 音频缓存服务 | `src/services/cache/audioCacheService.ts` | Service |
| 图片缓存服务 | `src/services/cache/imageCacheService.ts` | Service |
| 歌词缓存服务 | `src/services/cache/lyricCacheService.ts` | Service |
| 缓存服务入口 | `src/services/cache/index.ts` | 导出 |
| PWA 安装 Hook | `src/hooks/usePWAInstall.ts` | Client Hook |
| 网络状态 Hook | `src/hooks/useNetworkState.ts` | Client Hook |
| 离线缓存 Hook | `src/hooks/useOfflineCache.ts` | Client Hook |
| 音频缓存 Hook | `src/hooks/useAudioCache.ts` | Client Hook |
| PWA 安装检测 | `src/components/pwa/InstallDetector.tsx` | Client Component |
| PWA 安装教程 | `src/components/pwa/InstallPrompt.tsx` | Client Component |
| 页面过渡 | `src/components/layout/PageTransition.tsx` | Client Component |

### Phase 6 依赖路径 (NEW ★)

#### 离线缓存数据流

```
应用启动:
  → InstallDetector (layout.tsx)
    ├── usePWAInstall()      → systemStore.installState + beforeinstallprompt
    ├── useNetworkState()    → systemStore.networkState + online/offline events
    └── useOfflineCache()    → systemStore.cacheStats + IndexedDB counts

歌曲播放:
  → musicPlayerStore.play(song)
    → useAudioCache effect [currentSong]
      → audioCacheService.cacheSong(song)
        → storage/metadataStore.cacheSongMetadata(song)
          → IndexedDB song_metadata.put()
    → useAudioCache effect [queue, queueIndex]
      → audioCacheService.preloadQueueNext(queue, index, 2)
        → new Audio().preload = "auto"

歌词缓存:
  → LyricParser.parse(lrc)
    → lyricCacheService.saveLyric(songId, lrcText)
      → storage/lyricCacheStore.cacheLyric(songId, lrcText)
        → IndexedDB lyric_cache.put()

歌词恢复:
  → useLyricsSync: lyricCacheService.getOrFetchLyric(songId, fetchFn)
    → IndexedDB hit → 直接返回
    → IndexedDB miss → fetchFn() → 缓存到 IndexedDB

离线检测:
  → window online/offline events
    → useNetworkState.setNetworkState("offline")
      → systemStore: { networkState: "offline" }
        → UI 显示 .offline-badge
```

#### PWA 安装流程

```
Chrome/Android:
  → beforeinstallprompt event
    → usePWAInstall stores event
      → systemStore.installState.hasInstallPrompt = true
      → 用户点击 → promptInstall() → userChoice → isInstalled

iOS/Safari:
  → isIOSDevice() + !isStandaloneMode()
    → 30s timer → systemStore.showInstallGuide = true
      → <InstallPrompt /> renders
        → Steps: Share → Add to Home Screen
        → dismiss → localStorage 永久关闭

Standalone mode:
  → window.matchMedia("(display-mode: standalone)")
    → systemStore.installState.isStandalone = true
    → systemStore.installState.isInstalled = true
```

#### Media Session 链路 (Phase 6 — 重写)

```
musicPlayerStore.currentSong 变化:
  → useMediaSession effect [currentSong?.id]
    → navigator.mediaSession.metadata = new MediaMetadata({
        title, artist, album, artwork[96,192,512]
      })

musicPlayerStore.isPlaying 变化:
  → useMediaSession effect [isPlaying]
    → navigator.mediaSession.playbackState = "playing"|"paused"

定时器 2s:
  → navigator.mediaSession.setPositionState({
      duration, playbackRate, position: currentTime
    })

Action handlers (一次性注册):
  play/pause/previoustrack/nexttrack/seekto
    → musicPlayerStore.getState().togglePlay/pause/prev/next/seek
```

---

## Phase 7 新增模块 (NEW ★)

### 新增目录

```
src/music-source/providers/provider-manager/  ← Phase 7 ★ Provider 管理核心
  ├── ProviderManager.ts  → 注册/切换/健康/Fallback/恢复
  ├── HealthTracker.ts    → 滑动窗口健康检测
  ├── RequestManager.ts   → 重试/超时/去重/取消
  └── index.ts

src/music-source/providers/netease/    ← Phase 7 ★ 网易云
src/music-source/providers/qq/         ← Phase 7 ★ QQ音乐
src/music-source/providers/kuwo/       ← Phase 7 ★ 酷我
src/music-source/providers/bilibili/   ← Phase 7 ★ B站预留

src/server/api/              ← Phase 7 ★ API 代理辅助
  └── proxy-helper.ts

src/components/provider/     ← Phase 7 ★ Provider UI
  ├── ProviderInit.tsx
  ├── ProviderStatusBar.tsx
  ├── FallbackNotice.tsx
  └── index.ts

src/components/debug/        ← Phase 7 ★ 调试工具
  ├── ProviderDebugPanel.tsx
  └── index.ts

workers/                     ← Phase 7 ★ Cloudflare Workers 预留
  ├── config.ts
  ├── proxy/music-proxy.ts
  ├── cache/edge-cache.ts
  └── health/provider-check.ts

src/app/api/music/           ← Phase 7 ★ API Routes (11 端点)
  ├── search/route.ts
  ├── search/suggestions/route.ts
  ├── hotkeywords/route.ts
  ├── song/[id]/route.ts
  ├── song/[id]/play/route.ts
  ├── song/[id]/lyrics/route.ts
  ├── playlist/[id]/route.ts
  ├── playlist/[id]/songs/route.ts
  ├── artist/[id]/route.ts
  └── artist/[id]/songs/route.ts
src/app/api/provider/
  └── health/route.ts
```

### Phase 7 依赖路径 (NEW ★)

#### Provider 请求链路

```
UI Component
  ↓ (useMusicSource / useFallbackPlayer)
ProviderManager.execute(method, args)
  ↓
RequestManager.execute(key, fn, retries)
  ├── 1. 去重检查 (pendingRequests)
  ├── 2. 重试循环 (max 3, exponential backoff)
  ├── 3. 超时控制 (10s)
  └── 4. AbortController
  ↓
Provider.method() → fetch("/api/music/...")
  ↓
API Route (Next.js / Cloudflare Workers)
  ↓
Upstream Music API
```

#### Fallback 链路

```
ProviderManager.execute("getPlayUrl", [id])
  ├── netease (P0) → 失败
  │   └── HealthTracker.recordFailure("netease")
  ├── qq (P1)      → 失败
  │   └── HealthTracker.recordFailure("qq")
  ├── kuwo (P2)    → 成功
  │   └── HealthTracker.recordSuccess("kuwo", 350ms)
  └── 自动切换 activeType → kuwo
      └── providerStore.setCurrentProvider("kuwo")
  └── 30s 后探测 netease/qq 恢复情况
```

#### 健康恢复链路

```
HealthTracker: netease unhealthy (consecutive=3)
  ↓
ProviderManager.startRecoveryProbe("netease")
  ↓
setInterval(30s):
  netease.getHotKeywords()
    → 成功 → recordSuccess
    → 连续2次成功 → isHealthy=true
    → stopRecoveryProbe
    → 优先级更高 → switchTo("netease")
    → providerStore.setCurrentProvider("netease")
```

### Phase 7 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| Provider 管理 | `src/music-source/providers/provider-manager/ProviderManager.ts` | Class |
| 健康检测 | `src/music-source/providers/provider-manager/HealthTracker.ts` | Class |
| 请求管理 | `src/music-source/providers/provider-manager/RequestManager.ts` | Class |
| 代理基类 | `src/music-source/providers/BaseProxyProvider.ts` | Class |
| 网易云 | `src/music-source/providers/netease/NeteaseProvider.ts` | Class |
| QQ音乐 | `src/music-source/providers/qq/QQProvider.ts` | Class |
| 酷我 | `src/music-source/providers/kuwo/KuwoProvider.ts` | Class |
| B站预留 | `src/music-source/providers/bilibili/BilibiliProvider.ts` | Class |
| SWR 缓存 | `src/music-source/cache/APICache.ts` | Class |
| 播放稳定性 | `src/music-source/services/PlaybackStabilizer.ts` | Class |
| Provider Hook | `src/music-source/hooks/useProvider.ts` | Client Hook |
| 健康 Hook | `src/music-source/hooks/useProviderHealth.ts` | Client Hook |
| Fallback Hook | `src/music-source/hooks/useFallbackPlayer.ts` | Client Hook |
| 数据源 Hook | `src/music-source/hooks/useMusicSource.ts` | Client Hook |
| Provider Store | `src/stores/providerStore.ts` | Zustand Store |
| API 代理辅助 | `src/server/api/proxy-helper.ts` | Library |
| Provider 管理类型 | `src/types/provider.ts` | TypeScript |

---

## Phase 8 新增模块

### 新增目录

```
mobile/                    ← Phase 8 ★ Capacitor 封装
├── capacitor.config.ts
├── ios-config/
│   ├── App-Info.plist
│   └── capacitor.config.json
├── scripts/
│   ├── build-ios.sh
│   └── sync.sh
└── docs/
    └── CAPACITOR_GUIDE.md

src/components/error/      ← Phase 8 ★ 崩溃保护
├── ErrorBoundary.tsx
├── AudioErrorBoundary.tsx
├── ProviderErrorBoundary.tsx
├── OfflineFallback.tsx
└── index.ts

src/components/settings/   ← Phase 8 ★ 设置页
├── SettingsPage.tsx
└── index.ts

src/components/seo/        ← Phase 8 ★ SEO/Meta
├── AppMeta.tsx
└── index.ts

src/services/recovery/     ← Phase 8 ★ 播放恢复
└── PlaybackRecoverySystem.ts

src/services/download/     ← Phase 8 ★ 下载预留
└── DownloadManager.ts

src/lib/logs/              ← Phase 8 ★ 日志系统
├── Logger.ts
└── index.ts

docs/deployment/           ← Phase 8 ★ 部署文档
├── VERCEL_DEPLOY.md
├── SUPABASE_CONFIG.md
├── TESTFLIGHT_GUIDE.md
└── CAPACITOR_BUILD.md

docs/ai/ (扩展)            ← Phase 8 ★ AI维护体系
├── CURRENT_TASK.md
├── KNOWN_ISSUES.md
├── API_MAP.md
├── STORE_MAP.md
├── PROVIDER_MAP.md
├── CACHE_ARCHITECTURE.md
└── PLAYBACK_FLOW.md
```

### Phase 8 依赖路径 (NEW ★)

#### 播放恢复链路

```
APP 启动
  → usePlaybackRecovery (AudioProvider mount)
    → loadRecoveryState() → localStorage
      → 有效 → restore volume/mode
      → 过期 → clear
    → setInterval 5s → saveRecoveryState() (playing 时)
    → beforeunload → saveRecoveryState() (紧急保存)
```

#### 崩溃恢复链路

```
React Error:
  → ErrorBoundary catches → 重试 UI (5s auto-retry)
  → 连续 3 次 → 建议刷新页面

Audio Error:
  → AudioErrorBoundary catches → 重新加载按钮

Provider Error:
  → ProviderErrorBoundary catches → 自动 fallback to mock

Offline:
  → OfflineFallback renders → 离线提示 + 刷新按钮
```

### Phase 8 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| 恢复类型 | `src/types/recovery.ts` | TypeScript |
| 下载类型 | `src/types/download.ts` | TypeScript |
| 播放恢复 | `src/services/recovery/PlaybackRecoverySystem.ts` | Service |
| 播放恢复 Hook | `src/hooks/usePlaybackRecovery.ts` | Client Hook |
| 性能清理 Hook | `src/hooks/usePerformanceCleanup.ts` | Client Hook |
| 全局错误边界 | `src/components/error/ErrorBoundary.tsx` | Client Component |
| 音频错误边界 | `src/components/error/AudioErrorBoundary.tsx` | Client Component |
| Provider 错误边界 | `src/components/error/ProviderErrorBoundary.tsx` | Client Component |
| 离线兜底 | `src/components/error/OfflineFallback.tsx` | Client Component |
| 设置页 | `src/components/settings/SettingsPage.tsx` | Client Component |
| 设置 Store | `src/stores/settingsStore.ts` | Zustand Store |
| SEO/Meta | `src/components/seo/AppMeta.tsx` | Server Component |
| 日志系统 | `src/lib/logs/Logger.ts` | Library |
| 下载管理器 | `src/services/download/DownloadManager.ts` | Service |
| 设置路由 | `src/app/settings/page.tsx` | Page |
| Capacitor 配置 | `mobile/capacitor.config.ts` | Config |

---

## Phase 9 新增模块 (NEW ★)

### 新增目录

```
src/system/                     ← Phase 9 ★ 系统稳定化核心
├── index.ts                    → 统一导出 (所有 Phase 9 模块)
├── watchdog/
│   └── PlaybackWatchdog.ts     → 播放看门狗 (stall/timeout/error 检测与恢复)
├── recovery/
│   ├── ProviderSelfHealing.ts  → Provider 自愈系统 (评分/降级/探测恢复)
│   └── StartupRecoveryPipeline.ts → 启动恢复管道 (音量/模式/队列恢复)
├── cleanup/
│   └── CacheGovernance.ts      → 缓存治理 (定期清理 IndexedDB)
├── telemetry/
│   └── TelemetryService.ts     → 遥测服务 (环形缓冲区/快照/导出)
├── monitor/
│   ├── useSystemWatchdog.ts    → 系统看门狗集成 Hook (挂载所有 Phase 9 系统)
│   └── ReleaseMode.ts          → 发布模式控制 (debug/internal/release)
└── diagnostics/
    ├── DevDiagnosticsPage.tsx  → 诊断中心页面 (5 Tab: Overview/Provider/Playback/Cache/Logs)
    ├── DebugOverlay.tsx        → 调试浮层 (三指双击/Ctrl+Shift+D)
    └── DebugOverlayWrapper.tsx → 调试浮层条件渲染包装器

src/app/diagnostics/
└── page.tsx                    → /diagnostics 路由 (Server Component)
```

### Phase 9 依赖路径 (NEW ★)

#### 播放看门狗恢复链路

```
PlaybackWatchdog.tick() (每 2s)
  ├── storeReader() → { currentTime, isPlaying, loadingState, audioError }
  ├── stall 检测: currentTime 5s 无变化 + isPlaying
  │   └── determineRecovery("stalled") → resume → reload → skip_to_next
  ├── timeout 检测: loadingState === "loading" > 30s
  │   └── determineRecovery("timeout") → reload → skip_to_next
  ├── error 检测: loadingState === "error" || audioError
  │   └── determineRecovery("audio_error") → url_swap → skip_to_next
  └── executeRecovery(action)
      ├── resume → AudioManager.resume()
      ├── reload → AudioManager.destroy() + load()
      ├── skip_to_next → musicPlayerStore.next()
      ├── url_swap → Provider 重新获取 URL
      └── provider_fallback → ProviderSelfHealing 降级
```

#### Provider 自愈链路

```
ProviderSelfHealing.evaluate()
  ├── scoreProvider(type, metrics)
  │   ├── latencyScore = max(0, 100 - avgLatency/100*30)
  │   ├── healthScore = successRate * 70
  │   ├── composite = latencyScore + healthScore - failurePenalty - cooldownPenalty
  │   └── return { score, status: healthy/degraded/dead }
  ├── degrade: score < 30 + consecutiveFailures >= 3
  │   └── ProviderManager.disable(type) + cooldown = now + 5min
  └── recover: score >= 70 + no recent failures
      └── 每 30s 探测 → getHotKeywords()
          → 连续 2 次成功 → ProviderManager.enable(type)
```

#### 缓存治理链路

```
CacheGovernance.start()
  ├── runCleanup() (立即执行)
  │   ├── lyric_cache: 清理 7 天前条目
  │   ├── play_history_local: 保留最新 500 条
  │   ├── song_metadata: 清理 30 天前条目
  │   └── checkTotalEntries(): 总数 > 2000 → 清理最旧条目
  └── setInterval(10min) → runCleanup()
```

#### 遥测数据流

```
TelemetryService.record*(data)
  ├── push({ type, data, timestamp, sessionId })
  │   └── ringBuffer (max 1000 entries, FIFO)
  ├── updateSnapshot() (EMA 平滑)
  │   ├── providerMetrics (latency/successRate per provider)
  │   ├── playbackMetrics (stalls/skips/errors)
  │   ├── cacheMetrics (hitRate/missCount/entryCount)
  │   └── startupMetrics (coldStartCount/avgTTI/recoveryCount)
  └── persist() (每 30s)
      └── localStorage "telemetry_snapshot"
```

#### 启动恢复管道

```
useSystemWatchdog mount
  └── StartupRecoveryPipeline.execute()
      ├── 读取 localStorage "recovery_state"
      ├── 恢复: volume / playMode / isMuted / currentSongId / queueIds / providerType
      ├── 验证: SongId 在 queue 中存在
      └── 记录: recoveryTime → TelemetryService
```

#### 系统看门狗集成

```
AudioProvider mount
  └── useSystemWatchdog()
      ├── 1. 初始化 TelemetryService (单例 start)
      ├── 2. 初始化 CacheGovernance (单例 start)
      ├── 3. 初始化 ProviderSelfHealing (注册 health callbacks)
      ├── 4. 初始化 PlaybackWatchdog (注入 storeReader/storeActions)
      ├── 5. 执行 StartupRecoveryPipeline
      ├── 6. 记录 TTI (100ms 后)
      └── 返回 useSystemHealth() → 诊断数据
```

### Phase 9 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| Phase 9 类型定义 | `src/types/phase9.ts` | TypeScript |
| 系统模块总入口 | `src/system/index.ts` | 模块入口 |
| 播放看门狗 | `src/system/watchdog/PlaybackWatchdog.ts` | 单例 Class |
| Provider 自愈 | `src/system/recovery/ProviderSelfHealing.ts` | 单例 Class |
| 启动恢复管道 | `src/system/recovery/StartupRecoveryPipeline.ts` | 单例 Class |
| 缓存治理 | `src/system/cleanup/CacheGovernance.ts` | 单例 Class |
| 遥测服务 | `src/system/telemetry/TelemetryService.ts` | 单例 Class |
| 系统看门狗 Hook | `src/system/monitor/useSystemWatchdog.ts` | Client Hook |
| 发布模式控制 | `src/system/monitor/ReleaseMode.ts` | Library |
| 诊断页面 | `src/system/diagnostics/DevDiagnosticsPage.tsx` | Client Component |
| 调试浮层 | `src/system/diagnostics/DebugOverlay.tsx` | Client Component |
| 调试浮层包装器 | `src/system/diagnostics/DebugOverlayWrapper.tsx` | Client Component |
| 诊断路由 | `src/app/diagnostics/page.tsx` | Page |

### Phase 9 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 phase9.ts 所有类型导出 + DEFAULT_*_CONFIG 导出 |
| `src/lib/logs/Logger.ts` | LogCategory 扩展 "watchdog" \| "startup" \| "system" |
| `src/components/layout/AudioProvider.tsx` | 新增 useSystemWatchdog() 调用 |
| `src/app/layout.tsx` | 新增 DebugOverlayWrapper 渲染 |

---

## Phase 10 新增模块 (NEW ★)

### 新增目录

```
src/platform/                     ← Phase 10 ★ 平台化与运维层
├── index.ts                      → 统一导出
├── config/
│   └── RuntimeConfigManager.ts   → 动态配置中心 (Provider/缓存/调试/实验)
├── backup/
│   └── BackupManager.ts          → 数据备份与恢复 (JSON export/import + checksum)
├── migration/
│   └── MigrationPipeline.ts      → 数据迁移管道 (幂等/带回滚/可追踪)
├── update/
│   └── ProviderHotReload.ts      → Provider 热更新 (动态启停/优先级/热切换)
├── runtime/
│   ├── DeploymentMode.ts         → 部署模式检测 (local/vercel/cloudflare/hybrid)
│   ├── MemoryMonitor.ts          → 内存监控 (30s 采样, 压力检测)
│   └── SystemIntegrity.ts        → 系统完整性检查 (7 项关键检查)
└── recovery/
    └── DisasterRecovery.ts       → 灾难恢复 (Quick/Full/Nuclear 三级)

deployment/
└── profiles.md                   → 部署模式配置文档

release/
└── RELEASE_CHECKLIST.md          → 发布检查清单

docs/self-host/
└── INDEX.md                      → 自托管完整指南
```

### Phase 10 依赖路径 (NEW ★)

#### RuntimeConfig 链路

```
localStorage (music_runtime_config)
  → RuntimeConfigManager.loadConfig()
    → ENV overrides (NEXT_PUBLIC_*)
      → Runtime overrides (applyOverride)
        → merged config
          → ProviderHotReloadSystem.syncFromRuntimeConfig()
          → CacheGovernance 参数更新
          → Debug 设置生效
```

#### Provider 热更新链路

```
用户操作 (Settings)
  → ProviderHotReloadSystem.enableProvider/disableProvider/hotSwitch
    → 立即更新内存状态
    → persistToRuntimeConfig() → RuntimeConfigManager
    → notifyListeners() → UI 实时更新
    → 下一个 Provider 请求生效新配置
```

#### 备份与恢复链路

```
用户导出:
  → BackupManager.createBackup(scope)
    → exportPlaylists/likedSongs/config/cacheIndex
    → computeChecksum → JSON.stringify
    → download (Blob + URL.createObjectURL)

用户恢复:
  → BackupManager.restoreFromFile(file)
    → FileReader.readAsText
    → JSON.parse + checksum 校验
    → importPlaylists/likedSongs/config
```

#### 灾难恢复链路

```
Nuclear Reset:
  → DisasterRecovery.nuclearReset()
    → RuntimeConfigManager.resetToDefaults()
    → ProviderHotReloadSystem.reset()
    → 清除 localStorage (保留 auth)
    → 删除所有 IndexedDB
    → window.location.reload()
```

### Phase 10 文件入口索引

| 功能 | 入口文件 | 类型 |
|------|---------|------|
| Phase 10 类型定义 | `src/types/phase10.ts` | TypeScript |
| 平台模块入口 | `src/platform/index.ts` | 模块入口 |
| 动态配置中心 | `src/platform/config/RuntimeConfigManager.ts` | 单例 Class |
| Provider 热更新 | `src/platform/update/ProviderHotReload.ts` | 单例 Class |
| 数据备份 | `src/platform/backup/BackupManager.ts` | 单例 Class |
| 数据迁移 | `src/platform/migration/MigrationPipeline.ts` | 单例 Class |
| 部署模式检测 | `src/platform/runtime/DeploymentMode.ts` | Library |
| 内存监控 | `src/platform/runtime/MemoryMonitor.ts` | 单例 Class |
| 完整性检查 | `src/platform/runtime/SystemIntegrity.ts` | 单例 Class |
| 灾难恢复 | `src/platform/recovery/DisasterRecovery.ts` | 单例 Class |

### Phase 10 修改文件

| 文件 | 变更摘要 |
|------|---------|
| `src/types/index.ts` | 新增 phase10.ts 所有类型 + DEFAULT_RUNTIME_CONFIG/DEPLOYMENT_PROFILES 导出 |

---

> **最后更新：** 2026-05-24 | Phase 10 最终产品形态完成 | 174 源文件

> **最后更新：** 2026-05-24 | Phase 9 系统最终稳定化完成 | 166 源文件

> **最后更新：** 2026-05-24 | Phase 8 最终产品化完成 | 154 源文件

> **最后更新：** 2026-05-24 | Phase 7 真实音源接入完成 | 132 源文件
