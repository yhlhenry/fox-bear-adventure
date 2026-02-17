// ===== 像素風渲染引擎 =====
const Renderer = {
  canvas: null,
  ctx: null,
  cellSize: 40,
  canvasW: 280,
  canvasH: 360,
  offsetY: 0, // vertical offset to center grid
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

    // Cell size determined by width (fill horizontally)
    this.cellSize = Math.floor(availWidth / CONFIG.GRID_COLS);
    CONFIG.CELL_SIZE = this.cellSize;

    const gridW = this.cellSize * CONFIG.GRID_COLS;
    const gridH = this.cellSize * CONFIG.GRID_ROWS;

    // Canvas fills all available space
    this.canvasW = availWidth;
    this.canvasH = availHeight;

    // Center grid vertically within canvas
    this.offsetY = Math.max(0, Math.floor((availHeight - gridH) / 2));

    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
    this.canvas.style.width = `${this.canvasW}px`;
    this.canvas.style.height = `${this.canvasH}px`;

    this.ctx.imageSmoothingEnabled = false;
  },

  // Convert canvas pixel to grid-local pixel (accounting for offset)
  canvasToGrid(px, py) {
    return { x: px, y: py - this.offsetY };
  },

  // Convert grid-local pixel to canvas pixel
  gridToCanvas(gx, gy) {
    return { x: gx, y: gy + this.offsetY };
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

    // Background - forest theme
    ctx.fillStyle = '#0f1f0f';
    ctx.fillRect(0, 0, w, h);

    // Decorative area above grid
    if (this.offsetY > 0) {
      this._drawDecoTop(ctx, w, this.offsetY);
    }

    // Translate for grid drawing
    ctx.save();
    ctx.translate(0, this.offsetY);

    this._drawGrid(ctx);
    this._drawItems(ctx);
    this._drawBubbles(ctx);

    MergeSystem.updateAnimations();
    MergeSystem.renderAnimations(ctx);
    MergeSystem.renderDragGhost(ctx);

    ctx.restore();

    // Decorative area below grid
    const gridBottom = this.offsetY + this.cellSize * CONFIG.GRID_ROWS;
    if (gridBottom < h) {
      this._drawDecoBottom(ctx, w, gridBottom, h - gridBottom);
    }
  },

  _drawDecoTop(ctx, w, h) {
    // Dark forest canopy
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a150a');
    grad.addColorStop(1, '#1e3a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Tree silhouettes
    ctx.fillStyle = '#0d1f0d';
    const treeW = 30;
    for (let i = 0; i < w; i += treeW + 10) {
      const th = h * (0.4 + Math.sin(i * 0.1) * 0.2);
      // Triangle tree
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + treeW / 2, h - th);
      ctx.lineTo(i + treeW, h);
      ctx.fill();
    }
  },

  _drawDecoBottom(ctx, w, startY, h) {
    // Forest floor
    const grad = ctx.createLinearGradient(0, startY, 0, startY + h);
    grad.addColorStop(0, '#1e3a1e');
    grad.addColorStop(1, '#0a150a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, startY, w, h);

    // Grass tufts
    ctx.fillStyle = '#2d5a2d';
    for (let i = 0; i < w; i += 15) {
      const gh = 3 + Math.sin(i * 0.3) * 2;
      ctx.fillRect(i, startY, 2, gh);
      ctx.fillRect(i + 5, startY, 1, gh * 0.7);
    }
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
