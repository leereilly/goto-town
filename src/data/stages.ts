import type { ObstacleType } from '../entities/Obstacle';

export type ObstacleWeights = Partial<Record<ObstacleType, number>>;

export interface StageConfig {
  name: string;
  skyColor: number;
  grassColor: number;
  roadColor: number;
  laneMarkerColor: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  maxObstacles: number;
  weights: ObstacleWeights;
  speedMultiplier: number;
  skylineEnabled: boolean;
}

export const STAGES: StageConfig[] = [
  {
    name: 'Green Outskirts',
    skyColor: 0x87ceeb,
    grassColor: 0x4caf50,
    roadColor: 0x9e9e9e,
    laneMarkerColor: 0xffffff,
    spawnIntervalMin: 800,
    spawnIntervalMax: 1500,
    maxObstacles: 6,
    weights: {
      'red-corolla': 3, 'brown-datsun': 3,
      'pink-jeep': 2, 'yellow-sports-car': 2,
      'white-plumbing-van': 2, 'ice-cream-van-1': 1,
      'yellow-bus': 1,
      'motor-cycle-female': 1, 'camper-van': 1,
      oil: 0.5,
    },
    speedMultiplier: 1.0,
    skylineEnabled: false,
  },
  {
    name: 'Sunburn Highway',
    skyColor: 0xff9800,
    grassColor: 0x8d6e63,
    roadColor: 0x757575,
    laneMarkerColor: 0xffffff,
    spawnIntervalMin: 600,
    spawnIntervalMax: 1200,
    maxObstacles: 8,
    weights: {
      'red-corolla': 2, 'brown-datsun': 2,
      'pink-jeep': 2, 'yellow-sports-car': 2,
      'luton-van': 2, 'white-plumbing-van': 2, 'camper-van': 2,
      'ice-cream-van-1': 1, 'ice-cream-van-2': 1,
      'yellow-bus': 1, 'suv-towing-boat': 1,
      oil: 1.5, cone: 1.5,
    },
    speedMultiplier: 1.2,
    skylineEnabled: false,
  },
  {
    name: 'Neon City Approach',
    skyColor: 0x4a148c,
    grassColor: 0x1b5e20,
    roadColor: 0x424242,
    laneMarkerColor: 0x00ffff,
    spawnIntervalMin: 400,
    spawnIntervalMax: 900,
    maxObstacles: 10,
    weights: {
      'red-corolla': 2, 'brown-datsun': 2,
      'pink-jeep': 1, 'yellow-sports-car': 2,
      'luton-van': 1, 'white-plumbing-van': 1, 'camper-van': 1,
      'ice-cream-van-1': 1, 'ice-cream-van-2': 1,
      'yellow-bus': 2, 'flatbed-with-house': 1, 'suv-towing-boat': 1,
      'motor-cycle-female': 1,
      oil: 1.5, cone: 2, box: 2,
    },
    speedMultiplier: 1.4,
    skylineEnabled: true,
  },
];

// Color themes for endless mode cycles (applied after the first pass through base stages)
interface CycleTheme {
  label: string;
  overrides: Array<{
    skyColor: number;
    grassColor: number;
    roadColor: number;
    laneMarkerColor: number;
  }>;
}

const CYCLE_THEMES: CycleTheme[] = [
  {
    label: 'Sunset Strip',
    overrides: [
      { skyColor: 0xff6f00, grassColor: 0xa1887f, roadColor: 0x8d6e63, laneMarkerColor: 0xffd54f },
      { skyColor: 0xbf360c, grassColor: 0x795548, roadColor: 0x6d4c41, laneMarkerColor: 0xffb300 },
      { skyColor: 0xd50000, grassColor: 0x4e342e, roadColor: 0x3e2723, laneMarkerColor: 0xff6f00 },
    ],
  },
  {
    label: 'Arctic Highway',
    overrides: [
      { skyColor: 0x81d4fa, grassColor: 0xe0e0e0, roadColor: 0x90a4ae, laneMarkerColor: 0xe0f7fa },
      { skyColor: 0x4fc3f7, grassColor: 0xb0bec5, roadColor: 0x78909c, laneMarkerColor: 0x80deea },
      { skyColor: 0x0277bd, grassColor: 0x78909c, roadColor: 0x546e7a, laneMarkerColor: 0x00bcd4 },
    ],
  },
  {
    label: 'Neon Synthwave',
    overrides: [
      { skyColor: 0xaa00ff, grassColor: 0x6a1b9a, roadColor: 0x311b92, laneMarkerColor: 0x76ff03 },
      { skyColor: 0xd500f9, grassColor: 0x4a148c, roadColor: 0x1a237e, laneMarkerColor: 0x00e5ff },
      { skyColor: 0xf50057, grassColor: 0x880e4f, roadColor: 0x212121, laneMarkerColor: 0xffea00 },
    ],
  },
  {
    label: 'Toxic Wasteland',
    overrides: [
      { skyColor: 0x33691e, grassColor: 0x827717, roadColor: 0x5d4037, laneMarkerColor: 0xc6ff00 },
      { skyColor: 0x1b5e20, grassColor: 0x9e9d24, roadColor: 0x4e342e, laneMarkerColor: 0xffab00 },
      { skyColor: 0x004d40, grassColor: 0x558b2f, roadColor: 0x3e2723, laneMarkerColor: 0xff6d00 },
    ],
  },
];

/** Build a StageConfig for endless mode at the given level index (0-based, unbounded). */
export function getEndlessStageConfig(levelIndex: number): StageConfig {
  const baseIndex = levelIndex % STAGES.length;
  const cycle = Math.floor(levelIndex / STAGES.length);
  const base = STAGES[baseIndex];

  if (cycle === 0) return base;

  const theme = CYCLE_THEMES[(cycle - 1) % CYCLE_THEMES.length];
  const colors = theme.overrides[baseIndex];

  // Each cycle: +15% speed, −15% spawn intervals, +2 max obstacles
  const speedScale = 1 + cycle * 0.15;
  const spawnScale = Math.pow(0.85, cycle);

  return {
    ...base,
    name: `${theme.label} ${baseIndex + 1}`,
    skyColor: colors.skyColor,
    grassColor: colors.grassColor,
    roadColor: colors.roadColor,
    laneMarkerColor: colors.laneMarkerColor,
    speedMultiplier: base.speedMultiplier * speedScale,
    spawnIntervalMin: Math.max(150, Math.floor(base.spawnIntervalMin * spawnScale)),
    spawnIntervalMax: Math.max(300, Math.floor(base.spawnIntervalMax * spawnScale)),
    maxObstacles: base.maxObstacles + cycle * 2,
  };
}
