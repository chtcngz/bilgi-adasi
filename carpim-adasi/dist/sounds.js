// Each note specifies its pitch, start offset and duration in seconds.
const playCue = (() => {
  const tunes = {
    tap: [[780, 0, 0.045]],
    tick: [[440, 0, 0.055]],
    correct: [[523.25, 0, 0.12], [659.25, 0.10, 0.19]],
    island: [[523.25, 0, 0.12], [659.25, 0.10, 0.12], [783.99, 0.20, 0.26]],
    retry: [[392, 0, 0.19], [329.63, 0.16, 0.19], [293.66, 0.32, 0.25]]
  };
  const button = document.getElementById('sound');
  let enabled = true, context, output;
  try { enabled = localStorage.getItem('carpim-ses') !== 'off'; } catch {}

  function updateButton() {
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? 'Sesi kapat' : 'Sesi aç';
    button.setAttribute('aria-label', button.title);
    button.textContent = enabled ? '🔊' : '🔇';
  }
  function play(name) {
    if (!enabled) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio();
        output = context.createGain();
        output.connect(context.destination);
      }
      if (context.state !== 'running') context.resume().catch(() => {});
      const now = context.currentTime;
      for (const [pitch, delay, length] of tunes[name]) {
        const tone = context.createOscillator();
        const envelope = context.createGain();
        const start = now + delay;
        tone.type = name === 'tap' ? 'triangle' : 'sine';
        tone.frequency.value = pitch;
        envelope.gain.setValueAtTime(0.0001, start);
        const volume = name === 'tick' ? 0.018 : name === 'tap' ? 0.032 : 0.085;
        envelope.gain.exponentialRampToValueAtTime(volume, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
        tone.connect(envelope);
        envelope.connect(output);
        tone.onended = () => { tone.disconnect(); envelope.disconnect(); };
        tone.start(start);
        tone.stop(start + length);
      }
    } catch { /* The visual feedback also works when audio is unavailable. */ }
  }
  button.onclick = () => {
    enabled = !enabled;
    if (output) output.gain.value = enabled ? 1 : 0;
    try { localStorage.setItem('carpim-ses', enabled ? 'on' : 'off'); } catch {}
    updateButton();
    if (enabled) play('tap');
  };
  document.addEventListener('click', event => {
    const control = event.target.closest('button, summary');
    if (control && control !== button && !control.disabled && !control.closest('#keys')) play('tap');
  }, true);
  updateButton();
  return play;
})();
