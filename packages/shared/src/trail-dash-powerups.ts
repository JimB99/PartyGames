import type { PowerUpKind } from "./curve-logic.js";
import type { PowerUpMode } from "./trail-dash-options.js";

export interface TrailDashPowerUpInfo {
  kind: PowerUpKind;
  icon: string;
  name: string;
  description: string;
  color: string;
}

export const TRAIL_DASH_POWERUPS: TrailDashPowerUpInfo[] = [
  {
    kind: "speed",
    icon: "⚡",
    name: "Speed",
    description: "Move faster for a short time",
    color: "#FF6B6B",
  },
  {
    kind: "gap",
    icon: "✨",
    name: "Ghost",
    description: "Leave no trail briefly — pass through lines",
    color: "#4ECDC4",
  },
  {
    kind: "double_jump",
    icon: "🦘",
    name: "Double Jump",
    description: "Gain an extra jump (use while airborne)",
    color: "#AA96DA",
  },
  {
    kind: "missile",
    icon: "🚀",
    name: "Missile",
    description: "Fire straight ahead — tap Fire to shoot",
    color: "#FFE66D",
  },
  {
    kind: "grenade",
    icon: "💣",
    name: "Grenade",
    description: "Lob an explosive — clears trails in a blast",
    color: "#F38181",
  },
  {
    kind: "burst",
    icon: "💥",
    name: "Burst",
    description: "3 volleys of 6 shots in all directions",
    color: "#FF9F43",
  },
];

export function powerUpInfo(kind: PowerUpKind): TrailDashPowerUpInfo {
  return TRAIL_DASH_POWERUPS.find((p) => p.kind === kind) ?? TRAIL_DASH_POWERUPS[0];
}

export function activePowerUpsForMode(mode: PowerUpMode): TrailDashPowerUpInfo[] {
  if (mode === "off") return [];
  return TRAIL_DASH_POWERUPS;
}

export function isFireablePowerUp(kind: PowerUpKind | null): boolean {
  return kind === "missile" || kind === "grenade" || kind === "burst";
}
