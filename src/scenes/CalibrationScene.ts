import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import FaceInput from '../input/FaceInput';
import AudioInput from '../input/AudioInput';
import {
  CalibrationProfile,
  defaultCalibration,
  saveCalibration,
} from '../input/CalibrationProfile';

type CalibrationStep = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

const MIN_FACE_SAMPLES = 10;

function median(arr: number[], fallback = 0): number {
  if (arr.length === 0) return fallback;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], pct: number, fallback = 0): number {
  if (arr.length === 0) return fallback;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * pct);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export default class CalibrationScene extends Phaser.Scene {
  private step: CalibrationStep = 'A';
  private statusText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private meterGfx!: Phaser.GameObjects.Graphics;

  private face: FaceInput | null = null;
  private audio: AudioInput | null = null;
  private profile!: CalibrationProfile;

  private stepTimer = 0;
  private samples: {
    browScores: number[];
    leftEyeOpen: number[];
    rightEyeOpen: number[];
    audioRms: number[];
  } = { browScores: [], leftEyeOpen: [], rightEyeOpen: [], audioRms: [] };

  private hasWebcam = false;
  private hasMic = false;
  private stepStarted = false;
  private peakRms = 0;
  private readDelay = 0;
  private readDuration = 2;
  private reading = false;
  private canProceed = false;

  constructor() {
    super('Calibration');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.step = 'A';
    this.stepStarted = false;
    this.canProceed = false;
    this.profile = defaultCalibration();
    this.hasWebcam = this.game.registry.get('hasWebcam') ?? false;
    this.hasMic = this.game.registry.get('hasMic') ?? false;

    this.statusText = this.add
      .text(GAME_WIDTH / 2, 30, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 20 },
      })
      .setOrigin(0.5, 0.5);

    this.instructionText = this.add
      .text(GAME_WIDTH / 2, 52, '', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#aaaaaa',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 20 },
      })
      .setOrigin(0.5, 0);

    this.meterGfx = this.add.graphics();
    this.meterGfx.setDepth(5);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on(
      'down',
      () => {
        if (this.step === 'G' && this.canProceed) {
          saveCalibration(this.profile);
          this.cleanup();
          this.scene.start('Game', { stage: 0, hp: 3 });
        }
      },
    );

    this.initInputs();
  }

  private async initInputs(): Promise<void> {
    const micStream = this.game.registry.get('micStream') as MediaStream | undefined;
    const stream = micStream ?? (this.game.registry.get('userMediaStream') as MediaStream | undefined);
    const videoEl = document.getElementById('webcam') as HTMLVideoElement | null;

    if (this.hasWebcam && videoEl) {
      this.face = new FaceInput(this.profile);
      const ok = await this.face.create(videoEl);
      if (!ok) {
        console.warn('CalibrationScene: face init failed, skipping face calibration');
        this.face = null;
        this.hasWebcam = false;
      }
    }

    if (this.hasMic && stream) {
      this.audio = new AudioInput(this.profile);
      await this.audio.create(stream);
    }

    this.step = this.hasWebcam ? 'A' : this.hasMic ? 'D' : 'G';
    this.startStep();
  }

  private startStep(): void {
    this.stepTimer = 0;
    this.stepStarted = true;
    this.samples = {
      browScores: [],
      leftEyeOpen: [],
      rightEyeOpen: [],
      audioRms: [],
    };
    this.peakRms = 0;

    const instructions: Record<CalibrationStep, string> = {
      A: 'Look at the camera with\na neutral expression (2s)',
      B: 'Raise your eyebrows\nas high as you can (2s)',
      C: 'Computing wink thresholds...',
      D: 'Stay quiet for 1 second\n(measuring silence)',
      E: 'Speak normally for 2 seconds\n(measuring speech level)',
      F: 'SHOUT or blow into the mic!\n(2s, capturing peak)',
      G: 'Calibration complete!\nTest your controls.\nPress ENTER to start game.',
    };

    this.statusText.setText(`Step ${this.step}`);
    this.instructionText.setText(instructions[this.step]);

    // Steps C and G need no read delay (instant / final)
    const needsReadDelay = this.step !== 'C' && this.step !== 'G';
    if (needsReadDelay) {
      this.reading = true;
      this.readDelay = 0;
      // Steps that ask the user to *do* something need extra lead time
      this.readDuration = this.step === 'E' || this.step === 'F' ? 3 : 2;
      this.statusText.setText(`Step ${this.step} — READ:`);
    } else {
      this.reading = false;
    }

    // Delay enabling ENTER on step G to prevent carry-over from previous scene
    if (this.step === 'G') {
      this.canProceed = false;
      this.time.delayedCall(300, () => {
        this.canProceed = true;
      });
    }
  }

  update(_time: number, delta: number): void {
    if (!this.stepStarted) return;

    const dt = delta / 1000;

    // Update inputs for diagnostics
    this.face?.update();
    this.audio?.update();

    this.drawMeters();

    // Read delay: show instructions for 2s before sampling begins
    if (this.reading) {
      this.readDelay += dt;
      if (this.readDelay >= this.readDuration) {
        this.reading = false;
        this.stepTimer = 0;
        this.statusText.setText(`Step ${this.step} — GO!`);
      }
      return;
    }

    this.stepTimer += dt;

    switch (this.step) {
      case 'A':
        this.stepA();
        break;
      case 'B':
        this.stepB();
        break;
      case 'C':
        this.stepC();
        break;
      case 'D':
        this.stepD();
        break;
      case 'E':
        this.stepE();
        break;
      case 'F':
        this.stepF();
        break;
      case 'G':
        // Live test mode — just show diagnostics
        break;
    }
  }

  private stepA(): void {
    if (this.face?.hasFace) {
      this.samples.browScores.push(this.face.eyebrowScore);
      this.samples.leftEyeOpen.push(this.face.leftEyeOpen);
      this.samples.rightEyeOpen.push(this.face.rightEyeOpen);
    }

    if (this.stepTimer >= 2) {
      const defaults = defaultCalibration();
      if (this.samples.browScores.length < MIN_FACE_SAMPLES) {
        console.warn('CalibrationScene: insufficient face samples in step A, using defaults');
        this.profile.browNeutral = defaults.browNeutral;
        this.profile.leftEyeOpenNeutral = defaults.leftEyeOpenNeutral;
        this.profile.rightEyeOpenNeutral = defaults.rightEyeOpenNeutral;
      } else {
        this.profile.browNeutral = median(this.samples.browScores, defaults.browNeutral);
        this.profile.leftEyeOpenNeutral = median(this.samples.leftEyeOpen, defaults.leftEyeOpenNeutral);
        this.profile.rightEyeOpenNeutral = median(this.samples.rightEyeOpen, defaults.rightEyeOpenNeutral);
      }
      this.step = 'B';
      this.startStep();
    }
  }

  private stepB(): void {
    if (this.face?.hasFace) {
      const delta = this.face.eyebrowScore - this.profile.browNeutral;
      this.samples.browScores.push(delta);
    }

    if (this.stepTimer >= 2) {
      const defaults = defaultCalibration();
      if (this.samples.browScores.length < MIN_FACE_SAMPLES) {
        console.warn('CalibrationScene: insufficient face samples in step B, using defaults');
        this.profile.browRaiseThreshold = defaults.browRaiseThreshold;
      } else {
        const p95 = percentile(this.samples.browScores, 0.95, defaults.browRaiseThreshold);
        this.profile.browRaiseThreshold = p95 * 0.6;
      }
      this.step = 'C';
      this.startStep();
    }
  }

  private stepC(): void {
    const defaults = defaultCalibration();
    const minNeutral = Math.min(this.profile.leftEyeOpenNeutral, this.profile.rightEyeOpenNeutral);

    if (minNeutral <= 0) {
      // Neutral values are bogus (no face detected), use defaults
      this.profile.winkClosedThreshold = defaults.winkClosedThreshold;
      this.profile.winkOpenThreshold = defaults.winkOpenThreshold;
    } else {
      this.profile.winkClosedThreshold = minNeutral * 0.45;
      this.profile.winkOpenThreshold = minNeutral * 0.75;
    }

    if (this.hasMic) {
      this.step = 'D';
    } else {
      this.step = 'G';
    }
    this.startStep();
  }

  private stepD(): void {
    if (this.audio) {
      this.samples.audioRms.push(this.audio.audioRms);
    }

    if (this.stepTimer >= 1) {
      this.profile.audioNoiseFloor = median(this.samples.audioRms);
      this.step = 'E';
      this.startStep();
    }
  }

  private stepE(): void {
    if (this.audio) {
      this.samples.audioRms.push(this.audio.audioRms);
    }

    if (this.stepTimer >= 2) {
      this.profile.audioSpeechLevel = median(this.samples.audioRms);
      this.step = 'F';
      this.startStep();
    }
  }

  private stepF(): void {
    if (this.audio) {
      if (this.audio.audioRms > this.peakRms) {
        this.peakRms = this.audio.audioRms;
      }
    }

    if (this.stepTimer >= 2) {
      this.profile.audioShoutThreshold = Math.max(
        this.profile.audioSpeechLevel * 1.6,
        this.peakRms * 0.7,
        this.profile.audioNoiseFloor + 0.08,
      );
      this.step = 'G';
      this.startStep();
    }
  }

  private drawMeters(): void {
    this.meterGfx.clear();
    const barX = 30;
    const barW = GAME_WIDTH - 60;
    let y = 90;

    if (this.face) {
      // Brow score
      this.drawBar(barX, y, barW, 8, this.face.eyebrowScore, 0.6, 0x00ff00, 'Brow');
      y += 16;
      // Left eye
      this.drawBar(barX, y, barW, 8, this.face.leftEyeOpen, 0.5, 0x00aaff, 'L Eye');
      y += 16;
      // Right eye
      this.drawBar(barX, y, barW, 8, this.face.rightEyeOpen, 0.5, 0x00aaff, 'R Eye');
      y += 16;
    }

    if (this.audio) {
      this.drawBar(barX, y, barW, 8, this.audio.audioRms, 0.3, 0xff6600, 'Audio');
    }
  }

  private drawBar(
    x: number,
    y: number,
    w: number,
    h: number,
    value: number,
    maxVal: number,
    color: number,
    _label: string,
  ): void {
    // Background
    this.meterGfx.fillStyle(0x333333, 0.8);
    this.meterGfx.fillRect(x, y, w, h);
    // Fill
    const fillW = Math.min(value / maxVal, 1) * w;
    this.meterGfx.fillStyle(color, 0.9);
    this.meterGfx.fillRect(x, y, fillW, h);
  }

  private cleanup(): void {
    this.face?.destroy();
    this.audio?.destroy();
  }
}
