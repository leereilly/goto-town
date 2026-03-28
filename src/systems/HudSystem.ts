import { MAX_HP, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { formatTime } from '../data/HighScoreManager';

export default class HudSystem {
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private distanceBarBg!: Phaser.GameObjects.Graphics;
  private distanceBarFill!: Phaser.GameObjects.Graphics;
  private stageText!: Phaser.GameObjects.Text;
  private fireIcon!: Phaser.GameObjects.Sprite;
  private fireReadyText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  // Webcam overlay
  private webcamSprite: Phaser.GameObjects.Image | null = null;
  private webcamBorder: Phaser.GameObjects.Graphics | null = null;
  private webcamCanvas: Phaser.Textures.CanvasTexture | null = null;
  private videoEl: HTMLVideoElement | null = null;

  create(scene: Phaser.Scene): void {
    // Hearts at top-left
    for (let i = 0; i < MAX_HP; i++) {
      const heart = scene.add.sprite(10 + i * 12, 10, 'heart');
      heart.setDepth(10);
      heart.setOrigin(0, 0);
      this.hearts.push(heart);
    }

    // Distance meter at top-center
    this.distanceBarBg = scene.add.graphics();
    this.distanceBarBg.setDepth(10);
    this.distanceBarFill = scene.add.graphics();
    this.distanceBarFill.setDepth(10);

    // Stage name
    this.stageText = scene.add.text(GAME_WIDTH - 4, 4, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
    });
    this.stageText.setOrigin(1, 0);
    this.stageText.setDepth(10);

    // Timer
    this.timerText = scene.add.text(GAME_WIDTH - 4, 14, '0:00', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#cccccc',
    });
    this.timerText.setOrigin(1, 0);
    this.timerText.setDepth(10);

    // Fire cooldown indicator
    this.fireIcon = scene.add.sprite(10, 24, 'fire_icon');
    this.fireIcon.setDepth(10);
    this.fireIcon.setOrigin(0, 0);

    this.fireReadyText = scene.add.text(20, 23, 'HONK', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#ff9800',
    });
    this.fireReadyText.setDepth(10);

    // Webcam picture-in-picture
    this.initWebcam(scene);
  }

  private initWebcam(scene: Phaser.Scene): void {
    const hasWebcam = scene.game.registry.get('hasWebcam') ?? false;
    if (!hasWebcam) return;

    const videoEl = document.getElementById('webcam') as HTMLVideoElement | null;
    if (!videoEl || videoEl.readyState < 2) return;

    this.videoEl = videoEl;
    const displayW = 48;
    const displayH = 36;
    // Render at higher resolution so the feed isn't blocky
    const texW = displayW * 4;
    const texH = displayH * 4;

    // Remove stale texture from a previous game session if present
    if (scene.textures.exists('webcam-hud')) {
      scene.textures.remove('webcam-hud');
    }
    this.webcamCanvas = scene.textures.createCanvas('webcam-hud', texW, texH);

    const camX = GAME_WIDTH - displayW - 3;
    const camY = GAME_HEIGHT - displayH - 3;

    this.webcamBorder = scene.add.graphics();
    this.webcamBorder.setDepth(10);
    this.webcamBorder.fillStyle(0x000000, 0.5);
    this.webcamBorder.fillRect(camX - 1, camY - 1, displayW + 2, displayH + 2);
    this.webcamBorder.lineStyle(1, 0xffffff, 0.6);
    this.webcamBorder.strokeRect(camX - 1, camY - 1, displayW + 2, displayH + 2);

    this.webcamSprite = scene.add.image(camX, camY, 'webcam-hud');
    this.webcamSprite.setOrigin(0, 0);
    this.webcamSprite.setDisplaySize(displayW, displayH);
    this.webcamSprite.setDepth(10);
    this.webcamSprite.setFlipX(true);

    // Use smooth filtering for the webcam despite pixelArt mode
    if (this.webcamCanvas) {
      this.webcamCanvas.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }

  update(hp: number, distance: number, stageName: string, fireCooldownPct: number, elapsedTime: number): void {
    // Hearts
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < hp ? 'heart' : 'heart_empty');
    }

    // Distance bar
    const barX = 70;
    const barY = 6;
    const barW = 120;
    const barH = 6;

    this.distanceBarBg.clear();
    this.distanceBarBg.fillStyle(0x333333, 1);
    this.distanceBarBg.fillRect(barX, barY, barW, barH);
    this.distanceBarBg.lineStyle(1, 0xffffff, 0.5);
    this.distanceBarBg.strokeRect(barX, barY, barW, barH);

    this.distanceBarFill.clear();
    this.distanceBarFill.fillStyle(0x4caf50, 1);
    this.distanceBarFill.fillRect(barX + 1, barY + 1, (barW - 2) * distance, barH - 2);

    // Stage name
    this.stageText.setText(stageName);

    // Timer
    this.timerText.setText(formatTime(elapsedTime));

    // Fire indicator
    if (fireCooldownPct >= 1) {
      this.fireIcon.setAlpha(1);
      this.fireReadyText.setColor('#ff9800');
      this.fireReadyText.setText('HONK');
    } else {
      this.fireIcon.setAlpha(0.3);
      this.fireReadyText.setColor('#666666');
      this.fireReadyText.setText('WAIT');
    }

    // Webcam feed
    if (this.webcamCanvas && this.videoEl) {
      const ctx = this.webcamCanvas.getContext();
      ctx.drawImage(this.videoEl, 0, 0, this.webcamCanvas.width, this.webcamCanvas.height);
      this.webcamCanvas.refresh();
    }
  }

  destroy(): void {
    for (const h of this.hearts) h.destroy();
    this.hearts = [];
    this.distanceBarBg?.destroy();
    this.distanceBarFill?.destroy();
    this.stageText?.destroy();
    this.timerText?.destroy();
    this.fireIcon?.destroy();
    this.fireReadyText?.destroy();
    this.webcamSprite?.destroy();
    this.webcamSprite = null;
    this.webcamBorder?.destroy();
    this.webcamBorder = null;
    this.webcamCanvas = null;
    this.videoEl = null;
  }
}
