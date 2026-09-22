# КЛЁВ 55 — autonomous build brief

You are building Клёв 55: a map-first fishing atlas and planner for Omsk and everything within ~200 km. It answers, for a real angler on a real day: where to go, for which fish, when, with what, what the chance is, what the rules say, and what to watch out for. UI language is Russian. Code, comments and docs are English.

Work fully autonomously. Nobody will answer questions. Where the brief leaves a choice, decide, write the decision down, and move on.

## 0. Operating rules (read twice)

1. No questions. Never stop to ask. Pick the sensible option, log it in `docs/DECISIONS.md` (one line: what, why, alternative rejected).
2. Memory across context resets. Your context will be compacted several times. Before every phase and every ~30 minutes, update `docs/PROGRESS.md`: what is done, what is in progress, exact next step, known problems. On any restart, read `BRIEF.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` first.
3. Commit per milestone with a message that says what works now. `git init` at the start.
4. Honesty is a feature. Every data field carries provenance: `measured` (fetched from a live/official source), `official` (parsed from regulations), `reference` (biological databases / encyclopedias), `generated` (your own expert knowledge). The UI shows a small badge for `generated` content. Never present generated content as data. Never invent a source URL: only URLs you actually fetched successfully go into `research/SOURCES.md`.
5. Time budget (soft): research 45 min → data pipeline 60 → knowledge layer 60 → forecast model 30 → UI 150 → QA and polish 45. If a phase runs over 1.5× budget, cut scope, note it in PROGRESS.md, continue. A finished narrower product beats an unfinished wide one.
6. Dead source = 5 minutes max. If an endpoint fails after two attempts and one workaround, mark it `dead` in SOURCES.md with the error and move on. Never fabricate its data.
7. Licenses. Record the license of every dataset and every image. OSM → ODbL attribution in the map corner. Wikimedia/iNaturalist images → per-image author + license shown on the species page. Skip images without a permissive license (CC0, CC-BY, CC-BY-SA, CC-BY-NC).
8. Do not scrape fishing forums into the product. You may read them during research to validate your species-per-waterbody knowledge and to find spot names; you may not copy their text, photos, or coordinates lists. Aggregated observations only ("по отчётам рыбаков щука ловится здесь регулярно"), and mark those `generated` with a `corroborated_by` note.
9. Jurisdiction. The 200 km circle around Omsk (center 54.99 N, 73.37 E) clips a slice of North Kazakhstan. Render Kazakh waters muted and label them "другая юрисдикция — правила РК не включены". Do not place spots there.

## 1. Who this is for, and the jobs it must do

Persona: an angler in Omsk, 25–60, phone in hand, often standing outdoors in bright sun or −25 °C. Sometimes planning the night before on a laptop. Not a programmer. Skims. Wants a verdict, then the reasons.

Jobs, in priority order:

1. "Куда ехать в субботу за щукой?" → ranked spots with chance, drive time, best hours.
2. "Что здесь ловится и на что?" → tap a river/lake/spot, get species ranked for today, methods, baits, tips.
3. "Можно ли сегодня?" → closed seasons, prohibited zones, min sizes, bag limits — for today's date, plain Russian, with the source.
4. "Когда клюёт?" → hourly bite chart today/tomorrow, 7-day outlook, month-by-month species calendar.
5. "Что за рыба, что с ней делать?" → photo, ID tips, size, edibility, opisthorchiasis risk and safe preparation.
6. "Что взять и о чём помнить?" → checklist per method/season, safety (ice, ticks, storms, fines).

Everything else is secondary.

## 2. Geography

* Center: Omsk (54.99 N, 73.37 E). Radius: 200 km. Compute the circle; use it for every spatial filter.
* Key waters to seed research (verify each; this is a hint list, not truth): река Иртыш (Черлак → Омск → Красноярка → Большеречье → Тара), река Омь, река Оша, река Тара (lower reaches), река Ишим (west edge), протоки и старицы Иртыша, Крутинские озёра (Ик, Салтаим, Тенис), озёра Муромцевского района (Данилово, Ленёво, Щучье), озёра Называевского/Тюкалинского районов, Эбейты (солёное — likely no fish; verify), паводковые водохранилища and ponds near Омск, платные пруды в 50 км от Омска.
* Gauges of interest: Иртыш — Омск, Иртыш — Черлак, Иртыш — Тара, Омь — Омск.

