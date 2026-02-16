// ===== 像素風渲染引擎 =====
const Renderer = {
  canvas: null,
  ctx: null,
  cellSize: 40,
  canvasW: 280,
  canvasH: 360,
  animFrame: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  },

  _resize() {
    const container = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    const bottomBar = document.getElementById('bottom-bar');

    const availWidth = container.clientWidth;
    const availHeight = container.clientHeight
      - (topBar?.offsetHeight || 0)
      - (bottomBar?.offsetHeight || 0);

    // Calculate cell size to fill available space
    const cellByWidth = Math.floor(availWidth / CONFIG.GRID_COLS);
    const cellByHeight = Math.floor(availHeight / CONFIG.GRID_ROWS);
    this.cellSize = Math.min(cellByWidth, cellByHeight);

    // Update the global CONFIG so other systems use the same value
    CONFIG.CELL_SIZE = this.cellSize;

    this.canvasW = this.cellSize * CONFIG.GRID_COLS;
    this.canvasH = this.cellSize * CONFIG.GRID_ROWS;

    // Set canvas internal resolution to match exactly
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;

    // CSS size = same as internal (1:1 pixel on screen)
    this.canvas.style.width = `${this.canvasW}px`;
    this.canvas.style.height = `${this.canvasH}px`;

    this.ctx.imageSmoothingEnabled = false;
  },

  startLoop() {
    const loop = () => {
      this.render();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  },

  stopLoop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvasW;
    const h = this.canvasH;

    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, w, h);

    this._drawGrid(ctx);
    this._drawItems(ctx);
    this._drawBubbles(ctx);

    MergeSystem.updateAnimations();
    MergeSystem.renderAnimations(ctx);
    MergeSystem.renderDragGhost(ctx);
  },

  _drawGrid(ctx) {
    const cs = this.cellSize;

    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const x = col * cs;
        const y = row * cs;
        const idx = Grid.getIndex(row, col);

        if (Grid.cellStates[idx] === 'locked') {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x, y, cs, cs);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + cs, y + cs);
          ctx.moveTo(x + cs, y); ctx.lineTo(x, y + cs);
          ctx.moveTo(x + cs / 2, y); ctx.lineTo(x + cs / 2, y + cs);
          ctx.moveTo(x, y + cs / 2); ctx.lineTo(x + cs, y + cs / 2);
          ctx.stroke();
          ctx.font = `${cs * 0.4}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#555';
          ctx.fillText('🕸️', x + cs / 2, y + cs / 2);
        } else {
          ctx.fillStyle = '#254025';
          ctx.fillRect(x, y, cs, cs);
        }

        ctx.strokeStyle = '#2d5a2d';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);

        if (MergeSystem.isDragging && idx === MergeSystem.dragSourceIndex) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }
  },

  _drawItems(ctx) {
    const cs = this.cellSize;

    for (let i = 0; i < Grid.cells.length; i++) {
      const item = Grid.cells[i];
      if (!item) continue;
      if (MergeSystem.isDragging && i === MergeSystem.dragSourceIndex) continue;

      const { row, col } = Grid.getRowCol(i);
      const x = col * cs;
      const y = row * cs;
      const cx = x + cs / 2;
      const cy = y + cs / 2;

      // Bubble effect
      if (item.state === 'bubble') {
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 300) * 0.2;
        ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, cs * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      let emoji, fontSize;
      if (item.isProducer) {
        const def = PRODUCERS[item.producerId];
        emoji = def ? def.emoji : '?';
        fontSize = cs * 0.55;

        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 4 + Math.sin(Date.now() / 500) * 2;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        ctx.restore();

        const info = ProducerSystem.getBufferInfo(item.producerId);
        if (info) {
          const barW = cs - 8;
          const barH = Math.max(3, cs * 0.06);
          const barX = x + 4;
          const barY = y + cs - barH - 3;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(barX, barY, barW, barH);
          const pct = info.remaining / info.total;
          ctx.fillStyle = info.cooldownRemaining > 0 ? '#ef4444' : '#4ade80';
          ctx.fillRect(barX, barY, barW * pct, barH);
        }
      } else {
        emoji = item.getEmoji();
        fontSize = cs * 0.5;
      }

      ctx.font = `${fontSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, cx, cy);

      // Level badge
      if (!item.isProducer && item.level > 0) {
        const badgeS = Math.max(12, cs * 0.25);
        const badgeX = x + cs - badgeS - 1;
        const badgeY = y + 1;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(badgeX, badgeY, badgeS, badgeS);
        ctx.fillStyle = '#fff';
        ctx.font = `${badgeS * 0.7}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.level, badgeX + badgeS / 2, badgeY + badgeS / 2);
      }
    }
  },

  _drawBubbles(ctx) {
    const cs = this.cellSize;
    const now = Date.now();

    for (let i = 0; i < Grid.cells.length; i++) {
      const item = Grid.cells[i];
      if (!item || item.state !== 'bubble') continue;

      const remaining = Math.max(0, item.bubbleExpiry - now);
      if (remaining <= 0) {
        Grid.removeItemByIndex(i);
        Economy.addCoins(1);
        continue;
      }

      const { row, col } = Grid.getRowCol(i);
      const x = col * cs + cs / 2;
      const y = row * cs + cs - 4;
      const seconds = Math.ceil(remaining / 1000);

      ctx.fillStyle = '#ef4444';
      ctx.font = `${Math.max(8, cs * 0.18)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${seconds}s`, x, y);
    }
  },
};
