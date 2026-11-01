import Phaser from 'phaser';
import { ActiveDialogueBubble, CampaignChapterId } from '../config/gameConfig';
import { CAMPAIGN_DIALOGUE_ENTRIES, DialogueEntry } from '../dialogue/dialogueData';
import { SaveManager } from './SaveManager';
import { StoryJournalManager } from './StoryJournalManager';

/**
 * DialogueManager & World-Anchored Pip Speech Bubble (Milestone 6 — Section 16):
 * - Renders Pip's speech bubble directly inside the Phaser game world (`Container` at depth 34)
 *   anchored above Pip (`pip.x, pip.y - 42`) so it follows Pip naturally through camera movement,
 *   jumps, falls, and portrait/landscape viewport changes.
 * - Automatically shifts horizontally and flips below/beside if Pip approaches viewport edges
 *   so the bubble is never clipped off-screen on narrow portrait phones or desktop monitors.
 * - Includes a directional tail pointing toward Pip, smooth fade in/out, interactive Skip button,
 *   and respects the `subtitlesEnabled` setting.
 */
export class DialogueManager {
  private readonly scene: Phaser.Scene;
  private chapterId: CampaignChapterId | 'wake_trial';

  private currentEntry: DialogueEntry | null = null;
  private remainingTime = 0;
  private sessionTriggeredIds = new Set<string>();

  private lingerNearDormantTimer = 0;
  private helperCooldownTimer = 0;

  // Phaser World-Anchored Speech Bubble UI
  private bubbleContainer!: Phaser.GameObjects.Container;
  private bubbleBg!: Phaser.GameObjects.Graphics;
  private speakerLabel!: Phaser.GameObjects.Text;
  private skipLabel!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private bubbleAlpha = 0;
  private lastRenderedText = '';

  constructor(scene: Phaser.Scene, chapterId: CampaignChapterId | 'wake_trial') {
    this.scene = scene;
    this.chapterId = chapterId;
    this.createWorldAnchoredBubble();
  }

  private createWorldAnchoredBubble(): void {
    this.bubbleContainer = this.scene.add.container(0, 0);
    this.bubbleContainer.setDepth(34);
    this.bubbleContainer.setAlpha(0);
    this.bubbleContainer.setVisible(false);

    this.bubbleBg = this.scene.add.graphics();

    this.speakerLabel = this.scene.add.text(0, 0, 'PIP · COMPANION', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#8FE7C7',
    });

