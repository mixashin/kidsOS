/* ===== TinyScanner ===== */
(() => {
  const t = OS.texts('tinyscanner');

  // --- Data ---
  const PERCENT_MIX = [
    ['84% potato', '10% spaceship', '6% silent but suspicious'],
    ['60% teddy bear', '30% fluff', '10% fart absorber (heroic)'],
    ['72% snack', '18% crumbs', '10% vanished mysteriously at midnight'],
    ['55% shoe', '25% foot house', '20% stink potential (proceed bravely)'],
    ['80% dinosaur', '15% roar', '5% bathroom breaks'],
    ['67% chair', '20% throne', '13% royal butt-approved'],
    ['90% blanket', '8% cape', '2% smells like adventure and maybe socks'],
    ['49% banana', '49% boomerang', '2% slip-oops'],
    ['75% robot', '15% beep', '10% accidental fart sound effect'],
    ['65% LEGO', '20% trap', '15% toe cry (warning: tiny pain bricks)'],
    ['58% book', '22% wisdom', '20% makes you smarter and also sleepy'],
    ['70% water bottle', '30% future spill (it\'s planning something)'],
    ['40% pencil', '40% wand', '20% chew marks (not recommended, goblin)'],
    ['66% cookie', '24% happiness', '10% poof (gone already?)'],
    ['50% toy', '35% treasure', '15% mysterious sticky zone'],
    ['61% soap', '39% bubble magic', '0% poop germs (evicted)'],
    ['77% backpack', '13% chaos', '10% contains 900 papers and 1 weird rock'],
    ['68% pillow', '22% nap portal', '10% drool risk (normal)'],
    ['52% remote', '28% couch guardian', '20% disappears when adults enter room'],
    ['81% spoon', '14% shovel', '5% fart trumpet (doot doot)'],
  ];

  const OFFICIAL_NAMES = [
    'Official classification: Butt Cushion (Premium Seating Device)',
    'Species: Snackus Crunchicus (Crumb-Generating)',
    'Object ID: Stink Sock (Single, Searching, Dangerous)',
    'Designation: Poop Avoidance Tool (a.k.a. "Shoes")',
    'Category: Fart Fan (Hand-powered, extremely important)',
    'Model: Wiggly Stick 3000 (Bonk Edition)',
    'Registered: Toilet Humor Item (Certified Giggle Machine)',
    'Protocol: Homework Sheet (Causes Groans + 5% farts)',
    'Status: Giggle Grenade (Do Not Use In Serious Meetings)',
    'Material: Plastic-ish (Squeak Enhanced)',
    'Document type: Very Important Paper (Mostly Scribbles)',
    'Title: Ancient Scroll of Bedtime (parents use this)',
    'Unit: Cushion of Destiny (Sits Like A King)',
    'Name (Latin-ish): Farticus Maximus',
    'Approved by: The Great Bathroom Council',
  ];

  const WARNINGS = [
    '⚠️ CAUTION: May contain unexpected farts (not your fault)',
    '🚨 ALERT: Object is stink-adjacent',
    '✅ APPROVED: Butt-safe. Science confirmed.',
    '💨 FART LEVEL: Medium. Wind advisory issued.',
    '💩 POOP PROBABILITY: Low… but never zero.',
    '🧦 SOCK WARNING: Nearby socks detected. Danger is real.',
    '🐈 CAT INTERFERENCE: Results are now 12% cat. Meow.',
    '🚫 DO NOT PRESS: (Pressing recommended for giggles)',
    '⚠️ STICKY ZONE: Hands may become glue-ish. Eww-lol.',
    '🧻 TOILET PAPER STATUS: Heroic. Brave. Soft.',
    '🧠 BRAIN CHECK: Required. Optional. Confusing.',
    '🧼 GERM NOTICE: This item claims it\'s clean. It lies.',
    '🥦 BROCCOLI ALERT: Object might contain vegetable energy. Run.',
    '🧽 CLEAN MODE: Activated. Pretending started.',
    '🏃 RUN: This object is about to roll away for no reason.',
  ];

  const FUN_FACTS = [
    'Fun fact: This item has farted exactly 0 times. You can\'t prove anything.',
    'Fun fact: It is afraid of broccoli and math. Same.',
    'Fun fact: Tap it 3 times and it becomes 7% braver and 2% smellier.',
    'Fun fact: It once defeated a poop joke in single combat.',
    'Fun fact: It thinks it\'s a spaceship. Let it dream, astronaut butt.',
    'Fun fact: If you stare at it, it will stare back (creepy).',
    'Fun fact: It is currently judging your snack choices.',
    'Fun fact: It can sense bedtime from three rooms away.',
    'Fun fact: This object contains a secret: crumbs. Always crumbs.',
    'Fun fact: It has never paid taxes. Legendary.',
  ];

  const QUICK_HITS = [
    'This is 92% fart noise, 8% actual object.',
    'Scan complete: Certified Stink Wizard 🧙💨',
    'Result: Butt-approved ✅ (very official).',
    'This object is mostly crumb storage. Congratulations.',
    'Warning: May squeak at the worst moment.',
    'Identified as: Poop Joke Generator (Portable).',
    'Threat level: Giggle Monster.',
    'Status: Too shiny. Might be suspicious.',
    'This is a Sock Magnet. It attracts missing socks.',
    'This is a snack pretending to be a toy.',
    'Analysis: 50% normal, 50% nonsense. Accurate.',
    'Result: Stink potential: EXTREME (open a window).',
    'Official name: Bonk Stick (use responsibly-ish).',
    'This is definitely not a dragon egg. (…probably.)',
    'Detected: Pillow Fort Brick (construction approved).',
    'This object is laughing at you quietly.',
    'Classification: Tiny Chaos Machine.',
    'This is one (1) suspicious thing.',
    'Result: 100% silly. No refunds.',
    'Warning: May cause dramatic \'ewww!\'',
    'This is the reason your room is messy.',
    'This object has mystery goo. Don\'t ask.',
    'Identified: Toilet Paper Hero 🧻🦸',
    'This item is too powerful. Scanner scared.',
    'Detected: Fart Fan Deluxe 💨',
    'Object mood: Grumpy (feed it snacks).',
    'Result: Glitter detected. Disaster imminent.',
    'This is a snack trap. It steals cookies.',
    'Object seems to be watching you. Blink twice.',
    'Scan says: Nice try. That\'s a banana.',
    'Result: Extremely huggable. May drool.',
    'This is Laundry Volcano evidence.',
    'Detected: Butt Cushion Pro Max.',
    'This object is allergic to homework.',
    'Warning: May summon parents.',
    'Result: Squeak activated. Everyone will look at you.',
    'This item is stink-adjacent and proud.',
    'Scan complete: You are now 3% smarter.',
    'This object is crumb-proof (lie).',
    'Detected: Poop Probability: 2% (that\'s enough to worry).',
  ];

  const RARE_RESULTS = [
    '✨ RARE FIND: 100% DRAGON (do not boop)',
    '✨ RARE FIND: Potato Supreme++ 🥔👑 (maximum potato)',
    '🏆 LEGENDARY: Ancient Relic of the Couch Realm (smells like snacks)',
    '💨 MYTHIC: Fartnado Detected. Seek shelter under blanket.',
    '💩 ULTRA RARE: Poop Joke Level: FINAL BOSS',
    '🧻 HEROIC DROP: Toilet Paper Shield (blocks all yuck)',
    '🐉 COSMIC: Stardust disguised as a sock. Don\'t question it.',
    '🧙 TOP SECRET: Wizard Certification: Level 9 Butt Sorcery',
    '🎭 DRAMA MODE: Object is being extra. Respect it.',
    '🥦 FORBIDDEN: Broccoli detected… scanner shutting down. Bye.',
  ];

  const MYSTERY_RESULTS = [
    'Unknown object. Probably a wizard.',
    'Cannot identify. It is too powerful.',
    'Scanner confused. Object is hiding.',
    'Error 404: Identity not found. Try being less mysterious.',
    'The scanner refuses to answer. It\'s scared.',
    'Results classified. Ask a penguin.',
  ];

  const SCAN_STATUSES = [
    'Consulting the Snack Database…',
    'Asking a squirrel…',
    'Loading 1 brain cell… done.',
    'Measuring wiggliness…',
    'Sniffing digitally…',
    'Calculating silliness…',
    'Guessing confidently…',
    'Checking for boogers…',
    'Analyzing stink levels…',
    'Downloading more imagination…',
  ];

  const MYSTERY_STATUSES = [
    'Confusing the scanner…',
    'Hiding from results…',
    'Asking the void…',
    'Shaking magic 8-ball…',
  ];

  const BADGES = [
    { id: 'scientist', name: 'Certified Scientist', emoji: '🔬', req: 5 },
    { id: 'potato', name: 'Potato Detective', emoji: '🥔', req: 10 },
    { id: 'glitter', name: 'Glitter Hazard Specialist', emoji: '✨', req: 20 },
    { id: 'supreme', name: 'Supreme Scanner', emoji: '👑', req: 30 },
    { id: 'nonsense', name: 'Master of Nonsense', emoji: '🧙', req: 50 },
  ];

  const HOME_TIPS = [
    'Hold still… or don\'t. We\'re brave.',
    'Warning: This scanner is powered by imagination.',
    'Point at anything. We\'ll make stuff up.',
    'Science is happening. Probably.',
    'Aim carefully. Or don\'t. Same result.',
  ];

  const STORAGE_KEY = 'kidsOS_tinyscanner';

  // --- State ---
  let screen = 'home';
  let seriousMode = false;
  let mysteryMode = false;
  let lastResult = null;
  let collection = [];
  let scanInterval = null;
  let scanStep = 0;
  let scanStatus = '';
  let newBadge = null;
  let homeTip = '';
  let cameraStream = null;
  let cameraAvailable = false;
  let capturedImage = null;

  // --- Helpers ---
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rng(n) { return Math.floor(Math.random() * n); }

  async function startCamera() {
    const video = document.getElementById('ts-video');
    if (!video || inDock()) return;
    // A rerender makes a new <video>: reuse the open stream, never open a second one
    if (cameraStream) { video.srcObject = cameraStream; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Window closed or another call finished while the permission prompt was open
      const current = document.getElementById('ts-video');
      if (cameraStream || !current || inDock()) { stream.getTracks().forEach(t => t.stop()); return; }
      cameraStream = stream;
      current.srcObject = stream;
      cameraAvailable = true;
    } catch (e) {
      cameraAvailable = false;
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
  }

  // The app is open and not in view (Home button)
  function inDock() {
    const win = document.getElementById('window_tinyscanner');
    return !!win && win.classList.contains('minimized');
  }

  function captureFrame() {
    const video = document.getElementById('ts-video');
    if (!video || !video.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    return c.toDataURL('image/jpeg', 0.8);
  }

  function loadCollection() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) collection = JSON.parse(data);
    } catch (e) { collection = []; }
  }

  function saveCollection() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collection)); } catch (e) {}
  }

  function generateResult() {
    if (mysteryMode) return { type: 'mystery', text: pick(t.list('tinyscanner.mystery', MYSTERY_RESULTS)) };
    if (Math.random() < 0.05) return { type: 'rare', text: pick(t.list('tinyscanner.rare', RARE_RESULTS)) };
    const cat = rng(5);
    if (cat === 0) {
      const mix = pick(t.list('tinyscanner.mix', PERCENT_MIX));
      return { type: 'percent', parts: mix, text: mix.join(' / ') };
    }
    if (cat === 1) return { type: 'official', text: pick(t.list('tinyscanner.official', OFFICIAL_NAMES)) };
    if (cat === 2) return { type: 'warning', text: pick(t.list('tinyscanner.warnings', WARNINGS)) };
    if (cat === 3) return { type: 'funfact', text: pick(t.list('tinyscanner.facts', FUN_FACTS)) };
    return { type: 'quick', text: pick(t.list('tinyscanner.quick', QUICK_HITS)) };
  }

  function getEarnedBadges() {
    return t.list('tinyscanner.badges', BADGES).filter(b => collection.length >= b.req);
  }

  // --- Render ---
  function render() {
    if (screen === 'scanning') return renderScanning();
    if (screen === 'result') return renderResult();
    if (screen === 'sticker') return renderSticker();
    if (screen === 'collection') return renderCollection();
    return renderHome();
  }

  function renderHome() {
    if (!homeTip) homeTip = pick(t.list('tinyscanner.tips', HOME_TIPS));
    return `
    <div class="ts-app">
      <div class="ts-camera">
        <video id="ts-video" autoplay playsinline muted></video>
        <div class="ts-hud">
          <div class="ts-crosshair"></div>
          <div class="ts-scan-lines"></div>
          <div class="ts-hud-text">${homeTip}</div>
        </div>
        <div class="ts-controls">
          <div class="ts-toggles">
            <label class="ts-toggle" onclick="window._tsToggleSerious()">
              <span class="ts-toggle-check ${seriousMode ? 'active' : ''}"></span>
              🧐 ${t('Serious Mode')}
            </label>
            <button class="ts-mystery-btn" onclick="window._tsMystery()" title="${t('Mystery Mode')}">🎲</button>
          </div>
          <button class="ts-scan-btn" onclick="window._tsScan()">🔍 ${t('SCAN')}</button>
          <button class="ts-collection-btn" onclick="window._tsShowCollection()">📦 ${t('My Scans ({n})', { n: collection.length })}</button>
        </div>
      </div>
    </div>`;
  }

  function renderScanning() {
    const labels = [t('Measuring…'), t('Sniffing…'), t('Calculating…'), t('Guessing…')];
    const photoBg = capturedImage ? ` style="background-image:url('${capturedImage}');" ` : '';
    return `
    <div class="ts-app">
      <div class="ts-scanning ${capturedImage ? 'ts-has-photo' : ''}"${photoBg}>
        ${capturedImage ? '<div class="ts-photo-overlay"></div>' : ''}
        <div class="ts-scan-anim">
          <div class="ts-scan-beam"></div>
        </div>
        <div class="ts-scan-info">
          <div class="ts-beep">${t('BEEP… BEEP… boop')}</div>
          <div class="ts-status">${scanStatus}</div>
          <div class="ts-progress-wrap">
            <div class="ts-progress-bar" style="width:${scanStep * 25}%"></div>
          </div>
          <div class="ts-progress-label">${labels[Math.min(scanStep, 3)]}</div>
        </div>
      </div>
    </div>`;
  }

  function renderResult() {
    if (!lastResult) return renderHome();
    const isRare = lastResult.type === 'rare';
    const isMystery = lastResult.type === 'mystery';

    let resultHTML;
    if (seriousMode && !isRare && !isMystery) {
      resultHTML = `
        <div class="ts-serious-header">📋 ${t('CLASSIFIED REPORT #{n}', { n: 1000 + rng(9000) })}</div>
        <div class="ts-result-text ts-serious">${lastResult.text}</div>
        <div class="ts-serious-footer">${t('— Department of Tiny Science')}</div>`;
    } else if (lastResult.type === 'percent') {
      resultHTML = `<div class="ts-result-parts">
        ${lastResult.parts.map((p, i) => `<div class="ts-part" style="animation-delay:${i * 0.15}s">${p}</div>`).join('')}
      </div>`;
    } else {
      resultHTML = `<div class="ts-result-text ${isRare ? 'ts-rare' : ''} ${isMystery ? 'ts-mystery-text' : ''}">${lastResult.text}</div>`;
    }

    let badgeHTML = '';
    if (newBadge) {
      badgeHTML = `<div class="ts-badge-earned">🏅 ${t('Badge Earned: {badge}!', { badge: newBadge.emoji + ' ' + newBadge.name })}</div>`;
    }

    const photoBg = capturedImage ? ` style="background-image:url('${capturedImage}');" ` : '';
    return `
    <div class="ts-app">
      <div class="ts-result ${capturedImage ? 'ts-has-photo' : ''}"${photoBg}>
        ${capturedImage ? '<div class="ts-photo-overlay"></div>' : ''}
        <div class="ts-result-header">${isRare ? '✨ ' + t('RARE SCAN RESULT') + ' ✨' : isMystery ? '🎲 ' + t('MYSTERY RESULT') : '📋 ' + t('SCAN RESULT')}</div>
        ${resultHTML}
        ${badgeHTML}
        <div class="ts-result-actions">
          <button class="ts-btn ts-btn-primary" onclick="window._tsBack()">🔍 ${t('SCAN AGAIN')}</button>
          <button class="ts-btn ts-btn-save" onclick="window._tsSave()">📦 ${t('Save')}</button>
          <button class="ts-btn ts-btn-sticker" onclick="window._tsSticker()">🏷️ ${t('Sticker')}</button>
        </div>
      </div>
    </div>`;
  }

  function renderSticker() {
    if (!lastResult) return renderHome();
    let label = lastResult.type === 'percent' && lastResult.parts ? lastResult.parts[0] : lastResult.text;
    if (label.length > 45) label = label.slice(0, 45) + '…';
    return `
    <div class="ts-app">
      <div class="ts-sticker-screen">
        <div class="ts-sticker-title">🏷️ ${t('Your Sticker')}</div>
        <div class="ts-sticker">
          <div class="ts-sticker-badge">✔️ ${t('SCANNED')}</div>
          <div class="ts-sticker-label">${label}</div>
          <div class="ts-sticker-footer">${t('Certified by TinyScanner™')}</div>
        </div>
        <div class="ts-result-actions">
          <button class="ts-btn ts-btn-primary" onclick="window._tsBack()">🔍 ${t('SCAN AGAIN')}</button>
          <button class="ts-btn ts-btn-save" onclick="window._tsBack()">⬅️ ${t('Back')}</button>
        </div>
      </div>
    </div>`;
  }

  function renderCollection() {
    const earned = getEarnedBadges();
    const badgesHTML = earned.length > 0
      ? `<div class="ts-badges">${earned.map(b => `<span class="ts-badge-icon" title="${b.name}">${b.emoji}</span>`).join('')}</div>` : '';

    let cardsHTML;
    if (collection.length === 0) {
      cardsHTML = '<div class="ts-empty">' + t('No scans yet! Go scan something silly.') + '</div>';
    } else {
      cardsHTML = collection.slice().reverse().map(item => `
        <div class="ts-scan-card ${item.rare ? 'ts-card-rare' : ''}">
          <div class="ts-card-text">${item.text.length > 65 ? item.text.slice(0, 65) + '…' : item.text}</div>
          <div class="ts-card-date">${item.date}</div>
        </div>`).join('');
    }

    return `
    <div class="ts-app">
      <div class="ts-collection">
        <div class="ts-col-header">
          <button class="ts-back-btn" onclick="window._tsBack()">⬅️</button>
          <span>📦 ${t('My Scans ({n})', { n: collection.length })}</span>
        </div>
        ${badgesHTML}
        <div class="ts-col-grid">${cardsHTML}</div>
      </div>
    </div>`;
  }

  // --- Handlers ---
  function rerender() {
    const el = document.getElementById('win-body-tinyscanner');
    if (el) el.innerHTML = render();
    if (screen === 'home') startCamera();
  }

  function startScan(isMystery) {
    capturedImage = captureFrame();
    stopCamera();
    mysteryMode = isMystery;
    screen = 'scanning';
    scanStep = 0;
    scanStatus = isMystery ? pick(t.list('tinyscanner.mystery-status', MYSTERY_STATUSES)) : pick(t.list('tinyscanner.status', SCAN_STATUSES));
    newBadge = null;
    rerender();

    scanInterval = setInterval(() => {
      scanStep++;
      scanStatus = isMystery ? pick(t.list('tinyscanner.mystery-status', MYSTERY_STATUSES)) : pick(t.list('tinyscanner.status', SCAN_STATUSES));
      if (scanStep >= 4) {
        clearInterval(scanInterval);
        scanInterval = null;
        lastResult = generateResult();
        screen = 'result';
      }
      rerender();
    }, 500);
  }

  window._tsScan = function () {
    startScan(false);
  };

  window._tsMystery = function () {
    startScan(true);
  };

  window._tsToggleSerious = function () {
    seriousMode = !seriousMode;
    rerender();
  };

  window._tsSave = function () {
    if (!lastResult) return;
    collection.push({
      text: lastResult.text,
      type: lastResult.type,
      rare: lastResult.type === 'rare',
      date: new Date().toLocaleDateString(OS.locale()),
    });
    saveCollection();
    // Check for new badge
    const badge = t.list('tinyscanner.badges', BADGES).find(b => b.req === collection.length);
    if (badge) { newBadge = badge; rerender(); return; }
    // Flash saved
    const btn = document.querySelector('.ts-btn-save');
    if (btn) { btn.textContent = '✅ ' + t('Saved!'); btn.disabled = true; }
  };

  window._tsSticker = function () {
    screen = 'sticker';
    rerender();
  };

  window._tsShowCollection = function () {
    stopCamera();
    screen = 'collection';
    rerender();
  };

  window._tsBack = function () {
    screen = 'home';
    homeTip = pick(t.list('tinyscanner.tips', HOME_TIPS));
    rerender();
  };

  // --- App Registration ---
  OS.registerApp('tinyscanner', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'tinyscanner',
        title: t('TinyScanner'),
        icon: '🔍',
        width: 420,
        height: 540,
        content: this.getHTML(),
      };
    },
    getHTML() { return render(); },
    onOpen() { loadCollection(); startCamera(); },
    // The camera is on only while the child sees the app
    onMinimize() { stopCamera(); },
    onRestore() { if (screen === 'home') startCamera(); },
    onClose() {
      stopCamera();
      if (scanInterval) { clearInterval(scanInterval); scanInterval = null; }
      screen = 'home';
      scanStep = 0;
      lastResult = null;
      newBadge = null;
      mysteryMode = false;
      capturedImage = null;
    },
  });
})();
