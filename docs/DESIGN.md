# Клёв 55 — design brief

## What it must feel like

A field guide you keep in the car door, opened on the bank. Not a dashboard, not an "outdoors brand". The subject supplies the look: the Irtysh in September (steel-blue water, grey sky), first ice, dry reed, the black-and-white gauge staff (водомерная рейка) on the pier, a printed атлас-определитель with one photo and one column of text per fish.

## Palette (6 named colors)

| Name | Light | Dark | Role |
|------|-------|------|------|
| Иртыш `--ink` | `#14232B` | `#E6ECEF` | text, icons; body text on paper ≥ 7:1 |
| Лёд `--paper` | `#F2F5F6` | `#0F1A20` | page background |
| Снег `--surface` | `#FFFFFF` | `#182630` | sheets, panels, inputs |
| Река `--river` | `#2F5D75` | `#7FB0CC` | links, active chip, primary button, water on map |
| Камыш `--reed` | `#6E7F3A` | `#A9BD5E` | "good" chance mid-tone, positive factors |
| Закат `--amber` | `#D8821F` | `#F0A24A` | high chance, the one warm accent |
| Запрет `--ban` | `#B0382C` | `#E4685B` | bans, danger, hatched zones — sparingly |

Neutrals derived from Иртыш: `--muted` (text at 4.6:1 for secondary lines), `--line` (hairlines), `--wash` (chip backgrounds).

Chance scale (the memorable thing): 0 → ice grey `#A9B4BA`, 40 → river `#2F5D75`, 65 → reed `#6E7F3A`, 85+ → amber `#D8821F`. Grey-blue → green → amber is readable for deuteranopia (no red/green pair), and it reads as "cold water → warm bite". The same scale colors map dots, the hourly bars, the planner rows and the verdict number. Nothing else on screen is amber.

## Type

Two families, both with proper Cyrillic, bundled as woff2 (offline PWA):

- **Golos Text** (400, 500, 600) — all UI, body, tables, chips. Russian-designed, compact, sharp at 16 px on a phone in sunlight.
- **Literata** (opsz, 500/600) — the verdict line, screen titles, fish names. The "printed guide" voice, used only where the app speaks a sentence to you.

Scale (mobile / desktop):

| Token | px | Use |
|-------|----|-----|
| `--t-caption` | 14 / 13 | provenance badges, table headers, axis labels |
| `--t-body` | 16 / 15 | body, chips, list rows |
| `--t-lead` | 18 / 17 | spot name in sheet, section leads |
| `--t-h2` | 22 / 22 | section titles (Literata) |
| `--t-h1` | 28 / 32 | screen titles, species name (Literata) |
| `--t-verdict` | 44 / 52 | the chance number (Golos 600, tabular figures) |

Line-height 1.45 body, 1.2 headings. No all-caps. No letter-spaced eyebrows. Sentence case everywhere.

## Layout

Mobile 390 × 844:

```
┌───────────────────────────────┐
│ ⌕ Место, вода, рыба       ◎  │  search + locate, floating on map
│ [Щука ▾] [Спиннинг] [≤60 км] │  chip row, horizontal scroll
│                               │
│           ●    ●              │  map, dots colored by chance
│      ●  ●         ●           │  (size = confidence)
│               ●               │
│ ▒▒▒ зимовальная яма (акт.)    │  hatched only when active today
│                               │
├── ═══ ────────────────────────┤  sheet handle (peek state)
│ Сегодня, сб 26 сен, 07:00     │  Literata line: the verdict
│ Щука берёт на Иртыше ниже     │
│ Черлака: 74, лучшие часы 6–9  │
│ ○───●───────○ время           │  scrubber: now → +48 h → 7 d
│ Ачаирский затон       74  18м │  rows: name, chance, drive
│ Черлак, коса          71  55м │
├───────────────────────────────┤
│  Карта    План    Рыбы   Правила │ tab bar, 4 items, 56 px
└───────────────────────────────┘
```

