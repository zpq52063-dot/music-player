// ==================== Phase 16B: Real Cloudflare Worker — Music API Proxy ====================
//
// Routes:
//   GET /api/health              — Aggregated upstream health
//   GET /api/search              — Proxy search to public providers
//   GET /api/song/:id            — Song metadata from provider
//   GET /api/providers           — Available providers list
//   GET /api/stream?id=          — Audio stream proxy (server-side fetch from archive.org)
//
// Audio stream relay prevents ORB (Origin Read Blocking) by proxying audio through Worker.

import type {
  ProviderRoute,
  WorkerHealthResponse,
  WorkerErrorResponse,
  ProviderInfo,
  ProviderHealthStatus,
} from "../types";

// ==================== Env ====================

export interface Env {
  JAMENDO_CLIENT_ID?: string;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
}

// Cloudflare Workers scheduled event type (no @cloudflare/workers-types dependency needed)
declare class ScheduledEvent {
  readonly cron: string;
  readonly scheduledTime: number;
  noRetry(): void;
}

// ==================== Logging ====================

function prodLog(env: Env, message: string, details?: unknown): void {
  const environment = env.ENVIRONMENT ?? "local";
  if (environment === "production") {
    // Production: minimal structured log, no details
    console.log(JSON.stringify({ ts: Date.now(), msg: message, env: environment }));
  } else {
    console.log(`[${environment}] ${message}`, details ?? "");
  }
}

function prodError(env: Env, context: string, err: unknown): void {
  const environment = env.ENVIRONMENT ?? "local";
  if (environment === "production") {
    // Production: only log status code, no stack traces
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(JSON.stringify({ ts: Date.now(), ctx: context, env: environment, err: message }));
  } else {
    console.error(`[${environment}] ${context}:`, err);
  }
}

// ==================== CORS ====================

function getCORSHeaders(env: Env): Record<string, string> {
  const allowedOrigins = env.ALLOWED_ORIGINS;
  const origin = allowedOrigins && allowedOrigins.length > 0
    ? allowedOrigins.split(",").map((o) => o.trim()).join(",")
    : "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function getCORS(env: Env): Record<string, string> {
  const cors = getCORSHeaders(env);
  return cors;
}

function corsResponse(body: unknown, status = 200, env?: Env): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env) Object.assign(headers, getCORS(env));
  else {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(message: string, code: number, env?: Env): Response {
  const body: WorkerErrorResponse = { error: message, code };
  return corsResponse(body, code, env);
}

// ==================== Rate Limiter ====================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
let rateLimitCleanupCounter = 0;
const RATE_LIMIT_CLEANUP_INTERVAL = 100; // clean up expired entries every 100 requests

function cleanupExpiredRateLimits(now: number): void {
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetAt) rateLimitMap.delete(key);
  });
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Inline cleanup: amortized O(1) — runs every 100th request
  rateLimitCleanupCounter++;
  if (rateLimitCleanupCounter >= RATE_LIMIT_CLEANUP_INTERVAL) {
    rateLimitCleanupCounter = 0;
    cleanupExpiredRateLimits(now);
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// Periodic cleanup via cron trigger (scheduled handler)
// cron trigger is configured in wrangler.toml: [triggers] crons = ["*/5 * * * *"]
async function scheduledHandler(_event: ScheduledEvent, _env: Env): Promise<void> {
  cleanupExpiredRateLimits(Date.now());
}

// ==================== Provider Handlers ====================

async function searchInternetArchive(
  q: string,
  limit: number,
  offset: number,
  workerOrigin: string,
): Promise<Response> {
  const page = Math.floor(offset / limit) + 1;
  const query = `mediatype:audio AND (title:(${encodeURIComponent(q)}) OR creator:(${encodeURIComponent(q)}))`;
  const collections = [
    "georgeblood",
    "78rpm",
    "opensource_audio",
    "netlabels",
    "audio_music",
  ].join(" OR collection:");
  const fullQuery = `${query} AND (collection:${collections})`;

  const url = `https://archive.org/advancedsearch.php?q=${fullQuery}&fl[]=identifier,title,creator,description,year&output=json&rows=${limit}&page=${page}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Internet Archive returned ${res.status}`);

  const data = (await res.json()) as {
    response: { docs: Array<Record<string, unknown>>; numFound: number };
  };
  const docs = data.response.docs;

  const songs = docs.map((doc) => {
    const id = String(doc.identifier ?? "");
    const title = String(doc.title ?? "Unknown");
    const creator = String(doc.creator ?? "Unknown Artist");
    return {
      id: `ia-${id}`,
      title,
      artist: creator,
      album: "Internet Archive",
      cover_url: `https://archive.org/services/img/${id}`,
      audio_url: `${workerOrigin}/api/stream?id=${encodeURIComponent(id)}`,
      duration: 0,
      remoteId: id,
      provider: "internet-archive",
      vip: false,
      quality: "high",
    };
  });

  return corsResponse({
    songs,
    playlists: [],
    artists: [],
    total: data.response.numFound,
    hasMore: offset + limit < data.response.numFound,
  });
}

