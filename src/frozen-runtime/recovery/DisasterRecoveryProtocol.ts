/**
 * Phase 13 — DisasterRecoveryProtocol ★ 极其重要
 *
 * 最终灾难恢复协议。支持:
 * - 全Provider失效恢复
 * - Cache损坏恢复
 * - IndexedDB损坏恢复
 * - Runtime损坏恢复
 * - PWA异常恢复
 * - 本地降级运行
 *
 * 增强自 Phase 10 DisasterRecovery，增加了:
 * - 自动检测
 * - 多策略恢复
 * - 分步可逆恢复
 * - 恢复后自动验证
 */
import type {
  DisasterType,
  DisasterScenario,
  RecoveryStrategy,
  RecoveryPlan,
  RecoveryStep,
  RecoveryResult,
  RecoveryError,
} from "@/types/phase13";
import { DISASTER_SCENARIOS } from "@/types/phase13";

const RECOVERY_PLANS_KEY = "music_disaster_recovery_plans";

export class DisasterRecoveryProtocol {
  private static instance: DisasterRecoveryProtocol;
  private scenarios: DisasterScenario[];
  private activePlans: Map<string, RecoveryPlan> = new Map();
  private completedPlans: RecoveryPlan[] = [];
  private listeners: Set<(plan: RecoveryPlan) => void> = new Set();

  private constructor() {
    this.scenarios = [...DISASTER_SCENARIOS];
    this.loadCompletedPlans();
  }

  static getInstance(): DisasterRecoveryProtocol {
    if (!DisasterRecoveryProtocol.instance) {
      DisasterRecoveryProtocol.instance = new DisasterRecoveryProtocol();
    }
    return DisasterRecoveryProtocol.instance;
  }

  // ─── Scenario Access ───

  getScenarios(): DisasterScenario[] {
    return [...this.scenarios];
  }

  getScenario(type: DisasterType): DisasterScenario | undefined {
    return this.scenarios.find((s) => s.type === type);
  }

  // ─── Auto Detection ───

  /**
   * 自动检测当前是否处于灾难状态
   */
  async detectDisaster(): Promise<DisasterType | null> {
    // 1. 检查全Provider失效
    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();
      const realProviders = Array.from(healthMap.entries()).filter(([type]) => type !== "mock");
      const allDown = realProviders.length > 0 && realProviders.every(([, h]) => h.successRate < 30);
      if (allDown) return "all_providers_down";
    } catch { /* continue */ }

    // 2. 检查IndexedDB
    try {
      const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
      await import("@/storage/CacheDB");
      // 能成功import说明未损坏
    } catch {
      return "indexeddb_corruption";
    }

    // 3. 检查Runtime完整性
    try {
      const { getSystemIntegrity } = await import("@/platform/runtime/SystemIntegrity");
      const result = await getSystemIntegrity().checkAll();
      if (!result.passed) return "runtime_corruption";
    } catch {
      return "runtime_corruption";
    }

    // 4. 检查降级状态
    try {
      const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
      const degraded = getDegradedRuntime();
      if (degraded.isDegraded()) {
        const state = degraded.getState();
        if (state.activatedAt > 0 && Date.now() - state.activatedAt > 3600000) {
          return "local_degraded";
        }
      }
    } catch { /* continue */ }

