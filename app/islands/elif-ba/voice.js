// Voice for Elif Ba: recorded clips listed in ses/kayitlar.js when there are any,
// otherwise the device's Turkish speech voice reading the Turkish names and syllables.
//
// Clips play through the same Web Audio context as the game's sound cues (sounds.js
// unlocks it on every touch and sets the phone's audio session), decoded once into
// memory. Phones are strict with <audio> elements: iOS wants a touch for each new
// element and Android caps how many may exist, so an element is only the fallback.
const elifVoice = (() => {
  const recorded = { harf: {}, hece: {}, kelime: {}, yer: {}, ...window.elifRecordings };
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
  // back to reading its text. Each step starts when the one before it ends; `after` hears
  // when the last one has, with false if a step had no voice at all on this device.
  function sequence(steps, note, after) {
    stop();
    const mine = run;
    let heard = true;
    const next = i => {
      if (mine !== run) return;
      if (i >= steps.length) { after?.(heard); return; }
      const step = steps[i];
      const done = () => { if (mine === run) next(i + 1); };
      const say = () => {
        if (mine !== run) return;
        const tr = turkishVoice();
        if (!tr) { heard = false; unavailable(note); return done(); }
        const message = new SpeechSynthesisUtterance(step.text.replace(/ğ/g, 'g'));
        message.lang = 'tr-TR';
        if (tr.voice) message.voice = tr.voice;
        message.rate = 0.8;
        // Some phones never report the end of a sentence: the sequence goes on after a while all the same.
        let over = false;
        const end = () => { if (over) return; over = true; clearTimeout(guard); done(); };
        const guard = setTimeout(() => { if (mine === run) speechSynthesis.cancel(); end(); }, 2000 + step.text.length * 120);
        message.onend = end;
        message.onerror = event => {
          if (['interrupted', 'canceled'].includes(event.error)) return;
          heard = false;
          unavailable(note);
          end();
        };
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
  // Bitişik yazılış: an example word spelled letter by letter (the Turkish voice spells it by the
  // letters' names too) and "Kelimenin başında / ortasında / sonunda".
  const pad = i => String(i).padStart(2, '0');
  const wordClip = (i, f) => mode === 'kayit' ? recorded.kelime[pad(i) + '-' + f] : null;
  const placeClip = f => mode === 'kayit' ? recorded.yer[f] : null;
  const placeText = ['', 'Kelimenin başında', 'Kelimenin ortasında', 'Kelimenin sonunda'];
  const spelled = text => Array.from(text.replace(/\s/g, '')).map(c => elifData.names[elifData.glyphs.indexOf({ 'ة': 'ت', 'ى': 'ي' }[c] || c)])
    .filter(Boolean).join(', ');

  return {
    say: (text, note, after) => sequence([{ text }], note, after),
    // A spoken instruction for children who cannot read yet, always in the device's Turkish voice;
    // `after` goes on (to the letter to listen to) when it has been said, or at once on a device without one.
    instruct: (text, after) => sequence([{ text }], null, after),
    letter: (i, note, after) => sequence([{ src: letterClip(i), text: elifData.names[i] }], note, after),
    syllable: (i, h, note, after) => sequence([{ src: syllableClip(i, h), text: elifData.readings[i][h] }], note, after),
    word: (i, f, note, after) => sequence([{ src: wordClip(i, f), text: spelled(elifData.word(i, f).text) }], note, after),
    // "Be. Kelimenin başında": a letter's shape at a place in the word (f 0: the letter alone).
    shape: (i, f, note, after) => sequence([{ src: letterClip(i), text: elifData.names[i] },
      ...(f ? [{ src: placeClip(f), text: placeText[f] }] : [])], note, after),
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
    // Harf Yağmuru only says letter names, so it leaves the syllables out; a bitişik cove (joined)
    // also wants its example words and the three places.
    preload(letters, namesOnly = false, joined = false) {
      if (joined) for (const f of [1, 2, 3]) if (placeClip(f)) decode(placeClip(f));
      for (const i of letters) {
        if (letterClip(i)) decode(letterClip(i));
        if (joined) for (const f of [1, 2, 3]) if (wordClip(i, f)) decode(wordClip(i, f));
        if (!namesOnly) for (const h of [0, 1, 2]) if (syllableClip(i, h)) decode(syllableClip(i, h));
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
