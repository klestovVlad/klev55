/**
 * Build public/data/rules.json (official rules digest for Омская область) and
 * public/data/zones.geojson (зимовальные ямы from Приложение № 1).
 * Source of record: research/RULES_RAW.md (quotes from the приказ actually opened).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import * as turf from '@turf/turf';
import type { Rules, ZoneProps } from '../src/data/types';
import { insideCircle } from './lib/geo';

const OUT = 'public/data';
const now = new Date().toISOString();

const LEGALACTS = 'https://legalacts.ru/doc/prikaz-minselkhoza-rossii-ot-30102020-n-646-ob-utverzhdenii/';
const TAKSY = 'https://www.consultant.ru/document/cons_doc_LAW_310688/f40eb421ff742953e61208d2b6c08971f7ae6c01/';
const KOAP = 'https://www.consultant.ru/document/cons_doc_LAW_34661/4b14d721c3cbb09fa0afe38ce8280c1a9b3be4a7/';

export const rules: Rules = {
  meta: {
    generated_at: now,
    sources: ['Приказ Минсельхоза России от 30.10.2020 № 646 (ред. 08.06.2026), legalacts.ru', 'Росрыболовство, консолидированный PDF (ред. 25.06.2024)', 'Постановление Правительства РФ от 03.11.2018 № 1321 (ред. 08.09.2023)', 'КоАП РФ ст. 8.37'],
    license: 'Нормативные акты РФ — общественное достояние; дайджест CC BY-SA 4.0',
    notes: 'Раздел Омской области не менялся с ред. 25.06.2024; ред. 08.06.2026 (приказ № 395) его не затрагивает — проверено сравнением текста.',
  },
  region: 'Омская область',
  basin: 'Западно-Сибирский рыбохозяйственный бассейн, Обь-Иртышский рыбохозяйственный район',
  source_title: 'Приказ Минсельхоза России от 30.10.2020 № 646 «Об утверждении правил рыболовства для Западно-Сибирского рыбохозяйственного бассейна»',
  source_url: LEGALACTS,
  // Official PDF host (ред. 25.06.2024): https://fish.gov.ru/wp-content/uploads/2024/11/pravila_rybolovstva_dlya_zapadno_sibirskogo_rybohozyajstvennogo_bassejna.pdf
  edition_date: '2026-06-08',
  edition_note: 'Редакция от 08.06.2026 (приказ № 395). Нормы для Омской области в ней те же, что в редакции 25.06.2024. Правила действуют до 01.09.2027. Перед выездом сверьтесь с первоисточником: изменения выходят несколько раз в год.',
  spawning_bans: [
    {
      id: 'spring-rivers',
      from: '04-20',
      to: '05-20',
      scope: 'Иртыш и все его притоки (включая Омь, Ошу, Тару) и их пойменные системы',
      applies_to: { spot_types: ['река', 'протока', 'старица'] },
      full_ban: false,
      what_is_banned: 'Любая ловля, кроме одной удочки с берега',
      what_is_allowed: 'одна донная или поплавочная удочка, либо спиннинг или фидер, с берега, без лодки, не больше 2 крючков у одного человека',
    },
    {
      id: 'spring-lakes',
      from: '04-25',
      to: '05-25',
      scope: 'все озёра области',
      applies_to: { spot_types: ['озеро', 'пруд', 'водохранилище'] },
      full_ban: false,
      what_is_banned: 'Любая ловля, кроме одной удочки с берега',
      what_is_allowed: 'одна донная или поплавочная удочка, либо спиннинг или фидер, с берега, без лодки, не больше 2 крючков у одного человека',
    },
    {
      id: 'sterlet',
      from: '04-20',
      to: '06-15',
      scope: 'стерлядь в Иртыше и притоках (для любителей стерлядь запрещена круглый год)',
      applies_to: { all: true },
      full_ban: true,
      what_is_banned: 'Вылов стерляди',
      what_is_allowed: '',
      species: ['acipenser-ruthenus'],
    },
  ],
  banned_species: [
    { id: 'acipenser-baerii', name: 'Осётр сибирский', note: 'Красная книга РФ и Омской области. Такса 160 456 ₽ за штуку.' },
    { id: 'acipenser-ruthenus', name: 'Стерлядь', note: 'Запрет для любителей повсеместно. Такса 4 572 ₽ за штуку.' },
    { id: 'stenodus-leucichthys', name: 'Нельма', note: 'Красная книга Омской области. Такса 10 811 ₽ за штуку.' },
  ],
  min_size_cm: { 'esox-lucius': 30, 'sander-lucioperca': 33, 'abramis-brama': 26, 'leuciscus-idus': 25 },
  daily_limits: [
    { species_id: 'esox-lucius', name: 'Щука', limit: '10 кг' },
    { species_id: 'abramis-brama', name: 'Лещ', limit: '10 кг' },
    { species_id: 'leuciscus-idus', name: 'Язь', limit: '10 кг' },
    { species_id: 'sander-lucioperca', name: 'Судак', limit: '5 кг' },
    { species_id: 'crayfish', name: 'Раки', limit: '2 кг; размер от 9 см' },
  ],
  total_daily_kg: 'не больше 10 кг всей рыбы в сутки, либо одна рыба тяжелее 10 кг; при выезде дольше суток — не больше двух суточных норм',
  gear: {
    allowed: [
      'летние и зимние удочки всех видов, суммарно не больше 10 крючков у одного человека',
      'спиннинг, фидер, нахлыст, кораблик, троллинг (дорожка)',
      'жерлицы и кружки — не больше 10 штук',
      'закидушки и переметы — не больше 10 крючков суммарно',
      'раколовки — не больше 5 штук, диаметр до 80 см, ячея от 30 мм',
      'бредень для живца до 3 м с ячеей до 15 мм',
      'подводная охота без акваланга',
      'в озёрах — одна ставная сеть до 30 м с ячеей от 22 мм, только после учёта и маркировки в теруправлении Росрыболовства',
    ],
    prohibited: [
      'сети в реках (Иртыш, Омь и любые притоки) для любителей запрещены полностью',
      'электролов, взрывчатка, отравляющие вещества',
      'багрение, глушение, гон',
      'самоловные крючковые снасти',
      'колющие орудия и огнестрельное оружие (кроме подводной охоты)',
      'стационарные шалаши и сооружения на льду (переносные ветрозащитные можно)',
      'ловля ближе 0,5 км от рыбоводных хозяйств и садков',
      'ловля на фарватере, если мешает судоходству',
    ],
    hooks_max: 10,
    notes: [
      'Нельзя иметь при себе снасти и рыбу, запрещённые в этом месте и в это время (п. 15.5.3).',
      'Ловля с лодки запрещена только в нерестовый период; в остальное время лодка разрешена.',
    ],
  },
  distances: [
    { place: 'рыбоводные хозяйства и садки', meters: 500, note: 'по правилам рыболовства, п. 15.2' },
    { place: 'места выпуска молоди', meters: 500, note: 'в период выпуска и 15 дней после' },
    { place: 'охранные зоны мостов, плотин и шлюзов', meters: 0, note: 'метраж задают ПП РФ № 690 и № 884; в правилах цифры нет — считайте ближе 200 м к опорам моста запретом на всякий случай' },
  ],
  winter_pits_ban: { from: '11-15', to: '04-20', note: 'На зимовальных ямах Иртыша (Приложение № 1 к правилам) запрещена любая ловля с 15 ноября по 20 апреля. 56 ям на всём Иртыше в области; в круге 200 км — южные и центральные.' },
  fines: {
    source_title: 'Постановление Правительства РФ от 03.11.2018 № 1321 (таксы) и КоАП РФ ст. 8.37 ч. 2',
    source_url: TAKSY,
    per_fish_rub: [
      { species_id: 'acipenser-baerii', name: 'Осётр сибирский', rub: 160456 },
      { species_id: 'coregonus-muksun', name: 'Муксун', rub: 70083 },
      { species_id: 'stenodus-leucichthys', name: 'Нельма', rub: 10811 },
      { species_id: 'acipenser-ruthenus', name: 'Стерлядь', rub: 4572 },
      { species_id: 'sander-lucioperca', name: 'Судак', rub: 3305 },
      { species_id: 'esox-lucius', name: 'Щука', rub: 925 },
      { species_id: 'cyprinus-carpio', name: 'Сазан, карп', rub: 925 },
      { species_id: 'coregonus-peled', name: 'Пелядь', rub: 925 },
      { species_id: 'ctenopharyngodon-idella', name: 'Белый амур', rub: 925 },
      { species_id: 'hypophthalmichthys-molitrix', name: 'Толстолобик', rub: 925 },
      { species_id: 'oncorhynchus-mykiss', name: 'Форель', rub: 925 },
      { species_id: 'lota-lota', name: 'Налим', rub: 500 },
      { species_id: 'tinca-tinca', name: 'Линь', rub: 500 },
      { species_id: 'leuciscus-idus', name: 'Язь', rub: 500 },
      { species_id: 'abramis-brama', name: 'Лещ', rub: 500 },
      { species_id: 'blicca-bjoerkna', name: 'Густера', rub: 500 },
      { species_id: 'rutilus-rutilus', name: 'Плотва (чебак)', rub: 250 },
      { species_id: 'leuciscus-leuciscus', name: 'Елец', rub: 250 },
      { species_id: 'carassius-gibelio', name: 'Карась', rub: 250 },
      { species_id: 'carassius-carassius', name: 'Карась золотой', rub: 250 },
      { species_id: 'perca-fluviatilis', name: 'Окунь', rub: 250 },
      { species_id: 'other', name: 'Другие виды (ёрш, пескарь, уклейка, ротан, верховка, гольян, красноперка)', rub: 100 },
    ],
    multipliers: [
      { condition: 'в запретный период или в запретном месте (нерест, зимовальная яма)', factor: 2 },
      { condition: 'виды Красной книги РФ (осётр сибирский) — считается по отдельной методике, сумма выше таксы', factor: 1 },
    ],
    koap: { article: 'КоАП РФ ст. 8.37 ч. 2', fine_rub: '2 000–5 000 ₽ для граждан, возможна конфискация лодки и снастей; плюс возмещение ущерба по таксам', url: KOAP },
  },
  red_book: [
    { species_id: 'acipenser-baerii', name: 'Осётр сибирский (кат. 2, также Красная книга РФ)' },
    { species_id: 'stenodus-leucichthys', name: 'Нельма (кат. 2)' },
    { species_id: 'cottus-sibiricus', name: 'Подкаменщик сибирский (кат. 4)' },
    { species_id: 'cobitis-melanoleuca', name: 'Щиповка сибирская (кат. 4)' },
    { species_id: 'lethenteron', name: 'Миноги сибирская и японская (кат. 4)' },
  ],
  plain_digest: [
    'Нерест: на Иртыше и всех притоках нельзя с 20 апреля по 20 мая, на озёрах с 25 апреля по 25 мая. В это время можно только одной удочкой или спиннингом с берега, не больше двух крючков, без лодки.',
    'Зимовальные ямы на Иртыше закрыты для любой ловли с 15 ноября по 20 апреля. Они показаны на карте.',
    'Нельзя ловить осетра, стерлядь и нельму. Поймали — отпускайте сразу.',
    'Минимальный размер: щука 30 см, судак 33, лещ 26, язь 25. Меньше — отпустить немедленно. Для остальных видов размер не задан.',
    'Суточная норма: щука, лещ, язь по 10 кг, судак 5 кг, всего не больше 10 кг рыбы или одна рыба тяжелее 10 кг.',
    'Снасти: не больше 10 крючков суммарно, не больше 10 жерлиц. Сети в реках запрещены; в озёрах одна сеть до 30 м только после регистрации.',
    'Штраф за нарушение правил 2 000–5 000 ₽ (КоАП 8.37 ч. 2), плюс ущерб по таксам за каждую рыбу, в запрет — вдвое.',
  ],
};

/* ---------- Зимовальные ямы from the markdown table in RULES_RAW.md ---------- */

