import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
import { useDesktop } from '@/lib/useMedia';
import './sheet.css';

interface Props {
  children: ReactNode;
  snap: number | string | null;
  onSnap: (s: number | string | null) => void;
}

const SNAPS = [0.22, 0.55, 0.96];
export const SHEET_SNAPS = SNAPS;

/** Bottom sheet on mobile (vaul, non-modal so the map stays live), side panel on desktop. */
export function Sheet({ children, snap, onSnap }: Props) {
  const desktop = useDesktop();
  if (desktop) return <aside className="panel">{children}</aside>;
  return (
    <Drawer.Root open modal={false} dismissible={false} snapPoints={SNAPS} activeSnapPoint={snap} setActiveSnapPoint={onSnap} snapToSequentialPoint>
      <Drawer.Portal>
        <Drawer.Content className="sheet" aria-label="Панель мест">
          <div className="sheet__handle-wrap">
            <Drawer.Handle className="sheet__handle" />
          </div>
          <Drawer.Title className="visually-hidden">Панель мест</Drawer.Title>
          <div className="sheet__body">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
