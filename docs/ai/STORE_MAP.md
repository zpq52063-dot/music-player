# Store Map

> Phase 8 — 所有 Zustand Store 完整地图 | 2026-05-24

---

## 活跃 Store (13 个)

### musicPlayerStore (Phase 2)
- **文件:** `src/stores/musicPlayerStore.ts`
- **状态:** currentSong, isPlaying, currentTime, duration, volume, isMuted, playbackRate, playMode, queue, queueIndex, buffered, loadingState, lyrics, currentLyricIndex
- **Actions:** 23 (play/pause/togglePlay/seek/setVolume/toggleMute/setPlaybackRate/syncTime/setBuffered/setLoadingState/setQueue/addToQueue/removeFromQueue/clearQueue/next/prev/setPlayMode/cycleMode/setLyrics/setCurrentLyricIndex)
- **使用者:** useAudioPlayer, usePlayerControls, useLyricsSync, PlayerBar, PlayerFullscreen, SongRow, LyricsView

### uiStore (Phase 1)
- **文件:** `src/stores/uiStore.ts`
- **状态:** isPlayerExpanded, isSearchOpen, searchQuery
- **Actions:** 5 (expandPlayer, collapsePlayer, toggleSearch, closeSearch, setSearchQuery)
- **使用者:** SearchBar, SearchPage, BottomPlayer

### searchStore (Phase 3)
- **文件:** `src/stores/searchStore.ts`
- **状态:** query, suggestions, hotKeywords, searchHistory, results, isSearching, searchError, activeView
- **Actions:** 11 (setQuery, setSuggestions, setHotKeywords, setResults, setIsSearching, setSearchError, setActiveView, addHistory, removeHistory, clearHistory, resetSearch)
- **使用者:** SearchPage, useSearch, useSearchHistory, useHotKeywords

### userStore (Phase 4)
- **文件:** `src/stores/userStore.ts`
- **状态:** user, isAuthenticated, isAnonymous, isLoading
- **Actions:** 3 (setUser, clearAuth, setLoading)
- **使用者:** useAuth, AuthProvider

### libraryStore (Phase 4)
- **文件:** `src/stores/libraryStore.ts`
- **状态:** likedSongIds, recentPlayIds, favoritePlaylistIds
- **Actions:** 6 (set/setRecentPlayIds/addRecentPlayOptimistic/setFavoritePlaylistIds/toggleLikeOptimistic/toggleFavoriteOptimistic)
- **使用者:** useLikedSongs, useRecentPlayed, useLibrary

### playlistStore (Phase 4)
- **文件:** `src/stores/playlistStore.ts`
- **状态:** editingPlaylistId, isCreateModalOpen, isAddSongModalOpen, pendingSongId
- **Actions:** 5 (openCreateModal, closeCreateModal, openAddSongModal, closeAddSongModal, setEditingPlaylist)
- **使用者:** LibraryPage, usePlaylist

### socialStore (Phase 5)
- **文件:** `src/stores/socialStore.ts`
- **状态:** commentSortType, currentCommentSongId, activeReplyId
- **Actions:** 3 (setCommentSortType, setCurrentCommentSongId, setActiveReplyId)
- **使用者:** CommentList, CommentCard, SongDetailPage

### systemStore (Phase 6)
- **文件:** `src/stores/systemStore.ts`
- **状态:** networkState, installState, cacheStats, showInstallGuide, isBackgroundPlayback
- **Actions:** 9 (setNetworkState, setInstallState, setShowInstallGuide, dismissInstallGuide, setCacheStats, incrementCacheCount, setBackgroundPlayback)
- **使用者:** InstallDetector, InstallPrompt, usePWAInstall, useNetworkState, useOfflineCache

### providerStore (Phase 7)
- **文件:** `src/stores/providerStore.ts`
- **状态:** currentProvider, health, fallbackReason, requestStatus, activeProviderCount
- **使用者:** ProviderStatusBar, FallbackNotice, ProviderDebugPanel, useProvider

### settingsStore (Phase 8)
- **文件:** `src/stores/settingsStore.ts`
- **状态:** audioQuality, autoCache, debugMode, providerPriority
- **Actions:** 4 (setAudioQuality, setAutoCache, setDebugMode, setProviderPriority)
- **使用者:** SettingsPage

---

## Legacy Store (保留不删)

### playerStore (Phase 1)
- **文件:** `src/stores/playerStore.ts`
- **状态:** playlist, currentIndex, mode
- **说明:** 被 Phase 2 musicPlayerStore 取代，保留兼容
- **使用者:** useAudio (legacy)

---

## React Query Cache (非 Zustand)

| Cache Key Pattern | 数据 | Store |
|---|---|---|
| `['liked-songs', userId]` | 喜欢歌曲列表 | React Query |
| `['liked-song-ids', userId]` | 喜欢歌曲 ID Set | React Query |
| `['playlists', userId]` | 用户歌单列表 | React Query |
| `['playlist', id]` | 歌单详情 | React Query |
| `['recent-plays', userId]` | 最近播放 | React Query |
| `['favorite-playlists', userId]` | 收藏歌单 | React Query |
| `['comments', songId, sort]` | 评论 infinite query | React Query |
| `['comment-likes', userId]` | 评论点赞 ID | React Query |
| `['replies', commentId]` | 回复列表 | React Query |
| `['song-detail', songId]` | 歌曲详情 | React Query |

---

## Store 依赖规则

```
types/ ← stores/ ← hooks/ ← components/
  (纯类型)  (状态)    (桥接)    (渲染)
```

- Store 不依赖其他 Store (通过 hooks 协调)
- Store action 使用 get() 而非闭包 state
- 新 Store 不添加到 stores/index.ts
