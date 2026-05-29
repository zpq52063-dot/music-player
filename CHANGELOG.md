# Changelog

All notable changes to the Music Player project.

---

## [1.0.0] — 2026-05-29 (Phase 20C — Production Release)

### Performance
- Bundle splitting: dedicated chunks for audio, visualization, supabase, icons, serwist
- Dynamic imports: heavy components deferred (InstallPrompt, StandaloneOnboarding, ProviderInit, etc.)
- Aggressive image optimization: deviceSizes, imageSizes, minimumCacheTTL
- Preconnect hints for critical audio CDN origin
- Tree shaking: `removeConsole` in production (excludes error/warn)
- `optimizeCss` and `scrollRestoration` enabled

### Memory (iPhone Safari)
- AudioContext memory trim on page hide (30s idle → suspend, 60s idle → close)
- VisualizationAnalyzer buffer release (trimMemory)
- EQEngine filter chain release (trimMemory)
- Cache governance V2 periodic cleanup integration
- iOS Safari pagehide/bfcache memory awareness
- Idle resource release hook (useIdleResourceRelease)

### Bundle Governance
- Webpack `splitChunks` with cacheGroups for audio, viz, supabase, icons, sw
- Dynamic import for all heavy optional components
- Dev-only components (ProviderDebugPanel, DebugOverlayWrapper) stripped from production

### Release Versioning
- Semantic versioning: 1.0.0
- Release metadata (APP_VERSION, RELEASE_INFO) in constants
- Rollback version tag support (0.1.0)

### Service Worker Governance
- Versioned cache names (v1- prefix) for clean migration
- Activate handler: purges legacy unversioned caches
- SW_UPDATED message to window clients on new version activation
- Update notification UI (toast with update/dismiss actions)
- SKIP_WAITING, GET_VERSION, CLEAR_CACHE, CLEAR_ALL_CACHES message handlers

### Production Telemetry
- Sampling rate: 10% in production, 100% in dev
- Always records errors/timeouts/fallbacks regardless of sampling
- Reduced persist interval: 60s (was 30s)
- Production-safe: stripped detailed latency arrays in production persist
- No PII or user-identifiable data collected

---

## [0.1.0] — 2026-04 (Phase 1–20B)

- Apple Music-style mobile music player WebApp
- 16 SoundHelix public demo songs
- Complete playback system with AudioManager + Web Audio API layer
- Crossfade engine, 5-band EQ, volume normalization, audio visualization
- Supabase schema (6 tables) with anonymous auth
- PWA with full icon set (14 PNGs) + iOS splash screens (7 sizes)
- Service Worker with layered caching (audio, images, API, fonts)
- Provider architecture (MockProvider + ProviderManager + HealthTracker)
- Search system with debounce, cache, and history
- Library page (liked songs, playlists, recently played)
- Comments/replies/likes social system
- Capacitor iOS wrapper (config + scripts)
- Crash recovery, stability monitoring, battery optimization
- Environment governance (local/preview/production) with safety gates
- Remote Provider architecture (EdgeProviderManager)
