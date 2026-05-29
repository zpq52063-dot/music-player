# Technical Debt

> Phase 11 — 自动记录的技术债 | 2026-05-24

---

## 债务分类

| 类型 | 含义 |
|------|------|
| **临时方案** | 为快速实现而选的临时替代，须替换 |
| **高风险模块** | 已知脆弱但不得不保留的代码 |
| **Provider 脆弱点** | 依赖外部API不可控的部分 |
| **缓存风险** | 缓存策略可能有问题的区域 |
| **iOS 兼容** | iOS特定问题 |

---

## 活跃债务

### TD-001: Mock 数据替代 (P0 — 临时方案)

- **描述:** 所有搜索/播放使用 MockProvider (52首本地数据)，非真实音源
- **位置:** `src/music-source/providers/mock/`
- **影响:** 应用数据范围受限于52首歌曲
- **方案:** 
  1. 配置 API Routes 中真实音乐 API URL
  2. 验证 Netease/QQ/Kuwo Provider 可用
  3. 逐步灰度切换到真实 Provider
- **风险:** 真实API可能随时变更接口
- **预计工作量:** 2-3天 (API调试) + 1天 (灰度切换)

### TD-002: 零测试覆盖 (P1 — 高风险模块)

- **描述:** 0 个测试文件，所有核心逻辑仅手动验证
- **位置:** 全项目
- **影响:** 重构风险极高，回归难以检测
- **方案:**
  1. 添加 vitest + @testing-library/react
  2. 优先覆盖: musicPlayerStore, AudioManager, LyricParser, SearchService
  3. 目标: 核心链路 80% 覆盖率
- **预计工作量:** 3-5天

### TD-003: React Query Cache Key 硬编码 (P2 — 临时方案)

- **描述:** React Query key 为字符串字面量，无类型检查，易拼写错误
- **位置:** `src/hooks/useLikedSongs.ts`, `usePlaylist.ts`, `useComments.ts` 等
- **影响:** 缓存失效难追踪，key 不一致导致重复请求
- **方案:** 抽取 query key factory (如 `songKeys`, `playlistKeys`)
- **预计工作量:** 1天

### TD-004: 下载功能仅预留 (P2 — 临时方案)

- **描述:** DownloadManager 接口完整但仅处理元数据，未实现真实离线下载
- **位置:** `src/services/download/DownloadManager.ts`
- **影响:** 离线场景下无法下载歌曲
- **方案:** fetch + IndexedDB 分块存储
- **预计工作量:** 3-4天
- **备注:** Phase 8 设计决策暂不实现

### TD-005: Audio 单例限制 (Low — 高风险模块)

- **描述:** AudioManager 是单例，不支持多轨预加载并行播放
- **位置:** `src/lib/audio/AudioManager.ts`
- **影响:** 快速切歌时可能有短暂静默
- **缓解:** PlaybackStabilizer URL缓存 + Watchdog stall recovery
- **方案:** 双 Audio 实例池 (当前+预加载)
- **风险:** 修改 AudioManager 底层影响播放链路
- **预计工作量:** 2天 + 1周全量测试

### TD-006: Cloudflare Workers 未部署 (P3 — 临时方案)

- **描述:** Workers 目录已预留，代码未完善
- **位置:** `workers/`
- **影响:** API 代理在当前方案中由 Next.js API Routes 承担
- **方案:** 完善 Workers 代码 + wrangler 部署
- **预计工作量:** 1-2天

### TD-007: iPad 横屏未适配 (P3 — iOS 兼容)

- **描述:** 布局仅针对 iPhone 竖屏设计
- **位置:** `src/app/layout.tsx` (max-w-md), `src/app/globals.css`
- **影响:** iPad 上显示为窄条居中
- **方案:** 媒体查询 + 响应式布局 (sm/md/lg breakpoints)
- **预计工作量:** 2-3天

---

## 债务优先级矩阵

| ID | 优先级 | 严重度 | 解决难度 | ROI |
|----|--------|--------|---------|-----|
| TD-001 | P0 | 高 | 中 | 极高 |
| TD-002 | P1 | 中 | 中 | 高 |
| TD-003 | P2 | 低 | 低 | 中 |
| TD-004 | P2 | 低 | 中 | 中 |
| TD-005 | Low | 低 | 高 | 低 |
| TD-006 | P3 | 低 | 低 | 中 |
| TD-007 | P3 | 低 | 中 | 低 |

---

## 清偿建议

1. **立即 (Phase 12):** TD-001 (真实数据) + TD-002 (单元测试基础)
2. **短期 (Phase 13):** TD-003 (query key factory) + TD-006 (Workers)
3. **中期 (Phase 14):** TD-004 (下载) + TD-007 (iPad)
4. **长期:** TD-005 (Audio双实例, 需充分测试)

---

> **本文件由 Phase 11 技术债追踪系统自动生成。** 每次发现新技术债时更新。
> Phase 11 — AI原生最终工程体系 | 2026-05-24
