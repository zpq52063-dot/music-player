import type { LoadingState, AudioEventCallbacks } from "@/types";

/**
 * 全局音频管理器（单例）
 *
 * 职责：
 * - 管理单个 HTML5 Audio 实例
 * - 播放/暂停/seek/音量/倍速
 * - RAF 驱动时间更新（暂停自动停止）
 * - 缓冲进度上报
 * - 加载状态管理
 * - 页面可见性节能
 * - iOS Safari play() 错误防护
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private audio: HTMLAudioElement | null = null;
  private callbacks: AudioEventCallbacks | null = null;
  private rafId: number | null = null;
  private lastTimeUpdate = 0;
  private readonly TIME_THROTTLE_MS = 200;

  // 内置卡顿检测
  private lastCurrentTime = 0;
  private stallCheckCount = 0;
  private readonly STALL_THRESHOLD_MS = 4000;

  private isVisible = true;
  private visibilityHandler: (() => void) | null = null;

  // iOS play() 重试
  private playRetryCount = 0;
  private readonly MAX_PLAY_RETRIES = 3;
  private playRetryTimer: ReturnType<typeof setTimeout> | null = null;

  // 音频已被用户交互解锁
  private audioUnlocked = false;

  private constructor() {
    if (typeof document !== "undefined") {
      this.isVisible = document.visibilityState === "visible";
      this.visibilityHandler = () => {
        this.isVisible = document.visibilityState === "visible";
        if (!this.isVisible) {
          this.stopRAF();
        } else if (this.audio && !this.audio.paused) {
          this.startRAF();
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // ==================== Core API ====================

  load(url: string, callbacks: AudioEventCallbacks): void {
    this.destroyAudio();
    this.callbacks = callbacks;

    this.reportLoadState("loading");

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 1;
    audio.src = url;

    audio.addEventListener("loadedmetadata", () => {
      this.reportLoadState("ready");
      this.callbacks?.onTimeUpdate(audio.currentTime, audio.duration || 0);
    });

    audio.addEventListener("loadstart", () => this.reportLoadState("loading"));
    audio.addEventListener("canplay", () => this.reportLoadState("ready"));

    audio.addEventListener("timeupdate", () => {
      // 由 RAF 驱动，这里仅更新 duration
    });

    audio.addEventListener("progress", () => {
      if (audio.buffered.length > 0) {
        const end = audio.buffered.end(audio.buffered.length - 1);
        const pct = audio.duration > 0 ? (end / audio.duration) * 100 : 0;
        this.callbacks?.onBufferedChange(pct);
      }
    });

    audio.addEventListener("ended", () => {
      this.stopRAF();
      this.callbacks?.onEnded();
    });

    audio.addEventListener("error", () => {
      this.reportLoadState("error");
      this.callbacks?.onError(`Audio load failed: ${audio.error?.message ?? "unknown"}`);
    });

    audio.addEventListener("waiting", () => this.reportLoadState("loading"));
    audio.addEventListener("playing", () => {
      this.reportLoadState("ready");
      this.startRAF();
    });
    audio.addEventListener("pause", () => this.stopRAF());

    this.audio = audio;
  }

  async play(): Promise<void> {
    if (!this.audio) return;
    this.clearPlayRetry();

    try {
      await this.audio.play();
      this.playRetryCount = 0;
      this.audioUnlocked = true;
    } catch (e) {
      const err = e as Error;
      // NotAllowedError: iOS 要求用户手势后才能播放
      if (err.name === "NotAllowedError") {
        if (this.playRetryCount < this.MAX_PLAY_RETRIES) {
          this.playRetryCount++;
          this.playRetryTimer = setTimeout(
            () => this.play(),
            200 * this.playRetryCount,
          );
        } else {
          console.warn("[AudioManager] play() blocked: user gesture required");
          this.playRetryCount = 0;
        }
        return;
      }
      // AbortError: 新的 load() 中断了上一个 play()
      if (err.name === "AbortError") {
        return;
      }
      console.warn("[AudioManager] play() failed:", err.message);
    }
  }

  pause(): void {
    this.clearPlayRetry();
    this.audio?.pause();
    this.stopRAF();
  }

  resume(): void {
    if (!this.audio) return;
    this.play();
  }

  /** 是否已被用户手势解锁 */
  get isUnlocked(): boolean {
    return this.audioUnlocked;
  }

  seek(time: number): void {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    this.callbacks?.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
  }

  setVolume(vol: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  setPlaybackRate(rate: number): void {
    if (!this.audio) return;
    this.audio.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  get currentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  get duration(): number {
    return this.audio?.duration ?? 0;
  }

  get paused(): boolean {
    return this.audio?.paused ?? true;
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    this.clearPlayRetry();
    this.destroyAudio();
    this.callbacks = null;
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    AudioManager.instance = null;
  }

  private clearPlayRetry(): void {
    if (this.playRetryTimer) {
      clearTimeout(this.playRetryTimer);
      this.playRetryTimer = null;
    }
    this.playRetryCount = 0;
  }

  private destroyAudio(): void {
    this.stopRAF();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
      this.audio = null;
    }
  }

  // ==================== Internal ====================

  private reportLoadState(state: LoadingState): void {
    this.callbacks?.onLoadStateChange(state);
  }

  // ==================== RAF Engine ====================

  private startRAF(): void {
    if (this.rafId !== null) return;
    this.lastTimeUpdate = 0;
    this.lastCurrentTime = 0;
    this.stallCheckCount = 0;

    const tick = () => {
      if (!this.audio || this.audio.paused) {
        this.stopRAF();
        return;
      }

      const now = performance.now();
      if (now - this.lastTimeUpdate >= this.TIME_THROTTLE_MS || this.lastTimeUpdate === 0) {
        this.lastTimeUpdate = now;

        // 内置卡顿检测：currentTime 持续不变 → 音频已卡死
        const ct = this.audio.currentTime;
        if (ct > 0 && Math.abs(ct - this.lastCurrentTime) < 0.05) {
          this.stallCheckCount++;
          if (this.stallCheckCount * this.TIME_THROTTLE_MS >= this.STALL_THRESHOLD_MS) {
            this.stallCheckCount = 0;
            this.callbacks?.onError("Audio stalled: currentTime unchanged for 4s");
            this.stopRAF();
            return;
          }
        } else {
          this.stallCheckCount = 0;
        }
        this.lastCurrentTime = ct;

        this.callbacks?.onTimeUpdate(ct, this.audio.duration || 0);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private stopRAF(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stallCheckCount = 0;
  }
}

/** 获取全局单例 */
export function getAudioManager(): AudioManager {
  return AudioManager.getInstance();
}
