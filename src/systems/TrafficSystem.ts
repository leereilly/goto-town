import type { Obstacle } from '../entities/Obstacle';

export default class TrafficSystem {
  update(delta: number, obstacles: Obstacle[], _speedMultiplier: number): void {
    for (const obs of obstacles) {
      if (obs.active) {
        obs.update(delta);
      }
    }
  }
}
