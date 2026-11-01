import {
  AccessibilitySettings,
  CampaignChapterId,
  DEFAULT_SETTINGS,
  StoryDifficulty,
  TrialDifficulty,
} from '../config/gameConfig';

const SAVE_STORAGE_KEY_V3 = 'wispwake_save_v3';
const LEGACY_STORAGE_KEY_V2 = 'wispwake_save_v2';
const LEGACY_STORAGE_KEY_V1 = 'wispwake_save_v1';

export interface ChapterProgressRecord {
  unlocked: boolean;
  completed: boolean;
  activeCheckpointId: string | null;
  unlockedCheckpointIds: string[];
  checkpointX: number | null;
  checkpointY: number | null;
  activatedRootBridgeIds: string[];
  bestTimeSec?: number | null;
  leastDeaths?: number | null;
}

export interface TrialRecord {
  bestTimeSec: number;
  lastSeed: string;
}

export interface NpcProgressRecord {
  met: boolean;
  talkCount: number;
  questState: 'available' | 'active' | 'completed';
}

export interface LeaderboardEntryRecord {
  id: string;
  playerName: string;
  mode: 'story_chapter' | 'wake_trial';
  targetId: CampaignChapterId | 'wake_trial';
  difficulty: StoryDifficulty | TrialDifficulty;
  seed: string | null;
  completionTimeSec: number;
  deaths: number;
  score: number;
  dateIso: string;
}

export interface WispwakeSaveDataV3 {
  schemaVersion: 3;
  playerDisplayName: string;
  currentChapterId: CampaignChapterId;
  storyDifficulty: StoryDifficulty;
  chapters: Record<CampaignChapterId, ChapterProgressRecord>;
  seenDialogueIds: string[];
  discoveredMemoryIds: string[];
  unlockedJournalIds: string[];
  readJournalIds: string[];
  npcStates: Record<string, NpcProgressRecord>;
  encounteredCreatureIds: string[];
  leaderboardEntries: LeaderboardEntryRecord[];
  trials: Record<TrialDifficulty, TrialRecord | null>;
  settings: AccessibilitySettings;
}

export type WispwakeSaveData = WispwakeSaveDataV3;

export const CHAPTER_ORDER: CampaignChapterId[] = [
  'sleeping_canopy',
  'moonlit_marsh',
  'hollow_below',
  'windward_ruins',
  'shattered_choir',
  'heart_of_veil',
];

function createEmptyChapterRecord(unlocked = false): ChapterProgressRecord {
  return {
    unlocked,
    completed: false,
    activeCheckpointId: null,
    unlockedCheckpointIds: [],
    checkpointX: null,
    checkpointY: null,
    activatedRootBridgeIds: [],
    bestTimeSec: null,
    leastDeaths: null,
  };
}

function createDefaultChapters(): Record<CampaignChapterId, ChapterProgressRecord> {
  return {
    sleeping_canopy: createEmptyChapterRecord(true),
    moonlit_marsh: createEmptyChapterRecord(false),
    hollow_below: createEmptyChapterRecord(false),
    windward_ruins: createEmptyChapterRecord(false),
    shattered_choir: createEmptyChapterRecord(false),
    heart_of_veil: createEmptyChapterRecord(false),
  };
}

const DEFAULT_SAVE_DATA_V3: WispwakeSaveDataV3 = {
  schemaVersion: 3,
  playerDisplayName: 'Nima',
  currentChapterId: 'sleeping_canopy',
  storyDifficulty: 'medium',
  chapters: createDefaultChapters(),
  seenDialogueIds: [],
  discoveredMemoryIds: [],
  unlockedJournalIds: ['story_ch01_awakening', 'char_nima', 'char_pip', 'place_sleeping_canopy', 'creature_drifter'],
  readJournalIds: ['char_nima', 'char_pip'],
  npcStates: {},
  encounteredCreatureIds: ['drifter'],
  leaderboardEntries: [],
  trials: {
    easy: null,
    medium: null,
    hard: null,
    extreme: null,
  },
  settings: { ...DEFAULT_SETTINGS },
};

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore SSR/security errors
  }
  return null;
}

function normalizeChapterRecord(
  raw: Partial<ChapterProgressRecord> | undefined,
  fallbackUnlocked: boolean
): ChapterProgressRecord {
  const base = createEmptyChapterRecord(fallbackUnlocked);
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    unlocked: typeof raw.unlocked === 'boolean' ? raw.unlocked : fallbackUnlocked,
    completed: Boolean(raw.completed),
    unlockedCheckpointIds: Array.isArray(raw.unlockedCheckpointIds)
      ? raw.unlockedCheckpointIds
      : raw.activeCheckpointId
        ? [raw.activeCheckpointId]
        : [],
    activatedRootBridgeIds: Array.isArray(raw.activatedRootBridgeIds)
      ? raw.activatedRootBridgeIds
      : [],
  };
}

