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
  ExternalLink,
  Trophy,
  MessageCircle,
  ScrollText,
} from 'lucide-react';
import { GameplayScene } from './game/scenes/GameplayScene';
import {
  AccessibilitySettings,
  CampaignChapterId,
  DEFAULT_SETTINGS,
  GENERATED_ASSETS,
  LightingQuality,
  StoryDifficulty,
  TelemetrySnapshot,
  TrialDifficulty,
} from './game/config/gameConfig';
import { CAMPAIGN_CHAPTERS, getCampaignChapter } from './game/systems/LevelRegistry';
import { WakeTrialsGenerator } from './game/systems/WakeTrialsGenerator';
import { InputManager } from './game/systems/InputManager';
import { SaveManager, WispwakeSaveDataV3 } from './game/systems/SaveManager';
import {
  JOURNAL_CATEGORIES,
  JournalCategory,
  StoryJournalManager,
} from './game/systems/StoryJournalManager';
import { LeaderboardManager } from './game/systems/LeaderboardManager';
import { AudioManager } from './game/systems/AudioManager';

type ShellState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';
type PlayModalTab = 'story' | 'trials' | 'leaderboard';

const CHAPTER_ART_MAP: Record<CampaignChapterId, string> = {
  sleeping_canopy: GENERATED_ASSETS.bgCanopyFarSky,
  moonlit_marsh: GENERATED_ASSETS.bgMoonlitMarsh,
  hollow_below: GENERATED_ASSETS.bgHollowBelow,
  windward_ruins: GENERATED_ASSETS.bgWindwardRuins,
  shattered_choir: GENERATED_ASSETS.bgShatteredChoir,
  heart_of_veil: GENERATED_ASSETS.bgHeartOfVeil,
};

const STORY_DIFFICULTY_INFO: Record<StoryDifficulty, { label: string; summary: string }> = {
  easy: {
    label: 'Easy',
    summary: 'Generous 6.8s Bloom platforms, 1.35s crumbling ledges, calmer Drifters, and fewer hazards.',
  },
  medium: {
    label: 'Medium',
    summary: 'Canonical Veilgrove balance: 5.2s Bloom platforms, 0.95s crumbling ledges, and all 4 checkpoints.',
  },
  hard: {
    label: 'Hard',
    summary: 'Crisp 4.1s Bloom chaining, 0.72s crumbling ledges, faster Spore Vents, and brisker Drifters.',
  },
  extreme: {
    label: 'Extreme',
    summary: 'Mastery 3.35s Bloom windows, 0.56s crumbling ledges, rapid vents, and 2 checkpoints per chapter.',
  },
};

const TRIAL_DIFFICULTY_INFO: Record<
  TrialDifficulty,
  { label: string; segments: string; summary: string }
> = {
  easy: {
    label: 'Easy',
    segments: '12–16 Segments',
    summary: 'Wide landing roots, 6.4s Bloom duration, gentle Drifter transfers, and 3 checkpoints.',
  },
  medium: {
    label: 'Medium',
    segments: '16–20 Segments',
    summary: 'Chained Blooms, double Drifter transfers, water currents, spore vents, and 3 checkpoints.',
  },
  hard: {
    label: 'Hard',
    segments: '22–26 Segments',
    summary: 'All 15 archetypes including falling stalactites, narrow vertical ascents, and mastery gauntlets.',
  },
  extreme: {
    label: 'Extreme',
    segments: '28–36 Segments',
    summary: 'Endurance course with 3.5s Blooms, 0.62s crumbling ledges, rapid vents, and 4 checkpoints.',
  },
};

/**
 * Computes the logical Phaser world viewport dimensions for both Landscape and Native Portrait
 * orientations so Nima, Pip, platforms, and hazards remain properly proportioned (never tiny)
 * while filling the usable smartphone or desktop viewport.
 */
