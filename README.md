# Клёв 55

Живая версия: https://klestovvlad.github.io/klev55/ (GitHub Pages, деплой из `main` через Actions).

Карта-атлас и планировщик рыбалки для Омска и всего, что в 200 км вокруг: Иртыш, Омь, Оша, затоны и старицы, Крутинские и Саргатские озёра, платники.

Отвечает на шесть вопросов рыбака:

1. **Куда ехать в субботу за щукой?** Карта и планировщик ранжируют места по шансу на выбранный час, показывают время в пути и лучшие часы.
2. **Что здесь ловится и на что?** Тап по месту или водоёму — виды по шансу, способы, наживки, лайфхаки. Долгое нажатие (или правый клик) в любой точке карты — «точка на воде»: погода и правила именно здесь, кто водится по типу воды и наблюдениям, шанс диапазоном по соседним описанным местам, снасти на сейчас; точку можно сохранить в «Мои места».
3. **Можно ли сегодня?** Правила на дату: нерестовые запреты, зимовальные ямы, размеры, суточная норма, штрафы, с источником.
4. **Когда клюёт?** Почасовой график на сегодня и завтра, прогноз на неделю, календарь по месяцам.
5. **Что за рыба?** 28 видов: фото с лицензией, как отличить, размеры, съедобность и описторхоз. Словарь снастей на 40 карточек со схемами, термины в текстах подсвечены; там же расшифровка маркировки (762ML 5-21g, 70SP-MR, PE #0.8, размер катушки, номера крючков) и определитель «что у меня в руках» по признакам.
6. **Что взять?** «Взять с собой» у каждого места и в планировщике: способы под сезон и лёд с конкретными приманками и оснастками из словаря; галочки ставятся прямо там; блок «С вашим ящиком» говорит, кого здесь можно ловить тем, что есть, и чего не хватает; в планировщике фильтр «Только с моим ящиком». Плюс чек-листы по способу и сезону, безопасность на льду, клещи, гроза.

## Что здесь данные, а что оценка

У каждого значения есть пометка происхождения, её можно нажать:

- **измерено** — прогноз погоды Open-Meteo, наблюдения GBIF/iNaturalist, последние измерения гидропостов (всегда с датой).
- **по правилам** — приказ Минсельхоза № 646 (правила рыболовства Западно-Сибирского бассейна), таксы, КоАП, Роспотребнадзор, МЧС.
- **справочник** — размеры, сроки нереста, фото (автор и лицензия указаны).
- **оценка** — описания, места, советы, шанс клёва, расчёт льда. Это экспертная модель, а не измерения. Места собраны по обобщённым отчётам, без копирования чужих текстов и координат.

Погода: сетка Open-Meteo из ~33 точек по всему кругу, одним запросом; слой «Ветер и осадки» на карте показывает стрелки ветра, дождь и облачность на выбранный час. На карте при приближении видны мосты, плотины, спуски для лодок, рыболовные магазины, кемпинги и заправки из OpenStreetMap. Живого уровня Иртыша в открытом доступе нет с 2024 года: показываем последнее измерение с датой. Правила Казахстана не включены, воды за границей серые.

## Как обновить правила

1. Откройте актуальную редакцию приказа № 646 (ссылка на экране «Правила»).
2. Поправьте `scripts/build-rules.ts` (даты, размеры, нормы) и `research/RULES_RAW.md` (цитаты и таблица ям).
3. `npm run data:build rules` и `npm run qa`.

## Запуск

```bash
npm install
npm run dev
```

Приложение работает офлайн после первого открытия (PWA): данные, правила, места и последний прогноз кэшируются.

---

# Klev 55 (developer notes)

Vite + React + TypeScript, MapLibre GL JS (OpenFreeMap vector tiles), SunCalc, Zustand, TanStack Query, Radix primitives, vaul, cmdk. Plain CSS with custom properties. PWA via vite-plugin-pwa.

## Layout

```
BRIEF.md              product brief (frozen)
docs/                 DECISIONS, PROGRESS, MODEL, DESIGN, DEMO
research/             SOURCES, FUNNEL, RULES_RAW, SPOTS_CANDIDATES, UX_NOTES, raw/
content/species/*.json   knowledge layer, one file per species (validated)
content/spots/*.json     spots (validated; geometry checked at build)
content/advice.json
scripts/              data pipeline → public/data
src/model/            bite chance heuristic (+ tests)
src/screens, src/components
```

## Scripts

| Command | What |
|---------|------|
| `npm run dev` / `build` / `preview` | app |
| `npm test` | vitest (model) |
| `npm run data:build [step]` | full pipeline; step ∈ water, rules, hydro, observations, species, spots |
| `npm run data:refresh` | live sources only (hydro/ice, observations) — run daily by CI |
| `npm run qa` | data QA; fails on violations |

Overpass pulls are tiled and cached in `scripts/.cache` (gitignored). The main overpass-api.de host may refuse connections; the script uses the .fr mirror first.

## Deploy

**GitHub Pages**: `.github/workflows/deploy-pages.yml` builds with `VITE_BASE=/<repo>/` and copies `index.html` to `404.html` for client routing. Enable Pages → Source: GitHub Actions.

**Vercel**: import the repo; `vercel.json` sets the SPA rewrite. Base stays `/`.

Daily data refresh: `.github/workflows/refresh-data.yml` (cron 02:20 UTC) runs `data:refresh` + `qa` and commits `public/data`.

## QA status (2026-09-22)

| Check | Result |
|-------|--------|
| `npm test` | 44 unit tests pass (model, point estimate, gear advice, box coverage, marking decoder) |
| `npm run qa` | ok — 28 species, 56 spots, 29 zones, 41 gear cards, payload 2.77 MB |
| `npm run e2e` | 24/24 — 12 jobs × mobile + desktop (offline reload, dropped pin, marking decoder included); screenshots in `qa/screenshots/` |
| `npm run lighthouse` (mobile, simulated 4G) | performance 86, accessibility 100, best practices 96 |

## Model

See `docs/MODEL.md`. All weights live in `src/model/weights.ts`.
