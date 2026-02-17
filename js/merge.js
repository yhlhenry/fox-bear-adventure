// ===== 合成邏輯與拖曳 =====
const MergeSystem = {
  isDragging: false,
  dragItem: null,
  dragSourceIndex: -1,
  dragX: 0,
  dragY: 0,
  highlightIndex: -1,
  animations: [], // {type, x, y, startTime, duration, ...}

  init(canvas) {
    this.canvas = canvas;
    this._bindEvents();
  },

  _bindEvents() {
    const canvas = this.canvas;

    // Pointer events for both mouse and touch
    canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this._onPointerUp(e));
    canvas.addEventListener('pointercancel', (e) => this._onPointerUp(e));

    // Prevent context menu on long press
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = Renderer.canvasW / rect.width;
    const scaleY = Renderer.canvasH / rect.height;
    // Convert to canvas coords, then subtract grid offset
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    return {
      x: canvasX,
      y: canvasY - Renderer.offsetY,
    };
  },

  _onPointerDown(e) {
    e.preventDefault();
    const pos = this._getCanvasPos(e);
    const cellIndex = Grid.hitTest(pos.x, pos.y, CONFIG.CELL_SIZE);
    if (cellIndex < 0) return;

    const item = Grid.getItemByIndex(cellIndex);
    if (!item) return;

    // If it's a producer, tap to produce
    if (item.isProducer) {
      const result = ProducerSystem.tapProduce(item.producerId);
      if (result) {
        // Animate production
        const { row, col } = Grid.getRowCol(result.index);
        this._addProduceAnimation(
          col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
          row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
        );
        AudioSystem.playProduce();
      }
      return;
    }

    if (item.state === 'locked') return;

    // Show sell zone
    document.getElementById('sell-zone').classList.remove('hidden');

    // Start drag
    this.isDragging = true;
    this.dragItem = item;
    this.dragSourceIndex = cellIndex;
    this.dragX = pos.x;
    this.dragY = pos.y;
    this.canvas.setPointerCapture(e.pointerId);
  },

  _onPointerMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const pos = this._getCanvasPos(e);
    this.dragX = pos.x;
    this.dragY = pos.y;

    // Find cell under cursor for highlight
    const cellIndex = Grid.hitTest(pos.x, pos.y, CONFIG.CELL_SIZE);
    this.highlightIndex = cellIndex;

    // Check if over sell zone
    this._checkSellZoneHover(e);
  },

  _onPointerUp(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    document.getElementById('sell-zone').classList.add('hidden');

    const pos = this._getCanvasPos(e);
    const targetIndex = Grid.hitTest(pos.x, pos.y, CONFIG.CELL_SIZE);

    // Check sell zone
    if (this._isOverSellZone(e)) {
      this._sellItem();
      this._endDrag();
      return;
    }

    if (targetIndex >= 0 && targetIndex !== this.dragSourceIndex) {
      const targetItem = Grid.getItemByIndex(targetIndex);

      if (targetItem && this.dragItem.canMergeWith(targetItem) && !targetItem.isMaxLevel()) {
        // MERGE!
        this._performMerge(this.dragSourceIndex, targetIndex);
      } else if (!targetItem && Grid.cellStates[targetIndex] !== 'locked') {
        // Move to empty cell
        Grid.removeItemByIndex(this.dragSourceIndex);
        Grid.setItemByIndex(targetIndex, this.dragItem);
        AudioSystem.playMove();
      }
      // else: drop back to source (do nothing)
    }

    this._endDrag();
  },

  _performMerge(sourceIdx, targetIdx) {
    const sourceItem = Grid.getItemByIndex(sourceIdx);
    const targetItem = Grid.getItemByIndex(targetIdx);
    if (!sourceItem || !targetItem) return;

    // Determine resulting item
    let resultChainId = targetItem.chainId;
    let resultLevel = targetItem.level + 1;

    // Handle wildcard
    if (sourceItem.chainId === 'special' && sourceItem.level === -1) {
      resultChainId = targetItem.chainId;
      resultLevel = targetItem.level + 1;
    } else if (targetItem.chainId === 'special' && targetItem.level === -1) {
      resultChainId = sourceItem.chainId;
      resultLevel = sourceItem.level + 1;
    }

    const newItem = new GameItem(resultChainId, resultLevel);

    // Remove source, place result at target
    Grid.removeItemByIndex(sourceIdx);
    Grid.setItemByIndex(targetIdx, newItem);

    // Animation
    const { row, col } = Grid.getRowCol(targetIdx);
    const cx = col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    const cy = row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
    this._addMergeAnimation(cx, cy);

    // Try unlock adjacent cobwebs
    Grid.tryUnlockCobweb(row, col, Game.state);

    // Update collection
    if (Game.state.collection) {
      if (!Game.state.collection[resultChainId]) {
        Game.state.collection[resultChainId] = {};
      }
      Game.state.collection[resultChainId][resultLevel] = true;
    }

    // Stats
    Game.state.stats.totalMerges++;

    // Maybe spawn bubble item
    this._maybeSpawnBubble(targetIdx, resultLevel);

    // Check auto-order triggers
    OrderSystem.checkAutoOrder(resultChainId, resultLevel);

    AudioSystem.playMerge(resultLevel);

    // Save
    SaveSystem.save(Game.getState());
  },

  _maybeSpawnBubble(nearIndex, mergedLevel) {
    // Higher level merges have higher chance
    const chance = 0.05 + mergedLevel * 0.02;
    if (Math.random() > chance) return;

    const emptyIdx = Grid.findEmptyCell();
    if (emptyIdx < 0) return;

    // Random low-level item from a random chain
    const chainIds = Object.keys(CHAINS);
    const randomChain = chainIds[Math.floor(Math.random() * chainIds.length)];
    const item = new GameItem(randomChain, 1);
    item.state = 'bubble';
    item.bubbleExpiry = Date.now() + CONFIG.BUBBLE_DURATION;
    Grid.setItemByIndex(emptyIdx, item);
  },

  _sellItem() {
    if (!this.dragItem || this.dragItem.isProducer) return;
    const value = this.dragItem.getSellValue();
    Grid.removeItemByIndex(this.dragSourceIndex);
    Economy.addCoins(value);
    UI.showToast(`出售 ${this.dragItem.getName()} +${value} 🪙`);
    AudioSystem.playSell();
  },

  _isOverSellZone(e) {
    const zone = document.getElementById('sell-zone');
    if (!zone || zone.classList.contains('hidden')) return false;
    const rect = zone.getBoundingClientRect();
    return (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom
    );
  },

  _checkSellZoneHover(e) {
    const zone = document.getElementById('sell-zone');
    if (!zone) return;
    if (this._isOverSellZone(e)) {
      zone.classList.add('active');
    } else {
      zone.classList.remove('active');
    }
  },

  _endDrag() {
    this.isDragging = false;
    this.dragItem = null;
    this.dragSourceIndex = -1;
    this.highlightIndex = -1;
    const zone = document.getElementById('sell-zone');
    if (zone) {
      zone.classList.add('hidden');
      zone.classList.remove('active');
    }
  },

  // === Animations ===
  _addMergeAnimation(x, y) {
    const now = Date.now();
    // Scale bounce
    this.animations.push({
      type: 'merge_bounce',
      x, y,
      startTime: now,
      duration: CONFIG.MERGE_ANIM_DURATION,
    });
    // Particles
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT;
      const speed = CONFIG.CELL_SIZE * 0.8;
      this.animations.push({
        type: 'particle',
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        startTime: now,
        duration: 400,
        color: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`,
      });
    }
  },

  _addProduceAnimation(x, y) {
    const now = Date.now();
    this.animations.push({
      type: 'produce_pop',
      x, y,
      startTime: now,
      duration: 250,
    });
  },

  updateAnimations() {
    const now = Date.now();
    this.animations = this.animations.filter(a => now - a.startTime < a.duration);
  },

  renderAnimations(ctx) {
    const now = Date.now();
    for (const anim of this.animations) {
      const t = (now - anim.startTime) / anim.duration; // 0..1
      if (t < 0 || t > 1) continue;

      if (anim.type === 'merge_bounce') {
        const scale = 1 + Math.sin(t * Math.PI) * 0.3;
        ctx.save();
        ctx.translate(anim.x, anim.y);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(255, 215, 0, ' + (1 - t) * 0.5 + ')';
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (anim.type === 'particle') {
        const alpha = 1 - t;
        ctx.fillStyle = anim.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        const px = anim.x + anim.vx * t;
        const py = anim.y + anim.vy * t;
        const size = 3 * (1 - t);
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }

      if (anim.type === 'produce_pop') {
        const scale = 0.5 + t * 0.5;
        const alpha = t < 0.5 ? 1 : 1 - (t - 0.5) * 2;
        ctx.save();
        ctx.translate(anim.x, anim.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
  },

  // Render drag ghost
  renderDragGhost(ctx) {
    if (!this.isDragging || !this.dragItem) return;

    const emoji = this.dragItem.isProducer
      ? PRODUCERS[this.dragItem.producerId]?.emoji || '?'
      : this.dragItem.getEmoji();

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.font = `${CONFIG.CELL_SIZE * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, this.dragX, this.dragY);
    ctx.restore();

    // Highlight target cell
    if (this.highlightIndex >= 0 && this.highlightIndex !== this.dragSourceIndex) {
      const { row, col } = Grid.getRowCol(this.highlightIndex);
      const rect = Grid.getCellRect(row, col, CONFIG.CELL_SIZE);
      const targetItem = Grid.getItemByIndex(this.highlightIndex);

      ctx.strokeStyle = targetItem && this.dragItem.canMergeWith(targetItem)
        ? '#4ade80' : '#60a5fa';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    }
  },
};
