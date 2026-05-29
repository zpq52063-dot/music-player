# Debug Guide

> Phase 9 — 开发调试指南 | 2026-05-24

---

## 快速启动

```bash
cd music-player
npm run dev        # 开发服务器 (localhost:3000)
npm run build      # 生产构建
npm run lint       # ESLint 检查
npx tsc --noEmit   # 类型检查
```

---

## Debug 模式启用

1. 设置 → Debug Mode → ON
2. 或在 .env.local 设置 `NEXT_PUBLIC_RELEASE_MODE=debug`
3. 或 Ctrl+Shift+D 快捷键在浏览器中切换 Debug Overlay

---

## Debug Overlay

**唤出方式:**
- 移动端: 三指双击屏幕
- 桌面端: Ctrl+Shift+D
- 右下角: 点击半透明 "Debug" 标签

**显示内容:**
- 当前 Provider
- Audio 播放/暂停/加载状态
- 播放位置
- 缓存命中率
- Provider 评分
- 卡顿/恢复次数
- Memory 使用量
- Provider 请求计数

**快捷操作:**
- "Full Diagnostics" → 打开完整诊断页面

---

## Diagnostics Center

访问: `/diagnostics`

**5 个Tab:**

### 总览 (Overview)
- Watchdog 运行状态/恢复次数/卡顿计数
- Audio 当前状态/歌曲/进度/缓冲/音量
- Provider 当前/状态/降级原因
- Network & System 网络/Debug/队列/模式
- Telemetry 播放/卡顿/错误/WD恢复/TTI

### Provider
- 评分可视化 (进度条 + 分数)
- 原始健康数据 (successRate/avgLatency/consecutiveFailures)
- Fallback 链路 (优先级列表 + 当前激活标记)

### 播放 (Playback)
- 完整播放状态 (歌曲/艺术家/专辑/进度/缓冲/音量/模式)
- 队列 (所有歌曲 + 当前索引高亮)
- Watchdog 事件日志 (最近10条)

### 缓存 (Cache)
- 最近一次清理结果
- 缓存命中率 (Memory/IndexedDB/SW)
- 强制清理按钮
- 导出遥测 JSON 按钮

### 日志 (Logs)
- Logger buffer 实时查看
- 按级别颜色编码 (error=red, warn=yellow)
- 分类标签 (audio/provider/playback/cache/debug/watchdog/startup/system)
- Clear 按钮清空buffer

---

## 日志系统

```typescript
import { getLogger } from "@/lib/logs/Logger";

const logger = getLogger();

// 启用分类
logger.enable("audio");
logger.enable("provider");
logger.enable("watchdog");
logger.enableAll();

// 记录日志
logger.debug("audio", "Loading song", { songId: "123" });
logger.info("provider", "Provider switched", { from: "netease", to: "qq" });
logger.warn("watchdog", "Stall detected", { currentTime: 5.2 });
logger.error("cache", "IndexedDB write failed", { error: "QuotaExceeded" });

// 查看日志
const allLogs = logger.getLogs();
const audioLogs = logger.getLogs("audio");

// 清除
logger.clearBuffer();
```

---

## 遥测系统

```typescript
import { getTelemetry } from "@/system";

const telemetry = getTelemetry();

// 查看快照
const snap = telemetry.getSnapshot();
console.log(snap.playback.totalPlays);
console.log(snap.provider["netease"]?.avgLatencyMs);

// 导出JSON
const json = telemetry.exportJSON();
console.log(json);

// 清除
telemetry.clear();
```

---

## 看门狗

```typescript
import { getPlaybackWatchdog } from "@/system";

const watchdog = getPlaybackWatchdog();
const state = watchdog.getState();

console.log(state.isRunning);        // 是否运行中
console.log(state.totalRecoveries);  // 总恢复次数
console.log(state.recentEvents);     // 最近事件
console.log(state.recentRecoveries); // 最近恢复
```

---

## 常用检查命令

```bash
# 类型检查
npx tsc --noEmit

# 完整构建
npm run build

# ESLint
npm run lint

# 查看源文件统计
find src -name "*.ts" -o -name "*.tsx" | wc -l

# 检查循环依赖 (madge)
npx madge --circular src/app/layout.tsx
```
