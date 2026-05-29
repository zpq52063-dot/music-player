# Release Checklist

> Phase 10 — 发布检查清单 | 自托管与长期维护

---

## 发布前检查

### 构建验证
- [ ] `npm run build` 零 error
- [ ] `npm run lint` 零 error
- [ ] `npx tsc --noEmit` 零 error
- [ ] 无循环依赖 (`npx madge --circular src/app/layout.tsx`)

### Provider 验证
- [ ] MockProvider 可用 (永久兜底)
- [ ] 所有 API Routes 返回正确格式
- [ ] ProviderManager fallback 链路正常
- [ ] Provider 健康评分正常

### 缓存验证
- [ ] IndexedDB 读写正常
- [ ] SearchCache 命中率正常
- [ ] SW Cache 策略生效 (生产环境)

### PWA 验证
- [ ] manifest.json 可访问
- [ ] Service Worker 注册成功
- [ ] iOS meta tags 完整
- [ ] Install Prompt 正常触发

### Settings 验证
- [ ] 所有设置项持久化正常
- [ ] 设置页可访问
- [ ] Debug 模式切换正常
- [ ] 缓存清除功能正常

---

## 环境变量检查

```
[ ] NEXT_PUBLIC_RELEASE_MODE = release (生产) / debug (开发)
[ ] NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY = xxx
```

---

## 部署前检查

### Vercel
- [ ] 环境变量在 Vercel Dashboard 配置
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] 自定义域名 (可选)

### Supabase
- [ ] RLS 策略启用
- [ ] 数据库迁移已应用
- [ ] 匿名登录正常

---

## 长期维护检查

- [ ] AI_CONTEXT_RECOVERY.md 已更新
- [ ] docs/ai/ 下所有文档与代码一致
- [ ] MODULE_MAP.md 反映最新目录结构
- [ ] PROGRESS.md 记录当前阶段
- [ ] RuntimeConfig 备份已创建
- [ ] Provider 热更新配置已验证
