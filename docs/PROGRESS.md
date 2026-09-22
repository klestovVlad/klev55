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
