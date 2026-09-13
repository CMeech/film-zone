import { test, expect } from '@playwright/test';
import { loginAsPlayer } from './helpers.js';

test('coach rotations, stats, scores and totals persist', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Match controls are currently desktop-only.');
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/auth/login/user');
  await page.getByPlaceholder('Username').fill('browser-coach');
  await page.getByPlaceholder('Password').fill('coach-pass');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/team/list/user');
  await page.locator('li').filter({ hasText: 'Falcons Varsity' }).getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/games/list');
  await page.locator('#opponent_name').fill(`Coaching ${testInfo.project.name}`);
  const created = page.waitForResponse(r => r.url().endsWith('/games/create') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Create Game', exact: true }).click();
  const game = await (await created).json();
  await page.goto(`/games/view/${game.id}`);
  const controls = page.locator('section').filter({ hasText: 'Interactive Match Controls' });
  const stats = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Statistics', exact: true }) });
  await controls.getByRole('button', { name: 'Edit Rotations', exact: true }).click();
  const rotations = controls.locator('[x-show="mode === \'setRotation\'"]');
  const inputs = rotations.locator('input');
  for (let i = 0; i < 12; i++) await inputs.nth(i).fill(String(i + 1));
  expect(errors).toEqual([]);
  async function save(action) {
    const response = page.waitForResponse(r => r.url().endsWith(`/games/update/game_data/${game.id}`));
    await action();
    expect((await response).ok()).toBeTruthy();
  }
  await save(() => controls.getByRole('button', { name: 'Update Rotations', exact: true }).click());
  await page.reload();
  await controls.getByRole('button', { name: 'Edit Rotations', exact: true }).click();
  for (let i = 0; i < 12; i++) await expect(inputs.nth(i)).toHaveValue(String(i + 1));
  await controls.getByRole('button', { name: 'Add Opponent Player' }).click();
  await controls.locator('[x-model\\.number="newOpponentNumber"]').fill('0');
  await expect(controls.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
  await controls.locator('[x-model\\.number="newOpponentNumber"]').fill('20');
  await save(() => controls.getByRole('button', { name: 'Add', exact: true }).click());
  const addStat = controls.locator('[x-show="mode === \'addStat\'"]');
  async function selectStat(team, player, stat) {
    await controls.getByRole('button', { name: 'Add Stat', exact: false }).click();
    await addStat.getByRole('button', { name: team, exact: true }).click();
    await addStat.getByRole('button', { name: String(player), exact: true }).first().click();
    await addStat.getByRole('button', { name: stat, exact: true }).click();
  }
  for (const stat of ['Blocks', 'Digs', 'Aces', 'Missed Serves', 'Errors']) {
    await save(() => selectStat('My Team', 3, stat));
  }
  for (const stat of ['Kills', 'Sets']) {
    await selectStat('My Team', 3, stat);
    await addStat.locator('[\\@click="positionSelectFrom(2)"]').click();
    await save(() => addStat.locator('[\\@click="positionSelectTo(4)"]').click());
  }
  await save(() => selectStat('Opponent', 20, 'Aces'));
  await controls.getByRole('button', { name: 'Adjust Score' }).click();
  await save(() => controls.getByRole('button', { name: '+ Team', exact: true }).click());
  for (const button of ['+ Opp', '− Opp', '− Opp']) {
    await controls.getByRole('button', { name: 'Adjust Score' }).click();
    await save(() => controls.getByRole('button', { name: button, exact: true }).click());
  }
  await stats.getByRole('button', { name: 'Set 2', exact: true }).click();
  await save(() => selectStat('My Team', 3, 'Aces'));
  await page.reload();
  const persisted = await (await page.request.get(`/games/${game.id}`)).json();
  const sets = persisted.game_data.sets;
  expect(sets[0].team.starting_rotation).toEqual([1, 2, 3, 4, 5, 6]);
  expect(sets[0].opponent.starting_rotation).toEqual([7, 8, 9, 10, 11, 12]);
  expect(sets[0].team.player_stats['3']).toMatchObject({ blocks: 1, digs: 1, aces: 1, missed_serves: 1, errors: 1, sets: [{ from_position: 2, to_position: 4 }], kills: [{ target_position: 4 }] });
  expect(sets[0].opponent.player_stats['20'].aces).toBe(1);
  expect(sets[0].score.team).toBe(1);
  expect(sets[0].score.opponent).toBe(0);
  expect(sets[1].team.player_stats['3'].aces).toBe(1);
  await stats.getByRole('button', { name: 'Total', exact: true }).click();
  await expect(controls).not.toBeVisible();
  const row = stats.locator('tbody tr').filter({ has: page.locator('td:first-child', { hasText: /^3$/ }) });
  await expect(row.locator('td').nth(5)).toHaveText('2');
  await stats.getByRole('button', { name: 'Opponent', exact: true }).click();
  await expect(stats.locator('tbody')).toContainText('20');
  expect(errors).toEqual([]);
  await page.goto('/games/list');
  page.once('dialog', dialog => dialog.accept());
  const deleted = page.waitForResponse(r => r.url().endsWith(`/games/delete/${game.id}`));
  await page.locator('#games-list > div').filter({ hasText: `Coaching ${testInfo.project.name}` }).getByRole('button', { name: 'Delete' }).click();
  expect((await deleted).ok()).toBeTruthy();
  await expect(page.locator('#games-list')).not.toContainText(`Coaching ${testInfo.project.name}`);
  expect(errors).toEqual([]);
});

test('player can view game statistics without coaching controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await loginAsPlayer(page);
  await page.goto('/team/list/user');
  await page.locator('li').filter({ hasText: 'Falcons Varsity' }).getByRole('button', { name: 'Select' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/games/view/501');
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Interactive Match Controls' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toHaveCount(0);
  for (const label of ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Total', 'Opponent', 'My Team']) {
    await page.getByRole('button', { name: label, exact: true }).click();
  }
  expect(errors).toEqual([]);
});
