import { describe, expect, it } from 'vitest';
import { checkAnswer } from './answer';

describe('checkAnswer', () => {
  it('数字コードは一致すれば正解、違えば不正解', () => {
    const input = { kind: 'code', answer: '274' } as const;
    expect(checkAnswer(input, { kind: 'code', value: '274' })).toBe(true);
    expect(checkAnswer(input, { kind: 'code', value: '472' })).toBe(false);
  });

  it('単語は大文字小文字と前後の空白を無視して判定する', () => {
    const input = { kind: 'word', answer: 'ATOM' } as const;
    expect(checkAnswer(input, { kind: 'word', value: ' atom ' })).toBe(true);
    expect(checkAnswer(input, { kind: 'word', value: 'ATOMS' })).toBe(false);
  });

  it('色の順番は、並びがすべて一致したときだけ正解', () => {
    const input = { kind: 'sequence', answer: ['yellow', 'green', 'red', 'blue'] } as const;
    expect(checkAnswer({ ...input, answer: [...input.answer] }, { kind: 'sequence', value: ['yellow', 'green', 'red', 'blue'] })).toBe(true);
    expect(checkAnswer({ ...input, answer: [...input.answer] }, { kind: 'sequence', value: ['yellow', 'green', 'blue', 'red'] })).toBe(false);
    expect(checkAnswer({ ...input, answer: [...input.answer] }, { kind: 'sequence', value: ['yellow', 'green', 'red'] })).toBe(false);
  });

  it('選択肢は正解の番号を選んだときだけ正解', () => {
    const input = { kind: 'choice', options: ['A', 'B', 'C'], answer: 2 } as const;
    expect(checkAnswer({ ...input, options: [...input.options] }, { kind: 'choice', value: 2 })).toBe(true);
    expect(checkAnswer({ ...input, options: [...input.options] }, { kind: 'choice', value: 0 })).toBe(false);
  });

  it('アイテムは、必要な物を持っているときだけ正解', () => {
    const input = { kind: 'item', itemId: 'small-key', itemName: '小さな鍵', itemSlot: 'plant', foundText: '' } as const;
    expect(checkAnswer(input, { kind: 'item', heldItemIds: ['card', 'small-key'] })).toBe(true);
    expect(checkAnswer(input, { kind: 'item', heldItemIds: ['card'] })).toBe(false);
  });

  it('入力方法が謎と食い違っていれば不正解', () => {
    expect(checkAnswer({ kind: 'code', answer: '274' }, { kind: 'word', value: '274' })).toBe(false);
  });
});
