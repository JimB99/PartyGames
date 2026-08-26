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
}: {
  children: React.ReactNode;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent";
  className?: string;
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
      disabled={disabled}
      className={`rounded-xl px-6 py-4 text-lg font-bold text-white transition active:scale-95 disabled:opacity-40 touch-none select-none ${styles} ${className}`}
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
}: {
  onAction: (action: GameAction) => void;
  jumpCooldown: number;
  canFire: boolean;
  heldPowerUp: string | null;
}) {
  const stopTurn = () => onAction({ kind: "curve_turn", direction: "none" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <ControlBtn
          className="py-12 text-2xl"
          onPointerDown={() => onAction({ kind: "curve_turn", direction: "left" })}
          onPointerUp={stopTurn}
          onPointerLeave={stopTurn}
        >
          ◀
        </ControlBtn>
        <ControlBtn
          className="py-12 text-2xl"
          onPointerDown={() => onAction({ kind: "curve_turn", direction: "right" })}
          onPointerUp={stopTurn}
          onPointerLeave={stopTurn}
        >
          ▶
        </ControlBtn>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ControlBtn
          variant="accent"
          disabled={jumpCooldown > 0}
          onPointerDown={() => onAction({ kind: "curve_jump" })}
        >
          {jumpCooldown > 0 ? `Jump (${Math.ceil(jumpCooldown / 25)}s)` : "Jump"}
        </ControlBtn>
        {canFire ? (
          <ControlBtn variant="danger" onPointerDown={() => onAction({ kind: "curve_fire" })}>
            Fire {heldPowerUp ? powerUpInfo(heldPowerUp as import("@party-games/shared").PowerUpKind).icon : "🚀"}
          </ControlBtn>
        ) : (
          <ControlBtn variant="secondary" disabled>
            Fire
          </ControlBtn>
        )}
      </div>
      {heldPowerUp && !canFire && (
        <p className="text-center text-sm text-yellow-400">
          Active: {powerUpInfo(heldPowerUp as import("@party-games/shared").PowerUpKind).name}
        </p>
      )}
    </div>
  );
}
