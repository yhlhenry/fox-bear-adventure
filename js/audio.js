// ===== 音效系統 (Web Audio API 8-bit) =====
const AudioSystem = {
  ctx: null,
  enabled: true,
  bgmPlaying: false,
  bgmGain: null,

  init() {
    // Create audio context on first user interaction
    document.addEventListener('pointerdown', () => this._ensureContext(), { once: true });
  },

  _ensureContext() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.1;
      this.bgmGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioContext not supported');
      this.enabled = false;
    }
  },

  _playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  },

  _playNotes(notes, baseTime) {
    if (!this.ctx || !this.enabled) return;
    const t = baseTime || this.ctx.currentTime;
    for (const [freq, start, dur, type, vol] of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.1, t + start);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + start);
      osc.stop(t + start + dur);
    }
  },

  playMerge(level) {
    // Ascending tone based on level
    const baseFreq = 300 + level * 80;
    this._playTone(baseFreq, 0.12, 'square', 0.12);
    setTimeout(() => this._playTone(baseFreq * 1.25, 0.12, 'square', 0.1), 60);
    setTimeout(() => this._playTone(baseFreq * 1.5, 0.15, 'triangle', 0.08), 120);
  },

  playProduce() {
    this._playNotes([
      [440, 0, 0.08, 'square', 0.1],
      [550, 0.06, 0.08, 'square', 0.08],
    ]);
  },

  playMove() {
    this._playTone(200, 0.05, 'triangle', 0.08);
  },

  playSell() {
    this._playNotes([
      [600, 0, 0.08, 'triangle', 0.1],
      [800, 0.08, 0.1, 'triangle', 0.08],
    ]);
  },

  playOrderComplete() {
    this._playNotes([
      [523, 0, 0.12, 'square', 0.12],
      [659, 0.1, 0.12, 'square', 0.1],
      [784, 0.2, 0.2, 'triangle', 0.1],
    ]);
  },

  playBuild() {
    this._playNotes([
      [330, 0, 0.1, 'square', 0.1],
      [440, 0.1, 0.1, 'square', 0.1],
      [550, 0.2, 0.15, 'triangle', 0.08],
    ]);
  },

  playSpecial() {
    this._playNotes([
      [880, 0, 0.1, 'sine', 0.12],
      [1100, 0.08, 0.1, 'sine', 0.1],
      [880, 0.16, 0.15, 'sine', 0.08],
    ]);
  },

  playClick() {
    this._playTone(400, 0.03, 'square', 0.05);
  },

  // Simple BGM loop
  startBGM() {
    if (!this.ctx || this.bgmPlaying || !this.enabled) return;
    this.bgmPlaying = true;
    this._playBGMLoop();
  },

  _playBGMLoop() {
    if (!this.bgmPlaying || !this.ctx) return;
    // Simple 8-bar melody loop
    const notes = [
      // freq, startTime (relative), duration, type, volume
      [262, 0, 0.3, 'triangle', 0.04],
      [330, 0.4, 0.3, 'triangle', 0.04],
      [392, 0.8, 0.3, 'triangle', 0.04],
      [330, 1.2, 0.3, 'triangle', 0.04],
      [294, 1.6, 0.3, 'triangle', 0.04],
      [349, 2.0, 0.3, 'triangle', 0.04],
      [392, 2.4, 0.6, 'triangle', 0.04],
      [262, 3.2, 0.3, 'triangle', 0.04],
      [349, 3.6, 0.3, 'triangle', 0.04],
      [330, 4.0, 0.3, 'triangle', 0.04],
      [294, 4.4, 0.3, 'triangle', 0.04],
      [262, 4.8, 0.6, 'triangle', 0.04],
    ];
    this._playNotes(notes);
    setTimeout(() => this._playBGMLoop(), 5600);
  },

  stopBGM() {
    this.bgmPlaying = false;
  },

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopBGM();
    return this.enabled;
  },
};
