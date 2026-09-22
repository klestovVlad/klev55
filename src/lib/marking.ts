/**
 * Reads the markings anglers meet on tackle: rod power/action/length/test, lure length and
 * buoyancy/depth codes, hook sizes, line diameter / PE / lb, reel size, silicone inches, weights.
 * There is no universal code — model names (XR10, Rigge 56) mean nothing outside a catalogue —
 * so unknown tokens are reported as unknown, never guessed. Pure; unit-tested.
 */

export type PartKind = 'удилище' | 'приманка' | 'крючок' | 'леска' | 'катушка' | 'вес' | 'силикон' | 'непонятно';

export interface DecodedPart {
  token: string; // as found in the input
  kind: PartKind;
  label: string; // short: «мощность ML»
  detail: string; // one sentence for an angler
}

export interface Decoded {
  parts: DecodedPart[];
  unknown: string[];
  /** Glossary ids the marking points at (spinning, fider, vobler, dzhig…). */
  gear: string[];
  /** Species ids this class of tackle is usually for, in our waters. */
  species: string[];
  summary: string; // 1–3 sentences in Russian, empty when nothing was recognised
}

const POWER: Record<string, { ru: string; test: string }> = {
  UL: { ru: 'ультралёгкое (ultra light)', test: 'обычно 0,5–7 г' },
  L: { ru: 'лёгкое (light)', test: 'обычно 2–12 г' },
  ML: { ru: 'средне-лёгкое (medium light)', test: 'обычно 4–18 г' },
  M: { ru: 'среднее (medium)', test: 'обычно 5–25 г' },
  MH: { ru: 'средне-тяжёлое (medium heavy)', test: 'обычно 7–35 г' },
  H: { ru: 'тяжёлое (heavy)', test: 'обычно 15–50 г' },
  XH: { ru: 'очень тяжёлое (extra heavy)', test: 'обычно 20–80 г' },
  XXH: { ru: 'сверхтяжёлое (extra extra heavy)', test: 'обычно от 40 г, троллинг и море' },
  XXXH: { ru: 'экстремально тяжёлое', test: 'от 60 г, морская и троллинговая ловля' },
};

const ACTION: Record<string, string> = {
  XF: 'сверхбыстрый строй (extra fast): гнётся только вершинка, для джига и твичинга',
  EF: 'сверхбыстрый строй (extra fast): гнётся только вершинка, для джига и твичинга',
  F: 'быстрый строй (fast): работает верхняя треть, универсальный выбор',
  MF: 'умеренно быстрый строй (moderate fast): чуть мягче быстрого, хорошо бросает',
  RF: 'умеренно быстрый строй (regular fast)',
  M: 'средний строй (moderate): гнётся половина, дальний заброс, вертушки и колебалки',
  R: 'средний строй (regular): гнётся половина бланка',
  S: 'медленный строй (slow): гнётся весь бланк, для лёгких приманок и мягкой подсечки',
};

const DEPTH: Record<string, string> = {
  SSR: 'сверхмелководный (super shallow runner): до 0,5 м, над травой в старицах',
  SR: 'мелководный (shallow runner): до 1 м, затоны, старицы, прогретые мели',
  MR: 'средний (medium runner): 1–1,5 м, универсальный для щуки и окуня',
  DR: 'глубоководный (deep runner): 1,5–2,5 м, бровки и русло',
  MDR: 'средне-глубоководный (medium deep runner): около 2–2,5 м',
  SDR: 'сверхглубоководный (super deep runner): 3 м и глубже, ямы Иртыша, троллинг',
  XDR: 'сверхглубоководный (extra deep runner): 3 м и глубже, ямы Иртыша, троллинг',
  DD: 'глубоко ныряющий (deep diver): 3 м и глубже',
  XDD: 'очень глубоко ныряющий (extra deep diver): 4 м и глубже',
};

const BUOY: Record<string, string> = {
  F: 'плавающий (floating): всплывает на паузе, можно вести над корягами',
  SP: 'суспендер (suspending): зависает в толще на паузе, лучший для твичинга по щуке',
  SU: 'суспендер (suspending): зависает в толще на паузе',
  S: 'тонущий (sinking): тонет на паузе, для течения и глубины',
  SS: 'медленно тонущий (slow sinking)',
  FS: 'быстро тонущий (fast sinking): для сильного течения',
};

