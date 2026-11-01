import {
  AccessibilitySettings,
  CampaignChapterId,
  DEFAULT_SETTINGS,
  TrialDifficulty,
} from '../config/gameConfig';

const SAVE_STORAGE_KEY_V2 = 'wispwake_save_v2';
const LEGACY_STORAGE_KEY_V1 = 'wispwake_save_v1';

export interface ChapterProgressRecord {
  unlocked: boolean;
  completed: boolean;
  activeCheckpointId: string | null;
  checkpointX: number | null;
  checkpointY: number | null;
  activatedRootBridgeIds: string[];
}

export interface TrialRecord {
  bestTimeSec: number;
  lastSeed: string;
}

export interface WispwakeSaveDataV2 {
  schemaVersion: 2;
  currentChapterId: CampaignChapterId;
  chapters: Record<CampaignChapterId, ChapterProgressRecord>;
  seenDialogueIds: string[];
  trials: Record<TrialDifficulty, TrialRecord | null>;
  settings: AccessibilitySettings;
}

const CHAPTER_ORDER: CampaignChapterId[] = [
  'sleeping_canopy',
  'moonlit_marsh',
  'hollow_below',
  'windward_ruins',
];

function createDefaultChapters(): Record<CampaignChapterId, ChapterProgressRecord> {
  return {
    sleeping_canopy: {
      unlocked: true,
      completed: false,
      activeCheckpointId: null,
      checkpointX: null,
      checkpointY: null,
      activatedRootBridgeIds: [],
    },
    moonlit_marsh: {
      unlocked: false,
      completed: false,
      activeCheckpointId: null,
      checkpointX: null,
      checkpointY: null,
      activatedRootBridgeIds: [],
    },
    hollow_below: {
      unlocked: false,
      completed: false,
      activeCheckpointId: null,
      checkpointX: null,
      checkpointY: null,
      activatedRootBridgeIds: [],
    },
    windward_ruins: {
      unlocked: false,
      completed: false,
      activeCheckpointId: null,
      checkpointX: null,
      checkpointY: null,
      activatedRootBridgeIds: [],
    },
  };
}

const DEFAULT_SAVE_DATA_V2: WispwakeSaveDataV2 = {
  schemaVersion: 2,
  currentChapterId: 'sleeping_canopy',
  chapters: createDefaultChapters(),
  seenDialogueIds: [],
  trials: {
    easy: null,
    medium: null,
    hard: null,
    extreme: null,
  },
  settings: { ...DEFAULT_SETTINGS },
};

export class SaveManager {
  private static data: WispwakeSaveDataV2 = SaveManager.load();

  public static load(): WispwakeSaveDataV2 {
    try {
      const rawV2 = window.localStorage.getItem(SAVE_STORAGE_KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (parsed && parsed.schemaVersion === 2) {
          const defaultChaps = createDefaultChapters();
          return {
            ...structuredClone(DEFAULT_SAVE_DATA_V2),
            ...parsed,
            chapters: {
              sleeping_canopy: { ...defaultChaps.sleeping_canopy, ...(parsed.chapters?.sleeping_canopy ?? {}) },
              moonlit_marsh: { ...defaultChaps.moonlit_marsh, ...(parsed.chapters?.moonlit_marsh ?? {}) },
              hollow_below: { ...defaultChaps.hollow_below, ...(parsed.chapters?.hollow_below ?? {}) },
              windward_ruins: { ...defaultChaps.windward_ruins, ...(parsed.chapters?.windward_ruins ?? {}) },
            },
            settings: {
              ...DEFAULT_SETTINGS,
              ...(parsed.settings ?? {}),
            },
          };
        }
      }

      // Safe Migration from Schema V1 (Preserves settings, checkpoint progress, and root bridges; drops obsolete customBackdrops)
      const rawV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
      if (rawV1) {
        const v1 = JSON.parse(rawV1);
        const migrated = structuredClone(DEFAULT_SAVE_DATA_V2);
        if (v1 && typeof v1 === 'object') {
          migrated.settings = {
            ...DEFAULT_SETTINGS,
            ...(v1.settings ?? {}),
          };
          const scCompleted = Boolean(v1.chapterCompleted);
          migrated.chapters.sleeping_canopy = {
            unlocked: true,
            completed: scCompleted,
            activeCheckpointId: v1.activeCheckpointId ?? null,
            checkpointX: typeof v1.checkpointX === 'number' ? v1.checkpointX : null,
            checkpointY: typeof v1.checkpointY === 'number' ? v1.checkpointY : null,
            activatedRootBridgeIds: Array.isArray(v1.activatedRootBridgeIds) ? v1.activatedRootBridgeIds : [],
          };
          if (scCompleted) {
            migrated.chapters.moonlit_marsh.unlocked = true;
          }
        }
        window.localStorage.setItem(SAVE_STORAGE_KEY_V2, JSON.stringify(migrated));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
        return migrated;
      }

      return structuredClone(DEFAULT_SAVE_DATA_V2);
    } catch {
      return structuredClone(DEFAULT_SAVE_DATA_V2);
    }
  }

