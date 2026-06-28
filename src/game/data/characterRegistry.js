/**
 * CHARACTER REGISTRY
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all characters in the game.
 *
 * Sprite folder standard:
 *   /assets/character/<hero|monster>/<id>/Sprites/
 *
 * Sprite file naming standard (UPPERCASE):
 *   IDLE.png, RUN.png, ATTACK_1.png, [ATTACK_2.png, ATTACK_3.png, ...], HURT.png, DEATH.png
 *
 * Adding a new character:
 *   1. Rename/prepare the sprite folder following the standard above
 *   2. Add one entry to HERO_REGISTRY or MONSTER_REGISTRY
 *   3. Done — no need to touch BattleScene.js
 * ─────────────────────────────────────────────────────────────────
 */

const BASE = {
  hero:    '/assets/character/hero',
  monster: '/assets/character/monster',
};

/**
 * Build a character config object.
 * @param {'hero'|'monster'} type
 * @param {string}  id           - snake_case, must match the folder name
 * @param {number}  frameWidth   - width of a single frame in px
 * @param {number}  frameHeight  - height of a single frame in px
 * @param {number}  scale        - render scale (for monsters: multiplied by bgScale)
 * @param {object}  [options]
 * @param {number}  [options.attackCount=1]  - number of attack animations (1, 2, 3, ...)
 * @param {boolean} [options.hasShout=false]  - true if character has a SHOUT.png victory animation
 * @param {number}  [options.idleFps=8]
 * @param {number}  [options.runFps=12]
 * @param {number}  [options.attackFps=12]   - used for ALL ATTACK_1..N animations
 * @param {number}  [options.hurtFps=12]
 * @param {number}  [options.deathFps=8]
 * @param {number}  [options.shoutFps=8]
 * @param {boolean} [options.facesLeft=false] - true if the raw sprite naturally faces left
 */
function makeConfig(type, id, frameWidth, frameHeight, scale, options = {}) {
  return {
    id,
    type,
    basePath: `${BASE[type]}/${id}/Sprites`,
    frameWidth,
    frameHeight,
    scale,
    attackCount: options.attackCount ?? 1,
    hasShout:    options.hasShout    ?? false,
    facesLeft:   options.facesLeft   ?? false,
    isRanged:    options.isRanged    ?? false,
    hasArrow:    options.hasArrow    ?? false,
    animFps: {
      idle:   options.idleFps   ?? 8,
      run:    options.runFps    ?? 12,
      attack: options.attackFps ?? 12,
      hurt:   options.hurtFps   ?? 12,
      death:  options.deathFps  ?? 8,
      shout:  options.shoutFps  ?? 8,
    },
    yOffset: options.yOffset ?? 0,
  };
}

// ─── HERO REGISTRY ────────────────────────────────────────────────
export const HERO_REGISTRY = {
  demon_samurai: makeConfig('hero', 'demon_samurai', 128, 108, 2.0, { attackCount: 4, idleFps: 6, hasShout: true, yOffset: 30 }),
  executioner: makeConfig('hero', 'executioner', 130, 92, 2.0, { attackCount: 2, facesLeft: true, yOffset: 30 }),
  samurai_1: makeConfig('hero', 'samurai_1', 96, 96, 2.0, { attackCount: 5, hasShout: true, yOffset: 30 }),
  samurai_2: makeConfig('hero', 'samurai_2', 96, 64, 2.0, { attackCount: 4, hasShout: true, yOffset: 30 }),
  samurai_3: makeConfig('hero', 'samurai_3', 106, 84, 2.0, { attackCount: 4, hasShout: true, yOffset: 45 }),
  samurai_4: makeConfig('hero', 'samurai_4', 96, 96, 2.0, { attackCount: 3, hasShout: true, yOffset: 0 }),
  samurai_5: makeConfig('hero', 'samurai_5', 96, 64, 2.0, { attackCount: 3, hasShout: true, yOffset: 30 }),
  samurai_6: makeConfig('hero', 'samurai_6', 98, 64, 2.0, { attackCount: 3, hasShout: true, yOffset: 45 }),
  samurai_archer: makeConfig('hero', 'samurai_archer', 96, 80, 2.0, { attackCount: 1, hasShout: false, isRanged: true, hasArrow: true, yOffset: 30 }),
  samurai_panda: makeConfig('hero', 'samurai_panda', 128, 64, 2.0, { attackCount: 3, hasShout: true, facesLeft: true, yOffset: 45 }),
  wolf_samurai: makeConfig('hero', 'wolf_samurai', 192, 58, 2.0, { attackCount: 3, hasShout: true, facesLeft: true, yOffset: 45 }),
};

