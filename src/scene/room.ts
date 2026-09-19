import * as THREE from 'three';
import type { SlotId, TagColor } from '../puzzle/types';

// 研究所の部屋をプリミティブ形状だけで組み立てる。
// 各オブジェクトはローカル座標の +z を正面として作り、壁に合わせて回転させる。
// 本棚の本の冊数・絵の構図・薬品棚の瓶の量は、謎プール（puzzle/pool.ts）の文章と一致させている。

export const ROOM = { width: 10, depth: 8, height: 3.2 };

const TAG_HEX: Record<TagColor, string> = { red: '#d8453c', blue: '#3c78d8', green: '#3ca55c' };
const BOOK_HEX = { R: 0xc0392b, B: 0x2f6fd0, G: 0x2e9e57 } as const;

type Part = THREE.Object3D;

function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, extra: THREE.MeshStandardMaterialParameters = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra }));
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(rTop: number, rBottom: number, h: number, color: number, x = 0, y = 0, z = 0, extra: THREE.MeshStandardMaterialParameters = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra }));
  mesh.position.set(x, y, z);
  return mesh;
}

function sphere(r: number, color: number, x = 0, y = 0, z = 0, extra: THREE.MeshStandardMaterialParameters = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra }));
  mesh.position.set(x, y, z);
  return mesh;
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function plane(w: number, h: number, texture: THREE.Texture, x = 0, y = 0, z = 0, emissive = false): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
  if (emissive) {
    material.emissive = new THREE.Color(0xffffff);
    material.emissiveMap = texture;
    material.emissiveIntensity = 0.8;
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function group(parts: Part[], tagAnchor: [number, number, number]): THREE.Group {
  const g = new THREE.Group();
  g.add(...parts);
  g.userData.tagAnchor = new THREE.Vector3(...tagAnchor);
  return g;
}

// ---- 各オブジェクト ----

function buildDesk(): THREE.Group {
  const wood = 0x8a6a4a;
  const legs = [-0.72, 0.72].flatMap((x) => [-0.32, 0.32].map((z) => box(0.06, 0.72, 0.06, 0x3a3f45, x, 0.36, z)));
  return group(
    [
      box(1.6, 0.06, 0.8, wood, 0, 0.75, 0),
      ...legs,
      box(0.5, 0.2, 0.62, 0x74583d, 0.45, 0.6, 0),
      box(0.12, 0.03, 0.02, 0xd0d0d0, 0.45, 0.6, 0.32, { metalness: 0.8, roughness: 0.3 }),
      box(0.3, 0.01, 0.21, 0xf3f1e7, -0.35, 0.785, 0.05),
      cylinder(0.04, 0.05, 0.1, 0x2c3e50, -0.65, 0.83, -0.2),
    ],
    [0.45, 1.05, 0.1],
  );
}

function buildShelf(): THREE.Group {
  const frame = 0x5b4632;
  const parts: Part[] = [
    box(1.8, 2.0, 0.04, frame, 0, 1.0, -0.16),
    box(0.05, 2.0, 0.36, frame, -0.9, 1.0, 0),
    box(0.05, 2.0, 0.36, frame, 0.9, 1.0, 0),
    ...[0.04, 0.55, 1.05, 1.55, 1.98].map((y) => box(1.8, 0.04, 0.36, frame, 0, y, 0)),
  ];
  // 赤4冊・青2冊・緑7冊
  const rows: { y: number; books: (keyof typeof BOOK_HEX)[] }[] = [
    { y: 1.57, books: ['R', 'G', 'G', 'B', 'G'] },
    { y: 1.07, books: ['G', 'R', 'G', 'R'] },
    { y: 0.57, books: ['B', 'G', 'R', 'G'] },
  ];
  for (const row of rows) {
    row.books.forEach((c, i) => {
      const h = 0.3 + ((i * 7) % 3) * 0.035;
      parts.push(box(0.11, h, 0.24, BOOK_HEX[c], -0.7 + i * 0.16, row.y + h / 2, 0.02));
    });
  }
  parts.push(box(0.3, 0.2, 0.22, 0x9aa3ab, 0.55, 0.17, 0.02));
  return group(parts, [0, 2.3, 0.1]);
}

function buildPainting(): THREE.Group {
  // 左から 黄色い太陽・緑の丘・赤い屋根の家・青い湖
  const texture = canvasTexture(560, 360, (ctx) => {
    ctx.fillStyle = '#cfe6f5';
    ctx.fillRect(0, 0, 560, 360);
    ctx.fillStyle = '#e9dcb8';
    ctx.fillRect(0, 250, 560, 110);
    ctx.fillStyle = '#f4c20d';
    ctx.beginPath();
    ctx.arc(80, 90, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f9d4f';
    ctx.beginPath();
    ctx.ellipse(215, 290, 95, 120, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(310, 210, 90, 80);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(296, 212);
    ctx.lineTo(355, 150);
    ctx.lineTo(414, 212);
    ctx.fill();
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(345, 250, 22, 40);
    ctx.fillStyle = '#2f7fd6';
    ctx.beginPath();
    ctx.ellipse(488, 290, 62, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  return group([box(1.56, 1.06, 0.06, 0x3b2a1a, 0, 0, 0), plane(1.4, 0.9, texture, 0, 0, 0.035)], [0, -0.75, 0.2]);
}

function buildSafe(): THREE.Group {
  const dial = cylinder(0.09, 0.09, 0.05, 0xcfd3d6, -0.05, 0.72, 0.335, { metalness: 0.9, roughness: 0.25 });
  dial.rotation.x = Math.PI / 2;
  return group(
    [
      box(0.9, 0.3, 0.7, 0x4a4f55, 0, 0.15, 0),
      box(0.74, 0.84, 0.6, 0x2b3036, 0, 0.72, 0, { metalness: 0.6, roughness: 0.45 }),
      box(0.62, 0.72, 0.03, 0x363c43, 0, 0.72, 0.305, { metalness: 0.6, roughness: 0.4 }),
      dial,
      box(0.04, 0.2, 0.04, 0xcfd3d6, 0.2, 0.72, 0.34, { metalness: 0.9, roughness: 0.25 }),
    ],
    [0, 1.45, 0.1],
  );
}

function buildLocker(): THREE.Group {
  const parts: Part[] = [
    box(0.95, 1.9, 0.5, 0x5f7f96, 0, 0.95, 0, { metalness: 0.4, roughness: 0.55 }),
    box(0.02, 1.8, 0.02, 0x3d5566, 0, 0.95, 0.255),
    box(0.04, 0.16, 0.04, 0xd5d9dc, 0.12, 1.0, 0.27, { metalness: 0.9, roughness: 0.3 }),
    box(0.14, 0.1, 0.03, 0x20262b, 0.25, 1.25, 0.26),
  ];
  for (let i = 0; i < 4; i++) parts.push(box(0.3, 0.015, 0.02, 0x3d5566, -0.24, 1.62 - i * 0.05, 0.255));
  return group(parts, [0, 2.2, 0.1]);
}

function buildWhiteboard(): THREE.Group {
  // 内容は謎ごとに変わるので、判読できない走り書きだけを描く。
  // ペンの色がヒントになる謎があるため、色は付けない
  const texture = canvasTexture(512, 320, (ctx) => {
    ctx.fillStyle = '#f7f8f6';
    ctx.fillRect(0, 0, 512, 320);
    ctx.lineWidth = 3;
    ['#555555', '#777777', '#555555', '#777777'].forEach((color, row) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      let x = 40;
      const y = 60 + row * 60;
      ctx.moveTo(x, y);
      while (x < 300 + row * 40) {
        x += 14;
        ctx.lineTo(x, y + Math.sin(x * 0.9 + row) * 7);
      }
      ctx.stroke();
    });
  });
  return group(
    [
      box(1.9, 1.2, 0.04, 0xa9b0b6, 0, 0, 0, { metalness: 0.5 }),
      plane(1.8, 1.1, texture, 0, 0, 0.025),
      box(1.2, 0.04, 0.1, 0xa9b0b6, 0, -0.62, 0.06),
      box(0.12, 0.03, 0.03, 0xc0392b, -0.2, -0.59, 0.07),
      box(0.12, 0.03, 0.03, 0x2b5fb8, 0.05, -0.59, 0.07),
    ],
    [0, -0.85, 0.25],
  );
}

function buildTerminal(): THREE.Group {
  const screen = canvasTexture(320, 200, (ctx) => {
    ctx.fillStyle = '#04141c';
    ctx.fillRect(0, 0, 320, 200);
    ctx.fillStyle = '#39e6c0';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('LAB-OS v2.1', 24, 60);
    ctx.font = '22px monospace';
    ctx.fillText('> SYSTEM LOCKED', 24, 110);
    ctx.fillText('> _', 24, 150);
  });
  const buttons = [0xd8453c, 0x3c78d8, 0x3ca55c, 0xe8c62c].map((color, i) =>
    box(0.05, 0.02, 0.05, color, -0.12 + i * 0.08, 0.79, 0.2, { emissive: color, emissiveIntensity: 0.35 }),
  );
  return group(
    [
      box(1.0, 0.06, 0.65, 0x70787f, 0, 0.75, 0, { metalness: 0.4 }),
      ...[-0.44, 0.44].flatMap((x) => [-0.26, 0.26].map((z) => box(0.05, 0.72, 0.05, 0x3a3f45, x, 0.36, z))),
      box(0.66, 0.46, 0.06, 0x1d2227, 0, 1.12, -0.1),
      plane(0.6, 0.4, screen, 0, 1.12, -0.065, true),
      box(0.1, 0.14, 0.08, 0x1d2227, 0, 0.84, -0.12),
      box(0.42, 0.02, 0.15, 0x2a3036, 0, 0.79, 0.06),
      ...buttons,
    ],
    [0.4, 1.0, 0.25],
  );
}

function buildPlant(): THREE.Group {
  const leaf = 0x3d8b4a;
  const parts: Part[] = [cylinder(0.22, 0.17, 0.36, 0x9b5a3c, 0, 0.18, 0), cylinder(0.2, 0.2, 0.02, 0x3b2a1e, 0, 0.35, 0), cylinder(0.025, 0.03, 0.6, 0x5a4a2f, 0, 0.65, 0)];
  const leaves: [number, number, number, number][] = [
    [0, 1.05, 0, 0.26],
    [0.18, 0.85, 0.05, 0.19],
    [-0.17, 0.9, -0.06, 0.2],
    [0.04, 0.8, -0.18, 0.17],
    [-0.05, 0.78, 0.17, 0.16],
  ];
  const leafMeshes = leaves.map(([x, y, z, r]) => sphere(r, leaf, x, y, z));
  parts.push(...leafMeshes, box(0.1, 0.07, 0.005, 0xf3f1e7, 0.1, 0.42, 0.12));
  const g = group(parts, [0, 1.55, 0]);
  g.userData.leaves = leafMeshes;
  return g;
}

function buildCabinet(): THREE.Group {
  const white = 0xe4e8ea;
  const parts: Part[] = [
    box(1.0, 1.8, 0.04, white, 0, 0.9, -0.18),
    box(0.04, 1.8, 0.4, white, -0.5, 0.9, 0),
    box(0.04, 1.8, 0.4, white, 0.5, 0.9, 0),
    ...[0.02, 0.6, 1.15, 1.78].map((y) => box(1.0, 0.04, 0.4, white, 0, y, 0)),
    box(0.96, 1.76, 0.015, 0xbfe3ee, 0, 0.9, 0.195, { transparent: true, opacity: 0.18, roughness: 0.1 }),
    box(0.1, 0.14, 0.03, 0x20262b, 0.4, 0.95, 0.215),
  ];
  // 液体の量は少ない順に 青・赤・黄・緑
  const bottles: [number, number][] = [
    [0x3c78d8, 0.04],
    [0xd8453c, 0.09],
    [0xe8c62c, 0.14],
    [0x3ca55c, 0.19],
  ];
  // 量の順がそのまま答えにならないよう、並びは入れ替える
  const order = [2, 0, 3, 1];
  order.forEach((bottleIndex, i) => {
    const [color, level] = bottles[bottleIndex];
    const x = -0.3 + i * 0.2;
    parts.push(cylinder(0.055, 0.055, 0.24, 0xdff3f7, x, 1.29, 0, { transparent: true, opacity: 0.3, roughness: 0.1 }));
    parts.push(cylinder(0.045, 0.045, level, color, x, 1.175 + level / 2, 0, { emissive: color, emissiveIntensity: 0.25 }));
    parts.push(cylinder(0.025, 0.025, 0.04, 0x30363b, x, 1.43, 0));
  });
  parts.push(box(0.3, 0.25, 0.25, 0x8d969c, -0.2, 0.75, 0), box(0.2, 0.3, 0.2, 0xb58a4a, 0.2, 0.19, 0));
  return group(parts, [0, 2.1, 0.1]);
}

function buildBin(): THREE.Group {
  return group(
    [
      cylinder(0.19, 0.15, 0.42, 0x394046, 0, 0.21, 0, { metalness: 0.5 }),
      sphere(0.07, 0xf3f1e7, 0.03, 0.42, 0.02),
      sphere(0.06, 0xe9e5d6, -0.06, 0.4, -0.04),
      sphere(0.05, 0xf3f1e7, 0.2, 0.05, 0.22),
    ],
    [0, 0.85, 0],
  );
}

function buildPanel(): THREE.Group {
  const parts: Part[] = [box(0.7, 0.8, 0.12, 0x7c858c, 0, 0, 0, { metalness: 0.5 }), box(0.62, 0.72, 0.02, 0x59626a, 0, 0, 0.065)];
  for (let i = 0; i < 5; i++) {
    parts.push(box(0.06, 0.16, 0.05, 0x1f2428, -0.22 + i * 0.11, 0.08, 0.09));
    parts.push(box(0.03, 0.03, 0.02, i % 2 ? 0x3ca55c : 0xe8a22c, -0.22 + i * 0.11, -0.12, 0.08, { emissive: i % 2 ? 0x3ca55c : 0xe8a22c, emissiveIntensity: 0.8 }));
  }
  parts.push(box(0.36, 0.22, 0.18, 0x4a5259, 0, -0.56, 0.03, { metalness: 0.5 }));
  return group(parts, [0, -0.56, 0.35]);
}

function buildDoor(): THREE.Group {
  const sign = canvasTexture(256, 96, (ctx) => {
    ctx.fillStyle = '#0c3b1e';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#7dffa8';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', 128, 70);
  });
  return group(
    [
      box(1.5, 2.4, 0.08, 0x30363c, 0, 1.2, 0),
      box(1.26, 2.2, 0.08, 0x8e989f, 0, 1.1, 0.03, { metalness: 0.7, roughness: 0.35 }),
      box(1.26, 0.06, 0.09, 0xe8c62c, 0, 1.15, 0.035),
      box(0.22, 0.34, 0.06, 0x1d2227, 0.95, 1.25, 0.03),
      box(0.16, 0.08, 0.02, 0xd8453c, 0.95, 1.36, 0.065, { emissive: 0xd8453c, emissiveIntensity: 1 }),
      plane(0.7, 0.26, sign, 0, 2.6, 0.05, true),
    ],
    [0.95, 1.7, 0.3],
  );
}

function buildResearcher(): THREE.Group {
  const coat = 0xf0f2f4;
  return group(
    [
      cylinder(0.075, 0.07, 0.8, 0x2f3640, -0.1, 0.4, 0),
      cylinder(0.075, 0.07, 0.8, 0x2f3640, 0.1, 0.4, 0),
      cylinder(0.2, 0.25, 0.75, coat, 0, 1.12, 0),
      cylinder(0.055, 0.05, 0.62, coat, -0.27, 1.13, 0),
      cylinder(0.055, 0.05, 0.62, coat, 0.27, 1.13, 0),
      sphere(0.15, 0xe8b992, 0, 1.64, 0),
      sphere(0.158, 0x3a2a1e, 0, 1.68, -0.035),
      box(0.22, 0.045, 0.02, 0x1b1f23, 0, 1.65, 0.14),
      box(0.1, 0.13, 0.01, 0x3c78d8, 0.1, 1.25, 0.215),
    ],
    [0, 2.0, 0],
  );
}

function buildRobot(): THREE.Group {
  const shell = 0xcdd5da;
  const eyes = [-0.08, 0.08].map((x) => sphere(0.04, 0x39e6e6, x, 1.18, 0.16, { emissive: 0x39e6e6, emissiveIntensity: 1.2 }));
  const g = group(
    [
      cylinder(0.26, 0.3, 0.2, 0x3a4147, 0, 0.1, 0),
      cylinder(0.1, 0.14, 0.25, 0x59626a, 0, 0.32, 0),
      box(0.52, 0.55, 0.4, shell, 0, 0.72, 0, { metalness: 0.5, roughness: 0.4 }),
      box(0.22, 0.12, 0.02, 0x1d2227, 0, 0.78, 0.205),
      box(0.4, 0.3, 0.32, shell, 0, 1.17, 0, { metalness: 0.5, roughness: 0.4 }),
      ...eyes,
      cylinder(0.01, 0.01, 0.2, 0x59626a, 0.12, 1.42, 0),
      sphere(0.03, 0xd8453c, 0.12, 1.53, 0, { emissive: 0xd8453c, emissiveIntensity: 1 }),
      cylinder(0.04, 0.04, 0.45, 0x59626a, -0.32, 0.7, 0),
      cylinder(0.04, 0.04, 0.45, 0x59626a, 0.32, 0.7, 0),
    ],
    [0, 1.8, 0],
  );
  g.userData.eyes = eyes;
  return g;
}

// ---- 部屋の外殻 ----

function buildShell(scene: THREE.Scene): THREE.PointLight {
  const { width: w, depth: d, height: h } = ROOM;

  const floorTexture = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#8f979c';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#737b80';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);
  });
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(w, d);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0xd9dee1, roughness: 1, emissive: 0x3a4044 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = h;
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xc3ccd1, roughness: 0.95 });
  const walls: [number, number, number, number][] = [
    [w, 0, -d / 2, 0],
    [w, 0, d / 2, Math.PI],
    [d, -w / 2, 0, Math.PI / 2],
    [d, w / 2, 0, -Math.PI / 2],
  ];
  for (const [length, x, z, rotation] of walls) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, h), wallMaterial);
    wall.position.set(x, h / 2, z);
    wall.rotation.y = rotation;
    scene.add(wall);
    const band = box(length, 0.9, 0.03, 0x6d7f8a, 0, 0.45, 0);
    band.position.set(x, 0.45, z);
    band.rotation.y = rotation;
    scene.add(band);
  }

  scene.add(new THREE.HemisphereLight(0xdfe9f0, 0x4a4f55, 1.2));
  for (const x of [-2.5, 2.5]) {
    scene.add(box(1.4, 0.04, 0.5, 0xffffff, x, h - 0.02, 0, { emissive: 0xffffff, emissiveIntensity: 1 }));
    const lamp = new THREE.PointLight(0xfff4e0, 7, 12, 1.4);
    lamp.position.set(x, h - 0.7, 0);
    scene.add(lamp);
  }

  // 出口の上で明滅する非常灯
  const alarm = new THREE.PointLight(0xff3b30, 4, 6, 1.8);
  alarm.position.set(0, h - 0.4, -d / 2 + 0.6);
  scene.add(alarm);
  return alarm;
}

