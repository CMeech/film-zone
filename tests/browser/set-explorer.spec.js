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
