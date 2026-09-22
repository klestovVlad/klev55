import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import { useDesktop } from '@/lib/useMedia';
import './sheet.css';

export type SnapKey = 'peek' | 'half' | 'full';
/** Visible height of the sheet as a fraction of the viewport (the tab bar sits below). */
export const SNAPS: Record<SnapKey, number> = { peek: 0.34, half: 0.62, full: 0.96 };

interface Props {
  children: ReactNode;
  snap: SnapKey;
  onSnap: (s: SnapKey) => void;
}

/**
 * Bottom sheet on mobile, side panel on desktop. Three snap points; drag on the
 * handle/header area, tap the handle to cycle. Body scrolls independently.
 * Hand-rolled instead of a library so the behaviour is identical on every device.
 */
export function Sheet({ children, snap, onSnap }: Props) {
  const desktop = useDesktop();
  const ref = useRef<HTMLElement>(null);
  // Height of the area the sheet lives in (map area above the tab bar), not the window: otherwise "full" overshoots the top.
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight - 60 : 800));
  const [dragY, setDragY] = useState<number | null>(null);
  const start = useRef<{ y: number; t: number; base: number } | null>(null);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const measure = () => setVh(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [desktop]);

  if (desktop) return <aside className="panel">{children}</aside>;

  const visible = (k: SnapKey) => (k === 'full' ? vh - 8 : Math.round(vh * SNAPS[k]));
  const current = dragY ?? visible(snap);
  const onDown = (e: RPointerEvent) => {
    start.current = { y: e.clientY, t: Date.now(), base: visible(snap) };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    if (!start.current) return;
    const next = Math.max(visible('peek') * 0.6, Math.min(visible('full'), start.current.base - (e.clientY - start.current.y)));
    setDragY(next);
  };
  const onUp = (e: RPointerEvent) => {
    if (!start.current) return;
    const dy = start.current.y - e.clientY; // up = positive
    const dt = Math.max(1, Date.now() - start.current.t);
    const v = dy / dt; // px per ms
    const end = start.current.base + dy;
    start.current = null;
    setDragY(null);
    const keys: SnapKey[] = ['peek', 'half', 'full'];
    if (Math.abs(dy) < 6) {
      // tap on the handle: cycle
      onSnap(keys[(keys.indexOf(snap) + 1) % keys.length]);
      return;
    }
    if (Math.abs(v) > 0.6) {
      const i = keys.indexOf(snap);
      onSnap(keys[Math.max(0, Math.min(2, i + (v > 0 ? 1 : -1)))]);
      return;
    }
    let best: SnapKey = 'peek';
    for (const k of keys) if (Math.abs(visible(k) - end) < Math.abs(visible(best) - end)) best = k;
    onSnap(best);
  };

  return (
    <section ref={ref} className={`sheet${dragY != null ? ' sheet--dragging' : ''}`} style={{ height: `${Math.min(current, vh)}px` }} aria-label="Панель мест">
      <div className="sheet__grip" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} role="button" tabIndex={0} aria-label={snap === 'full' ? 'Свернуть панель' : 'Развернуть панель'} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSnap(snap === 'full' ? 'peek' : snap === 'peek' ? 'half' : 'full'); } }}>
        <span className="sheet__handle" />
      </div>
      <div className="sheet__body">{children}</div>
    </section>
  );
}
