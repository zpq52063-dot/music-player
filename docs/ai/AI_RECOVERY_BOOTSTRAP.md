# AI Recovery Bootstrap

> **灾难级恢复方案** — 当AI完全失忆、文档损坏、Provider大量失效、部署丢失时使用。
> Phase 11 | 2026-05-24

---

## 前提条件

本文假设最坏场景：

- ❌ AI 上下文完全丢失 (从未见过此项目)
- ❌ 部分文档损坏或丢失
- ❌ 多个 Provider 失效
- ❌ 部署 (Vercel/Supabase) 状态未知
- ❌ 用户无法正常使用应用

**你唯一拥有的:** 这个 git 仓库的代码文件。

---

## Phase 1: 紧急评估 (5 分钟)

### Step 1.1: 确认仓库完整性

```bash
cd music-player
git status                     # 检查未提交的更改
git log --oneline -10          # 查看最近提交
find src -name "*.ts" -o -name "*.tsx" | wc -l  # 统计源文件数 (应为 ~170+)
```

### Step 1.2: 确认核心模块存在

```bash
# 这些文件必须存在，否则项目不完整
ls src/lib/audio/AudioManager.ts          # 音频核心
ls src/stores/musicPlayerStore.ts          # 播放器状态核心
ls src/music-source/types/provider.ts      # Provider 接口
ls src/music-source/providers/mock/MockProvider.ts  # 永远兜底
ls src/system/watchdog/PlaybackWatchdog.ts           # 自动恢复
ls src/platform/recovery/DisasterRecovery.ts         # 灾难恢复
```

### Step 1.3: 尝试构建

```bash
npm install
npm run build 2>&1 | tail -20   # 看是否有构建错误
```

**如果构建失败：**
- 检查 Node 版本 ≥ 18
- 检查 `.env.local` 是否存在
- `rm -rf node_modules && npm install`

---

## Phase 2: 上下文恢复 (10 分钟)

### Step 2.1: 按顺序阅读文档

按优先级阅读 (如果文件存在):

| 优先级 | 文件 | 如果缺失 |
|--------|------|---------|
| 1 | `docs/ai/AI_PROJECT_INDEX.md` | 跳到 Step 2.2 |
| 2 | `docs/ai/AI_ONBOARDING_PROTOCOL.md` | 跳到 Step 2.2 |
| 3 | `docs/AI_CONTEXT_RECOVERY.md` | 从代码推断 |
| 4 | `docs/PROJECT_RULES.md` | 可跳过 |
| 5 | `docs/FINAL_PROJECT_STRUCTURE.md` | 从目录树推断 |

### Step 2.2: 如果核心文档全部丢失

从代码本身恢复理解：

```bash
# 了解项目结构
find src -type f -name "*.ts" -o -name "*.tsx" | head -50

# 了解技术栈
cat package.json | grep -E '"next"|"react"|"zustand"|"supabase"|"tailwindcss"'

# 了解 Store 架构
ls src/stores/

# 了解组件架构
ls src/components/
```

**核心理解：**
- 这是一个 Next.js 15 + React 19 移动端音乐播放器 PWA
- 状态管理用 Zustand (12个Store)
- 音源通过 Provider 抽象层 (netease → qq → kuwo → mock fallback)
- 部署在 Vercel + Supabase
- 有 3 层自动恢复系统 (Watchdog + SelfHealing + DisasterRecovery)

---

## Phase 3: 恢复播放能力 (最高优先级)

### Step 3.1: 确保 MockProvider 可用

MockProvider 是永远兜底的音源，必须保证可用：

```bash
# 验证 MockProvider 存在
cat src/music-source/providers/mock/MockProvider.ts | head -20
```

**如果 MockProvider 被误删：**
从 `src/music-source/providers/mock/data.ts` 的 mock 数据重建。

### Step 3.2: 启动开发服务器验证

```bash
npm run dev
# 访问 http://localhost:3000
# 验证: 首页加载 → 点击歌曲 → 播放 → 搜索
```

