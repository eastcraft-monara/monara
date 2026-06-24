import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import BattleScene from './scenes/BattleScene';

export const config = {
  type: Phaser.AUTO,
  width: 920,
  height: 340,
  parent: 'game-container',
  backgroundColor: '#1A1520', // Fallback color, though React handles the gradient
  transparent: true,
  scene: [BootScene, BattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};
