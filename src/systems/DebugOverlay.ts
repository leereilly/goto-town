export default class DebugOverlay {
  private visible: boolean = false;
  private text!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Graphics;

  create(scene: Phaser.Scene): void {
    this.bg = scene.add.graphics();
    this.bg.setDepth(20);
    this.bg.setVisible(false);

    this.text = scene.add.text(4, 36, '', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#00ff00',
      lineSpacing: 2,
    });
    this.text.setDepth(20);
    this.text.setVisible(false);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.text.setVisible(this.visible);
    this.bg.setVisible(this.visible);
  }

  update(data: {
    fps: number;
    lane: number;
    hp: number;
    stage: number;
    distance: number;
    obstacleCount: number;
    fireCooldown: number;
    inputMode?: string;
    eyebrowScore?: number;
    leftEyeOpen?: number;
    rightEyeOpen?: number;
    audioRms?: number;
    hasFace?: boolean;
  }): void {
    if (!this.visible) return;

    const lines = [
      `FPS: ${data.fps}`,
      `Lane: ${data.lane}`,
      `HP: ${data.hp}`,
      `Stage: ${data.stage + 1}`,
      `Dist: ${(data.distance * 100).toFixed(1)}%`,
      `Obstacles: ${data.obstacleCount}`,
      `Fire CD: ${data.fireCooldown.toFixed(0)}ms`,
    ];

    if (data.inputMode) {
      lines.push(`Input: ${data.inputMode}`);
    }
    if (data.hasFace !== undefined) {
      lines.push(`Face: ${data.hasFace ? 'yes' : 'no'}`);
    }
    if (data.eyebrowScore !== undefined) {
      lines.push(`Brow: ${data.eyebrowScore.toFixed(3)}`);
    }
    if (data.leftEyeOpen !== undefined) {
      lines.push(`L Eye: ${data.leftEyeOpen.toFixed(3)}`);
    }
    if (data.rightEyeOpen !== undefined) {
      lines.push(`R Eye: ${data.rightEyeOpen.toFixed(3)}`);
    }
    if (data.audioRms !== undefined) {
      lines.push(`Audio: ${data.audioRms.toFixed(3)}`);
    }

    this.text.setText(lines.join('\n'));

    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.7);
    this.bg.fillRect(2, 34, 80, lines.length * 10 + 4);
  }

  destroy(): void {
    this.text?.destroy();
    this.bg?.destroy();
  }
}
