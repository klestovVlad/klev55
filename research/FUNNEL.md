# Phase 1 — Decision matrix (2026-09-22)

| # | Source | Status | License / terms | CORS | Fetch at | Use for | Verdict |
|---|---|---|---|---|---|---|---|
| 1a | Overpass API (overpass-api.de) | live (needs UA; 504 "too busy" ~50% of first tries) | ODbL | `*` | build | rivers, lakes, POI, admin boundary (rel 140292), bridges/dams | **Use.** UA + backoff + tiled bbox queries; Geofabrik PBF fallback. |
| 1b | Overpass kumi.systems | dead (timeout ×3) | — | — | — | — | Drop. |
| 2 | OpenFreeMap vector tiles (liberty/positron/bright) | live | free, no key, no limits; attribution "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" | `*` | client | basemap | **Use** as primary basemap (positron or liberty). |
| 3 | CartoDB raster light_all | live | CARTO attribution required (terms not re-read) | `*` | client | raster fallback | Keep as fallback only. |
| 4 | Esri World Imagery | live | Esri Master License Agreement; on-map "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community"; no offline export | `*` | client | satellite toggle | Optional layer; attribution string on map; no caching. Flag to owner. |
| 5 | OSRM demo router | live (route 4772 s; table OK) | demo server, no SLA; OSM ODbL | `*` | build | drive time Omsk→spot (table service) | **Use at build**; fallback straight-line × 1.3. |
| 6a | Open-Meteo forecast (best_match/gfs full 16 d; icon 7.8 d; ecmwf 15 d; past_days=30 OK) | live | CC-BY 4.0; non-commercial, 10k/day | `*` | client (cached) | 16-day hourly weather, pressure trend, sunrise/sunset | **Use**, `best_match`. Attribution required. |
| 6b | Open-Meteo archive | live (0 nulls to 2026-09-20) | same | `*` | build (daily job) | degree-days → ice estimate; 30-day pressure/temperature history | **Use.** |
| 7 | allrivers.info gauges | degraded — Omsk gauges last measured 13.05.2024; om-omsk empty; no public JSON (auth+CSRF) | none stated | none | build (HTML scrape) | water level (if it ever updates) | Keep a dormant scraper with "данные устарели: <date>"; don't design around it. Slugs: irtysh-omsk, irtyish-rp-cherlak, irtyish-tara, irtyish-ust-ishim. |
| 8 | АИС ГМВО gmvo.skniivh.ru | dead — "выведен из эксплуатации", moved to closed ГИС ЦП Вода | — | — | — | — | Drop. |
| 9 | omsk-meteo.ru (УГМС) | live, prose only (monthly hydrological review, weekly forecasts); no RSS/JSON | not stated | n/a | — | link-out only | Link as "официальный бюллетень"; no data. |
| 10 | FishBase rOpenSci API | dead (bad TLS cert, 404) | — | — | — | — | Drop API. fishbase.se HTML pages live (link per species; no bulk scrape). |
| 11 | GBIF occurrence API | live (94 fish records in bbox via orderKeys 587,1153,548,1313,708) | per-record CC0/CC BY/CC BY-NC; cite datasets | `*` | build | "научные наблюдения" layer, presence check | **Use** (small). Note 1904 museum batch. |
| 12 | iNaturalist API | live (70 CC-licensed obs, 23 spp, RU names via locale=ru) | photos per `license_code` (mostly CC BY-NC); attribute observer | `*` | build | RU common names, regional photos, presence | **Use.** Filter `photo_license`; store `attribution`. |
| 13 | ru.wikipedia REST + Wikidata + Commons | live (Q165278; P18 Hecht.jpg CC BY-SA 3.0, Artist empty) | text CC BY-SA; Wikidata CC0; images per file | `*` | build | species summaries, cross-IDs (FishBase 258 / GBIF 2346633 / iNat 55387), images+license | **Use.** Handle empty Artist → link to descriptionurl. |
| 14 | Rospotrebnadzor ЦГОН описторхоз page | live | public information page | n/a | build (static text) | `edible.safe_preparation` | **Use**; text saved in raw/opisthorchiasis.md. 55.rospotrebnadzor.ru has no dedicated page. |

## Consequences for Phase 2
1. **No live water level/temperature for Omsk.** Hydrology panel = Open-Meteo-derived estimates (`generated`) + optional stale allrivers reading with explicit date + link to УГМС bulletin.
2. Client-side runtime calls only to Open-Meteo and tile servers; everything else precomputed into `public/data/`.
3. Overpass pipeline must send a User-Agent, retry on 504, and split the 200 km circle into tiles; keep `osmium` on a Geofabrik `siberian-fed-district` extract as plan B.
4. GBIF query must use `orderKey` list (no class key exists for fishes in current backbone).
5. Species reference chain: Wikidata QID → ru.wikipedia summary + Commons image (with license) + iNat taxon (RU name, CC photo) + GBIF/iNat occurrences; FishBase only as an outbound link.
