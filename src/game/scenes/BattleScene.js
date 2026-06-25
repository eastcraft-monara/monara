import Phaser from 'phaser';
import useGameStore, { TOWER_FLOORS } from '@/store/gameStore';

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
      this.load.image('slime', '/assets/sprites/slime.png');
      this.load.image('skeleton', '/assets/sprites/skeleton.png');
      this.load.image('bat', '/assets/sprites/bat.png');
      this.load.image('imp', '/assets/sprites/imp.png');
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparent so React BG shows through

    // --- Start BGM ---
    if (this.sound.get('bgm')) this.sound.get('bgm').destroy();
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
    this.bgm.play();

    const w = this.scale.width;
    const h = this.scale.height;

    // --- Parallax Placeholders ---
    // Sky
    this.skyLayer = this.add.graphics();
    this.skyLayer.fillStyle(0x0a0f1c, 1);
    this.skyLayer.fillRect(0, 0, w * 2, h);
    
    // Mid (Buildings)
    this.midLayer = this.add.graphics();
    this.midLayer.fillStyle(0x1a1520, 1);
    for (let i = 0; i < 20; i++) {
        const bx = i * 120;
        const by = h - 220 + Math.random() * 80;
        this.midLayer.fillRect(bx, by, 80, 250);
        this.midLayer.fillStyle(0xe0210f, 1); // Lit windows
        this.midLayer.fillRect(bx + 15, by + 40, 12, 16);
        this.midLayer.fillRect(bx + 50, by + 90, 12, 16);
        this.midLayer.fillStyle(0x1a1520, 1);
    }

    // Ground
    this.groundLayer = this.add.graphics();
    this.groundLayer.fillStyle(0x0a0608, 1);
    this.groundLayer.fillRect(0, h - 90, w * 2, 90);
    this.groundLayer.lineStyle(2, 0xffffff, 0.1);
    this.groundLayer.beginPath();
    this.groundLayer.moveTo(0, h - 90);
    this.groundLayer.lineTo(w * 2, h - 90);
    this.groundLayer.strokePath();
    
    // Position on the ground line
    const groundY = h - 45;
    const gameStore = useGameStore.getState();
    const currentFloor = gameStore.currentFloor;
    const gameMode = gameStore.gameMode;
    const floorData = TOWER_FLOORS.find(f => f.n === currentFloor) || TOWER_FLOORS[TOWER_FLOORS.length - 1];

    if (USE_SPRITESHEET) {
      this.setupAnimations();
      
      this.playerSprite = this.add.sprite(w * 0.11, groundY, 'samurai').setOrigin(0.5, 1).setScale(1);
      this.playerSprite.play('samurai_idle');
      
      if (gameMode === 'pvp') {
          this.monsterSprite = this.add.sprite(w * 0.89, groundY, 'samurai').setOrigin(0.5, 1).setScale(1);
          this.monsterSprite.flipX = true;
          this.monsterSprite.setTint(0xff7777); // Red tint for opponent
          this.monsterSprite.play('samurai_idle');
      } else {
          this.monsterSprite = this.add.sprite(w * 0.89, groundY, 'imp').setOrigin(0.5, 1).setScale(1);
          this.monsterSprite.setTint(floorData.color);
          this.monsterSprite.play('imp_idle');
      }
    } else {
      // --- Samurai AI Sprite (Prototype) ---
      this.playerSprite = this.add.image(w * 0.11, groundY, 'samurai')
        .setOrigin(0.5, 1)
        .setScale(0.32);
      
      if (gameMode === 'pvp') {
          this.monsterSprite = this.add.image(w * 0.89, groundY, 'samurai')
            .setOrigin(0.5, 1)
            .setScale(0.32);
          this.monsterSprite.flipX = true;
          this.monsterSprite.setTint(0xff7777); // Red tint for opponent
      } else {
          let monsterKey = 'imp';
          if (floorData.z === 'Z1') monsterKey = 'slime';
          else if (floorData.z === 'Z2') monsterKey = 'skeleton';
          else if (floorData.z === 'Z3') monsterKey = 'bat';
          else if (floorData.z === 'Z4') monsterKey = 'imp';

          // --- Monster AI Sprite (Prototype) ---
          this.monsterSprite = this.add.image(w * 0.89, groundY, monsterKey)
            .setOrigin(0.5, 1)
            .setScale(0.32);
          if (currentFloor !== 6 && currentFloor !== 4) {
            this.monsterSprite.setTint(floorData.color);
          }
      }
    }

    // --- Procedural Idle Animations (Breathing) ---
    if (!USE_SPRITESHEET) {
    this.tweens.add({
      targets: this.playerSprite,
      scaleY: 0.31, // squish down slightly
      scaleX: 0.325, // stretch wide slightly
      y: groundY + 2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.monsterSprite,
      scaleY: 0.29,
      scaleX: 0.31,
      y: groundY + 2,
      duration: 800, // Faster breathing
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
        // Camera shake + parallax bump
        this.cameras.main.shake(150, 0.01);
        this.tweens.add({ targets: this.midLayer, x: -20, duration: 100, yoyo: true });
        this.tweens.add({ targets: this.groundLayer, x: -40, duration: 100, yoyo: true });
      } else if (action.type === 'monster_attack') {
        this.playMonsterAttack();
        this.cameras.main.shake(150, 0.01);
        this.tweens.add({ targets: this.midLayer, x: 20, duration: 100, yoyo: true });
        this.tweens.add({ targets: this.groundLayer, x: 40, duration: 100, yoyo: true });
      }
    });

    this.events.once('shutdown', () => {
      if (this.unsubscribe) this.unsubscribe();
    });
    this.sys.game.events.once('destroy', () => {
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
    try {
      if (!this.sys || !this.sys.game || !this.scene.isActive()) return;
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
        onComplete: () => {
          slash.destroy();
          this.cameras.main.shake(150, 0.01);
        }
      });
    });
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  playMonsterAttack() {
    try {
      if (!this.sys || !this.sys.game || !this.scene.isActive()) return;
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
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
