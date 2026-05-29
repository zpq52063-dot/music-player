"use client";

import { useEffect } from "react";
import { useAudio } from "@/hooks/useAudio";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useIOSBackground } from "@/hooks/useIOSBackground";
import { useLyricsSync } from "@/hooks/useLyricsSync";
import { useAudioCache } from "@/hooks/useAudioCache";
import { usePlaybackRecovery } from "@/hooks/usePlaybackRecovery";
import { usePerformanceCleanup } from "@/hooks/usePerformanceCleanup";
import { useSystemWatchdog } from "@/system/monitor/useSystemWatchdog";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useFocusTimer } from "@/hooks/useFocusTimer";
// Phase 17 — Production Hardening
import { useCrashRecovery } from "@/hooks/useCrashRecovery";
import { useStabilityMonitor } from "@/hooks/useStabilityMonitor";
import { useBatteryOptimization } from "@/hooks/useBatteryOptimization";
import { useProductionMonitor } from "@/hooks/useProductionMonitor";
// Phase 18A — Advanced Audio Experience
import { getAudioSessionManager } from "@/lib/audio/webaudio/AudioSessionManager";
import { getAudioContextManager } from "@/lib/audio/webaudio/AudioContextManager";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
// Phase 20C — Idle resource release
import { useIdleResourceRelease } from "@/hooks/useIdleResourceRelease";

/**
 * Phase 18A — Audio Session Intelligence hook
 * Monitors AirPods disconnect, Bluetooth changes, audio interruptions.
 */
function useAudioSession() {
  useEffect(() => {
    const mgr = getAudioSessionManager();
    mgr.mount((event) => {
      if (event.type === "audio_interruption_begin") {
        const store = useMusicPlayerStore.getState();
        if (store.isPlaying) {
          store.pause();
        }
      } else if (event.type === "airpods_disconnect" || event.type === "bluetooth_change") {
        const store = useMusicPlayerStore.getState();
        if (store.isPlaying) {
          store.pause();
        }
      } else if (event.type === "audio_duck") {
        const store = useMusicPlayerStore.getState();
        const mgr2 = getAudioContextManager();
        if (mgr2.getContext()) {
          store.setVolume(store.volume * 0.5);
        }
      }
    });
    return () => mgr.unmount();
  }, []);
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // Phase 1: legacy audio bridge
  useAudio();
  // Phase 2: new audio manager bridge + Phase 18A crossfade/EQ/normalization routing
  useAudioPlayer();
  // Media Session API (iOS Control Center + Lock Screen)
  useMediaSession();
  // Phase 12: iOS Safari background playback (visibilitychange/pagehide/pageshow/WakeLock)
  useIOSBackground();
  // Lyrics sync
  useLyricsSync();
  // Phase 6: Audio caching + preloading
  useAudioCache();
  // Phase 8: Playback recovery (save/restore)
  usePlaybackRecovery();
  // Phase 8: Performance cleanup (memory/cache GC)
  usePerformanceCleanup();
  // Phase 9: System watchdog (PlaybackWatchdog + ProviderSelfHealing + CacheGovernance + Telemetry)
  useSystemWatchdog();
  // Phase 15: Sleep timer (countdown + fade-out)
  useSleepTimer();
  // Phase 15: Focus timer (elapsed tracking)
  useFocusTimer();
  // Phase 17: Crash recovery (page refresh / Safari killed-background / session restore)
  useCrashRecovery();
  // Phase 17: Stability monitor (background/lockscreen/AirPods/network/worker/Safari)
  useStabilityMonitor();
  // Phase 17: Battery optimization (reduced motion/animation throttle/visibility/low power)
  useBatteryOptimization();
  // Phase 17: Production monitor (ProviderTelemetry + CacheGovernanceV2)
  useProductionMonitor();
  // Phase 18A: Audio session intelligence (AirPods/BT/interruptions)
  useAudioSession();
  // Phase 20C: Idle resource release (iPhone Safari memory optimization)
  useIdleResourceRelease();

  return <>{children}</>;
}
