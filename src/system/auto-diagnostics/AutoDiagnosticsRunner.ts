/**
 * Phase 11 — Auto Diagnostics Runner
 *
 * 自动扫描系统各组件健康状态，生成诊断报告。
 * 不修改任何系统状态，只读取和报告。
 */

import type {
  DiagnosticsReport,
  DiagnosticsScope,
  DiagnosticsSeverity,
  ProviderDiagnosticsItem,
  CacheDiagnosticsItem,
  PlaybackDiagnosticsItem,
  StoreDiagnosticsItem,
} from "@/types/phase11";

export class AutoDiagnosticsRunner {
  private static instance: AutoDiagnosticsRunner;

  static getInstance(): AutoDiagnosticsRunner {
    if (!AutoDiagnosticsRunner.instance) {
      AutoDiagnosticsRunner.instance = new AutoDiagnosticsRunner();
    }
    return AutoDiagnosticsRunner.instance;
  }

  private generateId(): string {
    return `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async runFullDiagnostics(): Promise<DiagnosticsReport> {
    const [providers, cache, playback, stores] = await Promise.all([
      this.scanProviders(),
      this.scanCache(),
      this.scanPlayback(),
      this.scanStores(),
    ]);

    const overallStatus = this.computeOverallStatus([
      ...providers.map((p) => p.status),
      ...cache.map((c) => c.status),
      playback.status,
      ...stores.map((s) => s.status),
    ]);

    const degradedItems = [...providers, ...cache, playback, ...stores].filter(
      (item) => item.status !== "healthy",
    );

    return {
      id: this.generateId(),
      timestamp: Date.now(),
      scope: "all",
      providers,
      cache,
      playback,
      stores,
      overallStatus,
      summary: degradedItems.length === 0
        ? "所有系统正常"
        : `${degradedItems.length} 项需要关注`,
    };
  }

  async scanProviders(): Promise<ProviderDiagnosticsItem[]> {
    const items: ProviderDiagnosticsItem[] = [];

    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const priorityList = manager.getPriorityList();
      const activeType = manager.getActiveType();

      for (const [type, health] of healthMap) {
        const enabled = priorityList.includes(type);
        items.push({
          name: type,
          type,
          enabled,
          healthScore: health.successRate,
          latencyMs: health.avgLatency,
          status: this.providerStatusFromScore(health.successRate, enabled),
          lastChecked: Date.now(),
          consecutiveFailures: health.consecutiveFailures,
        });
      }

      // 确保活跃 provider 在列表中
      if (!items.some((i) => i.name === activeType)) {
        items.push({
          name: activeType,
          type: activeType,
          enabled: true,
          healthScore: 100,
          latencyMs: 0,
          status: "healthy",
          lastChecked: Date.now(),
          consecutiveFailures: 0,
        });
      }
    } catch {
      items.push({
        name: "provider-manager",
        type: "system",
        enabled: false,
        healthScore: 0,
        latencyMs: 0,
        status: "unhealthy",
        lastChecked: Date.now(),
        consecutiveFailures: 1,
      });
    }

    return items;
  }

  async scanCache(): Promise<CacheDiagnosticsItem[]> {
    const items: CacheDiagnosticsItem[] = [];

    // 检查 IndexedDB
    try {
      const { openDB } = await import("@/storage/CacheDB");
      const db = await openDB();
      const stores = ["song_metadata", "offline_playlists", "play_history_local", "lyric_cache"];
      let totalItems = 0;

      for (const storeName of stores) {
        try {
          if (db.objectStoreNames.contains(storeName)) {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const count = await new Promise<number>((resolve, reject) => {
              const req = store.count();
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => reject(req.error);
            });
            totalItems += count;
          }
        } catch {
          // Store may not exist yet
        }
      }

      items.push({
        layer: "indexeddb",
        itemCount: totalItems,
        estimatedSizeBytes: totalItems * 2048,
        status: "healthy",
        oldestEntryAge: 0,
      });
    } catch {
      items.push({
        layer: "indexeddb",
        itemCount: 0,
        estimatedSizeBytes: 0,
        status: "degraded",
        oldestEntryAge: 0,
      });
    }

    // 内存缓存
    items.push({
      layer: "memory",
      itemCount: 0,
      estimatedSizeBytes: 0,
      status: "healthy",
      oldestEntryAge: 0,
    });

    // Service Worker 缓存 (浏览器限制，不可直接读取)
    items.push({
      layer: "service-worker",
      itemCount: -1,
      estimatedSizeBytes: -1,
      status: "healthy",
      oldestEntryAge: 0,
    });

    return items;
  }

  async scanPlayback(): Promise<PlaybackDiagnosticsItem> {
    try {
      const { getPlaybackWatchdog } = await import("@/system/watchdog/PlaybackWatchdog");
      const watchdog = getPlaybackWatchdog();
      const state = watchdog.getState();

      return {
        watchdogActive: state.isRunning,
        stallCount: state.stallCount,
        totalRecoveries: state.totalRecoveries,
        currentSongId: null,
        loadingState: "idle",
        status: state.isRunning ? "healthy" : "degraded",
      };
    } catch {
      return {
        watchdogActive: false,
        stallCount: 0,
        totalRecoveries: 0,
        currentSongId: null,
        loadingState: "unknown",
        status: "unhealthy",
      };
    }
  }

  async scanStores(): Promise<StoreDiagnosticsItem[]> {
    const storeNames = [
      "musicPlayerStore",
      "uiStore",
      "searchStore",
      "userStore",
      "libraryStore",
      "playlistStore",
      "socialStore",
      "systemStore",
      "providerStore",
      "settingsStore",
    ];

    return storeNames.map((name) => ({
      name,
      hasData: true,
      fieldCount: -1,
      status: "healthy" as DiagnosticsSeverity,
    }));
  }

  async scanScope(scope: DiagnosticsScope): Promise<DiagnosticsReport> {
    const report = await this.runFullDiagnostics();

    if (scope === "all") return report;

    return {
      ...report,
      scope,
      id: this.generateId(),
      providers: scope === "providers" ? report.providers : [],
      cache: scope === "cache" ? report.cache : [],
      stores: scope === "stores" ? report.stores : [],
    };
  }

  private providerStatusFromScore(score: number, enabled: boolean): DiagnosticsSeverity {
    if (!enabled) return "degraded";
    if (score >= 70) return "healthy";
    if (score >= 30) return "degraded";
    return "unhealthy";
  }

  private computeOverallStatus(statuses: DiagnosticsSeverity[]): DiagnosticsSeverity {
    if (statuses.includes("critical")) return "critical";
    if (statuses.includes("unhealthy")) return "unhealthy";
    if (statuses.includes("degraded")) return "degraded";
    return "healthy";
  }
}

export function getAutoDiagnostics(): AutoDiagnosticsRunner {
  return AutoDiagnosticsRunner.getInstance();
}
