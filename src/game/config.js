import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import BattleScene from './scenes/BattleScene';

export const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  backgroundColor: '#0D0A0E',
  scene: [BootScene, BattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};
