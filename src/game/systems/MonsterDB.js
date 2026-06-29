/**
 * MONSTER DATABASE
 * ─────────────────────────────────────────────────────────────────
 * Monster stats per zone.
 * `spriteId` must match a key in MONSTER_REGISTRY (characterRegistry.js)
 * and the folder name at /assets/character/monster/<spriteId>/Sprites/
 * ─────────────────────────────────────────────────────────────────
 */

export const MONSTERS = {
  1: { name: 'Imp', spriteId: 'Imp', hp: 50, damage: 10 },
  2: { name: 'Goblin', spriteId: 'goblin', hp: 60, damage: 12 },
  3: { name: 'Kobold', spriteId: 'kobold', hp: 70, damage: 14 },
  4: { name: 'Skeleton', spriteId: 'skeleton_warrior', hp: 80, damage: 16 },
  5: { name: 'Masked Orc', spriteId: 'masked_orc', hp: 90, damage: 18 },
  6: { name: 'Dwarf', spriteId: 'dwarf', hp: 100, damage: 20 },
  7: { name: 'Baby Dragon', spriteId: 'baby_dragon', hp: 110, damage: 22 },
  8: { name: 'Harpy', spriteId: 'harpy', hp: 120, damage: 24 },
  9: { name: 'Lizardman', spriteId: 'lizardman', hp: 130, damage: 26 },
  10: { name: 'Gargoyle', spriteId: 'gargoyle', hp: 140, damage: 28 },
  11: { name: 'Centaur', spriteId: 'centaur', hp: 150, damage: 30 },
  12: { name: 'Mimic', spriteId: 'mimic', hp: 160, damage: 32 },
  13: { name: 'Poison Skull', spriteId: 'poison_skull', hp: 170, damage: 34 },
  14: { name: 'Flying Eye', spriteId: 'flying_eye', hp: 180, damage: 36 },
  15: { name: 'Satyr Archer', spriteId: 'satyr_archer', hp: 190, damage: 38 },
  16: { name: 'Pyromancer', spriteId: 'pyromancer', hp: 200, damage: 40 },
  17: { name: 'Witch', spriteId: 'witch', hp: 220, damage: 42 },
  18: { name: 'Medusa', spriteId: 'medusa', hp: 240, damage: 44 },
  19: { name: 'Cyclops', spriteId: 'cyclops', hp: 260, damage: 46 },
  20: { name: 'Cerberus', spriteId: 'cerberus', hp: 280, damage: 48 },
  21: { name: 'Gryphon', spriteId: 'gryphon', hp: 300, damage: 50 },
  22: { name: 'Minotaur', spriteId: 'minotaur', hp: 330, damage: 55 },
  23: { name: 'Werewolf', spriteId: 'werewolf', hp: 360, damage: 60 },
  24: { name: 'Stone Golem', spriteId: 'stone_golem', hp: 390, damage: 65 },
  25: { name: 'Skeleton Mage', spriteId: 'skeleton_mage', hp: 420, damage: 70 },
  26: { name: 'Huge Knight', spriteId: 'huge_knight', hp: 440, damage: 72 },
  27: { name: 'Headless Horseman', spriteId: 'headless_horseman', hp: 460, damage: 75 },
  28: { name: 'Dragon', spriteId: 'dragon', hp: 500, damage: 85 },
  29: { name: 'Demon Boss', spriteId: 'demon_bos', hp: 600, damage: 100 },
};

/**
 * Returns the monster for the given floor.
 * @param {number} floorId
 * @returns {{ name: string, spriteId: string, hp: number, damage: number }}
 */
export function getMonsterForFloor(floorId) {
  const monster = MONSTERS[floorId] || MONSTERS[1];
  return { ...monster };
}
