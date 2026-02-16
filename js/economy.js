// ===== 貨幣經濟系統 =====
const Economy = {
  coins: 0,
  gems: 10,
  stars: 0,

  init(savedEconomy) {
    if (savedEconomy) {
      this.coins = savedEconomy.coins || 0;
      this.gems = savedEconomy.gems || 10;
      this.stars = savedEconomy.stars || 0;
    }
    this.updateUI();
  },

  addCoins(amount) {
    this.coins += amount;
    this.updateUI();
    this._floatText(`+${amount} 🪙`);
  },

  addGems(amount) {
    this.gems += amount;
    this.updateUI();
    this._floatText(`+${amount} 💎`);
  },

  addStars(amount) {
    this.stars += amount;
    this.updateUI();
    this._floatText(`+${amount} ⭐`);
  },

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.coins -= amount;
    this.updateUI();
    return true;
  },

  spendGems(amount) {
    if (this.gems < amount) return false;
    this.gems -= amount;
    this.updateUI();
    return true;
  },

  spendStars(amount) {
    if (this.stars < amount) return false;
    this.stars -= amount;
    this.updateUI();
    return true;
  },

  updateUI() {
    const c = document.getElementById('coins-display');
    const g = document.getElementById('gems-display');
    const s = document.getElementById('stars-display');
    if (c) c.textContent = `🪙 ${this.coins}`;
    if (g) g.textContent = `💎 ${this.gems}`;
    if (s) s.textContent = `⭐ ${this.stars}`;
  },

  _floatText(text) {
    // Could add floating text animation later
  },

  serialize() {
    return { coins: this.coins, gems: this.gems, stars: this.stars };
  },
};
