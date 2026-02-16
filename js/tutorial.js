// ===== 教學系統 =====
const TutorialSystem = {
  active: false,
  step: 0,
  completed: false,

  init(savedTutorial) {
    if (savedTutorial) {
      this.completed = savedTutorial.completed || false;
      this.step = savedTutorial.step || 0;
    }

    if (!this.completed) {
      // Start tutorial after a brief delay
      setTimeout(() => this.start(), 500);
    }
  },

  start() {
    if (this.completed) return;
    this.active = true;
    this.step = 0;

    // First show intro dialogue
    if (!Game.state.dialogue.seen['intro']) {
      DialogueSystem.playDialogue('intro');
      // Wait for dialogue to finish, then start tutorial steps
      const checkDialogue = setInterval(() => {
        if (!DialogueSystem.isPlaying) {
          clearInterval(checkDialogue);
          this._showStep();
        }
      }, 200);
    } else {
      this._showStep();
    }
  },

  _showStep() {
    if (this.step >= TUTORIAL_STEPS.length) {
      this.complete();
      return;
    }

    const stepDef = TUTORIAL_STEPS[this.step];
    const overlay = document.getElementById('tutorial-overlay');
    const textBox = document.getElementById('tutorial-text-box');
    const text = document.getElementById('tutorial-text');
    const arrow = document.getElementById('tutorial-arrow');
    const highlight = document.getElementById('tutorial-highlight');
    const nextBtn = document.getElementById('tutorial-next-btn');

    overlay.classList.remove('hidden');
    text.textContent = stepDef.text;

    // Position based on target
    const canvas = document.getElementById('game-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    switch (stepDef.target) {
      case 'producer': {
        // Find first producer on grid
        let producerIdx = -1;
        for (let i = 0; i < Grid.cells.length; i++) {
          if (Grid.cells[i]?.isProducer) { producerIdx = i; break; }
        }
        if (producerIdx >= 0) {
          const { row, col } = Grid.getRowCol(producerIdx);
          const scale = canvasRect.width / CONFIG.CANVAS_WIDTH;
          const hx = canvasRect.left + col * CONFIG.CELL_SIZE * scale;
          const hy = canvasRect.top + row * CONFIG.CELL_SIZE * scale;
          const hw = CONFIG.CELL_SIZE * scale;
          highlight.style.left = `${hx}px`;
          highlight.style.top = `${hy}px`;
          highlight.style.width = `${hw}px`;
          highlight.style.height = `${hw}px`;
          highlight.style.display = 'block';

          arrow.textContent = '👆';
          arrow.style.left = `${hx + hw / 2 - 12}px`;
          arrow.style.top = `${hy + hw + 4}px`;
          arrow.style.display = 'block';
        }
        textBox.style.bottom = '100px';
        textBox.style.left = '20px';
        textBox.style.top = 'auto';
        break;
      }
      case 'grid':
        highlight.style.display = 'none';
        arrow.style.display = 'none';
        textBox.style.top = '60px';
        textBox.style.left = '20px';
        textBox.style.bottom = 'auto';
        break;
      case 'orders': {
        const btn = document.getElementById('btn-orders');
        if (btn) {
          const r = btn.getBoundingClientRect();
          highlight.style.left = `${r.left}px`;
          highlight.style.top = `${r.top}px`;
          highlight.style.width = `${r.width}px`;
          highlight.style.height = `${r.height}px`;
          highlight.style.display = 'block';
          arrow.textContent = '👇';
          arrow.style.left = `${r.left + r.width / 2 - 12}px`;
          arrow.style.top = `${r.top - 30}px`;
          arrow.style.display = 'block';
        }
        textBox.style.bottom = '80px';
        textBox.style.left = '20px';
        textBox.style.top = 'auto';
        break;
      }
      case 'build': {
        const btn = document.getElementById('btn-build');
        if (btn) {
          const r = btn.getBoundingClientRect();
          highlight.style.left = `${r.left}px`;
          highlight.style.top = `${r.top}px`;
          highlight.style.width = `${r.width}px`;
          highlight.style.height = `${r.height}px`;
          highlight.style.display = 'block';
          arrow.textContent = '👇';
          arrow.style.left = `${r.left + r.width / 2 - 12}px`;
          arrow.style.top = `${r.top - 30}px`;
          arrow.style.display = 'block';
        }
        textBox.style.bottom = '80px';
        textBox.style.left = '20px';
        textBox.style.top = 'auto';
        break;
      }
    }

    // For action-based steps, user needs to perform the action
    // For now, just use "next" button
    nextBtn.onclick = () => this.nextStep();
  },

  nextStep() {
    this.step++;
    if (this.step >= TUTORIAL_STEPS.length) {
      this.complete();
    } else {
      this._showStep();
    }
  },

  complete() {
    this.active = false;
    this.completed = true;
    document.getElementById('tutorial-overlay').classList.add('hidden');
    Game.state.tutorial = { completed: true, step: this.step };
    SaveSystem.save(Game.getState());
    UI.showToast('教學完成！開始你的冒險吧！');
  },

  serialize() {
    return { completed: this.completed, step: this.step };
  },
};
