# Known Issues

> Phase 8 — 当前已知 Bug 和限制 | 2026-05-24

---

## 已知 Bug

### 音频系统
| # | 描述 | 严重程度 | 状态 |
|---|------|---------|------|
| A1 | 音频 URL 过期后播放静默失败 (PlaybackStabilizer 自动换源) | Low | Mitigated |
| A2 | iOS Safari 首次播放需用户手势 (AudioContext policy) | Medium | Known |
| A3 | 快速切换歌曲时偶发 previous audio 未销毁 | Low | Investigating |

### Provider 系统
| # | 描述 | 严重程度 | 状态 |
|---|------|---------|------|
| P1 | 真实 Provider (netease/qq/kuwo) 使用代理 URL，需要有效 API 端点 | Medium | Blocked |
| P2 | Provider health check 每 30s 探测，首次加载可能略慢 | Low | By Design |

### 搜索系统
| # | 描述 | 严重程度 | 状态 |
|---|------|---------|------|
| S1 | Mock 搜索仅模糊匹配 title/artist/album，不支持拼音 | Low | Known |
| S2 | 搜索结果无分页 (Mock 数据 52 首全返回) | Low | Known |

### 缓存系统
| # | 描述 | 严重程度 | 状态 |
|---|------|---------|------|
| C1 | IndexedDB 在隐私模式下可能不可用 | Low | Graceful fallback |
| C2 | 歌词缓存无自动过期 (usePerformanceCleanup 每 10min 清理 7 天前数据) | Low | Mitigated |

### UI/UX
| # | 描述 | 严重程度 | 状态 |
|---|------|---------|------|
| U1 | iPhone notch 机型顶部 safe-area 适配不完全 | Low | Known |
| U2 | 播放器全屏时页面内容不可滚动 (by design) | Low | By Design |

---

## 架构限制

1. **单个 Audio 实例** — AudioManager 单例，不支持多轨同时播放
2. **Mock 数据为主** — 尚未连接真实数据
3. **PWA 优先** — Capacitor 封装是可选增强，非必需
4. **Private use only** — 不考虑高并发/多用户性能
5. **iPhone portrait** — 横屏适配仅 iPad 预留

---

## 技术债务

| # | 描述 | 优先级 |
|---|------|--------|
| T1 | Phase 1 legacy (AudioEngine/playerStore/useAudio) 保留但未移除 | Low |
| T2 | Mock 数据分散在多个文件 (providers/mock/data.ts + sections) | Low |
| T3 | 部分组件缺少 loading/error/empty 三态处理 | Medium |
| T4 | React Query cache key 硬编码字符串 | Low |
| T5 | 无单元测试 | Medium |
| T6 | 图片无 blur placeholder | Low |

---

## 浏览器兼容

| 浏览器 | 状态 | 备注 |
|--------|------|------|
| iOS Safari 15+ | ✅ Full | PWA + standalone |
| iOS Safari 14 | ⚠ Partial | No PWA install |
| Chrome Android | ✅ Full | PWA install supported |
| Chrome Desktop | ✅ Full | (not target platform) |
| Firefox | ⚠ Untested | |
