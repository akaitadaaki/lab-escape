import { describe, expect, it } from 'vitest';
import { Game, GAME_DURATION_MS, WRONG_LOCK_MS } from './game';
import type { PuzzleDef, Scenario } from '../puzzle/types';

const dial: PuzzleDef = {
  id: 'dial-x',
  type: 'dial',
  title: '金庫',
  lockSlot: 'safe',
  prompt: '3桁の数字',
  input: { kind: 'code', answer: '274' },
  clues: [
    { slot: 'shelf', text: '本が並んでいる' },
    { slot: 'researcher', text: '金庫の話' },
  ],
  rescueHint: '金庫の救済ヒント',
  solvedText: '金庫が開いた。',
};

const item: PuzzleDef = {
  id: 'item-x',
  type: 'item',
  title: '引き出し',
  lockSlot: 'desk',
  prompt: '鍵がかかっている',
  input: { kind: 'item', itemId: 'small-key', itemName: '小さな鍵', itemSlot: 'plant', foundText: '鍵を見つけた' },
  clues: [],
  rescueHint: '引き出しの救済ヒント',
  solvedText: '引き出しが開いた。',
};

const cipher: PuzzleDef = {
  id: 'cipher-x',
  type: 'cipher',
  title: '端末',
  lockSlot: 'terminal',
  prompt: 'パスワード',
  input: { kind: 'word', answer: 'ATOM' },
  clues: [{ slot: 'whiteboard', text: '換字表' }],
  rescueHint: '端末の救済ヒント',
  solvedText: '端末のロックが外れた。',
};

function scenario(): Scenario {
  return {
    seed: 1,
    puzzles: [
      { def: dial, tagColor: 'red', digit: 4 },
      { def: item, tagColor: 'blue', digit: 9 },
      { def: cipher, tagColor: 'green', digit: 1 },
    ],
    doorOrder: ['blue', 'red', 'green'],
    doorCode: '941',
  };
}

const MINUTE = 60_000;

describe('Game: 制限時間', () => {
  it('開始時は残り10分でプレイ中', () => {
    const game = new Game(scenario());
    expect(game.remainingMs).toBe(GAME_DURATION_MS);
    expect(GAME_DURATION_MS).toBe(10 * MINUTE);
    expect(game.status).toBe('playing');
  });

  it('残り時間が0になるとゲームオーバーになり、出口コードも受け付けない', () => {
    const game = new Game(scenario());
    game.tick(GAME_DURATION_MS + 500);
    expect(game.remainingMs).toBe(0);
    expect(game.status).toBe('over');
    expect(game.submitDoor('941')).toEqual({ ok: false, reason: 'ended' });
    expect(game.status).toBe('over');
  });
});

describe('Game: 調べる', () => {
  it('ヒントのある物を調べると文章が返り、メモに1度だけ記録される', () => {
    const game = new Game(scenario());
    expect(game.inspect('shelf')).toEqual({ kind: 'text', text: '本が並んでいる' });
    game.inspect('shelf');
    expect(game.memo).toEqual(['本が並んでいる']);
  });

  it('謎に使われていない物を調べても何も起きない', () => {
    const game = new Game(scenario());
    expect(game.inspect('bin')).toEqual({ kind: 'nothing' });
    expect(game.memo).toEqual([]);
  });

  it('未解決の謎の入力装置を調べると、その謎の入力パネルが開く', () => {
    const game = new Game(scenario());
    expect(game.inspect('safe')).toEqual({ kind: 'panel', puzzle: scenario().puzzles[0] });
  });

  it('アイテムの置き場所を調べるとアイテムが手に入り、2度目は何も起きない', () => {
    const game = new Game(scenario());
    expect(game.inspect('plant')).toEqual({ kind: 'text', text: '鍵を見つけた' });
    expect(game.inventory).toEqual([{ id: 'small-key', name: '小さな鍵' }]);
    expect(game.inspect('plant')).toEqual({ kind: 'nothing' });
    expect(game.inventory).toHaveLength(1);
  });
});

