import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { loadCalibration } from '../input/CalibrationProfile';

export default class PermissionScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private permissionsGranted = false;
  private permissionsResolved = false;

  constructor() {
    super('Permission');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.permissionsGranted = false;
    this.permissionsResolved = false;

    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'Requesting camera & mic...', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 20 },
      })
      .setOrigin(0.5, 0.5);

    this.instructionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 20 },
      })
      .setOrigin(0.5, 0.5);

    this.requestPermissions();

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on(
      'down',
      () => {
        if (!this.permissionsResolved) return;
        const forceCalibration = this.game.registry.get('forceCalibration') ?? false;
        if (this.permissionsGranted) {
          const hasExisting = loadCalibration() !== null;
          if (hasExisting && !forceCalibration) {
            this.scene.start('Game', { stage: 0, hp: 3 });
          } else {
            this.scene.start('Calibration');
          }
        } else {
          this.scene.start('Game', { stage: 0, hp: 3 });
        }
      },
    );
  }

  private async requestPermissions(): Promise<void> {
    let hasWebcam = false;
    let hasMic = false;
    let stream: MediaStream | null = null;

    // Try combined request first (single permission prompt, single user gesture)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      hasWebcam = stream.getVideoTracks().length > 0;
      hasMic = stream.getAudioTracks().length > 0;
    } catch {
      // Combined failed — try each separately as fallback
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        hasWebcam = true;
      } catch {
        // No camera
      }
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        hasMic = true;
        if (stream) {
          for (const track of audioStream.getAudioTracks()) {
            stream.addTrack(track);
          }
        } else {
          stream = audioStream;
        }
      } catch {
        // No mic
      }
    }

    if ((hasWebcam || hasMic) && stream) {
      // Attach video to webcam element
      const videoEl = document.getElementById('webcam') as HTMLVideoElement;
      if (videoEl && hasWebcam) {
        videoEl.srcObject = new MediaStream(stream.getVideoTracks());
        await videoEl.play().catch(() => {});
      }

      // Store mic stream separately for AudioInput
      if (hasMic) {
        this.game.registry.set('micStream', new MediaStream(stream.getAudioTracks()));
      }

      this.game.registry.set('userMediaStream', stream);
      this.game.registry.set('hasWebcam', hasWebcam);
      this.game.registry.set('hasMic', hasMic);
      this.permissionsGranted = true;

      const parts: string[] = [];
      if (hasWebcam) parts.push('Camera');
      if (hasMic) parts.push('Mic');
      this.statusText.setText(`${parts.join(' & ')} ready!`);
      this.statusText.setColor('#00ff00');
      const forceCalibration = this.game.registry.get('forceCalibration') ?? false;
      const hasExisting = loadCalibration() !== null;
      if (hasExisting && !forceCalibration) {
        this.instructionText.setText('Press ENTER to play');
      } else {
        this.instructionText.setText(
          'Press ENTER to calibrate\nface & voice controls',
        );
      }
    } else {
      this.game.registry.set('hasWebcam', false);
      this.game.registry.set('hasMic', false);
      this.permissionsGranted = false;

      this.statusText.setText('Camera/mic not available');
      this.statusText.setColor('#e94560');
      this.instructionText.setText(
        'Using keyboard controls only\nPress ENTER to continue',
      );
    }

    this.permissionsResolved = true;
  }
}