## 3. Phase 1 — Research (deliverable: `research/SOURCES.md` + `research/FUNNEL.md`)

Run the widest funnel first, then narrow. For every candidate: try it (curl / fetch), record `status: live|dead|blocked`, license, coverage for our circle, fields available, update frequency, CORS (yes/no — decides client-side vs build-time fetch), and a one-line verdict. Put the decision matrix in `FUNNEL.md`.

### 3.1 Geodata

* OSM via Overpass API (no key). Tag families to pull: `waterway=river|stream|canal`, `natural=water` with `water=lake|pond|reservoir|oxbow|river`, `wetland`, `leisure=fishing`, `fishing=*`, `leisure=slipway`, `amenity=boat_ramp` (rare in RU — check), `waterway=dam|weir|lock`, `bridge=yes` on roads over water, `shop=fishing`, `tourism=camp_site`, `amenity=fuel`, `place=*` for names. Query the 200 km bbox in a grid of tiles with `[timeout:900]` and caching; if Overpass throttles, fall back to a Geofabrik PBF extract + `osmium`. Names must be Russian (`name`, `name:ru`).
* Basemap: OpenFreeMap vector tiles (`tiles.openfreemap.org`, no key, verify). Fallback: raster CartoDB tiles. Terrain/hillshade: AWS terrarium tiles. Satellite: Esri World Imagery tiles (check terms for demo use).
* Routing for drive time: OSRM public demo server (`router.project-osrm.org`) — verify it is up; otherwise straight-line distance × 1.3 with a note.
* Admin boundary of Омская область and the RU/KZ border from OSM relations.

### 3.2 Regulations (official)

* Primary: Приказ Минсельхоза России от 30.10.2020 № 646 «Об утверждении правил рыболовства для Западно-Сибирского рыбохозяйственного бассейна». Find the newest consolidated edition you can actually open (consultant.ru, garant.ru, legalacts.ru, publication.pravo.gov.ru). Record edition date in `rules.json`.
* Extract for Омская область (and note if Новосибирская/Тюменская slices differ): нерестовые запреты by water type and dates; species banned everywhere (осётр сибирский, нельма, муксун, стерлядь outside licensed sites — verify the exact list); минимальные размеры (см) per species; суточная норма вылова; gear restrictions (количество крючков, запрет сетей и т.п.); prohibited zones and distances (у плотин, мостов, шлюзов); and Приложение № 1 — перечень зимовальных ям with their coordinates and the 15 ноября – 20 апреля ban. The oir.su page "Рыбалка в Омской области-2026" republishes the Omsk зимовальные ямы with coordinates — use it to cross-check parsing, but the source of record is the приказ.
* Fines and таксы: Постановление Правительства РФ № 1321 от 03.11.2018 (таксы за ущерб per fish) + КоАП ст. 8.37 ч. 2. Digest into plain Russian: "щука — N ₽ за штуку, в нерест ×2".
* Красная книга Омской области — list of protected fish; mark them in species data as `protected`.

### 3.3 Hydrology and ice

