import { Game, TAG_COLOR_NAMES } from '../game/game';
import { BUTTON_COLORS } from '../puzzle/types';
import type { Attempt, ButtonColor, NpcSlot, ScenarioPuzzle } from '../puzzle/types';
import { BUTTON_COLOR_NAMES, SLOT_NAMES } from './texts';

// HTMLオーバーレイのUI。表示文字列はすべて textContent で入れる

function $<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`要素が見つかりません: #${id}`);
  return element as T;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  return `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`;
}

export class Ui {
  /** モーダルの開閉を通知する。開いている間は移動操作を止める */
  onModalChange: (open: boolean) => void = () => {};

  private hud = $('hud');
  private timer = $('timer');
  private progress = $('progress');
  private seed = $('seed');
  private hoverLabel = $('hover-label');
  private toastBox = $('toast');
  private sideBody = $('side-body');
  private memoList = $('memo-list');
  private inventoryList = $('inventory-list');
  private modal = $('modal');
  private modalTitle = $('modal-title');
  private modalBody = $('modal-body');
  private titleScreen = $('title-screen');
  private endScreen = $('end-screen');

  private toastTimer = 0;
  private renderedSideKey = '';
  /** 開いているモーダルが毎フレーム更新したい内容（ロック残り時間など） */
  private refreshModal: (() => void) | null = null;

