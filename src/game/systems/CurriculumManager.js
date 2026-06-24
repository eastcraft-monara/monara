export const ZONES = [
  { id: 1, name: 'Zone 1: Alphabet', signs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { id: 2, name: 'Zone 2: Numbers', signs: Array.from({length: 10}, (_, i) => i.toString()) },
  { id: 3, name: 'Zone 3: Basic Vocab', signs: ['FIRE', 'WATER', 'SWORD', 'RUN', 'HELP', 'STOP', 'GO', 'YES', 'NO', 'WIN'] },
  { id: 4, name: 'Zone 4: Phrases', signs: ['FIRE SWORD', 'RUN FAST', 'HELP ME'] }
];

export function getSignsForZone(zoneId) {
  const zone = ZONES.find(z => z.id === zoneId) || ZONES[0];
  return zone.signs;
}
