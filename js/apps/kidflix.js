/* ===== Kidflix — Netflix-style Movie App ===== */

const KF_MOVIES = [
  { id:1, title:'Frozen Chicken',            parody:'Frozen',                        genre:'Comedy',    emoji:'🐔', rating:9.1, year:2023, duration:'1h 32m',
    colors:['#00bcd4','#e1f5fe','#4fc3f7'], desc:'A brave chicken discovers she has the magical power to freeze everything she touches. Can she save the farm before it becomes an ice rink?' },
  { id:2, title:'Finding Memo',              parody:'Finding Nemo',                  genre:'Adventure', emoji:'📝', rating:8.7, year:2024, duration:'1h 28m',
    colors:['#1565c0','#0d47a1','#42a5f5'], desc:'When a forgetful office worker loses an important memo, he must journey across the entire building — from the mailroom to the rooftop — to find it before the big meeting!' },
  { id:3, title:'The Lion Bling',            parody:'The Lion King',                 genre:'Comedy',    emoji:'👑', rating:9.3, year:2023, duration:'1h 45m',
    colors:['#ff8f00','#ffb300','#fff176'], desc:'A young lion inherits the fanciest crown in the savanna. But can he learn that true royalty is about heart, not bling?' },
  { id:4, title:'Toy Snory',                 parody:'Toy Story',                     genre:'Comedy',    emoji:'😴', rating:8.5, year:2022, duration:'1h 22m',
    colors:['#7b1fa2','#9c27b0','#ce93d8'], desc:'When bedtime hits, the toys don\'t come alive — they fall asleep and SNORE incredibly loudly! The kid must figure out why every toy sounds like a chainsaw.' },
  { id:5, title:'Shrek But Tiny',            parody:'Shrek',                         genre:'Fantasy',   emoji:'🧅', rating:9.0, year:2024, duration:'1h 38m',
    colors:['#388e3c','#66bb6a','#a5d6a7'], desc:'Shrek wakes up one morning and he\'s only 3 inches tall! Now he must navigate his swamp like a jungle while Donkey accidentally almost steps on him every five minutes.' },
  { id:6, title:'Spider-Man: No Way Homework', parody:'Spider-Man: No Way Home',     genre:'Action',    emoji:'🕷️', rating:8.9, year:2024, duration:'1h 52m',
    colors:['#d32f2f','#1565c0','#ef5350'], desc:'Peter Parker uses his spider powers for one thing only: avoiding homework. But when all the homework in the city disappears, he realizes school might actually matter.' },
  { id:7, title:'Turning Bread',             parody:'Turning Red',                   genre:'Comedy',    emoji:'🍞', rating:8.4, year:2023, duration:'1h 25m',
    colors:['#e65100','#ff9800','#ffcc02'], desc:'Every time Mei gets embarrassed, she doesn\'t turn into a panda — she turns into a giant loaf of bread. Her friends must help her stay calm before the school talent show!' },
  { id:8, title:'Minions: Rise of Broccoli', parody:'Minions: Rise of Gru',          genre:'Comedy',    emoji:'🥦', rating:8.2, year:2022, duration:'1h 18m',
    colors:['#2e7d32','#fdd835','#81c784'], desc:'The Minions accidentally create a broccoli monster in the lab. Now it\'s growing out of control and the only way to stop it is... to eat it all!' },
  { id:9, title:'Encanto But Louder',        parody:'Encanto',                       genre:'Musical',   emoji:'🔊', rating:8.8, year:2024, duration:'1h 40m',
    colors:['#ad1457','#f06292','#ffd54f'], desc:'The Madrigal family\'s magical house gets a new gift: everything is 10x louder! Whispers become shouts, footsteps become earthquakes, and sneezes shatter windows.' },
  { id:10, title:'The Super Mario Plumbers', parody:'The Super Mario Bros. Movie',   genre:'Adventure', emoji:'🪠', rating:9.2, year:2024, duration:'1h 35m',
    colors:['#d32f2f','#1976d2','#4caf50'], desc:'Mario and Luigi are actual plumbers this time. No princesses, no castles — just a really, really clogged toilet that leads to another dimension.' },
];

const KF_GENRES = ['All','Comedy','Adventure','Action','Fantasy','Musical'];

