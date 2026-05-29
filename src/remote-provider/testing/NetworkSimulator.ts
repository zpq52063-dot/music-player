// ==================== Phase 16B: Network Simulator ====================
//
// Intercepts globalThis.fetch to simulate different network conditions:
// wifi, mobile-4g, mobile-3g, vpn-on, weak, offline, normal.
//
// Usage:
//   const sim = new NetworkSimulator();
//   sim.simulate("mobile-3g");
//   // ... run tests ...
//   sim.restore();

export type NetworkCondition =
  | "wifi"
  | "mobile-4g"
  | "mobile-3g"
  | "vpn-on"
  | "weak"
  | "offline"
  | "normal";

interface ConditionConfig {
  latencyMs: number;
  packetLoss: number;
  bandwidthKbps: number;
}

const CONDITION_CONFIGS: Record<NetworkCondition, ConditionConfig> = {
  wifi: { latencyMs: 50, packetLoss: 0, bandwidthKbps: 50_000 },
  "mobile-4g": { latencyMs: 100, packetLoss: 0.01, bandwidthKbps: 10_000 },
  "mobile-3g": { latencyMs: 300, packetLoss: 0.03, bandwidthKbps: 1_500 },
  "vpn-on": { latencyMs: 200, packetLoss: 0, bandwidthKbps: 10_000 },
  weak: { latencyMs: 500, packetLoss: 0.1, bandwidthKbps: 512 },
  offline: { latencyMs: 0, packetLoss: 1, bandwidthKbps: 0 },
  normal: { latencyMs: 0, packetLoss: 0, bandwidthKbps: 0 },
};

export class NetworkSimulator {
  private originalFetch: typeof globalThis.fetch | null = null;
  private currentCondition: NetworkCondition = "normal";
  private active = false;

  /** Apply a network condition simulation */
  simulate(condition: NetworkCondition): void {
    this.currentCondition = condition;

    if (condition === "normal") {
      this.restore();
      return;
    }

    if (this.active) {
      // Already active, just update the condition config
      return;
    }

    const originalFetch = globalThis.fetch;
    const simCondition = this.currentCondition;
    this.originalFetch = originalFetch;
    this.active = true;

    // Create fetch interceptor with captured values (no this-alias needed)
    const getCondition = (): NetworkCondition => simCondition;

    globalThis.fetch = (
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const condition = getCondition();
        if (condition === "offline") {
          throw new TypeError("Failed to fetch: simulated offline");
        }

        const cfg = CONDITION_CONFIGS[condition];
        if (cfg.packetLoss > 0 && Math.random() < cfg.packetLoss) {
          await new Promise((r) => setTimeout(r, cfg.latencyMs));
          throw new TypeError("Failed to fetch: simulated packet loss");
        }
        if (cfg.latencyMs > 0) {
          await new Promise((r) => setTimeout(r, cfg.latencyMs));
        }

        return originalFetch(input, init);
      }
    );
  }

  /** Remove simulation and restore original fetch */
  restore(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    this.active = false;
    this.currentCondition = "normal";
  }

  /** Get the current active simulation condition */
  getCurrentCondition(): NetworkCondition {
    return this.currentCondition;
  }

  /** Whether a simulation is currently active */
  isActive(): boolean {
    return this.active;
  }

}

// Global singleton for browser console use
let _globalSimulator: NetworkSimulator | null = null;

export function getNetworkSimulator(): NetworkSimulator {
  if (!_globalSimulator) _globalSimulator = new NetworkSimulator();
  return _globalSimulator;
}
