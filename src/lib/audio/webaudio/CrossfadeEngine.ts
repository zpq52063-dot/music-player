/**
 * Phase 18A — CrossfadeEngine
 *
 * Dual-slot crossfade using Web Audio API GainNode.
 * Slot A: current song (fades out). Slot B: next song (fades in).
 * Overlaps two HTML5 Audio elements via MediaElementSourceNode → GainNode chains.
 *
 * Phase 18A Stabilization:
 * - Race condition guard: generation counter prevents stale async completions
 * - GainNode leak fix: preGainNodes cleaned in stopSlot, all nodes disconnected
 * - Rapid song-change protection: cancelCrossfade aborts pending setup via generation bump
 * - Burst/pop prevention: gain ramp scheduled before audio.play(), safety clamp on abort
 * - Memory: Audio element src cleared + load() before nulling
 */
import { getAudioContextManager } from "./AudioContextManager";

interface CrossfadeSlot {
  audio: HTMLAudioElement | null;
  source: MediaElementAudioSourceNode | null;
  gain: GainNode | null;
  url: string;
}

export class CrossfadeEngine {
  private static instance: CrossfadeEngine | null = null;

  private slotA: CrossfadeSlot = { audio: null, source: null, gain: null, url: "" };
  private slotB: CrossfadeSlot = { audio: null, source: null, gain: null, url: "" };

  private durationMs = 2500;
  private curve: "linear" | "equal-power" = "linear";
  private active = false;

  private completionTimer: ReturnType<typeof setTimeout> | null = null;
  private onCompleteCallback: (() => void) | null = null;

  // Generation counter — bumped on every cancel/start, prevents stale async completions
  private generation = 0;

  // Additional processing nodes (injected by other features)
  private preGainNodes: Map<string, GainNode[]> = new Map();

  private constructor() {}

  static getInstance(): CrossfadeEngine {
    if (!CrossfadeEngine.instance) {
      CrossfadeEngine.instance = new CrossfadeEngine();
    }
    return CrossfadeEngine.instance;
  }

  // ==================== Configuration ====================

  setDuration(ms: number): void {
    this.durationMs = Math.max(1000, Math.min(5000, ms));
  }

  getDuration(): number {
    return this.durationMs;
  }

  setCurve(curve: "linear" | "equal-power"): void {
    this.curve = curve;
  }

  get isActive(): boolean {
    return this.active;
  }

  // ==================== Core API ====================

  async startCrossfade(
    currentUrl: string,
    nextUrl: string,
    durationMs?: number,
    onComplete?: () => void,
  ): Promise<void> {
    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) {
      onComplete?.();
      return;
    }

    if (ctx.state === "suspended") {
      await ctxMgr.resume();
    }

    const dur = durationMs ?? this.durationMs;

    // Cancel any in-progress crossfade and bump generation to abort stale async work
    this.cancelCrossfade();
    this.generation++;
    const gen = this.generation;

    this.active = true;
    this.onCompleteCallback = onComplete ?? null;

    const now = ctx.currentTime;

    // --- Slot A: current song (fading out) ---
    if (this.slotA.audio && this.slotA.gain) {
      // Already playing — just ramp it down in-place (avoids re-creating source)
      this.rampGain(this.slotA.gain, 1, 0, dur, now);
    } else {
      await this.setupSlot("A", currentUrl, 1, 0, dur, now, gen);
      if (this.generation !== gen) return; // aborted by a newer call
    }

    // --- Slot B: next song (fading in) ---
    await this.setupSlot("B", nextUrl, 0, 1, dur, now, gen);
    if (this.generation !== gen) return; // aborted

