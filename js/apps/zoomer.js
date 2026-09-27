/* ===== Zoomer — Parody Ride-Hailing App ===== */
(() => {
  const t = OS.texts('zoomer');

  /* ---- Data Constants ---- */
  const DESTINATIONS = [
    { id: 'pillow-fort', emoji: '\u{1F3F0}', name: 'Pillow Fort Plaza', address: '42 Cushion Lane, Blanket District' },
    { id: 'cookie', emoji: '\u{1F36A}', name: 'Cookie Corner', address: '7 Crumb Street, Sugar Heights' },
    { id: 'teddy-hospital', emoji: '\u{1F9F8}', name: 'Teddy Bear Hospital', address: '1 Fluff Ave, Stuffing Ward' },
    { id: 'sock-station', emoji: '\u{1F9E6}', name: 'Sock Rescue Station', address: '99 Lost Sock Blvd, Laundry Town' },
    { id: 'lava-floor', emoji: '\u{1F30B}', name: 'Lava Floor Zone', address: '0 Danger Rd, Living Room Sector' },
  ];

  const VEHICLES = [
    { id: 'squirrel', emoji: '\u{1F43F}\uFE0F', name: 'Scooter Squirrel', desc: 'Fast-ish. May stop for acorns.' },
    { id: 'rocket-car', emoji: '\u{1F680}', name: 'Rocket Car', desc: 'VERY FAST. Might go "whoooosh".' },
    { id: 'trex', emoji: '\u{1F996}', name: 'T-Rex Taxi', desc: 'Bumpy. Roars at pigeons.' },
    { id: 'unicorn', emoji: '\u{1F984}', name: 'Unicorn Unicycle', desc: 'Elegant. Slightly wobbly.' },
    { id: 'robot', emoji: '\u{1F916}', name: 'Robot Rollerblades', desc: 'Smooth. Beeps confidently.' },
  ];

  const DRIVER_NAMES = [
    'Captain Zoom', 'Sir Honks-a-Lot', 'Turbo Tina', 'Blinker Bob',
    'Lady Vroom', 'Professor U-Turn', 'Wheels McGee', 'Dash McLane',
  ];

  const TRACKING_MESSAGES = [
    'Driver accepted your ride. They look proud.',
    'Driver made a dramatic U-turn for no reason.',
    'Driver is stuck behind a marching band of ducks.',
    'Driver is circling because they forgot what houses are.',
    'Driver stopped to pet a cloud.',
    'Driver is asking a squirrel for directions.',
    'Driver waved at a mailbox thinking it was you.',
    'Driver is doing a victory lap before arriving.',
  ];

  const TRIP_MESSAGES = [
    'Please keep arms and snacks inside the vehicle.',
    'Your driver is singing their theme song.',
    'Passing through the Tickle Zone. Brace yourself.',
    'Detour! A family of rubber ducks is crossing.',
    'Your driver just winked at a traffic cone.',
    'Scenic route through the Pajama District!',
  ];

  const RATINGS = [
    { id: 'legendary', stars: 5, label: 'Legendary' },
    { id: 'zoomy', stars: 4, label: 'Pretty Zoomy' },
    { id: 'wiggly', stars: 3, label: 'A bit wiggly' },
    { id: 'sneeze', stars: 2, label: 'Driver sneezed dramatically' },
    { id: 'bird', stars: 1, label: 'A bird judged us' },
  ];

  const HONK_MESSAGES = [
    'toot toot... excuse me... toot',
    'BEEP! ...sorry, that was loud.',
    'honk honk! ...politely.',
    'meep meep! ...wait, wrong vehicle.',
  ];

  const ARRIVAL_MESSAGES = [
    'Driver has arrived! They did a little dance.',
    'Your ride is here! Driver is waving enthusiastically.',
    'Driver pulled up and honked a tiny horn.',
    'Your ride is here! Driver gave a thumbs up.',
  ];

  const THANK_YOU_MESSAGES = [
    'Thanks for zooming with us! Your driver is crying happy tears.',
    'Ride complete! Your driver will remember this forever.',
    'You rated your ride! Driver is framing this review.',
    'Thanks! Your driver just told their mom about this rating.',
    'Zoomer thanks you! A tiny parade has been organized in your honor.',
  ];

  /* ---- Helpers ---- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function $(sel) { return body ? body.querySelector(sel) : null; }

  /* ---- State ---- */
  let winId = null;
  let body = null;
  let screen = 'home';
  let destination = null;
  let vehicle = null;
  let driverName = '';
  let trackingStep = 0;
  let trackingMsgIdx = 0;
  let tripStep = 0;
  let tripMsgIdx = 0;
  let tripDone = false;
  let rating = null;
  let thankYou = '';
  let honkMsg = '';
  let trackingInterval = null;
  let tripInterval = null;
  let honkTimeout = null;

  /* ---- Renderers ---- */
  function render() {
    if (!body) return;
    switch (screen) {
      case 'home': renderHome(); break;
      case 'vehicle': renderVehicle(); break;
      case 'tracking': renderTracking(); break;
      case 'trip': renderTrip(); break;
    }
  }

  function renderHome() {
    body.innerHTML = `
      <div class="zm-wrap">
        <div class="zm-header">
          <span class="zm-logo">\u{1F697} ${t('Zoomer')}</span>
        </div>
        <div class="zm-content">
          <div class="zm-search-bar">
            <span class="zm-search-icon">\u{1F50D}</span>
            <span class="zm-search-text">${t('Where to, tiny boss?')}</span>
          </div>
          <div class="zm-dest-list">
            ${t.list('zoomer.places', DESTINATIONS).map((d, i) => `
              <button class="zm-dest-btn" onclick="window._zmDest(${i})">
                <span class="zm-dest-emoji">${d.emoji}</span>
                <div class="zm-dest-info">
                  <div class="zm-dest-name">${d.name}</div>
                  <div class="zm-dest-addr">${d.address}</div>
                </div>
                <span class="zm-dest-arrow">\u203A</span>
              </button>
            `).join('')}
          </div>
          <div class="zm-disclaimer">${t("* No real rides. No real drivers. You're not going anywhere.")}</div>
        </div>
      </div>`;
  }

  function renderVehicle() {
    body.innerHTML = `
      <div class="zm-wrap">
        <div class="zm-header zm-header-nav">
          <button class="zm-back" onclick="window._zmGo('home')">\u2190</button>
          <span class="zm-header-title">${t('Pick Your Ride')}</span>
          <span></span>
        </div>
        <div class="zm-content">
          <div class="zm-dest-banner">
            ${destination.emoji} ${t('Going to {place}', { place: '<strong>' + destination.name + '</strong>' })}
          </div>
          <div class="zm-vehicle-list">
            ${t.list('zoomer.rides', VEHICLES).map((v, i) => `
              <div class="zm-vehicle-card">
                <div class="zm-vehicle-top">
                  <span class="zm-vehicle-emoji">${v.emoji}</span>
                  <div class="zm-vehicle-info">
                    <div class="zm-vehicle-name">${v.name}</div>
                    <div class="zm-vehicle-desc">${v.desc}</div>
                  </div>
                </div>
                <button class="zm-request-btn" onclick="window._zmVehicle(${i})">${t('REQUEST RIDE')}</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderTracking() {
    const progress = Math.min(trackingStep / 5 * 100, 100);
    const driverPos = Math.min(trackingStep * 20, 85);
    const eta = Math.max(0, (5 - trackingStep) * 2);
    const messages = t.list('zoomer.tracking', TRACKING_MESSAGES);

    body.innerHTML = `
      <div class="zm-wrap">
        <div class="zm-header zm-header-nav">
          <span class="zm-header-title">${vehicle.emoji} ${t('{name} is on the way!', { name: driverName })}</span>
        </div>
        <div class="zm-content">
          <div class="zm-map">
            <div class="zm-map-grid"></div>
            <div class="zm-map-road"></div>
            <div class="zm-map-driver" style="left:${driverPos}%">${vehicle.emoji}</div>
            <div class="zm-map-you">\u{1F4CD}</div>
            <div class="zm-map-label-you">${t('YOU (probably)')}</div>
          </div>

          <div class="zm-eta">
            ${eta > 0 ? t('Arrives in ~{n} min (or one big yawn)', { n: eta }) : t('Your driver is HERE!')}
          </div>

          <div class="zm-progress-wrap">
            <div class="zm-progress-bar" style="width:${progress}%"></div>
          </div>

          <div class="zm-status-msg">
            <span class="zm-status-dot"></span>
            ${messages[trackingMsgIdx % messages.length]}
          </div>

          ${honkMsg ? `<div class="zm-honk-msg">${honkMsg}</div>` : ''}

          <button class="zm-honk-btn" onclick="window._zmHonk()">
            \u{1F514} ${t('Honk Politely')}
          </button>
        </div>
      </div>`;
  }

  function renderTrip() {
    if (tripDone && rating !== null) {
      // Phase C: Thank you
      body.innerHTML = `
        <div class="zm-wrap">
          <div class="zm-header">
            <span class="zm-header-title">\u{1F697} ${t('Zoomer')}</span>
          </div>
          <div class="zm-content zm-center">
            <div class="zm-thankyou-emoji">\u{1F389}</div>
            <div class="zm-thankyou-text">${thankYou}</div>
            <button class="zm-done-btn" onclick="window._zmDone()">${t('DONE')}</button>
          </div>
        </div>`;
      return;
    }

    if (tripDone) {
      // Phase B: Rating
      body.innerHTML = `
        <div class="zm-wrap">
          <div class="zm-header">
            <span class="zm-header-title">\u{1F697} ${t('Zoomer')}</span>
          </div>
          <div class="zm-content zm-center">
            <div class="zm-complete-stamp">${t('TRIP COMPLETE')} \u2705</div>
            <div class="zm-arrived-text">${t('You arrived at {place}!', { place: '<strong>' + destination.name + '</strong>' })}</div>
            <div class="zm-rating-label">${t('Rating time!')}</div>
            <div class="zm-rating-list">
              ${t.list('zoomer.ratings', RATINGS).map((r, i) => `
                <button class="zm-rating-btn" onclick="window._zmRate(${i})">
                  <span class="zm-rating-stars">${'\u2B50'.repeat(r.stars)}</span>
                  <span class="zm-rating-text">${r.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>`;
      return;
    }

    // Phase A: Driving
    const tripProgress = Math.min(tripStep / 4 * 100, 100);
    const tripTime = tripStep + 1;
    const giggles = tripTime * 3;
    const messages = t.list('zoomer.trip', TRIP_MESSAGES);

    body.innerHTML = `
      <div class="zm-wrap">
        <div class="zm-header zm-header-nav">
          <span class="zm-header-title">${vehicle.emoji} ${t('En route to {place}', { place: destination.name })}</span>
        </div>
        <div class="zm-content">
          <div class="zm-trip-map">
            <div class="zm-trip-road"></div>
            <div class="zm-trip-start">${vehicle.emoji}</div>
            <div class="zm-trip-end">${destination.emoji}</div>
            <div class="zm-trip-car" style="left:${Math.min(tripStep * 25, 85)}%">\u{1F697}</div>
          </div>

          <div class="zm-trip-progress-wrap">
            <div class="zm-trip-progress-bar" style="width:${tripProgress}%"></div>
          </div>

          <div class="zm-trip-time">
            ${t('Trip time: {n} {minutes} or {g} giggles', { n: tripTime, minutes: t.plural(tripTime, 'minute', 'minutes'), g: giggles })}
          </div>

          <div class="zm-status-msg">
            <span class="zm-status-dot"></span>
            ${messages[tripMsgIdx % messages.length]}
          </div>

          <div class="zm-trip-rider">
            <span class="zm-trip-rider-emoji">\u{1F9D2}</span>
            <div class="zm-trip-rider-info">
              <div class="zm-trip-rider-text">${t('Enjoying the ride!')}</div>
              <div class="zm-trip-rider-sub">${t('Driven by {name}', { name: driverName })}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ---- Global Handlers ---- */
  window._zmGo = function(s) {
    screen = s;
    render();
  };

  window._zmDest = function(idx) {
    destination = t.list('zoomer.places', DESTINATIONS)[idx];
    screen = 'vehicle';
    render();
  };

  window._zmVehicle = function(idx) {
    vehicle = t.list('zoomer.rides', VEHICLES)[idx];
    driverName = pick(t.list('zoomer.drivers', DRIVER_NAMES));
    trackingStep = 0;
    trackingMsgIdx = Math.floor(Math.random() * TRACKING_MESSAGES.length);
    honkMsg = '';
    screen = 'tracking';
    render();

    // Start tracking interval
    trackingInterval = setInterval(() => {
      trackingStep++;
      trackingMsgIdx = (trackingMsgIdx + 1) % TRACKING_MESSAGES.length;
      if (trackingStep >= 5) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        // Driver arrived — go to trip
        tripStep = 0;
        tripMsgIdx = Math.floor(Math.random() * TRIP_MESSAGES.length);
        tripDone = false;
        rating = null;
        screen = 'trip';
        render();
        startTrip();
      } else {
        render();
      }
    }, 2500);
  };

  function startTrip() {
    tripInterval = setInterval(() => {
      tripStep++;
      tripMsgIdx = (tripMsgIdx + 1) % TRIP_MESSAGES.length;
      if (tripStep >= 4) {
        clearInterval(tripInterval);
        tripInterval = null;
        tripDone = true;
      }
      render();
    }, 2500);
  }

  window._zmHonk = function() {
    honkMsg = pick(t.list('zoomer.honks', HONK_MESSAGES));
    render();
    if (honkTimeout) clearTimeout(honkTimeout);
    honkTimeout = setTimeout(() => {
      honkMsg = '';
      honkTimeout = null;
      render();
    }, 2000);
  };

  window._zmRate = function(idx) {
    rating = RATINGS[idx];
    thankYou = pick(t.list('zoomer.thanks', THANK_YOU_MESSAGES));
    render();
  };

  window._zmDone = function() {
    destination = null;
    vehicle = null;
    driverName = '';
    rating = null;
    thankYou = '';
    screen = 'home';
    render();
  };

  /* ---- App Registration ---- */
  OS.registerApp('zoomer', {
    singleInstance: true,
    getWindowOpts() {
      return { id: 'zoomer', title: t('Zoomer'), icon: '\u{1F697}', width: 420, height: 540, content: '' };
    },
    onOpen(id) {
      winId = id;
      body = document.getElementById('win-body-' + id);
      screen = 'home';
      destination = null;
      vehicle = null;
      driverName = '';
      trackingStep = 0;
      tripStep = 0;
      tripDone = false;
      rating = null;
      thankYou = '';
      honkMsg = '';
      render();
    },
    onClose() {
      if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }
      if (tripInterval) { clearInterval(tripInterval); tripInterval = null; }
      if (honkTimeout) { clearTimeout(honkTimeout); honkTimeout = null; }
      body = null;
    },
  });
})();