* АИС ГМВО (Росводресурсы, gmvo.skniivh.ru) — water level, temperature, ice phenomena by gauge. Explore whether any JSON/CSV endpoint exists behind the forms.
* allrivers.info gauges: `/gauge/irtysh-omsk`, `/gauge/om-omsk`, `/gauge/irtyish-rp-cherlak` — level (cm over gauge zero), water temperature, ice, with archives. Treat as `measured` if fresh (<48 h), otherwise show "данные устарели" with the date. Fetch at build time / by scheduled job (likely no CORS).
* Обь-Иртышское УГМС (omsk-meteo.ru) — daily bulletins, spring flood forecasts, ice thickness bulletins in winter. Check for anything machine-readable; otherwise skip.
* Ice thickness estimate (computed, `generated` badge): from Open-Meteo historical daily temps, accumulate freezing-degree-days since the first sustained freeze and estimate thickness with a Stefan-type coefficient calibrated for slow rivers/lakes; present as "ориентировочно ~X см (расчёт по морозам, не измерение)", with the safety thresholds (7 см пешком, 15 см снегоход, 30 см легковой автомобиль — verify against МЧС guidance).

### 3.4 Weather and astronomy

* Open-Meteo forecast API (no key, CORS): hourly temp, pressure (surface + trend), wind speed/direction/gusts, cloud cover, precipitation, 16 days; plus the archive API for the last 30 days (pressure trend, degree-days). Model selection: prefer `best_match`; note ICON/GFS availability for Siberia.
* SunCalc (npm): sunrise/sunset, civil twilight, moon phase, illumination, moonrise/moonset, transit → solunar major/minor periods.

### 3.5 Fish biology and reference

* FishBase via the rOpenSci API (`fishbase.ropensci.org`) or any live mirror: max length, weight, habitat, temperature range, spawning, diet. Verify it is alive.
* GBIF occurrence API (no key): `occurrence/search` within our circle for `Actinopterygii` — real recorded observations per species (sparse, but `measured`). Use for a "научные наблюдения" layer and to sanity-check species presence.
* iNaturalist API (no key): observations in the bbox, Russian common names, CC-licensed photos (filter by `photo_license`). Good photo source with regional look.
* Wikipedia / Wikidata: ru.wikipedia REST summary per species, Wikidata P18 image via Commons with author/license, taxonomy IDs to cross-link FishBase/GBIF/iNat.
* Local aliases matter: чебак = сибирская плотва/сорога, сырок = пелядь, etc. Capture in `names.aliases`.
* Opisthorchiasis (описторхоз): Omsk region is one of the most endemic in Russia; carriers are cyprinids (язь, елец, плотва/чебак, лещ, линь, карась less so). Find Роспотребнадзор guidance on safe preparation (freezing time/temperature, salting, boiling/frying time) and encode per species `edible.opisthorchiasis_risk` + `edible.safe_preparation`.

### 3.6 Community and validation (read-only)

* fishermap.org (Омск/Омская область pages, species analytics), fish-search.ru/omsk, rybolovu.com/omskaya_oblast, fishing-report.ru — use to validate which species are reported on which waters and to collect candidate spot names. See rule 8.

### 3.7 Product benchmark (30 min, output `research/UX_NOTES.md`)

Look at what forecast-first fishing apps do well: hourly bite chart combining solunar + barometric trend; a single score per location and day; conditions and forecast on one map canvas; regulations inside the app; free browsing without an account; offline packs. Note what to borrow and what to skip (social feeds, marketplaces). Write 10 concrete UI decisions for this product.

## 4. Phase 2 — Data model and pipeline (`scripts/`, output `public/data/`)

Static JSON, generated by `npm run data:build`. Each file has a `meta` block: `generated_at`, `sources[]`, `license`. Keep total payload < 6 MB (thumbnails 400 px WebP).

* `water.geojson` — water bodies and waterways with `osm_id`, `name`, `type`, area/length, centroid, `jurisdiction: ru|kz`.
* `infra.geojson` — bridges, dams/weirs, boat launches, fishing shops, fuel, campsites.
* `species.json[]` — see §5.
* `spots.json[]` — see §5.
* `rules.json` — see §3.2, region-scoped, with `edition_date`, `source_url`.
* `zones.geojson` — зимовальные ямы (as segments/polygons from coordinates) and other prohibited zones, with `active_from`/`active_to`.
* `gauges.json` — per gauge: latest level, temp, ice, `measured_at`, 30-day history if available.
* `observations.geojson` — GBIF/iNat points (thinned), species id, date, license.
* `advice.json` — method/season checklists, safety texts, lifehacks not tied to a single species.

