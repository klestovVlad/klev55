# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: jobs.spec.ts >> 2. filter by щука recolors and lists spots
- Location: e2e/jobs.spec.ts:21:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Любая рыба/ })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - main [ref=e4]:
      - generic [ref=e5]:
        - region [ref=e6]:
          - region [ref=e7]
          - generic:
            - generic [ref=e8]:
              - button [ref=e9] [cursor=pointer]
              - button [ref=e11] [cursor=pointer]
            - button [ref=e14] [cursor=pointer]
          - group [ref=e16]:
            - generic [ref=e17] [cursor=pointer]
            - generic [ref=e18]:
              - text: OpenFreeMap © OpenMapTiles, © OpenStreetMap contributors (ODbL) |
              - link [ref=e19] [cursor=pointer]:
                - /url: https://openfreemap.org
                - text: OpenFreeMap
              - link [ref=e20] [cursor=pointer]:
                - /url: https://www.openmaptiles.org/
                - text: © OpenMapTiles
              - text: Data from
              - link [ref=e21] [cursor=pointer]:
                - /url: https://www.openstreetmap.org/copyright
                - text: OpenStreetMap
        - generic:
          - generic [ref=e22]:
            - button [ref=e23] [cursor=pointer]:
              - generic [ref=e27]: Место, вода, рыба
            - button [ref=e28] [cursor=pointer]
          - generic [ref=e31]:
            - button [ref=e32] [cursor=pointer]:
              - text: Любая рыба
              - generic [aria-hidden] [ref=e33]: ▾
            - button [ref=e34] [cursor=pointer]: Любая даль
            - button [ref=e35] [cursor=pointer]: Со льда
            - button [ref=e36] [cursor=pointer]: Бесплатно
    - navigation [ref=e37]:
      - link [ref=e38] [cursor=pointer]:
        - /url: /
        - generic [ref=e41]: Карта
      - link [ref=e42] [cursor=pointer]:
        - /url: /plan
        - generic [ref=e45]: План
      - link [ref=e46] [cursor=pointer]:
        - /url: /species
        - generic [ref=e49]: Рыбы
      - link [ref=e50] [cursor=pointer]:
        - /url: /rules
        - generic [ref=e53]: Правила
  - dialog [active] [ref=e54]:
    - heading "Панель мест" [level=2] [ref=e58]
    - generic [ref=e59]:
      - paragraph [ref=e60]: "Щука сейчас: хорошо — Иртыш и затон у Лежанки, 83 мин"
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: Когда
          - strong [ref=e64]: сейчас
        - slider "Время прогноза" [ref=e65] [cursor=pointer]: "0"
        - generic [aria-hidden] [ref=e66]:
          - generic [ref=e67]: сейчас
          - generic [ref=e68]: +24 ч
          - generic [ref=e69]: +48 ч
          - generic [ref=e70]: 7 дней
      - generic [ref=e71]:
        - paragraph [ref=e72]:
          - generic [ref=e73]: 18°
          - generic [ref=e74]: пасмурно
          - generic [ref=e75]: 1027 гПа ↑
          - generic [ref=e76]: ветер СВ 2 м/с
          - generic [ref=e77]: восход 06:51, закат 19:06
          - generic [ref=e78]: растущая луна
        - generic "Давление за трое суток" [ref=e79]:
          - img "Давление за 72 часа" [ref=e80]
          - generic [ref=e82]: давление, 72 ч
        - 'button "Происхождение данных: измерено" [ref=e84] [cursor=pointer]': измерено
      - heading "Куда ехать" [level=2] [ref=e85]
      - list [ref=e86]:
        - listitem [ref=e87]:
          - button "шанс 77 Иртыш и затон у Лежанки Иртыш 1 ч 23 мин щука" [ref=e88] [cursor=pointer]:
            - generic "шанс 77" [ref=e89]: "77"
            - generic [ref=e90]:
              - text: Иртыш и затон у Лежанки
              - generic [ref=e91]:
                - generic [ref=e92]: Иртыш
                - generic [ref=e93]: 1 ч 23 мин
                - generic [ref=e94]: щука
            - generic [aria-hidden] [ref=e95]: ›
        - listitem [ref=e96]:
          - button "шанс 77 Озеро Жилое (Бития) у Увальной Битии Жилое 1 ч 29 мин щука" [ref=e97] [cursor=pointer]:
            - generic "шанс 77" [ref=e98]: "77"
            - generic [ref=e99]:
              - text: Озеро Жилое (Бития) у Увальной Битии
              - generic [ref=e100]:
                - generic [ref=e101]: Жилое
                - generic [ref=e102]: 1 ч 29 мин
                - generic [ref=e103]: щука
            - generic [aria-hidden] [ref=e104]: ›
        - listitem [ref=e105]:
          - button "шанс 77 Омь у Калачинска Омь 1 ч 32 мин щука" [ref=e106] [cursor=pointer]:
            - generic "шанс 77" [ref=e107]: "77"
            - generic [ref=e108]:
              - text: Омь у Калачинска
              - generic [ref=e109]:
                - generic [ref=e110]: Омь
                - generic [ref=e111]: 1 ч 32 мин
                - generic [ref=e112]: щука
            - generic [aria-hidden] [ref=e113]: ›
      - button "Показать все 10" [ref=e114] [cursor=pointer]
