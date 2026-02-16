// ===== 遊戲常數與資料表 =====
const CONFIG = {
  // Grid
  GRID_COLS: 7,
  GRID_ROWS: 9,
  // CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT are computed dynamically by Renderer
  CELL_SIZE: 40, // default, overwritten at runtime

  // Energy
  ENERGY_MAX: 100,
  ENERGY_REGEN_INTERVAL: 120000, // 2 min in ms
  ENERGY_REGEN_AMOUNT: 1,

  // Save
  SAVE_INTERVAL: 30000, // 30 sec

  // Merge
  MERGE_COUNT: 2, // merge 2 identical items

  // Producer defaults
  PRODUCER_BUFFER_DEFAULT: 12,
  PRODUCER_COOLDOWN_DEFAULT: 1200000, // 20 min in ms

  // Economy
  SELL_MULTIPLIER: 0.5, // sell price = base * level * multiplier

  // Inventory
  INVENTORY_INITIAL_SLOTS: 0,
  INVENTORY_MAX_SLOTS: 28,
  INVENTORY_EXPAND_BASE_COST: 5, // gems
  INVENTORY_EXPAND_MULTIPLIER: 1.5,

  // Bubble
  BUBBLE_DURATION: 60000, // 60 sec

  // Orders
  ORDER_SLOTS: 3,
  ORDER_REFRESH_INTERVAL: 300000, // 5 min

  // Building
  AREAS: [
    { id: 'treehouse', name: '阿狸的樹屋', icon: '🏠' },
    { id: 'market', name: '蘑菇市集', icon: '🍄' },
    { id: 'fishing', name: '河邊釣魚小屋', icon: '🐟' },
    { id: 'garden', name: '螢火蟲花園', icon: '🌸' },
    { id: 'tower', name: '星空瞭望塔', icon: '🌟' },
    { id: 'library', name: '森林圖書館', icon: '📚' },
  ],

  // Active producer limit
  ACTIVE_PRODUCER_LIMIT: 5,

  // Animation
  PARTICLE_COUNT: 8,
  MERGE_ANIM_DURATION: 300,
};

