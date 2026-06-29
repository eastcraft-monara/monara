import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const gameStore = useGameStore.getState();
    const floorId = gameStore.currentFloor || 1;

    let bgmIndex = ((floorId - 1) % 10) + 1;
    const zoneStr = String(bgmIndex).padStart(3, '0');
    const bgmName = `rpg_bs${zoneStr}`;
    const bgmPath = `/assets/audio/Battle/${bgmName}`;

    this.load.audio(`bgm_intro_${floorId}`, `${bgmPath}/unityloop/${bgmName}-intro.ogg`);
    this.load.audio(`bgm_loop_${floorId}`, `${bgmPath}/${bgmName}.ogg`);
    this.load.audio(`bgm_victory_${floorId}`, `${bgmPath}/unityloop/${bgmName}-loop.ogg`);
    
    this.load.audio('sfx_hit', '/assets/audio/hit.wav');
    this.load.audio('sfx_miss', '/assets/audio/miss.wav');
  }

  create() {
    this.add.text(this.scale.width/2, this.scale.height/2, 'Loading Eastcraft Monara...', { font: '24px monospace', fill: '#D4A853' }).setOrigin(0.5);
    
    const gameStore = useGameStore.getState();
    const floorId = gameStore.currentFloor || 1;
    
    this.sound.stopAll();
    
    const intro = this.sound.add(`bgm_intro_${floorId}`, { loop: true, volume: 0.3 });
    const loop = this.sound.add(`bgm_loop_${floorId}`, { loop: true, volume: 0.3 });
    
    if (gameStore.battleState === 'active') {
      loop.play();
    } else {
      intro.play();
    }
    
    this.time.delayedCall(10, () => {
      this.scene.start('BattleScene');
    });
  }
}
