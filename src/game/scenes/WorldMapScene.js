import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0D0A0E).setOrigin(0);
    this.add.text(width / 2, 80, 'WORLD MAP', { font: '48px serif', fill: '#D4A853' }).setOrigin(0.5);

    const maxZoneUnlocked = useGameStore.getState().currentZone;

    for (let i = 1; i <= 4; i++) {
      const isUnlocked = i <= maxZoneUnlocked;
      const yPos = 180 + (i * 70);
      const color = isUnlocked ? '#E8E2D9' : '#555555';
      const text = `Zone ${i} ${!isUnlocked ? '(Locked)' : ''}`;

      const zoneText = this.add.text(width / 2, yPos, text, { font: '32px monospace', fill: color })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: isUnlocked });

      if (isUnlocked) {
        zoneText.on('pointerdown', () => {
          useGameStore.getState().setScene('Battle');
          this.scene.start('BattleScene', { zoneId: i });
        });
        
        zoneText.on('pointerover', () => zoneText.setFill('#C8334A'));
        zoneText.on('pointerout', () => zoneText.setFill(color));
      }
    }
  }
}
