# Current Bottlenecks

> Phase 9 — 性能瓶颈与优化方向 | 2026-05-24

---

## 当前瓶颈

### 1. 真实数据缺失 (P0)
- **描述:** 所有搜索/播放使用 MockProvider (52首本地数据)
- **影响:** 应用可用性受限于mock数据
- **方案:** 连接 Supabase 真实数据表，配置真实 API URL

### 2. 无单元测试 (P1)
- **描述:** 0 个测试文件，核心逻辑仅手动验证
- **影响:** 重构风险高，回归难以检测
- **方案:** 添加 vitest + @testing-library/react

### 3. Audio 单例限制 (Low)
- **描述:** AudioManager 是单例，不支持多轨/预加载并行
- **影响:** 快速切歌时可能有短暂静默
- **方案:** 已通过 PlaybackStabilizer URL缓存 + Watchdog stall recovery 缓解

### 4. React Query Cache Key 硬编码 (Low)
- **描述:** React Query key 为字符串字面量，无类型检查
- **影响:** 缓存失效难追踪
- **方案:** 抽取 query key factory

### 5. iOS 首次播放需用户手势 (Medium)
- **描述:** iOS Safari AudioContext policy，首次交互前无法播放
- **影响:** 自动播放被阻止
- **方案:** 已有用户手势后播放的设计，Watchdog 在失败后会重试

---

## 性能基准

| 指标 | 当前值 | 目标 |
|------|--------|------|
| 源文件数 | 166 | — |
| 首次构建时间 | ~7.5s (tsc) + ~15s (next build) | <30s total |
| TTI (估算) | ~100ms (lightweight app) | <500ms |
| 音频加载延迟 | 取决于网络 | <2s (cached) |
| 搜索延迟 | ~100-250ms (mock) | <500ms (real) |
| IndexedDB 容量 | ~50MB (iOS Safari limit) | — |

---

## 内存使用

| 组件 | 估算 |
|------|------|
| 内存缓存 (SearchCache + APICache) | <5MB |
| Audio 实例 (单例) | 取决于音频文件 |
| Zustand Stores (11个) | <1MB |
| React 组件树 | <10MB |
| IndexedDB | <50MB (浏览器限制) |

---

## 优化建议 (按优先级)

### 短期 (P0-P1)
1. 连接 Supabase 真实数据
2. 配置真实 API URL
3. Vercel 部署上线
4. 添加核心路径测试

### 中期 (P2)
5. 实现虚拟列表 (>100首歌单)
6. 代码分割 (dynamic import 大组件)
7. 图片 blur placeholder

### 长期 (P3)
8. Service Worker 预缓存常用资源
9. 音频流式传输 (HLS/DASH)
10. Cloudflare Workers 部署
