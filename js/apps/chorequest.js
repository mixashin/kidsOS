/* ===== ChoreQuest — Daily Checklist App ===== */
(() => {
  /* ---- Data Constants ---- */
  const CHORES = [
    { id: 'brush-am',  emoji: '🪥', name: 'Brush teeth (morning)', hint: '2 minutes, all corners!', group: 'Morning' },
    { id: 'wash-face', emoji: '🧼', name: 'Wash face',             hint: 'Splash splash, nice and fresh!', group: 'Morning' },
    { id: 'make-bed',  emoji: '🛏️', name: 'Make bed',              hint: 'Blanket flat-ish. Good enough.', group: 'Morning' },
    { id: 'dressed',   emoji: '👕', name: 'Get dressed',           hint: 'Matching socks = bonus points.', group: 'Morning' },
    { id: 'pack-bag',  emoji: '🎒', name: 'Pack school bag',       hint: 'Books, lunch, homework — triple check!', group: 'Morning' },
    { id: 'homework',  emoji: '📚', name: 'Homework',              hint: 'Brain power: activated!', group: 'After School' },
    { id: 'tidy-toys', emoji: '🧸', name: 'Tidy toys (5 min)',     hint: 'Set the timer, beat the clock!', group: 'After School', timer: 300 },
    { id: 'brush-pm',  emoji: '🪥', name: 'Brush teeth (evening)', hint: 'Yes, again. Teeth need friends.', group: 'Evening' },
    { id: 'pajamas',   emoji: '🌙', name: 'Pajamas + bedtime routine', hint: 'PJs on, story time, zzz.', group: 'Evening' },
  ];

  const COMPLIMENTS = [
    'Certified Responsible Human ✅',
    'Wow. You did the stuff.',
    'Your future self is high-fiving you.',
    'Legend. Absolute legend.',
    'Achievement Unlocked: Adult-Level Responsible',
    'You crushed it like a chore-crushing machine!',
    'Mom/Dad are secretly impressed.',
    "Today's quests? DEMOLISHED.",
    "If chores were a sport, you'd be MVP.",
    'Give yourself a round of applause. Seriously.',
  ];

  const STICKERS = [
    { id: 'tooth',   emoji: '🦷', name: 'Tooth Hero' },
    { id: 'bed',     emoji: '🛏️', name: 'Bed Boss' },
    { id: 'homework',emoji: '📚', name: 'Homework Wizard' },
    { id: 'tidy',    emoji: '🧹', name: 'Tidy Tornado' },
    { id: 'star',    emoji: '⭐', name: 'Super Star Kid' },
    { id: 'trophy',  emoji: '🏆', name: 'Chore Champion' },
    { id: 'hero',    emoji: '🦸', name: 'Responsibility Hero' },
    { id: 'quest',   emoji: '🎯', name: 'Quest Crusher' },
  ];

  const STORAGE_KEY = 'kidsOS_chorequest';
  const GROUPS = ['Morning', 'After School', 'Evening'];

  /* ---- State ---- */
  let screen = 'today';      // 'today' | 'victory'
  let data = null;            // persisted data
  let timerActive = false;
  let timerChoreId = null;
  let timerSeconds = 0;
  let timerInterval = null;
  let expandedHints = {};     // choreId -> bool
  let winId = null;

  /* ---- Persistence ---- */
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function initData() {
    const saved = loadData();
    const today = new Date().toISOString().slice(0, 10);
    if (!saved) {
      data = {
        lastResetDate: today,
        checkedItems: [],
        streak: 0,
        bestStreak: 0,
        stickers: [],
        totalDaysCompleted: 0,
      };
      saveData();
      return;
    }
    data = saved;
    // Daily reset check
    if (data.lastResetDate !== today) {
      const allDoneYesterday = data.checkedItems.length >= CHORES.length;
      if (allDoneYesterday) {
        data.streak++;
        if (data.streak > data.bestStreak) data.bestStreak = data.streak;
      } else {
        data.streak = 0;
      }
      data.checkedItems = [];
      data.lastResetDate = today;
      saveData();
    }
  }

  /* ---- Timer ---- */
  function startTimer(choreId) {
    const chore = CHORES.find(c => c.id === choreId);
    if (!chore || !chore.timer) return;
    timerActive = true;
    timerChoreId = choreId;
    timerSeconds = chore.timer;
    render();
    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) {
        stopTimer();
        markDone(choreId);
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActive = false;
    timerChoreId = null;
    timerSeconds = 0;
  }

  function updateTimerDisplay() {
    const el = document.getElementById('cq-timer-display');
    if (el) {
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /* ---- Actions ---- */
  function markDone(choreId) {
    if (!data.checkedItems.includes(choreId)) {
      data.checkedItems.push(choreId);
      saveData();
    }
    // Check if all done
    if (data.checkedItems.length >= CHORES.length) {
      // Award sticker
      const dayIndex = data.totalDaysCompleted % STICKERS.length;
      const sticker = STICKERS[dayIndex];
      if (!data.stickers.includes(sticker.id)) {
        data.stickers.push(sticker.id);
      }
      data.totalDaysCompleted++;
      saveData();
      screen = 'victory';
    }
    render();
  }

  function toggleHint(choreId) {
    expandedHints[choreId] = !expandedHints[choreId];
    render();
  }

  /* ---- Render ---- */
  function render() {
    const container = document.getElementById('cq-app');
    if (!container) return;
    if (screen === 'victory') {
      container.innerHTML = renderVictory();
    } else {
      container.innerHTML = renderToday();
    }
  }

  function renderToday() {
    const doneCount = data.checkedItems.length;
    const total = CHORES.length;
    const pct = Math.round((doneCount / total) * 100);

    let html = `<div class="cq-header">
      <div class="cq-title">✅ Today's Quest List</div>
      ${data.streak > 0 ? `<div class="cq-streak">🔥 ${data.streak} day${data.streak > 1 ? 's' : ''}</div>` : ''}
    </div>`;

    // Progress bar
    html += `<div class="cq-progress-wrap">
      <div class="cq-progress">
        <div class="cq-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="cq-progress-text">${doneCount}/${total} done</div>
    </div>`;

    // Timer overlay
    if (timerActive) {
      html += `<div class="cq-timer">
        <div class="cq-timer-emoji">🧸</div>
        <div class="cq-timer-label">Tidy Time!</div>
        <div class="cq-timer-display" id="cq-timer-display">${formatTime(timerSeconds)}</div>
        <div class="cq-timer-hint">Clean up before the clock runs out!</div>
        <button class="cq-timer-cancel" onclick="window._cqCancelTimer()">Cancel</button>
      </div>`;
    }

    // Chore groups
    for (const group of GROUPS) {
      const chores = CHORES.filter(c => c.group === group);
      html += `<div class="cq-section">
        <div class="cq-section-title">${group === 'Morning' ? '🌅' : group === 'After School' ? '🏠' : '🌙'} ${group}</div>`;
      for (const chore of chores) {
        const isDone = data.checkedItems.includes(chore.id);
        const hintOpen = expandedHints[chore.id];
        html += `<div class="cq-chore ${isDone ? 'cq-chore-done' : ''}">
          <div class="cq-chore-main">
            <span class="cq-chore-emoji">${chore.emoji}</span>
            <div class="cq-chore-info">
              <div class="cq-chore-name">${isDone ? '✅ ' : ''}${chore.name}</div>
              ${hintOpen ? `<div class="cq-chore-hint">${chore.hint}</div>` : ''}
            </div>
            <div class="cq-chore-actions">
              ${isDone ? '<span class="cq-check-mark">✔️</span>' :
                chore.timer && !timerActive
                  ? `<button class="cq-timer-btn" onclick="window._cqStartTimer('${chore.id}')">⏱️ Timer</button>`
                  : !timerActive
                    ? `<button class="cq-done-btn" onclick="window._cqDone('${chore.id}')">DONE!</button>`
                    : ''}
            </div>
          </div>
          ${!isDone ? `<button class="cq-hint-toggle" onclick="window._cqHint('${chore.id}')">${hintOpen ? 'Hide hint' : '💡 Hint'}</button>` : ''}
        </div>`;
      }
      html += `</div>`;
    }

    // Footer with sticker count
    html += `<div class="cq-footer">
      <div class="cq-sticker-count">🏆 Stickers earned: ${data.stickers.length}/${STICKERS.length}</div>
      ${data.streak === 0 && data.totalDaysCompleted > 0 ? `<div class="cq-streak-msg">No worries. Today is a fresh start! 🌅</div>` : ''}
      ${data.streak > 0 ? `<div class="cq-streak-msg">🔥 ${data.streak} day${data.streak > 1 ? 's' : ''} in a row! Keep it going!</div>` : ''}
      ${data.bestStreak > 0 ? `<div class="cq-best-streak">Best streak: ${data.bestStreak} day${data.bestStreak > 1 ? 's' : ''}</div>` : ''}
    </div>`;

    return html;
  }

  function renderVictory() {
    const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    const stickerIdx = (data.totalDaysCompleted - 1) % STICKERS.length;
    const sticker = STICKERS[stickerIdx];

    // Generate confetti emojis
    const confettiEmojis = ['🎉', '⭐', '🏆', '✅', '🎊', '💪', '🌟', '🦸'];
    let confettiHTML = '';
    for (let i = 0; i < 20; i++) {
      const emoji = confettiEmojis[i % confettiEmojis.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const dur = 2 + Math.random() * 2;
      confettiHTML += `<span class="cq-confetti-piece" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s">${emoji}</span>`;
    }

    return `<div class="cq-victory">
      <div class="cq-confetti">${confettiHTML}</div>
      <div class="cq-stamp">🏆 DAILY WIN!</div>
      <div class="cq-compliment">${compliment}</div>
      <div class="cq-sticker-earned">
        <div class="cq-sticker-earned-label">Sticker of the Day:</div>
        <div class="cq-sticker-earned-icon">${sticker.emoji}</div>
        <div class="cq-sticker-earned-name">${sticker.name}</div>
      </div>
      <div class="cq-victory-streak">
        ${data.streak > 0 ? `🔥 ${data.streak} day streak!` : 'First win! Start a streak tomorrow!'}
      </div>
      <div class="cq-victory-total">Total days completed: ${data.totalDaysCompleted}</div>
      <button class="cq-victory-btn" onclick="window._cqBackToToday()">See you tomorrow! 👋</button>
    </div>`;
  }

  /* ---- Global Handlers ---- */
  window._cqDone = (id) => markDone(id);
  window._cqHint = (id) => toggleHint(id);
  window._cqStartTimer = (id) => startTimer(id);
  window._cqCancelTimer = () => { stopTimer(); render(); };
  window._cqBackToToday = () => { screen = 'today'; render(); };

  /* ---- App Registration ---- */
  OS.registerApp('chorequest', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'chorequest-' + Date.now(),
        title: 'ChoreQuest',
        icon: '✅',
        width: 400,
        height: 520,
        content: this.getHTML(),
      };
    },
    getHTML() {
      return '<div id="cq-app" class="cq-wrap"></div>';
    },
    onOpen(id) {
      winId = id;
      screen = 'today';
      expandedHints = {};
      stopTimer();
      initData();
      render();
    },
    onClose() {
      stopTimer();
      winId = null;
    },
  });
})();
