// ===== 存檔系統 =====
const SaveSystem = {
  SAVE_KEY: 'fox_bear_adventure_save',

  defaultState() {
    return {
      version: 1,
      grid: [], // [{chainId, level} | null] for each cell
      energy: { current: CONFIG.ENERGY_MAX, lastRegenTime: Date.now() },
      economy: { coins: 0, gems: 10, stars: 0 },
      producers: {}, // producerId -> { bufferUsed, cooldownStart, usesLeft, onGrid: bool, gridPos }
      unlockedProducers: ['adventure_pack'], // first one unlocked
      activeProducers: ['adventure_pack'],
      retiredProducers: [],
      orders: [], // [{items: [{chainId, level, fulfilled}], reward: {coins, stars}, difficulty}]
      inventory: { slots: CONFIG.INVENTORY_INITIAL_SLOTS, items: [] },
      buildings: {}, // areaId -> { taskId: completed }
      unlockedAreas: ['treehouse'],
      cobwebs: [...INITIAL_COBWEBS], // remaining locked cells
      collection: {}, // chainId -> [level: bool]
      tutorial: { completed: false, step: 0 },
      dialogue: { seen: {} }, // dialogueId -> bool
      shop: { lastDailyClaimDate: null },
      specialItems: { scissors: 0, wildcard: 0, hourglass: 0 },
      stats: { totalMerges: 0, totalOrders: 0, totalProduced: 0 },
      events: {
        bingo: null,
        season: null,
      },
      timestamp: Date.now(),
    };
  },

  save(state) {
    try {
      state.timestamp = Date.now();
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  },

  load() {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Merge with defaults so new fields are present
        const defaults = this.defaultState();
        return this._deepMerge(defaults, parsed);
      }
    } catch (e) {
      console.warn('Load failed:', e);
    }
    return null;
  },

  clear() {
    localStorage.removeItem(this.SAVE_KEY);
  },

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },

  // Auto-save timer
  _interval: null,
  startAutoSave(getState) {
    this._interval = setInterval(() => {
      this.save(getState());
    }, CONFIG.SAVE_INTERVAL);
  },

  stopAutoSave() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },
};