describe('Game: 謎を解く', () => {
  it('正解すると解決済みになり、色付きの数字札がメモに記録される', () => {
    const game = new Game(scenario());
    const result = game.submit('dial-x', { kind: 'code', value: '274' });
    expect(result).toEqual({ ok: true, text: '金庫が開いた。 中に「赤い札」があり、数字の 4 が書かれている。' });
    expect(game.isSolved('dial-x')).toBe(true);
    expect(game.memo).toContain('赤い札: 4');
  });

  it('緑の札は「緑の札」と表記する（「緑い」にしない）', () => {
    const game = new Game(scenario());
    const result = game.submit('cipher-x', { kind: 'word', value: 'ATOM' });
    expect(result).toEqual({ ok: true, text: '端末のロックが外れた。 中に「緑の札」があり、数字の 1 が書かれている。' });
    expect(game.memo).toContain('緑の札: 1');
  });

  it('解決済みの入力装置を調べると、解けたときの文章がもう一度読める', () => {
    const game = new Game(scenario());
    game.submit('dial-x', { kind: 'code', value: '274' });
    expect(game.inspect('safe')).toEqual({
      kind: 'text',
      text: '金庫が開いた。 中に「赤い札」があり、数字の 4 が書かれている。',
    });
  });

  it('不正解だと一定時間ロックされ、その間は正解でも受け付けない', () => {
    const game = new Game(scenario());
    expect(game.submit('dial-x', { kind: 'code', value: '000' })).toEqual({ ok: false, reason: 'wrong' });
    expect(game.lockRemainingMs('dial-x')).toBe(WRONG_LOCK_MS);
    expect(game.submit('dial-x', { kind: 'code', value: '274' })).toEqual({ ok: false, reason: 'locked' });
    expect(game.isSolved('dial-x')).toBe(false);
  });

  it('ロック時間が過ぎれば再び答えられる', () => {
    const game = new Game(scenario());
    game.submit('dial-x', { kind: 'code', value: '000' });
    game.tick(WRONG_LOCK_MS);
    expect(game.lockRemainingMs('dial-x')).toBe(0);
    expect(game.submit('dial-x', { kind: 'code', value: '274' }).ok).toBe(true);
  });

  it('必要なアイテムを持っていないときは開かず、ロックもされない', () => {
    const game = new Game(scenario());
    expect(game.submit('item-x', { kind: 'item', heldItemIds: game.inventory.map((i) => i.id) })).toEqual({
      ok: false,
      reason: 'wrong',
    });
    expect(game.lockRemainingMs('item-x')).toBe(0);
  });

  it('見つけたアイテムを使うと解ける', () => {
    const game = new Game(scenario());
    game.inspect('plant');
    expect(game.submit('item-x', { kind: 'item', heldItemIds: game.inventory.map((i) => i.id) }).ok).toBe(true);
  });
});

describe('Game: 出口', () => {
  it('正しいコードを入れるとクリアになり、以後は時間が進まない', () => {
    const game = new Game(scenario());
    game.tick(MINUTE);
    expect(game.submitDoor('941')).toEqual({ ok: true });
    expect(game.status).toBe('cleared');
    game.tick(MINUTE);
    expect(game.remainingMs).toBe(GAME_DURATION_MS - MINUTE);
  });

  it('間違ったコードではクリアにならず、一定時間ロックされる', () => {
    const game = new Game(scenario());
    expect(game.submitDoor('000')).toEqual({ ok: false, reason: 'wrong' });
    expect(game.status).toBe('playing');
    expect(game.submitDoor('941')).toEqual({ ok: false, reason: 'locked' });
    game.tick(WRONG_LOCK_MS);
    expect(game.submitDoor('941')).toEqual({ ok: true });
  });
});

describe('Game: 会話', () => {
  it('ロボットは出口コードに並べる札の色の順番を教える', () => {
    const game = new Game(scenario());
    const texts = game.talk('robot').map((t) => t.text);
    expect(texts.some((text) => text.includes('青・赤・緑'))).toBe(true);
  });

  it('人物がヒント役の謎があれば、その話題が出る', () => {
    const game = new Game(scenario());
    expect(game.talk('researcher').map((t) => t.text)).toContain('金庫の話');
    expect(game.talk('robot').map((t) => t.text)).not.toContain('金庫の話');
  });

  it('残り5分を超えている間は、研究員は救済ヒントを出さない', () => {
    const game = new Game(scenario());
    game.tick(5 * MINUTE - 1);
    expect(game.talk('researcher').filter((t) => t.rescue)).toEqual([]);
  });

  it('残り5分を切ると、未解決の謎のうち最初の1つの救済ヒントが出る', () => {
    const game = new Game(scenario());
    game.submit('dial-x', { kind: 'code', value: '274' });
    game.tick(5 * MINUTE);
    expect(game.talk('researcher').filter((t) => t.rescue).map((t) => t.text)).toEqual(['引き出しの救済ヒント']);
  });

  it('残り3分を切ると、未解決の謎すべての救済ヒントが出る', () => {
    const game = new Game(scenario());
    game.submit('dial-x', { kind: 'code', value: '274' });
    game.tick(7 * MINUTE);
    expect(game.talk('researcher').filter((t) => t.rescue).map((t) => t.text)).toEqual([
      '引き出しの救済ヒント',
      '端末の救済ヒント',
    ]);
  });
});
