/**
 * Phase 8 + Phase 18A — 设置状态管理
 */

import { create } from "zustand";
import type { EQPresetName, VisualizationMode } from "@/types";

export type AudioQuality = "high" | "medium" | "low";
export type ProviderPriority = "mock" | string; // string 为未来 Provider 预留

interface SettingsState {
  // Audio
  audioQuality: AudioQuality;
  autoCache: boolean;

  // Debug
  debugMode: boolean;

  // Provider
  providerPriority: ProviderPriority[];

  // Phase 18A — Crossfade
  crossfadeEnabled: boolean;
  crossfadeDuration: number; // ms, 1000–5000

  // Phase 18A — EQ
  eqEnabled: boolean;
  eqPreset: EQPresetName;

  // Phase 18A — Volume Normalization
  normalizationEnabled: boolean;

  // Phase 18A — Visualization
  visualizationMode: VisualizationMode;

  // Actions
  setAudioQuality: (q: AudioQuality) => void;
  setAutoCache: (v: boolean) => void;
  setDebugMode: (v: boolean) => void;
  setProviderPriority: (order: ProviderPriority[]) => void;
  setCrossfadeEnabled: (v: boolean) => void;
  setCrossfadeDuration: (ms: number) => void;
  setEQEnabled: (v: boolean) => void;
  setEQPreset: (p: EQPresetName) => void;
  setNormalizationEnabled: (v: boolean) => void;
  setVisualizationMode: (m: VisualizationMode) => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`music_settings_${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // silently fail
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(`music_settings_${key}`, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  audioQuality: loadFromStorage<AudioQuality>("audioQuality", "high"),
  autoCache: loadFromStorage<boolean>("autoCache", true),
  debugMode: loadFromStorage<boolean>("debugMode", false),
  providerPriority: loadFromStorage<ProviderPriority[]>("providerPriority", ["mock"]),

  // Phase 18A defaults
  crossfadeEnabled: loadFromStorage<boolean>("crossfadeEnabled", true),
  crossfadeDuration: loadFromStorage<number>("crossfadeDuration", 2500),
  eqEnabled: loadFromStorage<boolean>("eqEnabled", false),
  eqPreset: loadFromStorage<EQPresetName>("eqPreset", "pop"),
  normalizationEnabled: loadFromStorage<boolean>("normalizationEnabled", true),
  visualizationMode: loadFromStorage<VisualizationMode>("visualizationMode", "bars"),

  setAudioQuality: (q) => {
    saveToStorage("audioQuality", q);
    set({ audioQuality: q });
  },
  setAutoCache: (v) => {
    saveToStorage("autoCache", v);
    set({ autoCache: v });
  },
  setDebugMode: (v) => {
    saveToStorage("debugMode", v);
    set({ debugMode: v });
  },
  setProviderPriority: (order) => {
    saveToStorage("providerPriority", order);
    set({ providerPriority: order });
  },
  setCrossfadeEnabled: (v) => {
    saveToStorage("crossfadeEnabled", v);
    set({ crossfadeEnabled: v });
  },
  setCrossfadeDuration: (ms) => {
    const clamped = Math.max(1000, Math.min(5000, ms));
    saveToStorage("crossfadeDuration", clamped);
    set({ crossfadeDuration: clamped });
  },
  setEQEnabled: (v) => {
    saveToStorage("eqEnabled", v);
    set({ eqEnabled: v });
  },
  setEQPreset: (p) => {
    saveToStorage("eqPreset", p);
    set({ eqPreset: p });
  },
  setNormalizationEnabled: (v) => {
    saveToStorage("normalizationEnabled", v);
    set({ normalizationEnabled: v });
  },
  setVisualizationMode: (m) => {
    saveToStorage("visualizationMode", m);
    set({ visualizationMode: m });
  },
}));
