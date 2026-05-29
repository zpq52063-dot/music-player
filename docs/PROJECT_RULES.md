# Project Rules

> **AI 协同开发中心：[docs/AI_CONTEXT_RECOVERY.md](AI_CONTEXT_RECOVERY.md)**
> 新 AI 接手时请先阅读该文件。

---

## 永久开发规则

1. **模块化开发** — 每次只开发一个阶段（Phase），不允许一次生成整个项目
2. **文档驱动** — 每次代码变更后必须同步更新 docs/ 下的所有文档
3. **类型统一** — 所有类型定义在 `src/types/`，模块引用统一从 `index.ts` 导入
4. **状态集中** — Zustand stores 在 `src/stores/`，类型（interface）与实现（create）分离
5. **低耦合** — 组件按功能域划分：`layout/` / `player/` / `home/` / `ui/`
6. **不重复生成** — 已有模块只修改不重建
7. **不覆盖旧模块** — 新功能添加新文件，不影响已有模块
8. **代码优先** — 文档反映代码状态，有疑问时以实际代码为准

---

## 代码规范

### TypeScript
- strict mode (`strict: true`)
- `noUncheckedIndexedAccess: true` — 数组/对象访问必须处理 undefined
- `noUnusedLocals: true`, `noUnusedParameters: true` (argsIgnorePattern: `^_`)
- 禁止 `any` 类型（eslint: `no-explicit-any: error`）
- 路径别名统一使用 `@/*` → `./src/*`

### 命名约定
| 类型 | 规则 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `PlayerBar.tsx` |
| Hook 文件 | `use` 前缀 | `useAudioPlayer.ts` |
| Store 文件 | `Store` 后缀 | `musicPlayerStore.ts` |
| Service 文件 | `Service` 后缀 | `songService.ts` |
| 类型文件 | 小写 | `song.ts`, `music.ts` |
| 目录 | 小写 | `player/`, `home/`, `ui/` |

### 组件约定
- `"use client"` 只在需要浏览器 API（hooks, events, state）时添加
- Server Component 用于数据获取和静态渲染
- Client Component 用于交互和状态
- `forwardRef` 用于需要 ref 的 UI 基础组件
- `displayName` 明确设置在 forwardRef 组件上
- Props interface 定义在组件文件内（不单独导出到 types/）

### Store 约定
- 类型 interface 在 `types/` 中定义
- 实现在 `stores/` 中使用 `create()` 
- Action 内部使用 `get()` 获取实时状态（而非闭包 state）
- 导出 hook 函数（`useXxxStore`），不直接导出 store 对象
- 新 Store 不要添加到 `stores/index.ts`（那是 Phase 1 的导出）

### Hooks 约定
- 逻辑与 UI 分离：hooks 返回数据 + actions，组件只渲染
- `useCallback` 用于传给子组件的回调函数（保证引用稳定）
- `useEffect` 依赖数组遵循 `react-hooks/exhaustive-deps` 意图

### 样式约定
- TailwindCSS utility-first
- 自定义复用样式在 `globals.css` 的 `@layer components` 中定义
- 使用 `cn()` 函数（clsx + tailwind-merge）组合动态类名
- 颜色必须使用 tailwind.config.ts 中定义的 token（如 `text-text-primary`）

---

## Phase 2 架构规则

- **AudioManager** 是唯一音频实例（单例），不允许创建多个 Audio 对象
- **musicPlayerStore** 是 Phase 2+ 的播放器状态唯一来源
- **playerStore** (Phase 1) 保留但不新增引用
- **AudioEngine** (Phase 1) 保留但不被新代码使用
- 新 hooks 走 `musicPlayerStore → AudioManager` 链路
- 播放控制 hooks (`usePlayerControls`) 返回稳定引用（useCallback）
- 歌词通过 `LyricParser` 解析，`currentLyricIndex` 由 `useLyricsSync` 维护
- UI 与逻辑分离：hooks 返回数据 + actions，组件只渲染

---

