import type { GameAction } from "@party-games/shared";
import { powerUpInfo } from "@party-games/shared";

function ControlBtn({
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  disabled,
  variant = "primary",
  className = "",
  testId,
}: {
  children: React.ReactNode;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent";
  className?: string;
  testId?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-500"
        : variant === "accent"
          ? "bg-yellow-600 hover:bg-yellow-500"
          : "bg-zinc-700 hover:bg-zinc-600";
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      className={`rounded-2xl px-4 py-5 text-lg font-bold text-white transition active:scale-95 disabled:opacity-40 touch-none select-none min-h-[3.25rem] landscape:min-h-[4.5rem] ${styles} ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown?.();
      }}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

export function CurvePlayerControls({
  onAction,
  jumpCooldown,
  canFire,
  heldPowerUp,
  extraJumps = 0,
}: {
  onAction: (action: GameAction) => void;
  jumpCooldown: number;
  canFire: boolean;
  heldPowerUp: string | null;
  extraJumps?: number;
}) {
  const stopTurn = () => onAction({ kind: "trail_dash_turn", direction: "none" });
  const jumpLocked = jumpCooldown > 0 && extraJumps <= 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] landscape:max-w-none landscape:px-4 landscape:pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-testid="curve-player-controls">
      <div className="grid grid-cols-2 gap-3 landscape:gap-2">
        <ControlBtn
          variant="accent"
          disabled={jumpLocked}
          onPointerDown={() => onAction({ kind: "trail_dash_jump" })}
        >
          {jumpLocked
            ? `Jump (${Math.ceil(jumpCooldown / 25)}s)`
            : extraJumps > 0
              ? `Jump (+${extraJumps})`
              : "Jump"}
        </ControlBtn>
        {canFire ? (
          <ControlBtn variant="danger" onPointerDown={() => onAction({ kind: "trail_dash_fire" })}>
            Fire {heldPowerUp ? powerUpInfo(heldPowerUp as import("@party-games/shared").PowerUpKind).icon : "🚀"}
          </ControlBtn>
        ) : (
          <ControlBtn variant="secondary" disabled>
            Fire
          </ControlBtn>
        )}
        <ControlBtn
          className="landscape:min-h-[32vh] landscape:text-3xl landscape:py-0"
          testId="trail-dash-turn-left"
          onPointerDown={() => onAction({ kind: "trail_dash_turn", direction: "left" })}
          onPointerUp={stopTurn}
          onPointerLeave={stopTurn}
        >
          ◀
        </ControlBtn>
        <ControlBtn
          className="landscape:min-h-[32vh] landscape:text-3xl landscape:py-0"
          testId="trail-dash-turn-right"
          onPointerDown={() => onAction({ kind: "trail_dash_turn", direction: "right" })}
          onPointerUp={stopTurn}
          onPointerLeave={stopTurn}
        >
          ▶
        </ControlBtn>
      </div>
      {heldPowerUp && !canFire && (
        <p className="mt-2 text-center text-sm text-yellow-400 landscape:mt-1">
          Active: {powerUpInfo(heldPowerUp as import("@party-games/shared").PowerUpKind).name}
        </p>
      )}
    </div>
  );
}
