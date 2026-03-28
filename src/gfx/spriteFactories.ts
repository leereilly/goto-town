import { createTextureFromPixelMap } from './pixelArt';
import {
  OIL_PALETTE,
  HEART_PALETTE,
  EMPTY_HEART_PALETTE,
  FIRE_ICON_PALETTE,
  CONE_PALETTE,
  BOX_PALETTE,
} from './palettes';

export function createOilTexture(scene: Phaser.Scene, key: string): void {
  // 12x6 dark puddle
  const pixels = [
    '....1111....',
    '..11122111..',
    '.1112221111.',
    '.1111221111.',
    '..11111111..',
    '....1111....',
  ];
  createTextureFromPixelMap(scene, key, pixels, OIL_PALETTE);
}

export function createConeTexture(scene: Phaser.Scene, key: string): void {
  // 8x10 traffic cone
  const pixels = [
    '...33...',
    '...11...',
    '..0110..',
    '..0110..',
    '..1321..',
    '.013210.',
    '.011110.',
    '.011110.',
    '00111100',
    '00000000',
  ];
  createTextureFromPixelMap(scene, key, pixels, CONE_PALETTE);
}

export function createBoxTexture(scene: Phaser.Scene, key: string): void {
  // 10x10 cardboard box
  const pixels = [
    '0000000000',
    '0122222210',
    '0122222210',
    '0111111110',
    '0100000010',
    '0100330010',
    '0100330010',
    '0100000010',
    '0111111110',
    '0000000000',
  ];
  createTextureFromPixelMap(scene, key, pixels, BOX_PALETTE);
}

export function createHeartTexture(scene: Phaser.Scene, key: string): void {
  // 8x8 heart
  const pixels = [
    '.01.01..',
    '01210210',
    '01221210',
    '01111110',
    '.011110.',
    '..0110..',
    '...00...',
    '........',
  ];
  createTextureFromPixelMap(scene, key, pixels, HEART_PALETTE);
}

export function createEmptyHeartTexture(scene: Phaser.Scene, key: string): void {
  const pixels = [
    '.01.01..',
    '01210210',
    '01221210',
    '01111110',
    '.011110.',
    '..0110..',
    '...00...',
    '........',
  ];
  createTextureFromPixelMap(scene, key, pixels, EMPTY_HEART_PALETTE);
}

export function createFireIconTexture(scene: Phaser.Scene, key: string): void {
  // 8x8 fire icon
  const pixels = [
    '...33...',
    '..3223..',
    '..3223..',
    '.312213.',
    '.311113.',
    '.312213.',
    '..3113..',
    '...00...',
  ];
  createTextureFromPixelMap(scene, key, pixels, FIRE_ICON_PALETTE);
}

export function generateAllTextures(scene: Phaser.Scene): void {
  // All vehicles are loaded from PNGs in BootScene.preload

  // Hazard textures (generated pixel art)
  createOilTexture(scene, 'oil');
  createConeTexture(scene, 'cone');
  createBoxTexture(scene, 'box');

  // HUD textures
  createHeartTexture(scene, 'heart');
  createEmptyHeartTexture(scene, 'heart_empty');
  createFireIconTexture(scene, 'fire_icon');
}
