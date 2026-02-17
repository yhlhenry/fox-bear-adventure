// ===== 庫存系統 =====
const Inventory = {
  slots: 0,
  items: [], // GameItem[]

  init(savedInventory) {
    if (savedInventory) {
      this.slots = savedInventory.slots || 0;
      this.items = (savedInventory.items || []).map(d => d ? GameItem.deserialize(d) : null);
    }
    // Pad items array to match slots
    while (this.items.length < this.slots) {
      this.items.push(null);
    }
    this.render();
  },

  getExpandCost() {
    const currentSlots = this.slots;
    return Math.floor(CONFIG.INVENTORY_EXPAND_BASE_COST *
      Math.pow(CONFIG.INVENTORY_EXPAND_MULTIPLIER, currentSlots / 7));
  },

  expand() {
    if (this.slots >= CONFIG.INVENTORY_MAX_SLOTS) {
      UI.showToast('倉庫已滿！');
      return false;
    }
    const cost = this.getExpandCost();
    if (!Economy.spendGems(cost)) {
      UI.showToast('寶石不足！');
      return false;
    }
    this.slots++;
    this.items.push(null);
    UI.showToast('倉庫擴充成功！');
    this.render();
    return true;
  },

  // Store an item from the grid
  storeItem(gridIndex) {
    const item = Grid.getItemByIndex(gridIndex);
    if (!item || item.isProducer) return false;

    const emptySlot = this.items.findIndex(i => i === null);
    if (emptySlot < 0) {
      UI.showToast('倉庫已滿！');
      return false;
    }

    Grid.removeItemByIndex(gridIndex);
    this.items[emptySlot] = item;
    this.render();
    return true;
  },

  // Retrieve an item back to the grid
  retrieveItem(slotIndex) {
    const item = this.items[slotIndex];
    if (!item) return false;

    const emptyGrid = Grid.findEmptyCell();
    if (emptyGrid < 0) {
      UI.showToast('棋盤沒有空位！');
      return false;
    }

    Grid.setItemByIndex(emptyGrid, item);
    this.items[slotIndex] = null;
    this.render();
    return true;
  },

  render() {
    const grid = document.getElementById('inventory-grid');
    const expandArea = document.getElementById('inventory-expand-area');
    if (!grid) return;

    grid.innerHTML = '';

    if (this.slots === 0) {
      const msg = document.createElement('div');
      msg.className = 'inventory-empty-msg';
      msg.textContent = '倉庫尚未開啟，點擊下方擴充！';
      msg.style.gridColumn = '1 / -1';
      grid.appendChild(msg);
    } else {
      for (let i = 0; i < this.slots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        const item = this.items[i];
        if (item) {
          slot.textContent = item.getEmoji();
          slot.title = `${item.getName()} Lv${item.level} — 點擊取回`;
          slot.onclick = () => this.retrieveItem(i);
        }
        grid.appendChild(slot);
      }
    }

    // Expand button
    if (expandArea) {
      expandArea.innerHTML = '';
      if (this.slots < CONFIG.INVENTORY_MAX_SLOTS) {
        const cost = this.getExpandCost();
        const btn = document.createElement('button');
        btn.className = 'inventory-expand-btn';
        btn.textContent = `擴充倉庫 +1 格（💎 ${cost}）`;
        btn.disabled = Economy.gems < cost;
        btn.onclick = () => {
          if (this.expand()) {
            this.render();
          }
        };
        expandArea.appendChild(btn);

        const info = document.createElement('div');
        info.style.cssText = 'font-size:10px;color:#888;margin-top:6px;';
        info.textContent = `已解鎖 ${this.slots}/${CONFIG.INVENTORY_MAX_SLOTS} 格`;
        expandArea.appendChild(info);
      } else {
        const info = document.createElement('div');
        info.style.cssText = 'font-size:10px;color:#4ade80;margin-top:4px;';
        info.textContent = '倉庫已全部解鎖！';
        expandArea.appendChild(info);
      }
    }
  },

  serialize() {
    return {
      slots: this.slots,
      items: this.items.map(i => i ? i.serialize() : null),
    };
  },
};
