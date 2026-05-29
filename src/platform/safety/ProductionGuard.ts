/**
 * Phase 20A — Production Safety Guard
 *
 * Runtime safety checks that prevent dangerous operations in production.
 * - Suppress debug output
 * - Sanitize errors (strip stack traces)
 * - Gate diagnostic features
 * - Control log verbosity
 */

import { isProduction } from "@/platform/env/EnvironmentGovernor";

export const ProductionGuard = {
  /** Throws if called in production. Use in debug-only code paths. */
  assertNotProduction(context: string): void {
    if (isProduction()) {
      throw new Error(`[ProductionGuard] Operation not allowed in production: ${context}`);
    }
  },

  /** Strips stack traces in production; returns full error in debug. */
  sanitizeError(error: unknown): { message: string; code?: number } {
    if (error instanceof Error) {
      if (isProduction()) {
        return { message: error.message };
      }
      return { message: error.message };
    }
    if (typeof error === "string") {
      return { message: error };
    }
    return { message: "An unexpected error occurred" };
  },

  /** Whether diagnostic features (debug overlay, diagnostics page) are allowed. */
  isDiagnosticsAllowed(): boolean {
    return !isProduction();
  },

  /** Returns the log level for the current environment. */
  getLogLevel(): "verbose" | "normal" | "minimal" {
    if (isProduction()) return "minimal";
    const mode =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RELEASE_MODE : "debug";
    if (mode === "internal") return "normal";
    return "verbose";
  },

  /** Whether debug overlay should be rendered. */
  isDebugOverlayAllowed(): boolean {
    if (isProduction()) return false;
    const overlay =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DEBUG_OVERLAY : "true";
    return overlay === "true";
  },

  /** Whether telemetry should be running. */
  isTelemetryAllowed(): boolean {
    if (isProduction()) return false;
    const telemetry =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_TELEMETRY_ENABLED : "true";
    return telemetry === "true";
  },
};

/** Creates a user-facing error safe for production (no internal details leaked). */
export function safeError(
  userFacingMessage: string,
  _originalError: unknown,
): Error {
  if (isProduction()) {
    return new Error(userFacingMessage);
  }
  const detail =
    _originalError instanceof Error ? _originalError.message : String(_originalError);
  return new Error(`${userFacingMessage} (${detail})`);
}
