/**
 * Phase 10 — Deployment Mode 运行时
 *
 * 职责:
 * - 检测当前部署模式 (local / vercel / cloudflare / hybrid)
 * - 获取当前 Profile
 * - 模式自适应特性切换
 */

import type { DeploymentMode, DeploymentProfile } from "@/types";
import { DEPLOYMENT_PROFILES } from "@/types";

let detectedMode: DeploymentMode | null = null;

export function detectDeploymentMode(): DeploymentMode {
  if (detectedMode) return detectedMode;

  // 检测逻辑:
  if (typeof window !== "undefined") {
    // 浏览器端 — 从环境变量或host推断
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      detectedMode = "local";
    } else if (host.endsWith(".pages.dev")) {
      detectedMode = "cloudflare-pages";
    } else if (host.includes("vercel.app")) {
      detectedMode = "vercel";
    } else if (host.includes("workers.dev")) {
      detectedMode = "cloudflare";
    } else {
      // 自定义域名 — 检查是否有CF_PAGES hint
      if (typeof process !== "undefined" && process.env.CF_PAGES_URL) {
        detectedMode = "cloudflare-pages";
      } else {
        detectedMode = "vercel";
      }
    }
  } else {
    // 服务端
    if (process.env.NEXT_PUBLIC_RELEASE_MODE === "debug") {
      detectedMode = "local";
    } else if (process.env.CF_PAGES_URL || process.env.CF_PAGES_BRANCH) {
      detectedMode = "cloudflare-pages";
    } else if (process.env.CF_WORKER_URL) {
      detectedMode = "hybrid";
    } else {
      detectedMode = "vercel";
    }
  }

  return detectedMode;
}

export function getDeploymentProfile(): DeploymentProfile {
  const mode = detectDeploymentMode();
  return DEPLOYMENT_PROFILES[mode];
}

export function isLocalMode(): boolean {
  return detectDeploymentMode() === "local";
}

export function isProductionMode(): boolean {
  const mode = detectDeploymentMode();
  return mode === "vercel" || mode === "cloudflare" || mode === "cloudflare-pages" || mode === "hybrid";
}