Provide `npm run data:refresh` that re-fetches only live sources (gauges, rules check, weather cache) and a GitHub Actions workflow running it daily. Weather itself is fetched live in the browser.

## 5. Phase 3 — Knowledge layer (`generated`, and say so)

You are the regional expert here. Be specific, be honest about uncertainty, and never dress a guess as a measurement.

### species.json — 25–35 species of the Irtysh basin

Include at least: щука, судак, окунь, берш (if present), язь, лещ, плотва/чебак, елец, карась (серебряный и золотой), сазан/карп, линь, налим, ёрш, пескарь, уклейка, густера, красноперка, голавль (verify presence), жерех (verify), сом (verify), стерлядь (protected — show, mark banned), нельма/муксун/пелядь (protected/banned), ротан (invasive, lakes), верховка, амур/толстолобик (stocked ponds).

Per species:

```
id, names{ru, lat, en, aliases[]}, family, photo{url, author, license, source},
status{legal: allowed|banned|banned_outside_licensed_sites, red_book: bool, invasive: bool},
rules_ref{min_size_cm, daily_limit},               // from rules.json, provenance: official
description (120–180 words, angler voice, ID marks, what to confuse it with),
size{typical_cm, typical_kg, trophy_kg},           // reference where available, else generated
habitat{water_types[], depth_m[min,max], structure[], current: none|slow|moderate|fast},
spawning{from: "MM-DD", to: "MM-DD", water_temp_c[min,max]},
activity_by_month[12] (0–10),
activity_by_hour{ openwater:[24], ice:[24] } (0–10),
weather_response{pressure: text, wind: text, cloud: text, temp_change: text, water_level: text},
methods[] {name (спиннинг|фидер|поплавок|донка|жерлицы|мормышка|балансир|блесна|нахлыст|троллинг),
           seasons[], baits[], lures[], rig, technique (2–4 sentences), gear (rod/line/hook sizes)},
lifehacks[] (3–6, concrete and regional),
edible{quality: 1–5, bones: text, opisthorchiasis_risk: high|medium|low|none, safe_preparation: text, best_dishes[]},
handling (unhooking, keeping alive, releasing, legal note),
provenance{field: measured|official|reference|generated}
```

### spots.json — 40–70 spots inside the circle

Rules: every spot must lie on or within 300 m of a water feature in `water.geojson` (assert it); distribute across rivers, oxbows, lakes, ponds, and 6–10 paid ponds; include winter (ice) spots. Prefer spots corroborated by ≥2 research sources; set `confidence` 0–3 and show it.

```
id, name, coords, water_osm_id, water_name, type (река|протока|старица|озеро|пруд|водохранилище|платник),
distance_km, drive_min (OSRM or estimate), access{car: text, foot: bool, boat: bool, winter: text},
features[] (бровка|яма|коса|перекат|коряжник|устье|плёс|заросли|плотина|мост|обрывистый берег|пологий берег),
species[] {id, rank 1–5, seasons[], methods[], note},
best_months[], best_hours_note, depth_note, notes (2–4 sentences: where to stand, where to cast, what to avoid),
lifehacks[] (1–3), paid{price_note, contact_hint, stocked_species[]} (for платник),
confidence 0–3, corroborated_by[] (source names only), provenance: generated
```

### advice.json

* Checklists per method × season (what to bring, incl. documents, ice picks, first-aid, tick protection May–June, "верхняя одежда ярких цветов на льду").
* Safety: лёд (thresholds, first ice / last ice rules, места с течением и родниками), гроза с удилищем, клещи (Омская область — эндемичный регион по энцефалиту; vaccination note), описторхоз (general), обезвоживание/солнце в июле, ночная рыбалка.
* Legal quick-facts: what a рыбинспектор may ask, how to measure a fish, how to count the daily limit, what to do with a protected species (release immediately).

## 6. Phase 4 — Chance model (`src/model/bite.ts`, documented in `docs/MODEL.md`)

