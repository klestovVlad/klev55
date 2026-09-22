# Author brief for species content (Клёв 55)

You are writing the knowledge layer of a fishing atlas for Omsk and 200 km around it (Irtysh basin, Western Siberia). Output: one JSON file per species in `content/species/<id>.json`, matching the `Species` interface in `src/data/types.ts` exactly. Validate with:

```
npx tsx scripts/validate-species.ts content/species/<id>.json
```

Fix every error the validator prints before you finish. Set `photo: null` (photos are attached by a script later).

## Voice and honesty

- Russian, angler's voice, plain, concrete, regional. Use local words where anglers do: чебак, сорога, сырок, подлещик, шурогайка, закидушка, глухозимье, перволёдье, бровка, коряжник, свал, плёс, коса, старица, затон.
- No marketing, no "уникальный", no generic filler ("эта рыба любит чистую воду"). Every sentence must carry information an Omsk angler would find useful.
- Regional specificity beats generality. Wrong examples: "ловится на червя". Right: "на Иртыше язь берёт горох и пареную пшеницу с июля, у берега на отбойной струе".
- You are an expert generating priors, not a database. Mark every field's provenance honestly in `provenance`: `generated` for your expertise, `reference` only when a value is standard biological reference (max sizes, spawning temperatures from ichthyology), `official` for `rules_ref`. When unsure of a regional fact, say so inside the text ("по отчётам", "встречается редко") rather than asserting.
- Do not invent statistics, percentages, or named sources. Do not cite URLs.
- `presence` reflects the 200 km circle: common | local (some waters) | rare | stocked (only in paid/stocked ponds).

## Official rules for Омская область (provenance `official`, from Приказ Минсельхоза № 646, ред. 08.06.2026; Omsk section unchanged since 25.06.2024)

- Min sizes (`rules_ref.min_size_cm`): щука 30, судак 33, лещ 26, язь 25. All other species: `null`.
- Daily limits (`rules_ref.daily_limit`): щука "10 кг", лещ "10 кг", язь "10 кг", судак "5 кг". Everything else: `null` (no species norm; the total daily norm is 10 kg for all species combined, or one fish heavier than 10 kg).
- Banned everywhere (status.legal = "banned"): осётр сибирский, стерлядь, нельма. Муксун is NOT banned in the Omsk section (do not claim it is); it is rare and carries a very high damage tariff (70 083 ₽) — legal = "allowed", presence "rare", with a strong note.
- Красная книга Омской области (status.red_book = true): осётр сибирский, нельма. Стерлядь is NOT in the regional Red Book (banned by fishing rules only).
- Spawning bans: Иртыш and all tributaries 20.04–20.05; all lakes 25.04–25.05; стерлядь 20.04–15.06. During the ban: one rod (поплавочная/донная) or spinning/feeder from shore, ≤ 2 hooks total, no boats.
- Зимовальные ямы on the Irtysh closed 15.11–20.04 (all fishing).
- Gear: ≤ 10 hooks per person total, ≤ 10 жерлиц/кружков, троллинг allowed.
- Damage tariffs per fish (Постановление № 1321): осётр сибирский 160 456 ₽, муксун 70 083, нельма 10 811, стерлядь 4 572, судак 3 305, щука/сазан/карп/пелядь/амур/толстолобик/форель 925, налим/линь/язь/лещ/густера 500, плотва/елец/карась/окунь 250, other 100. ×2 in banned periods/places. Mention the tariff in `handling` for banned species only.

## Описторхоз (Роспотребнадзор, ЦГОН) — for `edible`

Carriers are cyprinids (карповые). Omsk oblast is one of the most endemic regions in Russia (Обь-Иртышский очаг).
- Risk: high — язь, елец, плотва/чебак, лещ, линь, густера, красноперка, уклейка, пескарь, верховка, гольян; medium — карась, сазан/карп, амур, толстолобик (cyprinids but less often infected); none — щука, судак, окунь, ёрш, налим, ротан, стерлядь, осётр, нельма, пелядь, муксун, форель (not carriers; note that щука can carry other parasites — mention plerocercoids of лентец широкий for щука, налим, окунь, ёрш → thorough cooking, risk field stays "none" for описторхоз but say it in safe_preparation).
- Safe preparation (write it per species, in Russian, keep numbers exact): freezing ≤ −20 °C ≥ 24 h (or ≤ −35 °C ≥ 15 h); frying in small pieces 15–20 min; boiling ≥ 20 min from the boil; pies ≥ 1 h; strong salting 2 kg salt per 10 kg fish — 10 days for пескарь/уклейка/гольян/верховка, 21 days for плотва/елец and язь/лещ/линь under 25 cm, 40 days for язь/лещ/линь over 25 cm; drying 3 weeks after a 3-day strong salting. Never taste raw fish or mince. Separate board and knife for raw fish.

## Activity curves

- `activity_by_month`: 12 integers 0–10, January first. Reflect the Omsk climate: ice roughly early/mid November to mid/late April on lakes, Irtysh freezes late November, ice-out on the Irtysh mid/late April, spawning ban 20.04–20.05 (rivers) → during the ban the value describes biology, not legality. Do not give every species a high autumn peak; think.
- `activity_by_hour.openwater` and `.ice`: 24 integers, hour 0 = midnight Omsk time. Openwater curves usually have dawn and dusk peaks; ice curves are usually daytime with a midday lull; налим is a night fish; лещ feeds at night in summer.

## Methods

`methods[].name` must be one of: спиннинг | фидер | поплавок | донка | жерлицы | мормышка | балансир | блесна | нахлыст | троллинг. Use 2–5 methods per species, the ones anglers actually use here. `gear` gives rod length/test, line diameter, hook sizes. `rig` names the rig (e.g. "патерностер", "инлайн", "отводной поводок", "джиг-головка 8–14 г"). `technique` is 2–4 sentences of how, where and when.

## Lifehacks

3–6 per species. Each is one or two sentences, concrete, regional, with a "why" when it helps. Bad: "используйте свежую наживку". Good: "На Оми у Кормиловки сазан осенью держится под обрывистым правым берегом на входе в ямы; ставьте кормушку на границе течения и затишья, а не в самой яме."

## Aliases

Fill `names.aliases` with local and general Russian synonyms (e.g. плотва: чебак, сорога, сибирская плотва; пелядь: сырок; судак: клыкастый; small pike: шурогайка/щурёнок; лещ small: подлещик). Include the Latin subspecies where Siberian forms differ (e.g. Rutilus rutilus lacustris, Leuciscus leuciscus baicalensis, Gobio gobio cynocephalus).

## Description (120–180 words)

Angler voice: what it looks like, how to tell it from look-alikes (окунь vs ёрш juveniles; язь vs плотва vs голавль (absent here); карась серебряный vs золотой; густера vs подлещик; стерлядь vs осётр juveniles), typical sizes here, where it lives in our waters, one honest note about its status in the region.

## Size

`typical_cm: [min, max]` and `typical_kg: [min, max]` for fish an angler usually catches here; `trophy_kg` a realistic regional trophy (not the world record).

## Handling

One paragraph: unhooking (teeth, spines, gill rakers), keeping alive (кукан, садок; when it dies fast), releasing (wet hands, no time on the ice), legal note (min size, release undersized immediately; banned species → release at once, do not photograph on the shore for long).
