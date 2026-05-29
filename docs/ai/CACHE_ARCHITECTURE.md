# Cache Architecture

> Phase 8 — 完整缓存架构 | 2026-05-24

---

## 多层缓存体系

```
Layer 1: Memory Cache (最快，会话内)
├── SearchCache (Map, staleTime/gcTime)
├── APICache (SWR, stale-while-revalidate)
└── PlaybackStabilizer (URL cache, 10min TTL)

Layer 2: IndexedDB (持久，可离线)
├── song_metadata (歌曲元数据)
├── offline_playlists (离线歌单)
├── play_history_local (本地播放历史)
├── lyric_cache (歌词)
└── image_cache_meta (图片元数据)

Layer 3: Cache API (Service Worker)
├── static assets (_next/static/*, /icons/*)
├── images (*.png, *.jpg, *.webp)
├── API responses (/api/*, supabase.co/rest/*)
└── fonts (*.woff2)
```

---

## Memory Cache 详细配置

| 类型 | staleTime | gcTime | 去重 |
|------|-----------|--------|------|
| search | 2 min | 10 min | ✅ |
| suggestion | 1 min | 5 min | ✅ |
| hotKeywords | 30 min | 60 min | ✅ |
| songDetail | 5 min | 30 min | ✅ |
| playlist | 5 min | 30 min | ✅ |
| lyrics | 30 min | 60 min | ✅ |
| playUrl | 10 min | 30 min | ✅ |
| artist | 5 min | 30 min | ✅ |

---

## IndexedDB 详细配置

**Database:** music-player-cache v1

| Object Store | keyPath | Indexes | 用途 |
|---|---|---|---|
| song_metadata | id | cachedAt | 歌曲元数据 |
| offline_playlists | id | cachedAt | 离线歌单 |
| play_history_local | id (autoIncrement) | songId, playedAt | 本地播放历史 |
| lyric_cache | songId | — | LRC 歌词 |
| image_cache_meta | url | — | 图片预加载记录 |

**容量限制:** 浏览器默认 (~50MB iOS Safari)

---

## Service Worker 缓存策略

| 资源类型 | 策略 | TTL | 说明 |
|---------|------|-----|------|
| static assets | CacheFirst | 30 days | 不可变的构建产物 |
| images | StaleWhileRevalidate | 7 days | 封面/图标/截图 |
| API | NetworkFirst | 5s timeout | 始终尝试网络优先 |
| fonts | CacheFirst | 30 days | 字体文件极少变化 |
| navigation | NetworkFirst | 3s timeout | HTML 文档 |

---

## 缓存服务层

### audioCacheService
- `cacheSong(song)` → IndexedDB song_metadata
- `preloadAudio(song, priority)` → 队列 (MAX_CONCURRENT=1)
- `preloadQueueNext(songs, startIndex, count=2)` → 预加载后续歌曲

### imageCacheService
- `preloadImage(url)` → new Image().src
- `preloadImages(urls[])` → Promise.allSettled
- `isImagePreloaded(url)` → Set.has()

### lyricCacheService
- `getOrFetchLyric(songId, fetchFn)` → IndexedDB hit → return; miss → fetch → cache

---

## 缓存清理策略

| 机制 | 触发 | 操作 |
|------|------|------|
| usePerformanceCleanup | 每 10min | 清理 >7 天的歌词缓存, >500 条的播放历史 |
| SearchCache.gc() | 手动 | 清理超过 gcTime 的条目 |
| APICache.revalidate() | SWR 自动 | 后台更新 stale 条目 |
| Settings → 清除缓存 | 用户手动 | 删除所有 IndexedDB + localStorage (保留 auth) |

---

## 离线能力矩阵

| 功能 | Online | Offline |
|------|--------|---------|
| 搜索 | ✅ SearchService → Provider | ❌ |
| 播放 | ✅ Stream | ✅ 已缓存歌曲 |
| 歌词 | ✅ Fetch | ✅ IndexedDB hit |
| 喜欢/收藏 | ✅ Supabase | ❌ |
| 评论 | ✅ Supabase | ❌ |
| 浏览已缓存 | ✅ | ✅ IndexedDB |
| 设置 | ✅ | ✅ localStorage |
