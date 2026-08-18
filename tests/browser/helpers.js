import { expect } from '@playwright/test';

export const PLAYER_ACCESS = 'player-access';
export const ADMIN = { username: 'browser-admin', password: 'admin-pass' };

export async function stabilize(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important}' });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
}

export async function loginAsPlayer(page) {
  await page.goto('/auth/login/access');
  await page.getByPlaceholder('Password').fill(PLAYER_ACCESS);
  await page.getByRole('button', { name: 'Access' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsAdmin(page) {
  await page.goto('/auth/login/user');
  await page.getByPlaceholder('Username').fill(ADMIN.username);
  await page.getByPlaceholder('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function snapshot(page, name) {
  await stabilize(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}
