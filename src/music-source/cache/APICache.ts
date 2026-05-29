import { SearchCache, getSearchCache } from "./SearchCache";

// ==================== SWR 缓存条目 ====================

interface SWREntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  gcTime: number;
  revalidating: boolean;
}

// ==================== 缓存配置 (可覆盖) ====================

export interface CacheCategoryConfig {
  staleTime: number;
  gcTime: number;
  /** 是否启用 SWR: 缓存过期后返回旧数据并后台刷新 */
  swr: boolean;
}

const DEFAULT_CATEGORIES: Record<string, CacheCategoryConfig> = {
  search: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, swr: true },
  suggestion: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000, swr: true },
  hotKeywords: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000, swr: true },
  songDetail: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, swr: true },
  lyrics: { staleTime: 30 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000, swr: true },
  playUrl: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000, swr: false },
  playlist: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, swr: true },
};

function getConfig(category: string): CacheCategoryConfig {
  return DEFAULT_CATEGORIES[category] ?? DEFAULT_CATEGORIES.search!;
}

// ==================== APICache ====================

export class APICache {
  private memoryCache: SearchCache;
  private swrStore: Map<string, SWREntry<unknown>> = new Map();

  constructor() {
    this.memoryCache = getSearchCache();
  }

  /** SWR-aware get: 返回数据 + 是否 stale + 是否需要 revalidate */
  getWithSWR<T>(key: string, category: string): { data: T | null; stale: boolean } {
    // 先检查 SWR store
    const swrEntry = this.swrStore.get(key) as SWREntry<T> | undefined;
    if (swrEntry) {
      const age = Date.now() - swrEntry.timestamp;
      if (age < swrEntry.gcTime) {
        const stale = age >= swrEntry.staleTime;
        return { data: swrEntry.data, stale };
      }
      // GC
      this.swrStore.delete(key);
    }

    // 回退到 SearchCache
    const fresh = this.memoryCache.isFresh(key, category);
    const data = this.memoryCache.get<T>(key, category);

    if (data) {
      return { data, stale: !fresh };
    }

    return { data: null, stale: false };
  }

  /** 写入缓存 */
  set<T>(key: string, data: T, category: string = "search"): void {
    // 写入内存缓存
    this.memoryCache.set(key, data);

    const catConfig = getConfig(category);

    // 写入 SWR store
    this.swrStore.set(key, {
      data,
      timestamp: Date.now(),
      staleTime: catConfig.staleTime,
      gcTime: catConfig.gcTime,
      revalidating: false,
    });
  }

  /** 标记正在 revalidate */
  markRevalidating(key: string): void {
    const entry = this.swrStore.get(key);
    if (entry) {
      entry.revalidating = true;
    }
  }

  /** 标记 revalidate 完成 */
  markRevalidated(key: string): void {
    const entry = this.swrStore.get(key);
    if (entry) {
      entry.revalidating = false;
    }
  }

  /** 获取缓存条目年龄 (ms) */
  getAge(key: string): number | null {
    const entry = this.swrStore.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  /** 是否正在 revalidate */
  isRevalidating(key: string): boolean {
    const entry = this.swrStore.get(key);
    return entry?.revalidating ?? false;
  }

  /** 删除指定 key */
  delete(key: string): void {
    this.memoryCache.delete(key);
    this.swrStore.delete(key);
  }

  /** 清空全部缓存 */
  clear(): void {
    this.memoryCache.clear();
    this.swrStore.clear();
  }

  /** 按前缀失效 */
  invalidateByPrefix(prefix: string): void {
    this.memoryCache.invalidateByPrefix(prefix);
    for (const key of this.swrStore.keys()) {
      if (key.startsWith(prefix)) this.swrStore.delete(key);
    }
  }

  /** 获取缓存统计 */
  getStats(): { memoryEntries: number; swrEntries: number } {
    return {
      memoryEntries: 0, // SearchCache doesn't expose count
      swrEntries: this.swrStore.size,
    };
  }

  /** 手动 GC */
  collectGarbage(): void {
    this.memoryCache.collectGarbage();
    const now = Date.now();
    for (const [key, entry] of this.swrStore.entries()) {
      if (now - entry.timestamp > entry.gcTime) {
        this.swrStore.delete(key);
      }
    }
  }

  // 代理去重方法
  getPending<T>(key: string): Promise<T> | undefined {
    return this.memoryCache.getPending<T>(key);
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.memoryCache.setPending(key, promise);
  }

  deletePending(key: string): void {
    this.memoryCache.deletePending(key);
  }
}

/** 全局单例 */
let _apiCache: APICache | null = null;

export function getAPICache(): APICache {
  if (!_apiCache) _apiCache = new APICache();
  return _apiCache;
}
