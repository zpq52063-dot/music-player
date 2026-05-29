// Phase 18A — Advanced Audio Experience Foundation

// ==================== Crossfade ====================

export type CrossfadeCurve = "linear" | "equal-power";

export interface CrossfadeConfig {
  enabled: boolean;
  durationMs: number; // 1000–5000, default 2500
  curve: CrossfadeCurve;
}

export const DEFAULT_CROSSFADE_CONFIG: CrossfadeConfig = {
  enabled: true,
  durationMs: 2500,
  curve: "linear",
};

// ==================== EQ ====================

export type EQPresetName = "bass-boost" | "vocal" | "pop" | "classical" | "night";

export interface EQBandDefinition {
  frequency: number;
  type: "lowshelf" | "peaking" | "highshelf";
  label: string;
}

export interface EQPreset {
  name: string;
  gains: [number, number, number, number, number];
}

export type EQPresets = Record<EQPresetName, EQPreset>;

export interface EQState {
  enabled: boolean;
  preset: EQPresetName | "custom";
  bands: number[]; // dB gains per band [-12, 12]
}

export const EQ_BANDS: EQBandDefinition[] = [
  { frequency: 60, type: "lowshelf", label: "60Hz" },
  { frequency: 250, type: "peaking", label: "250Hz" },
  { frequency: 1000, type: "peaking", label: "1kHz" },
  { frequency: 4000, type: "peaking", label: "4kHz" },
  { frequency: 12000, type: "highshelf", label: "12kHz" },
];

export const DEFAULT_EQ_STATE: EQState = {
  enabled: false,
  preset: "pop",
  bands: [3, 0, 1, 2, 3],
};

// ==================== Volume Normalization ====================

export interface NormalizationConfig {
  enabled: boolean;
  targetRMS: number;
}

export const DEFAULT_NORMALIZATION_CONFIG: NormalizationConfig = {
  enabled: true,
  targetRMS: 0.15,
};

// ==================== Visualization ====================

export type VisualizationMode = "waveform" | "bars" | "pulse" | "off";

export interface VisualizationConfig {
  mode: VisualizationMode;
  fftSize: 256 | 512 | 1024;
}

export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  mode: "bars",
  fftSize: 256,
};

// ==================== Audio Session ====================

export type AudioSessionEventType =
  | "airpods_disconnect"
  | "bluetooth_change"
  | "audio_interruption_begin"
  | "audio_interruption_end"
  | "audio_duck";

export interface AudioSessionEvent {
  type: AudioSessionEventType;
  timestamp: number;
  details?: string;
}
