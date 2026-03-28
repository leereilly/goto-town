import Phaser from 'phaser';
import BootScene from '../scenes/BootScene';
import TitleScene from '../scenes/TitleScene';
import ModeSelectScene from '../scenes/ModeSelectScene';
import PermissionScene from '../scenes/PermissionScene';
import CalibrationScene from '../scenes/CalibrationScene';
import GameScene from '../scenes/GameScene';
import StageCompleteScene from '../scenes/StageCompleteScene';
import GameOverScene from '../scenes/GameOverScene';
import VictoryScene from '../scenes/VictoryScene';
import HighScoreScene from '../scenes/HighScoreScene';
import CreditsScene from '../scenes/CreditsScene';
import SourceCodeScene from '../scenes/SourceCodeScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 256,
  height: 240,
  pixelArt: true,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, ModeSelectScene, PermissionScene, CalibrationScene, GameScene, StageCompleteScene, GameOverScene, VictoryScene, HighScoreScene, CreditsScene, SourceCodeScene],
};
