# Migration Guide

> Phase 10 — 数据迁移指南 | 2026-05-24

---

## 迁移系统

MigrationPipeline 管理所有数据结构升级:

```typescript
import { getMigrationPipeline } from "@/platform";

const pipeline = getMigrationPipeline();

// 注册内置迁移
pipeline.registerBuiltinMigrations();

// 运行所有待执行迁移
await pipeline.runAll();

// 运行特定迁移
await pipeline.runOne("builtin_storage_key_v2");

// 按目标筛选
await pipeline.runByTarget("indexeddb");

// 回滚
await pipeline.rollback("builtin_storage_key_v2");
```

---

## 迁移状态

```typescript
const state = pipeline.getState();
// {
//   currentVersion: 2,
//   appliedMigrations: [{ id: "builtin_storage_key_v2", appliedAt: 1712345678000, success: true }],
//   pendingMigrations: ["builtin_idb_version_v3"],
//   lastMigrationAt: 1712345678000
// }
```

---

## 注册自定义迁移

```typescript
pipeline.register({
  id: "custom_migration_v4",
  version: 4,
  target: "config",
  description: "Migrate X to Y format",
  up: async () => {
    // 执行迁移
    return true;
  },
  down: async () => {
    // 回滚
    return true;
  },
});
```

---

## 迁移原则

1. **幂等:** 所有迁移可重复执行
2. **带回滚:** 每个迁移提供 down()
3. **原子:** 失败时停止后续迁移
4. **可追踪:** 所有记录持久化到 localStorage

---

## 当前迁移版本

- v1: 初始版本 (Phase 1-9)
- v2: storage key 命名空间化
- v3: IndexedDB schema 版本校验 (预留)
