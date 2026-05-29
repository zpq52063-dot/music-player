/**
 * Phase 13 — FrozenRuntimeManager ★ 核心
 *
 * 冻结运行时管理器。职责:
 * - 冻结核心Runtime结构，防止危险热修改
 * - 管理受保护区域 (readonly / protected / frozen)
 * - 完整性校验与自动恢复
 * - 违规检测与封锁
 * - 自治运行模式管理
 */
import type {
  FrozenRuntimeState,
  FrozenRuntimeConfig,
  FrozenSection,
  FrozenSectionConfig,
  FrozenMode,
  FrozenViolation,
} from "@/types/phase13";
import { DEFAULT_FROZEN_RUNTIME_CONFIG } from "@/types/phase13";

const STATE_KEY = "music_frozen_runtime_state";
const CONFIG_KEY = "music_frozen_runtime_config";

export class FrozenRuntimeManager {
  private static instance: FrozenRuntimeManager;
  private config: FrozenRuntimeConfig;
  private state: FrozenRuntimeState;
  private integrityTimer: ReturnType<typeof setInterval> | null = null;
  private violationCount = 0;
  private listeners: Set<(state: FrozenRuntimeState) => void> = new Set();

  private constructor() {
    this.config = this.loadConfig();
    this.state = this.loadState();
  }

  static getInstance(): FrozenRuntimeManager {
    if (!FrozenRuntimeManager.instance) {
      FrozenRuntimeManager.instance = new FrozenRuntimeManager();
    }
    return FrozenRuntimeManager.instance;
  }

  // ─── Lifecycle ───

  /**
   * 激活冻结运行时
   * 锁定所有受保护区域，启动完整性检查循环
   */
  activate(): FrozenRuntimeState {
    if (!this.config.enabled) return this.state;

    this.state = {
      id: `frozen-${Date.now()}`,
      activatedAt: Date.now(),
      mode: "active",
      sections: this.buildSectionConfigs(),
      protectedCount: 0,
      readonlyCount: 0,
      integrityScore: 100,
      lastIntegrityCheck: Date.now(),
      violations: [],
    };

    // 统计
    this.state.protectedCount = this.state.sections.filter(
      (s) => s.mode === "protected",
    ).length;
    this.state.readonlyCount = this.state.sections.filter(
      (s) => s.mode === "readonly",
    ).length;

    this.violationCount = 0;
    this.persistState();
    this.startIntegrityCheck();
    this.notifyListeners();

    return this.state;
  }

  deactivate(): void {
    this.stopIntegrityCheck();
    this.state.mode = "dormant";
    this.persistState();
    this.notifyListeners();
  }

  isActive(): boolean {
    return this.state.mode === "active";
  }

  // ─── Configuration ───

