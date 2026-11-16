class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  playSelect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playPlace() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Warm wooden tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playMove() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(175, now + 0.1);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCapture() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low drum thud
    const low = ctx.createOscillator();
    const lowGain = ctx.createGain();
    low.type = 'sine';
    low.frequency.setValueAtTime(170, now);
    low.frequency.exponentialRampToValueAtTime(62, now + 0.22);
    lowGain.gain.setValueAtTime(0.28, now);
    lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    low.connect(lowGain);
    lowGain.connect(ctx.destination);
    low.start(now);
    low.stop(now + 0.25);

    // Brass chime accent
    const brass = ctx.createOscillator();
    const brassGain = ctx.createGain();
    brass.type = 'triangle';
    brass.frequency.setValueAtTime(587.33, now + 0.03);
    brass.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    brassGain.gain.setValueAtTime(0.12, now + 0.03);
    brassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    brass.connect(brassGain);
    brassGain.connect(ctx.destination);
    brass.start(now + 0.03);
    brass.stop(now + 0.26);
  }

  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.09;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  }
}

export const soundFx = new SoundEffects();
