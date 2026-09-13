import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers.js';

const videoUrl = 'https://www.youtube.com/embed/EWdlDxxnZoY?si=EZXv1-RQhpJ6Bcqy';

test('game video URL saves and embeds without Alpine errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /Alpine|evaluat|Undefined variable/i.test(message.text())) errors.push(message.text());
  });
  await loginAsAdmin(page);
  await page.goto('/team/list/user');
  await page.locator('li').filter({ hasText: 'Falcons Varsity' }).getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/games/view/501');
  await page.locator('#final_score').fill('3-2');
  await page.locator('#video_url').fill(videoUrl);
  await expect(page.locator('iframe')).toHaveAttribute('src', videoUrl);
  const saved = page.waitForResponse(response => response.url().endsWith('/games/update/501') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  expect((await saved).ok()).toBeTruthy();
  await page.reload();
  await expect(page.locator('#video_url')).toHaveValue(videoUrl);
  await expect(page.locator('#final_score')).toHaveValue('3-2');
  const persisted = await (await page.request.get('/games/501')).json();
  expect(persisted.final_score).toBe('3-2');
  expect(persisted.video_url).toBe(videoUrl);
  expect(persisted.event_id).toBe(402);
  await expect(page.locator('iframe')).toHaveAttribute('src', videoUrl);
  await page.locator('#video_url').fill('');
  await expect(page.getByText('No video URL set.')).toBeVisible();
  await expect(page.locator('iframe')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});
