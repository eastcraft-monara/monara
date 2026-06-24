import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';

// Toggle this to TRUE when the 2D Artist delivers the .png and .json files
const USE_SPRITESHEET = false;

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    // --- Audio ---
    this.load.audio('bgm', '/assets/audio/bgm.wav');
    this.load.audio('sfx_hit', '/assets/audio/hit.wav');
    this.load.audio('sfx_miss', '/assets/audio/miss.wav');

    if (USE_SPRITESHEET) {
      // Integration Notes (For Developers) - Load Atlas
      this.load.atlas('samurai', '/assets/sprites/samurai_sheet.png', '/assets/sprites/samurai_atlas.json');
      this.load.atlas('imp', '/assets/sprites/imp_sheet.png', '/assets/sprites/imp_atlas.json');
    } else {
      // Prototype Static Images
      this.load.image('samurai', '/assets/sprites/samurai.png');
      this.load.image('imp', '/assets/sprites/imp.png');
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparent so React BG shows through

    // --- Start BGM ---
    // Make sure we don't play multiple BGMs if the scene restarts
    if (this.sound.get('bgm')) this.sound.get('bgm').destroy();
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    this.bgm.play();

    const w = this.scale.width;
    const h = this.scale.height;
    
    // Position on the ground line
    const groundY = h - 64;

    if (USE_SPRITESHEET) {
      this.setupAnimations();
      
      this.playerSprite = this.add.sprite(w * 0.2, groundY, 'samurai').setOrigin(0.5, 1);
      this.playerSprite.play('samurai_idle');
      
      this.monsterSprite = this.add.sprite(w * 0.8, groundY, 'imp').setOrigin(0.5, 1);
      this.monsterSprite.play('imp_idle');
    } else {
      // --- Samurai AI Sprite (Prototype) ---
      this.playerSprite = this.add.image(w * 0.2, groundY + 16, 'samurai')
        .setOrigin(0.5, 1)
        .setScale(0.32);
      
      // --- Fire Imp AI Sprite (Prototype) ---
      this.monsterSprite = this.add.image(w * 0.8, groundY + 28, 'imp')
        .setOrigin(0.5, 1)
        .setScale(0.3);
    }

    // --- Procedural Idle Animations (Breathing) ---
    if (!USE_SPRITESHEET) {
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
    }

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

    this.events.once('shutdown', () => {
      if (this.unsubscribe) this.unsubscribe();
    });
  }

  setupAnimations() {
    // --- SAMURAI ANIMATIONS ---
    this.anims.create({
      key: 'samurai_idle',
      frames: this.anims.generateFrameNames('samurai', { prefix: 'idle_', start: 0, end: 3, zeroPad: 2 }),
      frameRate: 6, repeat: -1
    });
    this.anims.create({
      key: 'samurai_attack',
      frames: this.anims.generateFrameNames('samurai', { prefix: 'attack_', start: 0, end: 4, zeroPad: 2 }),
      frameRate: 14, repeat: 0
    });
    this.anims.create({
      key: 'samurai_hurt',
      frames: this.anims.generateFrameNames('samurai', { prefix: 'hurt_', start: 0, end: 2, zeroPad: 2 }),
      frameRate: 12, repeat: 0
    });

    // --- FIRE IMP ANIMATIONS ---
    this.anims.create({
      key: 'imp_idle',
      frames: this.anims.generateFrameNames('imp', { prefix: 'idle_', start: 0, end: 3, zeroPad: 2 }),
      frameRate: 6, repeat: -1
    });
    this.anims.create({
      key: 'imp_attack',
      frames: this.anims.generateFrameNames('imp', { prefix: 'attack_', start: 0, end: 4, zeroPad: 2 }),
      frameRate: 14, repeat: 0
    });
    this.anims.create({
      key: 'imp_hurt',
      frames: this.anims.generateFrameNames('imp', { prefix: 'hurt_', start: 0, end: 2, zeroPad: 2 }),
      frameRate: 12, repeat: 0
    });
  }

  playPlayerAttack() {
    if (!this.sys || !this.sound) return; // Prevent crashes if scene is destroyed during fast refresh
    
    this.sound.play('sfx_hit', { volume: 0.5 });
    
    if (USE_SPRITESHEET) {
      this.playerSprite.play('samurai_attack');
      this.playerSprite.once('animationcomplete', () => this.playerSprite.play('samurai_idle'));
      
      this.time.delayedCall(200, () => {
        this.monsterSprite.play('imp_hurt');
        this.monsterSprite.once('animationcomplete', () => this.monsterSprite.play('imp_idle'));
      });
      return;
    }

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
    if (!this.sys || !this.sound) return; // Prevent crashes if scene is destroyed during fast refresh
    
    this.sound.play('sfx_miss', { volume: 0.5 });
    
    if (USE_SPRITESHEET) {
      this.monsterSprite.play('imp_attack');
      this.monsterSprite.once('animationcomplete', () => this.monsterSprite.play('imp_idle'));
      
      this.time.delayedCall(200, () => {
        this.playerSprite.play('samurai_hurt');
        this.playerSprite.once('animationcomplete', () => this.playerSprite.play('samurai_idle'));
      });
      return;
    }

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
