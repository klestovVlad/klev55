# Phase 1 — Source probes (2026-09-22)

All probes done with `curl` from a Mac (Omsk-independent network). Only observed facts are recorded. Times are UTC unless noted. Raw samples in `research/raw/`.

Legend: **live** = returns usable data; **degraded** = reachable but data stale/partial; **dead** = unreachable or decommissioned; **blocked** = reachable but refuses us.

---

## 1. Overpass API (OSM)

### 1a. overpass-api.de — **live** (with caveats)
- Fetched: `POST https://overpass-api.de/api/interpreter` (form field `data=`).
- **HTTP 406** on every request with curl's default User-Agent (body: Apache "Not Acceptable"). With `-A 'klev55-research/0.1 (email)'` → normal responses. **Always send a UA.**
- Rivers test `[out:json][timeout:60];(way["waterway"="river"]["name"](54.9,73.2,55.1,73.5););out tags 20;` → first attempt **504** (`Dispatcher_Client::request_read_and_idx::timeout … server is probably too busy`), retry → **200**, 18 ways. Russian `name` present on all (Иртыш, Омь, Замарайка); `name:ru` set on Иртыш/Омь, absent on small rivers; `name:en` sparse. Sample: `raw/overpass-rivers-sample.json`.
- Lakes test `nwr["natural"="water"]["name"](54.9,73.2,55.1,73.5);out tags 10;` → **200**, 9 elements (Забойчик, Кирпичка, озеро Солдатка, Карпятник, Синее озеро, Моховое, Медвежка, relation Чередовое). `water=lake` on ~half, rest untagged. Sample: `raw/overpass-lakes-sample.json`.
- Admin relation: the global query `relation["boundary"="administrative"]["admin_level"="4"]["name"="Омская область"]` → **504 ×3** (too busy; even bbox-scoped). Workaround: Nominatim `search?q=Омская область` → `relation 140292`; verified via `relation(140292);out ids tags;` → **200**: `name=Омская область, name:en=Omsk Oblast, ISO3166-2=RU-OMS, admin_level=4, wikidata=Q5835`. Sample: `raw/overpass-relation-140292.json`. **Relation id: 140292.**
- `/api/status`: `Rate limit: 2`, 2 slots.
- CORS: `Access-Control-Allow-Origin: *`, `Access-Control-Max-Age: 600`.
- License: ODbL (stated in every response body: "The data is made available under ODbL").
- Coverage: full planet; our 200 km circle fine. Update: minutely diffs.
- Verdict: use at **build time** with UA + retry/backoff + tiled queries; server is frequently "too busy" — plan Geofabrik PBF fallback as the brief says.

### 1b. overpass.kumi.systems — **dead**
- Fetched: `https://overpass.kumi.systems/api/interpreter` (POST and GET) → **000**, `Operation timed out` ×3 (60 s, 40 s, 25 s). DNS resolves (CNAME `overpass.private.coffee` → 193.219.97.30) but no TCP response.
- Verdict: drop; not a fallback.

