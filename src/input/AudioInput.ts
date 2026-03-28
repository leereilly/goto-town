import type { InputState } from './InputManager';
import type { CalibrationProfile } from './CalibrationProfile';

// Cache the AudioContext across scene restarts to avoid re-creation overhead
let cachedAudioCtx: AudioContext | null = null;

export default class AudioInput implements InputState {
  laneUp = false;
  laneDown = false;
  fire = false;
  debugToggle = false;
  confirm = false;

  // Diagnostics
  audioRms = 0;

  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private audioCtx: AudioContext | null = null;
  private calibration: CalibrationProfile;
  private prevAbove = false;

  constructor(calibration: CalibrationProfile) {
    this.calibration = calibration;
  }

  async create(stream: MediaStream): Promise<void> {
    try {
      this.audioCtx = cachedAudioCtx ?? new AudioContext();
      cachedAudioCtx = this.audioCtx;
      await this.audioCtx.resume();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.fftSize);
    } catch (err) {
      console.warn('AudioInput: failed to create audio context', err);
      this.analyser = null;
    }
  }

  update(): void {
    this.fire = false;

    if (!this.analyser || !this.dataArray) return;

    this.analyser.getByteTimeDomainData(this.dataArray);

    // Compute RMS
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = (this.dataArray[i] - 128) / 128;
      sum += v * v;
    }
    this.audioRms = Math.sqrt(sum / this.dataArray.length);

    const threshold = this.calibration.audioShoutThreshold;

    // Edge detection with hysteresis
    if (this.audioRms > threshold && !this.prevAbove) {
      this.fire = true;
      this.prevAbove = true;
    }

    if (this.prevAbove && this.audioRms < threshold * 0.8) {
      this.prevAbove = false;
    }
  }

  reset(): void {
    this.laneUp = false;
    this.laneDown = false;
    this.fire = false;
    this.debugToggle = false;
    this.confirm = false;
  }

  destroy(): void {
    // Don't close the AudioContext — it's cached for reuse across scene restarts
    this.audioCtx = null;
    this.analyser = null;
  }
}
