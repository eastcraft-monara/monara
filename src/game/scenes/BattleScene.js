import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';
import { getSignsForZone } from '../systems/CurriculumManager';
import { getRandomMonster } from '../systems/MonsterDB';

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.zoneId = data.zoneId || 1;
    this.vocab = getSignsForZone(this.zoneId);
  }

  create() {
    const { width, height } = this.scale;
    
    // Background
    this.add.rectangle(0, 0, width, height, 0x0D0A0E).setOrigin(0);

    // Monster setup
    this.monsterData = getRandomMonster(this.zoneId);
    this.monsterMaxHp = this.monsterData.hp;
    this.monsterHp = this.monsterMaxHp;

    // UI Text
    this.playerHpText = this.add.text(50, 50, `Player HP: ${this.playerHp}/${this.playerMaxHp}`, { font: '24px monospace', fill: '#4CAF82' });
    this.monsterHpText = this.add.text(width - 350, 50, `Monster HP: ${this.monsterHp}/${this.monsterMaxHp}`, { font: '24px monospace', fill: '#E05252' });

    // Monster Sprite
    this.monster = this.add.rectangle(width / 2, height / 2 - 50, 150, 150, this.monsterData.color);
    this.add.text(width / 2, height / 2 - 50, this.monsterData.name, { font: '20px serif', fill: '#000' }).setOrigin(0.5);

    // Set initial target sign
    this.generateNewTarget();

    // Subscribe to Zustand store to listen for gesture predictions
    let lastTimestamp = 0;
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      if (state.latestPrediction && state.latestPrediction.timestamp > lastTimestamp) {
        lastTimestamp = state.latestPrediction.timestamp;
        this.handleGesture(state.latestPrediction);
      }
    });

    // Timer for attack
    this.timerText = this.add.text(width / 2, height / 2 + 100, '', { font: '28px monospace', fill: '#E8E2D9' }).setOrigin(0.5);
    this.timeLimit = 12; // 12 seconds
    this.timeLeft = this.timeLimit;
    
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // Cleanup on scene shutdown
    this.events.on('shutdown', this.onDestroy, this);
  }

  generateNewTarget() {
    const randomChar = this.vocab[Math.floor(Math.random() * this.vocab.length)];
    useGameStore.getState().setTargetSign(randomChar);
    this.timeLeft = 12; // reset timer
    if (this.timerText) {
      this.timerText.setText(`Time: ${this.timeLeft}s`);
    }
  }

  tickTimer() {
    this.timeLeft -= 1;
    this.timerText.setText(`Time: ${this.timeLeft}s`);

    if (this.timeLeft <= 0) {
      // Timeout! Monster attacks
      this.damagePlayer(20);
      
      if (this.playerHp > 0) {
        this.generateNewTarget();
      }
    }
  }

  handleGesture(prediction) {
    if (!prediction) return;
    
    const target = useGameStore.getState().targetSign;
    // We expect confidence >= 0.8
    if (prediction.char === target && prediction.confidence >= 0.8) {
      // Correct!
      this.damageMonster(25);
      
      // Visual feedback
      this.cameras.main.flash(200, 76, 175, 130); // Flash green

      if (this.monsterHp > 0) {
        this.generateNewTarget();
      }
    } else if (prediction.char !== target) {
      // Flash red slightly for wrong sign
      this.cameras.main.flash(100, 224, 82, 82);
    }
  }

  damageMonster(amount) {
    this.monsterHp -= amount;
    if (this.monsterHp <= 0) {
      this.monsterHp = 0;
      this.monsterHpText.setText(`Monster HP: ${this.monsterHp}/${this.monsterMaxHp}`);
      this.victory();
    } else {
      this.monsterHpText.setText(`Monster HP: ${this.monsterHp}/${this.monsterMaxHp}`);
      // Animate monster hit
      this.tweens.add({
        targets: this.monster,
        x: this.monster.x + 20,
        yoyo: true,
        duration: 50,
        repeat: 3
      });
    }
  }

  damagePlayer(amount) {
    this.playerHp -= amount;
    this.cameras.main.shake(200, 0.01); // Shake camera

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.playerHpText.setText(`Player HP: ${this.playerHp}/${this.playerMaxHp}`);
      this.defeat();
    } else {
      this.playerHpText.setText(`Player HP: ${this.playerHp}/${this.playerMaxHp}`);
    }
  }

  victory() {
    if (this.timeEvent) this.timeEvent.remove();
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'VICTORY!', { font: '64px serif', fill: '#D4A853' }).setOrigin(0.5);
    useGameStore.getState().setTargetSign(null);
    
    this.time.delayedCall(1500, () => {
      this.scene.start('LevelUpScene', { zoneId: this.zoneId });
    });
  }

  defeat() {
    if (this.timeEvent) this.timeEvent.remove();
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'DEFEATED...', { font: '64px serif', fill: '#E05252' }).setOrigin(0.5);
    useGameStore.getState().setTargetSign(null);
    
    this.time.delayedCall(2000, () => {
      useGameStore.getState().setScene('WorldMap');
      this.scene.start('WorldMapScene');
    });
  }

  onDestroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
    useGameStore.getState().setTargetSign(null);
  }
}
