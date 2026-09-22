import type { Rules, Spot, Species } from '@/data/types';
import type { HydroSnapshot } from '@/model/types';
import { inWindow, omskParts } from '@/lib/time';
import { mmddRu } from '@/lib/format';
import { ProvenanceBadge } from './Provenance';
import { Link } from 'react-router-dom';

interface Props {
  rules: Rules | undefined;
  spot: Spot;
  date: Date;
  speciesList: Species[]; // species at the spot (resolved)
  hydro: HydroSnapshot | null;
}

/** "Правила сегодня" for a spot: what applies on this date, here. */
export function RulesToday({ rules, spot, date, speciesList, hydro }: Props) {
  if (!rules) return <p className="empty">Правила не загружены.</p>;
  const p = omskParts(date);
  const LAKE = new Set(['озеро', 'пруд', 'водохранилище', 'платник']);
  const windows = rules.spawning_bans.filter((w) => {
    if (w.species) return false;
    const a = w.applies_to;
    return (a.all || a.spot_types?.includes(spot.type)) && inWindow(p, w.from, w.to);
  });
  const pitsActive = inWindow(p, rules.winter_pits_ban.from, rules.winter_pits_ban.to);
  const zone = hydro?.zone;
  const sizes = speciesList.filter((s) => rules.min_size_cm[s.id]).map((s) => `${s.names.ru.toLowerCase()} от ${rules.min_size_cm[s.id]} см`);
  const limits = rules.daily_limits.filter((l) => speciesList.some((s) => s.id === l.species_id));
  const bannedHere = speciesList.filter((s) => rules.banned_species.some((b) => b.id === s.id));
  return (
    <div className="rules-today">
      {zone?.inside && (
        <div className="callout callout--ban">
          <p><strong>Вы в запретной зоне «{zone.name}».</strong> Зимовальная яма закрыта с {mmddRu(rules.winter_pits_ban.from)} по {mmddRu(rules.winter_pits_ban.to)}: ловить нельзя вообще.</p>
        </div>
      )}
      {zone && !zone.inside && (
        <div className="callout callout--restricted">
          <p><strong>Рядом запретная зона «{zone.name}»</strong> — примерно {zone.distance_m} м. Граница на карте приблизительная: держитесь дальше.</p>
        </div>
      )}
      {windows.map((w) => (
        <div key={w.id} className="callout callout--restricted">
          <p><strong>Нерестовый запрет до {mmddRu(w.to)}.</strong> {w.scope}. Можно: {w.what_is_allowed}.</p>
        </div>
      ))}
      {!windows.length && !zone?.inside && (
        <div className="callout callout--ok">
          <p><strong>Сегодня здесь ловить можно.</strong> {pitsActive && !LAKE.has(spot.type) ? 'Зимовальные ямы на Иртыше закрыты — они отмечены штриховкой на карте.' : 'Действуют общие нормы: снасти, размеры, суточная норма.'}</p>
        </div>
      )}
      {bannedHere.length > 0 && (
        <p><strong>Нельзя ловить:</strong> {bannedHere.map((s) => s.names.ru.toLowerCase()).join(', ')}. Попалась — отпустить сразу.</p>
      )}
      <dl className="kv">
        {sizes.length > 0 && (
          <>
            <dt>Размер</dt>
            <dd>{sizes.join(', ')}; меньше — отпустить</dd>
          </>
        )}
        <dt>Норма</dt>
        <dd>
          {limits.map((l) => `${l.name.toLowerCase()} ${l.limit}`).join(', ')}
          {limits.length ? '; ' : ''}всего {rules.total_daily_kg.split(';')[0]}
        </dd>
        <dt>Снасти</dt>
        <dd>не больше {rules.gear.hooks_max} крючков, не больше 10 жерлиц{LAKE.has(spot.type) ? '; сеть в озере только после регистрации' : '; сети в реках запрещены'}</dd>
        {spot.type === 'платник' && (
          <>
            <dt>Платник</dt>
            <dd>у хозяина свои условия по норме и снастям, но общие правила тоже действуют</dd>
          </>
        )}
      </dl>
      <p className="caption">
        <ProvenanceBadge kind="official" /> {rules.source_title.split('«')[0].trim()}, редакция {rules.edition_date.split('-').reverse().join('.')}. <Link to="/rules">Все правила и штрафы</Link>
      </p>
    </div>
  );
}
