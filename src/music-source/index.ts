// Types
export type {
  ProviderType,
  MusicQuality,
  SearchOptions,
  SongDetail,
  MusicProvider,
} from "./types";

// Providers (仅 MockProvider 可用，以后可在此添加新 Provider)
export { MockProvider } from "./providers";
export { ProviderManager, getProviderManager } from "./providers";
export { HealthTracker, getHealthTracker } from "./providers";
export { RequestManager, getRequestManager } from "./providers";

// Services
export { SearchService } from "./services";

// Cache
export { SearchCache, getSearchCache } from "./cache";
export { APICache, getAPICache } from "./cache";
export type { CacheCategoryConfig } from "./cache";

// Hooks
export {
  useMusicProvider,
  getProvider,
  getService,
  useSearch,
  useSearchHistory,
  useHotKeywords,
  useProvider,
  useProviderHealth,
  useFallbackPlayer,
  useMusicSource,
} from "./hooks";
