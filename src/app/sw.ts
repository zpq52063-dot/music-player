import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, StaleWhileRevalidate, NetworkFirst } from "serwist";

// ===== Phase 20C: SW Version Governance =====
const SW_VERSION = "1.0.0";
const CACHE_VERSION_PREFIX = "v1";

// Versioned cache names for auto-migration
const CACHE_NAMES = {
  staticAssets: `${CACHE_VERSION_PREFIX}-static-assets`,
  staticIcons: `${CACHE_VERSION_PREFIX}-static-icons`,
  staticScreenshots: `${CACHE_VERSION_PREFIX}-static-screenshots`,
  manifest: `${CACHE_VERSION_PREFIX}-manifest`,
  images: `${CACHE_VERSION_PREFIX}-images`,
  supabaseImages: `${CACHE_VERSION_PREFIX}-supabase-images`,
  audioFiles: `${CACHE_VERSION_PREFIX}-audio-files`,
  apiResponses: `${CACHE_VERSION_PREFIX}-api-responses`,
  fonts: `${CACHE_VERSION_PREFIX}-fonts`,
  externalCdn: `${CACHE_VERSION_PREFIX}-external-cdn`,
  pages: `${CACHE_VERSION_PREFIX}-pages`,
} as const;

// Legacy cache name patterns to clean up on activation
const LEGACY_CACHE_PATTERNS = [
  /^static-assets$/,
  /^static-icons$/,
  /^static-screenshots$/,
  /^manifest$/,
  /^images$/,
  /^supabase-images$/,
  /^audio-files$/,
  /^api-responses$/,
  /^fonts$/,
  /^external-cdn$/,
  /^pages$/,
];

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// Phase 20C: Extend self type to include SW lifecycle methods available at runtime
interface SWGlobal extends WorkerGlobalScope {
  addEventListener(type: string, listener: (event: Event & { waitUntil(p: Promise<void>): void; data?: unknown; ports?: readonly MessagePort[] }) => void): void;
  skipWaiting(): Promise<void>;
  clients: { matchAll(opts: { type: string }): Promise<readonly { postMessage(msg: unknown): void }[]> };
}
declare let self: SWGlobal;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ===== Static Assets — Cache First, long TTL =====
    {
      matcher: /^https:\/\/.*\/_next\/static\/.*/i,
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.staticAssets,
      }),
    },
    {
      matcher: /^https:\/\/.*\/icons\/.*/i,
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.staticIcons,
      }),
    },
    {
      matcher: /^https:\/\/.*\/screenshots\/.*/i,
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.staticScreenshots,
      }),
    },
    // Manifest — SWR (keep fresh)
    {
      matcher: /^https:\/\/.*\/manifest\.json/i,
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.manifest,
      }),
    },

    // ===== Images — Stale While Revalidate =====
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif)$/i) !== null,
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.images,
      }),
    },
    {
      matcher: /^https:\/\/.*\.supabase\.co\/.*\.(png|jpg|jpeg|webp|avif)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.supabaseImages,
      }),
    },

    // ===== Audio — Stale While Revalidate (large files) =====
    {
      matcher: /^https:\/\/www\.soundhelix\.com\/.*\.mp3/i,
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.audioFiles,
      }),
    },

    // ===== API — Network First with Cache Fallback =====
    {
      matcher: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/api/") ||
        (url.hostname.includes("supabase.co") && url.pathname.includes("/rest/")),
      handler: new NetworkFirst({
        cacheName: CACHE_NAMES.apiResponses,
        networkTimeoutSeconds: 5,
      }),
    },

    // ===== Fonts — Cache First =====
    {
      matcher: /\.(woff2?|ttf|eot|otf)$/i,
      handler: new CacheFirst({
        cacheName: CACHE_NAMES.fonts,
      }),
    },

    // ===== External CDN — Stale While Revalidate =====
    {
      matcher: ({ url }: { url: URL }) =>
        url.hostname.includes("soundhelix.com"),
      handler: new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.externalCdn,
      }),
    },

    // ===== Navigation — Network First with Offline Fallback =====
    {
      matcher: ({ request }: { request: Request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: CACHE_NAMES.pages,
        networkTimeoutSeconds: 3,
      }),
    },

    // ===== Serwist Default Cache (Google Fonts etc.) =====
    ...defaultCache,
  ],
});

// ===== Phase 20C: Activate — Stale Cache Cleanup & Version Migration =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge all legacy (unversioned) cache entries
      const allCacheNames = await caches.keys();
      const deletePromises = allCacheNames
        .filter((name) => LEGACY_CACHE_PATTERNS.some((pattern) => pattern.test(name)))
        .map((name) => {
          console.log(`[SW ${SW_VERSION}] Purging legacy cache: ${name}`);
          return caches.delete(name);
        });
      await Promise.all(deletePromises);

      // Notify all clients that new SW is active (update UX)
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({
          type: "SW_UPDATED",
          version: SW_VERSION,
        });
      }

      console.log(`[SW ${SW_VERSION}] Activated — legacy caches purged`);
    })(),
  );
});

// ===== Phase 20C: Message Handler — Update Strategy =====
self.addEventListener("message", (event) => {
  const data = event.data as Record<string, unknown> | undefined;
  if (!data) return;

  switch (data.type) {
    case "SKIP_WAITING":
      void self.skipWaiting();
      break;
    case "GET_VERSION":
      if (event.ports?.[0]) {
        event.ports[0].postMessage({ version: SW_VERSION });
      }
      break;
    case "CLEAR_CACHE":
      event.waitUntil?.(
        (async () => {
          const cacheName = data.cacheName as string | undefined;
          if (cacheName) {
            await caches.delete(cacheName);
          }
        })(),
      );
      break;
    case "CLEAR_ALL_CACHES":
      event.waitUntil?.(
        (async () => {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        })(),
      );
      break;
  }
});

serwist.addEventListeners();
