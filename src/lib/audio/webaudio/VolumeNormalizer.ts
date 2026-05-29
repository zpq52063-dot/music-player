/**
 * Phase 18A — VolumeNormalizer
 *
 * Lightweight per-song volume normalization using RMS estimation.
 * Stores gain factors in-memory per songId (lost on reload — acceptable).
 *
 * Phase 18A Stabilization:
 * - Range-request fallback: if server doesn't support Range, fetch without header
 * - AbortController: cancel in-flight analysis when not needed
 * - Map size limit: prevent memory leak from accumulating gains
 * - Minimum buffer: guard against trivial decode (e.g. only silence header)
 */
import type { Song } from "@/types";
import { getAudioContextManager } from "./AudioContextManager";

export class VolumeNormalizer {
  private static instance: VolumeNormalizer | null = null;

  private gainMap = new Map<string, number>();
  private _targetRMS = 0.15;
  private _enabled = true;
  private abortController: AbortController | null = null;
  private readonly MAX_MAP_SIZE = 200;

  private constructor() {}

  static getInstance(): VolumeNormalizer {
    if (!VolumeNormalizer.instance) {
      VolumeNormalizer.instance = new VolumeNormalizer();
    }
    return VolumeNormalizer.instance;
  }

  // ==================== Configuration ====================

  set enabled(v: boolean) {
    this._enabled = v;
    if (!v) this.cancelPending();
  }
  get enabled(): boolean {
    return this._enabled;
  }

  set targetRMS(v: number) {
    this._targetRMS = v;
  }
  get targetRMS(): number {
    return this._targetRMS;
  }

  // ==================== API ====================

  getGain(songId: string): number {
    if (!this._enabled) return 1;
    return this.gainMap.get(songId) ?? 1;
  }

  async analyzeSong(song: Song): Promise<void> {
    if (!this._enabled) return;
    if (this.gainMap.has(song.id)) return;
    if (typeof window === "undefined") return;

    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) return;

    const url = song.audio_url;
    if (!url) return;

    // Cancel any in-flight analysis
    this.cancelPending();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      let arrayBuffer: ArrayBuffer;

      // Try Range request first (fast, small download)
      try {
        const response = await fetch(url, {
          headers: { Range: "bytes=0-65535" },
          signal,
        });
        if (response.ok) {
          arrayBuffer = await response.arrayBuffer();
        } else {
          throw new Error("Range not supported");
        }
      } catch {
        if (signal.aborted) return;
        // Fallback: fetch without Range header (server doesn't support it)
        try {
          const response = await fetch(url, { signal });
          arrayBuffer = await response.arrayBuffer();
        } catch {
          return; // Network error, skip analysis
        }
      }

      if (signal.aborted) return;
      if (arrayBuffer.byteLength < 1024) return; // Too small, probably not audio data

      // Decode and analyze RMS
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        return; // Codec not supported or corrupt data
      }

      if (signal.aborted) return;

      const rms = this.calculateRMS(audioBuffer);

      if (rms > 0 && rms < 1.0) {
        const gain = Math.max(0.5, Math.min(2.0, this._targetRMS / rms));
        this.addToMap(song.id, gain);
      }
    } catch {
      // Aborted or network error — skip
    } finally {
      if (this.abortController?.signal === signal) {
        this.abortController = null;
      }
    }
  }

  createNormalizationGain(songId: string): GainNode | null {
    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) return null;
    return ctxMgr.createGain(this.getGain(songId));
  }

  clear(): void {
    this.cancelPending();
    this.gainMap.clear();
  }

  // ==================== Internal ====================

  private cancelPending(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private addToMap(songId: string, gain: number): void {
    this.gainMap.set(songId, gain);
    // Evict oldest entry if over limit
    if (this.gainMap.size > this.MAX_MAP_SIZE) {
      const firstKey = this.gainMap.keys().next().value;
      if (firstKey !== undefined) {
        this.gainMap.delete(firstKey);
      }
    }
  }

  private calculateRMS(buffer: AudioBuffer): number {
    let sum = 0;
    const channelCount = buffer.numberOfChannels;
    const length = buffer.length;

    for (let ch = 0; ch < channelCount; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        sum += (data[i] ?? 0) * (data[i] ?? 0);
      }
    }

    const mean = sum / (length * channelCount);
    return Math.sqrt(mean);
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.cancelPending();
    this.gainMap.clear();
    VolumeNormalizer.instance = null;
  }
}

export function getVolumeNormalizer(): VolumeNormalizer {
  return VolumeNormalizer.getInstance();
}
