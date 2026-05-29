/**
 * Phase 18A — AudioContextManager
 *
 * Shared AudioContext lifecycle manager for all Web Audio API features.
 * Handles iOS Safari suspension/resume, visibility optimization, and low-power mode.
 *
 * Phase 18A Stabilization:
 * - Idle suspend timer: suspends context after 30s of no playback (battery saving)
 * - prefers-reduced-motion detection: disables visualization when user prefers reduced motion
 * - Safari recovery: closes + recreates context on "closed" state detection
 * - Error boundary: catches and reports AudioContext creation failures
 */
export class AudioContextManager {
  private static instance: AudioContextManager | null = null;

  private ctx: AudioContext | null = null;
  private _isRunning = false;
  private _unlocked = false;
  private _reducedMotion = false;
  private _errorCount = 0;

  private visibilityHandler: (() => void) | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly IDLE_SUSPEND_MS = 30_000;

  private constructor() {
    if (typeof window !== "undefined") {
      // Detect reduced motion preference
      this._reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      try {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        mq.addEventListener?.("change", (e: MediaQueryListEvent) => {
          this._reducedMotion = e.matches;
        });
      } catch { /* not supported */ }

      this.visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          if (this.ctx?.state === "suspended") {
            void this.resume();
          }
        } else {
          // Page hidden → schedule idle suspend
          this.scheduleIdleSuspend();
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  // ==================== Lifecycle ====================

  ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      try {
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        ctx.addEventListener("statechange", () => {
          this._isRunning = ctx.state === "running";
        });
        this.ctx = ctx;
        this._isRunning = ctx.state === "running";
        this._errorCount = 0;
      } catch (e) {
        this._errorCount++;
        console.warn("[AudioContextManager] Failed to create AudioContext:", e);
        throw e;
      }
    }
    return this.ctx;
  }

  getContext(): AudioContext | null {
    // Auto-recover from closed state
    if (this.ctx && (this.ctx.state as string) === "closed") {
      this.ctx = null;
      this._isRunning = false;
    }
    return this.ctx;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isUnlocked(): boolean {
    return this._unlocked;
  }

  get reducedMotion(): boolean {
    return this._reducedMotion;
  }

  get errorCount(): number {
    return this._errorCount;
  }

  async resume(): Promise<void> {
    if (!this.ctx) return;
    const state = this.ctx.state as string;
    if (state === "suspended") {
      try {
        await this.ctx.resume();
        this._isRunning = (this.ctx.state as string) === "running";
        this._unlocked = true;
        this.cancelIdleSuspend();
      } catch {
        // iOS may reject if not called from user gesture
      }
    } else if (state === "closed") {
      // Re-create if closed
      this.ctx = null;
      this._isRunning = false;
      // Re-create fresh context and determine running state
      const newCtx = this.ensureContext();
      this._isRunning = (newCtx.state as string) === "running";
    }
  }

  suspend(): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    void this.ctx.suspend();
    this._isRunning = false;
  }

  /** Notify that audio playback is active (resets idle timer) */
  notifyPlaybackActive(): void {
    this.cancelIdleSuspend();
  }

  /** Notify that audio playback stopped (starts idle suspend countdown) */
  notifyPlaybackStopped(): void {
    this.scheduleIdleSuspend();
  }

  // ==================== Idle Suspend (Battery Optimization) ====================

  private scheduleIdleSuspend(): void {
    if (this.idleTimer) return;
    this.idleTimer = setTimeout(() => {
      if (this.ctx?.state === "running") {
        void this.ctx.suspend();
        this._isRunning = false;
      }
      this.idleTimer = null;
    }, this.IDLE_SUSPEND_MS);
  }

  private cancelIdleSuspend(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  // ==================== Factory Methods ====================

  createGain(initialValue = 1): GainNode | null {
    if (!this.ctx || this.ctx.state === "closed") return null;
    try {
      const gain = this.ctx.createGain();
      gain.gain.value = initialValue;
      return gain;
    } catch { return null; }
  }

  createAnalyser(fftSize: 256 | 512 | 1024 = 256): AnalyserNode | null {
    if (!this.ctx || this.ctx.state === "closed") return null;
    try {
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.8;
      return analyser;
    } catch { return null; }
  }

  createBiquadFilter(
    type: BiquadFilterType = "peaking",
    frequency = 1000,
    gain = 0,
    Q = 1,
  ): BiquadFilterNode | null {
    if (!this.ctx || this.ctx.state === "closed") return null;
    try {
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.gain.value = gain;
      filter.Q.value = Q;
      return filter;
    } catch { return null; }
  }

  createMediaElementSource(el: HTMLAudioElement): MediaElementAudioSourceNode | null {
    if (!this.ctx || this.ctx.state === "closed") return null;
    try {
      return this.ctx.createMediaElementSource(el);
    } catch {
      return null;
    }
  }

  // ==================== Memory Optimization (Phase 20C) ====================

  /** Trim memory by suspending AudioContext and releasing internal buffers.
   *  Call when app goes to background on iPhone Safari. */
  memoryTrim(): void {
    this.cancelIdleSuspend();
    if (this.ctx && this.ctx.state === "running") {
      void this.ctx.suspend();
      this._isRunning = false;
    }
  }

  /** Full memory release — close AudioContext entirely.
   *  Call on long idle periods or low-memory warnings. */
  releaseMemory(): void {
    this.cancelIdleSuspend();
    if (this.ctx && this.ctx.state !== "closed") {
      try { void this.ctx.close(); } catch { /* ok */ }
      this.ctx = null;
      this._isRunning = false;
      this._unlocked = false;
    }
  }

  /** Re-initialize after memory release (called on user interaction). */
  async reacquire(): Promise<AudioContext | null> {
    if (this.ctx && this.ctx.state !== "closed") return this.ctx;
    try {
      const ctx = this.ensureContext();
      await this.resume();
      return ctx;
    } catch {
      return null;
    }
  }

  /** Estimate AudioContext memory usage (conservative Safari estimate). */
  estimateMemoryUsage(): { state: string; estimatedKB: number } {
    const state = this.ctx ? (this.ctx.state as string) : "uninitialized";
    let estimatedKB = 0;
    if (this.ctx && state === "running") {
      // Safari ~2-4 MB for a running AudioContext with basic graph
      estimatedKB = 3000;
    } else if (this.ctx) {
      estimatedKB = 500;
    }
    return { state, estimatedKB };
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.cancelIdleSuspend();
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this._isRunning = false;
    this._unlocked = false;
    AudioContextManager.instance = null;
  }
}

export function getAudioContextManager(): AudioContextManager {
  return AudioContextManager.getInstance();
}
