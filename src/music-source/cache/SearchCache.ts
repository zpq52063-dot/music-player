// ==================== 缓存条目 ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ==================== 缓存配置 ====================

interface CacheConfig {
  staleTime: number; // ms — 数据新鲜时间
  gcTime: number; // ms — 垃圾回收时间（超过后自动清理）
}

const DEFAULTS: Record<string, CacheConfig> = {
  search: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  suggestion: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  hotKeywords: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },
  songDetail: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  playlist: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },
};

const DEFAULT_SEARCH: CacheConfig = { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 };

function getConfig(category: string): CacheConfig {
  const cfg = DEFAULTS[category];
  return cfg ?? DEFAULT_SEARCH;
}

// ==================== SearchCache ====================

export class SearchCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private pending: Map<string, Promise<unknown>> = new Map();

  /** 获取缓存数据。返回 null 表示 miss 或已过期 */
  get<T>(key: string, category: string = "search"): T | null {
    const config = getConfig(category);
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > config.gcTime) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** 检查缓存是否为新鲜（未超 staleTime） */
  isFresh(key: string, category: string = "search"): boolean {
    const config = getConfig(category);
    const entry = this.store.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < config.staleTime;
  }

  /** 写入缓存 */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  /** 删除指定 key */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** 清空全部缓存 */
  clear(): void {
    this.store.clear();
    this.pending.clear();
  }

  /** 按前缀失效 */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  // --- 请求去重 ---

  /** 获取或创建 pending request（防止并发重复请求） */
  getPending<T>(key: string): Promise<T> | undefined {
    return this.pending.get(key) as Promise<T> | undefined;
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pending.set(key, promise);
    promise.finally(() => {
      this.pending.delete(key);
    });
  }

  deletePending(key: string): void {
    this.pending.delete(key);
  }

  // --- GC ---

  /** 手动触发一次垃圾回收 */
  collectGarbage(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      // 使用最宽松的 gcTime 做保守清理
      const maxGc = 60 * 60 * 1000;
      if (now - entry.timestamp > maxGc) {
        this.store.delete(key);
      }
    }
  }
}

/** 全局单例 */
let _instance: SearchCache | null = null;

export function getSearchCache(): SearchCache {
  if (!_instance) _instance = new SearchCache();
  return _instance;
}
