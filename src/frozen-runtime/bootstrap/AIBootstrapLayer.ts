/**
 * Phase 13 — AIBootstrapLayer
 *
 * AI引导层。确保新AI能快速理解项目并接管维护。
 *
 * 最小路径:
 * 1. 必读文档顺序
 * 2. 当前稳定模块
 * 3. 当前冻结模块
 * 4. 当前危险区域
 * 5. 当前自治系统
 * 6. 当前恢复方式
 * 7. 当前部署状态
 * 8. 当前长期运行状态
 */

export interface BootstrapChecklistItem {
  step: number;
  title: string;
  description: string;
  resource: string;
  category: "doc" | "module" | "system" | "danger" | "deploy";
  critical: boolean;
}

export interface BootstrapStatus {
  phase: number;
  totalCriticalModules: number;
  frozenModules: number;
  activeAutonomySystems: number;
  activeRecoverySystems: number;
  dangerZones: string[];
  deploymentStatus: string;
  longTermScore: number;
}

/**
 * AI必读文档列表 (优先级排序)
 */
export const AI_BOOTSTRAP_DOCS: BootstrapChecklistItem[] = [
  {
    step: 1,
    title: "AI上下文恢复",
    description: "项目完整上下文，技术栈，架构，禁止区域",
    resource: "docs/AI_CONTEXT_RECOVERY.md",
    category: "doc",
    critical: true,
  },
  {
    step: 2,
    title: "AI项目索引",
    description: "最高优先级项目索引和文件地图",
    resource: "docs/ai/AI_PROJECT_INDEX.md",
    category: "doc",
    critical: true,
  },
  {
    step: 3,
    title: "AI接手协议",
    description: "新AI接手10步SOP",
    resource: "docs/ai/AI_ONBOARDING_PROTOCOL.md",
    category: "doc",
    critical: true,
  },
  {
    step: 4,
    title: "最终冻结状态",
    description: "当前冻结架构+禁止修改区域+永久限制",
    resource: "docs/ai/FINAL_FREEZE_STATE.md",
    category: "doc",
    critical: true,
  },
  {
    step: 5,
    title: "冻结运行时",
    description: "FrozenRuntime架构和受保护区域",
    resource: "docs/ai/FROZEN_RUNTIME.md",
    category: "doc",
    critical: false,
  },
  {
    step: 6,
    title: "项目治理",
    description: "分层治理规则和变更审批流程",
    resource: "docs/ai/PROJECT_GOVERNANCE.md",
    category: "doc",
    critical: false,
  },
  {
    step: 7,
    title: "技术债追踪",
    description: "已知技术债和永久风险点",
    resource: "docs/ai/TECHNICAL_DEBT.md",
    category: "doc",
    critical: false,
  },
];

/**
 * 当前冻结模块 (不可修改)
 */
export const FROZEN_MODULES: string[] = [
  "src/lib/audio/AudioEngine.ts",
  "src/lib/audio/AudioManager.ts",
  "src/music-source/types/provider.ts",
  "src/music-source/providers/mock/MockProvider.ts",
  "src/music-source/providers/provider-manager/ProviderManager.ts",
  "src/music-source/providers/provider-manager/HealthTracker.ts",
  "src/music-source/providers/BaseProxyProvider.ts",
  "src/music-source/services/SearchService.ts",
  "src/music-source/cache/SearchCache.ts",
  "src/music-source/cache/APICache.ts",
  "src/music-source/services/PlaybackStabilizer.ts",
  "src/system/watchdog/PlaybackWatchdog.ts",
  "src/system/recovery/ProviderSelfHealing.ts",
  "src/system/recovery/StartupRecoveryPipeline.ts",
  "src/system/cleanup/CacheGovernance.ts",
  "src/platform/recovery/DisasterRecovery.ts",
  "src/ecosystem/ai-autonomy/AIAutonomyManager.ts",
  "src/ecosystem/ai-autonomy/GovernancePipeline.ts",
  "src/ecosystem/ai-autonomy/DegradedRuntimeMode.ts",
  "src/frozen-runtime/FrozenRuntimeManager.ts",
  "src/frozen-runtime/AutonomousMaintenanceLoop.ts",
  "src/frozen-runtime/isolation/RuntimeIsolationLayer.ts",
  "src/frozen-runtime/recovery/DisasterRecoveryProtocol.ts",
  "src/server/api/proxy-helper.ts",
  "src/types/song.ts",
  "src/types/music.ts",
  "src/stores/musicPlayerStore.ts",
  "src/stores/userStore.ts",
  "src/stores/systemStore.ts",
  "src/storage/CacheDB.ts",
  "src/app/sw.ts",
  "src/components/ui/GlassCard.tsx",
  "src/components/ui/LazyImage.tsx",
  "src/components/ui/Skeleton.tsx",
  "src/components/ui/IconButton.tsx",
  "src/components/error/ErrorBoundary.tsx",
  "src/components/auth/AuthProvider.tsx",
];

/**
 * 当前危险区域 (需特别小心)
 */