Produce `chance(spot, species, datetime, weather, hydro)` → 0–100 and an ordered list of `factors[]` `{name, effect: -30..+30, reason}` so the UI can explain every score. It is a transparent heuristic, not a trained model — say so in the UI ("эвристика, не гарантия").

Inputs and how to use them (define exact weights in code, keep them in one table):

* Season: `activity_by_month`, spawning period (activity ↓ during spawn; and legality → score 0 with reason "нерестовый запрет").
* Time of day: `activity_by_hour` for openwater vs ice, blended with solunar major/minor windows (moon transit/underfoot ±1 h major, rise/set ±30 min minor) and civil twilight.
* Barometric pressure: 24 h and 72 h trend; stable or slowly falling = good, sharp rise after a front = bad, fast drop before a storm = short spike then bad; absolute pressure near seasonal norm = neutral.
* Wind: speed (light–moderate good, > 10 m/s bad, especially on lakes), direction relative to shore (onshore wind pushes food — good for whitefish), cold north wind after warm days = bad.
* Cloud/precipitation: overcast warm = good for predators; light rain fine; storm bad.
* Temperature change: sudden drops bad in summer; thaw days good in winter (except "глухозимье" January–February low oxygen in shallow lakes → strong ↓, and note "замор" risk).
* Water level/trend (if gauge nearby, ≤ 40 km): rising & muddy = bad for most, falling & clearing = good; high water in May–June pushes fish into floodplain.
* Ice season: first ice (перволёдье) and last ice = high; mid-winter low for most, налим high; ice thickness estimate gates safety, not chance.
* Spot–species fit: `species.rank` at the spot.

Also output `best_hours[]` for today and tomorrow, and a 7-day `daily_outlook[]` per species. Provide unit tests for edge cases (spawn ban → 0; missing weather → degrade gracefully with a "нет прогноза" factor).

## 7. Phase 5 — Product and UI

### Stack

Vite + React + TypeScript, MapLibre GL JS, SunCalc, a tiny state store (Zustand), TanStack Query for live fetches, no heavy UI kit, CSS with custom properties. PWA with a service worker: all `public/data` and tiles for the home viewport cached; last weather cached; the app must open and be useful with no signal on the river bank. Static build deployable to GitHub Pages or Vercel; document both.

### Information architecture (mobile-first; desktop = map + side panel)

