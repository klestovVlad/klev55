# Author brief for spots (Клёв 55)

Output: one JSON file per spot in `content/spots/<id>.json`, matching `Spot` in `src/data/types.ts`. Leave `water_osm_id: null`, `distance_km: 0`, `drive_min: null`, `drive_source: "estimate"` — the build fills them. Validate with `npx tsx scripts/validate-spots.ts content/spots/<id>.json`.

## The hard constraint: coordinates

Every spot must be **on or within 300 m of a water feature in `public/data/water.geojson`**, otherwise the build fails. Workflow for each spot:
1. Decide the place from `research/SPOTS_CANDIDATES.md` (own-words descriptions) and your knowledge.
2. Geocode the village with Nominatim: `curl -s -A klev55 'https://nominatim.openstreetmap.org/search?q=<село>,+Омская+область&format=json&limit=3'` (1 request per second max).
3. Run `npx tsx scripts/nearest-water.ts <lon> <lat> [name filter]` — it prints the nearest water features, their distance and a **snapped point**. Use the snapped point (or a point you choose on that water) as `coords` = `[lon, lat]`. If the nearest water is >300 m, move the point onto the water. For a river spot, put the point on the riverbank line, not in the middle of the channel. For lakes, a point on the shore near the access road.
4. Never use coordinates copied from fishing forums (rule 8 of BRIEF.md). Coordinates come only from OSM geometry + your placement.
5. Do not place spots in Kazakhstan (`jurisdiction: kz`) nor in Novosibirsk oblast; skip anything outside the 200 km circle (Данилово, Ленёво, Щучье are outside — skip them).

## Content rules

- Russian, angler's voice, concrete: where to stand, where to cast, what to avoid, what depth, which bank. Use local words (бровка, коса, свал, коряжник, затон, старица, плёс, перекат).
- `species[]`: 2–6 entries with `rank` 5 = main target here … 1 = incidental; `seasons`, `methods` from the allowed lists; `note` one sentence specific to this spot ("судак стоит на свале у нижней оконечности косы, джиг 12–16 г").
- `confidence` 0–3: 3 = corroborated by ≥5 sources in SPOTS_CANDIDATES and a well-known place; 2 = 2–4 sources; 1 = one source or your own knowledge; 0 = a plausible guess. `corroborated_by` = source abbreviations from SPOTS_CANDIDATES (e.g. ["KP-best", "OM1-w"]) or `[]`.
- `ice_spot` true where people actually fish through the ice (затоны, озёра, тихие участки Иртыша), false for fast river sections and most paid ponds in winter.
- `paid` only for type "платник": price_note in words ("около 300–650 ₽ за день, уточняйте"), contact_hint (how to find: "на въезде в село, указатель"), stocked_species (Russian names).
- `access`: car ("асфальт до села, дальше 2 км грунтовки, после дождя нужен полный привод"), foot true/false, boat true/false, winter ("зимой чистят дорогу до берега" / "не чистят").
- `best_months` 1–12; `best_hours_note` one sentence; `depth_note` one sentence; `notes` 2–4 sentences; `lifehacks` 1–3 concrete, regional.
- `district`: the район name ("Омский район", "Крутинский район", "г. Омск").
- Rules: do not encode rules in spots; the app overlays зимовальные ямы and spawning bans itself. But if a spot lies next to a named зимовальная яма, say so in `notes` ("рядом Падинская зимовальная яма — с 15 ноября по 20 апреля ловить нельзя").
- Species ids must exist in `content/species/` (list the directory). Use only those ids.

## Coverage to reach as a team (see your assignment)

Rivers (Иртыш from Черлак to Большеречье, Омь, Оша, Тара lower reach), протоки/затоны/старицы near Omsk, lakes (Крутинские, Саргатские, Тюкалинские, Шербакульские, near-city), ponds, 6–10 paid ponds, and enough winter spots.