async function searchJamendo(
  q: string,
  limit: number,
  offset: number,
  env: Env,
): Promise<Response> {
  const clientId = env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return errorResponse("Jamendo provider not configured (missing API key)", 503);
  }

  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&search=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&include=musicinfo`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Jamendo returned ${res.status}`);

  const data = (await res.json()) as {
    results: Array<{
      id: string;
      name: string;
      artist_name: string;
      album_name: string;
      image: string;
      audio: string;
      duration: number;
    }>;
    headers: { results_count: number };
  };

  const songs = data.results.map((track) => ({
    id: `jamendo-${track.id}`,
    title: track.name,
    artist: track.artist_name,
    album: track.album_name || "Jamendo",
    cover_url: track.image || "",
    audio_url: track.audio,
    duration: Math.round(track.duration),
    remoteId: track.id,
    provider: "jamendo",
    vip: false,
    quality: "high",
  }));

  return corsResponse({
    songs,
    playlists: [],
    artists: [],
    total: data.headers.results_count,
    hasMore: offset + limit < data.headers.results_count,
  });
}

async function searchCcMixter(
  q: string,
  limit: number,
): Promise<Response> {
  const url = `https://ccmixter.org/api/query?datasource=uploads&search_type=all&search=${encodeURIComponent(q)}&limit=${limit}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`ccMixter returned ${res.status}`);

  const data = (await res.json()) as Array<{
    upload_id: string;
    upload_name: string;
    user_name: string;
    description: string;
    download_url: string;
    duration: number;
  }>;

  const results = Array.isArray(data) ? data : [];
  const songs = results.map((item) => ({
    id: `ccmixter-${item.upload_id}`,
    title: item.upload_name || "Unknown",
    artist: item.user_name || "Unknown Artist",
    album: "ccMixter",
    cover_url: "",
    audio_url: item.download_url || "",
    duration: Math.round(item.duration || 0),
    remoteId: item.upload_id,
    provider: "ccmixter",
    vip: false,
    quality: "high",
  }));

  return corsResponse({
    songs,
    playlists: [],
    artists: [],
    total: songs.length,
    hasMore: false,
  });
}

async function getSongInternetArchive(id: string, workerOrigin: string): Promise<Response> {
  const identifier = id.startsWith("ia-") ? id.slice(3) : id;
  const url = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Internet Archive returned ${res.status}`);

  const data = (await res.json()) as {
    metadata: { title?: string; creator?: string; description?: string };
    files?: Array<{ name: string; format: string }>;
  };

  return corsResponse({
    id: `ia-${identifier}`,
    title: data.metadata?.title ?? identifier,
    artist: data.metadata?.creator ?? "Unknown Artist",
    album: "Internet Archive",
    cover_url: `https://archive.org/services/img/${identifier}`,
    audio_url: `${workerOrigin}/api/stream?id=${encodeURIComponent(identifier)}`,
    duration: 0,
    remoteId: identifier,
    provider: "internet-archive",
    vip: false,
    quality: "high",
  });
}

