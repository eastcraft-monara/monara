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
    hp:      options.hp      ?? (type === 'hero' ? 100 : 0),
    damage:  options.damage  ?? (type === 'hero' ? 28 : 0),
  };
}

// ─── HERO REGISTRY ────────────────────────────────────────────────
export const HERO_REGISTRY = {
  demon_samurai: makeConfig('hero', 'demon_samurai', 128, 108, 2.0, { attackCount: 4, idleFps: 6, hasShout: true, yOffset: 30, hp: 120, damage: 35 }),
  executioner: makeConfig('hero', 'executioner', 130, 92, 2.0, { attackCount: 2, facesLeft: true, yOffset: 30, hp: 150, damage: 45 }),
  samurai_1: makeConfig('hero', 'samurai_1', 96, 96, 2.0, { attackCount: 5, hasShout: true, yOffset: 30, hp: 110, damage: 28 }),
  samurai_2: makeConfig('hero', 'samurai_2', 96, 64, 2.0, { attackCount: 4, hasShout: true, yOffset: 30, hp: 95, damage: 32 }),
  samurai_3: makeConfig('hero', 'samurai_3', 106, 84, 2.0, { attackCount: 4, hasShout: true, yOffset: 45, hp: 105, damage: 30 }),
  samurai_4: makeConfig('hero', 'samurai_4', 96, 96, 2.0, { attackCount: 3, hasShout: true, yOffset: 0, hp: 100, damage: 28 }),
  samurai_5: makeConfig('hero', 'samurai_5', 96, 64, 2.0, { attackCount: 3, hasShout: true, yOffset: 30, hp: 90, damage: 38 }),
  samurai_6: makeConfig('hero', 'samurai_6', 98, 64, 2.0, { attackCount: 3, hasShout: true, yOffset: 45, hp: 115, damage: 25 }),
  samurai_archer: makeConfig('hero', 'samurai_archer', 96, 80, 2.0, { attackCount: 1, hasShout: false, isRanged: true, hasArrow: true, yOffset: 30, hp: 80, damage: 42 }),
  samurai_panda: makeConfig('hero', 'samurai_panda', 128, 64, 2.0, { attackCount: 3, hasShout: true, facesLeft: true, yOffset: 45, hp: 140, damage: 22 }),
  wolf_samurai: makeConfig('hero', 'wolf_samurai', 192, 58, 2.0, { attackCount: 3, hasShout: true, facesLeft: true, yOffset: 45, hp: 110, damage: 36 }),
  wizard: makeConfig('hero', 'wizard', 128, 78, 2.0, { attackCount: 2, hasShout: false, isRanged: true, hasArrow: false, yOffset: 30, hp: 90, damage: 45 }),
};

// Data array for Hero Selection UI
export const AVAILABLE_HEROES = [
  { id: 'demon_samurai', name: 'Demon Samurai', preview: 'preview.gif' },
  { id: 'executioner', name: 'Executioner', preview: 'Preview.gif' },
  { id: 'samurai_1', name: 'Samurai 1', preview: 'Preview.gif' },
  { id: 'samurai_2', name: 'Samurai 2', preview: 'Preview.gif' },
  { id: 'samurai_3', name: 'Samurai 3', preview: 'preview.gif' },
  { id: 'samurai_4', name: 'Samurai 4', preview: 'Preview.gif' },
  { id: 'samurai_5', name: 'Samurai 5', preview: 'preview.gif' },
  { id: 'samurai_6', name: 'Samurai 6', preview: 'preview.gif' },
  { id: 'samurai_archer', name: 'Samurai Archer', preview: 'Preview.gif' },
  { id: 'samurai_panda', name: 'Samurai Panda', preview: 'preview.gif' },
  { id: 'wolf_samurai', name: 'Wolf Samurai', preview: 'Preview.gif' },
  { id: 'wizard', name: 'Wizard', preview: 'Preview.gif' },
];

AVAILABLE_HEROES.forEach(h => {
  if (HERO_REGISTRY[h.id]) HERO_REGISTRY[h.id].name = h.name;
});

