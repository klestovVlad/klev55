/**
 * Renders text with tackle terms turned into tappable links: a popover with the card's photo and
 * two lines, plus a link to the glossary. Matching is by the cards' aliases (longest first, whole words).
 */
import { useMemo, useState, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Link } from 'react-router-dom';
import { useGear } from '@/data/load';
import type { GearItem } from '@/data/types';
import './geartext.css';

interface Index {
  re: RegExp | null;
  byAlias: Map<string, GearItem>;
}

function buildIndex(items: GearItem[]): Index {
  const byAlias = new Map<string, GearItem>();
  for (const g of items) for (const a of [g.name, ...g.aliases]) byAlias.set(a.toLowerCase(), g);
  const aliases = [...byAlias.keys()].sort((a, b) => b.length - a.length).map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!aliases.length) return { re: null, byAlias };
  // Cyrillic-aware word boundaries.
  const re = new RegExp(`(?<![а-яёa-z])(${aliases.join('|')})(?![а-яёa-z])`, 'giu');
  return { re, byAlias };
}

export function useGearIndex(): Index {
  const gear = useGear();
  return useMemo(() => buildIndex(gear.data?.items ?? []), [gear.data]);
}

export function GearTerm({ item, children }: { item: GearItem; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const base = import.meta.env.BASE_URL;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="gterm">{children}</button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="gpop" sideOffset={6} collisionPadding={12}>
          {item.illustration ? <img className="gpop__img gpop__scheme" src={base + item.illustration} alt={item.name} loading="lazy" /> : item.photo ? <img className="gpop__img" src={item.photo.url.startsWith('http') ? item.photo.url : base + item.photo.url} alt={item.name} loading="lazy" /> : null}
          <div className="gpop__body">
            <strong>{item.name}</strong> <span className="muted">{item.kind}</span>
            <p>{item.summary}</p>
            <p className="caption">{item.sizes}</p>
            <Link to={`/gear/${item.id}`} onClick={() => setOpen(false)}>Подробнее в словаре снастей</Link>
          </div>
          <Popover.Arrow className="gpop__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Text with highlighted tackle terms. Falls back to plain text until the glossary loads. */
export function GearText({ text }: { text: string }) {
  const { re, byAlias } = useGearIndex();
  const parts = useMemo(() => {
    if (!re) return [text];
    const out: ReactNode[] = [];
    let last = 0;
    let n = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) out.push(text.slice(last, i));
      const item = byAlias.get(m[0].toLowerCase());
      out.push(item ? <GearTerm key={n++} item={item}>{m[0]}</GearTerm> : m[0]);
      last = i + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }, [text, re, byAlias]);
  return <>{parts}</>;
}

/** A list of bait/lure names, each linked when it is a known term. */
export function GearList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <span key={i}>
          <GearText text={t} />
          {i < items.length - 1 ? ', ' : ''}
        </span>
      ))}
    </>
  );
}
