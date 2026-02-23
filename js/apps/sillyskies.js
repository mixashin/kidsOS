/* ===== SillySkies — Fake Kids Weather App ===== */
(() => {
  /* ---- Data Constants ---- */
  const PLACES = [
    { id: 'pillowtown', name: 'Pillow Town', emoji: '\u{1F6CF}\uFE0F' },
    { id: 'candycanyon', name: 'Candy Canyon', emoji: '\u{1F36C}' },
    { id: 'dinobeach', name: 'Dinosaur Beach', emoji: '\u{1F996}' },
    { id: 'spaceyard', name: 'Space Backyard', emoji: '\u{1F680}' },
  ];

  const WEATHER_TYPES = [
    { name: 'Meatball Blizzard', emoji: '\u{1F9C6}', feelsLike: 'a fridge full of pasta', warning: 'Meatball Advisory!', bring: ['Spaghetti umbrella', 'Sauce boots', 'Parmesan helmet'], wear: 'Full pasta armor' },
    { name: 'Rainbow Drizzle', emoji: '\u{1F308}', feelsLike: 'a unicorn sneezed', bring: ['Glitter bucket', 'Color catcher', 'Rainbow jar'], wear: 'Sparkly raincoat' },
    { name: 'Sneezing Fog', emoji: '\u{1F32B}\uFE0F', feelsLike: 'walking inside a tissue', warning: 'Gesundheit Zone!', bring: ['Tissue scarf', 'Nose plugs', 'Fog horn'], wear: 'Anti-sneeze goggles' },
    { name: 'Gummy Bear Heatwave', emoji: '\u{1F525}', feelsLike: 'a melted candy store', bring: ['Gummy fan', 'Sugar sunscreen', 'Popsicle sword'], wear: 'Gummy bear swimsuit' },
    { name: 'Sock Tornado', emoji: '\u{1F32A}\uFE0F', feelsLike: 'laundry day went wrong', warning: 'Missing Socks Alert!', bring: ['Sock lasso', 'Clothespin shield', 'Lint roller'], wear: 'Double socks on each foot' },
    { name: 'Pancake Clouds', emoji: '\u{1F95E}', feelsLike: 'breakfast in the sky', bring: ['Syrup bottle', 'Butter parachute', 'Fork kite'], wear: 'Waffle hat' },
    { name: 'Nacho Storm', emoji: '\u{1F9C0}', feelsLike: 'cheesy and crunchy', bring: ['Salsa shield', 'Chip surfboard', 'Cheese umbrella'], wear: 'Nachoprene wetsuit' },
    { name: 'Bubble Fog', emoji: '\u{1FAE7}', feelsLike: 'a bathtub without water', bring: ['Bubble wand', 'Pop-proof vest', 'Soap shoes'], wear: 'Bubble wrap suit' },
    { name: 'Pizza Heat', emoji: '\u{1F355}', feelsLike: 'an oven with a breeze', warning: 'Extra Cheese Warning!', bring: ['Pepperoni frisbee', 'Crust walking stick', 'Cheese goggles'], wear: 'Pizza slice hat' },
    { name: 'Frog Rain', emoji: '\u{1F438}', feelsLike: 'a pond fell from the sky', bring: ['Lily pad helmet', 'Frog catcher net', 'Ribbit translator'], wear: 'Full frog costume' },
    { name: 'Glitter Snow', emoji: '\u2728', feelsLike: 'a craft store exploded', bring: ['Sparkle shovel', 'Glitter goggles', 'Shimmer sled'], wear: 'Disco snowsuit' },
    { name: 'Homework Clouds', emoji: '\u{1F4DA}', feelsLike: 'a boring afternoon', warning: 'Study Alert!', bring: ['Eraser sword', 'Pencil wand', 'Book shield'], wear: 'Thinking cap' },
    { name: 'Jelly Earthquake', emoji: '\u{1F36E}', feelsLike: 'the ground is wiggling', bring: ['Wobbly shoes', 'Jelly jar', 'Spoon surfboard'], wear: 'Bouncy boots' },
    { name: 'Popcorn Flurries', emoji: '\u{1F37F}', feelsLike: 'movie night outside', bring: ['Butter bucket', 'Popcorn bag', 'Salt shaker'], wear: 'Popcorn bucket hat' },
    { name: 'Pillow Hail', emoji: '\u{1F6CF}\uFE0F', feelsLike: 'a sleepover attack', bring: ['Pillow shield', 'Blanket cape', 'Teddy bear bodyguard'], wear: 'Pajama armor' },
    { name: 'Spaghetti Cyclone', emoji: '\u{1F35D}', feelsLike: 'a spinning bowl of noodles', warning: 'Noodle Tangle Zone!', bring: ['Fork helicopter', 'Sauce goggles', 'Garlic bread raft'], wear: 'Colander helmet' },
    { name: 'Confetti Burst', emoji: '\u{1F389}', feelsLike: 'a surprise party', bring: ['Party hat', 'Confetti vacuum', 'Streamer lasso'], wear: 'Birthday suit (the party kind!)' },
    { name: 'Chocolate Drizzle', emoji: '\u{1F36B}', feelsLike: 'a dessert waterfall', bring: ['Chocolate bucket', 'Wafer raft', 'Marshmallow umbrella'], wear: 'Sprinkle-proof poncho' },
    { name: 'Banana Breeze', emoji: '\u{1F34C}', feelsLike: 'a smoothie on a windy day', bring: ['Peel-proof boots', 'Banana phone', 'Smoothie cup'], wear: 'Yellow windbreaker' },
    { name: 'Taco Tuesday Storm', emoji: '\u{1F32E}', feelsLike: 'a fiesta in the sky', warning: 'Extra Salsa Advisory!', bring: ['Tortilla umbrella', 'Guacamole goggles', 'Hot sauce raincoat'], wear: 'Sombrero helmet' },
  ];

  const STAT_TEMPLATES = [
    s => `Chance of hiccups: ${s(20,90)}%`,
    s => `Wind speed: ${s(1,50)} hats per hour`,
    s => `Silliness index: ${s(3,10)}/10`,
    s => `Chance of giggles: ${s(40,100)}%`,
    s => `Puddle count: ${s(2,200)} puddles`,
    s => `Snack radar: ${s(1,5)} snacks nearby`,
    s => `Pillow pressure: ${s(10,99)} fluffs`,
    s => `Wiggle factor: ${s(1,10)} wiggles/min`,
    s => `Unicorn sightings: ${s(0,3)} today`,
    s => `Dance probability: ${s(30,100)}%`,
  ];

  const JOKES = [
    "Our meteorologist tried to catch the fog yesterday. He mist.",
    "Today's forecast was brought to you by a cloud that couldn't stop laughing.",
    "We asked the sun for a comment. It said 'No shade.'",
    "BREAKING: Local puddle claims to be an ocean. More at 11.",
    "Our weather balloon came back with a note: 'It's weird up here.'",
    "Scientists confirm: jumping in puddles increases happiness by 400%.",
    "ALERT: A flock of rubber ducks was spotted heading north.",
    "The wind filed a complaint about being called 'breezy.' It prefers 'gusty.'",
    "Clouds today are extra fluffy. Like, suspiciously fluffy.",
    "Temperature update: it's exactly 'jacket or no jacket' degrees outside.",
    "The fog is so thick you could spread it on toast.",
    "A rainbow was seen doing stretches. Must be warming up.",
    "Local snowflake insists it's 'one of a kind.' We checked. It's true.",
    "Our weather satellite sent back a selfie instead of data today.",
    "Forecast accuracy today: approximately yes.",
  ];

  const SILLY_UNITS = ['Giggles', 'Marshmallows', 'Wiggles', 'Sparkles'];

  const SKY_OPTIONS = [
    { name: 'Clouds', emoji: '\u2601\uFE0F' },
    { name: 'Tacos', emoji: '\u{1F32E}' },
    { name: 'Balloons', emoji: '\u{1F388}' },
    { name: 'Confetti', emoji: '\u{1F38A}' },
  ];

  const WIND_OPTIONS = [
    { name: 'Sleepy', emoji: '\u{1F634}' },
    { name: 'Zoomy', emoji: '\u{1F4A8}' },
    { name: 'Pogo-Stick', emoji: '\u{1F538}' },
  ];

  const MOOD_OPTIONS = [
    { name: 'Grumpy', emoji: '\u{1F624}' },
    { name: 'Silly', emoji: '\u{1F92A}' },
    { name: 'Heroic', emoji: '\u{1F9B8}' },
  ];

  const MIXED_RESULTS = [
    ['Grumpy Taco Drizzle', 'Sleepy Cloud Blanket', 'Heroic Balloon Storm', 'Silly Confetti Cyclone'],
    ['Zoomy Grump Fog', 'Turbo Silly Shower', 'Pogo Cloud Bounce', 'Mega Taco Twister'],
    ['Balloon Fury', 'Confetti Tantrum', 'Taco Tornado of Doom', 'Cloud Pillow Fight'],
    ['Sleepy Hero Wind', 'Silly Pogo Rain', 'Grumpy Zoomy Haze', 'Heroic Confetti Blast'],
  ];

  const MIXED_LINES = [
    ["Watch out for flying {sky}!", "The wind feels {mood} and {wind} today."],
    ["Experts say: stay {mood}.", "{sky} spotted falling from the sky at {wind} speed."],
    ["Local {sky} report: it's getting {mood} out there.", "Wind advisory: {wind} gusts of pure {mood} energy."],
    ["The {sky} are {mood} today.", "Forecasters recommend {wind} dancing to stay warm."],
  ];

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---- Seeded Random (same as TreasureMapper) ---- */
  function seedRand(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    h = (h & 0x7fffffff) || 1;
    return function() { h = (h * 16807) % 2147483647; return (h - 1) / 2147483646; };
  }

  function randInt(rand, min, max) { return min + Math.floor(rand() * (max - min + 1)); }
  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }

  /* ---- State ---- */
  let selectedPlace = 0;
  let spinCount = 0;
  let selectedDay = null;
  let currentScreen = 'home';
  let mixSky = 0, mixWind = 0, mixMood = 0;
  let mixResult = null;

  /* ---- Date helpers ---- */
  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function weekStr() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor(((d - start) / 86400000 + start.getDay()) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  /* ---- Weather generation ---- */
  function getWeatherForDay(placeIdx, dayOffset) {
    const place = PLACES[placeIdx];
    const seed = place.id + '-' + dayOffset + '-' + (dayOffset === 0 ? todayStr() : weekStr()) + '-' + spinCount;
    const rand = seedRand(seed);
    const weather = pick(rand, WEATHER_TYPES);
    const temp = randInt(rand, 5, 40);
    const unit = pick(rand, SILLY_UNITS);
    return { weather, temp, unit, rand };
  }

  function getStatsForDay(placeIdx, dayOffset) {
    const { rand } = getWeatherForDay(placeIdx, dayOffset);
    // burn a few to decorrelate
    rand(); rand(); rand();
    const pool = [...STAT_TEMPLATES];
    const stats = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(rand() * pool.length);
      const fn = pool.splice(idx, 1)[0];
      stats.push(fn((min, max) => randInt(rand, min, max)));
    }
    return stats;
  }

  function getDayName(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()];
  }

  /* ---- Render helpers ---- */
  function renderHome() {
    const place = PLACES[selectedPlace];
    const { weather, temp, unit } = getWeatherForDay(selectedPlace, 0);
    const stats = getStatsForDay(selectedPlace, 0);

    return `
      <div class="ss-header">
        <span class="ss-header-icon">\u{1F308}</span> Today on SillySkies
      </div>
      <div class="ss-places">
        ${PLACES.map((p, i) => `
          <button class="ss-place-btn${i === selectedPlace ? ' ss-active' : ''}" onclick="window._ss.selectPlace(${i})">
            ${p.emoji} ${p.name}
          </button>
        `).join('')}
      </div>
      <div class="ss-today-card">
        <div class="ss-weather-icon" onclick="window._ss.bounceIcon(this)">${weather.emoji}</div>
        <div class="ss-weather-name">${weather.name}</div>
        <div class="ss-temp">${temp}\u00B0 ${unit}</div>
        <div class="ss-feels">Feels like ${weather.feelsLike}</div>
        ${weather.warning ? `<div class="ss-warning">\u26A0\uFE0F ${weather.warning}</div>` : ''}
        <div class="ss-stats">
          ${stats.map(s => `<div class="ss-stat">${s}</div>`).join('')}
        </div>
      </div>
      <div class="ss-actions">
        <button class="ss-btn ss-btn-primary" onclick="window._ss.goForecast()">\u{1F4C5} See Forecast</button>
        <button class="ss-btn ss-btn-secondary" onclick="window._ss.spin()">\u{1F300} Spin the Sky</button>
      </div>
      <div class="ss-nav-row">
        <button class="ss-nav-btn" onclick="window._ss.goMixer()">\u{1F3A8} Mix-a-Forecast</button>
      </div>`;
  }

  function renderForecast() {
    const place = PLACES[selectedPlace];
    return `
      <div class="ss-header">
        <button class="ss-back" onclick="window._ss.goHome()">\u2190</button>
        <span class="ss-header-icon">\u{1F4C5}</span> 7 Days \u2014 ${place.emoji} ${place.name}
      </div>
      <div class="ss-forecast-list">
        ${Array.from({length: 7}, (_, i) => {
          const { weather, temp, unit } = getWeatherForDay(selectedPlace, i);
          return `
            <div class="ss-forecast-card" onclick="window._ss.goDay(${i})">
              <div class="ss-fc-day">${getDayName(i)}</div>
              <div class="ss-fc-icon">${weather.emoji}</div>
              <div class="ss-fc-info">
                <div class="ss-fc-name">${weather.name}</div>
                <div class="ss-fc-temp">${temp}\u00B0 ${unit}</div>
                <div class="ss-fc-feels">Feels like ${weather.feelsLike}</div>
              </div>
              ${weather.warning ? `<div class="ss-fc-badge">\u26A0\uFE0F</div>` : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  function renderDayDetails() {
    const day = selectedDay;
    const { weather, temp, unit, rand } = getWeatherForDay(selectedPlace, day);
    // pick 3 jokes
    rand(); rand();
    const jokePool = [...JOKES];
    const jokes = [];
    for (let i = 0; i < 3 && jokePool.length; i++) {
      const idx = Math.floor(rand() * jokePool.length);
      jokes.push(jokePool.splice(idx, 1)[0]);
    }

    return `
      <div class="ss-header">
        <button class="ss-back" onclick="window._ss.goForecast()">\u2190</button>
        <span class="ss-header-icon">\u{1F4DC}</span> Forecast Story \u2014 ${getDayName(day)}
      </div>
      <div class="ss-day-hero">
        <div class="ss-weather-icon ss-float" onclick="window._ss.bounceIcon(this)">${weather.emoji}</div>
        <div class="ss-weather-name">${weather.name}</div>
        <div class="ss-temp">${temp}\u00B0 ${unit}</div>
        ${weather.warning ? `<div class="ss-warning">\u26A0\uFE0F ${weather.warning}</div>` : ''}
      </div>
      <div class="ss-detail-section">
        <div class="ss-section-title">\u{1F399}\uFE0F Meteorologist Says:</div>
        ${jokes.map(j => `<div class="ss-joke">"${j}"</div>`).join('')}
      </div>
      <div class="ss-detail-section">
        <div class="ss-section-title">\u{1F455} What to Wear:</div>
        <div class="ss-wear">${weather.wear}</div>
      </div>
      <div class="ss-detail-section">
        <div class="ss-section-title">\u{1F392} What to Bring:</div>
        <div class="ss-bring-list">
          ${weather.bring.map(b => `<div class="ss-bring-item">\u2022 ${b}</div>`).join('')}
        </div>
      </div>
      <div class="ss-actions">
        <button class="ss-btn ss-btn-primary" onclick="window._ss.nextDay()">${day < 6 ? '\u27A1\uFE0F Next Day' : '\u{1F504} Back to Today'}</button>
        <button class="ss-btn ss-btn-secondary" onclick="window._ss.goForecast()">\u{1F4C5} Full Forecast</button>
      </div>`;
  }

  function renderMixer() {
    const resultHtml = mixResult ? `
      <div class="ss-mix-result">
        <div class="ss-mix-result-name">${mixResult.emoji} ${mixResult.name}</div>
        <div class="ss-mix-result-lines">
          ${mixResult.lines.map(l => `<div>${l}</div>`).join('')}
        </div>
        <div class="ss-silliness">
          <span>Silliness Score:</span>
          <div class="ss-meter">
            <div class="ss-meter-fill" style="width:${mixResult.score * 10}%"></div>
          </div>
          <span class="ss-meter-label">${mixResult.score}/10</span>
        </div>
      </div>` : '';

    return `
      <div class="ss-header">
        <button class="ss-back" onclick="window._ss.goHome()">\u2190</button>
        <span class="ss-header-icon">\u{1F3A8}</span> Mix-a-Forecast
      </div>
      <div class="ss-mixer">
        <div class="ss-mixer-group">
          <div class="ss-mixer-label">\u2601\uFE0F Sky Stuff</div>
          <div class="ss-mixer-pills">
            ${SKY_OPTIONS.map((o, i) => `
              <button class="ss-pill${i === mixSky ? ' ss-active' : ''}" onclick="window._ss.setSky(${i})">
                ${o.emoji} ${o.name}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="ss-mixer-group">
          <div class="ss-mixer-label">\u{1F4A8} Wind</div>
          <div class="ss-mixer-pills">
            ${WIND_OPTIONS.map((o, i) => `
              <button class="ss-pill${i === mixWind ? ' ss-active' : ''}" onclick="window._ss.setWind(${i})">
                ${o.emoji} ${o.name}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="ss-mixer-group">
          <div class="ss-mixer-label">\u{1F3AD} Mood</div>
          <div class="ss-mixer-pills">
            ${MOOD_OPTIONS.map((o, i) => `
              <button class="ss-pill${i === mixMood ? ' ss-active' : ''}" onclick="window._ss.setMood(${i})">
                ${o.emoji} ${o.name}
              </button>
            `).join('')}
          </div>
        </div>
        <button class="ss-btn ss-btn-primary ss-generate-btn" onclick="window._ss.generate()">\u26A1 Generate Forecast!</button>
        ${resultHtml}
      </div>`;
  }

  /* ---- Main render ---- */
  function render() {
    const el = document.getElementById('ss-content');
    if (!el) return;
    let html;
    switch (currentScreen) {
      case 'home': html = renderHome(); break;
      case 'forecast': html = renderForecast(); break;
      case 'day': html = renderDayDetails(); break;
      case 'mixer': html = renderMixer(); break;
      default: html = renderHome();
    }
    el.innerHTML = html;
  }

  /* ---- Event handlers ---- */
  window._ss = {
    selectPlace(i) { selectedPlace = i; spinCount = 0; currentScreen = 'home'; render(); },
    spin() { spinCount++; render(); },
    bounceIcon(el) {
      el.classList.remove('ss-bounce');
      void el.offsetWidth;
      el.classList.add('ss-bounce');
    },
    goHome() { currentScreen = 'home'; render(); },
    goForecast() { currentScreen = 'forecast'; render(); },
    goDay(i) { selectedDay = i; currentScreen = 'day'; render(); },
    nextDay() {
      if (selectedDay < 6) { selectedDay++; } else { selectedDay = 0; currentScreen = 'home'; }
      render();
    },
    goMixer() { currentScreen = 'mixer'; mixResult = null; render(); },
    setSky(i) { mixSky = i; mixResult = null; render(); },
    setWind(i) { mixWind = i; mixResult = null; render(); },
    setMood(i) { mixMood = i; mixResult = null; render(); },
    generate() {
      const seed = `mix-${mixSky}-${mixWind}-${mixMood}-${todayStr()}`;
      const rand = seedRand(seed);
      const nameIdx = Math.floor(rand() * MIXED_RESULTS.length);
      const nameSubIdx = Math.floor(rand() * MIXED_RESULTS[nameIdx].length);
      const name = MIXED_RESULTS[nameIdx][nameSubIdx];
      const emoji = SKY_OPTIONS[mixSky].emoji;
      const lineSet = MIXED_LINES[Math.floor(rand() * MIXED_LINES.length)];
      const lines = lineSet.map(l =>
        l.replace('{sky}', SKY_OPTIONS[mixSky].name.toLowerCase())
         .replace('{wind}', WIND_OPTIONS[mixWind].name.toLowerCase())
         .replace('{mood}', MOOD_OPTIONS[mixMood].name.toLowerCase())
      );
      const score = randInt(rand, 3, 10);
      mixResult = { name, emoji, lines, score };
      render();
    },
  };

  /* ---- App Registration ---- */
  OS.registerApp('sillyskies', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'sillyskies', title: 'SillySkies', icon: '\u{1F308}',
        width: 420, height: 540,
        content: '<div class="ss-wrap"><div id="ss-content"></div></div>',
      };
    },
    onOpen() {
      selectedPlace = 0; spinCount = 0; selectedDay = null;
      currentScreen = 'home'; mixSky = 0; mixWind = 0; mixMood = 0; mixResult = null;
      render();
    },
    onClose() { /* no cleanup needed */ },
  });
})();
