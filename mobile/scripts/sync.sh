#!/bin/bash
# =====================================================
# Capacitor 同步脚本
# 每次修改 Web 代码后运行此脚本同步原生项目
# =====================================================

set -euo pipefail

echo "🔄 Syncing Capacitor..."

# 重新构建 Web
cd ..
npm run build
cd mobile

# 同步 Capacitor
npx cap sync

echo "✅ Sync complete!"
echo ""
echo "📱 打开 Xcode: npx cap open ios"
echo "🤖 打开 Android Studio: npx cap open android"
