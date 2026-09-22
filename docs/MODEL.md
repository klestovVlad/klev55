# Bite chance model

`src/model/bite.ts` — `chance(input) → { score 0–100, legal, factors[], mode }`.
A transparent heuristic, not a trained model. The UI says so ("эвристика, не гарантия").
Every number on screen traces to one row of the weight table in `src/model/weights.ts`.

## Shape

```
score = clamp(38 + Σ factor.effect, 0, 100)
factor.effect ∈ [−30, +30], sorted by |effect| desc so the UI can show "top 3 reasons"
```

Legality is evaluated first and short-circuits:

| Condition | Result |
|-----------|--------|
| species in `rules.banned_species` or `status.legal = banned` | score 0, `legal: banned` |
| spot inside an active prohibited zone (`hydro.zone.inside`) | score 0, `legal: banned` |
| spawning window with `full_ban: true` matching the spot | score 0, `legal: banned`, factor «Нерестовый запрет» |
| spawning window with `full_ban: false` | `legal: restricted`, factor «Ограничение в нерест» −10, scoring continues |

## Factors

| Factor | Input | Effect |
|--------|-------|--------|
| Сезон | `activity_by_month`, interpolated by day of month | (a − 5) × 4 → −20..+20 |
| Время суток | `activity_by_hour[openwater|ice][hour]` | (a − 5) × 5 → −25..+25 |
| Солунар | moon transit / underfoot ±1 h (major), moonrise / moonset ±30 min (minor) | +8 / +4 |
| Сумерки | civil dawn / dusk ±45 min | +6 |
| Место для вида | `spot.species[].rank` | 5:+10, 4:+5, 3:0, 2:−6, 1:−12, absent:−25 |
| Место в сезоне | `spot.best_months` contains the month | +4 / −3 |
| Нерест | date inside `species.spawning` | −12 (biology; law is handled above) |
| Давление | Δ24 h msl | ≤3 stable +6; −8<Δ<−3 slow fall +4; ≤−8 fast fall −8; 3<Δ<8 slow rise −3; ≥8 fast rise −10; range 72 h >15 hPa −4; msl >1032 or <988 −4 |
| Ветер | speed, gusts, direction, Δtemp | <2: 0; 2–6: +4; 6–10: −3 (lake −6); >10: −12 (lake −18); gusts >15: −5; N wind + cooling ≥4°: −6 |
| Гроза / Осадки / Облачность / Солнце | WMO code, precip mm/h, cloud %, temp | thunder −15; rain >4 mm/h −8; light rain +2; overcast ≥70 % & warm & predator +5; clear summer noon >25 ° −6 |
| Похолодание | Jun–Aug, Δtemp24 ≤ −6 | −10 |
| Оттепель | ice season, Dec–Feb, temp > −3 and rising | +6 |
| Перволёдье / Последний лёд / Глухозимье | `hydro.ice_days ≤ 21` / `days_to_ice_off ≤ 21` / Jan–Feb | +10 / +8 / −6 (налим +8; shallow lake & sensitive species −15) |
| Уровень воды | gauge ≤ 40 km, Δlevel24 | > +15 cm −10; < −5 cm +5; May–June rivers −5 |
| Рядом запретная зона | active zone within 1 km | −5 |
| Нет прогноза | weather is null | 0 (informational) |

Species traits (predator, winter_active, shallow_lake_sensitive, prefers_ice) live in `TRAITS` in weights.ts.

## Mode

`ice` when `hydro.ice_on`; without hydro, Dec–Mar defaults to ice. Mode chooses the hourly activity curve.

## Outlook

`src/model/outlook.ts`:
- `hourly(ctx, from, hours)` — chance per hour using `weatherAt(series, date)`.
- `bestWindows(scores)` — contiguous runs of ≥2 h with score ≥ max(35, 0.8 × max), top 2.
- `dailyOutlook(ctx, from, 7)` — per day: max over 04–22 h, best window, legal summary.

Weather comes from the Open-Meteo forecast grid (`src/data/weatherGrid.ts`, nearest of ~33 points ≈ 60 km apart) with `past_days=3` so 24 h / 72 h pressure trends and the day-over-day temperature change can be computed client-side (`src/model/weather.ts`).

## Calibration

Base 38 so that a top spot (+10), peak month (+16), dawn hour (+15) and stable pressure (+6) land at ≈85 «отлично»; the same spot at midday ≈65 «хорошо»; at night ≈50 «так себе»; a rank-3 spot at midday ≈55. Words and colours share thresholds 40/60/80.

## Known limits

- Wind direction relative to the shore is not modelled (spots have no shore orientation); only the cold-north-wind rule uses direction.
- Water clarity is inferred from level trend only.
- Ice-on / ice-off dates come from a freezing-degree-day estimate (see `scripts/ice.ts`), which is itself `generated`.
- Weights are expert priors, not fitted. Tune them in one file.
