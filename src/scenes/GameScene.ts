import Phaser from 'phaser';
import PlayerBike from '../entities/PlayerBike';
import RoadRenderer from '../gfx/roadRenderer';
import SpawnSystem from '../systems/SpawnSystem';
import TrafficSystem from '../systems/TrafficSystem';
import CollisionSystem from '../systems/CollisionSystem';
import StageSystem from '../systems/StageSystem';
import HudSystem from '../systems/HudSystem';
import DebugOverlay from '../systems/DebugOverlay';
import InputManager from '../input/InputManager';
import { loadCalibration, defaultCalibration } from '../input/CalibrationProfile';
import { sfx } from '../audio/sfx';
import { MAX_HP } from '../config/constants';
import type { GameMode } from '../systems/StageSystem';

interface GameSceneData {
  stage?: number;
  hp?: number;
  elapsedTime?: number;
}

export default class GameScene extends Phaser.Scene {
  private player!: PlayerBike;
  private roadRenderer!: RoadRenderer;
  private spawnSystem!: SpawnSystem;
  private trafficSystem!: TrafficSystem;
  private collisionSystem!: CollisionSystem;
  private stageSystem!: StageSystem;
  private hudSystem!: HudSystem;
  private debugOverlay!: DebugOverlay;
  private inputManager!: InputManager;

  private initStage: number = 0;
  private initHp: number = MAX_HP;
  private initElapsedTime: number = 0;
  private elapsedTime: number = 0;

  constructor() {
    super('Game');
  }

  init(data?: GameSceneData): void {
    this.initStage = data?.stage ?? 0;
    this.initHp = data?.hp ?? MAX_HP;
    this.initElapsedTime = data?.elapsedTime ?? 0;
  }

  create(): void {
    sfx.init();

    // Road renderer
    this.roadRenderer = new RoadRenderer();
    this.roadRenderer.create(this);

    // Player
    this.player = new PlayerBike();
    this.player.hp = this.initHp;
    this.player.create(this);

    // Systems
    this.spawnSystem = new SpawnSystem();
    this.trafficSystem = new TrafficSystem();
    this.collisionSystem = new CollisionSystem();

    this.stageSystem = new StageSystem();
    this.stageSystem.gameMode = (this.game.registry.get('gameMode') as GameMode) ?? 'campaign';
    this.stageSystem.setStage(this.initStage);
    this.elapsedTime = this.initElapsedTime;

    this.hudSystem = new HudSystem();
    this.hudSystem.create(this);

    this.debugOverlay = new DebugOverlay();
    this.debugOverlay.create(this);

    // Input — keyboard works immediately; face/audio init is async
    const calibration = loadCalibration() ?? defaultCalibration();
    const hasWebcam = this.game.registry.get('hasWebcam') ?? false;
    const hasMic = this.game.registry.get('hasMic') ?? false;
    const stream = this.game.registry.get('userMediaStream') as MediaStream | undefined;
    const videoEl = document.getElementById('webcam') as HTMLVideoElement | null;

    this.inputManager = new InputManager({
      calibration,
      enableFace: hasWebcam,
      enableAudio: hasMic,
      videoEl: videoEl,
      micStream: stream ?? null,
    });

    // Start async init — keyboard works immediately
    this.inputManager.create(this).catch((err) => {
      console.warn('GameScene: InputManager async init error', err);
    });
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000; // seconds
    this.elapsedTime += dt;

    // 1. Read input
    this.inputManager.update();

    // 2. Lane switching
    if (this.inputManager.laneUp) {
      if (this.player.moveUp()) {
        sfx.play('laneMove');
      }
    }
    if (this.inputManager.laneDown) {
      if (this.player.moveDown()) {
        sfx.play('laneMove');
      }
    }

    // 3. Fire
    if (this.inputManager.fire) {
      if (this.player.fire(time)) {
        sfx.play('fire');
        this.collisionSystem.handleFire(
          this.player,
          this.spawnSystem.getObstacles(),
          time,
          this
        );
      }
    }

    // 4. Debug toggle
    if (this.inputManager.debugToggle) {
      this.debugOverlay.toggle();
    }

    const stageConfig = this.stageSystem.getCurrentStageConfig();

    // 5. Stage progress
    this.stageSystem.update(dt);

    // 6. Road scrolling
    this.roadRenderer.update(dt, 60 * stageConfig.speedMultiplier, stageConfig);

    // 7. Spawn system
    this.spawnSystem.update(time, dt, this, stageConfig);

    // 8. Traffic system
    this.trafficSystem.update(dt, this.spawnSystem.getObstacles(), stageConfig.speedMultiplier);

    // 9. Collision detection
    const hitObstacle = this.collisionSystem.checkCollisions(
      this.player,
      this.spawnSystem.getObstacles(),
      time
    );
    if (hitObstacle) {
      this.player.takeDamage(time);
      sfx.play('hit');
      if (this.player.hp <= 0) {
        sfx.play('gameOver');
        this.cleanup();
        this.scene.start('GameOver', {
          elapsedTime: this.elapsedTime,
          stage: this.stageSystem.currentStage,
        });
        return;
      }
    }

    // 10. Player update
    this.player.update(time, delta);

    // 11. HUD update
    this.hudSystem.update(
      this.player.hp,
      this.stageSystem.getProgress(),
      stageConfig.name,
      this.player.getFireCooldownPct(time),
      this.elapsedTime
    );

    // 12. Debug overlay
    const diag = this.inputManager.getDiagnostics();
    this.debugOverlay.update({
      fps: Math.round(this.game.loop.actualFps),
      lane: this.player.currentLane,
      hp: this.player.hp,
      stage: this.stageSystem.currentStage,
      distance: this.stageSystem.getProgress(),
      obstacleCount: this.spawnSystem.getObstacles().filter((o) => o.active).length,
      fireCooldown: Math.max(0, this.player.fireCooldownUntil - time),
      inputMode: diag.inputMode,
      eyebrowScore: diag.eyebrowScore,
      leftEyeOpen: diag.leftEyeOpen,
      rightEyeOpen: diag.rightEyeOpen,
      audioRms: diag.audioRms,
      hasFace: diag.hasFace,
    });

    // 13. Stage complete check
    if (this.stageSystem.stageComplete) {
      if (this.stageSystem.isLastStage()) {
        sfx.play('victory');
        this.cleanup();
        this.scene.start('Victory', { elapsedTime: this.elapsedTime });
      } else {
        sfx.play('stageComplete');
        this.cleanup();
        this.scene.start('StageComplete', {
          stage: this.stageSystem.currentStage,
          hp: this.player.hp,
          elapsedTime: this.elapsedTime,
        });
      }
      return;
    }

    // 14. Reset input
    this.inputManager.reset();
  }

  private cleanup(): void {
    this.spawnSystem.reset();
    this.roadRenderer.destroy();
    this.hudSystem.destroy();
    this.debugOverlay.destroy();
    this.player.destroy();
    this.inputManager.destroy();
  }
}