// Data array for Hero Selection UI
export const AVAILABLE_HEROES = [
  { id: 'demon_samurai', name: 'Demon Samurai', preview: 'preview.gif' },
  { id: 'executioner', name: 'Executioner', preview: 'Preview.gif' },
  { id: 'samurai_1', name: 'Samurai 1', preview: 'Preview.png' },
  { id: 'samurai_2', name: 'Samurai 2', preview: 'Preview.png' },
  { id: 'samurai_3', name: 'Samurai 3', preview: 'preview.gif' },
  { id: 'samurai_4', name: 'Samurai 4', preview: 'Preview.gif' },
  { id: 'samurai_5', name: 'Samurai 5', preview: 'preview.gif' },
  { id: 'samurai_6', name: 'Samurai 6', preview: 'preview.gif' },
  { id: 'samurai_archer', name: 'Samurai Archer', preview: 'Preview.gif' },
  { id: 'samurai_panda', name: 'Samurai Panda', preview: 'preview.gif' },
  { id: 'wolf_samurai', name: 'Wolf Samurai', preview: 'Preview.png' },
];

// ─── MONSTER REGISTRY ─────────────────────────────────────────────
export const MONSTER_REGISTRY = {

  dragon: makeConfig('monster', 'dragon', 144, 96, 1.8, {
    attackCount: 2,
    idleFps: 8,
    deathFps: 8,
  }),

  goblin: makeConfig('monster', 'goblin', 96, 96, 1.5, {
    attackCount: 2,
  }),

  skeleton_warrior: makeConfig('monster', 'skeleton_warrior', 89, 78, 1.8, {
    attackCount: 2,
  }),

  cerberus: makeConfig('monster', 'cerberus', 128, 128, 1.8, {
    attackCount: 1,
  }),

  cyclops: makeConfig('monster', 'cyclops', 145, 128, 1.8, {
    attackCount: 2,
  }),

  imp: makeConfig('monster', 'imp', 192, 48, 2.5, {
    attackCount: 1,
  }),

  // Add new monsters below:
  // stone_golem:    makeConfig('monster', 'stone_golem', 96, 96, 1.8,   { attackCount: 3 }),
  // gryphon:        makeConfig('monster', 'gryphon', 128, 128, 1.8,     { attackCount: 2 }),
  // harpy:          makeConfig('monster', 'harpy', 128, 128, 1.8,       { attackCount: 1 }),
  // lizardman:      makeConfig('monster', 'lizardman', 96, 96, 1.8,     { attackCount: 2 }),
  // minotaur:       makeConfig('monster', 'minotaur', 128, 128, 1.8,    { attackCount: 2 }),
  // werewolf:       makeConfig('monster', 'werewolf', 125, 125, 1.8,    { attackCount: 2 }),
  // wizard:         makeConfig('monster', 'wizard', 78, 78, 2.0,        { attackCount: 1 }),
  // witch:          makeConfig('monster', 'witch', 100, 100, 2.0,       { attackCount: 1 }),
  // masked_orc:     makeConfig('monster', 'masked_orc', 80, 80, 2.0,    { attackCount: 1 }),
  // flying_eye:     makeConfig('monster', 'flying_eye', 96, 96, 2.0,    { attackCount: 1 }),
  // poison_skull:   makeConfig('monster', 'poison_skull', 96, 96, 2.0,  { attackCount: 1 }),
  // pyromancer:     makeConfig('monster', 'pyromancer', 100, 100, 2.0,  { attackCount: 1 }),
  // baby_dragon:    makeConfig('monster', 'baby_dragon', 96, 96, 2.0,   { attackCount: 1 }),
  // gargoyle:       makeConfig('monster', 'gargoyle', 128, 128, 1.8,    { attackCount: 2 }),

};
