const playCue = (() => {
  const button = document.getElementById('sound');
  // Reuse one media element so the initial user gesture unlocks timed cues too.
  const player = new Audio('assets/audio/tap.wav');
  player.preload = 'auto';
  let current = 'tap';
  let enabled = true;
  let blocked = false;
  try { enabled = localStorage.getItem('carpim-ses') !== 'off'; } catch {}

  function updateButton() {
    const active = enabled && !blocked;
    button.setAttribute('aria-pressed', String(active));
    button.title = active ? 'Sesi kapat' : 'Sesi aç';
    button.setAttribute('aria-label', button.title);
    button.textContent = active ? '🔊' : '🔇';
  }
  function play(name) {
    if (!enabled) return;
    if (name !== current) {
      player.src = 'assets/audio/' + name + '.wav';
      current = name;
    } else {
      player.currentTime = 0;
    }
    player.play()?.then(() => {
      if (blocked) { blocked = false; updateButton(); }
    }).catch(error => {
      if (error.name === 'AbortError') return;
      blocked = true;
      updateButton();
    });
  }
  button.onclick = () => {
    enabled = blocked || !enabled;
    blocked = false;
    try { localStorage.setItem('carpim-ses', enabled ? 'on' : 'off'); } catch {}
    updateButton();
    if (enabled) play('correct');
    else player.pause();
  };
  document.addEventListener('click', event => {
    const control = event.target.closest('button, summary');
    if (control && control !== button && !control.disabled && !control.closest('#keys')) play('tap');
  }, true);
  updateButton();
  return play;
})();