```

# Test source

```ts
  1  | /**
  2  |  * The six jobs from BRIEF §1, on mobile and desktop. Screenshots go to qa/screenshots/.
  3  |  */
  4  | import { test, expect, type Page } from '@playwright/test';
  5  | 
  6  | const shot = (page: Page, name: string) => page.screenshot({ path: `qa/screenshots/${test.info().project.name}-${name}.png`, fullPage: false });
  7  | 
  8  | test.beforeEach(async ({ page }) => {
  9  |   // Block third-party weather so runs are deterministic and offline-friendly; the app must degrade gracefully.
  10 |   await page.route(/open-meteo\.com/, (r) => r.abort());
  11 | });
  12 | 
  13 | test('1. map loads with chance-colored spots and a verdict', async ({ page }) => {
  14 |   await page.goto('/');
  15 |   await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  16 |   await expect(page.locator('.mapscreen__verdict')).not.toHaveText(/Загружаем/, { timeout: 20_000 });
  17 |   await expect(page.locator('.rows .row-btn').first()).toBeVisible();
  18 |   await shot(page, '01-map');
  19 | });
  20 | 
  21 | test('2. filter by щука recolors and lists spots', async ({ page }) => {
  22 |   await page.goto('/');
> 23 |   await page.getByRole('button', { name: /Любая рыба/ }).click();
     |                                                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
  24 |   await page.getByRole('button', { name: 'Щука', exact: true }).click();
  25 |   await expect(page.locator('.mapscreen__verdict')).toContainText(/Щука/);
  26 |   await shot(page, '02-filter-pike');
  27 | });
  28 | 
  29 | test('3. open a spot: verdict, species row, rules tab reflects today', async ({ page }) => {
  30 |   await page.goto('/');
  31 |   await page.locator('.rows .row-btn').first().click();
  32 |   await expect(page.locator('.ss__title')).toBeVisible();
  33 |   await expect(page.locator('.verdict__num')).toBeVisible();
  34 |   await page.getByRole('tab', { name: 'Правила сегодня' }).click();
  35 |   await expect(page.locator('.rules-today .callout').first()).toBeVisible();
  36 |   await shot(page, '03-spot');
  37 | });
  38 | 
  39 | test('4. species page has photo credit, month bar and edibility', async ({ page }) => {
  40 |   await page.goto('/species/esox-lucius');
  41 |   await expect(page.locator('h1')).toContainText('Щука');
  42 |   await expect(page.locator('.mb__bars')).toBeVisible();
  43 |   await expect(page.getByText(/Описторхоз/)).toBeVisible();
  44 |   await expect(page.getByText(/Фото:/)).toBeVisible();
  45 |   await shot(page, '04-species');
  46 | });
  47 | 
  48 | test('5. planner ranks spots for Saturday', async ({ page }) => {
  49 |   await page.goto('/plan?fish=esox-lucius&when=sat&km=120');
  50 |   await expect(page.locator('.plan__list li').first()).toBeVisible({ timeout: 20_000 });
  51 |   await expect(page.locator('.plan__verdict')).toContainText(/щука/i);
  52 |   await shot(page, '05-plan');
  53 | });
  54 | 
  55 | test('6. rules and safety are readable and dated', async ({ page }) => {
  56 |   await page.goto('/rules');
  57 |   await expect(page.getByText(/редакция \d{2}\.\d{2}\.\d{4}/)).toBeVisible();
  58 |   await page.getByRole('button', { name: 'Безопасность' }).click();
  59 |   await expect(page.getByRole('heading', { name: /Лёд/ })).toBeVisible();
  60 |   await shot(page, '06-rules');
  61 | });
  62 | 
  63 | test('7. offline: app still opens with cached data', async ({ page, context }) => {
  64 |   await page.goto('/');
  65 |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  66 |   // Let the service worker install and precache.
  67 |   await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30_000 }).catch(() => {});
  68 |   await page.waitForTimeout(1500);
  69 |   await context.setOffline(true);
  70 |   await page.reload();
  71 |   await expect(page.locator('.tabbar')).toBeVisible({ timeout: 20_000 });
  72 |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  73 |   await context.setOffline(false);
  74 |   await shot(page, '07-offline');
  75 | });
  76 | 
```