// ===== 合成鏈定義 =====
const CHAINS = {
  adventure: {
    id: 'adventure',
    name: '探險鏈',
    producerId: 'adventure_pack',
    items: [
      { level: 1, name: '樹葉', emoji: '🍃', color: '#4ade80' },
      { level: 2, name: '樹枝', emoji: '🪵', color: '#a3e635' },
      { level: 3, name: '木板', emoji: '🪓', color: '#d4a574' },
      { level: 4, name: '木箱', emoji: '📦', color: '#c4915e' },
      { level: 5, name: '工具包', emoji: '🧰', color: '#f59e0b' },
      { level: 6, name: '探險包', emoji: '🎒', color: '#ef4444' },
      { level: 7, name: '黃金背包', emoji: '👑', color: '#ffd700' },
    ],
  },
  mushroom: {
    id: 'mushroom',
    name: '蘑菇鏈',
    producerId: 'mushroom_farm',
    items: [
      { level: 1, name: '孢子', emoji: '🟤', color: '#a3a3a3' },
      { level: 2, name: '小蘑菇', emoji: '🍄', color: '#f87171' },
      { level: 3, name: '蘑菇叢', emoji: '🍄', color: '#ef4444' },
      { level: 4, name: '蘑菇湯', emoji: '🍲', color: '#fb923c' },
      { level: 5, name: '蘑菇燉飯', emoji: '🍛', color: '#fbbf24' },
      { level: 6, name: '蘑菇宴', emoji: '🎉', color: '#a78bfa' },
      { level: 7, name: '蘑菇王', emoji: '👑', color: '#ffd700' },
    ],
  },
  fish: {
    id: 'fish',
    name: '魚類鏈',
    producerId: 'fishing_rod',
    items: [
      { level: 1, name: '魚餌', emoji: '🪱', color: '#d4a574' },
      { level: 2, name: '小魚', emoji: '🐟', color: '#60a5fa' },
      { level: 3, name: '鱒魚', emoji: '🐠', color: '#34d399' },
      { level: 4, name: '鮭魚', emoji: '🐡', color: '#fb923c' },
      { level: 5, name: '旗魚', emoji: '🗡️', color: '#818cf8' },
      { level: 6, name: '金龍魚', emoji: '🐉', color: '#fbbf24' },
      { level: 7, name: '傳說之魚', emoji: '🌊', color: '#ffd700' },
    ],
  },
  flower: {
    id: 'flower',
    name: '花朵鏈',
    producerId: 'watering_can',
    items: [
      { level: 1, name: '種子', emoji: '🫘', color: '#a3a3a3' },
      { level: 2, name: '嫩芽', emoji: '🌱', color: '#4ade80' },
      { level: 3, name: '花苞', emoji: '🌷', color: '#fb7185' },
      { level: 4, name: '雛菊', emoji: '🌼', color: '#fde047' },
      { level: 5, name: '玫瑰', emoji: '🌹', color: '#f43f5e' },
      { level: 6, name: '向日葵', emoji: '🌻', color: '#fbbf24' },
      { level: 7, name: '世界花', emoji: '💐', color: '#ffd700' },
    ],
  },
  fruit: {
    id: 'fruit',
    name: '果實鏈',
    producerId: 'seed_bag',
    items: [
      { level: 1, name: '青果', emoji: '🫒', color: '#86efac' },
      { level: 2, name: '蘋果', emoji: '🍎', color: '#ef4444' },
      { level: 3, name: '橘子', emoji: '🍊', color: '#fb923c' },
      { level: 4, name: '葡萄', emoji: '🍇', color: '#a78bfa' },
      { level: 5, name: '水果籃', emoji: '🧺', color: '#fbbf24' },
      { level: 6, name: '果汁', emoji: '🧃', color: '#fb923c' },
      { level: 7, name: '黃金果醬', emoji: '🍯', color: '#ffd700' },
    ],
  },
  fabric: {
    id: 'fabric',
    name: '布料鏈',
    producerId: 'loom',
    items: [
      { level: 1, name: '棉花', emoji: '☁️', color: '#e5e5e5' },
      { level: 2, name: '線團', emoji: '🧶', color: '#fb7185' },
      { level: 3, name: '布片', emoji: '🧻', color: '#d4a574' },
      { level: 4, name: '圍巾', emoji: '🧣', color: '#f43f5e' },
      { level: 5, name: '斗篷', emoji: '🦸', color: '#818cf8' },
      { level: 6, name: '和服', emoji: '👘', color: '#c084fc' },
      { level: 7, name: '龍袍', emoji: '🐲', color: '#ffd700' },
    ],
  },
  tool: {
    id: 'tool',
    name: '工具鏈',
    producerId: 'forge',
    items: [
      { level: 1, name: '礦石', emoji: '🪨', color: '#a3a3a3' },
      { level: 2, name: '鐵錠', emoji: '🧱', color: '#9ca3af' },
      { level: 3, name: '釘子', emoji: '📌', color: '#6b7280' },
      { level: 4, name: '鐵鎚', emoji: '🔨', color: '#78716c' },
      { level: 5, name: '鐵劍', emoji: '⚔️', color: '#60a5fa' },
      { level: 6, name: '銀甲', emoji: '🛡️', color: '#c0c0c0' },
      { level: 7, name: '傳說神器', emoji: '✨', color: '#ffd700' },
    ],
  },
  dessert: {
    id: 'dessert',
    name: '甜品鏈',
    producerId: 'ice_cream_truck',
    items: [
      { level: 1, name: '牛奶', emoji: '🥛', color: '#f5f5f4' },
      { level: 2, name: '奶油', emoji: '🧈', color: '#fde047' },
      { level: 3, name: '冰淇淋', emoji: '🍦', color: '#fbcfe8' },
      { level: 4, name: '聖代', emoji: '🍨', color: '#f9a8d4' },
      { level: 5, name: '蛋糕', emoji: '🎂', color: '#fbbf24' },
      { level: 6, name: '婚禮蛋糕', emoji: '🍰', color: '#f5f5f4' },
      { level: 7, name: '極致甜點', emoji: '🏆', color: '#ffd700' },
    ],
  },
};

