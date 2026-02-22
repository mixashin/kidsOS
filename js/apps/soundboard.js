/* ===== Soundboard ===== */
OS.registerApp('soundboard', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'soundboard',
      title: 'Soundboard',
      icon: '🔊',
      width: 420,
      height: 480,
      content: this.getHTML(),
    };
  },

  getHTML() {
    const sounds = [
      { emoji: '💨', label: 'Fart',     file: 'fart.mp3' },
      { emoji: '😂', label: 'Laugh',    file: 'laugh.mp3' },
      { emoji: '😛', label: 'Raspberry', file: 'raspberry.mp3' },
      { emoji: '🤧', label: 'Sneeze',   file: 'sneeze.mp3' },
      { emoji: '👏', label: 'Clap',     file: 'clap.mp3' },
      { emoji: '🔔', label: 'Bell',     file: 'bell.mp3' },
      { emoji: '💥', label: 'Boom',     file: 'boom.mp3' },
      { emoji: '😱', label: 'Scream',   file: 'scream.mp3' },
      { emoji: '🐔', label: 'Chicken',  file: 'chicken.mp3' },
      { emoji: '🐄', label: 'Moo',      file: 'moo.mp3' },
      { emoji: '🎺', label: 'Trumpet',  file: 'trumpet.mp3' },
      { emoji: '👾', label: 'Laser',    file: 'laser.mp3' },
      { emoji: '🥁', label: 'Drumroll', file: 'drumroll.mp3' },
      { emoji: '😜', label: 'Boing',    file: 'boing.mp3' },
      { emoji: '🎉', label: 'Airhorn',  file: 'airhorn.mp3' },
      { emoji: '🤪', label: 'Whoopee',  file: 'whoopee.mp3' },
    ];

    const colors = [
      '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
      '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
      '#ff7043', '#8bc34a', '#00bcd4', '#5c6bc0',
      '#ef5350', '#66bb6a', '#ffa726', '#ab47bc',
    ];

    const buttons = sounds.map((s, i) =>
      `<button class="sb-btn" style="background:${colors[i]}" onclick="SoundboardApp.play('${s.file}',this)">
        <span class="sb-emoji">${s.emoji}</span>
        <span class="sb-label">${s.label}</span>
      </button>`
    ).join('');

    return `<div class="sb-wrap"><div class="sb-grid">${buttons}</div></div>`;
  },

  onOpen() {},
  onClose() { SoundboardApp.stopAll(); },
});

const SoundboardApp = (() => {
  const playing = [];

  function play(file, btn) {
    const audio = new Audio('media/sounds/' + file);
    playing.push(audio);
    audio.play().catch(() => {});
    audio.onended = () => {
      const idx = playing.indexOf(audio);
      if (idx !== -1) playing.splice(idx, 1);
    };
    // Visual pulse
    btn.classList.add('sb-pressed');
    setTimeout(() => btn.classList.remove('sb-pressed'), 200);
  }

  function stopAll() {
    playing.forEach(a => { a.pause(); a.currentTime = 0; });
    playing.length = 0;
  }

  return { play, stopAll };
})();
