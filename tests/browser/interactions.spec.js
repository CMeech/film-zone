import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsPlayer } from './helpers.js';

test('player navigation, mobile menu, and team selection', async ({ page }, testInfo) => {
  await loginAsPlayer(page);
  if (testInfo.project.name === 'mobile') {
    await page.locator('nav').getByRole('button').click();
  }
  await page.locator('aside').getByRole('link', { name: 'Announcements', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Team Announcements' })).toBeVisible();
  await page.goto('/team/list/user');
  await page.locator('li').filter({ hasText: 'Falcons Junior Varsity' }).getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('body')).toContainText('Welcome to the Dashboard!');
});

test('admin account login and team form lifecycle', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/team/create');
  const submit = page.getByRole('button', { name: 'Create Team' });
  await expect(submit).toBeDisabled();
  await page.locator('#name').fill('Browser Created Team');
  await page.locator('#name').blur();
  await page.locator('#year').fill('2027');
  await page.locator('#year').blur();
  await page.locator('#logoPath').fill('/static/images/browser-team.svg');
  await page.locator('#logoPath').blur();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole('alert')).toContainText('registered successfully');
});

test('coach/admin representative create form validation', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/announcements/list');
  const submit = page.getByRole('button', { name: 'Post Announcement' });
  await expect(submit).toBeDisabled();
  await page.locator('#title').fill('Browser form smoke test');
  await page.locator('#title').blur();
  await page.locator('#message').fill('Alpine receives real browser input events.');
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.locator('#announcements-page')).toContainText('Browser form smoke test');
});
