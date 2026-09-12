import { test, expect } from '@playwright/test';
import { loginAsPlayer } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await loginAsPlayer(page);
});

test('set explorer controls, playback, and shared state', async ({ page }) => {
  await page.goto('/set-explorer/?p=3&h=2&f=70&sx=5.5&sz=0.61&sh=1.778&v=left');

  await expect(page.locator('#set-explorer-scene canvas')).toBeVisible();
  await expect(page.locator('#set-explorer-label')).toHaveText('Set 32');
  await expect(page).toHaveURL(/\?p=3/);

  const controlsToggle = page.locator('#set-explorer-controls-toggle');
  if (await controlsToggle.isVisible()) await controlsToggle.click();

  await page.locator('[data-height="3"]').click();
  await expect(page.locator('#set-explorer-label')).toHaveText('Set 33');
  await expect(page).not.toHaveURL(/\?/);

  await page.locator('#set-explorer-play').click();
  await expect(page.locator('#set-explorer-status')).toHaveText('Playing');
  await page.locator('#set-explorer-play').click();
  await expect(page.locator('#set-explorer-status')).toHaveText('Paused');

  await page.locator('[data-position="6"]').click();
  await expect(page.locator('#set-explorer-label')).toHaveText('Set 63');
  await expect(page.locator('#set-explorer-status')).toHaveText('Ready');

  await page.locator('#set-explorer-setter-height').fill('76');
  await expect(page.locator('#set-explorer-setter-height-value')).toHaveText('6′4″');
});

test('position 6 follows the setter during a pointer drag', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop verifies mouse dragging; touch coverage is separate.');

  await page.goto('/set-explorer/');
  await page.locator('[data-position="6"]').click();

  const app = page.locator('#set-explorer-app');
  const scene = page.locator('#set-explorer-scene');
  const canvas = scene.locator('canvas');
  const initialSetterX = Number(await app.getAttribute('data-setter-x'));
  const box = await canvas.boundingBox();
  const handleX = Number(await scene.getAttribute('data-setter-handle-x'));
  const handleY = Number(await scene.getAttribute('data-setter-handle-y'));

  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width * handleX, box.y + box.height * handleY);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * (handleX - 0.12), box.y + box.height * (handleY + 0.04), { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => Number(await app.getAttribute('data-setter-x'))).not.toBe(initialSetterX);
  const setterX = Number(await app.getAttribute('data-setter-x'));
  const targetX = Number(await app.getAttribute('data-target-x'));
  await expect(app).toHaveAttribute('data-target-mode', 'position6');
  expect(targetX - setterX).toBeCloseTo(0.762, 2);
});
