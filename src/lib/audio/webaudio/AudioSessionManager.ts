/**
 * Phase 18A — AudioSessionManager
 *
 * Monitors audio session events: AirPods disconnect, Bluetooth changes,
 * audio interruptions (calls, alarms), and audio ducking.
 * Integrates with existing useStabilityMonitor telemetry pipeline.
 */
import type { AudioSessionEventType, AudioSessionEvent } from "@/types";

export class AudioSessionManager {
  private static instance: AudioSessionManager | null = null;

  private listeners: Array<(e: AudioSessionEvent) => void> = [];
  private mounted = false;
  private _wasPlaying = false;
  private _duckedVolume = false;

  private _pageHideHandler: ((e: PageTransitionEvent) => void) | null = null;
  private _visibilityHandler: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AudioSessionManager {
    if (!AudioSessionManager.instance) {
      AudioSessionManager.instance = new AudioSessionManager();
    }
    return AudioSessionManager.instance;
  }

  // ==================== Mount / Unmount ====================

  mount(onEvent: (e: AudioSessionEvent) => void): void {
    if (this.mounted) return;
    this.mounted = true;

    this.listeners.push(onEvent);

    if (typeof window === "undefined") return;

    // Visibility change → proxy for audio interruptions (iOS pauses on calls)
    this._visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        this._wasPlaying = true;
        this.emit("audio_interruption_begin", "App backgrounded");
      } else {
        this.emit("audio_interruption_end", "App foregrounded");
      }
    };
    document.addEventListener("visibilitychange", this._visibilityHandler);

    // Pagehide → iOS app switcher / incoming call
    this._pageHideHandler = (e: PageTransitionEvent) => {
      if (!e.persisted) {
        this._wasPlaying = true;
        this.emit("audio_interruption_begin", "Page hidden (not bfcached)");
      }
    };
    window.addEventListener("pagehide", this._pageHideHandler);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;

    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
      this._visibilityHandler = null;
    }
    if (this._pageHideHandler) {
      window.removeEventListener("pagehide", this._pageHideHandler);
      this._pageHideHandler = null;
    }

    this.listeners = [];
  }

  // ==================== API ====================

  /** Notify that AirPods/bluetooth disconnected */
  reportDeviceDisconnect(deviceType: "airpods" | "bluetooth" | "unknown"): void {
    const type: AudioSessionEventType =
      deviceType === "airpods" ? "airpods_disconnect" : "bluetooth_change";
    this.emit(type, `${deviceType} disconnected`);
  }

  /** Notify of audio ducking (e.g. navigation voice, notification) */
  reportDucking(active: boolean): void {
    this._duckedVolume = active;
    this.emit("audio_duck", active ? "Audio ducking active" : "Audio ducking ended");
  }

  /** Get whether audio is currently being ducked */
  get isDucked(): boolean {
    return this._duckedVolume;
  }

  /** Get whether playback was interrupted */
  get wasInterrupted(): boolean {
    return this._wasPlaying;
  }

  clearInterruptedFlag(): void {
    this._wasPlaying = false;
  }

  /** Subscribe to audio session events */
  subscribe(cb: (e: AudioSessionEvent) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  // ==================== Internal ====================

  private emit(type: AudioSessionEventType, details?: string): void {
    const event: AudioSessionEvent = { type, timestamp: Date.now(), details };
    for (const cb of this.listeners) {
      try { cb(event); } catch { /* prevent listener error from breaking loop */ }
    }
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.unmount();
    AudioSessionManager.instance = null;
  }
}

export function getAudioSessionManager(): AudioSessionManager {
  return AudioSessionManager.getInstance();
}
