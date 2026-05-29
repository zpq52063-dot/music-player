# Snapshot Rotation

> Phase 13 — 快照轮换系统 | 2026-05-24

---

## 概述

`SnapshotRotationManager` 管理运行时状态快照的完整生命周期:
- 创建 → 存储 → 轮换 → 清理

核心模块: `src/frozen-runtime/snapshots/SnapshotRotationManager.ts`

---

## 5 种快照类型

| 类型 | 内容 | 最大保留 | 保留优先级 |
|------|------|---------|-----------|
| `full` | Providers + Config + Runtime | 5 | keep |
| `providers` | Provider健康状态 | 10 | normal |
| `config` | RuntimeConfig配置 | 10 | normal |
| `cache` | 缓存元数据 | 5 | expendable |
| `runtime` | FrozenRuntime + Degraded状态 | 10 | normal |

---

## 轮换策略

1. **按类型上限** — 每种类型独立上限
2. **按年龄清理** — 超过30天的快照自动过期
3. **按总数限制** — 总数不超过20个
4. **月度保留** — 每月1号的快照标记为keep
5. **优先级排序** — keep > normal > expendable

---

## 使用方式

```typescript
import { getSnapshotRotation } from "@/frozen-runtime/snapshots";

const sr = getSnapshotRotation();

// 创建快照
const snap = await sr.createSnapshot("full");

// 创建恢复点 (keep优先级)
const recoveryPoint = await sr.createRecoveryPoint();

// 启动自动轮换
sr.startAutoRotation();

// 获取最新快照
const latest = sr.getLatestSnapshot("providers");
```

---

## 恢复点

`createRecoveryPoint()` 创建 `full` 类型 + `keep` 优先级的快照，
不会被自动轮换删除。

---

## 持久化

- 快照数据: localStorage (`music_snapshot_rotation`)
- 配置: localStorage (`music_snapshot_rotation_config`)
- 存储满时自动清理: 保留keep，删除expendable

---

> 快照轮换确保系统始终有可用的恢复点，同时不会因为快照积累导致存储溢出。
> Phase 13 — 最终长期冻结版 | 2026-05-24
