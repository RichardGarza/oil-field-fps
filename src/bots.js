// Bots: spawn, raycast steering, tower waypoints, strafing bursts, respawn and push-apart
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { moveBody, rayHit } from './collision.js';

const B = CONFIG.bots, WD = CONFIG.world, MP = CONFIG.map, G = CONFIG.player.gravity;
const geo = new THREE.CapsuleGeometry(B.radius, B.height - 2 * B.radius, 4, 12);
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lam = c => new THREE.MeshLambertMaterial({ color: c });
const hairMat = lam(B.hair), darkMat = lam(0x222222), skinMat = lam(B.skin);
hairMat.side = THREE.DoubleSide;
const cardMats = B.cardigans.map(lam), skirtMats = B.skirts.map(lam);
const sphere = new THREE.SphereGeometry(1, 12, 8), box = new THREE.BoxGeometry(1, 1, 1);
const hairCap = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.62);
const skirtGeo = new THREE.CylinderGeometry(0.22, 0.36, 1, 10);
const dir = new THREE.Vector3(), probe = new THREE.Vector3(), origin = new THREE.Vector3(), eye = new THREE.Vector3(), aim = new THREE.Vector3();
export const botMeshes = [];
const bots = [];
let ctx;

export function initBots(scene, c) {
  ctx = c;
  for (let i = 0; i < B.count; i++) {
    const mesh = new THREE.Mesh(geo, hitMat);
    mesh.userData.bot = i;
    dress(mesh, i);
    scene.add(mesh); botMeshes.push(mesh);
    bots.push({ mesh, pos: new THREE.Vector3(), vel: new THREE.Vector3(), r: B.radius, h: B.height, grounded: false, hp: B.hp, dead: false, respawnT: 0, flashT: 0, burstT: 0, rounds: 0, roundT: 0, strafe: 1, strafeT: 0, steerT: 0, avoid: 0, wpi: -1 });
  }
}

function part(parent, geo, mat, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true;
  parent.add(m);
  return m;
}

function dress(mesh, i) {
  const card = cardMats[i % cardMats.length], skirt = skirtMats[i % skirtMats.length];
  part(mesh, skirtGeo, skirt, 0, -0.5, 0, 1, 0.75, 1);
  part(mesh, box, darkMat, -0.1, -0.85, 0.05, 0.12, 0.1, 0.24); part(mesh, box, darkMat, 0.1, -0.85, 0.05, 0.12, 0.1, 0.24);
  part(mesh, box, card, 0, 0.12, 0, 0.44, 0.52, 0.26);
  part(mesh, box, card, -0.29, 0.06, 0, 0.13, 0.56, 0.13); part(mesh, box, card, 0.29, 0.06, 0, 0.13, 0.56, 0.13);
  part(mesh, sphere, skinMat, -0.29, -0.26, 0, 0.07, 0.07, 0.07); part(mesh, sphere, skinMat, 0.29, -0.26, 0, 0.07, 0.07, 0.07);
  part(mesh, box, skinMat, 0, 0.42, 0, 0.1, 0.12, 0.1);
  part(mesh, sphere, skinMat, 0, 0.65, 0, 0.2, 0.22, 0.2);
  part(mesh, hairCap, hairMat, 0, 0.68, -0.02, 0.24, 0.24, 0.24).rotation.x = -0.5;
  part(mesh, sphere, hairMat, 0, 0.93, -0.1, 0.1, 0.1, 0.1);
  part(mesh, box, darkMat, -0.075, 0.67, 0.19, 0.11, 0.08, 0.02); part(mesh, box, darkMat, 0.075, 0.67, 0.19, 0.11, 0.08, 0.02);
  part(mesh, box, darkMat, 0, 0.67, 0.19, 0.05, 0.02, 0.02);
}

export function resetBots() { for (let i = 0; i < bots.length; i++) spawn(bots[i]); }

function spawn(b) {
  const p = ctx.player.pos;
  let best = 0, bd = -1;
  for (let i = 0; i < B.spawns.length; i++) {
    const s = B.spawns[i], d = (s[0] - p.x) ** 2 + (s[2] - p.z) ** 2;
    if (d > bd) { bd = d; best = i; }
  }
  const s = B.spawns[best];
  b.pos.set(s[0] + (Math.random() - 0.5) * 2, s[1], s[2] + (Math.random() - 0.5) * 2); b.vel.set(0, 0, 0);
  b.hp = B.hp; b.dead = false; b.flashT = 0; b.rounds = 0; b.burstT = 0.5 + Math.random(); b.wpi = -1; b.avoid = 0;
  b.mesh.visible = true; b.mesh.material = hitMat;
}

export function damageBot(i, dmg) {
  const b = bots[i];
  if (b.dead) return false;
  b.hp -= dmg; b.flashT = B.flash; b.mesh.material = flashMat;
  if (b.hp > 0) return false;
  b.dead = true; b.respawnT = B.respawn; b.mesh.visible = false; b.mesh.position.y = -50;
  return true;
}

