import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { sfx } from '../audio/sfx';

export default class TitleScene extends Phaser.Scene {
  private blinkText!: Phaser.GameObjects.Text;
  private blinkTimer: number = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Title
    this.add
      .text(GAME_WIDTH / 2, 58, 'GOTO TOWN ಠಿ_ಠ', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#e94560',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    // Decorative bike sprite
    this.add.sprite(GAME_WIDTH / 2, 115, 'bike').setScale(3);

    // Press enter
    this.blinkText = this.add
      .text(GAME_WIDTH / 2, 160, 'Press ENTER to start', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    // Controls
    this.add
      .text(GAME_WIDTH / 2, 190, 'W/S or UP/DOWN: Change Lane', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 202, 'SPACE: Fire (dodge vehicles)', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 214, 'Backtick (`): Debug overlay', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#666666',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 228, 'Webcam + Mic also supported!', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#666666',
      })
      .setOrigin(0.5, 0.5);

    this.blinkTimer = 0;

    // Init audio on keypress
    this.input.keyboard!.on('keydown', () => {
      sfx.init();
    });

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => {
      sfx.init();
      this.scene.start('ModeSelect');
    });
  }

  update(_time: number, delta: number): void {
    this.blinkTimer += delta;
    this.blinkText.setAlpha(Math.sin(this.blinkTimer * 0.003) > 0 ? 1 : 0.2);
  }
}
