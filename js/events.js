// ===== 活動系統 (Bingo + 賽季) =====
const EventSystem = {
  bingo: null, // { grid: [{task, completed}], startTime, endTime }
  season: null, // { tasks: [], points, rewards, startTime, endTime }

  init(savedEvents) {
    if (savedEvents) {
      this.bingo = savedEvents.bingo;
      this.season = savedEvents.season;
    }
    this._checkExpiry();
  },

  // ===== BINGO =====
  isBingoActive() {
    if (!this.bingo) return false;
    const now = Date.now();
    return now >= this.bingo.startTime && now < this.bingo.endTime;
  },

  generateBingo() {
    // Bingo runs Thu-Sun each week
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 4=Thu
    // For simplicity, always generate a new bingo available
    const startTime = Date.now();
    const endTime = startTime + 4 * 24 * 60 * 60 * 1000; // 4 days

    const tasks = this._generateBingoTasks();
    this.bingo = {
      grid: tasks,
      startTime,
      endTime,
    };
  },

  _generateBingoTasks() {
    const tasks = [];
    const taskTemplates = [
      { text: '合成 3 次', type: 'merge', target: 3 },
      { text: '合成 5 次', type: 'merge', target: 5 },
      { text: '合成 Lv3 物品', type: 'merge_level', target: 3 },
      { text: '合成 Lv4 物品', type: 'merge_level', target: 4 },
      { text: '完成 1 筆訂單', type: 'order', target: 1 },
      { text: '完成 2 筆訂單', type: 'order', target: 2 },
      { text: '消耗 10 能量', type: 'energy', target: 10 },
      { text: '消耗 20 能量', type: 'energy', target: 20 },
      { text: '生產 5 個物品', type: 'produce', target: 5 },
      { text: '生產 10 個物品', type: 'produce', target: 10 },
      { text: '獲得 50 金幣', type: 'coins', target: 50 },
      { text: '獲得 100 金幣', type: 'coins', target: 100 },
      { text: '出售 3 個物品', type: 'sell', target: 3 },
      { text: '修復 1 個建築', type: 'build', target: 1 },
      { text: '合成 Lv5 物品', type: 'merge_level', target: 5 },
      { text: '消耗 30 能量', type: 'energy', target: 30 },
      { text: '完成 3 筆訂單', type: 'order', target: 3 },
      { text: '生產 15 個物品', type: 'produce', target: 15 },
      { text: '獲得 200 金幣', type: 'coins', target: 200 },
      { text: '出售 5 個物品', type: 'sell', target: 5 },
      { text: '合成 10 次', type: 'merge', target: 10 },
      { text: '合成 Lv2 物品 x3', type: 'merge_level_count', target: 3, level: 2 },
      { text: '使用生產者 8 次', type: 'produce', target: 8 },
      { text: '修復 2 個建築', type: 'build', target: 2 },
      { text: '獲得 5 顆星星', type: 'stars', target: 5 },
    ];

    // Shuffle and pick 25
    const shuffled = [...taskTemplates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 25; i++) {
      const template = shuffled[i % shuffled.length];
      tasks.push({
        ...template,
        completed: false,
        progress: 0,
      });
    }
    // Center is free
    tasks[12] = { text: '免費', type: 'free', target: 0, completed: true, progress: 0 };
    return tasks;
  },

  checkBingoLines() {
    if (!this.bingo) return [];
    const grid = this.bingo.grid;
    const lines = [];

    // Rows
    for (let r = 0; r < 5; r++) {
      if (grid.slice(r * 5, r * 5 + 5).every(c => c.completed)) {
        lines.push(`row${r}`);
      }
    }
    // Cols
    for (let c = 0; c < 5; c++) {
      if ([0,1,2,3,4].every(r => grid[r * 5 + c].completed)) {
        lines.push(`col${c}`);
      }
    }
    // Diagonals
    if ([0,6,12,18,24].every(i => grid[i].completed)) lines.push('diag1');
    if ([4,8,12,16,20].every(i => grid[i].completed)) lines.push('diag2');

    return lines;
  },

  // ===== SEASON PASS =====
  isSeasonActive() {
    if (!this.season) return false;
    return Date.now() < this.season.endTime;
  },

  generateSeason() {
    const startTime = Date.now();
    const endTime = startTime + 14 * 24 * 60 * 60 * 1000; // 14 days

    const dailyTasks = [
      { text: '消耗 15 能量', type: 'energy', target: 15, points: 10 },
      { text: '合成 5 次', type: 'merge', target: 5, points: 10 },
      { text: '完成 1 筆訂單', type: 'order', target: 1, points: 15 },
      { text: '生產 8 個物品', type: 'produce', target: 8, points: 10 },
    ];

    const rewards = [
      { points: 20, reward: { coins: 50 }, emoji: '🪙' },
      { points: 50, reward: { gems: 2 }, emoji: '💎' },
      { points: 100, reward: { coins: 100 }, emoji: '🪙' },
      { points: 150, reward: { energy: 30 }, emoji: '⚡' },
      { points: 200, reward: { gems: 5 }, emoji: '💎' },
      { points: 300, reward: { coins: 200, gems: 3 }, emoji: '🎁' },
      { points: 400, reward: { scissors: 1 }, emoji: '✂️' },
      { points: 500, reward: { gems: 10 }, emoji: '💎' },
    ];

    this.season = {
      dailyTasks,
      rewards,
      points: 0,
      claimedRewards: [],
      startTime,
      endTime,
    };
  },

  addSeasonPoints(points) {
    if (!this.season) return;
    this.season.points += points;
  },

  claimSeasonReward(index) {
    if (!this.season) return false;
    const r = this.season.rewards[index];
    if (!r || this.season.claimedRewards.includes(index)) return false;
    if (this.season.points < r.points) return false;

    this.season.claimedRewards.push(index);
    const reward = r.reward;
    if (reward.coins) Economy.addCoins(reward.coins);
    if (reward.gems) Economy.addGems(reward.gems);
    if (reward.energy) Energy.add(reward.energy);
    if (reward.scissors) Game.state.specialItems.scissors += reward.scissors;

    UI.showToast('賽季獎勵已領取！');
    return true;
  },

  _checkExpiry() {
    const now = Date.now();
    if (this.bingo && now >= this.bingo.endTime) {
      this.bingo = null;
    }
    if (this.season && now >= this.season.endTime) {
      this.season = null;
    }
  },

  serialize() {
    return {
      bingo: this.bingo,
      season: this.season,
    };
  },
};
