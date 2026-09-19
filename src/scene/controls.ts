import * as THREE from 'three';
import { ROOM } from './room';

// ドラッグで視点回転、WASD/矢印キーで移動、クリックで調べる。
// 入力パネルの操作と切り替えやすいよう、ポインターロックは使わない。

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 2.6;
const TURN_SPEED = 1.8;
const PLAYER_RADIUS = 0.3;
const DRAG_THRESHOLD_PX = 5;

export interface ControlsCallbacks {
  onClick(clientX: number, clientY: number): void;
  onHover(clientX: number, clientY: number): void;
}

export class Controls {
  enabled = false;
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private pointerDown: { x: number; y: number; dragged: boolean } | null = null;

  constructor(
    private camera: THREE.PerspectiveCamera,
    element: HTMLElement,
    private obstacles: THREE.Box3[],
    callbacks: ControlsCallbacks,
  ) {
    camera.rotation.order = 'YXZ';
    this.reset();

    element.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.pointerDown = { x: e.clientX, y: e.clientY, dragged: false };
      element.setPointerCapture(e.pointerId);
    });
    element.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      const down = this.pointerDown;
      if (!down) {
        callbacks.onHover(e.clientX, e.clientY);
        return;
      }
      if (!down.dragged && Math.hypot(e.clientX - down.x, e.clientY - down.y) < DRAG_THRESHOLD_PX) return;
      down.dragged = true;
      this.yaw += e.movementX * 0.004;
      this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * 0.004, -1.2, 1.2);
    });
    element.addEventListener('pointerup', (e) => {
      const down = this.pointerDown;
      this.pointerDown = null;
      if (this.enabled && down && !down.dragged) callbacks.onClick(e.clientX, e.clientY);
    });
    element.addEventListener('pointercancel', () => (this.pointerDown = null));

    window.addEventListener('keydown', (e) => {
      if (this.enabled) this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  reset(): void {
    this.camera.position.set(0, EYE_HEIGHT, 2.4);
    this.yaw = 0;
    this.pitch = 0;
    this.keys.clear();
    this.applyRotation();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.pointerDown = null;
    }
  }

  update(dtSec: number): void {
    if (!this.enabled) return;
    const pressed = (...codes: string[]) => codes.some((code) => this.keys.has(code));

    if (pressed('ArrowLeft', 'KeyQ')) this.yaw += TURN_SPEED * dtSec;
    if (pressed('ArrowRight', 'KeyE')) this.yaw -= TURN_SPEED * dtSec;

    const forward = (pressed('KeyW', 'ArrowUp') ? 1 : 0) - (pressed('KeyS', 'ArrowDown') ? 1 : 0);
    const strafe = (pressed('KeyD') ? 1 : 0) - (pressed('KeyA') ? 1 : 0);
    if (forward !== 0 || strafe !== 0) {
      const length = Math.hypot(forward, strafe);
      const step = (MOVE_SPEED * dtSec) / length;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = (-sin * forward + cos * strafe) * step;
      const dz = (-cos * forward - sin * strafe) * step;
      // 軸ごとに動かすことで、壁や家具に沿って滑るように動ける
      const { position } = this.camera;
      if (this.canStand(position.x + dx, position.z)) position.x += dx;
      if (this.canStand(position.x, position.z + dz)) position.z += dz;
    }
    this.applyRotation();
  }

  private canStand(x: number, z: number): boolean {
    const limitX = ROOM.width / 2 - PLAYER_RADIUS - 0.05;
    const limitZ = ROOM.depth / 2 - PLAYER_RADIUS - 0.05;
    if (Math.abs(x) > limitX || Math.abs(z) > limitZ) return false;
    return !this.obstacles.some(
      (b) => x > b.min.x - PLAYER_RADIUS && x < b.max.x + PLAYER_RADIUS && z > b.min.z - PLAYER_RADIUS && z < b.max.z + PLAYER_RADIUS,
    );
  }

  private applyRotation(): void {
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
