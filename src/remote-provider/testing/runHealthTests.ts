// ==================== Phase 16B: Health Test Runner ====================
//
// Runs all health tests and returns a structured report.
// Can be called from browser console or diagnostic pages.
//
// Usage:
//   import { runAllHealthTests } from "@/remote-provider/testing";
//   const report = await runAllHealthTests();
//   console.table(report.results);

import { getEdgeProviderManager } from "../core/EdgeProviderManager";
import { RemoteHealthTester, type TestReport } from "./HealthTester";

/** Run all remote provider health tests and return a report */
export async function runAllHealthTests(): Promise<TestReport> {
  const manager = getEdgeProviderManager();
  const tester = new RemoteHealthTester(manager);
  return tester.runAll();
}

/** Format a test report as a console-friendly string */
export function formatTestReport(report: TestReport): string {
  const lines: string[] = [
    `=== Remote Provider Health Test Report ===`,
    `Time: ${new Date(report.timestamp).toISOString()}`,
    `Results: ${report.passed}/${report.totalTests} passed, ${report.failed} failed`,
    ``,
  ];

  for (const r of report.results) {
    const icon = r.passed ? "PASS" : "FAIL";
    const duration = `${r.duration}ms`;
    lines.push(`  [${icon}] ${r.name} (${duration})`);
    if (r.details) {
      lines.push(`         ${r.details}`);
    }
    if (r.error) {
      lines.push(`         Error: ${r.error}`);
    }
  }

  return lines.join("\n");
}

// Expose to browser console for debugging
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__runRemoteHealthTests = runAllHealthTests;
}
