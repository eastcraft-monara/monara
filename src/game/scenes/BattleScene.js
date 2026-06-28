import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';
import { CharacterLoader } from '@/game/systems/CharacterLoader';
import { HERO_REGISTRY, MONSTER_REGISTRY } from '@/game/data/characterRegistry';

// ─── TIMING CONSTANTS ─────────────────────────────────────────────
// All battle animation delays are defined here for easy tuning.
const TIMING = {
  FIGHTER_RUN:     450,   // ms to run toward target
  FIGHTER_IMPACT:  750,   // ms impact VFX delay after reaching target
  DRAGON_IMPACT:  1100,   // ms impact VFX delay for dragon (longer animation)
  FIGHTER_RETURN:  400,   // ms to run back to original position
  DEATH_BUFFER:    100,   // ms extra buffer after impact before death sequence
};

// Current hero character used by the player
const CURRENT_HERO = 'demon_samurai';

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    const gameStore = useGameStore.getState();
    const floorId = gameStore.currentFloor || 1;
    this.floorId = floorId;

    // --- Audio ---
    const zoneStr = String(floorId).padStart(3, '0');
    const bgmName = `rpg_bs${zoneStr}`;
    const bgmPath = `/assets/audio/Battle/${bgmName}`;

    this.load.audio(`bgm_intro_${floorId}`, `${bgmPath}/unityloop/${bgmName}-intro.ogg`);
    this.load.audio(`bgm_loop_${floorId}`, `${bgmPath}/${bgmName}.ogg`);
    this.load.audio(`bgm_victory_${floorId}`, `${bgmPath}/unityloop/${bgmName}-loop.ogg`);

    this.load.audio('sfx_hit', '/assets/audio/hit.wav');
    this.load.audio('sfx_miss', '/assets/audio/miss.wav');

    // --- Background assets ---
    this.load.image('bg_layer1', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/3.png');
    this.load.image('bg_layer2', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/2.png');
    this.load.image('bg_layer3', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Background/1.png');
    this.load.image('ground_block', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Tileset/last_ground_block.png');
    this.load.image('autumn_trees', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Trees/Trees_2.png');
    this.load.spritesheet('autumn_flag', '/assets/character/hero/Autumn Forest 2D Pixel Art/Autumn Forest 2D Pixel Art/Props/Flag.png', { frameWidth: 29, frameHeight: 64 });

    // --- Character assets ---
    const heroConfig      = HERO_REGISTRY[CURRENT_HERO];
    const monsterSpriteId = gameStore.currentMonster?.spriteId ?? 'dragon';
    const monsterConfig   = MONSTER_REGISTRY[monsterSpriteId] ?? MONSTER_REGISTRY['dragon'];

    CharacterLoader.preload(this, heroConfig);
    CharacterLoader.preload(this, monsterConfig);

    // Store monster config to be used in create()
    this._heroConfig    = heroConfig;
    this._monsterConfig = monsterConfig;
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // --- Start BGM ---
    this.sound.stopAll(); // Stop any previous music

    this.bgmIntro = this.sound.add(`bgm_intro_${this.floorId}`, { loop: true, volume: 0.3 });
    this.bgmLoop  = this.sound.add(`bgm_loop_${this.floorId}`, { loop: true, volume: 0.3 });
    
    // Check initial battle state
    if (useGameStore.getState().battleState === 'active') {
      this.bgmLoop.play();
    } else {
      this.bgmIntro.play();
    }

    const w = this.scale.width;
    const h = this.scale.height;

    // --- Post-Processing ---
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.4);
      this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 0.8, 1.2);
      const colorMatrix = this.cameras.main.postFX.addColorMatrix();
      colorMatrix.contrast(1.2);
      colorMatrix.saturation(1.1);
    }

    // --- Background layers ---
    this.skyLayer    = this.add.container();
    this.midLayer    = this.add.container();
    this.groundLayer = this.add.container();

    const bgScale = Math.max(w / 480, h / 270);

    this.skyFill = this.add.rectangle(0, 0, w, h, 0x92a1b9).setOrigin(0, 0);
    this.skyLayer.add(this.skyFill);

    this.bgLayer1 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer1').setOrigin(0.5, 1).setScale(bgScale);
    this.bgLayer2 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer2').setOrigin(0.5, 1).setScale(bgScale);
    this.bgLayer3 = this.add.tileSprite(w/2, h, w / bgScale, 180, 'bg_layer3').setOrigin(0.5, 1).setScale(bgScale);

    this.skyLayer.add(this.bgLayer1);
    this.midLayer.add(this.bgLayer2);
    this.groundLayer.add(this.bgLayer3);

    // --- Ground & Trees ---
    const groundTopY = h - (25 * bgScale);
    const trees = this.add.image(0, groundTopY + (4 * bgScale), 'autumn_trees').setOrigin(0, 1).setScale(bgScale);
    this.groundLayer.add(trees);

    // --- Flag animation ---
    if (!this.anims.exists('flag_wave')) {
      this.anims.create({
        key: 'flag_wave',
        frames: this.anims.generateFrameNumbers('autumn_flag', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    const flag = this.add.sprite(w * 0.85, groundTopY + (2 * bgScale), 'autumn_flag').setOrigin(0.5, 1).setScale(bgScale);
    flag.play('flag_wave');
    this.groundLayer.add(flag);

    const ground = this.add.tileSprite(w/2, groundTopY, w / bgScale, 128, 'ground_block').setOrigin(0.5, 0).setScale(bgScale);
    this.groundLayer.add(ground);

    // --- Ambient embers ---
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
        },
      });
    }

    const groundY   = groundTopY + (35 * bgScale);
    const gameStore = useGameStore.getState();
    const gameMode  = gameStore.gameMode;

    // --- Contact shadows ---
    this.playerShadow  = this.add.ellipse(w * 0.25, groundY, 45 * bgScale, 8 * bgScale, 0x000000, 0.7);
    this.monsterShadow = this.add.ellipse(w * 0.75, groundY, 110 * bgScale, 12 * bgScale, 0x000000, 0.7);

    // --- Setup animations ---
    CharacterLoader.setupAnimations(this, this._heroConfig);
    CharacterLoader.setupAnimations(this, this._monsterConfig);

    // --- Player sprite (left) ---
    this.playerSprite = CharacterLoader.createSprite(
      this, this._heroConfig,
      w * 0.25, groundY,
      { flipX: false, bgScale: 1, yOffset: 30 }
    );

    // --- Monster / opponent sprite (right) ---
    if (gameMode === 'pvp') {
      this.monsterSprite = CharacterLoader.createSprite(
        this, this._heroConfig,
        w * 0.75, groundY,
        { flipX: true, bgScale: 1, yOffset: 30 }
      );
      if (gameStore.isHost) {
        this.monsterSprite.setTint(0xff7777);
      } else {
        this.playerSprite.setTint(0xff7777);
      }
    } else {
      this.monsterSprite = CharacterLoader.createSprite(
        this, this._monsterConfig,
        w * 0.75, groundY,
        { flipX: false, bgScale }
      );
    }

    // --- Subscribe to game store actions ---
    this.unsubscribe = useGameStore.subscribe((state, prevState) => {
      // 1. Handle battle state transition (e.g. model finished loading)
      if (state.battleState === 'active' && prevState.battleState !== 'active') {
        if (this.bgmIntro && this.bgmIntro.isPlaying) {
          this.bgmIntro.stop();
        }
        if (this.bgmLoop && !this.bgmLoop.isPlaying) {
          this.bgmLoop.play();
        }
      }

      // 2. Handle battle actions
      const action = state.lastAction;
      if (!action) return;
      if (prevState?.lastAction?.timestamp === action.timestamp) return;

      if (action.type === 'player_attack') {
        this.playPlayerAttack();
        if (action.data?.targetHp === 0) {
          const delay = TIMING.FIGHTER_RUN + TIMING.FIGHTER_IMPACT + TIMING.DEATH_BUFFER;
          this.time.delayedCall(delay, () => this.playDeathSequence(false));
        }
      } else if (action.type === 'monster_attack') {
        this.playMonsterAttack();
        if (action.data?.targetHp === 0) {
          const isMonsterDragon = this.monsterSprite?.charId === 'dragon';
          const hitDelay = isMonsterDragon ? TIMING.DRAGON_IMPACT : TIMING.FIGHTER_IMPACT;
          this.time.delayedCall(hitDelay + TIMING.DEATH_BUFFER, () => this.playDeathSequence(true));
        }
      } else if (action.type === 'reset_match') {
        this.scene.restart();
      }
    });

    this.events.once('shutdown', () => { if (this.unsubscribe) this.unsubscribe(); });
    this.sys.game.events.once('destroy', () => { if (this.unsubscribe) this.unsubscribe(); });
  }

  // ─── HELPER: Safe animation play with listener cleanup ──────────
  /**
   * Play an animation on a sprite safely — old listeners are always
   * cleaned up before registering new ones, preventing the
   * "idle after death" bug.
   */
  playSpriteAnim(sprite, animKey, onComplete = null) {
    sprite.off('animationcomplete');
    sprite.play(animKey);
    if (onComplete) sprite.once('animationcomplete', onComplete);
  }

  // ─── PLAYER ATTACK ───────────────────────────────────────────────
  playPlayerAttack() {
    try {
      if (!this.sys?.game || !this.scene.isActive()) return;

      this.playerSprite.setDepth(10);
      this.monsterSprite.setDepth(5);
      const originalX = this.playerSprite.x;

      // 1. Run toward target
      this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_run`);
      this.tweens.add({
        targets: this.playerSprite,
        x: this.monsterSprite.x - 120,
        duration: TIMING.FIGHTER_RUN,
        ease: 'Linear',
        onComplete: () => {
          // 2. Attack (cycling)
          const atkAnim = CharacterLoader.getNextAttackAnim(this.playerSprite);
          this.playSpriteAnim(this.playerSprite, atkAnim, () => {
            // 3. Run back
            this.playerSprite.flipX = true;
            this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_run`);
            this.tweens.add({
              targets: this.playerSprite,
              x: originalX,
              duration: TIMING.FIGHTER_RETURN,
              ease: 'Linear',
              onComplete: () => {
                this.playerSprite.flipX = false;
                this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_idle`);
              },
            });
          });

          // 4. Impact VFX (delayed to sync with animation frame)
          this.time.delayedCall(TIMING.FIGHTER_IMPACT, () => {
            this.sound.play('sfx_hit', { volume: 0.5 });
            this.applyHitstop(60);
            this.spawnHitSpark(this.monsterSprite.x, this.monsterSprite.y - 60, 0xCAD0D7);
            this.doScreenFlash(0xffffff, 0.35);

            // 5. Monster hit reaction
            const monsterAnims = CharacterLoader.getAnimSet(this.monsterSprite);
            this.playSpriteAnim(this.monsterSprite, monsterAnims.hurt, () => {
              // Jangan kembali idle jika sudah di state death
              const cur = this.monsterSprite.anims.currentAnim?.key;
              if (cur !== monsterAnims.death) {
                this.playSpriteAnim(this.monsterSprite, monsterAnims.idle);
              }
            });

            // 6. Slash VFX
            const slash = this.add.ellipse(this.monsterSprite.x, this.monsterSprite.y - 60, 20, 150, 0x4A6FD4);
            slash.setAngle(45).setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: slash,
              scaleX: 6, scaleY: 1.5,
              alpha: { from: 1, to: 0 },
              duration: 300, ease: 'Cubic.easeOut',
              onComplete: () => slash.destroy(),
            });
          });
        },
      });
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  // ─── MONSTER ATTACK ──────────────────────────────────────────────
  playMonsterAttack() {
    try {
      if (!this.sys?.game || !this.scene.isActive()) return;
      this.sound.play('sfx_miss', { volume: 0.5 });

      this.monsterSprite.setDepth(10);
      this.playerSprite.setDepth(5);
      const originalX   = this.monsterSprite.x;
      const monsterAnims = CharacterLoader.getAnimSet(this.monsterSprite);

      // 1. Run toward player
      this.playSpriteAnim(this.monsterSprite, monsterAnims.run);
      this.tweens.add({
        targets: this.monsterSprite,
        x: this.playerSprite.x + (this.scale.width * 0.15),
        duration: 500, ease: 'Sine.easeIn',
        onComplete: () => {
          // 2. Attack (cycling)
          const atkAnim = CharacterLoader.getNextAttackAnim(this.monsterSprite);
          this.playSpriteAnim(this.monsterSprite, atkAnim, () => {
            // 3. Run back
            this.monsterSprite.flipX = true;
            this.playSpriteAnim(this.monsterSprite, monsterAnims.run);
            this.tweens.add({
              targets: this.monsterSprite,
              x: originalX, angle: 0,
              duration: 500, ease: 'Sine.easeOut',
              onComplete: () => {
                this.monsterSprite.flipX = false;
                this.playSpriteAnim(this.monsterSprite, monsterAnims.idle);
              },
            });
          });
        },
      });

      // 4. Impact VFX (delay based on monster type)
      const isMonsterDragon = this.monsterSprite.charId === 'dragon';
      const hitDelay = isMonsterDragon ? TIMING.DRAGON_IMPACT : TIMING.FIGHTER_IMPACT;

      this.time.delayedCall(hitDelay, () => {
        this.applyHitstop(60);
        this.spawnHitSpark(this.playerSprite.x, this.playerSprite.y - 60, 0xD8243A);
        this.doScreenFlash(0xff0000, 0.2);

        // 5. Player hit reaction
        const playerAnims = CharacterLoader.getAnimSet(this.playerSprite);
        this.playSpriteAnim(this.playerSprite, playerAnims.hurt, () => {
          const cur = this.playerSprite.anims.currentAnim?.key;
          if (cur !== playerAnims.death) {
            this.playSpriteAnim(this.playerSprite, playerAnims.idle);
          }
        });

        // 6. Claw Rake VFX
        for (let i = 0; i < 3; i++) {
          const scratch = this.add.ellipse(
            this.playerSprite.x + (i * 15 - 15),
            this.playerSprite.y - 60, 10, 100, 0xD8243A
          );
          scratch.setAngle(-45 + (i * 10 - 10)).setBlendMode(Phaser.BlendModes.ADD);
          this.tweens.add({
            targets: scratch,
            scaleX: 6, scaleY: 1.2,
            alpha: { from: 1, to: 0 },
            duration: 250 + i * 50, ease: 'Cubic.easeOut',
            onComplete: () => scratch.destroy(),
          });
        }
      });
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  // ─── DEATH SEQUENCE ──────────────────────────────────────────────
  playDeathSequence(isPlayer) {
    const dead   = isPlayer ? this.playerSprite  : this.monsterSprite;
    const winner = isPlayer ? this.monsterSprite : this.playerSprite;
    if (!dead?.play) return;

    const deadAnims = CharacterLoader.getAnimSet(dead);
    this.playSpriteAnim(dead, deadAnims.death);
    this.playVictorySequence(winner);
  }

  // ─── VICTORY SEQUENCE ────────────────────────────────────────────
  playVictorySequence(winnerSprite) {
    if (!winnerSprite?.play) return;

    // Kill all active tweens on the winner
    this.tweens.killTweensOf(winnerSprite);

    // --- Switch BGM to Victory Loop ---
    if (this.bgmIntro) this.bgmIntro.stop();
    if (this.bgmLoop) this.bgmLoop.stop();
    
    // Check if bgm_victory is not already playing to prevent overlap if called multiple times
    const victoryBgmKey = `bgm_victory_${this.floorId}`;
    const victoryBgm = this.sound.get(victoryBgmKey);
    if (!victoryBgm || !victoryBgm.isPlaying) {
      this.sound.play(victoryBgmKey, { loop: true, volume: 0.3 });
    }

    const isPlayer  = (winnerSprite === this.playerSprite);
    const w         = this.scale.width;
    const originalX = isPlayer ? w * 0.25 : w * 0.75;
    const winAnims  = CharacterLoader.getAnimSet(winnerSprite);

    const startCelebration = () => {
      winnerSprite.flipX = !isPlayer; // face the center of the arena
      winnerSprite.off('animationcomplete');
      
      if (winAnims.shout) {
        // If character has SHOUT, play it (it loops automatically based on setup)
        this.playSpriteAnim(winnerSprite, winAnims.shout);
      } else {
        // Fallback: cycle through attack animations
        this.playSpriteAnim(winnerSprite, winAnims.attack1);
        winnerSprite.on('animationcomplete', (anim) => {
          if (winAnims.attacks.includes(anim.key)) {
            const nextAtk = CharacterLoader.getNextAttackAnim(winnerSprite);
            winnerSprite.play(nextAtk);
          }
        });
      }
    };

    if (Math.abs(winnerSprite.x - originalX) > 10) {
      // Run back to original position first
      this.playSpriteAnim(winnerSprite, winAnims.run);
      winnerSprite.flipX = winnerSprite.x > originalX;
      this.tweens.add({
        targets: winnerSprite,
        x: originalX,
        duration: TIMING.FIGHTER_RETURN,
        ease: 'Linear',
        onComplete: startCelebration,
      });
    } else {
      startCelebration();
    }
  }

  // ─── VFX HELPERS ─────────────────────────────────────────────────
  applyHitstop(duration) {
    if (!this.sys?.game || !this.scene.isActive()) return;
    this.time.timeScale = 0.05;
    setTimeout(() => {
      if (this.sys?.game && this.scene.isActive()) {
        this.time.timeScale = 1.0;
      }
    }, duration);
  }

  spawnHitSpark(x, y, color) {
    // Shards
    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const rad   = Phaser.Math.DegToRad(angle);
      const dist  = Phaser.Math.Between(20, 60);
      const shard = this.add.rectangle(x, y, 15, 3, color);
      shard.setRotation(rad).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(rad) * dist,
        y: y + Math.sin(rad) * dist,
        scaleX: 0.1, alpha: 0,
        duration: 250, ease: 'Quad.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
    // Ring
    const ring = this.add.ellipse(x, y, 60, 60);
    ring.setStrokeStyle(4, color).setBlendMode(Phaser.BlendModes.ADD).setScale(0.3);
    this.tweens.add({
      targets: ring,
      scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 400, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  doScreenFlash(color, alpha = 0.35) {
    const flash = this.add.rectangle(0, 0, this.scale.width * 2, this.scale.height * 2, color);
    flash.setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  doCameraPunch() {
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.02, duration: 60, yoyo: true, ease: 'Sine.easeInOut',
    });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
