import { useEffect, useRef, useState } from 'react';
import { useDesktop } from '@/lib/useMedia';
import { lazy, Suspense } from 'react';
const MapView = lazy(() => import('@/components/MapView').then((m) => ({ default: m.MapView })));
import { FilterBar } from '@/components/FilterBar';
import { Sheet, type SnapKey } from '@/components/Sheet';
import { TimeScrubber } from '@/components/TimeScrubber';
import { SpotList } from '@/components/SpotList';
const SpotSheet = lazy(() => import('@/screens/SpotSheet').then((m) => ({ default: m.SpotSheet })));
const WaterSheet = lazy(() => import('@/screens/WaterSheet').then((m) => ({ default: m.WaterSheet })));
import { useStore } from '@/app/store';
import { useSpotScores, useAllData } from '@/model/useScores';
import { useSpecies } from '@/data/load';
import { chanceWord, dayLong, timeHM } from '@/lib/format';
import { ConditionsStrip } from '@/components/ConditionsStrip';
import { WeatherLegend } from '@/components/WeatherLegend';
import './mapscreen.css';

export function MapScreen() {
  const [snap, setSnap] = useState<SnapKey>('peek');
  const desktop = useDesktop();
  const peek = !desktop && snap === 'peek';
  const { spotId, waterId, speciesId, layers, panelOpen } = useStore();
  const prevSnap = useRef<SnapKey | null>(null);
  const set = useStore((s) => s.set);
  const { scores, date, ready, offline } = useSpotScores();
  const grid = useAllData().weather;
  const species = useSpecies();
  const sp = species.data?.items.find((s) => s.id === speciesId);

  useEffect(() => {
    if (spotId || waterId) setSnap('half');
  }, [spotId, waterId]);

  // One overlay at a time on a phone: the layers panel collapses the sheet, closing it restores the snap.
  useEffect(() => {
    if (desktop) return;
    if (panelOpen) {
      prevSnap.current = snap;
      setSnap('min');
    } else if (prevSnap.current) {
      setSnap(prevSnap.current);
      prevSnap.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen, desktop]);

  const best = scores[0];
  const now = date.getTime() - Date.now() < 3600000;
  const verdict = best
    ? `${sp ? sp.names.ru : best.species.names.ru} ${now ? 'сейчас' : `${dayLong(date)} в ${timeHM(date)}`}: ${chanceWord(best.result.score)} — ${best.spot.name}${best.spot.drive_min != null ? `, ${best.spot.drive_min} мин` : ''}`
    : ready
      ? 'Под эти фильтры мест нет'
      : 'Загружаем места…';

  return (
    <div className="mapscreen">
      {/* Verdict first: the map bundle is requested only once places and species are in. */}
      {ready ? (
        <Suspense fallback={<div className="map map--loading" aria-hidden="true" />}>
          <MapView />
        </Suspense>
      ) : (
        <div className="map map--loading" aria-hidden="true" />
      )}
      <FilterBar />
      {layers.weather && !spotId && !waterId && !panelOpen && <WeatherLegend fetchedAt={grid.data?.fetched_at} />}
      <Sheet snap={snap} onSnap={(k) => { if (panelOpen) { prevSnap.current = null; set({ panelOpen: false }); } setSnap(k); }}>
        {spotId ? (
          <Suspense fallback={<div className="skeleton" style={{ width: '60%' }} />}>
            <SpotSheet spotId={spotId} onBack={() => set({ spotId: null })} />
          </Suspense>
        ) : waterId ? (
          <Suspense fallback={<div className="skeleton" style={{ width: '60%' }} />}>
            <WaterSheet waterId={waterId} onBack={() => set({ waterId: null })} />
          </Suspense>
        ) : (
          <>
            <p className="mapscreen__verdict">{verdict}</p>
            {offline && <p className="caption">Нет прогноза — включите интернет. Места, рыбы и правила работают офлайн.</p>}
            <TimeScrubber />
            <ConditionsStrip date={date} />
            <h2 className="mapscreen__h2">Куда ехать</h2>
            <SpotList scores={scores} limit={peek || snap === 'min' ? 3 : 80} />
            {peek && scores.length > 3 && (
              <button type="button" className="btn btn--ghost btn--small mapscreen__more" onClick={() => setSnap('half')}>
                Показать все {scores.length}
              </button>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
