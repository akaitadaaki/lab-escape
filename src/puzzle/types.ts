// 謎データの型定義

/** 部屋に固定で置かれている「調べられる物」 */
export const PHYSICAL_SLOTS = [
  'desk',
  'shelf',
  'painting',
  'safe',
  'locker',
  'whiteboard',
  'terminal',
  'plant',
  'cabinet',
  'bin',
  'panel',
] as const;
export type PhysicalSlot = (typeof PHYSICAL_SLOTS)[number];

/** 話しかけられる人物。複数の謎でヒント役を兼ねられる */
export const NPC_SLOTS = ['researcher', 'robot'] as const;
export type NpcSlot = (typeof NPC_SLOTS)[number];

export type SlotId = PhysicalSlot | NpcSlot | 'door';

export const PUZZLE_TYPES = ['dial', 'sequence', 'item', 'testimony', 'cipher'] as const;
export type PuzzleType = (typeof PUZZLE_TYPES)[number];

export const BUTTON_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type ButtonColor = (typeof BUTTON_COLORS)[number];

/** 謎ごとの入力方法と正解 */
export type PuzzleInput =
  | { kind: 'code'; answer: string } // 数字を入力
  | { kind: 'word'; answer: string } // 英大文字の単語を入力
  | { kind: 'sequence'; answer: ButtonColor[] } // 色ボタンを順に押す
  | { kind: 'choice'; options: string[]; answer: number } // 選択肢から選ぶ
  | { kind: 'item'; itemId: string; itemName: string; itemSlot: PhysicalSlot; foundText: string }; // アイテムを見つけて使う

/** プレイヤーが入力した値 */
export type Attempt =
  | { kind: 'code'; value: string }
  | { kind: 'word'; value: string }
  | { kind: 'sequence'; value: ButtonColor[] }
  | { kind: 'choice'; value: number }
  | { kind: 'item'; heldItemIds: string[] };

export interface Clue {
  slot: PhysicalSlot | NpcSlot;
  text: string;
}

export interface PuzzleDef {
  id: string;
  type: PuzzleType;
  title: string;
  /** 入力装置が置かれる場所 */
  lockSlot: PhysicalSlot;
  /** 入力パネルに表示する説明 */
  prompt: string;
  input: PuzzleInput;
  clues: Clue[];
  /** 残り時間が減ると研究員が教えてくれる救済ヒント */
  rescueHint: string;
  /** 解けたときの描写。続けて数字札の説明が付く */
  solvedText: string;
}

export const TAG_COLORS = ['red', 'blue', 'green'] as const;
export type TagColor = (typeof TAG_COLORS)[number];

/** シナリオに組み込まれた謎。解くと色付きの数字札が手に入る */
export interface ScenarioPuzzle {
  def: PuzzleDef;
  tagColor: TagColor;
  digit: number;
}

export interface Scenario {
  seed: number;
  puzzles: ScenarioPuzzle[];
  /** 出口コードに並べる札の色の順番 */
  doorOrder: TagColor[];
  doorCode: string;
}
