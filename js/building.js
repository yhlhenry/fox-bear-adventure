// ===== 建造/修復系統 =====
const BuildingSystem = {
  currentArea: null,
  completedTasks: {}, // areaId -> { taskId: true }
  unlockedAreas: ['treehouse'],
  canvas: null,
  ctx: null,

  init(savedBuildings, savedUnlocked) {
    if (savedBuildings) this.completedTasks = savedBuildings;
    if (savedUnlocked) this.unlockedAreas = savedUnlocked;

    this.canvas = document.getElementById('building-canvas');
  },

  _ensureCanvas() {
    if (!this.canvas) return;
    const container = document.getElementById('building-view');
    const header = document.getElementById('building-header');
    const tasks = document.getElementById('building-tasks');
    const w = container.clientWidth;
    const h = container.clientHeight - (header?.offsetHeight || 40) - (tasks?.offsetHeight || 200);
    this.canvas.width = Math.max(w, 280);
    this.canvas.height = Math.max(h, 200);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  },

  show() {
    document.getElementById('building-view').classList.remove('hidden');
    if (!this.currentArea) {
      this.currentArea = this.unlockedAreas[0] || 'treehouse';
    }
    // Delay render to let DOM layout settle
    requestAnimationFrame(() => {
      this._ensureCanvas();
      this.renderBuildingView();
    });
  },

  hide() {
    document.getElementById('building-view').classList.add('hidden');
  },

  setArea(areaId) {
    if (!this.unlockedAreas.includes(areaId)) return;
    this.currentArea = areaId;
    this.renderBuildingView();
  },

  buildTask(areaId, taskId) {
    const tasks = BUILDING_TASKS[areaId];
    if (!tasks) return false;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    if (this.isTaskCompleted(areaId, taskId)) return false;

    if (!Economy.spendStars(task.starCost)) {
      UI.showToast('星星不足！');
      return false;
    }

    if (!this.completedTasks[areaId]) {
      this.completedTasks[areaId] = {};
    }
    this.completedTasks[areaId][taskId] = true;

    UI.showToast(`修復完成：${task.name}！`);
    AudioSystem.playBuild();

    // Check if area is fully complete
    if (this.isAreaComplete(areaId)) {
      this._onAreaComplete(areaId);
    }

    this.renderBuildingView();
    SaveSystem.save(Game.getState());
    return true;
  },

  isTaskCompleted(areaId, taskId) {
    return this.completedTasks[areaId]?.[taskId] === true;
  },

  isAreaComplete(areaId) {
    const tasks = BUILDING_TASKS[areaId];
    if (!tasks) return false;
    return tasks.every(t => this.isTaskCompleted(areaId, t.id));
  },

  getAreaProgress(areaId) {
    const tasks = BUILDING_TASKS[areaId];
    if (!tasks) return { done: 0, total: 0 };
    const done = tasks.filter(t => this.isTaskCompleted(areaId, t.id)).length;
    return { done, total: tasks.length };
  },

  _onAreaComplete(areaId) {
    // Unlock next area and trigger dialogue
    const areaIndex = CONFIG.AREAS.findIndex(a => a.id === areaId);
    const nextArea = CONFIG.AREAS[areaIndex + 1];

    if (nextArea && !this.unlockedAreas.includes(nextArea.id)) {
      this.unlockedAreas.push(nextArea.id);
      UI.showToast(`新區域解鎖：${nextArea.name}！`);

      // Unlock next producer
      const producerOrder = Object.values(PRODUCERS)
        .sort((a, b) => a.unlockOrder - b.unlockOrder);
      const nextProducer = producerOrder.find(
        p => !Game.state.unlockedProducers.includes(p.id)
      );
      if (nextProducer) {
        Game.state.unlockedProducers.push(nextProducer.id);
        // Add to active (respecting limit)
        if (Game.state.activeProducers.length < CONFIG.ACTIVE_PRODUCER_LIMIT) {
          Game.state.activeProducers.push(nextProducer.id);
        }
        ProducerSystem.placeProducerOnGrid(nextProducer.id);
        UI.showToast(`新生產者：${nextProducer.name}！`);
      }

      // Trigger dialogue
      const dialogueKeys = {
        market: 'market_unlock',
        fishing: 'fishing_unlock',
        garden: 'garden_unlock',
        tower: 'tower_unlock',
        library: 'library_unlock',
      };
      const dialogueKey = dialogueKeys[nextArea.id];
      if (dialogueKey && !Game.state.dialogue.seen[dialogueKey]) {
        setTimeout(() => {
          DialogueSystem.playDialogue(dialogueKey);
        }, 1000);
      }
    }

    // Area-specific completion dialogue
    if (areaId === 'treehouse' && !Game.state.dialogue.seen['treehouse_complete']) {
      setTimeout(() => {
        DialogueSystem.playDialogue('treehouse_complete');
      }, 500);
    }

    // Check if ALL areas complete
    const allComplete = CONFIG.AREAS.every(a => this.isAreaComplete(a.id));
    if (allComplete && !Game.state.dialogue.seen['ending']) {
      setTimeout(() => {
        DialogueSystem.playDialogue('ending');
      }, 2000);
    }
  },

  renderBuildingView() {
    const titleEl = document.getElementById('building-title');
    const tasksContainer = document.getElementById('building-tasks');
    if (!titleEl || !tasksContainer) return;

    // Area selector + title
    const area = CONFIG.AREAS.find(a => a.id === this.currentArea);
    titleEl.textContent = area ? `${area.icon} ${area.name}` : '星露森林';

    // Render village canvas
    this._renderVillage();

    // Render tasks
    tasksContainer.innerHTML = '';

    // Area tabs
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;';
    for (const a of CONFIG.AREAS) {
      if (!this.unlockedAreas.includes(a.id)) continue;
      const tab = document.createElement('button');
      tab.className = 'toolbar-btn' + (a.id === this.currentArea ? ' active' : '');
      tab.style.cssText = 'font-size:12px;padding:4px 6px;';
      const progress = this.getAreaProgress(a.id);
      tab.textContent = `${a.icon} ${progress.done}/${progress.total}`;
      tab.onclick = () => this.setArea(a.id);
      tabs.appendChild(tab);
    }
    tasksContainer.appendChild(tabs);

    // Task list
    const tasks = BUILDING_TASKS[this.currentArea];
    if (!tasks) return;

    for (const task of tasks) {
      const completed = this.isTaskCompleted(this.currentArea, task.id);
      const el = document.createElement('div');
      el.className = 'building-task' + (completed ? ' completed' : '');

      const info = document.createElement('div');
      info.className = 'task-info';
      info.innerHTML = `
        <div class="task-name">${completed ? '✅' : '🔧'} ${task.name}</div>
        <div class="task-cost">${completed ? '已完成' : `⭐ ${task.starCost}`}</div>
      `;
      el.appendChild(info);

      if (!completed) {
        const btn = document.createElement('button');
        btn.className = 'task-build-btn';
        btn.textContent = '修復';
        btn.disabled = Economy.stars < task.starCost;
        btn.onclick = () => this.buildTask(this.currentArea, task.id);
        el.appendChild(btn);
      }

      tasksContainer.appendChild(el);
    }
  },

  _renderVillage() {
    this._ensureCanvas();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, w, h);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0, '#0a0a2e');
    skyGrad.addColorStop(1, '#1a3a3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Stars
    for (let i = 0; i < 30; i++) {
      const sx = (i * 37 + 13) % w;
      const sy = (i * 23 + 7) % (h * 0.45);
      const brightness = 0.3 + Math.sin(Date.now() / 1000 + i) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      const size = i % 3 === 0 ? 2 : 1;
      ctx.fillRect(sx, sy, size, size);
    }

    // Ground
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Ground texture
    ctx.fillStyle = '#357035';
    for (let i = 0; i < 15; i++) {
      const gx = (i * 47 + 10) % w;
      const gy = h * 0.55 + (i * 19 + 5) % (h * 0.4);
      ctx.fillRect(gx, gy, 3, 1);
    }

    // Calculate building layout based on canvas size
    const colCount = 3;
    const rowCount = 2;
    const margin = w * 0.06;
    const bw = (w - margin * (colCount + 1)) / colCount;
    const bh = bw * 0.75;
    const startY = h * 0.2;
    const rowGap = bh + margin * 1.5;

    for (let i = 0; i < CONFIG.AREAS.length; i++) {
      const area = CONFIG.AREAS[i];
      const col = i % colCount;
      const row = Math.floor(i / colCount);
      const px = margin + col * (bw + margin);
      const py = startY + row * rowGap;

      const unlocked = this.unlockedAreas.includes(area.id);
      const progress = this.getAreaProgress(area.id);
      const completeness = progress.total > 0 ? progress.done / progress.total : 0;

      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.3;

      // Building shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(px + 3, py + 3, bw, bh);

      // Building base
      const r = Math.floor(100 + completeness * 155);
      const g = Math.floor(80 + completeness * 100);
      ctx.fillStyle = unlocked ? `rgb(${r}, ${g}, 60)` : '#333';
      ctx.fillRect(px, py, bw, bh);

      // Roof
      ctx.fillStyle = unlocked ? '#8B4513' : '#222';
      ctx.beginPath();
      ctx.moveTo(px - 4, py);
      ctx.lineTo(px + bw / 2, py - bh * 0.35);
      ctx.lineTo(px + bw + 4, py);
      ctx.fill();

      // Icon
      const iconSize = Math.min(bw, bh) * 0.45;
      ctx.font = `${iconSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(area.icon, px + bw / 2, py + bh / 2);

      // Area name
      ctx.fillStyle = unlocked ? '#e0e0e0' : '#666';
      ctx.font = `${Math.max(9, bw * 0.1)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(area.name, px + bw / 2, py + bh + 12);

      // Progress bar
      if (unlocked) {
        const barY = py + bh + 20;
        const barH = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(px, barY, bw, barH);
        ctx.fillStyle = completeness >= 1 ? '#4ade80' : '#fbbf24';
        ctx.fillRect(px, barY, bw * completeness, barH);
      }

      ctx.restore();
    }
  },

  serialize() {
    return {
      buildings: this.completedTasks,
      unlockedAreas: this.unlockedAreas,
    };
  },
};