function dms(s: string): number | null {
  const m = s.match(/(\d+)°(\d+)'([\d.]+)/);
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
}

function parsePoint(cell: string): [number, number] | null {
  // "57°47'24.50" с. ш., 70°52'4.15" в. д."
  const parts = cell.split(/с\.\s*ш\./);
  if (parts.length < 2) return null;
  const lat = dms(parts[0]);
  const lon = dms(parts[1]);
  return lat != null && lon != null ? [lon, lat] : null;
}

function buildZones() {
  const md = readFileSync('research/RULES_RAW.md', 'utf8');
  const rows = md.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l) && /с\. ш\./.test(l));
  const features: any[] = [];
  let skipped = 0;
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim());
    // | № | Название | Район | Ориентир | Верхняя | Нижняя |
    const [, no, name, district, landmark, upper, lower] = cells;
    const a = parsePoint(upper);
    const b = parsePoint(lower);
    if (!a || !b) {
      skipped++;
      continue;
    }
    if (!insideCircle(a) && !insideCircle(b)) continue;
    const line = turf.lineString([a, b]);
    const poly = turf.buffer(line, 0.35, { units: 'kilometers' })!;
    const sameAsPrev = features.some((f) => f.properties.upper[0] === a[0] && f.properties.upper[1] === a[1]);
    const props: ZoneProps & { no: number; district: string; landmark: string; upper: [number, number]; lower: [number, number]; duplicate_coords?: boolean } = {
      id: `pit-${no}`,
      name: `${name} яма`,
      kind: 'зимовальная яма',
      water: 'Иртыш',
      active_from: '11-15',
      active_to: '04-20',
      description: `${landmark} (${district}). Верхняя и нижняя границы по приказу; полоса ±350 м вокруг прямой между ними — ориентир, не точная граница.`,
      source: 'Приказ Минсельхоза № 646, Приложение № 1, Омская область',
      provenance: 'official',
      approx: true,
      no: Number(no),
      district,
      landmark,
      upper: a,
      lower: b,
      ...(sameAsPrev ? { duplicate_coords: true } : {}),
    };
    if (sameAsPrev) props.description += ' В приказе координаты совпадают с соседней ямой (вероятно, опечатка первоисточника).';
    features.push({ type: 'Feature', geometry: turf.truncate(poly, { precision: 5 }).geometry, properties: props });
  }
  console.log(`zones: ${features.length} pits inside the circle (${rows.length} parsed, ${skipped} unparsable)`);
  return {
    type: 'FeatureCollection',
    meta: { generated_at: now, sources: ['Приказ Минсельхоза № 646, Приложение № 1 (ред. 08.06.2026)'], license: 'Нормативный акт — общественное достояние', notes: 'Геометрия восстановлена из координат границ; approx=true' },
    features,
  };
}

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/rules.json`, JSON.stringify(rules, null, 1));
writeFileSync(`${OUT}/zones.geojson`, JSON.stringify(buildZones()));
console.log('rules.json + zones.geojson written');
