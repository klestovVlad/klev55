import type { Species, Spot, Rules } from '@/data/types';
import type { WeatherSnapshot, HydroSnapshot } from './types';

/** Minimal but complete fixtures for model tests. Not product data. */
export const pike: Species = {
  id: 'esox-lucius',
  names: { ru: 'Щука', lat: 'Esox lucius', en: 'Northern pike', aliases: [] },
  family: 'Щуковые',
  photo: null,
  status: { legal: 'allowed', red_book: false, invasive: false },
  rules_ref: { min_size_cm: 30, daily_limit: '10 шт.' },
  description: '',
  size: { typical_cm: [40, 70], typical_kg: [0.7, 3], trophy_kg: 8 },
  habitat: { water_types: ['река'], depth_m: [1, 6], structure: [], current: 'slow' },
  spawning: { from: '04-15', to: '05-15', water_temp_c: [4, 10] },
  activity_by_month: [5, 5, 6, 6, 7, 6, 5, 6, 8, 9, 7, 6],
  activity_by_hour: {
    openwater: [2, 2, 2, 3, 5, 7, 8, 8, 7, 6, 5, 4, 4, 4, 5, 6, 7, 8, 8, 7, 5, 3, 2, 2],
    ice: [1, 1, 1, 1, 2, 3, 5, 7, 8, 8, 7, 6, 6, 6, 7, 7, 5, 3, 2, 1, 1, 1, 1, 1],
  },
  weather_response: { pressure: '', wind: '', cloud: '', temp_change: '', water_level: '' },
  methods: [],
  lifehacks: [],
  edible: { quality: 4, bones: '', opisthorchiasis_risk: 'low', safe_preparation: '', best_dishes: [] },
  handling: '',
  presence: 'common',
  provenance: {},
};

export const sterlet: Species = {
  ...pike,
  id: 'acipenser-ruthenus',
  names: { ru: 'Стерлядь', lat: 'Acipenser ruthenus', en: 'Sterlet', aliases: [] },
  status: { legal: 'banned', red_book: true, invasive: false },
};

export const burbot: Species = {
  ...pike,
  id: 'lota-lota',
  names: { ru: 'Налим', lat: 'Lota lota', en: 'Burbot', aliases: [] },
  activity_by_month: [9, 8, 5, 3, 2, 1, 1, 1, 3, 6, 8, 9],
};

export const riverSpot: Spot = {
  id: 'irtysh-test',
  name: 'Тестовая бровка',
  coords: [73.4, 54.9],
  water_osm_id: 1,
  water_name: 'Иртыш',
  type: 'река',
  district: 'Омский',
  distance_km: 12,
  drive_min: 20,
  drive_source: 'estimate',
  access: { car: '', foot: true, boat: true, winter: '' },
  features: ['бровка'],
  species: [
    { id: 'esox-lucius', rank: 5, seasons: ['осень'], methods: ['спиннинг'], note: '' },
    { id: 'lota-lota', rank: 3, seasons: ['зима'], methods: ['донка'], note: '' },
  ],
  best_months: [9, 10],
  best_hours_note: '',
  depth_note: '',
  notes: '',
  lifehacks: [],
  ice_spot: true,
  confidence: 2,
  corroborated_by: [],
  provenance: 'generated',
};

export const lakeSpot: Spot = { ...riverSpot, id: 'lake-test', type: 'озеро', water_name: 'Озеро' };

export const rules: Rules = {
  meta: { generated_at: '', sources: [], license: '' },
  region: 'Омская область',
  basin: 'Западно-Сибирский',
  source_title: 'test',
  source_url: 'https://example.invalid',
  edition_date: '2020-10-30',
  edition_note: '',
  spawning_bans: [
    {
      id: 'spring-rivers',
      from: '04-20',
      to: '05-20',
      scope: 'реки',
      applies_to: { spot_types: ['река', 'протока', 'старица'] },
      full_ban: false,
      what_is_banned: '',
      what_is_allowed: 'одна удочка с берега',
    },
    {
      id: 'spring-lakes-full',
      from: '05-01',
      to: '05-30',
      scope: 'озёра',
      applies_to: { spot_types: ['озеро'] },
      full_ban: true,
      what_is_banned: 'всё',
      what_is_allowed: '',
    },
  ],
  banned_species: [{ id: 'acipenser-ruthenus', name: 'Стерлядь', note: '' }],
  min_size_cm: {},
  daily_limits: [],
  total_daily_kg: '',
  gear: { allowed: [], prohibited: [], hooks_max: 10, notes: [] },
  distances: [],
  winter_pits_ban: { from: '11-15', to: '04-20', note: '' },
  fines: {
    source_title: '',
    source_url: '',
    per_fish_rub: [],
    multipliers: [],
    koap: { article: '', fine_rub: '', url: '' },
  },
  red_book: [],
  plain_digest: [],
};

export function weather(over: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    time: '',
    temp_c: 15,
    pressure_msl: 1012,
    pressure_trend_24h: 0,
    pressure_range_72h: 5,
    wind_speed: 3,
    wind_dir: 200,
    gusts: 5,
    cloud: 50,
    precip: 0,
    weather_code: 2,
    temp_change_24h: 0,
    ...over,
  };
}

export function hydro(over: Partial<HydroSnapshot> = {}): HydroSnapshot {
  return {
    gauge_name: null,
    gauge_km: null,
    level_trend_cm_24h: null,
    water_temp_c: null,
    ice_on: false,
    ice_thickness_cm: null,
    ice_days: null,
    days_to_ice_off: null,
    zone: null,
    ...over,
  };
}