    // Schedule completion
    this.completionTimer = setTimeout(() => {
      if (this.generation !== gen) return;
      this.finishCrossfade();
    }, dur + 150);
  }

  cancelCrossfade(): void {
    if (this.completionTimer) {
      clearTimeout(this.completionTimer);
      this.completionTimer = null;
    }

    // Ramp down both slots to 0 quickly before stopping (prevents pops)
    const now = getAudioContextManager().getContext()?.currentTime ?? 0;
    if (this.slotA.gain && this.slotA.audio && !this.slotA.audio.paused) {
      try {
        this.slotA.gain.gain.cancelScheduledValues(now);
        this.slotA.gain.gain.setValueAtTime(this.slotA.gain.gain.value, now);
        this.slotA.gain.gain.linearRampToValueAtTime(0, now + 0.03);
      } catch { /* ignore */ }
    }
    if (this.slotB.gain && this.slotB.audio && !this.slotB.audio.paused) {
      try {
        this.slotB.gain.gain.cancelScheduledValues(now);
        this.slotB.gain.gain.setValueAtTime(this.slotB.gain.gain.value, now);
        this.slotB.gain.gain.linearRampToValueAtTime(0, now + 0.03);
      } catch { /* ignore */ }
    }

    // Brief delay to let the quick ramp complete, then stop
    setTimeout(() => {
      this.stopSlot("A");
      this.stopSlot("B");
    }, 50);

    this.onCompleteCallback = null;
    this.active = false;
  }

  getActiveAudio(): HTMLAudioElement | null {
    if (this.slotB.audio && !this.slotB.audio.paused) return this.slotB.audio;
    if (this.slotA.audio && !this.slotA.audio.paused) return this.slotA.audio;
    return this.slotA.audio ?? this.slotB.audio;
  }

  getSlotGain(slot: "A" | "B"): GainNode | null {
    return slot === "A" ? this.slotA.gain : this.slotB.gain;
  }

  getSlotAudio(slot: "A" | "B"): HTMLAudioElement | null {
    return slot === "A" ? this.slotA.audio : this.slotB.audio;
  }

  /** Expose generation for debugging */
  getGeneration(): number {
    return this.generation;
  }

  // ==================== Internal ====================

  private async setupSlot(
    name: "A" | "B",
    url: string,
    startGain: number,
    endGain: number,
    durationMs: number,
    startTime: number,
    generation: number,
  ): Promise<void> {
    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) return;

    const slot = name === "A" ? this.slotA : this.slotB;
    this.stopSlot(name);

    // Guard: check if aborted before creating resources
    if (this.generation !== generation) return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = url;

    slot.audio = audio;
    slot.url = url;

    // Wait for enough data before connecting (with safety timeout)
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      audio.addEventListener("canplay", done, { once: true });
      audio.addEventListener("loadedmetadata", done, { once: true });
      audio.addEventListener("error", done, { once: true });
      audio.load();
      setTimeout(done, 500);
    });

    if (this.generation !== generation) {
      // Aborted during load — clean up the audio we just created
      audio.pause();
      audio.src = "";
      audio.load();
      slot.audio = null;
      slot.url = "";
      return;
    }

    const source = ctxMgr.createMediaElementSource(audio);
    const gain = ctxMgr.createGain(0);

    if (!source || !gain) {
      audio.volume = endGain;
      void audio.play();
      return;
    }

    slot.source = source;
    slot.gain = gain;

    // Build audio graph: source → gain → (...preGains...) → destination
    source.connect(gain);
    this.connectPreGains(name, gain, ctx.destination);

    // Schedule gain ramp BEFORE starting playback (prevents initial burst)
    gain.gain.cancelScheduledValues(startTime);
    gain.gain.setValueAtTime(startGain, startTime);
    this.rampGain(gain, startGain, endGain, durationMs, startTime);

    audio.volume = 1;
    try {
      await audio.play();
    } catch {
      // NotAllowedError on iOS — AudioManager pattern handles retry
    }
  }

  private connectPreGains(slotName: string, fromNode: AudioNode, destination: AudioNode): void {
    const preGains = this.preGainNodes.get(slotName) ?? [];
    let lastNode: AudioNode = fromNode;
    for (const pg of preGains) {
      lastNode.connect(pg);
      lastNode = pg;
    }
    lastNode.connect(destination);
  }

  private rampGain(
    gain: GainNode | null,
    from: number,
    to: number,
    durationMs: number,
    startTime: number,
  ): void {
    if (!gain) return;
    const dur = durationMs / 1000;

    if (this.curve === "equal-power") {
      gain.gain.cancelScheduledValues(startTime);
      gain.gain.setValueAtTime(from, startTime);
      gain.gain.setTargetAtTime(to, startTime, dur / 3);
    } else {
      gain.gain.cancelScheduledValues(startTime);
      gain.gain.setValueAtTime(from, startTime);
      gain.gain.linearRampToValueAtTime(to, startTime + dur);
    }
  }

  private stopSlot(name: "A" | "B"): void {
    const slot = name === "A" ? this.slotA : this.slotB;

    if (slot.audio) {
      slot.audio.pause();
      slot.audio.removeAttribute("src");
      slot.audio.src = "";
      slot.audio.load();
      slot.audio = null;
    }
    if (slot.source) {
      try { slot.source.disconnect(); } catch { /* ok */ }
      slot.source = null;
    }
    if (slot.gain) {
      try { slot.gain.disconnect(); } catch { /* ok */ }
      slot.gain = null;
    }

    // Clean up pre-gain nodes registered for this slot (prevents GainNode leak)
    const preGains = this.preGainNodes.get(name);
    if (preGains) {
      for (const pg of preGains) {
        try { pg.disconnect(); } catch { /* ok */ }
      }
      this.preGainNodes.delete(name);
    }

    slot.url = "";
  }

  private finishCrossfade(): void {
    this.stopSlot("A");

    // Slot B → new Slot A (preserving GainNode references)
    this.slotA = { ...this.slotB };
    this.slotB = { audio: null, source: null, gain: null, url: "" };

    // Move any pre-gains from B to A
    const bPreGains = this.preGainNodes.get("B");
    if (bPreGains) {
      this.preGainNodes.set("A", bPreGains);
      this.preGainNodes.delete("B");
    }

    this.active = false;
    this.onCompleteCallback?.();
    this.onCompleteCallback = null;
  }

  // ==================== Plugin: Pre-gain nodes ====================

  registerPreGain(slot: "A" | "B", nodes: GainNode[]): void {
    this.preGainNodes.set(slot, nodes);
  }

  clearPreGains(slot: "A" | "B"): void {
    const nodes = this.preGainNodes.get(slot);
    if (nodes) {
      for (const n of nodes) {
        try { n.disconnect(); } catch { /* ok */ }
      }
    }
    this.preGainNodes.delete(slot);
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.cancelCrossfade();
    // Clean all pre-gains
    for (const [key] of this.preGainNodes) {
      this.clearPreGains(key as "A" | "B");
    }
    this.preGainNodes.clear();
    CrossfadeEngine.instance = null;
  }
}

export function getCrossfadeEngine(): CrossfadeEngine {
  return CrossfadeEngine.getInstance();
}
