// ===== 網格系統 =====
const Grid = {
  cols: CONFIG.GRID_COLS,
  rows: CONFIG.GRID_ROWS,
  cells: [], // flat array [row * cols + col] = GameItem | null
  cellStates: [], // 'empty' | 'occupied' | 'locked'

  init(savedGrid, cobwebs) {
    const total = this.cols * this.rows;
    this.cells = new Array(total).fill(null);
    this.cellStates = new Array(total).fill('empty');

    // Apply cobwebs (locked cells)
    if (cobwebs && cobwebs.length > 0) {
      for (const [row, col] of cobwebs) {
        const idx = row * this.cols + col;
        if (idx >= 0 && idx < total) {
          this.cellStates[idx] = 'locked';
        }
      }
    }

    // Restore saved items
    if (savedGrid && savedGrid.length > 0) {
      for (let i = 0; i < Math.min(savedGrid.length, total); i++) {
        if (savedGrid[i]) {
          this.cells[i] = GameItem.deserialize(savedGrid[i]);
          if (this.cells[i]) {
            this.cellStates[i] = 'occupied';
          }
        }
      }
    }
  },

  getIndex(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return row * this.cols + col;
  },

  getRowCol(index) {
    return { row: Math.floor(index / this.cols), col: index % this.cols };
  },

  getItem(row, col) {
    const idx = this.getIndex(row, col);
    return idx >= 0 ? this.cells[idx] : null;
  },

  getItemByIndex(idx) {
    return idx >= 0 && idx < this.cells.length ? this.cells[idx] : null;
  },

  setItem(row, col, item) {
    const idx = this.getIndex(row, col);
    if (idx < 0) return false;
    if (this.cellStates[idx] === 'locked') return false;
    this.cells[idx] = item;
    this.cellStates[idx] = item ? 'occupied' : 'empty';
    return true;
  },

  setItemByIndex(idx, item) {
    if (idx < 0 || idx >= this.cells.length) return false;
    if (this.cellStates[idx] === 'locked') return false;
    this.cells[idx] = item;
    this.cellStates[idx] = item ? 'occupied' : 'empty';
    return true;
  },

  removeItem(row, col) {
    return this.setItem(row, col, null);
  },

  removeItemByIndex(idx) {
    return this.setItemByIndex(idx, null);
  },

  isLocked(row, col) {
    const idx = this.getIndex(row, col);
    return idx >= 0 && this.cellStates[idx] === 'locked';
  },

  isEmpty(row, col) {
    const idx = this.getIndex(row, col);
    return idx >= 0 && this.cellStates[idx] === 'empty';
  },

  isOccupied(row, col) {
    const idx = this.getIndex(row, col);
    return idx >= 0 && this.cellStates[idx] === 'occupied';
  },

  findEmptyCell() {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cellStates[i] === 'empty') return i;
    }
    return -1;
  },

  findEmptyCellNear(row, col) {
    // Search in expanding rings around the target
    for (let dist = 0; dist <= Math.max(this.rows, this.cols); dist++) {
      for (let dr = -dist; dr <= dist; dr++) {
        for (let dc = -dist; dc <= dist; dc++) {
          if (Math.abs(dr) !== dist && Math.abs(dc) !== dist) continue;
          const r = row + dr, c = col + dc;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            if (this.isEmpty(r, c)) return this.getIndex(r, c);
          }
        }
      }
    }
    return -1;
  },

  getEmptyCellCount() {
    return this.cellStates.filter(s => s === 'empty').length;
  },

  // Try to unlock a cobweb cell adjacent to a merge
  tryUnlockCobweb(row, col, gameState) {
    const neighbors = [
      [row - 1, col], [row + 1, col],
      [row, col - 1], [row, col + 1],
    ];
    const unlocked = [];
    for (const [nr, nc] of neighbors) {
      if (this.isLocked(nr, nc)) {
        const idx = this.getIndex(nr, nc);
        this.cellStates[idx] = 'empty';
        // Remove from cobwebs in state
        if (gameState && gameState.cobwebs) {
          gameState.cobwebs = gameState.cobwebs.filter(
            ([r, c]) => !(r === nr && c === nc)
          );
        }
        unlocked.push({ row: nr, col: nc });
      }
    }
    return unlocked;
  },

  // Serialize grid for saving
  serialize() {
    return this.cells.map(item => item ? item.serialize() : null);
  },

  // Get pixel position of a cell for canvas rendering
  getCellRect(row, col, cellSize) {
    const x = col * cellSize;
    const y = row * cellSize;
    return { x, y, w: cellSize, h: cellSize };
  },

  // Hit test: which cell is at canvas pixel (px, py)?
  hitTest(px, py, cellSize) {
    const col = Math.floor(px / cellSize);
    const row = Math.floor(py / cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;
    return this.getIndex(row, col);
  },
};
