/**
 * Phase 9 + Phase 11 — System 模块统一导出
 */

// Phase 9
export { PlaybackWatchdog, getPlaybackWatchdog } from "./watchdog/PlaybackWatchdog";
export { ProviderSelfHealingSystem, getProviderSelfHealing } from "./recovery/ProviderSelfHealing";
export { StartupRecoveryPipeline, getStartupRecoveryPipeline } from "./recovery/StartupRecoveryPipeline";
export { CacheGovernanceSystem, getCacheGovernance } from "./cleanup/CacheGovernance";
export { TelemetryService, getTelemetry } from "./telemetry/TelemetryService";
export { useSystemWatchdog, useSystemHealth } from "./monitor/useSystemWatchdog";
export { getReleaseMode, getReleaseConfig, isFeatureEnabled, isDebugMode, isReleaseMode } from "./monitor/ReleaseMode";
export { DevDiagnosticsPage } from "./diagnostics/DevDiagnosticsPage";
export { DebugOverlay } from "./diagnostics/DebugOverlay";
export { DebugOverlayWrapper } from "./diagnostics/DebugOverlayWrapper";

// Phase 11 — AI原生工程体系
export { AutoDiagnosticsRunner, getAutoDiagnostics } from "./auto-diagnostics";
export { ArchitectureSnapshotManager, getSnapshotManager } from "./snapshot";
export { RuntimeGovernanceManager, getGovernanceManager } from "./governance";
export { MaintenanceMode, getMaintenanceMode } from "./maintenance";

// Phase 17 — Production Hardening
export { CrashRecoverySystem, getCrashRecovery } from "./recovery/CrashRecoverySystem";
export { ProviderTelemetry, getProviderTelemetry } from "./telemetry/ProviderTelemetry";
export { CacheGovernanceV2, getCacheGovernanceV2 } from "./cleanup/CacheGovernanceV2";