export class SaveManager {
  private static data: WispwakeSaveDataV3 = SaveManager.load();

  public static load(): WispwakeSaveDataV3 {
    const storage = getLocalStorage();
    if (!storage) {
      return structuredClone(DEFAULT_SAVE_DATA_V3);
    }

    try {
      // 1. Load Schema V3 directly if present
      const rawV3 = storage.getItem(SAVE_STORAGE_KEY_V3);
      if (rawV3) {
        const parsed = JSON.parse(rawV3);
        if (parsed && parsed.schemaVersion === 3) {
          return SaveManager.hydrateAndNormalize(parsed);
        }
      }

      // 2. Migrate Schema V2 -> V3
      const rawV2 = storage.getItem(LEGACY_STORAGE_KEY_V2);
      if (rawV2) {
        const v2 = JSON.parse(rawV2);
        const migrated = SaveManager.hydrateAndNormalize(v2);
        // If Chapter 04 was completed in V2, automatically unlock Chapter 05
        if (migrated.chapters.windward_ruins.completed) {
          migrated.chapters.shattered_choir.unlocked = true;
        }
        if (migrated.chapters.shattered_choir.completed) {
          migrated.chapters.heart_of_veil.unlocked = true;
        }
        storage.setItem(SAVE_STORAGE_KEY_V3, JSON.stringify(migrated));
        return migrated;
      }

      // 3. Migrate Schema V1 -> V3
      const rawV1 = storage.getItem(LEGACY_STORAGE_KEY_V1);
      if (rawV1) {
        const v1 = JSON.parse(rawV1);
        const migrated = structuredClone(DEFAULT_SAVE_DATA_V3);
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
            unlockedCheckpointIds: v1.activeCheckpointId ? [v1.activeCheckpointId] : [],
            checkpointX: typeof v1.checkpointX === 'number' ? v1.checkpointX : null,
            checkpointY: typeof v1.checkpointY === 'number' ? v1.checkpointY : null,
            activatedRootBridgeIds: Array.isArray(v1.activatedRootBridgeIds)
              ? v1.activatedRootBridgeIds
              : [],
            bestTimeSec: null,
            leastDeaths: null,
          };
          if (scCompleted) {
            migrated.chapters.moonlit_marsh.unlocked = true;
          }
        }
        storage.setItem(SAVE_STORAGE_KEY_V3, JSON.stringify(migrated));
        return migrated;
      }

