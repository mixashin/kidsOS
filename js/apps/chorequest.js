/* ===== ChoreQuest — Daily Checklist App ===== */
(() => {
  /* ---- Chore Catalog (30 chores) ---- */
  const ALL_CHORES = [
    // Morning
    { id: 'brush-am',    emoji: '🪥', name: 'Brush teeth (morning)', hint: '2 minutes, all corners!', group: 'Morning' },
    { id: 'wash-face',   emoji: '🧼', name: 'Wash face',             hint: 'Splash splash, nice and fresh!', group: 'Morning' },
    { id: 'make-bed',    emoji: '🛏️', name: 'Make bed',              hint: 'Blanket flat-ish. Good enough.', group: 'Morning' },
    { id: 'dressed',     emoji: '👕', name: 'Get dressed',           hint: 'Matching socks = bonus points.', group: 'Morning' },
    { id: 'pack-bag',    emoji: '🎒', name: 'Pack school bag',       hint: 'Books, lunch, homework — triple check!', group: 'Morning' },
    { id: 'breakfast',   emoji: '🥣', name: 'Eat breakfast',         hint: 'Fuel up! Big day ahead.', group: 'Morning' },
    { id: 'comb-hair',   emoji: '💇', name: 'Brush/comb hair',       hint: 'Tame that bedhead!', group: 'Morning' },
    { id: 'shoes-on',    emoji: '👟', name: 'Put on shoes',          hint: 'Left on left, right on right!', group: 'Morning' },
    { id: 'vitamins',    emoji: '💊', name: 'Take vitamins',         hint: 'Power-up pill activated!', group: 'Morning' },
    { id: 'feed-pet-am', emoji: '🐾', name: 'Feed pet (morning)',    hint: 'Furry friend is counting on you!', group: 'Morning' },
    // After School
    { id: 'homework',    emoji: '📚', name: 'Homework',              hint: 'Brain power: activated!', group: 'After School' },
    { id: 'tidy-toys',   emoji: '🧸', name: 'Tidy toys (5 min)',     hint: 'Set the timer, beat the clock!', group: 'After School', timer: 300 },
    { id: 'read-15',     emoji: '📖', name: 'Read for 15 minutes',   hint: 'Adventure time for your brain!', group: 'After School' },
    { id: 'instrument',  emoji: '🎵', name: 'Practice instrument',   hint: '15 minutes of making noise…er, music!', group: 'After School' },
    { id: 'unpack-bag',  emoji: '🎒', name: 'Unpack school bag',     hint: "Empty it out, don't let crumbs grow.", group: 'After School' },
    { id: 'shoes-coat',  emoji: '🧥', name: 'Put away shoes & coat', hint: 'Hooks and racks are lonely, feed them!', group: 'After School' },
    { id: 'set-table',   emoji: '🍽️', name: 'Help set the table',   hint: 'Forks on the left, knives on the right!', group: 'After School' },
    { id: 'water-plants',emoji: '🌱', name: 'Water plants',          hint: "They're thirsty and can't get a drink alone!", group: 'After School' },
    { id: 'feed-pet-pm', emoji: '🐾', name: 'Feed pet (afternoon)',  hint: 'Second meal of the day for your buddy!', group: 'After School' },
    { id: 'pick-clothes',emoji: '👔', name: 'Pick up clothes from floor', hint: 'The floor is not a wardrobe!', group: 'After School' },
    // Evening
    { id: 'brush-pm',    emoji: '🪥', name: 'Brush teeth (evening)', hint: 'Yes, again. Teeth need friends.', group: 'Evening' },
    { id: 'pajamas',     emoji: '🌙', name: 'Pajamas + bedtime routine', hint: 'PJs on, story time, zzz.', group: 'Evening' },
    { id: 'clear-table', emoji: '🍽️', name: 'Help clear the table', hint: 'Dishes to the sink, champ!', group: 'Evening' },
    { id: 'shower',      emoji: '🚿', name: 'Take a bath/shower',    hint: 'Soap + water = superhero clean!', group: 'Evening' },
    { id: 'laundry',     emoji: '🧺', name: 'Put dirty clothes in laundry', hint: "Don't let the laundry monster grow!", group: 'Evening' },
    { id: 'tidy-room',   emoji: '🧹', name: 'Tidy room (10 min)',    hint: 'Quick cleanup blitz! You got this!', group: 'Evening', timer: 600 },
    { id: 'pack-tmrw',   emoji: '🎒', name: 'Pack bag for tomorrow', hint: 'Future you says thanks!', group: 'Evening' },
    { id: 'clothes-tmrw',emoji: '👕', name: 'Lay out clothes for tomorrow', hint: 'Morning you will be so grateful!', group: 'Evening' },
    { id: 'goodnight',   emoji: '🤗', name: 'Say goodnight to family', hint: 'Hugs, high-fives, or fist bumps count!', group: 'Evening' },
    { id: 'read-bed',    emoji: '📖', name: 'Read before bed',       hint: 'The best way to drift off to dreamland.', group: 'Evening' },
  ];

  // Original 9 chore IDs — default active set
  const DEFAULT_ACTIVE = [
    'brush-am', 'wash-face', 'make-bed', 'dressed', 'pack-bag',
    'homework', 'tidy-toys',
    'brush-pm', 'pajamas',
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

  const EARLY_FINISH = [
    { emoji: '⚡', title: 'SPEED DEMON!', msg: 'You finished so fast the clock is jealous!' },
    { emoji: '🦸', title: 'SUPER KID!', msg: 'Faster than a speeding vacuum cleaner!' },
    { emoji: '🏎️', title: 'TURBO TIDY!', msg: 'That room never stood a chance!' },
    { emoji: '🌪️', title: 'TIDY TORNADO!', msg: 'You blew through that like a cleaning hurricane!' },
    { emoji: '🚀', title: 'ROCKET CLEANER!', msg: 'Houston, the room is spotless!' },
    { emoji: '💎', title: 'DIAMOND HANDS!', msg: 'You held nothing back. Pure tidying power!' },
    { emoji: '👑', title: 'ROYALLY FAST!', msg: 'The King/Queen of Quick Cleaning!' },
    { emoji: '🎯', title: 'BULLSEYE!', msg: 'Clean room. Record time. Nailed it.' },
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
  let screen = 'today';      // 'today' | 'edit' | 'victory'
  let data = null;
  let timerActive = false;
  let timerChoreId = null;
  let timerSeconds = 0;
  let timerInterval = null;
  let expandedHints = {};
  let winId = null;

  /* ---- Helpers ---- */
  function getActiveChores() {
    const ids = data.activeChores || DEFAULT_ACTIVE;
    return ALL_CHORES.filter(c => ids.includes(c.id));
  }

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
        activeChores: DEFAULT_ACTIVE.slice(),
      };
      saveData();
      return;
    }
    data = saved;
    // Migrate: add activeChores if missing (existing users keep original 9)
    if (!data.activeChores) {
      data.activeChores = DEFAULT_ACTIVE.slice();
      saveData();
    }
    // Daily reset check
    if (data.lastResetDate !== today) {
      const active = getActiveChores();
      const allDoneYesterday = active.length > 0 && data.checkedItems.length >= active.length;
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
    const chore = ALL_CHORES.find(c => c.id === choreId);
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

  function finishEarly() {
    if (!timerActive || !timerChoreId) return;
    const choreId = timerChoreId;
    stopTimer();
    markDone(choreId);
    showAwesomePopup();
  }

  function showAwesomePopup() {
    const msg = EARLY_FINISH[Math.floor(Math.random() * EARLY_FINISH.length)];
    const container = document.getElementById('cq-app');
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = 'cq-awesome-overlay';
    popup.innerHTML = `
      <div class="cq-awesome-popup cq-awesome-anim">
        <div class="cq-awesome-emoji">${msg.emoji}</div>
        <div class="cq-awesome-title">${msg.title}</div>
        <div class="cq-awesome-msg">${msg.msg}</div>
        <div class="cq-awesome-sub">YOU ARE AWESOME!</div>
      </div>`;
    container.appendChild(popup);

    setTimeout(() => {
      popup.classList.add('cq-awesome-fade');
      setTimeout(() => popup.remove(), 400);
    }, 2500);
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
    const active = getActiveChores();
    const doneActive = active.filter(c => data.checkedItems.includes(c.id));
    if (doneActive.length >= active.length && active.length > 0) {
      const dayIndex = data.totalDaysCompleted % STICKERS.length;
      const sticker = STICKERS[dayIndex];
      if (!data.stickers.includes(sticker.id)) {
        data.stickers.push(sticker.id);
      }
      data.totalDaysCompleted++;
      saveData();
      const streakBonus = Math.min(25, data.streak * 5);
      const coins = 15 + streakBonus;
      OS.awardCoins(coins, 'chorequest', '✅', 'ChoreQuest: all chores done!' + (data.streak > 0 ? ' (' + data.streak + ' day streak)' : ''));
      screen = 'victory';
    }
    render();
  }

  function toggleHint(choreId) {
    expandedHints[choreId] = !expandedHints[choreId];
    render();
  }

  function toggleChore(choreId) {
    const idx = data.activeChores.indexOf(choreId);
    if (idx >= 0) {
      data.activeChores.splice(idx, 1);
      // Also remove from checked if it was checked today
      const ci = data.checkedItems.indexOf(choreId);
      if (ci >= 0) data.checkedItems.splice(ci, 1);
    } else {
      data.activeChores.push(choreId);
    }
    saveData();
    render();
  }

  /* ---- Render ---- */
  function render() {
    const container = document.getElementById('cq-app');
    if (!container) return;
    if (screen === 'victory') {
      container.innerHTML = renderVictory();
    } else if (screen === 'edit') {
      container.innerHTML = renderEdit();
    } else {
      container.innerHTML = renderToday();
    }
  }

  function renderToday() {
    const active = getActiveChores();
    const doneCount = active.filter(c => data.checkedItems.includes(c.id)).length;
    const total = active.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    let html = `<div class="cq-header">
      <div class="cq-title">✅ Today's Quest List</div>
      <div class="cq-header-right">
        ${data.streak > 0 ? `<div class="cq-streak">🔥 ${data.streak} day${data.streak > 1 ? 's' : ''}</div>` : ''}
        <button class="cq-edit-btn" onclick="window._cqEditChores()" title="Edit chores">✏️</button>
      </div>
    </div>`;

    html += `<div class="cq-progress-wrap">
      <div class="cq-progress">
        <div class="cq-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="cq-progress-text">${doneCount}/${total} done</div>
    </div>`;

    if (total === 0) {
      html += `<div class="cq-empty">
        <div class="cq-empty-emoji">📋</div>
        <div class="cq-empty-text">No chores selected yet!</div>
        <button class="cq-done-btn" style="margin-top:10px" onclick="window._cqEditChores()">✏️ Pick your chores</button>
      </div>`;
      html += renderFooter();
      return html;
    }

    if (timerActive) {
      html += `<div class="cq-timer">
        <div class="cq-timer-emoji">🧸</div>
        <div class="cq-timer-label">Tidy Time!</div>
        <div class="cq-timer-display" id="cq-timer-display">${formatTime(timerSeconds)}</div>
        <div class="cq-timer-hint">Clean up before the clock runs out!</div>
        <button class="cq-early-btn" onclick="window._cqFinishEarly()">✨ Done Early!</button>
        <button class="cq-timer-cancel" onclick="window._cqCancelTimer()">Cancel</button>
      </div>`;
    }

    for (const group of GROUPS) {
      const chores = active.filter(c => c.group === group);
      if (chores.length === 0) continue;
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

    html += renderFooter();
    return html;
  }

  function renderFooter() {
    return `<div class="cq-footer">
      <div class="cq-sticker-count">🏆 Stickers earned: ${data.stickers.length}/${STICKERS.length}</div>
      ${data.streak === 0 && data.totalDaysCompleted > 0 ? `<div class="cq-streak-msg">No worries. Today is a fresh start! 🌅</div>` : ''}
      ${data.streak > 0 ? `<div class="cq-streak-msg">🔥 ${data.streak} day${data.streak > 1 ? 's' : ''} in a row! Keep it going!</div>` : ''}
      ${data.bestStreak > 0 ? `<div class="cq-best-streak">Best streak: ${data.bestStreak} day${data.bestStreak > 1 ? 's' : ''}</div>` : ''}
    </div>`;
  }

  function renderEdit() {
    const activeSet = new Set(data.activeChores);
    let html = `<div class="cq-header">
      <div class="cq-title">✏️ Edit My Chores</div>
      <div class="cq-header-right">
        <button class="cq-edit-done-btn" onclick="window._cqEditDone()">Done</button>
      </div>
    </div>`;

    html += `<div class="cq-edit-info">Pick which chores appear on your daily list. You have <b>${activeSet.size}</b> selected.</div>`;

    for (const group of GROUPS) {
      const chores = ALL_CHORES.filter(c => c.group === group);
      html += `<div class="cq-section">
        <div class="cq-section-title">${group === 'Morning' ? '🌅' : group === 'After School' ? '🏠' : '🌙'} ${group}</div>`;
      for (const chore of chores) {
        const on = activeSet.has(chore.id);
        html += `<div class="cq-edit-row ${on ? 'cq-edit-on' : ''}" onclick="window._cqToggleChore('${chore.id}')">
          <span class="cq-chore-emoji">${chore.emoji}</span>
          <div class="cq-edit-name">${chore.name}${chore.timer ? ' ⏱️' : ''}</div>
          <div class="cq-toggle ${on ? 'cq-toggle-on' : ''}">
            <div class="cq-toggle-knob"></div>
          </div>
        </div>`;
      }
      html += `</div>`;
    }

    html += `<div class="cq-footer" style="padding-bottom:18px">
      <button class="cq-edit-reset-btn" onclick="window._cqResetChores()">↩️ Reset to defaults</button>
    </div>`;

    return html;
  }

  function renderVictory() {
    const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    const stickerIdx = (data.totalDaysCompleted - 1) % STICKERS.length;
    const sticker = STICKERS[stickerIdx];

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
  window._cqFinishEarly = () => finishEarly();
  window._cqBackToToday = () => { screen = 'today'; render(); };
  window._cqEditChores = () => { screen = 'edit'; render(); };
  window._cqEditDone = () => { screen = 'today'; render(); };
  window._cqToggleChore = (id) => toggleChore(id);
  window._cqResetChores = () => {
    data.activeChores = DEFAULT_ACTIVE.slice();
    saveData();
    render();
  };

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
