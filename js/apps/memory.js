/* ===== Memory Card Game ===== */
OS.registerApp('memory', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'memory',
      title: 'Memory Match',
      icon: '🃏',
      width: 480,
      height: 520,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="memory-wrap">
      <div class="memory-info">
        <span>Moves: <b id="mem-moves">0</b></span>
        <span>Pairs: <b id="mem-pairs">0</b>/8</span>
        <span>Time: <b id="mem-time">0s</b></span>
      </div>
      <div id="memory-grid"></div>
      <div class="memory-msg" id="mem-msg"></div>
      <button class="memory-btn" onclick="MemoryApp.newGame()">🔀 New Game</button>
    </div>`;
  },

  onOpen() { MemoryApp.init(); },
  onClose() { MemoryApp.stop(); },
});

const MemoryApp = (() => {
  const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮'];
  let cards = [], flipped = [], matched = 0, moves = 0, locked = false;
  let timerInterval = null, elapsed = 0;

  function init() {
    setTimeout(() => newGame(), 50);
  }

  function stop() {
    if (timerInterval) clearInterval(timerInterval);
  }

  function newGame() {
    if (timerInterval) clearInterval(timerInterval);
    matched = 0; moves = 0; locked = false; elapsed = 0;
    flipped = [];

    const pairs = EMOJIS.slice(0, 8);
    cards = shuffle([...pairs, ...pairs]);

    const grid = document.getElementById('memory-grid');
    const msgEl = document.getElementById('mem-msg');
    if (!grid) return;
    if (msgEl) msgEl.textContent = '';

    grid.innerHTML = '';
    cards.forEach((emoji, i) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.dataset.idx = i;
      card.innerHTML = `<span class="card-face" style="display:none">${emoji}</span>`;
      card.onclick = () => flip(card, i, emoji);
      grid.appendChild(card);
    });

    updateUI();
    timerInterval = setInterval(() => {
      elapsed++;
      const t = document.getElementById('mem-time');
      if (t) t.textContent = elapsed + 's';
    }, 1000);
  }

  function flip(card, idx, emoji) {
    if (locked || flipped.includes(idx) || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    card.querySelector('.card-face').style.display = '';
    flipped.push(idx);

    if (flipped.length === 2) {
      moves++;
      updateUI();
      locked = true;

      const [i1, i2] = flipped;
      const el1 = document.querySelector(`.mem-card[data-idx="${i1}"]`);
      const el2 = document.querySelector(`.mem-card[data-idx="${i2}"]`);

      if (cards[i1] === cards[i2] && i1 !== i2) {
        // Match!
        setTimeout(() => {
          el1.classList.add('matched');
          el2.classList.add('matched');
          matched++;
          flipped = [];
          locked = false;
          updateUI();
          if (matched === 8) {
            clearInterval(timerInterval);
            const msgEl = document.getElementById('mem-msg');
            if (msgEl) msgEl.textContent = `🎉 You won in ${moves} moves & ${elapsed}s!`;
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          el1.classList.remove('flipped');
          el2.classList.remove('flipped');
          el1.querySelector('.card-face').style.display = 'none';
          el2.querySelector('.card-face').style.display = 'none';
          flipped = [];
          locked = false;
        }, 900);
      }
    }
  }

  function updateUI() {
    const movEl = document.getElementById('mem-moves');
    const pairEl = document.getElementById('mem-pairs');
    if (movEl) movEl.textContent = moves;
    if (pairEl) pairEl.textContent = matched;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return { init, stop, newGame };
})();