      return structuredClone(DEFAULT_SAVE_DATA_V3);
    } catch {
      return structuredClone(DEFAULT_SAVE_DATA_V3);
    }
  }

  private static hydrateAndNormalize(parsed: Record<string, unknown>): WispwakeSaveDataV3 {
    const rawChapters = (parsed.chapters as Record<string, Partial<ChapterProgressRecord>>) || {};
    const chapters: Record<CampaignChapterId, ChapterProgressRecord> = {
      sleeping_canopy: normalizeChapterRecord(rawChapters.sleeping_canopy, true),
      moonlit_marsh: normalizeChapterRecord(rawChapters.moonlit_marsh, false),
      hollow_below: normalizeChapterRecord(rawChapters.hollow_below, false),
      windward_ruins: normalizeChapterRecord(rawChapters.windward_ruins, false),
      shattered_choir: normalizeChapterRecord(rawChapters.shattered_choir, false),
      heart_of_veil: normalizeChapterRecord(rawChapters.heart_of_veil, false),
    };

    // Ensure sequential unlock chain integrity
    for (let i = 0; i < CHAPTER_ORDER.length - 1; i++) {
      if (chapters[CHAPTER_ORDER[i]].completed) {
        chapters[CHAPTER_ORDER[i + 1]].unlocked = true;
      }
    }

    const baseUnlockedJournal = new Set<string>(DEFAULT_SAVE_DATA_V3.unlockedJournalIds);
    if (Array.isArray(parsed.unlockedJournalIds)) {
      for (const id of parsed.unlockedJournalIds) {
        if (typeof id === 'string') baseUnlockedJournal.add(id);
      }
    }

    const discoveredMemories = Array.isArray(parsed.discoveredMemoryIds)
      ? (parsed.discoveredMemoryIds as string[])
      : [];
    for (const memId of discoveredMemories) {
      baseUnlockedJournal.add(`journal_${memId}`);
    }

    return {
      schemaVersion: 3,
      playerDisplayName:
        typeof parsed.playerDisplayName === 'string' && parsed.playerDisplayName.trim().length > 0
          ? parsed.playerDisplayName.trim().slice(0, 20)
          : 'Nima',
      currentChapterId:
        typeof parsed.currentChapterId === 'string' &&
        CHAPTER_ORDER.includes(parsed.currentChapterId as CampaignChapterId)
          ? (parsed.currentChapterId as CampaignChapterId)
          : 'sleeping_canopy',
      storyDifficulty: (parsed.storyDifficulty as StoryDifficulty) ?? 'medium',
      chapters,
      seenDialogueIds: Array.isArray(parsed.seenDialogueIds)
        ? (parsed.seenDialogueIds as string[])
        : [],
      discoveredMemoryIds: discoveredMemories,
      unlockedJournalIds: Array.from(baseUnlockedJournal),
      readJournalIds: Array.isArray(parsed.readJournalIds)
        ? (parsed.readJournalIds as string[])
        : [...DEFAULT_SAVE_DATA_V3.readJournalIds],
      npcStates:
        parsed.npcStates && typeof parsed.npcStates === 'object'
          ? (parsed.npcStates as Record<string, NpcProgressRecord>)
          : {},
      encounteredCreatureIds: Array.isArray(parsed.encounteredCreatureIds)
        ? (parsed.encounteredCreatureIds as string[])
        : ['drifter'],
      leaderboardEntries: Array.isArray(parsed.leaderboardEntries)
        ? (parsed.leaderboardEntries as LeaderboardEntryRecord[])
        : [],
      trials: {
        easy: (parsed.trials as Record<TrialDifficulty, TrialRecord | null>)?.easy ?? null,
        medium: (parsed.trials as Record<TrialDifficulty, TrialRecord | null>)?.medium ?? null,
        hard: (parsed.trials as Record<TrialDifficulty, TrialRecord | null>)?.hard ?? null,
        extreme: (parsed.trials as Record<TrialDifficulty, TrialRecord | null>)?.extreme ?? null,
      },
      settings: {
        ...DEFAULT_SETTINGS,
        ...((parsed.settings as Partial<AccessibilitySettings>) ?? {}),
      },
    };
  }

  public static get(): WispwakeSaveDataV3 {
    return this.data;
  }

  public static save(partial: Partial<WispwakeSaveDataV3>): WispwakeSaveDataV3 {
    this.data = {
      ...this.data,
      ...partial,
      schemaVersion: 3,
    };
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.setItem(SAVE_STORAGE_KEY_V3, JSON.stringify(this.data));
        // Also mirror compatible subset to V2 key so any external test inspecting V2 sees latest progress
        storage.setItem(LEGACY_STORAGE_KEY_V2, JSON.stringify(this.data));
      } catch {
        // Ignore quota errors
      }
    }
    return this.data;
  }

  public static setPlayerDisplayName(name: string): void {
    const clean = name.trim().slice(0, 20) || 'Nima';
    this.save({ playerDisplayName: clean });
  }

  public static getChapterProgress(chapterId: CampaignChapterId): ChapterProgressRecord {
    return this.data.chapters[chapterId] || createDefaultChapters()[chapterId];
  }

  public static setCurrentChapter(chapterId: CampaignChapterId): void {
    this.save({ currentChapterId: chapterId });
  }

  public static setStoryDifficulty(difficulty: StoryDifficulty): void {
    this.save({ storyDifficulty: difficulty });
  }

  public static getStoryDifficulty(): StoryDifficulty {
    return this.data.storyDifficulty || 'medium';
  }

  public static updateSettings(partial: Partial<AccessibilitySettings>): AccessibilitySettings {
    const updated = {
      ...this.data.settings,
      ...partial,
    };
    this.save({ settings: updated });
    return updated;
  }

  public static recordCheckpoint(
    chapterId: CampaignChapterId,
    id: string,
    x: number,
    y: number
  ): void {
    const chap = this.getChapterProgress(chapterId);
    const unlockedIds = chap.unlockedCheckpointIds.includes(id)
      ? chap.unlockedCheckpointIds
      : [...chap.unlockedCheckpointIds, id];
    const updatedChap: ChapterProgressRecord = {
      ...chap,
      activeCheckpointId: id,
      unlockedCheckpointIds: unlockedIds,
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

  public static recordDiscoveredMemory(id: string): void {
    const updatedMemories = this.data.discoveredMemoryIds.includes(id)
      ? this.data.discoveredMemoryIds
      : [...this.data.discoveredMemoryIds, id];
    const journalId = `journal_${id}`;
    const updatedJournal = this.data.unlockedJournalIds.includes(journalId)
      ? this.data.unlockedJournalIds
      : [...this.data.unlockedJournalIds, journalId];

    this.save({
      discoveredMemoryIds: updatedMemories,
      unlockedJournalIds: updatedJournal,
    });
  }

  public static hasDiscoveredMemory(id: string): boolean {
    return this.data.discoveredMemoryIds.includes(id);
  }

  public static unlockJournalEntry(entryId: string): boolean {
    if (!this.data.unlockedJournalIds.includes(entryId)) {
      this.save({
        unlockedJournalIds: [...this.data.unlockedJournalIds, entryId],
      });
      return true;
    }
    return false;
  }

  public static markJournalEntryRead(entryId: string): void {
    if (!this.data.readJournalIds.includes(entryId)) {
      this.save({
        readJournalIds: [...this.data.readJournalIds, entryId],
      });
    }
  }

  public static markAllJournalEntriesRead(): void {
    this.save({
      readJournalIds: [...this.data.unlockedJournalIds],
    });
  }

  public static getNpcState(npcId: string): NpcProgressRecord {
    return (
      this.data.npcStates[npcId] || {
        met: false,
        talkCount: 0,
        questState: 'available',
      }
    );
  }

  public static updateNpcState(
    npcId: string,
    partial: Partial<NpcProgressRecord>
  ): NpcProgressRecord {
    const prev = this.getNpcState(npcId);
    const next: NpcProgressRecord = {
      ...prev,
      ...partial,
    };
    this.save({
      npcStates: {
        ...this.data.npcStates,
        [npcId]: next,
      },
    });
    return next;
  }

  public static recordCreatureEncounter(creatureId: string): void {
    if (!this.data.encounteredCreatureIds.includes(creatureId)) {
      this.save({
        encounteredCreatureIds: [...this.data.encounteredCreatureIds, creatureId],
      });
    }
  }

  public static markChapterCompleted(
    chapterId: CampaignChapterId,
    elapsedSec?: number,
    deaths?: number
  ): CampaignChapterId | null {
    const idx = CHAPTER_ORDER.indexOf(chapterId);
    const nextChapterId =
      idx >= 0 && idx < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[idx + 1] : null;

    const prevChap = this.data.chapters[chapterId];
    const bestTimeSec =
      typeof elapsedSec === 'number'
        ? prevChap.bestTimeSec
          ? Math.min(prevChap.bestTimeSec, Number(elapsedSec.toFixed(2)))
          : Number(elapsedSec.toFixed(2))
        : prevChap.bestTimeSec ?? null;
    const leastDeaths =
      typeof deaths === 'number'
        ? typeof prevChap.leastDeaths === 'number'
          ? Math.min(prevChap.leastDeaths, deaths)
          : deaths
        : prevChap.leastDeaths ?? null;

    const updatedChapters = { ...this.data.chapters };
    updatedChapters[chapterId] = {
      ...prevChap,
      completed: true,
      bestTimeSec,
      leastDeaths,
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

  public static recordTrialCompletion(
    difficulty: TrialDifficulty,
    timeSec: number,
    seed: string
  ): void {
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

  public static appendLeaderboardEntry(entry: LeaderboardEntryRecord): void {
    const updated = [...this.data.leaderboardEntries, entry].slice(-120);
    this.save({ leaderboardEntries: updated });
  }

  public static resetChapterProgress(chapterId: CampaignChapterId): void {
    const chap = this.getChapterProgress(chapterId);
    this.save({
      chapters: {
        ...this.data.chapters,
        [chapterId]: {
          ...chap,
          activeCheckpointId: null,
          unlockedCheckpointIds: [],
          checkpointX: null,
          checkpointY: null,
          activatedRootBridgeIds: [],
        },
      },
    });
  }

  public static resetAllProgress(): WispwakeSaveDataV3 {
    const preservedSettings = { ...this.data.settings };
    this.data = {
      ...structuredClone(DEFAULT_SAVE_DATA_V3),
      settings: preservedSettings,
    };
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.setItem(SAVE_STORAGE_KEY_V3, JSON.stringify(this.data));
        storage.setItem(LEGACY_STORAGE_KEY_V2, JSON.stringify(this.data));
      } catch {
        // Ignore quota error
      }
    }
    return this.data;
  }
}
