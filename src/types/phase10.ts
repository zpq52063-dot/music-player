/**
 * Phase 10 — 最终平台化与长期运维类型
 *
 * 包含: RuntimeConfig / Backup / Migration / ProviderHotReload / DeploymentProfile / DisasterRecovery
 */

// ==================== Runtime Config ====================

export interface RuntimeProviderEntry {
  type: string;
  enabled: boolean;
  priority: number;
  apiBaseUrl: string | null;
  timeout: number;
  retries: number;
}

export interface RuntimeCacheStrategy {
  memoryMaxEntries: number;
  indexedDBMaxEntries: number;
  lyricTTLDays: number;
  metadataTTLDays: number;
  historyMaxEntries: number;
  cleanupIntervalMs: number;
}

export interface RuntimeDebugConfig {
  debugOverlay: boolean;
  diagnosticsPage: boolean;
  verboseLogging: boolean;
  telemetryEnabled: boolean;
  performanceMonitoring: boolean;
}

export interface RuntimeExperimentFlags {
  [key: string]: boolean | number | string;
}

export interface RuntimeConfig {
  version: number;
  providers: RuntimeProviderEntry[];
  cache: RuntimeCacheStrategy;
  debug: RuntimeDebugConfig;
  experiments: RuntimeExperimentFlags;
  lastUpdated: number;
  source: "local" | "remote" | "merged";
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  version: 1,
  providers: [
    { type: "mock", enabled: true, priority: 0, apiBaseUrl: null, timeout: 5000, retries: 1 },
  ],
  cache: {
    memoryMaxEntries: 200,
    indexedDBMaxEntries: 2000,
    lyricTTLDays: 7,
    metadataTTLDays: 30,
    historyMaxEntries: 500,
    cleanupIntervalMs: 600000,
  },
  debug: {
    debugOverlay: false,
    diagnosticsPage: true,
    verboseLogging: false,
    telemetryEnabled: true,
    performanceMonitoring: true,
  },
  experiments: {},
  lastUpdated: 0,
  source: "local",
};

export interface ConfigOverride {
  path: string;
  value: unknown;
  source: "env" | "runtime" | "user";
}

// ==================== Backup ====================

export type BackupScope = "full" | "playlists" | "liked" | "config" | "cache_index";

export interface BackupManifest {
  id: string;
  scope: BackupScope;
  version: number;
  createdAt: number;
  appVersion: string;
  itemCounts: {
    playlists?: number;
    likedSongs?: number;
    configKeys?: number;
    cacheEntries?: number;
  };
  checksum: string;
}

export interface BackupBundle {
  manifest: BackupManifest;
  data: BackupData;
}

export interface BackupData {
  playlists?: PlaylistBackup[];
  likedSongIds?: string[];
  config?: Record<string, unknown>;
  cacheIndex?: CacheIndexEntry[];
  metadata?: BackupMetadata;
}

export interface PlaylistBackup {
  id: string;
  name: string;
  description: string;
  songIds: string[];
  createdAt: number;
}

export interface CacheIndexEntry {
  storeName: string;
  key: string;
  size: number;
  cachedAt: number;
}

export interface BackupMetadata {
  appVersion: string;
  exportDate: number;
  platform: string;
  userAgent: string;
}

export interface BackupResult {
  success: boolean;
  manifest: BackupManifest | null;
  jsonSize: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restored: {
    playlists: number;
    likedSongs: number;
    config: number;
  };
  errors: string[];
}

// ==================== Migration ====================

export type MigrationTarget =
  | "stores"
  | "cache"
  | "indexeddb"
  | "config"
  | "data";

export interface MigrationStep {
  id: string;
  version: number;
  target: MigrationTarget;
  description: string;
  up: () => Promise<boolean>;
  down?: () => Promise<boolean>;
}

export interface MigrationRecord {
  id: string;
  appliedAt: number;
  success: boolean;
  duration: number;
}

export interface MigrationState {
  currentVersion: number;
  appliedMigrations: MigrationRecord[];
  pendingMigrations: string[];
  lastMigrationAt: number;
}

export interface MigrationResult {
  success: boolean;
  applied: string[];
  failed: string[];
  duration: number;
}

// ==================== Provider Hot Reload ====================

export interface ProviderHotConfig {
  type: string;
  enabled: boolean;
  priority: number;
  updatedAt: number;
}

export interface ProviderSwitchEvent {
  from: string;
  to: string;
  reason: "manual" | "health" | "priority" | "auto_recovery";
  timestamp: number;
}

export interface ProviderReloadState {
  configs: ProviderHotConfig[];
  switchHistory: ProviderSwitchEvent[];
  lastReloadAt: number;
  isReloading: boolean;
}