// ===== 生產者定義 =====
const PRODUCERS = {
  adventure_pack: {
    id: 'adventure_pack',
    name: '探險背包',
    emoji: '🎒',
    chainId: 'adventure',
    type: 'energy', // energy | auto | consumable
    energyCost: 1,
    buffer: 12,
    cooldownMs: 1200000,
    dropTable: [
      { chainId: 'adventure', level: 1, weight: 80 },
      { chainId: 'adventure', level: 2, weight: 20 },
    ],
    unlockOrder: 0,
  },
  mushroom_farm: {
    id: 'mushroom_farm',
    name: '蘑菇圃',
    emoji: '🏕️',
    chainId: 'mushroom',
    type: 'energy',
    energyCost: 1,
    buffer: 12,
    cooldownMs: 1200000,
    dropTable: [
      { chainId: 'mushroom', level: 1, weight: 80 },
      { chainId: 'mushroom', level: 2, weight: 20 },
    ],
    unlockOrder: 1,
  },
  fishing_rod: {
    id: 'fishing_rod',
    name: '釣魚竿',
    emoji: '🎣',
    chainId: 'fish',
    type: 'energy',
    energyCost: 1,
    buffer: 12,
    cooldownMs: 1200000,
    dropTable: [
      { chainId: 'fish', level: 1, weight: 80 },
      { chainId: 'fish', level: 2, weight: 20 },
    ],
    unlockOrder: 2,
  },
  watering_can: {
    id: 'watering_can',
    name: '澆水壺',
    emoji: '🚿',
    chainId: 'flower',
    type: 'auto',
    autoIntervalMs: 60000, // produce every 60s
    buffer: 8,
    cooldownMs: 600000,
    dropTable: [
      { chainId: 'flower', level: 1, weight: 85 },
      { chainId: 'flower', level: 2, weight: 15 },
    ],
    unlockOrder: 3,
  },
  seed_bag: {
    id: 'seed_bag',
    name: '種子袋',
    emoji: '🌰',
    chainId: 'fruit',
    type: 'consumable', // consumed after X uses
    maxUses: 20,
    buffer: 12,
    cooldownMs: 0,
    dropTable: [
      { chainId: 'fruit', level: 1, weight: 75 },
      { chainId: 'fruit', level: 2, weight: 25 },
    ],
    unlockOrder: 4,
  },
  loom: {
    id: 'loom',
    name: '編織機',
    emoji: '🧵',
    chainId: 'fabric',
    type: 'energy',
    energyCost: 1,
    buffer: 12,
    cooldownMs: 1200000,
    dropTable: [
      { chainId: 'fabric', level: 1, weight: 80 },
      { chainId: 'fabric', level: 2, weight: 20 },
    ],
    unlockOrder: 5,
  },
  forge: {
    id: 'forge',
    name: '鐵匠爐',
    emoji: '⚒️',
    chainId: 'tool',
    type: 'energy',
    energyCost: 1,
    buffer: 12,
    cooldownMs: 1200000,
    dropTable: [
      { chainId: 'tool', level: 1, weight: 80 },
      { chainId: 'tool', level: 2, weight: 20 },
    ],
    unlockOrder: 6,
  },
  ice_cream_truck: {
    id: 'ice_cream_truck',
    name: '冰淇淋車',
    emoji: '🍦',
    chainId: 'dessert',
    type: 'auto',
    autoIntervalMs: 90000,
    buffer: 8,
    cooldownMs: 900000,
    dropTable: [
      { chainId: 'dessert', level: 1, weight: 85 },
      { chainId: 'dessert', level: 2, weight: 15 },
    ],
    unlockOrder: 7,
  },
};

// ===== NPC 定義 =====
const NPCS = {
  owl: { id: 'owl', name: '歐拉', emoji: '🦉', role: '貓頭鷹智者' },
  hedgehog: { id: 'hedgehog', name: '栗子', emoji: '🦔', role: '刺蝟廚師' },
  squirrel: { id: 'squirrel', name: '堅果', emoji: '🐿️', role: '松鼠工匠' },
  rabbit: { id: 'rabbit', name: '棉花', emoji: '🐰', role: '兔子郵差' },
  fox_bear: { id: 'fox_bear', name: '阿狸', emoji: '🦊', role: '小狐熊' },
};

