export type VehicleType =
  | 'brown-datsun'
  | 'camper-van'
  | 'flatbed-with-house'
  | 'ice-cream-van-1'
  | 'ice-cream-van-2'
  | 'luton-van'
  | 'motor-cycle-female'
  | 'pink-jeep'
  | 'red-corolla'
  | 'suv-towing-boat'
  | 'white-plumbing-van'
  | 'yellow-bus'
  | 'yellow-sports-car';

export type HazardType = 'oil' | 'cone' | 'box';

export type ObstacleType = VehicleType | HazardType;

export const VEHICLE_TYPES: VehicleType[] = [
  'brown-datsun', 'camper-van', 'flatbed-with-house',
  'ice-cream-van-1', 'ice-cream-van-2', 'luton-van', 'motor-cycle-female',
  'pink-jeep', 'red-corolla', 'suv-towing-boat', 'white-plumbing-van',
  'yellow-bus', 'yellow-sports-car',
];

export const HAZARD_TYPES: HazardType[] = ['oil', 'cone', 'box'];

export function isVehicleType(t: ObstacleType): t is VehicleType {
  return (VEHICLE_TYPES as string[]).includes(t);
}

export function isHazardType(t: ObstacleType): t is HazardType {
  return (HAZARD_TYPES as string[]).includes(t);
}

export interface Obstacle {
  type: ObstacleType;
  sprite: Phaser.GameObjects.Sprite;
  lane: number;
  speed: number;
  movable: boolean;
  active: boolean;
  width: number;
  height: number;

  update(delta: number): void;
  destroy(): void;
}
