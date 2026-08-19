// Gerador de Áudio com Web Audio API nativa (sem dependências externas)
// Síntese de ondas binaurais, ruídos de foco e notificações de conclusão

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private isAmbientPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'suspended') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Sino de conclusão de bloco Pomodoro (Sino Zen Tibetano Harmônico)
  playChime(type: 'work_complete' | 'break_complete' = 'work_complete') {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const freqs = type === 'work_complete' ? [528, 792, 1056] : [440, 660, 880];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {
      console.warn('Falha ao reproduzir áudio com Web Audio API:', e);
    }
  }

  // Iniciar Áudio Ambiente Sintetizado (Binaural, Chuva, Ruído Branco, Lo-Fi Pink)
  startAmbient(preset: 'binaural' | 'rain' | 'whitenoise' | 'pinknoise' | 'waves', volume = 0.3) {
    this.stopAmbient();
    try {
      const ctx = this.getContext();
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(volume, ctx.currentTime);
      this.ambientGain.connect(ctx.destination);

      if (preset === 'binaural') {
        // Ondas Gama 40Hz (Foco e Cognição Intensa)
        // Canal esquerdo: 200Hz, Canal direito: 240Hz
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.value = 200;

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.value = 240;

        const gainL = ctx.createGain();
        gainL.gain.value = 0.2;
        const gainR = ctx.createGain();
        gainR.gain.value = 0.2;

        oscL.connect(gainL);
        oscR.connect(gainR);

        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);

        merger.connect(this.ambientGain);

        oscL.start();
        oscR.start();

        this.ambientSource = merger;
        this.isAmbientPlaying = true;
      } else if (preset === 'whitenoise' || preset === 'rain' || preset === 'pinknoise') {
        // Buffer de ruído síntese estocástica de 5 segundos em loop
        const bufferSize = ctx.sampleRate * 5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (preset === 'pinknoise') {
            // Filtro Pink Noise (-3dB/oitava)
            data[i] = (lastOut * 0.95) + (white * 0.05);
            lastOut = data[i];
          } else if (preset === 'rain') {
            // Chuva: Ruído filtrado passa-baixa modulado
            data[i] = (lastOut * 0.85) + (white * 0.15);
            lastOut = data[i];
          } else {
            // Ruído Branco puro
            data[i] = white * 0.15;
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Filtro Passa Baixa para criar ambiência aconchegante
        const filter = ctx.createBiquadFilter();
        filter.type = preset === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = preset === 'rain' ? 800 : 1200;

        source.connect(filter);
        filter.connect(this.ambientGain);
        source.start();

        this.noiseNode = source;
        this.ambientSource = filter;
        this.isAmbientPlaying = true;
      } else {
        // Ondas Alpha 10Hz
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 136.1; // Frequência relaxante

        const mod = ctx.createOscillator();
        mod.type = 'sine';
        mod.frequency.value = 0.15; // Pulso lento de onda oceânica

        const modGain = ctx.createGain();
        modGain.gain.value = 0.1;

        mod.connect(modGain.gain);
        osc.connect(this.ambientGain);

        osc.start();
        mod.start();
        this.ambientSource = osc;
        this.isAmbientPlaying = true;
      }
    } catch (e) {
      console.warn('Erro ao inicializar som ambiente:', e);
    }
  }

  setAmbientVolume(vol: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  stopAmbient() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch (e) {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.ambientSource) {
      try { (this.ambientSource as any).stop?.(); } catch (e) {}
      this.ambientSource.disconnect();
      this.ambientSource = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
    this.isAmbientPlaying = false;
  }
}

export const soundManager = new AudioEngine();

export type SoundEffectType = 
  | 'message' 
  | 'message_send' 
  | 'message_receive' 
  | 'mention'
  | 'notification'
  | 'join' 
  | 'join_voice' 
  | 'leave' 
  | 'leave_voice' 
  | 'mute' 
  | 'unmute'
  | 'switch_channel'
  | 'select_channel';

let sharedSoundCtx: AudioContext | null = null;

function getSharedSoundCtx(): AudioContext | null {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedSoundCtx) {
      sharedSoundCtx = new AudioCtxClass();
    }
    if (sharedSoundCtx.state === 'suspended') {
      sharedSoundCtx.resume().catch(() => {});
    }
    return sharedSoundCtx;
  } catch {
    return null;
  }
}

export const playSound = (type: SoundEffectType) => {
  try {
    const ctx = getSharedSoundCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'mention' || type === 'notification') {
      // Som Harmônico de Alerta / Menção Quântica (Duplo Ping Brilhante)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'message' || type === 'message_receive') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'message_send') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'join' || type === 'join_voice') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'leave' || type === 'leave_voice') {
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'switch_channel' || type === 'select_channel') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) {
    // Silently ignore browser audio autoplay restrictions
  }
};

