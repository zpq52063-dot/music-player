# Archive Strategy

> Phase 12 — 项目封存策略 | 2026-05-24

---

## 核心原则

**项目可在任何时候被完整封存，并在未来被恢复。**

无需服务器、无需数据库、无需外部依赖。

---

## 封存范围

| Scope | 内容 |
|-------|------|
| `full` | 全部: config + runtime + store + provider + docs |
| `config` | RuntimeConfig + Settings + MaintenanceMode + DegradedState |
| `runtime` | 浏览器 UserAgent + 在线状态 + URL + 时间戳 |
| `store` | 搜索历史 / 恢复检查点 / 架构快照 / AI自治任务 / AI问题 / 本地媒体索引 |
| `provider` | Provider优先级列表 + 健康状态 |
| `docs` | 所有 docs/ai/ 下的AI文档索引 |

---

## 导出格式

JSON (含 manifest + checksum):

```json
{
  "archive": {
    "id": "archive-1717000000000",
    "createdAt": 1717000000000,
    "phaseVersion": 12,
    "scope": "full",
    "checksum": "a1b2c3d4",
    "totalFiles": 25,
    "totalSizeBytes": 45000,
    "entries": [...]
  },
  "exportedAt": "2026-05-24T00:00:00.000Z",
  "projectName": "music-player",
  "phase": 12
}
```

---

## 使用方式

```typescript
import { getArchiveSystem } from "@/ecosystem/archive";

const archive = getArchiveSystem();

// 导出完整归档到浏览器下载
await archive.downloadArchive("full");

// 导出仅配置
await archive.downloadArchive("config");

// 获取 JSON 字符串 (用于自定义存储)
const json = await archive.exportAsDownloadable("full");
```

---

## 恢复 (预留)

```typescript
// 从 JSON 文件恢复
const file = ...; // File from <input type="file">
const result = await archive.restoreFromFile(file);
```

恢复功能当前预留，待后续实现:
1. 解析 JSON 验证 checksum
2. 逐项恢复到 localStorage
3. 校验恢复完整性
4. 提示用户重启应用

---

## 自动归档

配置项 (`DEFAULT_ARCHIVE_CONFIG`):

```typescript
{
  autoArchive: false,          // 关闭自动归档 (手动触发生成)
  autoArchiveInterval: 86400000, // 24h
  maxArchives: 10,             // 最多保留10个归档
  scopes: ["full"],            // 默认完整归档
  storagePath: "archives/",    // 下载文件默认名
  compressEnabled: false,      // 不压缩 (JSON文本)
}
```

---

## 归档用途

1. **版本快照** — 在重大变更前封存当前状态
2. **灾难恢复** — 作为 DisasterRecovery 的数据源
3. **迁移辅助** — 迁移到新设备/浏览器时的数据转移
4. **AI上下文** — 让未来AI了解项目历史状态
5. **合规** — 保留项目配置的完整历史记录

---

> 封存不是结束，而是让项目可以在任何时间点"复活"的保障。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
