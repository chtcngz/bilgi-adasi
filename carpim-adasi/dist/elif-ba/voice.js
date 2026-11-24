// Voice for Elif Ba: recorded clips listed in ses/kayitlar.js when there are any,
// otherwise the device's Turkish speech voice reading the Turkish names and syllables.
const elifVoice = (() => {
  const recorded = window.elifRecordings || { harf: {}, hece: {} };
  const clips = new Map();
  let playing = null;
  let mode = 'kayit';
  try { if (localStorage.getItem('elif-ses') === 'turkce') mode = 'turkce'; } catch {}

  function stop() {
    window.speechSynthesis?.cancel();
    if (playing) { playing.pause(); playing = null; }
  }
  function unavailable(note) {
    if (note) note.textContent = 'Bu cihazda Türkçe ses bulunamadı. Harflerin adı kartların üzerinde yazıyor.';
  }
  function speak(text, note) {
    stop();
    if (!window.speechSynthesis) return unavailable(note);
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(item => /^tr\b/i.test(item.lang));
    if (voices.length && !voice) return unavailable(note);
    const message = new SpeechSynthesisUtterance(text.replace(/ğ/g, 'g'));
    message.lang = 'tr-TR';
    if (voice) message.voice = voice;
    message.rate = 0.8;
    message.onerror = event => { if (!['interrupted', 'canceled'].includes(event.error)) unavailable(note); };
    speechSynthesis.speak(message);
  }
  function clip(src) {
    if (!clips.has(src)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      clips.set(src, audio);
    }
    return clips.get(src);
  }
  function play(src, fallback) {
    stop();
    const audio = clip(src);
    playing = audio;
    let fell = false;
    const fall = () => { if (!fell && playing === audio) { fell = true; playing = null; fallback(); } };
    audio.onerror = fall;
    try { audio.currentTime = 0; } catch {}
    audio.play()?.catch(error => { if (error.name !== 'AbortError') fall(); });
  }
  const letterClip = i => mode === 'kayit' ? recorded.harf[i] : null;
  const syllableClip = (i, h) => mode === 'kayit' ? recorded.hece[i + '-' + h] : null;

  function letter(i, note) {
    const say = () => speak(elifData.names[i], note);
    const src = letterClip(i);
    src ? play(src, say) : say();
  }
  function syllable(i, h, note) {
    const say = () => speak(elifData.readings[i][h], note);
    const src = syllableClip(i, h);
    src ? play(src, say) : say();
  }
  // "Be üstün be, be esre bi, be ötre bu": the way the harekes are chanted in class.
  function chant(i, h, note) {
    const name = elifData.names[i];
    const parts = (h === undefined ? [0, 1, 2] : [h]).map(k =>
      name + ' ' + elifData.harekeler[k].name.toLocaleLowerCase('tr') + ' ' + elifData.readings[i][k]);
    speak(parts.join(', '), note);
  }
  function preload(letters) {
    for (const i of letters) {
      if (letterClip(i)) clip(letterClip(i));
      for (const h of [0, 1, 2]) if (syllableClip(i, h)) clip(syllableClip(i, h));
    }
  }
  return {
    letter, syllable, chant, say: speak, stop, preload,
    hasRecordings: () => Object.keys(recorded.harf).length > 0,
    credit: () => recorded.credit || '',
    mode: () => mode,
    setMode(next) {
      mode = next === 'turkce' ? 'turkce' : 'kayit';
      try { localStorage.setItem('elif-ses', mode); } catch {}
    }
  };
})();
