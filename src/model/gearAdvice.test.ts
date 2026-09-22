import { describe, it, expect } from 'vitest';
import { gearAdvice, seasonOf } from './gearAdvice';
import { omskDate } from '@/lib/time';
import type { GearItem, SpeciesMethod } from '@/data/types';

const g = (id: string, name: string, kind: GearItem['kind'], aliases: string[]): GearItem => ({ id, name, kind, aliases, summary: '', here: '', sizes: '', species: [], methods: [], photo: null, provenance: 'generated' });
const glossary = [g('dzhig', 'Джиг', 'приманка', ['джиг', 'джига', 'виброхвост']), g('koleblyalka', 'Колебалка', 'приманка', ['колебалка', 'колебалку']), g('zhivets', 'Живец', 'приманка', ['живец', 'живца']), g('otvodnoy-povodok', 'Отводной поводок', 'оснастка', ['отводной поводок', 'отводной']), g('spinning', 'Спиннинг', 'снасть', ['спиннинг'])];

const spin: SpeciesMethod = { name: 'спиннинг', seasons: ['осень', 'лето'], baits: [], lures: ['джиг 10–14 г', 'колебалка 18 г'], rig: 'отводной поводок', technique: '', gear: 'Спиннинг 2,4 м' };
const zherl: SpeciesMethod = { name: 'жерлицы', seasons: ['зима'], baits: ['живец'], lures: [], rig: 'поводок 0,4', technique: '', gear: 'жерлица' };
const float: SpeciesMethod = { name: 'поплавок', seasons: ['лето'], baits: ['живец'], lures: [], rig: '', technique: '', gear: '' };

describe('gearAdvice()', () => {
  it('season helper follows Omsk months and the ice flag', () => {
    expect(seasonOf(omskDate(2026, 9, 26))).toBe('осень');
    expect(seasonOf(omskDate(2026, 7, 1))).toBe('лето');
    expect(seasonOf(omskDate(2026, 11, 20), true)).toBe('зима');
  });

  it('keeps open-water methods off the ice and vice versa', () => {
    const open = gearAdvice({ methods: [spin, zherl, float] }, { season: 'осень', ice: false, glossary });
    expect(open.map((p) => p.method.name)).toEqual(['спиннинг', 'поплавок']);
    const ice = gearAdvice({ methods: [spin, zherl, float] }, { season: 'зима', ice: true, glossary });
    expect(ice.map((p) => p.method.name)).toEqual(['жерлицы']);
  });

  it('prefers the season, then the place habits', () => {
    const r = gearAdvice({ methods: [spin, float] }, { season: 'лето', ice: false, spotMethods: ['поплавок'], glossary });
    expect(r[0].method.name).toBe('поплавок');
    expect(r[0].fitsSeason).toBe(true);
  });

  it('links glossary items from lures, rig and gear and keeps unknown labels', () => {
    const [p] = gearAdvice({ methods: [spin] }, { season: 'осень', ice: false, glossary });
    expect(p.items.map((i) => i.id)).toEqual(['dzhig', 'koleblyalka', 'otvodnoy-povodok', 'spinning']);
    expect(p.items[0].label).toBe('джиг 10–14 г');
    expect(p.items[2].role).toBe('оснастка');
  });
});