/* ---- Seeded RNG (same pattern as Kidstagram) ---- */
function kfRng(seed) {
  let s = (seed * 747796405 + 2891336453) >>> 0;
  return () => {
    s ^= s >>> 15; s = Math.imul(s, 0x85ebca6b) >>> 0;
    s ^= s >>> 13; s = Math.imul(s, 0xc2b2ae35) >>> 0;
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

/* ---- Canvas Poster Generation ---- */
function kfDrawPoster(canvas, movie) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const rng = kfRng(movie.id * 1337);
  const [c1, c2, c3] = movie.colors;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.6, c2);
  grad.addColorStop(1, c1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles/shapes
  for (let i = 0; i < 8; i++) {
    const x = rng() * W;
    const y = rng() * H * 0.7;
    const r = 10 + rng() * 30;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c3 + '40';
    ctx.fill();
  }

  // Stars
  for (let i = 0; i < 12; i++) {
    const x = rng() * W;
    const y = rng() * H * 0.5;
    const size = 2 + rng() * 4;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff' + (Math.floor(30 + rng() * 50)).toString(16);
    ctx.fill();
  }

  // Large emoji centered
  const emojiSize = Math.min(W, H) * 0.35;
  ctx.font = `${emojiSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(movie.emoji, W / 2, H * 0.4);

  // Title banner area
  const bannerY = H * 0.68;
  const bannerGrad = ctx.createLinearGradient(0, bannerY, 0, H);
  bannerGrad.addColorStop(0, 'rgba(0,0,0,0)');
  bannerGrad.addColorStop(0.3, 'rgba(0,0,0,0.6)');
  bannerGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, bannerY, W, H - bannerY);

  // Movie title text
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.min(W * 0.1, 16);
  ctx.font = `bold ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font') || 'sans-serif'}`;
  // Word-wrap title
  const words = movie.title.split(' ');
  let lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > W - 16) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineH = fontSize * 1.25;
  const startY = H * 0.82 - (lines.length - 1) * lineH / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineH));

  // Rating badge
  ctx.fillStyle = '#fdd835';
  ctx.font = `bold ${Math.floor(fontSize * 0.7)}px sans-serif`;
  ctx.fillText('★ ' + movie.rating, W / 2, H * 0.95);
}

