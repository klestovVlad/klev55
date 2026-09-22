import { useEffect, useState } from 'react';
import { Chip } from './Chip';

/** "Установить" for Chrome/Edge/Android (beforeinstallprompt); a short how-to for Safari/iOS. */
export function InstallButton() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (installed) return <p className="caption">Приложение установлено и работает офлайн.</p>;
  if (prompt)
    return (
      <p>
        <Chip onClick={async () => { await prompt.prompt(); setPrompt(null); }}>Установить на устройство</Chip>
        <span className="caption"> Появится значок на экране, откроется без адресной строки, будет работать без сети.</span>
      </p>
    );
  return (
    <p className="caption">
      {ios
        ? 'iPhone: в Safari нажмите «Поделиться» → «На экран Домой».'
        : 'Android и Chrome: меню браузера → «Установить приложение» (значок появляется после первой загрузки). Для установки нужен HTTPS.'}
    </p>
  );
}
