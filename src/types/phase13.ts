/**
 * Phase 13 — 最终长期冻结版 类型定义
 *
 * 覆盖: 冻结运行时 / 自治维护循环 / 运行时隔离 / 自愈治理 / 快照轮换 / 灾难恢复 / 长期稳定性
 */

// ─── Frozen Runtime ───

export type FrozenSection =
  | "core_runtime"
  | "providers"
  | "recovery_pipeline"
  | "cache_governance"
  | "audio_engine"
  | "music_provider_interface"
  | "governance_pipeline"
  | "autonomy_loop";

export type FrozenMode = "readonly" | "protected" | "frozen" | "autonomy";

export interface FrozenSectionConfig {
  section: FrozenSection;
  mode: FrozenMode;
  lockedAt: number;
  reason: string;
  allowExtensions: boolean;
  hotReloadable: boolean;
  autoRestore: boolean;
  integrityChecksum?: string;
}

export interface FrozenRuntimeState {
  id: string;
  activatedAt: number;
  mode: "active" | "dormant" | "emergency";
  sections: FrozenSectionConfig[];
  protectedCount: number;
  readonlyCount: number;
  integrityScore: number;
  lastIntegrityCheck: number;
  violations: FrozenViolation[];
}

export interface FrozenViolation {
  id: string;
  section: FrozenSection;
  detectedAt: number;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  action: "block" | "warn" | "log" | "restore";
  autoResolved: boolean;
  resolvedAt?: number;
}

export interface FrozenRuntimeConfig {
  enabled: boolean;
  autoFreeze: boolean;
  integrityCheckInterval: number;
  maxViolationsBeforeLockdown: number;
  lockdownMode: "permissive" | "strict" | "total";
  allowedExtensions: FrozenSection[];
}

// ─── Autonomous Maintenance Loop ───

export type MaintenanceTaskType =
  | "provider_health_check"
  | "cache_governance"
  | "runtime_integrity"
  | "recovery_test"
  | "snapshot_generation"
  | "debt_detection"
  | "isolation_check"
  | "bootstrap_verify"
  | "governance_full"
  | "disaster_drill";

export type MaintenanceTaskPriority = "low" | "normal" | "high" | "critical";

export interface MaintenanceTask {
  id: string;
  type: MaintenanceTaskType;
  priority: MaintenanceTaskPriority;
  interval: number;
  lastRun: number | null;
  nextRun: number;
  enabled: boolean;
  autoRecover: boolean;
  maxRetries: number;
  currentRetries: number;
}

export interface MaintenanceLoopState {
  active: boolean;
  startedAt: number;
  totalRuns: number;
  totalRecoveries: number;
  tasks: MaintenanceTask[];
  currentTask: MaintenanceTaskType | null;
  lastFullCycleAt: number | null;
}

export interface MaintenanceReport {
  id: string;
  timestamp: number;
  loopState: MaintenanceLoopState;
  completedTasks: MaintenanceTaskResult[];
  overallHealth: "excellent" | "good" | "fair" | "poor" | "critical";
  recommendations: string[];
}

export interface MaintenanceTaskResult {
  taskType: MaintenanceTaskType;
  success: boolean;
  duration: number;
  recovered: boolean;
  details: string;
  recommendations: string[];
}

// ─── Runtime Isolation ───

export type IsolationDomain =
  | "provider"
  | "audio"
  | "cache"
  | "recovery"
  | "governance"
  | "autonomy";

export type IsolationLevel = "full" | "partial" | "none";

export interface IsolationConfig {
  domain: IsolationDomain;
  level: IsolationLevel;
  maxFailures: number;
  cooldownPeriod: number;
  autoQuarantine: boolean;
  quarantineDuration: number;
  notifyOnIsolation: boolean;
}

export interface IsolationState {
  domain: IsolationDomain;
  isolated: boolean;
  isolatedAt: number | null;
  reason: string | null;
  failureCount: number;
  lastFailureAt: number | null;
  quarantineEndsAt: number | null;
  autoReleased: boolean;
}

