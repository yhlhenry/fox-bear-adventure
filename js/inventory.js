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
    const container = document.getElementById('inventory-grid');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < CONFIG.INVENTORY_MAX_SLOTS; i++) {
      const slot = document.createElement('div');

      if (i < this.slots) {
        slot.className = 'inventory-slot';
        const item = this.items[i];
        if (item) {
          slot.textContent = item.getEmoji();
          slot.title = `${item.getName()} Lv${item.level}`;
          slot.onclick = () => this.retrieveItem(i);
        }
      } else {
        slot.className = 'inventory-slot locked';
        if (i === this.slots) {
          // Next unlock slot - show cost
          slot.onclick = () => this.expand();
          slot.title = `擴充：${this.getExpandCost()} 💎`;
          slot.style.cursor = 'pointer';
        }
      }

      container.appendChild(slot);

      // Only show first 2 rows (14 slots) to save space
      if (i >= 13) break;
    }
  },

  serialize() {
    return {
      slots: this.slots,
      items: this.items.map(i => i ? i.serialize() : null),
    };
  },
};