// ===== 建造任務定義 =====
const BUILDING_TASKS = {
  treehouse: [
    { id: 'th1', name: '修理屋頂', starCost: 5, description: '阿狸的樹屋屋頂被風暴吹壞了' },
    { id: 'th2', name: '安裝窗戶', starCost: 8, description: '透明的窗戶能讓陽光照進來' },
    { id: 'th3', name: '搭建梯子', starCost: 10, description: '通往樹屋的爬梯' },
    { id: 'th4', name: '放置家具', starCost: 15, description: '溫馨的木製家具' },
    { id: 'th5', name: '掛上燈籠', starCost: 20, description: '夜晚的溫暖光芒' },
  ],
  market: [
    { id: 'mk1', name: '搭建攤位', starCost: 15, description: '蘑菇市集的第一個攤位' },
    { id: 'mk2', name: '鋪設步道', starCost: 20, description: '石板步道' },
    { id: 'mk3', name: '安裝招牌', starCost: 25, description: '歡迎光臨蘑菇市集！' },
    { id: 'mk4', name: '建造涼亭', starCost: 30, description: '遮陽的蘑菇涼亭' },
    { id: 'mk5', name: '放置花盆', starCost: 20, description: '裝飾用的花盆' },
    { id: 'mk6', name: '掛彩旗', starCost: 35, description: '節慶的彩色旗幟' },
  ],
  fishing: [
    { id: 'fs1', name: '修建碼頭', starCost: 20, description: '河邊的木製碼頭' },
    { id: 'fs2', name: '搭建小屋', starCost: 25, description: '存放釣具的小屋' },
    { id: 'fs3', name: '安裝釣竿架', starCost: 15, description: '整齊的釣竿收納' },
    { id: 'fs4', name: '放置魚缸', starCost: 30, description: '展示珍稀魚類' },
    { id: 'fs5', name: '建造小橋', starCost: 35, description: '橫跨小溪的拱橋' },
    { id: 'fs6', name: '設置篝火', starCost: 25, description: '烤魚用的篝火台' },
  ],
  garden: [
    { id: 'gd1', name: '清理雜草', starCost: 15, description: '清除荒廢的雜草' },
    { id: 'gd2', name: '種植花叢', starCost: 20, description: '色彩繽紛的花叢' },
    { id: 'gd3', name: '安裝噴泉', starCost: 30, description: '花園中央的噴泉' },
    { id: 'gd4', name: '放置長椅', starCost: 20, description: '觀賞螢火蟲的長椅' },
    { id: 'gd5', name: '建造花架', starCost: 35, description: '攀爬植物的花架' },
    { id: 'gd6', name: '設置燈飾', starCost: 40, description: '夜晚的魔法燈飾' },
    { id: 'gd7', name: '建造蝴蝶溫室', starCost: 50, description: '蝴蝶的溫暖家園' },
  ],
  tower: [
    { id: 'tw1', name: '修復塔基', starCost: 30, description: '穩固的石製塔基' },
    { id: 'tw2', name: '搭建樓梯', starCost: 35, description: '螺旋上升的樓梯' },
    { id: 'tw3', name: '安裝望遠鏡', starCost: 40, description: '觀星的望遠鏡' },
    { id: 'tw4', name: '掛上星圖', starCost: 25, description: '古老的星座圖' },
    { id: 'tw5', name: '放置水晶球', starCost: 45, description: '神秘的預言水晶' },
    { id: 'tw6', name: '建造頂層露台', starCost: 50, description: '最佳觀星位置' },
  ],
  library: [
    { id: 'lb1', name: '修復書架', starCost: 25, description: '存放古老書籍' },
    { id: 'lb2', name: '安裝桌椅', starCost: 20, description: '閱讀用的書桌' },
    { id: 'lb3', name: '放置燭台', starCost: 15, description: '閱讀的光源' },
    { id: 'lb4', name: '收集散落書籍', starCost: 30, description: '找回被風暴吹散的書' },
    { id: 'lb5', name: '建造閱讀角', starCost: 35, description: '舒適的閱讀空間' },
    { id: 'lb6', name: '安裝魔法地球儀', starCost: 45, description: '展示世界的魔法地球儀' },
    { id: 'lb7', name: '恢復古老壁畫', starCost: 55, description: '記錄森林歷史的壁畫' },
  ],
};