## Phase 3 架构规则

- **Provider Adapter Architecture** — 所有数据请求必须通过 Provider 层，绝对禁止组件直接 fetch
- **MusicProvider interface** — 所有 Provider 必须实现统一接口（search/getSongDetail/getPlayUrl/getLyrics/getPlaylist/getArtist）
- **SearchService** — 统一数据入口，管理缓存 + 请求去重 + fallback
- **UI 不直接调 Provider** — 组件通过 hooks → SearchService → Provider 链路获取数据
- **Mock Provider** — 开发和 UI 联调使用，不连接真实 API
- **Provider 切换** — 只需修改 useMusicProvider 中的实例化，UI 零感知
- **新 Provider 添加规则** — 在 providers/ 下创建新目录，实现 MusicProvider 接口，注册到 providers/index.ts
- **searchStore** — 独立的 Zustand store，不修改 musicPlayerStore 或 uiStore
- **搜索缓存** — SearchCache 按类型设置 staleTime/gcTime，请求自动去重
- **搜索 UI** — 复用现有 SongRow 组件，不重复实现歌曲行

---

## 技术栈版本（不可随意升级）

| 依赖 | 版本 | 说明 |
|------|------|------|
| next | ^15.1.4 | App Router |
| react / react-dom | ^19.0.0 | |
| typescript | ^5.7.2 | strict |
| tailwindcss | ^3.4.17 | v3 不是 v4 |
| zustand | ^5.0.3 | |
| @supabase/supabase-js | ^2.47.10 | |
| @supabase/ssr | ^0.5.2 | |
| @serwist/next | ^9.0.10 | |
| serwist | ^9.0.10 | |
| @tabler/icons-react | ^3.28.1 | |
| clsx | ^2.1.1 | |
| tailwind-merge | ^2.6.0 | |

---

## 目录约定

| 目录 | 用途 | 依赖规则 |
|------|------|---------|
| `src/types/` | 所有类型定义 | 零依赖（纯类型） |
| `src/stores/` | Zustand stores | 依赖 types/ |
| `src/hooks/` | 自定义 hooks | 依赖 stores/, lib/ |
| `src/lib/audio/` | 音频引擎 | 依赖 types/ (AudioEventCallbacks) |
| `src/lib/lyrics/` | 歌词解析 | 依赖 types/ (LyricLine) |
| `src/lib/supabase/` | Supabase 客户端 | 依赖 @supabase |
| `src/components/ui/` | 通用 UI 组件 | **零业务依赖** — 禁止修改 |
| `src/components/player/` | 播放器组件 | 依赖 ui/, stores/ |
| `src/components/home/` | 首页组件 | 依赖 ui/, stores/ |
| `src/components/comments/` | 评论组件 | 依赖 ui/, hooks/ |
| `src/components/layout/` | 布局组件 | 依赖 player/, hooks/ |
| `src/services/` | 数据服务 | 依赖 lib/supabase/, types/ |
| `src/services/social/` | 社交服务 | 依赖 lib/supabase/, types/ |
| `src/music-source/types/` | Provider 类型 | 零依赖（纯类型） |
| `src/music-source/providers/` | 音源 Provider 实现 | 依赖 types/, 实现 MusicProvider |
| `src/music-source/cache/` | 缓存层 | 零业务依赖 |
| `src/music-source/services/` | 音源服务 | 依赖 providers/, cache/ |
| `src/music-source/hooks/` | 音源 hooks | 依赖 services/, stores/ |
| `src/music-source/core/` | 单例访问入口 | 依赖 hooks/ |
| `src/app/` | Next.js App Router | 依赖 components/, hooks/ |
| `docs/` | 项目文档 | 不可删除 |
| `docs/ai/` | AI 协同开发中心 | 包含核心恢复文件 |

---

## 禁止事项

