import { AccessibilitySettings } from '../config/gameConfig';
import { SaveManager } from './SaveManager';

/**
 * Procedural Web Audio synthesizer for Wispwake.
 * Follows Section 11.2 of the Visual Bible:
 * - Ambient orchestral/pad textures, restrained piano/chime tones, evolving restoration warmth.
 * - Distinct gameplay sounds for jump, land, Wake pulse, plant activation, root bridge, checkpoint, hazard, and restoration.
 * - Separate music and effects volume controls with zero external licensing issues.
 */
class AudioManagerService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientRunning = false;
  private isRestoredMood = false;
  private ambientTimer: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getSettings(): AccessibilitySettings {
    return SaveManager.get().settings;
  }

  private getEffectiveSfxGain(): number {
    const s = this.getSettings();
    return s.muted ? 0 : s.sfxVolume;
  }

  private getEffectiveMusicGain(): number {
    const s = this.getSettings();
    return s.muted ? 0 : s.musicVolume;
  }

  public startAmbience(restored = false): void {
    this.isRestoredMood = restored;
    const ctx = this.ensureContext();
    if (!ctx || this.isAmbientRunning) return;

    this.isAmbientRunning = true;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = this.getEffectiveMusicGain() * 0.18;
    this.ambientGain.connect(ctx.destination);

    // Schedule gentle generative piano/harp harmonics in the Veilgrove scale (D Dorian / Lydian warmth)
    const playAmbientNote = () => {
      if (!this.isAmbientRunning || !this.ctx || !this.ambientGain) return;
      const musicVol = this.getEffectiveMusicGain();
      this.ambientGain.gain.setTargetAtTime(musicVol * 0.18, this.ctx.currentTime, 0.3);

      if (musicVol <= 0.01) return;

      // Sleeping scale: cool, sparse D minor 9th; Restored scale: warm D major 9th / Lydian
      const sleepingFreqs = [146.83, 174.61, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
      const restoredFreqs = [146.83, 185.0, 220.0, 277.18, 293.66, 369.99, 440.0, 554.37, 587.33];
      const pool = this.isRestoredMood ? restoredFreqs : sleepingFreqs;
      const freq = pool[Math.floor(Math.random() * pool.length)];

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(freq * 0.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isRestoredMood ? 1200 : 680, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.22, now + 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.ambientGain);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 4.3);
      subOsc.stop(now + 4.3);
    };

    playAmbientNote();
    this.ambientTimer = window.setInterval(playAmbientNote, 2600);
  }

  public setRestoredMood(restored: boolean): void {
    this.isRestoredMood = restored;
  }

  public refreshVolumes(): void {
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.getEffectiveMusicGain() * 0.18, this.ctx.currentTime, 0.15);
    }
  }

  public stopAmbience(): void {
    this.isAmbientRunning = false;
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  public playJump(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playLand(intensity = 0.6): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.11);

    const amp = Math.min(1, Math.max(0.2, intensity)) * vol * 0.2;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playFootstep(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 + Math.random() * 25, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.045);

    gain.gain.setValueAtTime(vol * 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playWakePulse(hasTarget: boolean): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Soft breathy harmonic chord (Section 7.1: "feel like a breath, ripple, or resonance rather than an explosion")
    const baseFreqs = hasTarget ? [293.66, 440.0, 587.33, 739.99] : [293.66, 392.0, 440.0];

    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.96, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.45);

      const delay = idx * 0.035;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.11, now + delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.58);
    });
  }

  public playBloomOpen(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);

      gain.gain.setValueAtTime(0.0001, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(vol * 0.12, now + i * 0.055 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.45);
    });
  }

  public playRootExtend(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Warm woody resonance + ascending chime
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(92, now);
    woodOsc.frequency.linearRampToValueAtTime(146.83, now + 0.65);

    woodGain.gain.setValueAtTime(0.001, now);
    woodGain.gain.linearRampToValueAtTime(vol * 0.22, now + 0.1);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.78);

    this.playBloomOpen();
  }

  public playCheckpoint(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [369.99, 440, 587.33, 739.99];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.0001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(vol * 0.14, now + i * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.85);
    });
  }

  public playHazardRespawn(): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.28);

    gain.gain.setValueAtTime(vol * 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playGrandRestoration(): void {
    this.setRestoredMood(true);
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 554.37, 587.33, 739.99, 880.0, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const start = now + i * 0.11;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(vol * 0.16, start + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 2.5);
    });
  }
}

export const AudioManager = new AudioManagerService();
