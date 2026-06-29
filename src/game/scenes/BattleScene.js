import Phaser from 'phaser';
import useGameStore from '@/store/gameStore';
import { CharacterLoader } from '@/game/systems/CharacterLoader';
import { HERO_REGISTRY, MONSTER_REGISTRY, AVAILABLE_HEROES } from '@/game/data/characterRegistry';
import { getMonsterForFloor } from '@/game/systems/MonsterDB';

// ─── TIMING CONSTANTS ─────────────────────────────────────────────
// All battle animation delays are defined here for easy tuning.
const TIMING = {
  FIGHTER_RUN:     450,   // ms to run toward target
  FIGHTER_IMPACT:  750,   // ms impact VFX delay after reaching target
  DRAGON_IMPACT:  1100,   // ms impact VFX delay for dragon (longer animation)
  FIGHTER_RETURN:  400,   // ms to run back to original position
  DEATH_BUFFER:    500,   // ms extra buffer after impact before death sequence
};

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    const gameStore = useGameStore.getState();
    const floorId = gameStore.currentFloor || 1;
    this.floorId = floorId;

    // --- Audio ---
    // Audio is now preloaded and started in BootScene to avoid delay during character loading.

    // --- Background assets ---
    const bgBase = '/assets/background/Autumn Forest 2D Pixel Art';
    this.load.image('bg_layer1', `${bgBase}/Background/3.png`);
    this.load.image('bg_layer2', `${bgBase}/Background/2.png`);
    this.load.image('bg_layer3', `${bgBase}/Background/1.png`);
    this.load.image('ground_block', `${bgBase}/Tileset/last_ground_block.png`);
    this.load.image('autumn_trees', `${bgBase}/Trees/Trees_2.png`);
    this.load.spritesheet('autumn_flag', `${bgBase}/Props/Flag.png`, { frameWidth: 29, frameHeight: 64 });

    // --- Character assets ---
    const heroId          = gameStore.currentHeroId || 'demon_samurai';
    const heroConfig      = HERO_REGISTRY[heroId] || HERO_REGISTRY['demon_samurai'];
    
    // In PvP, currentMonster might be set, otherwise use the floor's monster
    const monsterData     = gameStore.gameMode === 'pvp' && gameStore.currentMonster 
                              ? gameStore.currentMonster 
                              : getMonsterForFloor(floorId);
                              
    const monsterSpriteId = monsterData.spriteId;
    const monsterConfig   = MONSTER_REGISTRY[monsterSpriteId] ?? MONSTER_REGISTRY['dragon'];

    CharacterLoader.preload(this, heroConfig);
    if (gameStore.gameMode !== 'pvp') {
      CharacterLoader.preload(this, monsterConfig);
    } else {
      AVAILABLE_HEROES.forEach(hero => {
        CharacterLoader.preload(this, HERO_REGISTRY[hero.id]);
      });
    }

    // Store monster config to be used in create()
    this._heroConfig    = heroConfig;
    this._monsterConfig = monsterConfig;
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // --- BGM References ---
    // BGM was already started in BootScene. We just grab the references so we can control them later.
    this.bgmIntro = this.sound.getAll(`bgm_intro_${this.floorId}`)[0];
    this.bgmLoop  = this.sound.getAll(`bgm_loop_${this.floorId}`)[0];

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
    if (gameMode !== 'pvp') {
      CharacterLoader.setupAnimations(this, this._monsterConfig);
    } else {
      AVAILABLE_HEROES.forEach(hero => {
        CharacterLoader.setupAnimations(this, HERO_REGISTRY[hero.id]);
      });
    }

    // --- Player sprite (left) ---
    this.playerSprite = CharacterLoader.createSprite(
      this, this._heroConfig,
      w * 0.25, groundY,
      { flipX: false, bgScale: 1 }
    );

    // --- Monster / opponent sprite (right) ---
    if (gameMode === 'pvp') {
      const oppHeroId = gameStore.mpOpponentHeroId || 'demon_samurai';
      const oppHeroConfig = HERO_REGISTRY[oppHeroId] || HERO_REGISTRY['demon_samurai'];
      
      CharacterLoader.setupAnimations(this, oppHeroConfig);

      this.monsterSprite = CharacterLoader.createSprite(
        this, oppHeroConfig,
        w * 0.75, groundY,
        { flipX: true, bgScale: 1 }
      );
      if (gameStore.currentHeroId === oppHeroId) {
        if (gameStore.isHost) {
          this.monsterSprite.setTint(0xff7777);
        } else {
          this.playerSprite.setTint(0xff7777);
        }
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
        const isLethal = action.data?.targetHp === 0;
        this.playPlayerAttack(isLethal);
      } else if (action.type === 'monster_attack') {
        const isLethal = action.data?.targetHp === 0;
        this.playMonsterAttack(isLethal);
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
  playPlayerAttack(isLethal = false) {
    try {
      if (!this.sys?.game || !this.scene.isActive()) return;

      this.playerSprite.setDepth(10);
      this.monsterSprite.setDepth(5);
      const originalX = this.playerSprite.x;

      const doImpact = (delay) => {
        this.time.delayedCall(delay, () => {
          this.sound.play('sfx_hit', { volume: 0.5 });
          this.applyHitstop(60);

          // Custom projectile hit VFX
          if (this.playerSprite.hasArrow) {
            const hitSprite = this.add.sprite(this.monsterSprite.x, this.monsterSprite.y - 40, `${this.playerSprite.charId}_arrow_hit`);
            hitSprite.setScale(this.playerSprite.baseScaleX * 1.5);
            hitSprite.play(`${this.playerSprite.charId}_arrow_hit`);
            hitSprite.once('animationcomplete', () => hitSprite.destroy());
          } else {
            // Default melee hit VFX
            this.spawnHitSpark(this.monsterSprite.x, this.monsterSprite.y - 60, 0xCAD0D7);
            const slash = this.add.ellipse(this.monsterSprite.x, this.monsterSprite.y - 60, 20, 150, 0x4A6FD4);
            slash.setAngle(45).setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
              targets: slash,
              scaleX: 6, scaleY: 1.5,
              alpha: { from: 1, to: 0 },
              duration: 300, ease: 'Cubic.easeOut',
              onComplete: () => slash.destroy(),
            });
          }

          this.doScreenFlash(0xffffff, 0.35);

          // Monster hit reaction
          const monsterAnims = CharacterLoader.getAnimSet(this.monsterSprite);
          
          this.tweens.killTweensOf(this.monsterSprite);
          this.tweens.add({
            targets: this.monsterSprite,
            x: this.monsterSprite.baseX,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.monsterSprite.flipX = this.monsterSprite.baseFlipX;
            }
          });

          this.playSpriteAnim(this.monsterSprite, monsterAnims.hurt, () => {
            const cur = this.monsterSprite.anims.currentAnim?.key;
            if (cur !== monsterAnims.death && !isLethal) {
              this.playSpriteAnim(this.monsterSprite, monsterAnims.idle);
            }
          });

          if (isLethal) {
            this.time.delayedCall(TIMING.DEATH_BUFFER, () => this.playDeathSequence(false));
          }
        });
      };

      const atkAnim = CharacterLoader.getNextAttackAnim(this.playerSprite);

      if (this.playerSprite.isRanged) {
        // RANGED ATTACK: shoot in place
        this.playSpriteAnim(this.playerSprite, atkAnim, () => {
          this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_idle`);
        });

        if (this.playerSprite.hasArrow) {
          const arrow = this.add.image(this.playerSprite.x + 40, this.playerSprite.y - 40, `${this.playerSprite.charId}_arrow`);
          arrow.setScale(this.playerSprite.baseScaleX);
          this.tweens.add({
            targets: arrow,
            x: this.monsterSprite.x - 20,
            duration: 250,
            ease: 'Linear',
            onComplete: () => {
              arrow.destroy();
              doImpact(0); // apply immediately since the arrow arrived
            }
          });
        } else {
          doImpact(300); // generic ranged delay
        }
      } else {
        // MELEE ATTACK: run toward target
        this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_run`);
        this.tweens.add({
          targets: this.playerSprite,
          x: this.monsterSprite.x - 120,
          duration: TIMING.FIGHTER_RUN,
          ease: 'Linear',
          onComplete: () => {
            this.playSpriteAnim(this.playerSprite, atkAnim, () => {
              this.playerSprite.flipX = !this.playerSprite.baseFlipX;
              this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_run`);
              this.tweens.add({
                targets: this.playerSprite,
                x: originalX, angle: 0,
                duration: 500, ease: 'Sine.easeOut',
                onComplete: () => {
                  this.playerSprite.flipX = this.playerSprite.baseFlipX;
                  this.playSpriteAnim(this.playerSprite, `${this.playerSprite.charId}_idle`);
                },
              });
            });
            doImpact(TIMING.FIGHTER_IMPACT);
          },
        });
      }
    } catch (e) {
      // Ignore errors from destroyed scenes during Fast Refresh
    }
  }

  // ─── MONSTER ATTACK ──────────────────────────────────────────────
  playMonsterAttack(isLethal = false) {
    try {
      if (!this.sys?.game || !this.scene.isActive()) return;
      this.sound.play('sfx_miss', { volume: 0.5 });

      this.monsterSprite.setDepth(10);
      this.playerSprite.setDepth(5);
      const originalX   = this.monsterSprite.x;
      const monsterAnims = CharacterLoader.getAnimSet(this.monsterSprite);

      const doImpact = (delay) => {
        this.time.delayedCall(delay, () => {
          this.applyHitstop(60);
          this.spawnHitSpark(this.playerSprite.x, this.playerSprite.y - 60, 0xD8243A);
          this.doScreenFlash(0xff0000, 0.2);

          // Player hit reaction
          const playerAnims = CharacterLoader.getAnimSet(this.playerSprite);
          
          this.tweens.killTweensOf(this.playerSprite);
          this.tweens.add({
            targets: this.playerSprite,
            x: this.playerSprite.baseX,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.playerSprite.flipX = this.playerSprite.baseFlipX;
            }
          });

          this.playSpriteAnim(this.playerSprite, playerAnims.hurt, () => {
            const cur = this.playerSprite.anims.currentAnim?.key;
            if (cur !== playerAnims.death && !isLethal) {
              this.playSpriteAnim(this.playerSprite, playerAnims.idle);
            }
          });

          if (isLethal) {
            this.time.delayedCall(TIMING.DEATH_BUFFER, () => this.playDeathSequence(true));
          }

          // Claw Rake VFX
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
      };

      const atkAnim = CharacterLoader.getNextAttackAnim(this.monsterSprite);
      
      const isMonsterDragon = this.monsterSprite.charId === 'dragon';
      const baseDelay = isMonsterDragon ? TIMING.DRAGON_IMPACT : TIMING.FIGHTER_IMPACT;

      if (this.monsterSprite.isRanged) {
        // RANGED ATTACK: attack in place
        this.playSpriteAnim(this.monsterSprite, atkAnim, () => {
          this.playSpriteAnim(this.monsterSprite, monsterAnims.idle);
        });
        doImpact(isMonsterDragon ? TIMING.DRAGON_IMPACT : 300);
      } else {
        // MELEE ATTACK: run toward player
        this.playSpriteAnim(this.monsterSprite, monsterAnims.run);
        this.tweens.add({
          targets: this.monsterSprite,
          x: this.playerSprite.x + (this.scale.width * 0.15),
          duration: 500, ease: 'Sine.easeIn',
          onComplete: () => {
            this.playSpriteAnim(this.monsterSprite, atkAnim, () => {
              this.monsterSprite.flipX = !this.monsterSprite.baseFlipX;
              this.playSpriteAnim(this.monsterSprite, monsterAnims.run);
              this.tweens.add({
                targets: this.monsterSprite,
                x: originalX, angle: 0,
                duration: 500, ease: 'Sine.easeOut',
                onComplete: () => {
                  this.monsterSprite.flipX = this.monsterSprite.baseFlipX;
                  this.playSpriteAnim(this.monsterSprite, monsterAnims.idle);
                },
              });
            });
            doImpact(baseDelay);
          },
        });
      }
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
    // console.log(`[BattleScene] playDeathSequence(isPlayer=${isPlayer}). Playing death animation: ${deadAnims.death} on ${dead.charId}`);
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
      winnerSprite.flipX = winnerSprite.baseFlipX; // face the center of the arena
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
      winnerSprite.flipX = !winnerSprite.baseFlipX;
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
