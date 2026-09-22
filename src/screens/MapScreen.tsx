import { useEffect, useState } from 'react';
import { useDesktop } from '@/lib/useMedia';
import { MapView } from '@/components/MapView';
import { FilterBar } from '@/components/FilterBar';
import { Sheet } from '@/components/Sheet';
import { TimeScrubber } from '@/components/TimeScrubber';
import { SpotList } from '@/components/SpotList';
import { SpotSheet } from '@/screens/SpotSheet';
import { WaterSheet } from '@/screens/WaterSheet';
import { useStore } from '@/app/store';
import { useSpotScores } from '@/model/useScores';
import { useSpecies } from '@/data/load';
import { chanceWord, dayLong, timeHM } from '@/lib/format';
import { ConditionsStrip } from '@/components/ConditionsStrip';
import './mapscreen.css';

export function MapScreen() {
  const [snap, setSnap] = useState<number | string | null>(0.34);
  const desktop = useDesktop();
  const peek = !desktop && snap === 0.34;
  const { spotId, waterId, speciesId } = useStore();
  const set = useStore((s) => s.set);
  const { scores, date, ready, offline } = useSpotScores();
  const species = useSpecies();
  const sp = species.data?.items.find((s) => s.id === speciesId);

  useEffect(() => {
    if (spotId || waterId) setSnap(0.62);
  }, [spotId, waterId]);

  const best = scores[0];
  const now = date.getTime() - Date.now() < 3600000;
  const verdict = best
    ? `${sp ? sp.names.ru : best.species.names.ru} ${now ? 'сейчас' : `${dayLong(date)} в ${timeHM(date)}`}: ${chanceWord(best.result.score)} — ${best.spot.name}${best.spot.drive_min != null ? `, ${best.spot.drive_min} мин` : ''}`
    : ready
      ? 'Под эти фильтры мест нет'
      : 'Загружаем места…';

  return (
    <div className="mapscreen">
      <MapView />
      <FilterBar />
      <Sheet snap={snap} onSnap={setSnap}>
        {spotId ? (
          <SpotSheet spotId={spotId} onBack={() => set({ spotId: null })} />
        ) : waterId ? (
          <WaterSheet waterId={waterId} onBack={() => set({ waterId: null })} />
        ) : (
          <>
            <p className="mapscreen__verdict">{verdict}</p>
            {offline && <p className="caption">Нет прогноза — включите интернет. Места, рыбы и правила работают офлайн.</p>}
            <TimeScrubber />
            <ConditionsStrip date={date} />
            <h2 className="mapscreen__h2">Куда ехать</h2>
            <SpotList scores={scores} limit={peek ? 3 : 80} />
            {peek && scores.length > 3 && (
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setSnap(0.62)}>
                Показать все {scores.length}
              </button>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
