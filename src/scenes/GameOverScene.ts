import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { formatTime } from '../data/HighScoreManager';
import type { GameMode } from '../systems/StageSystem';

interface GameOverData {
  elapsedTime?: number;
  stage?: number;
}

export default class GameOverScene extends Phaser.Scene {
  private elapsedTime: number = 0;
  private stage: number = 0;

  constructor() {
    super('GameOver');
  }

  init(data?: GameOverData): void {
    this.elapsedTime = data?.elapsedTime ?? 0;
    this.stage = data?.stage ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const gameMode = (this.game.registry.get('gameMode') as GameMode) ?? 'campaign';
    const isEndless = gameMode === 'endless';

    this.add
      .text(GAME_WIDTH / 2, 60, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#f44336',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 88, 'Your bike trip ended early...', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#999999',
      })
      .setOrigin(0.5, 0.5);

    // Sad bike
    this.add.sprite(GAME_WIDTH / 2, 118, 'bike').setScale(2).setAngle(45);

    if (isEndless) {
      this.add
        .text(GAME_WIDTH / 2, 148, `Level reached: ${this.stage + 1}`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#f5a623',
        })
        .setOrigin(0.5, 0.5);
    }

    this.add
      .text(GAME_WIDTH / 2, 165, `Time: ${formatTime(this.elapsedTime)}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

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
      this.scene.start('HighScore', { score: this.elapsedTime, victory: false });
    });
  }
}
