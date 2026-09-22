/**
 * Data contract for public/data/*.json.
 * Every file carries a `meta` block. Every knowledge field carries provenance
 * (see BRIEF.md rule 4). Keep this file the single source of truth: the QA
 * script (scripts/qa-data.ts) and the content authors both validate against it.
 */

export type Provenance = 'measured' | 'official' | 'reference' | 'generated';

export interface Meta {
  generated_at: string; // ISO datetime
  sources: string[]; // names from research/SOURCES.md
  license: string;
  notes?: string;
}

/* ---------- Species ---------- */

export type MethodName =
  | 'спиннинг'
  | 'фидер'
  | 'поплавок'
  | 'донка'
  | 'жерлицы'
  | 'мормышка'
  | 'балансир'
  | 'блесна'
  | 'нахлыст'
  | 'троллинг';

export type Season = 'весна' | 'лето' | 'осень' | 'зима';

export type LegalStatus = 'allowed' | 'banned' | 'banned_outside_licensed_sites';

export type OpisthorchiasisRisk = 'high' | 'medium' | 'low' | 'none';

export interface SpeciesPhoto {
  url: string; // 400px WebP/JPEG we serve or a stable remote URL
  author: string;
  license: string; // e.g. "CC BY-SA 4.0"
  license_url?: string;
  source: string; // "Wikimedia Commons" | "iNaturalist"
  source_url: string; // page of the original
  nc?: boolean; // true for CC-BY-NC (see D-009)
}

export interface SpeciesMethod {
  name: MethodName;
  seasons: Season[];
  baits: string[];
  lures: string[];
  rig: string;
  technique: string; // 2–4 sentences
  gear: string; // rod / line / hook sizes
}

export interface Species {
  id: string; // latin-ish slug: "esox-lucius"
  names: { ru: string; lat: string; en: string; aliases: string[] };
  family: string; // Russian family name
  photo: SpeciesPhoto | null;
  status: { legal: LegalStatus; red_book: boolean; invasive: boolean; note?: string };
  rules_ref: { min_size_cm: number | null; daily_limit: string | null }; // official
  description: string; // 120–180 words, angler voice
  size: { typical_cm: [number, number]; typical_kg: [number, number]; trophy_kg: number };
  habitat: {
    water_types: string[];
    depth_m: [number, number];
    structure: string[];
    current: 'none' | 'slow' | 'moderate' | 'fast';
  };
  spawning: { from: string; to: string; water_temp_c: [number, number] }; // "MM-DD"
  activity_by_month: number[]; // 12 × 0–10
  activity_by_hour: { openwater: number[]; ice: number[] }; // 24 × 0–10 each
  weather_response: {
    pressure: string;
    wind: string;
    cloud: string;
    temp_change: string;
    water_level: string;
  };
  methods: SpeciesMethod[];
  lifehacks: string[]; // 3–6
  edible: {
    quality: 1 | 2 | 3 | 4 | 5;
    bones: string;
    opisthorchiasis_risk: OpisthorchiasisRisk;
    safe_preparation: string;
    best_dishes: string[];
  };
  handling: string;
  presence: 'common' | 'local' | 'rare' | 'stocked'; // in the 200 km circle
  provenance: Record<string, Provenance>; // field → provenance
}

/** Fields the map, planner and model need; the full record is loaded on species pages. */
export type SpeciesLite = Omit<Species, 'description' | 'methods' | 'lifehacks' | 'edible' | 'handling' | 'weather_response' | 'habitat' | 'size'>;

/* ---------- Spots ---------- */

export type SpotType = 'река' | 'протока' | 'старица' | 'озеро' | 'пруд' | 'водохранилище' | 'платник';

export type SpotFeature =
  | 'бровка'
  | 'яма'
  | 'коса'
  | 'перекат'
  | 'коряжник'
  | 'устье'
  | 'плёс'
  | 'заросли'
  | 'плотина'
  | 'мост'
  | 'обрывистый берег'
  | 'пологий берег';

export interface SpotSpecies {
  id: string; // Species.id
  rank: 1 | 2 | 3 | 4 | 5; // 5 = main target here
  seasons: Season[];
  methods: MethodName[];
  note: string;
}

