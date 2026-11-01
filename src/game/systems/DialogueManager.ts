import Phaser from 'phaser';
import { ActiveDialogueBubble, CampaignChapterId } from '../config/gameConfig';
import { CAMPAIGN_DIALOGUE_ENTRIES, DialogueEntry } from '../dialogue/dialogueData';
import { SaveManager } from './SaveManager';

/**
 * DialogueManager & CompanionHelperSystem (Milestone 5 — Sections 07 & 17):
 * - Evaluates zone-based story narration, Memory Echo lore revelations, and contextual helper hints for Pip.
 * - Tracks once-per-save dialogue IDs in `SaveManager` so Pip never repeats the same story lines on re-entry.
 * - Detects when a player lingers near a dormant flower/root bridge for >7.5 seconds without pulsing Wake,
 *   allowing Pip to offer a gentle, non-intrusive reminder with a 24s cooldown.
 * - Projects Pip's world position to 960x540 logical screen coordinates so the React HUD can render an
 *   elegant world-matched speech bubble directly above Pip without obscuring Nima.
 */
export class DialogueManager {
  private readonly scene: Phaser.Scene;
  private chapterId: CampaignChapterId | 'wake_trial';

  private currentEntry: DialogueEntry | null = null;
  private remainingTime = 0;
  private sessionTriggeredIds = new Set<string>();

  private lingerNearDormantTimer = 0;
  private helperCooldownTimer = 0;

  constructor(scene: Phaser.Scene, chapterId: CampaignChapterId | 'wake_trial') {
    this.scene = scene;
    this.chapterId = chapterId;
  }

  public setChapter(chapterId: CampaignChapterId | 'wake_trial'): void {
    this.chapterId = chapterId;
    this.currentEntry = null;
    this.remainingTime = 0;
    this.lingerNearDormantTimer = 0;
  }

  public dismissCurrent(): void {
    this.currentEntry = null;
    this.remainingTime = 0;
  }

  public triggerById(dialogueId: string): void {
    if (!SaveManager.get().settings.subtitlesEnabled) return;
    const match = CAMPAIGN_DIALOGUE_ENTRIES.find((d) => d.id === dialogueId);
    if (match) {
      this.currentEntry = match;
      this.remainingTime = match.durationSec;
      this.sessionTriggeredIds.add(match.id);
      if (match.oncePerSave) {
        SaveManager.markDialogueSeen(match.id);
      }
    }
  }

  public triggerEvent(
    eventKey: NonNullable<DialogueEntry['eventKey']>,
    customText?: string
  ): void {
    if (!SaveManager.get().settings.subtitlesEnabled) return;

    if (customText) {
      this.currentEntry = {
        id: `custom_${Date.now()}`,
        chapterId: 'any',
        triggerType: 'event',
        eventKey,
        text: customText,
        priority: 3,
        durationSec: 4.8,
        oncePerSave: false,
      };
      this.remainingTime = 4.8;
      return;
    }

    const match = CAMPAIGN_DIALOGUE_ENTRIES.find(
      (d) =>
        d.triggerType === 'event' &&
        d.eventKey === eventKey &&
        (d.chapterId === 'any' || d.chapterId === this.chapterId)
    );

    if (match) {
      this.activateDialogue(match);
    }
  }

  private activateDialogue(entry: DialogueEntry): void {
    if (!SaveManager.get().settings.subtitlesEnabled) return;

    if (entry.oncePerSave && SaveManager.hasSeenDialogue(entry.id)) {
      return;
    }
    if (this.sessionTriggeredIds.has(entry.id) && entry.oncePerSave) {
      return;
    }

    if (this.currentEntry && this.currentEntry.priority > entry.priority && this.remainingTime > 0.5) {
      return;
    }

    this.currentEntry = entry;
    this.remainingTime = entry.durationSec;
    this.sessionTriggeredIds.add(entry.id);

    if (entry.oncePerSave) {
      SaveManager.markDialogueSeen(entry.id);
    }
  }

  public notifyWakeUsed(): void {
    this.lingerNearDormantTimer = 0;
  }

  public update(
    dt: number,
    playerX: number,
    pipX: number,
    pipY: number,
    hasNearbyDormantInteractable: boolean
  ): ActiveDialogueBubble | null {
    if (this.helperCooldownTimer > 0) {
      this.helperCooldownTimer = Math.max(0, this.helperCooldownTimer - dt);
    }

    if (this.remainingTime > 0) {
      this.remainingTime -= dt;
      if (this.remainingTime <= 0) {
        this.currentEntry = null;
      }
    }

    // 1. Check Zone-Based Story Triggers (Campaign Chapters only)
    if (this.chapterId !== 'wake_trial') {
      for (const entry of CAMPAIGN_DIALOGUE_ENTRIES) {
        if (
          entry.triggerType === 'zone_x' &&
          entry.chapterId === this.chapterId &&
          entry.minX !== undefined &&
          entry.maxX !== undefined &&
          playerX >= entry.minX &&
          playerX <= entry.maxX
        ) {
          this.activateDialogue(entry);
        }
      }
    }

    // 2. Check Contextual Helper Hint if player lingers near a dormant target without using Wake
    if (hasNearbyDormantInteractable) {
      this.lingerNearDormantTimer += dt;
      if (this.lingerNearDormantTimer >= 7.5 && this.helperCooldownTimer <= 0 && !this.currentEntry) {
        this.triggerEvent('puzzle_struggle');
        this.lingerNearDormantTimer = 0;
        this.helperCooldownTimer = 24.0;
      }
    } else {
      this.lingerNearDormantTimer = Math.max(0, this.lingerNearDormantTimer - dt * 0.5);
    }

    if (!this.currentEntry || !SaveManager.get().settings.subtitlesEnabled) {
      return null;
    }

    const cam = this.scene.cameras.main;
    const screenX = Phaser.Math.Clamp(pipX - cam.scrollX, 140, 820);
    const screenY = Phaser.Math.Clamp(pipY - cam.scrollY - 38, 56, 420);

    return {
      id: this.currentEntry.id,
      speaker: 'Pip',
      text: this.currentEntry.text,
      worldX: Math.round(pipX),
      worldY: Math.round(pipY),
      screenX: Math.round(screenX),
      screenY: Math.round(screenY),
    };
  }
}
