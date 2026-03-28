import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';

export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(GAME_WIDTH / 2, 24, 'CREDITS', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    const credits = [
      { label: 'A game by', value: 'Lee Reilly' },
      { label: 'Built with', value: 'Phaser 3' },
      { label: 'Vehicle assets', value: 'Kenney.nl' },
      { label: 'Music', value: '"Happy Chiptune" from Pixabay' },
      { label: 'Audio', value: 'Web Audio API' },
      { label: 'Vibes', value: 'GitHub Copilot' },
    ];

    const startY = 58;
    const spacing = 30;

    credits.forEach((credit, i) => {
      const y = startY + i * spacing;

      this.add
        .text(GAME_WIDTH / 2, y, credit.label, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#888888',
        })
        .setOrigin(0.5, 0.5);

      this.add
        .text(GAME_WIDTH / 2, y + 12, credit.value, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0.5);
    });

    const blinkText = this.add
      .text(GAME_WIDTH / 2, 230, 'Press ESC to go back', {
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
}
