"use client";

import { useEffect, useRef } from "react";
import { useMusicPlayerStore } from "@/stores/musicPlayerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getAudioManager } from "@/lib/audio/AudioManager";
import { getPlayQueue } from "@/lib/audio/PlayQueue";
import { getCrossfadeEngine } from "@/lib/audio/webaudio/CrossfadeEngine";
import { getAudioContextManager } from "@/lib/audio/webaudio/AudioContextManager";
import { getEQEngine } from "@/lib/audio/webaudio/EQEngine";
import { getVolumeNormalizer } from "@/lib/audio/webaudio/VolumeNormalizer";
import { getVisualizationAnalyzer } from "@/lib/audio/webaudio/VisualizationAnalyzer";
import { getPlaybackStabilizer } from "@/music-source/services/PlaybackStabilizer";
import { recordPlayEvent } from "@/services/analyticsService";
import { seedAnalyticsIfEmpty } from "@/services/analyticsSeed";

/**
 * Phase 2 + Phase 18A — 连接 musicPlayerStore 与 AudioManager / CrossfadeEngine
 *
 * Routes playback through CrossfadeEngine when crossfade is enabled,
 * otherwise falls back to direct AudioManager path.
 */
export function useAudioPlayer() {
  const storeRef = useRef(useMusicPlayerStore.getState);
  storeRef.current = useMusicPlayerStore.getState;

  const currentSong = useMusicPlayerStore((s) => s.currentSong);
  const isPlaying = useMusicPlayerStore((s) => s.isPlaying);
  const volume = useMusicPlayerStore((s) => s.volume);
  const isMuted = useMusicPlayerStore((s) => s.isMuted);
  const playbackRate = useMusicPlayerStore((s) => s.playbackRate);

  // Track resolved play URL — fetched on demand when audio_url is empty
  const resolvedUrlRef = useRef<string>("");

  // Analytics tracking
  const lastSongStartTimeRef = useRef(0);
  const lastSongIdRef = useRef<string | null>(null);
  const hasEndedRef = useRef(false);
  const seededRef = useRef(false);

  // Phase 18A — Crossfade state
  const crossfadeActiveRef = useRef(false);

  // Phase 18A — Initialize AudioContext on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      const ctxMgr = getAudioContextManager();
      ctxMgr.ensureContext();
      if (ctxMgr.getContext()?.state === "suspended") {
        void ctxMgr.resume();
      }
      // Remove listeners after first successful gesture
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchend", handleGesture);
    };
    document.addEventListener("click", handleGesture);
    document.addEventListener("touchend", handleGesture);
    return () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchend", handleGesture);
    };
  }, []);

  // Track song changes — resolve URL if needed, then load audio
  useEffect(() => {
    const song = currentSong;
    if (!song) return;

    // If no audio_url, resolve via PlaybackStabilizer (calls Provider chain)
    if (!song.audio_url) {
      useMusicPlayerStore.getState().setLoadingState("loading");
      const stabilizer = getPlaybackStabilizer();

      stabilizer
        .getPlayUrl(song)
        .then((url) => {
          // Guard: song may have changed during fetch
          if (useMusicPlayerStore.getState().currentSong?.id !== song.id) return;
          if (!url) {
            useMusicPlayerStore.getState().setLoadingState("error");
            return;
          }
          resolvedUrlRef.current = url;
          loadAndPlay(url);
        })
        .catch(() => {
          if (useMusicPlayerStore.getState().currentSong?.id === song.id) {
            useMusicPlayerStore.getState().setLoadingState("error");
          }
        });
      return;
    }

    loadAndPlay(song.audio_url);
  }, [currentSong?.id, currentSong?.audio_url]);

  // Play / Pause
  useEffect(() => {
    const song = currentSong;
    if (!song) return;

    // Skip if crossfade is active (crossfade engine handles its own playback)
    if (crossfadeActiveRef.current) {
      if (isPlaying) {
        const xf = getCrossfadeEngine();
        const audio = xf.getActiveAudio();
        if (audio && audio.paused) {
          void audio.play();
        }
      } else {
        const xf = getCrossfadeEngine();
        const audio = xf.getActiveAudio();
        if (audio && !audio.paused) {
          audio.pause();
        }
      }
      return;
    }

    const resolvedUrl = resolvedUrlRef.current || song.audio_url;
    if (!resolvedUrl) return;
    const mgr = getAudioManager();

    if (isPlaying) {
      void mgr.play();
    } else {
      mgr.pause();
    }
  }, [isPlaying, currentSong?.id]);

  // Volume
  useEffect(() => {
    getAudioManager().setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Playback rate
  useEffect(() => {
    getAudioManager().setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Seek bridge: detect large jumps from store
  useEffect(() => {
    const unsub = useMusicPlayerStore.subscribe((state, prev) => {
      const diff = Math.abs(state.currentTime - prev.currentTime);
      if (diff > 1.5 && state.currentSong && prev.currentSong?.id === state.currentSong.id) {
        getAudioManager().seek(state.currentTime);
      }
    });
    return unsub;
  }, []);

  // Phase 18A — Preload next song when near end of current (gapless)
  useEffect(() => {
    const unsub = useMusicPlayerStore.subscribe((state) => {
      const settings = useSettingsStore.getState();
      if (state.queue.length === 0) return;
      if (state.duration <= 0) return;
      const crossfadeDur = settings.crossfadeEnabled ? settings.crossfadeDuration / 1000 : 0;
      const threshold = Math.max(crossfadeDur + 3, 5);
      void getPlayQueue().preloadNearEnd(
        state.queue,
        state.queueIndex,
        state.currentTime,
        state.duration,
        threshold,
      );
    });
    return unsub;
  }, []);

  // Phase 18A — Crossfade on song transition
  useEffect(() => {
    const unsub = useMusicPlayerStore.subscribe((state, prev) => {
      const settings = useSettingsStore.getState();
      if (!settings.crossfadeEnabled) return;

      // Detect song transition (prev song → new song, both non-null)
      const prevSong = prev.currentSong;
      const currSong = state.currentSong;
      if (!prevSong || !currSong) return;
      if (prevSong.id === currSong.id) return;

      const prevUrl = prevSong.audio_url || (resolvedUrlRef.current);
      const currUrl = currSong.audio_url;
      if (!prevUrl || !currUrl) return;
      if (prevUrl === currUrl) return;

      // Trigger crossfade
      crossfadeActiveRef.current = true;
      const xf = getCrossfadeEngine();
      xf.setDuration(settings.crossfadeDuration);

      void xf.startCrossfade(prevUrl, currUrl, settings.crossfadeDuration, () => {
        crossfadeActiveRef.current = false;
        // After crossfade completes, sync the store
        const store = useMusicPlayerStore.getState();
        if (store.currentSong?.audio_url === currUrl || resolvedUrlRef.current === currUrl) {
          store.setLoadingState("ready");
        }
      });
    });
    return unsub;
  }, []);

  // Phase 18A — EQ settings sync
  useEffect(() => {
    const eq = getEQEngine();
    const settings = useSettingsStore.getState();
    if (settings.eqEnabled) {
      eq.initialize();
      eq.enable();
      eq.applyPreset(settings.eqPreset);
    } else {
      eq.bypass();
    }
  }, []);

  // Phase 18A — Visualization analyzer setup
  useEffect(() => {
    const analyzer = getVisualizationAnalyzer();
    const settings = useSettingsStore.getState();
    if (settings.visualizationMode !== "off" && getAudioContextManager().getContext()) {
      // Connect to crossfade output when available
      const xf = getCrossfadeEngine();
      const audio = xf.getActiveAudio();
      if (audio && getAudioContextManager().getContext()) {
        const source = getAudioContextManager().createMediaElementSource(audio);
        if (source) {
          analyzer.initialize(source);
          analyzer.mode = settings.visualizationMode;
        }
      }
    }
  }, [currentSong?.id]);

  // Analytics: seed on first mount + record play events on song change
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedAnalyticsIfEmpty();
    }

    const unsub = useMusicPlayerStore.subscribe((state, prev) => {
      const prevId = prev.currentSong?.id;
      const currId = state.currentSong?.id;

      // Song changed — record previous song's play event
      if (prevId && prevId !== currId && lastSongIdRef.current === prevId) {
        const playDuration = Math.floor((Date.now() - lastSongStartTimeRef.current) / 1000);
        const completed = hasEndedRef.current;
        const duration = prev.currentSong?.duration ?? 0;
        const skipped = !completed && duration > 0 && playDuration < duration * 0.5;
        recordPlayEvent(prevId, prev.currentSong?.artist ?? "", playDuration, completed, skipped);
      }

      // Track new song start
      if (currId && currId !== prevId) {
        lastSongStartTimeRef.current = Date.now();
        lastSongIdRef.current = currId;
        hasEndedRef.current = false;
      }

      // Track when playback starts (after pause)
      if (state.isPlaying && !prev.isPlaying && currId) {
        lastSongStartTimeRef.current = Date.now();
      }
    });

    return unsub;
  }, []);

  // ==================== Internal ====================

  function loadAndPlay(url: string) {
    const mgr = getAudioManager();
    const state = useMusicPlayerStore.getState();
    const settings = useSettingsStore.getState();

    // Phase 18A — Volume normalization: pre-analyze this song
    if (settings.normalizationEnabled && state.currentSong) {
      void getVolumeNormalizer().analyzeSong(state.currentSong);
    }

    mgr.load(url, {
      onTimeUpdate: (t, d) => {
        useMusicPlayerStore.getState().syncTime(t, d);
      },
      onEnded: () => {
        hasEndedRef.current = true;
        useMusicPlayerStore.getState().next();
      },
      onLoadStateChange: (s) => {
        useMusicPlayerStore.getState().setLoadingState(s);
      },
      onBufferedChange: (pct) => {
        useMusicPlayerStore.getState().setBuffered(pct);
      },
      onError: (msg) => {
        console.error("[AudioManager]", msg);
        useMusicPlayerStore.getState().setLoadingState("error");
      },
    });

    mgr.setVolume(state.isMuted ? 0 : state.volume);
    mgr.setPlaybackRate(state.playbackRate);

    if (state.isPlaying) {
      void mgr.play();
    }
  }
}
