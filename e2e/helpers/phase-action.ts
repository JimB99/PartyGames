import type { Page } from "@playwright/test";
import type { GameId } from "../../packages/shared/src/constants.ts";
import { GAME_INTERACTIONS } from "./game-interactions.ts";
import { dismissProfileModal, playerScope } from "./player-ui.ts";
import { clickInteraction } from "./room.js";

const LOCKED_PATTERN =
  /Submitted!|Guess locked in!|Locked in!|Bid locked in|Vote locked|Assignments submitted!|Clue submitted!/i;

export async function readPlayerPhase(page: Page): Promise<string | null> {
  const el = page.getByTestId("player-phase");
  if (await el.count().catch(() => 0)) {
    return el.getAttribute("data-phase").catch(() => null);
  }
  return null;
}

async function isResponseLocked(page: Page): Promise<boolean> {
  return page.getByText(LOCKED_PATTERN).isVisible().catch(() => false);
}

const BLUFF_VOTE_GAMES = new Set<GameId>([
  "fact-check",
  "wit-showdown",
  "reverse-fact",
  "caption-this",
  "bracket-battle",
]);

async function clickFirstBluffVote(page: Page): Promise<boolean> {
  const scope = playerScope(page);
  const options = scope.locator("button").filter({
    hasNotText: /^(join|skip|pause|end game|save|cancel|edit)$/i,
  });
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const btn = options.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    const text = (await btn.innerText().catch(() => "")).trim();
    if (text.length < 2) continue;
    try {
      await btn.click({ timeout: 3_000 });
      return true;
    } catch {
      // Phase may have advanced while clicking.
    }
  }
  return false;
}

/** Act on whichever player control is visible for the current phase. */
export async function actForVisibleControls(
  page: Page,
  gameId: GameId,
  playerAction: (page: Page, strict?: boolean) => Promise<void>,
  strict = true,
): Promise<boolean> {
  await dismissProfileModal(page);
  const phase = await readPlayerPhase(page);
  if (
    phase === "reveal" ||
    phase === "scoreboard" ||
    phase === "instructions" ||
    phase === "ended" ||
    phase === "questioning" ||
    (phase === "guessing" && await page.getByText(/you're the drawer/i).isVisible().catch(() => false))
  ) {
    return true;
  }

  if (await isResponseLocked(page)) return true;

  if (
    await page.getByText(
      /waiting for opponent|waiting for other players|not your turn|talk it out|read the answers on the tv|discuss and ask|voting unlocks when|you fell off the dike|watch the tv for the results/i,
    ).isVisible().catch(() => false)
  ) {
    return true;
  }

  if (phase === "bid") {
    const bidSubmit = page.getByTestId("dike-bid-submit");
    if (await bidSubmit.isVisible().catch(() => false)) {
      const scope = playerScope(page);
      const balanceText = await scope.getByText(/Balance:\s*\d+/).innerText().catch(() => "Balance: 200");
      const balance = Number.parseInt(balanceText.replace(/\D/g, ""), 10) || 200;
      const nick = await page
        .getByTitle("Edit profile")
        .locator("span.font-bold")
        .innerText()
        .catch(() => "P1");
      const playerIndex = Number.parseInt(nick.match(/P(\d+)/i)?.[1] ?? "1", 10);
      const bidAmount = Math.min(balance, 15 + (playerIndex - 1) * 10);
      const input = scope.locator('input[type="number"]');
      if (await input.isVisible().catch(() => false)) {
        await input.fill(String(bidAmount));
      }
      await bidSubmit.click({ timeout: 5_000 });
      return true;
    }
    return true;
  }

  if (phase === "question") {
    const wyrA = page.getByTestId("wyr-choice-a");
    if (await wyrA.isVisible().catch(() => false)) {
      await wyrA.click({ timeout: 5_000 });
      return true;
    }
    return true;
  }

  const input = page.getByTestId("player-text-input");
  if (await input.isVisible().catch(() => false)) {
    await input.fill(`Test answer ${Date.now() % 10_000}`);
    await page.getByTestId("player-submit").click();
    return true;
  }

  const answer = page.getByTestId("player-answer-0");
  if (await answer.isVisible().catch(() => false)) {
    await answer.click({ timeout: 5_000 });
    return true;
  }

  for (let col = 0; col < 7; col++) {
    const column = page.getByTestId(`four-in-a-row-col-${col}`);
    if (await column.isVisible().catch(() => false) && await column.isEnabled().catch(() => false)) {
      await column.click({ timeout: 5_000 });
      return true;
    }
  }

  const fleetReady = page.getByTestId("fleet-duel-ready");
  if (await fleetReady.isVisible().catch(() => false) && await fleetReady.isEnabled().catch(() => false)) {
    await page.getByTestId("fleet-duel-random").click().catch(() => {});
    await fleetReady.click();
    return true;
  }

  if (phase === "battle" || phase === "fire") {
    const fleetGrids = page.getByTestId("fleet-duel-grid");
    if (await fleetGrids.count() >= 2) {
      const enemyCell = fleetGrids.nth(1).locator("button:not([disabled])").first();
      if (await enemyCell.isVisible().catch(() => false)) {
        await enemyCell.click({ timeout: 5_000 });
        return true;
      }
    }
    return true;
  }

  const canvas = page.getByTestId("draw-canvas");
  if (await canvas.isVisible().catch(() => false)) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 80);
      await page.mouse.up();
    }
    const done = page.getByRole("button", { name: /done drawing/i });
    if (await done.isVisible().catch(() => false)) await done.click();
    return true;
  }

  if (gameId === "agent-grid") {
    if (await page.getByText(/waiting for your spymaster|is giving a clue/i).isVisible().catch(() => false)) {
      return true;
    }
    if (phase === "clue") {
      const clueBtn = page.getByRole("button", { name: /give clue/i });
      if (await clueBtn.isVisible().catch(() => false)) {
        await page.getByPlaceholder(/clue word/i).fill("test");
        await clueBtn.click({ timeout: 5_000 });
        return true;
      }
      return true;
    }
    if (phase === "guess") {
      const tiles = page.locator('[data-testid^="agent-grid-tile-"]');
      const tileCount = await tiles.count();
      for (let i = 0; i < tileCount; i++) {
        const tile = tiles.nth(i);
        if (!(await tile.isVisible().catch(() => false))) continue;
        await tile.click({ timeout: 3_000 }).catch(() => {});
      }
      const endTurn = page.getByRole("button", { name: /end turn/i });
      if (await endTurn.isVisible().catch(() => false)) {
        await endTurn.click({ timeout: 5_000 });
      }
      return true;
    }
  }

  for (const testId of GAME_INTERACTIONS[gameId].player) {
    if (await clickInteraction(page, testId)) return true;
  }

  if (phase === "accusation") {
    const hasAccuse = (await page.locator('[data-testid^="impostor-accuse-"]:not([disabled])').count()) > 0;
    const hasGuess = (await page.locator('[data-testid^="impostor-guess-"]:not([disabled])').count()) > 0;
    if (!hasAccuse && !hasGuess) return true;
  }

  if (BLUFF_VOTE_GAMES.has(gameId) && await clickFirstBluffVote(page)) return true;

  await playerAction(page, false);

  if (await isResponseLocked(page)) return true;

  return false;
}
