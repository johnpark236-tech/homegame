// Zero-dependency Web Audio API synthesizer for adorable game sound effects
type BackgroundTrack = 'intro' | 'waiting' | 'gameplay' | 'results';

const BACKGROUND_TRACKS: Record<BackgroundTrack, string> = {
  intro: '/assets/audio/bgm-intro.wav',
  waiting: '/assets/audio/bgm-waiting.wav',
  gameplay: '/assets/audio/bgm-gameplay.wav',
  results: '/assets/audio/bgm-results.wav',
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgm: HTMLAudioElement | null = null;
  private bgmTrack: BackgroundTrack | null = null;
  private pendingTrack: BackgroundTrack | null = null;
  private bgmFadeTimer: number | null = null;
  private bgmVolume = 0.18;
  private unlockListenersAttached = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.playPendingBackground();
  }

  private attachUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const unlock = () => {
      this.init();
      if (this.pendingTrack) {
        this.playPendingBackground();
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }

  private clearBgmFade() {
    if (this.bgmFadeTimer && typeof window !== 'undefined') {
      window.clearInterval(this.bgmFadeTimer);
      this.bgmFadeTimer = null;
    }
  }

  private fadeVolume(target: number, durationMs = 450, onDone?: () => void) {
    if (!this.bgm || typeof window === 'undefined') {
      onDone?.();
      return;
    }

    this.clearBgmFade();
    const audio = this.bgm;
    const startVolume = audio.volume;
    const startTime = performance.now();

    this.bgmFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startTime) / durationMs);
      audio.volume = startVolume + (target - startVolume) * progress;

      if (progress >= 1) {
        this.clearBgmFade();
        onDone?.();
      }
    }, 32);
  }

  private playPendingBackground() {
    if (!this.pendingTrack || typeof window === 'undefined') return;
    const track = this.pendingTrack;
    this.pendingTrack = null;
    this.setBackground(track);
  }

  setBackground(track: BackgroundTrack) {
    try {
      if (this.bgmTrack === track && this.bgm && !this.bgm.paused) return;
      if (typeof window === 'undefined') return;
      this.attachUnlockListeners();

      const startTrack = () => {
        const audio = new Audio(BACKGROUND_TRACKS[track]);
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        audio.load();
        this.bgm = audio;
        this.bgmTrack = track;

        audio.play()
          .then(() => this.fadeVolume(this.bgmVolume, 650))
          .catch(() => {
            this.pendingTrack = track;
          });
      };

      if (this.bgm && !this.bgm.paused) {
        const previous = this.bgm;
        this.fadeVolume(0, 350, () => {
          previous.pause();
          previous.currentTime = 0;
          startTrack();
        });
      } else {
        startTrack();
      }
    } catch {
      this.pendingTrack = track;
    }
  }

  stopBackground() {
    this.clearBgmFade();
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
    this.bgm = null;
    this.bgmTrack = null;
  }

  // Button Click / Tap Pop
  playTap() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      // Randomize pitch slightly for fun rapid tapping feel
      const freq = 420 + Math.random() * 80;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Countdown Beep (3, 2, 1)
  playCountdown(val: number) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      const freq = val === 0 ? 880 : 520; // High pitch on GO (0)
      osc.type = val === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (val === 0 ? 0.4 : 0.2));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (val === 0 ? 0.45 : 0.22));
    } catch {}
  }

  // Right Answer Chime (Major Arpeggio)
  playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {}
  }

  // Wrong Answer Buzzer
  playWrong() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {}
  }

  // Winner Fanfare
  playVictory() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [
        [523.25, 659.25, 783.99], // C
        [587.33, 739.99, 880.00], // D
        [659.25, 830.61, 987.77], // E
        [1046.5, 1318.5, 1567.98], // C6 High
      ];

      chords.forEach((chord, step) => {
        const start = now + step * 0.16;
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + (step === 3 ? 0.6 : 0.2));

          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(start);
          osc.stop(start + (step === 3 ? 0.65 : 0.22));
        });
      });
    } catch {}
  }
}

export const sound = new SoundEngine();
