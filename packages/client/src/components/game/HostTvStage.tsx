import type { ReactNode } from "react";

export function HostTvStage({
  children,
  testId = "host-stage",
  className,
}: {
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`flex min-h-[calc(100dvh-12rem)] w-full flex-1 flex-col items-center justify-center px-4 py-6 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
