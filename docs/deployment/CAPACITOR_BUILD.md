# Capacitor 构建指南

> Phase 8 — 从 Web 到原生 App 的构建流程 | 2026-05-24

---

## 构建流水线

```
Next.js Build (npm run build)
    ↓
Capacitor Sync (npx cap sync)
    ↓
Xcode Build (xcodebuild)
    ↓
Archive + IPA Export
    ↓
TestFlight / Ad-Hoc 分发
```

---

## 快速开始

```bash
# 1. 安装 Capacitor 依赖
cd mobile
npm install --save-dev @capacitor/cli @capacitor/core @capacitor/ios

# 2. 构建 Web 项目
cd ..
npm run build

# 3. 同步到 iOS
cd mobile
npx cap sync ios

# 4. 打开 Xcode
npx cap open ios

# 5. 在 Xcode 中按 ⌘R 运行到模拟器
```

---

## 生产构建

```bash
cd mobile
bash scripts/build-ios.sh
```

或手动:

```bash
# 1. Next.js static export (如果需要)
cd ..
npm run build

# 2. Capacitor sync
cd mobile
npx cap sync ios

# 3. Xcode archive
cd ios/App
xcodebuild archive \
  -workspace App.xcworkspace \
  -scheme App \
  -archivePath ../build/MusicPlayer.xcarchive \
  -configuration Release \
  -allowProvisioningUpdates

# 4. 导出 IPA
xcodebuild -exportArchive \
  -archivePath ../build/MusicPlayer.xcarchive \
  -exportPath ../build/ipa \
  -exportOptionsPlist ExportOptions.plist
```

---

## capacitor.config.ts 关键配置

```typescript
{
  appId: "com.musicplayer.private",
  appName: "Music",
  webDir: "out",                    // Next.js 静态导出目录
  server: {
    url: process.env.CAPACITOR_DEV_SERVER, // 开发模式热重载
  },
  ios: {
    contentInset: "always",          // Safe area 适配
    allowsInlineMediaPlayback: true, // 内联视频/音频
    preferredContentMode: "mobile",  // 移动端内容模式
  }
}
```

---

## 开发模式 (热重载)

```bash
# 终端 1: Next.js dev server
cd ..
npm run dev

# 终端 2: Capacitor sync + Xcode
cd mobile
CAPACITOR_DEV_SERVER=http://192.168.x.x:3000 npx cap sync ios
npx cap open ios
```

这样 Xcode 中的 WKWebView 会直接加载本地开发服务器。

---

## ExportOptions.plist 模板

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>teamID</key>
  <string>YOUR_TEAM_ID</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

---

## CI/CD (预留)

```yaml
# .github/workflows/ios-build.yml (GitHub Actions macOS runner)
- uses: actions/checkout@v4
- run: npm ci && npm run build
- run: cd mobile && npm ci && npx cap sync ios
- run: cd mobile/ios/App && xcodebuild archive ...
- uses: apple-actions/upload-testflight-build@v1
```
