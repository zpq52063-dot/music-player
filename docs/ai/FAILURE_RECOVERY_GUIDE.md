# Failure Recovery Guide

> Phase 9 — 故障恢复指南 | 2026-05-24

---

## 故障分类与恢复

### 1. 播放卡死 (Playback Stall)

**症状:** 歌曲停止，currentTime 不动，但状态为 playing

**自动恢复:**
1. Watchdog 检测: currentTime 5s 无变化
2. 尝试 resume() 恢复
3. 3次resume失败 → reload (销毁Audio，重新load)
4. 仍失败 → skip_to_next (跳到下一首)

**手动恢复:**
- 点击下一首按钮
- 在 Diagnostics → 查看 Watchdog Events

---

### 2. 播放加载超时

**症状:** loading 状态持续 > 30s

**自动恢复:**
1. Watchdog 检测: loading > 30s
2. 触发 reload → 销毁当前 Audio → 重新 load
3. 仍失败 → skip_to_next

**手动恢复:**
- 重新点击歌曲播放
- 切换歌曲

---

### 3. 音频 URL 无效/过期

**症状:** Audio error, loadingState = "error"

**自动恢复:**
1. Watchdog 检测: audio_error
2. PlaybackStabilizer: 尝试换源 (通过 Provider 重新获取 URL)
3. Provider fallback: netease → qq → kuwo → mock

**手动恢复:**
- 等待 Watchdog 自动处理
- 或手动切换歌曲

---

### 4. Provider 失效

**症状:** 搜索/获取播放URL全部失败

**自动恢复:**
1. ProviderSelfHealingSystem: 检测连续失败
2. 连续3次失败 → 自动降级 → 冷却5分钟
3. ProviderManager: 自动 fallback 到下一个
4. 每30s探测恢复 → 连续2次成功 → 自动切回

**手动恢复:**
- 在设置页重置 Provider 优先级
- /diagnostics → Provider tab 查看评分

---

### 5. IndexedDB 不可用

**症状:** 歌词缓存/元数据缓存写入失败

**自动恢复:**
- 隐私模式/存储满 → 静默降级
- 所有缓存读取有 fallback (直接请求网络)
- CacheGovernanceSystem 定期清理过期数据

**手动恢复:**
- 设置 → 清除所有缓存
- /diagnostics → Cache tab → Force Cache Cleanup

---

### 6. 应用崩溃

**症状:** React Error Boundary 捕获

**自动恢复:**
1. ErrorBoundary: 显示"出错了"UI
2. 5s 后自动重试 (最多3次)
3. 3次后建议刷新页面
4. beforeunload 紧急保存播放状态

**手动恢复:**
- 点击"重试"按钮
- 刷新页面 (indexedDB + localStorage 数据仍在)
- 启动恢复: StartupRecoveryPipeline 恢复音量/模式/队列

---

### 7. 网络离线

**症状:** navigator.onLine = false

**自动恢复:**
- 已缓存歌曲可继续播放
- 已缓存歌词从 IndexedDB 加载
- 搜索/评论/喜欢 不可用

**手动恢复:**
- 连接网络
- systemStore 自动检测 online 事件

---

## 恢复优先级

| 故障 | 自动恢复 | 成功率 | Watchdog | 用户干预 |
|------|---------|--------|----------|---------|
| 播放卡死 | ✅ resume→reload→skip | 高 | ✅ | 可手动跳过 |
| 加载超时 | ✅ reload→skip | 中 | ✅ | 可重新播放 |
| URL过期 | ✅ url_swap | 高 | ✅ | 无需 |
| Provider失效 | ✅ fallback→探测恢复 | 高 | — | 可设置中调整 |
| IndexedDB故障 | ✅ 静默降级 | 高 | — | 可清理缓存 |
| 应用崩溃 | ✅ ErrorBoundary+auto-retry | 中 | — | 刷新页面 |
| 网络离线 | ✅ 读缓存 | 中 | — | 连接网络 |

---

## 诊断命令

在浏览器 Console 中:

```javascript
// 查看看门狗状态
const { getPlaybackWatchdog } = await import("/_next/static/chunks/...");
// 或: 在 /diagnostics 页面查看

// 查看所有 Provider 评分
// /diagnostics → Provider tab

// 查看遥测数据
// /diagnostics → Cache tab → Export Telemetry JSON

// 查看日志
// /diagnostics → Logs tab (需 debug mode ON)
```

---

## 紧急操作

1. **强制刷新:** Ctrl+Shift+R (清除SW缓存重新加载)
2. **清除所有数据:** 设置 → 清除所有缓存
3. **重置Provider:** /diagnostics → Provider tab (暂无UI，restart app)
4. **导出诊断数据:** /diagnostics → Export Telemetry JSON
