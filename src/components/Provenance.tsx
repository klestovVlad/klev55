import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import type { Provenance } from '@/data/types';
import './provenance.css';

const LABEL: Record<Provenance, { short: string; long: string }> = {
  measured: { short: 'измерено', long: 'Измерено или загружено из живого источника: прогноз погоды, наблюдение, гидропост. Рядом всегда стоит дата.' },
  official: { short: 'по правилам', long: 'Взято из официального документа: правил рыболовства, постановления о таксах, КоАП. Источник и дата редакции указаны на экране «Правила».' },
  reference: { short: 'справочник', long: 'Справочное значение из биологических источников: размеры, сроки нереста, фото с указанием автора и лицензии.' },
  generated: { short: 'оценка', long: 'Сгенерировано экспертной моделью, не измерение. Это ориентир опытного рыбака, собранный по общим знаниям и обобщённым отчётам, а не факт из базы данных.' },
};

export function ProvenanceBadge({ kind, note }: { kind: Provenance; note?: string }) {
  const [open, setOpen] = useState(false);
  const l = LABEL[kind];
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={`prov prov--${kind}`} aria-label={`Происхождение данных: ${l.short}`}>
          {l.short}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="prov-pop" sideOffset={6} collisionPadding={12}>
          <p>{l.long}</p>
          {note && <p className="muted">{note}</p>}
          <Popover.Arrow className="prov-pop__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