export interface Spot {
  id: string;
  name: string;
  coords: [number, number]; // [lon, lat]
  water_osm_id: number | null; // resolved against water.json at build time
  water_name: string;
  type: SpotType;
  district: string;
  distance_km: number; // straight-line from Omsk center, computed
  drive_min: number | null; // OSRM or estimate
  drive_source: 'osrm' | 'estimate';
  access: { car: string; foot: boolean; boat: boolean; winter: string };
  features: SpotFeature[];
  species: SpotSpecies[];
  best_months: number[]; // 1–12
  best_hours_note: string;
  depth_note: string;
  notes: string; // 2–4 sentences
  lifehacks: string[]; // 1–3
  paid?: { price_note: string; contact_hint: string; stocked_species: string[] };
  ice_spot: boolean; // suitable for winter fishing
  confidence: 0 | 1 | 2 | 3;
  corroborated_by: string[]; // source names only
  provenance: 'generated';
}

/* ---------- Rules ---------- */

export interface RuleWindow {
  id: string;
  from: string; // "MM-DD"
  to: string; // "MM-DD"
  scope: string; // Russian description of waters
  applies_to: { all?: boolean; spot_types?: SpotType[]; water_names?: string[] };
  full_ban: boolean; // true = no fishing at all; false = restricted (e.g. one rod from shore)
  what_is_banned: string;
  what_is_allowed: string;
  species?: string[]; // species ids if species-specific
}

export interface Rules {
  meta: Meta;
  region: 'Омская область';
  basin: string;
  source_title: string;
  source_url: string;
  edition_date: string; // ISO date of the edition actually opened
  edition_note: string; // honesty note shown in UI
  spawning_bans: RuleWindow[];
  banned_species: { id: string; name: string; note: string }[];
  min_size_cm: Record<string, number>; // species id → cm
  daily_limits: { species_id: string; name: string; limit: string }[];
  total_daily_kg: string;
  gear: { allowed: string[]; prohibited: string[]; hooks_max: number | null; notes: string[] };
  distances: { place: string; meters: number; note?: string }[];
  winter_pits_ban: { from: string; to: string; note: string };
  fines: {
    source_title: string;
    source_url: string;
    per_fish_rub: { species_id: string; name: string; rub: number }[];
    multipliers: { condition: string; factor: number }[];
    koap: { article: string; fine_rub: string; url: string };
  };
  red_book: { species_id: string; name: string }[];
  plain_digest: string[]; // short plain Russian bullets for the Rules screen
}

/* ---------- Zones ---------- */

export interface ZoneProps {
  id: string;
  name: string;
  kind: 'зимовальная яма' | 'запретная зона' | 'нерестовый участок';
  water: string;
  active_from: string; // "MM-DD"
  active_to: string;
  description: string;
  source: string;
  provenance: Provenance;
  approx: boolean; // geometry reconstructed from a text description
}

/* ---------- Gauges ---------- */

export interface Gauge {
  id: string;
  name: string; // "Иртыш — Омск"
  river: string;
  coords: [number, number];
  source: string;
  source_url: string;
  level_cm: number | null;
  level_trend_cm_24h: number | null;
  water_temp_c: number | null;
  ice: string | null;
  measured_at: string | null; // ISO
  history: { date: string; level_cm: number | null; temp_c: number | null }[];
  provenance: Provenance;
}

/* ---------- Water & infra (GeoJSON properties) ---------- */

export interface WaterProps {
  osm_id: number;
  name: string;
  type: 'river' | 'stream' | 'canal' | 'lake' | 'pond' | 'reservoir' | 'oxbow' | 'riverbank' | 'wetland';
  area_km2?: number;
  length_km?: number;
  centroid: [number, number];
  jurisdiction: 'ru' | 'kz';
  salt?: boolean;
}

export interface InfraProps {
  osm_id: number;
  kind: 'bridge' | 'dam' | 'weir' | 'lock' | 'slipway' | 'fishing_shop' | 'fuel' | 'camp_site' | 'fishing_spot';
  name: string | null;
}

/* ---------- Advice ---------- */

export interface Checklist {
  id: string;
  title: string;
  method: MethodName | 'любой';
  season: Season | 'любой';
  items: string[];
}

export interface AdviceSection {
  id: string;
  title: string;
  kind: 'safety' | 'legal' | 'lifehack';
  paragraphs: string[];
  source?: string;
  provenance: Provenance;
}

export interface Advice {
  meta: Meta;
  checklists: Checklist[];
  sections: AdviceSection[];
}

/* ---------- Files ---------- */

export interface SpeciesFile {
  meta: Meta;
  items: Species[];
}
export interface SpeciesIndexFile {
  meta: Meta;
  items: SpeciesLite[];
}
export interface SpotsFile {
  meta: Meta;
  center: [number, number];
  radius_km: number;
  items: Spot[];
}
export interface GaugesFile {
  meta: Meta;
  items: Gauge[];
}
