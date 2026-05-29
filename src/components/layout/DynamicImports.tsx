/**
 * Phase 20C — Client Component wrapper for dynamic imports.
 *
 * RootLayout is a Server Component, so next/dynamic with ssr:false must live
 * inside a Client Component. This component wraps all optional/heavy components
 * that should be deferred for Lighthouse bundle optimization.
 */

"use client";

import dynamic from "next/dynamic";

export const InstallPrompt = dynamic(
  () => import("@/components/pwa/InstallPrompt").then((m) => m.InstallPrompt),
  { ssr: false },
);
export const StandaloneOnboarding = dynamic(
  () => import("@/components/pwa/StandaloneOnboarding").then((m) => m.StandaloneOnboarding),
  { ssr: false },
);
export const SWUpdateNotification = dynamic(
  () => import("@/components/pwa/SWUpdateNotification").then((m) => m.SWUpdateNotification),
  { ssr: false },
);
export const ProviderInit = dynamic(
  () => import("@/components/provider/ProviderInit").then((m) => m.ProviderInit),
  { ssr: false },
);
export const FallbackNotice = dynamic(
  () => import("@/components/provider/FallbackNotice").then((m) => m.FallbackNotice),
  { ssr: false },
);
export const FocusPlayer = dynamic(
  () => import("@/components/focus/FocusPlayer").then((m) => m.FocusPlayer),
  { ssr: false },
);
export const ProductionGate = dynamic(
  () => import("@/platform/safety/ProductionGate").then((m) => m.ProductionGate),
  { ssr: false },
);
// Dev-only: stripped from production
export const ProviderDebugPanel = dynamic(
  () => import("@/components/debug/ProviderDebugPanel").then((m) => m.ProviderDebugPanel),
  { ssr: false },
);
export const DebugOverlayWrapper = dynamic(
  () => import("@/system/diagnostics/DebugOverlayWrapper").then((m) => m.DebugOverlayWrapper),
  { ssr: false },
);
