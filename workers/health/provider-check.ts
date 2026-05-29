// ==================== Phase 16B: Provider Health Checks ====================
//
// Individual health check functions for each upstream provider.
// The /api/health endpoint aggregates these.
// Cron trigger (optional) writes results to KV for historical tracking.

export interface ProviderHealthCheck {
  provider: string;
  healthy: boolean;
  latency: number;
  lastCheck: number;
  consecutiveFails: number;
  error?: string;
}

const TIMEOUT_MS = 8000;

/** Check Internet Archive health via search API */
export async function checkInternetArchive(): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch(
      "https://archive.org/advancedsearch.php?q=mediatype:audio&rows=1&output=json",
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return { healthy: res.ok, latency: Date.now() - start };
  } catch {
    return { healthy: false, latency: Date.now() - start };
  }
}

/** Check Jamendo health via tracks API */
export async function checkJamendo(clientId?: string): Promise<{
  healthy: boolean;
  latency: number;
}> {
  if (!clientId) return { healthy: false, latency: 0 };

  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=1`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    return { healthy: res.ok, latency: Date.now() - start };
  } catch {
    return { healthy: false, latency: Date.now() - start };
  }
}

/** Check ccMixter health via API */
export async function checkCcMixter(): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();
  try {
    const res = await fetch("https://ccmixter.org/api/query?datasource=uploads&limit=1", {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { healthy: res.ok, latency: Date.now() - start };
  } catch {
    return { healthy: false, latency: Date.now() - start };
  }
}

/** Check all providers and return aggregated results */
export async function checkAllProviders(env?: {
  JAMENDO_CLIENT_ID?: string;
}): Promise<ProviderHealthCheck[]> {
  const now = Date.now();

  const [ia, jamendo, cc] = await Promise.all([
    checkInternetArchive(),
    checkJamendo(env?.JAMENDO_CLIENT_ID),
    checkCcMixter(),
  ]);

  return [
    {
      provider: "internet-archive",
      healthy: ia.healthy,
      latency: ia.latency,
      lastCheck: now,
      consecutiveFails: ia.healthy ? 0 : 1,
    },
    {
      provider: "jamendo",
      healthy: jamendo.healthy,
      latency: jamendo.latency,
      lastCheck: now,
      consecutiveFails: jamendo.healthy ? 0 : 1,
    },
    {
      provider: "ccmixter",
      healthy: cc.healthy,
      latency: cc.latency,
      lastCheck: now,
      consecutiveFails: cc.healthy ? 0 : 1,
    },
  ];
}

/** Scheduled handler for periodic health checks (Cron trigger) */
export async function scheduled(
  _event: ScheduledEvent,
  env: { JAMENDO_CLIENT_ID?: string },
): Promise<void> {
  const results = await checkAllProviders(env);
  console.log("[health-check]", JSON.stringify(results));
  // TODO: Write results to KV for historical tracking
}
