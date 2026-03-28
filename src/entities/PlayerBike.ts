import { PLAYER_X, getLaneY, LANE_COUNT, LANE_SWITCH_MS, FIRE_COOLDOWN, HIT_INVULN_MS, WOBBLE_MS, MAX_HP } from '../config/constants';

export default class PlayerBike {
  sprite!: Phaser.GameObjects.Sprite;
  currentLane: number = 1;
  targetLane: number = 1;
  hp: number = MAX_HP;
  isMovingLane: boolean = false;
  invulnerableUntil: number = 0;
  wobbleUntil: number = 0;
  fireCooldownUntil: number = 0;

  private scene!: Phaser.Scene;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
    this.sprite = scene.add.sprite(PLAYER_X, getLaneY(this.currentLane), 'bike');
    this.sprite.setDepth(1);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(0.55);
    this.sprite.setFlipX(true);
  }

  moveUp(): boolean {
    if (this.isMovingLane || this.currentLane <= 0) return false;
    this.targetLane = this.currentLane - 1;
    this.isMovingLane = true;
    this.scene.tweens.add({
      targets: this.sprite,
      y: getLaneY(this.targetLane),
      duration: LANE_SWITCH_MS,
      ease: 'Power2',
      onComplete: () => {
        this.currentLane = this.targetLane;
        this.isMovingLane = false;
      },
    });
    return true;
  }

  moveDown(): boolean {
    if (this.isMovingLane || this.currentLane >= LANE_COUNT - 1) return false;
    this.targetLane = this.currentLane + 1;
    this.isMovingLane = true;
    this.scene.tweens.add({
      targets: this.sprite,
      y: getLaneY(this.targetLane),
      duration: LANE_SWITCH_MS,
      ease: 'Power2',
      onComplete: () => {
        this.currentLane = this.targetLane;
        this.isMovingLane = false;
      },
    });
    return true;
  }

  fire(now: number): boolean {
    if (!this.canFire(now)) return false;
    this.fireCooldownUntil = now + FIRE_COOLDOWN;
    return true;
  }

  takeDamage(now: number): void {
    if (this.isInvulnerable(now)) return;
    this.hp = Math.max(0, this.hp - 1);
    this.invulnerableUntil = now + HIT_INVULN_MS;
    this.wobbleUntil = now + WOBBLE_MS;
  }

  update(time: number, _delta: number): void {
    // Wobble effect
    if (time < this.wobbleUntil) {
      const wobblePhase = Math.sin(time * 0.02) * 10;
      this.sprite.setAngle(wobblePhase);
    } else {
      this.sprite.setAngle(0);
    }

    // Invulnerability flashing
    if (time < this.invulnerableUntil) {
      this.sprite.setAlpha(Math.sin(time * 0.015) > 0 ? 1 : 0.3);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnerableUntil;
  }

  canFire(now: number): boolean {
    return now >= this.fireCooldownUntil;
  }

  getFireCooldownPct(now: number): number {
    if (now >= this.fireCooldownUntil) return 1;
    const remaining = this.fireCooldownUntil - now;
    return 1 - remaining / FIRE_COOLDOWN;
  }

  destroy(): void {
    this.sprite?.destroy();
  }
}
