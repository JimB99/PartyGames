import { expect, type Page } from "@playwright/test";

export async function assertHostStageVisible(page: Page): Promise<void> {
  await expect(page.getByTestId("host-stage")).toBeVisible();
}

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

export async function assertInViewport(page: Page, testId: string, slackPx = 80): Promise<void> {
  const el = page.getByTestId(testId);
  await expect(el).toBeVisible();
  const box = await el.boundingBox();
  const vp = page.viewportSize();
  expect(box).not.toBeNull();
  expect(vp).not.toBeNull();
  if (!box || !vp) return;
  expect(box.y).toBeGreaterThanOrEqual(-slackPx);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + slackPx);
}
