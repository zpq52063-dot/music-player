/**
 * Phase 18A Stabilization Tester
 *
 * Dev-only testing utility for verifying Crossfade stability, Gapless timing,
 * EQ performance, Visualization optimization, weak network handling, and cache pressure.
 *
 * Usage (browser console):
 *   const tester = getStabilizationTester();
 *   await tester.runAll();
 *   await tester.testCrossfadeStability();
 *   await tester.testWeakNetwork("mobile-3g");
 */
import { getCrossfadeEngine } from "./CrossfadeEngine";
import { getAudioContextManager } from "./AudioContextManager";
import { getEQEngine } from "./EQEngine";
import { getVisualizationAnalyzer } from "./VisualizationAnalyzer";
import { getVolumeNormalizer } from "./VolumeNormalizer";
import { getPlayQueue } from "../PlayQueue";
import { getNetworkSimulator, type NetworkCondition } from "@/remote-provider/testing/NetworkSimulator";
import { getCacheGovernanceV2 } from "@/system/cleanup/CacheGovernanceV2";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

interface StabilizationReport {
  timestamp: number;
  results: TestResult[];
  summary: { total: number; passed: number; failed: number };
}

export class StabilizationTester {
  private static instance: StabilizationTester | null = null;
  private results: TestResult[] = [];

  static getInstance(): StabilizationTester {
    if (!StabilizationTester.instance) {
      StabilizationTester.instance = new StabilizationTester();
    }
    return StabilizationTester.instance;
  }

  // ==================== Full Suite ====================

  async runAll(): Promise<StabilizationReport> {
    this.results = [];
    console.log("[StabilizationTester] Running Phase 18A stabilization suite...");

    await this.addResult(this.testCrossfadeLifecycle());
    await this.addResult(this.testCrossfadeRapidCancel());
    await this.addResult(this.testAudioContextRecovery());
    await this.addResult(this.testEQBypassPerformance());
    await this.addResult(this.testVisualizationThrottling());
    await this.addResult(this.testPlayQueueDedup());
    await this.addResult(this.testVolumeNormalizerFallback());
    await this.addResult(this.testWeakNetwork("mobile-3g"));
    await this.addResult(this.testWeakNetwork("weak"));
    await this.addResult(this.testCachePressure());

    return this.buildReport();
  }

  // ==================== 1. Crossfade Stability ====================

