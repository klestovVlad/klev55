# Progress

_Read this first after any context reset. Then BRIEF.md and DECISIONS.md._

## Status (2026-09-22)

- [x] Project dir, git init, BRIEF.md, DECISIONS.md
- [ ] Phase 1 research (SOURCES.md, FUNNEL.md, UX_NOTES.md) — IN PROGRESS
- [ ] App skeleton (Vite + React + TS)
- [ ] Data pipeline scripts
- [ ] Knowledge layer (species, spots, advice)
- [ ] Chance model + tests
- [ ] UI screens
- [ ] QA, PWA, docs, deploy

## Exact next step

Probe data sources in parallel (Overpass, OpenFreeMap, OSRM, Open-Meteo, allrivers, GBIF, iNat, Wikipedia, regulations), write research/SOURCES.md and FUNNEL.md.

## Known problems

- osmium / mapshaper / ogr2ogr / shapely not installed; geometry work must be done in Node (turf) or via npx mapshaper.

## Update 2026-09-22 14:20

Done: research (3 agents), model + 21 tests, DESIGN.md + tokens, rules.json + zones.geojson (29 pits), observations.geojson (70 pts), gauges.json (ice estimate = none in September; allrivers stale 2024-05-13), advice.json (content/), species content in progress (4 agents), scripts: build-water (tiled Overpass; overpass-api.de blocked our IP → using overpass.openstreetmap.fr), build-species (photos), nearest-water, validators.
In progress: build-water running in background; species agents.
Next: when water.geojson exists → launch 2 spot-author agents (content/SPOT_AUTHOR_BRIEF.md); write build-spots.ts (nearest water ≤300 m assert, OSRM table), build-data.ts, qa-data.ts; then UI.
Known problems: overpass-api.de refuses connections from this IP (ban after 504 retries); Overpass .fr mirror works. TypeScript 7 removed baseUrl (fixed).

## Update 2026-09-22 15:05

Done: all 28 species (content + photos, 28/28 licensed), water.geojson (1777 features, 1.35 MB), admin.geojson, UI screens: map (chance dots, zones, water, search, filters, scrubber), spot sheet (verdict, hour chart, 7-day outlook, tabs), species list + calendar + species page, planner (URL state), rules (3 tabs). Dev preview works after `optimizeDeps.exclude: ['maplibre-gl']` (worker 404 otherwise).
In progress: 2 spot-author agents (content/spots/*.json); build-water rerun for KZ jurisdiction (name:ru fix).
Next: build-spots (nearest water ≤300 m, OSRM), then screenshots at 390×844 / 1440×900, fix layout; qa-data.ts; PWA check; README, DEMO.md; Playwright smoke; Lighthouse.
Known: overpass-api.de blocks our IP; using overpass.openstreetmap.fr. No live hydrology (documented in UI). Photo licenses include CC BY-SA 2.5/3.0/4.0, CC BY 3.0, PD — no NC so far.
