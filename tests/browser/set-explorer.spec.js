import { test, expect } from '@playwright/test';
import { loginAsPlayer } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await loginAsPlayer(page);
});

async function showControls(page) {
  const toggle = page.locator('#set-explorer-controls-toggle');
  if (await toggle.isVisible() && await toggle.textContent() === 'Show controls') await toggle.click();
}

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

  await page.goto('/set-explorer/?p=6');
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

test('position 6 follows a touch-dragged setter at the phone viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile verifies browser touch input.');

  await page.goto('/set-explorer/?p=6');
  const app = page.locator('#set-explorer-app');
  const scene = page.locator('#set-explorer-scene');
  const canvas = scene.locator('canvas');
  const box = await canvas.boundingBox();
  const handleX = Number(await scene.getAttribute('data-setter-handle-x'));
  const handleY = Number(await scene.getAttribute('data-setter-handle-y'));
  const startX = box.x + box.width * handleX;
  const startY = box.y + box.height * handleY;
  const initialSetterX = Number(await app.getAttribute('data-setter-x'));
  expect(initialSetterX).toBe(5.5);
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 1, radiusX: 8, radiusY: 8, force: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: startX - 45, y: startY + 12, id: 1, radiusX: 8, radiusY: 8, force: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect.poll(async () => Number(await app.getAttribute('data-setter-x'))).not.toBe(initialSetterX);
  const setterX = Number(await app.getAttribute('data-setter-x'));
  const targetX = Number(await app.getAttribute('data-target-x'));
  await expect(app).toHaveAttribute('data-target-mode', 'position6');
  expect(targetX - setterX).toBeCloseTo(0.762, 2);
});

test('short-set height presets produce increasingly higher trajectories', async ({ page }) => {
  await page.goto('/set-explorer/');
  await showControls(page);
  await page.locator('[data-position="5"]').click();

  const scene = page.locator('#set-explorer-scene');
  const apexes = [];
  for (const height of ['1', '2', '3']) {
    await page.locator(`[data-height="${height}"]`).click();
    apexes.push(Number(await scene.getAttribute('data-trajectory-apex')));
  }

  expect(apexes[1] - apexes[0]).toBeGreaterThan(0.05);
  expect(apexes[2] - apexes[1]).toBeGreaterThan(0.05);
});

test('force changes travel duration and playback remains interruptible', async ({ page }) => {
  await page.goto('/set-explorer/');
  await showControls(page);

  const app = page.locator('#set-explorer-app');
  const scene = page.locator('#set-explorer-scene');
  const play = page.locator('#set-explorer-play');
  const force = page.locator('#set-explorer-force');

  const apexBeforeForceChange = Number(await scene.getAttribute('data-trajectory-apex'));
  await force.fill('100');
  expect(Number(await scene.getAttribute('data-trajectory-apex'))).toBeCloseTo(apexBeforeForceChange, 6);
  await play.click();
  await expect(app).toHaveAttribute('data-animation-status', 'playing');
  await expect.poll(async () => Number(await scene.getAttribute('data-ball-progress'))).toBeGreaterThan(0);
  await expect(app).toHaveAttribute('data-animation-status', 'complete', { timeout: 900 });

  await force.fill('0');
  await play.click();
  await page.waitForTimeout(650);
  await expect(app).toHaveAttribute('data-animation-status', 'playing');
  await play.click();
  await expect(app).toHaveAttribute('data-animation-status', 'paused');
  const pausedProgress = Number(await scene.getAttribute('data-ball-progress'));
  await page.waitForTimeout(200);
  expect(Number(await scene.getAttribute('data-ball-progress'))).toBeCloseTo(pausedProgress, 3);

  await play.click();
  await expect(app).toHaveAttribute('data-animation-status', 'playing');
  await page.locator('[data-position="1"]').click();
  await expect(app).toHaveAttribute('data-animation-status', 'ready');
  await expect(scene).toHaveAttribute('data-ball-progress', '0');

  await play.click();
  await page.locator('#set-explorer-reset').click();
  await expect(app).toHaveAttribute('data-animation-status', 'ready');
  await expect(scene).toHaveAttribute('data-ball-progress', '0');
  await expect(page.locator('#set-explorer-label')).toHaveText('Set 51');
});

