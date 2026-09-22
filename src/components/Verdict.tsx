import { useState } from 'react';
import type { ChanceResult, Factor } from '@/model/types';
import { chanceColor, chanceWord } from '@/lib/format';
import { ProvenanceBadge } from './Provenance';
import './verdict.css';

function sign(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function FactorChip({ f }: { f: Factor }) {
  const tone = f.effect > 0 ? 'pos' : f.effect < 0 ? 'neg' : 'zero';
  return (
    <span className={`factor factor--${tone}`} title={f.reason}>
      <span className="factor__name">{f.name}</span>
      <span className="factor__eff">{sign(f.effect)}</span>
    </span>
  );
}

export function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <ul className="factors">
      {factors.map((f) => (
        <li key={f.name + f.reason}>
          <span className={`factors__eff factors__eff--${f.effect > 0 ? 'pos' : f.effect < 0 ? 'neg' : 'zero'}`}>{sign(f.effect)}</span>
          <span>
            <strong>{f.name}</strong> <span className="muted">— {f.reason}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  result: ChanceResult;
  speciesName: string;
  subtitle?: string;
  compact?: boolean;
}

/** The verdict: number, word, top-3 factors; tap → all factors. */
export function Verdict({ result, speciesName, subtitle, compact }: Props) {
  const [open, setOpen] = useState(false);
  const banned = result.legal === 'banned';
  const top = result.factors.slice(0, 3);
  return (
    <div className={`verdict${compact ? ' verdict--compact' : ''}`}>
      <button type="button" className="verdict__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="verdict__num" style={{ color: banned ? 'var(--muted)' : chanceColor(result.score) }}>
          {banned ? '—' : result.score}
        </span>
        <span className="verdict__text">
          <span className="verdict__word">{banned ? 'ловить нельзя' : `${speciesName.toLowerCase()}: ${chanceWord(result.score)}`}</span>
          {subtitle && <span className="verdict__sub">{subtitle}</span>}
          {result.legal_reason && <span className={`verdict__legal verdict__legal--${result.legal}`}>{result.legal_reason}</span>}
        </span>
      </button>
      {!banned && (
        <div className="verdict__factors">
          {top.map((f) => (
            <FactorChip key={f.name} f={f} />
          ))}
          {result.factors.length > 3 && (
            <button type="button" className="verdict__more" onClick={() => setOpen((o) => !o)}>
              {open ? 'скрыть' : 'все причины'}
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="verdict__all">
          <FactorList factors={result.factors} />
          <p className="caption">
            Шанс 0–100 — сумма факторов от базы 50. <ProvenanceBadge kind="generated" note="Эвристика, не гарантия: сезон, час, солунар, погода, вода, место." />
          </p>
        </div>
      )}
    </div>
  );
}
