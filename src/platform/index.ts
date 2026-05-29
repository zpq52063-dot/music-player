/**
 * Phase 10 — Platform 模块统一导出
 */

// Config
export { RuntimeConfigManager, getRuntimeConfig } from "./config/RuntimeConfigManager";
export { ENV_VAR_REGISTRY, validateEnvVars, getPublicEnvVars } from "./config/EnvRegistry";
export type { EnvVarDefinition, EnvValidationResult } from "./config/EnvRegistry";

// Environment
export { detectEnvironmentType, getEnvironmentConfig, isLocal, isPreview, isProduction } from "./env/EnvironmentGovernor";
export type { EnvironmentType, EnvironmentConfig } from "./env/EnvironmentGovernor";

// Backup
export { BackupManager, getBackupManager } from "./backup/BackupManager";

// Migration
export { MigrationPipeline, getMigrationPipeline } from "./migration/MigrationPipeline";

// Provider Hot Reload
export { ProviderHotReloadSystem, getProviderHotReload } from "./update/ProviderHotReload";

// Deployment
export { detectDeploymentMode, getDeploymentProfile, isLocalMode, isProductionMode } from "./runtime/DeploymentMode";

// Memory Monitor
export { MemoryMonitor, getMemoryMonitor } from "./runtime/MemoryMonitor";

// System Integrity
export { SystemIntegrity, getSystemIntegrity } from "./runtime/SystemIntegrity";

// Disaster Recovery
export { DisasterRecovery, getDisasterRecovery } from "./recovery/DisasterRecovery";

// Site URL (Phase 20A)
export { getSiteBaseUrl, getManifestUrl, getWorkerUrl, buildApiUrl, getAssetUrl } from "./url/SiteUrlResolver";

// Production Safety (Phase 20A)
export { ProductionGuard, safeError } from "./safety/ProductionGuard";
