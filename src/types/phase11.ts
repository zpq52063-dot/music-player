/**
 * Phase 11 — AI原生工程体系类型定义
 */

// ─── Auto Diagnostics ───

export type DiagnosticsSeverity = "healthy" | "degraded" | "unhealthy" | "critical";

export type DiagnosticsScope = "providers" | "cache" | "playback" | "stores" | "all";

export interface ProviderDiagnosticsItem {
  name: string;
  type: string;
  enabled: boolean;
  healthScore: number;
  latencyMs: number;
  status: DiagnosticsSeverity;
  lastChecked: number;
  consecutiveFailures: number;
}

export interface CacheDiagnosticsItem {
  layer: "memory" | "indexeddb" | "service-worker";
  itemCount: number;
  estimatedSizeBytes: number;
  status: DiagnosticsSeverity;
  oldestEntryAge: number;
}

export interface PlaybackDiagnosticsItem {
  watchdogActive: boolean;
  stallCount: number;
  totalRecoveries: number;
  currentSongId: string | null;
  loadingState: string;
  status: DiagnosticsSeverity;
}

export interface StoreDiagnosticsItem {
  name: string;
  hasData: boolean;
  fieldCount: number;
  status: DiagnosticsSeverity;
}

export interface DiagnosticsReport {
  id: string;
  timestamp: number;
  scope: DiagnosticsScope;
  providers: ProviderDiagnosticsItem[];
  cache: CacheDiagnosticsItem[];
  playback: PlaybackDiagnosticsItem;
  stores: StoreDiagnosticsItem[];
  overallStatus: DiagnosticsSeverity;
  summary: string;
}

// ─── Architecture Snapshot ───

export interface DirectoryStats {
  path: string;
  fileCount: number;
  totalLines: number;
}

export interface StoreSnapshot {
  name: string;
  fields: string[];
  actionCount: number;
}

export interface ProviderSnapshot {
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
}

export interface ArchitectureSnapshot {
  id: string;
  timestamp: number;
  phaseVersion: number;
  totalFiles: number;
  directories: DirectoryStats[];
  stores: StoreSnapshot[];
  providers: ProviderSnapshot[];
  dependencies: Record<string, string[]>;
  fileHash?: string;
}

export interface SnapshotDiff {
  previousId: string;
  currentId: string;
  fileChanges: { added: string[]; removed: string[]; modified: string[] };
  storeChanges: { added: string[]; removed: string[]; modified: string[] };
  providerChanges: { added: string[]; removed: string[]; modified: string[] };
}

// ─── Runtime Governance ───

export type GovernanceSeverity = "ok" | "warning" | "error";

export interface GovernanceCheckItem {
  name: string;
  category: "config" | "store" | "provider" | "recovery";
  status: GovernanceSeverity;
  message: string;
  recommendation?: string;
}

export interface GovernanceReport {
  id: string;
  timestamp: number;
  items: GovernanceCheckItem[];
  errors: number;
  warnings: number;
  overallStatus: GovernanceSeverity;
}

// ─── Maintenance Mode ───

export type MaintenanceModeType = "release" | "maintenance" | "degraded" | "provider_emergency";

export interface MaintenanceModeState {
  currentMode: MaintenanceModeType;
  previousMode: MaintenanceModeType | null;
  enteredAt: number;
  reason: string;
  restrictions: MaintenanceRestrictions;
}

export interface MaintenanceRestrictions {
  disableNewFeatures: boolean;
  disableProviderSwitching: boolean;
  forceMockProvider: boolean;
  disableWriteOperations: boolean;
  enableVerboseLogging: boolean;
  disableCacheCleanup: boolean;
  showMaintenanceBanner: boolean;
}
