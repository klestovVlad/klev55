import { useStore } from '@/app/store';
import { useWater } from '@/data/load';
import { useSpotScores } from '@/model/useScores';
import { SpotList } from '@/components/SpotList';

const TYPE_RU: Record<string, string> = { river: 'река', stream: 'ручей', canal: 'канал', lake: 'озеро', pond: 'пруд', reservoir: 'водохранилище', oxbow: 'старица', riverbank: 'русло', wetland: 'болото' };

export function WaterSheet({ waterId, onBack }: { waterId: number; onBack: () => void }) {
  const water = useWater();
  const { scores } = useSpotScores();
  const set = useStore((s) => s.set);
  const f = water.data?.features.find((x) => x.properties?.osm_id === waterId);
  if (!f) return <p className="empty">Водоём не найден.</p>;
  const p = f.properties!;
  const name = (p.name as string) || `${TYPE_RU[p.type] ?? 'вода'} без названия`;
  const here = scores.filter((s) => s.spot.water_osm_id === waterId || (p.name && s.spot.water_name.toLowerCase() === String(p.name).toLowerCase()));
  const speciesHere = [...new Map(here.flatMap((s) => s.alternatives.map((a) => [a.species.id, a.species]))).values()];
  return (
    <div>
      <button type="button" className="ss__back" onClick={onBack}>‹ Все места</button>
      <h1 className="ss__title">{name}</h1>
      <div className="ss__meta">
        <span>{TYPE_RU[p.type] ?? p.type}</span>
        {p.area_km2 ? <span>{p.area_km2} км²</span> : null}
        {p.length_km && !['river', 'riverbank'].includes(p.type) ? <span>{p.length_km} км</span> : null}
        {p.jurisdiction === 'kz' && <span style={{ color: 'var(--ban)' }}>другая юрисдикция — правила РК не включены</span>}
        {p.salt && <span>солёное, рыбы нет</span>}
      </div>
      {p.jurisdiction === 'kz' ? (
        <p className="muted">Этот водоём в Казахстане. Правила рыболовства Республики Казахстан в приложение не включены, мест здесь нет.</p>
      ) : here.length ? (
        <>
          {speciesHere.length > 0 && (
            <p className="inline-list">
              {speciesHere.map((s) => (
                <button key={s.id} type="button" className="tag" onClick={() => set({ speciesId: s.id })}>{s.names.ru}</button>
              ))}
            </p>
          )}
          <h2 className="mapscreen__h2">Места на этой воде</h2>
          <SpotList scores={here} />
        </>
      ) : (
        <p className="muted">Описанных мест на этом водоёме пока нет. Если это озеро в степи, скорее всего здесь карась и ротан; на малой реке — щука у дамб и плотва. Проверьте правила по дате на экране «Правила».</p>
      )}
    </div>
  );
}
