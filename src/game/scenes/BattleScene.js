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
      this.load.image('samurai', '/assets/sprites/samurai/samurai.png');
      this.load.image('slime', '/assets/sprites/slime/slime.png');
      this.load.image('slime_atk1', '/assets/sprites/slime/slime-attack-1.png');
      this.load.image('slime_atk2', '/assets/sprites/slime/slime-attack-2.png');
      this.load.image('slime_atk3', '/assets/sprites/slime/slime-attack-3.png');
      this.load.image('skeleton', '/assets/sprites/skeleton.png');
      this.load.image('bat', '/assets/sprites/bat.png');
      this.load.image('imp', '/assets/sprites/imp.png');
      this.load.image('stage_bg', '/assets/stage_bg.png');
      this.load.image('samurai_atk1', '/assets/sprites/samurai/samurai-attack-1.png');
      this.load.image('samurai_atk2', '/assets/sprites/samurai/samurai-attack-2.png');
      this.load.image('samurai_atk3', '/assets/sprites/samurai/samurai-attack-3.png');
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

    // --- Post-Processing Pass (Phase 1) ---
    if (this.cameras.main.postFX) {
        // Vignette (darken edges to focus on fighters)
        this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.4);
        
        // Bloom (make lights and UI elements glow slightly)
        this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.8, 1.2);
        
        // Color Grade (Cinematic contrast and saturation)
        const colorMatrix = this.cameras.main.postFX.addColorMatrix();
        colorMatrix.contrast(1.2);
        colorMatrix.saturation(1.1);
    }

    // --- High-Quality 2D Stage Background ---
    // Create containers first so existing tween logic doesn't crash
    this.skyLayer = this.add.container();
    this.midLayer = this.add.container(); 
    this.groundLayer = this.add.container();

    this.bgImage = this.add.image(w/2, h/2, 'stage_bg').setOrigin(0.5, 0.5);
    // Scale it to cover the screen, with 10% padding for camera shake and parallax
    const bgScale = Math.max(w / this.bgImage.width, h / this.bgImage.height);
    this.bgImage.setScale(bgScale * 1.1);
    
    // Add the image to midLayer so it gets parallax bumps during attacks
    this.midLayer.add(this.bgImage);

    // Add a slight dark gradient overlay at the bottom for character grounding
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
    gradient.fillRect(0, h - 150, w, 150);
    this.groundLayer.add(gradient);

    // --- Living Detail: Embers (Phase 2) ---
    for (let i = 0; i < 20; i++) {
        const ember = this.add.rectangle(Phaser.Math.Between(0, w * 2), Phaser.Math.Between(0, h), 3, 3, 0xff6600, 0.4);
        ember.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: ember,
            y: '-=' + Phaser.Math.Between(50, 150),
            x: '+=' + Phaser.Math.Between(-30, 30),
            alpha: { from: 0.4, to: 0 },
            duration: Phaser.Math.Between(4000, 8000),
            repeat: -1,
            onRepeat: (tween, target) => {
                target.y = h;
                target.x = Phaser.Math.Between(0, w * 2);
            }
        });
    }
    
    // Position on the ground line - lower for the new background
    const groundY = h - 15;
    
    // --- Contact Shadows (Phase 2) ---
    this.playerShadow = this.add.ellipse(w * 0.25, groundY, 45, 12, 0x000000, 0.7);
    this.monsterShadow = this.add.ellipse(w * 0.75, groundY, 45, 12, 0x000000, 0.7);

    // --- Camera Idle Drift / Breathing (Phase 2) ---
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.015,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

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
          if (gameStore.isHost) {
            this.monsterSprite.setTint(0xff7777); // Red tint for opponent
          } else {
            this.playerSprite.setTint(0xff7777); // Red tint for me (challenger)
          }
          this.monsterSprite.play('samurai_idle');
      } else {
          this.monsterSprite = this.add.sprite(w * 0.89, groundY, 'imp').setOrigin(0.5, 1).setScale(1);
          this.monsterSprite.setTint(floorData.color);
          this.monsterSprite.play('imp_idle');
      }
    } else {
      // --- Samurai AI Sprite (Prototype) ---
      this.playerSprite = this.add.image(w * 0.25, groundY, 'samurai')
        .setOrigin(0.5, 1)
        .setScale(0.22);
      
      if (gameMode === 'pvp') {
          this.monsterSprite = this.add.image(w * 0.75, groundY, 'samurai')
            .setOrigin(0.5, 1)
            .setScale(0.22);
          this.monsterSprite.flipX = true;
          if (gameStore.isHost) {
            this.monsterSprite.setTint(0xff7777); // Red tint for opponent
          } else {
            this.playerSprite.setTint(0xff7777); // Red tint for me (challenger)
          }
      } else {
          let monsterKey = 'slime';
          if (floorData.z === 'Z1') monsterKey = 'slime';
          else if (floorData.z === 'Z2') monsterKey = 'skeleton';
          else if (floorData.z === 'Z3') monsterKey = 'bat';
          else if (floorData.z === 'Z4') monsterKey = 'imp';

          // --- Monster AI Sprite (Prototype) ---
          this.monsterSprite = this.add.image(w * 0.75, groundY, monsterKey)
            .setOrigin(0.5, 1)
            .setScale(0.35);
      }
    }

    // --- Procedural Idle Animations (Breathing) ---
    if (!USE_SPRITESHEET) {
    this.tweens.add({
      targets: this.playerSprite,
      scaleY: 0.21, // squish down slightly
      scaleX: 0.225, // stretch wide slightly
      y: groundY + 2,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: this.monsterSprite,
      scaleY: 0.33,
      scaleX: 0.37,
      y: groundY + 5,
      duration: 1200, // Gelatinous breathing
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
        if (action.data && action.data.targetHp === 0) {
          this.time.delayedCall(400, () => this.playDeathSequence(false));
        }
      } else if (action.type === 'monster_attack') {
        this.playMonsterAttack();
        if (action.data && action.data.targetHp === 0) {
          this.time.delayedCall(400, () => this.playDeathSequence(true));
        }
      } else if (action.type === 'reset_match') {
        this.scene.restart();
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
    
    if (USE_SPRITESHEET) {
      this.sound.play('sfx_hit', { volume: 0.5 });
      this.playerSprite.play('samurai_attack');
      this.playerSprite.once('animationcomplete', () => this.playerSprite.play('samurai_idle'));
      
      this.time.delayedCall(200, () => {
        this.monsterSprite.play('imp_hurt');
        this.monsterSprite.once('animationcomplete', () => this.monsterSprite.play('imp_idle'));
      });
      return;
    }

    // 1. Squash & Stretch Player Attack
    this.playerSprite.setDepth(10);
    this.monsterSprite.setDepth(5);
    const originalX = this.playerSprite.x;
    
    // Anticipation (pull back)
    this.playerSprite.setTexture('samurai_atk1');
    this.tweens.add({
      targets: this.playerSprite,
      x: originalX - 40, angle: 0,
      duration: 400, ease: 'Sine.easeOut',
      onComplete: () => {
        // Strike (dash forward)
        this.playerSprite.setTexture('samurai_atk2');
        this.tweens.add({
          targets: this.playerSprite,
          x: this.monsterSprite.x - 100, angle: 0,
          duration: 350, ease: 'Cubic.easeIn',
          onComplete: () => {
            // Post-strike pose & VFX (PERFECT SYNC)
            this.playerSprite.setTexture('samurai_atk3');
            this.playerSprite.setAngle(0);
            
            // --- TRIGGER IMPACT VFX ---
            this.sound.play('sfx_hit', { volume: 0.5 });
            this.applyHitstop(60);
            this.spawnHitSpark(this.monsterSprite.x, this.monsterSprite.y - 60, 0xCAD0D7);
            this.doScreenFlash(0xffffff, 0.35);

            // Camera shake + parallax bump
            this.cameras.main.shake(200, 0.015);
            this.tweens.add({ targets: this.midLayer, x: -20, duration: 100, yoyo: true });
            this.tweens.add({ targets: this.groundLayer, x: -40, duration: 100, yoyo: true });

            // Monster Recoil
            const monsterStartX = this.monsterSprite.x;
            this.monsterSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
            this.time.delayedCall(50, () => this.monsterSprite.clearTint());
            
            this.tweens.add({
              targets: this.monsterSprite,
              x: monsterStartX + 60, scaleX: 0.45, scaleY: 0.25, angle: 15,
              duration: 100, yoyo: true, ease: 'Sine.easeOut',
              onComplete: () => {
                this.monsterSprite.setAngle(0);
                this.monsterSprite.setScale(0.35);
              }
            });
            // --- END IMPACT VFX ---

            // Cool Slash VFX (Blue crescent arc)
            const slash = this.add.ellipse(this.monsterSprite.x, this.monsterSprite.y - 60, 20, 150, 0x4A6FD4);
            slash.setAngle(45);
            slash.setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: slash,
              scaleX: 6, scaleY: 1.5, alpha: { from: 1, to: 0 },
              duration: 300, ease: 'Cubic.easeOut',
              onComplete: () => slash.destroy()
            });

            this.time.delayedCall(300, () => { // Hold pose 3 longer
                // Recover (bounce back)
                this.playerSprite.setTexture('samurai');
                this.tweens.add({
                  targets: this.playerSprite,
                  x: originalX, angle: 0,
                  duration: 600, ease: 'Bounce.easeOut'
                });
            });
          }
        });
      }
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

    // 1. Per-Frame Monster Attack (Similar to Player)
    this.monsterSprite.setDepth(10);
    this.playerSprite.setDepth(5);
    const originalX = this.monsterSprite.x;
    
    // Anticipation (pull back)
    if (this.monsterSprite.texture.key === 'slime') {
        this.monsterSprite.setTexture('slime_atk1');
    }
    
    this.tweens.add({
      targets: this.monsterSprite,
      x: originalX + 40, angle: 0,
      duration: 400, ease: 'Sine.easeOut',
      onComplete: () => {
        // Strike (dash forward)
        if (this.monsterSprite.texture.key === 'slime_atk1') {
            this.monsterSprite.setTexture('slime_atk2');
        }
        
        this.tweens.add({
          targets: this.monsterSprite,
          x: this.playerSprite.x + 100, angle: 0,
          duration: 350, ease: 'Cubic.easeIn',
          onComplete: () => {
            // Recover (bounce back)
            if (this.monsterSprite.texture.key === 'slime_atk2') {
                this.monsterSprite.setTexture('slime_atk3');
            }
            
            this.tweens.add({
              targets: this.monsterSprite,
              x: originalX, angle: 0,
              duration: 350, ease: 'Bounce.easeOut',
              onComplete: () => {
                  if (this.monsterSprite.texture.key === 'slime_atk3') {
                      this.monsterSprite.setTexture('slime');
                  }
              }
            });
          }
        });
      }
    });

    // 2. Claw VFX & Player recoil
    this.time.delayedCall(250, () => {
      // Apply VFX
      this.applyHitstop(60);
      this.spawnHitSpark(this.playerSprite.x, this.playerSprite.y - 60, 0xD8243A);
      this.doScreenFlash(0xff0000, 0.2); // red flash for taking damage

      // Camera shake
      this.cameras.main.shake(200, 0.015);
      this.tweens.add({ targets: this.midLayer, x: 20, duration: 100, yoyo: true });
      this.tweens.add({ targets: this.groundLayer, x: 40, duration: 100, yoyo: true });

      // Player Recoil (Squash horizontally, fall back)
      const playerStartX = this.playerSprite.x;
      this.playerSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL); // Flash white
      this.time.delayedCall(50, () => this.playerSprite.clearTint());

      this.tweens.add({
        targets: this.playerSprite,
        x: playerStartX - 60, scaleX: 0.26, scaleY: 0.18, angle: -15,
        duration: 100, yoyo: true, ease: 'Sine.easeOut',
        onComplete: () => {
          this.playerSprite.setAngle(0);
          this.playerSprite.setScale(0.22);
        }
      });

      // Orange Claw Rake (Triple streak)
      for(let i=0; i<3; i++) {
        const scratch = this.add.ellipse(this.playerSprite.x + (i*15 - 15), this.playerSprite.y - 60, 10, 100, 0xD8243A);
        scratch.setAngle(-45 + (i*10 - 10));
        scratch.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: scratch,
          scaleX: 6,
          scaleY: 1.2,
          alpha: { from: 1, to: 0 },
          duration: 250 + i*50,
          ease: 'Cubic.easeOut',
          onComplete: () => scratch.destroy()
        });
      }
      
      // Screen Shake + parallax bump is already handled above
    });
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  // --- VFX Helpers ---
  applyHitstop(duration) {
    if (!this.sys || !this.sys.game || !this.scene.isActive()) return;
    this.time.timeScale = 0.05; // near freeze
    setTimeout(() => {
      if (this.sys && this.sys.game && this.scene.isActive()) {
        this.time.timeScale = 1.0;
      }
    }, duration);
  }

  spawnHitSpark(x, y, color) {
    // Shards
    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const rad = Phaser.Math.DegToRad(angle);
      const dist = Phaser.Math.Between(20, 60);
      const shard = this.add.rectangle(x, y, 15, 3, color);
      shard.setRotation(rad);
      shard.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(rad) * dist,
        y: y + Math.sin(rad) * dist,
        scaleX: 0.1,
        alpha: 0,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    // Ring
    const ring = this.add.ellipse(x, y, 60, 60);
    ring.setStrokeStyle(4, color);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setScale(0.3);
    this.tweens.add({
      targets: ring,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  doScreenFlash(color, alpha = 0.35) {
    const flash = this.add.rectangle(0, 0, this.scale.width * 2, this.scale.height * 2, color);
    flash.setAlpha(alpha);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy()
    });
  }

  doCameraPunch() {
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.02,
      duration: 60,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  playDeathSequence(isPlayer) {
    const targetSprite = isPlayer ? this.playerSprite : this.monsterSprite;
    if (!targetSprite) return;

    // Slowmo
    this.time.timeScale = 0.35;
    setTimeout(() => {
      if (this.sys && this.sys.game && this.scene.isActive()) {
        this.time.timeScale = 1.0;
      }
    }, 250);

    // Big Burst
    this.spawnHitSpark(targetSprite.x, targetSprite.y - 60, 0xFFFFFF);
    for (let i = 0; i < 20; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const rad = Phaser.Math.DegToRad(angle);
      const dist = Phaser.Math.Between(40, 100);
      const shard = this.add.rectangle(targetSprite.x, targetSprite.y - 60, 20, 4, isPlayer ? 0xCAD0D7 : 0xD8243A);
      shard.setRotation(rad);
      shard.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: shard,
        x: targetSprite.x + Math.cos(rad) * dist,
        y: targetSprite.y - 60 + Math.sin(rad) * dist,
        scaleX: 0.1,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    // Dissolve into embers
    this.tweens.add({
      targets: targetSprite,
      alpha: 0,
      y: targetSprite.y - 50,
      duration: 800,
      ease: 'Sine.easeOut'
    });

    // Rising Embers
    for (let i = 0; i < 15; i++) {
      const ember = this.add.rectangle(
        targetSprite.x + Phaser.Math.Between(-30, 30), 
        targetSprite.y + Phaser.Math.Between(-80, 0), 
        4, 4, 0xFF6600
      );
      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(100, 200),
        x: ember.x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Sine.easeOut',
        onComplete: () => ember.destroy()
      });
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
