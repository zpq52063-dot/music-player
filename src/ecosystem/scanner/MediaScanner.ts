/**
 * Phase 12 — MediaScanner
 *
 * 媒体文件扫描与索引系统。
 * 支持: 文件hash / metadata提取 / 重复检测 / 增量扫描。
 * 当前阶段: 架构与接口预留。浏览器环境限制，真实文件系统扫描需配合
 * File System Access API 或 Capacitor Filesystem 插件。
 */

import type {
  ScanConfig,
  ScanProgress,
  ScanResult,
  LocalMediaFile,
  LocalMediaIndex,
  DuplicateGroup,
  ScanError,
  MediaHashCache,
} from "@/types/phase12";
import { DEFAULT_SCAN_CONFIG } from "@/types/phase12";

const HASH_CACHE_KEY = "music_scanner_hash_cache";

export class MediaScanner {
  private static instance: MediaScanner;
  private config: ScanConfig;
  private progress: ScanProgress;
  private hashCache: MediaHashCache = {};

  private constructor() {
    this.config = { ...DEFAULT_SCAN_CONFIG };
    this.progress = this.idleProgress();
    this.loadHashCache();
  }

  static getInstance(): MediaScanner {
    if (!MediaScanner.instance) {
      MediaScanner.instance = new MediaScanner();
    }
    return MediaScanner.instance;
  }

  // ─── Configuration ───

  getConfig(): ScanConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // ─── Progress ───

  getProgress(): ScanProgress {
    return { ...this.progress };
  }

  isScanning(): boolean {
    return this.progress.status === "scanning" || this.progress.status === "indexing";
  }

  // ─── File Matching ───

  matchesPattern(fileName: string): boolean {
    return this.config.filePatterns.some((pattern) => {
      const regex = new RegExp(
        "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
        "i",
      );
      return regex.test(fileName);
    });
  }

