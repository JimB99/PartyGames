export function GameButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const base = "rounded-xl px-6 py-4 text-lg font-bold transition active:scale-95";
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 text-white"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-zinc-700 hover:bg-zinc-600 text-white";
  return (
    <button
      type="button"
      data-testid={testId}
      className={`${base} ${styles} ${className} disabled:opacity-40`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
