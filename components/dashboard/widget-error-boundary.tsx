"use client";

import { ErrorBoundary } from "@/components/ui/error-boundary";

export function WidgetErrorBoundary({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}): React.ReactElement {
  return (
    <ErrorBoundary fallbackTitle={`Lỗi widget: ${name}`}>
      {children}
    </ErrorBoundary>
  );
}
