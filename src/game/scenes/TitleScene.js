import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    
    // Background
    this.add.rectangle(0, 0, width, height, 0x0D0A0E).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, height / 2 - 50, 'EASTCRAFT MONARA', { 
      font: '64px serif', 
      fill: '#D4A853' 
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 + 20, 'Sign to Fight. Climb the Monara.', { 
      font: '24px monospace', 
      fill: '#E8E2D9' 
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.add.text(width / 2, height / 2 + 100, '> CLICK TO START <', { 
      font: '32px monospace', 
      fill: '#C8334A' 
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Tween for pulsing effect on start button
    this.tweens.add({
      targets: startBtn,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    startBtn.on('pointerdown', () => {
      useGameStore.getState().setScene('WorldMap');
      this.scene.start('WorldMapScene');
    });
  }
}
