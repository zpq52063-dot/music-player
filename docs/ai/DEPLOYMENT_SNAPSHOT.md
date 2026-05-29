# Deployment Snapshot

> Phase 11 — 当前部署结构快照 | 2026-05-24

---

## 部署总览

| 服务 | 平台 | 状态 | URL |
|------|------|------|-----|
| 前端应用 | Vercel | 待部署 | — |
| 数据库 | Supabase | Schema ready | 需配置 |
| PWA | Service Worker | ✅ 运行中 | localhost |
| iOS App | Capacitor | 配置完成 | 待 TestFlight |
| 缓存代理 | Cloudflare Workers | 架构预留 | — |

---

## 1. Vercel 部署

### 当前状态

| 项目 | 值 |
|------|-----|
| 框架 | Next.js 15 (App Router) |
| 构建命令 | `npm run build` |
| 输出目录 | `.next/` |
| 部署方式 | `vercel --prod` |
| 自定义域名 | 待配置 |
| 环境变量 | 见下方 |

### 所需环境变量

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_RELEASE_MODE=release
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # 仅服务端
```

### 部署命令

```bash
cd music-player
npx vercel --prod \
  --env NEXT_PUBLIC_SUPABASE_URL=xxx \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  --env NEXT_PUBLIC_RELEASE_MODE=release
```

---

## 2. Supabase 配置

### Schema

| 表 | 用途 | RLS |
|----|------|-----|
| profiles | 用户资料 | public SELECT, owner UPDATE |
| songs | 歌曲数据 | public SELECT |
| playlists | 歌单 | owner ALL, public SELECT (is_public) |
| playlist_songs | 歌单歌曲 | owner via playlist.user_id |
| liked_songs | 喜欢歌曲 | owner ALL |
| play_history | 播放历史 | owner ALL |
| recently_played | 最近播放 | owner ALL |
| favorite_playlists | 收藏歌单 | owner ALL |
| song_comments | 歌曲评论 | public SELECT, owner DELETE |
| comment_likes | 评论点赞 | owner ALL |
| comment_replies | 评论回复 | public SELECT, owner DELETE |

### 迁移文件

```
supabase/migrations/
├── 001_initial_schema.sql    # 核心6表 + RLS + 索引
├── 002_phase4_schema.sql     # recently_played + favorite_playlists + trigger
└── 003_phase5_schema.sql     # song_comments + comment_likes + comment_replies
```

### 部署命令

```bash
npx supabase link --project-ref <project-id>
npx supabase db push
```

---

## 3. Service Worker (PWA)

### 缓存策略

| 资源类型 | 策略 | TTL |
|---------|------|-----|
| `/_next/static/*`, `/icons/*` | CacheFirst | 30天 |
| `*.png/jpg/webp`, supabase images | StaleWhileRevalidate | 7天 |
| `/api/*`, supabase REST | NetworkFirst | 5s timeout |
| `*.woff2` | CacheFirst | — |
| Navigation requests | NetworkFirst | 3s timeout |

### Manifest

```json
{
  "name": "Music Player",
  "short_name": "Music",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a"
}
```

---

## 4. Capacitor iOS

### 当前配置

```typescript
// mobile/capacitor.config.ts
{
  appId: "com.musicplayer.app",
  appName: "Music Player",
  webDir: "../out",
  server: { url: "https://xxx.vercel.app" }, // 或 localhost
  ios: { contentInset: "automatic" }
}
```

### 构建命令

```bash
cd mobile
npm run sync        # npx cap sync
npm run build-ios   # npx cap build ios
```

### TestFlight 分发

1. 在 Xcode 中 Archive
2. 上传到 App Store Connect
3. TestFlight → 内部测试 → 邀请用户

---

## 5. Cloudflare Workers (预留)

### 目录结构

```
workers/
├── proxy/     # API 反向代理
├── cache/     # 边缘缓存
└── health/    # 健康检测端
```

### 部署 (待完善)

```bash
cd workers/proxy
npx wrangler deploy
```

---

## 6. 存储结构

### localStorage

| Key | 内容 | 大小估算 |
|-----|------|---------|
| `music_runtime_config` | RuntimeConfig (JSON) | ~2KB |
| `music_settings` | 用户设置 (JSON) | ~1KB |
| `music_search_history` | 搜索历史 (JSON数组, ≤20) | ~2KB |
| `music_recovery_checkpoints` | 恢复检查点 (JSON数组, ≤5) | ~50KB |
| `music_maintenance_mode` | 维护模式状态 | ~500B |
| `music_architecture_snapshots` | 架构快照 (≤3) | ~10KB |
| `supabase.auth.token` | Supabase 认证 (SDK管理) | ~2KB |
| `music_telemetry` | 遥测Buffer (≤1000条) | ~500KB |

### IndexedDB

```
Database: "music-player-cache" v1
├── song_metadata (keyPath: id)
├── offline_playlists (keyPath: id)
├── play_history_local (autoIncrement)
├── lyric_cache (keyPath: songId)
└── image_cache_meta (keyPath: url)
```

---

## 7. API Routes

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/music/search` | GET | 搜索歌曲 |
| `/api/music/suggestions` | GET | 搜索建议 |
| `/api/music/hot` | GET | 热门关键词 |
| `/api/music/song/[id]` | GET | 歌曲详情 |
| `/api/music/play/[id]` | GET | 获取播放URL |
| `/api/music/lyrics/[id]` | GET | 获取歌词 |
| `/api/music/playlist/[id]` | GET | 歌单详情 |
| `/api/music/playlist/[id]/songs` | GET | 歌单歌曲列表 |
| `/api/music/artist/[id]` | GET | 艺术家详情 |
| `/api/music/artist/[id]/songs` | GET | 艺术家歌曲列表 |
| `/api/music/providers` | GET | Provider 状态列表 |

---

> **本快照记录部署结构的当前状态。** 每次部署变更后更新。
> Phase 11 — AI原生最终工程体系 | 2026-05-24
