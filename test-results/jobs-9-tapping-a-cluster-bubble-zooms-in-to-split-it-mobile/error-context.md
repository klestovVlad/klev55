# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: jobs.spec.ts >> 9. tapping a cluster bubble zooms in to split it
- Location: e2e/jobs.spec.ts:92:1

# Error details

```
TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - generic [ref=e5]:
      - region "Карта мест рыбалки" [ref=e6]:
        - region "Map" [ref=e7]
        - generic:
          - generic:
            - generic [ref=e8]:
              - button "Zoom in" [ref=e9] [cursor=pointer]
              - button "Zoom out" [ref=e11] [cursor=pointer]
            - button "Find my location" [ref=e14] [cursor=pointer]
          - generic:
            - group:
              - generic "Toggle attribution" [ref=e16] [cursor=pointer]
      - generic:
        - generic [ref=e17]:
          - button "Поиск мест, водоёмов и рыб" [ref=e18] [cursor=pointer]:
            - generic [ref=e22]: Место, вода, рыба
          - button "Слои и фильтры" [ref=e23] [cursor=pointer]
        - generic [ref=e26]:
          - button "Любая рыба" [ref=e27] [cursor=pointer]:
            - text: Любая рыба
            - generic [aria-hidden] [ref=e28]: ▾
          - 'button "Время в пути: любое" [ref=e29] [cursor=pointer]': Любая даль
          - button "Со льда" [ref=e30] [cursor=pointer]
          - button "Бесплатно" [ref=e31] [cursor=pointer]
      - note "Легенда погодного слоя":
        - generic: ветер по потоку
        - generic: дождь
        - generic: облака
        - generic: прогноз на выбранный час, 15:39
      - region "Панель мест" [ref=e32]:
        - button "Развернуть панель" [ref=e33]
        - generic [ref=e35]:
          - paragraph [ref=e36]: "Щука сейчас: отлично — Омь у Калачинска, 92 мин"
          - generic [ref=e37]:
            - generic [ref=e38]:
              - generic [ref=e39]: Когда
              - strong [ref=e40]: сейчас
            - slider "Время прогноза" [ref=e41] [cursor=pointer]: "0"
            - generic [aria-hidden] [ref=e42]:
              - generic [ref=e43]: сейчас
              - generic [ref=e44]: +24 ч
              - generic [ref=e45]: +48 ч
              - generic [ref=e46]: 7 дней
          - generic [ref=e47]:
            - paragraph [ref=e48]:
              - generic [ref=e49]: 17°
              - generic [ref=e50]: малооблачно
              - generic [ref=e51]: 1027 гПа ↑
              - generic [ref=e52]: ветер СВ 1 м/с
              - generic [ref=e53]: восход 06:51, закат 19:06
              - generic [ref=e54]: растущая луна
            - generic "Давление за трое суток" [ref=e55]:
              - img "Давление за 72 часа" [ref=e56]
              - generic [ref=e58]: давление, 72 ч
            - 'button "Происхождение данных: измерено" [ref=e60] [cursor=pointer]': измерено
          - heading "Куда ехать" [level=2] [ref=e61]
          - list [ref=e62]:
            - listitem [ref=e63]:
              - button "шанс 81 Омь у Калачинска Омь 1 ч 32 мин щука лучше 15:00–22:00" [ref=e64] [cursor=pointer]:
                - generic "шанс 81" [ref=e65]: "81"
                - generic [ref=e66]:
                  - text: Омь у Калачинска
                  - generic [ref=e67]:
                    - generic [ref=e68]: Омь
                    - generic [ref=e69]: 1 ч 32 мин
                    - generic [ref=e70]: щука
                    - generic [ref=e71]: лучше 15:00–22:00
                - generic [aria-hidden] [ref=e72]: ›
            - listitem [ref=e73]:
              - button "шанс 81 Тугочайка у Заречного Тугочайка 3 ч 1 мин щука лучше 15:00–22:00" [ref=e74] [cursor=pointer]:
                - generic "шанс 81" [ref=e75]: "81"
                - generic [ref=e76]:
                  - text: Тугочайка у Заречного
                  - generic [ref=e77]:
                    - generic [ref=e78]: Тугочайка
                    - generic [ref=e79]: 3 ч 1 мин
                    - generic [ref=e80]: щука
                    - generic [ref=e81]: лучше 15:00–22:00
                - generic [aria-hidden] [ref=e82]: ›
            - listitem [ref=e83]:
              - button "шанс 79 Озеро Ик у Китермы Ик 3 ч 16 мин окунь лучше 05:00–11:00" [ref=e84] [cursor=pointer]:
                - generic "шанс 79" [ref=e85]: "79"
                - generic [ref=e86]:
                  - text: Озеро Ик у Китермы
                  - generic [ref=e87]:
                    - generic [ref=e88]: Ик
                    - generic [ref=e89]: 3 ч 16 мин
                    - generic [ref=e90]: окунь
                    - generic [ref=e91]: лучше 05:00–11:00
                - generic [aria-hidden] [ref=e92]: ›
          - button "Показать все 56" [ref=e93] [cursor=pointer]
  - navigation "Разделы" [ref=e94]:
    - link "Карта" [ref=e95] [cursor=pointer]:
      - /url: /
    - link "План" [ref=e99] [cursor=pointer]:
      - /url: /plan
    - link "Рыбы" [ref=e103] [cursor=pointer]:
      - /url: /species
    - link "Правила" [ref=e107] [cursor=pointer]:
      - /url: /rules
```

