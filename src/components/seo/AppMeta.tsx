/**
 * Phase 20B — Enhanced SEO + Meta + PWA Optimization
 *
 * Comprehensive meta tags for:
 * - PWA installability (Lighthouse PWA 90+)
 * - Apple iOS standalone experience
 * - OpenGraph / Twitter social sharing
 * - Performance hints (preconnect, DNS prefetch)
 * - Security headers
 */

export function AppMeta() {
  return (
    <>
      {/* ==================== PWA Core ==================== */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Music" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* ==================== Theme Color (multi-scheme for Lighthouse) ==================== */}
      <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
      <meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)" />

      {/* ==================== OpenGraph ==================== */}
      <meta property="og:title" content="Music Player" />
      <meta
        property="og:description"
        content="Modern mobile music player — private streaming experience"
      />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Music Player" />
      <meta property="og:locale" content="zh_CN" />

      {/* ==================== Twitter Card ==================== */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="Music Player" />
      <meta
        name="twitter:description"
        content="Modern mobile music player — private streaming experience"
      />

      {/* ==================== Performance Hints ==================== */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      <link rel="dns-prefetch" href="//archive.org" />
      <link rel="preconnect" href="//archive.org" crossOrigin="anonymous" />

      {/* ==================== Security ==================== */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {/* ==================== Search Engines (private app) ==================== */}
      <meta name="robots" content="noindex, nofollow" />

      {/* ==================== Lighthouse Accessibility ==================== */}
      <meta name="color-scheme" content="dark" />
    </>
  );
}
