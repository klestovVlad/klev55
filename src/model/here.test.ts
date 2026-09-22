import { describe, it, expect } from 'vitest';
import { chanceRange, neighbours, observationsNear, speciesHere, spotTypeOf, virtualSpot, waterClassOf } from './here';
import { pike, burbot, riverSpot, lakeSpot, rules, weather, hydro } from './fixtures';
import { omskDate } from '@/lib/time';
import type { Spot } from '@/data/types';

const near: Spot = { ...riverSpot, id: 'near', coords: [73.42, 54.92], species: [{ id: 'esox-lucius', rank: 5, seasons: ['осень'], methods: ['спиннинг'], note: '' }], best_months: [9, 10] };
const far: Spot = { ...riverSpot, id: 'far', coords: [73.9, 54.92], species: [{ id: 'esox-lucius', rank: 3, seasons: ['лето'], methods: ['жерлицы'], note: '' }], best_months: [1] };
const lake: Spot = { ...lakeSpot, id: 'lake', coords: [73.41, 54.91], species: [{ id: 'lota-lota', rank: 5, seasons: ['зима'], methods: ['донка'], note: '' }] };
const spots = [near, far, lake];
const pt: [number, number] = [73.4, 54.9];
const sept = omskDate(2026, 9, 26, 7, 0);

describe('here: classes and neighbours', () => {
  it('maps OSM water types to classes and spot types', () => {
    expect(waterClassOf('river')).toBe('river');
    expect(waterClassOf('oxbow')).toBe('river');
    expect(waterClassOf(undefined)).toBe('unknown');
    expect(spotTypeOf('pond')).toBe('пруд');
    expect(spotTypeOf('riverbank')).toBe('река');
  });

  it('takes only neighbours of the same class within 30 km, nearest first', () => {
    const nb = neighbours(spots, pt, 'river');
    expect(nb.map((n) => n.spot.id)).toEqual(['near']); // far is ~32 km away, lake is another class
    expect(neighbours(spots, pt, 'lake').map((n) => n.spot.id)).toEqual(['lake']);
    expect(neighbours(spots, pt, 'unknown').map((n) => n.spot.id)).toEqual(['lake', 'near']);
  });
});

describe('here: species and the virtual spot', () => {
  it('lists species from neighbours, observations and habitat with their sources', () => {
    const nb = neighbours(spots, pt, 'river');
    const obs = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [73.41, 54.9] }, properties: { species: 'Lota lota' } }] } as any;
    const counts = observationsNear(obs, [pike, burbot], pt);
    expect(counts.get('lota-lota')).toBe(1);
    const here = speciesHere([pike, burbot], 'river', { osm_id: 1, name: 'Иртыш', type: 'river', centroid: pt, jurisdiction: 'ru' }, nb, counts);
    const ids = here.map((h) => h.species.id);
    expect(ids[0]).toBe('esox-lucius');
    expect(here[0].via).toContain('места рядом');
    expect(here[0].via).toContain('тип воды');
    expect(here.find((h) => h.species.id === 'lota-lota')?.via).toContain('наблюдения');
  });

  it('builds a Spot-shaped record with interpolated ranks and months', () => {
    const nb = neighbours(spots, pt, 'river');
    const here = speciesHere([pike], 'river', null, nb, new Map());
    const vs = virtualSpot(pt, null, nb, here, 12);
    expect(vs.type).toBe('озеро'); // unknown water defaults to a lake for hydro purposes
    expect(vs.species[0]).toMatchObject({ id: 'esox-lucius', rank: 5, methods: ['спиннинг'] });
    expect(vs.best_months).toEqual([9, 10]);
    expect(vs.provenance).toBe('generated');
    expect(vs.confidence).toBe(0);
  });

  it('gives a range, never a point, and null without neighbours', () => {
    const nb = neighbours(spots, pt, 'river');
    const here = speciesHere([pike], 'river', null, nb, new Map());
    const vs = virtualSpot(pt, { osm_id: 1, name: 'Иртыш', type: 'river', centroid: pt, jurisdiction: 'ru' }, nb, here, 12);
    const r = chanceRange(vs, pike, nb, sept, weather(), hydro(), rules);
    expect(r).not.toBeNull();
    expect(r!.hi - r!.lo).toBeGreaterThanOrEqual(8);
    expect(r!.lo).toBeGreaterThanOrEqual(0);
    expect(r!.hi).toBeLessThanOrEqual(100);
    expect(chanceRange(vs, burbot, nb, sept, weather(), hydro(), rules)).toBeNull();
  });
});
