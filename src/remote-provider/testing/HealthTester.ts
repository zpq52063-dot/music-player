// ==================== Phase 16B: Remote Provider Health Tester ====================
//
// Tests timeout detection, retry behavior, fallback chain execution,
// degraded/unavailable provider handling.
//
// Usage: import { RemoteHealthTester } from "@/remote-provider/testing";
//        const tester = new RemoteHealthTester(manager);
//        const report = await tester.runAll();

import type { EdgeProviderManager } from "../core/EdgeProviderManager";
import type { RemoteProvider, RemoteProviderHealth, RemoteStream, RemoteSong } from "../types";
import type { SearchResult } from "@/types/music";

// ==================== Test Result ====================

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

export interface TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  timestamp: number;
}

// ==================== Flaky State Tracker ====================

interface FlakyState {
  _attempts: number;
}

function getFlakyState(provider: RemoteProvider): FlakyState {
  return (provider as unknown as Record<string, unknown>)["_flaky"] as FlakyState ?? {
    _attempts: 0,
  };
}

// ==================== Mock Providers for Testing ====================

function createMockProvider(
  id: string,
  behavior: "always-succeed" | "always-fail" | "flaky" | "slow",
): RemoteProvider {
  function succeed(): SearchResult {
    return { songs: [], playlists: [], artists: [], total: 0, hasMore: false };
  }

  function fail(): never {
    throw new Error(`[${id}] operation failed`);
  }

  const flakyState: FlakyState = { _attempts: 0 };

  function resolveHealth(): RemoteProviderHealth {
    return {
      healthy: true,
      avgLatency: 50,
      availability: 1,
      totalRequests: 100,
      successRequests: 100,
      consecutiveFailures: 0,
      lastCheckTime: Date.now(),
      lastSuccessTime: Date.now(),
    };
  }

  const provider: RemoteProvider = {
    id,
    name: `Test ${id}`,
    source: "test",

    async search(_keyword?: string): Promise<SearchResult> {
      switch (behavior) {
        case "always-succeed":
          return succeed();
        case "always-fail":
          return fail();
        case "flaky":
          flakyState._attempts++;
          if (flakyState._attempts < 3) {
            throw new Error(`[${id}] attempt ${flakyState._attempts} failed`);
          }
          return succeed();
        case "slow":
          await new Promise((r) => setTimeout(r, 5000));
          return succeed();
      }
    },

    async getSong(_id: string): Promise<RemoteSong> {
      throw new Error("not implemented");
    },

    async getLyrics(_songId: string): Promise<string> {
      return "";
    },

    async getStream(_songId: string): Promise<RemoteStream> {
      throw new Error("not implemented");
    },

    async health(): Promise<RemoteProviderHealth> {
      switch (behavior) {
        case "always-succeed":
          return resolveHealth();
        case "slow": {
          const delay = 5000;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ ...resolveHealth(), avgLatency: delay });
            }, delay);
          });
        }
        default:
          throw new Error(`[${id}] health check failed`);
      }
    },
  };

  // Attach flaky state
  (provider as unknown as Record<string, unknown>)["_flaky"] = flakyState;

  return provider;
}

// ==================== HealthTester ====================

export class RemoteHealthTester {
  private manager: EdgeProviderManager;
  private results: TestResult[] = [];

  constructor(manager: EdgeProviderManager) {
    this.manager = manager;
  }

  // ==================== Run All ====================

  async runAll(): Promise<TestReport> {
    this.results = [];

    await this.testTimeout();
    await this.testRetryBehavior();
    await this.testFallbackChain();
    await this.testDegradedProvider();
    await this.testUnavailableProvider();
    await this.testAllProvidersFail();

    const passed = this.results.filter((r) => r.passed).length;
    return {
      totalTests: this.results.length,
      passed,
      failed: this.results.length - passed,
      results: [...this.results],
      timestamp: Date.now(),
    };
  }

  // ==================== Individual Tests ====================

  private async testTimeout(): Promise<void> {
    const start = Date.now();
    try {
      const provider = createMockProvider("timeout-test", "slow");
      this.manager.register(provider, 0);

      const result = await Promise.race([
        this.manager.search("test").then(() => "completed"),
        new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 2000)),
      ]);

      this.manager.unregister("timeout-test");

