#!/bin/bash
# =====================================================
# iOS 构建脚本 — Capacitor + Next.js + TestFlight
# Phase 8: 生产环境构建 + iOS 原生封装
# =====================================================

set -euo pipefail

echo "🔨 Building Music Player for iOS..."
echo ""

# 1. 构建 Next.js (static export)
echo "📦 Step 1/5: Building Next.js..."
cd ..
npm run build

# Next.js static export (if configured)
if [ -d "out" ]; then
  echo "   ✓ Static export found (out/)"
else
  echo "   ⚠ No static export — using Vercel deployment URL"
fi

# 2. 同步 Capacitor
echo ""
echo "🔌 Step 2/5: Syncing Capacitor..."
npx cap sync ios

# 3. 验证 Xcode 项目
echo ""
echo "🔍 Step 3/5: Validating Xcode project..."
if [ -d "ios/App" ]; then
  echo "   ✓ Xcode project exists"
else
  echo "   ✗ Xcode project not found — run 'npx cap add ios' first"
  exit 1
fi

# 4. 构建 iOS Archive
echo ""
echo "🏗️  Step 4/5: Building iOS Archive..."
if command -v xcodebuild &> /dev/null; then
  cd ios/App
  xcodebuild archive \
    -workspace App.xcworkspace \
    -scheme App \
    -archivePath ../build/MusicPlayer.xcarchive \
    -configuration Release \
    -allowProvisioningUpdates
  echo "   ✓ Archive created"
  cd ../..
else
  echo "   ⚠ xcodebuild not available (not on macOS) — skipping"
fi

# 5. 导出 IPA / TestFlight 上传提示
echo ""
echo "📱 Step 5/5: TestFlight deployment..."
echo ""
echo "   下一步 (手动):"
echo "   1. 打开 ios/App/App.xcworkspace in Xcode"
echo "   2. Product → Archive"
echo "   3. Window → Organizer → Distribute App"
echo "   4. 选择 'App Store Connect' → Upload"
echo "   5. App Store Connect → TestFlight → 添加测试员"
echo ""
echo "✅ iOS build script complete!"