- 不允许删除 Phase 1 legacy 文件
- 不允许修改 `components/ui/` 基础组件的接口/行为
- 不允许修改 `globals.css` 中的样式体系
- 不允许使用 `any` 类型
- 不允许创建多个 Audio 实例
- 不允许引入未经讨论的新依赖
- 不允许跳过文档更新
- 不允许循环依赖
- 不允许将 Server Component 标记为 `"use client"`（除非确实需要浏览器 API）
- 不允许在组件中直接 fetch 或调用 Provider API（必须通过 hooks → SearchService 链路）
- 不允许修改 MusicProvider 接口（破坏性变更影响所有 Provider）
- 不允许创建新的数据获取路径（SearchService 是唯一入口）

---

## Phase 4 架构规则

- **React Query 管理所有服务端状态** — liked songs, playlists, recent plays, favorites 全部通过 useQuery/useMutation
- **Zustand 管理客户端状态** — userStore (认证), libraryStore (乐观更新), playlistStore (UI modals)
- **AuthProvider 是最外层 Client Provider** — 包裹 AudioProvider，管理 React Query + Auth 初始化
- **匿名登录是唯一入口** — 应用启动时自动 signInAnonymously()，无用户感知
- **所有数据操作通过 Services** — hooks → services → Supabase，services 内部使用 createClient()
- **乐观更新三步骤** — onMutate (zustand optimistic) → mutationFn (Supabase) → onError (rollback) / onSettled (invalidate)
- **RLS 保证数据隔离** — 所有表 RLS 策略: `USING (auth.uid() = user_id)`
- **userStore 不持久化** — Supabase SDK 自行管理 session localStorage
- **禁止在组件中直接调 Supabase** — 必须通过 services 层
- **禁止创建绕过 React Query 的数据流**
- **禁止修改 userStore 的 API 签名** — setUser/clearAuth/setLoading
- **禁止删除 recently_played 或 favorite_playlists 表**
- **libraryStore 仅存 ID 集合** — 完整数据由 React Query cache 管理

---

## Phase 5 架构规则

