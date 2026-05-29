"use client";

import React from "react";
import { IconCloudOff, IconCloudDownload } from "@tabler/icons-react";

interface ProviderErrorBoundaryProps {
  children: React.ReactNode;
  onFallback?: () => void;
}

interface ProviderErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
export class ProviderErrorBoundary extends React.Component<
  ProviderErrorBoundaryProps,
  ProviderErrorBoundaryState
> {
  constructor(props: ProviderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ProviderErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    console.error("[ProviderError] Provider failure:", error.message);
  }

  handleFallback = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onFallback?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[30vh] flex-col items-center justify-center px-6 text-center">
          <div className="glass mb-4 rounded-full p-4">
            <IconCloudOff className="h-10 w-10 text-accent-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">音源连接失败</h3>
          <p className="mb-4 max-w-xs text-sm text-text-secondary">
            当前音源暂时不可用，已自动切换至备用音源
          </p>
          <button
            onClick={this.handleFallback}
            className="glass inline-flex items-center gap-2 rounded-apple-lg px-5 py-2.5 text-sm font-medium text-accent-secondary transition-all active:scale-95"
          >
            <IconCloudDownload className="h-4 w-4" />
            重试连接
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
