// ===== UI 管理 =====
const UI = {
  orderPanelOpen: false,
  inventoryOpen: false,
  shopOpen: false,
  collectionOpen: false,
  buildingOpen: false,

  init() {
    this._bindButtons();
  },

  _bindButtons() {
    // Bottom bar buttons
    document.getElementById('btn-orders').onclick = () => this.toggleOrderPanel();
    document.getElementById('btn-build').onclick = () => this.toggleBuildingView();
    document.getElementById('btn-inventory').onclick = () => this.toggleInventory();
    document.getElementById('btn-shop').onclick = () => this.toggleShop();
    document.getElementById('btn-collection').onclick = () => this.toggleCollection();

    // Building back button
    document.getElementById('btn-back-grid').onclick = () => this.toggleBuildingView();

    // Shop close
    document.getElementById('btn-close-shop').onclick = () => this.toggleShop();

    // Collection close
    document.getElementById('btn-close-collection').onclick = () => this.toggleCollection();
  },

  toggleOrderPanel() {
    this.orderPanelOpen = !this.orderPanelOpen;
    const panel = document.getElementById('order-panel');
    panel.classList.toggle('hidden', !this.orderPanelOpen);
    document.getElementById('btn-orders').classList.toggle('active', this.orderPanelOpen);

    if (this.orderPanelOpen) {
      OrderSystem.checkFulfillment();
    }
    AudioSystem.playClick();
  },

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    document.getElementById('inventory-drawer').classList.toggle('hidden', !this.inventoryOpen);
    document.getElementById('btn-inventory').classList.toggle('active', this.inventoryOpen);

    if (this.inventoryOpen) {
      Inventory.render();
    }
    AudioSystem.playClick();
  },

  toggleBuildingView() {
    this.buildingOpen = !this.buildingOpen;
    document.getElementById('btn-build').classList.toggle('active', this.buildingOpen);

    if (this.buildingOpen) {
      BuildingSystem.show();
    } else {
      BuildingSystem.hide();
    }
    AudioSystem.playClick();
  },

  toggleShop() {
    this.shopOpen = !this.shopOpen;
    document.getElementById('shop-overlay').classList.toggle('hidden', !this.shopOpen);
    document.getElementById('btn-shop').classList.toggle('active', this.shopOpen);

    if (this.shopOpen) {
      this._renderShop();
    }
    AudioSystem.playClick();
  },

  toggleCollection() {
    this.collectionOpen = !this.collectionOpen;
    document.getElementById('collection-overlay').classList.toggle('hidden', !this.collectionOpen);
    document.getElementById('btn-collection').classList.toggle('active', this.collectionOpen);

    if (this.collectionOpen) {
      this._renderCollection();
    }
    AudioSystem.playClick();
  },

  _renderShop() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';

    for (const item of SHOP_ITEMS) {
      const el = document.createElement('div');
      el.className = 'shop-item';

      const info = document.createElement('div');
      info.className = 'shop-item-info';
      info.innerHTML = `<div>${item.emoji} ${item.name}</div><div style="color:#888;font-size:7px;">${item.description}</div>`;
      el.appendChild(info);

      const btn = document.createElement('button');
      btn.className = 'shop-buy-btn';

      switch (item.type) {
        case 'free_daily': {
          const today = new Date().toDateString();
          const claimed = Game.state.shop.lastDailyClaimDate === today;
          btn.textContent = claimed ? '已領取' : '免費領取';
          btn.className += claimed ? '' : ' free';
          btn.disabled = claimed;
          btn.onclick = () => {
            Energy.add(item.amount);
            Game.state.shop.lastDailyClaimDate = today;
            UI.showToast(`領取 ${item.amount} ⚡ 能量！`);
            this._renderShop();
            SaveSystem.save(Game.getState());
          };
          break;
        }
        case 'gem_buy':
          btn.textContent = `💎 ${item.gemCost}`;
          btn.disabled = Economy.gems < item.gemCost;
          btn.onclick = () => {
            if (Economy.spendGems(item.gemCost)) {
              if (item.id.startsWith('energy')) {
                Energy.add(item.amount);
              } else if (item.id.startsWith('scissors')) {
                Game.state.specialItems.scissors += item.amount;
                SpecialItems.counts.scissors += item.amount;
              } else if (item.id.startsWith('wildcard')) {
                Game.state.specialItems.wildcard += item.amount;
                SpecialItems.counts.wildcard += item.amount;
              } else if (item.id.startsWith('hourglass')) {
                Game.state.specialItems.hourglass += item.amount;
                SpecialItems.counts.hourglass += item.amount;
              }
              UI.showToast(`購買成功！`);
              this._renderShop();
              SaveSystem.save(Game.getState());
            }
          };
          break;
        case 'gem_expand':
          const cost = Inventory.getExpandCost();
          btn.textContent = `💎 ${cost}`;
          btn.disabled = Economy.gems < cost;
          btn.onclick = () => {
            if (Inventory.expand()) {
              this._renderShop();
              SaveSystem.save(Game.getState());
            }
          };
          break;
      }

      el.appendChild(btn);
      container.appendChild(el);
    }
  },

  _renderCollection() {
    const container = document.getElementById('collection-content');
    container.innerHTML = '';

    const collection = Game.state.collection || {};
    let totalDiscovered = 0;
    let totalItems = 0;

    for (const [chainId, chain] of Object.entries(CHAINS)) {
      const chainEl = document.createElement('div');
      chainEl.className = 'collection-chain';

      const nameEl = document.createElement('div');
      nameEl.className = 'collection-chain-name';

      const discovered = collection[chainId] || {};
      const chainDiscovered = Object.keys(discovered).length;
      totalDiscovered += chainDiscovered;
      totalItems += chain.items.length;

      nameEl.textContent = `${chain.name} (${chainDiscovered}/${chain.items.length})`;
      chainEl.appendChild(nameEl);

      const itemsEl = document.createElement('div');
      itemsEl.className = 'collection-items';

      for (const itemDef of chain.items) {
        const el = document.createElement('div');
        el.className = 'collection-item';
        if (discovered[itemDef.level]) {
          el.textContent = itemDef.emoji;
          el.title = `${itemDef.name} Lv${itemDef.level}`;
        } else {
          el.classList.add('undiscovered');
          el.title = '???';
        }
        itemsEl.appendChild(el);
      }

      chainEl.appendChild(itemsEl);
      container.appendChild(chainEl);
    }

    // Summary at top
    const summary = document.createElement('div');
    summary.style.cssText = 'font-size:8px;margin-bottom:12px;color:#fbbf24;';
    summary.textContent = `圖鑑完成度：${totalDiscovered}/${totalItems}`;
    container.insertBefore(summary, container.firstChild);
  },

  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  },
};