const num = (s: string) => parseFloat(s.replace(',', '.'));
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2))).replace('.', ','));

interface Rule {
  kind: PartKind;
  re: RegExp;
  make: (m: RegExpMatchArray, ctx: Ctx) => DecodedPart | null;
}

interface Ctx {
  rod: boolean; // the text already looks like a rod marking
  lure: boolean; // …or a lure marking
  feeder: boolean;
}

function feetToCm(ft: number, inch = 0): number {
  return Math.round((ft * 12 + inch) * 2.54);
}

const RULES: Rule[] = [
  // 762ML, S862M-F, 702H: Japanese-style rod code = feet, inches, pieces (+ power, + action).
  {
    kind: 'удилище',
    re: /(?<![\d.,])([SCB]?)(\d)(\d)([1-4])-?(UL|ML|MH|XXXH|XXH|XH|L|M|H)(?:[-/]?(XF|EF|MF|RF|F|R|M|S))?(?![\w.,])/giu,
    make: (m) => {
      const [, pfx, ft, inch, pcs, pw, act] = m;
      const p = POWER[pw.toUpperCase()];
      const cm = feetToCm(+ft, +inch);
      const typ = pfx.toUpperCase() === 'C' || pfx.toUpperCase() === 'B' ? 'кастинговое (под мультипликатор)' : pfx.toUpperCase() === 'S' ? 'спиннинговое' : '';
      return {
        token: m[0],
        kind: 'удилище',
        label: `удилище ${ft}′${inch}″, ${pw.toUpperCase()}`,
        detail: `${typ ? typ + ' ' : ''}удилище ${ft} футов ${inch} дюймов (≈ ${cm} см), ${pcs} колен${+pcs === 1 ? 'о' : 'а'}, мощность ${p.ru}, ${p.test}${act ? '; ' + ACTION[act.toUpperCase()] : ''}.`,
      };
    },
  },
  // 7'6", 8', 6ft6
  {
    kind: 'удилище',
    re: /(?<![\d.,])(\d{1,2})\s?(?:'|′|ft)\s?(\d{1,2})?\s?(?:"|″|'')?(?![\d.,])/giu,
    make: (m) => {
      const ft = +m[1];
      const inch = m[2] ? +m[2] : 0;
      if (ft < 4 || ft > 16) return null;
      return { token: m[0], kind: 'удилище', label: `длина ${ft}′${inch ? inch + '″' : ''}`, detail: `Длина ${ft} футов${inch ? ' ' + inch + ' дюймов' : ''} — примерно ${feetToCm(ft, inch)} см.` };
    },
  },
  // Rod length in cm or m
  {
    kind: 'удилище',
    re: /(?<![\d.,])(1[5-9]\d|2\d\d|3\d\d|4[0-5]\d|[1-7](?:[.,]\d{1,2}))\s?(cm|см|m|м)(?![\wа-яё.,])/giu,
    make: (m) => {
      const v = num(m[1]);
      const cm = /^(m|м)$/i.test(m[2]) ? Math.round(v * 100) : v;
      if (cm < 150 || cm > 800) return null;
      const use = cm <= 210 ? 'лодка, малые реки, микроджиг' : cm <= 270 ? 'универсальная береговая длина' : cm <= 330 ? 'дальний заброс с берега, тяжёлый джиг или лёгкий фидер' : 'фидер, матч или болонка';
      return { token: m[0], kind: 'удилище', label: `длина ${cm} см`, detail: `Длина ${cm} см: ${use}.` };
    },
  },
  // Test range in grams / oz
  {
    kind: 'удилище',
    re: /(?<![\d.,])(\d+(?:[.,]\d+)?)\s?[-–—]\s?(\d+(?:[.,]\d+)?)\s?(g|гр|г|oz)(?![\wа-яё])/giu,
    make: (m) => {
      let a = num(m[1]);
      let b = num(m[2]);
      if (/oz/i.test(m[3])) {
        a = Math.round(a * 28.35 * 10) / 10;
        b = Math.round(b * 28.35 * 10) / 10;
      }
      const cls = b <= 7 ? 'Ультралайт: окунь, плотва, форель на платнике' : b <= 21 ? 'Лайт: окунь, щука-травянка, судак на лёгкий джиг' : b <= 45 ? 'Средний класс: щука и судак на Иртыше, джиг 10–30 г' : b <= 90 ? 'Тяжёлый класс: крупный джиг, троллинг, лёгкий фидер' : 'Фидерный или карповый класс';
      return { token: m[0], kind: 'удилище', label: `тест ${fmt(a)}–${fmt(b)} г`, detail: `Тест ${fmt(a)}–${fmt(b)} г: вес приманок, с которыми бланк работает. ${cls}.` };
    },
  },
  // Line class of a rod: 6-14 lb
  {
    kind: 'удилище',
    re: /(?<![\d.,])(\d+(?:[.,]\d+)?)\s?[-–—]\s?(\d+(?:[.,]\d+)?)\s?lb(?![\wа-яё])/giu,
    make: (m) => ({ token: m[0], kind: 'удилище', label: `леска ${m[1]}–${m[2]} lb`, detail: `Рекомендованная разрывная нагрузка лески ${m[1]}–${m[2]} lb (≈ ${fmt(num(m[1]) * 0.45)}–${fmt(num(m[2]) * 0.45)} кг).` }),
  },
  // Lure: 70SP, 56F-SR, 90 mm S, 110 SP MR
  {
    kind: 'приманка',
    re: /(?<![\d.,])(\d{2,3})\s?(?:mm|мм)?\s?[-/]?\s?(SSR|SDR|XDR|XDD|MDR|DD|SR|MR|DR)?\s?[-/]?\s?(SP|SU|SS|FS|F|S)?\s?[-/]?\s?(SSR|SDR|XDR|XDD|MDR|DD|SR|MR|DR)?(?![\w.,])/giu,
    make: (m, ctx) => {
      const [, len, d1, b, d2] = m;
      const L = +len;
      const depth = d1 || d2;
      if (!depth && !b) return null; // a bare number is not a lure
      if (!depth && b && ctx.rod && !ctx.lure) return null; // «F» after a rod code is its action
      if (L < 25 || L > 250) return null;
      const who = L <= 50 ? 'окунь, язь, елец, форель на платнике' : L <= 90 ? 'щука, судак, крупный окунь' : 'щука и судак, троллинг по русловым бровкам';
      const parts = [`воблер ${L} мм: ${who}`];
      if (b) parts.push(BUOY[b.toUpperCase()]);
      if (depth) parts.push(DEPTH[depth.toUpperCase()]);
      return { token: m[0], kind: 'приманка', label: `воблер ${L} мм${b ? ' ' + b.toUpperCase() : ''}${depth ? ' ' + depth.toUpperCase() : ''}`, detail: parts.join('. ') + '.' };
    },
  },
  // Standalone buoyancy / depth words
  {
    kind: 'приманка',
    re: /(?<![\wа-яё])(floating|suspending|suspend|sinking|SSR|SDR|XDR|XDD|MDR|SR|MR|DR|DD)(?![\wа-яё])/giu,
    make: (m) => {
      const t = m[1].toUpperCase();
      const w: Record<string, string> = { FLOATING: BUOY.F, SUSPENDING: BUOY.SP, SUSPEND: BUOY.SP, SINKING: BUOY.S };
      const d = w[t] ?? DEPTH[t];
      return d ? { token: m[0], kind: 'приманка', label: `воблер ${t.length <= 3 ? t : t.toLowerCase()}`, detail: `Воблер: ${d}.` } : null;
    },
  },
  // Big hooks 1/0..10/0
  {
    kind: 'крючок',
    re: /(?<![\d.,])(\d{1,2})\s?\/\s?0(?![\d.,])/gu,
    make: (m) => ({ token: m[0], kind: 'крючок', label: `крючок ${m[1]}/0`, detail: `Крючок ${m[1]}/0 по международной шкале: крупный, ${+m[1] <= 2 ? 'живец на щуку, крупный силикон' : 'офсетник под большой силикон, карповые монтажи'}.` }),
  },
  // Hook / spinner number: #6, №6, no. 8
  {
    kind: 'крючок',
    re: /(?:#|№|no\.?\s?|size\s?)(\d{1,2})(?![\d/.,])/giu,
    make: (m) => {
      const n = +m[1];
      if (n > 24) return null;
      const spinner = n <= 6 ? ` Если это вертушка — лепесток № ${n}: ${n <= 1 ? 'окунь, елец' : n <= 3 ? 'окунь, язь, щука-травянка' : 'щука'}.` : '';
      const hook = n <= 4 ? 'крупный: живец, сазан, крупный лещ' : n <= 8 ? 'средний: лещ, язь, карась на пареный горох и кукурузу' : n <= 14 ? 'мелкий: плотва, елец, мотыль и опарыш' : 'очень мелкий: уклейка, зимняя мормышка';
      return { token: m[0], kind: 'крючок', label: `№ ${n}`, detail: `Крючок № ${n} по международной шкале (чем больше номер, тем мельче): ${hook}.${spinner}` };
    },
  },
  // Line diameter 0.20 (mm)
  {
    kind: 'леска',
    re: /(?<![\d.,])0[.,](\d{2,3})\s?(?:mm|мм)?(?![\d.,])/giu,
    make: (m) => {
      const d = num('0.' + m[1]);
      if (d < 0.04 || d > 0.6) return null;
      const use = d <= 0.1 ? 'тонкий шнур или зимняя леска: мормышка, микроджиг' : d <= 0.16 ? 'шнур для джига и поводок для поплавка' : d <= 0.25 ? 'основная леска для фидера, спиннинга, зимних жерлиц' : 'толстая: сазан, карповые монтажи, живец на щуку';
      return { token: m[0], kind: 'леска', label: `Ø ${fmt(d)} мм`, detail: `Диаметр ${fmt(d)} мм: ${use}.` };
    },
  },
  // PE #0.8 / PE 1.5
  {
    kind: 'леска',
    re: /PE\s?#?\s?(\d(?:[.,]\d)?)|#\s?(\d[.,]\d)(?=\s|$)/giu,
    make: (m) => {
      const pe = num(m[1] ?? m[2]);
      const mm = (0.165 * Math.sqrt(pe)).toFixed(2).replace('.', ',');
      const use = pe <= 0.6 ? 'микроджиг и окунь' : pe <= 1.2 ? 'лёгкий и средний джиг, щука и судак' : pe <= 2 ? 'тяжёлый джиг, троллинг' : 'морская и карповая ловля';
      return { token: m[0], kind: 'леска', label: `PE #${fmt(pe)}`, detail: `Плетёный шнур PE #${fmt(pe)} — японская шкала по сечению, примерно ${mm} мм: ${use}.` };
    },
  },
  // Breaking strain lb / kg
  {
    kind: 'леска',
    re: /(?<![\d.,])(\d+(?:[.,]\d+)?)\s?(lb|кг|kg)(?![\wа-яё])/giu,
    make: (m) => {
      const v = num(m[1]);
      const kg = /lb/i.test(m[2]) ? v * 0.4536 : v;
      if (kg > 80) return null;
      return { token: m[0], kind: 'леска', label: `${fmt(v)} ${m[2].toLowerCase()}`, detail: `Разрывная нагрузка ${fmt(v)} ${m[2].toLowerCase()} (≈ ${fmt(Math.round(kg * 10) / 10)} кг): ${kg <= 3 ? 'плотва, окунь, мормышка' : kg <= 7 ? 'щука и судак на джиг, фидер' : 'сазан, троллинг, крупная щука'}.` };
    },
  },
  // Reel size 1000…6000 (+ gear code)
  {
    kind: 'катушка',
    re: /(?<![\d.,])([1-6]000|[1-5]500|500)\s?(SHG|XHG|HG|XG|PG|FA|FB|FE|FC|FD|S|D|C)?(?![\d.,а-яё])/giu,
    make: (m) => {
      const s = +m[1];
      const g = (m[2] ?? '').toUpperCase();
      const use = s <= 1000 ? 'ультралайт, зимняя блесна' : s <= 2500 ? 'лайт и средний спиннинг, окунь и щука' : s <= 3000 ? 'универсальная: спиннинг до 30 г, лёгкий фидер' : s <= 4000 ? 'тяжёлый джиг, фидер, троллинг' : 'фидер дальнего заброса, сазан';
      const gear = g === 'HG' || g === 'SHG' ? '; HG — повышенная передача, быстрая подмотка' : g === 'XG' || g === 'XHG' ? '; XG — очень быстрая подмотка' : g === 'PG' ? '; PG — силовая передача, для тяжёлых приманок' : g === 'S' ? '; S — мелкая шпуля под шнур' : '';
      return { token: m[0], kind: 'катушка', label: `катушка ${s}`, detail: `Размер безынерционной катушки ${s} (шкала Shimano/Daiwa, у Daiwa нумерация примерно на класс меньше): ${use}${gear}.` };
    },
  },
  // Silicone inches: 3", 3.5 in, 2 дюйма
  {
    kind: 'силикон',
    re: /(?<![\d.,])(\d(?:[.,]\d)?)\s?(?:"|″|''|in\b|inch|дюйм\w*)/giu,
    make: (m) => {
      const inch = num(m[1]);
      if (inch < 1 || inch > 8) return null;
      const use = inch <= 2 ? 'микроджиг: окунь, елец, плотва' : inch <= 3.5 ? 'окунь, судак, щука на джиг 6–14 г' : inch <= 5 ? 'щука и судак, джиг 12–28 г' : 'крупная щука, трофейный джиг';
      return { token: m[0], kind: 'силикон', label: `силикон ${fmt(inch)}″`, detail: `Силиконовая приманка ${fmt(inch)} дюйма (≈ ${Math.round(inch * 2.54)} см): ${use}.` };
    },
  },
  // Single weight in grams
  {
    kind: 'вес',
    re: /(?<![\d.,])(\d+(?:[.,]\d+)?)\s?(g|гр|г)(?![\wа-яё])/giu,
    make: (m, ctx) => {
      const g = num(m[1]);
      const what = ctx.feeder ? `кормушка ${fmt(g)} г` : g <= 5 ? 'микроджиг, мормышка, форелевая колебалка' : g <= 14 ? 'джиг для окуня и судака на слабом течении, колебалка на щуку в старице' : g <= 30 ? 'джиг для Иртыша, колебалка на щуку' : 'тяжёлый джиг на русле, кормушка, троллинговое грузило';
      return { token: m[0], kind: 'вес', label: `${fmt(g)} г`, detail: `Вес ${fmt(g)} г: ${what}.` };
    },
  },
  // Standalone power
  {
    kind: 'удилище',
    re: /(?<![\wа-яё])(UL|ML|MH|XXXH|XXH|XH|L|M|H)(?![\wа-яё])/gu,
    make: (m) => {
      const p = POWER[m[1]];
      return { token: m[0], kind: 'удилище', label: `мощность ${m[1]}`, detail: `Мощность бланка ${p.ru}, ${p.test}.` };
    },
  },
  {
    kind: 'удилище',
    re: /(?<![\wа-яё])(ultra\s?light|ultralight|medium\s?light|medium\s?heavy|extra\s?heavy|light|medium|heavy)(?![\wа-яё])/giu,
    make: (m, ctx) => {
      const t = m[1].toLowerCase().replace(/\s/g, '');
      const key = t === 'ultralight' ? 'UL' : t === 'mediumlight' ? 'ML' : t === 'mediumheavy' ? 'MH' : t === 'extraheavy' ? 'XH' : t === 'light' ? 'L' : t === 'medium' ? 'M' : 'H';
      if (ctx.feeder) {
        const f: Record<string, string> = { L: 'лёгкий фидер до 60 г: пруды, старицы', M: 'средний фидер до 90 г: Омь, Иртыш на слабом течении', H: 'тяжёлый фидер до 120 г: Иртыш на струе', XH: 'сверхтяжёлый фидер 150 г и больше: русло Иртыша в половодье', UL: 'пикер до 40 г: пруд, карась', ML: 'лёгкий фидер', MH: 'средне-тяжёлый фидер' };
        return { token: m[0], kind: 'удилище', label: `фидер ${key}`, detail: `${f[key]}.` };
      }
      const p = POWER[key];
      return { token: m[0], kind: 'удилище', label: `мощность ${key}`, detail: `Мощность бланка ${p.ru}, ${p.test}.` };
    },
  },
  // Standalone action words
  {
    kind: 'удилище',
    re: /(?<![\wа-яё])(extra\s?fast|ex-fast|moderate\s?fast|moderate|regular\s?fast|regular|fast|slow)(?![\wа-яё])/giu,
    make: (m) => {
      const t = m[1].toLowerCase().replace(/[\s-]/g, '');
      const key = t === 'extrafast' || t === 'exfast' ? 'XF' : t === 'moderatefast' ? 'MF' : t === 'regularfast' ? 'RF' : t === 'moderate' ? 'M' : t === 'regular' ? 'R' : t === 'fast' ? 'F' : 'S';
      return { token: m[0], kind: 'удилище', label: `строй ${key}`, detail: ACTION[key] + '.' };
    },
  },
  // Standalone action letters after a rod code: «762ML F», «M/F»
  {
    kind: 'удилище',
    re: /(?<![\wа-яё])(XF|EF|MF|RF|F|R|S)(?![\wа-яё])/gu,
    make: (m, ctx) => (ctx.rod && !ctx.lure ? { token: m[0], kind: 'удилище', label: `строй ${m[1]}`, detail: ACTION[m[1]] + '.' } : null),
  },
  // Rod type words
  {
    kind: 'удилище',
    re: /(?<![\wа-яё])(casting|baitcasting|cast|кастинг\w*|spinning|спиннинг\w*|feeder|фидер\w*|picker|пикер\w*|match|матч\w*|bolo\w*|болон\w*|jig|джиг\w*|twitch\w*|твич\w*|troll\w*|тролл\w*)(?![\wа-яё])/giu,
    make: (m) => {
      const t = m[1].toLowerCase();
      const map: [RegExp, string][] = [
        [/^(casting|baitcasting|cast|кастинг)/, 'кастинговое удилище — под мультипликаторную катушку, курок на рукояти; кольца мелкие, сверху бланка'],
        [/^(spinning|спиннинг)/, 'спиннинговое удилище — под безынерционную катушку, кольца снизу'],
        [/^(feeder|фидер)/, 'фидерное удилище — донная ловля с кормушкой, сменные вершинки-квивертипы'],
        [/^(picker|пикер)/, 'пикер — короткий лёгкий фидер до 40 г для прудов и стариц'],
        [/^(match|матч)/, 'матчевое удилище — дальний заброс поплавка'],
        [/^(bolo|болон)/, 'болонское удилище — телескоп с кольцами под поплавок'],
        [/^(jig|джиг)/, 'джиговая серия — быстрый строй, чувствительная вершинка'],
        [/^(twitch|твич)/, 'твичинговая серия — жёсткий бланк для рывковой проводки воблеров'],
        [/^(troll|тролл)/, 'троллинговое удилище — мощный бланк для ловли на ходу под мотором'],
      ];
      const hit = map.find(([re]) => re.test(t));
      return hit ? { token: m[0], kind: 'удилище', label: m[1], detail: hit[1].charAt(0).toUpperCase() + hit[1].slice(1) + '.' } : null;
    },
  },
  // Pieces: 2pc, 2 sec, 4-piece
  {
    kind: 'удилище',
    re: /(?<![\d.,])([1-6])\s?[-]?\s?(pc|pcs|piece|sec|секц\w*|кол\w*)(?![\wа-яё])/giu,
    make: (m) => ({ token: m[0], kind: 'удилище', label: `${m[1]} колен`, detail: `${m[1]} ${+m[1] === 1 ? 'колено' : +m[1] < 5 ? 'колена' : 'колен'}${+m[1] >= 4 ? ' — тревел-удилище, помещается в рюкзак' : ''}.` }),
  },
];

function ctxOf(text: string): Ctx {
  const rod = /(?<![\d.,])[SCB]?\d{3}-?(UL|ML|MH|XXH|XH|L|M|H)|\d\s?[-–—]\s?\d+\s?(g|г|oz)|\d{1,2}\s?(?:'|′|ft)|(?<![\wа-яё])(UL|ML|MH|XH|XXH)(?![\wа-яё])|rod|удил|spinning|casting|feeder|фидер|спиннинг/iu.test(text);
  const lure = /\d{2,3}\s?(mm|мм)?\s?[-/]?\s?(SSR|SDR|XDR|MDR|DD|SR|MR|DR|SP|SU|SS|FS)\b|floating|suspend|sinking|вобл|lure|minnow|crank|shad/iu.test(text);
  const feeder = /feeder|фидер|picker|пикер|кормуш/iu.test(text);
  return { rod, lure, feeder };
}

export function decodeMarking(input: string): Decoded {
  const text = input.trim();
  const empty: Decoded = { parts: [], unknown: [], gear: [], species: [], summary: '' };
  if (!text) return empty;
  const ctx = ctxOf(text);
  let rest = text;
  const parts: DecodedPart[] = [];
  for (const rule of RULES) {
    rest = rest.replace(rule.re, (...args) => {
      const m = args as unknown as RegExpMatchArray;
      const part = rule.make(m, ctx);
      if (!part) return m[0];
      parts.push(part);
      return ' '.repeat(m[0].length);
    });
  }
  const unknown = rest
    .split(/[\s,;/|()]+/u)
    .map((t) => t.replace(/^[-–—.]+|[-–—.]+$/g, ''))
    .filter((t) => t.length >= 2 && !/^[-–—.:]+$/.test(t));
  // keep parts in the order they appear in the input
  parts.sort((a, b) => text.indexOf(a.token) - text.indexOf(b.token));

  const gear = new Set<string>();
  const species = new Set<string>();
  const add = (ids: string[]) => ids.forEach((i) => species.add(i));
  const test = parts.find((p) => p.label.startsWith('тест'));
  const testMax = test ? num(test.label.split('–')[1]) : null;
  const rodLike = parts.some((p) => p.kind === 'удилище');
  const isFeeder = ctx.feeder || (testMax != null && testMax >= 60) || parts.some((p) => p.label.startsWith('фидер') || /фидер|feeder|пикер|picker/i.test(p.token));
  if (rodLike) {
    gear.add(isFeeder ? 'fider' : 'spinning');
    if (isFeeder) add(['abramis-brama', 'cyprinus-carpio', 'leuciscus-idus', 'carassius-gibelio']);
    else if (testMax != null) {
      if (testMax <= 7) add(['perca-fluviatilis', 'rutilus-rutilus', 'oncorhynchus-mykiss', 'leuciscus-leuciscus']);
      else if (testMax <= 21) add(['perca-fluviatilis', 'esox-lucius', 'sander-lucioperca', 'leuciscus-idus']);
      else if (testMax <= 45) add(['esox-lucius', 'sander-lucioperca']);
      else add(['esox-lucius', 'sander-lucioperca']);
    } else {
      const pw = parts.find((p) => p.label.startsWith('мощность'))?.label.split(' ')[1];
      if (pw === 'UL' || pw === 'L') add(['perca-fluviatilis', 'rutilus-rutilus', 'oncorhynchus-mykiss']);
      else if (pw === 'ML' || pw === 'M') add(['esox-lucius', 'perca-fluviatilis', 'sander-lucioperca']);
      else if (pw) add(['esox-lucius', 'sander-lucioperca']);
    }
  }
  const lure = parts.find((p) => p.kind === 'приманка' && p.label.startsWith('воблер') && /\d/.test(p.label));
  if (lure || parts.some((p) => p.kind === 'приманка')) {
    gear.add('vobler');
    const L = lure ? parseInt(lure.label.replace(/\D+/g, ' ').trim().split(' ')[0], 10) : 0;
    if (L && L <= 50) add(['perca-fluviatilis', 'leuciscus-idus', 'leuciscus-leuciscus']);
    else if (L && L <= 90) add(['esox-lucius', 'sander-lucioperca', 'perca-fluviatilis']);
    else if (L) add(['esox-lucius', 'sander-lucioperca']);
    else add(['esox-lucius', 'perca-fluviatilis']);
  }
  if (parts.some((p) => p.kind === 'силикон')) {
    gear.add('dzhig');
    add(['sander-lucioperca', 'perca-fluviatilis', 'esox-lucius']);
  }
  if (parts.some((p) => p.kind === 'вес') && !rodLike && !lure) gear.add('dzhig');
  if (parts.some((p) => p.kind === 'крючок') && !rodLike && !lure) {
    const n = parts.find((p) => p.kind === 'крючок');
    if (n && /\/0/.test(n.label)) gear.add('zhivets');
  }
  if (parts.some((p) => p.label.startsWith('катушка'))) gear.add('spinning');

  const summary = parts.length
    ? parts.map((p) => p.label).join(', ') + (unknown.length ? `. Не разобрано: ${unknown.join(', ')} — скорее всего, название модели или серии, по нему ничего не понять.` : '.')
    : 'Ничего знакомого: это либо название модели, либо артикул магазина. Смотрите цифры на бланке, упаковке или хвосте приманки.';
  return { parts, unknown, gear: [...gear], species: [...species], summary };
}
