# API Map

> Phase 8 — 所有 API 路由完整地图 | 2026-05-24

---

## API Routes (Next.js 服务端)

所有路由位于 `src/app/api/` 下。

### 音乐数据 API

| 方法 | 路由 | 参数 | 返回 | 状态 |
|------|------|------|------|------|
| GET | `/api/music/search` | `?q=&type=&page=` | SearchResult | ✅ |
| GET | `/api/music/search/suggestions` | `?q=` | string[] | ✅ |
| GET | `/api/music/hotkeywords` | — | string[] | ✅ |
| GET | `/api/music/song/[id]` | path: id | SongDetail | ✅ |
| GET | `/api/music/song/[id]/play` | path: id, `?quality=` | { url } | ✅ |
| GET | `/api/music/song/[id]/lyrics` | path: id | string (LRC) | ✅ |
| GET | `/api/music/playlist/[id]` | path: id | Playlist | ✅ |
| GET | `/api/music/playlist/[id]/songs` | path: id | Song[] | ✅ |
| GET | `/api/music/artist/[id]` | path: id | Artist | ✅ |
| GET | `/api/music/artist/[id]/songs` | path: id | Song[] | ✅ |

### Provider 管理 API

| 方法 | 路由 | 返回 | 状态 |
|------|------|------|------|
| GET | `/api/provider/health` | ProviderHealthMap | ✅ |

---

## Supabase Services (客户端)

| Service | 方法 | Supabase 表 | 状态 |
|---------|------|-------------|------|
| songService | getHotSongs(limit) | songs | ✅ |
| songService | getSongById(id) | songs | ✅ |
| songService | recordPlay(songId) | play_history | ✅ |
| songService | toggleLike(songId, bool) | liked_songs | ✅ |
| authService | signInAnonymously() | auth.users | ✅ |
| authService | getSession() | auth.sessions | ✅ |
| authService | getCurrentUser() | auth.users | ✅ |
| likedSongsService | getLikedSongs(userId) | liked_songs+songs | ✅ |
| likedSongsService | toggleLike(userId, songId, isLiked) | liked_songs | ✅ |
| playlistService | getUserPlaylists(userId) | playlists | ✅ |
| playlistService | createPlaylist(...) | playlists | ✅ |
| playlistService | deletePlaylist(id) | playlists | ✅ |
| playlistService | addSong(playlistId, songId) | playlist_songs | ✅ |
| playlistService | removeSong(playlistId, songId) | playlist_songs | ✅ |
| playlistService | toggleFavorite(userId, playlistId, isFav) | favorite_playlists | ✅ |
| recentPlayedService | recordPlay(userId, songId) | recently_played | ✅ |
| recentPlayedService | getRecentPlays(userId) | recently_played+songs | ✅ |
| commentService | getComments(songId, sort, cursor?) | song_comments | ✅ |
| commentService | createComment(userId, songId, content) | song_comments | ✅ |
| commentService | deleteComment(id) | song_comments | ✅ |
| likeService | getLikedCommentIds(userId) | comment_likes | ✅ |
| likeService | toggleLike(userId, commentId, isLiked) | comment_likes+RPC | ✅ |
| replyService | getReplies(commentId, cursor?) | comment_replies | ✅ |
| replyService | createReply(userId, commentId, content) | comment_replies | ✅ |
| replyService | deleteReply(id) | comment_replies | ✅ |

---

## Provider API (通过 API Routes 代理)

| Provider | 状态 | 方法 |
|----------|------|------|
| NeteaseProvider | ✅ | search/suggestions/hotKeywords/songDetail/playUrl/lyrics/playlist/artist |
| QQProvider | ✅ | search/suggestions/hotKeywords/songDetail/playUrl/lyrics/playlist/artist |
| KuwoProvider | ✅ | search/suggestions/hotKeywords/songDetail/playUrl/lyrics/playlist/artist |
| BilibiliProvider | 🔲 | 预留骨架 |
| MockProvider | ✅ | 完整实现 (永久兜底) |

---

## Cloudflare Workers (预留)

| Worker | 路由 | 状态 |
|--------|------|------|
| music-proxy | `/proxy/music/*` | 🔲 骨架 |
| edge-cache | Edge Cache 策略 | 🔲 定义 |
| provider-check | Cron 健康检测 | 🔲 骨架 |

---

## 数据流规则

```
Component → hooks → services → Supabase (客户端)
                                → API Routes → Provider → External API (服务端)
```

**绝对禁止:** 组件直接 fetch 或直接调用 supabase.from()
