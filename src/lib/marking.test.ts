import { describe, it, expect } from 'vitest';
import { decodeMarking } from './marking';

const labels = (s: string) => decodeMarking(s).parts.map((p) => p.label);

describe('decodeMarking()', () => {
  it('reads a Japanese-style rod code with power and action', () => {
    const d = decodeMarking('S762ML-F 5-21g');
    expect(labels('S762ML-F 5-21g')).toEqual(['удилище 7′6″, ML', 'тест 5–21 г']);
    expect(d.parts[0].detail).toMatch(/спиннинговое/);
    expect(d.parts[0].detail).toMatch(/быстрый строй/);
    expect(d.gear).toContain('spinning');
    expect(d.species).toContain('esox-lucius');
    expect(d.unknown).toEqual([]);
  });

  it('reads a wobbler code: length, buoyancy, depth', () => {
    const d = decodeMarking('70SP-MR');
    expect(d.parts).toHaveLength(1);
    expect(d.parts[0].label).toBe('воблер 70 мм SP MR');
    expect(d.parts[0].detail).toMatch(/суспендер/);
    expect(d.parts[0].detail).toMatch(/medium runner/);
    expect(d.gear).toEqual(['vobler']);
  });

  it('does not mistake a rod action F for a floating lure', () => {
    const d = decodeMarking('762ML F');
    expect(d.parts.map((p) => p.kind)).toEqual(['удилище', 'удилище']);
  });

  it('reads hooks, line, PE and reel size', () => {
    expect(labels('#8')).toEqual(['№ 8']);
    expect(labels('2/0')).toEqual(['крючок 2/0']);
    expect(labels('0,18 мм')).toEqual(['Ø 0,18 мм']);
    expect(labels('PE #0.8')).toEqual(['PE #0,8']);
    expect(labels('2500S')).toEqual(['катушка 2500']);
    expect(labels('3"')).toEqual(['силикон 3″']);
  });

  it('treats a heavy test as a feeder and names bream', () => {
    const d = decodeMarking('Feeder 3.6m 60-120g');
    expect(d.gear).toContain('fider');
    expect(d.species).toContain('abramis-brama');
    expect(labels('Feeder 3.6m 60-120g')).toContain('длина 360 см');
  });

  it('reports model names as unknown instead of guessing', () => {
    const d = decodeMarking('XXT-C');
    expect(d.parts).toEqual([]);
    expect(d.unknown).toEqual(['XXT-C']);
    expect(d.summary).toMatch(/название модели/);
    const e = decodeMarking('Rigge 56F');
    expect(e.unknown).toEqual(['Rigge']);
    expect(e.parts[0].label).toBe('воблер 56 мм F');
  });

  it('reads a lure pack: F-Floating, 0 m, 8 cm; the model code stays unknown and is not a rod power', () => {
    const d = decodeMarking('F-FLOATING 0 m XH-V 8cm');
    expect(d.parts.map((p) => p.label)).toEqual(['воблер F', 'глубина 0 м', 'длина 80 мм']);
    expect(d.parts.every((p) => p.kind === 'приманка')).toBe(true);
    expect(d.unknown).toEqual(['XH-V']);
    expect(d.gear).toEqual(['popper']);
    expect(d.species).toContain('esox-lucius');
  });

  it('knows XXH', () => {
    const d = decodeMarking('XXH');
    expect(d.parts[0].detail).toMatch(/сверхтяжёлое/);
  });

  it('returns nothing for empty input', () => {
    expect(decodeMarking('  ')).toEqual({ parts: [], unknown: [], gear: [], species: [], summary: '' });
  });
});
