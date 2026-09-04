// All tunables for the game
export const CONFIG = {
  player: { hp: 100, regenDelay: 5, regenRate: 10, eye: 1.7, height: 1.8, radius: 0.4, walk: 6, sprint: 9, jump: 5, gravity: 15, fallDmgHeight: 6, fallDmgPerUnit: 10, spawn: [8, 0, 21], spawnYaw: 0.36 },
  weapon: { mag: 30, reserve: 90, rpm: 600, body: 25, head: 50, reloadTime: 1.5, recoil: 0.014, range: 200 },
  bots: {
    count: 6, hp: 75, speed: 4, engageRange: 12, burstEvery: 1.5, burstRounds: 3, burstGap: 0.09, accuracy: 0.3, dmg: 10,
    respawn: 3, radius: 0.4, height: 1.8, hair: 0x1aa7ff, skin: 0xf1c9a5, cardigans: [0xe27fa6, 0x8fb98a, 0xd9b45a], skirts: [0x6b5b95, 0x3f4f6f, 0x8a3b4a], flash: 0.08, towerRadius: 6,
    spawns: [[-22, 0, -22], [0, 0, -22], [22, 0, -22], [22, 0, 0], [22, 0, 22], [0, 0, 22], [-22, 0, 22], [-22, 0, 0]],
  },
  map: {
    size: 50, ceiling: 20, fog: 0xdac0a0, fogNear: 30, fogFar: 300, skyTop: 0x3f8fe0, sunDir: [-40, 14, 25], sand: 0xc8a468, wall: 0xa88b5c, steel: 0x4a4f55, deck: 0x5f666d,
    concrete: 0x8f8a80, dirt: 0x8a6a3c, pipe: 0x6d6f73, drum: 0x2c3e50, drumAlt: 0x8a2b1f,
    containers: [0x9a4a2e, 0x35608f, 0x5c6b3a, 0x7a5f8a, 0xc27a2c, 0x4f7f8a],
    rust: 0x7a3f28, valve: 0x9a2020, tire: 0x1f1f1f, crate: 0x8b6b3e, hill: 0xb28c60, mountain: 0x6e6a80,
    rock: [0x8c7a66, 0x6f6257, 0x9a8570], scrub: [0x5e5b39, 0x746d44], patch: [0xb8925a, 0xd3b47a, 0xa8834f],
  },
  world: { stepHeight: 0.55, maxDt: 0.05 },
  fx: { tracerLife: 0.06, tracerPool: 32, flashLife: 0.05, flashIntensity: 40, hitMarker: 0.08 },
  game: { winKills: 25 },
};
