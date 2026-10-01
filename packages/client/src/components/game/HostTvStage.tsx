import type { ReactNode } from "react";

export function HostTvStage({
  children,
  testId = "host-stage",
  className,
  compact = false,
}: {
  children: ReactNode;
  testId?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      data-testid={testId}
      className={`flex w-full flex-1 flex-col items-center justify-center px-4 ${
        compact ? "min-h-0 py-2" : "min-h-[calc(100dvh-12rem)] py-6"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
