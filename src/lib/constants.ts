/** API 路由前缀 */
export const API_PREFIX = "/api";

/** 播放器默认音量 */
export const DEFAULT_VOLUME = 0.8;

/** 专辑封面默认图 */
export const DEFAULT_COVER = "/icons/icon-192.png";

// ===== Phase 20C: Release Versioning =====

/** Application semantic version */
export const APP_VERSION = "1.0.0";

/** Release metadata */
export const RELEASE_INFO = {
  version: APP_VERSION,
  codename: "Production Release",
  phase: "20C",
  releasedAt: "2026-05-29",
  rollbackVersion: "0.1.0",
  minSupportedVersion: "1.0.0",
  swVersion: "1.0.0",
  buildTarget: "production" as const,
} as const;
