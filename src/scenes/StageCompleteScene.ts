import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { sfx } from '../audio/sfx';
import { STAGES, getEndlessStageConfig } from '../data/stages';
import type { GameMode } from '../systems/StageSystem';

interface StageCompleteData {
  stage: number;
  hp: number;
  elapsedTime: number;
}

export default class StageCompleteScene extends Phaser.Scene {
  private stageData!: StageCompleteData;

  constructor() {
    super('StageComplete');
  }

  init(data: StageCompleteData): void {
    this.stageData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const gameMode = (this.game.registry.get('gameMode') as GameMode) ?? 'campaign';
    const isEndless = gameMode === 'endless';

    const stageName = isEndless
      ? getEndlessStageConfig(this.stageData.stage).name
      : (STAGES[this.stageData.stage]?.name ?? 'Unknown');

    const displayNum = this.stageData.stage + 1;
    const label = isEndless ? `LEVEL ${displayNum}` : `STAGE ${displayNum}`;

    this.add
      .text(GAME_WIDTH / 2, 80, label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 105, 'COMPLETE!', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#4caf50',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 135, `"${stageName}" cleared!`, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#cccccc',
      })
      .setOrigin(0.5, 0.5);

    // Hearts remaining
    this.add
      .text(GAME_WIDTH / 2, 160, `HP: ${'\u2764\uFE0F'.repeat(this.stageData.hp)}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ff5252',
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
      this.scene.start('Game', {
        stage: this.stageData.stage + 1,
        hp: this.stageData.hp,
        elapsedTime: this.stageData.elapsedTime,
      });
    });
  }
}
