// Axis-aligned box collision with step-up, landing, ceiling clamp and ray queries
import { Vector3 } from 'three';

const boxes = [];
const AX = ['x', 'y', 'z'];

export function addBox(cx, cy, cz, sx, sy, sz) {
  boxes.push({ min: new Vector3(cx - sx / 2, cy - sy / 2, cz - sz / 2), max: new Vector3(cx + sx / 2, cy + sy / 2, cz + sz / 2) });
}

function overlaps(p, r, h, b, y) {
  return p.x - r < b.max.x && p.x + r > b.min.x && y < b.max.y && y + h > b.min.y && p.z - r < b.max.z && p.z + r > b.min.z;
}

function fits(p, r, h, y) {
  for (let i = 0; i < boxes.length; i++) if (overlaps(p, r, h, boxes[i], y)) return false;
  return true;
}

export function moveBody(body, dt, stepH, ceiling) {
  const { pos, vel, r, h } = body;
  const wasGrounded = body.grounded, prevY = pos.y;
  body.grounded = false;
  pos.y += vel.y * dt;
  if (pos.y <= 0) { pos.y = 0; vel.y = 0; body.grounded = true; }
  if (pos.y + h > ceiling) { pos.y = ceiling - h; if (vel.y > 0) vel.y = 0; }
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (!overlaps(pos, r, h, b, pos.y)) continue;
    if (vel.y <= 0 && prevY >= b.max.y - 1e-3) { pos.y = b.max.y; vel.y = 0; body.grounded = true; }
    else if (vel.y > 0 && prevY + h <= b.min.y + 1e-3) { pos.y = b.min.y - h; vel.y = 0; }
  }
  for (let k = 0; k < 2; k++) {
    const axis = k ? 'z' : 'x', v = vel[axis];
    if (v === 0) continue;
    pos[axis] += v * dt;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (!overlaps(pos, r, h, b, pos.y)) continue;
      const rise = b.max.y - pos.y;
      if (wasGrounded && rise > 0 && rise <= stepH && fits(pos, r, h, b.max.y)) { pos.y = b.max.y; vel.y = 0; body.grounded = true; continue; }
      pos[axis] = v > 0 ? b.min[axis] - r : b.max[axis] + r;
    }
  }
}

export function rayHit(o, d, maxDist) {
  let best = maxDist;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    let t0 = 0, t1 = best;
    for (let k = 0; k < 3 && t0 <= t1; k++) {
      const a = AX[k], inv = 1 / d[a];
      let ta = (b.min[a] - o[a]) * inv, tb = (b.max[a] - o[a]) * inv;
      if (ta > tb) { const t = ta; ta = tb; tb = t; }
      if (ta > t0) t0 = ta;
      if (tb < t1) t1 = tb;
    }
    if (t0 <= t1) best = t0;
  }
  return best;
}
