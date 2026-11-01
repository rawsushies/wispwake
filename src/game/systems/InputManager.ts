import Phaser from 'phaser';

export interface UnifiedInputState {
  moveX: number; // -1, 0, or 1
  jumpJustPressed: boolean;
  jumpHeld: boolean;
  jumpJustReleased: boolean;
  wakeJustPressed: boolean;
}

/**
 * InputManager — Milestone 4 Unified Input Architecture (Section 10).
 *
 * Combines Desktop Keyboard, Mobile/Tablet Multi-Touch Controls, and optional HTML5 Gamepad
 * into a single deterministic frame state:
 * - Supports simultaneous multi-touch (e.g., holding Right while tapping Jump and Wake).
 * - Handles pointerup, pointercancel, window blur, and visibilitychange so virtual buttons
 *   can never get stuck.
 */
class UnifiedInputService {
  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private touchWake = false;

  private prevCombinedJump = false;
  private prevCombinedWake = false;

  public setTouchButton(button: 'left' | 'right' | 'jump' | 'wake', active: boolean): void {
    switch (button) {
      case 'left':
        this.touchLeft = active;
        break;
      case 'right':
        this.touchRight = active;
        break;
      case 'jump':
        this.touchJump = active;
        break;
      case 'wake':
        this.touchWake = active;
        break;
    }
  }

  public clearAll(): void {
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchWake = false;
    this.prevCombinedJump = false;
    this.prevCombinedWake = false;
  }

  public getTouchState() {
    return {
      left: this.touchLeft,
      right: this.touchRight,
      jump: this.touchJump,
      wake: this.touchWake,
    };
  }

  public sampleFrame(
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys,
    keys?: {
      keyA?: Phaser.Input.Keyboard.Key;
      keyD?: Phaser.Input.Keyboard.Key;
      keyZ?: Phaser.Input.Keyboard.Key;
      keySpace?: Phaser.Input.Keyboard.Key;
      keyE?: Phaser.Input.Keyboard.Key;
      keyX?: Phaser.Input.Keyboard.Key;
    }
  ): UnifiedInputState {
    // 1. Keyboard State
    const kbLeft = Boolean(cursors?.left?.isDown || keys?.keyA?.isDown);
    const kbRight = Boolean(cursors?.right?.isDown || keys?.keyD?.isDown);
    const kbJump = Boolean(cursors?.up?.isDown || keys?.keySpace?.isDown || keys?.keyZ?.isDown);
    const kbWake = Boolean(keys?.keyE?.isDown || keys?.keyX?.isDown);

    // 2. Optional Gamepad State
    let gpLeft = false;
    let gpRight = false;
    let gpJump = false;
    let gpWake = false;

    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads?.[0];
      if (pad) {
        const axisX = pad.axes[0] ?? 0;
        gpLeft = axisX < -0.35 || Boolean(pad.buttons[14]?.pressed);
        gpRight = axisX > 0.35 || Boolean(pad.buttons[15]?.pressed);
        gpJump = Boolean(pad.buttons[0]?.pressed || pad.buttons[1]?.pressed);
        gpWake = Boolean(pad.buttons[2]?.pressed || pad.buttons[3]?.pressed || pad.buttons[5]?.pressed);
      }
    }

    // 3. Combine Keyboard + Touch + Gamepad
    const leftDown = kbLeft || this.touchLeft || gpLeft;
    const rightDown = kbRight || this.touchRight || gpRight;
    const jumpDown = kbJump || this.touchJump || gpJump;
    const wakeDown = kbWake || this.touchWake || gpWake;

    const moveX = (rightDown ? 1 : 0) - (leftDown ? 1 : 0);
    const jumpJustPressed = jumpDown && !this.prevCombinedJump;
    const jumpJustReleased = !jumpDown && this.prevCombinedJump;
    const wakeJustPressed = wakeDown && !this.prevCombinedWake;

    this.prevCombinedJump = jumpDown;
    this.prevCombinedWake = wakeDown;

    return {
      moveX,
      jumpJustPressed,
      jumpHeld: jumpDown,
      jumpJustReleased,
      wakeJustPressed,
    };
  }
}

export const InputManager = new UnifiedInputService();
