// Tons sintetizados via Web Audio API. Sem arquivos extras — bate em 0 KB de
// asset adicional e funciona em todos os browsers modernos.
// O AudioContext só é criado lazy (ao primeiro uso) pra não quebrar SSR e pra
// respeitar a política de autoplay (precisa user gesture pra começar).

class AudioCues {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (this.ctx) return this.ctx;
    try {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Resume o context (necessário em alguns browsers após autoplay block)
  async resume() {
    const ctx = this.getCtx();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
  }

  private tone(opts: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    delayMs?: number;
    sweepTo?: number; // glide de freq pra criar efeito de subida/descida
  }) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const start = ctx.currentTime + (opts.delayMs ?? 0) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, start + opts.duration);
    }
    gain.gain.setValueAtTime(opts.volume ?? 0.2, start);
    // Fade-out exponencial pra não dar "click" no fim
    gain.gain.exponentialRampToValueAtTime(0.001, start + opts.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + opts.duration + 0.05);
  }

  // Beep duplo agudo, atenção positiva — "é a sua vez!"
  yourTurn() {
    this.tone({ freq: 800, duration: 0.13, type: "sine", volume: 0.18 });
    this.tone({ freq: 1200, duration: 0.18, type: "sine", volume: 0.20, delayMs: 130 });
  }

  // Tom médio com leve subida — confirmação positiva de aposta
  bet() {
    this.tone({ freq: 440, duration: 0.18, type: "triangle", volume: 0.22, sweepTo: 660 });
  }

  // Tom grave dramático com descida — tensão da dúvida
  doubt() {
    this.tone({ freq: 320, duration: 0.22, type: "sawtooth", volume: 0.22, sweepTo: 180 });
    this.tone({ freq: 200, duration: 0.30, type: "sawtooth", volume: 0.18, delayMs: 100 });
  }

  // Click neutro (carta jogada / ação genérica)
  click() {
    this.tone({ freq: 600, duration: 0.08, type: "square", volume: 0.15 });
  }
}

export const audioCues = new AudioCues();
