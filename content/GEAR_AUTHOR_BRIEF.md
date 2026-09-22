# Gear glossary — author brief

Write `content/gear.json` matching `GearFile` in `src/data/types.ts`: `{ meta, items: GearItem[] }`. 32–40 items. Russian, angler's voice, plain, no brands, no shops, no prices, no "топ" lists. Classes of tackle, not models.

Cover at least:
- приманки: колебалка, вертушка, воблер (минноу/крэнк — one card «воблер»), джиг-головка с силиконом («джиг»), поролонка, балансир, вертикальная (отвесная) блесна, мормышка с насадкой, безмотылка (чёртик/гвоздик — one card), кружок/жерлица живец → card «живец», бойл, пеллетс, технопланктон
- наживки: червь, мотыль, опарыш, ручейник, короед, горох, перловка, кукуруза, тесто/болтушка, манка, хлеб, мормыш (бокоплав), малёк/живец (if not above)
- оснастки: патерностер (петля Гарднера), инлайн, асимметричная петля, отводной поводок, дроп-шот, кольцо (яйца), жерлица, поставушка, закидушка, кормушка-пружина («убийца карася» — describe neutrally as «пружина»), поплавочная оснастка со скользящим поплавком
- снасти: спиннинг (лёгкий/тяжёлый — one card with ranges), фидер, болонская удочка, маховая удочка, зимняя удочка (балалайка/кобылка), жерличная снасть, донка с амортизатором

Fields:
- `id`: latin slug. `name`: Russian, capitalised. `kind`: one of приманка | наживка | оснастка | снасть.
- `aliases`: 2–6 lowercase word forms and synonyms as they appear in angler texts, incl. common inflections (e.g. «колебалка», «колебалки», «колебалку», «колеблющаяся блесна», «колебло»). These are used for automatic highlighting in texts, so include the nominative and 2–3 oblique forms.
- `summary`: what it is, 1–2 sentences. `here`: when and for what fish it works around Omsk (Иртыш, Омь, Крутинские озёра, затоны, платники), 1–2 sentences, concrete. `sizes`: typical sizes/weights/hook numbers for our waters, one line.
- `species`: ids from `content/species/` (list the directory). `methods`: from the allowed list (спиннинг|фидер|поплавок|донка|жерлицы|мормышка|балансир|блесна|нахлыст|троллинг).
- `photo`: null. `commons_search`: an English or Latin search phrase likely to find a free photo on Wikimedia Commons of this class (e.g. "spoon lure fishing", "spinnerbait inline spinner", "jig head soft plastic lure", "balance jig ice fishing", "bloodworm chironomid larvae bait", "boilies carp bait", "feeder fishing rig", "ice fishing rod"). Keep it specific.
- `provenance`: "generated".
- meta: { generated_at: ISO now, sources: ["Экспертная модель (generated)"], license: "CC BY-SA 4.0" }.

Validate JSON with `node -e "JSON.parse(require('fs').readFileSync('content/gear.json','utf8'));console.log('ok')"`. Check every `species` id exists in content/species. Do not touch other files.