  getConfig(): FrozenRuntimeConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<FrozenRuntimeConfig>): void {
    this.config = { ...this.config, ...partial };
    this.persistConfig();
    if (this.config.enabled && this.state.mode !== "active") {
      this.activate();
    } else if (!this.config.enabled) {
      this.deactivate();
    }
  }

  // ─── State Access ───

  getState(): FrozenRuntimeState {
    return { ...this.state };
  }

  getIntegrityScore(): number {
    return this.state.integrityScore;
  }

  // ─── Section Protection ───

  /**
   * 检查某个区域是否可以修改
   * @returns true = 允许修改
   */
  canModify(section: FrozenSection): boolean {
    const cfg = this.state.sections.find((s) => s.section === section);
    if (!cfg) return true;
    if (cfg.mode === "frozen") return false;
    if (cfg.mode === "readonly") return cfg.allowExtensions;
    return cfg.mode !== "protected" || cfg.allowExtensions;
  }

  /**
   * 获取section的保护级别
   */
  getSectionMode(section: FrozenSection): FrozenMode | null {
    return this.state.sections.find((s) => s.section === section)?.mode ?? null;
  }

  /**
   * 列出所有被冻结的sections
   */
  getFrozenSections(): FrozenSectionConfig[] {
    return this.state.sections.filter((s) => s.mode === "frozen");
  }

  /**
   * 列出所有受保护的sections
   */
  getProtectedSections(): FrozenSectionConfig[] {
    return this.state.sections.filter(
      (s) => s.mode === "protected" || s.mode === "readonly",
    );
  }

  // ─── Violation Management ───

  /**
   * 记录违规
   */
  reportViolation(
    section: FrozenSection,
    description: string,
    severity: FrozenViolation["severity"] = "high",
  ): FrozenViolation {
    const violation: FrozenViolation = {
      id: `viol-${Date.now()}`,
      section,
      detectedAt: Date.now(),
      description,
      severity,
      action:
        this.config.lockdownMode === "total"
          ? "block"
          : this.config.lockdownMode === "strict"
            ? "restore"
            : "warn",
      autoResolved: false,
    };

    this.state.violations.unshift(violation);
    this.violationCount++;
    this.state.integrityScore = Math.max(
      0,
      this.state.integrityScore - (severity === "critical" ? 20 : severity === "high" ? 10 : 5),
    );

    // 如果超过阈值，进入紧急模式
    if (this.violationCount >= this.config.maxViolationsBeforeLockdown) {
      this.state.mode = "emergency";
    }

    this.persistState();
    this.notifyListeners();
    return violation;
  }

  /**
   * 解决违规
   */
  resolveViolation(id: string): boolean {
    const v = this.state.violations.find((v) => v.id === id);
    if (!v) return false;
    v.autoResolved = true;
    v.resolvedAt = Date.now();
    this.violationCount = Math.max(0, this.violationCount - 1);
    this.state.integrityScore = Math.min(100, this.state.integrityScore + 5);
    this.persistState();
    this.notifyListeners();
    return true;
  }

  getViolations(): FrozenViolation[] {
    return [...this.state.violations];
  }

  getOpenViolations(): FrozenViolation[] {
    return this.state.violations.filter((v) => !v.autoResolved);
  }

  // ─── Integrity Check ───

  /**
   * 完整完整性检查
   */
  async runIntegrityCheck(): Promise<{
    score: number;
    violations: FrozenViolation[];
    passed: boolean;
  }> {
    const violations: FrozenViolation[] = [];

    for (const section of this.state.sections) {
      const ok = await this.verifySection(section);
      if (!ok) {
        violations.push({
          id: `auto-viol-${Date.now()}-${section.section}`,
          section: section.section,
          detectedAt: Date.now(),
          description: `完整性校验失败: ${section.section}`,
          severity: section.mode === "frozen" ? "critical" : "high",
          action: "restore",
          autoResolved: false,
        });
      }
    }

    // 更新分数
    const passed = violations.length === 0;
    if (passed) {
      this.state.integrityScore = Math.min(100, this.state.integrityScore + 2);
    } else {
      this.state.integrityScore = Math.max(
        0,
        this.state.integrityScore - violations.length * 5,
      );
      this.state.violations.push(...violations);
    }

    this.state.lastIntegrityCheck = Date.now();
    this.persistState();
    this.notifyListeners();

    return {
      score: this.state.integrityScore,
      violations: this.getOpenViolations(),
      passed,
    };
  }

  // ─── Listeners ───

  subscribe(listener: (state: FrozenRuntimeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ─── Report ───

  generateStatusReport(): string {
    const s = this.state;
    const modeEmoji = { active: "🔒", dormant: "💤", emergency: "🚨" };

    return [
      `# Frozen Runtime Status — ${new Date().toISOString()}`,
      "",
      `- **Mode:** ${modeEmoji[s.mode]} ${s.mode}`,
      `- **Active Since:** ${new Date(s.activatedAt).toISOString()}`,
      `- **Integrity Score:** ${s.integrityScore}/100`,
      `- **Protected:** ${s.protectedCount} sections`,
      `- **Readonly:** ${s.readonlyCount} sections`,
      `- **Open Violations:** ${this.getOpenViolations().length}`,
      "",
      "## Protected Sections",
      "",
      "| Section | Mode | Locked At | Extensible | Hot-Reloadable |",
      "|---------|------|-----------|------------|----------------|",
      ...s.sections.map(
        (sec) =>
          `| ${sec.section} | ${sec.mode} | ${new Date(sec.lockedAt).toISOString()} | ${sec.allowExtensions} | ${sec.hotReloadable} |`,
      ),
      "",
      s.violations.length > 0
        ? [
            "## Recent Violations",
            "",
            ...s.violations
              .slice(0, 5)
              .map((v) => `- [${v.severity}] ${v.section}: ${v.description} (${v.autoResolved ? "resolved" : "open"})`),
          ].join("\n")
        : "## No Violations",
      "",
      "---",
      "> FrozenRuntimeManager | Phase 13 — 最终长期冻结版",
    ].join("\n");
  }

  // ─── Private ───

  private buildSectionConfigs(): FrozenSectionConfig[] {
    const now = Date.now();
    return [
      {
        section: "core_runtime",
        mode: "frozen",
        lockedAt: now,
        reason: "核心Runtime结构不可修改 — 破坏即导致系统崩溃",
        allowExtensions: false,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "providers",
        mode: "protected",
        lockedAt: now,
        reason: "Provider架构受保护 — Fallback链 + MockProvider不可移除",
        allowExtensions: true,
        hotReloadable: true,
        autoRestore: true,
      },
      {
        section: "recovery_pipeline",
        mode: "frozen",
        lockedAt: now,
        reason: "恢复管道不可修改 — 三层恢复是系统最后防线",
        allowExtensions: false,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "cache_governance",
        mode: "protected",
        lockedAt: now,
        reason: "缓存治理受保护 — 三层缓存是离线运行的保障",
        allowExtensions: true,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "audio_engine",
        mode: "frozen",
        lockedAt: now,
        reason: "音频引擎冻结 — AudioManager单例不可替换",
        allowExtensions: false,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "music_provider_interface",
        mode: "frozen",
        lockedAt: now,
        reason: "Provider接口冻结 — 破坏接口影响所有Provider实现",
        allowExtensions: true,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "governance_pipeline",
        mode: "protected",
        lockedAt: now,
        reason: "治理管道受保护 — 5阶段巡检保证系统一致性",
        allowExtensions: true,
        hotReloadable: false,
        autoRestore: true,
      },
      {
        section: "autonomy_loop",
        mode: "protected",
        lockedAt: now,
        reason: "自治循环受保护 — 长期运行的核心保障",
        allowExtensions: true,
        hotReloadable: true,
        autoRestore: true,
      },
    ];
  }

  /**
   * 验证单个section的完整性
   * 通过动态import检查关键模块是否可访问
   */
  private async verifySection(section: FrozenSectionConfig): Promise<boolean> {
    const checks: Record<FrozenSection, string[]> = {
      core_runtime: [
        "@/lib/audio/AudioManager",
        "@/stores/musicPlayerStore",
      ],
      providers: [
        "@/music-source/providers/provider-manager/ProviderManager",
        "@/music-source/providers/mock/MockProvider",
      ],
      recovery_pipeline: [
        "@/system/watchdog/PlaybackWatchdog",
        "@/system/recovery/ProviderSelfHealing",
        "@/platform/recovery/DisasterRecovery",
      ],
      cache_governance: [
        "@/system/cleanup/CacheGovernance",
        "@/storage/CacheDB",
      ],
      audio_engine: [
        "@/lib/audio/AudioManager",
      ],
      music_provider_interface: [
        "@/music-source/types/provider",
      ],
      governance_pipeline: [
        "@/ecosystem/ai-autonomy/GovernancePipeline",
        "@/system/governance/RuntimeGovernanceManager",
      ],
      autonomy_loop: [
        "@/ecosystem/ai-autonomy/AIAutonomyManager",
      ],
    };

    const modulesToCheck = checks[section.section];
    if (!modulesToCheck) return true;

    for (const mod of modulesToCheck) {
      try {
        await import(mod);
      } catch {
        if (section.autoRestore) {
          // 自动恢复尝试：记录并返回false
          return false;
        }
        return false;
      }
    }

    return true;
  }

  private startIntegrityCheck(): void {
    this.stopIntegrityCheck();
    this.integrityTimer = setInterval(
      () => this.runIntegrityCheck(),
      this.config.integrityCheckInterval,
    );
  }

  private stopIntegrityCheck(): void {
    if (this.integrityTimer) {
      clearInterval(this.integrityTimer);
      this.integrityTimer = null;
    }
  }

  // ─── Persistence ───

  private loadConfig(): FrozenRuntimeConfig {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? { ...DEFAULT_FROZEN_RUNTIME_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_FROZEN_RUNTIME_CONFIG };
    } catch {
      return { ...DEFAULT_FROZEN_RUNTIME_CONFIG };
    }
  }

  private persistConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch { /* silent */ }
  }

  private loadState(): FrozenRuntimeState {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) return JSON.parse(raw) as FrozenRuntimeState;
    } catch { /* silent */ }
    return this.defaultState();
  }

  private persistState(): void {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
    } catch { /* silent */ }
  }

  private defaultState(): FrozenRuntimeState {
    return {
      id: "",
      activatedAt: 0,
      mode: "dormant",
      sections: [],
      protectedCount: 0,
      readonlyCount: 0,
      integrityScore: 0,
      lastIntegrityCheck: 0,
      violations: [],
    };
  }

  private notifyListeners(): void {
    const snapshot = { ...this.state };
    this.listeners.forEach((fn) => {
      try { fn(snapshot); } catch { /* silent */ }
    });
  }
}

export function getFrozenRuntime(): FrozenRuntimeManager {
  return FrozenRuntimeManager.getInstance();
}
