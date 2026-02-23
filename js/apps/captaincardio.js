/* ===== Captain Cardio — Starship Fitness App ===== */
(() => {
  /* ---- Exercise Moves ---- */
  const MOVES = {
    'jumping-jacks':  { emoji: '⭐', name: 'Jumping Jacks',    instruction: 'Jump and spread arms & legs wide, then back!', command: 'Engage star-jump thrusters!' },
    'hops':           { emoji: '🐇', name: 'Space Hops',       instruction: 'Hop on both feet like low gravity!', command: 'Bounce off that asteroid!' },
    'high-knees':     { emoji: '🦵', name: 'High Knees',       instruction: 'Run in place, knees up high!', command: 'Power up the engine pistons!' },
    'toe-taps':       { emoji: '👟', name: 'Toe Taps',         instruction: 'Tap toes on the floor, quick quick!', command: 'Calibrate landing gear!' },
    'side-steps':     { emoji: '🦀', name: 'Side Steps',       instruction: 'Step side to side like a space crab!', command: 'Dodge that meteor shower!' },
    'dance-wiggles':  { emoji: '💃', name: 'Dance Wiggles',    instruction: 'Wiggle everything — arms, hips, all of it!', command: 'Alien dance frequency detected!' },
    'bear-crawl':     { emoji: '🐻', name: 'Bear Crawl',       instruction: 'Hands and feet on the floor, crawl forward!', command: 'Engage bear-mode propulsion!' },
    'crab-walk':      { emoji: '🦀', name: 'Crab Walk',        instruction: 'Sit down, hands behind you, walk like a crab!', command: 'Reverse thrusters, cadet!' },
    'duck-walk':      { emoji: '🦆', name: 'Duck Walk',        instruction: 'Squat low and waddle forward!', command: 'Deploy the waddle drive!' },
    'wall-pushups':   { emoji: '🧱', name: 'Wall Push-Ups',    instruction: 'Hands on the wall, push away!', command: 'Repel the force field!' },
    'chair-squats':   { emoji: '🪑', name: 'Chair Squats',     instruction: 'Sit down, stand up, no hands!', command: 'Launch sequence: squat, rise, repeat!' },
    'shoulder-rolls': { emoji: '🔄', name: 'Shoulder Rolls',   instruction: 'Roll shoulders forward, then backward!', command: 'Rotate the shield generators!' },
    'flamingo-stand': { emoji: '🦩', name: 'Flamingo Stand',   instruction: 'Stand on one foot, arms out! Switch!', command: 'Activate balance stabilizers!' },
    'star-stretch':   { emoji: '🌟', name: 'Star Stretch',     instruction: 'Reach up high, then touch your toes!', command: 'Extend the solar panels!' },
  };

  /* ---- Mission Packs ---- */
  const PACKS = [
    {
      id: 'meteor', name: 'Meteor Dodge Academy', emoji: '☄️', vibe: 'Incoming space rocks!',
      badge: { id: 'meteor-dodger', emoji: '☄️', name: 'Certified Meteor Dodger' },
      missions: [
        { id: 'asteroid-hop',    name: 'Asteroid Hopscotch',   type: 'booster', moves: ['hops', 'bear-crawl', 'chair-squats'] },
        { id: 'comet-feet',      name: 'Comet Quick Feet',     type: 'booster', moves: ['high-knees', 'crab-walk', 'wall-pushups'] },
        { id: 'meteor-matrix',   name: 'Meteor Dodge Matrix',  type: 'balance', moves: ['side-steps', 'flamingo-stand', 'toe-taps'] },
        { id: 'space-rock-roll', name: 'Space Rock & Roll',    type: 'booster', moves: ['jumping-jacks', 'dance-wiggles', 'hops'] },
        { id: 'debris-dash',     name: 'Debris Field Dash',    type: 'hull',    moves: ['high-knees', 'bear-crawl', 'star-stretch'] },
      ],
    },
    {
      id: 'alien', name: 'Alien Animal Training Deck', emoji: '👾', vibe: 'Learn alien creature moves!',
      badge: { id: 'alien-trainer', emoji: '👾', name: 'Honorary Alien Trainer' },
      missions: [
        { id: 'space-bear',     name: 'Space Bear Bootcamp',   type: 'hull',    moves: ['bear-crawl', 'wall-pushups', 'chair-squats'] },
        { id: 'crab-nebula',    name: 'Crab Nebula Drill',     type: 'balance', moves: ['crab-walk', 'flamingo-stand', 'shoulder-rolls'] },
        { id: 'duck-planet',    name: 'Duck Planet Waddle',    type: 'hull',    moves: ['duck-walk', 'chair-squats', 'bear-crawl'] },
        { id: 'flamingo-orbit', name: 'Flamingo Orbit',        type: 'balance', moves: ['flamingo-stand', 'toe-taps', 'star-stretch'] },
        { id: 'alien-groove',   name: 'Alien Groove Party',    type: 'booster', moves: ['dance-wiggles', 'jumping-jacks', 'side-steps'] },
      ],
    },
    {
      id: 'robot', name: 'Robot Reboot & Systems Check', emoji: '🤖', vibe: 'Time to recalibrate!',
      badge: { id: 'reboot-engineer', emoji: '🤖', name: 'Chief Reboot Engineer' },
      missions: [
        { id: 'servo-stretch', name: 'Servo Stretch Protocol', type: 'balance', moves: ['star-stretch', 'shoulder-rolls', 'flamingo-stand'] },
        { id: 'turbo-legs',    name: 'Turbo Leg Sequence',     type: 'booster', moves: ['high-knees', 'hops', 'jumping-jacks'] },
        { id: 'arm-cannon',    name: 'Arm Cannon Calibration', type: 'hull',    moves: ['wall-pushups', 'shoulder-rolls', 'star-stretch'] },
        { id: 'core-reboot',   name: 'Core Reboot Sequence',   type: 'hull',    moves: ['chair-squats', 'bear-crawl', 'wall-pushups'] },
        { id: 'full-system',   name: 'Full System Overhaul',   type: 'booster', moves: ['jumping-jacks', 'high-knees', 'dance-wiggles'] },
      ],
    },
  ];

  /* ---- Phases ---- */
  const PHASES = [
    { id: 'warmup', name: 'Warm-Up',  duration: 20, instruction: 'Astronaut march! Engage boots!', emoji: '🚶' },
    { id: 'move1',  name: 'Move 1',   duration: 30, emoji: '💪' },
    { id: 'move2',  name: 'Move 2',   duration: 30, emoji: '🏃' },
    { id: 'move3',  name: 'Move 3',   duration: 30, emoji: '⚡' },
    { id: 'hero',   name: 'Hero Pose', duration: 10, instruction: 'Captain Stance! Hands on hips, chin up!', emoji: '🦸' },
  ];

  /* ---- Day Themes ---- */
  const DAY_THEMES = ['free', 'booster', 'hull', 'balance', 'booster', 'hull', 'balance'];
  const THEME_LABELS = {
    free: { emoji: '🌌', name: 'Free-Play Galaxy', desc: 'Any mission goes today!' },
    booster: { emoji: '🚀', name: 'Booster Day', desc: 'Jumping & hopping missions!' },
    hull: { emoji: '🛡️', name: 'Hull Day', desc: 'Muscle & strength missions!' },
    balance: { emoji: '⚖️', name: 'Balance Orbit', desc: 'Balance & stretch missions!' },
  };

  /* ---- Praise Lines ---- */
  const PRAISE_LINES = [
    'Outstanding work, cadet! The ship is proud!',
    'You moved like a real space hero!',
    'The galaxy just got a little stronger!',
    'Captain approves — mission accomplished!',
    'Your energy readings are OFF THE CHARTS!',
    'That was some serious astronaut training!',
    'The crew is cheering for you!',
    'Even aliens would be impressed!',
    'You powered through like a champion!',
    'Systems charged — you did amazing!',
    'The stars are shining brighter because of YOU!',
    'Warp drive? More like warp STRIDE!',
    'Mission control says: WOW!',
    'You just leveled up your astronaut skills!',
    'Your space muscles are growing!',
    'The captain salutes your effort!',
    'Hull integrity at 100% — because of YOU!',
    'That workout was out of this world!',
    'You are officially mission-ready!',
    'Another successful mission in the logbook!',
  ];

  /* ---- Captain Commands (per-phase encouragements) ---- */
  const CAPTAIN_COMMANDS = [
    'Keep it up, cadet!',
    'You are doing GREAT!',
    'The ship needs your energy!',
    'Almost there, astronaut!',
    'Feel that power? That is YOU!',
    'Sensors detect peak awesomeness!',
    'Your crew is counting on you!',
    'Push through the gravity field!',
    'Engines at full throttle!',
    'This is what heroes look like!',
    'Stay strong, space warrior!',
    'The galaxy believes in you!',
    'Channel your inner rocket!',
    'You are unstoppable!',
    'That form is STELLAR!',
  ];

  /* ---- Badges ---- */
  const BADGES = [
    { id: 'stardust-cadet',    emoji: '✨', name: 'Stardust Cadet',           desc: 'Complete your first mission' },
    { id: 'wiggle-engineer',   emoji: '🕺', name: 'Wiggle Engineer',          desc: 'Do 3 missions in one day' },
    { id: 'hydration-pilot',   emoji: '💧', name: 'Hydration Pilot',          desc: 'Complete 5 total missions' },
    { id: 'captain-consistent',emoji: '📅', name: 'Captain of Consistency',   desc: 'Be active on 5 different days' },
    { id: 'meteor-dodger',     emoji: '☄️', name: 'Certified Meteor Dodger',  desc: 'Complete all Meteor Dodge missions' },
    { id: 'alien-trainer',     emoji: '👾', name: 'Honorary Alien Trainer',   desc: 'Complete all Alien Animal missions' },
    { id: 'reboot-engineer',   emoji: '🤖', name: 'Chief Reboot Engineer',    desc: 'Complete all Robot Reboot missions' },
  ];

  /* ---- Daily Goals ---- */
  const GOALS = [
    { id: 'cadet', label: 'Cadet',     target: 2, emoji: '⭐' },
    { id: 'crew',  label: 'Crew',       target: 4, emoji: '⭐⭐' },
    { id: 'warp',  label: 'Warp Mode',  target: 6, emoji: '🚀' },
  ];

  /* ---- Ranks (by total missions) ---- */
  const RANKS = [
    { min: 0,  name: 'Space Rookie' },
    { min: 3,  name: 'Stardust Cadet' },
    { min: 10, name: 'Nebula Navigator' },
    { min: 20, name: 'Galaxy Guardian' },
    { min: 40, name: 'Supernova Captain' },
    { min: 75, name: 'Warp Commander' },
  ];

  /* ---- State ---- */
  const STORAGE_KEY = 'kidsOS_captaincardio';
  let state, screen, currentMission, phaseIdx, timerSeconds, timerInterval, lastCommand, winId;

  function defaultState() {
    return {
      missionsToday: 0,
      missionsTotal: 0,
      lastDate: '',
      streak: 0,
      bestStreak: 0,
      daysActive: 0,
      dailyGoal: 2,
      completedMissions: [],
      todayMissions: [],
      badges: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
    } catch { state = defaultState(); }
    checkDayReset();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function checkDayReset() {
    const today = todayStr();
    if (state.lastDate && state.lastDate !== today) {
      // Check streak
      const last = new Date(state.lastDate);
      const now = new Date(today);
      const diff = Math.round((now - last) / 86400000);
      if (diff === 1 && state.missionsToday > 0) {
        state.streak++;
      } else if (diff > 1) {
        state.streak = 0;
      }
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.missionsToday = 0;
      state.todayMissions = [];
    }
    if (!state.lastDate) state.lastDate = today;
  }

  /* ---- Helpers ---- */
  function getRank() {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (state.missionsTotal >= r.min) rank = r;
    }
    return rank;
  }

  function getTodayTheme() {
    return DAY_THEMES[new Date().getDay()];
  }

  function getGoal() {
    return GOALS.find(g => g.target === state.dailyGoal) || GOALS[0];
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getRecommended() {
    const theme = getTodayTheme();
    const all = [];
    PACKS.forEach((p, pi) => p.missions.forEach((m, mi) => {
      if (theme === 'free' || m.type === theme) all.push({ pack: pi, mission: mi, ...m });
    }));
    return all;
  }

  function isMissionDone(missionId) {
    return state.completedMissions.includes(missionId);
  }

  function isMissionDoneToday(missionId) {
    return state.todayMissions.includes(missionId);
  }

  function checkBadges() {
    const earned = [];
    const has = id => state.badges.includes(id);
    const add = id => { if (!has(id)) { state.badges.push(id); earned.push(BADGES.find(b => b.id === id)); } };

    if (state.missionsTotal >= 1) add('stardust-cadet');
    if (state.missionsToday >= 3) add('wiggle-engineer');
    if (state.missionsTotal >= 5) add('hydration-pilot');
    if (state.daysActive >= 5) add('captain-consistent');

    PACKS.forEach(p => {
      const allDone = p.missions.every(m => state.completedMissions.includes(m.id));
      if (allDone) add(p.badge.id);
    });

    return earned;
  }

  /* ---- Render ---- */
  function render() {
    const el = document.getElementById('cc-app');
    if (!el) return;
    if (screen === 'bridge')   el.innerHTML = renderBridge();
    else if (screen === 'select')   el.innerHTML = renderSelect();
    else if (screen === 'active')   el.innerHTML = renderActive();
    else if (screen === 'complete') el.innerHTML = renderComplete();
    else if (screen === 'log')      el.innerHTML = renderLog();
  }

  function renderBridge() {
    const theme = getTodayTheme();
    const tl = THEME_LABELS[theme];
    const goal = getGoal();
    const rank = getRank();
    const pct = Math.min(100, Math.round((state.missionsToday / goal.target) * 100));
    const goalMet = state.missionsToday >= goal.target;
    const rec = getRecommended();
    const username = (typeof OS !== 'undefined' && OS.getSettings) ? OS.getSettings().username : 'Cadet';

    let html = `<div class="cc-bridge">`;
    // Captain greeting
    html += `<div class="cc-captain-bubble">
      <div class="cc-captain-avatar">👨‍🚀</div>
      <div class="cc-captain-text">
        <strong>Captain says:</strong><br>
        ${goalMet ? 'Mission goal ACHIEVED! You are a star, ' + username + '!' : 'Welcome aboard, ' + username + '! Ready for action?'}
      </div>
    </div>`;

    // Today's theme
    html += `<div class="cc-theme-badge">${tl.emoji} ${tl.name} — ${tl.desc}</div>`;

    // Rank
    html += `<div class="cc-rank">Rank: <strong>${rank.name}</strong></div>`;

    // Progress bar
    html += `<div class="cc-progress-section">
      <div class="cc-progress-label">Today: ${state.missionsToday} / ${goal.target} missions ${goalMet ? '✅' : ''}</div>
      <div class="cc-progress-bar"><div class="cc-progress-fill${goalMet ? ' cc-goal-met' : ''}" style="width:${pct}%"></div></div>
    </div>`;

    // Goal picker
    html += `<div class="cc-goal-row">`;
    GOALS.forEach(g => {
      const active = g.target === state.dailyGoal ? ' cc-goal-active' : '';
      html += `<button class="cc-goal-pill${active}" onclick="_ccSetGoal(${g.target})">${g.emoji} ${g.label}</button>`;
    });
    html += `</div>`;

    // Streak
    if (state.streak > 0 || state.bestStreak > 0) {
      html += `<div class="cc-streak-row">🔥 Streak: <strong>${state.streak}</strong> day${state.streak !== 1 ? 's' : ''} &nbsp;|&nbsp; Best: <strong>${state.bestStreak}</strong></div>`;
    }

    // Badges (compact row)
    if (state.badges.length > 0) {
      html += `<div class="cc-badges-row">`;
      state.badges.forEach(id => {
        const b = BADGES.find(x => x.id === id);
        if (b) html += `<span class="cc-badge-mini" title="${b.name}">${b.emoji}</span>`;
      });
      html += `</div>`;
    }

    // Start mission button
    html += `<button class="cc-start-btn" onclick="_ccGo('select')">🚀 Start Mission</button>`;

    // Recommended missions
    if (rec.length > 0) {
      html += `<div class="cc-rec-section">
        <div class="cc-rec-title">Suggested for today:</div>`;
      rec.slice(0, 3).forEach(r => {
        const done = isMissionDoneToday(r.id);
        html += `<button class="cc-rec-item${done ? ' cc-rec-done' : ''}" onclick="_ccSelectMission(${r.pack}, ${r.mission})">
          ${PACKS[r.pack].emoji} ${r.name} ${done ? '✅' : ''}
        </button>`;
      });
      html += `</div>`;
    }

    // Nav
    html += `<button class="cc-nav-link" onclick="_ccGo('log')">📋 Captain's Log</button>`;
    html += `</div>`;
    return html;
  }

  function renderSelect() {
    const theme = getTodayTheme();
    let html = `<div class="cc-select">`;
    html += `<div class="cc-select-header"><button class="cc-back-btn" onclick="_ccGo('bridge')">← Bridge</button><span>Choose Your Mission</span></div>`;

    PACKS.forEach((pack, pi) => {
      html += `<div class="cc-pack-card">
        <div class="cc-pack-header">${pack.emoji} <strong>${pack.name}</strong><br><span class="cc-pack-vibe">${pack.vibe}</span></div>
        <div class="cc-pack-missions">`;
      pack.missions.forEach((m, mi) => {
        const move = MOVES[m.moves[0]];
        const rec = theme === 'free' || m.type === theme;
        const done = isMissionDone(m.id);
        const doneToday = isMissionDoneToday(m.id);
        html += `<button class="cc-mission-item${rec ? ' cc-mission-recommended' : ''}${doneToday ? ' cc-mission-today' : ''}" onclick="_ccSelectMission(${pi}, ${mi})">
          <span class="cc-mission-name">${m.name}</span>
          <span class="cc-mission-meta">${done ? '⭐' : ''}${doneToday ? ' ✅' : ''}${rec ? ' 🎯' : ''}</span>
        </button>`;
      });
      html += `</div></div>`;
    });

    html += `</div>`;
    return html;
  }

  function renderActive() {
    const phase = PHASES[phaseIdx];
    const mission = currentMission;
    let instruction, moveEmoji;
    if (phase.id === 'warmup' || phase.id === 'hero') {
      instruction = phase.instruction;
      moveEmoji = phase.emoji;
    } else {
      const moveIdx = phaseIdx - 1; // 0,1,2 for move1,move2,move3
      const moveKey = mission.moves[moveIdx];
      const move = MOVES[moveKey];
      instruction = move.instruction;
      moveEmoji = move.emoji;
    }

    const phaseName = phase.id.startsWith('move') ? (MOVES[mission.moves[phaseIdx - 1]]?.name || phase.name) : phase.name;

    let html = `<div class="cc-active">`;
    // Phase dots
    html += `<div class="cc-phase-dots">`;
    PHASES.forEach((p, i) => {
      const cls = i < phaseIdx ? 'cc-phase-dot-done' : i === phaseIdx ? 'cc-phase-dot-active' : '';
      html += `<span class="cc-phase-dot ${cls}">${p.emoji}</span>`;
    });
    html += `</div>`;

    // Timer
    html += `<div class="cc-timer-section">
      <div class="cc-phase-name">${phase.emoji} ${phaseName}</div>
      <div class="cc-timer-display cc-pulse">${timerSeconds}</div>
      <div class="cc-instruction">${instruction}</div>
    </div>`;

    // Captain command
    html += `<div class="cc-command-bubble">
      <span class="cc-command-avatar">👨‍🚀</span>
      <span class="cc-command-text">${lastCommand}</span>
    </div>`;

    // Skip button
    html += `<button class="cc-skip-btn" onclick="_ccSkipPhase()">⏭ Done Early!</button>`;
    html += `</div>`;
    return html;
  }

  let completePraise = '';
  let completeCoins = 0;
  let completeNewBadges = [];

  function renderComplete() {
    let html = `<div class="cc-complete">`;
    html += `<div class="cc-complete-emoji">🎉</div>`;
    html += `<div class="cc-complete-title">Mission Complete!</div>`;
    html += `<div class="cc-praise">${completePraise}</div>`;
    html += `<div class="cc-coins-display">+${completeCoins} Giggle Coins! 🪙</div>`;

    // New badges
    if (completeNewBadges.length > 0) {
      html += `<div class="cc-new-badges">`;
      completeNewBadges.forEach(b => {
        html += `<div class="cc-new-badge">${b.emoji} <strong>${b.name}</strong> unlocked!</div>`;
      });
      html += `</div>`;
    }

    // Hydrate reminder
    html += `<div class="cc-hydrate">💧 Refuel the reactor! Grab some water!</div>`;

    // Buttons
    html += `<div class="cc-complete-btns">
      <button class="cc-start-btn" onclick="_ccNextMission()">🚀 Next Mission</button>
      <button class="cc-nav-link" onclick="_ccDone()">← Back to Bridge</button>
    </div>`;
    html += `</div>`;
    return html;
  }

  function renderLog() {
    const rank = getRank();
    let html = `<div class="cc-log">`;
    html += `<div class="cc-select-header"><button class="cc-back-btn" onclick="_ccGo('bridge')">← Bridge</button><span>Captain's Log</span></div>`;

    // Stats
    html += `<div class="cc-log-stats">
      <div class="cc-log-stat"><div class="cc-log-stat-val">${state.missionsTotal}</div><div class="cc-log-stat-label">Total Missions</div></div>
      <div class="cc-log-stat"><div class="cc-log-stat-val">${state.streak}</div><div class="cc-log-stat-label">Current Streak</div></div>
      <div class="cc-log-stat"><div class="cc-log-stat-val">${state.bestStreak}</div><div class="cc-log-stat-label">Best Streak</div></div>
      <div class="cc-log-stat"><div class="cc-log-stat-val">${state.daysActive}</div><div class="cc-log-stat-label">Days Active</div></div>
    </div>`;

    // Rank
    html += `<div class="cc-log-rank">Rank: <strong>${rank.name}</strong></div>`;

    // Badges grid
    html += `<div class="cc-log-section-title">Badges</div>`;
    html += `<div class="cc-badge-grid">`;
    BADGES.forEach(b => {
      const unlocked = state.badges.includes(b.id);
      html += `<div class="cc-badge-card${unlocked ? '' : ' cc-badge-locked'}">
        <div class="cc-badge-emoji">${unlocked ? b.emoji : '🔒'}</div>
        <div class="cc-badge-name">${b.name}</div>
        <div class="cc-badge-desc">${b.desc}</div>
      </div>`;
    });
    html += `</div>`;

    // Mission completion
    html += `<div class="cc-log-section-title">Mission Progress</div>`;
    PACKS.forEach(pack => {
      const done = pack.missions.filter(m => state.completedMissions.includes(m.id)).length;
      html += `<div class="cc-log-pack">${pack.emoji} ${pack.name}: ${done}/${pack.missions.length}</div>`;
    });

    html += `</div>`;
    return html;
  }

  /* ---- Timer ---- */
  function startTimer() {
    stopTimer();
    phaseIdx = 0;
    timerSeconds = PHASES[0].duration;
    lastCommand = pick(CAPTAIN_COMMANDS);
    render();
    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    timerSeconds--;
    if (timerSeconds <= 0) {
      if (phaseIdx < PHASES.length - 1) {
        advancePhase();
      } else {
        stopTimer();
        completeMission();
        return;
      }
    }
    // Rotate captain command every 8 seconds
    if (timerSeconds > 0 && timerSeconds % 8 === 0) {
      lastCommand = pick(CAPTAIN_COMMANDS);
    }
    updateTimerDisplay();
  }

  function advancePhase() {
    phaseIdx++;
    timerSeconds = PHASES[phaseIdx].duration;
    lastCommand = pick(CAPTAIN_COMMANDS);
    render(); // full re-render for phase change
  }

  function updateTimerDisplay() {
    const timerEl = document.querySelector('.cc-timer-display');
    if (timerEl) timerEl.textContent = timerSeconds;
    const cmdEl = document.querySelector('.cc-command-text');
    if (cmdEl) cmdEl.textContent = lastCommand;
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function completeMission() {
    const today = todayStr();
    state.missionsToday++;
    state.missionsTotal++;
    state.todayMissions.push(currentMission.id);
    if (!state.completedMissions.includes(currentMission.id)) {
      state.completedMissions.push(currentMission.id);
    }

    // Update days active and streak on first mission of a new day
    if (state.lastDate !== today) {
      state.daysActive++;
      if (state.lastDate) {
        const last = new Date(state.lastDate);
        const now = new Date(today);
        const diff = Math.round((now - last) / 86400000);
        if (diff === 1) {
          state.streak++;
        } else if (diff > 1) {
          state.streak = 0;
        }
        state.bestStreak = Math.max(state.bestStreak, state.streak);
      }
    }

    state.lastDate = today;

    // Award coins
    const base = 10;
    const streakBonus = Math.min(10, state.streak * 2);
    completeCoins = base + streakBonus;
    OS.awardCoins(completeCoins, 'captaincardio', '🚀', 'Captain Cardio: ' + currentMission.name);

    // Check badges
    completeNewBadges = checkBadges();
    completePraise = pick(PRAISE_LINES);

    save();
    screen = 'complete';
    render();
  }

  /* ---- Global Handlers ---- */
  window._ccGo = function(s) {
    if (s !== 'active') stopTimer();
    screen = s;
    render();
  };

  window._ccSelectMission = function(packIdx, missionIdx) {
    currentMission = PACKS[packIdx].missions[missionIdx];
    screen = 'active';
    startTimer();
  };

  window._ccStartMission = function() {
    screen = 'select';
    render();
  };

  window._ccSkipPhase = function() {
    if (phaseIdx < PHASES.length - 1) {
      advancePhase();
    } else {
      stopTimer();
      completeMission();
    }
  };

  window._ccSetGoal = function(target) {
    state.dailyGoal = target;
    save();
    render();
  };

  window._ccDone = function() {
    screen = 'bridge';
    render();
  };

  window._ccNextMission = function() {
    screen = 'select';
    render();
  };

  /* ---- App Registration ---- */
  OS.registerApp('captaincardio', {
    singleInstance: true,

    getWindowOpts() {
      return {
        id: 'captaincardio',
        title: '🚀 Captain Cardio',
        icon: '🚀',
        width: 480,
        height: 620,
        content: this.getHTML(),
      };
    },

    getHTML() {
      return '<div id="cc-app" class="cc-wrap"></div>';
    },

    onOpen(id) {
      winId = id;
      load();
      screen = 'bridge';
      render();
    },

    onClose() {
      stopTimer();
      winId = null;
    },
  });
})();