export function updateBots(dt) {
  const P = ctx.player.pos, wp = ctx.waypoints;
  const onTower = Math.abs(P.x) < B.towerRadius && Math.abs(P.z) < B.towerRadius && P.y > 3;
  for (let i = 0; i < bots.length; i++) {
    const b = bots[i];
    if (b.dead) { if ((b.respawnT -= dt) <= 0) spawn(b); continue; }
    if (b.flashT > 0 && (b.flashT -= dt) <= 0) b.mesh.material = hitMat;
    eye.set(b.pos.x, b.pos.y + 1.5, b.pos.z);
    aim.set(P.x, P.y + 1.5, P.z).sub(eye);
    const dist = aim.length();
    aim.divideScalar(dist);
    const engaged = dist <= B.engageRange && rayHit(eye, aim, dist) >= dist;
    if (onTower && P.y > b.pos.y + (b.wpi < 0 ? 2 : 0.6)) climb(b, wp, dt);
    else { b.wpi = -1; if (engaged) strafe(b, P, dt); else steer(b, P.x, P.z, dt, true); }
    shoot(b, dt, engaged, dist);
    b.vel.y -= G * dt;
    moveBody(b, dt, WD.stepHeight, MP.ceiling);
    b.mesh.position.set(b.pos.x, b.pos.y + B.height / 2, b.pos.z);
    b.mesh.rotation.y = Math.atan2(P.x - b.pos.x, P.z - b.pos.z);
  }
  separate();
}

function climb(b, wp, dt) {
  if (b.wpi < 0) { b.wpi = 0; while (b.wpi < wp.length - 1 && wp[b.wpi].y < b.pos.y - 0.6) b.wpi++; }
  const prevY = b.wpi > 0 ? wp[b.wpi - 1].y : 0;
  if (b.grounded && b.pos.y < prevY - 1) { b.wpi = -1; return; }
  const t = wp[b.wpi];
  if (Math.hypot(t.x - b.pos.x, t.z - b.pos.z) < 0.6 && Math.abs(t.y - b.pos.y) < 0.8) b.wpi = Math.min(b.wpi + 1, wp.length - 1);
  steer(b, t.x, t.z, dt, false);
}

function rotY(v, a, out) {
  const c = Math.cos(a), s = Math.sin(a);
  return out.set(v.x * c + v.z * s, 0, -v.x * s + v.z * c);
}

function steer(b, tx, tz, dt, avoid) {
  dir.set(tx - b.pos.x, 0, tz - b.pos.z);
  const d = dir.length();
  if (d < 0.1) { b.vel.x = b.vel.z = 0; return; }
  dir.divideScalar(d);
  if (avoid && (b.steerT -= dt) <= 0) {
    b.steerT = 0.15; b.avoid = 0;
    origin.set(b.pos.x, b.pos.y + 0.6, b.pos.z);
    const look = Math.min(d, 2.5);
    if (rayHit(origin, dir, look) < look) {
      const l = rayHit(origin, rotY(dir, 1.1, probe), 2.5), r = rayHit(origin, rotY(dir, -1.1, probe), 2.5);
      b.avoid = l >= r ? 1 : -1;
    }
  }
  if (avoid && b.avoid) rotY(dir, b.avoid * 1.1, dir);
  b.vel.x = dir.x * B.speed; b.vel.z = dir.z * B.speed;
}

function strafe(b, P, dt) {
  if ((b.strafeT -= dt) <= 0) { b.strafeT = 0.5 + Math.random(); b.strafe = Math.random() < 0.5 ? -1 : 1; }
  dir.set(P.x - b.pos.x, 0, P.z - b.pos.z).normalize();
  probe.set(-dir.z * b.strafe, 0, dir.x * b.strafe);
  origin.set(b.pos.x, b.pos.y + 0.6, b.pos.z);
  if (rayHit(origin, probe, 1.2) < 1.2) { b.strafe = -b.strafe; probe.negate(); }
  b.vel.x = probe.x * B.speed * 0.6; b.vel.z = probe.z * B.speed * 0.6;
}

function shoot(b, dt, canFire, dist) {
  b.burstT -= dt;
  if (b.rounds > 0) {
    if ((b.roundT -= dt) <= 0) { b.rounds--; b.roundT = B.burstGap; fireRound(b, dist); }
  } else if (canFire && b.burstT <= 0) { b.burstT = B.burstEvery; b.rounds = B.burstRounds; b.roundT = 0; }
}

function fireRound(b, dist) {
  if (Math.random() < B.accuracy) { ctx.damagePlayer(B.dmg); aim.multiplyScalar(dist - 0.3).add(eye); }
  else { aim.x += (Math.random() - 0.5) * 0.4; aim.y += (Math.random() - 0.5) * 0.3; aim.z += (Math.random() - 0.5) * 0.4; aim.normalize().multiplyScalar(dist + 3).add(eye); }
  ctx.tracer(eye, aim);
}

function separate() {
  for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) {
    const a = bots[i], c = bots[j];
    if (a.dead || c.dead || Math.abs(a.pos.y - c.pos.y) > B.height) continue;
    const dx = c.pos.x - a.pos.x, dz = c.pos.z - a.pos.z, d = Math.hypot(dx, dz), min = B.radius * 2;
    if (d >= min) continue;
    if (d < 1e-4) { c.pos.x += 0.05; continue; }
    const p = (min - d) / d * 0.5;
    a.pos.x -= dx * p; a.pos.z -= dz * p; c.pos.x += dx * p; c.pos.z += dz * p;
  }
}
