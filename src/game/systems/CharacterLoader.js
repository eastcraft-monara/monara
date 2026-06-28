/**
 * CHARACTER LOADER
 * ─────────────────────────────────────────────────────────────────
 * Phaser helper to load and initialize characters from
 * characterRegistry.js automatically.
 *
 * Sprite files follow UPPERCASE naming: IDLE.png, RUN.png,
 * ATTACK_1.png, ATTACK_2.png, HURT.png, DEATH.png
 *
 * Usage in BattleScene:
 *   preload()  → CharacterLoader.preload(this, config)
 *   create()   → CharacterLoader.setupAnimations(this, config)
 *              → CharacterLoader.createSprite(this, config, x, y, options)
 *   attack     → CharacterLoader.getNextAttackAnim(sprite)
 * ─────────────────────────────────────────────────────────────────
 */

export class CharacterLoader {

  /**
   * Load all character spritesheets into the Phaser texture cache.
   * Call this inside scene.preload().
   *
   * @param {Phaser.Scene} scene
   * @param {object} config - from characterRegistry
   */
  static preload(scene, config) {
    const { id, basePath, frameWidth, frameHeight, attackCount, hasShout } = config;

    // Base animations that every character must have
    ['IDLE', 'RUN', 'HURT', 'DEATH'].forEach(animKey => {
      const textureKey = `${id}_${animKey.toLowerCase()}`;
      if (!scene.textures.exists(textureKey)) {
        scene.load.spritesheet(
          textureKey,
          `${basePath}/${animKey}.png`,
          { frameWidth, frameHeight }
        );
      }
    });

    // Attack animations: load ATTACK_1, ATTACK_2, ..., ATTACK_N based on attackCount
    for (let i = 1; i <= attackCount; i++) {
      const textureKey = `${id}_attack${i}`;
      if (!scene.textures.exists(textureKey)) {
        scene.load.spritesheet(
          textureKey,
          `${basePath}/ATTACK_${i}.png`,
          { frameWidth, frameHeight }
        );
      }
    }

    // Optional victory shout animation
    if (hasShout) {
      const textureKey = `${id}_shout`;
      if (!scene.textures.exists(textureKey)) {
        scene.load.spritesheet(
          textureKey,
          `${basePath}/SHOUT.png`,
          { frameWidth, frameHeight }
        );
      }
    }
    
    // Optional arrow projectile
    if (config.hasArrow) {
      if (!scene.textures.exists(`${id}_arrow`)) {
        scene.load.image(`${id}_arrow`, `${basePath}/ARROW.png`);
      }
      if (!scene.textures.exists(`${id}_arrow_hit`)) {
        scene.load.spritesheet(`${id}_arrow_hit`, `${basePath}/ARROW_HIT.png`, { frameWidth: 48, frameHeight: 16 });
      }
    }
  }

  /**
   * Register all Phaser animations from a character config.
   * Call this inside scene.create().
   *
   * @param {Phaser.Scene} scene
   * @param {object} config - from characterRegistry
   */
  static setupAnimations(scene, config) {
    const { id, attackCount, hasShout, animFps } = config;

    // Base animations
    [
      ['idle',  animFps.idle,  -1],
      ['run',   animFps.run,   -1],
      ['hurt',  animFps.hurt,   0],
      ['death', animFps.death,  0],
    ].forEach(([animKey, fps, repeat]) => {
      const key = `${id}_${animKey}`;
      if (!scene.anims.exists(key)) {
        const frames = scene.anims.generateFrameNumbers(key);
        if (frames && frames.length > 0) {
          scene.anims.create({
            key,
            frames,
            frameRate: fps,
            repeat,
          });
        } else {
          console.warn(`[CharacterLoader] Missing frames for base anim: ${key}`);
        }
      }
    });

    // Attack animations: attack1, attack2, ..., attackN
    for (let i = 1; i <= attackCount; i++) {
      const key = `${id}_attack${i}`;
      if (!scene.anims.exists(key)) {
        const frames = scene.anims.generateFrameNumbers(key);
        if (frames && frames.length > 0) {
          scene.anims.create({
            key,
            frames,
            frameRate: animFps.attack,
            repeat: 0,
          });
        } else {
          console.warn(`[CharacterLoader] Missing frames for attack anim: ${key}`);
        }
      }
    }

    // Optional shout animation (loops during victory screen)
    if (hasShout) {
      const key = `${id}_shout`;
      if (!scene.anims.exists(key)) {
        const frames = scene.anims.generateFrameNumbers(key);
        if (frames && frames.length > 0) {
          scene.anims.create({
            key,
            frames,
            frameRate: animFps.shout,
            repeat: -1,
          });
        } else {
          console.warn(`[CharacterLoader] Missing frames for shout anim: ${key}`);
        }
      }
    }

    // Optional arrow hit animation
    if (config.hasArrow) {
      const hitKey = `${id}_arrow_hit`;
      if (!scene.anims.exists(hitKey)) {
        const frames = scene.anims.generateFrameNumbers(hitKey);
        if (frames && frames.length > 0) {
          scene.anims.create({
            key: hitKey,
            frames,
            frameRate: 15,
            repeat: 0
          });
        }
      }
    }
  }

