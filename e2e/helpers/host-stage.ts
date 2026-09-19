import { expect, type Page } from "@playwright/test";

export async function assertHeroCentered(page: Page, maxYOffsetPx = 100): Promise<void> {
  const hero = page.getByTestId("host-stage");
  await expect(hero).toBeVisible();
  const box = await hero.boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  expect(vp).not.toBeNull();
  if (!box || !vp) return;
  const heroCenterY = box.y + box.height / 2;
  const vpCenterY = vp.height / 2;
  expect(Math.abs(heroCenterY - vpCenterY)).toBeLessThan(maxYOffsetPx);
}

export async function assertHostStageVisible(page: Page): Promise<void> {
  await expect(page.getByTestId("host-stage")).toBeVisible({ timeout: 30_000 });
}
