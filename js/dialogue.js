// ===== 對話系統 =====
const DialogueSystem = {
  currentDialogue: null,
  currentIndex: 0,
  isPlaying: false,
  _typewriterTimer: null,

  init() {
    const overlay = document.getElementById('dialogue-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.advance());
    }
  },

  playDialogue(dialogueId) {
    const script = DIALOGUES[dialogueId];
    if (!script || script.length === 0) return;

    this.currentDialogue = { id: dialogueId, script };
    this.currentIndex = 0;
    this.isPlaying = true;

    document.getElementById('dialogue-overlay').classList.remove('hidden');
    this._showLine();
  },

  _showLine() {
    if (!this.currentDialogue) return;
    const line = this.currentDialogue.script[this.currentIndex];
    if (!line) {
      this.close();
      return;
    }

    const npc = NPCS[line.npc] || { name: '???', emoji: '❓' };
    const portrait = document.getElementById('dialogue-portrait');
    const name = document.getElementById('dialogue-name');
    const text = document.getElementById('dialogue-text');

    portrait.textContent = npc.emoji;
    name.textContent = npc.name;

    // Typewriter effect
    text.textContent = '';
    this._typewrite(text, line.text, 0);
  },

  _typewrite(el, fullText, charIndex) {
    if (this._typewriterTimer) clearTimeout(this._typewriterTimer);
    if (charIndex >= fullText.length) return;

    el.textContent = fullText.substring(0, charIndex + 1);
    this._typewriterTimer = setTimeout(() => {
      this._typewrite(el, fullText, charIndex + 1);
    }, 30);
  },

  advance() {
    if (!this.isPlaying || !this.currentDialogue) return;

    const text = document.getElementById('dialogue-text');
    const line = this.currentDialogue.script[this.currentIndex];

    // If still typing, show full text
    if (text && line && text.textContent.length < line.text.length) {
      if (this._typewriterTimer) clearTimeout(this._typewriterTimer);
      text.textContent = line.text;
      return;
    }

    // Advance to next line
    this.currentIndex++;
    if (this.currentIndex >= this.currentDialogue.script.length) {
      this.close();
    } else {
      this._showLine();
    }
  },

  close() {
    if (this._typewriterTimer) clearTimeout(this._typewriterTimer);

    if (this.currentDialogue) {
      Game.state.dialogue.seen[this.currentDialogue.id] = true;
    }

    this.isPlaying = false;
    this.currentDialogue = null;
    this.currentIndex = 0;

    document.getElementById('dialogue-overlay').classList.add('hidden');
  },
};
