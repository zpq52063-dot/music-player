# Backup Strategy

> Phase 10 — 备份策略 | 2026-05-24

---

## 备份范围

| 范围 | 包含 | 格式 | 大小 |
|------|------|------|------|
| full | 歌单+喜欢+配置+缓存索引+元数据 | JSON | ~100KB-1MB |
| playlists | 歌单 | JSON | ~10KB |
| liked | 喜欢歌曲ID | JSON | ~1KB |
| config | 配置+设置 | JSON | ~5KB |
| cache_index | 缓存索引 | JSON | ~50KB |

---

## 备份操作

```typescript
import { getBackupManager } from "@/platform";

const backup = getBackupManager();

// 导出JSON
const json = await backup.exportJSON("full");

// 下载文件
backup.downloadBackup("full");

// 恢复
const result = await backup.restoreFromJSON(jsonString);

// 从文件恢复
const result = await backup.restoreFromFile(file);
```

---

## 备份校验

每个备份包含 SHA-256 checksum (前16位hex):
```json
{
  "manifest": {
    "id": "backup_xxx",
    "checksum": "a1b2c3d4e5f6a7b8",
    ...
  },
  "data": { ... }
}
```

恢复时自动校验 checksum。

---

## 建议备份频率

- 每次重大配置变更前
- 每周自动提醒 (预留)
- 切换设备前
- Provider 配置变更前
