import type { PuzzleDef } from './types';

// 謎プール。AIが事前生成し、人が検品する前提のデータ。
// 追加・変更したら pool.test.ts で整合性を確認すること。
// 本棚の本の冊数・絵の構図・薬品棚の瓶の量は、部屋の3D表示（scene/room.ts）と一致させている。

export const PUZZLE_POOL: PuzzleDef[] = [
  // ---- 数字ロック ----
  {
    id: 'dial-safe-books',
    type: 'dial',
    title: '金庫のダイヤル',
    lockSlot: 'safe',
    prompt: '3桁のダイヤル錠が付いた金庫だ。ダイヤルの下に、左から「青・緑・赤」の小さな印が付いている。',
    input: { kind: 'code', answer: '274' },
    clues: [
      { slot: 'shelf', text: '本棚には、赤い本が4冊、青い本が2冊、緑の本が7冊並んでいる。' },
      { slot: 'researcher', text: '金庫の番号？ 所長は「番号なんて覚えなくていい、部屋を見れば数えられる」と笑っていたな。' },
    ],
    rescueHint: '本棚の本を色ごとに数えて、金庫の印の色の順（青・緑・赤）に並べるんだ。',
    solvedText: 'カチリと音がして金庫が開いた。',
  },
  {
    id: 'dial-locker-duty',
    type: 'dial',
    title: 'ロッカーの暗証番号',
    lockSlot: 'locker',
    prompt: '3桁の暗証番号式のロッカーだ。',
    input: { kind: 'code', answer: '143' },
    clues: [
      { slot: 'whiteboard', text: 'ホワイトボードの当番表: 月=3 / 火=8 / 水=1 / 木=6 / 金=4' },
      { slot: 'bin', text: 'ゴミ箱に丸めたメモがある。「ロッカーの番号は 水・金・月 の当番」' },
    ],
    rescueHint: 'ホワイトボードの当番表から、水曜・金曜・月曜の数字を順に拾ってごらん。',
    solvedText: 'ロッカーの扉が開いた。',
  },
  {
    id: 'dial-cabinet-stock',
    type: 'dial',
    title: '薬品棚のロック',
    lockSlot: 'cabinet',
    prompt: '薬品棚には3桁の電子ロックが付いている。ロックの横にラベル「C → A → B」が貼られている。',
    input: { kind: 'code', answer: '259' },
    clues: [
      { slot: 'terminal', text: '端末の在庫ログ: 試薬A 5本 / 試薬B 9本 / 試薬C 2本' },
      { slot: 'robot', text: '薬品棚ノ 番号ハ 在庫数ト 連動シテ イマス。在庫ハ 端末デ 確認デキマス。' },
    ],
    rescueHint: '端末の在庫ログの本数を、薬品棚のラベルの順（C・A・B）に並べるんだ。',
    solvedText: '電子ロックが外れ、薬品棚のガラス戸が開いた。',
  },

  // ---- 順番押し ----
  {
    id: 'seq-terminal-painting',
    type: 'sequence',
    title: '端末の起動ボタン',
    lockSlot: 'terminal',
    prompt: '端末はロックされている。画面の下に赤・青・緑・黄の4つのボタンがある。正しい順に押せば起動しそうだ。',
    input: { kind: 'sequence', answer: ['yellow', 'green', 'red', 'blue'] },
    clues: [
      { slot: 'painting', text: '風景画だ。左から順に、黄色い太陽、緑の丘、赤い屋根の家、青い湖が描かれている。' },
      { slot: 'researcher', text: '端末のボタン？ 所長はあの絵がお気に入りでね。「左から右へ眺めるのがいいんだ」が口癖だったよ。' },
    ],
    rescueHint: '壁の絵に描かれたものの色を、左から順に押すんだ。黄・緑・赤・青だよ。',
    solvedText: '端末が起動し、横の小さな収納トレイが開いた。',
  },
  {
    id: 'seq-safe-rainbow',
    type: 'sequence',
    title: '金庫の色ボタン',
    lockSlot: 'safe',
    prompt: '金庫の扉に赤・青・緑・黄の4つのボタンが並んでいる。',
    input: { kind: 'sequence', answer: ['red', 'yellow', 'green', 'blue'] },
    clues: [
      { slot: 'plant', text: '鉢に小さな札が差してある。「金庫は虹に従え。外側から内側へ」' },
      { slot: 'robot', text: '虹ハ 外側カラ 赤・橙・黄・緑・青・藍・紫 ノ 順デス。' },
    ],
    rescueHint: '虹の色の順で、ボタンにある色だけを押すんだ。赤・黄・緑・青だよ。',
    solvedText: '金庫の扉がゆっくり開いた。',
  },
  {
    id: 'seq-locker-bottles',
    type: 'sequence',
    title: 'ロッカーの色ボタン',
    lockSlot: 'locker',
    prompt: 'ロッカーの取っ手の上に、赤・青・緑・黄の4つのボタンがある。',
    input: { kind: 'sequence', answer: ['green', 'yellow', 'red', 'blue'] },
    clues: [
      { slot: 'cabinet', text: '薬品棚に4本の瓶が並んでいる。液体の量は少ない順に、青・赤・黄・緑だ。' },
      { slot: 'bin', text: 'ゴミ箱にメモの切れ端がある。「ロッカーは、多いものから順に」' },
    ],
    rescueHint: '薬品棚の瓶を、液体の多い順に押すんだ。緑・黄・赤・青だよ。',
    solvedText: 'ロッカーの扉が開いた。',
  },

  // ---- アイテム使用 ----
  {
    id: 'item-desk-key',
    type: 'item',
    title: '机の引き出し',
    lockSlot: 'desk',
    prompt: '机の引き出しには鍵がかかっている。小さな鍵穴がある。',
    input: {
      kind: 'item',
      itemId: 'small-key',
      itemName: '小さな鍵',
      itemSlot: 'plant',
      foundText: '鉢の土を探ると、小さな鍵が埋まっていた。「小さな鍵」を手に入れた。',
    },
    clues: [{ slot: 'researcher', text: '引き出しの鍵かい？ 前任者は「緑に預けた」と言っていたよ。何のことやら。' }],
    rescueHint: '「緑」というのは観葉植物のことじゃないかな。鉢を調べてごらん。',
    solvedText: '小さな鍵で引き出しが開いた。',
  },
  {
    id: 'item-cabinet-card',
    type: 'item',
    title: '薬品棚のカードリーダー',
    lockSlot: 'cabinet',
    prompt: '薬品棚にはカードリーダーが付いている。カードキーが必要だ。',
    input: {
      kind: 'item',
      itemId: 'card-key',
      itemName: 'カードキー',
      itemSlot: 'shelf',
      foundText: '分厚い本の間に、カードキーが挟まっていた。「カードキー」を手に入れた。',
    },
    clues: [{ slot: 'robot', text: 'カードキーハ「知識ノ 間ニ 眠ル」ト 所長ガ 言ッテ イマシタ。' }],
    rescueHint: '「知識の間」は本棚のことだろう。本の間を調べてごらん。',
    solvedText: 'カードキーをかざすと、薬品棚のガラス戸が開いた。',
  },
  {
    id: 'item-safe-painting',
    type: 'item',
    title: '金庫の鍵穴',
    lockSlot: 'safe',
    prompt: '鍵式の古い金庫だ。専用の鍵が必要だ。',
    input: {
      kind: 'item',
      itemId: 'safe-key',
      itemName: '金庫の鍵',
      itemSlot: 'painting',
      foundText: '絵を少し持ち上げると、裏に鍵がテープで貼られていた。「金庫の鍵」を手に入れた。',
    },
    clues: [{ slot: 'bin', text: 'ゴミ箱に走り書きのメモがある。「大事なものは芸術の裏に」' }],
    rescueHint: '「芸術」といえば壁の絵だ。絵の裏を調べてごらん。',
    solvedText: '金庫の鍵を回すと、重い扉が開いた。',
  },

  // ---- 証言の矛盾 ----
  {
    id: 'testimony-exit-log',
    type: 'testimony',
    title: '配電盤のスイッチ',
    lockSlot: 'panel',
    prompt: '配電盤にA〜Eの5つのスイッチがある。正しいスイッチを入れれば、下の小箱が開くらしい。2人の話は食い違っている…。',
    input: { kind: 'choice', options: ['A', 'B', 'C', 'D', 'E'], answer: 4 },
    clues: [
      { slot: 'researcher', text: '配電盤の正解はCだ。昨夜、最後にこの部屋を出たのは私だから間違いないよ。' },
      { slot: 'robot', text: '配電盤ノ 正解ハ E デス。昨夜 最後ニ 退室シタノハ 所長デス。' },
      { slot: 'terminal', text: '端末の退室ログ: 21:40 研究員 / 23:05 所長' },
    ],
    rescueHint: '…すまない、端末の退室ログを見てくれ。最後に出たのは私じゃなかった。記憶違いをしているのは私のほうだ。',
    solvedText: 'スイッチを入れると、配電盤の下の小箱が開いた。',
  },
  {
    id: 'testimony-pen-color',
    type: 'testimony',
    title: '配電盤のブレーカー',
    lockSlot: 'panel',
    prompt: '配電盤に1〜5番のブレーカーがある。正しいものを上げれば、下の小箱が開くらしい。2人の話は食い違っている…。',
    input: { kind: 'choice', options: ['1番', '2番', '3番', '4番', '5番'], answer: 3 },
    clues: [
      { slot: 'researcher', text: '正しいブレーカーは2番だ。今朝ホワイトボードに点検結果を書いたのは私だよ、いつもの青いペンでね。' },
      { slot: 'robot', text: '正シイ ブレーカーハ 4番デス。今朝ノ 点検結果ハ ワタシガ 赤イ ペンデ 書キマシタ。' },
      { slot: 'whiteboard', text: 'ホワイトボードに赤いペンで書かれている。「本日の点検: 異常なし」' },
    ],
    rescueHint: '…ホワイトボードの字は赤いペンだったかい？ なら書いたのはロボットだ。私の記憶のほうが怪しい。',
    solvedText: 'ブレーカーを上げると、配電盤の下の小箱が開いた。',
  },
  {
    id: 'testimony-dry-plant',
    type: 'testimony',
    title: '配電盤の回路',
    lockSlot: 'panel',
    prompt: '配電盤にA〜Eの5つの回路がある。安全な回路を選べば、下の小箱が開くらしい。2人の話は食い違っている…。',
    input: { kind: 'choice', options: ['A回路', 'B回路', 'C回路', 'D回路', 'E回路'], answer: 3 },
    clues: [
      { slot: 'researcher', text: '安全なのはB回路だ。私はこの部屋に詳しいんだ。観葉植物にも毎日欠かさず水をやっているくらいでね。' },
      { slot: 'robot', text: '安全ナノハ D回路デス。研究員サンハ 3週間 コノ部屋ニ 来テ イマセンデシタ。' },
      { slot: 'plant', text: '観葉植物の土はカラカラに乾き、葉が枯れかけている。何週間も水をもらっていないようだ。' },
    ],
    rescueHint: '…観葉植物が枯れかけている？ そうか、しばらく来ていなかったのは私のほうか。ロボットの言うことを信じてくれ。',
    solvedText: '回路を切り替えると、配電盤の下の小箱が開いた。',
  },

  // ---- 暗号メモ ----
  {
    id: 'cipher-terminal-symbols',
    type: 'cipher',
    title: '端末のパスワード',
    lockSlot: 'terminal',
    prompt: '端末がパスワードを求めている。英字4文字のようだ。',
    input: { kind: 'word', answer: 'ATOM' },
    clues: [
      { slot: 'whiteboard', text: 'ホワイトボードに対応表が書かれている。「△=A　□=O　○=T　☆=M　◇=E」' },
      { slot: 'bin', text: 'ゴミ箱に付箋が捨ててある。「パスワード: △ ○ □ ☆」' },
    ],
    rescueHint: '付箋の記号を、ホワイトボードの対応表で英字に置き換えるんだ。△○□☆ は A・T・O・M だよ。',
    solvedText: 'ログインに成功し、端末横の小さな収納トレイが開いた。',
  },
  {
    id: 'cipher-safe-shift',
    type: 'cipher',
    title: '金庫の文字ダイヤル',
    lockSlot: 'safe',
    prompt: '英字4文字を合わせるダイヤル式の金庫だ。',
    input: { kind: 'word', answer: 'GENE' },
    clues: [
      { slot: 'painting', text: '額縁の隅に小さく文字が彫られている。「HFOF」' },
      { slot: 'shelf', text: '一冊の本の背表紙に手書きの文字がある。「アルファベットは1文字ずつ前へ戻せ」' },
    ],
    rescueHint: '額縁の「HFOF」を1文字ずつ前に戻すんだ。H→G、F→E、O→N、F→E だよ。',
    solvedText: '文字が揃うと、金庫の扉が開いた。',
  },
  {
    id: 'cipher-locker-atomic',
    type: 'cipher',
    title: 'ロッカーの合言葉',
    lockSlot: 'locker',
    prompt: '英字3文字を合わせるダイヤル式のロッカーだ。',
    input: { kind: 'word', answer: 'ION' },
    clues: [
      { slot: 'desk', text: '机の上にメモがある。「ロッカーの合言葉: 原子番号 53・8・7」' },
      { slot: 'cabinet', text: '薬品棚の戸に周期表の抜粋が貼ってある。「H=1　C=6　N=7　O=8　Na=11　I=53」' },
    ],
    rescueHint: '机のメモの原子番号を、薬品棚の周期表で元素記号に直すんだ。53・8・7 は I・O・N だよ。',
    solvedText: '文字が揃うと、ロッカーの扉が開いた。',
  },
];
