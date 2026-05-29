/**
 * Phase 12 — 最终私用生态闭环 类型定义
 *
 * 覆盖: 本地音源 / WebDAV/NAS / 媒体扫描 / AI自治 / 降级运行 / 封存 / 运行模式
 */

// ─── Local Media Provider ───

export type LocalMediaType = "audio" | "lyric" | "cover" | "playlist";

export interface LocalMediaFile {
  id: string;
  name: string;
  type: LocalMediaType;
  path: string;
  size: number;
  mimeType: string;
  lastModified: number;
  metadata?: LocalAudioMetadata;
}

export interface LocalAudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  trackNumber?: number;
  genre?: string;
  year?: number;
  coverPath?: string;
  lyricPath?: string;
}

export interface LocalMediaIndex {
  version: number;
  lastScanAt: number;
  totalFiles: number;
  totalSize: number;
  files: LocalMediaFile[];
  byType: Record<LocalMediaType, LocalMediaFile[]>;
  byArtist: Record<string, LocalMediaFile[]>;
  byAlbum: Record<string, LocalMediaFile[]>;
}

export interface LocalPlaylistData {
  id: string;
  name: string;
  description?: string;
  fileIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LocalMediaProviderConfig {
  enabled: boolean;
  scanPaths: string[];
  autoIndex: boolean;
  supportedFormats: string[];
  maxFileSize: number;
}

// ─── WebDAV / NAS ───

export type RemoteStorageType = "webdav" | "nas" | "s3" | "custom";

export interface RemoteStorageConfig {
  type: RemoteStorageType;
  enabled: boolean;
  url: string;
  authType: "none" | "basic" | "token" | "oauth";
  username?: string;
  token?: string;
  mountPath: string;
  timeout: number;
  retryCount: number;
}

export interface RemoteStorageStatus {
  connected: boolean;
  lastConnectedAt: number | null;
  latencyMs: number;
  availableSpace: number;
  errorMessage?: string;
}

export interface RemoteFileEntry {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: number;
  isDirectory: boolean;
}

// ─── Media Scanner ───

export type ScanStatus = "idle" | "scanning" | "indexing" | "complete" | "error";

export interface ScanConfig {
  recursive: boolean;
  followSymlinks: boolean;
  maxDepth: number;
  filePatterns: string[];
  excludePatterns: string[];
  hashAlgorithm: "sha-256" | "md5" | "none";
  extractMetadata: boolean;
}

export interface ScanProgress {
  status: ScanStatus;
  totalFound: number;
  processed: number;
  currentPath: string;
  startedAt: number;
  estimatedRemaining: number;
}

export interface ScanResult {
  id: string;
  timestamp: number;
  config: ScanConfig;
  added: LocalMediaFile[];
  removed: string[];
  modified: LocalMediaFile[];
  duplicates: DuplicateGroup[];
  errors: ScanError[];
  duration: number;
}

export interface DuplicateGroup {
  hash: string;
  files: LocalMediaFile[];
  confidence: number;
}

export interface ScanError {
  path: string;
  message: string;
  code: string;
}

export interface MediaHashCache {
  [path: string]: {
    hash: string;
    lastModified: number;
    computedAt: number;
  };
}

// ─── AI Autonomy ───

export type AutonomyTaskType =
  | "system_report"
  | "provider_health"
  | "issue_tracker"
  | "maintenance_advice"
  | "doc_update"
  | "governance_check"
  | "snapshot_capture"
  | "debt_scan";

export type AutonomyTaskStatus = "scheduled" | "running" | "completed" | "failed";

export interface AutonomyTask {
  id: string;
  type: AutonomyTaskType;
  status: AutonomyTaskStatus;
  scheduledAt: number;
  executedAt?: number;
  result?: AutonomyTaskResult;
  error?: string;
}

export interface AutonomyTaskResult {
  type: AutonomyTaskType;
  timestamp: number;
  summary: string;
  details: Record<string, unknown>;
  recommendations: string[];
  severity: "info" | "warning" | "critical";
}

export interface SystemHealthReport {
  id: string;
  timestamp: number;
  overallScore: number;
  providers: ProviderHealthEntry[];
  cache: CacheHealthEntry[];
  stores: StoreHealthEntry[];
  recovery: RecoveryHealthEntry[];
  issues: SystemIssue[];
  recommendations: string[];
}

export interface ProviderHealthEntry {
  name: string;
  score: number;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  successRate: number;
  consecutiveFailures: number;
  lastChecked: number;
}

export interface CacheHealthEntry {
  layer: "memory" | "indexeddb" | "service-worker";
  itemCount: number;
  estimatedSizeBytes: number;
  hitRate: number;
  oldestEntryAge: number;
  status: "healthy" | "warning" | "critical";
}

export interface StoreHealthEntry {
  name: string;
  hasData: boolean;
  fieldCount: number;
  status: "ok" | "warning";
}

export interface RecoveryHealthEntry {
  layer: 1 | 2 | 3;
  name: string;
  active: boolean;
  lastTriggered: number | null;
  totalRecoveries: number;
  status: "ok" | "warning" | "error";
}

export interface SystemIssue {
  id: string;
  title: string;
  category: "provider" | "cache" | "store" | "recovery" | "performance" | "security";
  severity: "low" | "medium" | "high" | "critical";
  detectedAt: number;
  description: string;
  recommendation: string;
  resolved: boolean;
  resolvedAt?: number;
}

export interface AIAutonomyConfig {
  enabled: boolean;
  autoReportInterval: number;
  autoGovernanceCheckInterval: number;
  autoSnapshotInterval: number;
  autoDocUpdateEnabled: boolean;
  maxIssueHistory: number;
  persistReports: boolean;
}

// ─── Governance Pipeline ───

export type PipelineStage =
  | "module_consistency"
  | "store_dependency"
  | "provider_status"
  | "recovery_status"
  | "cache_status";

export type PipelineStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface PipelineStageResult {
  stage: PipelineStage;
  status: PipelineStatus;
  startedAt: number;
  completedAt?: number;
  checks: number;
  passed: number;
  failed: number;
  errors: PipelineError[];
  recommendations: string[];
}

export interface PipelineError {
  stage: PipelineStage;
  code: string;
  message: string;
  severity: "warning" | "error" | "critical";
  location?: string;
}

export interface GovernancePipelineResult {
  id: string;
  timestamp: number;
  stages: PipelineStageResult[];
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  recommendations: string[];
}

// ─── Degraded Runtime ───

export type DegradedLevel = "none" | "partial" | "severe" | "offline";

export interface DegradedModeConfig {
  autoActivate: boolean;
  activateOnProviderFailure: boolean;
  activateOnNetworkLoss: boolean;
  activateOnCacheOnly: boolean;
  fallbackToLocalMedia: boolean;
  enableCacheOnlyPlayback: boolean;
  disableRemoteSearch: boolean;
  showDegradedBanner: boolean;
}

export interface DegradedState {
  active: boolean;
  level: DegradedLevel;
  activatedAt: number;
  triggeredBy: string;
  availableFeatures: string[];
  disabledFeatures: string[];
  fallbackProvider: string;
}

// ─── Runtime Profiles ───

export type RuntimeProfileType =
  | "lightweight"
  | "full_online"
  | "offline"
  | "local_media"
  | "maintenance"
  | "emergency_degraded";

export interface RuntimeProfile {
  type: RuntimeProfileType;
  label: string;
  description: string;
  restrictions: ProfileRestrictions;
  features: ProfileFeatures;
  autoActivate?: {
    condition: string;
    priority: number;
  };
}

export interface ProfileRestrictions {
  maxConcurrentProviders: number;
  maxCacheItems: number;
  disableRemoteSearch: boolean;
  disableProviderHotReload: boolean;
  disableTelemetry: boolean;
  forceCacheOnly: boolean;
  forceLocalMediaOnly: boolean;
  enableVerboseLogging: boolean;
  reduceRafThrottle: boolean;
}

export interface ProfileFeatures {
  search: boolean;
  remotePlayback: boolean;
  localPlayback: boolean;
  cache: boolean;
  lyrics: boolean;
  comments: boolean;
  sync: boolean;
  aiAutonomy: boolean;
}

// ─── Project Archive ───

export type ArchiveScope = "full" | "config" | "runtime" | "store" | "provider" | "docs";

export interface ArchiveManifest {
  id: string;
  createdAt: number;
  phaseVersion: number;
  scope: ArchiveScope;
  checksum: string;
  totalFiles: number;
  totalSizeBytes: number;
  entries: ArchiveEntry[];
}

export interface ArchiveEntry {
  path: string;
  type: "config" | "state" | "provider" | "doc" | "log";
  size: number;
  checksum: string;
}

export interface ArchiveConfig {
  autoArchive: boolean;
  autoArchiveInterval: number;
  maxArchives: number;
  scopes: ArchiveScope[];
  storagePath: string;
  compressEnabled: boolean;
}

export interface ArchiveResult {
  id: string;
  success: boolean;
  manifest: ArchiveManifest;
  error?: string;
  warnings: string[];
}

export interface ArchiveRestoreResult {
  id: string;
  success: boolean;
  restoredEntries: number;
  skippedEntries: number;
  errors: ArchiveRestoreError[];
}

export interface ArchiveRestoreError {
  entry: string;
  message: string;
}

// ─── System Status Page ───

export interface SystemStatusSnapshot {
  timestamp: number;
  providerStatus: ProviderStatusEntry[];
  cacheStatus: CacheStatusEntry;
  recoveryStatus: RecoveryStatusEntry;
  aiAutonomyStatus: AIAutonomyStatusEntry;
  runtimeMode: RuntimeProfileType;
  degradedLevel: DegradedLevel;
  systemHealthScore: number;
  uptime: number;
  lastIncidentAt: number | null;
  // Phase 13 additions
  frozenRuntime: { active: boolean; integrityScore: number; protectedSections: number; openViolations: number; mode: string };
  maintenanceLoop: { active: boolean; totalRuns: number; totalRecoveries: number; lastFullCycleAt: number | null };
  autonomyScore: number;
  stabilityScore: number;
  providerRiskScore: number;
  recoveryHealthScore: number;
  snapshotStatus: { totalSnapshots: number; autoRotation: boolean; byType: Record<string, number> };
  healingStatus: { totalHealings: number; successRate: number; lastHealingAt: number | null };
}

export interface ProviderStatusEntry {
  name: string;
  type: string;
  enabled: boolean;
  connected: boolean;
  healthScore: number;
  latencyMs: number;
  isFallback: boolean;
}

export interface CacheStatusEntry {
  memoryItems: number;
  indexeddbItems: number;
  swCacheSize: number;
  totalSizeBytes: number;
  hitRate: number;
}

export interface RecoveryStatusEntry {
  watchdogActive: boolean;
  selfHealingActive: boolean;
  disasterRecoveryReady: boolean;
  lastRecoveryAt: number | null;
  totalRecoveries: number;
  checkpointsAvailable: number;
}

export interface AIAutonomyStatusEntry {
  enabled: boolean;
  lastReportAt: number | null;
  lastGovernanceCheckAt: number | null;
  lastSnapshotAt: number | null;
  pendingTasks: number;
  totalIssues: number;
  openIssues: number;
}

// ─── Defaults ───

export const DEFAULT_LOCAL_MEDIA_CONFIG: LocalMediaProviderConfig = {
  enabled: false,
  scanPaths: [],
  autoIndex: false,
  supportedFormats: ["mp3", "flac", "wav", "aac", "ogg", "m4a", "wma"],
  maxFileSize: 500 * 1024 * 1024,
};

export const DEFAULT_AI_AUTONOMY_CONFIG: AIAutonomyConfig = {
  enabled: true,
  autoReportInterval: 3600000,
  autoGovernanceCheckInterval: 1800000,
  autoSnapshotInterval: 7200000,
  autoDocUpdateEnabled: true,
  maxIssueHistory: 500,
  persistReports: true,
};

export const DEFAULT_DEGRADED_CONFIG: DegradedModeConfig = {
  autoActivate: true,
  activateOnProviderFailure: true,
  activateOnNetworkLoss: true,
  activateOnCacheOnly: true,
  fallbackToLocalMedia: true,
  enableCacheOnlyPlayback: true,
  disableRemoteSearch: true,
  showDegradedBanner: true,
};

export const DEFAULT_ARCHIVE_CONFIG: ArchiveConfig = {
  autoArchive: false,
  autoArchiveInterval: 86400000,
  maxArchives: 10,
  scopes: ["full"],
  storagePath: "archives/",
  compressEnabled: false,
};

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  recursive: true,
  followSymlinks: false,
  maxDepth: 5,
  filePatterns: ["*.mp3", "*.flac", "*.wav", "*.aac", "*.ogg", "*.m4a"],
  excludePatterns: ["node_modules/**", ".git/**", "System Volume Information/**"],
  hashAlgorithm: "sha-256",
  extractMetadata: true,
};

