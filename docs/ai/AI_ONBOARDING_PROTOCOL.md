# AI Onboarding Protocol

> **新 AI 接手 10 步标准操作流程。**
> Phase 11 | 2026-05-24

---

## 核心原则

**在修改任何代码之前，必须完整走完这10个步骤。**

跳过步骤直接编码会导致：
- 破坏已有稳定模块
- 重复已知问题排查
- 引入与现有架构冲突的设计

---

## Step 1: 上下文恢复 (5 分钟)

**按顺序阅读以下文件：**

| 顺序 | 文件 | 内容 | 阅读重点 |
|------|------|------|---------|
| 1 | [AI_PROJECT_INDEX.md](AI_PROJECT_INDEX.md) | 项目全景索引 | §1-4 (摘要/技术栈/架构/目录) |
| 2 | [AI_CONTEXT_RECOVERY.md](../AI_CONTEXT_RECOVERY.md) | 完整上下文 (2015行) | §5 (Store关系图), §6 (播放器架构), §9 (禁止重构) |
| 3 | [PROJECT_RULES.md](../PROJECT_RULES.md) | 开发规则与约束 | 全部 (永久规则 + Phase规则) |
| 4 | [FINAL_PROJECT_STRUCTURE.md](../FINAL_PROJECT_STRUCTURE.md) | 最终目录结构 | 模块依赖图 + 数据流图 |
| 5 | [SYSTEM_HEALTH.md](SYSTEM_HEALTH.md) | 系统健康状态 | 全部 (核心参数 + 单例列表) |
| 6 | [CURRENT_BOTTLENECKS.md](CURRENT_BOTTLENECKS.md) | 性能瓶颈 | 全部 (当前问题 + 优化建议) |
| 7 | [CURRENT_TASK.md](CURRENT_TASK.md) | 当前开发任务 | 全部 |
| 8 | [AUTONOMY_RUNTIME.md](AUTONOMY_RUNTIME.md) | AI自治运行时 | 全部 (Phase 12) |
| 9 | [ECOSYSTEM_ARCHITECTURE.md](ECOSYSTEM_ARCHITECTURE.md) | 生态系统架构 | 全部 (Phase 12) |
| 10 | [DEGRADED_RUNTIME.md](DEGRADED_RUNTIME.md) | 降级运行模式 | 全部 (Phase 12) |

**完成后应能回答：**
- 项目的技术栈是什么？
- 有哪些Store？分别管理什么状态？
- 播放音频的完整链路是怎样的？
- 搜索数据的完整链路是怎样的？
- 哪些文件绝对不能修改？
- 当前有哪些已知问题？

---

## Step 2: 环境验证 (2 分钟)

```bash
# 验证 Node 版本
node --version   # 需要 >= 18

# 安装依赖
cd music-player
npm install

# 构建验证
npm run build    # 必须 0 error

# 检查环境变量
cat .env.local   # NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**如果构建失败：**
1. 检查 Node 版本
2. 检查 .env.local 是否存在
3. 删除 node_modules 重新 `npm install`
4. 检查 TypeScript 版本是否匹配 `^5.7.2`

---

## Step 3: 架构边界理解 (3 分钟)

### 模块分层 (严格单向依赖)

```
types/ (零依赖)
  ↑ 被所有层依赖

stores/ → types/
  ↑ 被 hooks/ 和 components/ 消费

lib/ → types/
  ↑ 被 hooks/ 和 system/ 消费

hooks/ → stores/ + lib/
  ↑ 被 components/ 消费

services/ → lib/supabase/ + types/
  ↑ 被 hooks/ 消费

components/ → hooks/ + stores/ + ui/
  ↑ 被 app/ 消费

system/ → stores/ + lib/ + music-source/  (Phase 9)
  ↑ 被 AudioProvider 挂载

platform/ → stores/ + lib/ + system/  (Phase 10)
  ↑ 被 Settings + Diagnostics 使用
```

### 数据流边界

**播放链路:**
```
UI click → musicPlayerStore.play(song) → useAudioPlayer effect
  → AudioManager.load(url) → AudioManager.play()
  → RAF 200ms throttle → callbacks.onTimeUpdate
  → musicPlayerStore.syncTime(t, d)
```

**搜索链路:**
```
SearchBar → uiStore.toggleSearch() → SearchPage mount
  → useSearch.setQuery(q) → debounce 300ms
  → SearchService.search(q) → Provider.search(q)
  → searchStore.setResults()
