import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { InputState } from './InputManager';
import type { CalibrationProfile } from './CalibrationProfile';

// Landmark indices
const L_EYE_OUTER = 33;
const L_EYE_INNER = 133;
const L_EYE_UPPER = 159;
const L_EYE_LOWER = 145;
const R_EYE_OUTER = 362;
const R_EYE_INNER = 263;
const R_EYE_UPPER = 386;
const R_EYE_LOWER = 374;
const L_BROW_MID = 66;
const R_BROW_MID = 296;

const RING_SIZE = 6;
const EMA_ALPHA = 0.25;
const MIN_FRAME_MS = 33; // cap at ~30fps
const BROW_COOLDOWN_MS = 300;
const WINK_COOLDOWN_MS = 350;
const WINK_MIN_HOLD_MS = 80;
const WINK_MAX_HOLD_MS = 600;
const BLINK_COOLDOWN_MS = 350;

// Cache the landmarker across scene restarts to avoid re-downloading the ML model
let cachedLandmarker: FaceLandmarker | null = null;

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function median(arr: number[], fallback = 0): number {
  if (arr.length === 0) return fallback;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default class FaceInput implements InputState {
  laneUp = false;
  laneDown = false;
  fire = false;
  debugToggle = false;
  confirm = false;

  // Diagnostics
  eyebrowScore = 0;
  leftEyeOpen = 0;
  rightEyeOpen = 0;
  hasFace = false;

  /** Whether the face landmarker initialized successfully */
  initialized = false;

  private landmarker: FaceLandmarker | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private calibration: CalibrationProfile;
  private lastDetectTime = 0;

  // Ring buffers for smoothing
  private leftEyeRing: number[] = [];
  private rightEyeRing: number[] = [];
  private browEma = 0;
  private browEmaInit = false;

  // Edge detection state
  private prevBrowRaised = false;
  private lastBrowFireTime = 0;

  // Wink detection state
  private winkStartTime = 0;
  private winkSide: 'left' | 'right' | null = null;
  private lastWinkTime = 0;

  // Both-eyes-closed detection state
  private prevBothClosed = false;
  private lastBlinkDownTime = 0;

  constructor(calibration: CalibrationProfile) {
    this.calibration = calibration;
  }

  async create(videoEl: HTMLVideoElement): Promise<boolean> {
    this.videoEl = videoEl;
    if (cachedLandmarker) {
      this.landmarker = cachedLandmarker;
      this.initialized = true;
      return true;
    }
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm',
      );
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFacialTransformationMatrixes: false,
        outputFaceBlendshapes: false,
      });
      cachedLandmarker = this.landmarker;
      this.initialized = true;
      return true;
    } catch (err) {
      console.warn('FaceInput: failed to load model, face controls disabled', err);
      this.landmarker = null;
      this.initialized = false;
      return false;
    }
  }

  update(): void {
    if (!this.landmarker || !this.videoEl || this.videoEl.readyState < 2) {
      this.laneUp = false;
      this.laneDown = false;
      this.hasFace = false;
      return;
    }

    const now = performance.now();
    if (now - this.lastDetectTime < MIN_FRAME_MS) {
      this.laneUp = false;
      this.laneDown = false;
      return;
    }
    this.lastDetectTime = now;

    const result = this.landmarker.detectForVideo(this.videoEl, now);
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      this.hasFace = false;
      this.laneUp = false;
      this.laneDown = false;
      return;
    }

    this.hasFace = true;
    const lm = result.faceLandmarks[0];

    // Compute eye openness
    const lEyeWidth = dist(lm[L_EYE_OUTER], lm[L_EYE_INNER]);
    const rEyeWidth = dist(lm[R_EYE_OUTER], lm[R_EYE_INNER]);
    const rawLeftOpen =
      Math.abs(lm[L_EYE_UPPER].y - lm[L_EYE_LOWER].y) / (lEyeWidth || 1);
    const rawRightOpen =
      Math.abs(lm[R_EYE_UPPER].y - lm[R_EYE_LOWER].y) / (rEyeWidth || 1);

    // Ring buffer smoothing (median)
    this.leftEyeRing.push(rawLeftOpen);
    if (this.leftEyeRing.length > RING_SIZE) this.leftEyeRing.shift();
    this.rightEyeRing.push(rawRightOpen);
    if (this.rightEyeRing.length > RING_SIZE) this.rightEyeRing.shift();

    this.leftEyeOpen = median(this.leftEyeRing);
    this.rightEyeOpen = median(this.rightEyeRing);

    // Compute brow score (EMA)
    const lBrowDist =
      (lm[L_EYE_UPPER].y - lm[L_BROW_MID].y) / (lEyeWidth || 1);
    const rBrowDist =
      (lm[R_EYE_UPPER].y - lm[R_BROW_MID].y) / (rEyeWidth || 1);
    const rawBrow = (lBrowDist + rBrowDist) / 2;

    if (!this.browEmaInit) {
      this.browEma = rawBrow;
      this.browEmaInit = true;
    } else {
      this.browEma = EMA_ALPHA * rawBrow + (1 - EMA_ALPHA) * this.browEma;
    }
    this.eyebrowScore = this.browEma;

    // Eyebrow raise edge detection → laneUp
    const browDelta = this.eyebrowScore - this.calibration.browNeutral;
    const browRaised = browDelta > this.calibration.browRaiseThreshold;

    this.laneUp = false;
    if (browRaised && !this.prevBrowRaised) {
      if (now - this.lastBrowFireTime > BROW_COOLDOWN_MS) {
        this.laneUp = true;
        this.lastBrowFireTime = now;
      }
    }
    this.prevBrowRaised = browRaised;

    // Wink detection → laneDown
    this.laneDown = false;
    const cal = this.calibration;
    const leftClosed = this.leftEyeOpen < cal.winkClosedThreshold;
    const rightClosed = this.rightEyeOpen < cal.winkClosedThreshold;
    const leftOpen = this.leftEyeOpen > cal.winkOpenThreshold;
    const rightOpen = this.rightEyeOpen > cal.winkOpenThreshold;

    // Both eyes closed → laneDown
    if (leftClosed && rightClosed) {
      if (!this.prevBothClosed) {
        if (now - this.lastBlinkDownTime > BLINK_COOLDOWN_MS) {
          this.laneDown = true;
          this.lastBlinkDownTime = now;
        }
      }
      this.prevBothClosed = true;
      this.winkSide = null;
      this.winkStartTime = 0;
    } else if (leftClosed && rightOpen) {
      this.prevBothClosed = false;
      if (this.winkSide !== 'left') {
        this.winkSide = 'left';
        this.winkStartTime = now;
      }
    } else if (rightClosed && leftOpen) {
      this.prevBothClosed = false;
      if (this.winkSide !== 'right') {
        this.winkSide = 'right';
        this.winkStartTime = now;
      }
    } else {
      this.prevBothClosed = false;
      // Wink released — check if duration was in valid range
      if (this.winkSide && this.winkStartTime > 0) {
        const held = now - this.winkStartTime;
        if (
          held >= WINK_MIN_HOLD_MS &&
          held <= WINK_MAX_HOLD_MS &&
          now - this.lastWinkTime > WINK_COOLDOWN_MS
        ) {
          this.laneDown = true;
          this.lastWinkTime = now;
        }
      }
      this.winkSide = null;
      this.winkStartTime = 0;
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
    // Don't close the landmarker — it's cached for reuse across scene restarts
    this.landmarker = null;
  }
}
