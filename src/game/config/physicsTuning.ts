/**
 * Centralized movement, camera, and Wake system tuning values.
 * Based strictly on Section 6.1, Section 6.4, and Section 7.2 of the Wispwake Game Design & Visual Bible.
 */

export interface PhysicsTuningConfig {
  // Reference viewport (Section 6.1)
  referenceWidth: number;
  referenceHeight: number;

  // Nima dimensions & hitbox (Section 4.1 & 6.2)
  visibleSpriteHeight: number;
  hitboxWidth: number;
  hitboxHeight: number;

  // Horizontal movement (Section 6.1)
  moveSpeed: number;           // 240-270 units/sec
  groundAcceleration: number;  // 1,700-2,100 units/sec^2
  groundDeceleration: number;  // 1,900-2,300 units/sec^2
  airAcceleration: number;     // 900-1,200 units/sec^2
  airDeceleration: number;     // Smooth air damping when no horizontal input

  // Vertical movement & jumping (Section 6.1 & 6.2)
  jumpVelocity: number;        // -540 to -590 units/sec
  jumpCutMultiplier: number;   // Variable jump height damping on early release
  gravity: number;             // 1,350-1,550 units/sec^2
  maxFallSpeed: number;        // 850-950 units/sec
  coyoteTime: number;          // 0.10 sec
  jumpBufferTime: number;      // 0.12 sec

  // Wake System (Section 7.2 & 7.3)
  wakeRadius: number;          // 140-170 logical units
  wakeProximityHintRadius: number; // Subtle target response range
  wakeCooldown: number;        // 0.4-0.6 seconds
  bloomDuration: number;       // 4-6 seconds active platform duration
  bloomWarningTime: number;    // Final warning phase before closing

  // Camera framing & damping (Section 6.4)
  cameraTargetScreenX: number; // 0.40-0.45 from left edge
  cameraTargetScreenY: number; // 0.55-0.60 from top edge
  cameraDeadzoneX: number;
  cameraDeadzoneY: number;
  cameraLookAheadX: number;    // Small look-ahead while running
  cameraLerpSpeed: number;     // Exponential damping factor
}

export const DEFAULT_PHYSICS_TUNING: PhysicsTuningConfig = {
  referenceWidth: 960,
  referenceHeight: 540,

  visibleSpriteHeight: 88,
  hitboxWidth: 34,
  hitboxHeight: 72,

  moveSpeed: 256,
  groundAcceleration: 1920,
  groundDeceleration: 2120,
  airAcceleration: 1080,
  airDeceleration: 650,

  jumpVelocity: -570,
  jumpCutMultiplier: 0.52,
  gravity: 1460,
  maxFallSpeed: 900,
  coyoteTime: 0.10,
  jumpBufferTime: 0.12,

  wakeRadius: 160,
  wakeProximityHintRadius: 250,
  wakeCooldown: 0.48,
  bloomDuration: 5.2,
  bloomWarningTime: 1.35,

  cameraTargetScreenX: 0.42,
  cameraTargetScreenY: 0.58,
  cameraDeadzoneX: 36,
  cameraDeadzoneY: 28,
  cameraLookAheadX: 68,
  cameraLerpSpeed: 7.5,
};

// Runtime mutable copy for live playtesting and debug tuning
export const activePhysicsTuning: PhysicsTuningConfig = {
  ...DEFAULT_PHYSICS_TUNING,
};

export function resetPhysicsTuning(): PhysicsTuningConfig {
  Object.assign(activePhysicsTuning, DEFAULT_PHYSICS_TUNING);
  return { ...activePhysicsTuning };
}

export function updatePhysicsTuning(partial: Partial<PhysicsTuningConfig>): PhysicsTuningConfig {
  Object.assign(activePhysicsTuning, partial);
  return { ...activePhysicsTuning };
}
