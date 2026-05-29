/**
 * 安全的 UUID 生成
 *
 * iOS Safari / WKWebView 不完全支持 crypto.randomUUID()
 * 优先使用原生 API，不可用时 fallback 到 Math.random
 */

export function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random (足够用于 local ID)
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