    this.skipLabel = this.scene.add.text(0, 0, 'Skip ×', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '9px',
      color: '#A7B8AE',
    });
    this.skipLabel.setInteractive({ useHandCursor: true });
    this.skipLabel.on('pointerdown', () => {
      this.dismissCurrent();
    });

    this.bodyText = this.scene.add.text(0, 0, '', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '11.5px',
      color: '#E6EFEA',
      lineSpacing: 3,
      wordWrap: { width: 220, useAdvancedWrap: true },
    });

    this.bubbleContainer.add([this.bubbleBg, this.speakerLabel, this.skipLabel, this.bodyText]);
  }

  private layoutBubbleGeometry(text: string, tailOffsetX: number, tailBelow: boolean): void {
    const viewW = this.scene.cameras.main.width || 960;
    const maxWrapW = Math.min(236, Math.max(175, viewW - 56));

    if (this.lastRenderedText !== text) {
      this.bodyText.setWordWrapWidth(maxWrapW, true);
      this.bodyText.setText(`“${text}”`);
      this.lastRenderedText = text;
    }

    const padX = 11;
    const padY = 8;
    const headerH = 14;
    const contentW = Math.max(150, Math.min(maxWrapW, this.bodyText.width));
    const boxW = contentW + padX * 2;
    const boxH = headerH + this.bodyText.height + padY * 2;

    const left = -boxW * 0.5;
    const top = tailBelow ? -boxH - 10 : 10;

    this.speakerLabel.setPosition(left + padX, top + padY);
    this.skipLabel.setPosition(left + boxW - padX - this.skipLabel.width, top + padY);
    this.bodyText.setPosition(left + padX, top + padY + headerH);

    this.bubbleBg.clear();
    // Soft outer drop shadow
    this.bubbleBg.fillStyle(0x090e17, 0.55);
    this.bubbleBg.fillRoundedRect(left + 2, top + 3, boxW, boxH, 9);

    // Main translucent Night Ink card with Wake Mint border
    this.bubbleBg.fillStyle(0x121b2b, 0.93);
    this.bubbleBg.lineStyle(1.4, 0x8fe7c7, 0.72);
    this.bubbleBg.fillRoundedRect(left, top, boxW, boxH, 9);
    this.bubbleBg.strokeRoundedRect(left, top, boxW, boxH, 9);

    // Directional tail pointing toward Pip
    const clampedTailX = Phaser.Math.Clamp(tailOffsetX, -boxW * 0.36, boxW * 0.36);
    this.bubbleBg.fillStyle(0x121b2b, 0.93);
    this.bubbleBg.lineStyle(1.4, 0x8fe7c7, 0.72);
    this.bubbleBg.beginPath();
    if (tailBelow) {
      this.bubbleBg.moveTo(clampedTailX - 6, top + boxH - 1);
      this.bubbleBg.lineTo(clampedTailX, top + boxH + 7);
      this.bubbleBg.lineTo(clampedTailX + 6, top + boxH - 1);
    } else {
      this.bubbleBg.moveTo(clampedTailX - 6, top + 1);
      this.bubbleBg.lineTo(clampedTailX, top - 7);
      this.bubbleBg.lineTo(clampedTailX + 6, top + 1);
    }
    this.bubbleBg.closePath();
    this.bubbleBg.fillPath();
    this.bubbleBg.strokePath();
  }

  public setChapter(chapterId: CampaignChapterId | 'wake_trial'): void {
    this.chapterId = chapterId;
    this.currentEntry = null;
    this.remainingTime = 0;
    this.lingerNearDormantTimer = 0;
    if (this.bubbleContainer) {
      this.bubbleContainer.setVisible(false);
      this.bubbleAlpha = 0;
    }
  }

  public dismissCurrent(): void {
    this.currentEntry = null;
    this.remainingTime = 0;
  }

  public triggerById(dialogueId: string): void {
    const match = CAMPAIGN_DIALOGUE_ENTRIES.find((d) => d.id === dialogueId);
    if (match) {
      this.sessionTriggeredIds.add(match.id);
      if (match.oncePerSave) {
        SaveManager.markDialogueSeen(match.id);
      }
      if (match.journalEntryId) {
        StoryJournalManager.unlockEntry(match.journalEntryId);
      }
      if (!SaveManager.get().settings.subtitlesEnabled) return;
      this.currentEntry = match;
      this.remainingTime = match.durationSec;
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
    if (entry.oncePerSave && SaveManager.hasSeenDialogue(entry.id)) {
      return;
    }
    if (this.sessionTriggeredIds.has(entry.id) && entry.oncePerSave) {
      return;
    }

    if (
      this.currentEntry &&
      this.currentEntry.priority > entry.priority &&
      this.remainingTime > 0.5
    ) {
      return;
    }

    this.sessionTriggeredIds.add(entry.id);
    if (entry.oncePerSave) {
      SaveManager.markDialogueSeen(entry.id);
    }
    if (entry.journalEntryId) {
      StoryJournalManager.unlockEntry(entry.journalEntryId);
    }

    if (!SaveManager.get().settings.subtitlesEnabled) return;

    this.currentEntry = entry;
    this.remainingTime = entry.durationSec;
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
      if (
        this.lingerNearDormantTimer >= 7.5 &&
        this.helperCooldownTimer <= 0 &&
        !this.currentEntry
      ) {
        this.triggerEvent('puzzle_struggle');
        this.lingerNearDormantTimer = 0;
        this.helperCooldownTimer = 24.0;
      }
    } else {
      this.lingerNearDormantTimer = Math.max(0, this.lingerNearDormantTimer - dt * 0.5);
    }

    const subtitlesOn = SaveManager.get().settings.subtitlesEnabled;
    const isActive = Boolean(this.currentEntry && subtitlesOn);

    // Smooth fade in/out for world-anchored bubble
    const targetAlpha = isActive
      ? this.remainingTime < 0.35
        ? Math.max(0, this.remainingTime / 0.35)
        : 1
      : 0;
    this.bubbleAlpha = Phaser.Math.Linear(this.bubbleAlpha, targetAlpha, Math.min(1, dt * 12));

    if (!isActive && this.bubbleAlpha < 0.03) {
      this.bubbleContainer.setVisible(false);
      return null;
    }

    const cam = this.scene.cameras.main;
    const viewW = cam.width || 960;
    const viewH = cam.height || 540;

    // Anchor bubble in world space above Pip, clamped safely inside the current camera viewport
    const rawAnchorX = pipX;
    const rawAnchorY = pipY - 22;

    const marginX = Math.min(132, viewW * 0.36);
    const minWorldX = cam.scrollX + marginX;
    const maxWorldX = cam.scrollX + viewW - marginX;
    const clampedWorldX = Phaser.Math.Clamp(rawAnchorX, minWorldX, maxWorldX);

    // Flip bubble below Pip if Pip is very close to the top of the camera viewport
    const topScreenMargin = 92;
    const placeAbove = rawAnchorY - cam.scrollY > topScreenMargin;
    const clampedWorldY = Phaser.Math.Clamp(
      placeAbove ? rawAnchorY : pipY + 24,
      cam.scrollY + (placeAbove ? topScreenMargin : 28),
      cam.scrollY + viewH - 48
    );

    const activeText = this.currentEntry?.text || this.lastRenderedText;
    const tailOffset = Phaser.Math.Clamp(rawAnchorX - clampedWorldX, -80, 80);

    this.layoutBubbleGeometry(activeText, tailOffset, placeAbove);
    this.bubbleContainer.setPosition(clampedWorldX, clampedWorldY);
    this.bubbleContainer.setAlpha(this.bubbleAlpha);
    this.bubbleContainer.setVisible(true);

    if (!this.currentEntry || !subtitlesOn) {
      return null;
    }

    return {
      id: this.currentEntry.id,
      speaker: 'Pip',
      text: this.currentEntry.text,
      worldX: Math.round(clampedWorldX),
      worldY: Math.round(clampedWorldY),
      screenX: Math.round(clampedWorldX - cam.scrollX),
      screenY: Math.round(clampedWorldY - cam.scrollY),
    };
  }
}