### Step 3.3: 如果播放不工作

按顺序排查：
1. 打开 DevTools Console 查看错误
2. 访问 `/diagnostics` → Provider tab 查看 Provider 状态
3. 检查 `localStorage` 中 `music_runtime_config` 是否有损坏
4. 清除 `localStorage` 重启 (Settings → 核选项重置)

---

## Phase 4: 恢复部署

### Step 4.1: Vercel

```bash
npx vercel --prod
# 或检查 Vercel Dashboard 确认当前部署状态
```

### Step 4.2: Supabase

```bash
# 运行迁移
npx supabase db push
# 或手动执行 supabase/migrations/ 下的 SQL 文件
```

### Step 4.3: 环境变量验证

确保以下变量在 Vercel 中配置：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_RELEASE_MODE=release
```

---

## Phase 5: 恢复 Provider

### Step 5.1: 诊断 Provider 状态

```bash
# 有运行时诊断
访问 /diagnostics → Provider tab

# 无运行时诊断
cat src/music-source/providers/provider-manager/ProviderManager.ts
cat src/music-source/providers/provider-manager/HealthTracker.ts
```

### Step 5.2: Provider 全部失效时的操作

**临时方案:** 强制使用 MockProvider

通过 `localStorage` 设置：
```js
localStorage.setItem('music_runtime_config', JSON.stringify({
  providers: {
    netease: { enabled: false },
    qq: { enabled: false },
    kuwo: { enabled: false },
    mock: { enabled: true, priority: 0 }
  }
}));
location.reload();
```

### Step 5.3: 修复真实 Provider

检查 `src/server/api/` 下的 API Routes 中配置的真实 API URL。

---

## Phase 6: 恢复数据

### Step 6.1: 检查 IndexedDB

```js
// 浏览器 Console
indexedDB.databases().then(console.log);
// 应看到 "music-player-cache"
```

### Step 6.2: 恢复备份

如果有备份文件，通过 Settings → 恢复备份 导入 JSON。

### Step 6.3: IndexedDB 损坏

通过 Settings → 核选项重置 → 清除所有 IndexedDB。

---

## Phase 7: 项目重建指引

如果以上全部失败，你需要从零重建项目理解：

### 7.1 核心架构理解

```
UI(React) → Hooks → Services → Supabase
                  ↘ Stores (Zustand)

搜索: UI → useSearch → SearchService → Provider → API Route → 外部API
播放: UI → musicPlayerStore → useAudioPlayer → AudioManager → HTML5 Audio
恢复: Watchdog(自动) + SelfHealing(Provider) + DisasterRecovery(手动)
```

### 7.2 禁止修改清单 (从代码推断)

- `src/components/ui/` — 基础组件 (所有其他组件依赖)
- `src/music-source/types/provider.ts` — 接口定义 (所有 Provider 依赖)
- `src/music-source/providers/mock/` — 永久兜底数据
- `src/system/` — 系统稳定层
- `src/platform/` — 平台运维层

### 7.3 最小可行修改

只改这些文件通常是安全的：
- `docs/` — 文档
- `public/` — 静态资源
- `.env.local` — 环境变量

---

## Phase 8: AI 自我修复检查清单

- [ ] 仓库完整 (git status 无异常)
- [ ] 核心文件存在 (AudioManager, MockProvider, Watchdog)
- [ ] `npm run build` 0 error
- [ ] `npm run dev` 可启动
- [ ] 首页可访问
- [ ] 搜索可用
- [ ] 播放可用
- [ ] Provider fallback 链完整
- [ ] 诊断页面可访问
- [ ] 恢复检查点已创建

---

## 关键命令速查

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run lint         # ESLint 检查
npx vercel --prod    # 部署到 Vercel
npx supabase db push # 推送数据库迁移
```

---

> **这是最后的恢复手段。** 如果连这个文件都不存在，请阅读 `AI_ONBOARDING_PROTOCOL.md` 的 Phase 2 步骤。
> Phase 11 — AI原生最终工程体系 | 2026-05-24
