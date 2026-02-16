// ===== 主入口 =====
const Game = {
  state: null,
  initialized: false,

  init() {
    console.log('🦊🐻 小狐熊大冒險 - 初始化中...');

    // Load or create state
    const saved = SaveSystem.load();
    if (saved) {
      this.state = saved;
      console.log('存檔已載入');
    } else {
      this.state = SaveSystem.defaultState();
      console.log('新遊戲開始');
    }

    // Initialize all systems
    Renderer.init();
    Grid.init(this.state.grid, this.state.cobwebs);
    Energy.init(this.state.energy);
    Economy.init(this.state.economy);
    ProducerSystem.init(this.state.producers, this.state.unlockedProducers);
    OrderSystem.init(this.state.orders, this.state.activeProducers);
    Inventory.init(this.state.inventory);
    BuildingSystem.init(this.state.buildings, this.state.unlockedAreas);
    DialogueSystem.init();
    SpecialItems.init(this.state.specialItems);
    EventSystem.init(this.state.events);
    AudioSystem.init();
    UI.init();

    // Place initial producer on grid if new game
    if (!saved) {
      this._setupNewGame();
    } else {
      // Ensure producers are on grid
      this._ensureProducersOnGrid();
    }

    // Initialize merge system with canvas
    MergeSystem.init(document.getElementById('game-canvas'));

    // Start render loop
    Renderer.startLoop();

    // Start auto-save
    SaveSystem.startAutoSave(() => this.getState());

    // Periodic order fulfillment check
    setInterval(() => {
      if (UI.orderPanelOpen) {
        OrderSystem.checkFulfillment();
      }
    }, 2000);

    // Initialize tutorial last
    TutorialSystem.init(this.state.tutorial);

    this.initialized = true;
    console.log('🦊🐻 初始化完成！');
  },

  _setupNewGame() {
    // Place the first producer
    ProducerSystem.placeProducerOnGrid('adventure_pack');

    // Add some starting items for better first experience
    const startItems = [
      { chainId: 'adventure', level: 1 },
      { chainId: 'adventure', level: 1 },
      { chainId: 'adventure', level: 1 },
    ];

    for (const itemData of startItems) {
      const idx = Grid.findEmptyCell();
      if (idx >= 0) {
        const item = new GameItem(itemData.chainId, itemData.level);
        Grid.setItemByIndex(idx, item);
      }
    }

    // Record Lv1 in collection
    this.state.collection.adventure = { 1: true };
  },

  _ensureProducersOnGrid() {
    for (const pid of this.state.activeProducers) {
      const state = ProducerSystem.producerStates[pid];
      if (!state || state.gridIndex < 0) {
        // Check if producer is already on grid
        let found = false;
        for (let i = 0; i < Grid.cells.length; i++) {
          const item = Grid.cells[i];
          if (item && item.isProducer && item.producerId === pid) {
            if (state) state.gridIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          ProducerSystem.placeProducerOnGrid(pid);
        }
      }
    }
  },

  getState() {
    return {
      ...this.state,
      grid: Grid.serialize(),
      energy: Energy.serialize(),
      economy: Economy.serialize(),
      producers: ProducerSystem.serialize(),
      orders: OrderSystem.serialize(),
      inventory: Inventory.serialize(),
      buildings: BuildingSystem.completedTasks,
      unlockedAreas: BuildingSystem.unlockedAreas,
      cobwebs: this.state.cobwebs,
      collection: this.state.collection,
      tutorial: TutorialSystem.serialize(),
      specialItems: SpecialItems.serialize(),
      events: EventSystem.serialize(),
      timestamp: Date.now(),
    };
  },

  // Reset game (dev/debug)
  reset() {
    if (confirm('確定要重置遊戲嗎？所有進度將會消失！')) {
      SaveSystem.clear();
      location.reload();
    }
  },
};

// Start when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

// Save on page unload
window.addEventListener('beforeunload', () => {
  if (Game.initialized) {
    SaveSystem.save(Game.getState());
  }
});

// Expose for console debugging
window.Game = Game;
window.Grid = Grid;
window.Energy = Energy;
window.Economy = Economy;