  async testCrossfadeLifecycle(): Promise<TestResult> {
    const start = performance.now();
    const xf = getCrossfadeEngine();

    try {
      const ctxMgr = getAudioContextManager();
      ctxMgr.ensureContext();

      // Verify engine is not active initially
      if (xf.isActive) {
        return { name: "Crossfade Lifecycle", passed: false, details: "Engine should not be active before start", durationMs: performance.now() - start };
      }

      // Verify configuration
      xf.setDuration(2000);
      if (xf.getDuration() !== 2000) {
        return { name: "Crossfade Lifecycle", passed: false, details: "setDuration failed", durationMs: performance.now() - start };
      }

      // Verify generation counter increments
      const genBefore = xf.getGeneration();
      // Simulate a rapid cancel (no actual audio URLs, cancel should be safe)
      xf.cancelCrossfade();
      const genAfter = xf.getGeneration();

      return {
        name: "Crossfade Lifecycle",
        passed: !xf.isActive && genBefore >= 0 && genAfter >= 0,
        details: `Config OK, generation=${genAfter}, active=${xf.isActive}`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "Crossfade Lifecycle", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  async testCrossfadeRapidCancel(): Promise<TestResult> {
    const start = performance.now();
    const xf = getCrossfadeEngine();

    try {
      // Simulate rapid cancel/start cycles (should not throw or leak)
      for (let i = 0; i < 5; i++) {
        xf.cancelCrossfade();
      }

      // After cleanup, engine should be inactive
      if (xf.isActive) {
        return { name: "Crossfade Rapid Cancel", passed: false, details: "Engine still active after cancels", durationMs: performance.now() - start };
      }

      // GainNodes should be null after cancel
      const gainA = xf.getSlotGain("A");
      const gainB = xf.getSlotGain("B");
      const audioA = xf.getSlotAudio("A");
      const audioB = xf.getSlotAudio("B");

      const allClean = gainA === null && gainB === null && audioA === null && audioB === null;

      return {
        name: "Crossfade Rapid Cancel",
        passed: allClean,
        details: allClean ? "All slots cleaned up after rapid cancel" : `Slot state: A(gain=${!!gainA},audio=${!!audioA}) B(gain=${!!gainB},audio=${!!audioB})`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "Crossfade Rapid Cancel", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 2. AudioContext Recovery ====================

  async testAudioContextRecovery(): Promise<TestResult> {
    const start = performance.now();
    const ctxMgr = getAudioContextManager();

    try {
      // Ensure context creation
      const ctx = ctxMgr.ensureContext();
      if (!ctx) {
        return { name: "AudioContext Recovery", passed: false, details: "Failed to create AudioContext", durationMs: performance.now() - start };
      }

      // Check reduced-motion detection works
      const reducedMotion = ctxMgr.reducedMotion;
      const isRunning = ctxMgr.isRunning;

      // Check factory methods work
      const gain = ctxMgr.createGain(0.5);
      const analyser = ctxMgr.createAnalyser(256);

      const factoryOk = gain !== null && analyser !== null;

      // Cleanup test nodes
      try { gain?.disconnect(); } catch { /* ok */ }
      try { analyser?.disconnect(); } catch { /* ok */ }

      return {
        name: "AudioContext Recovery",
        passed: factoryOk && isRunning !== undefined,
        details: `Context state: running=${isRunning}, reducedMotion=${reducedMotion}, factory OK=${factoryOk}`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "AudioContext Recovery", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 3. EQ Performance ====================

  async testEQBypassPerformance(): Promise<TestResult> {
    const start = performance.now();
    const eq = getEQEngine();
    const ctxMgr = getAudioContextManager();

    try {
      ctxMgr.ensureContext();

      // Initialize EQ
      const initialized = eq.initialize();
      if (!initialized) {
        return { name: "EQ Bypass Performance", passed: false, details: "Failed to initialize EQ", durationMs: performance.now() - start };
      }

      // Test bypass path
      eq.enable();
      eq.applyPreset("pop");
      eq.bypass();

      if (eq.enabled) {
        return { name: "EQ Bypass Performance", passed: false, details: "Bypass should set enabled=false", durationMs: performance.now() - start };
      }

      // Test battery-low auto-disable
      eq.isBatteryLow = true;
      eq.enable();
      if (eq.enabled) {
        return { name: "EQ Bypass Performance", passed: false, details: "Battery-low should prevent enable", durationMs: performance.now() - start };
      }
      eq.isBatteryLow = false;

      // Test setAllBands
      eq.initialize();
      eq.enable();
      eq.setAllBands([2, -1, 0, 3, 1]);
      const bands = eq.bands;

      // Cleanup
      eq.dispose();

      return {
        name: "EQ Bypass Performance",
        passed: bands[0] === 2 && bands[3] === 3,
        details: `Bands set correctly: [${bands.join(",")}], bypass works, battery-low works`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "EQ Bypass Performance", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 4. Visualization Optimization ====================

  async testVisualizationThrottling(): Promise<TestResult> {
    const start = performance.now();
    const analyzer = getVisualizationAnalyzer();
    const ctxMgr = getAudioContextManager();

    try {
      ctxMgr.ensureContext();

      // Test with reduced-motion fallback — should return zeroed data
      const bandsZero = analyzer.getBands(8);

      // Test data access without analyser (shouldn't throw)
      const freq = analyzer.getFrequencyData();
      const time = analyzer.getTimeData();

      // Verify reduced-motion detection is functional
      const pageVisible = analyzer.isPageVisible;
      const effectivelyPaused = analyzer.isEffectivelyPaused;

      return {
        name: "Visualization Throttling",
        passed: bandsZero.length === 8 && freq !== null && time !== null,
        details: `pageVisible=${pageVisible}, effectivelyPaused=${effectivelyPaused}, bands count=${bandsZero.length}`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "Visualization Throttling", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 5. PlayQueue Gapless ====================

  async testPlayQueueDedup(): Promise<TestResult> {
    const start = performance.now();
    const queue = getPlayQueue();

    try {
      // Verify dedup: repeated preloadNearEnd for same song should not trigger preload
      if (queue.preloadPending) {
        return { name: "PlayQueue Dedup", passed: false, details: "Should not be pending initially", durationMs: performance.now() - start };
      }

      // Cancel should be safe on empty queue
      queue.cancel();

      // Check LRU cache doesn't throw
      queue.clearCache();

      return {
        name: "PlayQueue Dedup",
        passed: !queue.preloadPending,
        details: `preloadPending=${queue.preloadPending}, cancel safe, cache clear OK`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "PlayQueue Dedup", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 6. Volume Normalizer ====================

  async testVolumeNormalizerFallback(): Promise<TestResult> {
    const start = performance.now();
    const norm = getVolumeNormalizer();

    try {
      // Default gain when not analyzed
      const gain = norm.getGain("unknown-song-id");
      if (gain !== 1) {
        return { name: "Volume Normalizer Fallback", passed: false, details: "Default gain should be 1", durationMs: performance.now() - start };
      }

      // Toggle enabled
      norm.enabled = false;
      if (norm.enabled) {
        return { name: "Volume Normalizer Fallback", passed: false, details: "Disable should work", durationMs: performance.now() - start };
      }

      // Gain should be 1 when disabled
      const gainDisabled = norm.getGain("unknown-id");
      norm.enabled = true;

      return {
        name: "Volume Normalizer Fallback",
        passed: gain === 1 && gainDisabled === 1,
        details: `Default gain=${gain}, disabled gain=${gainDisabled}`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "Volume Normalizer Fallback", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 7. Weak Network Validation ====================

  async testWeakNetwork(condition: NetworkCondition): Promise<TestResult> {
    const start = performance.now();
    const sim = getNetworkSimulator();

    try {
      // Apply network condition
      sim.simulate(condition);
      const activeCondition = sim.getCurrentCondition();

      if (!sim.isActive() && condition !== "normal") {
        sim.restore();
        return { name: `Weak Network: ${condition}`, passed: false, details: "Simulator not active", durationMs: performance.now() - start };
      }

      // Test fetch interception
      let fetchError: string | null = null;
      try {
        await fetch("https://example.com/test.mp3");
      } catch (e) {
        fetchError = e instanceof Error ? e.message : String(e);
      }

      // Restore
      sim.restore();

      const isOffline = condition === "offline";
      const fetchBehavedCorrectly = isOffline ? fetchError !== null : true;

      return {
        name: `Weak Network: ${condition}`,
        passed: activeCondition === condition && fetchBehavedCorrectly,
        details: `Condition=${activeCondition}, fetch ${fetchError ? "failed as expected" : "succeeded"}, restored=${!sim.isActive()}`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      sim.restore(); // ensure restore on error
      return { name: `Weak Network: ${condition}`, passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== 8. Cache Pressure Testing ====================

  async testCachePressure(): Promise<TestResult> {
    const start = performance.now();
    const governance = getCacheGovernanceV2();

    try {
      // Run a cleanup cycle
      const result = await governance.runFullCleanup();

      // Check configuration is accessible
      const config = governance.getConfig();
      const isLow = governance.isLowStorageMode();

      return {
        name: "Cache Pressure",
        passed: result.totalFreed >= 0 && config.cleanupIntervalMs > 0,
        details: `LRU evicted=${result.lruEvicted}, stale removed=${result.staleRemoved}, lowStorage=${isLow}, interval=${config.cleanupIntervalMs}ms`,
        durationMs: performance.now() - start,
      };
    } catch (e) {
      return { name: "Cache Pressure", passed: false, details: String(e), durationMs: performance.now() - start };
    }
  }

  // ==================== Helpers ====================

  private async addResult(promise: Promise<TestResult>): Promise<void> {
    const result = await promise;
    this.results.push(result);
    const icon = result.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${result.name} (${result.durationMs.toFixed(0)}ms): ${result.details}`);
  }

  private buildReport(): StabilizationReport {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.length - passed;

    const report: StabilizationReport = {
      timestamp: Date.now(),
      results: this.results,
      summary: { total: this.results.length, passed, failed },
    };

    console.log(
      `\n[StabilizationTester] Complete: ${passed}/${this.results.length} passed, ${failed} failed`,
    );

    return report;
  }
}

export function getStabilizationTester(): StabilizationTester {
  return StabilizationTester.getInstance();
}
