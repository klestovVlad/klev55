# Progress

_Read this first after any context reset. Then BRIEF.md and DECISIONS.md._

## Status (2026-09-22, end of day) — DONE, v0.1

- [x] Research: research/SOURCES.md, FUNNEL.md, RULES_RAW.md (ред. 08.06.2026, 56 ям), SPOTS_CANDIDATES.md (88), UX_NOTES.md
- [x] Data pipeline: water.json (1777 features, KZ mask), admin.geojson, rules.json + zones.geojson (29 pits in circle), gauges.json (ice estimate + stale allrivers), observations.geojson (70), species.json + species-index.json (28, all photos licensed), spots.json (56: 5 paid, 34 ice, OSRM drive times), advice.json (14 checklists, 21 sections)
- [x] Model: src/model (22 unit tests), docs/MODEL.md
- [x] UI: map (chance dots, clusters, zones, water tap, search, filters, scrubber), spot sheet (verdict, hour chart, 7-day outlook, rules today, water/ice), water sheet, species list + calendar + pages, planner (URL state, share), rules/safety/about, light/dark, PWA offline
- [x] QA: `npm run qa` ok (payload 2.62 MB); e2e 14/14 mobile+desktop incl. offline reload (qa/screenshots/); Lighthouse mobile perf 86 / a11y 100 / best-practices 96 (qa/lighthouse.json)
- [x] Docs: README (RU+EN), DESIGN, MODEL, DEMO, DECISIONS D-001…D-025; CI: deploy-pages.yml, refresh-data.yml; vercel.json

## Exact next step (if work continues)

1. Add 1–5 more paid ponds once their water bodies are mapped in OSM (brief asks 6–10; we have 5).
2. Snap зимовальные ямы polygons to the Irtysh centreline instead of straight-segment buffers.
3. Per-cell weather for the map (Open-Meteo multi-location request) instead of one regional forecast.
4. Manual read-through of all 28 species pages by a local angler; tune `activity_by_*` curves.

## Known problems

- overpass-api.de refuses connections from this IP after the initial 504 storm; pipeline uses overpass.openstreetmap.fr (works). Cached responses in scripts/.cache.
- No live hydrology for the Irtysh (allrivers last measured 2024-05-13; АИС ГМВО closed) — shown honestly with dates.
- The in-app Browser pane sometimes captures the WebGL canvas blank; Playwright screenshots and DOM queries confirm rendering.
- Lighthouse LCP is the verdict text at ~4 s on simulated 4G; further gains need a smaller React bundle or SSR of the verdict.

## Update 2026-09-22 14:20

Done: research (3 agents), model + 21 tests, DESIGN.md + tokens, rules.json + zones.geojson (29 pits), observations.geojson (70 pts), gauges.json (ice estimate = none in September; allrivers stale 2024-05-13), advice.json (content/), species content in progress (4 agents), scripts: build-water (tiled Overpass; overpass-api.de blocked our IP → using overpass.openstreetmap.fr), build-species (photos), nearest-water, validators.
In progress: build-water running in background; species agents.
Next: when water.json exists → launch 2 spot-author agents (content/SPOT_AUTHOR_BRIEF.md); write build-spots.ts (nearest water ≤300 m assert, OSRM table), build-data.ts, qa-data.ts; then UI.
Known problems: overpass-api.de refuses connections from this IP (ban after 504 retries); Overpass .fr mirror works. TypeScript 7 removed baseUrl (fixed).

## Update 2026-09-22 15:05

Done: all 28 species (content + photos, 28/28 licensed), water.json (1777 features, 1.35 MB), admin.geojson, UI screens: map (chance dots, zones, water, search, filters, scrubber), spot sheet (verdict, hour chart, 7-day outlook, tabs), species list + calendar + species page, planner (URL state), rules (3 tabs). Dev preview works after `optimizeDeps.exclude: ['maplibre-gl']` (worker 404 otherwise).
In progress: 2 spot-author agents (content/spots/*.json); build-water rerun for KZ jurisdiction (name:ru fix).
Next: build-spots (nearest water ≤300 m, OSRM), then screenshots at 390×844 / 1440×900, fix layout; qa-data.ts; PWA check; README, DEMO.md; Playwright smoke; Lighthouse.
Known: overpass-api.de blocks our IP; using overpass.openstreetmap.fr. No live hydrology (documented in UI). Photo licenses include CC BY-SA 2.5/3.0/4.0, CC BY 3.0, PD — no NC so far.

## Update 2026-09-22 16:00

Done: spots batch 2 (26 files), pipeline build-spots verified (OSRM ok), KZ mask (SKO + Pavlodar), model recalibrated (base 38), perf split (maplibre chunk 1.05 MB, index 0.4 MB, lazy screens), README, DEMO.md, CI workflows, Playwright config (Chromium mobile/desktop), Lighthouse script.
In progress: spots batch 1 agent (city/south/paid, ~30 files); e2e mobile run.
Next: build-spots on the full set → qa → e2e both projects → lighthouse → fix findings → final PROGRESS/commit. Then manual content review pass (species texts) and screenshot pass 390/1440 light+dark.

## Update 2026-09-22 17:10

Done: 56 spots built (5 paid, 34 ice), QA passes (2.58 MB), e2e 14/14 (mobile + desktop, offline test included), custom bottom sheet, cluster labels fixed, Lighthouse mobile: perf 39 → 66 after lazy map + deferred water.json; a11y 100, best-practices 96.
In progress: FCP/LCP work (static shell in index.html, data preloads) → target perf ≥ 85.
Next: rerun lighthouse + e2e; screenshot pass (light/dark, 390/1440) → qa/screenshots; manual content review; final README/PROGRESS; commit.

## Update 2026-09-22, evening

Added after v0.1: weather grid (D-026/027) with the map overlay on by default; infrastructure layer (D-028); drive-time filters (D-029); best window in rows (D-030); shadows removed from map controls; water always under spot bubbles; PWA install button. QA ok (payload 2.70 MB), e2e 14/14, Lighthouse perf 86.

Deployed 2026-09-22 to GitHub Pages: https://klestovvlad.github.io/klev55/ (repo klestovVlad/klev55, workflow deploy-pages.yml; Pages site created via `gh api -X POST repos/.../pages -f build_type=workflow`). Live check: map loads, data and worker served, 404.html fallback for client routes.
