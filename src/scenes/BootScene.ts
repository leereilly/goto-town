import Phaser from 'phaser';
import { generateAllTextures } from '../gfx/spriteFactories';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Player
    this.load.image('bike', 'vehicles/motor-cycle-male.png');

    // Traffic vehicles
    this.load.image('brown-datsun', 'vehicles/brown-datsun.png');
    this.load.image('camper-van', 'vehicles/camper-van.png');
    this.load.image('flatbed-with-house', 'vehicles/flatbed-with-house.png');
    this.load.image('ice-cream-van-1', 'vehicles/ice-cream-van-1.png');
    this.load.image('ice-cream-van-2', 'vehicles/ice-cream-van-2.png');
    this.load.image('luton-van', 'vehicles/luton-van.png');
    this.load.image('motor-cycle-female', 'vehicles/motor-cycle-female.png');
    this.load.image('pink-jeep', 'vehicles/pink-jeep.png');
    this.load.image('red-corolla', 'vehicles/red-corolla.png');
    this.load.image('suv-towing-boat', 'vehicles/SUV-towing-boat.png');
    this.load.image('white-plumbing-van', 'vehicles/white-plumbing-van.png');
    this.load.image('yellow-bus', 'vehicles/yellow-bus.png');
    this.load.image('yellow-sports-car', 'vehicles/yellow-sports-car.png');
  }

  create(): void {
    generateAllTextures(this);

    const text = this.add.text(128, 120, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);

    this.time.delayedCall(300, () => {
      this.scene.start('Title');
    });
  }
}
