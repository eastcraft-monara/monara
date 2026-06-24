import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

export default class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUpScene');
  }

  init(data) {
    this.zoneId = data.zoneId || 1;
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0D0A0E).setOrigin(0);
    
    this.add.text(width / 2, height / 2 - 80, 'ZONE CLEARED!', { font: '48px serif', fill: '#D4A853' }).setOrigin(0.5);
    
    // Unlock next zone if applicable
    const maxZone = useGameStore.getState().currentZone;
    if (this.zoneId === maxZone && maxZone < 4) {
      useGameStore.setState({ currentZone: maxZone + 1 });
      this.add.text(width / 2, height / 2, `Unlocked Zone ${maxZone + 1}`, { font: '32px monospace', fill: '#4CAF82' }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, height / 2, `Zone ${this.zoneId} Mastered`, { font: '32px monospace', fill: '#4CAF82' }).setOrigin(0.5);
    }

    const continueBtn = this.add.text(width / 2, height / 2 + 100, '> Return to Map', { font: '32px monospace', fill: '#E8E2D9' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
      useGameStore.getState().setScene('WorldMap');
      this.scene.start('WorldMapScene');
    });
    
    continueBtn.on('pointerover', () => continueBtn.setFill('#C8334A'));
    continueBtn.on('pointerout', () => continueBtn.setFill('#E8E2D9'));
  }
}
