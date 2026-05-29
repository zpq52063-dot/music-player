# Degraded Runtime

> Phase 12 — 降级运行模式 | 2026-05-24

---

## 核心原则

**即使所有远程Provider失效，项目仍能运行。**

---

## 降级级别

| 级别 | 触发条件 | 可用功能 | Fallback |
|------|---------|---------|----------|
| `none` | 正常运行 | 全部 | — |
| `partial` | Provider健康评分低 | cache + search + lyrics + local | cache优先 |
| `severe` | 所有远程Provider失效 | cache + local_media | MockProvider |
| `offline` | 网络断开 | cache + local_media | 本地缓存 |

---

## 自动触发

```typescript
import { getDegradedRuntime } from "@/ecosystem/ai-autonomy";

const degraded = getDegradedRuntime();

// 网络状态变化或Provider状态变化时调用
await degraded.evaluateAndAct();
```

自动评估逻辑:
1. 检查 `navigator.onLine`
2. 检查 ProviderManager 健康状态
3. 计算降级级别
4. 自动切换可用功能列表

---

## 运行时模式映射

降级级别自动映射到 RuntimeProfile:

| Degraded Level | Runtime Profile |
|----------------|-----------------|
| `none` | `full_online` |
| `partial` | `lightweight` |
| `severe` | `emergency_degraded` |
| `offline` | `offline` |

---

## Feature Gating

应用可通过 `isFeatureAvailable()` 检查功能是否在降级模式下可用:

```typescript
if (degraded.isFeatureAvailable("remote_playback")) {
  // 正常播放逻辑
} else {
  // 使用缓存的歌曲或本地文件
}
```

---

## 与现有系统的集成

降级模式与以下系统协同工作:

1. **ProviderManager** — 降级时自动切换到MockProvider
2. **MaintenanceMode** (Phase 11) — 紧急情况触发 provider_emergency 模式
3. **CacheGovernance** (Phase 9) — 降级时优先使用缓存数据
4. **LocalMediaProvider** (Phase 12) — 离线时的最终音频来源

---

## 监听器

```typescript
const unsubscribe = degraded.subscribe((state) => {
  console.log(`降级状态变更: ${state.level}`);
  // 更新UI提示等
});

// 取消监听
unsubscribe();
```

---

> 降级运行是项目长期私用的关键保障。无论外部条件如何变化，音乐播放不应中断。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
