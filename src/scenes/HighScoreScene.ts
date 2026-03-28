import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import {
  isHighScore,
  insertHighScore,
  loadHighScores,
  formatTime,
  type HighScoreEntry,
} from '../data/HighScoreManager';

interface HighScoreData {
  score: number;
  victory: boolean;
}

export default class HighScoreScene extends Phaser.Scene {
  private score: number = 0;
  private victory: boolean = false;
  private enteringName: boolean = false;
  private playerName: string = '';
  private nameText!: Phaser.GameObjects.Text;
  private cursorVisible: boolean = true;
  private cursorTimer: number = 0;
  private tableTexts: Phaser.GameObjects.Text[] = [];
  private promptText!: Phaser.GameObjects.Text;
  private inputReady: boolean = false;

  constructor() {
    super('HighScore');
  }

  init(data: HighScoreData): void {
    this.score = data?.score ?? 0;
    this.victory = data?.victory ?? false;
    this.enteringName = false;
    this.playerName = '';
    this.tableTexts = [];
    this.inputReady = false;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const qualifies = isHighScore(this.score);

    // Title
    this.add
      .text(GAME_WIDTH / 2, 14, 'HIGH SCORES', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    if (qualifies && this.score > 0) {
      this.enteringName = true;
      this.showNameEntry();
    } else {
      this.showTable(loadHighScores());
    }

    // Delay input readiness to prevent accidental carry-over from previous scene
    this.time.delayedCall(300, () => {
      this.inputReady = true;
    });

    // Handle keyboard
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (!this.inputReady) return;

      if (this.enteringName) {
        this.handleNameInput(event);
      } else {
        if (event.key === 'Enter') {
          this.scene.start('Title');
        }
      }
    });
  }

  update(_time: number, delta: number): void {
    if (this.enteringName && this.nameText) {
      this.cursorTimer += delta;
      if (this.cursorTimer > 400) {
        this.cursorTimer = 0;
        this.cursorVisible = !this.cursorVisible;
      }
      const cursor = this.cursorVisible ? '_' : ' ';
      this.nameText.setText(this.playerName + cursor);
    }
  }

  private showNameEntry(): void {
    this.add
      .text(GAME_WIDTH / 2, 36, 'NEW HIGH SCORE!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#4caf50',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 52, `Time: ${formatTime(this.score)}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 70, 'Enter your name:', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0.5);

    this.nameText = this.add
      .text(GAME_WIDTH / 2, 86, '_', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    this.promptText = this.add
      .text(GAME_WIDTH / 2, 104, 'Press ENTER to confirm', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#666666',
      })
      .setOrigin(0.5, 0.5);
  }

  private handleNameInput(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.playerName.length > 0) {
      this.enteringName = false;
      const scores = insertHighScore(this.playerName.toUpperCase(), this.score);
      // Clear name entry UI
      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor('#1a1a2e');
      this.add
        .text(GAME_WIDTH / 2, 14, 'HIGH SCORES', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#f5a623',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0.5);
      this.showTable(scores, this.playerName.toUpperCase());
    } else if (event.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
    } else if (
      event.key.length === 1 &&
      this.playerName.length < 16 &&
      /^[a-zA-Z0-9 ]$/.test(event.key)
    ) {
      this.playerName += event.key;
    }
  }

  private showTable(scores: HighScoreEntry[], highlightName?: string): void {
    const startY = 50;
    const rowH = 22;

    // Header
    this.add
      .text(30, startY, '#', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#888888',
      });
    this.add
      .text(50, startY, 'NAME', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#888888',
      });
    this.add
      .text(GAME_WIDTH - 30, startY, 'TIME', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#888888',
      })
      .setOrigin(1, 0);

    for (let i = 0; i < 5; i++) {
      const y = startY + 16 + i * rowH;
      const entry = scores[i];
      const isHighlighted = entry && highlightName && entry.name === highlightName;
      const color = isHighlighted ? '#4caf50' : '#ffffff';
      const dimColor = isHighlighted ? '#4caf50' : '#aaaaaa';

      this.add.text(30, y, `${i + 1}.`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: dimColor,
      });

      if (entry) {
        this.add.text(50, y, entry.name, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color,
        });
        this.add
          .text(GAME_WIDTH - 30, y, formatTime(entry.score), {
            fontFamily: 'monospace',
            fontSize: '9px',
            color,
          })
          .setOrigin(1, 0);
      } else {
        this.add.text(50, y, '---', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#444444',
        });
        this.add
          .text(GAME_WIDTH - 30, y, '--:--', {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#444444',
          })
          .setOrigin(1, 0);
      }
    }

    const blinkText = this.add
      .text(GAME_WIDTH / 2, 210, 'Press ENTER to continue', {
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
  }
}
