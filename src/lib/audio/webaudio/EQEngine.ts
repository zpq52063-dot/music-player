/**
 * Phase 18A — EQEngine
 *
 * 5-band equalizer using Web Audio API BiquadFilterNode chain.
 * Bands: 60Hz (lowshelf), 250Hz (peaking), 1kHz (peaking), 4kHz (peaking), 12kHz (highshelf)
 *
 * Phase 18A Stabilization:
 * - True bypass: disconnect filters from signal path (not just zero gain, saves CPU)
 * - Battery-aware: auto-disables when isBatteryLow is set
 * - Batch apply: setAllBands() avoids N individual filter updates
 */
import { getAudioContextManager } from "./AudioContextManager";
import { EQ_PRESETS } from "./EQPresets";
import { EQ_BANDS } from "@/types";
import type { EQPresetName } from "@/types";

export class EQEngine {
  private static instance: EQEngine | null = null;

  private filters: BiquadFilterNode[] = [];
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private _enabled = false;
  private _currentPreset: EQPresetName | "custom" = "pop";
  private _bands: number[] = [0, 0, 0, 0, 0];
  private _isBatteryLow = false;

  // Tracks the last node our chain was connected to (for reconnect on bypass toggle)
  private _connectedSource: AudioNode | null = null;
  private _connectedDestination: AudioNode | null = null;

  private constructor() {}

  static getInstance(): EQEngine {
    if (!EQEngine.instance) {
      EQEngine.instance = new EQEngine();
    }
    return EQEngine.instance;
  }

  // ==================== Lifecycle ====================

  initialize(): boolean {
    const ctxMgr = getAudioContextManager();
    const ctx = ctxMgr.getContext();
    if (!ctx) return false;

    this.dispose();

    this.inputNode = ctxMgr.createGain(1);
    this.outputNode = ctxMgr.createGain(1);

    if (!this.inputNode || !this.outputNode) return false;

    let prevNode: AudioNode = this.inputNode;

    for (let i = 0; i < EQ_BANDS.length; i++) {
      const band = EQ_BANDS[i];
      if (!band) continue;
      const filter = ctxMgr.createBiquadFilter(
        band.type,
        band.frequency,
        this._bands[i] ?? 0,
        band.type === "peaking" ? 1.4 : 0.7,
      );
      if (!filter) return false;

      prevNode.connect(filter);
      prevNode = filter;
      this.filters.push(filter);
    }

    prevNode.connect(this.outputNode);

    this.applyCurrentBands();
    return true;
  }

  dispose(): void {
    // Disconnect all nodes from the graph
    for (const f of this.filters) {
      try { f.disconnect(); } catch { /* ok */ }
    }
    this.filters = [];
    if (this.inputNode) {
      try { this.inputNode.disconnect(); } catch { /* ok */ }
      this.inputNode = null;
    }
    if (this.outputNode) {
      try { this.outputNode.disconnect(); } catch { /* ok */ }
      this.outputNode = null;
    }
    this._connectedSource = null;
    this._connectedDestination = null;
  }

  // ==================== API ====================

  get enabled(): boolean {
    return this._enabled;
  }

  get currentPreset(): EQPresetName | "custom" {
    return this._currentPreset;
  }

  get bands(): number[] {
    return [...this._bands];
  }

  set isBatteryLow(v: boolean) {
    this._isBatteryLow = v;
    if (v && this._enabled) {
      this.bypass();
    }
  }

  get isBatteryLow(): boolean {
    return this._isBatteryLow;
  }

  /** Connect the EQ chain between input and destination */
  connect(input: AudioNode, destination: AudioNode): void {
    this._connectedSource = input;
    this._connectedDestination = destination;

    if (!this._enabled || this._isBatteryLow) {
      // Direct connection (bypass)
      input.connect(destination);
      return;
    }

    if (!this.inputNode || !this.outputNode) return;
    input.connect(this.inputNode);
    this.outputNode.connect(destination);
  }

  /** True bypass: disconnect filter chain and wire source → destination directly */
  bypass(): void {
    this._enabled = false;

    // Disconnect filters from destination
    if (this.outputNode) {
      try { this.outputNode.disconnect(); } catch { /* ok */ }
    }
    if (this.inputNode) {
      try { this.inputNode.disconnect(); } catch { /* ok */ }
    }

    // Wire source → destination directly
    if (this._connectedSource && this._connectedDestination) {
      try {
        this._connectedSource.connect(this._connectedDestination);
      } catch { /* may already be connected */ }
    }
  }

  enable(): void {
    if (this._isBatteryLow) return;
    this._enabled = true;

    // Disconnect direct path, reconnect through filter chain
    if (this._connectedSource && this._connectedDestination) {
      try { this._connectedSource.disconnect(); } catch { /* ok */ }
      try { this._connectedDestination.disconnect(); } catch { /* ok */ }

      if (this.inputNode && this.outputNode) {
        this._connectedSource.connect(this.inputNode);
        // Filter chain is already connected internally
        this.outputNode.connect(this._connectedDestination);
      } else {
        // Fallback: direct connection
        this._connectedSource.connect(this._connectedDestination);
      }
    }

    this.applyCurrentBands();
  }

  applyPreset(name: EQPresetName | "custom"): void {
    this._currentPreset = name;
    if (name !== "custom") {
      this._bands = [...EQ_PRESETS[name].gains];
    }
    if (this._enabled) {
      this.applyCurrentBands();
    }
  }

  setBandGain(bandIndex: number, dB: number): void {
    if (bandIndex < 0 || bandIndex >= this._bands.length) return;
    const clamped = Math.max(-12, Math.min(12, dB));
    this._bands[bandIndex] = clamped;
    this._currentPreset = "custom";

    if (this.filters[bandIndex]) {
      this.filters[bandIndex].gain.value = clamped;
    }
  }

  /** Set all band gains at once (avoids N individual param updates) */
  setAllBands(gains: number[]): void {
    for (let i = 0; i < Math.min(gains.length, this._bands.length); i++) {
      const g = gains[i];
      if (g !== undefined) {
        const clamped = Math.max(-12, Math.min(12, g));
        this._bands[i] = clamped;
        const filter = this.filters[i];
        if (filter) {
          filter.gain.value = clamped;
        }
      }
    }
    this._currentPreset = "custom";
  }

  getInput(): GainNode | null {
    return this.inputNode;
  }

  getOutput(): GainNode | null {
    return this.outputNode;
  }

  // ==================== Internal ====================

  private applyCurrentBands(): void {
    for (let i = 0; i < this.filters.length; i++) {
      const filter = this.filters[i];
      const band = this._bands[i];
      if (filter && band !== undefined) {
        filter.gain.value = band;
      }
    }
  }

  // ==================== Memory Optimization (Phase 20C) ====================

  /** Release filter chain memory without full teardown. Keeps instance state for quick re-init. */
  trimMemory(): void {
    if (!this._enabled) return;
    // Release internal filter connections but keep band state
    for (const f of this.filters) {
      try { f.disconnect(); } catch { /* ok */ }
    }
    if (this.inputNode) {
      try { this.inputNode.disconnect(); } catch { /* ok */ }
    }
    if (this.outputNode) {
      try { this.outputNode.disconnect(); } catch { /* ok */ }
    }
    this._connectedSource = null;
    this._connectedDestination = null;
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.dispose();
    EQEngine.instance = null;
  }
}

export function getEQEngine(): EQEngine {
  return EQEngine.getInstance();
}
