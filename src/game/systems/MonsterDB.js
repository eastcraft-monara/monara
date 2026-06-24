export const MONSTERS = {
  1: [
    { name: 'Slime', hp: 50, damage: 10, color: 0x4CAF82 },
    { name: 'Bat', hp: 50, damage: 12, color: 0x5D4037 }
  ],
  2: [
    { name: 'Skeleton', hp: 80, damage: 15, color: 0xE8E2D9 },
    { name: 'Ghost', hp: 80, damage: 18, color: 0xB0BEC5 }
  ],
  3: [
    { name: 'Samurai', hp: 120, damage: 25, color: 0xC8334A },
    { name: 'Flame Spirit', hp: 120, damage: 30, color: 0xFF5722 }
  ],
  4: [
    { name: 'Dragon', hp: 200, damage: 40, color: 0xD4A853 },
    { name: 'Demon Lord', hp: 300, damage: 50, color: 0x000000 }
  ]
};

export function getRandomMonster(zoneId) {
  const zoneMonsters = MONSTERS[zoneId] || MONSTERS[1];
  const randIndex = Math.floor(Math.random() * zoneMonsters.length);
  return { ...zoneMonsters[randIndex] };
}
