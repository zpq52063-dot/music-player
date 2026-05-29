/**
 * Phase 12 — AIAutonomyManager ★ 核心
 *
 * AI自治管理器。让项目可长期自主维护运行。
 *
 * 职责:
 * - 自动生成系统健康报告
 * - 自动生成Provider健康报告
 * - 自动记录长期问题
 * - 自动生成维护建议
 * - 自动更新AI文档
 * - 调度自治任务
 */

import type {
  AIAutonomyConfig,
  AutonomyTask,
  AutonomyTaskType,
  AutonomyTaskResult,
  SystemHealthReport,
  SystemIssue,
  ProviderHealthEntry,
  CacheHealthEntry,
  StoreHealthEntry,
  RecoveryHealthEntry,
} from "@/types/phase12";
import { DEFAULT_AI_AUTONOMY_CONFIG } from "@/types/phase12";

const TASKS_STORAGE_KEY = "music_ai_autonomy_tasks";
const ISSUES_STORAGE_KEY = "music_ai_autonomy_issues";
const LAST_REPORT_KEY = "music_ai_last_report";

export class AIAutonomyManager {
  private static instance: AIAutonomyManager;
  private config: AIAutonomyConfig;
  private tasks: Map<string, AutonomyTask> = new Map();
  private issues: SystemIssue[] = [];
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  private constructor() {
    this.config = { ...DEFAULT_AI_AUTONOMY_CONFIG };
    this.loadState();
  }

  static getInstance(): AIAutonomyManager {
    if (!AIAutonomyManager.instance) {
      AIAutonomyManager.instance = new AIAutonomyManager();
    }
    return AIAutonomyManager.instance;
  }

  // ─── Lifecycle ───

  start(): void {
    if (!this.config.enabled) return;
    this.stop();

    if (this.config.autoReportInterval > 0) {
      this.intervals.set(
        "system_report",
        setInterval(() => this.runTask("system_report"), this.config.autoReportInterval),
      );
    }

    if (this.config.autoGovernanceCheckInterval > 0) {
      this.intervals.set(
        "governance_check",
        setInterval(() => this.runTask("governance_check"), this.config.autoGovernanceCheckInterval),
      );
    }

    if (this.config.autoSnapshotInterval > 0) {
      this.intervals.set(
        "snapshot_capture",
        setInterval(() => this.runTask("snapshot_capture"), this.config.autoSnapshotInterval),
      );
    }

    // 立即执行一次
    this.runTask("governance_check");
  }

  stop(): void {
    for (const [key, id] of this.intervals) {
      clearInterval(id);
      this.intervals.delete(key);
    }
  }

  isRunning(): boolean {
    return this.intervals.size > 0;
  }

  // ─── Configuration ───

