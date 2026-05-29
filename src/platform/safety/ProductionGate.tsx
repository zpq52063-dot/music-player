"use client";

/**
 * Phase 20A — Production Gate Component
 *
 * Client-side wrapper that renders children only in non-production environments.
 * Used to hide debug/diagnostic components in production.
 */

import { useEffect, useState } from "react";
import { isProduction } from "@/platform/env/EnvironmentGovernor";

export function ProductionGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!isProduction());
  }, []);

  if (!show) return null;

  return <>{children}</>;
}
