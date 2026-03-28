import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { sfx } from '../audio/sfx';
import { formatTime } from '../data/HighScoreManager';

interface VictoryData {
  elapsedTime?: number;
}

export default class VictoryScene extends Phaser.Scene {
  private elapsedTime: number = 0;

  constructor() {
    super('Victory');
  }

  init(data?: VictoryData): void {
    this.elapsedTime = data?.elapsedTime ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(GAME_WIDTH / 2, 40, '🎉 YOU REACHED', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 60, 'TOWN! 🎉', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#4caf50',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    // Victory bike
    const bike = this.add.sprite(GAME_WIDTH / 2, 100, 'bike').setScale(3);
    this.tweens.add({
      targets: bike,
      y: 95,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(GAME_WIDTH / 2, 135, 'Congratulations!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 153, `Time: ${formatTime(this.elapsedTime)}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#f5a623',
      })
      .setOrigin(0.5, 0.5);

    // Confetti-like particles using simple tweened texts
    for (let i = 0; i < 12; i++) {
      const confetti = this.add.text(
        Math.random() * GAME_WIDTH,
        -10,
        ['✨', '⭐', '🌟'][Math.floor(Math.random() * 3)],
        { fontSize: '8px' }
      );
      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 10,
        x: confetti.x + (Math.random() - 0.5) * 60,
        duration: 2000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    const blinkText = this.add
      .text(GAME_WIDTH / 2, 195, 'Press ENTER to continue', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: blinkText,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => {
      this.scene.start('HighScore', { score: this.elapsedTime, victory: true });
    });
  }
}