  isExcluded(filePath: string): boolean {
    return this.config.excludePatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"),
      );
      return regex.test(filePath);
    });
  }

  // ─── Scan (Browser Environment) ───

  /**
   * 从 FileList 扫描音频文件 (浏览器环境)
   * 用户通过 <input type="file"> 或拖拽上传时调用
   */
  async scanFileList(files: FileList | File[]): Promise<ScanResult> {
    const startTime = Date.now();
    this.progress = {
      status: "scanning",
      totalFound: files.length,
      processed: 0,
      currentPath: "",
      startedAt: startTime,
      estimatedRemaining: 0,
    };

    const added: LocalMediaFile[] = [];
    const errors: ScanError[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      this.progress.currentPath = file.name;
      this.progress.processed = i + 1;

      if (!this.matchesPattern(file.name)) continue;
      if (file.size > 500 * 1024 * 1024) {
        errors.push({
          path: file.name,
          message: `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
          code: "FILE_TOO_LARGE",
        });
        continue;
      }

      const mediaFile = await this.fileToMediaFile(file);
      if (mediaFile) {
        added.push(mediaFile);
      }
    }

    const result: ScanResult = {
      id: `scan-${startTime}`,
      timestamp: startTime,
      config: this.config,
      added,
      removed: [],
      modified: [],
      duplicates: [],
      errors,
      duration: Date.now() - startTime,
    };

    this.progress = { ...this.idleProgress(), status: "complete" };
    return result;
  }

  /**
   * 构建 LocalMediaIndex (从扫描结果)
   */
  buildIndex(result: ScanResult, existingIndex?: LocalMediaIndex | null): LocalMediaIndex {
    const allFiles = existingIndex
      ? [...existingIndex.files, ...result.added]
      : result.added;

    const byType: LocalMediaIndex["byType"] = {
      audio: [],
      lyric: [],
      cover: [],
      playlist: [],
    };

    const byArtist: Record<string, LocalMediaFile[]> = {};
    const byAlbum: Record<string, LocalMediaFile[]> = {};

    for (const file of allFiles) {
      byType[file.type].push(file);

      const artist = file.metadata?.artist ?? "未知艺术家";
      const album = file.metadata?.album ?? "未知专辑";

      if (!byArtist[artist]) byArtist[artist] = [];
      byArtist[artist]!.push(file);

      if (!byAlbum[album]) byAlbum[album] = [];
      byAlbum[album]!.push(file);
    }

    return {
      version: (existingIndex?.version ?? 0) + 1,
      lastScanAt: Date.now(),
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((s, f) => s + f.size, 0),
      files: allFiles,
      byType,
      byArtist,
      byAlbum,
    };
  }

  // ─── Duplicate Detection (预留) ───

  /**
   * 检测重复文件 (预留)
   * 未来: 基于文件hash或音频指纹 (Chromaprint/AcoustID)
   */
  async detectDuplicates(_files: LocalMediaFile[]): Promise<DuplicateGroup[]> {
    // 预留: 需要计算文件hash或音频指纹
    return [];
  }

  /**
   * 计算文件hash (预留)
   * 未来: Web Crypto API SubtleCrypto.digest('SHA-256')
   */
  async computeFileHash(_file: File | Blob): Promise<string> {
    // 预留: const buffer = await file.arrayBuffer();
    // const hash = await crypto.subtle.digest('SHA-256', buffer);
    return "";
  }

  // ─── Hash Cache ───

  getHashCache(): MediaHashCache {
    return { ...this.hashCache };
  }

  clearHashCache(): void {
    this.hashCache = {};
    try {
      localStorage.removeItem(HASH_CACHE_KEY);
    } catch {
      // silent
    }
  }

  // ─── Private ───

  private async fileToMediaFile(file: File): Promise<LocalMediaFile | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = this.classifyFileType(ext, file.type);

    if (!type) return null;

    return {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type,
      path: file.name,
      size: file.size,
      mimeType: file.type || this.guessMimeType(ext),
      lastModified: file.lastModified,
      metadata: type === "audio" ? await this.extractBasicMetadata(file) : undefined,
    };
  }

  private classifyFileType(
    ext: string,
    mime: string,
  ): LocalMediaFile["type"] | null {
    if (/^(mp3|flac|wav|aac|ogg|m4a|wma|opus)$/i.test(ext)) return "audio";
    if (/^(m4a|aac)$/i.test(mime.split("/")[1] ?? "")) return "audio";
    if (/^(lrc|txt)$/i.test(ext)) return "lyric";
    if (/^(jpg|jpeg|png|webp|bmp)$/i.test(ext)) return "cover";
    if (/^(m3u|m3u8|pls)$/i.test(ext)) return "playlist";
    return null;
  }

  private guessMimeType(ext: string): string {
    const map: Record<string, string> = {
      mp3: "audio/mpeg",
      flac: "audio/flac",
      wav: "audio/wav",
      aac: "audio/aac",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      wma: "audio/x-ms-wma",
      lrc: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    return map[ext] ?? "application/octet-stream";
  }

  private async extractBasicMetadata(_file: File): Promise<LocalMediaFile["metadata"]> {
    // 预留: 浏览器环境无法直接读取ID3/Vorbis标签
    // 未来可配合: jsmediatags / music-metadata-browser 库
    return {
      title: _file.name.replace(/\.[^.]+$/, ""),
      duration: undefined,
      artist: undefined,
      album: undefined,
    };
  }

  private idleProgress(): ScanProgress {
    return {
      status: "idle",
      totalFound: 0,
      processed: 0,
      currentPath: "",
      startedAt: 0,
      estimatedRemaining: 0,
    };
  }

  private loadHashCache(): void {
    try {
      const raw = localStorage.getItem(HASH_CACHE_KEY);
      if (raw) this.hashCache = JSON.parse(raw) as MediaHashCache;
    } catch {
      this.hashCache = {};
    }
  }
}

export function getMediaScanner(): MediaScanner {
  return MediaScanner.getInstance();
}
