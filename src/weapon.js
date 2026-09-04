// Rifle: full-auto hitscan, reload, recoil, tracer pool and muzzle flash
import * as THREE from 'three';
import { CONFIG } from './config.js';

const W = CONFIG.weapon, F = CONFIG.fx;
const ray = new THREE.Raycaster(), center = new THREE.Vector2(0, 0);
const muzzle = new THREE.Vector3(), end = new THREE.Vector3(), offset = new THREE.Vector3(0.25, -0.2, -0.6);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffe9a0 });
const tracers = [];
let next = 0, camera, flash, flashT = 0;
export const weapon = { mag: W.mag, reserve: W.reserve, reloading: 0, cooldown: 0, trigger: false, recoil: 0, onHit: null };

export function initWeapon(scene, cam) {
  camera = cam;
  flash = new THREE.PointLight(0xffc060, 0, 14, 2);
  flash.position.copy(offset); camera.add(flash);
  for (let i = 0; i < F.tracerPool; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(g, lineMat);
    line.visible = false; line.frustumCulled = false;
    scene.add(line); tracers.push({ line, t: 0 });
  }
  addEventListener('mousedown', e => { if (e.button === 0) weapon.trigger = true; });
  addEventListener('mouseup', e => { if (e.button === 0) weapon.trigger = false; });
  addEventListener('keydown', e => { if (e.code === 'KeyR') reload(); });
}

export function resetWeapon() { weapon.mag = W.mag; weapon.reserve = W.reserve; weapon.reloading = 0; weapon.cooldown = 0; weapon.recoil = 0; }

function reload() { if (weapon.reloading <= 0 && weapon.mag < W.mag && weapon.reserve > 0) weapon.reloading = W.reloadTime; }

export function tracer(a, b) {
  const t = tracers[next];
  next = (next + 1) % tracers.length;
  const arr = t.line.geometry.attributes.position.array;
  arr[0] = a.x; arr[1] = a.y; arr[2] = a.z; arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
  t.line.geometry.attributes.position.needsUpdate = true;
  t.line.visible = true; t.t = F.tracerLife;
}

function fire(targets) {
  weapon.mag--; weapon.cooldown += 60 / W.rpm;
  camera.updateMatrixWorld();
  ray.setFromCamera(center, camera); ray.far = W.range;
  const h = ray.intersectObjects(targets, false)[0];
  if (h) end.copy(h.point); else end.copy(ray.ray.direction).multiplyScalar(W.range).add(ray.ray.origin);
  muzzle.copy(offset).applyQuaternion(camera.quaternion).add(camera.position);
  tracer(muzzle, end);
  flash.intensity = F.flashIntensity; flashT = F.flashLife;
  const k = W.recoil * (0.7 + Math.random() * 0.6);
  camera.rotation.x += k; camera.rotation.y += (Math.random() - 0.5) * k; weapon.recoil += k;
  if (h && h.object.userData.bot !== undefined) weapon.onHit(h.object.userData.bot, h.point.y > h.object.position.y + 0.45 ? W.head : W.body);
}

export function updateWeapon(dt, targets, active) {
  weapon.cooldown -= dt;
  if (weapon.cooldown < 0 && !weapon.trigger) weapon.cooldown = 0;
  if (weapon.reloading > 0) {
    weapon.reloading -= dt;
    if (weapon.reloading <= 0) { const n = Math.min(W.mag - weapon.mag, weapon.reserve); weapon.mag += n; weapon.reserve -= n; }
  } else if (active && weapon.trigger && weapon.cooldown <= 0) {
    if (weapon.mag > 0) fire(targets); else reload();
  }
  const rec = weapon.recoil * Math.min(1, dt * 8);
  camera.rotation.x = Math.max(-1.55, Math.min(1.55, camera.rotation.x - rec)); weapon.recoil -= rec;
  if ((flashT -= dt) <= 0) flash.intensity = 0;
  for (let i = 0; i < tracers.length; i++) { const t = tracers[i]; if (t.t > 0 && (t.t -= dt) <= 0) t.line.visible = false; }
}
