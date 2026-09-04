// Player: movement, jumping, health regen, fall damage and camera shake
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { CONFIG } from './config.js';
import { moveBody } from './collision.js';

const P = CONFIG.player, W = CONFIG.world, M = CONFIG.map;
const keys = new Set();
const key = c => (keys.has(c) ? 1 : 0);
const fwd = new THREE.Vector3(), right = new THREE.Vector3();
export const player = {
  pos: new THREE.Vector3(), vel: new THREE.Vector3(), r: P.radius, h: P.height, grounded: false,
  hp: P.hp, lastHit: -99, time: 0, dead: false, fallFrom: 0, shake: 0, camera: null, controls: null,
};

export function initPlayer(camera, dom) {
  player.camera = camera;
  camera.rotation.order = 'YXZ';
  player.controls = new PointerLockControls(camera, dom);
  addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Space') e.preventDefault(); });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  resetPlayer();
  return player.controls;
}

export function resetPlayer() {
  player.pos.fromArray(P.spawn); player.vel.set(0, 0, 0);
  player.hp = P.hp; player.lastHit = -99; player.time = 0; player.dead = false;
  player.fallFrom = 0; player.shake = 0; player.grounded = false;
  player.camera.rotation.set(0, P.spawnYaw, 0);
  player.camera.position.set(player.pos.x, player.pos.y + P.eye, player.pos.z);
}

export function damagePlayer(amount) {
  if (player.dead) return;
  player.hp -= amount; player.lastHit = player.time;
  player.shake = Math.min(1, player.shake + 0.5);
  if (player.hp <= 0) { player.hp = 0; player.dead = true; }
}

export function updatePlayer(dt, time) {
  const cam = player.camera;
  player.time = time;
  cam.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  right.set(-fwd.z, 0, fwd.x);
  const f = key('KeyW') - key('KeyS'), s = key('KeyD') - key('KeyA');
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? P.sprint : P.walk) / (Math.hypot(f, s) || 1);
  player.vel.x = (fwd.x * f + right.x * s) * speed;
  player.vel.z = (fwd.z * f + right.z * s) * speed;
  if (keys.has('Space') && player.grounded) player.vel.y = P.jump;
  player.vel.y -= P.gravity * dt;
  const wasAir = !player.grounded;
  moveBody(player, dt, W.stepHeight, M.ceiling);
  if (player.grounded) {
    const drop = player.fallFrom - player.pos.y - P.fallDmgHeight;
    if (wasAir && drop > 0) damagePlayer(drop * P.fallDmgPerUnit);
    player.fallFrom = player.pos.y;
  } else if (player.pos.y > player.fallFrom) player.fallFrom = player.pos.y;
  if (time - player.lastHit > P.regenDelay && player.hp < P.hp) player.hp = Math.min(P.hp, player.hp + P.regenRate * dt);
  player.shake -= player.shake * Math.min(1, dt * 6);
  const sh = player.shake * 0.06;
  cam.position.set(player.pos.x + (Math.random() - 0.5) * sh, player.pos.y + P.eye + (Math.random() - 0.5) * sh, player.pos.z);
}
