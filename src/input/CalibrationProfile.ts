export interface CalibrationProfile {
  version: 1;
  browNeutral: number;
  browRaiseThreshold: number;
  leftEyeOpenNeutral: number;
  rightEyeOpenNeutral: number;
  winkClosedThreshold: number;
  winkOpenThreshold: number;
  audioNoiseFloor: number;
  audioSpeechLevel: number;
  audioShoutThreshold: number;
}

const STORAGE_KEY = 'ebrtr_calibration_v1';

export function defaultCalibration(): CalibrationProfile {
  return {
    version: 1,
    browNeutral: 0.28,
    browRaiseThreshold: 0.06,
    leftEyeOpenNeutral: 0.25,
    rightEyeOpenNeutral: 0.25,
    winkClosedThreshold: 0.12,
    winkOpenThreshold: 0.18,
    audioNoiseFloor: 0.01,
    audioSpeechLevel: 0.05,
    audioShoutThreshold: 0.15,
  };
}

export function loadCalibration(): CalibrationProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.version === 1) return data as CalibrationProfile;
    return null;
  } catch {
    return null;
  }
}

export function saveCalibration(profile: CalibrationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage unavailable or quota exceeded — game still starts fine
  }
}
