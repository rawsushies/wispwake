import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Bug,
  Compass,
  BookOpen,
} from 'lucide-react';
import { GameplayScene } from './game/scenes/GameplayScene';
import {
  AccessibilitySettings,
  DEFAULT_SETTINGS,
  GENERATED_ASSETS,
  LevelMode,
  TelemetrySnapshot,
} from './game/config/gameConfig';
import {
  activePhysicsTuning,
  PhysicsTuningConfig,
  resetPhysicsTuning,
  updatePhysicsTuning,
} from './game/config/physicsTuning';
import { SaveManager } from './game/systems/SaveManager';
import { AudioManager } from './game/systems/AudioManager';
import { ArtForgerModal } from './components/ArtForgerModal';

type ShellState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameplayScene | null>(null);

  const [shellState, setShellState] = useState<ShellState>('TITLE_MENU');
  const [levelMode, setLevelMode] = useState<LevelMode>(() => SaveManager.get().levelMode || 'sleeping_canopy');
  const [settings, setSettings] = useState<AccessibilitySettings>(() => SaveManager.get().settings || DEFAULT_SETTINGS);
  const [tuning, setTuning] = useState<PhysicsTuningConfig>(() => ({ ...activePhysicsTuning }));

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showArtForger, setShowArtForger] = useState(false);
  const [showFirstPlayHint, setShowFirstPlayHint] = useState(true);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>({
    fps: 60,
    playerX: 160,
    playerY: 430,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    coyoteRemaining: 0.1,
    jumpBufferRemaining: 0,
    wakeCooldownRemaining: 0,
    animState: 'idle',
    currentBeatTitle: 'Beat 1 · Awakening — Move with A/D or Arrows. Hold Space or Z for a higher jump.',
    currentBeatIndex: 1,
    activeCheckpointId: null,
    restoredCount: 0,
    totalRestorable: 4,
    chapterCompleted: false,
  });

  // Fade out the first-play control prompt once the player moves a meaningful distance
  useEffect(() => {
    if (shellState === 'PLAYING' && telemetry.playerX > 360 && showFirstPlayHint) {
      setShowFirstPlayHint(false);
    }
  }, [shellState, telemetry.playerX, showFirstPlayHint]);

  const handleTogglePause = useCallback(() => {
    setShellState((prev) => {
      if (prev === 'PLAYING') {
        sceneRef.current?.setPausedState(true);
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        sceneRef.current?.setPausedState(false);
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  const handleToggleDebug = useCallback(() => {
    setSettings((prev) => {
      const updated = SaveManager.updateSettings({ debugHitboxes: !prev.debugHitboxes });
      return { ...updated };
    });
  }, []);

  // Initialize Phaser 3 in an isolated non-rerendering ref container
  useEffect(() => {
    if (!gameContainerRef.current || phaserGameRef.current) return;

    const gameplayScene = new GameplayScene();
    sceneRef.current = gameplayScene;

    gameplayScene.setCallbacks({
      onTelemetry: (snap) => setTelemetry(snap),
      onChapterRestored: () => {
        setShellState('VICTORY');
      },
      onTogglePause: () => handleTogglePause(),
      onToggleDebug: () => handleToggleDebug(),
    });

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 960,
      height: 540,
      backgroundColor: '#121B2B',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [gameplayScene],
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Prevent browser scrolling on movement keys while canvas is active (Section 6.5)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      AudioManager.stopAmbience();
      game.destroy(true);
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, [handleTogglePause, handleToggleDebug]);

  // Allow starting game with Enter or Space on the Title Screen
  useEffect(() => {
    if (shellState !== 'TITLE_MENU' || showSettingsModal || showCreditsModal || showArtForger) return;

    const onTitleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startGame(levelMode);
      }
    };
    window.addEventListener('keydown', onTitleKey);
    return () => window.removeEventListener('keydown', onTitleKey);
  }, [shellState, levelMode, showSettingsModal, showCreditsModal, showArtForger]);

  const startGame = (mode: LevelMode, resetAll = false) => {
    setLevelMode(mode);
    setShowFirstPlayHint(true);
    if (sceneRef.current) {
      if (resetAll || SaveManager.get().levelMode !== mode) {
        sceneRef.current.switchLevelMode(mode, resetAll);
      }
      sceneRef.current.setAttractMode(false);
      sceneRef.current.setPausedState(false);
    }
    setShellState('PLAYING');
  };

  const handleRestartFromCheckpoint = () => {
    sceneRef.current?.restartFromCheckpoint();
    sceneRef.current?.setPausedState(false);
    setShellState('PLAYING');
  };

  const handleResetFullChapter = () => {
    sceneRef.current?.switchLevelMode(levelMode, true);
    sceneRef.current?.setAttractMode(false);
    sceneRef.current?.setPausedState(false);
    setShowFirstPlayHint(true);
    setShellState('PLAYING');
  };

  const handleReturnToTitle = () => {
    sceneRef.current?.setPausedState(false);
    sceneRef.current?.setAttractMode(true);
    setShellState('TITLE_MENU');
  };

  const updateSettingField = <K extends keyof AccessibilitySettings>(
    key: K,
    val: AccessibilitySettings[K]
  ) => {
    const updated = SaveManager.updateSettings({ [key]: val });
    setSettings({ ...updated });
    AudioManager.refreshVolumes();
  };

  const updateTuningField = <K extends keyof PhysicsTuningConfig>(key: K, val: number) => {
    const updated = updatePhysicsTuning({ [key]: val });
    setTuning(updated);
    sceneRef.current?.syncPlayerHitbox();
  };

  const handleResetTuning = () => {
    const reset = resetPhysicsTuning();
    setTuning(reset);
    sceneRef.current?.syncPlayerHitbox();
  };

  const wakeReady = telemetry.wakeCooldownRemaining <= 0;

  return (
    <div className="relative w-screen h-screen bg-[#121B2B] overflow-hidden select-none">
      {/* Isolated Full-Viewport Phaser 3 Canvas Container */}
      <div ref={gameContainerRef} className="w-full h-full flex items-center justify-center" />

      {/* =========================================================
          1. TITLE SCREEN OVERLAY (No website navbars or footers)
      ========================================================= */}
      {shellState === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none bg-gradient-to-t from-[#121B2B]/90 via-[#121B2B]/35 to-[#121B2B]/70">
          {/* Top-Right Quick Utility Actions */}
          <div className="flex items-center justify-end gap-3 pointer-events-auto">
            <button
              onClick={() => updateSettingField('muted', !settings.muted)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1D2D43]/90 hover:bg-[#294D4D] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
              title={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {settings.muted ? <VolumeX className="w-4 h-4 text-[#E98372]" /> : <Volume2 className="w-4 h-4 text-[#8FE7C7]" />}
              <span>{settings.muted ? 'Muted' : 'Sound On'}</span>
            </button>
            <button
              onClick={() => setShowArtForger(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1D2D43]/90 hover:bg-[#294D4D] border border-[#8FE7C7]/40 text-xs font-medium text-[#8FE7C7] transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Art Forger Studio (1K/2K/4K)</span>
            </button>
          </div>

          {/* Center-Left Bespoke Inline SVG Title Lockup over negative space */}
          <div className="max-w-xl my-auto space-y-6 pointer-events-auto">
            <div className="space-y-2">
              <div className="text-xs tracking-widest text-[#8FE7C7] font-medium">
                CHAPTER 01 · THE SLEEPING CANOPY
              </div>

              {/* Bespoke Inline SVG Title Lockup */}
              <svg
                viewBox="0 0 520 115"
                className="w-full max-w-[460px] h-auto drop-shadow-[0_6px_24px_rgba(18,27,43,0.95)]"
                aria-label="Wispwake — A Journey Through a Sleeping World"
              >
                <defs>
                  <linearGradient id="wispTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF8E7" />
                    <stop offset="55%" stopColor="#F1C878" />
                    <stop offset="100%" stopColor="#8FE7C7" />
                  </linearGradient>
                  <radialGradient id="seedOrbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F1C878" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#8FE7C7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#8FE7C7" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Luminous Seed & Moth Flourish */}
                <circle cx="42" cy="48" r="34" fill="url(#seedOrbGlow)" />
                <path
                  d="M42 22 C54 34, 54 58, 42 72 C30 58, 30 34, 42 22 Z"
                  fill="#FFF5D6"
                  stroke="#F1C878"
                  strokeWidth="2"
                />
                <path
                  d="M22 48 C8 32, 12 18, 34 38 M62 48 C76 32, 72 18, 50 38"
                  fill="none"
                  stroke="#8FE7C7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Main Title Wordmark */}
                <text
                  x="88"
                  y="66"
                  fill="url(#wispTitleGrad)"
                  fontFamily="Cormorant Garamond, Georgia, serif"
                  fontSize="68"
                  fontWeight="600"
                  letterSpacing="2"
                >
                  Wispwake
                </text>

                {/* Subtitle */}
                <text
                  x="92"
                  y="96"
                  fill="#A7B8AE"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontSize="14.5"
                  fontWeight="500"
                  letterSpacing="3.2"
                >
                  A JOURNEY THROUGH A SLEEPING WORLD
                </text>
              </svg>

              <p className="text-sm text-[#E6EFEA]/90 max-w-md leading-relaxed pt-1">
                Explore the twilight roots of the Veilgrove alongside Pip. Release a gentle pulse of{' '}
                <span className="text-[#8FE7C7] font-medium">Wake</span> to unfurl sleeping blooms, uncoil ancient root bridges, and bring warmth back to places lost to the Stillness.
              </p>
            </div>

            {/* Level / Milestone Selector */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#A7B8AE]">Select Experience Mode:</div>
              <div className="inline-flex items-center p-1 rounded-lg bg-[#121B2B]/90 border border-[#294D4D]">
                <button
                  onClick={() => startGame('sleeping_canopy')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    levelMode === 'sleeping_canopy'
                      ? 'bg-[#294D4D] text-[#8FE7C7] font-semibold'
                      : 'text-[#A7B8AE] hover:text-white'
                  }`}
                >
                  Chapter 01 · The Sleeping Canopy (Full 7-Beat Slice)
                </button>
                <button
                  onClick={() => startGame('prototype_sandbox')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    levelMode === 'prototype_sandbox'
                      ? 'bg-[#294D4D] text-[#8FE7C7] font-semibold'
                      : 'text-[#A7B8AE] hover:text-white'
                  }`}
                >
                  Milestones 1 & 2 · Movement & Wake Test Room
                </button>
              </div>
            </div>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => startGame(levelMode)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-sm shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Wispwake</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Settings className="w-4 h-4 text-[#8FE7C7]" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setShowCreditsModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#B7A2E8]" />
                <span>World & Credits</span>
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#294D4D]/60 text-xs text-[#A7B8AE]">
            <div className="font-mono-tabular">
              A/D or Left/Right Move · Space/Z Jump (Hold for Height) · E/X Wake Pulse · F1 Debug Hitboxes · Esc Pause
            </div>
            <div className="text-[#8FE7C7]">Press Enter or Space to Begin</div>
          </div>
        </div>
      )}

      {/* =========================================================
          2. ACTIVE GAMEPLAY HUD (Low-Occlusion, >= 85% clear playfield, no backdrop-filter)
      ========================================================= */}
      {shellState === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
          {/* Top Perimeter Bar */}
          <div className="flex items-start justify-between gap-4">
            {/* Left Cluster: Chapter Beat & Subtle Wake Readiness */}
            <div className="flex flex-col gap-1.5 bg-[#121B2B]/85 border border-[#294D4D] rounded-lg px-3.5 py-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-[#F1C878]">{telemetry.currentBeatTitle.split('—')[0]}</span>
                <span aria-hidden="true" className="text-[#57725B]">·</span>
                <span className="font-mono-tabular text-[#8FE7C7]">
                  Wake: {wakeReady ? 'Ready (E / X)' : `${telemetry.wakeCooldownRemaining.toFixed(1)}s`}
                </span>
                <span aria-hidden="true" className="text-[#57725B]">·</span>
                <span className="font-mono-tabular text-[#A7B8AE]">
                  Restored: {telemetry.restoredCount}/{telemetry.totalRestorable}
                </span>
              </div>
              {showFirstPlayHint && (
                <div className="text-xs text-[#E6EFEA]/90">
                  {telemetry.currentBeatTitle.split('—')[1] || 'Use A/D to move, Space/Z to jump, and E/X to cast Wake.'}
                </div>
              )}
            </div>

            {/* Right Cluster: Mode Switch, Debug Toggle, Mute, Pause */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() =>
                  startGame(levelMode === 'sleeping_canopy' ? 'prototype_sandbox' : 'sleeping_canopy')
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121B2B]/90 hover:bg-[#1D2D43] border border-[#294D4D] text-xs font-medium text-[#A7B8AE] hover:text-white transition-colors whitespace-nowrap shrink-0"
                title="Switch between Full Vertical Slice and Milestones 1 & 2 Test Room"
              >
                <Compass className="w-3.5 h-3.5 text-[#8FE7C7]" />
                <span>{levelMode === 'sleeping_canopy' ? 'Test Room' : 'Full Canopy'}</span>
              </button>

              <button
                onClick={handleToggleDebug}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-tabular font-medium transition-colors whitespace-nowrap shrink-0 ${
                  settings.debugHitboxes
                    ? 'bg-[#294D4D] border-[#8FE7C7] text-[#8FE7C7]'
                    : 'bg-[#121B2B]/90 border-[#294D4D] text-[#A7B8AE] hover:text-white'
                }`}
                title="Toggle Hitboxes, Wake Radii & Physics Tuner (F1)"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Debug (F1)</span>
              </button>

              <button
                onClick={() => setShowArtForger(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121B2B]/90 hover:bg-[#1D2D43] border border-[#294D4D] text-xs font-medium text-[#F1C878] transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Art Studio</span>
              </button>

              <button
                onClick={() => updateSettingField('muted', !settings.muted)}
                className="p-2 rounded-lg bg-[#121B2B]/90 hover:bg-[#1D2D43] border border-[#294D4D] text-[#E6EFEA] transition-colors"
                title={settings.muted ? 'Unmute' : 'Mute'}
              >
                {settings.muted ? <VolumeX className="w-4 h-4 text-[#E98372]" /> : <Volume2 className="w-4 h-4 text-[#8FE7C7]" />}
              </button>

              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121B2B]/90 hover:bg-[#1D2D43] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause (Esc)</span>
              </button>
            </div>
          </div>

          {/* Optional Debug Hitbox & Live Physics Tuning Dock (Shown only when Debug Mode F1 is active) */}
          {settings.debugHitboxes && (
            <div className="self-end w-full max-w-md bg-[#121B2B]/95 border border-[#294D4D] rounded-lg p-3.5 pointer-events-auto space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#294D4D] pb-2">
                <span className="font-semibold text-[#8FE7C7]">
                  Milestones 1 & 2 Verification & Physics Tuner
                </span>
                <span className="font-mono-tabular text-[#F1C878]">{telemetry.fps} FPS</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono-tabular text-[11px] text-[#A7B8AE]">
                <div>Pos: {telemetry.playerX}, {telemetry.playerY}</div>
                <div>Vel: {telemetry.velocityX}, {telemetry.velocityY}</div>
                <div>State: <span className="text-[#E6EFEA]">{telemetry.animState}</span></div>
                <div>Ground: <span className="text-[#8FE7C7]">{telemetry.grounded ? 'YES' : 'NO'}</span></div>
                <div>Coyote: {telemetry.coyoteRemaining}s</div>
                <div>Buffer: {telemetry.jumpBufferRemaining}s</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-[#A7B8AE]">
                    <span>Move Speed</span>
                    <span className="font-mono-tabular text-[#E6EFEA]">{tuning.moveSpeed} u/s</span>
                  </div>
                  <input
                    type="range"
                    min={180}
                    max={340}
                    value={tuning.moveSpeed}
                    onChange={(e) => updateTuningField('moveSpeed', Number(e.target.value))}
                    className="w-full accent-[#8FE7C7]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#A7B8AE]">
                    <span>Jump Impulse</span>
                    <span className="font-mono-tabular text-[#E6EFEA]">{tuning.jumpVelocity} u/s</span>
                  </div>
                  <input
                    type="range"
                    min={-700}
                    max={-450}
                    value={tuning.jumpVelocity}
                    onChange={(e) => updateTuningField('jumpVelocity', Number(e.target.value))}
                    className="w-full accent-[#8FE7C7]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#A7B8AE]">
                    <span>Wake Radius</span>
                    <span className="font-mono-tabular text-[#E6EFEA]">{tuning.wakeRadius} px</span>
                  </div>
                  <input
                    type="range"
                    min={110}
                    max={240}
                    value={tuning.wakeRadius}
                    onChange={(e) => updateTuningField('wakeRadius', Number(e.target.value))}
                    className="w-full accent-[#8FE7C7]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#A7B8AE]">
                    <span>Bloom Timer</span>
                    <span className="font-mono-tabular text-[#E6EFEA]">{tuning.bloomDuration} s</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={0.5}
                    value={tuning.bloomDuration}
                    onChange={(e) => updateTuningField('bloomDuration', Number(e.target.value))}
                    className="w-full accent-[#8FE7C7]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#294D4D]">
                <button
                  onClick={handleResetTuning}
                  className="text-[11px] text-[#F1C878] hover:underline"
                >
                  Reset to Visual Bible Defaults
                </button>
                <button
                  onClick={handleRestartFromCheckpoint}
                  className="px-2.5 py-1 rounded bg-[#1D2D43] hover:bg-[#294D4D] text-[11px] text-[#E6EFEA]"
                >
                  Test Checkpoint Respawn
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          3. PAUSE MENU OVERLAY (Section 11.1 Required Screens)
      ========================================================= */}
      {shellState === 'PAUSED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#121B2B]/85 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-5 shadow-2xl">
            <div className="space-y-1 text-center">
              <div className="text-xs font-medium tracking-widest text-[#8FE7C7]">JOURNEY PAUSED</div>
              <h2 className="text-3xl font-semibold text-[#F1C878] font-serif-display">The Sleeping Canopy</h2>
              <p className="text-xs text-[#A7B8AE]">{telemetry.currentBeatTitle}</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleTogglePause}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Journey</span>
              </button>

              <button
                onClick={handleRestartFromCheckpoint}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#F1C878]" />
                <span>Restart from Checkpoint</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <Settings className="w-4 h-4 text-[#8FE7C7]" />
                <span>Settings & Accessibility</span>
              </button>

              <button
                onClick={() => setShowArtForger(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#F1C878] font-medium text-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Veilgrove Art Forger Studio</span>
              </button>

              <button
                onClick={handleResetFullChapter}
                className="w-full py-2 px-4 rounded-lg bg-[#121B2B]/60 hover:bg-[#294D4D] text-[#A7B8AE] hover:text-white text-xs font-medium transition-colors"
              >
                Reset Full Chapter Progress
              </button>

              <button
                onClick={handleReturnToTitle}
                className="w-full py-2 px-4 rounded-lg text-[#A7B8AE] hover:text-[#E6EFEA] text-xs font-medium transition-colors"
              >
                Return to Title Screen
              </button>
            </div>

            <div className="pt-3 border-t border-[#294D4D] text-center text-[11px] font-mono-tabular text-[#A7B8AE]">
              Controls: A/D or Arrows Move · Space/Z Jump · E/X Wake Pulse · F1 Debug
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. END-OF-SLICE RESTORATION SCREEN (Section 8.5 & 11.1)
      ========================================================= */}
      {shellState === 'VICTORY' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#121B2B]/85 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#F1C878]/50 p-6 space-y-5 shadow-2xl">
            <div className="aspect-video rounded-lg overflow-hidden border border-[#294D4D] bg-black/40">
              <img
                src={GENERATED_ASSETS.refAncientBloomShrine}
                alt="The Ancient Bloom Awakened"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5 text-center">
              <div className="text-xs font-medium tracking-widest text-[#8FE7C7]">
                CHAPTER 01 COMPLETE · THE FIRST BLOOM
              </div>
              <h2 className="text-3xl font-semibold text-[#F1C878] font-serif-display">
                Warmth Returns to the Canopy
              </h2>
              <p className="text-xs text-[#E6EFEA]/90 leading-relaxed max-w-md mx-auto">
                As Nima’s seed resonates with the Ancient Bloom, golden light washes across the sleeping roots and distant branches stir from the Stillness.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShellState('PLAYING')}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-xs transition-colors whitespace-nowrap"
              >
                Continue Exploring Canopy
              </button>
              <button
                onClick={handleResetFullChapter}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs transition-colors whitespace-nowrap"
              >
                Replay Vertical Slice
              </button>
              <button
                onClick={handleReturnToTitle}
                className="w-full py-2 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-xs font-medium transition-colors"
              >
                Return to Title Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          5. SETTINGS & ACCESSIBILITY MODAL (Section 11.3)
      ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                Settings & Accessibility
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1 rounded bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Done
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#E6EFEA] font-medium">Ambient Music Volume</span>
                  <span className="font-mono-tabular text-[#8FE7C7]">
                    {Math.round(settings.musicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => updateSettingField('musicVolume', Number(e.target.value))}
                  className="w-full accent-[#8FE7C7]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#E6EFEA] font-medium">Gameplay Effects Volume</span>
                  <span className="font-mono-tabular text-[#8FE7C7]">
                    {Math.round(settings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => updateSettingField('sfxVolume', Number(e.target.value))}
                  className="w-full accent-[#8FE7C7]"
                />
              </div>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">Subtle Screen Shake</div>
                  <div className="text-[#A7B8AE] text-[11px]">Off by default for comfort (Section 11.3)</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.screenShake}
                  onChange={(e) => updateSettingField('screenShake', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">Reduced Particles Mode</div>
                  <div className="text-[#A7B8AE] text-[11px]">Reduces drifting spores and pulse motes</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedParticles}
                  onChange={(e) => updateSettingField('reducedParticles', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">High-Contrast Wake Target Cues</div>
                  <div className="text-[#A7B8AE] text-[11px]">Renders diamond brackets on in-range Wake objects</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrastCues}
                  onChange={(e) => updateSettingField('highContrastCues', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">Debug Hitboxes & Wake Radii (F1)</div>
                  <div className="text-[#A7B8AE] text-[11px]">Displays collision geometry and live physics sliders</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.debugHitboxes}
                  onChange={(e) => updateSettingField('debugHitboxes', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          6. WORLD LORE & CREDITS MODAL
      ========================================================= */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                Wispwake · World & Production Notes
              </h3>
              <button
                onClick={() => setShowCreditsModal(false)}
                className="px-3 py-1 rounded bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <img
                src={GENERATED_ASSETS.refNimaPipConcept}
                alt="Nima and Pip Concept Sheet"
                referrerPolicy="no-referrer"
                className="w-full rounded-lg border border-[#294D4D] object-cover aspect-square"
              />
              <div className="sm:col-span-2 space-y-2 text-xs text-[#E6EFEA]/90 leading-relaxed">
                <p>
                  <strong className="text-[#F1C878]">The Veilgrove:</strong> An immense living ecosystem grown around an ancient tree whose branches reach into a twilight sky and whose flora respond to an energy called the <span className="text-[#8FE7C7]">Wake</span>.
                </p>
                <p>
                  <strong className="text-[#F1C878]">Nima & Pip:</strong> Nima awakens on a vast tree root carrying a warm living seed, joined by Pip, a moth-like light creature drawn to its gentle resonance.
                </p>
                <p className="text-[#A7B8AE]">
                  Built on TypeScript + Phaser 3 + Vite per the canonical <em>Wispwake Game Design & Visual Bible</em>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          7. VEILGROVE ART FORGER STUDIO MODAL
      ========================================================= */}
      <ArtForgerModal
        isOpen={showArtForger}
        onClose={() => setShowArtForger(false)}
        onApplyBackdrop={(layer, dataUrl) => {
          sceneRef.current?.applyCustomBackdrop(layer, dataUrl);
        }}
      />
    </div>
  );
}
