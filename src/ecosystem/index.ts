/**
 * Phase 12 — Ecosystem 模块统一导出
 *
 * 最终私用生态闭环 + 本地化扩展能力 + AI长期自治维护
 */

// Local Media
export {
  LocalMediaProvider,
  getLocalMediaProvider,
  LocalLyricProvider,
  getLocalLyricProvider,
  LocalCoverProvider,
  getLocalCoverProvider,
} from "./local-media";
export type { LocalLyricEntry, LocalCoverEntry } from "./local-media";

// WebDAV
export { WebDAVProvider, getWebDAVProvider } from "./webdav";
export type { WebDAVConnection } from "./webdav";

// NAS
export { NASProvider, getNASProvider } from "./nas";
export type { NASDevice } from "./nas";

// Sync
export { SyncManager, getSyncManager } from "./sync";
export type { SyncDirection, SyncTask } from "./sync";

// Scanner
export { MediaScanner, getMediaScanner } from "./scanner";

// AI Autonomy
export {
  AIAutonomyManager,
  getAIAutonomy,
  GovernancePipeline,
  getGovernancePipeline,
  DegradedRuntimeMode,
  getDegradedRuntime,
  SystemStatusPage,
} from "./ai-autonomy";

// Archive
export { ProjectArchiveSystem, getArchiveSystem } from "./archive";
