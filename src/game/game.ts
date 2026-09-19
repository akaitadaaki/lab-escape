import { checkAnswer } from '../puzzle/answer';
import type { Attempt, NpcSlot, PhysicalSlot, Scenario, ScenarioPuzzle, TagColor } from '../puzzle/types';

export const GAME_DURATION_MS = 10 * 60_000;
/** 誤答後に入力を受け付けない時間。総当たりを防ぐ */
export const WRONG_LOCK_MS = 10_000;
/** 研究員が救済ヒントを出し始める残り時間 */
export const RESCUE_FIRST_MS = 5 * 60_000;
export const RESCUE_ALL_MS = 3 * 60_000;

const DOOR_LOCK_KEY = 'door';

export const TAG_COLOR_NAMES: Record<TagColor, string> = { red: '赤', blue: '青', green: '緑' };
/** 札の呼び名。「緑い」とは言えないので色ごとに持つ */
export const TAG_LABELS: Record<TagColor, string> = { red: '赤い札', blue: '青い札', green: '緑の札' };

const NPC_INTRO: Record<NpcSlot, string> = {
  researcher:
    '私もここに閉じ込められてしまってね…。出口は3桁のコードで開くはずだ。部屋のあちこちに、数字の書かれた色付きの札が隠されていると聞いたことがある。',
  robot: 'ワタシハ 警備ロボット。非常ロックガ 作動中デス。出口ノ コードヲ 入力シテ クダサイ。',
};

export type GameStatus = 'playing' | 'cleared' | 'over';
export type InspectResult = { kind: 'nothing' } | { kind: 'text'; text: string } | { kind: 'panel'; puzzle: ScenarioPuzzle };
export type SubmitResult = { ok: true; text: string } | { ok: false; reason: 'wrong' | 'locked' | 'ended' };
export type DoorResult = { ok: true } | { ok: false; reason: 'wrong' | 'locked' | 'ended' };
export interface Topic {
  label: string;
  text: string;
  /** 残り時間が減ってから追加される救済ヒントかどうか */
  rescue: boolean;
}

export class Game {
  remainingMs = GAME_DURATION_MS;
  status: GameStatus = 'playing';
  memo: string[] = [];
  inventory: { id: string; name: string }[] = [];

  private solved = new Set<string>();
  private locks = new Map<string, number>();

  constructor(readonly scenario: Scenario) {}

  tick(dtMs: number): void {
    if (this.status !== 'playing') return;
    this.remainingMs = Math.max(0, this.remainingMs - dtMs);
    for (const [key, ms] of this.locks) {
      this.locks.set(key, Math.max(0, ms - dtMs));
    }
    if (this.remainingMs === 0) this.status = 'over';
  }

  inspect(slot: PhysicalSlot): InspectResult {
    for (const puzzle of this.scenario.puzzles) {
      const { def } = puzzle;
      if (def.lockSlot === slot) {
        return this.isSolved(def.id) ? { kind: 'text', text: this.solvedText(puzzle) } : { kind: 'panel', puzzle };
      }
      if (def.input.kind === 'item' && def.input.itemSlot === slot) {
        const { itemId, itemName, foundText } = def.input;
        if (this.inventory.some((item) => item.id === itemId)) return { kind: 'nothing' };
        this.inventory.push({ id: itemId, name: itemName });
        return { kind: 'text', text: foundText };
      }
      const clue = def.clues.find((c) => c.slot === slot);
      if (clue) {
        this.addMemo(clue.text);
        return { kind: 'text', text: clue.text };
      }
    }
    return { kind: 'nothing' };
  }

  submit(puzzleId: string, attempt: Attempt): SubmitResult {
    if (this.status !== 'playing') return { ok: false, reason: 'ended' };
    const puzzle = this.scenario.puzzles.find((p) => p.def.id === puzzleId);
    if (!puzzle) throw new Error(`このシナリオに存在しない謎です: ${puzzleId}`);
    if (this.lockRemainingMs(puzzleId) > 0) return { ok: false, reason: 'locked' };

    if (!checkAnswer(puzzle.def.input, attempt)) {
      // アイテム不足は「誤答」ではないのでロックしない
      if (puzzle.def.input.kind !== 'item') this.locks.set(puzzleId, WRONG_LOCK_MS);
      return { ok: false, reason: 'wrong' };
    }

    this.solved.add(puzzleId);
    this.addMemo(`${TAG_LABELS[puzzle.tagColor]}: ${puzzle.digit}`);
    return { ok: true, text: this.solvedText(puzzle) };
  }

  submitDoor(code: string): DoorResult {
    if (this.status !== 'playing') return { ok: false, reason: 'ended' };
    if (this.lockRemainingMs(DOOR_LOCK_KEY) > 0) return { ok: false, reason: 'locked' };
    if (code.trim() !== this.scenario.doorCode) {
      this.locks.set(DOOR_LOCK_KEY, WRONG_LOCK_MS);
      return { ok: false, reason: 'wrong' };
    }
    this.status = 'cleared';
    return { ok: true };
  }

  isSolved(puzzleId: string): boolean {
    return this.solved.has(puzzleId);
  }

  get solvedCount(): number {
    return this.solved.size;
  }

  /** 謎ID、または出口（'door'）の残りロック時間 */
  lockRemainingMs(target: string): number {
    return this.locks.get(target) ?? 0;
  }

  talk(npc: NpcSlot): Topic[] {
    const topics: Topic[] = [{ label: 'ここで何があったのか聞く', text: NPC_INTRO[npc], rescue: false }];

    if (npc === 'robot') {
      const order = this.scenario.doorOrder.map((color) => TAG_COLOR_NAMES[color]).join('・');
      topics.push({
        label: '出口のコードについて聞く',
        text: `出口ノ コードハ 3桁。札ノ 数字ヲ「${order}」ノ 順ニ 並ベテ クダサイ。`,
        rescue: false,
      });
    }

    for (const { def } of this.scenario.puzzles) {
      for (const clue of def.clues) {
        if (clue.slot === npc) {
          topics.push({ label: `「${def.title}」について聞く`, text: clue.text, rescue: false });
        }
      }
    }

    if (npc === 'researcher') {
      for (const { def } of this.rescuablePuzzles()) {
        topics.push({ label: `「${def.title}」が解けないと相談する`, text: def.rescueHint, rescue: true });
      }
    }
    return topics;
  }

  addMemo(text: string): void {
    if (!this.memo.includes(text)) this.memo.push(text);
  }

  private rescuablePuzzles(): ScenarioPuzzle[] {
    const unsolved = this.scenario.puzzles.filter((p) => !this.isSolved(p.def.id));
    if (this.remainingMs <= RESCUE_ALL_MS) return unsolved;
    if (this.remainingMs <= RESCUE_FIRST_MS) return unsolved.slice(0, 1);
    return [];
  }

  private solvedText(puzzle: ScenarioPuzzle): string {
    return `${puzzle.def.solvedText} 中に「${TAG_LABELS[puzzle.tagColor]}」があり、数字の ${puzzle.digit} が書かれている。`;
  }
}
