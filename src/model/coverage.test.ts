import { describe, it, expect } from 'vitest';
import { speciesCoverage } from './coverage';
import type { GearItem, SpeciesMethod } from '@/data/types';

const g = (id: string, name: string, kind: GearItem['kind'], aliases: string[]): GearItem => ({ id, name, kind, aliases, summary: '', here: '', sizes: '', species: [], methods: [], photo: null, provenance: 'generated' });
const glossary = [g('dzhig', 'Джиг', 'приманка', ['джиг']), g('koleblyalka', 'Колебалка', 'приманка', ['колебалка']), g('otvodnoy-povodok', 'Отводной поводок', 'оснастка', ['отводной поводок']), g('spinning', 'Спиннинг', 'снасть', ['спиннинг']), g('fider', 'Фидер', 'снасть', ['фидер']), g('cherv', 'Червь', 'наживка', ['червь'])];
const spin: SpeciesMethod = { name: 'спиннинг', seasons: ['осень'], baits: [], lures: ['джиг', 'колебалка'], rig: 'отводной поводок', technique: '', gear: 'спиннинг 2,4 м' };
const feeder: SpeciesMethod = { name: 'фидер', seasons: ['осень'], baits: ['червь'], lures: [], rig: 'патерностер', technique: '', gear: 'фидер 3,6 м' };
const vague: SpeciesMethod = { name: 'поплавок', seasons: ['осень'], baits: ['то, что найдёте'], lures: [], rig: 'любая', technique: '', gear: 'что есть' };

describe('speciesCoverage()', () => {
  it('is full when every role group has an owned item, partial when some, none when nothing', () => {
    const full = speciesCoverage({ methods: [spin] }, new Set(['spinning', 'otvodnoy-povodok', 'koleblyalka']), { season: 'осень', ice: false, glossary });
    expect(full.best?.level).toBe('full');
    const partial = speciesCoverage({ methods: [spin] }, new Set(['spinning']), { season: 'осень', ice: false, glossary });
    expect(partial.best?.level).toBe('partial');
    expect(partial.best?.missing.map((m) => m.id)).toEqual(['dzhig', 'otvodnoy-povodok']); // one per uncovered group
    const none = speciesCoverage({ methods: [spin] }, new Set(['fider']), { season: 'осень', ice: false, glossary });
    expect(none.best?.level).toBe('none');
  });

  it('ranks the best-covered method first and treats unnamed gear as unknown, not impossible', () => {
    const r = speciesCoverage({ methods: [spin, feeder, vague] }, new Set(['fider', 'cherv']), { season: 'осень', ice: false, glossary });
    expect(r.best?.pick.method.name).toBe('фидер');
    expect(r.best?.level).toBe('full');
    expect(r.all.find((c) => c.pick.method.name === 'поплавок')?.level).toBe('unknown');
  });
});