test('every named camera view keeps the default set in frame', async ({ page }) => {
  await page.goto('/set-explorer/');
  await showControls(page);

  const app = page.locator('#set-explorer-app');
  const scene = page.locator('#set-explorer-scene');
  for (const view of [
    ['End court', 'end'],
    ['Left side', 'left'],
    ['Middle', 'middle'],
    ['Right side', 'right'],
    ['Opposition', 'opposition'],
  ]) {
    await page.getByRole('button', { name: view[0], exact: true }).click();
    await expect(app).toHaveAttribute('data-camera-view', view[1]);
    for (const attribute of ['data-setter-handle-x', 'data-setter-handle-y', 'data-target-handle-x', 'data-target-handle-y']) {
      await expect.poll(async () => Number(await scene.getAttribute(attribute))).toBeGreaterThan(0);
      expect(Number(await scene.getAttribute(attribute))).toBeLessThan(1);
    }
  }
});

test('target dragging, camera orbit, and zoom update the scene', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop verifies mouse interaction; touch coverage is separate.');

  await page.goto('/set-explorer/');
  const app = page.locator('#set-explorer-app');
  const scene = page.locator('#set-explorer-scene');
  const canvas = scene.locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const targetX = Number(await scene.getAttribute('data-target-handle-x'));
  const targetY = Number(await scene.getAttribute('data-target-handle-y'));
  await page.mouse.move(box.x + box.width * targetX, box.y + box.height * targetY);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * (targetX - 0.08), box.y + box.height * (targetY + 0.03), { steps: 8 });
  await page.mouse.up();
  await expect(app).toHaveAttribute('data-target-mode', 'custom');

  const cameraX = Number(await scene.getAttribute('data-camera-x'));
  await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number(await scene.getAttribute('data-camera-x'))).not.toBeCloseTo(cameraX, 3);

  const cameraDistance = Number(await scene.getAttribute('data-camera-distance'));
  await page.mouse.wheel(0, 500);
  await expect.poll(async () => Number(await scene.getAttribute('data-camera-distance'))).not.toBeCloseTo(cameraDistance, 3);
});

test('invalid shared values are clamped and mobile controls preserve scene framing', async ({ page }, testInfo) => {
  await page.goto('/set-explorer/?p=c&h=99&f=999&sx=-20&sz=99&sh=9&tx=99&tz=-20&v=invalid');
  const app = page.locator('#set-explorer-app');
  await expect(app).toHaveAttribute('data-setter-x', '0.300');
  await expect(app).toHaveAttribute('data-setter-z', '8.500');
  await expect(app).toHaveAttribute('data-target-x', '8.700');
  await expect(app).toHaveAttribute('data-target-z', '0.050');
  await expect(page.locator('#set-explorer-force')).toHaveValue('100');
  await expect(page.locator('#set-explorer-label')).toHaveText('Custom · Height 1');

  if (testInfo.project.name === 'mobile') {
    await page.goto('/set-explorer/');
    const canvas = page.locator('#set-explorer-scene canvas');
    const before = await canvas.boundingBox();
    await page.locator('#set-explorer-controls-toggle').click();
    const after = await canvas.boundingBox();
    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeGreaterThan(420);
    for (const attribute of ['data-setter-handle-x', 'data-setter-handle-y', 'data-target-handle-x', 'data-target-handle-y']) {
      const coordinate = Number(await page.locator('#set-explorer-scene').getAttribute(attribute));
      expect(coordinate).toBeGreaterThan(0);
      expect(coordinate).toBeLessThan(1);
    }
  }
});

test('rapid playback edits settle on one ready state without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/set-explorer/');
  await showControls(page);

  const play = page.locator('#set-explorer-play');
  for (let index = 0; index < 6; index += 1) await play.click();
  await page.locator('[data-position="9"]').click();
  await page.locator('[data-height="3"]').click();
  await page.locator('[data-position="3"]').click();

  const app = page.locator('#set-explorer-app');
  await expect(app).toHaveAttribute('data-animation-status', 'ready');
  await expect(page.locator('#set-explorer-label')).toHaveText('Set 33');
  await page.waitForTimeout(600);
  await expect(page.locator('#set-explorer-scene')).toHaveAttribute('data-ball-progress', '0');
  expect(errors).toEqual([]);
});

test('desktop presentation can enter and leave fullscreen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Fullscreen presentation is a desktop review feature.');
  await page.goto('/set-explorer/');
  await page.locator('#set-explorer-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('set-explorer-app');
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
});
