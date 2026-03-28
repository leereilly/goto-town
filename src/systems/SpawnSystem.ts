import type { Obstacle, ObstacleType } from '../entities/Obstacle';
import type { StageConfig } from '../data/stages';
import Vehicle from '../entities/Vehicle';
import OilSlick from '../entities/OilSlick';
import StaticHazard from '../entities/StaticHazard';
import { GAME_WIDTH, LANE_COUNT } from '../config/constants';

export default class SpawnSystem {
  private obstacles: Obstacle[] = [];
  private nextSpawnTime: number = 0;

  update(time: number, _delta: number, scene: Phaser.Scene, stageConfig: StageConfig): void {
    if (time >= this.nextSpawnTime && this.getActiveCount() < stageConfig.maxObstacles) {
      this.spawnObstacle(scene, stageConfig, time);
      const range = stageConfig.spawnIntervalMax - stageConfig.spawnIntervalMin;
      this.nextSpawnTime = time + stageConfig.spawnIntervalMin + Math.random() * range;
    }

    // Clean up inactive obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (!this.obstacles[i].active) {
        this.obstacles[i].destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private getActiveCount(): number {
    return this.obstacles.filter((o) => o.active).length;
  }

  private spawnObstacle(scene: Phaser.Scene, stageConfig: StageConfig, _time: number): void {
    const type = this.pickType(stageConfig);
    const lane = this.pickLane();
    const baseSpeed = 60 * stageConfig.speedMultiplier;
    const speed = baseSpeed + Math.random() * 20;
    const x = GAME_WIDTH + 20;

    let obstacle: Obstacle;
    if (type === 'oil') {
      obstacle = new OilSlick(scene, lane, speed, x);
    } else if (type === 'cone' || type === 'box') {
      obstacle = new StaticHazard(scene, type, lane, speed, x);
    } else {
      obstacle = new Vehicle(scene, type, lane, speed, x);
    }

    this.obstacles.push(obstacle);
  }

  private pickType(stageConfig: StageConfig): ObstacleType {
    const w = stageConfig.weights;
    const entries = Object.entries(w) as [ObstacleType, number][];
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    let r = Math.random() * total;

    for (const [type, weight] of entries) {
      if (r < weight) return type;
      r -= weight;
    }
    // Fallback
    return entries[entries.length - 1][0];
  }

  private pickLane(): number {
    return Math.floor(Math.random() * LANE_COUNT);
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  reset(): void {
    for (const o of this.obstacles) {
      o.destroy();
    }
    this.obstacles = [];
    this.nextSpawnTime = 0;
  }
}
