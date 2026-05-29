/**
 * Phase 17 + Phase 20A — Production Monitor Hook
 *
 * 挂载 ProviderTelemetry + CacheGovernanceV2
 * Phase 20A: Gated by environment — disabled in production, enabled in preview/local
 * 在 AudioProvider 中挂载
 */

"use client";

import { useEffect, useRef } from "react";
import { getProviderTelemetry } from "@/system/telemetry/ProviderTelemetry";
import { getCacheGovernanceV2 } from "@/system/cleanup/CacheGovernanceV2";
import { ProductionGuard } from "@/platform/safety/ProductionGuard";

export function useProductionMonitor() {
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current || typeof window === "undefined") return;
    isMounted.current = true;

    // Production gating (Phase 20A)
    if (!ProductionGuard.isTelemetryAllowed()) return;

    const providerTelemetry = getProviderTelemetry();
    const cacheGovV2 = getCacheGovernanceV2();

    providerTelemetry.start();
    cacheGovV2.start();

    // 首次检查存储压力
    cacheGovV2.checkStoragePressure().catch(() => {});

    return () => {
      providerTelemetry.stop();
      cacheGovV2.stop();
    };
  }, []);

  return null;
}
