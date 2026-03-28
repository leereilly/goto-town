export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;
export const LANE_COUNT = 4;
export const ROAD_TOP = 80;
export const ROAD_BOTTOM = 220;
export const ROAD_HEIGHT = ROAD_BOTTOM - ROAD_TOP;
export const LANE_HEIGHT = ROAD_HEIGHT / LANE_COUNT;
export const PLAYER_X = 40;
export const LANE_SWITCH_MS = 180;
export const FIRE_RANGE = 120;
export const FIRE_COOLDOWN = 1200;
export const HIT_INVULN_MS = 1200;
export const WOBBLE_MS = 800;
export const STAGE_DURATION = 60;
export const MAX_HP = 3;
export const SPEED_MULTIPLIERS = [1.0, 1.2, 1.4];

export function getLaneY(lane: number): number {
  return ROAD_TOP + LANE_HEIGHT * lane + LANE_HEIGHT / 2;
}