/* ---- App Registration ---- */
OS.registerApp('kidflix', {
  singleInstance: true,
  state: null,

  loadState() {
    try { return JSON.parse(localStorage.getItem('kidsOS_kidflix')) || {}; } catch { return {}; }
  },
  saveState() {
    localStorage.setItem('kidsOS_kidflix', JSON.stringify(this.state));
  },

  getWindowOpts() {
    return { id: 'kidflix', title: 'Kidflix', icon: '🎬', width: 700, height: 520, content: this.getHTML() };
  },

  getHTML() {
    return `<div class="kf-wrap">
      <div class="kf-header">
        <span class="kf-logo">KIDFLIX</span>
        <input class="kf-search" type="text" placeholder="Search movies..." />
      </div>
      <div class="kf-tabs" id="kf-tabs"></div>
      <div class="kf-content" id="kf-content">
        <div class="kf-grid" id="kf-grid"></div>
      </div>
    </div>`;
  },

  onOpen(winId) {
    this.state = this.loadState();
    if (!this.state.liked) this.state.liked = [];
    if (!this.state.watched) this.state.watched = [];
    this.winId = winId;
    this.activeGenre = 'All';
    this.searchQuery = '';
    this.renderTabs();
    this.renderGrid();
    this.bindEvents();
  },

  bindEvents() {
    const win = document.getElementById(this.winId);
    if (!win) return;
    const search = win.querySelector('.kf-search');
    if (search) {
      search.addEventListener('input', () => {
        this.searchQuery = search.value.toLowerCase();
        this.renderGrid();
      });
    }
  },

  renderTabs() {
    const win = document.getElementById(this.winId);
    if (!win) return;
    const tabs = win.querySelector('#kf-tabs');
    if (!tabs) return;
    tabs.innerHTML = KF_GENRES.map(g =>
      `<button class="kf-tab${g === this.activeGenre ? ' kf-tab-active' : ''}" data-genre="${g}">${g}</button>`
    ).join('');
    tabs.querySelectorAll('.kf-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeGenre = btn.dataset.genre;
        this.renderTabs();
        this.renderGrid();
      });
    });
  },

  getFilteredMovies() {
    return KF_MOVIES.filter(m => {
      if (this.activeGenre !== 'All' && m.genre !== this.activeGenre) return false;
      if (this.searchQuery && !m.title.toLowerCase().includes(this.searchQuery) &&
          !m.desc.toLowerCase().includes(this.searchQuery)) return false;
      return true;
    });
  },

  renderGrid() {
    const win = document.getElementById(this.winId);
    if (!win) return;
    const content = win.querySelector('#kf-content');
    if (!content) return;
    const movies = this.getFilteredMovies();
    const liked = this.state.liked;

    content.innerHTML = `<div class="kf-grid" id="kf-grid">
      ${movies.length === 0 ? '<div class="kf-empty">No movies found</div>' :
        movies.map(m => `
        <div class="kf-card" data-id="${m.id}">
          <div class="kf-poster">
            <canvas class="kf-poster-canvas" width="160" height="220"></canvas>
            <div class="kf-play-overlay">▶</div>
          </div>
          <div class="kf-card-info">
            <div class="kf-card-title">${m.title}</div>
            <div class="kf-card-meta">
              <span class="kf-card-genre">${m.genre}</span>
              <span class="kf-card-year">${m.year}</span>
            </div>
          </div>
        </div>`).join('')}
    </div>`;

    // Draw posters
    content.querySelectorAll('.kf-card').forEach(card => {
      const id = +card.dataset.id;
      const movie = KF_MOVIES.find(m => m.id === id);
      const canvas = card.querySelector('.kf-poster-canvas');
      if (movie && canvas) kfDrawPoster(canvas, movie);
      card.addEventListener('click', () => this.openPlayer(id));
    });
  },

  openPlayer(movieId) {
    const win = document.getElementById(this.winId);
    if (!win) return;
    const content = win.querySelector('#kf-content');
    if (!content) return;
    const m = KF_MOVIES.find(mv => mv.id === movieId);
    if (!m) return;

    // Mark as watched
    if (!this.state.watched.includes(movieId)) {
      this.state.watched.push(movieId);
      this.saveState();
    }

    const isLiked = this.state.liked.includes(movieId);

    content.innerHTML = `<div class="kf-player">
      <button class="kf-back-btn" id="kf-back">← Back to Browse</button>
      <div class="kf-video-wrap">
        <video class="kf-video" controls preload="metadata">
          <source src="media/placeholder.mp4" type="video/mp4">
          Your browser does not support video.
        </video>
      </div>
      <div class="kf-movie-info">
        <div class="kf-movie-header">
          <span class="kf-movie-emoji">${m.emoji}</span>
          <div class="kf-movie-titles">
            <h2 class="kf-movie-title">${m.title}</h2>
            <div class="kf-movie-meta">
              <span class="kf-badge">${m.genre}</span>
              <span>${m.year}</span>
              <span>${m.duration}</span>
              <span class="kf-rating">★ ${m.rating}</span>
            </div>
          </div>
          <button class="kf-like-btn${isLiked ? ' kf-liked' : ''}" data-id="${m.id}">
            ${isLiked ? '❤️' : '🤍'}
          </button>
        </div>
        <p class="kf-movie-desc">${m.desc}</p>
        <div class="kf-movie-parody">Inspired by: <em>${m.parody}</em></div>
      </div>
    </div>`;

    // Back button
    content.querySelector('#kf-back').addEventListener('click', () => {
      this.renderGrid();
    });

    // Like button
    const likeBtn = content.querySelector('.kf-like-btn');
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = +likeBtn.dataset.id;
      const idx = this.state.liked.indexOf(id);
      if (idx >= 0) {
        this.state.liked.splice(idx, 1);
        likeBtn.classList.remove('kf-liked');
        likeBtn.textContent = '🤍';
      } else {
        this.state.liked.push(id);
        likeBtn.classList.add('kf-liked');
        likeBtn.textContent = '❤️';
      }
      this.saveState();
    });
  },

  onClose() {
    this.state = null;
  },
});
