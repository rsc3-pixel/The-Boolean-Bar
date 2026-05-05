/**
 * @module audioCues
 * @description Tons sintetizados via Web Audio API — zero assets externos.
 * O AudioContext é criado de forma lazy (ao primeiro uso) para não quebrar SSR
 * e respeitar a política de autoplay dos browsers (exige gesto do usuário).
 */

/**
 * Gerencia os efeitos sonoros do jogo usando a Web Audio API.
 * Todos os sons são gerados por síntese de osciladores — nenhum arquivo de áudio é carregado.
 */
class AudioCues {
  private ctx: AudioContext | null = null;
  private enabled = true;

  /**
   * Habilita ou desabilita todos os efeitos sonoros.
   * @param v - `true` para ativar, `false` para silenciar.
   */
  setEnabled(v: boolean) {
    this.enabled = v;
  }

  /**
   * Retorna o AudioContext ativo, criando-o na primeira chamada (lazy init).
   * Retorna `null` se o áudio estiver desabilitado ou se a API não for suportada.
   */
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

  /**
   * Retoma o AudioContext caso esteja suspenso (bloqueio de autoplay em alguns browsers).
   */
  async resume() {
    const ctx = this.getCtx();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
  }

  /**
   * Toca um tom sintetizado com as opções fornecidas.
   * Aplica fade-out exponencial no final para evitar clique auditivo.
   *
   * @param opts.freq      - Frequência inicial em Hz.
   * @param opts.duration  - Duração do tom em segundos.
   * @param opts.type      - Forma de onda do oscilador (padrão: "sine").
   * @param opts.volume    - Volume de pico (padrão: 0.2).
   * @param opts.delayMs   - Atraso antes do início em milissegundos.
   * @param opts.sweepTo   - Frequência final para criar efeito de glide (portamento).
   */
  private tone(opts: {
    freq: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    delayMs?: number;
    sweepTo?: number;
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
    gain.gain.exponentialRampToValueAtTime(0.001, start + opts.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + opts.duration + 0.05);
  }

  /**
   * Toca o som de "é a sua vez": dois beeps agudos em sequência.
   * Indica de forma positiva que o turno passou para o jogador.
   */
  yourTurn() {
    this.tone({ freq: 800, duration: 0.13, type: "sine", volume: 0.18 });
    this.tone({ freq: 1200, duration: 0.18, type: "sine", volume: 0.20, delayMs: 130 });
  }

  /**
   * Toca o som de aposta: tom médio com leve subida de frequência.
   * Indica confirmação positiva de uma aposta realizada.
   */
  bet() {
    this.tone({ freq: 440, duration: 0.18, type: "triangle", volume: 0.22, sweepTo: 660 });
  }

  /**
   * Toca o som de dúvida: tom grave dramático com descida de frequência.
   * Transmite a tensão do momento em que um jogador questiona a aposta do outro.
   */
  doubt() {
    this.tone({ freq: 320, duration: 0.22, type: "sawtooth", volume: 0.22, sweepTo: 180 });
    this.tone({ freq: 200, duration: 0.30, type: "sawtooth", volume: 0.18, delayMs: 100 });
  }

  /**
   * Toca um clique curto e neutro para ações genéricas (ex: jogar carta).
   */
  click() {
    this.tone({ freq: 600, duration: 0.08, type: "square", volume: 0.15 });
  }
}

/** Instância global de AudioCues, pronta para uso em qualquer componente. */
export const audioCues = new AudioCues();
