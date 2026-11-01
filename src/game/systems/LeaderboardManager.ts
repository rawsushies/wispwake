import { CampaignChapterId, StoryDifficulty, TrialDifficulty } from '../config/gameConfig';
import { LeaderboardEntryRecord, SaveManager } from './SaveManager';

export interface LeaderboardFilter {
  mode: 'all' | 'story_chapter' | 'wake_trial';
  targetId: 'all' | CampaignChapterId | 'wake_trial';
  difficulty: 'all' | StoryDifficulty | TrialDifficulty;
}

export interface LeaderboardProvider {
  readonly id: 'local' | 'global';
  readonly label: string;
  isConfigured(): boolean;
  getEntries(filter: LeaderboardFilter): Promise<LeaderboardEntryRecord[]>;
}

/**
 * Deterministic score calculation for Wispwake runs:
 * Higher difficulty and faster completion with fewer hazard respawns yield higher resonance scores.
 */
export function calculateRunScore(
  mode: 'story_chapter' | 'wake_trial',
  difficulty: StoryDifficulty | TrialDifficulty,
  completionTimeSec: number,
  deaths: number
): number {
  const diffMult: Record<StoryDifficulty | TrialDifficulty, number> = {
    easy: 1.0,
    medium: 1.25,
    hard: 1.55,
    extreme: 1.9,
  };
  const base = mode === 'story_chapter' ? 12000 : 8000;
  const parTime = mode === 'story_chapter' ? 180 : 55;
  const timeDelta = Math.max(0, completionTimeSec - parTime * 0.35);
  const raw = Math.max(1200, base - timeDelta * 28 - deaths * 450);
  return Math.round(raw * (diffMult[difficulty] || 1.0));
}

/**
 * Sorts leaderboard entries deterministically:
 * 1. Fastest completionTimeSec (ascending)
 * 2. Fewest deaths (ascending)
 * 3. Highest score (descending)
 * 4. Earliest dateIso (ascending)
 */
export function sortLeaderboardEntries(
  entries: LeaderboardEntryRecord[]
): LeaderboardEntryRecord[] {
  return [...entries].sort((a, b) => {
    if (Math.abs(a.completionTimeSec - b.completionTimeSec) > 0.005) {
      return a.completionTimeSec - b.completionTimeSec;
    }
    if (a.deaths !== b.deaths) {
      return a.deaths - b.deaths;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.dateIso.localeCompare(b.dateIso);
  });
}

class LocalLeaderboardProviderImpl implements LeaderboardProvider {
  public readonly id = 'local' as const;
  public readonly label = 'LOCAL RECORDS';

  public isConfigured(): boolean {
    return true;
  }

  public async getEntries(filter: LeaderboardFilter): Promise<LeaderboardEntryRecord[]> {
    const all = SaveManager.get().leaderboardEntries;
    const filtered = all.filter((e) => {
      if (filter.mode !== 'all' && e.mode !== filter.mode) return false;
      if (filter.targetId !== 'all' && e.targetId !== filter.targetId) return false;
      if (filter.difficulty !== 'all' && e.difficulty !== filter.difficulty) return false;
      return true;
    });
    return sortLeaderboardEntries(filtered);
  }
}

class GlobalLeaderboardProviderImpl implements LeaderboardProvider {
  public readonly id = 'global' as const;
  public readonly label = 'GLOBAL LEADERBOARD';

  public isConfigured(): boolean {
    return Boolean(import.meta.env.VITE_WISPWAKE_GLOBAL_LEADERBOARD_URL);
  }

  public async getEntries(_filter: LeaderboardFilter): Promise<LeaderboardEntryRecord[]> {
    // Never fabricates fake online players; returns empty when no backend endpoint is configured
    return [];
  }
}

export class LeaderboardManager {
  public static readonly localProvider: LeaderboardProvider = new LocalLeaderboardProviderImpl();
  public static readonly globalProvider: LeaderboardProvider = new GlobalLeaderboardProviderImpl();

  public static recordCompletedRun(params: {
    mode: 'story_chapter' | 'wake_trial';
    targetId: CampaignChapterId | 'wake_trial';
    difficulty: StoryDifficulty | TrialDifficulty;
    seed: string | null;
    completionTimeSec: number;
    deaths: number;
  }): LeaderboardEntryRecord {
    const saved = SaveManager.get();
    const cleanTime = Number(Math.max(0.1, params.completionTimeSec).toFixed(2));
    const cleanDeaths = Math.max(0, Math.floor(params.deaths));
    const score = calculateRunScore(params.mode, params.difficulty, cleanTime, cleanDeaths);

    const entry: LeaderboardEntryRecord = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      playerName: saved.playerDisplayName || 'Nima',
      mode: params.mode,
      targetId: params.targetId,
      difficulty: params.difficulty,
      seed: params.seed,
      completionTimeSec: cleanTime,
      deaths: cleanDeaths,
      score,
      dateIso: new Date().toISOString(),
    };

    SaveManager.appendLeaderboardEntry(entry);
    return entry;
  }

  public static getFilteredLocalEntries(filter: LeaderboardFilter): LeaderboardEntryRecord[] {
    const all = SaveManager.get().leaderboardEntries;
    const filtered = all.filter((e) => {
      if (filter.mode !== 'all' && e.mode !== filter.mode) return false;
      if (filter.targetId !== 'all' && e.targetId !== filter.targetId) return false;
      if (filter.difficulty !== 'all' && e.difficulty !== filter.difficulty) return false;
      return true;
    });
    return sortLeaderboardEntries(filtered);
  }
}