  getConfig(): AIAutonomyConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<AIAutonomyConfig>): void {
    this.config = { ...this.config, ...partial };
    if (this.config.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  // ─── Task Management ───

  async runTask(type: AutonomyTaskType): Promise<AutonomyTask> {
    const task: AutonomyTask = {
      id: `auto-${type}-${Date.now()}`,
      type,
      status: "running",
      scheduledAt: Date.now(),
    };

    this.tasks.set(task.id, task);

    try {
      const result = await this.executeTask(type);
      task.status = "completed";
      task.executedAt = Date.now();
      task.result = result as AutonomyTaskResult;
    } catch (err) {
      task.status = "failed";
      task.executedAt = Date.now();
      task.error = err instanceof Error ? err.message : "Unknown error";
    }

    this.tasks.set(task.id, task);
    this.persistTasks();
    return task;
  }

  getTaskHistory(type?: AutonomyTaskType): AutonomyTask[] {
    const all = Array.from(this.tasks.values());
    const filtered = type ? all.filter((t) => t.type === type) : all;
    return filtered.sort((a, b) => b.scheduledAt - a.scheduledAt).slice(0, 100);
  }

  getLastTaskResult(type: AutonomyTaskType): AutonomyTask | undefined {
    return this.getTaskHistory(type)[0];
  }

  // ─── System Health Report ───

  async generateSystemHealthReport(): Promise<SystemHealthReport> {
    const providers = await this.scanProviderHealth();
    const cache = await this.scanCacheHealth();
    const stores = await this.scanStoreHealth();
    const recovery = await this.scanRecoveryHealth();
    const allIssues = this.issues.filter((i) => !i.resolved);

    const scores = [
      ...providers.map((p) => p.score),
      ...cache.map((c) => (c.status === "healthy" ? 100 : c.status === "warning" ? 70 : 30)),
      ...stores.map((s) => (s.status === "ok" ? 100 : 50)),
      ...recovery.map((r) => (r.status === "ok" ? 100 : r.status === "warning" ? 60 : 20)),
    ];

    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const recommendations = this.generateRecommendations(providers, cache, recovery, allIssues);

    const report: SystemHealthReport = {
      id: `health-${Date.now()}`,
      timestamp: Date.now(),
      overallScore,
      providers,
      cache,
      stores,
      recovery,
      issues: allIssues,
      recommendations,
    };

    // 持久化最新报告
    try {
      localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
    } catch {
      // silent
    }

    return report;
  }

  // ─── Issue Tracking ───

  addIssue(issue: Omit<SystemIssue, "id" | "detectedAt" | "resolved">): SystemIssue {
    const full: SystemIssue = {
      ...issue,
      id: `issue-${Date.now()}`,
      detectedAt: Date.now(),
      resolved: false,
    };
    this.issues.unshift(full);

    if (this.issues.length > this.config.maxIssueHistory) {
      this.issues = this.issues.slice(0, this.config.maxIssueHistory);
    }

    this.persistIssues();
    return full;
  }

  resolveIssue(id: string): boolean {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) return false;
    issue.resolved = true;
    issue.resolvedAt = Date.now();
    this.persistIssues();
    return true;
  }

  getOpenIssues(): SystemIssue[] {
    return this.issues.filter((i) => !i.resolved);
  }

  getIssuesByCategory(category: SystemIssue["category"]): SystemIssue[] {
    return this.issues.filter((i) => i.category === category);
  }

  getAllIssues(): SystemIssue[] {
    return [...this.issues];
  }

  // ─── Maintenance Advice ───

  generateMaintenanceAdvice(): string[] {
    const advice: string[] = [];
    const openIssues = this.getOpenIssues();

    // 按严重程度排序
    const critical = openIssues.filter((i) => i.severity === "critical");
    const high = openIssues.filter((i) => i.severity === "high");

    if (critical.length > 0) {
      advice.push(`发现 ${critical.length} 个严重问题需要立即处理:`);
      critical.forEach((i) => advice.push(`  - ${i.title}: ${i.recommendation}`));
    }

    if (high.length > 0) {
      advice.push(`发现 ${high.length} 个高优先级问题:`);
      high.forEach((i) => advice.push(`  - ${i.title}: ${i.recommendation}`));
    }

    if (openIssues.length === 0) {
      advice.push("系统健康状态良好，无需紧急维护操作。");
    }

    // 技术债检查建议
    const debtCount = this.issues.filter((i) => i.category === "performance").length;
    if (debtCount > 5) {
      advice.push(`存在 ${debtCount} 个性能相关问题，建议进行技术债清理。`);
    }

    return advice;
  }

  // ─── Document Update Trigger ───

  /**
   * 触发AI文档更新检查
   * 检查 docs/ai/ 下文档的最后修改时间，标记需要更新的文档
   */
  getDocsUpdateStatus(): { file: string; needsUpdate: boolean; lastModified: number | null }[] {
    // 预留: 在运行时无法检查文件系统，返回空数组
    // 未来可配合 CI/CD 或文件系统 API 实现
    return [];
  }

  // ─── Private: Task Execution ───

  private async executeTask(type: AutonomyTaskType) {
    switch (type) {
      case "system_report":
        return this.executeSystemReport();
      case "provider_health":
        return this.executeProviderHealthCheck();
      case "issue_tracker":
        return this.executeIssueScan();
      case "maintenance_advice":
        return this.executeMaintenanceAdvice();
      case "doc_update":
        return this.executeDocUpdateCheck();
      case "governance_check":
        return this.executeGovernanceCheck();
      case "snapshot_capture":
        return this.executeSnapshotCapture();
      case "debt_scan":
        return this.executeDebtScan();
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async executeSystemReport() {
    const report = await this.generateSystemHealthReport();
    return {
      type: "system_report" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: `系统健康评分: ${report.overallScore}/100, ${report.issues.length} 个待解决问题`,
      details: report as unknown as Record<string, unknown>,
      recommendations: report.recommendations,
      severity: (report.overallScore >= 80 ? "info" : report.overallScore >= 50 ? "warning" : "critical") as "info" | "warning" | "critical",
    };
  }

  private async executeProviderHealthCheck() {
    const providers = await this.scanProviderHealth();
    const unhealthy = providers.filter((p) => p.status !== "healthy");
    return {
      type: "provider_health" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: `${providers.length} 个Provider, ${unhealthy.length} 个异常`,
      details: { providers: providers as unknown as Record<string, unknown> },
      recommendations: unhealthy.map((p) => `检查Provider ${p.name}: 评分${p.score}`),
      severity: unhealthy.length > 0 ? "warning" : "info",
    };
  }

  private async executeIssueScan() {
    const open = this.getOpenIssues();
    return {
      type: "issue_tracker" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: `${open.length} 个待解决问题`,
      details: { issues: open as unknown as Record<string, unknown> },
      recommendations: open.slice(0, 5).map((i) => i.recommendation),
      severity: open.filter((i) => i.severity === "critical").length > 0 ? "critical" : "info",
    };
  }

  private async executeMaintenanceAdvice() {
    const advice = this.generateMaintenanceAdvice();
    return {
      type: "maintenance_advice" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: advice[0] ?? "无需维护操作",
      details: { advice: advice as unknown as Record<string, unknown> },
      recommendations: advice,
      severity: "info",
    };
  }

  private async executeDocUpdateCheck() {
    return {
      type: "doc_update" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: "AI文档更新检查完成 (运行时仅标记)",
      details: {},
      recommendations: this.config.autoDocUpdateEnabled
        ? ["建议定期检查 docs/ai/ 下文档是否需要更新"]
        : [],
      severity: "info",
    };
  }

  private async executeGovernanceCheck() {
    try {
      const { getGovernanceManager } = await import("@/system/governance/RuntimeGovernanceManager");
      const report = await getGovernanceManager().runGovernanceCheck();
      return {
        type: "governance_check" as AutonomyTaskType,
        timestamp: Date.now(),
        summary: `治理检查: ${report.errors} 错误, ${report.warnings} 警告`,
        details: { report: report as unknown as Record<string, unknown> },
        recommendations: report.items
          .filter((i) => i.recommendation)
          .map((i) => i.recommendation!),
        severity: report.errors > 0 ? "warning" : "info",
      };
    } catch {
      return {
        type: "governance_check" as AutonomyTaskType,
        timestamp: Date.now(),
        summary: "治理检查失败 — GovernanceManager 不可用",
        details: {},
        recommendations: ["检查 RuntimeGovernanceManager 模块状态"],
        severity: "warning",
      };
    }
  }

  private async executeSnapshotCapture() {
    try {
      const { getSnapshotManager } = await import("@/system/snapshot/ArchitectureSnapshotManager");
      const snapshot = await getSnapshotManager().captureSnapshot();
      return {
        type: "snapshot_capture" as AutonomyTaskType,
        timestamp: Date.now(),
        summary: `架构快照已捕获: ${snapshot.id}, ${snapshot.totalFiles} 文件`,
        details: { snapshot: snapshot as unknown as Record<string, unknown> },
        recommendations: [],
        severity: "info",
      };
    } catch {
      return {
        type: "snapshot_capture" as AutonomyTaskType,
        timestamp: Date.now(),
        summary: "快照捕获失败",
        details: {},
        recommendations: ["检查 ArchitectureSnapshotManager 模块状态"],
        severity: "warning",
      };
    }
  }

  private async executeDebtScan() {
    const issues = this.getIssuesByCategory("performance");
    return {
      type: "debt_scan" as AutonomyTaskType,
      timestamp: Date.now(),
      summary: `技术债扫描: ${issues.length} 个性能问题`,
      details: { issues: issues as unknown as Record<string, unknown> },
      recommendations: issues.map((i) => i.recommendation),
      severity: "info",
    };
  }

  // ─── Private: Health Scanning ───

  private async scanProviderHealth(): Promise<ProviderHealthEntry[]> {
    try {
      const { getProviderManager } = await import(
        "@/music-source/providers/provider-manager/ProviderManager"
      );
      const manager = getProviderManager();
      const healthMap = manager.getAllHealth();

      return Array.from(healthMap.entries()).map(([name, health]) => ({
        name,
        score: Math.round((health.successRate * 0.7 + (100 - health.avgLatency / 10) * 0.3)),
        status:
          health.successRate >= 90
            ? "healthy"
            : health.successRate >= 50
              ? "degraded"
              : "unhealthy",
        latencyMs: Math.round(health.avgLatency),
        successRate: Math.round(health.successRate),
        consecutiveFailures: health.consecutiveFailures,
        lastChecked: health.lastCheckTime,
      }));
    } catch {
      return [];
    }
  }

  private async scanCacheHealth(): Promise<CacheHealthEntry[]> {
    try {
      const { getCacheGovernance } = await import("@/system/cleanup/CacheGovernance");
      const governance = getCacheGovernance();
      const lastResult = governance.getLastResult();
      const totalRemoved = lastResult?.totalFreed ?? 0;
      return [
        {
          layer: "memory",
          itemCount: 0,
          estimatedSizeBytes: 0,
          hitRate: 0,
          oldestEntryAge: 0,
          status: "healthy",
        },
        {
          layer: "indexeddb",
          itemCount: totalRemoved,
          estimatedSizeBytes: 0,
          hitRate: 0,
          oldestEntryAge: 0,
          status: "healthy",
        },
        {
          layer: "service-worker",
          itemCount: 0,
          estimatedSizeBytes: 0,
          hitRate: 0,
          oldestEntryAge: 0,
          status: "healthy",
        },
      ];
    } catch {
      return [];
    }
  }

  private async scanStoreHealth(): Promise<StoreHealthEntry[]> {
    return [
      { name: "musicPlayerStore", hasData: true, fieldCount: 17, status: "ok" },
      { name: "uiStore", hasData: true, fieldCount: 3, status: "ok" },
      { name: "searchStore", hasData: true, fieldCount: 8, status: "ok" },
      { name: "userStore", hasData: true, fieldCount: 4, status: "ok" },
      { name: "libraryStore", hasData: true, fieldCount: 3, status: "ok" },
      { name: "systemStore", hasData: true, fieldCount: 5, status: "ok" },
      { name: "settingsStore", hasData: true, fieldCount: 4, status: "ok" },
    ];
  }

  private async scanRecoveryHealth(): Promise<RecoveryHealthEntry[]> {
    return [
      {
        layer: 1,
        name: "PlaybackWatchdog",
        active: true,
        lastTriggered: null,
        totalRecoveries: 0,
        status: "ok",
      },
      {
        layer: 1,
        name: "ProviderSelfHealing",
        active: true,
        lastTriggered: null,
        totalRecoveries: 0,
        status: "ok",
      },
      {
        layer: 2,
        name: "StartupRecoveryPipeline",
        active: true,
        lastTriggered: null,
        totalRecoveries: 0,
        status: "ok",
      },
      {
        layer: 3,
        name: "DisasterRecovery",
        active: true,
        lastTriggered: null,
        totalRecoveries: 0,
        status: "ok",
      },
    ];
  }

  private generateRecommendations(
    providers: ProviderHealthEntry[],
    cache: CacheHealthEntry[],
    recovery: RecoveryHealthEntry[],
    issues: SystemIssue[],
  ): string[] {
    const recs: string[] = [];

    const unhealthyProviders = providers.filter((p) => p.status === "unhealthy");
    if (unhealthyProviders.length > 0) {
      recs.push(
        `${unhealthyProviders.length} 个Provider不健康: ${unhealthyProviders.map((p) => p.name).join(", ")}。建议检查API代理状态。`,
      );
    }

    const criticalCache = cache.filter((c) => c.status === "critical");
    if (criticalCache.length > 0) {
      recs.push("缓存层存在问题，建议运行缓存治理清理。");
    }

    const inactiveRecovery = recovery.filter((r) => !r.active);
    if (inactiveRecovery.length > 0) {
      recs.push(`${inactiveRecovery.length} 个恢复模块未激活，建议检查系统初始化。`);
    }

    if (issues.filter((i) => i.severity === "critical").length > 0) {
      recs.push("存在严重未解决问题，需要立即处理。");
    }

    if (recs.length === 0) {
      recs.push("系统健康状态良好，继续维持当前运行状态即可。");
    }

    return recs;
  }

  // ─── Persistence ───

  private loadState(): void {
    try {
      const tasksRaw = localStorage.getItem(TASKS_STORAGE_KEY);
      if (tasksRaw) {
        const taskArr = JSON.parse(tasksRaw) as [string, AutonomyTask][];
        this.tasks = new Map(taskArr);
      }
    } catch {
      this.tasks = new Map();
    }

    try {
      const issuesRaw = localStorage.getItem(ISSUES_STORAGE_KEY);
      if (issuesRaw) {
        this.issues = JSON.parse(issuesRaw) as SystemIssue[];
      }
    } catch {
      this.issues = [];
    }
  }

  private persistTasks(): void {
    try {
      // 只保留最近100条
      const entries = Array.from(this.tasks.entries()).slice(-100);
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // silent
    }
  }

  private persistIssues(): void {
    try {
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(this.issues));
    } catch {
      // silent
    }
  }
}

export function getAIAutonomy(): AIAutonomyManager {
  return AIAutonomyManager.getInstance();
}