```

**绝对不要创建绕过这些链路的捷径。**

---

## Step 4: 禁止触碰清单

### 绝对禁止修改/删除

**Phase 1 legacy (保留不删):**
- `src/lib/audio/AudioEngine.ts`
- `src/stores/playerStore.ts`
- `src/hooks/useAudio.ts`
- `src/types/player.ts`

**UI 基础组件 (零业务依赖):**
- `src/components/ui/GlassCard.tsx`
- `src/components/ui/LazyImage.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/IconButton.tsx`

**Provider 核心 (Fallback 链):**
- `src/music-source/types/provider.ts` (MusicProvider接口)
- `src/music-source/providers/mock/MockProvider.ts` (永久兜底)
- `src/music-source/providers/provider-manager/ProviderManager.ts`
- `src/music-source/providers/provider-manager/HealthTracker.ts`

**恢复系统核心:**
- `src/system/watchdog/PlaybackWatchdog.ts`
- `src/system/recovery/ProviderSelfHealing.ts`
- `src/system/recovery/StartupRecoveryPipeline.ts`
- `src/platform/recovery/DisasterRecovery.ts`
- `src/services/recovery/PlaybackRecoverySystem.ts`
- `src/components/error/ErrorBoundary.tsx`

**基础设施:**
- `src/storage/CacheDB.ts`
- `src/app/globals.css`
- `src/stores/settingsStore.ts`
- `src/app/sw.ts`

**完整清单:** [AI_CONTEXT_RECOVERY.md §9](../AI_CONTEXT_RECOVERY.md#9-当前禁止重构模块) (约150行)

---

## Step 5: 已知问题清单

**不需要重复排查的问题：**

| 问题 | 原因 | 状态 |
|------|------|------|
| 搜索只有52首mock歌曲 | MockProvider 本地数据 | 待真实数据连接 |
| Provider(Netease/QQ/Kuwo)不可用 | API Routes 中真实URL未配置 | 待配置 |
| 离线下载不可用 | DownloadManager 仅预留架构 | Phase 8 设计决策 |
| iOS 首次播放被阻止 | Safari AudioContext 策略 | 需用户手势后触发 |
| Audio 单例限制切歌速度 | AudioManager 设计为单例 | 已被 Watchdog stall recovery 缓解 |
| 无单元测试覆盖 | 开发阶段侧重于功能实现 | 待添加 vitest |

---

## Step 6: 当前开发阶段

**Phase 11 — AI原生最终工程体系**

**已完成 (Phase 1-10):**
- Phase 1-2: 基础框架 + 播放器核心
- Phase 3: 搜索系统 + 音源抽象层
- Phase 4: 用户系统 + 收藏 + 歌单
- Phase 5: 评论系统 + 社交互动
- Phase 6: PWA增强 + 离线能力
- Phase 7: 真实音源接入 + Provider管理 + API代理
- Phase 8: iOS封装 + 崩溃保护 + 设置页
- Phase 9: 系统稳定化 + 自动运维 (Watchdog/SelfHealing/CacheGovernance/Telemetry)
- Phase 10: 平台化 + 自托管 (RuntimeConfig/Backup/Migration/DisasterRecovery)

**Phase 11 (当前) 目标:**
- AI工程索引系统 (AI_PROJECT_INDEX.md)
- AI接手协议 (AI_ONBOARDING_PROTOCOL.md)
- 自动诊断系统 (AutoDiagnostics)
- 架构快照系统 (ArchitectureSnapshotManager)
- 运行时治理 (RuntimeGovernanceManager)
- 技术债追踪 (TECHNICAL_DEBT.md)
- Provider风险分析 (PROVIDER_RISK_ANALYSIS.md)
- AI恢复引导 (AI_RECOVERY_BOOTSTRAP.md)
- 项目治理 (PROJECT_GOVERNANCE.md)
- 长期演进路线 (LONG_TERM_EVOLUTION.md)
- 部署快照 (DEPLOYMENT_SNAPSHOT.md)
- 维护模式 (MaintenanceMode)

**Phase 12 (已完成) 目标:**
- 本地音源扩展架构 (LocalMediaProvider + Lyric + Cover)
- WebDAV/NAS Provider 预留
- 媒体扫描系统 (MediaScanner)
- AI自治维护体系 (AIAutonomyManager)
- 自动治理管道 (GovernancePipeline)
- 降级运行模式 (DegradedRuntimeMode)
- 运行时模式配置 (RuntimeProfiles)
- 项目封存系统 (ProjectArchiveSystem)
- 系统状态页 (SystemStatusPage)
- 6份生态系统AI文档

---

## Step 7: 可安全修改区域

**以下是当前可以新增/修改的文件：**

| 区域 | 操作 | 约束 |
|------|------|------|
| `docs/ai/` | 新增/更新文档 | 不删除已有文档 |
| `docs/ai/runtime/` | 全部 | Phase 11 新建 |
| `src/system/auto-diagnostics/` | 新建 | Phase 11 新模块 |
| `src/system/snapshot/` | 新建 | Phase 11 新模块 |
| `src/system/governance/` | 新建 | Phase 11 新模块 |
| `src/types/phase11.ts` | 新建 | Phase 11 新类型 |
| `src/stores/` (所有) | 扩展字段/actions | 不修改已有API签名 |
| `src/components/` (所有) | 新增UI/调整外观 | 不修改核心交互逻辑 |
| `src/music-source/providers/` | 新增Provider | 不改接口 |

---

## Step 8: 调试与诊断

### 启动开发服务器

```bash
cd music-player
npm run dev          # http://localhost:3000
```

### 系统诊断

```
/diagnostics   → 系统诊断中心 (debug/internal模式)
Settings       → 音源优先级/缓存策略/Debug开关
```

### 关键调试入口

| 入口 | 访问方式 | 内容 |
|------|---------|------|
| DebugOverlay | 开发环境右下角浮层 | 实时播放器/Audio/Provider状态 |
| Console Logger | F12 → Console | Logger分类日志 |
| Telemetry | `/diagnostics` → Telemetry tab | 指标面板 |
| Provider 状态 | `/diagnostics` → Provider tab | 健康/延迟评分 |
| 缓存状态 | `/diagnostics` → Cache tab | 三层缓存统计 |

---

## Step 9: 部署方式

### 当前部署状态

| 服务 | 状态 | 操作 |
|------|------|------|
| Vercel | 待部署 | `vercel --prod` |
| Supabase | Schema ready | 运行 migrations |
| Cloudflare Workers | 架构预留 | 待完善部署 |
| Capacitor iOS | 配置完成 | 需 macOS + Xcode |

### 发布前检查

```bash
npm run build       # 必须 0 error
npm run lint        # 必须 0 error
npm run format      # Prettier 检查
```

完整检查清单: `release/RELEASE_CHECKLIST.md`

---

## Step 10: 恢复方式

### 自动恢复 (无需人工)

```
PlaybackWatchdog → 2s检测 → resume/reload/skip
ProviderSelfHealing → 评分→降级→恢复探测(30s)
```

### 手动恢复

| 级别 | 触发 | 恢复内容 |
|------|------|---------|
| Quick | Settings → 恢复 | RuntimeConfig + Provider |
| Full | Settings → 恢复 | 上 + 数据(IndexedDB) |
| Nuclear | Settings → 恢复 | 全部重置 (保留auth) |

### AI上下文恢复

如果AI本身完全失忆，按以下顺序：

1. 读 `docs/ai/AI_PROJECT_INDEX.md` (项目全景)
2. 读 `docs/ai/AI_ONBOARDING_PROTOCOL.md` (本文 — 10步SOP)
3. 读 `docs/AI_CONTEXT_RECOVERY.md` (完整上下文)
4. 读 `docs/ai/AI_RECOVERY_BOOTSTRAP.md` (灾难级恢复方案)
5. 运行 `npm run build` 验证环境
6. 运行 `npm run dev` 启动应用
7. 访问 `/diagnostics` 获取系统健康状态
8. 开始开发

---

## 关键全局单例

| 单例 | 获取方式 | 文件 |
|------|---------|------|
| AudioManager | `getAudioManager()` | `src/lib/audio/AudioManager.ts` |
| SearchCache | `getSearchCache()` | `src/music-source/cache/SearchCache.ts` |
| ProviderManager | `getProviderManager()` | `.../provider-manager/ProviderManager.ts` |
| PlaybackWatchdog | `getPlaybackWatchdog()` | `src/system/watchdog/PlaybackWatchdog.ts` |
| ProviderSelfHealing | `getProviderSelfHealing()` | `src/system/recovery/ProviderSelfHealing.ts` |
| CacheGovernance | `getCacheGovernance()` | `src/system/cleanup/CacheGovernance.ts` |
| TelemetryService | `getTelemetryService()` | `src/system/telemetry/TelemetryService.ts` |
| RuntimeConfigManager | `getRuntimeConfigManager()` | `src/platform/config/RuntimeConfigManager.ts` |
| ProviderHotReload | `getProviderHotReload()` | `src/platform/update/ProviderHotReload.ts` |
| BackupManager | `getBackupManager()` | `src/platform/backup/BackupManager.ts` |
| DisasterRecovery | `getDisasterRecovery()` | `src/platform/recovery/DisasterRecovery.ts` |

---

## 沟通协议

- 使用**简体中文**
- 每次声明**将修改/新增哪些文件**
- 完成后列出**变更清单**
- 架构变更前先列出**影响范围、破坏性变更、回滚方案**

---

> **本文是新AI接手项目的唯一SOP。严格遵循，切勿跳过步骤。**
> Phase 11 — AI原生最终工程体系 | 2026-05-24
