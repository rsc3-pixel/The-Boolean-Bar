/**
 * @module audioCues
 * @description Tons sintetizados via Web Audio API — zero assets externos.
 * O AudioContext é criado de forma lazy (ao primeiro uso) para não quebrar SSR
 * e respeitar a política de autoplay dos browsers (exige gesto do usuário).
 */

/**
 * Gerencia os efeitos sonoros do jogo usando a Web Audio API.
 * Todos os sons são gerados por síntese de osciladores — nenhum arquivo de áudio é carregado.
 * 
 * NOTA SOBRE POLÍTICA DE USER GESTURE:
 * Browsers modernos (Chrome, Safari, etc.) impedem que áudio seja reproduzido
 * automaticamente sem uma interação prévia do usuário (clique, toque, etc.).
 * O método `resume()` deve ser invocado em um evento disparado pelo usuário
 * para garantir que o AudioContext saia do estado 'suspended'.
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

  /** Som de eliminação: tom grave descendente dramático. */
  eliminate() {
    this.tone({ freq: 400, duration: 0.15, type: "sawtooth", volume: 0.25, sweepTo: 100 });
    this.tone({ freq: 100, duration: 0.5, type: "sine", volume: 0.2, delayMs: 150, sweepTo: 40 });
  }

  /** Fanfarra de vitória: 3 tons ascendentes rápidos. */
  victory() {
    this.tone({ freq: 523, duration: 0.15, type: "triangle", volume: 0.2 });
    this.tone({ freq: 659, duration: 0.15, type: "triangle", volume: 0.2, delayMs: 150 });
    this.tone({ freq: 784, duration: 0.3, type: "triangle", volume: 0.25, delayMs: 300 });
  }

  /** Som de dúvida dramática: acorde dissonante tenso. */
  dramaticDoubt() {
    this.tone({ freq: 200, duration: 0.3, type: "sawtooth", volume: 0.18 });
    this.tone({ freq: 250, duration: 0.3, type: "sawtooth", volume: 0.15 });
    this.tone({ freq: 150, duration: 0.4, type: "sawtooth", volume: 0.12, delayMs: 100 });
  }

  /**
   * Som de cilindro girando (sequência de ticks rápidos).
   */
  rouletteSpin() {
    const ctx = this.getCtx();
    if (!ctx) return;
    for (let i = 0; i < 15; i++) {
      this.tone({ 
        freq: 1200 - (i * 40), 
        duration: 0.03, 
        type: "square", 
        volume: 0.1, 
        delayMs: i * 60 
      });
    }
  }

  /**
   * Som de clique metálico seco (sobreviveu).
   */
  rouletteClick() {
    this.tone({ freq: 150, duration: 0.05, type: "square", volume: 0.4 });
    this.tone({ freq: 80, duration: 0.08, type: "sine", volume: 0.3, delayMs: 10 });
  }

  /**
   * Som de bang de revólver (morreu).
   * Ruído sintetizado + explosão de graves.
   */
  rouletteBang() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const start = ctx.currentTime;
    
    // Explosão inicial (ruído branco filtrado)
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(1200, start);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, start + 0.4);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(start);

    // Corpo do tiro (grave impactante)
    this.tone({ freq: 100, duration: 0.5, type: "sawtooth", volume: 0.5, sweepTo: 20 });
    this.tone({ freq: 40, duration: 0.8, type: "sine", volume: 0.8, delayMs: 20 });
  }
}

/** Instância global de AudioCues, pronta para uso em qualquer componente. */
export const audioCues = new AudioCues();
