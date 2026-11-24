// Voice for Elif Ba: recorded clips listed in ses/kayitlar.js when there are any,
// otherwise the device's Turkish speech voice reading the Turkish names and syllables.
//
// Clips play through the same Web Audio context as the game's sound cues (sounds.js
// unlocks it on every touch and sets the phone's audio session), decoded once into
// memory. Phones are strict with <audio> elements: iOS wants a touch for each new
// element and Android caps how many may exist, so an element is only the fallback.
const elifVoice = (() => {
  const recorded = window.elifRecordings || { harf: {}, hece: {} };
  const buffers = new Map();
  const elements = new Map();
  let source = null, element = null;
  let run = 0; // every new request cancels the sequence that was playing
  let mode = 'kayit';
  try { if (localStorage.getItem('elif-ses') === 'turkce') mode = 'turkce'; } catch {}
  const context = () => (typeof playCue === 'function' && playCue.context?.()) || null;

  function stop() {
    run++;
    window.speechSynthesis?.cancel();
    if (source) { source.onended = null; try { source.stop(); } catch {} source = null; }
    if (element) { element.pause(); element = null; }
  }
  function unavailable(note) {
    if (note) note.textContent = 'Bu cihazda Türkçe ses bulunamadı. Harflerin adı kartların üzerinde yazıyor.';
  }
  function turkishVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(item => /^tr\b/i.test(item.lang));
    return voices.length && !voice ? null : { voice };
  }
  function decode(src) {
    const audio = context();
    if (!audio) return Promise.resolve(null);
    if (!buffers.has(src)) {
      buffers.set(src, fetch(src)
        .then(response => response.ok ? response.arrayBuffer() : Promise.reject(new Error(response.status)))
        .then(data => new Promise((resolve, reject) => audio.decodeAudioData(data, resolve, reject)))
        .catch(() => { buffers.delete(src); return null; }));
    }
    return buffers.get(src);
  }
  // Steps are { text } for the Turkish voice or { src, text } for a recording that falls
  // back to reading its text. Each step starts when the one before it ends.
  function sequence(steps, note) {
    stop();
    const mine = run;
    const next = i => {
      if (mine !== run || i >= steps.length) return;
      const step = steps[i];
      const done = () => { if (mine === run) next(i + 1); };
      const say = () => {
        if (mine !== run) return;
        const tr = turkishVoice();
        if (!tr) { unavailable(note); return done(); }
        const message = new SpeechSynthesisUtterance(step.text.replace(/ğ/g, 'g'));
        message.lang = 'tr-TR';
        if (tr.voice) message.voice = tr.voice;
        message.rate = 0.8;
        message.onend = done;
        message.onerror = event => { if (!['interrupted', 'canceled'].includes(event.error)) unavailable(note); };
        speechSynthesis.speak(message);
      };
      if (!step.src) return say();
      const viaElement = () => {
        if (mine !== run) return;
        if (!elements.has(step.src)) elements.set(step.src, new Audio(step.src));
        const audio = elements.get(step.src);
        element = audio;
        let over = false;
        const finish = fallback => { if (!over && element === audio) { over = true; element = null; fallback(); } };
        audio.onerror = () => finish(say);
        audio.onended = () => finish(done);
        try { audio.currentTime = 0; } catch {}
        audio.play()?.catch(error => { if (error.name !== 'AbortError') finish(say); });
      };
      const audio = context();
      if (!audio) return viaElement();
      const ready = audio.state === 'running' ? null : audio.resume().catch(() => {});
      Promise.all([ready, decode(step.src)]).then(([, buffer]) => {
        if (mine !== run) return;
        if (!buffer || audio.state !== 'running') return viaElement();
        const node = audio.createBufferSource();
        node.buffer = buffer;
        node.connect(audio.destination);
        node.onended = () => { node.disconnect(); if (source === node) { source = null; done(); } };
        source = node;
        node.start();
      });
    };
    next(0);
  }
  const letterClip = i => mode === 'kayit' ? recorded.harf[i] : null;
  const syllableClip = (i, h) => mode === 'kayit' ? recorded.hece[i + '-' + h] : null;
  const hareke = h => elifData.harekeler[h].name.toLocaleLowerCase('tr');

  return {
    say: (text, note) => sequence([{ text }], note),
    letter: (i, note) => sequence([{ src: letterClip(i), text: elifData.names[i] }], note),
    syllable: (i, h, note) => sequence([{ src: syllableClip(i, h), text: elifData.readings[i][h] }], note),
    // "Be üstün be, be esre bi, be ötre bu": the way the harekes are chanted in class.
    chant(i, h, note) {
      const steps = [];
      for (const k of h === undefined ? [0, 1, 2] : [h]) {
        steps.push({ text: elifData.names[i] + ' ' + hareke(k) }, { src: syllableClip(i, k), text: elifData.readings[i][k] });
      }
      sequence(steps, note);
    },
    stop,
    // Fetch and decode a cove's clips ahead of time, so the first tap plays at once.
    preload(letters) {
      for (const i of letters) {
        if (letterClip(i)) decode(letterClip(i));
        for (const h of [0, 1, 2]) if (syllableClip(i, h)) decode(syllableClip(i, h));
      }
    },
    hasRecordings: () => Object.keys(recorded.harf).length + Object.keys(recorded.hece).length > 0,
    credit: () => recorded.credit || '',
    mode: () => mode,
    setMode(next) {
      mode = next === 'turkce' ? 'turkce' : 'kayit';
      try { localStorage.setItem('elif-ses', mode); } catch {}
    }
  };
})();
