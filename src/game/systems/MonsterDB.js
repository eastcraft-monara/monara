/**
 * MONSTER DATABASE
 * ─────────────────────────────────────────────────────────────────
 * Monster stats per zone.
 * `spriteId` must match a key in MONSTER_REGISTRY (characterRegistry.js)
 * and the folder name at /assets/character/monster/<spriteId>/Sprites/
 * ─────────────────────────────────────────────────────────────────
 */

export const MONSTERS = {
  1: [
    { name: 'Goblin',      spriteId: 'goblin',           hp: 60,  damage: 12 },
    { name: 'Imp',         spriteId: 'imp',               hp: 50,  damage: 10 },
  ],
  2: [
    { name: 'Skeleton',    spriteId: 'skeleton_warrior',  hp: 80,  damage: 15 },
    { name: 'Cyclops',     spriteId: 'cyclops',           hp: 100, damage: 20 },
  ],
  3: [
    { name: 'Cerberus',    spriteId: 'cerberus',          hp: 140, damage: 28 },
    { name: 'Gryphon',     spriteId: 'gryphon',           hp: 150, damage: 30 },
  ],
  4: [
    { name: 'Dragon',      spriteId: 'dragon',            hp: 200, damage: 40 },
  ],
};

/**
 * Returns a random monster from the given zone.
 * @param {number} zoneId
 * @returns {{ name: string, spriteId: string, hp: number, damage: number }}
 */
export function getRandomMonster(zoneId) {
  const zoneMonsters = MONSTERS[zoneId] || MONSTERS[1];
  const randIndex = Math.floor(Math.random() * zoneMonsters.length);
  return { ...zoneMonsters[randIndex] };
}
