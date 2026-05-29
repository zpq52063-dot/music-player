/**
 * Phase 18A — VisualizationAnalyzer
 *
 * Provides FFT frequency/time-domain data via Web Audio API AnalyserNode.
 * Optimized for iPhone Safari: small FFT size, low CPU usage.
 *
 * Phase 18A Stabilization:
 * - RAF throttling: data updates capped at configurable interval (15fps iPhone default)
 * - Visibility pause: stops data collection when page is hidden
 * - Reduced motion: returns zeroed data when user prefers reduced motion
 * - Idle timeout: auto-pauses after 10s of no data requests
 */
import { getAudioContextManager } from "./AudioContextManager";
import type { VisualizationMode } from "@/types";

export class VisualizationAnalyzer {
  private static instance: VisualizationAnalyzer | null = null;

  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array = new Uint8Array(new ArrayBuffer(0));
  private timeData: Uint8Array = new Uint8Array(new ArrayBuffer(0));
  private _mode: VisualizationMode = "off";
  private _fftSize: 256 | 512 | 1024 = 256;

  // Throttling
  private _throttleMs = 66; // ~15fps default for iPhone Safari
  private _lastFreqUpdate = 0;
  private _lastTimeUpdate = 0;
  private _cachedFreqData: Uint8Array | null = null;
  private _cachedTimeData: Uint8Array | null = null;

  // Visibility / idle
  private _pageVisible = true;
  private _lastRequestTime = 0;
  private _idleTimeoutMs = 10_000;
  private _visibilityHandler: (() => void) | null = null;

  private constructor() {
    if (typeof document !== "undefined") {
      this._pageVisible = document.visibilityState === "visible";
      this._visibilityHandler = () => {
        this._pageVisible = document.visibilityState === "visible";
      };
      document.addEventListener("visibilitychange", this._visibilityHandler);
    }
  }

  static getInstance(): VisualizationAnalyzer {
    if (!VisualizationAnalyzer.instance) {
      VisualizationAnalyzer.instance = new VisualizationAnalyzer();
    }
    return VisualizationAnalyzer.instance;
  }

  // ==================== Configuration ====================

  get mode(): VisualizationMode {
    return this._mode;
  }
  set mode(v: VisualizationMode) {
    this._mode = v;
  }

  set fftSize(v: 256 | 512 | 1024) {
    this._fftSize = v;
    if (this.analyser) {
      this.analyser.fftSize = v;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);
    }
  }
  get fftSize(): 256 | 512 | 1024 {
    return this._fftSize;
  }

  /** Set throttle interval in ms. iPhone Safari default: 66ms (15fps) */
  set throttleMs(v: number) {
    this._throttleMs = v;
  }

  // ==================== Lifecycle ====================

  initialize(sourceNode: AudioNode): boolean {
    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) return false;

    this.dispose();

    this.analyser = ctxMgr.createAnalyser(this._fftSize);
    if (!this.analyser) return false;

    sourceNode.connect(this.analyser);

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);

    return true;
  }

  dispose(): void {
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch { /* ok */ }
      this.analyser = null;
    }
    this._cachedFreqData = null;
    this._cachedTimeData = null;
  }

  // ==================== Data Access (with throttling) ====================

  getFrequencyData(): Uint8Array {
    this._lastRequestTime = performance.now();

    // Respect reduced-motion preference
    if (getAudioContextManager().reducedMotion) {
      return this.freqData;
    }

    if (!this.analyser) return this.freqData;
    if (!this._pageVisible) {
      return this._cachedFreqData ?? this.freqData;
    }

    const now = performance.now();
    if (this._cachedFreqData && now - this._lastFreqUpdate < this._throttleMs) {
      return this._cachedFreqData;
    }

    this.analyser.getByteFrequencyData(this.freqData as Uint8Array<ArrayBuffer>);
    this._lastFreqUpdate = now;

    // Cache a copy for throttled reads
    this._cachedFreqData = new Uint8Array(this.freqData);
    return this.freqData;
  }

  getTimeData(): Uint8Array {
    this._lastRequestTime = performance.now();

    if (getAudioContextManager().reducedMotion) {
      return this.timeData;
    }

    if (!this.analyser) return this.timeData;
    if (!this._pageVisible) {
      return this._cachedTimeData ?? this.timeData;
    }

    const now = performance.now();
    if (this._cachedTimeData && now - this._lastTimeUpdate < this._throttleMs) {
      return this._cachedTimeData;
    }

    this.analyser.getByteTimeDomainData(this.timeData as Uint8Array<ArrayBuffer>);
    this._lastTimeUpdate = now;

    this._cachedTimeData = new Uint8Array(this.timeData);
    return this.timeData;
  }

  getBands(count: number): number[] {
    if (getAudioContextManager().reducedMotion || this._mode === "off") {
      return new Array(count).fill(0);
    }

    const freq = this.getFrequencyData();
    if (freq.length === 0) return new Array(count).fill(0);

    const bands: number[] = new Array(count).fill(0);
    const binsPerBand = Math.floor(freq.length / count);

    for (let i = 0; i < count; i++) {
      let sum = 0;
      const start = i * binsPerBand;
      for (let j = 0; j < binsPerBand; j++) {
        sum += freq[start + j] ?? 0;
      }
      bands[i] = sum / binsPerBand / 255;
    }

    return bands;
  }

  detectBeat(threshold = 0.7): boolean {
    if (!this._pageVisible || getAudioContextManager().reducedMotion) return false;
    const bands = this.getBands(4);
    const lowFreq = bands.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    return lowFreq > threshold;
  }

  get isInitialized(): boolean {
    return this.analyser !== null;
  }

  /** Whether the page is currently visible (for external components to check) */
  get isPageVisible(): boolean {
    return this._pageVisible;
  }

  /** Whether data collection is effectively paused */
  get isEffectivelyPaused(): boolean {
    if (!this._pageVisible) return true;
    if (getAudioContextManager().reducedMotion) return true;
    if (this._mode === "off") return true;
    const idleTime = performance.now() - this._lastRequestTime;
    if (idleTime > this._idleTimeoutMs && this._lastRequestTime > 0) return true;
    return false;
  }

  // ==================== Memory Optimization (Phase 20C) ====================

  /** Release cached data buffers without tearing down the analyser node. */
  trimMemory(): void {
    this._cachedFreqData = null;
    this._cachedTimeData = null;
    if (this.freqData.length > 0) {
      this.freqData = new Uint8Array(new ArrayBuffer(0));
    }
    if (this.timeData.length > 0) {
      this.timeData = new Uint8Array(new ArrayBuffer(0));
    }
  }

  // ==================== Cleanup ====================

  destroy(): void {
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
      this._visibilityHandler = null;
    }
    this.dispose();
    VisualizationAnalyzer.instance = null;
  }
}

export function getVisualizationAnalyzer(): VisualizationAnalyzer {
  return VisualizationAnalyzer.getInstance();
}
