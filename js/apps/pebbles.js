/* ===== Pebbles — Virtual Pet Rock ===== */
(() => {
  const STORE_KEY = 'kidsOS_pebbles';

  /* ---- Data Constants ---- */
  const TRICKS = [
    { id: 'sit',        name: 'Sit',                       xpCost: 0,   anim: 'Rock sits there' },
    { id: 'continue',   name: 'Continue Sitting',          xpCost: 10,  anim: 'Rock... continues sitting' },
    { id: 'tilt',       name: 'Slightly Tilt',             xpCost: 25,  anim: 'tilt' },
    { id: 'return',     name: 'Return to Sit',             xpCost: 50,  anim: 'untilt' },
    { id: 'pause',      name: 'Dramatic Pause',            xpCost: 100, anim: 'pause' },
    { id: 'legendary',  name: 'Legendary Stillness (Expert)', xpCost: 200, anim: 'legendary' },
  ];

  const AFFIRMATIONS = [
    "You showed up. That counts.",
    "Tiny progress is still progress.",
    "You tried. Pebbles respected that. (Probably.)",
    "Hydration check: you're the smart one here.",
    "Pebbles believes in you. Silently.",
    "Today was a day. You survived it.",
    "Your existence is appreciated.",
    "You are doing better than most rocks.",
    "Breathe. Pebbles doesn't, but you should.",
    "One step at a time. Pebbles prefers zero steps.",
    "You are 100% more mobile than Pebbles. Flex.",
    "Pebbles would clap for you if it could.",
    "You matter. Pebbles is just matter.",
    "That was brave. Pebbles saw nothing, but trusts you.",
    "You're growing. Pebbles is eroding, but slowly.",
    "Solid effort. Rock-solid, even.",
    "Don't give up. Pebbles never starts, so it never quits either.",
    "Great job existing today.",
    "You are the main character. Pebbles is the rock.",
    "Pebbles is proud of you. (Source: trust me.)",
  ];

  const ENCOURAGE_RESPONSES = [
    "Pebbles tried really hard. (Internally.)",
    "Was that a twitch? Nope. Just the wind.",
    "Pebbles is processing your encouragement.",
    "XP gained! Pebbles didn't move, but learned something.",
    "The earth trembled slightly. Or that was you jumping.",
    "Pebbles stared into the void. The void blinked first.",
    "Training complete. (Was anything different? No. But still.)",
    "Encouraging words absorbed. Pebbles is now 0.001% wiser.",
    "You encouraged a rock. That takes character.",
    "Pebbles leveled up! (Visually identical.)",
    "A masterclass in patience from both of you.",
    "Pebbles would thank you, but... you know.",
  ];

  const ROCK_MOODS = [
    'Calm', 'Still calm', 'Aggressively calm', 'Zen', 'Unbothered',
    'Contemplating gravity', 'Emotionally stable (literally)', 'Vibing',
    'Peak relaxation', 'Resting (permanent)',
  ];

  const ACCESSORIES = [
    { id: 'eyes',       name: 'Googly Eyes', xp: 0,   top: '👀', replace: false },
    { id: 'hat',        name: 'Tiny Hat',    xp: 30,  top: '🎩', replace: false },
    { id: 'bow',        name: 'Bow Tie',     xp: 75,  top: '🎀', replace: false },
    { id: 'sunglasses', name: 'Sunglasses',  xp: 150, top: '😎', replace: true },
    { id: 'crown',      name: 'Crown',       xp: 300, top: '👑', replace: false },
    { id: 'cape',       name: 'Cape',        xp: 500, top: '🦸', replace: false },
  ];

  const MINI_GAMES = [
    { id: 'roll',     name: 'Roll-a-Pixel',    emoji: '🎲', desc: 'Watch Pebbles move... 1 pixel!' },
    { id: 'hide',     name: 'Hide & Seek',     emoji: '🙈', desc: 'Can you find Pebbles?' },
    { id: 'karaoke',  name: 'Rock Karaoke',    emoji: '🎤', desc: 'Let Pebbles judge your singing' },
    { id: 'obstacle', name: 'Obstacle Course',  emoji: '🏁', desc: 'Pebbles vs. obstacles' },
  ];

  /* ---- State ---- */
  let state = null;
  let currentScreen = 'home';
  let bubbleTimeout = null;
  let encourageCooldown = false;
  let gameActive = false;
  let winId = null;

  function defaultState() {
    return {
      name: 'Pebbles',
      xp: 0,
      tricksLearned: ['sit'],
      currentTrick: 'sit',
      currentAccessory: 'eyes',
      gamesPlayed: 0,
      encouragements: 0,
      lastDate: '',
      streak: 0,
      bestStreak: 0,
      affirmationsGiven: 0,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      state = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch (e) { state = defaultState(); }
    // streak check
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDate && state.lastDate !== today) {
      const last = new Date(state.lastDate);
      const now = new Date(today);
      const diff = Math.round((now - last) / 86400000);
      if (diff > 1) { state.streak = 0; }
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function recordVisit() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDate !== today) {
      if (state.lastDate) {
        const last = new Date(state.lastDate);
        const now = new Date(today);
        const diff = Math.round((now - last) / 86400000);
        if (diff === 1) state.streak++;
        else state.streak = 1;
      } else {
        state.streak = 1;
      }
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.lastDate = today;
      save();
    }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function getMood() { return pick(ROCK_MOODS); }

  function getNextTrick() {
    for (const t of TRICKS) {
      if (!state.tricksLearned.includes(t.id)) return t;
    }
    return null;
  }

  function getAccessory(id) { return ACCESSORIES.find(a => a.id === id); }

  function isAccessoryUnlocked(acc) { return state.xp >= acc.xp; }

  /* ---- Rock Display ---- */
  function rockHTML() {
    const acc = getAccessory(state.currentAccessory) || ACCESSORIES[0];
    let topEl = '', bottomEl = '', behindEl = '';
    if (acc.id === 'eyes')       topEl = '<div class="pb-acc pb-acc-eyes">👀</div>';
    else if (acc.id === 'hat')   topEl = '<div class="pb-acc pb-acc-top">🎩</div>';
    else if (acc.id === 'bow')   bottomEl = '<div class="pb-acc pb-acc-bottom">🎀</div>';
    else if (acc.id === 'sunglasses') topEl = '<div class="pb-acc pb-acc-eyes">😎</div>';
    else if (acc.id === 'crown') topEl = '<div class="pb-acc pb-acc-top">👑</div>';
    else if (acc.id === 'cape')  behindEl = '<div class="pb-acc pb-acc-behind">🦸</div>';
    return '<div class="pb-rock" id="pb-rock">' + behindEl +
      '<div class="pb-rock-emoji">🪨</div>' + topEl + bottomEl +
      '<div class="pb-bubble" id="pb-bubble"></div></div>';
  }

  /* ---- Bubble ---- */
  function showBubble(text, duration) {
    const el = document.getElementById('pb-bubble');
    if (!el) return;
    el.textContent = text;
    el.classList.add('pb-bubble-show');
    clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => {
      el.classList.remove('pb-bubble-show');
    }, duration || 3000);
  }

  /* ---- Meters (always fake) ---- */
  function metersHTML() {
    return '<div class="pb-meters">' +
      meterRow('Hunger', 0, 'Does not hunger') +
      meterRow('Energy', 100, 'Stable (forever)') +
      meterRow('Happiness', 92, 'Content') +
      meterRow('Neediness', 0, 'Zero. Zilch. Nada.') +
      '</div>';
  }

  function meterRow(label, pct, desc) {
    const color = pct === 0 ? '#9e9e9e' : pct >= 90 ? '#66bb6a' : '#ffb74d';
    return '<div class="pb-meter"><div class="pb-meter-label">' + label +
      '</div><div class="pb-meter-track"><div class="pb-meter-fill" style="width:' + pct +
      '%;background:' + color + '"></div></div><div class="pb-meter-desc">' + desc + '</div></div>';
  }

  /* ---- Screens ---- */
  function renderScreen() {
    const wrap = document.getElementById('pb-wrap');
    if (!wrap) return;
    if (currentScreen === 'home')    wrap.innerHTML = homeHTML();
    else if (currentScreen === 'train') wrap.innerHTML = trainHTML();
    else if (currentScreen === 'games') wrap.innerHTML = gamesHTML();
    else if (currentScreen === 'profile') wrap.innerHTML = profileHTML();
  }

  function navHTML() {
    const items = [
      { id: 'home',    icon: '🏠', label: 'Home' },
      { id: 'train',   icon: '🏋️', label: 'Train' },
      { id: 'games',   icon: '🎮', label: 'Games' },
      { id: 'profile', icon: '📋', label: 'Profile' },
    ];
    return '<div class="pb-nav">' + items.map(i =>
      '<button class="pb-nav-btn' + (currentScreen === i.id ? ' pb-nav-active' : '') +
      '" onclick="_pbGo(\'' + i.id + '\')">' + i.icon + '<span>' + i.label + '</span></button>'
    ).join('') + '</div>';
  }

  /* -- Home Screen -- */
  function homeHTML() {
    const trick = TRICKS.find(t => t.id === state.currentTrick) || TRICKS[0];
    return '<div class="pb-screen pb-home">' +
      '<div class="pb-home-top">' +
        '<div class="pb-name-display">' + escHtml(state.name) + '</div>' +
        '<div class="pb-mood">' + getMood() + '</div>' +
      '</div>' +
      rockHTML() +
      '<div class="pb-trick-label">Current trick: <strong>' + trick.name + '</strong></div>' +
      metersHTML() +
      '<button class="pb-encourage-btn" onclick="_pbEncourage()">💪 Encourage ' + escHtml(state.name) + '</button>' +
      '<div class="pb-streak">🔥 Sediment Streak: ' + state.streak + ' day' + (state.streak !== 1 ? 's' : '') +
        (state.bestStreak > state.streak ? ' (best: ' + state.bestStreak + ')' : '') + '</div>' +
      '</div>' + navHTML();
  }

  /* -- Train Screen -- */
  function trainHTML() {
    const next = getNextTrick();
    const currentTrickObj = TRICKS.find(t => t.id === state.currentTrick) || TRICKS[0];
    let xpBar = '';
    if (next) {
      const prevXP = TRICKS[TRICKS.indexOf(next) - 1] ? TRICKS[TRICKS.indexOf(next) - 1].xpCost : 0;
      const needed = next.xpCost - prevXP;
      const progress = Math.min(state.xp - prevXP, needed);
      const pct = Math.round((progress / needed) * 100);
      xpBar = '<div class="pb-xp-section">' +
        '<div class="pb-xp-label">Next: <strong>' + next.name + '</strong> (' + state.xp + '/' + next.xpCost + ' XP)</div>' +
        '<div class="pb-xp-track"><div class="pb-xp-fill" style="width:' + pct + '%"></div></div></div>';
    } else {
      xpBar = '<div class="pb-xp-section"><div class="pb-xp-label">🏆 All tricks mastered! (' + state.xp + ' XP)</div></div>';
    }

    const trickList = TRICKS.map(t => {
      const learned = state.tricksLearned.includes(t.id);
      const active = state.currentTrick === t.id;
      return '<div class="pb-trick-item' + (learned ? ' pb-trick-learned' : ' pb-trick-locked') +
        (active ? ' pb-trick-active' : '') + '">' +
        '<span>' + (learned ? '✅' : '🔒') + ' ' + t.name + '</span>' +
        (learned ? '<button class="pb-trick-demo-btn" onclick="_pbTrickDemo(\'' + t.id + '\')">Demo</button>' : '<span class="pb-trick-cost">' + t.xpCost + ' XP</span>') +
        '</div>';
    }).join('');

    return '<div class="pb-screen pb-train">' +
      '<div class="pb-train-header">Training ' + escHtml(state.name) + '</div>' +
      rockHTML() +
      '<button class="pb-encourage-btn pb-big-btn" onclick="_pbEncourage()">💪 ENCOURAGE</button>' +
      xpBar +
      '<div class="pb-trick-list">' + trickList + '</div>' +
      '</div>' + navHTML();
  }

  /* -- Games Screen -- */
  function gamesHTML() {
    const cards = MINI_GAMES.map(g =>
      '<button class="pb-game-card" onclick="_pbPlayGame(\'' + g.id + '\')">' +
        '<div class="pb-game-emoji">' + g.emoji + '</div>' +
        '<div class="pb-game-name">' + g.name + '</div>' +
        '<div class="pb-game-desc">' + g.desc + '</div>' +
      '</button>'
    ).join('');
    return '<div class="pb-screen pb-games">' +
      '<div class="pb-games-header">🎮 Mini-Games</div>' +
      '<div class="pb-game-grid">' + cards + '</div>' +
      '<div class="pb-game-result" id="pb-game-result"></div>' +
      '</div>' + navHTML();
  }

  /* -- Profile Screen -- */
  function profileHTML() {
    const accGrid = ACCESSORIES.map(a => {
      const unlocked = isAccessoryUnlocked(a);
      const equipped = state.currentAccessory === a.id;
      return '<button class="pb-acc-card' + (equipped ? ' pb-acc-equipped' : '') +
        (unlocked ? '' : ' pb-acc-locked') + '"' +
        (unlocked ? ' onclick="_pbSetAccessory(\'' + a.id + '\')"' : '') + '>' +
        '<div class="pb-acc-emoji">' + a.top + '</div>' +
        '<div class="pb-acc-name">' + a.name + '</div>' +
        (unlocked ? (equipped ? '<div class="pb-acc-tag">Equipped</div>' : '') : '<div class="pb-acc-tag">🔒 ' + a.xp + ' XP</div>') +
        '</button>';
    }).join('');

    return '<div class="pb-screen pb-profile">' +
      '<div class="pb-profile-header">📋 Profile</div>' +
      rockHTML() +
      '<div class="pb-name-edit">' +
        '<label>Name:</label>' +
        '<input class="pb-name-input" type="text" value="' + escHtml(state.name) + '" maxlength="20" onchange="_pbSetName(this.value)">' +
      '</div>' +
      '<div class="pb-stats">' +
        '<div class="pb-stat">⭐ XP: <strong>' + state.xp + '</strong></div>' +
        '<div class="pb-stat">🎯 Tricks: <strong>' + state.tricksLearned.length + '/' + TRICKS.length + '</strong></div>' +
        '<div class="pb-stat">🎮 Games: <strong>' + state.gamesPlayed + '</strong></div>' +
        '<div class="pb-stat">💪 Encouragements: <strong>' + state.encouragements + '</strong></div>' +
        '<div class="pb-stat">🔥 Best Streak: <strong>' + state.bestStreak + ' days</strong></div>' +
        '<div class="pb-stat">💬 Affirmations: <strong>' + state.affirmationsGiven + '</strong></div>' +
      '</div>' +
      '<button class="pb-affirm-btn" onclick="_pbAffirm()">💬 Get Affirmation</button>' +
      '<div class="pb-section-title">Accessories</div>' +
      '<div class="pb-accessory-grid">' + accGrid + '</div>' +
      '</div>' + navHTML();
  }

  /* ---- Actions ---- */
  function addXP(amount) {
    state.xp += amount;
    // check trick unlocks
    for (const t of TRICKS) {
      if (!state.tricksLearned.includes(t.id) && state.xp >= t.xpCost) {
        state.tricksLearned.push(t.id);
        state.currentTrick = t.id;
        showBubble('🎉 New trick: ' + t.name + '!', 4000);
        OS.awardCoins(5, 'Pebbles', '🪨', 'New trick: ' + t.name);
        save();
        setTimeout(renderScreen, 500);
        return;
      }
    }
    save();
  }

  function doEncourage() {
    if (encourageCooldown) return;
    encourageCooldown = true;
    setTimeout(() => { encourageCooldown = false; }, 1000);

    state.encouragements++;
    addXP(3);
    showBubble(pick(ENCOURAGE_RESPONSES), 3000);

    // bonus coins every 10 encouragements
    if (state.encouragements % 10 === 0) {
      OS.awardCoins(2, 'Pebbles', '🪨', 'Encouragement milestone x' + state.encouragements);
    }
    save();
    // animate rock
    const rock = document.getElementById('pb-rock');
    if (rock) {
      rock.classList.add('pb-rock-bounce');
      setTimeout(() => rock.classList.remove('pb-rock-bounce'), 500);
    }
  }

  function playGame(gameId) {
    if (gameActive) return;
    gameActive = true;
    const resultEl = document.getElementById('pb-game-result');
    if (!resultEl) { gameActive = false; return; }
    resultEl.className = 'pb-game-result pb-game-result-show';

    if (gameId === 'roll') {
      resultEl.innerHTML = '<div class="pb-game-anim">🪨 Rolling...</div>';
      setTimeout(() => {
        const dirs = ['left', 'right', 'up', 'down'];
        const dir = pick(dirs);
        resultEl.innerHTML = '<div class="pb-game-anim">🪨 moved 1 pixel ' + dir + '!</div>' +
          '<div class="pb-game-big">🎉🎊🥳 INCREDIBLE! 🎊🎉🥳</div>' +
          '<div class="pb-game-sub">Scientists are baffled. History has been made.</div>';
        finishGame(4);
      }, 2000);
    } else if (gameId === 'hide') {
      resultEl.innerHTML = '<div class="pb-game-anim">🙈 Pebbles is hiding!</div><div class="pb-game-sub">Looking...</div>';
      setTimeout(() => {
        resultEl.innerHTML = '<div class="pb-game-anim">👀 Found!</div>' +
          '<div class="pb-game-big">Pebbles was right here the whole time.</div>' +
          '<div class="pb-game-sub">Masterful camouflage. Or... not.</div>';
        finishGame(3);
      }, 3000);
    } else if (gameId === 'karaoke') {
      resultEl.innerHTML = '<div class="pb-game-anim">🎤 Sing something!</div>' +
        '<button class="pb-encourage-btn" onclick="_pbKaraokeDone()">🎶 Done Singing</button>';
    } else if (gameId === 'obstacle') {
      resultEl.innerHTML = '<div class="pb-game-anim">🏁 Obstacle Course</div>' +
        '<div class="pb-game-obstacles">🔥 → 🌊 → 🌪️</div>' +
        '<div class="pb-game-sub">Starting in 3...</div>';
      setTimeout(() => {
        resultEl.innerHTML = '<div class="pb-game-anim">✅ Course Complete!</div>' +
          '<div class="pb-game-big">Pebbles let the obstacles go around it.</div>' +
          '<div class="pb-game-sub">Strategy: exist. Result: flawless.</div>';
        finishGame(5);
      }, 3000);
    }
  }

  function karaokeDone() {
    const resultEl = document.getElementById('pb-game-result');
    if (!resultEl) return;
    resultEl.innerHTML = '<div class="pb-game-anim">🎤 Pebbles\' Rating:</div>' +
      '<div class="pb-game-big">Rock/10</div>' +
      '<div class="pb-game-sub">Every time.</div>';
    finishGame(3);
  }

  function finishGame(xp) {
    state.gamesPlayed++;
    addXP(xp);
    OS.awardCoins(1, 'Pebbles', '🪨', 'Mini-game completed');
    save();
    setTimeout(() => {
      gameActive = false;
      const resultEl = document.getElementById('pb-game-result');
      if (resultEl) { resultEl.className = 'pb-game-result'; resultEl.innerHTML = ''; }
    }, 4000);
  }

  function setAccessory(id) {
    const acc = getAccessory(id);
    if (!acc || !isAccessoryUnlocked(acc)) return;
    state.currentAccessory = id;
    save();
    renderScreen();
  }

  function setName(name) {
    const clean = (name || '').trim().slice(0, 20);
    if (clean) {
      state.name = clean;
      save();
    }
  }

  function affirm() {
    state.affirmationsGiven++;
    save();
    showBubble(pick(AFFIRMATIONS), 4000);
  }

  function trickDemo(trickId) {
    if (!state.tricksLearned.includes(trickId)) return;
    const rock = document.getElementById('pb-rock');
    if (!rock) return;
    const trick = TRICKS.find(t => t.id === trickId);
    if (!trick) return;

    if (trick.anim === 'tilt') {
      rock.classList.add('pb-rock-tilt');
      showBubble('*tilts 3 degrees*', 2000);
      setTimeout(() => rock.classList.remove('pb-rock-tilt'), 2000);
    } else if (trick.anim === 'untilt') {
      rock.classList.add('pb-rock-tilt');
      setTimeout(() => { rock.classList.remove('pb-rock-tilt'); showBubble('*returns to sit*', 2000); }, 1000);
    } else if (trick.anim === 'pause') {
      showBubble('...', 3000);
    } else if (trick.anim === 'legendary') {
      rock.classList.add('pb-rock-legendary');
      showBubble('✨ Legendary Stillness ✨', 3000);
      setTimeout(() => rock.classList.remove('pb-rock-legendary'), 3000);
    } else {
      showBubble(trick.anim, 2000);
    }
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---- Global Handlers ---- */
  window._pbGo = function(screen) { currentScreen = screen; renderScreen(); };
  window._pbEncourage = function() { doEncourage(); };
  window._pbPlayGame = function(id) { playGame(id); };
  window._pbKaraokeDone = function() { karaokeDone(); };
  window._pbSetAccessory = function(id) { setAccessory(id); };
  window._pbSetName = function(name) { setName(name); };
  window._pbAffirm = function() { affirm(); };
  window._pbTrickDemo = function(id) { trickDemo(id); };

  /* ---- App Registration ---- */
  OS.registerApp('pebbles', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'pebbles', title: '🪨 Pebbles', icon: '🪨',
        width: 420, height: 620,
        content: '<div class="pb-wrap" id="pb-wrap"></div>',
      };
    },
    onOpen(id) {
      winId = id;
      load();
      recordVisit();
      currentScreen = 'home';
      gameActive = false;
      encourageCooldown = false;
      renderScreen();
    },
    onClose() {
      clearTimeout(bubbleTimeout);
      winId = null;
    },
  });
})();
