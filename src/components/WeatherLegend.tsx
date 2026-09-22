import './weatherlegend.css';

/** Legend for the weather overlay; shown only while the layer is on. */
export function WeatherLegend({ fetchedAt }: { fetchedAt?: string }) {
  return (
    <div className="wxl" role="note" aria-label="Легенда погодного слоя">
      <span className="wxl__item"><i className="wxl__arrow" /> ветер: стрелка по потоку, длиннее — сильнее</span>
      <span className="wxl__item"><i className="wxl__rain" /> дождь, гуще — сильнее</span>
      <span className="wxl__item"><i className="wxl__cloud" /> облачность от 50 %</span>
      <span className="wxl__src caption">Open-Meteo, сетка ~60 км, на выбранный час{fetchedAt ? `, получено ${new Date(fetchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
    </div>
  );
}
