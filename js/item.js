// ===== 物品系統 =====
class GameItem {
  constructor(chainId, level) {
    this.chainId = chainId;
    this.level = level;
    this.state = 'normal'; // normal | locked | bubble
    this.bubbleExpiry = 0; // timestamp for bubble items
    this.isProducer = false;
    this.producerId = null;
  }

  getChain() {
    return CHAINS[this.chainId];
  }

  getInfo() {
    const chain = this.getChain();
    if (!chain) return null;
    return chain.items[this.level - 1] || null;
  }

  getEmoji() {
    const info = this.getInfo();
    return info ? info.emoji : '❓';
  }

  getName() {
    const info = this.getInfo();
    return info ? info.name : '???';
  }

  getColor() {
    const info = this.getInfo();
    return info ? info.color : '#888';
  }

  canMergeWith(other) {
    if (!other) return false;
    if (this.state === 'locked' || other.state === 'locked') return false;
    // Wildcard can merge with anything
    if (this.chainId === 'special' && this.level === -1) return true;
    if (other.chainId === 'special' && other.level === -1) return true;
    return this.chainId === other.chainId && this.level === other.level;
  }

  getMaxLevel() {
    const chain = this.getChain();
    return chain ? chain.items.length : 7;
  }

  isMaxLevel() {
    return this.level >= this.getMaxLevel();
  }

  getSellValue() {
    return Math.floor(this.level * CONFIG.SELL_MULTIPLIER * 2);
  }

  serialize() {
    const data = { chainId: this.chainId, level: this.level };
    if (this.state !== 'normal') data.state = this.state;
    if (this.bubbleExpiry > 0) data.bubbleExpiry = this.bubbleExpiry;
    if (this.isProducer) {
      data.isProducer = true;
      data.producerId = this.producerId;
    }
    return data;
  }

  static deserialize(data) {
    if (!data) return null;
    const item = new GameItem(data.chainId, data.level);
    if (data.state) item.state = data.state;
    if (data.bubbleExpiry) item.bubbleExpiry = data.bubbleExpiry;
    if (data.isProducer) {
      item.isProducer = true;
      item.producerId = data.producerId;
    }
    return item;
  }

  static createProducer(producerId) {
    const def = PRODUCERS[producerId];
    if (!def) return null;
    const item = new GameItem(def.chainId, 0); // level 0 = producer itself
    item.isProducer = true;
    item.producerId = producerId;
    return item;
  }
}