export const RUNTIME_PROFILES: Record<RuntimeProfileType, RuntimeProfile> = {
  lightweight: {
    type: "lightweight",
    label: "轻量模式",
    description: "最小资源占用，适合低端设备或省电场景",
    restrictions: {
      maxConcurrentProviders: 1,
      maxCacheItems: 200,
      disableRemoteSearch: false,
      disableProviderHotReload: true,
      disableTelemetry: true,
      forceCacheOnly: false,
      forceLocalMediaOnly: false,
      enableVerboseLogging: false,
      reduceRafThrottle: true,
    },
    features: {
      search: true,
      remotePlayback: true,
      localPlayback: false,
      cache: true,
      lyrics: true,
      comments: false,
      sync: false,
      aiAutonomy: false,
    },
  },
  full_online: {
    type: "full_online",
    label: "完整在线模式",
    description: "全部功能启用，依赖网络连接和远程Provider",
    restrictions: {
      maxConcurrentProviders: 4,
      maxCacheItems: 5000,
      disableRemoteSearch: false,
      disableProviderHotReload: false,
      disableTelemetry: false,
      forceCacheOnly: false,
      forceLocalMediaOnly: false,
      enableVerboseLogging: false,
      reduceRafThrottle: false,
    },
    features: {
      search: true,
      remotePlayback: true,
      localPlayback: true,
      cache: true,
      lyrics: true,
      comments: true,
      sync: true,
      aiAutonomy: true,
    },
  },
  offline: {
    type: "offline",
    label: "离线模式",
    description: "完全离线运行，仅使用本地缓存",
    restrictions: {
      maxConcurrentProviders: 1,
      maxCacheItems: 5000,
      disableRemoteSearch: true,
      disableProviderHotReload: true,
      disableTelemetry: true,
      forceCacheOnly: true,
      forceLocalMediaOnly: false,
      enableVerboseLogging: false,
      reduceRafThrottle: false,
    },
    features: {
      search: false,
      remotePlayback: false,
      localPlayback: false,
      cache: true,
      lyrics: true,
      comments: false,
      sync: false,
      aiAutonomy: false,
    },
  },
  local_media: {
    type: "local_media",
    label: "本地媒体模式",
    description: "仅播放本地音频文件，不依赖任何远程服务",
    restrictions: {
      maxConcurrentProviders: 1,
      maxCacheItems: 100,
      disableRemoteSearch: true,
      disableProviderHotReload: true,
      disableTelemetry: true,
      forceCacheOnly: false,
      forceLocalMediaOnly: true,
      enableVerboseLogging: false,
      reduceRafThrottle: false,
    },
    features: {
      search: false,
      remotePlayback: false,
      localPlayback: true,
      cache: false,
      lyrics: true,
      comments: false,
      sync: false,
      aiAutonomy: false,
    },
  },
  maintenance: {
    type: "maintenance",
    label: "维护模式",
    description: "系统维护中，仅基本功能可用",
    restrictions: {
      maxConcurrentProviders: 1,
      maxCacheItems: 1000,
      disableRemoteSearch: true,
      disableProviderHotReload: true,
      disableTelemetry: false,
      forceCacheOnly: false,
      forceLocalMediaOnly: false,
      enableVerboseLogging: true,
      reduceRafThrottle: false,
    },
    features: {
      search: false,
      remotePlayback: false,
      localPlayback: false,
      cache: true,
      lyrics: false,
      comments: false,
      sync: false,
      aiAutonomy: true,
    },
  },
  emergency_degraded: {
    type: "emergency_degraded",
    label: "紧急降级模式",
    description: "Provider大量失效时的紧急模式，使用Mock兜底",
    restrictions: {
      maxConcurrentProviders: 1,
      maxCacheItems: 500,
      disableRemoteSearch: true,
      disableProviderHotReload: true,
      disableTelemetry: false,
      forceCacheOnly: false,
      forceLocalMediaOnly: false,
      enableVerboseLogging: true,
      reduceRafThrottle: false,
    },
    features: {
      search: false,
      remotePlayback: false,
      localPlayback: false,
      cache: true,
      lyrics: true,
      comments: false,
      sync: false,
      aiAutonomy: true,
    },
    autoActivate: {
      condition: "所有远程Provider不可用",
      priority: 100,
    },
  },
};
