import { describe, expect, it } from 'vitest';
import { buildScenario, physicalSlotsOf } from './combine';
import type { PhysicalSlot, PuzzleDef, PuzzleType } from './types';

function puzzle(id: string, type: PuzzleType, lockSlot: PhysicalSlot, clueSlots: PhysicalSlot[] = []): PuzzleDef {
  return {
    id,
    type,
    title: id,
    lockSlot,
    prompt: '',
    input: { kind: 'code', answer: '000' },
    clues: clueSlots.map((slot) => ({ slot, text: '' })),
    rescueHint: '',
    solvedText: '',
  };
}

const pool: PuzzleDef[] = [
  puzzle('dial-a', 'dial', 'safe', ['shelf']),
  puzzle('dial-b', 'dial', 'locker', ['whiteboard']),
  puzzle('seq-a', 'sequence', 'terminal', ['painting']),
  puzzle('seq-b', 'sequence', 'safe', ['plant']),
  puzzle('item-a', 'item', 'desk', ['plant']),
  puzzle('cipher-a', 'cipher', 'locker', ['desk', 'cabinet']),
  puzzle('testimony-a', 'testimony', 'panel', ['terminal']),
];

const seeds = Array.from({ length: 50 }, (_, i) => i + 1);

describe('physicalSlotsOf', () => {
  it('入力装置・物のヒント・アイテムの置き場所を返し、人物のヒントは含めない', () => {
    const def: PuzzleDef = {
      ...puzzle('item-x', 'item', 'desk', ['bin']),
      input: { kind: 'item', itemId: 'key', itemName: '鍵', itemSlot: 'plant', foundText: '' },
      clues: [
        { slot: 'bin', text: '' },
        { slot: 'robot', text: '' },
      ],
    };
    expect(physicalSlotsOf(def).sort()).toEqual(['bin', 'desk', 'plant']);
  });
});

describe('buildScenario', () => {
  it('謎を3つ選ぶ', () => {
    expect(buildScenario(1, pool).puzzles).toHaveLength(3);
  });

  it('どのシードでも、選ばれた謎の型は重複しない', () => {
    for (const seed of seeds) {
      const types = buildScenario(seed, pool).puzzles.map((p) => p.def.type);
      expect(new Set(types).size).toBe(3);
    }
  });

  it('どのシードでも、選ばれた謎どうしで物のスロットが衝突しない', () => {
    for (const seed of seeds) {
      const slots = buildScenario(seed, pool).puzzles.flatMap((p) => physicalSlotsOf(p.def));
      expect(new Set(slots).size).toBe(slots.length);
    }
  });

  it('同じシードからは同じシナリオができる', () => {
    expect(buildScenario(42, pool)).toEqual(buildScenario(42, pool));
  });

  it('シードを変えると異なる組み合わせが出る', () => {
    const combos = new Set(seeds.map((seed) => buildScenario(seed, pool).puzzles.map((p) => p.def.id).join(',')));
    expect(combos.size).toBeGreaterThan(1);
  });

  it('3つの謎に赤・青・緑の札が1枚ずつ割り当てられる', () => {
    const colors = buildScenario(7, pool).puzzles.map((p) => p.tagColor);
    expect([...colors].sort()).toEqual(['blue', 'green', 'red']);
  });

  it('出口コードは、札の数字を指定された色の順に並べたものになる', () => {
    for (const seed of seeds) {
      const scenario = buildScenario(seed, pool);
      const expected = scenario.doorOrder
        .map((color) => scenario.puzzles.find((p) => p.tagColor === color)!.digit)
        .join('');
      expect(scenario.doorCode).toBe(expected);
      expect(scenario.doorCode).toMatch(/^\d{3}$/);
    }
  });

  it('条件を満たす3問が選べないプールではエラーになる', () => {
    const tooSmall = [puzzle('dial-a', 'dial', 'safe'), puzzle('seq-b', 'sequence', 'safe')];
    expect(() => buildScenario(1, tooSmall)).toThrow();
  });
});
