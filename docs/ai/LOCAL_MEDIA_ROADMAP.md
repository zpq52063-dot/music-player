# Local Media Roadmap

> Phase 12 — 本地媒体扩展路线图 | 2026-05-24

---

## 当前状态

**架构已预留，接口已定义，核心逻辑未实现。**

本地媒体系统支持未来扩展但不影响当前系统运行。

---

## 已实现 (Phase 12)

### LocalMediaProvider
- 本地音频文件索引 (LocalMediaIndex)
- 按类型/艺术家/专辑分类查询
- 本地播放列表管理 (LocalPlaylistData)
- localStorage 索引持久化
- 元数据提取接口 (预留)

### LocalLyricProvider
- 本地 .lrc/.txt 歌词注册与查询
- 内存缓存

### LocalCoverProvider
- 本地封面图片注册与查询
- 专辑封面映射

### MediaScanner
- 浏览器 FileList/拖拽扫描
- 文件类型自动识别 (mp3/flac/wav/aac/ogg/m4a)
- 文件过滤 (pattern + excludePattern)
- Hash缓存 (预留)

---

## 未来路线

### Phase 13+: File System Access API

```
浏览器端:
  - window.showDirectoryPicker() 选择音乐文件夹
  - 递归扫描目录结构
  - 读取音频文件元数据 (ID3/Vorbis标签)
  - 使用 jsmediatags 或 music-metadata-browser
```

### Phase 14+: Capacitor Filesystem

```
iOS 端:
  - Capacitor Filesystem 插件访问本地存储
  - 扫描 iPhone 音乐库 (MPMediaLibrary 预留)
  - 或通过 iTunes File Sharing 导入音乐
```

### Phase 15+: IndexedDB 音频存储

```
离线存储:
  - 音频文件 Blob 存入 IndexedDB
  - 本地URL生成 (URL.createObjectURL)
  - 与现有 audioCacheService 集成
```

---

## 与现有Provider的关系

本地媒体是 Provider 降级链的最终层:

```
netease → qq → kuwo → mock → local_media (离线)
                                 ↑
                          当所有远程Provider失效
                          且用户有本地音频文件时
```

---

## 注意事项

1. 浏览器环境对本地文件系统访问受限 (安全策略)
2. File System Access API 仅 Chrome/Edge 支持
3. iOS Safari 不支持 File System Access API
4. Capacitor 是 iOS 本地文件访问的最佳路径

---

> 本地媒体扩展是长期目标，当前架构预留确保未来可无缝接入。
> Phase 12 — 最终私用生态闭环 | 2026-05-24
