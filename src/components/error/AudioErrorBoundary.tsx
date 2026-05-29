"use client";

import React from "react";
import { IconMusic, IconPlayerPlay } from "@tabler/icons-react";

interface AudioErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface AudioErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AudioErrorBoundary extends React.Component<AudioErrorBoundaryProps, AudioErrorBoundaryState> {
  constructor(props: AudioErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AudioErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo): void {
    console.error("[AudioError] Audio playback error:", error.message);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[30vh] flex-col items-center justify-center px-6 text-center">
          <div className="glass mb-4 rounded-full p-4">
            <IconMusic className="h-10 w-10 text-accent-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">音频加载失败</h3>
          <p className="mb-4 max-w-xs text-sm text-text-secondary">
            {this.state.error?.message || "无法播放此歌曲，请尝试其他音源"}
          </p>
          <button
            onClick={this.handleRetry}
            className="glass inline-flex items-center gap-2 rounded-apple-lg px-5 py-2.5 text-sm font-medium text-accent-primary transition-all active:scale-95"
          >
            <IconPlayerPlay className="h-4 w-4" />
            重新加载
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