// ==================== Deployment Profiles ====================

export type DeploymentMode = "local" | "vercel" | "cloudflare" | "cloudflare-pages" | "hybrid";

export interface DeploymentProfile {
  mode: DeploymentMode;
  name: string;
  description: string;
  envVars: string[];
  features: {
    serverless: boolean;
    edgeFunctions: boolean;
    staticExport: boolean;
    isr: boolean;
    swr: boolean;
  };
  storage: {
    database: "supabase" | "local" | "none";
    cache: "memory" | "indexeddb" | "redis" | "none";
    files: "vercel-blob" | "r2" | "local" | "none";
  };
}

export const DEPLOYMENT_PROFILES: Record<DeploymentMode, DeploymentProfile> = {
  local: {
    mode: "local",
    name: "本地开发",
    description: "Next.js dev server + 本地 Supabase + Mock Provider",
    envVars: ["NEXT_PUBLIC_RELEASE_MODE=debug"],
    features: {
      serverless: false,
      edgeFunctions: false,
      staticExport: false,
      isr: false,
      swr: false,
    },
    storage: {
      database: "supabase",
      cache: "indexeddb",
      files: "local",
    },
  },
  vercel: {
    mode: "vercel",
    name: "Vercel 部署",
    description: "Vercel Serverless + Supabase + Edge Functions",
    envVars: [
      "NEXT_PUBLIC_RELEASE_MODE=release",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    features: {
      serverless: true,
      edgeFunctions: true,
      staticExport: false,
      isr: true,
      swr: true,
    },
    storage: {
      database: "supabase",
      cache: "indexeddb",
      files: "vercel-blob",
    },
  },
  cloudflare: {
    mode: "cloudflare",
    name: "Cloudflare 部署",
    description: "Cloudflare Workers + D1 + R2 + Queues",
    envVars: [
      "NEXT_PUBLIC_RELEASE_MODE=release",
      "CF_D1_DATABASE_ID",
      "CF_R2_BUCKET",
    ],
    features: {
      serverless: false,
      edgeFunctions: true,
      staticExport: true,
      isr: false,
      swr: false,
    },
    storage: {
      database: "none",
      cache: "none",
      files: "r2",
    },
  },
  "cloudflare-pages": {
    mode: "cloudflare-pages",
    name: "Cloudflare Pages 部署",
    description: "Cloudflare Pages + Workers (API代理) + Supabase (可选)",
    envVars: [
      "NEXT_PUBLIC_RELEASE_MODE=release",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_CF_WORKER_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ],
    features: {
      serverless: false,
      edgeFunctions: true,
      staticExport: false,
      isr: false,
      swr: false,
    },
    storage: {
      database: "supabase",
      cache: "indexeddb",
      files: "none",
    },
  },
  hybrid: {
    mode: "hybrid",
    name: "混合部署",
    description: "Vercel (前端) + Cloudflare Workers (API代理) + Supabase (数据库)",
    envVars: [
      "NEXT_PUBLIC_RELEASE_MODE=release",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "CF_WORKER_URL",
    ],
    features: {
      serverless: true,
      edgeFunctions: true,
      staticExport: false,
      isr: true,
      swr: true,
    },
    storage: {
      database: "supabase",
      cache: "indexeddb",
      files: "vercel-blob",
    },
  },
};

// ==================== Disaster Recovery ====================

export type RecoveryLevel = "quick" | "full" | "nuclear";

export interface RecoveryCheckpoint {
  id: string;
  level: RecoveryLevel;
  timestamp: number;
  state: RecoverySnapshot;
}

export interface RecoverySnapshot {
  config: RuntimeConfig | null;
  providerState: ProviderReloadState | null;
  backupBundle: BackupBundle | null;
  settings: Record<string, unknown> | null;
}

export interface RecoveryResult2 {
  success: boolean;
  level: RecoveryLevel;
  checkpointsRestored: number;
  errors: string[];
  duration: number;
}

// ==================== Memory Monitor ====================

export interface MemorySnapshot {
  timestamp: number;
  estimatedJSHeapSize: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  componentCount: number;
  storeCount: number;
}

export interface MemoryPressureEvent {
  type: "warning" | "critical";
  snapshot: MemorySnapshot;
  thresholdMB: number;
  timestamp: number;
}

// ==================== System Integrity ====================

export interface IntegrityCheck {
  name: string;
  pass: boolean;
  details: string;
  timestamp: number;
}

export interface IntegrityReport {
  checks: IntegrityCheck[];
  overallPass: boolean;
  timestamp: number;
  recommendations: string[];
}