export interface IsolationReport {
  timestamp: number;
  isolatedDomains: IsolationDomain[];
  activeQuarantines: number;
  totalIsolations: number;
  totalAutoReleases: number;
  domains: IsolationState[];
}

// ─── Self-Healing Governance ───

export interface HealingAction {
  id: string;
  type: "restart" | "reload" | "fallback" | "reset" | "reinitialize" | "quarantine";
  target: string;
  severity: "low" | "medium" | "high" | "critical";
  autoExecute: boolean;
  maxAttempts: number;
  cooldownMs: number;
}

export interface HealingResult {
  action: HealingAction;
  success: boolean;
  executedAt: number;
  duration: number;
  previousState: string;
  newState: string;
  error?: string;
}

export interface HealingHistory {
  totalAttempts: number;
  totalSuccesses: number;
  totalFailures: number;
  recentActions: HealingResult[];
  successRate: number;
}

export interface StabilityScore {
  overall: number;
  providerStability: number;
  cacheStability: number;
  recoveryStability: number;
  runtimeStability: number;
  autonomyStability: number;
  calculatedAt: number;
  trend: "improving" | "stable" | "declining" | "critical";
}

// ─── Snapshot Rotation ───

export type SnapshotType = "full" | "providers" | "config" | "cache" | "runtime";

export interface SnapshotEntry {
  id: string;
  type: SnapshotType;
  createdAt: number;
  size: number;
  checksum: string;
  providerStates?: Record<string, unknown>;
  configState?: Record<string, unknown>;
  runtimeState?: Record<string, unknown>;
  retentionPriority: "keep" | "normal" | "expendable";
}

export interface RotationConfig {
  maxSnapshots: number;
  maxAgeMs: number;
  perTypeMax: Record<SnapshotType, number>;
  autoRotate: boolean;
  rotationInterval: number;
  compressOld: boolean;
  keepMonthlyMinimum: boolean;
}

export interface RotationResult {
  rotated: SnapshotEntry[];
  kept: SnapshotEntry[];
  deleted: SnapshotEntry[];
  reason: string;
}

// ─── Disaster Recovery Protocol ───

export type DisasterType =
  | "all_providers_down"
  | "cache_corruption"
  | "indexeddb_corruption"
  | "runtime_corruption"
  | "pwa_abnormal"
  | "local_degraded"
  | "total_failure";

export type RecoveryStrategy = "auto" | "guided" | "manual" | "nuclear";

export interface DisasterScenario {
  type: DisasterType;
  name: string;
  description: string;
  severity: "major" | "critical" | "catastrophic";
  autoDetect: boolean;
  detectionMethod: string;
  recoveryStrategies: RecoveryStrategy[];
  estimatedRecoveryTime: number;
  dataLossRisk: "none" | "minimal" | "partial" | "significant";
}

export interface RecoveryStep {
  order: number;
  name: string;
  description: string;
  action: string;
  reversible: boolean;
  timeout: number;
  verifyAfter: boolean;
}

export interface RecoveryPlan {
  id: string;
  disaster: DisasterType;
  triggeredAt: number;
  strategy: RecoveryStrategy;
  steps: RecoveryStep[];
  currentStep: number;
  status: "pending" | "in_progress" | "completed" | "failed" | "aborted";
  startedAt?: number;
  completedAt?: number;
  result?: RecoveryResult;
}

export interface RecoveryResult {
  success: boolean;
  disaster: DisasterType;
  strategy: RecoveryStrategy;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  duration: number;
  dataRestored: boolean;
  systemRestored: boolean;
  errors: RecoveryError[];
  recommendations: string[];
}

export interface RecoveryError {
  step: number;
  stepName: string;
  message: string;
  recoverable: boolean;
  fallbackAction?: string;
}

