import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Settings,
  BookOpen,
  Compass,
  Sparkles,
  Lock,
  CheckCircle2,
  Shuffle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Smartphone,
} from 'lucide-react';
import { GameplayScene } from './game/scenes/GameplayScene';
import {
  AccessibilitySettings,
  CampaignChapterId,
  DEFAULT_SETTINGS,
  GENERATED_ASSETS,
  LightingQuality,
  TelemetrySnapshot,
  TrialDifficulty,
} from './game/config/gameConfig';
import { CAMPAIGN_CHAPTERS, getCampaignChapter } from './game/systems/LevelRegistry';
import { WakeTrialsGenerator } from './game/systems/WakeTrialsGenerator';
import { InputManager } from './game/systems/InputManager';
import { SaveManager, WispwakeSaveDataV2 } from './game/systems/SaveManager';
import { AudioManager } from './game/systems/AudioManager';

type ShellState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';

const CHAPTER_ART_MAP: Record<CampaignChapterId, string> = {
  sleeping_canopy: GENERATED_ASSETS.bgCanopyFarSky,
  moonlit_marsh: GENERATED_ASSETS.bgMoonlitMarsh,
  hollow_below: GENERATED_ASSETS.bgHollowBelow,
  windward_ruins: GENERATED_ASSETS.bgWindwardRuins,
};

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameplayScene | null>(null);

  const [shellState, setShellState] = useState<ShellState>('TITLE_MENU');
  const [saveState, setSaveState] = useState<WispwakeSaveDataV2>(() => SaveManager.get());
  const [settings, setSettings] = useState<AccessibilitySettings>(
    () => SaveManager.get().settings || DEFAULT_SETTINGS
  );

  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [showTrialsModal, setShowTrialsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showFirstPlayHint, setShowFirstPlayHint] = useState(true);

  const [selectedTrialDiff, setSelectedTrialDiff] = useState<TrialDifficulty>('medium');
  const [customTrialSeed, setCustomTrialSeed] = useState<string>(() =>
    WakeTrialsGenerator.generateSeedCode('medium')
  );
  const [lastCompletedTrialTime, setLastCompletedTrialTime] = useState<number | null>(null);
  const [unlockedNextChapterId, setUnlockedNextChapterId] = useState<CampaignChapterId | null>(null);

  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>({
    fps: 60,
    playerX: 160,
    playerY: 432,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    coyoteRemaining: 0.1,
    jumpBufferRemaining: 0,
    wakeCooldownRemaining: 0,
    animState: 'idle',
    chapterId: 'sleeping_canopy',
    chapterTitle: 'Chapter 01 · The Sleeping Canopy',
    currentBeatTitle: 'Beat 1 · Awakening — Move with A/D or Arrows. Hold Space or Z for a higher jump.',
    currentBeatIndex: 1,
    activeCheckpointId: null,
    restoredCount: 0,
    totalRestorable: 4,
    chapterCompleted: false,
    activeDialogue: null,
    trialElapsedSec: 0,
    trialSeed: null,
    trialDifficulty: null,
  });

  const refreshSaveSnapshot = useCallback(() => {
    setSaveState({ ...SaveManager.get() });
  }, []);

  useEffect(() => {
    const checkViewportAndTouch = () => {
      const touchCapable =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsTouchDevice(touchCapable);
      setIsPortraitMobile(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    checkViewportAndTouch();
    window.addEventListener('resize', checkViewportAndTouch);
    return () => window.removeEventListener('resize', checkViewportAndTouch);
  }, []);

  useEffect(() => {
    if (shellState === 'PLAYING' && telemetry.playerX > 360 && showFirstPlayHint) {
      setShowFirstPlayHint(false);
    }
  }, [shellState, telemetry.playerX, showFirstPlayHint]);

  const handleTogglePause = useCallback(() => {
    InputManager.clearAll();
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
    if (!import.meta.env.DEV) return;
    setSettings((prev) => {
      const updated = SaveManager.updateSettings({ debugHitboxes: !prev.debugHitboxes });
      return { ...updated };
    });
  }, []);

  useEffect(() => {
    if (!gameContainerRef.current || phaserGameRef.current) return;

    const gameplayScene = new GameplayScene();
    sceneRef.current = gameplayScene;

    gameplayScene.setCallbacks({
      onTelemetry: (snap) => setTelemetry(snap),
      onChapterRestored: (_mode, nextChapId, trialTimeSec) => {
        setUnlockedNextChapterId(nextChapId);
        setLastCompletedTrialTime(trialTimeSec);
        refreshSaveSnapshot();
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
  }, [handleTogglePause, handleToggleDebug, refreshSaveSnapshot]);

  useEffect(() => {
    if (
      shellState !== 'TITLE_MENU' ||
      showChaptersModal ||
      showTrialsModal ||
      showSettingsModal ||
      showCreditsModal
    ) {
      return;
    }

    const onTitleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startCampaignChapter(SaveManager.get().currentChapterId, false);
      }
    };
    window.addEventListener('keydown', onTitleKey);
    return () => window.removeEventListener('keydown', onTitleKey);
  }, [shellState, showChaptersModal, showTrialsModal, showSettingsModal, showCreditsModal]);

  const startCampaignChapter = (chapterId: CampaignChapterId, resetChapter = false) => {
    setShowFirstPlayHint(true);
    setShowChaptersModal(false);
    setShowTrialsModal(false);
    setLastCompletedTrialTime(null);
    if (sceneRef.current) {
      sceneRef.current.loadCampaignChapter(chapterId, resetChapter);
      sceneRef.current.setAttractMode(false);
      sceneRef.current.setPausedState(false);
    }
    refreshSaveSnapshot();
    setShellState('PLAYING');
  };

  const launchWakeTrial = (difficulty: TrialDifficulty, seedInput?: string) => {
    const cleanSeed =
      seedInput && seedInput.trim().length > 0
        ? seedInput.trim().toUpperCase()
        : WakeTrialsGenerator.generateSeedCode(difficulty);
    setCustomTrialSeed(cleanSeed);
    setSelectedTrialDiff(difficulty);
    setShowTrialsModal(false);
    setShowChaptersModal(false);
    setShowFirstPlayHint(false);
    setLastCompletedTrialTime(null);

    if (sceneRef.current) {
      sceneRef.current.startWakeTrial(difficulty, cleanSeed);
      sceneRef.current.setAttractMode(false);
      sceneRef.current.setPausedState(false);
    }
    refreshSaveSnapshot();
    setShellState('PLAYING');
  };

  const handleRestartFromCheckpoint = () => {
    InputManager.clearAll();
    sceneRef.current?.restartFromCheckpoint();
    sceneRef.current?.setPausedState(false);
    setShellState('PLAYING');
  };

  const handleResetCurrentMode = () => {
    InputManager.clearAll();
    if (telemetry.chapterId === 'wake_trial' && telemetry.trialDifficulty) {
      launchWakeTrial(telemetry.trialDifficulty, telemetry.trialSeed || customTrialSeed);
    } else if (telemetry.chapterId !== 'wake_trial') {
      startCampaignChapter(telemetry.chapterId, true);
    }
  };

  const handleReturnToTitle = () => {
    InputManager.clearAll();
    sceneRef.current?.setPausedState(false);
    sceneRef.current?.setAttractMode(true);
    refreshSaveSnapshot();
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

  const wakeReady = telemetry.wakeCooldownRemaining <= 0;
  const showTouchOverlay =
    shellState === 'PLAYING' &&
    (settings.touchControlsMode === 'always' ||
      (settings.touchControlsMode === 'auto' && isTouchDevice));

  const completedTrialsCount = Object.values(saveState.trials).filter(Boolean).length;

  return (
    <div className="relative w-screen h-screen bg-[#121B2B] overflow-hidden select-none">
      {/* Isolated Full-Viewport Phaser 3 Canvas Container */}
      <div ref={gameContainerRef} className="w-full h-full flex items-center justify-center" />

      {/* Portrait Mobile Orientation Recommendation Banner */}
      {isPortraitMobile && (
        <div className="absolute top-0 inset-x-0 z-50 bg-[#1D2D43]/95 border-b border-[#F1C878]/50 px-3 py-1.5 flex items-center justify-center gap-2 text-[11px] text-[#F1C878]">
          <Smartphone className="w-3.5 h-3.5 rotate-90 shrink-0" />
          <span>Rotate device to landscape for the full Veilgrove 16:9 view.</span>
        </div>
      )}

      {/* =========================================================
          1. CLEAN PLAYER-FACING TITLE SCREEN OVERLAY
      ========================================================= */}
      {shellState === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none bg-gradient-to-t from-[#121B2B]/90 via-[#121B2B]/30 to-[#121B2B]/65">
          {/* Top-Right Sound Toggle */}
          <div className="flex items-center justify-end gap-3 pointer-events-auto">
            <button
              onClick={() => updateSettingField('muted', !settings.muted)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1D2D43]/90 hover:bg-[#294D4D] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
              title={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {settings.muted ? (
                <VolumeX className="w-4 h-4 text-[#E98372]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#8FE7C7]" />
              )}
              <span>{settings.muted ? 'Muted' : 'Sound On'}</span>
            </button>
          </div>

          {/* Center-Left Bespoke Inline SVG Title Lockup over negative space */}
          <div className="max-w-xl my-auto space-y-5 pointer-events-auto">
            <div className="space-y-2">
              <div className="text-xs tracking-widest text-[#8FE7C7] font-medium uppercase">
                {getCampaignChapter(saveState.currentChapterId).title}
              </div>

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
                Journey through four biomes of the Veilgrove alongside Pip. Release a gentle pulse of{' '}
                <span className="text-[#8FE7C7] font-medium">Wake</span> to unfurl sleeping blooms, uncoil ancient root bridges, and restore light to a world lost to the Stillness.
              </p>
            </div>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => startCampaignChapter(saveState.currentChapterId, false)}
                className="flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-sm shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Story</span>
              </button>

              <button
                onClick={() => {
                  refreshSaveSnapshot();
                  setShowChaptersModal(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4 text-[#8FE7C7]" />
                <span>Chapters (4)</span>
              </button>

              <button
                onClick={() => {
                  refreshSaveSnapshot();
                  setShowTrialsModal(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 text-[#F1C878]" />
                <span>Wake Trials</span>
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
                <span>Credits</span>
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#294D4D]/60 text-xs text-[#A7B8AE]">
            <div className="font-mono-tabular">
              A/D or Left/Right Move · Space/Z Jump (Hold for Height) · E/X Wake Pulse · Touch & Gamepad Supported
            </div>
            <div className="text-[#8FE7C7]">Press Enter or Space to Begin</div>
          </div>
        </div>
      )}

      {/* =========================================================
          2. ACTIVE GAMEPLAY HUD + PIP SPEECH BUBBLE + TOUCH CONTROLS
      ========================================================= */}
      {shellState === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
          {/* Top Perimeter Bar */}
          <div className="flex items-start justify-between gap-4">
            {/* Left Cluster: Chapter / Wake Readiness / Trial Timer */}
            <div className="flex flex-col gap-1 bg-[#121B2B]/85 border border-[#294D4D] rounded-lg px-3.5 py-2">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="font-semibold text-[#F1C878]">
                  {telemetry.currentBeatTitle.split('—')[0]}
                </span>
                <span aria-hidden="true" className="text-[#57725B]">·</span>
                <span className="font-mono-tabular text-[#8FE7C7]">
                  Wake: {wakeReady ? 'Ready (E / X)' : `${telemetry.wakeCooldownRemaining.toFixed(1)}s`}
                </span>
                {telemetry.chapterId === 'wake_trial' && (
                  <>
                    <span aria-hidden="true" className="text-[#57725B]">·</span>
                    <span className="font-mono-tabular text-[#B7A2E8]">
                      Seed: {telemetry.trialSeed} · {telemetry.trialElapsedSec.toFixed(1)}s
                    </span>
                  </>
                )}
              </div>
              {showFirstPlayHint && telemetry.chapterId !== 'wake_trial' && (
                <div className="text-xs text-[#E6EFEA]/90">
                  {telemetry.currentBeatTitle.split('—')[1] ||
                    'Use A/D to move, Space/Z to jump, and E/X to release Wake.'}
                </div>
              )}
            </div>

            {/* Right Cluster: Sound Mute & Pause */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => updateSettingField('muted', !settings.muted)}
                className="p-2 rounded-lg bg-[#121B2B]/85 hover:bg-[#1D2D43] border border-[#294D4D] text-[#E6EFEA] transition-colors"
                title={settings.muted ? 'Unmute' : 'Mute'}
              >
                {settings.muted ? (
                  <VolumeX className="w-4 h-4 text-[#E98372]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#8FE7C7]" />
                )}
              </button>

              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121B2B]/85 hover:bg-[#1D2D43] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            </div>
          </div>

          {/* Priority 2: Pip's Floating World-Matched Speech Bubble */}
          {telemetry.activeDialogue && (
            <div
              style={{
                left: `${(telemetry.activeDialogue.screenX / 960) * 100}%`,
                top: `${(telemetry.activeDialogue.screenY / 540) * 100}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto max-w-[270px] sm:max-w-[310px] rounded-xl bg-[#121B2B]/92 border border-[#8FE7C7]/60 px-3.5 py-2.5 shadow-[0_8px_24px_rgba(18,27,43,0.9)] transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#8FE7C7]">
                  {telemetry.activeDialogue.speaker} · Companion
                </span>
                <button
                  onClick={() => sceneRef.current?.dismissDialogue()}
                  className="text-[10px] text-[#A7B8AE] hover:text-[#E6EFEA] px-1"
                  title="Dismiss"
                >
                  Skip
                </button>
              </div>
              <p className="text-xs text-[#E6EFEA] leading-snug">
                “{telemetry.activeDialogue.text}”
              </p>
              <div className="w-2.5 h-2.5 bg-[#121B2B] border-r border-b border-[#8FE7C7]/60 rotate-45 mx-auto -mb-4 mt-1" />
            </div>
          )}

          {/* Section 08: Responsive Multi-Touch Virtual Controls */}
          {showTouchOverlay && (
            <div className="flex items-end justify-between w-full pt-4 pb-1 px-1 pointer-events-none">
              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('left', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('left', false)}
                  onPointerCancel={() => InputManager.setTouchButton('left', false)}
                  onPointerLeave={() => InputManager.setTouchButton('left', false)}
                  className="w-16 h-16 rounded-full bg-[#121B2B]/75 active:bg-[#294D4D]/90 border-2 border-[#8FE7C7]/50 flex items-center justify-center text-[#E6EFEA] shadow-lg touch-none"
                  aria-label="Move Left"
                >
                  <ArrowLeft className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('right', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('right', false)}
                  onPointerCancel={() => InputManager.setTouchButton('right', false)}
                  onPointerLeave={() => InputManager.setTouchButton('right', false)}
                  className="w-16 h-16 rounded-full bg-[#121B2B]/75 active:bg-[#294D4D]/90 border-2 border-[#8FE7C7]/50 flex items-center justify-center text-[#E6EFEA] shadow-lg touch-none"
                  aria-label="Move Right"
                >
                  <ArrowRight className="w-7 h-7" />
                </button>
              </div>

              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('wake', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('wake', false)}
                  onPointerCancel={() => InputManager.setTouchButton('wake', false)}
                  onPointerLeave={() => InputManager.setTouchButton('wake', false)}
                  className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-lg touch-none ${
                    wakeReady
                      ? 'bg-[#1D2D43]/85 active:bg-[#8FE7C7] border-[#8FE7C7] text-[#8FE7C7] active:text-[#121B2B]'
                      : 'bg-[#121B2B]/60 border-[#57725B] text-[#A7B8AE]'
                  }`}
                  aria-label="Wake Pulse"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-semibold mt-0.5">Wake</span>
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('jump', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('jump', false)}
                  onPointerCancel={() => InputManager.setTouchButton('jump', false)}
                  onPointerLeave={() => InputManager.setTouchButton('jump', false)}
                  className="w-16 h-16 rounded-full bg-[#1D2D43]/85 active:bg-[#F1C878] border-2 border-[#F1C878] flex flex-col items-center justify-center text-[#F1C878] active:text-[#121B2B] shadow-lg touch-none"
                  aria-label="Jump"
                >
                  <ArrowUp className="w-6 h-6" />
                  <span className="text-[10px] font-semibold">Jump</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          3. PAUSE MENU OVERLAY
      ========================================================= */}
      {shellState === 'PAUSED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#121B2B]/85 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-5 shadow-2xl">
            <div className="space-y-1 text-center">
              <div className="text-xs font-medium tracking-widest text-[#8FE7C7]">JOURNEY PAUSED</div>
              <h2 className="text-3xl font-semibold text-[#F1C878] font-serif-display">
                {telemetry.chapterTitle}
              </h2>
              <p className="text-xs text-[#A7B8AE]">{telemetry.currentBeatTitle}</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleTogglePause}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleRestartFromCheckpoint}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#F1C878]" />
                <span>Restart from Checkpoint</span>
              </button>

              <button
                onClick={() => {
                  refreshSaveSnapshot();
                  setShowChaptersModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <Compass className="w-4 h-4 text-[#8FE7C7]" />
                <span>Switch Chapter</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <Settings className="w-4 h-4 text-[#8FE7C7]" />
                <span>Settings</span>
              </button>

              <button
                onClick={handleResetCurrentMode}
                className="w-full py-2 px-4 rounded-lg bg-[#121B2B]/60 hover:bg-[#294D4D] text-[#A7B8AE] hover:text-white text-xs font-medium transition-colors"
              >
                {telemetry.chapterId === 'wake_trial' ? 'Restart Trial Run' : 'Restart Full Chapter'}
              </button>

              <button
                onClick={handleReturnToTitle}
                className="w-full py-2 px-4 rounded-lg text-[#A7B8AE] hover:text-[#E6EFEA] text-xs font-medium transition-colors"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. CHAPTER / WAKE TRIAL RESTORATION VICTORY SCREEN
      ========================================================= */}
      {shellState === 'VICTORY' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#121B2B]/85 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#F1C878]/50 p-6 space-y-5 shadow-2xl">
            <div className="aspect-video rounded-lg overflow-hidden border border-[#294D4D] bg-black/40">
              <img
                src={
                  telemetry.chapterId !== 'wake_trial'
                    ? CHAPTER_ART_MAP[telemetry.chapterId] || GENERATED_ASSETS.refAncientBloomShrine
                    : GENERATED_ASSETS.refAncientBloomShrine
                }
                alt="Ancient Bloom Awakened"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {telemetry.chapterId === 'wake_trial' ? (
              <div className="space-y-1.5 text-center">
                <div className="text-xs font-medium tracking-widest text-[#8FE7C7] uppercase">
                  WAKE TRIAL COMPLETE · {telemetry.trialDifficulty} ({telemetry.trialSeed})
                </div>
                <h2 className="text-3xl font-semibold text-[#F1C878] font-serif-display">
                  Shrine Resonates in {lastCompletedTrialTime?.toFixed(2)}s
                </h2>
                <p className="text-xs text-[#E6EFEA]/90 leading-relaxed max-w-md mx-auto">
                  Best Time ({telemetry.trialDifficulty}):{' '}
                  <span className="text-[#8FE7C7] font-mono-tabular">
                    {saveState.trials[telemetry.trialDifficulty || 'medium']?.bestTimeSec
                      ? `${saveState.trials[telemetry.trialDifficulty || 'medium']!.bestTimeSec.toFixed(2)}s`
                      : `${lastCompletedTrialTime?.toFixed(2)}s`}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-center">
                <div className="text-xs font-medium tracking-widest text-[#8FE7C7] uppercase">
                  {telemetry.chapterTitle} · RESTORED
                </div>
                <h2 className="text-3xl font-semibold text-[#F1C878] font-serif-display">
                  {unlockedNextChapterId
                    ? 'Light Reaches Deeper into the Veilgrove'
                    : 'The Heart of the Veilgrove Awakens'}
                </h2>
                <p className="text-xs text-[#E6EFEA]/90 leading-relaxed max-w-md mx-auto">
                  As Nima’s seed resonates with the Ancient Bloom, golden light washes across the sleeping roots and opens the path forward.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {telemetry.chapterId !== 'wake_trial' && unlockedNextChapterId && (
                <button
                  onClick={() => startCampaignChapter(unlockedNextChapterId, false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  Continue to {getCampaignChapter(unlockedNextChapterId).title.split('·')[1] || 'Next Chapter'}
                </button>
              )}

              {telemetry.chapterId === 'wake_trial' && telemetry.trialDifficulty && (
                <button
                  onClick={() =>
                    launchWakeTrial(
                      telemetry.trialDifficulty!,
                      WakeTrialsGenerator.generateSeedCode(telemetry.trialDifficulty!)
                    )
                  }
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  New Seed Trial
                </button>
              )}

              <button
                onClick={handleResetCurrentMode}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-xs transition-colors whitespace-nowrap"
              >
                {telemetry.chapterId === 'wake_trial' ? 'Retry Same Seed' : 'Replay Chapter'}
              </button>

              <button
                onClick={handleReturnToTitle}
                className="w-full py-2 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-xs font-medium transition-colors"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          5. CAMPAIGN CHAPTER SELECTION MODAL (Section 04)
      ========================================================= */}
      {showChaptersModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-2xl rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                  Story Campaign · The Veilgrove Chronicles
                </h3>
                <p className="text-xs text-[#A7B8AE]">
                  Complete each chapter’s Ancient Bloom to unlock the next region, or select any chapter to explore.
                </p>
              </div>
              <button
                onClick={() => setShowChaptersModal(false)}
                className="px-3 py-1 rounded bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CAMPAIGN_CHAPTERS.map((def) => {
                const chapId = def.chapterId;
                const state = saveState.chapters[chapId];
                const isUnlocked = Boolean(state?.unlocked);
                const isCompleted = Boolean(state?.completed);

                return (
                  <div
                    key={chapId}
                    className={`rounded-lg border p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                      isUnlocked
                        ? 'bg-[#121B2B]/90 border-[#294D4D] hover:border-[#8FE7C7]/60'
                        : 'bg-[#121B2B]/50 border-[#294D4D]/50 opacity-85'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="aspect-video rounded overflow-hidden border border-[#294D4D] relative">
                        <img
                          src={CHAPTER_ART_MAP[chapId]}
                          alt={def.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[#121B2B]/85 text-[10px] font-medium">
                          {isCompleted ? (
                            <span className="text-[#F1C878] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Restored
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[#8FE7C7]">Unlocked</span>
                          ) : (
                            <span className="text-[#A7B8AE] flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-[#F1C878]">{def.title}</div>
                        <div className="text-[11px] text-[#A7B8AE]">{def.regionSubtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startCampaignChapter(chapId, false)}
                        className="flex-1 py-2 px-3 rounded bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-xs transition-colors"
                      >
                        {isUnlocked ? 'Play Chapter' : 'Unlock & Play'}
                      </button>
                      {isCompleted && (
                        <button
                          onClick={() => startCampaignChapter(chapId, true)}
                          className="py-2 px-2.5 rounded bg-[#1D2D43] hover:bg-[#294D4D] border border-[#294D4D] text-[#A7B8AE] hover:text-white text-xs"
                          title="Reset & Replay Chapter"
                        >
                          Replay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          6. PROCEDURAL CHALLENGE MODE MODAL — WAKE TRIALS (Section 05)
      ========================================================= */}
      {showTrialsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <div>
                <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                  Wake Trials · Procedural Challenge Mode
                </h3>
                <p className="text-xs text-[#A7B8AE]">
                  Deterministic seeded platforming courses verified by the physics traversability validator.
                </p>
              </div>
              <button
                onClick={() => setShowTrialsModal(false)}
                className="px-3 py-1 rounded bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#E6EFEA]">Select Difficulty Tier</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['easy', 'medium', 'hard', 'extreme'] as TrialDifficulty[]).map((diff) => {
                  const rec = saveState.trials[diff];
                  const active = selectedTrialDiff === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => {
                        setSelectedTrialDiff(diff);
                        setCustomTrialSeed(WakeTrialsGenerator.generateSeedCode(diff));
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        active
                          ? 'bg-[#294D4D] border-[#F1C878] text-[#F1C878]'
                          : 'bg-[#121B2B]/80 border-[#294D4D] text-[#E6EFEA] hover:border-[#8FE7C7]/50'
                      }`}
                    >
                      <div className="text-xs font-semibold capitalize">{diff}</div>
                      <div className="text-[10px] font-mono-tabular text-[#8FE7C7] mt-0.5">
                        {rec ? `Best: ${rec.bestTimeSec.toFixed(1)}s` : 'No record'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#E6EFEA]">Trial Seed (Shareable & Deterministic)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTrialSeed}
                  onChange={(e) => setCustomTrialSeed(e.target.value.toUpperCase())}
                  placeholder="E.G. ME-48219"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#121B2B] border border-[#294D4D] text-xs font-mono-tabular text-[#E6EFEA] focus:outline-none focus:border-[#8FE7C7]"
                />
                <button
                  type="button"
                  onClick={() => setCustomTrialSeed(WakeTrialsGenerator.generateSeedCode(selectedTrialDiff))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-xs text-[#8FE7C7]"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Randomize</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#294D4D] text-xs text-[#A7B8AE]">
              <span>Tiers Completed: {completedTrialsCount} / 4</span>
              <button
                onClick={() => launchWakeTrial(selectedTrialDiff, customTrialSeed)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Trial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          7. SETTINGS & ACCESSIBILITY MODAL
      ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-3.5 text-xs">
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

              {/* Section 07: Dynamic Lighting Quality */}
              <div className="pt-2 border-t border-[#294D4D]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#E6EFEA] font-medium">Dynamic 2.5D Lighting Quality</span>
                  <span className="text-[#8FE7C7] capitalize">{settings.lightingQuality}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['auto', 'high', 'balanced', 'low'] as LightingQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => updateSettingField('lightingQuality', q)}
                      className={`py-1.5 rounded border text-[11px] capitalize ${
                        settings.lightingQuality === q
                          ? 'bg-[#294D4D] border-[#8FE7C7] text-[#E6EFEA] font-semibold'
                          : 'bg-[#121B2B] border-[#294D4D] text-[#A7B8AE]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 08: Touch Controls Mode */}
              <div className="pt-2 border-t border-[#294D4D]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#E6EFEA] font-medium">On-Screen Touch Controls</span>
                  <span className="text-[#8FE7C7] capitalize">{settings.touchControlsMode}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['auto', 'always', 'off'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettingField('touchControlsMode', m)}
                      className={`py-1.5 rounded border text-[11px] capitalize ${
                        settings.touchControlsMode === m
                          ? 'bg-[#294D4D] border-[#8FE7C7] text-[#E6EFEA] font-semibold'
                          : 'bg-[#121B2B] border-[#294D4D] text-[#A7B8AE]'
                      }`}
                    >
                      {m === 'auto' ? 'Auto Detect' : m === 'always' ? 'Always On' : 'Off'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">Pip Companion Narration & Hints</div>
                  <div className="text-[#A7B8AE] text-[11px]">Displays Pip’s story bubbles and gentle puzzle hints</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.subtitlesEnabled}
                  onChange={(e) => updateSettingField('subtitlesEnabled', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>

              <label className="flex items-center justify-between py-2 border-t border-[#294D4D] cursor-pointer">
                <div>
                  <div className="text-[#E6EFEA] font-medium">Subtle Screen Shake</div>
                  <div className="text-[#A7B8AE] text-[11px]">Off by default for comfort</div>
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
                  <div className="text-[#E6EFEA] font-medium">Reduced Particles & Motion</div>
                  <div className="text-[#A7B8AE] text-[11px]">Reduces drifting spores, fog, and foliage sway</div>
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
                  <div className="text-[#A7B8AE] text-[11px]">Displays diamond brackets on in-range Wake objects</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrastCues}
                  onChange={(e) => updateSettingField('highContrastCues', e.target.checked)}
                  className="w-4 h-4 accent-[#8FE7C7]"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          8. WORLD LORE & CREDITS MODAL
      ========================================================= */}
      {showCreditsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#294D4D] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                Wispwake · World & Credits
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
                alt="Nima and Pip Concept Illustration"
                referrerPolicy="no-referrer"
                className="w-full rounded-lg border border-[#294D4D] object-cover aspect-square"
              />
              <div className="sm:col-span-2 space-y-2 text-xs text-[#E6EFEA]/90 leading-relaxed">
                <p>
                  <strong className="text-[#F1C878]">The Veilgrove:</strong> An immense living ecosystem grown around an ancient tree whose branches reach into a twilight sky and whose flora respond to an energy called the{' '}
                  <span className="text-[#8FE7C7]">Wake</span>.
                </p>
                <p>
                  <strong className="text-[#F1C878]">Nima & Pip:</strong> Nima awakens on a vast tree root carrying a warm living seed, joined by Pip, a moth-like light creature drawn to its gentle resonance.
                </p>
                <p className="text-[#A7B8AE]">
                  Open-source release at{' '}
                  <span className="text-[#8FE7C7] font-mono-tabular">github.com/rawsushies/wispwake</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