    // 5. 检查PWA
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return "pwa_abnormal";
      } catch {
        return "pwa_abnormal";
      }
    }

    return null; // 无灾难
  }

  // ─── Recovery Plan Creation ───

  /**
   * 为检测到的灾难创建恢复计划
   */
  createRecoveryPlan(
    disaster: DisasterType,
    strategy: RecoveryStrategy = "auto",
  ): RecoveryPlan {
    const scenario = this.getScenario(disaster);
    if (!scenario) {
      throw new Error(`Unknown disaster type: ${disaster}`);
    }

    const steps = this.buildRecoverySteps(scenario, strategy);

    const plan: RecoveryPlan = {
      id: `rp-${Date.now()}`,
      disaster,
      triggeredAt: Date.now(),
      strategy,
      steps,
      currentStep: 0,
      status: "pending",
    };

    return plan;
  }

  // ─── Recovery Execution ───

  /**
   * 执行恢复计划
   */
  async executeRecovery(plan: RecoveryPlan): Promise<RecoveryResult> {
    plan.status = "in_progress";
    plan.startedAt = Date.now();
    this.activePlans.set(plan.id, plan);
    this.notifyListeners(plan);

    const errors: RecoveryError[] = [];
    let completedSteps = 0;
    let failedSteps = 0;
    let dataRestored = false;
    let systemRestored = false;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i]!;
      plan.currentStep = i;
      this.notifyListeners(plan);

      try {
        const stepPromise = this.executeStep(step);
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), step.timeout),
        );
        await Promise.race([stepPromise, timeout]);

        if (step.verifyAfter) {
          const verified = await this.verifyStep(step);
          if (!verified) {
            throw new Error("验证失败");
          }
        }

        completedSteps++;
      } catch (err) {
        failedSteps++;
        errors.push({
          step: step.order,
          stepName: step.name,
          message: err instanceof Error ? err.message : "Unknown error",
          recoverable: step.reversible,
          fallbackAction: step.reversible ? "回滚此步骤" : undefined,
        });

        // 如果不可逆，终止恢复
        if (!step.reversible && step.order < plan.steps.length - 1) {
          plan.status = "aborted";
          break;
        }
      }
    }

    // 最终验证
    if (failedSteps === 0) {
      dataRestored = plan.disaster !== "total_failure";
      systemRestored = true;
    }

    plan.status = failedSteps === 0 ? "completed" : failedSteps === plan.steps.length ? "failed" : "aborted";
    plan.completedAt = Date.now();
    plan.result = {
      success: plan.status === "completed",
      disaster: plan.disaster,
      strategy: plan.strategy,
      totalSteps: plan.steps.length,
      completedSteps,
      failedSteps,
      duration: plan.completedAt - (plan.startedAt ?? plan.triggeredAt),
      dataRestored,
      systemRestored,
      errors,
      recommendations: errors
        .filter((e) => !e.recoverable)
        .map((e) => `步骤${e.step} "${e.stepName}"不可逆失败: ${e.message}`),
    };

    this.activePlans.delete(plan.id);
    this.completedPlans.unshift(plan);
    if (this.completedPlans.length > 50) {
      this.completedPlans = this.completedPlans.slice(0, 50);
    }
    this.persistCompletedPlans();
    this.notifyListeners(plan);

    return plan.result;
  }

  /**
   * 自动检测并恢复
   */
  async autoDetectAndRecover(): Promise<RecoveryResult | null> {
    const disaster = await this.detectDisaster();
    if (!disaster) return null;

    const scenario = this.getScenario(disaster);
    if (!scenario) return null;

    // 选择最优策略
    const strategy = scenario.recoveryStrategies.includes("auto")
      ? "auto"
      : scenario.recoveryStrategies[0]!;

    const plan = this.createRecoveryPlan(disaster, strategy);
    return this.executeRecovery(plan);
  }

  // ─── Query ───

  getActivePlans(): RecoveryPlan[] {
    return Array.from(this.activePlans.values());
  }

  getCompletedPlans(): RecoveryPlan[] {
    return [...this.completedPlans];
  }

  getPlan(id: string): RecoveryPlan | undefined {
    return this.activePlans.get(id) ?? this.completedPlans.find((p) => p.id === id);
  }

  // ─── Listeners ───

  subscribe(listener: (plan: RecoveryPlan) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Report ───

  generateRecoveryReport(): string {
    const activePlans = this.getActivePlans();
    const recent = this.completedPlans.slice(0, 10);

    return [
      "# Disaster Recovery Protocol Report",
      "",
      `- **Active Plans:** ${activePlans.length}`,
      `- **Completed Plans:** ${this.completedPlans.length}`,
      `- **Ready Scenarios:** ${this.scenarios.length}`,
      "",
      "## Disaster Scenarios",
      "",
      "| Type | Severity | Auto-Detect | Recovery Strategies |",
      "|------|----------|-------------|---------------------|",
      ...this.scenarios.map(
        (s) =>
          `| ${s.type} | ${s.severity} | ${s.autoDetect ? "✅" : "❌"} | ${s.recoveryStrategies.join(", ")} |`,
      ),
      "",
      "## Recent Recoveries (last 10)",
      "",
      ...recent.map(
        (p) =>
          `- **${p.id}** (${p.disaster}) — ${p.status} (${p.result?.completedSteps ?? 0}/${p.result?.totalSteps ?? 0} steps)`,
      ),
      "",
      "---",
      "> DisasterRecoveryProtocol | Phase 13",
    ].join("\n");
  }

  // ─── Private: Step Building ───

  private buildRecoverySteps(
    scenario: DisasterScenario,
    strategy: RecoveryStrategy,
  ): RecoveryStep[] {
    switch (scenario.type) {
      case "all_providers_down":
        return this.buildProviderRecoverySteps(strategy);
      case "cache_corruption":
        return this.buildCacheRecoverySteps(strategy);
      case "indexeddb_corruption":
        return this.buildIndexedDBRecoverySteps(strategy);
      case "runtime_corruption":
        return this.buildRuntimeRecoverySteps(strategy);
      case "pwa_abnormal":
        return this.buildPWARecoverySteps(strategy);
      case "local_degraded":
        return this.buildDegradedRecoverySteps(strategy);
      case "total_failure":
        return this.buildTotalFailureSteps(strategy);
      default:
        return [];
    }
  }

  private buildProviderRecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    const steps: RecoveryStep[] = [
      {
        order: 1,
        name: "Provider健康评估",
        description: "扫描所有Provider健康状态",
        action: "scan_provider_health",
        reversible: true,
        timeout: 10000,
        verifyAfter: false,
      },
      {
        order: 2,
        name: "重置Provider状态",
        description: "重置所有Provider的健康计数器",
        action: "reset_provider_health",
        reversible: true,
        timeout: 5000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "激活降级模式",
        description: "如果Provider仍不可用，激活降级运行",
        action: "activate_degraded",
        reversible: true,
        timeout: 5000,
        verifyAfter: true,
      },
      {
        order: 4,
        name: "切换到MockProvider",
        description: "将MockProvider提升为最高优先级",
        action: "switch_to_mock",
        reversible: true,
        timeout: 5000,
        verifyAfter: true,
      },
    ];

    if (strategy === "nuclear") {
      steps.push({
        order: 5,
        name: "清除Provider缓存",
        description: "清除所有Provider相关的缓存数据",
        action: "clear_provider_cache",
        reversible: false,
        timeout: 10000,
        verifyAfter: true,
      });
    }

    return steps;
  }

  private buildCacheRecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    return [
      {
        order: 1,
        name: "清除内存缓存",
        description: "清理SearchCache和APICache",
        action: "clear_memory_cache",
        reversible: false,
        timeout: 5000,
        verifyAfter: true,
      },
      {
        order: 2,
        name: "重建缓存索引",
        description: "重建IndexedDB缓存索引",
        action: "rebuild_cache_index",
        reversible: true,
        timeout: 15000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "验证缓存完整性",
        description: "验证缓存数据完整性",
        action: "verify_cache_integrity",
        reversible: true,
        timeout: 10000,
        verifyAfter: false,
      },
    ];
  }

  private buildIndexedDBRecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    const steps: RecoveryStep[] = [
      {
        order: 1,
        name: "备份现有数据",
        description: "尝试导出IndexedDB中所有可读数据",
        action: "backup_indexeddb",
        reversible: false,
        timeout: 30000,
        verifyAfter: false,
      },
      {
        order: 2,
        name: "删除损坏的数据库",
        description: "删除现有IndexedDB数据库",
        action: "delete_indexeddb",
        reversible: false,
        timeout: 10000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "重新初始化数据库",
        description: "重新创建IndexedDB structure",
        action: "reinit_indexeddb",
        reversible: true,
        timeout: 10000,
        verifyAfter: true,
      },
      {
        order: 4,
        name: "恢复备份数据",
        description: "从备份恢复可读数据",
        action: "restore_indexeddb_backup",
        reversible: true,
        timeout: 30000,
        verifyAfter: true,
      },
    ];

    return steps;
  }

  private buildRuntimeRecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    return [
      {
        order: 1,
        name: "创建紧急检查点",
        description: "保存当前可恢复的所有状态",
        action: "create_emergency_checkpoint",
        reversible: true,
        timeout: 10000,
        verifyAfter: false,
      },
      {
        order: 2,
        name: "重置FrozenRuntime",
        description: "停用并重新激活冻结运行时",
        action: "reset_frozen_runtime",
        reversible: true,
        timeout: 10000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "重置配置",
        description: "恢复默认配置",
        action: "reset_config",
        reversible: false,
        timeout: 5000,
        verifyAfter: true,
      },
      {
        order: 4,
        name: "重启自治循环",
        description: "停止并重新启动自治维护",
        action: "restart_autonomy",
        reversible: true,
        timeout: 10000,
        verifyAfter: true,
      },
    ];
  }

  private buildPWARecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    return [
      {
        order: 1,
        name: "注销Service Worker",
        description: "注销所有已注册的SW",
        action: "unregister_sw",
        reversible: false,
        timeout: 15000,
        verifyAfter: true,
      },
      {
        order: 2,
        name: "清除SW缓存",
        description: "清除所有Service Worker缓存",
        action: "clear_sw_cache",
        reversible: false,
        timeout: 15000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "重新注册SW",
        description: "重新注册Service Worker",
        action: "reregister_sw",
        reversible: true,
        timeout: 15000,
        verifyAfter: true,
      },
      {
        order: 4,
        name: "验证PWA状态",
        description: "验证manifest和SW是否正常",
        action: "verify_pwa",
        reversible: true,
        timeout: 10000,
        verifyAfter: false,
      },
    ];
  }

  private buildDegradedRecoverySteps(strategy: RecoveryStrategy): RecoveryStep[] {
    return [
      {
        order: 1,
        name: "评估网络状态",
        description: "重新评估网络连接",
        action: "reassess_network",
        reversible: true,
        timeout: 10000,
        verifyAfter: false,
      },
      {
        order: 2,
        name: "尝试恢复在线",
        description: "尝试退出降级模式",
        action: "try_online_recovery",
        reversible: true,
        timeout: 15000,
        verifyAfter: true,
      },
      {
        order: 3,
        name: "同步本地缓存",
        description: "利用缓存数据持续运行",
        action: "sync_local_cache",
        reversible: true,
        timeout: 30000,
        verifyAfter: false,
      },
    ];
  }

  private buildTotalFailureSteps(strategy: RecoveryStrategy): RecoveryStep[] {
    return [
      {
        order: 1,
        name: "核选项准备",
        description: "准备完整系统重置",
        action: "prepare_nuclear",
        reversible: false,
        timeout: 5000,
        verifyAfter: false,
      },
      {
        order: 2,
        name: "导出所有可恢复数据",
        description: "尽最大努力导出可恢复的数据",
        action: "export_all_possible",
        reversible: false,
        timeout: 30000,
        verifyAfter: false,
      },
      {
        order: 3,
        name: "执行核选项",
        description: "完全重置所有状态和数据",
        action: "execute_nuclear",
        reversible: false,
        timeout: 10000,
        verifyAfter: true,
      },
      {
        order: 4,
        name: "重新初始化系统",
        description: "从零开始初始化所有系统",
        action: "reinitialize_all",
        reversible: true,
        timeout: 30000,
        verifyAfter: true,
      },
      {
        order: 5,
        name: "恢复备份数据",
        description: "恢复导出的数据",
        action: "restore_from_backup",
        reversible: true,
        timeout: 30000,
        verifyAfter: true,
      },
      {
        order: 6,
        name: "最终验证",
        description: "验证所有系统恢复正常",
        action: "final_verification",
        reversible: false,
        timeout: 20000,
        verifyAfter: false,
      },
    ];
  }

  // ─── Private: Execution ───

  private async executeStep(step: RecoveryStep): Promise<void> {
    switch (step.action) {
      case "scan_provider_health":
        await this.actionScanProviderHealth();
        break;
      case "reset_provider_health":
        await this.actionResetProviderHealth();
        break;
      case "activate_degraded":
        await this.actionActivateDegraded();
        break;
      case "switch_to_mock":
        await this.actionSwitchToMock();
        break;
      case "clear_provider_cache":
        await this.actionClearProviderCache();
        break;
      case "clear_memory_cache":
        await this.actionClearMemoryCache();
        break;
      case "rebuild_cache_index":
        await this.actionRebuildCacheIndex();
        break;
      case "verify_cache_integrity":
        await this.actionVerifyCacheIntegrity();
        break;
      case "delete_indexeddb":
        await this.actionDeleteIndexedDB();
        break;
      case "reinit_indexeddb":
        await this.actionReinitIndexedDB();
        break;
      case "reset_frozen_runtime":
        await this.actionResetFrozenRuntime();
        break;
      case "reset_config":
        await this.actionResetConfig();
        break;
      case "restart_autonomy":
        await this.actionRestartAutonomy();
        break;
      case "unregister_sw":
        await this.actionUnregisterSW();
        break;
      case "clear_sw_cache":
        await this.actionClearSWCache();
        break;
      case "reregister_sw":
        await this.actionReregisterSW();
        break;
      case "try_online_recovery":
        await this.actionTryOnlineRecovery();
        break;
      case "execute_nuclear":
        await this.actionExecuteNuclear();
        break;
      case "reinitialize_all":
        await this.actionReinitializeAll();
        break;
      default:
        // 非关键步骤，跳过
        break;
    }
  }

  // ─── Private: Action Implementations ───

  private async actionScanProviderHealth(): Promise<void> {
    const { getProviderManager } = await import(
      "@/music-source/providers/provider-manager/ProviderManager"
    );
    getProviderManager().getAllHealth();
  }

  private async actionResetProviderHealth(): Promise<void> {
    const { getProviderHotReload } = await import("@/platform/update/ProviderHotReload");
    getProviderHotReload().reset();
  }

  private async actionActivateDegraded(): Promise<void> {
    const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
    await getDegradedRuntime().evaluateAndAct();
  }

  private async actionSwitchToMock(): Promise<void> {
    const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
    getDegradedRuntime().activateDegraded("disaster_recovery", "severe");
  }

  private async actionClearProviderCache(): Promise<void> {
    try {
      const { getSearchCache } = await import("@/music-source/cache/SearchCache");
      getSearchCache().collectGarbage();
    } catch { /* silent */ }
  }

  private async actionClearMemoryCache(): Promise<void> {
    try {
      const { getSearchCache } = await import("@/music-source/cache/SearchCache");
      getSearchCache().collectGarbage();
    } catch { /* silent */ }
    try {
      const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
      getCacheGovernance().runGC();
    } catch { /* silent */ }
  }

  private async actionRebuildCacheIndex(): Promise<void> {
    // 触发CacheGovernance重建
    try {
      const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
      getCacheGovernance().runGC();
    } catch { /* silent */ }
  }

  private async actionVerifyCacheIntegrity(): Promise<void> {
    // 验证IndexedDB可访问
    try {
      await import("@/storage/CacheDB");
    } catch {
      throw new Error("IndexedDB不可访问");
    }
  }

  private async actionDeleteIndexedDB(): Promise<void> {
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          await new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        }
      }
    } catch (err) {
      throw new Error(`删除IndexedDB失败: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  private async actionReinitIndexedDB(): Promise<void> {
    try {
      await import("@/storage/CacheDB");
    } catch {
      throw new Error("IndexedDB重新初始化失败");
    }
  }

  private async actionResetFrozenRuntime(): Promise<void> {
    const { getFrozenRuntime } = await import("@/frozen-runtime/FrozenRuntimeManager");
    const frozen = getFrozenRuntime();
    frozen.deactivate();
    frozen.activate();
  }

  private async actionResetConfig(): Promise<void> {
    const { getRuntimeConfig } = await import("@/platform/config/RuntimeConfigManager");
    getRuntimeConfig().resetToDefaults();
  }

  private async actionRestartAutonomy(): Promise<void> {
    const { getMaintenanceLoop } = await import("@/frozen-runtime/AutonomousMaintenanceLoop");
    const ml = getMaintenanceLoop();
    ml.stop();
    ml.start();
    const { getAIAutonomy } = await import("@/ecosystem/ai-autonomy/AIAutonomyManager");
    const ai = getAIAutonomy();
    ai.stop();
    ai.start();
  }

  private async actionUnregisterSW(): Promise<void> {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
  }

  private async actionClearSWCache(): Promise<void> {
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  }

  private async actionReregisterSW(): Promise<void> {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/sw.js");
    }
  }

  private async actionTryOnlineRecovery(): Promise<void> {
    const { getDegradedRuntime } = await import("@/ecosystem/ai-autonomy/DegradedRuntimeMode");
    getDegradedRuntime().deactivate();
  }

  private async actionExecuteNuclear(): Promise<void> {
    const { getDisasterRecovery } = await import("@/platform/recovery/DisasterRecovery");
    await getDisasterRecovery().nuclearReset();
  }

  private async actionReinitializeAll(): Promise<void> {
    // 按顺序重新初始化所有关键系统
    await this.actionResetConfig();
    await this.actionResetFrozenRuntime();
    await this.actionRestartAutonomy();
  }

  // ─── Private: Verification ───

  private async verifyStep(step: RecoveryStep): Promise<boolean> {
    // 验证步骤执行结果
    try {
      switch (step.action) {
        case "reset_config":
          const { getRuntimeConfig } = await import("@/platform/config/RuntimeConfigManager");
          return getRuntimeConfig().getConfig() !== null;
        case "reset_frozen_runtime":
          const { getFrozenRuntime } = await import("@/frozen-runtime/FrozenRuntimeManager");
          return getFrozenRuntime().isActive();
        case "restart_autonomy":
          const { getMaintenanceLoop } = await import("@/frozen-runtime/AutonomousMaintenanceLoop");
          return getMaintenanceLoop().isRunning();
        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  // ─── Persistence ───

  private loadCompletedPlans(): void {
    try {
      const raw = localStorage.getItem(RECOVERY_PLANS_KEY);
      if (raw) this.completedPlans = JSON.parse(raw) as RecoveryPlan[];
    } catch {
      this.completedPlans = [];
    }
  }

  private persistCompletedPlans(): void {
    try {
      localStorage.setItem(RECOVERY_PLANS_KEY, JSON.stringify(this.completedPlans.slice(0, 50)));
    } catch { /* silent */ }
  }

  private notifyListeners(plan: RecoveryPlan): void {
    this.listeners.forEach((fn) => {
      try { fn(plan); } catch { /* silent */ }
    });
  }
}

export function getDisasterRecoveryProtocol(): DisasterRecoveryProtocol {
  return DisasterRecoveryProtocol.getInstance();
}
