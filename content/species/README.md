# Species content

One JSON file per species, validated by `npx tsx scripts/validate-species.ts content/species/*.json`.
Schema: `src/data/types.ts` → `Species` (photo is filled later by scripts/build-species.ts; authors set `photo: null`).
Everything here is `generated` unless a field is copied from rules (official) or a cited reference.
