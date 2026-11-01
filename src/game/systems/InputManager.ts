import Phaser from 'phaser';

export interface UnifiedInputState {
  moveX: number; // -1, 0, or 1
  jumpJustPressed: boolean;
  jumpHeld: boolean;
  jumpJustReleased: boolean;
  wakeJustPressed: boolean;
}

/**
 * InputManager — Milestone 5 Unified Input Architecture.
 *
 * Combines Desktop Keyboard (both Phaser KeyboardPlugin AND direct window keydown/keyup
 * listeners so closing a React modal never drops keyboard focus), Mobile/Tablet Multi-Touch
 * Controls, and HTML5 Gamepad into a single deterministic frame state.
 */
class UnifiedInputService {
  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private touchWake = false;

  private winKeys = new Set<string>();
  private listenersAttached = false;

  private prevCombinedJump = false;
  private prevCombinedWake = false;

  constructor() {
    this.ensureWindowListeners();
  }

  private ensureWindowListeners(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      this.winKeys.add(e.code);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.winKeys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.clearAll();
    });
  }

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
    this.winKeys.clear();
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
    this.ensureWindowListeners();

    // 1. Keyboard State (Phaser + direct window key state)
    const kbLeft = Boolean(
      cursors?.left?.isDown ||
        keys?.keyA?.isDown ||
        this.winKeys.has('KeyA') ||
        this.winKeys.has('ArrowLeft')
    );
    const kbRight = Boolean(
      cursors?.right?.isDown ||
        keys?.keyD?.isDown ||
        this.winKeys.has('KeyD') ||
        this.winKeys.has('ArrowRight')
    );
    const kbJump = Boolean(
      cursors?.up?.isDown ||
        keys?.keySpace?.isDown ||
        keys?.keyZ?.isDown ||
        this.winKeys.has('Space') ||
        this.winKeys.has('KeyZ') ||
        this.winKeys.has('KeyW') ||
        this.winKeys.has('ArrowUp')
    );
    const kbWake = Boolean(
      keys?.keyE?.isDown ||
        keys?.keyX?.isDown ||
        this.winKeys.has('KeyE') ||
        this.winKeys.has('KeyX')
    );

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