1. Карта (home). Full-bleed map, bottom sheet on mobile (peek → half → full), side panel on desktop. Layers: water, spots (clustered, colored by today's chance), prohibited zones (hatched, only when active by date), gauges, infra (toggle), observations (toggle, off by default), satellite toggle. Filters as chips in one row: рыба, способ, расстояние, сезон. Search (spots, waters, species). Locate-me. A time scrubber (now → +48 h in 1-h steps, then daily to 7 d) that recolors spots live.
2. Место (spot sheet). Name, water, drive time, access. "Сегодня" verdict with chance and 3 top factors. Species ranked for the selected time with chance each. Tabs: Как ловить · Советы · Правила сегодня · Вода и погода. Rules tab reflects today's date: what is banned here now, min sizes, limits, nearby prohibited zone distance.
3. Рыба (species page). Photo with credit, aliases, ID marks and confusables. A 12-month activity ring or bar, an hourly activity/chance chart for today at a chosen spot (or the region default), spawning and ban window drawn on the same timeline. Methods by season, baits/lures, gear, lifehacks. Edibility and описторхоз block with safe preparation. Rules for this species. "Где ловить" → highlights waters/spots on map.
4. План (planner). Pick species (multi), method, when (today/tomorrow/weekend/date), shore/boat, max drive. Output: ranked spots with chance, best hours, what to bring; a compact conditions strip (temp, pressure sparkline 72 h, wind arrow, cloud, sunrise/sunset, moon). Share as a link (state in URL).
5. Календарь. Month grid: species peaks, spawning bans as bars, first/last ice typical windows, notable dates. Tap month → species list.
6. Правила и безопасность. Plain-language digest with the source and edition date, fines table, protected species gallery, safety sections.

### Interaction rules

* Verdict first, then reasons: every number is tappable to reveal its factors.
* One primary action per screen. Chips, not dropdowns. Touch targets ≥ 44 px. Text ≥ 16 px on mobile.
* Usable in sunlight: light theme by default outdoors, dark theme available, both with real contrast (WCAG AA; body text ≥ 7:1 on the light theme).
* Motion only in response to actions (sheet open, chip select, scrubber). No decorative animation. Respect `prefers-reduced-motion`.
* Empty and error states tell the person what to do ("Нет прогноза — включите интернет; данные о правилах и местах работают офлайн").
* Provenance badges: tiny, consistent, explained once on tap ("сгенерировано экспертной моделью, не измерение").

### Design brief

Before writing UI code, write `docs/DESIGN.md`: 4–6 named palette colors, two typefaces max with roles, a type scale, a layout concept (ASCII wireframes for mobile and desktop), and 5 principles specific to this product. Then critique it: if it reads like a generic dashboard or a generic "outdoors app", revise. Constraints: no warm-cream-plus-terracotta, no black-plus-acid-green, no identical rounded cards with the same shadow, no ALL-CAPS eyebrow labels, no middle-dot meta strings, no monospace-for-data-labels. Ground the look in the subject: Siberian rivers, ice, reed, birch, the gauge staff, the field guide. Let one element be the memorable thing (the chance-colored map, or the hourly chart) and keep the rest quiet. Screenshot yourself at 390×844 and 1440×900 after each screen and fix what looks wrong before moving on.

### Copy

Russian, plain, angler's vocabulary (бровка, коряжник, глухозимье, перволёдье). Sentence case. No marketing. Every button says what happens.

## 8. Phase 6 — Verification (`npm test`, `npm run qa`)

* Data QA script: every species has a licensed photo, 12 monthly and 24×2 hourly values, ≥ 1 method, ≥ 3 lifehacks, rules_ref resolved; every spot is within the circle and ≤ 300 m from water, has ≥ 1 species, has confidence; rules.json has edition_date and source_url; zones have dates; gauges have `measured_at`. Fail the build on violations.
* Model unit tests (see §6).
* Playwright: mobile and desktop flows for each job in §1 — load map, filter by щука, open a spot, open a species, run the planner, toggle offline (service worker) and reload. Save screenshots to `qa/screenshots/`.
* Performance: Lighthouse mobile ≥ 85 performance, ≥ 95 accessibility; first map paint < 2.5 s on a throttled 4G profile; data payload < 6 MB.
* Manual review pass: read every species page as an angler would; fix anything that sounds generic, wrong for the region, or unsafe.

## 9. Deliverables

* Running app (`npm run dev`), production build, deploy instructions for GitHub Pages and Vercel, daily data-refresh workflow.
* `README.md` in Russian for the end user (what it is, what is data vs generated, how to update rules) and in English for a developer.
* `research/SOURCES.md`, `research/FUNNEL.md`, `research/UX_NOTES.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/MODEL.md`, `docs/DESIGN.md`.
* A 60-second demo script in `docs/DEMO.md`: which spot to open, which species, which scrubber moment shows the map recoloring.

Definition of done: all six jobs in §1 can be completed on a phone without reading any documentation; nothing generated is presented as measured; QA passes; a stranger in Omsk would find at least three spots they recognize and one lifehack they didn't know.

## Amendments agreed with the owner before start (2026-09-22)

See `docs/DECISIONS.md` entries D-001…D-010: phase order (skeleton app early), 4-tab navigation instead of 6 screens, species list corrected for the Ob-Irtysh basin, rules edition honesty, geodata scope, no hillshade, offline tile zoom range, plain CSS with Radix primitives (no shadcn/Tailwind), CC-BY-NC photos flagged, parallel subagents for content, and the softened reading of the "no cards / no gray" design constraint.
