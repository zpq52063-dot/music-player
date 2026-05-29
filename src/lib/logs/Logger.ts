/**
 * Phase 8 — 日志系统
 *
 * 分类日志:
 * - audio: 音频播放相关
 * - provider: Provider 请求/响应
 * - playback: 播放状态转换
 * - cache: 缓存读写
 * - debug: 开发调试
 *
 * 生产环境仅输出 error 级别。
 */

export type LogCategory = "audio" | "provider" | "playback" | "cache" | "debug" | "watchdog" | "startup" | "system" | "crash-recovery" | "stability" | "cache-v2";
export type LogLevel = "debug" | "info" | "warn" | "error";

const STORAGE_KEY = "music_debug_logs";
const MAX_BUFFER = 200;

interface LogEntry {
  ts: string;
  cat: LogCategory;
  lvl: LogLevel;
  msg: string;
  data?: unknown;
}

class Logger {
  private buffer: LogEntry[] = [];
  private enabled: Record<LogCategory, boolean> = {
    audio: false,
    provider: false,
    playback: false,
    cache: false,
    debug: false,
    watchdog: false,
    startup: false,
    system: false,
    "crash-recovery": false,
    stability: false,
    "cache-v2": false,
  };

  constructor() {
    this.loadFromStorage();
  }

  // ==================== Public API ====================

  enable(category: LogCategory): void {
    this.enabled[category] = true;
    this.save();
  }

  disable(category: LogCategory): void {
    this.enabled[category] = false;
    this.save();
  }

  isEnabled(category: LogCategory): boolean {
    return this.enabled[category];
  }

  enableAll(): void {
    for (const k of Object.keys(this.enabled) as LogCategory[]) {
      this.enabled[k] = true;
    }
    this.save();
  }

  disableAll(): void {
    for (const k of Object.keys(this.enabled) as LogCategory[]) {
      this.enabled[k] = false;
    }
    this.save();
  }

  log(category: LogCategory, level: LogLevel, message: string, data?: unknown): void {
    if (!this.enabled[category]) return;

    const entry: LogEntry = {
      ts: new Date().toISOString(),
      cat: category,
      lvl: level,
      msg: message,
      data,
    };

    this.buffer.push(entry);
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer = this.buffer.slice(-MAX_BUFFER);
    }

    // Console output
    const prefix = `[${category}]`;
    switch (level) {
      case "debug":
        console.debug(prefix, message, data ?? "");
        break;
      case "info":
        console.info(prefix, message, data ?? "");
        break;
      case "warn":
        console.warn(prefix, message, data ?? "");
        break;
      case "error":
        console.error(prefix, message, data ?? "");
        break;
    }
  }

  // Shorthand methods
  debug(cat: LogCategory, msg: string, data?: unknown): void {
    this.log(cat, "debug", msg, data);
  }
  info(cat: LogCategory, msg: string, data?: unknown): void {
    this.log(cat, "info", msg, data);
  }
  warn(cat: LogCategory, msg: string, data?: unknown): void {
    this.log(cat, "warn", msg, data);
  }
  error(cat: LogCategory, msg: string, data?: unknown): void {
    this.log(cat, "error", msg, data);
  }

  // ==================== Buffer access ====================

  getLogs(category?: LogCategory): LogEntry[] {
    if (category) {
      return this.buffer.filter((e) => e.cat === category);
    }
    return [...this.buffer];
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  // ==================== Persistence ====================

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.enabled));
    } catch {
      // silently fail
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<LogCategory, boolean>>;
        for (const k of Object.keys(this.enabled) as LogCategory[]) {
          if (typeof parsed[k] === "boolean") {
            this.enabled[k] = parsed[k];
          }
        }
      }
    } catch {
      // silently fail
    }
  }
}

// Global singleton
let _logger: Logger | null = null;

export function getLogger(): Logger {
  if (!_logger) {
    _logger = new Logger();
  }
  return _logger;
}
