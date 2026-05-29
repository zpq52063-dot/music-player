// ==================== Phase 16B: Remote Provider Architecture ====================

// Types (Phase 16A)
export type {
  RemoteProvider,
  RemoteProviderHealth,
  RemoteStream,
  RemoteSong,
  RemoteSearchOptions,
  CircuitState,
  CircuitBreakerConfig,
  EdgeProviderConfig,
  EdgeManagerState,
  RemoteProviderEntry,
  RemoteConfigData,
  DashboardProviderInfo,
} from "./types";

export { DEFAULT_EDGE_CONFIG, DEFAULT_REMOTE_CONFIG } from "./types";

// Core (Phase 16A)
export { EdgeProviderManager, getEdgeProviderManager, resetEdgeProviderManager } from "./core";

// Providers (Phase 16A + 16B)
export {
  BaseRemoteProvider,
  RemoteWorkerProvider,
  InternetArchiveProvider,
  JamendoProvider,
  CcMixterProvider,
} from "./providers";

export type { BaseRemoteOptions } from "./providers";

// Config (Phase 16A)
export { RemoteConfig, getRemoteConfig, resetRemoteConfig } from "./config";

// Env (Phase 16B)
export { RemoteEnv } from "./env";

// Hooks (Phase 16A + 16B)
export { useRemoteProvider, useRemoteProviderHealth, initializeRemoteProviders } from "./hooks";

// Components (Phase 16A)
export { ProviderHealthDashboard } from "./components";
