/**
 * Phase 17 — Enhanced Error Boundary System
 *
 * 在 Phase 8 ErrorBoundary 基础上增强:
 * - Audio Error Fallback (音频加载失败专用)
 * - Graceful UI Degradation (连续错误后降级 UI)
 * - Error logging + telemetry
 * - Per-component error boundary HOC
 */

"use client";

import React, { useEffect } from "react";
import { IconExclamationCircle, IconHeadphones, IconRefresh } from "@tabler/icons-react";
import { getTelemetry } from "@/system/telemetry/TelemetryService";
import type { ErrorBoundaryConfig, ErrorLogEntry } from "@/types";

// ==================== Error History ====================

const MAX_ERROR_LOG = 100;
const errorLog: ErrorLogEntry[] = [];

export function getErrorLog(): ReadonlyArray<ErrorLogEntry> {
  return errorLog;
}

function pushError(error: string, componentStack: string): void {
  const entry: ErrorLogEntry = {
    error,
    componentStack: componentStack.slice(0, 500),
    timestamp: Date.now(),
    retryCount: 0,
    degraded: false,
  };
  errorLog.push(entry);
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.splice(0, errorLog.length - MAX_ERROR_LOG);
  }
  getTelemetry().recordError("react", error);
}

// ==================== Global Error Boundary ====================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  degraded: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private config: ErrorBoundaryConfig = {
    maxRetries: 3,
    autoRecoverDelayMs: 5000,
    degradeAfterErrors: 5,
    componentName: "GlobalErrorBoundary",
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0, degraded: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error.message, errorInfo.componentStack?.slice(0, 200));

    this.setState((prev) => {
      const newCount = prev.errorCount + 1;
      const degraded = newCount >= this.config.degradeAfterErrors;
      return { errorCount: newCount, degraded };
    });

    pushError(error.message, errorInfo.componentStack ?? "");
    this.props.onError?.(error, errorInfo);

    if (this.state.errorCount < this.config.maxRetries) {
      this.resetTimer = setTimeout(() => this.handleReset(), this.config.autoRecoverDelayMs);
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Graceful degradation: 连续错误过多时显示更简化的 UI
      if (this.state.degraded) {
        return (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 rounded-full bg-surface/50 p-4">
              <IconHeadphones className="h-8 w-8 text-text-tertiary" />
            </div>
            <p className="mb-4 text-sm text-text-secondary">播放出现异常，建议刷新页面恢复</p>
            <button
              onClick={() => window.location.reload()}
              className="glass inline-flex items-center gap-2 rounded-apple-lg px-5 py-2.5 text-sm font-medium text-text-primary active:scale-95"
            >
              <IconRefresh className="h-4 w-4" />
              刷新页面
            </button>
            {this.state.errorCount > 3 && (
              <p className="mt-3 text-xs text-text-tertiary">
                已连续错误 {this.state.errorCount} 次
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <div className="glass mb-6 rounded-full p-6">
            <IconExclamationCircle className="h-12 w-12 text-accent-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-text-primary">播放出错了</h2>
          <p className="mb-6 max-w-xs text-sm text-text-secondary">
            {this.state.error?.message || "发生了意外错误，请重试"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="glass inline-flex items-center gap-2 rounded-apple-lg px-6 py-3 text-sm font-medium text-text-primary transition-all active:scale-95"
            >
              <IconRefresh className="h-5 w-5" />
              重试
            </button>
          </div>
          {this.state.errorCount > 1 && (
            <p className="mt-4 text-xs text-text-tertiary">
              已连续错误 {this.state.errorCount} 次，建议刷新页面
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ==================== Audio Error Fallback ====================

interface AudioErrorFallbackProps {
  songName?: string;
  artistName?: string;
  onRetry?: () => void;
  onSkip?: () => void;
}

export function AudioErrorFallback({ songName, artistName, onRetry, onSkip }: AudioErrorFallbackProps) {
  useEffect(() => {
    pushError("Audio load failed", songName ?? "unknown");
  }, [songName]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-8">
      <div className="glass rounded-full p-4">
        <IconHeadphones className="h-8 w-8 text-text-tertiary" />
      </div>
      <p className="text-sm text-text-secondary">无法播放此歌曲</p>
      {songName && (
        <p className="text-xs text-text-tertiary">
          {songName}{artistName ? ` — ${artistName}` : ""}
        </p>
      )}
      <div className="flex gap-3 mt-2">
        {onSkip && (
          <button
            onClick={onSkip}
            className="glass rounded-apple-lg px-4 py-2 text-xs font-medium text-text-primary active:scale-95"
          >
            跳过
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="glass rounded-apple-lg bg-accent-primary/10 px-4 py-2 text-xs font-medium text-accent-primary active:scale-95"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== Degraded UI Indicator ====================

interface DegradedIndicatorProps {
  message: string;
  onDismiss?: () => void;
}

export function DegradedIndicator({ message, onDismiss }: DegradedIndicatorProps) {
  return (
    <div className="glass mx-4 mb-2 flex items-center justify-between rounded-apple-lg px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2 text-text-secondary">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-text-tertiary ml-2 shrink-0 active:scale-90">
          关闭
        </button>
      )}
    </div>
  );
}

// ==================== HOC: withErrorBoundary ====================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  config?: Partial<ErrorBoundaryConfig>,
) {
  const displayName = Component.displayName ?? Component.name ?? "Component";

  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary
        onError={(error) => {
          pushError(error.message, displayName);
        }}
        fallback={
          config?.degradeAfterErrors !== undefined ? undefined : (
            <AudioErrorFallback
              songName={displayName}
              onRetry={() => window.location.reload()}
            />
          )
        }
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}
