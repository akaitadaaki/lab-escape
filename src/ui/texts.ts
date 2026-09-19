import type { ButtonColor, PhysicalSlot, SlotId } from '../puzzle/types';

export const SLOT_NAMES: Record<SlotId, string> = {
  desk: '机',
  shelf: '本棚',
  painting: '壁の絵',
  safe: '金庫',
  locker: 'ロッカー',
  whiteboard: 'ホワイトボード',
  terminal: '端末',
  plant: '観葉植物',
  cabinet: '薬品棚',
  bin: 'ゴミ箱',
  panel: '配電盤',
  researcher: '研究員',
  robot: '警備ロボット',
  door: '出口のドア',
};

/** 今回の謎に関係しない物を調べたときの文章 */
export const FLAVOR_TEXTS: Record<PhysicalSlot, string> = {
  desk: '書類が散らかった机だ。手がかりになりそうなものは見当たらない。',
  shelf: '専門書が並んだ本棚だ。今は特に気になるところはない。',
  painting: 'のどかな風景画だ。今は特に気になるところはない。',
  safe: '頑丈な金庫だ。今回の脱出には関係なさそうだ。',
  locker: '誰かの私物用ロッカーだ。今回の脱出には関係なさそうだ。',
  whiteboard: '消し残しの走り書きがあるだけだ。読み取れるものはない。',
  terminal: '端末はスリープ状態だ。今は使えそうにない。',
  plant: '観葉植物だ。特に変わったところはない。',
  cabinet: '薬品の瓶が並んでいる。今回の脱出には関係なさそうだ。',
  bin: '紙くずが入っているだけだ。',
  panel: '配電盤だ。下手に触らないほうがよさそうだ。',
};

export const BUTTON_COLOR_NAMES: Record<ButtonColor, string> = { red: '赤', blue: '青', green: '緑', yellow: '黄' };
