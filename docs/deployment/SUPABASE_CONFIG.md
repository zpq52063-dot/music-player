# Supabase 配置指南

> Phase 8 — 数据库 + Auth + Storage 配置 | 2026-05-24

---

## Step 1: 创建 Supabase 项目

1. 登录 [supabase.com](https://supabase.com)
2. New Project → 填写名称 "music-player"
3. Database Password → 安全保存
4. Region → 选择最近的 (如 Southeast Asia)
5. 等待初始化完成 (~2 分钟)

---

## Step 2: 运行迁移

```bash
cd music-player

# 安装 Supabase CLI (如未安装)
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref <project-ref>

# 运行迁移
supabase db push

# 或者手动在 SQL Editor 中执行:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_phase4_schema.sql
# supabase/migrations/003_phase5_schema.sql
```

---

## Step 3: 配置环境变量

在项目根目录 `.env.local` (本地) 和 Vercel (生产):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**获取方式:** Supabase Dashboard → Settings → API

---

## Step 4: 验证 RLS

```sql
-- 在 SQL Editor 中验证
SELECT * FROM songs LIMIT 5;  -- 应返回数据

-- 测试 RLS
-- 匿名用户执行:
-- 应能 SELECT songs，但不能 INSERT/UPDATE
```

---

## Step 5: Auth 配置

1. Supabase Dashboard → Authentication → Settings
2. Site URL: https://your-domain.vercel.app
3. Redirect URLs: 添加生产域名
4. Enable anonymous sign-ins (已启用)

---

## Step 6: Storage (可选)

如需上传图片/音频:

1. Supabase Dashboard → Storage
2. 创建 Bucket: "music-covers" (public), "music-audio" (private)
3. 配置 CORS 和 RLS

---

## 数据库表结构

| 表 | 用途 | RLS |
|----|------|-----|
| profiles | 用户资料 | owner UPDATE |
| songs | 歌曲元数据 | public SELECT |
| playlists | 歌单 | owner ALL |
| playlist_songs | 歌单歌曲 | cascade via playlist |
| liked_songs | 喜欢歌曲 | owner ALL |
| play_history | 播放历史 | owner ALL |
| recently_played | 最近播放 (upsert) | owner ALL |
| favorite_playlists | 收藏歌单 | owner ALL |
| song_comments | 歌曲评论 | public SELECT |
| comment_likes | 评论点赞 | owner ALL |
| comment_replies | 评论回复 | public SELECT |