  /**
   * Create and position a character sprite in the scene.
   *
   * @param {Phaser.Scene} scene
   * @param {object} config       - from characterRegistry
   * @param {number} x
   * @param {number} y
   * @param {object} [options]
   * @param {boolean} [options.flipX=false]   - mirror sprite (for right-side characters)
   * @param {number}  [options.bgScale=1]     - background scale from scene (for monsters)
   * @param {number}  [options.yOffset=0]     - additional vertical offset if needed
   * @returns {Phaser.GameObjects.Sprite}
   */
  static createSprite(scene, config, x, y, { flipX = false, bgScale = 1 } = {}) {
    const { id, scale, hasShout, facesLeft = false, yOffset = 0 } = config;
    const finalScale = scale * bgScale;
    const appliedYOffset = yOffset * bgScale;

    const sprite = scene.add.sprite(x, y - appliedYOffset, `${id}_idle`)
      .setOrigin(0.5, 1)
      .setScale(finalScale);

    // Store metadata on the sprite for use by helper methods
    sprite.baseX        = x;
    sprite.baseY        = y - appliedYOffset;
    sprite.baseScaleX   = finalScale;
    sprite.baseScaleY   = finalScale;
    sprite.charId       = id;
    sprite.attackCount  = config.attackCount;
    sprite.attackCycle  = 0;        // current cycling index for attacks
    sprite.hasShout     = hasShout; // whether SHOUT.png victory anim is available
    sprite.isRanged     = config.isRanged || false;
    sprite.hasArrow     = config.hasArrow || false;
    sprite.facesLeft    = facesLeft; // save property for restoring flip direction
    
    // Compute actual flip based on intention (flipX) and natural facing direction
    sprite.flipX = facesLeft ? !flipX : flipX;
    sprite.baseFlipX = sprite.flipX; // Save the base idle orientation

    const idleKey = `${id}_idle`;
    if (scene.anims.exists(idleKey)) {
      sprite.play(idleKey);
    } else {
      console.error(`[CharacterLoader] Cannot play ${idleKey}. Texture/Animation is missing. Did you rename the files correctly?`);
    }

    return sprite;
  }

  /**
   * Get the next attack animation key (auto-cycling).
   *
   * Examples:
   *   attackCount=1: always attack1
   *   attackCount=2: attack1 → attack2 → attack1 → ...
   *   attackCount=3: attack1 → attack2 → attack3 → attack1 → ...
   *
   * @param {Phaser.GameObjects.Sprite} sprite - must have been created via createSprite
   * @returns {string} animation key
   */
  static getNextAttackAnim(sprite) {
    sprite.attackCycle = (sprite.attackCycle % sprite.attackCount) + 1;
    return `${sprite.charId}_attack${sprite.attackCycle}`;
  }

  /**
   * Get all animation keys for a sprite.
   * Eliminates magic strings in the scene.
   *
   * @param {Phaser.GameObjects.Sprite} sprite
   * @returns {{ idle, run, hurt, death, shout: string|null, attacks: string[], attack1: string }}
   */
  static getAnimSet(sprite) {
    const id      = sprite.charId;
    const attacks = [];
    for (let i = 1; i <= sprite.attackCount; i++) {
      attacks.push(`${id}_attack${i}`);
    }
    return {
      idle:    `${id}_idle`,
      run:     `${id}_run`,
      hurt:    `${id}_hurt`,
      death:   `${id}_death`,
      shout:   sprite.hasShout ? `${id}_shout` : null,  // null if no SHOUT.png
      attacks,                   // array: ['dragon_attack1', 'dragon_attack2', ...]
      attack1: `${id}_attack1`,  // shortcut for the first attack
    };
  }
}