  constructor() {
    $('modal-close').addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('pointerdown', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    $('side-toggle').addEventListener('click', () => this.toggleSide());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isModalOpen) this.closeModal();
      if (e.code === 'KeyM' && !this.isModalOpen && !this.hud.hidden) this.toggleSide();
    });
  }

  get isModalOpen(): boolean {
    return !this.modal.hidden;
  }

  onStart(handler: () => void): void {
    $('start-button').addEventListener('click', handler);
  }

  onRetry(handler: () => void): void {
    $('retry-button').addEventListener('click', handler);
  }

  showGame(seed: number): void {
    this.titleScreen.hidden = true;
    this.endScreen.hidden = true;
    this.hud.hidden = false;
    this.seed.textContent = `seed: ${seed}`;
    this.renderedSideKey = '';
    this.setHover(null);
    this.closeModal();
  }

  showEnd(game: Game): void {
    this.closeModal();
    this.hud.hidden = true;
    const cleared = game.status === 'cleared';
    const title = $('end-title');
    title.textContent = cleared ? 'ESCAPED!' : 'TIME UP';
    title.classList.toggle('over', !cleared);
    $('end-text').textContent = cleared
      ? `脱出成功！ 残り時間 ${formatTime(game.remainingMs)}`
      : `時間切れ…。非常ロックは解除されなかった。（出口のコードは ${game.scenario.doorCode} だった）`;
    this.endScreen.hidden = false;
  }

  /** 毎フレーム呼ぶ */
  update(game: Game): void {
    this.timer.textContent = formatTime(game.remainingMs);
    this.timer.classList.toggle('warn', game.remainingMs <= 180_000 && game.remainingMs > 60_000);
    this.timer.classList.toggle('danger', game.remainingMs <= 60_000);
    this.progress.textContent = `数字札 ${game.solvedCount} / ${game.scenario.puzzles.length}`;
    this.renderSide(game);
    this.refreshModal?.();
  }

  setHover(text: string | null, far = false): void {
    this.hoverLabel.hidden = text === null;
    this.hoverLabel.textContent = text ?? '';
    this.hoverLabel.classList.toggle('far', far);
  }

  toast(text: string, durationMs = 5000): void {
    this.toastBox.textContent = text;
    this.toastBox.hidden = false;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.toastBox.hidden = true), durationMs);
  }

  showText(title: string, text: string): void {
    this.openModal(title, [el('p', text)]);
  }

  showDialog(npc: NpcSlot, game: Game): void {
    const speech = el('p', '……', 'speech');
    const topics = el('div', '', 'topics');
    for (const topic of game.talk(npc)) {
      const button = el('button', topic.label, topic.rescue ? 'rescue' : '');
      button.type = 'button';
      button.addEventListener('click', () => {
        speech.textContent = topic.text;
        game.addMemo(`${SLOT_NAMES[npc]}「${topic.text}」`);
      });
      topics.append(button);
    }
    this.openModal(SLOT_NAMES[npc], [speech, topics]);
  }

  showPuzzle(puzzle: ScenarioPuzzle, game: Game, onSolved: (puzzle: ScenarioPuzzle) => void): void {
    const { def } = puzzle;
    const feedback = el('p', '', 'feedback');
    const controls: (HTMLButtonElement | HTMLInputElement)[] = [];
    const body: HTMLElement[] = [el('p', def.prompt)];

    const submit = (attempt: Attempt, wrongText: string): void => {
      const result = game.submit(def.id, attempt);
      if (result.ok) {
        this.modalBody.replaceChildren(el('p', result.text), el('p', '数字札をメモに記録した。', 'feedback good'));
        this.refreshModal = null;
        onSolved(puzzle);
        return;
      }
      if (result.reason === 'wrong') {
        feedback.textContent = wrongText;
        feedback.className = 'feedback bad';
      }
    };

    const { input } = def;
    switch (input.kind) {
      case 'code':
      case 'word': {
        const isCode = input.kind === 'code';
        const field = el('input');
        field.type = 'text';
        field.maxLength = input.answer.length;
        field.inputMode = isCode ? 'numeric' : 'text';
        field.placeholder = (isCode ? '0' : 'A').repeat(input.answer.length);
        field.autocomplete = 'off';
        const ok = el('button', '決定');
        ok.type = 'button';
        const send = (): void => {
          if (field.value.trim() === '') return;
          submit(isCode ? { kind: 'code', value: field.value } : { kind: 'word', value: field.value }, '違うようだ…。');
          field.select();
        };
        ok.addEventListener('click', send);
        field.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') send();
        });
        const row = el('div', '', 'input-row');
        row.append(field, ok);
        body.push(row);
        controls.push(field, ok);
        break;
      }
      case 'sequence': {
        let pressed: ButtonColor[] = [];
        const pressedLabel = el('p', '', 'pressed');
        const renderPressed = (): void => {
          pressedLabel.textContent = `押した順: ${pressed.map((c) => BUTTON_COLOR_NAMES[c]).join(' → ') || '—'}`;
        };
        const row = el('div', '', 'color-buttons');
        for (const color of BUTTON_COLORS) {
          const button = el('button', BUTTON_COLOR_NAMES[color]);
          button.type = 'button';
          button.dataset.color = color;
          button.addEventListener('click', () => {
            pressed.push(color);
            renderPressed();
            if (pressed.length === input.answer.length) {
              submit({ kind: 'sequence', value: pressed }, 'ブザーが鳴った。順番が違うようだ…。');
              pressed = [];
              renderPressed();
            }
          });
          row.append(button);
          controls.push(button);
        }
        const reset = el('button', '押し直す');
        reset.type = 'button';
        reset.addEventListener('click', () => {
          pressed = [];
          renderPressed();
        });
        controls.push(reset);
        renderPressed();
        body.push(row, pressedLabel, reset);
        break;
      }
      case 'choice': {
        const row = el('div', '', 'choice-buttons');
        input.options.forEach((option, index) => {
          const button = el('button', option);
          button.type = 'button';
          button.addEventListener('click', () => submit({ kind: 'choice', value: index }, '警告音が鳴った。これではないようだ…。'));
          row.append(button);
          controls.push(button);
        });
        body.push(row);
        break;
      }
      case 'item': {
        const open = el('button', '開けてみる');
        open.type = 'button';
        open.addEventListener('click', () =>
          submit({ kind: 'item', heldItemIds: game.inventory.map((item) => item.id) }, '開かない。何か使えるものを探そう。'),
        );
        body.push(open);
        controls.push(open);
        break;
      }
    }

    body.push(feedback);
    this.openModal(def.title, body);

    this.refreshModal = () => {
      const lockMs = game.lockRemainingMs(def.id);
      for (const control of controls) control.disabled = lockMs > 0;
      if (lockMs > 0) {
        feedback.textContent = `間違えた…。装置がロックされた。あと ${Math.ceil(lockMs / 1000)} 秒`;
        feedback.className = 'feedback bad';
      } else if (feedback.textContent?.includes('ロックされた')) {
        feedback.textContent = 'ロックが解除された。';
        feedback.className = 'feedback';
      }
    };
    (controls[0] as HTMLElement | undefined)?.focus();
  }

  showDoor(game: Game): void {
    const feedback = el('p', '', 'feedback');
    const field = el('input');
    field.type = 'text';
    field.maxLength = 3;
    field.inputMode = 'numeric';
    field.placeholder = '000';
    field.autocomplete = 'off';
    const ok = el('button', '入力');
    ok.type = 'button';
    const send = (): void => {
      if (field.value.trim() === '') return;
      const result = game.submitDoor(field.value);
      if (!result.ok && result.reason === 'wrong') field.select();
    };
    ok.addEventListener('click', send);
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') send();
    });
    const row = el('div', '', 'input-row');
    row.append(field, ok);

    const tags = game.scenario.puzzles
      .filter((p) => game.isSolved(p.def.id))
      .map((p) => `${TAG_COLOR_NAMES[p.tagColor]}=${p.digit}`)
      .join(' ／ ');
    this.openModal('出口のドア', [
      el('p', '非常ロックのかかった扉だ。横のキーパッドに3桁のコードを入力すれば開くらしい。'),
      el('p', `手に入れた数字札: ${tags || 'まだない'}`, 'pressed'),
      row,
      feedback,
    ]);

    this.refreshModal = () => {
      const lockMs = game.lockRemainingMs('door');
      field.disabled = ok.disabled = lockMs > 0;
      if (lockMs > 0) {
        feedback.textContent = `コードが違う。キーパッドがロックされた。あと ${Math.ceil(lockMs / 1000)} 秒`;
        feedback.className = 'feedback bad';
      } else if (feedback.textContent !== '') {
        feedback.textContent = 'ロックが解除された。';
        feedback.className = 'feedback';
      }
    };
    field.focus();
  }

  closeModal(): void {
    if (!this.isModalOpen) return;
    this.modal.hidden = true;
    this.refreshModal = null;
    this.onModalChange(false);
  }

  private openModal(title: string, body: HTMLElement[]): void {
    this.refreshModal = null;
    this.modalTitle.textContent = title;
    this.modalBody.replaceChildren(...body);
    this.modal.hidden = false;
    this.setHover(null);
    this.onModalChange(true);
  }

  private toggleSide(): void {
    this.sideBody.hidden = !this.sideBody.hidden;
    $('side-toggle').textContent = this.sideBody.hidden ? '＋' : '－';
  }

  private renderSide(game: Game): void {
    const key = `${game.memo.length}/${game.inventory.length}`;
    if (key === this.renderedSideKey) return;
    this.renderedSideKey = key;

    const memoItems = game.memo.map((text) => el('li', text, /^.[いの]札: \d$/.test(text) ? 'tag' : ''));
    this.memoList.replaceChildren(...(memoItems.length ? memoItems : [el('li', '調べたこと・聞いたことが自動で記録される', 'empty')]));
    const items = game.inventory.map((item) => el('li', item.name));
    this.inventoryList.replaceChildren(...(items.length ? items : [el('li', 'なし', 'empty')]));
    this.sideBody.scrollTop = this.sideBody.scrollHeight;
  }
}
