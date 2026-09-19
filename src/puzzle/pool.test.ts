import { describe, expect, it } from 'vitest';
import { buildScenario, physicalSlotsOf } from './combine';
import { PUZZLE_POOL } from './pool';
import { PUZZLE_TYPES } from './types';

describe('PUZZLE_POOL', () => {
  it('IDが重複していない', () => {
    const ids = PUZZLE_POOL.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('すべての型に2つ以上のバリエーションがある', () => {
    for (const type of PUZZLE_TYPES) {
      expect(PUZZLE_POOL.filter((p) => p.type === type).length, type).toBeGreaterThanOrEqual(2);
    }
  });

  it('入力装置の場所が、同じ謎のヒントやアイテムの置き場所と重ならない', () => {
    for (const def of PUZZLE_POOL) {
      const others = [...def.clues.map((c) => c.slot), ...(def.input.kind === 'item' ? [def.input.itemSlot] : [])];
      expect(others, def.id).not.toContain(def.lockSlot);
      expect(new Set(others).size, def.id).toBe(others.length);
    }
  });

  it('答えが入力方法に合った形式になっている', () => {
    for (const def of PUZZLE_POOL) {
      const { input } = def;
      if (input.kind === 'code') expect(input.answer, def.id).toMatch(/^\d{3}$/);
      if (input.kind === 'word') expect(input.answer, def.id).toMatch(/^[A-Z]{3,6}$/);
      if (input.kind === 'sequence') expect(new Set(input.answer).size, def.id).toBe(4);
      if (input.kind === 'choice') expect(input.options[input.answer], def.id).toBeDefined();
    }
  });

  it('どの謎にも、ヒントと救済ヒントがある', () => {
    for (const def of PUZZLE_POOL) {
      expect(def.clues.length, def.id).toBeGreaterThanOrEqual(1);
      expect(def.rescueHint, def.id).not.toBe('');
    }
  });

  it('シード1〜300のすべてでシナリオを組み立てられる', () => {
    for (let seed = 1; seed <= 300; seed++) {
      expect(() => buildScenario(seed, PUZZLE_POOL), `seed=${seed}`).not.toThrow();
    }
  });

  it('どの謎も、いずれかのシードで出題される', () => {
    const used = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      for (const p of buildScenario(seed, PUZZLE_POOL).puzzles) used.add(p.def.id);
    }
    expect([...used].sort()).toEqual(PUZZLE_POOL.map((p) => p.id).sort());
  });

  it('1つの謎が占有する物は3つまで', () => {
    for (const def of PUZZLE_POOL) {
      expect(physicalSlotsOf(def).length, def.id).toBeLessThanOrEqual(3);
    }
  });
});
