import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { sfx } from '../audio/sfx';
import { loadCalibration } from '../input/CalibrationProfile';

export type GameMode = 'campaign' | 'endless';

type MenuItem = {
  label: string;
  mode?: GameMode;
  scene?: string;
  forceCalibration?: boolean;
  description: string;
};

export default class ModeSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuTexts: Phaser.GameObjects.Text[] = [];
  private menuDefs: MenuItem[] = [];
  private cursor!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;

  constructor() {
    super('ModeSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.selectedIndex = 0;
    this.menuTexts = [];
    const hasCalibration = loadCalibration() !== null;

    this.menuDefs = [
      { label: 'CAMPAIGN', mode: 'campaign', description: 'Race through 3 stages\nto reach town!' },
      { label: 'ENDLESS', mode: 'endless', description: 'How far can you go?\nStages loop and get harder!' },
      ...(hasCalibration
        ? [{ label: 'RECALIBRATE', scene: 'Permission', forceCalibration: true, description: 'Re-run face & voice\ncalibration' } as MenuItem]
        : []),
      { label: 'CREDITS', scene: 'Credits', description: 'Who made this thing?' },
      { label: 'SOURCE CODE', scene: 'SourceCode', description: 'View the source code\non GitHub' },
    ];

    this.add
      .text(GAME_WIDTH / 2, 40, 'SELECT MODE', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f5a623',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    // Bike decoration
    this.add.sprite(GAME_WIDTH / 2, 68, 'bike').setScale(2);

    const startY = 98;
    const spacing = 18;

    this.menuDefs.forEach((item, i) => {
      const text = this.add
        .text(GAME_WIDTH / 2 + 8, startY + i * spacing, item.label, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0.5);
      this.menuTexts.push(text);
    });

    this.cursor = this.add
      .text(0, 0, '\u25B6', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#e94560',
      })
      .setOrigin(0.5, 0.5);

    const descY = startY + this.menuDefs.length * spacing + 16;

    this.descriptionText = this.add
      .text(GAME_WIDTH / 2, descY, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 225, 'ENTER to select', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#666666',
      })
      .setOrigin(0.5, 0.5);

    this.updateSelection();

    const keys = this.input.keyboard!;
    keys.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', () => this.moveSelection(-1));
    keys.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', () => this.moveSelection(-1));
    keys.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', () => this.moveSelection(1));
    keys.addKey(Phaser.Input.Keyboard.KeyCodes.S).on('down', () => this.moveSelection(1));
    keys.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.confirmSelection());
  }

  private moveSelection(dir: number): void {
    sfx.play('laneMove');
    this.selectedIndex =
      (this.selectedIndex + dir + this.menuDefs.length) % this.menuDefs.length;
    this.updateSelection();
  }

  private updateSelection(): void {
    const selectedText = this.menuTexts[this.selectedIndex];
    this.cursor.setPosition(selectedText.x - selectedText.width / 2 - 12, selectedText.y);

    this.menuTexts.forEach((text, i) => {
      text.setColor(i === this.selectedIndex ? '#e94560' : '#ffffff');
    });

    this.descriptionText.setText(this.menuDefs[this.selectedIndex].description);
  }

  private confirmSelection(): void {
    const item = this.menuDefs[this.selectedIndex];
    if (item.forceCalibration) {
      this.game.registry.set('forceCalibration', true);
      this.scene.start(item.scene!);
    } else if (item.scene) {
      this.scene.start(item.scene);
    } else if (item.mode) {
      this.game.registry.set('gameMode', item.mode);
      this.scene.start('Permission');
    }
  }
}
