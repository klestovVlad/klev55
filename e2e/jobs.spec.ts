/**
 * The six jobs from BRIEF §1, on mobile and desktop. Screenshots go to qa/screenshots/.
 */
import { test, expect, type Page } from '@playwright/test';

const shot = (page: Page, name: string) => page.screenshot({ path: `qa/screenshots/${test.info().project.name}-${name}.png`, fullPage: false });

test.beforeEach(async ({ page }) => {
  // Block third-party weather so runs are deterministic and offline-friendly; the app must degrade gracefully.
  await page.route(/open-meteo\.com/, (r) => r.abort());
});

test('1. map loads with chance-colored spots and a verdict', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(page.locator('.mapscreen__verdict')).not.toHaveText(/Загружаем/, { timeout: 20_000 });
  await expect(page.locator('.rows .row-btn').first()).toBeVisible();
  await shot(page, '01-map');
});

test('2. filter by щука recolors and lists spots', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Любая рыба/ }).click();
  await page.getByRole('button', { name: 'Щука', exact: true }).click();
  await expect(page.locator('.mapscreen__verdict')).toContainText(/Щука/);
  await shot(page, '02-filter-pike');
});

test('3. open a spot: verdict, species row, rules tab reflects today', async ({ page }) => {
  await page.goto('/');
  await page.locator('.rows .row-btn').first().click();
  await expect(page.locator('.ss__title')).toBeVisible();
  await expect(page.locator('.verdict__num')).toBeVisible();
  await page.getByRole('tab', { name: 'Правила сегодня' }).click();
  await expect(page.locator('.rules-today .callout').first()).toBeVisible();
  await shot(page, '03-spot');
});

test('4. species page has photo credit, month bar and edibility', async ({ page }) => {
  await page.goto('/species/esox-lucius');
  await expect(page.locator('h1')).toContainText('Щука');
  await expect(page.locator('.mb__bars')).toBeVisible();
  await expect(page.getByText(/Описторхоз/).first()).toBeVisible();
  await expect(page.getByText(/Фото:/)).toBeVisible();
  await shot(page, '04-species');
});

test('5. planner ranks spots for Saturday', async ({ page }) => {
  await page.goto('/plan?fish=esox-lucius&when=sat&min=120');
  await expect(page.locator('.plan__list li').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.plan__verdict')).toContainText(/щука/i);
  await shot(page, '05-plan');
});

test('6. rules and safety are readable and dated', async ({ page }) => {
  await page.goto('/rules');
  await expect(page.getByText(/редакция \d{2}\.\d{2}\.\d{4}/)).toBeVisible();
  await page.getByRole('button', { name: 'Безопасность' }).click();
  await expect(page.getByRole('heading', { name: /Лёд/ })).toBeVisible();
  await shot(page, '06-rules');
});

test('7. offline: app still opens with cached data', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  // Let the service worker install and precache.
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.tabbar')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  await context.setOffline(false);
  await shot(page, '07-offline');
});

test('8. search finds a spot and a fish', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Поиск мест, водоёмов и рыб' }).click();
  const input = page.locator('.search__input');
  await expect(input).toBeVisible();
  // Dialog styles must be present even when the search is the first dialog opened.
  const pos = await page.locator('.dlg.search').evaluate((el) => getComputedStyle(el).position);
  expect(pos).toBe('fixed');
  await input.fill('лампоч');
  await expect(page.locator('[cmdk-item]').first()).toContainText('Лампочка');
  await input.fill('щук');
  await expect(page.locator('[cmdk-item]', { hasText: 'Щука' }).first()).toBeVisible();
  await shot(page, '08-search');
});