function computeLogicalViewport(winW: number, winH: number): { width: number; height: number; isPortrait: boolean } {
  const safeW = Math.max(320, winW);
  const safeH = Math.max(480, winH);
  const isPortrait = safeH > safeW;

  if (!isPortrait) {
    return { width: 960, height: 540, isPortrait: false };
  }

  // Native Portrait Mode (9:16, 9:19, 9:19.5, etc.):
  // Keep vertical world height at 640px so Nima (68px tall) and platforms remain large and readable,
  // and match the horizontal world width to the phone's portrait aspect ratio (clamped 360..480).
  const aspect = safeW / safeH;
  const logicalHeight = 640;
  const logicalWidth = Math.round(Phaser.Math.Clamp(logicalHeight * aspect, 360, 480));
  return { width: logicalWidth, height: logicalHeight, isPortrait: true };
}

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameplayScene | null>(null);

  const [shellState, setShellState] = useState<ShellState>('TITLE_MENU');
  const [saveState, setSaveState] = useState<WispwakeSaveDataV3>(() => SaveManager.get());
  const [settings, setSettings] = useState<AccessibilitySettings>(
    () => SaveManager.get().settings || DEFAULT_SETTINGS
  );

  // Modals & Navigation
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [activePlayTab, setActivePlayTab] = useState<PlayModalTab>('story');
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [activeJournalCategory, setActiveJournalCategory] = useState<JournalCategory>('STORY');
  const [selectedJournalEntryId, setSelectedJournalEntryId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showFirstPlayHint, setShowFirstPlayHint] = useState(true);

  // Leaderboard filter state
  const [lbModeFilter, setLbModeFilter] = useState<CampaignChapterId | 'wake_trial' | 'all'>('all');
  const [lbDiffFilter, setLbDiffFilter] = useState<StoryDifficulty | TrialDifficulty | 'all'>('all');
  const [playerNameInput, setPlayerNameInput] = useState<string>(
    () => SaveManager.get().playerDisplayName || 'Nima'
  );

  const [selectedStoryDiff, setSelectedStoryDiff] = useState<StoryDifficulty>(
    () => SaveManager.getStoryDifficulty()
  );
  const [selectedTrialDiff, setSelectedTrialDiff] = useState<TrialDifficulty>('medium');
  const [customTrialSeed, setCustomTrialSeed] = useState<string>(() =>
    WakeTrialsGenerator.generateSeedCode('medium')
  );
  const [lastCompletedTrialTime, setLastCompletedTrialTime] = useState<number | null>(null);
  const [unlockedNextChapterId, setUnlockedNextChapterId] = useState<CampaignChapterId | null>(null);

  const [isPortraitViewport, setIsPortraitViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

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
    currentBeatTitle:
      '01 · The First Awakening — Move with A/D or Arrows. Hold Space or Z for a higher jump.',
    currentBeatIndex: 1,
    activeCheckpointId: null,
    unlockedCheckpointsCount: 0,
    totalCheckpointsCount: 4,
    restoredCount: 0,
    totalRestorable: 9,
    discoveredMemoriesCount: 0,
    totalMemoriesCount: 2,
    chapterCompleted: false,
    activeDialogue: null,
    nearbyNpcPrompt: null,
    activeNpcDialogue: null,
    unreadJournalCount: 0,
    storyDifficulty: 'medium',
    trialElapsedSec: 0,
    trialSeed: null,
    trialDifficulty: null,
    chapterDeaths: 0,
  });

  const refreshSaveSnapshot = useCallback(() => {
    const latest = SaveManager.get();
    setSaveState({ ...latest });
    setSelectedStoryDiff(latest.storyDifficulty || 'medium');
    setPlayerNameInput(latest.playerDisplayName || 'Nima');
  }, []);

  // Responsive Viewport & Live Portrait <-> Landscape Switching without resetting state
  useEffect(() => {
    const applyViewportAdaptation = () => {
      const touchCapable =
        typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 900);
      setIsTouchDevice(touchCapable);

      const { width, height, isPortrait } = computeLogicalViewport(
        window.innerWidth,
        window.innerHeight
      );
      setIsPortraitViewport(isPortrait);

      if (phaserGameRef.current) {
        const currentW = phaserGameRef.current.scale.width;
        const currentH = phaserGameRef.current.scale.height;
        if (currentW !== width || currentH !== height) {
          phaserGameRef.current.scale.resize(width, height);
          sceneRef.current?.handleViewportResize(width, height);
        }
      }
    };

    applyViewportAdaptation();
    window.addEventListener('resize', applyViewportAdaptation);
    window.addEventListener('orientationchange', applyViewportAdaptation);
    return () => {
      window.removeEventListener('resize', applyViewportAdaptation);
      window.removeEventListener('orientationchange', applyViewportAdaptation);
    };
  }, []);

  useEffect(() => {
    if (shellState === 'PLAYING' && telemetry.playerX > 420 && showFirstPlayHint) {
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

    const initialViewport = computeLogicalViewport(window.innerWidth, window.innerHeight);
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
      width: initialViewport.width,
      height: initialViewport.height,
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

  // Keyboard navigation for Title Screen & Modals
  useEffect(() => {
    const onModalOrTitleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showJournalModal) {
          e.preventDefault();
          setShowJournalModal(false);
          return;
        }
        if (showPlayModal) {
          e.preventDefault();
          setShowPlayModal(false);
          return;
        }
        if (showSettingsModal) {
          e.preventDefault();
          setShowSettingsModal(false);
          return;
        }
        if (showCreditsModal) {
          e.preventDefault();
          setShowCreditsModal(false);
          return;
        }
      }

      if (
        shellState === 'TITLE_MENU' &&
        !showPlayModal &&
        !showJournalModal &&
        !showSettingsModal &&
        !showCreditsModal &&
        (e.code === 'Enter' || e.code === 'Space')
      ) {
        e.preventDefault();
        refreshSaveSnapshot();
        setActivePlayTab('story');
        setShowPlayModal(true);
      }
    };
    window.addEventListener('keydown', onModalOrTitleKey);
    return () => window.removeEventListener('keydown', onModalOrTitleKey);
  }, [
    shellState,
    showPlayModal,
    showJournalModal,
    showSettingsModal,
    showCreditsModal,
    refreshSaveSnapshot,
  ]);

  const handleStoryDifficultyChange = (diff: StoryDifficulty) => {
    SaveManager.setStoryDifficulty(diff);
    setSelectedStoryDiff(diff);
    refreshSaveSnapshot();
  };

  const openStoryJournal = (defaultCategory?: JournalCategory) => {
    refreshSaveSnapshot();
    const cat = defaultCategory || activeJournalCategory;
    setActiveJournalCategory(cat);
    const entries = StoryJournalManager.getEntriesByCategory(cat);
    const firstUnlocked = entries.find((e) => e.unlocked) || entries[0];
    if (firstUnlocked) {
      setSelectedJournalEntryId(firstUnlocked.id);
      if (firstUnlocked.unlocked) {
        StoryJournalManager.markRead(firstUnlocked.id);
      }
    }
    setShowJournalModal(true);
  };

  const startCampaignChapter = (
    chapterId: CampaignChapterId,
    resetChapter = false,
    difficultyOverride?: StoryDifficulty
  ) => {
    const chapState = SaveManager.getChapterProgress(chapterId);
    if (!chapState.unlocked) {
      return;
    }

    const diffToUse = difficultyOverride || selectedStoryDiff;
    SaveManager.setStoryDifficulty(diffToUse);

    setShowFirstPlayHint(true);
    setShowPlayModal(false);
    setLastCompletedTrialTime(null);
    if (sceneRef.current) {
      sceneRef.current.loadCampaignChapter(chapterId, resetChapter, diffToUse);
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
    setShowPlayModal(false);
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
      (settings.touchControlsMode === 'auto' && (isTouchDevice || isPortraitViewport)));

  const completedTrialsCount = Object.values(saveState.trials).filter(Boolean).length;
  const currentActiveChapterDef = getCampaignChapter(saveState.currentChapterId);
  const categoryEntries = StoryJournalManager.getEntriesByCategory(activeJournalCategory);
  const activeJournalEntry =
    categoryEntries.find((e) => e.id === selectedJournalEntryId) || categoryEntries[0] || null;
  const filteredLeaderboard = LeaderboardManager.getFilteredLocalEntries({
    mode: lbModeFilter === 'all' ? 'all' : lbModeFilter === 'wake_trial' ? 'wake_trial' : 'story_chapter',
    targetId: lbModeFilter,
    difficulty: lbDiffFilter,
  });

  return (
    <div className="relative w-screen h-[100dvh] bg-[#121B2B] overflow-hidden select-none">
      {/* Isolated Full-Viewport Phaser 3 Canvas Container (Portrait & Landscape Native) */}
      <div ref={gameContainerRef} className="w-full h-full flex items-center justify-center" />

      {/* =========================================================
          1. CLEAN PLAYER-FACING TITLE SCREEN OVERLAY (Section 06)
          EXACTLY THREE PRIMARY BUTTONS: PLAY, SETTINGS, CREDITS
      ========================================================= */}
      {shellState === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 md:p-12 pointer-events-none bg-gradient-to-t from-[#121B2B]/92 via-[#121B2B]/35 to-[#121B2B]/70">
          {/* Top-Right Sound Toggle */}
          <div className="flex items-center justify-end gap-2 pointer-events-auto">
            <button
              onClick={() => updateSettingField('muted', !settings.muted)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#1D2D43]/90 hover:bg-[#294D4D] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
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

          {/* Center-Left (or Portrait-Centered) Bespoke Inline SVG Title Lockup */}
          <div
            className={`max-w-xl my-auto space-y-4 sm:space-y-6 pointer-events-auto ${
              isPortraitViewport ? 'mx-auto text-center flex flex-col items-center' : ''
            }`}
          >
            <div className="space-y-2 w-full">
              <div className="text-[11px] sm:text-xs tracking-widest text-[#8FE7C7] font-medium uppercase">
                {currentActiveChapterDef.title}
              </div>

              <svg
                viewBox="0 0 520 115"
                className={`w-full max-w-[340px] sm:max-w-[460px] h-auto drop-shadow-[0_6px_24px_rgba(18,27,43,0.95)] ${
                  isPortraitViewport ? 'mx-auto' : ''
                }`}
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

              <p
                className={`text-xs sm:text-sm text-[#E6EFEA]/90 max-w-md leading-relaxed pt-1 ${
                  isPortraitViewport ? 'mx-auto' : ''
                }`}
              >
                Journey through six living regions of the Veilgrove alongside Pip. Release a gentle pulse of{' '}
                <span className="text-[#8FE7C7] font-medium">Wake</span> to unfurl sleeping blooms, ring ancient resonance bells, and restore light to a world hushed by the Stillness.
              </p>
            </div>

            {/* Section 06: EXACTLY THREE PRIMARY BUTTONS ON THE TITLE SCREEN */}
            <div
              className={`flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 ${
                isPortraitViewport ? 'justify-center w-full' : ''
              }`}
              role="navigation"
              aria-label="Primary Title Navigation"
            >
              <button
                data-testid="title-btn-play"
                onClick={() => {
                  refreshSaveSnapshot();
                  setActivePlayTab('story');
                  setShowPlayModal(true);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs sm:text-sm tracking-wide shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY</span>
              </button>

              <button
                data-testid="title-btn-settings"
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-xs sm:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0"
              >
                <Settings className="w-4 h-4 text-[#8FE7C7]" />
                <span>SETTINGS</span>
              </button>

              <button
                data-testid="title-btn-credits"
                onClick={() => setShowCreditsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg bg-[#1D2D43]/95 hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] text-xs sm:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#B7A2E8]" />
                <span>CREDITS</span>
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#294D4D]/60 text-[11px] sm:text-xs text-[#A7B8AE]">
            <div className="font-mono-tabular">
              {isPortraitViewport
                ? 'Portrait & Landscape Native · Touch Controls Ready'
                : 'A/D Move · Space/Z Jump · E/X Wake · F Speak · Touch & Gamepad Supported'}
            </div>
            <div className="text-[#8FE7C7] hidden sm:block">
              Press Enter or Space to Open Play Selection
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          2. ACTIVE GAMEPLAY HUD + NPC DIALOGUE + PORTRAIT/LANDSCAPE TOUCH CONTROLS
      ========================================================= */}
      {shellState === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6">
          {/* Top Perimeter Bar */}
          <div className="flex items-start justify-between gap-2">
            {/* Left/Center Compact Progress HUD */}
            <div className="flex flex-col gap-0.5 bg-[#121B2B]/85 border border-[#294D4D] rounded-lg px-2.5 py-1.5 sm:px-3.5 sm:py-2 max-w-[68%] sm:max-w-none">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
                <span className="font-semibold text-[#F1C878] truncate">
                  {telemetry.currentBeatTitle.split('—')[0]}
                </span>
                <span aria-hidden="true" className="text-[#57725B]">·</span>
                <span className="font-mono-tabular text-[#8FE7C7]">
                  Wake: {wakeReady ? 'Ready' : `${telemetry.wakeCooldownRemaining.toFixed(1)}s`}
                </span>
                <span aria-hidden="true" className="text-[#57725B]">·</span>
                <span className="font-mono-tabular text-[#A7B8AE]">
                  Cairns: {telemetry.unlockedCheckpointsCount}/{telemetry.totalCheckpointsCount}
                </span>
                {telemetry.chapterId !== 'wake_trial' && telemetry.totalMemoriesCount > 0 && (
                  <>
                    <span aria-hidden="true" className="text-[#57725B] hidden sm:inline">·</span>
                    <span className="font-mono-tabular text-[#B7A2E8] hidden sm:inline">
                      Memories: {telemetry.discoveredMemoriesCount}/{telemetry.totalMemoriesCount}
                    </span>
                  </>
                )}
                {telemetry.chapterId === 'wake_trial' && (
                  <>
                    <span aria-hidden="true" className="text-[#57725B]">·</span>
                    <span className="font-mono-tabular text-[#B7A2E8]">
                      {telemetry.trialSeed} · {telemetry.trialElapsedSec.toFixed(1)}s
                    </span>
                  </>
                )}
              </div>
              {showFirstPlayHint && telemetry.chapterId !== 'wake_trial' && !isPortraitViewport && (
                <div className="text-[11px] text-[#E6EFEA]/90 truncate">
                  {telemetry.currentBeatTitle.split('—')[1] ||
                    'Use A/D to move, Space/Z to jump, E/X for Wake, and F to speak.'}
                </div>
              )}
            </div>

            {/* Right Cluster: Story Journal, Sound Mute & Pause */}
            <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
              <button
                data-testid="hud-btn-journal"
                onClick={() => openStoryJournal()}
                className="relative p-2 rounded-lg bg-[#121B2B]/85 hover:bg-[#1D2D43] border border-[#294D4D] text-[#E6EFEA] transition-colors"
                title="Open Story Journal"
                aria-label="Open Story Journal"
              >
                <ScrollText className="w-4 h-4 text-[#F1C878]" />
                {telemetry.unreadJournalCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F1C878] text-[#121B2B] text-[10px] font-bold flex items-center justify-center">
                    {telemetry.unreadJournalCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => updateSettingField('muted', !settings.muted)}
                className="p-2 rounded-lg bg-[#121B2B]/85 hover:bg-[#1D2D43] border border-[#294D4D] text-[#E6EFEA] transition-colors"
                title={settings.muted ? 'Unmute' : 'Mute'}
                aria-label={settings.muted ? 'Unmute' : 'Mute'}
              >
                {settings.muted ? (
                  <VolumeX className="w-4 h-4 text-[#E98372]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#8FE7C7]" />
                )}
              </button>

              <button
                onClick={handleTogglePause}
                className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-lg bg-[#121B2B]/85 hover:bg-[#1D2D43] border border-[#294D4D] text-xs font-medium text-[#E6EFEA] transition-colors whitespace-nowrap shrink-0"
                aria-label="Pause Game"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            </div>
          </div>

          {/* Middle Contextual Area: NPC Proximity Prompt OR Active NPC Conversation Card */}
          <div className="my-auto flex flex-col items-center justify-center pointer-events-none px-2">
            {telemetry.nearbyNpcPrompt && !telemetry.activeNpcDialogue && (
              <button
                type="button"
                onClick={() => sceneRef.current?.triggerNpcInteract()}
                className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#121B2B]/92 hover:bg-[#1D2D43] border border-[#F1C878]/80 text-xs font-semibold text-[#F1C878] shadow-lg transition-transform active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#8FE7C7]" />
                <span>
                  {showTouchOverlay
                    ? `Tap to Speak with ${telemetry.nearbyNpcPrompt.name}`
                    : `[F] Speak with ${telemetry.nearbyNpcPrompt.name}`}
                </span>
              </button>
            )}

            {telemetry.activeNpcDialogue && (
              <div
                data-testid="npc-dialogue-card"
                className="pointer-events-auto w-full max-w-md rounded-xl bg-[#121B2B]/95 border border-[#F1C878]/70 p-4 shadow-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#294D4D] pb-2">
                  <div>
                    <div className="text-xs font-semibold text-[#F1C878]">
                      {telemetry.activeNpcDialogue.speakerName}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#8FE7C7]">
                      {telemetry.activeNpcDialogue.speakerTitle}
                    </div>
                  </div>
                  {telemetry.activeNpcDialogue.questTitle && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        telemetry.activeNpcDialogue.questStatus === 'completed'
                          ? 'bg-[#294D4D] text-[#F1C878]'
                          : 'bg-[#1D2D43] text-[#8FE7C7]'
                      }`}
                    >
                      {telemetry.activeNpcDialogue.questStatus === 'completed'
                        ? `Fulfilled · ${telemetry.activeNpcDialogue.questTitle}`
                        : `Request · ${telemetry.activeNpcDialogue.questTitle}`}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#E6EFEA] leading-relaxed">
                  “{telemetry.activeNpcDialogue.line}”
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#A7B8AE]">
                  <span>
                    Line {telemetry.activeNpcDialogue.lineIndex + 1} of{' '}
                    {telemetry.activeNpcDialogue.totalLines}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sceneRef.current?.closeNpcDialogue()}
                      className="px-2.5 py-1 rounded bg-[#1D2D43] hover:bg-[#294D4D] text-[#A7B8AE] hover:text-white"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => sceneRef.current?.triggerNpcInteract()}
                      className="px-3 py-1 rounded bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold"
                    >
                      {telemetry.activeNpcDialogue.lineIndex + 1 <
                      telemetry.activeNpcDialogue.totalLines
                        ? 'Next'
                        : 'Finish'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Responsive Multi-Touch Virtual Controls (Ergonomic Portrait & Landscape Layout) */}
          {showTouchOverlay && (
            <div className="flex items-end justify-between w-full pt-2 pb-[env(safe-area-inset-bottom,4px)] px-1 sm:px-2 pointer-events-none">
              {/* Bottom-Left Movement Cluster */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('left', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('left', false)}
                  onPointerCancel={() => InputManager.setTouchButton('left', false)}
                  onPointerLeave={() => InputManager.setTouchButton('left', false)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#121B2B]/80 active:bg-[#294D4D]/95 border-2 border-[#8FE7C7]/60 flex items-center justify-center text-[#E6EFEA] shadow-lg touch-none"
                  aria-label="Move Left"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
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
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#121B2B]/80 active:bg-[#294D4D]/95 border-2 border-[#8FE7C7]/60 flex items-center justify-center text-[#E6EFEA] shadow-lg touch-none"
                  aria-label="Move Right"
                >
                  <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              {/* Bottom-Right Action Cluster (Contextual Speak + Wake + Jump) */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto">
                {telemetry.nearbyNpcPrompt && (
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      InputManager.setTouchButton('interact', true);
                    }}
                    onPointerUp={() => InputManager.setTouchButton('interact', false)}
                    onPointerCancel={() => InputManager.setTouchButton('interact', false)}
                    onPointerLeave={() => InputManager.setTouchButton('interact', false)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1D2D43]/90 active:bg-[#B7A2E8] border-2 border-[#B7A2E8] flex flex-col items-center justify-center text-[#B7A2E8] active:text-[#121B2B] shadow-lg touch-none"
                    aria-label="Speak with Character"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] font-semibold mt-0.5">Speak</span>
                  </button>
                )}

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    InputManager.setTouchButton('wake', true);
                  }}
                  onPointerUp={() => InputManager.setTouchButton('wake', false)}
                  onPointerCancel={() => InputManager.setTouchButton('wake', false)}
                  onPointerLeave={() => InputManager.setTouchButton('wake', false)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-lg touch-none ${
                    wakeReady
                      ? 'bg-[#1D2D43]/85 active:bg-[#8FE7C7] border-[#8FE7C7] text-[#8FE7C7] active:text-[#121B2B]'
                      : 'bg-[#121B2B]/65 border-[#57725B] text-[#A7B8AE]'
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
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1D2D43]/85 active:bg-[#F1C878] border-2 border-[#F1C878] flex flex-col items-center justify-center text-[#F1C878] active:text-[#121B2B] shadow-lg touch-none"
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
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="space-y-1 text-center">
              <div className="text-xs font-medium tracking-widest text-[#8FE7C7]">JOURNEY PAUSED</div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F1C878] font-serif-display">
                {telemetry.chapterTitle}
              </h2>
              <p className="text-xs text-[#A7B8AE]">{telemetry.currentBeatTitle}</p>
            </div>

            <div className="space-y-2">
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
                onClick={() => openStoryJournal()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <ScrollText className="w-4 h-4 text-[#F1C878]" />
                <span>Story Journal</span>
                {telemetry.unreadJournalCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#F1C878] text-[#121B2B] text-[10px] font-bold">
                    {telemetry.unreadJournalCount} New
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  refreshSaveSnapshot();
                  setActivePlayTab(telemetry.chapterId === 'wake_trial' ? 'trials' : 'story');
                  setShowPlayModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-[#E6EFEA] font-medium text-sm transition-colors"
              >
                <Compass className="w-4 h-4 text-[#8FE7C7]" />
                <span>Chapters, Trials & Leaderboard</span>
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
          <div className="w-full max-w-lg rounded-xl bg-[#1D2D43] border border-[#F1C878]/50 p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
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
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F1C878] font-serif-display">
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
                  {telemetry.chapterTitle} · RESTORED ({telemetry.storyDifficulty.toUpperCase()})
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F1C878] font-serif-display">
                  {unlockedNextChapterId
                    ? 'Light Reaches Deeper into the Veilgrove'
                    : 'The First Seed Bloom Unites the Veilgrove'}
                </h2>
                <p className="text-xs text-[#E6EFEA]/90 leading-relaxed max-w-md mx-auto">
                  {unlockedNextChapterId
                    ? 'As Nima’s seed resonates with the Ancient Bloom, golden sap-light washes across the sleeping boughs and unlocks the next region of the journey.'
                    : 'Within the Heart of the Veil, the Stillness parts at last. Every bough, marsh, cavern, spire, and choir bell awakens in living gold and mint light.'}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
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
          5. COMBINED PLAY SELECTION INTERFACE
          Contains A. STORY JOURNEY (6 Chapters) + B. WAKE TRIALS + C. LEADERBOARD
      ========================================================= */}
      {showPlayModal && (
        <div
          data-testid="play-selection-modal"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/92 p-3 sm:p-4 pointer-events-auto"
        >
          <div className="w-full max-w-4xl rounded-xl bg-[#1D2D43] border border-[#294D4D] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header & Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#294D4D] pb-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#F1C878] font-serif-display">
                  Select Your Journey
                </h3>
                <p className="text-xs text-[#A7B8AE]">
                  Embark on the 6-chapter Story Journey, master procedural Wake Trials, or view the Veilgrove Leaderboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  data-testid="tab-story-journey"
                  onClick={() => setActivePlayTab('story')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activePlayTab === 'story'
                      ? 'bg-[#F1C878] text-[#121B2B]'
                      : 'bg-[#121B2B] text-[#E6EFEA] hover:bg-[#294D4D]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>STORY JOURNEY</span>
                </button>

                <button
                  data-testid="tab-wake-trials"
                  onClick={() => setActivePlayTab('trials')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activePlayTab === 'trials'
                      ? 'bg-[#F1C878] text-[#121B2B]'
                      : 'bg-[#121B2B] text-[#E6EFEA] hover:bg-[#294D4D]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>WAKE TRIALS</span>
                </button>

                <button
                  data-testid="tab-leaderboard"
                  onClick={() => setActivePlayTab('leaderboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activePlayTab === 'leaderboard'
                      ? 'bg-[#F1C878] text-[#121B2B]'
                      : 'bg-[#121B2B] text-[#E6EFEA] hover:bg-[#294D4D]'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>LEADERBOARD</span>
                </button>

                <button
                  onClick={() => openStoryJournal()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-xs font-semibold text-[#8FE7C7]"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Journal</span>
                </button>

                <button
                  onClick={() => setShowPlayModal(false)}
                  className="px-3 py-2 rounded-lg bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* TAB A: STORY JOURNEY (6 CHAPTERS) */}
            {activePlayTab === 'story' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#121B2B]/90 border border-[#294D4D] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8FE7C7]">
                      Active Campaign Progress · {saveState.discoveredMemoryIds.length} / 12 Memory Echoes Found
                    </div>
                    <div className="text-sm font-semibold text-[#F1C878]">
                      {currentActiveChapterDef.title}
                    </div>
                    <div className="text-xs text-[#A7B8AE]">
                      {STORY_DIFFICULTY_INFO[selectedStoryDiff].summary}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['easy', 'medium', 'hard', 'extreme'] as StoryDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleStoryDifficultyChange(diff)}
                        className={`px-2.5 py-1.5 rounded border text-xs font-medium capitalize transition-colors ${
                          selectedStoryDiff === diff
                            ? 'bg-[#294D4D] border-[#F1C878] text-[#F1C878]'
                            : 'bg-[#1D2D43] border-[#294D4D] text-[#A7B8AE] hover:text-[#E6EFEA]'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}

                    <button
                      data-testid="continue-journey-btn"
                      onClick={() => startCampaignChapter(saveState.currentChapterId, false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs shadow transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Continue Journey</span>
                    </button>
                  </div>
                </div>

                {/* 6 Campaign Chapter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {CAMPAIGN_CHAPTERS.map((def) => {
                    const chapId = def.chapterId;
                    const state = saveState.chapters[chapId];
                    const isUnlocked = Boolean(state?.unlocked);
                    const isCompleted = Boolean(state?.completed);
                    const unlockedCairnsCount = state?.unlockedCheckpointIds?.length || 0;
                    const totalCairnsCount = def.checkpoints?.length || 4;

                    return (
                      <div
                        key={chapId}
                        data-testid={`chapter-card-${chapId}`}
                        className={`rounded-lg border p-3 flex flex-col justify-between gap-3 transition-colors ${
                          isUnlocked
                            ? 'bg-[#121B2B]/90 border-[#294D4D] hover:border-[#8FE7C7]/60'
                            : 'bg-[#121B2B]/45 border-[#294D4D]/40 opacity-75'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="aspect-video rounded overflow-hidden border border-[#294D4D] relative">
                            <img
                              src={CHAPTER_ART_MAP[chapId]}
                              alt={def.title}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover ${!isUnlocked ? 'grayscale contrast-75' : ''}`}
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#121B2B]/85 text-[10px] font-mono-tabular text-[#E6EFEA]">
                              10 Sub-Areas · {unlockedCairnsCount}/{totalCairnsCount} Cairns
                            </div>
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
                            <div className="text-[11px] text-[#8FE7C7]">{def.regionSubtitle}</div>
                            <p className="text-[11px] text-[#A7B8AE] leading-snug mt-1">
                              {def.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {isUnlocked ? (
                            <>
                              <button
                                data-testid={`start-chapter-${chapId}`}
                                onClick={() => startCampaignChapter(chapId, false)}
                                className="flex-1 py-2 px-3 rounded bg-[#8FE7C7] hover:bg-[#a6f0d6] text-[#121B2B] font-semibold text-xs transition-colors"
                              >
                                {state?.activeCheckpointId ? 'Resume Chapter' : 'Start Chapter'}
                              </button>
                              {(isCompleted || state?.activeCheckpointId) && (
                                <button
                                  onClick={() => startCampaignChapter(chapId, true)}
                                  className="py-2 px-2.5 rounded bg-[#1D2D4D] hover:bg-[#294D4D] border border-[#294D4D] text-[#A7B8AE] hover:text-white text-xs"
                                  title="Reset & Replay Chapter from Beginning"
                                >
                                  Replay
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              data-testid={`locked-chapter-${chapId}`}
                              disabled
                              className="w-full py-2 px-3 rounded bg-[#1D2D43]/60 border border-[#294D4D]/50 text-[#A7B8AE] font-medium text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Restore Previous Chapter</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB B: WAKE TRIALS */}
            {activePlayTab === 'trials' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#E6EFEA]">
                    Select Wake Trial Difficulty Tier (15 Curated Archetypes · Simulation Verified)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['easy', 'medium', 'hard', 'extreme'] as TrialDifficulty[]).map((diff) => {
                      const rec = saveState.trials[diff];
                      const info = TRIAL_DIFFICULTY_INFO[diff];
                      const active = selectedTrialDiff === diff;
                      return (
                        <button
                          key={diff}
                          data-testid={`trial-diff-${diff}`}
                          onClick={() => {
                            setSelectedTrialDiff(diff);
                            setCustomTrialSeed(WakeTrialsGenerator.generateSeedCode(diff));
                          }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            active
                              ? 'bg-[#294D4D] border-[#F1C878] text-[#F1C878]'
                              : 'bg-[#121B2B]/85 border-[#294D4D] text-[#E6EFEA] hover:border-[#8FE7C7]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider">
                              {info.label} · {info.segments}
                            </span>
                            <span className="text-[11px] font-mono-tabular text-[#8FE7C7]">
                              {rec ? `Best: ${rec.bestTimeSec.toFixed(1)}s` : 'No record'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#A7B8AE] mt-1 leading-snug">
                            {info.summary}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#E6EFEA]">
                    Trial Seed (Shareable & Deterministic)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={customTrialSeed}
                      onChange={(e) => setCustomTrialSeed(e.target.value.toUpperCase())}
                      placeholder="E.G. ME-48219"
                      className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-[#121B2B] border border-[#294D4D] text-xs font-mono-tabular text-[#E6EFEA] focus:outline-none focus:border-[#8FE7C7]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCustomTrialSeed(WakeTrialsGenerator.generateSeedCode(selectedTrialDiff))
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#294D4D] text-xs text-[#8FE7C7]"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Randomize Seed</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#294D4D] text-xs text-[#A7B8AE]">
                  <span>Tiers Completed: {completedTrialsCount} / 4</span>
                  <button
                    data-testid="launch-wake-trial-btn"
                    onClick={() => launchWakeTrial(selectedTrialDiff, customTrialSeed)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F1C878] hover:bg-[#f7d894] text-[#121B2B] font-semibold text-xs shadow-lg"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Wake Trial</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB C: LEADERBOARD */}
            {activePlayTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#121B2B]/90 border border-[#294D4D] p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#A7B8AE]">Traveler Name:</label>
                    <input
                      type="text"
                      maxLength={24}
                      value={playerNameInput}
                      onChange={(e) => {
                        setPlayerNameInput(e.target.value);
                        SaveManager.setPlayerDisplayName(e.target.value);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1D2D43] border border-[#294D4D] text-xs text-[#F1C878] font-semibold w-36 focus:outline-none focus:border-[#8FE7C7]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={lbModeFilter}
                      onChange={(e) =>
                        setLbModeFilter(e.target.value as CampaignChapterId | 'wake_trial' | 'all')
                      }
                      className="px-2.5 py-1.5 rounded bg-[#1D2D43] border border-[#294D4D] text-xs text-[#E6EFEA]"
                    >
                      <option value="all">All Modes & Chapters</option>
                      <option value="wake_trial">Wake Trials</option>
                      {CAMPAIGN_CHAPTERS.map((c) => (
                        <option key={c.chapterId} value={c.chapterId}>
                          {c.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={lbDiffFilter}
                      onChange={(e) =>
                        setLbDiffFilter(e.target.value as StoryDifficulty | TrialDifficulty | 'all')
                      }
                      className="px-2.5 py-1.5 rounded bg-[#1D2D43] border border-[#294D4D] text-xs text-[#E6EFEA]"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="extreme">Extreme</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#294D4D] bg-[#121B2B]/80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#294D4D] text-[#8FE7C7] text-[11px] uppercase">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Traveler</th>
                        <th className="py-2.5 px-3">Region / Trial</th>
                        <th className="py-2.5 px-3">Diff</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Respawns</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#294D4D]/50">
                      {filteredLeaderboard.map((entry, idx) => (
                        <tr key={entry.id} className="hover:bg-[#1D2D43]/60">
                          <td className="py-2 px-3 font-mono-tabular text-[#F1C878] font-semibold">
                            #{idx + 1}
                          </td>
                          <td className="py-2 px-3 font-medium text-[#E6EFEA]">
                            {entry.playerName}
                          </td>
                          <td className="py-2 px-3 text-[#A7B8AE]">
                            {entry.targetId === 'wake_trial'
                              ? 'Wake Trial'
                              : getCampaignChapter(entry.targetId).title}
                            {entry.seed ? ` (${entry.seed})` : ''}
                          </td>
                          <td className="py-2 px-3 capitalize text-[#8FE7C7]">
                            {entry.difficulty}
                          </td>
                          <td className="py-2 px-3 font-mono-tabular text-[#E6EFEA]">
                            {entry.completionTimeSec.toFixed(1)}s
                          </td>
                          <td className="py-2 px-3 font-mono-tabular text-[#A7B8AE]">
                            {entry.deaths}
                          </td>
                          <td className="py-2 px-3 font-mono-tabular text-right font-semibold text-[#F1C878]">
                            {entry.score.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          6. PERSISTENT STORY JOURNAL MODAL (Priority 6)
      ========================================================= */}
      {showJournalModal && (
        <div
          data-testid="story-journal-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#121B2B]/92 p-3 sm:p-4 pointer-events-auto"
        >
          <div className="w-full max-w-4xl rounded-xl bg-[#1D2D43] border border-[#294D4D] p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3 shrink-0">
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[#8FE7C7]">
                  CHRONICLES OF THE VEILGROVE
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#F1C878] font-serif-display">
                  Story Journal & Bestiary
                </h3>
              </div>
              <button
                onClick={() => {
                  refreshSaveSnapshot();
                  setShowJournalModal(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Close
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#294D4D] pb-2.5 shrink-0">
              {JOURNAL_CATEGORIES.map((cat) => {
                const unreadInCat = StoryJournalManager.getCategoryUnreadCount(cat.id);
                const isActive = activeJournalCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveJournalCategory(cat.id);
                      const list = StoryJournalManager.getEntriesByCategory(cat.id);
                      const first = list.find((e) => e.unlocked) || list[0];
                      if (first) {
                        setSelectedJournalEntryId(first.id);
                        if (first.unlocked) StoryJournalManager.markRead(first.id);
                      }
                      refreshSaveSnapshot();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#F1C878] text-[#121B2B]'
                        : 'bg-[#121B2B] text-[#E6EFEA] hover:bg-[#294D4D]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {unreadInCat > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#8FE7C7]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Master-Detail Journal Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className="md:col-span-5 space-y-1.5 overflow-y-auto max-h-56 md:max-h-96 pr-1">
                {categoryEntries.map((entry) => {
                  const selected = activeJournalEntry?.id === entry.id;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSelectedJournalEntryId(entry.id);
                        if (entry.unlocked) {
                          StoryJournalManager.markRead(entry.id);
                          refreshSaveSnapshot();
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                        selected
                          ? 'bg-[#294D4D] border-[#F1C878] text-[#F1C878]'
                          : entry.unlocked
                          ? 'bg-[#121B2B]/90 border-[#294D4D] text-[#E6EFEA] hover:border-[#8FE7C7]/50'
                          : 'bg-[#121B2B]/40 border-[#294D4D]/40 text-[#A7B8AE]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">
                          {entry.unlocked ? entry.title : '??? · Undiscovered Entry'}
                        </div>
                        <div className="text-[10px] text-[#8FE7C7] truncate">
                          {entry.unlocked ? entry.subtitle : entry.discoveryHint}
                        </div>
                      </div>
                      {!entry.unlocked ? (
                        <Lock className="w-3.5 h-3.5 text-[#A7B8AE] shrink-0" />
                      ) : entry.unread ? (
                        <span className="px-1.5 py-0.5 rounded bg-[#F1C878] text-[#121B2B] text-[9px] font-bold shrink-0">
                          NEW
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="md:col-span-7 rounded-lg bg-[#121B2B]/90 border border-[#294D4D] p-4 flex flex-col justify-between">
                {activeJournalEntry ? (
                  activeJournalEntry.unlocked ? (
                    <div className="space-y-3">
                      <div className="border-b border-[#294D4D] pb-2">
                        <div className="text-[11px] uppercase tracking-wider text-[#8FE7C7]">
                          {activeJournalEntry.subtitle}
                        </div>
                        <h4 className="text-xl font-semibold text-[#F1C878] font-serif-display">
                          {activeJournalEntry.title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-[#E6EFEA]/95 leading-relaxed">
                        {activeJournalEntry.loreBody}
                      </p>
                      {activeJournalEntry.quote && (
                        <p className="text-xs italic text-[#F1C878]/90 border-l-2 border-[#F1C878]/50 pl-3">
                          {activeJournalEntry.quote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="my-auto text-center space-y-2 py-8">
                      <Lock className="w-7 h-7 text-[#A7B8AE] mx-auto" />
                      <div className="text-sm font-semibold text-[#E6EFEA]">
                        Entry Still Veiled in Slumber
                      </div>
                      <p className="text-xs text-[#8FE7C7] max-w-xs mx-auto">
                        Hint: {activeJournalEntry.discoveryHint}
                      </p>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          7. SETTINGS & ACCESSIBILITY MODAL
      ========================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/90 p-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-xl bg-[#1D2D43] border border-[#294D4D] p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto">
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

              {/* Dynamic Lighting Quality */}
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

              {/* Touch Controls Mode */}
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
                  <div className="text-[#A7B8AE] text-[11px]">Displays Pip’s world-anchored story bubbles</div>
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
                  <div className="text-[#E6EFEA] font-medium">Desktop 2.5D Mouse Depth Parallax</div>
                  <div className="text-[#A7B8AE] text-[11px]">Subtle decorative layer depth response to pointer</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.mouseDepthParallax !== false}
                  onChange={(e) => updateSettingField('mouseDepthParallax', e.target.checked)}
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
          8. CREDITS — ABOUT WISPWAKE MODAL (Priority 8 World Artwork)
      ========================================================= */}
      {showCreditsModal && (
        <div
          data-testid="about-wispwake-modal"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#121B2B]/92 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-2xl rounded-xl bg-[#1D2D43] border border-[#294D4D] p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#294D4D] pb-3">
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[#8FE7C7]">
                  CREDITS & LORE
                </div>
                <h3 className="text-2xl font-semibold text-[#F1C878] font-serif-display">
                  ABOUT WISPWAKE
                </h3>
              </div>
              <button
                onClick={() => setShowCreditsModal(false)}
                className="px-3 py-1 rounded bg-[#294D4D] hover:bg-[#57725B] text-xs text-[#E6EFEA]"
              >
                Close
              </button>
            </div>

            {/* Full 16:9 Painted World Illustration of Nima & Pip in the Veilgrove */}
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-[#294D4D] bg-[#121B2B]">
              <img
                src={GENERATED_ASSETS.wispwakeWorldCreditsArt}
                alt="Nima and Pip overlooking the living Veilgrove"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3.5 text-xs text-[#E6EFEA]/90 leading-relaxed">
              {/* 1. GAME WORLD */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-[#F1C878]">
                  GAME WORLD
                </h4>
                <p>
                  The <span className="text-[#8FE7C7] font-medium">Veilgrove</span> is a vast living forest grown around an ancient colossal tree whose roots drink from moonlit wetlands and subterranean caverns while its crown and harmonic sanctuaries touch the open sky. When the protective slumber known as the{' '}
                  <span className="text-[#B7A2E8] font-medium">Stillness</span> hushed the world, Nima awoke carrying a warm living seed alongside Pip, a luminous moth-like wisp drawn to its pulse.
                </p>
              </div>

              {/* 2. STORY */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-[#F1C878]">
                  STORY
                </h4>
                <p>
                  Guided by Pip’s light, Nima journeys across six interconnected regions—waking the first boughs of the{' '}
                  <span className="text-[#8FE7C7]">Sleeping Canopy</span>, parting the tidal mists of the{' '}
                  <span className="text-[#8FE7C7]">Moonlit Marsh</span>, rekindling the deep pulse of{' '}
                  <span className="text-[#8FE7C7]">The Hollow Below</span>, ascending the updrafts of{' '}
                  <span className="text-[#8FE7C7]">The Windward Ruins</span>, ringing the bronze bells of{' '}
                  <span className="text-[#8FE7C7]">The Shattered Choir</span>, and entering{' '}
                  <span className="text-[#8FE7C7]">The Heart of the Veil</span> to awaken the First Seed Bloom.
                </p>
              </div>

              {/* 3. GITHUB REPOSITORY LINK */}
              <div className="pt-2 border-t border-[#294D4D]">
                <a
                  href="https://github.com/rawsushies/wispwake"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121B2B] hover:bg-[#294D4D] border border-[#8FE7C7]/50 text-[#8FE7C7] font-semibold text-xs transition-colors"
                >
                  <span>Explore the open-source project on GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
