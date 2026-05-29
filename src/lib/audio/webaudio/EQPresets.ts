import type { EQPresetName, EQPresets } from "@/types";

/**
 * Phase 18A — EQ Presets
 *
 * Gain values in dB for each 5-band EQ preset.
 * Band order: [60Hz, 250Hz, 1kHz, 4kHz, 12kHz]
 */
export const EQ_PRESETS: EQPresets = {
  "bass-boost": {
    name: "Bass Boost",
    gains: [6, 3, 0, 0, 0],
  },
  vocal: {
    name: "Vocal",
    gains: [-2, 1, 3, 2, 1],
  },
  pop: {
    name: "Pop",
    gains: [3, 0, 1, 2, 3],
  },
  classical: {
    name: "Classical",
    gains: [2, 0, 0, 0, 1],
  },
  night: {
    name: "Night",
    gains: [-3, -1, 0, 0, -3],
  },
};

export const PRESET_LABELS: Record<EQPresetName, string> = Object.fromEntries(
  Object.entries(EQ_PRESETS).map(([key, val]) => [key, val.name]),
) as Record<EQPresetName, string>;

export const PRESET_NAMES: EQPresetName[] = Object.keys(EQ_PRESETS) as EQPresetName[];
