import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

// 16x16 pixelated GitHub Invertocat logo
// Each row is a string of 0s and 1s; 1 = filled pixel
const INVERTOCAT: string[] = [
  '0000011111100000',
  '0001100000011000',
  '0010000000000100',
  '0100000000000010',
  '0100011001100010',
  '0100011001100010',
  '0100000000000010',
  '0010000110000100',
  '0001000000001000',
  '0000111111110000',
  '0000100000010000',
  '0001100000011000',
  '0011000000001100',
  '0010000000000100',
  '0011000000001100',
  '0001100000011000',
];

export default class SourceCodeScene extends Phaser.Scene {
  private cursorBlink: number = 0;
  private cursorText!: Phaser.GameObjects.Text;

  constructor() {
    super('SourceCode');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d1117');

    // Title
    this.add
      .text(GAME_WIDTH / 2, 16, 'SOURCE CODE', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    // BASIC-style program listing
    const listingY = 44;
    const lineHeight = 16;

    this.add.text(20, listingY, '10 PRINT "GOTO Town is the best!"', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#58a6ff',
    });

    this.add.text(20, listingY + lineHeight, '20 GOTO 10', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#58a6ff',
    });

    // Blinking cursor after the listing
    this.cursorText = this.add.text(20, listingY + lineHeight * 2 + 4, '\u2588', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#58a6ff',
    });
    this.cursorBlink = 0;

    // Simulated "output" scrolling
    const outputY = listingY + lineHeight * 3 + 4;
    for (let i = 0; i < 3; i++) {
      this.add.text(20, outputY + i * 10, 'GOTO Town is the best!', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#3fb950',
      });
    }

    // Draw pixelated GitHub Invertocat
    const logoSize = 3; // each "pixel" is 3x3 game pixels
    const logoW = 16 * logoSize;
    const logoX = Math.floor((GAME_WIDTH - logoW) / 2);
    const logoY = 140;

    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 1);

    for (let row = 0; row < INVERTOCAT.length; row++) {
      for (let col = 0; col < INVERTOCAT[row].length; col++) {
        if (INVERTOCAT[row][col] === '1') {
          gfx.fillRect(
            logoX + col * logoSize,
            logoY + row * logoSize,
            logoSize,
            logoSize
          );
        }
      }
    }

    // GitHub repo link
    this.add
      .text(GAME_WIDTH / 2, logoY + 16 * logoSize + 10, 'github.com/leereilly/goto-town', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#58a6ff',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        window.open('https://github.com/leereilly/goto-town', '_blank');
      });

    // Back prompt
    const blinkText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'Press ESC to go back', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#666666',
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: blinkText,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.start('ModeSelect');
    });
  }

  update(_time: number, delta: number): void {
    this.cursorBlink += delta;
    this.cursorText.setAlpha(Math.sin(this.cursorBlink * 0.005) > 0 ? 1 : 0);
  }
}