      this.addResult(
        "testTimeout",
        result === "timeout",
        Date.now() - start,
        `Expected timeout, got: ${result}`,
      );
    } catch (err) {
      this.addResult("testTimeout", false, Date.now() - start, String(err));
    }
  }

  private async testRetryBehavior(): Promise<void> {
    const start = Date.now();
    try {
      const provider = createMockProvider("retry-test", "flaky");
      this.manager.register(provider, 0);

      await this.manager.search("test");
      const flakyState = getFlakyState(provider);
      const attempts = flakyState._attempts;

      this.manager.unregister("retry-test");

      this.addResult(
        "testRetryBehavior",
        attempts === 3,
        Date.now() - start,
        `Flaky provider succeeded after ${attempts} attempts (expected 3)`,
      );
    } catch (err) {
      this.addResult("testRetryBehavior", false, Date.now() - start, String(err));
      try { this.manager.unregister("retry-test"); } catch { /* ignore */ }
    }
  }

  private async testFallbackChain(): Promise<void> {
    const start = Date.now();
    try {
      const p0 = createMockProvider("fallback-p0", "always-fail");
      const p1 = createMockProvider("fallback-p1", "always-fail");
      const p2 = createMockProvider("fallback-p2", "always-succeed");

      this.manager.register(p0, 0);
      this.manager.register(p1, 1);
      this.manager.register(p2, 2);

      const fallbacks: Array<{ from: string; to: string }> = [];
      this.manager.setOnFallback((from, to) => fallbacks.push({ from, to }));

      const result = await this.manager.search("test");

      this.manager.unregister("fallback-p0");
      this.manager.unregister("fallback-p1");
      this.manager.unregister("fallback-p2");

      const passed = fallbacks.length >= 2 && result !== null;

      this.addResult(
        "testFallbackChain",
        passed,
        Date.now() - start,
        `Fallbacks: ${JSON.stringify(fallbacks)}, result: ${result ? "ok" : "null"}`,
      );
    } catch (err) {
      this.addResult("testFallbackChain", false, Date.now() - start, String(err));
      try {
        this.manager.unregister("fallback-p0");
        this.manager.unregister("fallback-p1");
        this.manager.unregister("fallback-p2");
      } catch { /* ignore */ }
    }
  }

  private async testDegradedProvider(): Promise<void> {
    const start = Date.now();
    try {
      const fastP = createMockProvider("degraded-fast", "always-succeed");
      const slowP = createMockProvider("degraded-slow", "slow");

      this.manager.register(fastP, 0);
      this.manager.register(slowP, 1);

      for (let i = 0; i < 5; i++) {
        await this.manager.search("test").catch(() => {});
      }

      const health = this.manager.getHealthSnapshot("degraded-slow");

      this.manager.unregister("degraded-fast");
      this.manager.unregister("degraded-slow");

      const passed = health.avgLatency > 1000;

      this.addResult(
        "testDegradedProvider",
        passed,
        Date.now() - start,
        `Slow provider avg latency: ${health.avgLatency}ms (expected > 1000ms)`,
      );
    } catch (err) {
      this.addResult("testDegradedProvider", false, Date.now() - start, String(err));
      try {
        this.manager.unregister("degraded-fast");
        this.manager.unregister("degraded-slow");
      } catch { /* ignore */ }
    }
  }

  private async testUnavailableProvider(): Promise<void> {
    const start = Date.now();
    try {
      const provider = createMockProvider("unavailable-test", "always-fail");
      this.manager.register(provider, 0);

      for (let i = 0; i < 6; i++) {
        await this.manager.search("test").catch(() => {});
      }

      const state = this.manager.getState();
      const circuitState = state.circuitStates["unavailable-test"];

      this.manager.unregister("unavailable-test");

      const passed = circuitState === "open";

      this.addResult(
        "testUnavailableProvider",
        passed,
        Date.now() - start,
        `Circuit state after 6 failures: ${circuitState} (expected "open")`,
      );
    } catch (err) {
      this.addResult("testUnavailableProvider", false, Date.now() - start, String(err));
      try { this.manager.unregister("unavailable-test"); } catch { /* ignore */ }
    }
  }

  private async testAllProvidersFail(): Promise<void> {
    const start = Date.now();
    try {
      const p0 = createMockProvider("allfail-p0", "always-fail");
      const p1 = createMockProvider("allfail-p1", "always-fail");

      this.manager.register(p0, 0);
      this.manager.register(p1, 1);

      let threwError = false;
      try {
        await this.manager.search("test");
      } catch {
        threwError = true;
      }

      this.manager.unregister("allfail-p0");
      this.manager.unregister("allfail-p1");

      this.addResult(
        "testAllProvidersFail",
        threwError,
        Date.now() - start,
        `All providers failed: error thrown = ${threwError}`,
      );
    } catch (err) {
      this.addResult("testAllProvidersFail", false, Date.now() - start, String(err));
      try {
        this.manager.unregister("allfail-p0");
        this.manager.unregister("allfail-p1");
      } catch { /* ignore */ }
    }
  }

  // ==================== Helpers ====================

  private addResult(name: string, passed: boolean, duration: number, details?: string): void {
    this.results.push({ name, passed, duration, details });
  }
}
