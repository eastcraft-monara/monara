import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    this.load.image('samurai', '/assets/sprites/samurai.png');
    this.load.image('imp', '/assets/sprites/imp.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparent so React BG shows through

    const w = this.scale.width;
    const h = this.scale.height;
    
    // Position on the ground line
    const groundY = h - 64;

    // --- Samurai AI Sprite ---
    this.playerSprite = this.add.image(w * 0.2, groundY + 16, 'samurai')
      .setOrigin(0.5, 1)
      .setScale(0.32); // Transparent background via python script
    
    // --- Fire Imp AI Sprite ---
    this.monsterSprite = this.add.image(w * 0.8, groundY + 28, 'imp')
      .setOrigin(0.5, 1)
      .setScale(0.3); // Transparent background via python script

    // --- Procedural Idle Animations (Breathing) ---
    this.tweens.add({
      targets: this.playerSprite,
      scaleY: 0.31, // squish down slightly
      scaleX: 0.325, // stretch wide slightly
      y: groundY + 18,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.monsterSprite,
      scaleY: 0.29,
      scaleX: 0.31,
      y: groundY + 32,
      duration: 800, // Faster breathing for the imp
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Listen to Zustand store for actions
    this.unsubscribe = useGameStore.subscribe((state, prevState) => {
      const action = state.lastAction;
      if (!action) return;
      
      // Ensure we only trigger when a NEW action comes in
      if (prevState && prevState.lastAction && prevState.lastAction.timestamp === action.timestamp) return;
      
      if (action.type === 'player_attack') {
        this.playPlayerAttack();
      } else if (action.type === 'monster_attack') {
        this.playMonsterAttack();
      }
    });
  }

  playPlayerAttack() {
    // 1. Player attacks (lunge right + lean forward to the enemy)
    const originalX = this.playerSprite.x;
    this.tweens.add({
      targets: this.playerSprite,
      x: this.monsterSprite.x - 100, // Dash all the way to the monster
      angle: 30, // Lean forward dramatically
      duration: 250,
      yoyo: true,
      ease: 'Cubic.easeIn',
      onComplete: () => this.playerSprite.setAngle(0) // reset just in case
    });

    // 2. Slash VFX & Monster recoil
    this.time.delayedCall(250, () => {
      // Recoil
      this.tweens.add({
        targets: this.monsterSprite,
        x: this.monsterSprite.x + 40,
        angle: 10,
        duration: 100,
        yoyo: true,
        onComplete: () => this.monsterSprite.setAngle(0)
      });
      
      // Cool Slash VFX (White-blue arc)
      const slash = this.add.ellipse(this.monsterSprite.x, this.monsterSprite.y - 60, 10, 120, 0xAAFFFF);
      slash.setAngle(45);
      slash.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: slash,
        scaleX: 8,
        scaleY: 1.5,
        alpha: { from: 1, to: 0 },
        duration: 250,
        ease: 'Cubic.easeOut',
        onComplete: () => slash.destroy()
      });
    });
  }

  playMonsterAttack() {
    // 1. Monster attacks (lunge left + lean forward)
    this.tweens.add({
      targets: this.monsterSprite,
      x: this.playerSprite.x + 100, // Dash all the way to the player
      angle: -30, // Lean forward dramatically
      duration: 250,
      yoyo: true,
      ease: 'Cubic.easeIn',
      onComplete: () => this.monsterSprite.setAngle(0)
    });

    // 2. Claw VFX & Player recoil
    this.time.delayedCall(250, () => {
      // Recoil
      this.tweens.add({
        targets: this.playerSprite,
        x: this.playerSprite.x - 40,
        angle: -10,
        duration: 100,
        yoyo: true,
        onComplete: () => this.playerSprite.setAngle(0)
      });

      // Red Claw/Scratch VFX
      const scratch = this.add.ellipse(this.playerSprite.x, this.playerSprite.y - 60, 10, 100, 0xFF4444);
      scratch.setAngle(-45);
      scratch.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: scratch,
        scaleX: 6,
        scaleY: 1.2,
        alpha: { from: 1, to: 0 },
        duration: 250,
        ease: 'Cubic.easeOut',
        onComplete: () => scratch.destroy()
      });
      
      // Screen Shake
      this.cameras.main.shake(150, 0.01);
    });
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
