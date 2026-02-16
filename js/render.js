// ===== 像素風渲染引擎 =====
const Renderer = {
  canvas: null,
  ctx: null,
  scale: 1,
  animFrame: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Set internal resolution
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    // Pixelated rendering
    this.ctx.imageSmoothingEnabled = false;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  },

  _resize() {
    const container = document.getElementById('game-container');
    const topBar = document.getElementById('top-bar');
    const bottomBar = document.getElementById('bottom-bar');

    const availWidth = container.clientWidth;
    const availHeight = container.clientHeight - (topBar?.offsetHeight || 0) - (bottomBar?.offsetHeight || 0);

    // Maintain aspect ratio
    const aspectRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
    let w = availWidth;
    let h = w / aspectRatio;

    if (h > availHeight) {
      h = availHeight;
      w = h * aspectRatio;
    }

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.scale = w / CONFIG.CANVAS_WIDTH;
  },

  startLoop() {
    const loop = () => {
      this.render();
      this.animFrame = requestAnimationFrame(loop);
    };
    loop();
  },

  stopLoop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
  },

  render() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;

    // Clear
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    this._drawGrid(ctx);

    // Draw items
    this._drawItems(ctx);

    // Draw bubble timers
    this._drawBubbles(ctx);

    // Draw animations
    MergeSystem.updateAnimations();
    MergeSystem.renderAnimations(ctx);

    // Draw drag ghost
    MergeSystem.renderDragGhost(ctx);
  },

  _drawGrid(ctx) {
    const cs = CONFIG.CELL_SIZE;

    for (let row = 0; row < Grid.rows; row++) {
      for (let col = 0; col < Grid.cols; col++) {
        const x = col * cs;
        const y = row * cs;
        const idx = Grid.getIndex(row, col);

        // Cell background
        if (Grid.cellStates[idx] === 'locked') {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(x, y, cs, cs);
          // Cobweb pattern
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cs, y + cs);
          ctx.moveTo(x + cs, y);
          ctx.lineTo(x, y + cs);
          ctx.moveTo(x + cs / 2, y);
          ctx.lineTo(x + cs / 2, y + cs);
          ctx.moveTo(x, y + cs / 2);
          ctx.lineTo(x + cs, y + cs / 2);
          ctx.stroke();
          // Lock icon
          ctx.font = '12px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#555';
          ctx.fillText('🕸️', x + cs / 2, y + cs / 2);
        } else {
          ctx.fillStyle = '#254025';
          ctx.fillRect(x, y, cs, cs);
        }

        // Grid lines
        ctx.strokeStyle = '#2d5a2d';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);

        // Highlight for drag source (dimmed)
        if (MergeSystem.isDragging && idx === MergeSystem.dragSourceIndex) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }
  },

  _drawItems(ctx) {
    const cs = CONFIG.CELL_SIZE;

    for (let i = 0; i < Grid.cells.length; i++) {
      const item = Grid.cells[i];
      if (!item) continue;

      // Skip dragged item at source (it's rendered as ghost)
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

      // Draw emoji
      let emoji, fontSize;
      if (item.isProducer) {
        const def = PRODUCERS[item.producerId];
        emoji = def ? def.emoji : '?';
        fontSize = cs * 0.55;

        // Producer glow
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 4 + Math.sin(Date.now() / 500) * 2;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        ctx.restore();

        // Buffer indicator
        const info = ProducerSystem.getBufferInfo(item.producerId);
        if (info) {
          const barW = cs - 8;
          const barH = 3;
          const barX = x + 4;
          const barY = y + cs - 6;
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

      // Level badge (non-producer only)
      if (!item.isProducer && item.level > 0) {
        const badgeX = x + cs - 10;
        const badgeY = y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(badgeX, badgeY, 10, 10);
        ctx.fillStyle = '#fff';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.level, badgeX + 5, badgeY + 5);
      }
    }
  },

  _drawBubbles(ctx) {
    const cs = CONFIG.CELL_SIZE;
    const now = Date.now();

    for (let i = 0; i < Grid.cells.length; i++) {
      const item = Grid.cells[i];
      if (!item || item.state !== 'bubble') continue;

      const remaining = Math.max(0, item.bubbleExpiry - now);
      if (remaining <= 0) {
        // Bubble expired - convert to small reward
        Grid.removeItemByIndex(i);
        Economy.addCoins(1);
        continue;
      }

      const { row, col } = Grid.getRowCol(i);
      const x = col * cs + cs / 2;
      const y = row * cs + cs - 4;
      const seconds = Math.ceil(remaining / 1000);

      ctx.fillStyle = '#ef4444';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${seconds}s`, x, y);
    }
  },
};
