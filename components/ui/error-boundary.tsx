"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
            {this.props.fallbackTitle ?? "Đã xảy ra lỗi"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
            {this.state.error?.message || "Vui lòng thử lại."}
          </p>
          <Button
            variant="secondary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
