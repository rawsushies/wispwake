import Phaser from 'phaser';
import {
  ActiveNpcDialogueState,
  CampaignChapterId,
  NearbyNpcPrompt,
} from '../config/gameConfig';
import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';
import { StoryJournalManager } from './StoryJournalManager';

export type NpcArchetypeId =
  | 'last_gardener'
  | 'tide_watcher'
  | 'rootkeeper'
  | 'bellkeeper';

export interface NpcPlacementSpec {
  id: string;
  archetype: NpcArchetypeId;
  name: string;
  title: string;
  x: number;
  y: number; // Supporting platform top Y
  characterJournalId: string;
  questJournalId: string;
  questTitle: string;
  greetingLines: string[];
  activeQuestLines: string[];
  completedQuestLines: string[];
}

interface NpcRuntime {
  spec: NpcPlacementSpec;
  sprite: Phaser.GameObjects.Sprite;
  promptContainer: Phaser.GameObjects.Container;
  promptBg: Phaser.GameObjects.Graphics;
  promptText: Phaser.GameObjects.Text;
  statusIcon: Phaser.GameObjects.Text;
  rowIdx: number;
  animPhase: number;
}

/**
 * NPCManager — Milestone 6 Section 12 (Friendly NPC System).
 *
 * Manages friendly Veilgrove dwellers across the 6-chapter campaign:
 * - Oakhaven · The Last Gardener (Chapter 01)
 * - Mirel · The Tide-Watcher (Chapter 02)
 * - Bram · The Rootkeeper (Chapter 03 & Chapter 06)
 * - Lyra · The Bellkeeper (Chapter 04 & Chapter 05)
 *
 * Uses a dedicated interaction input (`F` on keyboard, contextual `Speak` touch button on mobile,
 * or gamepad) so Wake (`E`/`X`) is never overloaded.
 */
export class NPCManager {
  private readonly scene: Phaser.Scene;
  private readonly npcs: NpcRuntime[] = [];
  private activeDialogueNpc: NpcRuntime | null = null;
  private activeLineIndex = 0;
  private activeLines: string[] = [];
  private nearbyNpc: NpcRuntime | null = null;

