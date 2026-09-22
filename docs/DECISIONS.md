# Decisions log

One line each: what, why, alternative rejected. IDs are stable; refer to them from code comments and PROGRESS.md.

| ID | Decision | Why | Rejected |
|----|----------|-----|----------|
| D-001 | Build order: short research → app skeleton with ~6 species / ~10 spots → widen content → model → QA. | A running product early reduces the risk of "lots of JSON, half a UI". Owner prefers working result first. | Brief's strict phase order. |
| D-002 | Mobile navigation has 4 tabs: Карта, План, Рыбы, Правила. Calendar lives inside Рыбы; safety inside Правила. | Six top-level screens overload a phone bottom bar. All six jobs from §1 stay reachable. | 6 screens as in brief. |
| D-003 | Species list corrected for the Ob-Irtysh basin: no голавль, жерех, берш; сом shown only as "rare reports, not a target". Target ~28 species. | These species are not native to the basin; including them would be presenting fiction as data. | 35 species incl. verify-list. |
| D-004 | Rules: encode Приказ № 646 from the newest edition actually opened; `edition_date` is that edition; UI shows "проверьте актуальность". Never claim an edition we did not see. | consultant.ru is usually inaccessible; honesty rule 4. | Claiming the 08.06.2026 edition blind. |
| D-005 | Geodata scope: named rivers, lakes above an area threshold, everything within ~30 km of Omsk in detail; geometry simplified to fit < 6 MB. | 200 km circle ≈ 125k km²; full OSM water pull is hundreds of MB. | Full Overpass pull. |
| D-006 | No hillshade / terrain layer. | Omsk oblast is flat; tiles cost bytes and add nothing. | AWS terrarium hillshade. |
| D-007 | Offline: cache app data, last weather, vector tiles for zooms 7–11 over the region only. | Full-zoom offline map does not fit a sane cache. | All zooms. |
| D-008 | Styling: plain CSS custom properties + Radix primitives (Tabs, Dialog, Popover), cmdk for search, vaul for bottom sheet. No shadcn, no Tailwind. | Keeps accessibility wins of Radix without inheriting the dashboard look; smaller bundle. | shadcn/ui + Tailwind. |
| D-009 | CC-BY-NC photos allowed but flagged `nc: true` so they can be swapped if the product ever goes commercial. | Brief allows NC; owner should know the constraint. | Skipping NC photos. |
| D-010 | Design constraint "no identical cards / no gray / no dashboard" is read as: one elevation system, neutral base + 2–3 subject colors, cards only for lists of peers (planner results), verdict and rules are typography not cards; the conditions strip may look like a dashboard. | The ban targets missing hierarchy, not the shapes. Familiar controls matter more for an angler in gloves than novelty. | Literal reading of the ban. |
| D-011 | Content for species and spots is written by parallel subagents against a strict JSON schema, then validated by the QA script. | 28 species × 5 text blocks is too slow sequentially. | Sequential authoring. |
| D-012 | Project lives in `~/Projects/klev55`; package name `klev55`. | Nothing existed; short ASCII name. | Cyrillic dir name. |
| D-013 | Пять озёр (Данилово, Ленёво, Щучье) excluded; Шайтан allowed if inside 200 km. | Данилово is 213 km away and in Novosibirsk oblast; Ленёво/Щучье 205–210 km. The 200 km rule is strict for spots. | Widening the circle to 220 km for that cluster. |
| D-014 | Сом dropped from species; форель радужная added (paid ponds). Канальный сомик in paid ponds is mentioned only in `paid.stocked_species`. | No wild catfish reports in the circle; trout is a real paid-pond target. | Listing сом as "rare". |
| D-015 | Overpass endpoint: overpass.openstreetmap.fr first, lz4/main as fallbacks; 1° tiles; 4 s pacing; disk cache. | overpass-api.de returned 504 under load and then refused connections from this IP. | Geofabrik PBF + osmium (not installed). |
| D-016 | Vite `optimizeDeps.exclude: ['maplibre-gl']`. | MapLibre 6 resolves its worker via `new URL(..., import.meta.url)`; pre-bundling 404s it in dev (blank map). | Setting `maplibregl.setWorkerUrl` manually. |
| D-017 | Basemap styles: OpenFreeMap `positron` (light) and `fiord` (dark); labels forced to `name:ru`. | Sunlight readability on light; dark for night; bilingual labels are noise for the persona. | `liberty` style. |
| D-018 | Weather: one regional Omsk forecast drives the map and lists; a per-spot forecast (rounded to 0.25°) loads when a spot sheet opens. | Keeps map recolouring instant and API usage low; the steppe is flat so regional weather is a fair first approximation. | Per-spot forecast for every dot. |
| D-019 | Ice: freezing-degree-day Stefan estimate at 3 climate points (Omsk, Krutinka lakes, Cherlak), thresholds from МЧС (7/10/15/30 cm), all badged `generated`. | No live ice bulletins are machine-readable. | Skipping ice entirely. |
| D-020 | Spawning bans are modelled as `restricted` (one rod from shore) not score 0, because that is what the приказ says; only full bans (species bans, зимовальные ямы) give 0. | Truth over the brief's simplification. | Score 0 for any spawn window. |