- **评论数据所有查询走 services/social/** — 禁止组件直接调用 supabase.from("song_comments") ...
- **评论分页使用 cursor-based pagination** — commentService.getComments(cursor?) + React Query useInfiniteQuery
- **评论点赞使用 RPC 原子更新** — increment_comment_likes / decrement_comment_likes 保证 like_count 一致性
- **评论缓存按排序类型分 key** — ['comments', songId, 'hot'] vs ['comments', songId, 'newest']
- **回复懒加载** — 仅在展开时才请求 replies (enabled: !!activeReplyId)
- **socialStore 管理 UI 状态** — 不存数据，只存排序偏好/当前歌曲/活跃回复ID
- **SongDetailPage 是 Client Component** — 歌曲详情需交互（播放/喜欢/评论），非静态页面
- **PlaylistDetailPage 已增强** — bg blur + 大封面 + 描述 + 收藏/删除
- **CommentCard 复用 LazyImage + IconButton** — 不重复实现头像/按钮
- **CommentInput 16px font** — 防止 iOS Safari 输入缩放
- **禁止新建 social service 之外的评论数据通路**
- **禁止修改 commentService cursor pagination 签名**

---

## Phase 6 架构规则

- **IndexedDB 仅存储元数据** — 音频/图片文件由 Cache API (Service Worker) 管理
- **CacheDB 是唯一 IndexedDB 入口** — 所有 Object Store 操作通过 CacheDB.ts 封装
- **systemStore 管理客户端系统状态** — 不存业务数据，只存 network/install/cache 元状态
- **Service Worker 分层缓存策略** — static(CacheFirst), images(StaleWhileRevalidate), api(NetworkFirst)
- **Media Session 用 musicPlayerStore** — 不再使用 Phase 1 playerStore，positionState 2s 定时更新
- **useAudioCache 在 AudioProvider 中挂载** — 自动缓存当前歌曲 + 队列预加载 2 首
- **InstallDetector 是最外层 Client 组件** — 包裹 AudioProvider，挂载 usePWAInstall/useNetworkState/useOfflineCache
- **禁止跳过音频预加载队列** — audioCacheService.MAX_CONCURRENT=1, 避免多个 Audio 实例
- **禁止在 Service Worker 中缓存音频** — 音频文件太大，应在 IndexedDB 中分块存储
- **禁止修改 CacheDB 的 schema** — 如需新 Object Store, 更新 DB_VERSION + STORES 数组

---

## Phase 7 架构规则

- **Provider Adapter Architecture 不变** — 所有数据请求继续通过 Provider 层，绝对禁止组件直接 fetch
- **ProviderManager 是唯一 Provider 管理器** — 所有 Provider 注册/切换/降级/健康检测通过 ProviderManager 单例
- **BaseProxyProvider 是真实 Provider 的基类** — 所有请求通过 `/api/music/*` 代理路由
- **MockProvider 是永久兜底** — 不可删除，始终注册在 ProviderManager 中，优先级最低
- **API Routes 是安全边界** — 不暴露真实 API 地址，所有外部请求服务端完成
- **健康检测自动恢复** — 不健康 Provider 每 30s 探测一次，连续 2 次成功后恢复
- **Fallback 链: netease → qq → kuwo → mock** — 自动降级，无需用户干预
- **providerStore 管理 Provider UI 状态** — 不存业务数据，只存 provider/health/fallback 状态
- **PlaybackStabilizer 管理播放 URL 缓存** — URL TTL 10min，失败自动换源
- **APICache 增强 SearchCache** — 支持 SWR (stale-while-revalidate) + 分组 TTL
- **禁止绕过 ProviderManager 直接调用 Provider** — 所有请求通过 manager.execute() 或 useMusicSource
- **禁止删除 workers/ 目录** — Cloudflare Workers 架构已预留
- **禁止修改 ProviderManager fallback 优先级链**
- **禁止修改 MusicProvider 接口** — 破坏性变更影响所有 Provider 实现

---

## Phase 8 架构规则

- **PlaybackRecoverySystem 是唯一的播放状态恢复入口** — 所有持久化恢复通过 PlaybackRecoverySystem.saveState/restoreState
- **ErrorBoundary 包裹关键组件** — AudioErrorBoundary 覆盖音频区域，ProviderErrorBoundary 覆盖 Provider 区域
- **Logger 仅用于开发调试** — 生产环境默认关闭，通过 Debug Mode 开启
- **settingsStore 持久化到 localStorage** — audioQuality/autoCache/debugMode/providerPriority 设置项自动同步
- **MobileNav 最多 4 个 tab** — 当前: 发现/我的/设置，保持简洁
- **移动端封装 (Capacitor) 是可选的增强** — PWA 是核心使用方式，Capacitor 仅作 TestFlight 分发
- **DownloadManager 预留接口完整但仅处理元数据** — 当前不实现大量离线文件下载
- **usePerformanceCleanup 做定期 GC** — 每 10min 清理过期歌词 (>7天) 和历史 (>500条)
- **AI 维护体系文档 (docs/ai/) 是长期关键** — 每次代码变更必须同步更新这些文件
- **部署文档 (docs/deployment/) 覆盖所有部署场景** — Vercel/Supabase/Capacitor/TestFlight
- **禁止删除 mobile/ 目录** — Capacitor 封装是 iOS 分发的唯一通道
- **禁止修改 ErrorBoundary 的 auto-retry 逻辑** — 5s auto-retry + 3次后建议刷新
- **禁止跳过 docs/ai/ 文档更新** — AI 协同开发的唯一上下文入口

---

## 开发流程

```
1. 阅读 docs/AI_CONTEXT_RECOVERY.md 恢复上下文
2. 阅读其他 4 份 docs 了解状态/架构/依赖/规则
3. 浏览 src/ 目录确认当前代码
4. 声明将修改/新增哪些文件
5. 实现功能
6. 运行 npm run build 确认零 error
7. 更新所有 docs/ 文件
8. 列出变更清单
```

---

> **最后更新：** 2026-05-24 | Phase 8 最终产品化完成