interface Placement {
  slot: SlotId;
  build: () => THREE.Group;
  position: [number, number, number];
  rotationY: number;
  /** 床に立っていて、プレイヤーが通り抜けられない物か */
  solid: boolean;
}

const NORTH = 0;
const SOUTH = Math.PI;
const WEST = Math.PI / 2;
const EAST = -Math.PI / 2;
const { width: W, depth: D } = ROOM;

const PLACEMENTS: Placement[] = [
  { slot: 'door', build: buildDoor, position: [0, 0, -D / 2 + 0.05], rotationY: NORTH, solid: false },
  { slot: 'painting', build: buildPainting, position: [-3.1, 1.75, -D / 2 + 0.04], rotationY: NORTH, solid: false },
  { slot: 'whiteboard', build: buildWhiteboard, position: [3.1, 1.6, -D / 2 + 0.03], rotationY: NORTH, solid: false },
  { slot: 'shelf', build: buildShelf, position: [-W / 2 + 0.2, 0, -1.4], rotationY: WEST, solid: true },
  { slot: 'safe', build: buildSafe, position: [-W / 2 + 0.4, 0, 2.2], rotationY: WEST, solid: true },
  { slot: 'locker', build: buildLocker, position: [W / 2 - 0.27, 0, -2.0], rotationY: EAST, solid: true },
  { slot: 'cabinet', build: buildCabinet, position: [W / 2 - 0.22, 0, 0.9], rotationY: EAST, solid: true },
  { slot: 'panel', build: buildPanel, position: [3.0, 1.55, D / 2 - 0.07], rotationY: SOUTH, solid: false },
  { slot: 'terminal', build: buildTerminal, position: [-2.4, 0, D / 2 - 0.4], rotationY: SOUTH, solid: true },
  { slot: 'desk', build: buildDesk, position: [1.9, 0, 0.3], rotationY: SOUTH + 0.25, solid: true },
  { slot: 'bin', build: buildBin, position: [0.7, 0, 0.9], rotationY: 0, solid: true },
  { slot: 'plant', build: buildPlant, position: [W / 2 - 0.6, 0, D / 2 - 0.6], rotationY: 0, solid: true },
  { slot: 'researcher', build: buildResearcher, position: [-2.3, 0, -1.2], rotationY: 0.9, solid: true },
  { slot: 'robot', build: buildRobot, position: [1.7, 0, -2.7], rotationY: -0.3, solid: true },
];