Spot sheet (half → full):

```
│ ═══                           │
│ Ачаирский затон               │  Literata h1
│ Иртыш · старица  18 мин  2/3  │  ← NOT a middle-dot string; rendered as
│                               │     three separate muted labels with gaps
│      74   сейчас хорошо       │  number in chance color, verdict word
│  ▲ сезон +20  ▲ бровка +10    │  top 3 factors as inline chips
│  ▼ ветер −6      все причины ›│
│ Щука 74  Судак 61  Окунь 55   │  species row, tappable
│ ┌ Как ловить ┬ Советы ┬ Правила сегодня ┬ Вода ┐
│ ...                           │
```

Desktop 1440 × 900: left panel 440 px (sheet content, scrollable), map fills the rest; tab bar becomes a slim left rail of 4 icons + labels. Species and Rules screens are two-column text (max 72 ch) with the map collapsed to a strip on the right showing "где ловить".

## The memorable element

The map, colored by chance, recoloring as you drag the time scrubber. Second: the hourly chart drawn like a gauge staff — 24 vertical bars with the black-and-white tick ruler underneath, sunrise/sunset drawn as thin lines, the solunar majors as a soft band. Everything else is plain: text, hairlines, two chip styles.

## Components (the whole kit)

chip (default / selected / with count), sheet, tab bar, verdict block (number + word + top factors), factor row, species row, spot row, hour chart, month bar, provenance badge (four kinds: измерено / по правилам / справочник / оценка), rule callout (ok / restricted / banned), photo credit line, empty state, toast. That is it. No generic "card": lists of peers get a hairline between rows, not boxes.

## Five principles

1. **Вердикт, потом причины.** Каждый экран начинает с одной фразы-ответа. Каждое число раскрывается в список факторов по тапу.
2. **Одна тёплая вещь.** Янтарный цвет только для высокого шанса. Если на экране два янтарных элемента, один лишний.
3. **Честность видна, а не спрятана.** Бейдж «оценка» стоит у любого сгенерированного значения, дата — у любого измерения. Бейдж один раз объясняется по тапу.
4. **Перчатки и солнце.** Цели 44 px, текст 16 px, контраст 7:1 на светлой теме, никаких hover-only состояний, никаких жестов без кнопочной альтернативы.
5. **Справочник, не панель.** Текст с типографикой, таблицы с линейками. Карточки только для списков равных сущностей (результаты планировщика). Тень одна, для листа над картой.

## Self-critique (required by brief)

*Does it read as a generic dashboard?* The first draft had the conditions strip as six equal tiles with big numbers. That is the dashboard reflex. Replaced by one line of text with inline values ("−2°, 1018 гПа ↓, ветер С 4 м/с, облачно, восход 7:12") and a single 72-h pressure sparkline; only the chance number is big.

*Does it read as a generic outdoors app?* Green-and-tan with a mountain icon was avoided; the palette is river-grey-blue with one amber, the photos are the only "nature" imagery. Icons are line icons, 1.5 px stroke, no filled badges.

*Forbidden list check:* no cream-plus-terracotta (paper is cold, accent is amber not terracotta); no black-plus-acid-green; no identical cards (see principle 5); no ALL-CAPS eyebrows; no middle-dot meta strings (meta rendered as separate labels); no monospace for data (tabular figures in Golos instead).

*Deviation from brief, on purpose (D-010):* one consistent shadow for the sheet, neutrals as the base, and rounded 44 px controls. The angler needs familiar controls, not novelty.

## Motion

Only in response to actions: sheet snap (200 ms, ease-out), chip select (120 ms), dot recolor on scrubber (150 ms color transition), tab switch (none). `prefers-reduced-motion` disables all durations.

## Dark theme

Same tokens, inverted roles (see table). Chance scale stays the same hues, lightened 10 % for contrast on the dark paper. Map switches to the dark basemap style.
