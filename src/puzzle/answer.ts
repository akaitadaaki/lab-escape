import type { Attempt, PuzzleInput } from './types';

export function checkAnswer(input: PuzzleInput, attempt: Attempt): boolean {
  switch (input.kind) {
    case 'code':
      return attempt.kind === 'code' && attempt.value.trim() === input.answer;
    case 'word':
      return attempt.kind === 'word' && attempt.value.trim().toUpperCase() === input.answer.toUpperCase();
    case 'sequence':
      return (
        attempt.kind === 'sequence' &&
        attempt.value.length === input.answer.length &&
        attempt.value.every((color, i) => color === input.answer[i])
      );
    case 'choice':
      return attempt.kind === 'choice' && attempt.value === input.answer;
    case 'item':
      return attempt.kind === 'item' && attempt.heldItemIds.includes(input.itemId);
  }
}
