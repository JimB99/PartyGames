import type { Page } from "@playwright/test";

/** Close the nickname/color profile editor if it was opened accidentally. */
export async function dismissProfileModal(page: Page): Promise<void> {
  const cancel = page.getByRole("button", { name: /^cancel$/i });
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
  }
}

/** Player game controls live inside the phase root — avoids profile bar / lobby buttons. */
export function playerScope(page: Page) {
  return page.getByTestId("player-phase");
}
