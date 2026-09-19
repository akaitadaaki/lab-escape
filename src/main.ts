import * as THREE from 'three';
import { Game, RESCUE_ALL_MS, RESCUE_FIRST_MS } from './game/game';
import { buildScenario } from './puzzle/combine';
import { PUZZLE_POOL } from './puzzle/pool';
import { NPC_SLOTS } from './puzzle/types';
import type { NpcSlot, PhysicalSlot, SlotId } from './puzzle/types';
import { Controls } from './scene/controls';
import { buildRoom } from './scene/room';
import { FLAVOR_TEXTS, SLOT_NAMES } from './ui/texts';
import { Ui } from './ui/ui';
import './ui/style.css';

/** これより遠い物は調べられない（近づく必要がある） */
const REACH_DISTANCE = 3.5;

const container = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1216);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 50);
const room = buildRoom(scene);
const ui = new Ui();

const raycaster = new THREE.Raycaster();
const pickTargets = [...room.slotGroups.values()];

function pick(clientX: number, clientY: number): { slot: SlotId; distance: number } | null {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickTargets, true)[0];
  if (!hit) return null;
  let object: THREE.Object3D | null = hit.object;
  while (object && !object.userData.slot) object = object.parent;
  return object ? { slot: object.userData.slot as SlotId, distance: hit.distance } : null;
}

function isNpc(slot: SlotId): slot is NpcSlot {
  return (NPC_SLOTS as readonly string[]).includes(slot);
}

let game: Game | null = null;
let ended = false;

const controls = new Controls(camera, renderer.domElement, room.obstacles, {
  onHover(x, y) {
    const target = pick(x, y);
    const reachable = target !== null && target.distance <= REACH_DISTANCE;
    room.setHighlight(reachable ? target.slot : null);
    renderer.domElement.classList.toggle('pointing', reachable);
    if (!target) return ui.setHover(null);
    if (!reachable) return ui.setHover(`${SLOT_NAMES[target.slot]}（遠い。近づこう）`, true);
    ui.setHover(isNpc(target.slot) ? `${SLOT_NAMES[target.slot]}に話しかける` : `${SLOT_NAMES[target.slot]}を調べる`);
  },
  onClick(x, y) {
    const target = pick(x, y);
    if (!game || !target) return;
    if (target.distance > REACH_DISTANCE) {
      ui.toast(`${SLOT_NAMES[target.slot]}は遠すぎる。もっと近づこう。`, 2000);
      return;
    }
    interact(game, target.slot);
  },
});

function interact(current: Game, slot: SlotId): void {
  if (slot === 'door') {
    ui.showDoor(current);
    return;
  }
  if (isNpc(slot)) {
    ui.showDialog(slot, current);
    return;
  }
  const physical: PhysicalSlot = slot;
  const result = current.inspect(physical);
  if (result.kind === 'panel') {
    ui.showPuzzle(result.puzzle, current, (solved) => room.showTag(solved.def.lockSlot, solved.tagColor, solved.digit));
  } else {
    ui.showText(SLOT_NAMES[slot], result.kind === 'text' ? result.text : FLAVOR_TEXTS[physical]);
  }
}

ui.onModalChange = (open) => {
  controls.setEnabled(!open && game?.status === 'playing');
  if (open) room.setHighlight(null);
};

function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 999_999);
}

function start(seed: number): void {
  const scenario = buildScenario(seed, PUZZLE_POOL);
  game = new Game(scenario);
  ended = false;
  room.clearTags();
  room.setPlantWithered(scenario.puzzles.some((p) => p.def.id === 'testimony-dry-plant'));
  controls.reset();
  ui.showGame(seed);
  controls.setEnabled(true);
  // 開発時のみ、コンソールから状態確認と操作ができるようにする
  if (import.meta.env.DEV) Object.assign(window, { __game: game, __interact: (slot: SlotId) => interact(game!, slot) });
}

function finish(finished: Game): void {
  ended = true;
  controls.setEnabled(false);
  room.setHighlight(null);
  ui.showEnd(finished);
}

ui.onStart(() => {
  // ?seed=123 を付けると同じ謎の組み合わせを再現できる
  const param = Number(new URLSearchParams(location.search).get('seed'));
  start(Number.isInteger(param) && param > 0 ? param : randomSeed());
});
ui.onRetry(() => start(randomSeed()));

function resize(): void {
  const { clientWidth, clientHeight } = container;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let previous = performance.now();
renderer.setAnimationLoop((now) => {
  const dtMs = now - previous;
  previous = now;

  if (game && !ended) {
    const before = game.remainingMs;
    game.tick(dtMs);
    for (const threshold of [RESCUE_FIRST_MS, RESCUE_ALL_MS]) {
      if (before > threshold && game.remainingMs <= threshold && game.solvedCount < game.scenario.puzzles.length) {
        ui.toast('研究員が何か思い出したようだ。困っているなら話しかけてみよう。');
      }
    }
    ui.update(game);
    // クリア・時間切れのどちらも、ここで一度だけ終了画面に切り替える
    if (game.status !== 'playing') finish(game);
  }

  // 移動量はフレーム落ち時に飛びすぎないよう上限を設ける
  controls.update(Math.min(dtMs, 50) / 1000);
  room.update(now / 1000);
  renderer.render(scene, camera);
});
