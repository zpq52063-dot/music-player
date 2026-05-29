# TestFlight 分发指南

> Phase 8 — iOS 原生封装 + TestFlight 私用分发 | 2026-05-24

---

## 概览

通过 Capacitor 将 PWA 封装为 iOS 原生 App，通过 TestFlight 进行私用分发。

**适用场景:** 少量朋友使用，不超过 10,000 外部测试员限制。

---

## 前置条件

- **macOS** + Xcode 15+
- **Apple Developer Program** ($99/year)
- **App Store Connect** 账号
- **Node.js** 18+ + npm + Capacitor CLI

---

## Step 1: 初始化 Capacitor iOS

```bash
cd mobile

# 安装依赖
npm install --save-dev @capacitor/cli @capacitor/core @capacitor/ios

# 构建 Next.js
cd .. && npm run build

# 添加 iOS 平台
cd mobile && npx cap add ios
```

---

## Step 2: 配置 App ID

1. [Apple Developer](https://developer.apple.com) → Certificates, Identifiers & Profiles
2. Identifiers → 创建 App ID: `com.musicplayer.private`
3. 启用 Capabilities: Audio, Background Modes

---

## Step 3: App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → Apps → +
2. Platform: iOS
3. Name: Music Player
4. Bundle ID: com.musicplayer.private
5. SKU: music-player-private-001

---

## Step 4: Xcode Archive + Upload

```bash
# 1. Capacitor sync
cd mobile && npx cap sync ios

# 2. 打开 Xcode
npx cap open ios

# 3. Xcode 中:
#    - Product → Scheme → Edit Scheme → Release
#    - 选择 "Any iOS Device (arm64)"
#    - Product → Archive

# 4. Window → Organizer → 选择 Archive
#    - Distribute App → App Store Connect → Upload
#    - 勾选 "Upload your app's symbols"
#    - 勾选 "Manage version and build number"
```

---

## Step 5: TestFlight 设置

1. App Store Connect → TestFlight
2. 等待 "Processing" 完成 (通常 15-30 分钟)
3. 填写 "Test Information":
   - Beta App Description: "私用音乐播放器"
   - Feedback Email: your-email@example.com
4. 添加测试员:
   - **内部测试员** (最多 25): App Store Connect 团队成员
   - **外部测试员** (最多 10,000): 创建公开链接或 email 邀请

---

## Step 6: 安装和使用

### 测试员端:
1. 在 iPhone 上安装 TestFlight app
2. 打开邀请链接或 TestFlight 公开链接
3. 点击 "安装"
4. 打开 "Music Player" → 开始使用

---

## 版本管理

| 更新类型 | Build 号 | 审核 |
|---------|---------|------|
| 小修复 | 递增 build (如 1.0.0 build 2) | 通常无需审核 |
| 新功能 | 递增 version (如 0.2.0 build 1) | 需审核 |
| 首次提交 | 0.1.0 build 1 | 必须审核 (24-48h) |

---

## 常见问题

### Q: 首次审核需要多久？
A: 通常 24-48 小时。确保 App 没有崩溃或明显 Bug。

### Q: TestFlight 版本会过期吗？
A: 是的，每个 build 在 90 天后过期。需要上传新版本。

### Q: 可以免审核更新吗？
A: 仅小幅修复且不改变 App 主要功能时可能免审。

### Q: PWA 和 TestFlight 版本有什么区别？
A: TestFlight 版本是原生 App (Capacitor + WKWebView)，支持更好的后台播放和系统集成。

### Q: 需要 Mac 吗？
A: 上传到 App Store 必须使用 macOS + Xcode。没有 Mac 可以使用 CI/CD 服务。