export const DANGER_ZONES: string[] = [
  "src/music-source/providers/ — Provider架构核心",
  "src/system/ — 系统监控层",
  "src/platform/ — 平台运维层",
  "src/ecosystem/ — 生态系统层",
  "src/frozen-runtime/ — 冻结运行时层",
  "src/stores/ — Store状态层 (不能破坏已有API签名)",
  "src/types/ — 类型系统 (不能破坏性变更)",
  "src/storage/ — IndexedDB缓存层 (不能破坏schema)",
  "src/app/sw.ts — Service Worker缓存策略",
];

export class AIBootstrapLayer {
  private static instance: AIBootstrapLayer;

  static getInstance(): AIBootstrapLayer {
    if (!AIBootstrapLayer.instance) {
      AIBootstrapLayer.instance = new AIBootstrapLayer();
    }
    return AIBootstrapLayer.instance;
  }

  /**
   * 生成AI接手引导清单
   */
  generateOnboardingGuide(): string {
    return [
      "# AI Bootstrap Guide — 新AI接手5分钟速通",
      "",
      "## 必读文档 (按顺序)",
      "",
      ...AI_BOOTSTRAP_DOCS.map(
        (doc) =>
          `### Step ${doc.step}: ${doc.title} ${doc.critical ? "⭐" : ""}\n- ${doc.description}\n- 📄 \`${doc.resource}\``,
      ),
      "",
      "## 当前状态",
      "",
      `- **Phase:** 13 (最终长期冻结版)`,
      `- **冻结模块:** ${FROZEN_MODULES.length} 个`,
      `- **禁止区域:** ${DANGER_ZONES.length} 个`,
      "",
      "## 核心规则",
      "",
      "1. ⛔ **永远不要**修改冻结模块",
      "2. ⛔ **永远不要**修改 MusicProvider 接口",
      "3. ⛔ **永远不要**删除 MockProvider",
      "4. ⛔ **永远不要**修改 ProviderManager fallback 链",
      "5. ⛔ **永远不要**删除或禁用恢复系统",
      "6. ✅ 允许在可扩展模块中添加新字段/方法",
      "7. ✅ 允许新增 Provider 实现 (不修改接口)",
      "8. ✅ 允许新增 Store (不修改已有签名)",
      "",
      "## 自治系统",
      "",
      "| 系统 | 状态 | 位置 |",
      "|------|------|------|",
      "| FrozenRuntimeManager | 🟢 active | src/frozen-runtime/ |",
      "| AutonomousMaintenanceLoop | 🟢 active | src/frozen-runtime/ |",
      "| RuntimeIsolationLayer | 🟢 active | src/frozen-runtime/isolation/ |",
      "| SelfHealingGovernance | 🟢 active | src/frozen-runtime/healing/ |",
      "| DisasterRecoveryProtocol | 🟢 ready | src/frozen-runtime/recovery/ |",
      "| SnapshotRotationManager | 🟢 active | src/frozen-runtime/snapshots/ |",
      "| AIAutonomyManager | 🟢 active | src/ecosystem/ai-autonomy/ |",
      "| GovernancePipeline | 🟢 active | src/ecosystem/ai-autonomy/ |",
      "| DegradedRuntimeMode | 🟢 ready | src/ecosystem/ai-autonomy/ |",
      "",
      "## 恢复系统",
      "",
      "| Layer | 系统 | 级别 |",
      "|-------|------|------|",
      "| L1 (自动) | PlaybackWatchdog + ProviderSelfHealing | 即时 |",
      "| L2 (启动) | StartupRecoveryPipeline | 启动时 |",
      "| L3 (灾难) | DisasterRecovery + DisasterRecoveryProtocol | 手动/自动 |",
      "| L4 (核选项) | nuclearReset | 终极 |",
      "",
      "---",
      "> AIBootstrapLayer | Phase 13 — 最终长期冻结版",
    ].join("\n");
  }

  /**
   * 验证引导完整性
   */
  async verifyBootstrap(): Promise<{
    passed: boolean;
    missingModules: string[];
    availableDocs: string[];
  }> {
    const missingModules: string[] = [];
    const availableDocs: string[] = AI_BOOTSTRAP_DOCS.map((d) => d.resource);

    // 验证关键模块是否可访问
    const criticalModules = [
      "@/frozen-runtime/FrozenRuntimeManager",
      "@/frozen-runtime/AutonomousMaintenanceLoop",
      "@/frozen-runtime/isolation/RuntimeIsolationLayer",
      "@/frozen-runtime/recovery/DisasterRecoveryProtocol",
      "@/system/watchdog/PlaybackWatchdog",
      "@/music-source/providers/mock/MockProvider",
    ];

    for (const mod of criticalModules) {
      try {
        await import(mod);
      } catch {
        missingModules.push(mod);
      }
    }

    return {
      passed: missingModules.length === 0,
      missingModules,
      availableDocs,
    };
  }
}

export function getAIBootstrap(): AIBootstrapLayer {
  return AIBootstrapLayer.getInstance();
}
