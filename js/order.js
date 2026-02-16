// ===== 訂單系統 =====
const OrderSystem = {
  orders: [], // [{items: [{chainId, level, fulfilled}], reward: {coins, stars}, difficulty}]
  _refreshTimer: null,

  init(savedOrders, activeProducers) {
    if (savedOrders && savedOrders.length > 0) {
      this.orders = savedOrders;
    } else {
      this._generateInitialOrders(activeProducers);
    }
    this._startRefreshTimer();
    this.renderOrders();
  },

  _generateInitialOrders(activeProducers) {
    this.orders = [];
    const difficulties = ['easy', 'medium', 'hard'];
    for (let i = 0; i < CONFIG.ORDER_SLOTS; i++) {
      this.orders.push(this._generateOrder(difficulties[i], activeProducers));
    }
  },

  _generateOrder(difficulty, activeProducers) {
    const producers = activeProducers || Game.state.activeProducers || ['adventure_pack'];
    // Pick from active producers' chains
    const chains = producers.map(pid => PRODUCERS[pid]?.chainId).filter(Boolean);
    if (chains.length === 0) chains.push('adventure');

    const randomChain = chains[Math.floor(Math.random() * chains.length)];

    let itemCount, maxLevel, coinReward, starReward;
    switch (difficulty) {
      case 'easy':
        itemCount = 1;
        maxLevel = 2;
        coinReward = 5;
        starReward = 1;
        break;
      case 'medium':
        itemCount = 2;
        maxLevel = 3;
        coinReward = 15;
        starReward = 2;
        break;
      case 'hard':
        itemCount = 3;
        maxLevel = 4;
        coinReward = 30;
        starReward = 4;
        break;
      default:
        itemCount = 1;
        maxLevel = 2;
        coinReward = 5;
        starReward = 1;
    }

    const items = [];
    for (let i = 0; i < itemCount; i++) {
      const level = Math.floor(Math.random() * maxLevel) + 1;
      const chain = chains[Math.floor(Math.random() * chains.length)];
      items.push({ chainId: chain, level, fulfilled: false });
    }

    return {
      items,
      reward: { coins: coinReward, stars: starReward },
      difficulty,
    };
  },

  _startRefreshTimer() {
    // Periodically check for expired/stale orders
    this._refreshTimer = setInterval(() => {
      // Replace completed slots
      for (let i = 0; i < this.orders.length; i++) {
        if (!this.orders[i]) {
          const difficulties = ['easy', 'medium', 'hard'];
          this.orders[i] = this._generateOrder(
            difficulties[i] || 'easy',
            Game.state.activeProducers
          );
        }
      }
      this.renderOrders();
    }, CONFIG.ORDER_REFRESH_INTERVAL);
  },

  // Check if items on the grid can fulfill order requirements
  checkFulfillment() {
    for (const order of this.orders) {
      if (!order) continue;
      for (const req of order.items) {
        req.fulfilled = false;
      }
    }

    // Scan grid for matching items
    for (const order of this.orders) {
      if (!order) continue;
      const usedIndices = new Set();

      for (const req of order.items) {
        for (let i = 0; i < Grid.cells.length; i++) {
          if (usedIndices.has(i)) continue;
          const item = Grid.cells[i];
          if (!item || item.isProducer || item.state === 'locked') continue;
          if (item.chainId === req.chainId && item.level >= req.level) {
            req.fulfilled = true;
            usedIndices.add(i);
            break;
          }
        }
      }
    }

    this.renderOrders();
  },

  // Complete an order (remove items from grid)
  completeOrder(orderIndex) {
    const order = this.orders[orderIndex];
    if (!order) return false;

    // Verify all fulfilled
    if (!order.items.every(req => req.fulfilled)) return false;

    // Remove items from grid
    for (const req of order.items) {
      for (let i = 0; i < Grid.cells.length; i++) {
        const item = Grid.cells[i];
        if (!item || item.isProducer) continue;
        if (item.chainId === req.chainId && item.level >= req.level) {
          Grid.removeItemByIndex(i);
          break;
        }
      }
    }

    // Give rewards
    Economy.addCoins(order.reward.coins);
    Economy.addStars(order.reward.stars);
    Game.state.stats.totalOrders++;

    UI.showToast(`訂單完成！+${order.reward.coins}🪙 +${order.reward.stars}⭐`);
    AudioSystem.playOrderComplete();

    // Replace order after delay
    const difficulty = order.difficulty;
    this.orders[orderIndex] = null;
    setTimeout(() => {
      this.orders[orderIndex] = this._generateOrder(difficulty, Game.state.activeProducers);
      this.renderOrders();
    }, 2000);

    this.renderOrders();
    SaveSystem.save(Game.getState());
    return true;
  },

  // Auto-order: triggered when high-level item is merged
  checkAutoOrder(chainId, level) {
    if (level < 5) return; // Only for high-level items
    // Check if there's already an auto-order for this
    // For now, just give bonus coins
    const bonus = level * 5;
    Economy.addCoins(bonus);
    UI.showToast(`高級合成獎勵！+${bonus}🪙`);
  },

  renderOrders() {
    const container = document.getElementById('order-slots');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < this.orders.length; i++) {
      const order = this.orders[i];
      if (!order) continue;

      const slot = document.createElement('div');
      slot.className = 'order-slot';

      const diffLabel = { easy: '簡單', medium: '中等', hard: '困難' }[order.difficulty] || '';
      const diffEl = document.createElement('div');
      diffEl.className = 'order-difficulty';
      diffEl.textContent = diffLabel;
      slot.appendChild(diffEl);

      const itemsEl = document.createElement('div');
      itemsEl.className = 'order-items';
      for (const req of order.items) {
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item' + (req.fulfilled ? ' fulfilled' : '');
        const chain = CHAINS[req.chainId];
        const info = chain?.items[req.level - 1];
        itemEl.textContent = info ? info.emoji : '?';
        itemEl.title = info ? `${info.name} Lv${req.level}` : '';
        itemsEl.appendChild(itemEl);
      }
      slot.appendChild(itemsEl);

      const rewardEl = document.createElement('div');
      rewardEl.className = 'order-reward';
      rewardEl.textContent = `🪙${order.reward.coins} ⭐${order.reward.stars}`;
      slot.appendChild(rewardEl);

      const allFulfilled = order.items.every(r => r.fulfilled);
      const btn = document.createElement('button');
      btn.className = 'order-complete-btn' + (allFulfilled ? ' ready' : '');
      btn.textContent = '完成訂單';
      btn.onclick = () => this.completeOrder(i);
      slot.appendChild(btn);

      container.appendChild(slot);
    }
  },

  serialize() {
    return this.orders.map(o => o ? { ...o } : null);
  },

  destroy() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  },
};
