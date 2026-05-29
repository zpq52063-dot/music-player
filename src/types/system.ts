// ==================== Network State ====================

export type NetworkState = "online" | "offline" | "slow";

// ==================== Cache State ====================

export interface CacheStats {
  /** 缓存歌曲元数据数量 */
  metadataCount: number;
  /** 离线歌单数量 */
  offlinePlaylistCount: number;
  /** 本地播放历史条数 */
  historyCount: number;
  /** 歌词缓存数量 */
  lyricCount: number;
}

// ==================== Install State ====================

export interface InstallState {
  /** 是否已安装为 PWA */
  isInstalled: boolean;
  /** 是否有可用的安装事件 (beforeinstallprompt) */
  hasInstallPrompt: boolean;
  /** 是否为 iOS 设备 */
  isIOS: boolean;
  /** 是否在独立模式运行 */
  isStandalone: boolean;
}

// ==================== System Store ====================

export interface SystemState {
  // Network
  networkState: NetworkState;

  // Install
  installState: InstallState;

  // Cache
  cacheStats: CacheStats;

  // UI
  showInstallGuide: boolean;

  // Background playback
  isBackgroundPlayback: boolean;
}

export interface SystemActions {
  // Network
  setNetworkState: (state: NetworkState) => void;

  // Install
  setInstallState: (state: Partial<InstallState>) => void;
  setShowInstallGuide: (show: boolean) => void;
  dismissInstallGuide: () => void;

  // Cache
  setCacheStats: (stats: Partial<CacheStats>) => void;
  incrementCacheCount: (key: keyof CacheStats) => void;

  // Background
  setBackgroundPlayback: (inBackground: boolean) => void;
}

export type SystemStore = SystemState & SystemActions;