// ─── Long-Term Stability ───

export interface LongTermStabilityMetrics {
  uptimeMs: number;
  totalAutonomyCycles: number;
  totalRecoveries: number;
  totalSnapshots: number;
  totalIsolations: number;
  averageHealthScore: number;
  providerUptime: Record<string, number>;
  lastMajorIncident: number | null;
  daysSinceLastIncident: number;
  stabilityGrade: "A" | "B" | "C" | "D" | "F";
}

export interface ProjectFreezeState {
  frozenAt: number;
  phase: number;
  architectureHash: string;
  stableModules: string[];
  frozenModules: string[];
  forbiddenZones: string[];
  activeAutonomySystems: string[];
  activeRecoverySystems: string[];
  maintenanceAdvice: string[];
  permanentLimitations: string[];
  recommendedUpgradeDirections: string[];
}

// ─── Defaults ───

export const DEFAULT_FROZEN_RUNTIME_CONFIG: FrozenRuntimeConfig = {
  enabled: true,
  autoFreeze: true,
  integrityCheckInterval: 600000, // 10min
  maxViolationsBeforeLockdown: 3,
  lockdownMode: "strict",
  allowedExtensions: ["cache_governance"],
};

export const DEFAULT_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: "maint-provider-health",
    type: "provider_health_check",
    priority: "high",
    interval: 300000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: true,
    maxRetries: 3,
    currentRetries: 0,
  },
  {
    id: "maint-cache-governance",
    type: "cache_governance",
    priority: "normal",
    interval: 600000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: true,
    maxRetries: 2,
    currentRetries: 0,
  },
  {
    id: "maint-runtime-integrity",
    type: "runtime_integrity",
    priority: "high",
    interval: 900000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 3,
    currentRetries: 0,
  },
  {
    id: "maint-recovery-test",
    type: "recovery_test",
    priority: "normal",
    interval: 1800000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 2,
    currentRetries: 0,
  },
  {
    id: "maint-snapshot",
    type: "snapshot_generation",
    priority: "normal",
    interval: 3600000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 2,
    currentRetries: 0,
  },
  {
    id: "maint-debt-detect",
    type: "debt_detection",
    priority: "low",
    interval: 7200000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 1,
    currentRetries: 0,
  },
  {
    id: "maint-isolation-check",
    type: "isolation_check",
    priority: "high",
    interval: 300000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: true,
    maxRetries: 3,
    currentRetries: 0,
  },
  {
    id: "maint-bootstrap-verify",
    type: "bootstrap_verify",
    priority: "critical",
    interval: 86400000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 3,
    currentRetries: 0,
  },
  {
    id: "maint-governance-full",
    type: "governance_full",
    priority: "high",
    interval: 1800000,
    lastRun: null,
    nextRun: 0,
    enabled: true,
    autoRecover: false,
    maxRetries: 2,
    currentRetries: 0,
  },
  {
    id: "maint-disaster-drill",
    type: "disaster_drill",
    priority: "low",
    interval: 604800000,
    lastRun: null,
    nextRun: 0,
    enabled: false,
    autoRecover: false,
    maxRetries: 1,
    currentRetries: 0,
  },
];

