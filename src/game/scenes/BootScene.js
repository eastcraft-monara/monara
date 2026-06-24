import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.add.text(this.scale.width/2, this.scale.height/2, 'Loading Eastcraft Monara...', { font: '24px monospace', fill: '#D4A853' }).setOrigin(0.5);
    
    // Simulate loading
    this.time.delayedCall(100, () => {
      this.scene.start('BattleScene');
    });
  }
}
