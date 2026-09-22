import './weatherlegend.css';

/** One-line legend for the weather overlay; shown only while the layer is on. */
export function WeatherLegend({ fetchedAt }: { fetchedAt?: string }) {
  const at = fetchedAt ? new Date(fetchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div className="wxl" role="note" aria-label="Легенда погодного слоя">
      <span className="wxl__item"><i className="wxl__arrow" /> ветер по потоку</span>
      <span className="wxl__item"><i className="wxl__rain" /> дождь</span>
      <span className="wxl__item"><i className="wxl__cloud" /> облака</span>
      <span className="wxl__item muted">прогноз на выбранный час{at ? `, ${at}` : ''}</span>
    </div>
  );
}
