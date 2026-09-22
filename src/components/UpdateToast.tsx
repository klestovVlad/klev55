/**
 * Service-worker updates: the new build is fetched in the background (on load, when the app comes
 * back to the foreground, and hourly), then the angler is asked once — never reloaded mid-cast.
 */
import { useRegisterSW } from 'virtual:pwa-register/react';
import './updatetoast.css';

const HOUR = 60 * 60 * 1000;

export function UpdateToast() {
  const {
    needRefresh: [need, setNeed],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      if (!r) return;
      const check = () => {
        if (navigator.onLine) r.update().catch(() => {});
      };
      setInterval(check, HOUR);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
  if (!need) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__text">Есть новая версия приложения.</span>
      <button type="button" className="btn btn--small" onClick={() => updateServiceWorker(true)}>Обновить</button>
      <button type="button" className="btn btn--ghost btn--small" onClick={() => setNeed(false)} aria-label="Позже">Позже</button>
    </div>
  );
}
