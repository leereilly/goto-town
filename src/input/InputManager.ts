import KeyboardInput from './KeyboardInput';
import FaceInput from './FaceInput';
import AudioInput from './AudioInput';
import type { CalibrationProfile } from './CalibrationProfile';

export interface InputState {
  laneUp: boolean;
  laneDown: boolean;
  fire: boolean;
  debugToggle: boolean;
  confirm: boolean;
}

export interface InputDiagnostics {
  inputMode: 'keyboard' | 'hybrid' | 'keyboard-only';
  eyebrowScore?: number;
  leftEyeOpen?: number;
  rightEyeOpen?: number;
  audioRms?: number;
  hasFace?: boolean;
}

export default class InputManager implements InputState {
  laneUp = false;
  laneDown = false;
  fire = false;
  debugToggle = false;
  confirm = false;

  private kb: KeyboardInput;
  private face: FaceInput | null = null;
  private audio: AudioInput | null = null;
  private enableFace: boolean;
  private enableAudio: boolean;
  private videoEl: HTMLVideoElement | null;
  private micStream: MediaStream | null;

  constructor(options: {
    calibration: CalibrationProfile;
    enableFace?: boolean;
    enableAudio?: boolean;
    videoEl?: HTMLVideoElement | null;
    micStream?: MediaStream | null;
  }) {
    this.kb = new KeyboardInput();
    this.enableFace = options.enableFace ?? false;
    this.enableAudio = options.enableAudio ?? false;
    this.videoEl = options.videoEl ?? null;
    this.micStream = options.micStream ?? null;

    if (this.enableFace) {
      this.face = new FaceInput(options.calibration);
    }
    if (this.enableAudio) {
      this.audio = new AudioInput(options.calibration);
    }
  }

  async create(scene: Phaser.Scene): Promise<void> {
    this.kb.create(scene);

    if (this.face && this.videoEl) {
      try {
        await this.face.create(this.videoEl);
      } catch (err) {
        console.warn('InputManager: face input init failed', err);
        this.face = null;
      }
    }

    if (this.audio && this.micStream) {
      try {
        await this.audio.create(this.micStream);
      } catch (err) {
        console.warn('InputManager: audio input init failed', err);
        this.audio = null;
      }
    }
  }

  update(): void {
    this.kb.update();
    this.face?.update();
    this.audio?.update();

    this.laneUp = this.kb.laneUp || (this.face?.laneUp ?? false);
    this.laneDown = this.kb.laneDown || (this.face?.laneDown ?? false);
    this.fire = this.kb.fire || (this.audio?.fire ?? false);
    this.debugToggle = this.kb.debugToggle;
    this.confirm = this.kb.confirm;

    // Conflict: if both laneUp and laneDown, cancel both
    if (this.laneUp && this.laneDown) {
      this.laneUp = false;
      this.laneDown = false;
    }
  }

  reset(): void {
    this.laneUp = false;
    this.laneDown = false;
    this.fire = false;
    this.debugToggle = false;
    this.confirm = false;
    this.kb.reset();
    this.face?.reset();
    this.audio?.reset();
  }

  getDiagnostics(): InputDiagnostics {
    const hasFaceOrAudio = !!this.face || !!this.audio;
    const mode: InputDiagnostics['inputMode'] = hasFaceOrAudio
      ? 'hybrid'
      : this.enableFace || this.enableAudio
        ? 'keyboard-only'
        : 'keyboard';

    return {
      inputMode: mode,
      eyebrowScore: this.face?.eyebrowScore,
      leftEyeOpen: this.face?.leftEyeOpen,
      rightEyeOpen: this.face?.rightEyeOpen,
      audioRms: this.audio?.audioRms,
      hasFace: this.face?.hasFace,
    };
  }

  destroy(): void {
    this.face?.destroy();
    this.audio?.destroy();
  }
}
