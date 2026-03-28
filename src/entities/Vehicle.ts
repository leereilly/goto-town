import type { Obstacle, ObstacleType } from './Obstacle';
import { getLaneY, LANE_SWITCH_MS } from '../config/constants';

// Scales for 64x64 retro pixel art sprites
const VEHICLE_SCALE: Record<string, number> = {
  'brown-datsun': 0.55,
  'camper-van': 0.55,
  'flatbed-with-house': 0.55,
  'ice-cream-van-1': 0.55,
  'ice-cream-van-2': 0.55,
  'luton-van': 0.55,
  'motor-cycle-female': 0.55,
  'pink-jeep': 0.55,
  'red-corolla': 0.55,
  'suv-towing-boat': 0.55,
  'white-plumbing-van': 0.55,
  'yellow-bus': 0.55,
  'yellow-sports-car': 0.55,
};

// Large vehicles that won't dodge when honked
const IMMOVABLE_TYPES: Set<string> = new Set([
  'yellow-bus', 'flatbed-with-house',
]);

export default class Vehicle implements Obstacle {
  type: ObstacleType;
  sprite: Phaser.GameObjects.Sprite;
  lane: number;
  speed: number;
  movable: boolean;
  active: boolean = true;
  width: number;
  height: number;

  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, type: ObstacleType, lane: number, speed: number, x: number) {
    this.scene = scene;
    this.type = type;
    this.lane = lane;
    this.speed = speed;
    this.movable = !IMMOVABLE_TYPES.has(type);

    const textureKey = type;
    this.sprite = scene.add.sprite(x, getLaneY(lane), textureKey);
    this.sprite.setDepth(1);
    this.sprite.setOrigin(0.5, 0.5);

    const scale = VEHICLE_SCALE[type] ?? 0.55;
    this.sprite.setScale(scale);

    this.width = this.sprite.displayWidth;
    this.height = this.sprite.displayHeight;
  }

  update(delta: number): void {
    if (!this.active) return;
    this.sprite.x -= this.speed * delta;
    if (this.sprite.x < -50) {
      this.active = false;
    }
  }

  dodgeToLane(targetLane: number): void {
    this.lane = targetLane;
    this.scene.tweens.add({
      targets: this.sprite,
      y: getLaneY(targetLane),
      duration: LANE_SWITCH_MS + 20,
      ease: 'Power2',
    });
    // Wobble effect during dodge (like player hit wobble)
    this.scene.tweens.add({
      targets: this.sprite,
      angle: { from: -12, to: 12 },
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.sprite.setAngle(0);
      },
    });
  }

  flashResist(): void {
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      this.sprite.clearTint();
    });
  }

  destroy(): void {
    this.active = false;
    this.sprite?.destroy();
  }
}
