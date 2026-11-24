const playCue = (() => {
  const button = document.getElementById('sound');
  const cues = ['tap', 'key', 'erase', 'tick-3', 'tick-2', 'tick-1', 'correct', 'island', 'victory', 'retry', 'oops', 'start'];
  const source = name => 'assets/audio/' + name + '.wav?v=4';
  // Reuse one media element so the initial user gesture unlocks timed cues too.
  const player = new Audio(source('tap'));
  player.preload = 'auto';
  let current = 'tap';
  let enabled = true;
  let blocked = false;
  try { enabled = localStorage.getItem('carpim-ses') !== 'off'; } catch {}

  // Warm the HTTP cache so switching cues does not wait on the network.
  window.addEventListener('load', () => {
    for (const name of cues) {
      const warm = new Audio();
      warm.preload = 'auto';
      warm.src = source(name);
    }
  }, { once: true });

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
      player.src = source(name);
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
      document.dispatchEvent(new Event('soundchange'));
    });
  }
  function setEnabled(on) {
    enabled = on;
    blocked = false;
    try { localStorage.setItem('carpim-ses', enabled ? 'on' : 'off'); } catch {}
    updateButton();
    if (enabled) play('correct');
    else player.pause();
    document.dispatchEvent(new Event('soundchange'));
  }
  button.onclick = () => setEnabled(blocked || !enabled);
  document.addEventListener('click', event => {
    const control = event.target.closest('button, summary');
    if (control && control !== button && !control.disabled && !control.closest('#keys, [data-cue]')) play('tap');
  }, true);
  updateButton();
  play.isOn = () => enabled && !blocked;
  play.setEnabled = setEnabled;
  return play;
})();
