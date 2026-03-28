import { STAGES, getEndlessStageConfig, type StageConfig } from '../data/stages';
import { STAGE_DURATION } from '../config/constants';

export type GameMode = 'campaign' | 'endless';

export default class StageSystem {
  currentStage: number = 0;
  distance: number = 0;
  stageComplete: boolean = false;
  gameMode: GameMode = 'campaign';

  update(delta: number): void {
    if (this.stageComplete) return;
    this.distance += delta / STAGE_DURATION;
    if (this.distance >= 1) {
      this.distance = 1;
      this.stageComplete = true;
    }
  }

  getProgress(): number {
    return this.distance;
  }

  getCurrentStageConfig(): StageConfig {
    if (this.gameMode === 'endless') {
      return getEndlessStageConfig(this.currentStage);
    }
    return STAGES[this.currentStage];
  }

  advanceStage(): boolean {
    if (this.gameMode === 'campaign' && this.currentStage >= STAGES.length - 1) return false;
    this.currentStage++;
    this.distance = 0;
    this.stageComplete = false;
    return true;
  }

  reset(): void {
    this.currentStage = 0;
    this.distance = 0;
    this.stageComplete = false;
  }

  setStage(stage: number): void {
    if (this.gameMode === 'campaign') {
      this.currentStage = Math.min(stage, STAGES.length - 1);
    } else {
      this.currentStage = stage;
    }
    this.distance = 0;
    this.stageComplete = false;
  }

  isLastStage(): boolean {
    if (this.gameMode === 'endless') return false;
    return this.currentStage >= STAGES.length - 1;
  }

  getCycle(): number {
    return Math.floor(this.currentStage / STAGES.length);
  }
}
