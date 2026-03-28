import type { Obstacle, ObstacleType, HazardType } from './Obstacle';
import { getLaneY } from '../config/constants';

const HAZARD_SCALE: Record<HazardType, number> = {
  oil: 1,
  cone: 3.0,
  box: 3.0,
};

export default class StaticHazard implements Obstacle {
  type: ObstacleType;
  sprite: Phaser.GameObjects.Sprite;
  lane: number;
  speed: number;
  movable: boolean = false;
  active: boolean = true;
  width: number;
  height: number;

  constructor(scene: Phaser.Scene, type: HazardType, lane: number, speed: number, x: number) {
    this.type = type;
    this.lane = lane;
    this.speed = speed;

    this.sprite = scene.add.sprite(x, getLaneY(lane), type);
    this.sprite.setDepth(1);
    this.sprite.setOrigin(0.5, 0.5);

    const scale = HAZARD_SCALE[type] ?? 0.35;
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

  destroy(): void {
    this.active = false;
    this.sprite?.destroy();
  }
}