export interface Room {
  slotGroups: Map<SlotId, THREE.Group>;
  obstacles: THREE.Box3[];
  /** 解いた謎の場所に数字札を浮かべる */
  showTag(slot: SlotId, color: TagColor, digit: number): void;
  clearTags(): void;
  setHighlight(slot: SlotId | null): void;
  /** 「植物が枯れかけている」というヒントの謎が出題されたとき、見た目を合わせる */
  setPlantWithered(withered: boolean): void;
  update(timeSec: number): void;
}

export function buildRoom(scene: THREE.Scene): Room {
  const alarm = buildShell(scene);
  const slotGroups = new Map<SlotId, THREE.Group>();
  const obstacles: THREE.Box3[] = [];
  const baseY = new Map<SlotId, number>();

  for (const placement of PLACEMENTS) {
    const g = placement.build();
    g.position.set(...placement.position);
    g.rotation.y = placement.rotationY;
    g.userData.slot = placement.slot;
    scene.add(g);
    slotGroups.set(placement.slot, g);
    baseY.set(placement.slot, placement.position[1]);
    if (placement.solid) {
      g.updateMatrixWorld(true);
      obstacles.push(new THREE.Box3().setFromObject(g));
    }
  }

  const tags: THREE.Mesh[] = [];
  let highlighted: SlotId | null = null;

  function setEmissive(slot: SlotId, on: boolean): void {
    slotGroups.get(slot)?.traverse((object) => {
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!material || material.emissiveMap) return;
      if (material.userData.baseEmissive === undefined) {
        material.userData.baseEmissive = material.emissive.getHex();
        material.userData.baseIntensity = material.emissiveIntensity;
      }
      // もともと光っている部品（ランプ・瓶の液体など）はそのままにする
      if (material.userData.baseEmissive !== 0) return;
      material.emissive.setHex(on ? 0x335566 : 0x000000);
      material.emissiveIntensity = on ? 0.6 : material.userData.baseIntensity;
    });
  }

  return {
    slotGroups,
    obstacles,
    showTag(slot, color, digit) {
      const g = slotGroups.get(slot);
      if (!g) return;
      const texture = canvasTexture(128, 96, (ctx) => {
        ctx.fillStyle = TAG_HEX[color];
        ctx.fillRect(0, 0, 128, 96);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 116, 84);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(digit), 64, 74);
      });
      const material = new THREE.MeshStandardMaterial({ map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.7, side: THREE.DoubleSide });
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.21), material);
      g.updateMatrixWorld(true);
      tag.position.copy(g.localToWorld((g.userData.tagAnchor as THREE.Vector3).clone()));
      tag.userData.baseY = tag.position.y;
      scene.add(tag);
      tags.push(tag);
    },
    clearTags() {
      for (const tag of tags) {
        scene.remove(tag);
        tag.geometry.dispose();
        (tag.material as THREE.MeshStandardMaterial).map?.dispose();
        (tag.material as THREE.Material).dispose();
      }
      tags.length = 0;
    },
    setHighlight(slot) {
      if (slot === highlighted) return;
      if (highlighted) setEmissive(highlighted, false);
      if (slot) setEmissive(slot, true);
      highlighted = slot;
    },
    setPlantWithered(withered) {
      for (const leafMesh of slotGroups.get('plant')!.userData.leaves as THREE.Mesh[]) {
        (leafMesh.material as THREE.MeshStandardMaterial).color.setHex(withered ? 0x9a8a4a : 0x3d8b4a);
      }
    },
    update(timeSec) {
      alarm.intensity = 2.5 + Math.sin(timeSec * 3) * 2;
      const robot = slotGroups.get('robot')!;
      robot.position.y = baseY.get('robot')! + Math.sin(timeSec * 2) * 0.015;
      const blink = timeSec % 4 < 0.12 ? 0.1 : 1.2;
      for (const eye of robot.userData.eyes as THREE.Mesh[]) {
        (eye.material as THREE.MeshStandardMaterial).emissiveIntensity = blink;
      }
      const researcher = slotGroups.get('researcher')!;
      researcher.rotation.z = Math.sin(timeSec * 0.8) * 0.015;
      for (const tag of tags) {
        tag.position.y = tag.userData.baseY + Math.sin(timeSec * 2.2) * 0.03;
        tag.rotation.y = timeSec * 0.9;
      }
    },
  };
}
