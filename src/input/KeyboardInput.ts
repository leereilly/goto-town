import type { InputState } from './InputManager';

export default class KeyboardInput implements InputState {
  laneUp = false;
  laneDown = false;
  fire = false;
  debugToggle = false;
  confirm = false;

  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyBacktick!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;

  private prevW = false;
  private prevS = false;
  private prevUp = false;
  private prevDown = false;
  private prevSpace = false;
  private prevBacktick = false;
  private prevEnter = false;

  create(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyBacktick = kb.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
    this.keyEnter = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(): void {
    const wDown = this.keyW.isDown;
    const sDown = this.keyS.isDown;
    const upDown = this.keyUp.isDown;
    const downDown = this.keyDown.isDown;
    const spaceDown = this.keySpace.isDown;
    const backtickDown = this.keyBacktick.isDown;
    const enterDown = this.keyEnter.isDown;

    this.laneUp = (wDown && !this.prevW) || (upDown && !this.prevUp);
    this.laneDown = (sDown && !this.prevS) || (downDown && !this.prevDown);
    this.fire = spaceDown && !this.prevSpace;
    this.debugToggle = backtickDown && !this.prevBacktick;
    this.confirm = enterDown && !this.prevEnter;

    this.prevW = wDown;
    this.prevS = sDown;
    this.prevUp = upDown;
    this.prevDown = downDown;
    this.prevSpace = spaceDown;
    this.prevBacktick = backtickDown;
    this.prevEnter = enterDown;
  }

  reset(): void {
    this.laneUp = false;
    this.laneDown = false;
    this.fire = false;
    this.debugToggle = false;
    this.confirm = false;
  }
}
