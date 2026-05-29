"use client";

import { useCallback } from "react";
import { IconMoon, IconBooks, IconWind, IconBus } from "@tabler/icons-react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useUIStore } from "@/stores/uiStore";
import { SMART_PLAYLIST_CONFIGS, getSongsForMode } from "@/services/smartPlaylistService";
import type { SmartPlaylistMode } from "@/types/phase15";

const iconMap: Record<string, typeof IconMoon> = {
  IconMoon,
  IconBooks,
  IconWind,
  IconBus,
};

export function SmartPlaylistSection() {
  const setQueue = useMusicPlayerStore((s) => s.setQueue);
  const expandPlayer = useUIStore((s) => s.expandPlayer);

  const handleModeClick = useCallback(
    (mode: SmartPlaylistMode) => {
      const songs = getSongsForMode(mode);
      if (songs.length > 0) {
        setQueue(songs, 0);
        expandPlayer();
      }
    },
    [setQueue, expandPlayer],
  );

  return (
    <section>
      <h2 className="mb-3 px-1 text-lg font-semibold text-text-primary">智能歌单</h2>
      <div className="grid grid-cols-2 gap-3">
        {SMART_PLAYLIST_CONFIGS.map((config) => {
          const Icon = iconMap[config.iconName] ?? IconMoon;
          return (
            <button
              key={config.mode}
              onClick={() => handleModeClick(config.mode)}
              className="flex flex-col items-start gap-2 rounded-apple-xl p-4 text-left transition-all active:scale-95"
              style={{
                backgroundColor: `${config.color}15`,
                borderColor: `${config.color}30`,
                borderWidth: 1,
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-apple-lg"
                style={{ backgroundColor: `${config.color}25` }}
              >
                <Icon size={18} style={{ color: config.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{config.label}</p>
                <p className="text-xs text-text-secondary">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