## 2. OpenFreeMap — **live**
- Fetched: `https://tiles.openfreemap.org/styles/liberty` → **200** 43 079 B `application/json`; `/styles/positron` → **200** 25 153 B; `/styles/bright` → **200** 48 713 B.
- Styles reference `sources.openmaptiles.url = https://tiles.openfreemap.org/planet`, glyphs `…/fonts/{fontstack}/{range}.pbf`, sprite `…/sprites/ofm_f384/ofm`.
- TileJSON `https://tiles.openfreemap.org/planet` → tiles `https://tiles.openfreemap.org/planet/20260913_164504_pt/{z}/{x}/{y}.pbf`, minzoom 0, maxzoom 14, version 3.16.0 (tileset dated 2026-09-13 → weekly-ish rebuilds).
- CORS: `access-control-allow-origin: *`, `cache-control: public, max-age=86400`.
- License / terms (from https://openfreemap.org, **200**): "completely free … no limits on the number of map views or requests … no API keys"; commercial use allowed; no SLA. **Attribution required**: `OpenFreeMap © OpenMapTiles Data from OpenStreetMap` (MapLibre adds it automatically; OpenFreeMap part optional). Project code MIT; data ODbL.
- Verdict: primary basemap, **client-side**. Cyrillic labels present (OpenMapTiles `name` / `name:ru`).

## 3. CartoDB raster fallback — **live**
- Fetched: `https://a.basemaps.cartocdn.com/light_all/8/171/82.png` → **200** 9 219 B `image/png`.
- CORS: `access-control-allow-origin: *`, `access-control-allow-credentials: true`.
- License: not checked on page (CARTO basemaps terms require attribution "© OpenStreetMap contributors © CARTO"; free for non-commercial/low volume — verify before launch).
- Verdict: fallback raster only, client-side.

## 4. Esri World Imagery — **live**
- Fetched: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/8/82/171` → **200** 13 857 B `image/jpeg`.
- CORS: `Access-Control-Allow-Origin: *`.
- Service metadata `…/World_Imagery/MapServer?f=json` → `copyrightText: "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community"`.
- Item page `https://www.arcgis.com/sharing/rest/content/items/10df2279f9684e4a9f6a7f08febac2a9?f=json` → **200**: `licenseInfo: "This work is licensed under the Esri Master License Agreement … This layer is not intended to be used to export tiles for offline."` (`https://www.esri.com/en-us/legal/terms/full-master-agreement` → 301 redirect, not followed).
- Attribution requirement (one line): show the `copyrightText` string on-map; no bulk export/caching of tiles; usage governed by Esri Master License Agreement (free tier for public-facing non-commercial apps is the usual reading — flag for owner).
- Verdict: optional satellite layer, client-side, attribution on-map, no tile caching.

## 5. OSRM public demo — **live**
- Fetched: `https://router.project-osrm.org/route/v1/driving/73.37,54.99;73.60,54.50?overview=false` → **200**, `code: Ok`, duration **4771.6 s** (79.5 min), distance 68 576 m. Sample: `raw/osrm-route-sample.json`.
- Table: `https://router.project-osrm.org/table/v1/driving/73.37,54.99;73.60,54.50;74.35,55.05;72.90,55.40?sources=0&destinations=1;2;3&annotations=duration,distance` → **200**, durations `[4771.6, 5554.8, 5916.9]`, distances `[68576.5, 78208.8, 74490.4]`.
- CORS: `access-control-allow-origin: *`, methods GET.
- License: demo server, no SLA, "for demo/testing" per project docs (not re-verified this run); data ODbL.
- Update: routing graph from OSM, refreshed by maintainers (unknown cadence).
- Verdict: use at **build time** to precompute drive time from Omsk to each spot (table service, batches); do not call from client. Fallback: straight-line × 1.3.

## 6. Open-Meteo — **live**
- Forecast: `https://api.open-meteo.com/v1/forecast?latitude=54.99&longitude=73.37&hourly=temperature_2m,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,precipitation,weather_code&daily=sunrise,sunset&forecast_days=16&timezone=Asia/Omsk` → **200** 24 726 B. 384 hourly rows (2026-09-22T00:00 … 2026-10-07T23:00), grid point 55.0088/73.3267, elevation 90 m, `utc_offset_seconds 21600`. Units: °C, hPa, km/h, °, %, mm, WMO code. Daily sunrise/sunset as local ISO strings. Sample: `raw/open-meteo-forecast-sample.json`.
- Models (`&models=`): `best_match` 384/384 non-null; `gfs_seamless` 384/384; `icon_seamless` **187/384** (ICON gives ~7.8 days only for Siberia); `ecmwf_ifs025` 369/384. → Use `best_match`; ICON not usable for 16-day horizon here.
- `&past_days=30` → **200**, 1 104 rows (2026-08-23 … 2026-10-07) — works, so recent past can come from the forecast API in one call.
- Archive: `https://archive-api.open-meteo.com/v1/archive?latitude=54.99&longitude=73.37&start_date=2026-08-20&end_date=2026-09-20&daily=temperature_2m_mean,temperature_2m_min,temperature_2m_max&timezone=Asia/Omsk` → **200**, 32 days, 0 nulls (means 16.7 … 14.5 °C). Sample: `raw/open-meteo-archive-sample.json`.
- CORS: both hosts `access-control-allow-origin: *`, GET/POST/OPTIONS.
- License (https://open-meteo.com/en/terms, **200**): data **CC-BY 4.0**; free tier is **non-commercial only** ("private or non-profit websites or apps that do not have subscriptions or advertising"); limits **600/min, 5 000/h, 10 000/day, 300 000/month**.
- Update: forecast hourly; archive ~5-day lag (ERA5) but our 2026-09-20 end date returned data, so a shorter lag on this endpoint.
- Verdict: **client-side** for forecast (per-spot on demand, with caching) and **build-time** archive for degree-day/ice model. Attribution "Weather data by Open-Meteo.com (CC-BY 4.0)".

## 7. allrivers.info — **degraded** (reachable, but Omsk gauges stale)
- `https://allrivers.info/gauge/irtysh-omsk` → **200** 53 797 B text/html (saved: `raw/allrivers-irtysh-omsk.html`). Page text: "Дата измерений **13 мая 2024** · Источник данных Центр регистра и кадастра · Дата проверки 15 мая 2024 11:05 · Уровень воды: 211 см". No water temperature or ice value rendered for this gauge.
- `https://allrivers.info/gauge/irtyish-rp-cherlak` → **200**; same stale date 13.05.2024, level 538 см.
- `https://allrivers.info/gauge/om-omsk` → **200** but **no measurement block at all** (only reference info: coords 55.0000,73.4000, zero of gauge 66.22 m BS). Upstream Омь gauges listed on that page (с. Крещенское, с. Чумаково, г. Куйбышев — Novosibirsk oblast) show **22.09.2026** (fresh), г. Калачинск 13.05.2024.
- Tara: `/gauge/irtysh-tara` → 404; correct slug **`/gauge/irtyish-tara`** → **200**, date 13.05.2024, level 496 см. Also `/gauge/irtyish-ust-ishim` → 200, **20 июня 2025**, source "Тюменский ЦГМС", level 624; `/gauge/irtyish-tevriz` 13.05.2024. Other Omsk-area Irtysh slugs (novaya-stanica, krasnoyarka, tatarka, ekaterininskoe, petrovka, kartashovo) → 200 but no measurement block.
- Machine-readable: none public. App bundle `build/assets/app-DzRJnLf7.js` calls `axios.post("/get_brief_charts",{item:id},{headers:{Authorization:"Bearer "+hash}})` — needs an auth hash from a prior login call. `GET /get_brief_charts?gauge=…` → **404**; `POST /get_brief_charts` → **419 "CSRF token mismatch"**. `/waterlevel` sub-page has no inline data arrays. "AllRivers PRO" paywalls full data.
- CORS: no `Access-Control-Allow-Origin` header on gauge pages.
- License: none stated; data attributed to "Центр регистра и кадастра" / regional ЦГМС.
- Verdict: **do not depend on it** for Omsk. Inside the circle the last measurement is 13.05.2024 (>2 years). Keep a build-time HTML scraper only as a "if it comes back" hook, always showing "данные устарели: <date>". Ust-Ishim (outside circle, 2025) is the freshest Irtysh reading in Omsk oblast.

## 8. gmvo.skniivh.ru (АИС ГМВО) — **dead (decommissioned)**
- `https://gmvo.skniivh.ru/` and `…/index.php?id=1|100|151|165|180|200` → all **200** 9 720 B, identical page: title "Федеральное агентство водных ресурсов", body: **"Данный ресурс выведен из эксплуатации. Текущая информационная система будет работать в составе ГИС ЦП Вода. Для получения доступа к сегментам в ГИС ЦП Вода закрытого контура следуйте приложенной инструкции"** + links to Континент TLS client setup PDFs (rwec.ru). No forms, no JSON/CSV.
- Verdict: gone; successor is a closed-contour system requiring certified TLS client. Drop.

## 9. omsk-meteo.ru (Обь-Иртышское УГМС) — **live, HTML prose only**
- `http://omsk-meteo.ru/` → 200 → redirects to `/index.php/ru/` (Joomla), 395 KB. No RSS/JSON links in HTML; `…/?format=feed&type=rss` and `…/novosti?format=feed&type=rss` → **404**; `/rss`, `/feed`, `/rss.xml` → not found.
- Hydrology pages found: `/index.php/ru/home/vesennee-polovode-i-dozhdevye-pavodki-2025/o-tekushchej-i-ozhidaemoj-gidrologicheskoj-obstanovke-po-territorii-otvetstvennosti` and `…/o-neblagopriyatnykh-i-opasnykh-yavleniyakh-na-rekakh-ozerakh-i-vodokhranilishchakh-ezhednevno-v-vide-tablitsy` → both **200** (~580 KB, mostly menu). `articleBody` = **prose monthly review** ("Краткий обзор гидрологических условий в июне 2026 года…"), 0 `<table>`, 0 PDF/XLS links. Mentions Иртыш (с. Усть-Ишим – п. Сибирский), Тара, Уй, Шиш qualitatively.
- Weekly weather forecasts as news items (latest `novosti/3490-prognoz-pogody-po-omskoj-oblasti-na-21-25-sentyabrya-2026-goda`).
- CORS: not checked (irrelevant — no API).
- Verdict: skip for data; optionally link to it as "официальный бюллетень" in the ice/hydrology panel.

## 10. FishBase — **dead (rOpenSci API)**, web mirror live
- `https://fishbase.ropensci.org/species?Genus=Esox&Species=lucius` → curl **SSL error 60** (server presents `CN=TRAEFIK DEFAULT CERT`, self-signed, notBefore 2026-09-22). With `-k` → **404 "404 page not found"**. `https://fishbase.ropensci.org/` → same cert error. API is effectively gone.
- `https://fishbaseapi.readme.io` → 302 → `/reference` → **200** docs shell (ReadMe "Getting Started"); docs only.
- Workaround checked: `https://www.fishbase.se/summary/Esox-lucius.html` → **200** 66 KB HTML; contains "Max length : 137 cm FL male/unsexed", environment block. Scrapable per species (~30 pages) but FishBase web terms restrict bulk reuse (CC-BY-NC per FishBase footer — not re-verified this run).
- Verdict: no API. For species traits use Wikidata/Wikipedia + hand-curated values with `generated`/`reference` provenance; optionally cite fishbase.se page URLs per species (link only).

## 11. GBIF occurrence API — **live**
- Key resolution: `species/match?name=Actinopterygii` → `matchType: NONE` (also with `rank=CLASS`). Current GBIF backbone has **no class for ray-finned fishes** — `species/2346633` (Esox lucius) shows `class: null, classKey: null`, parents = Animalia(1) › Chordata(44) › Esociformes(548) › Esocidae(7662) › Esox(2346628). `classKey=204` → 0 results.
- Workaround: facet Chordata occurrences in our polygon by `orderKey`, keep fish orders: **Perciformes 587 (48), Cypriniformes 1153 (42), Esociformes 548 (2), Salmoniformes 1313 (1)**; plus Siluriformes 708.
- Final query: `GET https://api.gbif.org/v1/occurrence/search?orderKey=587&orderKey=1153&orderKey=548&orderKey=1313&orderKey=708&geometry=POLYGON((71.5 53.2,75.3 53.2,75.3 56.8,71.5 56.8,71.5 53.2))&limit=5&facet=speciesKey&facet=datasetKey&facet=year` → **200**, **count 94**. Sample: `raw/gbif-occurrence-sample.json`.
- Sample fields: `species, scientificName, taxonKey, speciesKey, eventDate, year/month/day, decimalLatitude, decimalLongitude, coordinateUncertaintyInMeters, basisOfRecord (HUMAN_OBSERVATION), license (CC BY-NC 4.0 / CC BY 4.0 URLs), datasetName ("iNaturalist research-grade observations"), datasetKey, recordedBy, media[] (photo URLs), references, stateProvince, iucnRedListCategory, occurrenceID, gbifID`.
- Facets: datasets — iNaturalist 57, `bb5b30b4…` 23, `988007b1…` 12, two singletons. Years: 2026:18, **1904:13**, 2025:9, 2006:7, 2024:6, … (a museum batch from 1904). Top speciesKeys: 2390064 (15), 8140485 (8), 2359706 (7), 2366634 (6), 4409643 (5)…
- CORS: `access-control-allow-origin: *`.
- License: per-record `license` field (CC0 / CC BY / CC BY-NC); GBIF API terms require citing dataset DOIs for downloads (search API results fine with per-record attribution).
- Update: continuous.
- Verdict: **build time**, small (94 rows for the bbox), use as `measured` "научные наблюдения" layer and presence sanity check. Mostly duplicates iNat.

## 12. iNaturalist API — **live**
- `https://api.inaturalist.org/v1/observations?taxon_id=47178&nelat=56.8&nelng=75.3&swlat=53.2&swlng=71.5&photo_license=cc-by,cc-by-nc,cc-by-sa,cc0&per_page=5&locale=ru` → **200** 165 KB, **total_results 70** (73 without license filter). Sample: `raw/inat-observations-sample.json`.
- Sample rows: Abramis brama / "Обыкновенный лещ" / 2026-05-07 / research; Carassius gibelio / "Серебряный Карась"; Cyprinus carpio / "Карп"; Perca fluviatilis / "Речной окунь". Photo objects carry `license_code` (`cc-by-nc`), `attribution` ("(c) Igor Smorodin, some rights reserved (CC BY-NC)"), `url` (`…/photos/<id>/square.jpg`, swap for `medium`/`large`).
- **Russian common names present** via `taxon.preferred_common_name` with `locale=ru` (e.g. "Обыкновенная щука", "Сибирская плотва", "головешка-ротан").
- `observations/species_counts` (same bbox, locale=ru) → 23 species: ротан 15, серебряный карась 9, окунь 6, лещ 5, язь 5, золотой карась 4, сибирская плотва 4, карп 3, щука 2, озёрный гольян 2, судак 1, уклейка 1, ёрш 1 (+ aquarium strays: Тернеция, Betta).
- `https://api.inaturalist.org/v1/taxa?q=Esox%20lucius&locale=ru` → **200**: id **55387**, `preferred_common_name` "Обыкновенная щука", `wikipedia_url` (en), `default_photo.license_code: null` ("all rights reserved") — so default photos are NOT always reusable; filter by license.
- CORS: `Access-Control-Allow-Origin: *`.
- License: photos per `license_code`; API terms: rate ≤ 1 req/s recommended, ≤ 10 000/day; attribute observers.
- Update: continuous.
- Verdict: **build time** (73 obs for whole bbox → tiny). Best source of RU common names and regionally-looking CC photos (mostly CC BY-NC — fine for a non-commercial project; note in attribution).

## 13. Wikipedia / Wikidata / Commons — **live**
- `https://ru.wikipedia.org/api/rest_v1/page/summary/Обыкновенная_щука` (percent-encoded) → **200**: redirects to title **"Щука"**, `wikibase_item: Q165278`, `thumbnail {source: …/Hecht.jpg/330px-Hecht.jpg, 330×204}`, `originalimage`, `extract` (plain text, ru), `extract_html`, `description`, `content_urls`. Sample: `raw/wikipedia-summary-pike.json`. CORS `*`.
- Wikidata search `wbsearchentities&search=Esox lucius&language=en` → **Q165278** ("pike, species of fish"). Entity `https://www.wikidata.org/wiki/Special:EntityData/Q165278.json` → **200** 113 KB: `P18` = `["Hecht.jpg","Esox Lucius.JPG"]`, `P938` FishBase id **258**, `P846` GBIF **2346633**, `P3151` iNat **55387**, `P850` WoRMS 154210, `P225` "Esox lucius", `P1843` ru common name "щука", ruwiki sitelink "Щука". CORS `*`. (Note: the task's guess Q178006 is not Esox lucius.) Sample: `raw/wikidata-Q165278-sample.json`.
- Commons `https://commons.wikimedia.org/w/api.php?action=query&titles=File:Hecht.jpg&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=400&format=json&origin=*` → **200**: `thumburl` (served as 500px bucket), `descriptionurl`, extmetadata: **`LicenseShortName: CC BY-SA 3.0`**, `License: cc-by-sa-3.0`, `LicenseUrl`, `AttributionRequired: true`, **`Artist: ""` (empty)**, `Credit: ""`. → Artist can be empty; fall back to descriptionurl link as attribution. Sample: `raw/commons-imageinfo-Hecht.json`. CORS `*` (with `origin=*`).
- License: text CC BY-SA 4.0 (Wikipedia), Wikidata CC0, images per file.
- Verdict: **build time** per species: ru summary + QID cross-links (FishBase/GBIF/iNat ids) + Commons image with license string. Handle empty Artist.

## 14. Rospotrebnadzor — описторхоз — **live**
- Search (WebSearch, domains rospotrebnadzor.ru/55./cgon.) surfaced federal and regional pages; **55.rospotrebnadzor.ru** search returned only administrative pages, no dedicated описторхоз page.
- Opened: `https://cgon.rospotrebnadzor.ru/naseleniyu/infektsionnye-i-parazitarnye-zabolevaniya/parazitarnye-zabolevaniya/opistorkhoz/` → **200** 70 751 B. Verbatim recommendations saved to `raw/opisthorchiasis.md`; HTML in `raw/rpn-cgon-opistorkhoz.html`.
- Key numbers (federal ЦГОН): freeze ≤ −20 °C ≥ 24 h or ≤ −35 °C ≥ 15 h; strong salt 2 kg/10 kg: 10 / 21 / 40 days by species+size (язь/лещ/линь >25 см — 40 сут); boil ≥ 20 min from boiling; fry small pieces 15–20 min; pies ≥ 1 h; dry 3 weeks after 3-day salting.
- Verdict: encode into `edible.safe_preparation` with this URL as source.

---

## Cross-cutting notes
- Everything that matters for the client (OpenFreeMap, Carto, Esri, Open-Meteo) has CORS `*`. Overpass/OSRM/GBIF/iNat/Wiki also `*` but belong at build time for rate/robustness reasons.
- **Live hydrology for Omsk is effectively unavailable**: ГМВО decommissioned, allrivers Omsk gauges frozen at 13.05.2024, УГМС prose only. The ice-thickness "generated" estimate from Open-Meteo degree-days becomes the primary winter signal; UI must say so.
- Overpass needs a UA header (406 otherwise) and retry on 504.
- GBIF fish need `orderKey` lists, not a class key.
