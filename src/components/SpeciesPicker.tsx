import * as Dialog from '@radix-ui/react-dialog';
import { useSpecies } from '@/data/load';
import { useStore } from '@/app/store';
import { Chip } from './Chip';
import './dialog.css';

const ORDER = ['common', 'local', 'stocked', 'rare'];
const GROUP: Record<string, string> = { common: 'Обычные', local: 'Местами', stocked: 'Зарыбляемые', rare: 'Редкие и запрещённые' };

export function SpeciesPicker({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const species = useSpecies();
  const speciesId = useStore((s) => s.speciesId);
  const set = useStore((s) => s.set);
  const pick = (id: string | null) => {
    set({ speciesId: id });
    onOpenChange(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dlg__overlay" />
        <Dialog.Content className="dlg" aria-describedby={undefined}>
          <div className="dlg__head">
            <Dialog.Title>Какую рыбу ищем</Dialog.Title>
            <Dialog.Close className="dlg__close" aria-label="Закрыть">×</Dialog.Close>
          </div>
          <div className="dlg__body">
            <div className="chip-row" style={{ flexWrap: 'wrap' }}>
              <Chip selected={!speciesId} onClick={() => pick(null)}>Любая рыба</Chip>
            </div>
            {ORDER.map((g) => {
              const items = (species.data?.items ?? []).filter((s) => s.presence === g && s.status.legal !== 'banned');
              if (!items.length) return null;
              return (
                <div key={g} className="section">
                  <h3>{GROUP[g]}</h3>
                  <div className="chip-row" style={{ flexWrap: 'wrap' }}>
                    {items.map((s) => (
                      <Chip key={s.id} selected={speciesId === s.id} onClick={() => pick(s.id)}>
                        {s.names.ru}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="caption">Осётр, стерлядь и нельма не показаны: их ловить нельзя. Подробнее на экране «Правила».</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
