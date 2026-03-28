import type { Obstacle } from '../entities/Obstacle';
import type PlayerBike from '../entities/PlayerBike';
import Vehicle from '../entities/Vehicle';
import { FIRE_RANGE, PLAYER_X, LANE_COUNT } from '../config/constants';
import { sfx } from '../audio/sfx';

// Large vehicles that won't move when honked
const IMMOVABLE_VEHICLE_TYPES: Set<string> = new Set([
  'yellow-bus', 'flatbed-with-house',
]);

export default class CollisionSystem {
  checkCollisions(player: PlayerBike, obstacles: Obstacle[], time: number): Obstacle | null {
    if (player.isInvulnerable(time)) return null;

    const px = player.sprite.x;
    const py = player.sprite.y;
    const pw = player.sprite.displayWidth * 0.6;
    const ph = player.sprite.displayHeight * 0.6;

    for (const obs of obstacles) {
      if (!obs.active) continue;

      const ox = obs.sprite.x;
      const oy = obs.sprite.y;
      const ow = obs.width * 0.6;
      const oh = obs.height * 0.6;

      // AABB overlap
      if (
        px - pw / 2 < ox + ow / 2 &&
        px + pw / 2 > ox - ow / 2 &&
        py - ph / 2 < oy + oh / 2 &&
        py + ph / 2 > oy - oh / 2
      ) {
        return obs;
      }
    }

    return null;
  }

  handleFire(player: PlayerBike, obstacles: Obstacle[], _time: number, scene: Phaser.Scene): void {
    // Find nearest obstacle ahead of player in same lane within FIRE_RANGE
    let nearest: Obstacle | null = null;
    let nearestDist = Infinity;

    const playerLane = player.isMovingLane ? player.targetLane : player.currentLane;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      if (obs.lane !== playerLane) continue;
      const dist = obs.sprite.x - PLAYER_X;
      if (dist > 0 && dist < FIRE_RANGE && dist < nearestDist) {
        nearest = obs;
        nearestDist = dist;
      }
    }

    if (!nearest) return;

    // Create a visual "shout" effect
    this.createFireEffect(scene, player);

    if (IMMOVABLE_VEHICLE_TYPES.has(nearest.type)) {
      // Emergency vehicles refuse to move
      if (nearest instanceof Vehicle) {
        (nearest as Vehicle).flashResist();
      }
      sfx.play('policeRefuse');
      return;
    }

    if (nearest.type === 'oil' || nearest.type === 'cone' || nearest.type === 'box') {
      // Hazards can't be moved
      return;
    }

    if (nearest.movable && nearest instanceof Vehicle) {
      // Find free adjacent lane
      const freeLane = this.findFreeLane(nearest.lane, nearest.sprite.x, obstacles);
      if (freeLane >= 0) {
        (nearest as Vehicle).dodgeToLane(freeLane);
        sfx.play('vehicleDodge');
      }
    }
  }

  private findFreeLane(currentLane: number, x: number, obstacles: Obstacle[]): number {
    // Check lanes adjacent to current
    const candidates = [];
    if (currentLane > 0) candidates.push(currentLane - 1);
    if (currentLane < LANE_COUNT - 1) candidates.push(currentLane + 1);

    // Shuffle candidates
    if (candidates.length === 2 && Math.random() > 0.5) {
      candidates.reverse();
    }

    for (const lane of candidates) {
      let blocked = false;
      for (const obs of obstacles) {
        if (!obs.active || obs.lane !== lane) continue;
        if (Math.abs(obs.sprite.x - x) < 30) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return lane;
    }

    return -1;
  }

  private createFireEffect(scene: Phaser.Scene, player: PlayerBike): void {
    const text = scene.add.text(player.sprite.x + 12, player.sprite.y - 8, '📢', {
      fontSize: '10px',
    });
    text.setDepth(2);
    scene.tweens.add({
      targets: text,
      x: text.x + 30,
      alpha: 0,
      duration: 300,
      onComplete: () => text.destroy(),
    });
  }
}
