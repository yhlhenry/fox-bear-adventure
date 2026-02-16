// ===== 生產者系統 =====
const ProducerSystem = {
  producerStates: {}, // producerId -> { bufferUsed, cooldownStart, usesLeft, gridIndex }
  autoTimers: {},

  init(savedProducers, unlockedList) {
    // Initialize states for all unlocked producers
    for (const pid of (unlockedList || ['adventure_pack'])) {
      const def = PRODUCERS[pid];
      if (!def) continue;
      if (savedProducers && savedProducers[pid]) {
        this.producerStates[pid] = { ...savedProducers[pid] };
      } else {
        this.producerStates[pid] = {
          bufferUsed: 0,
          cooldownStart: 0,
          usesLeft: def.type === 'consumable' ? (def.maxUses || 20) : -1,
          gridIndex: -1,
        };
      }
    }
    // Start auto-producers
    this._startAutoProducers();
  },

  placeProducerOnGrid(producerId) {
    const def = PRODUCERS[producerId];
    if (!def) return false;
    const emptyIdx = Grid.findEmptyCell();
    if (emptyIdx < 0) return false;

    const item = GameItem.createProducer(producerId);
    Grid.setItemByIndex(emptyIdx, item);

    if (!this.producerStates[producerId]) {
      this.producerStates[producerId] = {
        bufferUsed: 0,
        cooldownStart: 0,
        usesLeft: def.type === 'consumable' ? (def.maxUses || 20) : -1,
        gridIndex: emptyIdx,
      };
    } else {
      this.producerStates[producerId].gridIndex = emptyIdx;
    }
    return true;
  },

  // Tap on a producer to produce an item
  tapProduce(producerId) {
    const def = PRODUCERS[producerId];
    const state = this.producerStates[producerId];
    if (!def || !state) return null;

    // Check type-specific conditions
    if (def.type === 'energy') {
      if (!Energy.canAfford(def.energyCost)) {
        UI.showToast('能量不足！');
        return null;
      }
    }

    if (def.type === 'consumable') {
      if (state.usesLeft <= 0) {
        UI.showToast('已耗盡！');
        return null;
      }
    }

    // Check buffer
    if (state.bufferUsed >= def.buffer) {
      // Check cooldown
      if (state.cooldownStart > 0) {
        const elapsed = Date.now() - state.cooldownStart;
        if (elapsed < def.cooldownMs) {
          const remaining = Math.ceil((def.cooldownMs - elapsed) / 60000);
          UI.showToast(`冷卻中...還需 ${remaining} 分鐘`);
          return null;
        }
      }
      // Reset buffer
      state.bufferUsed = 0;
      state.cooldownStart = 0;
    }

    // Find empty cell near producer
    const { row, col } = Grid.getRowCol(state.gridIndex);
    const emptyIdx = Grid.findEmptyCellNear(row, col);
    if (emptyIdx < 0) {
      UI.showToast('沒有空格了！');
      return null;
    }

    // Consume energy
    if (def.type === 'energy') {
      Energy.consume(def.energyCost);
    }

    // Reduce uses
    if (def.type === 'consumable') {
      state.usesLeft--;
    }

    // Roll drop table
    const drop = this._rollDrop(def.dropTable);
    const item = new GameItem(drop.chainId, drop.level);
    Grid.setItemByIndex(emptyIdx, item);

    state.bufferUsed++;
    if (state.bufferUsed >= def.buffer) {
      state.cooldownStart = Date.now();
    }

    // Update stats
    if (typeof Game !== 'undefined' && Game.state) {
      Game.state.stats.totalProduced++;
    }

    return { item, index: emptyIdx };
  },

  _rollDrop(dropTable) {
    const totalWeight = dropTable.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const drop of dropTable) {
      roll -= drop.weight;
      if (roll <= 0) return { chainId: drop.chainId, level: drop.level };
    }
    return dropTable[0];
  },

  // Auto-producer logic
  _startAutoProducers() {
    for (const [pid, state] of Object.entries(this.producerStates)) {
      const def = PRODUCERS[pid];
      if (!def || def.type !== 'auto') continue;
      this._startAutoTimer(pid, def);
    }
  },

  _startAutoTimer(pid, def) {
    if (this.autoTimers[pid]) clearInterval(this.autoTimers[pid]);
    this.autoTimers[pid] = setInterval(() => {
      const state = this.producerStates[pid];
      if (!state || state.gridIndex < 0) return;
      if (state.bufferUsed >= def.buffer) {
        if (state.cooldownStart === 0) state.cooldownStart = Date.now();
        const elapsed = Date.now() - state.cooldownStart;
        if (elapsed < def.cooldownMs) return;
        state.bufferUsed = 0;
        state.cooldownStart = 0;
      }
      const { row, col } = Grid.getRowCol(state.gridIndex);
      const emptyIdx = Grid.findEmptyCellNear(row, col);
      if (emptyIdx < 0) return;

      const drop = this._rollDrop(def.dropTable);
      const item = new GameItem(drop.chainId, drop.level);
      Grid.setItemByIndex(emptyIdx, item);
      state.bufferUsed++;
      if (state.bufferUsed >= def.buffer) {
        state.cooldownStart = Date.now();
      }
      if (typeof Game !== 'undefined' && Game.state) {
        Game.state.stats.totalProduced++;
      }
    }, def.autoIntervalMs || 60000);
  },

  getBufferInfo(producerId) {
    const def = PRODUCERS[producerId];
    const state = this.producerStates[producerId];
    if (!def || !state) return null;
    const remaining = def.buffer - state.bufferUsed;
    let cooldownRemaining = 0;
    if (state.bufferUsed >= def.buffer && state.cooldownStart > 0) {
      cooldownRemaining = Math.max(0, def.cooldownMs - (Date.now() - state.cooldownStart));
    }
    return { remaining, total: def.buffer, cooldownRemaining };
  },

  // Reset cooldown (for hourglass)
  resetCooldown(producerId) {
    const state = this.producerStates[producerId];
    if (state) {
      state.bufferUsed = 0;
      state.cooldownStart = 0;
    }
  },

  serialize() {
    return { ...this.producerStates };
  },

  destroy() {
    for (const timer of Object.values(this.autoTimers)) {
      clearInterval(timer);
    }
    this.autoTimers = {};
  },
};
