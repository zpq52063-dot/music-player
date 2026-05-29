# Capacitor iOS 封装指南

> Phase 8 — iOS 原生封装 + TestFlight 部署

---

## 架构

```
PWA (Next.js)  ←→  Capacitor Bridge  ←→  WKWebView (iOS)
     ↑                  ↑                      ↑
  Vercel 部署      原生 API 访问           TestFlight 分发
```

**双模式兼容：**
- **PWA 模式**: 浏览器/Safari 直接访问 (现有)
- **Hybrid 模式**: Capacitor 封装的 iOS 原生 App

---

## 前置条件

1. macOS + Xcode 15+
2. Apple Developer Account ($99/year)
3. Node.js 18+ + npm
4. Capacitor CLI

```bash
npm install -g @capacitor/cli @capacitor/core @capacitor/ios
```

---

## 初始化 iOS 项目

```bash
cd mobile

# 安装 Capacitor 依赖
npm install --save-dev @capacitor/cli @capacitor/core @capacitor/ios

# 添加 iOS 平台
npx cap add ios
```

---

## 开发和测试

```bash
# 1. 本地开发 (PWA 模式)
cd .. && npm run dev

# 2. 构建 + 同步到原生项目
npm run build
cd mobile && npx cap sync

# 3. 打开 Xcode
npx cap open ios

# 4. 在 Xcode 中: Product → Run (⌘R)
# 选择模拟器: iPhone 16 Pro
```

---

## 生产构建

```bash
# 使用构建脚本
cd mobile
bash scripts/build-ios.sh
```

---

## TestFlight 部署

### Step 1: App Store Connect

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建 App: "Music Player" (com.musicplayer.private)
3. 填写隐私政策 URL (必须)

### Step 2: Xcode Archive

1. Xcode → Product → Scheme → Edit Scheme → Release
2. Product → Archive
3. Window → Organizer → Distribute App
4. 选择 "App Store Connect" → Upload

### Step 3: TestFlight

1. App Store Connect → TestFlight
2. 添加测试员 (email 邀请 或 公开链接)
3. 测试员安装 TestFlight app → 打开邀请 → 安装

### TestFlight 限制

- 最多 10,000 外部测试员
- 最多 25 名内部测试员 (App Store Connect 团队成员)
- Beta 版本每 90 天过期
- 首次上传需要 Apple 审核 (通常 24-48 小时)

---

## iOS 关键配置

### 音频后台播放 (already in Info.plist)

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

### AppDelegate.swift 关键代码

```swift
import Capacitor
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 配置音频会话 (后台播放)
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default,
                options: [.allowAirPlay, .allowBluetooth]
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session: \(error)")
        }
        return true
    }
}
```

---

## PWA + Hybrid 兼容策略

| 特性 | PWA | Capacitor |
|------|-----|-----------|
| 音频后台播放 | limited | ✅ full |
| 控制中心 | Media Session API | MPNowPlayingInfoCenter |
| 离线缓存 | Service Worker | Native + SW |
| 推送通知 | Web Push (limited iOS) | APNs |
| 文件系统 | IndexedDB | Native FileManager |
| App Store | ❌ | ✅ TestFlight |

**当前策略:**
1. PWA 作为主要使用方式 (Safari "添加到主屏幕")
2. Capacitor 封装作为可选增强 (TestFlight 私用分发)
3. 共享同一套 Next.js 代码
4. Capacitor 通过 `window.Capacitor` 检测平台差异

---

## 版本管理

- **PWA版本**: package.json version
- **iOS版本**: CFBundleShortVersionString (Info.plist)
- 保持两者同步: `0.1.0` → `1` (build)
