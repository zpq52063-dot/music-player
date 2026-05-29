/**
 * Phase 10 — SystemIntegrity
 *
 * 职责:
 * - 系统完整性检查
 * - 关键文件/Store/单例验证
 * - 自动健康报告
 *
 * 模式: 单例
 */

import type { IntegrityCheck, IntegrityReport } from "@/types";
import { getLogger } from "@/lib/logs/Logger";

let instance: SystemIntegrity | null = null;

export class SystemIntegrity {
  private lastReport: IntegrityReport | null = null;

  // ==================== Singleton ====================

  static getInstance(): SystemIntegrity {
    if (!instance) instance = new SystemIntegrity();
    return instance;
  }

  // ==================== Check ====================

  /**
   * 运行完整完整性检查
   */
  async runChecks(): Promise<IntegrityReport> {
    const checks: IntegrityCheck[] = [];
    const recommendations: string[] = [];

    // 1. localStorage 可用性
    checks.push(this.checkLocalStorage());

    // 2. IndexedDB 可用性
    checks.push(await this.checkIndexedDB());

    // 3. Audio Context 可用性
    checks.push(this.checkAudioContext());

    // 4. Service Worker
    checks.push(await this.checkServiceWorker());

    // 5. Runtime Config 有效性
    checks.push(this.checkRuntimeConfig());

    // 6. Provider 配置
    checks.push(this.checkProviderConfig());

    // 7. 存储配额
    checks.push(await this.checkStorageQuota());

    const overallPass = checks.every((c) => c.pass);

    // 生成建议
    for (const check of checks) {
      if (!check.pass) {
        recommendations.push(`${check.name}: ${check.details}`);
      }
    }

    if (!overallPass) {
      recommendations.push("建议运行 /diagnostics 查看完整诊断");
    }

    const report: IntegrityReport = {
      checks,
      overallPass,
      timestamp: Date.now(),
      recommendations,
    };

    this.lastReport = report;

    getLogger().info(
      "system",
      `Integrity check: ${overallPass ? "PASS" : "FAIL"} (${checks.filter((c) => c.pass).length}/${checks.length})`,
    );

    return report;
  }

  getLastReport(): IntegrityReport | null {
    return this.lastReport;
  }

  // ==================== Private Checks ====================

  private checkLocalStorage(): IntegrityCheck {
    try {
      const testKey = "__music_integrity_test__";
      localStorage.setItem(testKey, "1");
      const val = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return {
        name: "localStorage",
        pass: val === "1",
        details: val === "1" ? "可用" : "写入/读取不一致",
        timestamp: Date.now(),
      };
    } catch {
      return { name: "localStorage", pass: false, details: "不可用 (隐私模式/存储满)", timestamp: Date.now() };
    }
  }

  private async checkIndexedDB(): Promise<IntegrityCheck> {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("__music_integrity_test__", 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore("test");
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      db.close();
      indexedDB.deleteDatabase("__music_integrity_test__");
      return { name: "IndexedDB", pass: true, details: "可用", timestamp: Date.now() };
    } catch (err) {
      return {
        name: "IndexedDB",
        pass: false,
        details: `不可用: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };
    }
  }

  private checkAudioContext(): IntegrityCheck {
    try {
      const AudioContextClass =
        window.AudioContext ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return { name: "AudioContext", pass: false, details: "浏览器不支持", timestamp: Date.now() };
      }
      const ctx = new AudioContextClass();
      ctx.close();
      return { name: "AudioContext", pass: true, details: "可用", timestamp: Date.now() };
    } catch (err) {
      return {
        name: "AudioContext",
        pass: true,
        details: `需用户手势: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      };
    }
  }

  private async checkServiceWorker(): Promise<IntegrityCheck> {
    if (!("serviceWorker" in navigator)) {
      return { name: "ServiceWorker", pass: true, details: "浏览器不支持 (PWA不可用)", timestamp: Date.now() };
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      return {
        name: "ServiceWorker",
        pass: !!reg,
        details: reg ? "已注册" : "未注册 (开发模式正常)",
        timestamp: Date.now(),
      };
    } catch {
      return { name: "ServiceWorker", pass: true, details: "检查失败 (非关键)", timestamp: Date.now() };
    }
  }

  private checkRuntimeConfig(): IntegrityCheck {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // Lazy import to avoid circular dependency
      const configStr = localStorage.getItem("music_runtime_config");
      if (!configStr) {
        return { name: "RuntimeConfig", pass: true, details: "使用默认配置", timestamp: Date.now() };
      }
      JSON.parse(configStr);
      return { name: "RuntimeConfig", pass: true, details: "配置有效", timestamp: Date.now() };
    } catch {
      return { name: "RuntimeConfig", pass: false, details: "配置JSON解析失败", timestamp: Date.now() };
    }
  }

  private checkProviderConfig(): IntegrityCheck {
    try {
      const configStr = localStorage.getItem("music_runtime_config");
      if (!configStr) {
        return { name: "ProviderConfig", pass: true, details: "使用默认Provider配置", timestamp: Date.now() };
      }
      const config = JSON.parse(configStr) as Record<string, unknown>;
      const providers = config.providers as Array<{ type: string; enabled: boolean }> | undefined;
      if (!providers || !Array.isArray(providers)) {
        return { name: "ProviderConfig", pass: true, details: "无自定义Provider", timestamp: Date.now() };
      }
      const enabled = providers.filter((p) => p.enabled).length;
      return {
        name: "ProviderConfig",
        pass: enabled > 0,
        details: enabled > 0 ? `${enabled} 个Provider可用` : "无可用Provider",
        timestamp: Date.now(),
      };
    } catch {
      return { name: "ProviderConfig", pass: false, details: "Provider配置异常", timestamp: Date.now() };
    }
  }

  private async checkStorageQuota(): Promise<IntegrityCheck> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage ?? 0;
        const quota = estimate.quota ?? 0;
        const usedMB = (used / 1024 / 1024).toFixed(1);
        const quotaMB = (quota / 1024 / 1024).toFixed(1);
        const usedPercent = quota > 0 ? ((used / quota) * 100).toFixed(1) : "0";
        const pass = quota > 0 ? used / quota < 0.8 : true;
        return {
          name: "存储配额",
          pass,
          details: `${usedMB}MB / ${quotaMB}MB (${usedPercent}%)`,
          timestamp: Date.now(),
        };
      } catch {
        // fallback
      }
    }
    return { name: "存储配额", pass: true, details: "无法检测 (非关键)", timestamp: Date.now() };
  }
}

export function getSystemIntegrity(): SystemIntegrity {
  return SystemIntegrity.getInstance();
}
