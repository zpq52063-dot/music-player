import type { RetryConfig } from "@/types/provider";
import { DEFAULT_RETRY_CONFIG } from "@/types/provider";

// ==================== RequestManager ====================

export class RequestManager {
  private config: RetryConfig;
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private activeAbortControllers: Map<string, AbortController> = new Map();

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /** 执行请求，带重试 + 超时 + 去重 */
  async execute<T>(
    key: string,
    fn: (signal: AbortSignal) => Promise<T>,
    options?: { retries?: number; skipDedup?: boolean; timeoutMs?: number },
  ): Promise<T> {
    const maxRetries = options?.retries ?? this.config.maxRetries;
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs;

    // 去重：相同 key 的请求合并
    if (!options?.skipDedup) {
      const pending = this.pendingRequests.get(key);
      if (pending) return pending as Promise<T>;
    }

    const promise = this.executeWithRetry(key, fn, maxRetries, 0, timeoutMs);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
      this.activeAbortControllers.delete(key);
    }
  }

  /** 取消指定 key 的进行中请求 */
  cancel(key: string): void {
    const controller = this.activeAbortControllers.get(key);
    if (controller) {
      controller.abort();
      this.activeAbortControllers.delete(key);
    }
    this.pendingRequests.delete(key);
  }

  /** 取消所有进行中请求 */
  cancelAll(): void {
    for (const [key, controller] of this.activeAbortControllers) {
      controller.abort();
      this.activeAbortControllers.delete(key);
    }
    this.pendingRequests.clear();
  }

  /** 是否有进行中的请求 */
  hasPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  // ==================== Private ====================

  private async executeWithRetry<T>(
    key: string,
    fn: (signal: AbortSignal) => Promise<T>,
    retriesLeft: number,
    attempt: number = 0,
    timeoutMs?: number,
  ): Promise<T> {
    // 取消之前的同 key 请求
    this.cancel(key);

    const controller = new AbortController();
    this.activeAbortControllers.set(key, controller);

    // 超时
    const effectiveTimeout = timeoutMs ?? this.config.timeoutMs;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, effectiveTimeout);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);

      // 如果被取消，直接抛出
      if ((err as Error).name === "AbortError") {
        throw new Error(`Request cancelled: ${key}`);
      }

      // 还有重试次数
      if (retriesLeft > 0) {
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, attempt),
          this.config.maxDelayMs,
        );
        await sleep(delay + Math.random() * 500);
        return this.executeWithRetry(key, fn, retriesLeft - 1, attempt + 1, timeoutMs);
      }

      throw err;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 全局单例 */
let _requestManager: RequestManager | null = null;

export function getRequestManager(): RequestManager {
  if (!_requestManager) _requestManager = new RequestManager();
  return _requestManager;
}
