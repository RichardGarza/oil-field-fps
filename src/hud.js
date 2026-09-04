// DOM overlay: hit marker, HP bar, ammo, kills, timer, damage vignette and screens
import { CONFIG } from './config.js';

const el = {};
const last = { hp: -1, mag: -1, reserve: -1, kills: -1, sec: -1, vig: -1 };
let hitT = 0;

export function initHud() {
  for (const id of ['hp', 'hptext', 'ammo', 'kills', 'timer', 'hit', 'vignette', 'screen', 'title', 'sub']) el[id] = document.getElementById(id);
}

export function hudHit() { hitT = CONFIG.fx.hitMarker; el.hit.style.opacity = 1; }

export function showScreen(title, sub) { el.title.textContent = title; el.sub.textContent = sub; el.screen.hidden = false; }

export function hideScreen() { el.screen.hidden = true; }

export function formatTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function updateHud(dt, hp, sinceHit, mag, reserve, kills, time) {
  if (hitT > 0 && (hitT -= dt) <= 0) el.hit.style.opacity = 0;
  const vig = Math.min(1, Math.max(0, 1 - sinceHit * 2.5) + Math.max(0, 1 - hp / 40) * 0.7);
  if (Math.abs(vig - last.vig) > 0.01) { last.vig = vig; el.vignette.style.opacity = vig; }
  const hpi = Math.ceil(hp);
  if (hpi !== last.hp) { last.hp = hpi; el.hp.style.width = hpi + '%'; el.hptext.textContent = hpi; }
  if (mag !== last.mag || reserve !== last.reserve) { last.mag = mag; last.reserve = reserve; el.ammo.textContent = `${mag} / ${reserve}`; }
  if (kills !== last.kills) { last.kills = kills; el.kills.textContent = kills; }
  const sec = Math.floor(time);
  if (sec !== last.sec) { last.sec = sec; el.timer.textContent = formatTime(time); }
}