  public static get(): WispwakeSaveDataV2 {
    return this.data;
  }

  public static save(partial: Partial<WispwakeSaveDataV2>): WispwakeSaveDataV2 {
    this.data = {
      ...this.data,
      ...partial,
    };
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY_V2, JSON.stringify(this.data));
    } catch {
      // Ignore storage quota errors
    }
    return this.data;
  }

  public static getChapterProgress(chapterId: CampaignChapterId): ChapterProgressRecord {
    return this.data.chapters[chapterId] || createDefaultChapters()[chapterId];
  }

  public static setCurrentChapter(chapterId: CampaignChapterId): void {
    this.save({ currentChapterId: chapterId });
  }

  public static updateSettings(partial: Partial<AccessibilitySettings>): AccessibilitySettings {
    const updated = {
      ...this.data.settings,
      ...partial,
    };
    this.save({ settings: updated });
    return updated;
  }

  public static recordCheckpoint(chapterId: CampaignChapterId, id: string, x: number, y: number): void {
    const chap = this.getChapterProgress(chapterId);
    const updatedChap: ChapterProgressRecord = {
      ...chap,
      activeCheckpointId: id,
      checkpointX: x,
      checkpointY: y,
    };
    this.save({
      chapters: {
        ...this.data.chapters,
        [chapterId]: updatedChap,
      },
    });
  }

  public static recordRootBridge(chapterId: CampaignChapterId, id: string): void {
    const chap = this.getChapterProgress(chapterId);
    if (!chap.activatedRootBridgeIds.includes(id)) {
      const updatedChap: ChapterProgressRecord = {
        ...chap,
        activatedRootBridgeIds: [...chap.activatedRootBridgeIds, id],
      };
      this.save({
        chapters: {
          ...this.data.chapters,
          [chapterId]: updatedChap,
        },
      });
    }
  }

  public static markChapterCompleted(chapterId: CampaignChapterId): CampaignChapterId | null {
    const idx = CHAPTER_ORDER.indexOf(chapterId);
    const nextChapterId = idx >= 0 && idx < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[idx + 1] : null;

    const updatedChapters = { ...this.data.chapters };
    updatedChapters[chapterId] = {
      ...updatedChapters[chapterId],
      completed: true,
    };

    if (nextChapterId) {
      updatedChapters[nextChapterId] = {
        ...updatedChapters[nextChapterId],
        unlocked: true,
      };
    }

    this.save({ chapters: updatedChapters });
    return nextChapterId;
  }

  public static hasSeenDialogue(id: string): boolean {
    return this.data.seenDialogueIds.includes(id);
  }

  public static markDialogueSeen(id: string): void {
    if (!this.data.seenDialogueIds.includes(id)) {
      this.save({
        seenDialogueIds: [...this.data.seenDialogueIds, id],
      });
    }
  }

  public static recordTrialCompletion(difficulty: TrialDifficulty, timeSec: number, seed: string): void {
    const prev = this.data.trials[difficulty];
    const isBest = !prev || timeSec < prev.bestTimeSec;
    this.save({
      trials: {
        ...this.data.trials,
        [difficulty]: {
          bestTimeSec: isBest ? Number(timeSec.toFixed(2)) : prev.bestTimeSec,
          lastSeed: seed,
        },
      },
    });
  }

  public static resetChapterProgress(chapterId: CampaignChapterId): void {
    const chap = this.getChapterProgress(chapterId);
    this.save({
      chapters: {
        ...this.data.chapters,
        [chapterId]: {
          unlocked: chap.unlocked,
          completed: chap.completed,
          activeCheckpointId: null,
          checkpointX: null,
          checkpointY: null,
          activatedRootBridgeIds: [],
        },
      },
    });
  }

  public static resetAllProgress(): WispwakeSaveDataV2 {
    const preservedSettings = { ...this.data.settings };
    this.data = {
      ...structuredClone(DEFAULT_SAVE_DATA_V2),
      settings: preservedSettings,
    };
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY_V2, JSON.stringify(this.data));
    } catch {
      // Ignore storage error
    }
    return this.data;
  }
}