async function getSongJamendo(songId: string, env: Env): Promise<Response> {
  const clientId = env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return errorResponse("Jamendo provider not configured", 503);
  }

  const id = songId.startsWith("jamendo-") ? songId.slice(8) : songId;
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&id=${id}&include=musicinfo`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Jamendo returned ${res.status}`);

  const data = (await res.json()) as {
    results: Array<{
      id: string;
      name: string;
      artist_name: string;
      album_name: string;
      image: string;
      audio: string;
      duration: number;
    }>;
  };

  const track = data.results[0];
  if (!track) return errorResponse("Song not found", 404);

  return corsResponse({
    id: `jamendo-${track.id}`,
    title: track.name,
    artist: track.artist_name,
    album: track.album_name || "Jamendo",
    cover_url: track.image || "",
    audio_url: track.audio,
    duration: Math.round(track.duration),
    remoteId: track.id,
    provider: "jamendo",
    vip: false,
    quality: "high",
  });
}

// ==================== Audio Stream Proxy ====================

async function streamHandler(id: string): Promise<Response> {
  const identifier = id.startsWith("ia-") ? id.slice(3) : id;

  // 1. Fetch metadata to find the actual MP3 filename
  const metaUrl = `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
  const metaRes = await fetch(metaUrl, { signal: AbortSignal.timeout(10000) });
  if (!metaRes.ok) {
    return new Response(JSON.stringify({ error: "Metadata fetch failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const meta = (await metaRes.json()) as {
    files?: Array<{ name: string; format: string }>;
  };

  const mp3Files = (meta.files ?? []).filter(
    (f) => f.format === "VBR MP3" || f.name.endsWith(".mp3"),
  );

  if (mp3Files.length === 0) {
    return new Response(JSON.stringify({ error: "No playable audio found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const mp3Name = mp3Files[0]!.name;
  const audioUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(mp3Name)}`;

  // 2. Fetch audio from archive.org server-side
  const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(30000) });
  if (!audioRes.ok) {
    return new Response(JSON.stringify({ error: "Audio fetch failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // 3. Stream audio back with proper headers
  const headers = new Headers();
  headers.set("Content-Type", "audio/mpeg");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600");
  if (audioRes.headers.has("Content-Length")) {
    headers.set("Content-Length", audioRes.headers.get("Content-Length")!);
  }

  return new Response(audioRes.body, { status: 200, headers });
}

// ==================== Health Check ====================

async function checkProviderHealth(
  _name: string,
  checkFn: () => Promise<{ healthy: boolean; latency: number }>,
): Promise<{ healthy: boolean; latency: number; lastCheck: number; error?: string }> {
  try {
    const result = await checkFn();
    return { ...result, lastCheck: Date.now() };
  } catch (err) {
    return {
      healthy: false,
      latency: 0,
      lastCheck: Date.now(),
      error: String(err),
    };
  }
}

async function healthHandler(env: Env): Promise<Response> {
  const results = await Promise.all([
    checkProviderHealth("internet-archive", async () => {
      const start = Date.now();
      const res = await fetch("https://archive.org/advancedsearch.php?q=mediatype:audio&rows=1&output=json", {
        signal: AbortSignal.timeout(8000),
      });
      return { healthy: res.ok, latency: Date.now() - start };
    }),
    checkProviderHealth("jamendo", async () => {
      const clientId = env.JAMENDO_CLIENT_ID;
      if (!clientId) return { healthy: false, latency: 0 };
      const start = Date.now();
      const res = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=1`,
        { signal: AbortSignal.timeout(8000) },
      );
      return { healthy: res.ok, latency: Date.now() - start };
    }),
    checkProviderHealth("ccmixter", async () => {
      const start = Date.now();
      const res = await fetch("https://ccmixter.org/api/query?datasource=uploads&limit=1", {
        signal: AbortSignal.timeout(8000),
      });
      return { healthy: res.ok, latency: Date.now() - start };
    }),
  ]);

  const providers: Record<string, ProviderHealthStatus> = {};
  const providerNames = ["internet-archive", "jamendo", "ccmixter"];
  let allHealthy = true;

  results.forEach((r, i) => {
    providers[providerNames[i]!] = {
      healthy: r.healthy,
      latency: r.latency,
      lastCheck: r.lastCheck,
      consecutiveFails: r.healthy ? 0 : 1,
      error: r.error,
    };
    if (!r.healthy) allHealthy = false;
  });

  const body: WorkerHealthResponse = {
    status: allHealthy ? "ok" : "degraded",
    timestamp: Date.now(),
    providers,
  };

  return corsResponse(body);
}

// ==================== Provider List ====================

function providersHandler(env: Env): Response {
  const list: ProviderInfo[] = [
    {
      id: "internet-archive",
      name: "Internet Archive",
      enabled: true,
      requiresAuth: false,
    },
    {
      id: "jamendo",
      name: "Jamendo",
      enabled: !!env.JAMENDO_CLIENT_ID,
      requiresAuth: true,
    },
    {
      id: "ccmixter",
      name: "ccMixter",
      enabled: true,
      requiresAuth: false,
    },
  ];
  return corsResponse({ providers: list });
}

// ==================== Main Fetch Handler ====================

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await scheduledHandler(event, env);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const workerOrigin = url.origin;

    // CORS preflight — production-aware headers
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCORS(env) });
    }

    if (request.method !== "GET") {
      return errorResponse("Method not allowed", 405, env);
    }

    // Rate limiting (skip for health + stream endpoints)
    if (path !== "/api/health" && path !== "/api/stream") {
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      if (!checkRateLimit(ip)) {
        prodLog(env, "rate_limit_exceeded", { ip });
        return errorResponse("Rate limit exceeded. Try again later.", 429, env);
      }
    }

    try {
      // GET /api/stream?id=<identifier> — Audio stream proxy
      if (path === "/api/stream") {
        const id = url.searchParams.get("id") ?? "";
        if (!id) return errorResponse("Missing id parameter", 400, env);
        prodLog(env, "stream_request", { id });
        return await streamHandler(id);
      }

      // GET /api/health (with edge cache in production)
      if (path === "/api/health") {
        const healthResponse = await healthHandler(env);
        if (env.ENVIRONMENT === "production") {
          healthResponse.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=30");
          healthResponse.headers.set("CDN-Cache-Control", "public, max-age=60");
        }
        return healthResponse;
      }

      // GET /api/providers
      if (path === "/api/providers") {
        return providersHandler(env);
      }

      // GET /api/search?q=&provider=&type=&limit=&offset=
      if (path === "/api/search") {
        const q = url.searchParams.get("q") ?? "";
        const provider = (url.searchParams.get("provider") ?? "internet-archive") as ProviderRoute;
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 50);
        const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;

        if (!q.trim()) return errorResponse("Missing query parameter: q", 400, env);

        prodLog(env, "search_request", { provider, q: q.substring(0, 50) });

        switch (provider) {
          case "internet-archive":
            return await searchInternetArchive(q, limit, offset, workerOrigin);
          case "jamendo":
            return await searchJamendo(q, limit, offset, env);
          case "ccmixter":
            return await searchCcMixter(q, limit);
          case "all" as ProviderRoute:
          default: {
            // Return results from all providers
            const [iaResult, jamendoResult, ccResult] = await Promise.allSettled([
              searchInternetArchive(q, limit, offset, workerOrigin),
              searchJamendo(q, Math.min(limit, 10), offset, env),
              searchCcMixter(q, Math.min(limit, 10)),
            ]);

            const allSongs: unknown[] = [];
            let total = 0;

            for (const result of [iaResult, jamendoResult, ccResult]) {
              if (result.status === "fulfilled") {
                const body = await result.value.json();
                if (body.songs) {
                  allSongs.push(...(body.songs as unknown[]));
                  total += (body.total as number) ?? 0;
                }
              }
            }

            return corsResponse({
              songs: allSongs,
              playlists: [],
              artists: [],
              total,
              hasMore: false,
            });
          }
        }
      }

      // GET /api/song/:id?provider=
      const songMatch = path.match(/^\/api\/song\/(.+)$/);
      if (songMatch) {
        const songId = decodeURIComponent(songMatch[1]!);
        const provider = (url.searchParams.get("provider") ?? "internet-archive") as ProviderRoute;

        switch (provider) {
          case "internet-archive":
            return await getSongInternetArchive(songId, workerOrigin);
          case "jamendo":
            return await getSongJamendo(songId, env);
          default:
            return errorResponse(`Provider not available for song detail: ${provider}`, 400, env);
        }
      }

      // 404
      return errorResponse("Not found", 404, env);
    } catch (err) {
      prodError(env, `worker_error[${path}]`, err);
      const message = env.ENVIRONMENT === "production"
        ? "Service temporarily unavailable"
        : `Upstream service error: ${err instanceof Error ? err.message : "Unknown error"}`;
      return errorResponse(message, 502, env);
    }
  },
};
