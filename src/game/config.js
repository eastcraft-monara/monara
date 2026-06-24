import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import WorldMapScene from './scenes/WorldMapScene';
import BattleScene from './scenes/BattleScene';
import LevelUpScene from './scenes/LevelUpScene';

export const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  backgroundColor: '#0D0A0E',
  scene: [BootScene, TitleScene, WorldMapScene, BattleScene, LevelUpScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};
