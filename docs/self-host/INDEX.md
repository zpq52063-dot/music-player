# 自托管指南

> Phase 10 — 私用长期运行架构

---

## 概述

Music Player 设计为**私用部署优先**的应用，支持以下自托管方式：

| 方式 | 难度 | 成本 | 适用 |
|------|------|------|------|
| Vercel + Supabase | 低 | 免费层 | 个人/小团队 |
| Cloudflare Workers | 中 | 免费层 | 全球加速 |
| 本地 Docker | 中 | 服务器成本 | 完全自控 |
| 混合部署 | 高 | 按量付费 | 高性能 |

---

## 1. Vercel + Supabase (推荐)

### 前提
- GitHub 账号
- Vercel 账号 (免费)
- Supabase 账号 (免费)

### 步骤

```bash
# 1. Fork 项目到 GitHub

# 2. 创建 Supabase 项目
# https://supabase.com → New Project
# 复制 Supabase URL + anon key

# 3. 在 Vercel 导入 GitHub 项目
# https://vercel.com → Import
# 设置环境变量:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   NEXT_PUBLIC_RELEASE_MODE=release

# 4. 在 Supabase 运行数据库迁移
# supabase\migrations\001_initial_schema.sql
# supabase\migrations\002_phase4_schema.sql
# supabase\migrations\003_phase5_schema.sql

# 5. 部署
# Vercel 自动构建并部署
```

---

## 2. Docker (预留)

```
# docker-compose.yml (Phase 10 预留)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL
      - NEXT_PUBLIC_SUPABASE_ANON_KEY
      - NEXT_PUBLIC_RELEASE_MODE=release
  # 可选的 Supabase 本地替代
  # postgres:
  #   image: postgres:16
```

---

## 3. Supabase 替代方案

### 当前使用 Supabase 的功能

| 功能 | Supabase 表 | 本地替代 |
|------|-----------|---------|
| 歌曲数据 | songs | IndexedDB / JSON文件 |
| 用户认证 | auth.users | 匿名UUID (localStorage) |
| 喜欢歌曲 | liked_songs | localStorage |
| 歌单 | playlists | localStorage |
| 播放历史 | play_history | IndexedDB |
| 评论 | song_comments | 可禁用 |
| 回复 | comment_replies | 可禁用 |

### 无 Supabase 模式 (预留)

```
NEXT_PUBLIC_SUPABASE_URL=local
# 应用自动降级到 localStorage + IndexedDB
# 所有数据存储在本地浏览器
```

---

## 4. 数据备份与迁移

### 导出备份
- 设置 → 导出备份 (JSON)
- 包含: 歌单/喜欢/配置/缓存索引

### 导入备份
- 设置 → 恢复备份 → 选择JSON文件
- 自动合并到当前配置

### 跨设备迁移
1. 旧设备: 设置 → 导出备份 → 下载JSON
2. 新设备: 设置 → 恢复备份 → 上传JSON
3. 歌单和喜欢歌曲自动恢复

---

## 5. 环境变量完整参考

```bash
# 必填 (Vercel / Supabase 模式)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# 可选
NEXT_PUBLIC_RELEASE_MODE=release    # debug | internal | release
CF_WORKER_URL=                       # Cloudflare Workers URL (hybrid mode)

# 开发 (仅本地)
NEXT_PUBLIC_RELEASE_MODE=debug
```

---

## 6. 长期维护

- 定期备份: 设置 → 导出备份
- 检查健康: /diagnostics → Overview
- Provider 管理: 设置 → 音源优先级
- 缓存清理: 设置 → 清除所有缓存
- 灾难恢复: /diagnostics → Recovery tab (Phase 10)
