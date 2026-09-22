/**
 * The single table of weights for the bite heuristic. Every number the UI shows
 * traces back to a row here. Documented in docs/MODEL.md. Values are score points
 * on a 0–100 scale; the neutral base is 50.
 */
export const W = {
  base: 38,
  /** Season: (activity_by_month − 5) × seasonScale → −20..+20 */
  seasonScale: 4,
  /** Hour: (activity_by_hour − 5) × hourScale → −25..+25; the hour matters more than the month on the day */
  hourScale: 5,
  solunar: { major: 8, minor: 4, twilight: 6 },
  spotRank: { 5: 10, 4: 5, 3: 0, 2: -6, 1: -12, absent: -25 } as Record<string, number>,
  pressure: {
    stable: 6, // |Δ24| ≤ 3
    slowFall: 4, // −8 < Δ24 < −3
    fastFall: -8, // Δ24 ≤ −8
    slowRise: -3, // 3 < Δ24 < 8
    fastRise: -10, // Δ24 ≥ 8
    jumpy72: -4, // range over 72 h > 15 hPa
    extreme: -4, // msl > 1032 or < 988
  },
  wind: {
    light: 4, // 2–6 m/s
    fresh: -3, // 6–10 m/s (river)
    freshLake: -6,
    strong: -12, // > 10 m/s (river)
    strongLake: -18,
    gusty: -5, // gusts > 15
    coldNorth: -6, // N wind + temp drop
  },
  sky: {
    overcastWarmPredator: 5,
    lightRain: 2,
    heavyRain: -8,
    thunder: -15,
    glareSummerNoon: -6,
  },
  temp: {
    summerDrop: -10, // Jun–Aug, Δ24 ≤ −6
    winterThaw: 6, // Dec–Feb, temp > −3 and rising
    deadWinter: -15, // Jan–Feb, shallow lake, oxygen-sensitive species
  },
  water: {
    risingFast: -10, // > +15 cm / 24 h
    falling: 5, // < −5 cm / 24 h
    floodMayJune: -5,
  },
  ice: {
    firstIce: 10, // ice_days ≤ 21
    lastIce: 8, // days_to_ice_off ≤ 21
    midWinter: -6, // Jan–Feb, most species
    midWinterBurbot: 8,
  },
  spawn: -12, // inside the spawning window (biology, not law)
  restricted: -10, // legal but restricted (e.g. one rod from shore)
  zoneNear: -5, // active prohibited zone within 1 km
} as const;

/** Species traits the weights key on. Missing id → defaults. */
export interface Traits {
  predator: boolean;
  winter_active: boolean; // keeps feeding through глухозимье
  shallow_lake_sensitive: boolean; // suffers from замор in Jan–Feb
  prefers_ice: boolean; // налим style: winter is the peak
}

const DEFAULT: Traits = { predator: false, winter_active: false, shallow_lake_sensitive: true, prefers_ice: false };

export const TRAITS: Record<string, Partial<Traits>> = {
  'esox-lucius': { predator: true, winter_active: true, shallow_lake_sensitive: false },
  'sander-lucioperca': { predator: true, winter_active: true, shallow_lake_sensitive: false },
  'perca-fluviatilis': { predator: true, winter_active: true, shallow_lake_sensitive: true },
  'lota-lota': { predator: true, winter_active: true, shallow_lake_sensitive: false, prefers_ice: true },
  'perccottus-glenii': { predator: true, winter_active: false, shallow_lake_sensitive: false },
  'gymnocephalus-cernua': { predator: true, winter_active: true },
  'carassius-gibelio': { shallow_lake_sensitive: false },
  'carassius-carassius': { shallow_lake_sensitive: false },
  'tinca-tinca': { shallow_lake_sensitive: true },
  'coregonus-peled': { winter_active: true, shallow_lake_sensitive: true },
  'leuciscus-idus': { winter_active: true },
  'rutilus-rutilus': { winter_active: true },
  'leuciscus-leuciscus': { winter_active: true },
  'abramis-brama': { winter_active: true },
};

export function traitsOf(speciesId: string): Traits {
  return { ...DEFAULT, ...(TRAITS[speciesId] ?? {}) };
}
