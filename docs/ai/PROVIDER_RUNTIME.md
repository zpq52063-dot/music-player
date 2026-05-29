# Provider Runtime

> Phase 10 — Provider 运行时管理 | 2026-05-24

---

## Provider 配置热更新

```typescript
import { getProviderHotReload } from "@/platform";

const hotReload = getProviderHotReload();

// 热启用/禁用 (不需重启)
hotReload.enableProvider("qq");
hotReload.disableProvider("netease");

// 热切换
hotReload.hotSwitch("kuwo", "manual");

// 优先级调整 (立即生效)
hotReload.updatePriority("netease", 0);

// 自动替换 (健康原因)
const next = hotReload.autoReplace("netease");
```

---

## Provider 配置源

Provider 配置来自 RuntimeConfigManager:
```
localStorage (music_runtime_config)
  → RuntimeConfigManager.providers[]
    → ProviderHotReloadSystem.state.configs[]
```

修改 RuntimeConfig 会自动同步到 ProviderHotReloadSystem。

---

## 运行时优先级

```typescript
const activeProviders = hotReload.getActiveProviders();
// 返回: 按优先级排序的已启用 Provider 列表
// [{ type: "netease", enabled: true, priority: 0 }, ...]
```

---

## 切换历史

```typescript
const state = hotReload.getState();
console.log(state.switchHistory);
// [{ from: "netease", to: "qq", reason: "health", timestamp: 1712345678000 }, ...]
```

---

## 与 ProviderManager 的关系

```
ProviderHotReloadSystem (热更新层)
  ↓ 控制 enabled/priority
ProviderManager (Phase 7, 执行层)
  ↓ 执行实际的 Provider 请求
Provider (音源实现)
```
