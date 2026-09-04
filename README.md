# Oil Field Arena

A small browser first-person shooter built with plain ES modules and Three.js. No bundler, no npm, no textures, no models, no audio. Everything in the world is flat-colored geometry built in code.

You are dropped into a walled desert oil field. Six blue-haired cat ladies hunt you down, respawn when killed, and climb the central tower if you camp on it. Reach 25 kills as fast as you can.

## Run it

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Three.js is loaded from a CDN through an import map, so you need an internet connection the first time.

## Controls

| Input | Action |
| --- | --- |
| Click | Lock the mouse and start or resume |
| WASD | Move |
| Mouse | Aim |
| Left mouse (hold) | Fire, full auto |
| R | Reload |
| Shift | Sprint |
| Space | Jump |
| Esc | Unlock the mouse and pause |

## Rules

- You have 100 HP. After 5 seconds without taking damage you regenerate 10 HP per second.
- Your rifle holds 30 rounds with 90 in reserve, fires 600 rounds per minute, and does 25 damage to the body or 50 to the head.
- Falls of more than 6 units hurt.
- Bots have 75 HP, so three body shots or two headshots kill one. A dead bot respawns 3 seconds later at whichever of the 8 edge spawn points is farthest from you.
- Bots move at 4 units per second. Within 12 units with line of sight they stop, strafe, and fire a 3-round burst every 1.5 seconds at 30 percent accuracy for 10 damage per hit.
- The game ends at 25 kills and shows your time. Click to play again. Restarting resets everything without reloading the page.

## The map

A 50 by 50 arena with low perimeter walls and an invisible ceiling. The centerpiece is a three-tier steel tower about 14 units tall with open platforms, cross-bracing, and a staircase on a different side of each tier. The top has the best sightlines and no cover.

Around it, all walkable on top: six shipping containers (two stacked with an offset, one set at an angle), a pipe run with flanges and a valve wheel, a raised concrete pad, a stepped dirt berm, and four clusters of oil drums. Scattered around for texture: boulders, rocks, dry scrub, ground patches, tire stacks, crate piles, and two pump jacks. Beyond the walls are foothills and a ring of hazy mountains under a blue sky with a low sun that casts long shadows.

## How the code is organized

Every file is a native ES module. `main.js` owns the scene, camera, renderer, clock, and game state and calls each module's update function once per frame. Nothing is shared through globals.

| File | Responsibility |
| --- | --- |
| `index.html` | The page, the HUD markup and styles, and the import map for Three.js |
| `src/config.js` | Every tunable number and color in one `CONFIG` object |
| `src/main.js` | Renderer setup, game state (start, playing, paused, dead, won), the frame loop, restart |
| `src/map.js` | Builds all geometry, lights, fog, sky, and collision boxes, and defines the tower waypoints for bots |
| `src/collision.js` | Hand-rolled axis-aligned box collision with gravity, landing, step-up onto low ledges, a ceiling clamp, and a ray-versus-box query |
| `src/player.js` | Pointer-lock camera, movement, jumping, health regen, fall damage, camera shake |
| `src/weapon.js` | Full-auto hitscan rifle, reload, recoil that recovers, a pooled set of tracer lines, muzzle flash light |
| `src/bots.js` | Bot bodies, spawning, steering, tower climbing, strafing and burst fire, respawn, and push-apart between bots |
| `src/hud.js` | The DOM overlay: crosshair hit marker, HP bar, ammo, kills, timer, damage vignette, and the start, pause, death, and win screens |

### Collision

There is no physics library. The map registers an axis-aligned box for every solid object, and the player and every bot are treated as vertical boxes standing on their feet position. Each frame the body moves on the Y axis first and resolves landings and head bumps, then moves on X and Z and pushes out of anything it overlaps. If a horizontal collision is with a ledge no more than 0.55 units above the feet and there is room on top, the body steps up instead. That single rule is what makes stairs, drum tops, the berm, and the pipe walkable.

The rotated container is approximated by a row of small axis-aligned boxes along its length. The hills and mountains are decorative and have no collision.

### Shooting

The rifle casts a ray from the center of the camera against every map mesh and every bot hit volume and takes the nearest hit. Each bot's root object is an invisible capsule that acts as its hit volume, and a hit in the top 25 percent of that capsule counts as a headshot. The visible humanoid is built from small child meshes that share a handful of geometries and materials. On a hit, the capsule briefly turns white, a hit marker flashes on the crosshair, and a tracer line is drawn from the muzzle to the impact point using a pool of reusable line objects.

### Bots

Bots steer straight toward you. Every 0.15 seconds each bot casts a short ray ahead using the same box query the collision system uses. If the way is blocked it tests rays to the left and right and veers toward the clearer side for a moment.

Steering alone cannot navigate stairs, so the tower has a fixed list of waypoints that runs up all three staircases. When you are on the tower and more than 2 units above a bot, the bot picks up the waypoint route at its own level and follows it until it is nearly level with you, then hunts you directly. A bot that falls off the route restarts it from the level it landed on.

Within engagement range with a clear line of sight a bot stops and strafes side to side, flipping direction when it is about to walk into something, and fires bursts. Bots push each other apart with a cheap horizontal circle test so they don't stack.

### Performance notes

The whole scene shares one unit box geometry that is scaled per object, plus a few small shared geometries and one material per color. Rocks, scrub, and ground patches are instanced meshes, so all of them together are three draw calls. Tracers come from a fixed pool. The frame loop avoids allocating objects: vectors are reused, loops are indexed, and HUD text is only rewritten when a value changes. Delta time is clamped to 50 milliseconds so a stalled tab cannot launch things through walls.

## Tuning

Open `src/config.js`. Player speeds, jump, gravity, health, and regen are under `player`. Fire rate, damage, and recoil are under `weapon`. Bot count, speed, accuracy, engagement range, and outfit colors are under `bots`. Fog distances, sky and terrain colors, and the sun direction are under `map`. The win condition is under `game`.