// ===== 對話腳本 =====
const DIALOGUES = {
  intro: [
    { npc: 'fox_bear', text: '嗚...我的家...星露森林被可怕的風暴摧毀了...' },
    { npc: 'owl', text: '阿狸，別難過。我是歐拉，這片森林的守護者。' },
    { npc: 'owl', text: '只要我們合力收集物資，就能修復村莊！' },
    { npc: 'owl', text: '看到那個探險背包了嗎？點擊它，就能獲得修復材料。' },
    { npc: 'owl', text: '把兩個相同的材料拖在一起，就能合成更高級的物品！' },
    { npc: 'fox_bear', text: '我明白了！讓我們開始吧！' },
  ],
  treehouse_complete: [
    { npc: 'fox_bear', text: '太棒了！我的樹屋修好了！' },
    { npc: 'owl', text: '做得好，阿狸！接下來我們去看看蘑菇市集吧。' },
    { npc: 'hedgehog', text: '嗨！我是栗子，這裡的廚師。市集需要修復才能重新開張！' },
  ],
  market_unlock: [
    { npc: 'hedgehog', text: '歡迎來到蘑菇市集！我教你種蘑菇吧。' },
    { npc: 'hedgehog', text: '有了蘑菇圃，我們就能生產各種蘑菇料理了！' },
  ],
  fishing_unlock: [
    { npc: 'squirrel', text: '嘿！我是堅果，森林裡最棒的工匠！' },
    { npc: 'squirrel', text: '河邊的釣魚小屋需要修復，我幫你一起重建！' },
  ],
  garden_unlock: [
    { npc: 'rabbit', text: '你好呀~我是棉花，負責送信的兔子郵差！' },
    { npc: 'rabbit', text: '螢火蟲花園曾是森林最美的地方，我們一起恢復它吧！' },
  ],
  tower_unlock: [
    { npc: 'owl', text: '星空瞭望塔...這裡是我年輕時最愛的地方。' },
    { npc: 'owl', text: '從塔頂可以看見整片星空，也能預見森林的未來。' },
  ],
  library_unlock: [
    { npc: 'owl', text: '森林圖書館藏有古老的智慧，是森林文明的寶庫。' },
    { npc: 'owl', text: '修復它，我們就能找回被遺忘的知識。' },
  ],
  ending: [
    { npc: 'fox_bear', text: '我們做到了！星露森林恢復了昔日的光彩！' },
    { npc: 'owl', text: '阿狸，你的勇氣和毅力拯救了這片森林。' },
    { npc: 'hedgehog', text: '來吃蘑菇大餐慶祝吧！' },
    { npc: 'squirrel', text: '我做了一個特別的紀念品送給你！' },
    { npc: 'rabbit', text: '我要把這個好消息送到世界每個角落！' },
    { npc: 'fox_bear', text: '謝謝大家！這是最棒的冒險！' },
  ],
};

// ===== 特殊道具定義 =====
const SPECIAL_ITEMS = {
  scissors: { id: 'scissors', name: '魔法剪刀', emoji: '✂️', description: '拆解物品為 2 個低一級的物品' },
  wildcard: { id: 'wildcard', name: '萬能卡', emoji: '🃏', description: '可代替任何物品進行合成' },
  hourglass: { id: 'hourglass', name: '時間沙漏', emoji: '⏳', description: '立即重置生產者冷卻' },
};

// ===== 教學步驟 =====
const TUTORIAL_STEPS = [
  {
    target: 'producer', // will be resolved to actual position
    text: '歡迎來到星露森林！點擊探險背包來獲得材料吧。',
    action: 'click_producer',
  },
  {
    target: 'grid',
    text: '很好！現在把兩個相同的物品拖在一起，合成更高級的物品！',
    action: 'merge',
  },
  {
    target: 'orders',
    text: '看看訂單面板！完成訂單可以獲得金幣和星星。',
    action: 'open_orders',
  },
  {
    target: 'build',
    text: '用收集到的星星來修復村莊吧！點擊建造按鈕。',
    action: 'open_build',
  },
];

// ===== Cobweb positions (initial locked cells) =====
const INITIAL_COBWEBS = [
  // row, col - bottom-right area locked initially
  [6, 5], [6, 6],
  [7, 4], [7, 5], [7, 6],
  [8, 3], [8, 4], [8, 5], [8, 6],
];

// ===== Daily shop items =====
const SHOP_ITEMS = [
  { id: 'daily_energy', name: '每日能量', emoji: '⚡', type: 'free_daily', amount: 20, description: '每天免費領取 20 能量' },
  { id: 'energy_10', name: '能量補充包', emoji: '⚡', type: 'gem_buy', gemCost: 2, amount: 10, description: '10 點能量' },
  { id: 'energy_50', name: '能量大補包', emoji: '⚡', type: 'gem_buy', gemCost: 8, amount: 50, description: '50 點能量' },
  { id: 'inventory_slot', name: '倉庫擴充', emoji: '📦', type: 'gem_expand', description: '擴充 1 格倉庫空間' },
  { id: 'scissors_1', name: '魔法剪刀', emoji: '✂️', type: 'gem_buy', gemCost: 5, amount: 1, description: '拆解物品' },
  { id: 'wildcard_1', name: '萬能卡', emoji: '🃏', type: 'gem_buy', gemCost: 8, amount: 1, description: '代替任何物品合成' },
  { id: 'hourglass_1', name: '時間沙漏', emoji: '⏳', type: 'gem_buy', gemCost: 3, amount: 1, description: '重置冷卻' },
];
