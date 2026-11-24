const playCue = (() => {
  const button = document.getElementById('sound');
  const cues = ['tap', 'key', 'erase', 'tick-3', 'tick-2', 'tick-1', 'correct', 'island', 'victory', 'retry', 'oops', 'start',
    'pop', 'splash', 'star'];
  const source = name => 'assets/audio/' + name + '.wav?v=6';
  let enabled = true;
  let blocked = false;
  try { enabled = localStorage.getItem('carpim-ses') !== 'off'; } catch {}

  // Fast path: every cue decoded once into memory and started through Web Audio,
  // which plays within a few milliseconds and lets cues overlap.
  // Play like media so the phone's silent switch behaves as it did with <audio>.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
  const Context = window.AudioContext || window.webkitAudioContext;
  let context = null;
  try { if (Context) context = new Context({ latencyHint: 'interactive' }); } catch { context = null; }
  const buffers = new Map();
  const voices = new Set();
  if (context) {
    for (const name of cues) {
      fetch(source(name))
        .then(response => response.ok ? response.arrayBuffer() : Promise.reject(new Error(response.status)))
        .then(data => new Promise((resolve, reject) => context.decodeAudioData(data, resolve, reject)))
        .then(buffer => buffers.set(name, buffer))
        .catch(() => {}); // that cue falls back to the media element
    }
  }
  // A phone can leave the context broken after the page has been in the background: iOS
  // keeps it "interrupted", or running but silent, and resuming does not bring the sound
  // back. So the first touch after coming back starts a fresh context. The decoded cues
  // are kept (an AudioBuffer plays in any context), and so are Elif Ba's voice clips,
  // which reach the context through play.context().
  let stale = false;
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) {
      stale = true;
      context.suspend?.().catch(() => {});
    } else context.resume?.().catch(() => {});
  });
  function renew() {
    stale = false;
    let fresh;
    try { fresh = new Context({ latencyHint: 'interactive' }); } catch { return; }
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
    const old = context;
    context = fresh;
    old.close?.().catch(() => {});
  }
  // Browsers only start audio inside a user gesture; resume on every one, since
  // phones can suspend the context again (calls, backgrounding).
  function unlock() {
    if (!context) return;
    if (stale) renew();
    if (context.state === 'running') return;
    context.resume().catch(() => {});
    try { // older iOS also needs a sound started inside the gesture
      const silence = context.createBufferSource();
      silence.buffer = context.createBuffer(1, 1, 22050);
      silence.connect(context.destination);
      silence.start(0);
    } catch {}
  }
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']) {
    document.addEventListener(type, unlock, { capture: true, passive: true });
  }
  // `rate` plays a cue higher or lower (Harf Yağmuru climbs a scale with it), `gain` softer.
  function playFast(name, { rate = 1, gain = 1 } = {}) {
    const buffer = buffers.get(name);
    if (!buffer || context.state !== 'running') return false;
    const voice = context.createBufferSource();
    voice.buffer = buffer;
    voice.playbackRate.value = rate;
    let out = voice;
    if (gain !== 1) {
      out = context.createGain();
      out.gain.value = gain;
      voice.connect(out);
    }
    out.connect(context.destination);
    voice.onended = () => { voice.disconnect(); if (out !== voice) out.disconnect(); voices.delete(voice); };
    voices.add(voice);
    voice.start();
    return true;
  }

  // Fallback: one reusable media element (also what unlocks audio when the
  // first gesture comes before Web Audio is running).
  const player = new Audio();
  player.preload = 'none';
  let current = null;
  function playMedia(name) {
    if (name !== current) {
      player.src = source(name);
      current = name;
    } else {
      player.currentTime = 0;
    }
    player.play()?.then(() => {
      if (blocked) { blocked = false; updateButton(); document.dispatchEvent(new Event('soundchange')); }
    }).catch(error => {
      if (error.name === 'AbortError') return;
      blocked = true;
      updateButton();
      document.dispatchEvent(new Event('soundchange'));
    });
  }

  function updateButton() {
    const active = enabled && !blocked;
    button.setAttribute('aria-pressed', String(active));
    button.title = active ? 'Sesi kapat' : 'Sesi aç';
    button.setAttribute('aria-label', button.title);
    button.textContent = active ? '🔊' : '🔇';
  }
  function play(name, options) {
    if (!enabled) return;
    if (context && playFast(name, options)) {
      if (blocked) { blocked = false; updateButton(); document.dispatchEvent(new Event('soundchange')); }
      return;
    }
    // A background cue (a letter splashing into the sea) would cut off the others on the
    // one shared media element, so it stays silent there.
    if (options?.ambient) return;
    playMedia(name);
  }
  function setEnabled(on) {
    enabled = on;
    blocked = false;
    try { localStorage.setItem('carpim-ses', enabled ? 'on' : 'off'); } catch {}
    updateButton();
    if (enabled) play('correct');
    else {
      player.pause();
      for (const voice of voices) { try { voice.stop(); } catch {} }
    }
    document.dispatchEvent(new Event('soundchange'));
  }
  button.onclick = () => setEnabled(blocked || !enabled);

  // Button taps sound on press for a mouse, and on release for touch so that a
  // scroll starting on a button stays quiet. Keyboard presses sound on click.
  const tapTarget = target => {
    const control = target.closest?.('button, summary');
    return control && control !== button && !control.disabled &&
      !control.closest('#keys, [data-cue]') ? control : null;
  };
  let sounded = null;
  document.addEventListener('pointerdown', event => {
    sounded = null;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    sounded = tapTarget(event.target);
    if (sounded) play('tap');
  }, true);
  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse' || sounded) return;
    sounded = tapTarget(event.target);
    if (sounded) play('tap');
  }, true);
  document.addEventListener('click', event => {
    const control = tapTarget(event.target);
    if (control && control !== sounded) play('tap');
    sounded = null;
  }, true);

  updateButton();
  play.isOn = () => enabled && !blocked;
  play.setEnabled = setEnabled;
  // Shared with Elif Ba's voice clips: the context is unlocked on every gesture above.
  play.context = () => context;
  return play;
})();
