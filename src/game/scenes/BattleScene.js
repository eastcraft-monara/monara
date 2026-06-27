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
      this.load.image('skeleton', '/assets/sprites/skeleton/skeleton.png');
      this.load.image('skeleton_atk1', '/assets/sprites/skeleton/skeleton-attack-1.png');
      this.load.image('skeleton_atk2', '/assets/sprites/skeleton/skeleton-attack-2.png');
      this.load.image('skeleton_atk3', '/assets/sprites/skeleton/skeleton-attack-3.png');
      this.load.image('bat', '/assets/sprites/bat/bat.png');
      this.load.image('bat_atk1', '/assets/sprites/bat/bat-attack-1.png');
      this.load.image('bat_atk2', '/assets/sprites/bat/bat-attack-2.png');
      this.load.image('bat_atk3', '/assets/sprites/bat/bat-attack-3.png');
      this.load.image('imp', '/assets/sprites/imp/imp.png');
      this.load.image('imp_atk1', '/assets/sprites/imp/imp-attack-1.png');
      this.load.image('imp_atk2', '/assets/sprites/imp/imp-attack-2.png');
      this.load.image('imp_atk3', '/assets/sprites/imp/imp-attack-3.png');
      this.load.image('king', '/assets/sprites/king-imp/king.png');
      this.load.image('king_atk1', '/assets/sprites/king-imp/king-attack-1.png');
      this.load.image('king_atk2', '/assets/sprites/king-imp/king-attack-2.png');
      this.load.image('king_atk3', '/assets/sprites/king-imp/king-attack-3.png');
      this.load.image('bg_layer1', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/3.png');
      this.load.image('bg_layer2', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/2.png');
      this.load.image('bg_layer3', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/1.png');
      this.load.image('ground_block', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Tileset/last_ground_block.png');
      this.load.image('autumn_trees', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Trees/Trees_2.png');
      this.load.spritesheet('autumn_flag', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Props/Flag.png', { frameWidth: 29, frameHeight: 64 });
      this.load.image('samurai_atk1', '/assets/sprites/samurai/samurai-attack-1.png');
      this.load.image('samurai_atk2', '/assets/sprites/samurai/samurai-attack-2.png');
      this.load.image('samurai_atk3', '/assets/sprites/samurai/samurai-attack-3.png');
      
      // --- Character Assets ---
      this.load.spritesheet('dragon_idle', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/IDLE.png', { frameWidth: 144, frameHeight: 96 });
      this.load.spritesheet('dragon_atk1', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/ATTACK 1.png', { frameWidth: 144, frameHeight: 96 });
      this.load.spritesheet('dragon_atk2', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/ATTACK 2.png', { frameWidth: 144, frameHeight: 96 });
      this.load.spritesheet('dragon_run', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/RUN.png', { frameWidth: 144, frameHeight: 96 });
      this.load.spritesheet('dragon_death', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/DEATH.png', { frameWidth: 144, frameHeight: 96 });
      this.load.spritesheet('dragon_hurt', '/assets/character/monster/Dragon 2D Pixel Art v1.2/Sprites/without_outline/HURT.png', { frameWidth: 144, frameHeight: 96 });
      
      // Fighter Assets (Demon Samurai)
      const dSamuraiPath = '/assets/character/hero/Demon Samurai 2D Pixel Art/Demon Samurai 2D Pixel Art/Sprites';
      this.load.spritesheet('fighter_idle', `${dSamuraiPath}/IDLE (FLAMING SWORD).png`, { frameWidth: 128, frameHeight: 108 });
      this.load.spritesheet('fighter_run', `${dSamuraiPath}/RUN (FLAMING SWORD).png`, { frameWidth: 128, frameHeight: 108 });
      this.load.spritesheet('fighter_atk', `${dSamuraiPath}/ATTACK 1 (FLAMING SWORD).png`, { frameWidth: 128, frameHeight: 108 });
      this.load.spritesheet('fighter_atk2', `${dSamuraiPath}/ATTACK 2 (FLAMING SWORD).png`, { frameWidth: 128, frameHeight: 108 });
      this.load.spritesheet('fighter_death', `${dSamuraiPath}/DEATH.png`, { frameWidth: 128, frameHeight: 108 });
      this.load.spritesheet('fighter_hurt', `${dSamuraiPath}/HURT (FLAMING SWORD).png`, { frameWidth: 128, frameHeight: 108 });
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

    // Calculate a smaller scale (simulating a larger virtual resolution) to prevent it from looking too zoomed in
    const bgScale = Math.max(w / 480, h / 270); // 480x270 virtual resolution baseline

    // Fill the sky gap with the exact sky color from 3.png in case the scaled images don't reach the top
    this.skyFill = this.add.rectangle(0, 0, w, h, 0x92a1b9).setOrigin(0, 0);
    this.skyLayer.add(this.skyFill);

    // Use TileSprite so they can repeat horizontally if the screen is wider than the scaled image
    this.bgLayer1 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer1').setOrigin(0.5, 1).setScale(bgScale);
    this.bgLayer2 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer2').setOrigin(0.5, 1).setScale(bgScale);
    this.bgLayer3 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer3').setOrigin(0.5, 1).setScale(bgScale);
    
    this.skyLayer.add(this.bgLayer1);
    this.midLayer.add(this.bgLayer2);
    this.groundLayer.add(this.bgLayer3);

    // --- Tileset Ground & Trees Layer ---
    
    // Define where the top surface of the grass should be (lower on the screen)
    const groundTopY = h - (25 * bgScale); 

    // Add trees standing on the grass (aligned to the left edge like the preview)
    const trees = this.add.image(0, groundTopY + (4 * bgScale), 'autumn_trees').setOrigin(0, 1).setScale(bgScale);
    this.groundLayer.add(trees);

    // Add animated flag sprite to the right side of the screen
    if (!this.anims.exists('flag_wave')) {
        this.anims.create({
            key: 'flag_wave',
            frames: this.anims.generateFrameNumbers('autumn_flag', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
    }
    const flag = this.add.sprite(w * 0.85, groundTopY + (2 * bgScale), 'autumn_flag').setOrigin(0.5, 1).setScale(bgScale);
    flag.play('flag_wave');
    this.groundLayer.add(flag);

    // Use the entire last land block structure (64x128 pixels) and repeat it horizontally
    const groundHeight = 128; 
    const ground = this.add.tileSprite(w/2, groundTopY, w / bgScale, groundHeight, 'ground_block').setOrigin(0.5, 0).setScale(bgScale);
    this.groundLayer.add(ground);

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
    
    // Position on the ground line (align with the new lower ground)
    const groundY = groundTopY + (35 * bgScale);
    
    // --- Contact Shadows (Phase 2) ---
    this.playerShadow = this.add.ellipse(w * 0.25, groundY, 45 * bgScale, 8 * bgScale, 0x000000, 0.7);
    this.monsterShadow = this.add.ellipse(w * 0.75, groundY, 110 * bgScale, 12 * bgScale, 0x000000, 0.7);

    // Camera Idle Drift removed per request
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
          this.monsterSprite = this.add.sprite(w * 0.75, groundY, 'dragon_idle').setOrigin(0.5, 1).setScale(bgScale * -1, bgScale);
          this.monsterSprite.baseScaleX = bgScale * -1;
          this.monsterSprite.baseScaleY = bgScale;
          // this.monsterSprite.setTint(floorData.color); // Optional: disable tint so the dragon colors are original
          this.monsterSprite.play('monster_idle');
      }
    } else {
      // Create Fighter Animations
      if (!this.anims.exists('f_idle')) {
        this.anims.create({
            key: 'monster_idle',
            frames: this.anims.generateFrameNumbers('dragon_idle'),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'monster_atk1',
            frames: this.anims.generateFrameNumbers('dragon_atk1'),
            frameRate: 12,
            repeat: 0
        });
        this.anims.create({
            key: 'monster_atk2',
            frames: this.anims.generateFrameNumbers('dragon_atk2'),
            frameRate: 12,
            repeat: 0
        });
        this.anims.create({
            key: 'monster_atk3',
            frames: this.anims.generateFrameNumbers('dragon_atk2'),
            frameRate: 12,
            repeat: 0
        });
        this.anims.create({
            key: 'monster_run',
            frames: this.anims.generateFrameNumbers('dragon_run'),
            frameRate: 12,
            repeat: -1
        });
        this.anims.create({
            key: 'monster_death',
            frames: this.anims.generateFrameNumbers('dragon_death'),
            frameRate: 8,
            repeat: 0
        });
        this.anims.create({
            key: 'monster_hurt',
            frames: this.anims.generateFrameNumbers('dragon_hurt'),
            frameRate: 12,
            repeat: 0
        });
        this.anims.create({
            key: 'f_idle',
            frames: this.anims.generateFrameNumbers('fighter_idle'),
            frameRate: 6, repeat: -1
          });
          this.anims.create({
            key: 'f_run',
            frames: this.anims.generateFrameNumbers('fighter_run'),
            frameRate: 14, repeat: -1
          });
          this.anims.create({
            key: 'f_atk',
            frames: this.anims.generateFrameNumbers('fighter_atk'),
            frameRate: 12, repeat: 0
          });
          this.anims.create({
            key: 'f_atk2',
            frames: this.anims.generateFrameNumbers('fighter_atk2'),
            frameRate: 12, repeat: 0
          });
          this.anims.create({
            key: 'f_death',
            frames: this.anims.generateFrameNumbers('fighter_death'),
            frameRate: 12, repeat: 0
          });
          this.anims.create({
            key: 'f_hurt',
            frames: this.anims.generateFrameNumbers('fighter_hurt'),
            frameRate: 12, repeat: 0
          });
      }

      // --- Fighter AI Sprite (Demon Samurai) ---
      const dScale = 2.0; // scale up pixel art
      this.playerSprite = this.add.sprite(w * 0.25, groundY - 30, 'fighter_idle')
        .setOrigin(0.5, 1)
        .setScale(dScale);
      this.playerSprite.baseScaleX = dScale;
      this.playerSprite.baseScaleY = dScale;
      this.playerSprite.play('f_idle');
      
      if (gameMode === 'pvp') {
          this.monsterSprite = this.add.sprite(w * 0.75, groundY - 30, 'fighter_idle')
            .setOrigin(0.5, 1)
            .setScale(dScale);
          this.monsterSprite.flipX = true;
          this.monsterSprite.baseScaleX = dScale;
          this.monsterSprite.baseScaleY = dScale;
          this.monsterSprite.play('f_idle');
          if (gameStore.isHost) {
            this.monsterSprite.setTint(0xff7777); // Red tint for opponent
          } else {
            this.playerSprite.setTint(0xff7777); // Red tint for me (challenger)
          }
      } else {
          // --- Monster AI Sprite (Dragon) ---
          const dragonScaleMultiplier = 1.8;
          this.monsterSprite = this.add.sprite(w * 0.75, groundY, 'dragon_idle')
            .setOrigin(0.5, 1)
            .setScale(bgScale * dragonScaleMultiplier, bgScale * dragonScaleMultiplier);
          this.monsterSprite.baseScaleX = bgScale * dragonScaleMultiplier;
          this.monsterSprite.baseScaleY = bgScale * dragonScaleMultiplier;
          this.monsterSprite.play('monster_idle');
      }
    }

    // Procedural Idle Animations (Breathing) removed since Dragon uses animated spritesheet    // Listen to Zustand store for actions
    this.unsubscribe = useGameStore.subscribe((state, prevState) => {
      const action = state.lastAction;
      if (!action) return;
      
      // Ensure we only trigger when a NEW action comes in
      if (prevState && prevState.lastAction && prevState.lastAction.timestamp === action.timestamp) return;

      if (action.type === 'player_attack') {
        this.playPlayerAttack();
        if (action.data && action.data.targetHp === 0) {
          this.time.delayedCall(1300, () => this.playDeathSequence(false)); // 450ms run + 750ms impact + 100ms
        }
      } else if (action.type === 'monster_attack') {
        this.playMonsterAttack();
        if (action.data && action.data.targetHp === 0) {
          const hitDelay = this.monsterSprite && this.monsterSprite.texture.key.startsWith('dragon') ? 1100 : 250;
          this.time.delayedCall(hitDelay + 100, () => this.playDeathSequence(true));
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

    // 1. Fighter Spritesheet Attack
    this.playerSprite.setDepth(10);
    this.monsterSprite.setDepth(5);
    const originalX = this.playerSprite.x;
    
    // Run towards the monster
    this.playerSprite.play('f_run');
    this.tweens.add({
      targets: this.playerSprite,
      x: this.monsterSprite.x - 120, // Stop just in front
      duration: 450, ease: 'Linear',
      onComplete: () => {
        this.playerSprite.play('f_atk');
        
        this.playerSprite.once('animationcomplete', () => {
            // Run back to original position
            this.playerSprite.flipX = true;
            this.playerSprite.play('f_run');
            this.tweens.add({
                targets: this.playerSprite,
                x: originalX,
                duration: 400, ease: 'Linear',
                onComplete: () => {
                    this.playerSprite.flipX = false;
                    this.playerSprite.play('f_idle');
                }
            });
        });

        // We delay the impact VFX by 750ms so it aligns with the animation frame!
        this.time.delayedCall(750, () => {
            // --- TRIGGER IMPACT VFX ---
        this.sound.play('sfx_hit', { volume: 0.5 });
        this.applyHitstop(60);
        this.spawnHitSpark(this.monsterSprite.x, this.monsterSprite.y - 60, 0xCAD0D7);
        this.doScreenFlash(0xffffff, 0.35);

        // Camera shake removed per request

            const isDragon = this.monsterSprite.texture.key.startsWith('dragon');
            if (isDragon) {
                this.monsterSprite.play('monster_hurt');
                this.monsterSprite.once('animationcomplete', () => {
                    // Make sure it doesn't return to idle if it's dead
                    if (this.monsterSprite.texture.key.startsWith('dragon') && this.monsterSprite.anims.currentAnim && this.monsterSprite.anims.currentAnim.key !== 'monster_death') {
                        this.monsterSprite.play('monster_idle');
                    }
                });
            } else {
                const monsterStartX = this.monsterSprite.x;
                const mScaleX = this.monsterSprite.baseScaleX || this.monsterSprite.scaleX;
                const mScaleY = this.monsterSprite.baseScaleY || this.monsterSprite.scaleY;
                this.monsterSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
                this.time.delayedCall(50, () => this.monsterSprite.clearTint());
                
                this.tweens.add({
                  targets: this.monsterSprite,
                  x: monsterStartX + 60, scaleX: mScaleX * 1.3, scaleY: mScaleY * 0.7, angle: 15,
                  duration: 100, yoyo: true, ease: 'Sine.easeOut',
                  onComplete: () => {
                    this.monsterSprite.setAngle(0);
                    this.monsterSprite.setScale(mScaleX, mScaleY);
                  }
                });
            }
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
    const baseKey = this.monsterSprite.texture.key.split('_')[0];
    if (['slime', 'skeleton', 'bat', 'imp', 'king'].includes(baseKey)) {
        this.monsterSprite.setTexture(`${baseKey}_atk1`);
    }
    
    if (this.monsterSprite.texture.key.startsWith('dragon')) {
      this.monsterSprite.play('monster_run');
      this.tweens.add({
        targets: this.monsterSprite,
        x: this.playerSprite.x + (this.scale.width * 0.15), angle: 0,
        duration: 500, ease: 'Sine.easeIn',
        onComplete: () => {
            this.dragonAttackToggle = !this.dragonAttackToggle;
            const atkAnim = this.dragonAttackToggle ? 'monster_atk1' : 'monster_atk2';
            this.monsterSprite.play(atkAnim);
            this.monsterSprite.once('animationcomplete', () => {
                this.monsterSprite.play('monster_run');
                this.monsterSprite.flipX = true; // Turn around to run back
                this.tweens.add({
                    targets: this.monsterSprite,
                    x: originalX, angle: 0,
                    duration: 500, ease: 'Sine.easeOut',
                    onComplete: () => {
                        this.monsterSprite.flipX = false; // Face the player again
                        this.monsterSprite.play('monster_idle');
                    }
                });
            });
        }
      });
    } else {
      this.tweens.add({
        targets: this.monsterSprite,
        x: originalX + 40, angle: 0,
        duration: 400, ease: 'Sine.easeOut',
        onComplete: () => {
          // Strike (dash forward)
          if (this.monsterSprite.texture.key === `${baseKey}_atk1`) {
              this.monsterSprite.setTexture(`${baseKey}_atk2`);
          }
          
          this.tweens.add({
            targets: this.monsterSprite,
            x: this.playerSprite.x + 100, angle: 0,
            duration: 350, ease: 'Cubic.easeIn',
            onComplete: () => {
              // Recover (bounce back)
              if (this.monsterSprite.texture.key === `${baseKey}_atk2`) {
                  this.monsterSprite.setTexture(`${baseKey}_atk3`);
              }
              
              this.tweens.add({
                targets: this.monsterSprite,
                x: originalX, angle: 0,
                duration: 350, ease: 'Bounce.easeOut',
                onComplete: () => {
                    if (this.monsterSprite.texture.key === `${baseKey}_atk3`) {
                        this.monsterSprite.setTexture(baseKey);
                    }
                }
              });
            }
          });
        }
      });
    }

    // 2. Claw VFX & Player recoil
    const hitDelay = this.monsterSprite.texture.key.startsWith('dragon') ? 1100 : 250;
    this.time.delayedCall(hitDelay, () => {
      // Apply VFX
      this.applyHitstop(60);
      this.spawnHitSpark(this.playerSprite.x, this.playerSprite.y - 60, 0xD8243A);
      this.doScreenFlash(0xff0000, 0.2); // red flash for taking damage

      // Camera shake removed per request

      // Player Recoil (Hurt Animation)
      this.playerSprite.play('f_hurt');
      this.playerSprite.once('animationcomplete', () => {
          if (this.playerSprite.anims.currentAnim && this.playerSprite.anims.currentAnim.key !== 'f_death') {
              this.playerSprite.play('f_idle');
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

  playVictorySequence(winnerSprite) {
    if (!winnerSprite || !winnerSprite.play) return;
    
    // Determine which animations to use
    const isDragon = winnerSprite.texture.key.startsWith('dragon');
    const atk1 = isDragon ? 'monster_atk1' : 'f_atk';
    const atk2 = isDragon ? 'monster_atk2' : 'f_atk2';
    const runAnim = isDragon ? 'monster_run' : 'f_run';
    const idleAnim = isDragon ? 'monster_idle' : 'f_idle';
    
    // Stop any ongoing attack/recoil tweens on the winner
    this.tweens.killTweensOf(winnerSprite);
    
    // Determine original position
    const isPlayer = (winnerSprite === this.playerSprite);
    const w = this.scale.width;
    const originalX = isPlayer ? w * 0.25 : w * 0.75;
    
    const startCelebration = () => {
        winnerSprite.flipX = !isPlayer; // Face center
        let toggle = true;
        winnerSprite.removeAllListeners('animationcomplete');
        winnerSprite.play(atk1);
        
        winnerSprite.on('animationcomplete', (anim) => {
            if (anim.key === atk1 || anim.key === atk2) {
                toggle = !toggle;
                winnerSprite.play(toggle ? atk1 : atk2);
            }
        });
    };

    if (Math.abs(winnerSprite.x - originalX) > 10) {
        // Needs to run back
        winnerSprite.play(runAnim);
        winnerSprite.flipX = winnerSprite.x > originalX; // Face the direction it's running
        this.tweens.add({
            targets: winnerSprite,
            x: originalX,
            duration: 400,
            ease: 'Linear',
            onComplete: startCelebration
        });
    } else {
        // Already at original position
        startCelebration();
    }
  }

  playDeathSequence(isPlayer) {
    const targetSprite = isPlayer ? this.playerSprite : this.monsterSprite;
    if (!targetSprite || !targetSprite.play) return;

    if (targetSprite.texture.key.startsWith('dragon')) {
      targetSprite.play('monster_death');
      this.playVictorySequence(this.playerSprite);
    } else {
      targetSprite.play('f_death');
      this.playVictorySequence(this.monsterSprite);
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
