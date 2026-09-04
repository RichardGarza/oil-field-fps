// Desert oil-field arena: meshes, lights, fog, collision boxes, props and tower waypoints
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { addBox } from './collision.js';

const M = CONFIG.map;
let seed = 1337;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const drumGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12);
const pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 1, 12);
const flangeGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 12);
const wheelGeo = new THREE.TorusGeometry(0.3, 0.05, 6, 14);
const tireGeo = new THREE.TorusGeometry(0.45, 0.17, 6, 14);
const rockGeo = new THREE.DodecahedronGeometry(1, 0);
const scrubGeo = new THREE.IcosahedronGeometry(1, 0);
const patchGeo = new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2);
const hillGeo = new THREE.ConeGeometry(1, 1, 7);
const mats = new Map();
const mat = c => mats.get(c) || mats.set(c, new THREE.MeshLambertMaterial({ color: c })).get(c);
export const mapMeshes = [];
export const waypoints = [
  [4, 0, 3.4], [4, 4.5, -2.55], [1.8, 4.5, -2.55], [-4, 5, -2.55], [-4, 9, 2.4], [-2.55, 9, 2.2], [-2.55, 9.5, 4], [2.2, 13.5, 4], [1.8, 13.5, 2],
].map(a => new THREE.Vector3(...a));
let scene;

function place(geo, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, parent = scene) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  parent.add(m); mapMeshes.push(m);
  return m;
}

function block(color, x, y, z, sx, sy, sz) { place(unitBox, color, x, y, z, sx, sy, sz); addBox(x, y, z, sx, sy, sz); }

function stairs(color, x, y0, z, dx, dz, n, w, depth) {
  for (let i = 0; i < n; i++) block(color, x + dx * depth * i, y0 + 0.5 * i + 0.25, z + dz * depth * i, dx ? depth : w, 0.5, dz ? depth : w);
}

function container(color, x, z, rotY, y = 1.25) {
  place(unitBox, color, x, y, z, 6, 2.5, 2.4, 0, rotY);
  if (!rotY) return addBox(x, y, z, 6, 2.5, 2.4);
  for (let i = -2; i <= 2; i++) addBox(x + Math.cos(rotY) * 1.2 * i, y, z - Math.sin(rotY) * 1.2 * i, 2.4, 2.5, 2.4);
}

function drums(x, z) {
  const off = [[0, 0], [0.75, 0.05], [-0.75, 0.1], [0.35, 0.72], [-0.4, 0.75]];
  off.forEach(([ox, oz], i) => { place(drumGeo, i % 2 ? M.drumAlt : M.drum, x + ox, 0.4, z + oz, 1, 1, 1); addBox(x + ox, 0.4, z + oz, 0.7, 0.8, 0.7); });
}

function scatter(geo, colors, n, smin, smax, squash, sink, tumble, shadow) {
  const im = new THREE.InstancedMesh(geo, mat(0xffffff), n);
  im.castShadow = shadow; im.receiveShadow = true;
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let x, z;
    do { x = (rnd() - 0.5) * 46; z = (rnd() - 0.5) * 46; } while (Math.hypot(x, z) < 7.5);
    const s = smin + rnd() * (smax - smin);
    o.position.set(x, 0.02 + s * squash * sink, z); o.scale.set(s, s * squash, s);
    o.rotation.set(tumble ? rnd() * 6.28 : 0, rnd() * 6.28, tumble ? rnd() * 6.28 : 0);
    o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)]));
  }
  scene.add(im);
}

function boulder(x, z, s) {
  place(rockGeo, M.rock[0], x, s * 0.5, z, s, s * 0.8, s, rnd() * 6.28, rnd() * 6.28, 0);
  addBox(x, s * 0.5, z, s * 1.5, s * 1.3, s * 1.5);
}

function tires(x, z) {
  for (let i = 0; i < 3; i++) place(tireGeo, M.tire, x + (rnd() - 0.5) * 0.15, 0.17 + i * 0.34, z + (rnd() - 0.5) * 0.15, 1, 1, 1, Math.PI / 2);
  addBox(x, 0.5, z, 1.2, 1, 1.2);
}

function crates(x, z) {
  block(M.crate, x, 0.375, z, 0.75, 0.75, 0.75); block(M.crate, x + 0.8, 0.375, z + 0.1, 0.75, 0.75, 0.75); block(M.crate, x + 0.05, 1, z - 0.05, 0.5, 0.5, 0.5);
}

function pumpjack(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  const p = (color, px, py, pz, sx, sy, sz, rz = 0) => place(unitBox, color, px, py, pz, sx, sy, sz, 0, 0, rz, g);
  p(M.concrete, 0, 0.2, 0, 5, 0.4, 2.2);
  p(M.rust, 0.6, 2.2, -0.6, 0.25, 4, 0.25, 0.25); p(M.rust, 0.6, 2.2, 0.6, 0.25, 4, 0.25, 0.25);
  p(M.rust, 0, 4.2, 0, 5.5, 0.3, 0.35, -0.12); p(M.rust, -2.9, 4.6, 0, 0.5, 1.2, 0.6);
  p(M.rust, 2.1, 1.4, 0, 1.6, 0.25, 0.25, 1.1); p(M.rust, 2.6, 0.9, 0, 1.2, 1.2, 0.5);
  addBox(x, 1, z, 2.6, 2, 2.6);
}