# Test source

```ts
  1   | /**
  2   |  * The six jobs from BRIEF §1, on mobile and desktop. Screenshots go to qa/screenshots/.
  3   |  */
  4   | import { test, expect, type Page } from '@playwright/test';
  5   | 
  6   | const shot = (page: Page, name: string) => page.screenshot({ path: `qa/screenshots/${test.info().project.name}-${name}.png`, fullPage: false });
  7   | 
  8   | test.beforeEach(async ({ page }) => {
  9   |   // Block third-party weather so runs are deterministic and offline-friendly; the app must degrade gracefully.
  10  |   await page.route(/open-meteo\.com/, (r) => r.abort());
  11  | });
  12  | 
  13  | test('1. map loads with chance-colored spots and a verdict', async ({ page }) => {
  14  |   await page.goto('/');
  15  |   await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  16  |   await expect(page.locator('.mapscreen__verdict')).not.toHaveText(/Загружаем/, { timeout: 20_000 });
  17  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible();
  18  |   await shot(page, '01-map');
  19  | });
  20  | 
  21  | test('2. filter by щука recolors and lists spots', async ({ page }) => {
  22  |   await page.goto('/');
  23  |   await page.getByRole('button', { name: /Любая рыба/ }).click();
  24  |   await page.getByRole('button', { name: 'Щука', exact: true }).click();
  25  |   await expect(page.locator('.mapscreen__verdict')).toContainText(/Щука/);
  26  |   await shot(page, '02-filter-pike');
  27  | });
  28  | 
  29  | test('3. open a spot: verdict, species row, rules tab reflects today', async ({ page }) => {
  30  |   await page.goto('/');
  31  |   await page.locator('.rows .row-btn').first().click();
  32  |   await expect(page.locator('.ss__title')).toBeVisible();
  33  |   await expect(page.locator('.verdict__num')).toBeVisible();
  34  |   await page.getByRole('tab', { name: 'Правила сегодня' }).click();
  35  |   await expect(page.locator('.rules-today .callout').first()).toBeVisible();
  36  |   await shot(page, '03-spot');
  37  | });
  38  | 
  39  | test('4. species page has photo credit, month bar and edibility', async ({ page }) => {
  40  |   await page.goto('/species/esox-lucius');
  41  |   await expect(page.locator('h1')).toContainText('Щука');
  42  |   await expect(page.locator('.mb__bars')).toBeVisible();
  43  |   await expect(page.getByText(/Описторхоз/).first()).toBeVisible();
  44  |   await expect(page.getByText(/Фото:/)).toBeVisible();
  45  |   await shot(page, '04-species');
  46  | });
  47  | 
  48  | test('5. planner ranks spots for Saturday', async ({ page }) => {
  49  |   await page.goto('/plan?fish=esox-lucius&when=sat&min=120');
  50  |   await expect(page.locator('.plan__list li').first()).toBeVisible({ timeout: 20_000 });
  51  |   await expect(page.locator('.plan__verdict')).toContainText(/щука/i);
  52  |   await shot(page, '05-plan');
  53  | });
  54  | 
  55  | test('6. rules and safety are readable and dated', async ({ page }) => {
  56  |   await page.goto('/rules');
  57  |   await expect(page.getByText(/редакция \d{2}\.\d{2}\.\d{4}/)).toBeVisible();
  58  |   await page.getByRole('button', { name: 'Безопасность' }).click();
  59  |   await expect(page.getByRole('heading', { name: /Лёд/ })).toBeVisible();
  60  |   await shot(page, '06-rules');
  61  | });
  62  | 
  63  | test('7. offline: app still opens with cached data', async ({ page, context }) => {
  64  |   await page.goto('/');
  65  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  66  |   // Let the service worker install and precache.
  67  |   await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30_000 }).catch(() => {});
  68  |   await page.waitForTimeout(1500);
  69  |   await context.setOffline(true);
  70  |   await page.reload();
  71  |   await expect(page.locator('.tabbar')).toBeVisible({ timeout: 20_000 });
  72  |   await expect(page.locator('.rows .row-btn').first()).toBeVisible({ timeout: 20_000 });
  73  |   await context.setOffline(false);
  74  |   await shot(page, '07-offline');
  75  | });
  76  | 
  77  | test('8. search finds a spot and a fish', async ({ page }) => {
  78  |   await page.goto('/');
  79  |   await page.getByRole('button', { name: 'Поиск мест, водоёмов и рыб' }).click();
  80  |   const input = page.locator('.search__input');
  81  |   await expect(input).toBeVisible();
  82  |   // Dialog styles must be present even when the search is the first dialog opened.
  83  |   const pos = await page.locator('.dlg.search').evaluate((el) => getComputedStyle(el).position);
  84  |   expect(pos).toBe('fixed');
  85  |   await input.fill('лампоч');
  86  |   await expect(page.locator('[cmdk-item]').first()).toContainText('Лампочка');
  87  |   await input.fill('щук');
  88  |   await expect(page.locator('[cmdk-item]', { hasText: 'Щука' }).first()).toBeVisible();
  89  |   await shot(page, '08-search');
  90  | });
  91  | 
  92  | test('9. tapping a cluster bubble zooms in to split it', async ({ page }) => {
  93  |   await page.goto('/');
> 94  |   await page.waitForFunction(() => (window as any).__map?.loaded() && (window as any).__map.getLayer('clusters'), null, { timeout: 30_000 });
      |              ^ TimeoutError: page.waitForFunction: Timeout 30000ms exceeded.
  95  |   await page.waitForTimeout(1500);
  96  |   const target = await page.evaluate(() => {
  97  |     const m = (window as any).__map;
  98  |     const r = m.getCanvas().getBoundingClientRect();
  99  |     const cs = m.queryRenderedFeatures({ layers: ['clusters'] }).map((c: any) => m.project(c.geometry.coordinates)).filter((p: any) => p.x > 60 && p.x < r.width - 60 && p.y > 130 && p.y < r.height * 0.5);
  100 |     return cs[0] ? { x: r.left + cs[0].x, y: r.top + cs[0].y, zoom: m.getZoom() } : null;
  101 |   });
  102 |   test.skip(!target, 'no cluster bubble in view at this viewport');
  103 |   await page.mouse.click(target!.x, target!.y);
  104 |   await page.waitForTimeout(1200);
  105 |   const zoom = await page.evaluate(() => (window as any).__map.getZoom());
  106 |   expect(zoom).toBeGreaterThan(target!.zoom + 0.8);
  107 | });
  108 | 
```