  constructor(
    scene: Phaser.Scene,
    _chapterId: CampaignChapterId | 'wake_trial',
    specs: NpcPlacementSpec[]
  ) {
    this.scene = scene;
    NPCManager.buildNpcAtlas(scene);

    for (const spec of specs) {
      const rowIdx = this.getRowIndexForArchetype(spec.archetype);
      const sprite = scene.add.sprite(spec.x, spec.y, 'npc_dwellers_sheet', rowIdx * 4);
      sprite.setOrigin(0.5, 1.0);
      sprite.setDepth(16.5);

      const promptContainer = scene.add.container(spec.x, spec.y - 98);
      promptContainer.setDepth(32);

      const promptBg = scene.add.graphics();
      const promptText = scene.add.text(0, 0, '[F] Speak', {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#F1C878',
      });
      promptText.setOrigin(0.5, 0.5);

      const statusIcon = scene.add.text(0, -18, '✦', {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#8FE7C7',
      });
      statusIcon.setOrigin(0.5, 0.5);

      promptContainer.add([promptBg, promptText, statusIcon]);

      this.npcs.push({
        spec,
        sprite,
        promptContainer,
        promptBg,
        promptText,
        statusIcon,
        rowIdx,
        animPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private getRowIndexForArchetype(archetype: NpcArchetypeId): number {
    switch (archetype) {
      case 'last_gardener':
        return 0;
      case 'tide_watcher':
        return 1;
      case 'rootkeeper':
        return 2;
      case 'bellkeeper':
        return 3;
    }
  }

  public static buildNpcAtlas(scene: Phaser.Scene): void {
    if (scene.textures.exists('npc_dwellers_sheet')) return;

    const fw = 84;
    const fh = 104;
    const cols = 4;
    const rows = 4;
    const canvasTex = scene.textures.createCanvas('npc_dwellers_sheet', fw * cols, fh * rows);
    if (!canvasTex) return;
    const ctx = canvasTex.getContext();

    const palettes: Array<{
      cloakTop: string;
      cloakBot: string;
      trim: string;
      tunic: string;
      staffGlow: string;
      hatStyle: 'hood' | 'reed' | 'fungal' | 'choir';
    }> = [
      // Row 0: Last Gardener (Moss green cloak, warm amber staff bud)
      {
        cloakTop: '#5E7E5B',
        cloakBot: '#354F3B',
        trim: '#F1C878',
        tunic: '#D9CEB8',
        staffGlow: '241, 200, 120',
        hatStyle: 'hood',
      },
      // Row 1: Tide-Watcher (Moonlit teal cloak, starlight cyan lantern)
      {
        cloakTop: '#3E7A82',
        cloakBot: '#1E434D',
        trim: '#8FE7C7',
        tunic: '#CFE5E0',
        staffGlow: '143, 231, 199',
        hatStyle: 'reed',
      },
      // Row 2: Rootkeeper (Cavern violet & bark mantle, spirit lilac tuning rod)
      {
        cloakTop: '#6A5B8E',
        cloakBot: '#382E54',
        trim: '#B7A2E8',
        tunic: '#D8D0E8',
        staffGlow: '183, 162, 232',
        hatStyle: 'fungal',
      },
      // Row 3: Bellkeeper (Choir bronze-gold & indigo vestments, golden tuning fork)
      {
        cloakTop: '#7C689B',
        cloakBot: '#2D2747',
        trim: '#F1C878',
        tunic: '#EFE3CA',
        staffGlow: '241, 200, 120',
        hatStyle: 'choir',
      },
    ];

    for (let row = 0; row < rows; row++) {
      const pal = palettes[row];
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const ox = col * fw;
        const oy = row * fh;
        const cx = ox + fw * 0.5;
        const groundY = oy + fh - 6;

        const isTalking = col >= 2;
        const breath = Math.sin((col / 2) * Math.PI);
        const bobY = isTalking ? (col % 2 === 0 ? -1.8 : 0.6) : breath * 1.2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(ox, oy, fw, fh);
        ctx.clip();
        ctx.translate(cx, groundY + bobY);

        // Ground shadow
        ctx.fillStyle = 'rgba(9, 14, 23, 0.38)';
        ctx.beginPath();
        ctx.ellipse(0, 1, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lantern / Staff Glow (strictly bounded inside cell)
        const staffX = 19;
        const staffTopY = -62 + (isTalking ? -2 : 0);
        const glow = ctx.createRadialGradient(staffX, staffTopY, 2, staffX, staffTopY, 20);
        glow.addColorStop(0, `rgba(${pal.staffGlow}, 0.78)`);
        glow.addColorStop(0.55, `rgba(${pal.staffGlow}, 0.25)`);
        glow.addColorStop(1, `rgba(${pal.staffGlow}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(staffX, staffTopY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Wooden / Bronze Staff
        ctx.strokeStyle = '#3B2F26';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(staffX, 0);
        ctx.lineTo(staffX, staffTopY + 4);
        ctx.stroke();

        // Staff Head Emblem
        ctx.fillStyle = pal.trim;
        ctx.strokeStyle = '#1D2D43';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (pal.hatStyle === 'choir') {
          // Tuning fork / bell emblem
          ctx.arc(staffX, staffTopY, 5.5, 0, Math.PI * 2);
        } else {
          ctx.ellipse(staffX, staffTopY, 5, 7, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // Lower Robe / Tunic
        ctx.fillStyle = pal.tunic;
        ctx.strokeStyle = '#1D2D43';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-13, -2);
        ctx.lineTo(-10, -38);
        ctx.lineTo(10, -38);
        ctx.lineTo(13, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Layered Botanical Cloak
        const cloakGrad = ctx.createLinearGradient(0, -64, 0, -6);
        cloakGrad.addColorStop(0, pal.cloakTop);
        cloakGrad.addColorStop(1, pal.cloakBot);
        ctx.fillStyle = cloakGrad;
        ctx.strokeStyle = '#182230';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-17, -6);
        ctx.quadraticCurveTo(-19, -36, -11, -56);
        ctx.lineTo(11, -56);
        ctx.quadraticCurveTo(18, -36, 15, -6);
        ctx.quadraticCurveTo(0, -2, -17, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Decorative Cloak Trim
        ctx.strokeStyle = pal.trim;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-13, -12);
        ctx.quadraticCurveTo(0, -8, 12, -12);
        ctx.stroke();

        // Head & Gentle Face
        ctx.fillStyle = '#E5BFA1';
        ctx.strokeStyle = '#1D2D43';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -63, 10.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes & Expressive Talking Gesture
        ctx.fillStyle = '#231B18';
        ctx.beginPath();
        ctx.arc(-3.5, -63, 1.4, 0, Math.PI * 2);
        ctx.arc(3.5, -63, 1.4, 0, Math.PI * 2);
        ctx.fill();

        if (isTalking) {
          ctx.fillStyle = '#8F5849';
          ctx.beginPath();
          ctx.ellipse(0, -58.5, 2.2, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Archetype Hat / Hood / Crest
        ctx.fillStyle = pal.cloakTop;
        ctx.strokeStyle = pal.trim;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (pal.hatStyle === 'reed') {
          ctx.moveTo(-16, -68);
          ctx.quadraticCurveTo(0, -84, 16, -68);
          ctx.closePath();
        } else if (pal.hatStyle === 'fungal') {
          ctx.ellipse(0, -72, 15, 6.5, 0, 0, Math.PI * 2);
        } else if (pal.hatStyle === 'choir') {
          ctx.moveTo(-12, -68);
          ctx.lineTo(0, -85);
          ctx.lineTo(12, -68);
          ctx.closePath();
        } else {
          ctx.arc(0, -66, 12, Math.PI, 0);
        }
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        canvasTex.add(idx, 0, ox, oy, fw, fh);
      }
    }

    canvasTex.refresh();
  }

  public notifyPlayerWorldProgress(): void {
    // Whenever Nima activates a Root Bridge, Checkpoint, or Resonance Bell, progress active quests
    for (const npc of this.npcs) {
      const st = SaveManager.getNpcState(npc.spec.id);
      if (st.met && st.questState === 'active') {
        SaveManager.updateNpcState(npc.spec.id, { questState: 'completed' });
        StoryJournalManager.unlockEntry(npc.spec.questJournalId);
      }
    }
  }

  public handleInteractInput(): boolean {
    if (this.activeDialogueNpc) {
      this.activeLineIndex++;
      AudioManager.playCheckpoint();
      if (this.activeLineIndex >= this.activeLines.length) {
        this.closeActiveDialogue();
      }
      return true;
    }

    if (this.nearbyNpc) {
      this.startConversation(this.nearbyNpc);
      return true;
    }

    return false;
  }

  public closeActiveDialogue(): void {
    this.activeDialogueNpc = null;
    this.activeLineIndex = 0;
    this.activeLines = [];
  }

  private startConversation(npc: NpcRuntime): void {
    const prev = SaveManager.getNpcState(npc.spec.id);
    StoryJournalManager.unlockEntry(npc.spec.characterJournalId);
    StoryJournalManager.unlockEntry(npc.spec.questJournalId);

    let lines = npc.spec.greetingLines;
    let nextQuestState = prev.questState;

    if (!prev.met || prev.questState === 'available') {
      lines = npc.spec.greetingLines;
      nextQuestState = 'active';
    } else if (prev.questState === 'completed') {
      lines = npc.spec.completedQuestLines;
    } else {
      lines = npc.spec.activeQuestLines;
      // Speaking a second time after exploring also fulfills their reflection
      if (prev.talkCount >= 1) {
        nextQuestState = 'completed';
      }
    }

    SaveManager.updateNpcState(npc.spec.id, {
      met: true,
      talkCount: prev.talkCount + 1,
      questState: nextQuestState,
    });

    this.activeDialogueNpc = npc;
    this.activeLines = lines;
    this.activeLineIndex = 0;
    AudioManager.playCheckpoint();
  }

  public update(
    dt: number,
    playerX: number,
    playerY: number
  ): {
    nearbyPrompt: NearbyNpcPrompt | null;
    activeDialogue: ActiveNpcDialogueState | null;
  } {
    let closest: NpcRuntime | null = null;
    let closestDist = 92;

    for (const npc of this.npcs) {
      npc.animPhase += dt * 3.2;
      const dist = Phaser.Math.Distance.Between(playerX, playerY, npc.spec.x, npc.spec.y - 36);

      // Face toward Nima when nearby
      if (Math.abs(playerX - npc.spec.x) > 8 && dist < 220) {
        npc.sprite.setFlipX(playerX < npc.spec.x);
      }

      const isSpeaking = this.activeDialogueNpc?.spec.id === npc.spec.id;
      const frameOffset = isSpeaking
        ? 2 + (Math.floor(npc.animPhase * 2.2) % 2)
        : Math.floor(npc.animPhase) % 2;
      npc.sprite.setFrame(npc.rowIdx * 4 + frameOffset);

      if (dist < closestDist) {
        closestDist = dist;
        closest = npc;
      }

      const st = SaveManager.getNpcState(npc.spec.id);
      const showPrompt = dist < 92 && !this.activeDialogueNpc;
      npc.promptContainer.setPosition(
        npc.spec.x,
        npc.spec.y - 96 + Math.sin(npc.animPhase) * 2.5
      );

      if (showPrompt) {
        const label = `[F] Speak · ${npc.spec.name}`;
        npc.promptText.setText(label);
        const w = npc.promptText.width + 18;
        const h = 22;
        npc.promptBg.clear();
        npc.promptBg.fillStyle(0x121b2b, 0.92);
        npc.promptBg.lineStyle(1.4, 0xf1c878, 0.85);
        npc.promptBg.fillRoundedRect(-w * 0.5, -h * 0.5, w, h, 6);
        npc.promptBg.strokeRoundedRect(-w * 0.5, -h * 0.5, w, h, 6);
        npc.promptText.setVisible(true);
        npc.statusIcon.setVisible(false);
        npc.promptContainer.setVisible(true);
      } else {
        npc.promptBg.clear();
        npc.promptText.setVisible(false);
        if (!this.activeDialogueNpc && dist < 340) {
          npc.statusIcon.setText(
            st.questState === 'completed' ? '✓' : st.met ? '◈' : '✦'
          );
          npc.statusIcon.setColor(
            st.questState === 'completed' ? '#F1C878' : '#8FE7C7'
          );
          npc.statusIcon.setVisible(true);
          npc.promptContainer.setVisible(true);
        } else {
          npc.promptContainer.setVisible(false);
        }
      }
    }

    this.nearbyNpc = closest;

    // Auto-close dialogue if player walks far away (> 165px)
    if (this.activeDialogueNpc) {
      const d = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        this.activeDialogueNpc.spec.x,
        this.activeDialogueNpc.spec.y - 36
      );
      if (d > 165) {
        this.closeActiveDialogue();
      }
    }

    const nearbyPrompt: NearbyNpcPrompt | null =
      this.nearbyNpc && !this.activeDialogueNpc
        ? {
            id: this.nearbyNpc.spec.id,
            name: this.nearbyNpc.spec.name,
            title: this.nearbyNpc.spec.title,
          }
        : null;

    const activeDialogue: ActiveNpcDialogueState | null = this.activeDialogueNpc
      ? {
          id: this.activeDialogueNpc.spec.id,
          speakerName: this.activeDialogueNpc.spec.name,
          speakerTitle: this.activeDialogueNpc.spec.title,
          line: this.activeLines[this.activeLineIndex] || '',
          lineIndex: this.activeLineIndex,
          totalLines: this.activeLines.length,
          questTitle: this.activeDialogueNpc.spec.questTitle,
          questStatus: SaveManager.getNpcState(this.activeDialogueNpc.spec.id).questState,
        }
      : null;

    return { nearbyPrompt, activeDialogue };
  }

  public destroy(): void {
    for (const npc of this.npcs) {
      npc.sprite.destroy();
      npc.promptContainer.destroy();
    }
  }
}
