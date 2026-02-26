// ============================================================
//  SoundManager — sonidos sintetizados con Web Audio API
//  Sin archivos externos. ctx se crea al primer sonido
//  (requiere gesto de usuario previo, que ya tenemos).
// ============================================================

export class SoundManager {
  constructor() {
    this._ctx = null;
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  /** Sonido de daño al jugador: golpe grave + distorsión breve */
  playHurt() {
    try {
      const ctx   = this._getCtx();
      const now   = ctx.currentTime;
      const gain  = ctx.createGain();
      gain.connect(ctx.destination);

      // Tono bajo que cae rápido
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.28);

      // Crujido de ruido encima
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noiseGain.connect(ctx.destination);
      const noise = this._makeNoise(ctx, 0.12);
      noise.connect(noiseGain);
      noise.start(now);
      noise.stop(now + 0.12);
    } catch (_) {}
  }

  /** Sonido de romper bloque: clic + ruido sordo */
  playBreak() {
    try {
      const ctx  = this._getCtx();
      const now  = ctx.currentTime;

      // Impacto percusivo (tono medio)
      const osc  = ctx.createOscillator();
      osc.type   = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);

      // Ruido de polvo breve
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.25, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      ng.connect(ctx.destination);
      const noise = this._makeNoise(ctx, 0.08);
      noise.connect(ng);
      noise.start(now);
      noise.stop(now + 0.08);
    } catch (_) {}
  }

  /** Crea un nodo de ruido blanco con la duración indicada */
  _makeNoise(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const length     = Math.ceil(sampleRate * duration);
    const buffer     = ctx.createBuffer(1, length, sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }
}
