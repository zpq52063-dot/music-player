"use client";

import React from "react";
import { IconExclamationCircle, IconRefresh } from "@tabler/icons-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error.message, errorInfo.componentStack);
    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));
    this.props.onError?.(error, errorInfo);

    // Auto-recover after 5 seconds for transient errors
    if (this.state.errorCount < 3) {
      this.resetTimer = setTimeout(() => {
        this.handleReset();
      }, 5000);
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
      if (this.props.fallback) {
        return this.props.fallback;
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