export const DEFAULT_ISOLATION_CONFIGS: Record<IsolationDomain, IsolationConfig> = {
  provider: {
    domain: "provider",
    level: "full",
    maxFailures: 5,
    cooldownPeriod: 30000,
    autoQuarantine: true,
    quarantineDuration: 300000,
    notifyOnIsolation: true,
  },
  audio: {
    domain: "audio",
    level: "full",
    maxFailures: 3,
    cooldownPeriod: 10000,
    autoQuarantine: true,
    quarantineDuration: 120000,
    notifyOnIsolation: true,
  },
  cache: {
    domain: "cache",
    level: "partial",
    maxFailures: 5,
    cooldownPeriod: 60000,
    autoQuarantine: true,
    quarantineDuration: 600000,
    notifyOnIsolation: false,
  },
  recovery: {
    domain: "recovery",
    level: "partial",
    maxFailures: 3,
    cooldownPeriod: 30000,
    autoQuarantine: false,
    quarantineDuration: 300000,
    notifyOnIsolation: true,
  },
  governance: {
    domain: "governance",
    level: "none",
    maxFailures: 10,
    cooldownPeriod: 60000,
    autoQuarantine: false,
    quarantineDuration: 600000,
    notifyOnIsolation: false,
  },
  autonomy: {
    domain: "autonomy",
    level: "partial",
    maxFailures: 5,
    cooldownPeriod: 60000,
    autoQuarantine: true,
    quarantineDuration: 1800000,
    notifyOnIsolation: true,
  },
};

export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  maxSnapshots: 20,
  maxAgeMs: 30 * 86400000,
  perTypeMax: {
    full: 5,
    providers: 10,
    config: 10,
    cache: 5,
    runtime: 10,
  },
  autoRotate: true,
  rotationInterval: 3600000,
  compressOld: false,
  keepMonthlyMinimum: true,
};

export const DISASTER_SCENARIOS: DisasterScenario[] = [
  {
    type: "all_providers_down",
    name: "全Provider失效",
    description: "所有远程音源Provider不可用",
    severity: "critical",
    autoDetect: true,
    detectionMethod: "ProviderManager.getAllHealth() 全部successRate < 30%",
    recoveryStrategies: ["auto", "guided", "manual", "nuclear"],
    estimatedRecoveryTime: 60000,
    dataLossRisk: "none",
  },
  {
    type: "cache_corruption",
    name: "缓存损坏",
    description: "IndexedDB或内存缓存数据损坏",
    severity: "major",
    autoDetect: true,
    detectionMethod: "CacheGovernance 校验失败",
    recoveryStrategies: ["auto", "guided", "manual"],
    estimatedRecoveryTime: 30000,
    dataLossRisk: "minimal",
  },
  {
    type: "indexeddb_corruption",
    name: "IndexedDB损坏",
    description: "IndexedDB数据库文件损坏",
    severity: "critical",
    autoDetect: true,
    detectionMethod: "IndexedDB open失败",
    recoveryStrategies: ["auto", "guided", "nuclear"],
    estimatedRecoveryTime: 120000,
    dataLossRisk: "partial",
  },
  {
    type: "runtime_corruption",
    name: "Runtime损坏",
    description: "运行时状态/Store数据损坏",
    severity: "critical",
    autoDetect: true,
    detectionMethod: "SystemIntegrity check失败",
    recoveryStrategies: ["guided", "manual", "nuclear"],
    estimatedRecoveryTime: 180000,
    dataLossRisk: "significant",
  },
  {
    type: "pwa_abnormal",
    name: "PWA异常",
    description: "Service Worker异常/PWA安装损坏",
    severity: "major",
    autoDetect: true,
    detectionMethod: "SW注册失败/manifest加载异常",
    recoveryStrategies: ["auto", "guided", "nuclear"],
    estimatedRecoveryTime: 60000,
    dataLossRisk: "none",
  },
  {
    type: "local_degraded",
    name: "本地降级运行",
    description: "长时间离线或严重降级",
    severity: "major",
    autoDetect: true,
    detectionMethod: "DegradedRuntime.isDegraded() && duration > 1h",
    recoveryStrategies: ["auto", "guided"],
    estimatedRecoveryTime: 30000,
    dataLossRisk: "none",
  },
  {
    type: "total_failure",
    name: "全系统崩溃",
    description: "所有系统不可用，需完全恢复",
    severity: "catastrophic",
    autoDetect: true,
    detectionMethod: "系统启动即失败",
    recoveryStrategies: ["nuclear"],
    estimatedRecoveryTime: 300000,
    dataLossRisk: "significant",
  },
];
