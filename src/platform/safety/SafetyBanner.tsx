"use client";

/**
 * Phase 20A — Safety Banner
 *
 * Visual environment indicator.
 * - Green "LOCAL" badge for local dev
 * - Yellow "PREVIEW" banner for preview deployments
 * - Hidden in production
 */

import { useEffect, useState } from "react";
import { detectEnvironmentType, type EnvironmentType } from "@/platform/env/EnvironmentGovernor";

const BANNER_STYLES: Record<EnvironmentType, { bg: string; text: string; label: string }> = {
  local: {
    bg: "bg-green-600/90",
    text: "text-white",
    label: "LOCAL",
  },
  preview: {
    bg: "bg-yellow-500/90",
    text: "text-black",
    label: "PREVIEW — DO NOT SHARE",
  },
  production: {
    bg: "",
    text: "",
    label: "",
  },
};

export function SafetyBanner() {
  const [env, setEnv] = useState<EnvironmentType | null>(null);

  useEffect(() => {
    setEnv(detectEnvironmentType());
  }, []);

  if (!env || env === "production") return null;

  const style = BANNER_STYLES[env];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${style.bg} ${style.text} text-center text-xs font-bold py-0.5 px-2`}
    >
      {style.label}
    </div>
  );
}
