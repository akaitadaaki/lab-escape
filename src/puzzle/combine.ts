import { createRng, randomInt, shuffle } from './rng';
import { NPC_SLOTS, TAG_COLORS } from './types';
import type { PhysicalSlot, PuzzleDef, Scenario } from './types';

export const PUZZLES_PER_GAME = 3;

/** 謎が占有する「物」のスロット。人物は複数の謎で共有できるので含めない */
export function physicalSlotsOf(def: PuzzleDef): PhysicalSlot[] {
  const slots = new Set<PhysicalSlot>([def.lockSlot]);
  for (const clue of def.clues) {
    if (!(NPC_SLOTS as readonly string[]).includes(clue.slot)) {
      slots.add(clue.slot as PhysicalSlot);
    }
  }
  if (def.input.kind === 'item') {
    slots.add(def.input.itemSlot);
  }
  return [...slots];
}

/** 型が重複せず、物のスロットも衝突しない組み合わせを、候補の並び順に探す */
function pickCompatible(candidates: PuzzleDef[], count: number, picked: PuzzleDef[] = []): PuzzleDef[] | null {
  if (picked.length === count) return picked;
  const usedTypes = new Set(picked.map((p) => p.type));
  const usedSlots = new Set(picked.flatMap(physicalSlotsOf));
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (usedTypes.has(candidate.type)) continue;
    if (physicalSlotsOf(candidate).some((slot) => usedSlots.has(slot))) continue;
    const result = pickCompatible(candidates.slice(i + 1), count, [...picked, candidate]);
    if (result) return result;
  }
  return null;
}

export function buildScenario(seed: number, pool: PuzzleDef[]): Scenario {
  const rng = createRng(seed);
  const picked = pickCompatible(shuffle(rng, pool), PUZZLES_PER_GAME);
  if (!picked) {
    throw new Error('型とスロットが衝突しない謎の組み合わせが見つかりません');
  }

  const tagColors = shuffle(rng, TAG_COLORS);
  const puzzles = picked.map((def, i) => ({
    def,
    tagColor: tagColors[i],
    digit: randomInt(rng, 10),
  }));

  const doorOrder = shuffle(rng, TAG_COLORS);
  const doorCode = doorOrder.map((color) => puzzles.find((p) => p.tagColor === color)!.digit).join('');

  return { seed, puzzles, doorOrder, doorCode };
}
