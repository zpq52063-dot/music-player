import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AudioProvider } from "@/components/layout/AudioProvider";
import { InstallDetector } from "@/components/pwa/InstallDetector";
import { AppMeta } from "@/components/seo/AppMeta";
import { ErrorBoundary } from "@/components/error/EnhancedErrorBoundary";
import { getSiteBaseUrl } from "@/platform/url/SiteUrlResolver";
import { SafetyBanner } from "@/platform/safety/SafetyBanner";
import {
  InstallPrompt,
  StandaloneOnboarding,
  SWUpdateNotification,
  ProviderInit,
  FallbackNotice,
  FocusPlayer,
  ProductionGate,
  ProviderDebugPanel,
  DebugOverlayWrapper,
} from "@/components/layout/DynamicImports";

const APP_NAME = "Music";
const APP_SHORT_NAME = "Music";
const APP_DESCRIPTION =
  "Modern mobile music player — stream, discover, and enjoy your favorite music";
const BASE_URL = getSiteBaseUrl();

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_SHORT_NAME,
  },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: BASE_URL ? `${BASE_URL}/manifest.json` : "/manifest.json",
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: BASE_URL ? new URL(BASE_URL) : undefined,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
    locale: "zh_CN",
    ...(BASE_URL
      ? {
          url: BASE_URL,
          images: [
            {
              url: `${BASE_URL}/icons/icon-512.png`,
              width: 512,
              height: 512,
              alt: APP_NAME,
            },
          ],
        }
      : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        {/* Phase 20C: Preconnect critical origins for Lighthouse */}
        <link rel="preconnect" href="https://archive.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://archive.org" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Touch Icons — all required sizes */}
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />

        {/* Maskable icon (for Android adaptive icons) */}
        <link rel="mask-icon" href="/icons/maskable-icon-192.png" color="#0a0a0a" />

        {/* iOS Splash Screens — iPhone 14/15/16 Pro Max (430×932 @3x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/screenshots/splash-1290x2796.png"
        />
        {/* iPhone 14/15/16 Pro (393×852 @3x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
          href="/screenshots/splash-1179x2556.png"
        />
        {/* iPhone 14/15/16 (393×852 @2x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 2)"
          href="/screenshots/splash-786x1704.png"
        />
        {/* iPhone 13 mini / 12 mini / 11 Pro / XS / X (375×812 @3x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
          href="/screenshots/splash-1125x2436.png"
        />
        {/* iPhone 8 / SE 2nd/3rd gen (375×667 @2x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
          href="/screenshots/splash-750x1334.png"
        />
        {/* iPad Pro 11" (834×1194 @2x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
          href="/screenshots/splash-1668x2388.png"
        />
        {/* iPad Pro 12.9" (1024×1366 @2x) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
          href="/screenshots/splash-2048x2732.png"
        />

        {/* Preload critical hero image (reserved for LCP optimization) */}
        {/* <link rel="preload" as="image" href="/icons/icon-512.png" /> */}

        {/* SEO + Meta (Phase 20B enhanced) */}
        <AppMeta />
      </head>
      <body className="antialiased">
        <SafetyBanner />
        <ErrorBoundary>
          <AuthProvider>
            <InstallDetector>
              <AudioProvider>
                <ProviderInit />
                <main className="relative mx-auto min-h-[100dvh] max-w-md">{children}</main>
                <FocusPlayer />
                <FallbackNotice />
                <InstallPrompt />
                <StandaloneOnboarding />
                <SWUpdateNotification />
                <ProductionGate>
                  <ProviderDebugPanel />
                  <DebugOverlayWrapper />
                </ProductionGate>
              </AudioProvider>
            </InstallDetector>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
