// Voice for Elif Ba: recorded clips listed in ses/kayitlar.js when there are any,
// otherwise the device's Turkish speech voice reading the Turkish names and syllables.
const elifVoice = (() => {
  const recorded = window.elifRecordings || { harf: {}, hece: {} };
  const clips = new Map();
  let playing = null;
  let run = 0; // every new request cancels the sequence that was playing
  let mode = 'kayit';
  try { if (localStorage.getItem('elif-ses') === 'turkce') mode = 'turkce'; } catch {}

  function stop() {
    run++;
    window.speechSynthesis?.cancel();
    if (playing) { playing.pause(); playing = null; }
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
  function clip(src) {
    if (!clips.has(src)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      clips.set(src, audio);
    }
    return clips.get(src);
  }
  // Steps are { text } for the Turkish voice or { src, text } for a recording that falls
  // back to reading its text. Each step starts when the one before it ends.
  function sequence(steps, note) {
    stop();
    const mine = run;
    const next = i => {
      if (mine !== run || i >= steps.length) return;
      const step = steps[i];
      const say = () => {
        const tr = turkishVoice();
        if (!tr) { unavailable(note); return next(i + 1); }
        const message = new SpeechSynthesisUtterance(step.text.replace(/ğ/g, 'g'));
        message.lang = 'tr-TR';
        if (tr.voice) message.voice = tr.voice;
        message.rate = 0.8;
        message.onend = () => next(i + 1);
        message.onerror = event => { if (!['interrupted', 'canceled'].includes(event.error)) unavailable(note); };
        speechSynthesis.speak(message);
      };
      if (!step.src) return say();
      const audio = clip(step.src);
      playing = audio;
      let done = false;
      const fall = () => { if (!done && mine === run) { done = true; playing = null; say(); } };
      audio.onerror = fall;
      audio.onended = () => { if (!done && mine === run) { done = true; playing = null; next(i + 1); } };
      try { audio.currentTime = 0; } catch {}
      audio.play()?.catch(error => { if (error.name !== 'AbortError') fall(); });
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
    preload(letters) {
      for (const i of letters) {
        if (letterClip(i)) clip(letterClip(i));
        for (const h of [0, 1, 2]) if (syllableClip(i, h)) clip(syllableClip(i, h));
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
