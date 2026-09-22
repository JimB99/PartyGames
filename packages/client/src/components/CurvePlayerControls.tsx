import type { GameAction, TurnDirection } from "@party-games/shared";
import { powerUpInfo } from "@party-games/shared";
import { useState } from "react";

function ControlBtn({
  children,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  disabled,
  variant = "primary",
  className = "",
  testId,
  active = false,
}: {
  children: React.ReactNode;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "accent";
  className?: string;
  testId?: string;
  active?: boolean;
}) {
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 active:bg-violet-700"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-500 active:bg-red-700"
        : variant === "accent"
          ? "bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700"
          : "bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800";
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      className={`font-bold text-white transition active:scale-[0.98] disabled:opacity-40 touch-none select-none ${styles} ${active ? "ring-4 ring-white/70 scale-[0.98]" : ""} ${className}`}
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
  powerUpMode = "normal",
}: {
  onAction: (action: GameAction) => void;
  jumpCooldown: number;
  canFire: boolean;
  heldPowerUp: string | null;
  extraJumps?: number;
  powerUpMode?: import("@party-games/shared").PowerUpMode;
}) {
  const [localTurn, setLocalTurn] = useState<TurnDirection>("none");
  const turn = (direction: TurnDirection) => {
    setLocalTurn(direction);
    onAction({ kind: "trail_dash_turn", direction });
  };
  const stopTurn = () => turn("none");
  const kangarooHeld = heldPowerUp === "double_jump";
  const jumpLocked = jumpCooldown > 0;
  const showPowerUps = powerUpMode !== "off";

  const jumpLabel = jumpLocked
    ? kangarooHeld
      ? `Kangaroo (${Math.ceil(jumpCooldown / 25)}s)`
      : `Jump (${Math.ceil(jumpCooldown / 25)}s)`
    : kangarooHeld
      ? "Kangaroo"
      : "Jump";

  const fireLabel = heldPowerUp && canFire
    ? `Fire ${powerUpInfo(heldPowerUp as import("@party-games/shared").PowerUpKind).icon}`
    : "Fire";

  return (
    <div
      className="fixed inset-0 z-30 grid h-dvh w-dvw grid-cols-2 grid-rows-[1fr_1fr]"
      data-testid="curve-player-controls"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {showPowerUps ? (
        <ControlBtn
          variant="accent"
          className="h-full min-h-0 w-full rounded-none text-3xl"
          testId="trail-dash-jump"
          disabled={jumpLocked}
          onPointerDown={() => onAction({ kind: "trail_dash_jump" })}
        >
          {jumpLabel}
        </ControlBtn>
      ) : (
        <ControlBtn className="h-full min-h-0 w-full rounded-none" disabled variant="secondary">
          —
        </ControlBtn>
      )}
      {showPowerUps ? (
        canFire ? (
          <ControlBtn
            variant="danger"
            className="h-full min-h-0 w-full rounded-none text-3xl"
            testId="trail-dash-fire"
            onPointerDown={() => onAction({ kind: "trail_dash_fire" })}
          >
            {fireLabel}
          </ControlBtn>
        ) : (
          <ControlBtn
            className="h-full min-h-0 w-full rounded-none text-3xl"
            testId="trail-dash-fire"
            variant="secondary"
            disabled
          >
            Fire
          </ControlBtn>
        )
      ) : (
        <ControlBtn className="h-full min-h-0 w-full rounded-none" disabled variant="secondary">
          —
        </ControlBtn>
      )}
      <ControlBtn
        className="h-full min-h-0 w-full rounded-none text-4xl"
        testId="trail-dash-turn-left"
        active={localTurn === "left"}
        onPointerDown={() => turn("left")}
        onPointerUp={stopTurn}
        onPointerLeave={stopTurn}
      >
        ◀
      </ControlBtn>
      <ControlBtn
        className="h-full min-h-0 w-full rounded-none text-4xl"
        testId="trail-dash-turn-right"
        active={localTurn === "right"}
        onPointerDown={() => turn("right")}
        onPointerUp={stopTurn}
        onPointerLeave={stopTurn}
      >
        ▶
      </ControlBtn>
    </div>
  );
}
