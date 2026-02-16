// ===== 能量系統 =====
const Energy = {
  current: CONFIG.ENERGY_MAX,
  max: CONFIG.ENERGY_MAX,
  lastRegenTime: Date.now(),
  _regenInterval: null,

  init(savedEnergy) {
    if (savedEnergy) {
      this.current = savedEnergy.current;
      this.lastRegenTime = savedEnergy.lastRegenTime || Date.now();
      // Calculate offline regen
      this._applyOfflineRegen();
    }
    this._startRegen();
    this.updateUI();
  },

  _applyOfflineRegen() {
    const now = Date.now();
    const elapsed = now - this.lastRegenTime;
    const ticks = Math.floor(elapsed / CONFIG.ENERGY_REGEN_INTERVAL);
    if (ticks > 0) {
      this.current = Math.min(this.max, this.current + ticks * CONFIG.ENERGY_REGEN_AMOUNT);
      this.lastRegenTime = now;
    }
  },

  _startRegen() {
    this._regenInterval = setInterval(() => {
      if (this.current < this.max) {
        this.current = Math.min(this.max, this.current + CONFIG.ENERGY_REGEN_AMOUNT);
        this.lastRegenTime = Date.now();
        this.updateUI();
      }
    }, CONFIG.ENERGY_REGEN_INTERVAL);
  },

  consume(amount) {
    if (this.current < amount) return false;
    this.current -= amount;
    this.updateUI();
    return true;
  },

  add(amount) {
    this.current = Math.min(this.max, this.current + amount);
    this.updateUI();
  },

  canAfford(amount) {
    return this.current >= amount;
  },

  updateUI() {
    const fill = document.getElementById('energy-fill');
    const text = document.getElementById('energy-text');
    if (fill) fill.style.width = `${(this.current / this.max) * 100}%`;
    if (text) text.textContent = `⚡ ${this.current}/${this.max}`;
  },

  serialize() {
    return {
      current: this.current,
      lastRegenTime: this.lastRegenTime,
    };
  },

  destroy() {
    if (this._regenInterval) {
      clearInterval(this._regenInterval);
    }
  },
};
