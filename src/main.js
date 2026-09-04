// Owns renderer, scene, clock, game state and the frame loop
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildMap, mapMeshes, waypoints } from './map.js';
import { player, initPlayer, resetPlayer, updatePlayer, damagePlayer } from './player.js';
import { weapon, initWeapon, resetWeapon, updateWeapon, tracer } from './weapon.js';
import { botMeshes, initBots, resetBots, updateBots, damageBot } from './bots.js';
import { initHud, updateHud, hudHit, showScreen, hideScreen, formatTime } from './hud.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
scene.add(camera);
buildMap(scene);
const controls = initPlayer(camera, renderer.domElement);
initWeapon(scene, camera);
initBots(scene, { player, damagePlayer, tracer, waypoints });
initHud();
const targets = mapMeshes.concat(botMeshes);
const game = { state: 'start', kills: 0, time: 0 };

weapon.onHit = (i, dmg) => {
  hudHit();
  if (!damageBot(i, dmg)) return;
  game.kills++;
  if (game.kills >= CONFIG.game.winKills) finish('won', 'You win', `${game.kills} kills in ${formatTime(game.time)} - click to play again`);
};

function reset() { resetPlayer(); resetWeapon(); resetBots(); game.kills = 0; game.time = 0; }

function finish(state, title, sub) { game.state = state; controls.unlock(); showScreen(title, sub); }

controls.addEventListener('lock', () => {
  if (game.state !== 'paused') reset();
  game.state = 'playing'; weapon.trigger = false; hideScreen();
});
controls.addEventListener('unlock', () => { if (game.state === 'playing') finish('paused', 'Paused', 'Click to resume'); });
document.body.addEventListener('click', () => { if (!controls.isLocked) controls.lock(); });
addEventListener('resize', () => { if (!innerHeight) return; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), CONFIG.world.maxDt);
  const active = game.state === 'playing';
  if (active) {
    game.time += dt;
    updatePlayer(dt, game.time);
    updateWeapon(dt, targets, true);
    updateBots(dt);
    if (player.dead) finish('dead', 'You died', 'Click to restart');
  } else updateWeapon(dt, targets, false);
  updateHud(dt, player.hp, game.time - player.lastHit, weapon.mag, weapon.reserve, game.kills, game.time);
  renderer.render(scene, camera);
});
