/**
 * 音频引擎封装
 * Phase 1: 基础 HTML5 Audio 封装，预留后续替换为 Web Audio API
 */

type AudioEventCallback = (data: { currentTime: number; duration: number }) => void;
type AudioEndedCallback = () => void;

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private onUpdate: AudioEventCallback | null = null;
  private onEnded: AudioEndedCallback | null = null;
  private rafId: number | null = null;

  get currentTime() {
    return this.audio?.currentTime ?? 0;
  }

  get duration() {
    return this.audio?.duration ?? 0;
  }

  get isPaused() {
    return this.audio?.paused ?? true;
  }

  load(url: string, onUpdate: AudioEventCallback, onEnded: AudioEndedCallback) {
    this.destroy();

    this.onUpdate = onUpdate;
    this.onEnded = onEnded;

    this.audio = new Audio(url);
    this.audio.preload = "auto";
    this.audio.volume = 0.8;

    this.audio.addEventListener("loadedmetadata", () => {
      this.tick();
    });

    this.audio.addEventListener("ended", () => {
      this.onEnded?.();
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Audio load error:", e);
    });
  }

  play() {
    void this.audio?.play();
    this.tick();
  }

  pause() {
    this.audio?.pause();
    this.stopTick();
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  setVolume(vol: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  private tick = () => {
    this.stopTick();
    const loop = () => {
      if (this.audio && !this.audio.paused) {
        this.onUpdate?.({
          currentTime: this.audio.currentTime,
          duration: this.audio.duration || 0,
        });
        this.rafId = requestAnimationFrame(loop);
      }
    };
    loop();
  };

  private stopTick() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stopTick();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.load();
      this.audio = null;
    }
    this.onUpdate = null;
    this.onEnded = null;
  }
}

/** 全局单例 */
export const audioEngine = typeof window !== "undefined" ? new AudioEngine() : null;
