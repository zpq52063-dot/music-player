/**
 * Phase 13 — Frozen Runtime 统一导出 ★
 *
 * 最终长期冻结版架构 + AI完全自治维护 + 项目永续运行体系
 *
 * 模块:
 * - FrozenRuntimeManager:       冻结核心Runtime结构，防止危险热修改
 * - AutonomousMaintenanceLoop:  周期性自治维护任务调度
 * - RuntimeIsolationLayer:      模块异常隔离，防止单点崩溃影响全局
 * - SelfHealingGovernance:      自动诊断+治愈方案+风险评分
 * - SnapshotRotationManager:    周期性Runtime快照+自动清理
 * - DisasterRecoveryProtocol:   全场景灾难恢复协议
 * - FrozenGovernanceManager:    冻结治理与变更审批
 * - AIBootstrapLayer:           AI快速接管引导
 * - AutonomousArchiveManager:   自治归档管理
 */

// Core
export { FrozenRuntimeManager, getFrozenRuntime } from "./FrozenRuntimeManager";
export { AutonomousMaintenanceLoop, getMaintenanceLoop } from "./AutonomousMaintenanceLoop";

// Isolation
export { RuntimeIsolationLayer, getRuntimeIsolation } from "./isolation";

// Healing
export { SelfHealingGovernance, getSelfHealingGovernance } from "./healing";

// Snapshots
export { SnapshotRotationManager, getSnapshotRotation } from "./snapshots";

// Recovery
export { DisasterRecoveryProtocol, getDisasterRecoveryProtocol } from "./recovery";

// Governance
export { FrozenGovernanceManager, getFrozenGovernance } from "./governance";
export type { GovernanceDecision } from "./governance";

// Bootstrap
export {
  AIBootstrapLayer,
  getAIBootstrap,
  AI_BOOTSTRAP_DOCS,
  FROZEN_MODULES,
  DANGER_ZONES,
} from "./bootstrap";
export type { BootstrapChecklistItem, BootstrapStatus } from "./bootstrap";

// Archive
export { AutonomousArchiveManager, getAutonomousArchive } from "./archive";
export type { ArchivedItem } from "./archive";
