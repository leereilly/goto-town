import type { Obstacle, ObstacleType } from './Obstacle';
import { getLaneY } from '../config/constants';

export default class OilSlick implements Obstacle {
  type: ObstacleType = 'oil';
  sprite: Phaser.GameObjects.Sprite;
  lane: number;
  speed: number;
  movable: boolean = false;
  active: boolean = true;
  width: number;
  height: number;

  constructor(scene: Phaser.Scene, lane: number, speed: number, x: number) {
    this.lane = lane;
    this.speed = speed;

    this.sprite = scene.add.sprite(x, getLaneY(lane), 'oil');
    this.sprite.setDepth(1);
    this.sprite.setOrigin(0.5, 0.5);

    this.width = this.sprite.width;
    this.height = this.sprite.height;
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
