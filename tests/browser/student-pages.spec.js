import { test, expect } from '@playwright/test';
import { loginAsPlayer, snapshot } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-08-17T12:00:00Z') });
});

test('access login', async ({ page }) => {
  await page.goto('/auth/login/access');
  await snapshot(page, 'access-login');
});

test('student-facing page matrix', async ({ page }) => {
  await loginAsPlayer(page);
  const pages = [
    ['/dashboard', 'dashboard', 'Welcome to the Dashboard!'],
    ['/announcements/list', 'announcements', 'Team Announcements'],
    ['/games/list', 'games', 'Games'],
    ['/events/calendar', 'calendar', 'Team Calendar'],
    ['/resources/list', 'resources', 'Team Resources'],
    ['/resources/whiteboard', 'whiteboard', 'whiteboard-root'],
    ['/roster/list', 'roster', 'Team Roster'],
    ['/team/list/user', 'team-selection', 'Teams'],
  ];

  for (const [url, screenshotName, heading] of pages) {
    await page.goto(url);
    const marker = heading === 'whiteboard-root'
      ? page.locator('#whiteboard-root')
      : page.getByText(heading, { exact: false }).first();
    await expect(marker).toBeVisible();
    await snapshot(page, screenshotName);
  }
});
