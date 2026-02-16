// ===== 特殊道具系統 =====
const SpecialItems = {
  counts: { scissors: 0, wildcard: 0, hourglass: 0 },

  init(saved) {
    if (saved) {
      this.counts = { ...this.counts, ...saved };
    }
  },

  // 魔法剪刀：拆解 Lv N → 2x Lv N-1
  useScissors(gridIndex) {
    if (this.counts.scissors <= 0) {
      UI.showToast('沒有魔法剪刀了！');
      return false;
    }

    const item = Grid.getItemByIndex(gridIndex);
    if (!item || item.isProducer || item.level <= 1) {
      UI.showToast('無法對此物品使用剪刀！');
      return false;
    }

    const chainId = item.chainId;
    const newLevel = item.level - 1;

    // Need 2 empty cells (or 1 since we're replacing the original)
    const { row, col } = Grid.getRowCol(gridIndex);
    const empty = Grid.findEmptyCellNear(row, col);
    if (empty < 0) {
      UI.showToast('需要至少一個空格！');
      return false;
    }

    // Replace original with one lower-level item
    const item1 = new GameItem(chainId, newLevel);
    Grid.setItemByIndex(gridIndex, item1);

    // Place second one nearby
    const item2 = new GameItem(chainId, newLevel);
    Grid.setItemByIndex(empty, item2);

    this.counts.scissors--;
    UI.showToast(`✂️ 拆解成功！`);
    AudioSystem.playSpecial();

    // If the item was a high-level producer product, reset that producer's considerations
    // (simplified: just update collection)
    if (Game.state.collection) {
      if (!Game.state.collection[chainId]) Game.state.collection[chainId] = {};
      Game.state.collection[chainId][newLevel] = true;
    }

    SaveSystem.save(Game.getState());
    return true;
  },

  // 萬能卡：放置在格子上，可與任何物品合成
  useWildcard() {
    if (this.counts.wildcard <= 0) {
      UI.showToast('沒有萬能卡了！');
      return false;
    }

    const empty = Grid.findEmptyCell();
    if (empty < 0) {
      UI.showToast('沒有空格！');
      return false;
    }

    const item = new GameItem('special', -1); // special wildcard marker
    Grid.setItemByIndex(empty, item);
    this.counts.wildcard--;
    UI.showToast('🃏 萬能卡已放置！拖動它到要合成的物品上');
    return true;
  },

  // 時間沙漏：重置一個生產者的冷卻
  useHourglass(producerId) {
    if (this.counts.hourglass <= 0) {
      UI.showToast('沒有時間沙漏了！');
      return false;
    }

    ProducerSystem.resetCooldown(producerId);
    this.counts.hourglass--;
    UI.showToast('⏳ 冷卻已重置！');
    AudioSystem.playSpecial();
    SaveSystem.save(Game.getState());
    return true;
  },

  serialize() {
    return { ...this.counts };
  },
};
