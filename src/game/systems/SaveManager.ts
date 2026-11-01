import { AccessibilitySettings, DEFAULT_SETTINGS, LevelMode } from '../config/gameConfig';

const SAVE_STORAGE_KEY = 'wispwake_save_v1';

export interface WispwakeSaveData {
  schemaVersion: 1;
  levelMode: LevelMode;
  activeCheckpointId: string | null;
  checkpointX: number | null;
  checkpointY: number | null;
  activatedRootBridgeIds: string[];
  chapterCompleted: boolean;
  settings: AccessibilitySettings;
  customBackdrops: {
    farSkyDataUrl?: string;
    midRootsDataUrl?: string;
  };
}

const DEFAULT_SAVE_DATA: WispwakeSaveData = {
  schemaVersion: 1,
  levelMode: 'sleeping_canopy',
  activeCheckpointId: null,
  checkpointX: null,
  checkpointY: null,
  activatedRootBridgeIds: [],
  chapterCompleted: false,
  settings: { ...DEFAULT_SETTINGS },
  customBackdrops: {},
};

export class SaveManager {
  private static data: WispwakeSaveData = SaveManager.load();

  public static load(): WispwakeSaveData {
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) {
        return structuredClone(DEFAULT_SAVE_DATA);
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== 1) {
        return structuredClone(DEFAULT_SAVE_DATA);
      }
      return {
        ...structuredClone(DEFAULT_SAVE_DATA),
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings ?? {}),
        },
        customBackdrops: {
          ...(parsed.customBackdrops ?? {}),
        },
      };
    } catch {
      return structuredClone(DEFAULT_SAVE_DATA);
    }
  }

  public static get(): WispwakeSaveData {
    return this.data;
  }

  public static save(partial: Partial<WispwakeSaveData>): WispwakeSaveData {
    this.data = {
      ...this.data,
      ...partial,
    };
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore quota errors in private browsing or large data URLs
    }
    return this.data;
  }

  public static updateSettings(partial: Partial<AccessibilitySettings>): AccessibilitySettings {
    const updated = {
      ...this.data.settings,
      ...partial,
    };
    this.save({ settings: updated });
    return updated;
  }

  public static recordCheckpoint(id: string, x: number, y: number): void {
    this.save({
      activeCheckpointId: id,
      checkpointX: x,
      checkpointY: y,
    });
  }

  public static recordRootBridge(id: string): void {
    if (!this.data.activatedRootBridgeIds.includes(id)) {
      this.save({
        activatedRootBridgeIds: [...this.data.activatedRootBridgeIds, id],
      });
    }
  }

  public static markChapterCompleted(): void {
    this.save({ chapterCompleted: true });
  }

  public static resetProgress(): WispwakeSaveData {
    const preservedSettings = { ...this.data.settings };
    const preservedBackdrops = { ...this.data.customBackdrops };
    this.data = {
      ...structuredClone(DEFAULT_SAVE_DATA),
      settings: preservedSettings,
      customBackdrops: preservedBackdrops,
    };
    try {
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore storage error
    }
    return this.data;
  }
}