// ─── MONSTER REGISTRY ─────────────────────────────────────────────
export const MONSTER_REGISTRY = {
  // ZONA 1 (Floor 1-5)
  Imp: makeConfig('monster', 'Imp', 128, 48, 1.8, { attackCount: 1, facesLeft: true, yOffset: 28 }),
  goblin: makeConfig('monster', 'goblin', 115, 78, 1.3, { attackCount: 2, yOffset: 18 }),
  kobold: makeConfig('monster', 'kobold', 148, 96, 1, { attackCount: 4, facesLeft: true, hasShout: true, yOffset: 20 }),
  skeleton_warrior: makeConfig('monster', 'skeleton_warrior', 89, 78, 1, { attackCount: 2, yOffset: 28 }),
  masked_orc: makeConfig('monster', 'masked_orc', 150, 80, 1.3, { attackCount: 1, yOffset: 13}),

  // ZONA 2 (Floor 6-10)
  dwarf: makeConfig('monster', 'dwarf', 128, 96, 1.3, { attackCount: 1, yOffset: 1}),
  baby_dragon: makeConfig('monster', 'baby_dragon', 158, 125, 1.4, { attackCount: 1, yOffset: 22 }),
  harpy: makeConfig('monster', 'harpy', 96, 96, 1.6, { attackCount: 1, yOffset: 14 }),
  lizardman: makeConfig('monster', 'lizardman', 144, 96, 1.5, { attackCount: 2, facesLeft: true, yOffset: 12 }),
  gargoyle: makeConfig('monster', 'gargoyle', 144, 96, 1.5, { attackCount: 2, yOffset: 28 }),

  // ZONA 3 (Floor 11-15)
  centaur: makeConfig('monster', 'centaur', 148, 96, 1.6, { attackCount: 1, facesLeft: true, yOffset: 9 }),
  mimic: makeConfig('monster', 'mimic', 96, 96, 1.4, { attackCount: 1, facesLeft: true, hasShout: true, yOffset: 10 }),
  poison_skull: makeConfig('monster', 'poison_skull', 160, 96, 1.5, { attackCount: 1, yOffset: -10 }),
  flying_eye: makeConfig('monster', 'flying_eye', 150, 150, 1.5, { attackCount: 1, facesLeft:true, yOffset: -12 }),
  satyr_archer: makeConfig('monster', 'satyr_archer', 96, 96, 1.5, { attackCount: 1, facesLeft: true, isRanged: true, hasArrow: true, yOffset: 5 }),

  // ZONA 4 (floor 16-20)
  pyromancer: makeConfig('monster', 'pyromancer', 100, 100, 1.3, { attackCount: 1,facesLeft:true, yOffset: 10 }),
  witch: makeConfig('monster', 'witch', 125, 125, 1.3, { attackCount: 1, yOffset: 36 }),
  medusa: makeConfig('monster', 'medusa', 150, 125, 1.5, { attackCount: 2, yOffset: 8 }),
  cyclops: makeConfig('monster', 'cyclops', 245, 128, 1.8, { attackCount: 2, yOffset: 5 }),
  cerberus: makeConfig('monster', 'cerberus', 128, 128, 1.8, { attackCount: 1, facesLeft:true, yOffset: -27 }),

  // ZONA 5 (Floor 21-25)
  gryphon: makeConfig('monster', 'gryphon', 112, 103, 1.8, { attackCount: 2, facesLeft:true, yOffset: 13 }),
  minotaur: makeConfig('monster', 'minotaur', 128, 128, 1.5, { attackCount: 2,facesLeft:true, yOffset: 10 }),
  werewolf: makeConfig('monster', 'werewolf', 158, 125, 1.3, { attackCount: 2, facesLeft:true,hasShout: true,  yOffset: 15 }),
  stone_golem: makeConfig('monster', 'stone_golem', 220, 96, 1.8, { attackCount: 1, yOffset: 7 }),
  skeleton_mage: makeConfig('monster', 'skeleton_mage', 128, 128, 1.2, { attackCount: 1,facesLeft:true, yOffset: 10}),

  // FINAL ZONE (Floor 26-28)
  huge_knight: makeConfig('monster', 'huge_knight', 237, 187, 1, { attackCount: 1,facesLeft:true, yOffset: 15 }),
  headless_horseman: makeConfig('monster', 'headless_horseman', 150, 150, 1.3, { attackCount: 1, facesLeft: true, yOffset: 15 }),
  dragon: makeConfig('monster', 'dragon', 144, 96, 1.8, { attackCount: 2, yOffset: 5 }),
  demon_bos: makeConfig('monster', 'demon_bos', 162, 148, 1.8, { attackCount: 1, yOffset: 10 }),
};
