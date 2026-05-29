/**
 * Capacitor Configuration — Music Player iOS/Android Wrapper
 *
 * Phase 8: iOS封装预留 + TestFlight准备
 * 使用方式: npx cap sync ios
 */

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.musicplayer.private",
  appName: "Music",
  webDir: "out", // Next.js static export 输出目录
  server: {
    // 开发模式: 连接 Vercel 部署的 PWA
    // 生产模式: 使用本地静态文件
    url: process.env.CAPACITOR_DEV_SERVER || undefined,
    cleartext: false,
    allowNavigation: ["*"],
  },
  ios: {
    contentInset: "always",
    // iOS 状态栏适配
    preferredContentMode: "mobile",
    // 允许内联媒体播放 (不需要全屏)
    allowsInlineMediaPlayback: true,
    // 滚动惯性优化
    scrollEnabled: true,
    // 底部安全区域
    contentInsetAlways: true,
  },
  android: {
    // Android 预留 (暂不开发)
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // 音频后台播放 (关键)
    CapacitorMusicControls: {
      // iOS 控制中心 + 锁屏
      enabled: true,
    },
    // 文件系统 (离线下载预留)
    Filesystem: {
      enabled: true,
    },
  },
};

export default config;