function sky() {
  const g = new THREE.SphereGeometry(600, 24, 12), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(M.skyTop), hor = new THREE.Color(M.fog), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { c.lerpColors(hor, top, Math.pow(Math.max(0, pos.getY(i) / 600), 0.45)); c.toArray(col, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
  const dir = new THREE.Vector3().fromArray(M.sunDir).normalize();
  const disc = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d0, fog: false }));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffd890, fog: false, transparent: true, opacity: 0.3, depthWrite: false }));
  disc.position.copy(dir).multiplyScalar(500); glow.position.copy(disc.position);
  scene.add(disc, glow);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * 6.283 + rnd() * 0.25, r = 150 + rnd() * 80, hgt = 30 + rnd() * 40, w = 45 + rnd() * 45;
    place(hillGeo, M.mountain, Math.cos(a) * r, hgt / 2 - 1, Math.sin(a) * r, w, hgt, w * (0.6 + rnd() * 0.7), 0, rnd() * 6.28);
  }
}

function braces() {
  const th = Math.atan2(6.3, 4.5), L = Math.hypot(6.3, 4.5);
  for (let t = 0; t < 3; t++) for (let s = 0; s < 4; s++) {
    if (s === t) continue;
    const y = 2.25 + 4.5 * t, sign = s % 2 ? -1 : 1;
    for (const d of [-1, 1]) s < 2 ? place(unitBox, M.steel, sign * 3.15, y, 0, 0.12, L, 0.12, d * th) : place(unitBox, M.steel, 0, y, sign * 3.15, 0.12, L, 0.12, 0, 0, d * th);
  }
}

export function buildMap(s) {
  scene = s;
  scene.background = new THREE.Color(M.fog);
  scene.fog = new THREE.Fog(M.fog, M.fogNear, M.fogFar);
  scene.add(new THREE.HemisphereLight(0xffe4c0, 0x9a7a50, 0.7));
  const sun = new THREE.DirectionalLight(0xffd6a0, 2.4);
  sun.position.fromArray(M.sunDir); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 120 });
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(M.sand));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor); mapMeshes.push(floor);
  sky();
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * 6.283 + rnd() * 0.3, r = 62 + rnd() * 30, h = 7 + rnd() * 12, w = 18 + rnd() * 22;
    place(hillGeo, M.hill, Math.cos(a) * r, h / 2 - 0.5, Math.sin(a) * r, w, h, w * (0.7 + rnd() * 0.6), 0, rnd() * 6.28);
  }
  const h = M.size / 2 + 0.5, L = M.size + 2;
  block(M.wall, 0, 1.25, h, L, 2.5, 1); block(M.wall, 0, 1.25, -h, L, 2.5, 1);
  block(M.wall, h, 1.25, 0, 1, 2.5, L); block(M.wall, -h, 1.25, 0, 1, 2.5, L);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(M.steel, sx * 3.15, 6.75, sz * 3.15, 0.3, 13.5, 0.3);
  for (const top of [4.5, 9, 13.5]) block(M.deck, 0, top - 0.15, 0, 6, 0.3, 6);
  stairs(M.steel, 4, 0, 2.4, 0, -1, 9, 2, 0.6);
  stairs(M.steel, -4, 4.5, -2.4, 0, 1, 9, 2, 0.6);
  stairs(M.steel, -2.4, 9, 4, 1, 0, 9, 2, 0.6);
  braces();
  const C = M.containers;
  container(C[0], -13, -8, 0); container(C[1], -13, -5.6, 0); stairs(M.steel, -18.3, 0, -8, 1, 0, 5, 2.4, 0.5);
  container(C[2], 12, -10, 0); container(C[3], 14.5, -10, 0, 3.75);
  stairs(M.steel, 6.7, 0, -10, 1, 0, 5, 2.4, 0.5); stairs(M.steel, 9.25, 2.5, -10, 1, 0, 5, 2.4, 0.5);
  container(C[4], 2, 15, 0.55);
  container(C[5], -14, 9, 0); stairs(M.steel, -19.3, 0, 9, 1, 0, 5, 2.4, 0.5);
  for (let i = 0; i < 4; i++) block(M.dirt, -6, 0.25 + 0.5 * i, 15, 10, 0.5, 8 - 2 * i);
  block(M.concrete, 13, 0.75, 8, 8, 1.5, 8); stairs(M.steel, 13, 0, 13.25, 0, -1, 3, 2.4, 0.5);
  place(pipeGeo, M.pipe, 2, 1.5, 8, 1, 14, 1, 0, 0, Math.PI / 2); addBox(2, 1.5, 8, 14, 0.6, 0.6);
  for (const x of [-4, 0, 4, 8]) block(M.steel, x, 0.6, 8, 0.3, 1.2, 0.3);
  for (const x of [-3, 2, 7]) place(flangeGeo, M.steel, x, 1.5, 8, 1, 1, 1, 0, 0, Math.PI / 2);
  place(unitBox, M.steel, 0, 1.85, 8, 0.08, 0.3, 0.08); place(wheelGeo, M.valve, 0, 2.05, 8, 1, 1, 1);
  drums(6, -8); drums(-6, -14); drums(17, -2); drums(-19, -1);
  pumpjack(18, 16, -2.3); pumpjack(-19, -15, 0.8);
  boulder(17, -19, 1.6); boulder(-8, 20.5, 1.4); boulder(-21, 14, 1.8); boulder(10, -20.5, 1.3); boulder(-3, -20, 1.5); boulder(23, -12, 1.2);
  tires(15, 15); tires(-16, 3); tires(5, -16);
  crates(-2, -12); crates(20, 6);
  scatter(rockGeo, M.rock, 70, 0.15, 0.55, 0.7, 0.45, true, true);
  scatter(scrubGeo, M.scrub, 45, 0.3, 0.6, 0.8, 0.6, true, true);
  scatter(patchGeo, M.patch, 40, 1.5, 4.5, 1, 0, false, false);
}
