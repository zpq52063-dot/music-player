import type { SmartPlaylistMode, SmartPlaylistConfig } from "@/types/phase15";
import { mockSongs } from "@/music-source/providers/mock/data";
import type { Song } from "@/types";

export const SMART_PLAYLIST_CONFIGS: SmartPlaylistConfig[] = [
  {
    mode: "late-night",
    label: "深夜模式",
    description: "安静舒缓，伴你入眠",
    iconName: "IconMoon",
    songIds: ["s019", "s020", "s016", "s012", "s017", "s015"],
    color: "#7c3aed",
  },
  {
    mode: "study",
    label: "学习模式",
    description: "纯音乐与轻音乐",
    iconName: "IconBooks",
    songIds: ["s018", "s019", "s015", "s017", "s012"],
    color: "#2563eb",
  },
  {
    mode: "relax",
    label: "放松模式",
    description: "轻松惬意的旋律",
    iconName: "IconWind",
    songIds: ["s009", "s015", "s026", "s030", "s001", "s002", "s003"],
    color: "#059669",
  },
  {
    mode: "commute",
    label: "通勤模式",
    description: "充满活力的节奏",
    iconName: "IconBus",
    songIds: ["s005", "s028", "s026", "s032", "s007", "s001", "s002", "s014"],
    color: "#ea580c",
  },
];

export function getSongsForMode(mode: SmartPlaylistMode): Song[] {
  const config = SMART_PLAYLIST_CONFIGS.find((c) => c.mode === mode);
  if (!config) return [];
  return config.songIds
    .map((id) => mockSongs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);
}
