// Voice for Elif Ba: recorded clips listed in assets/audio/elif-ba/kayitlar.js when there are any,
// otherwise the device's Turkish speech voice reading the Turkish names and syllables.
// Three choices in Settings: 'cocuk' (the girl's voice, the default; a clip she has not recorded
// is played in the man's voice), 'kayit' (every clip in the man's voice) and 'turkce' (the device's voice).
//
// Clips play through the same Web Audio context as the game's sound cues (sounds.js
// unlocks it on every touch and sets the phone's audio session), decoded once into
// memory. Phones are strict with <audio> elements: iOS wants a touch for each new
// element and Android caps how many may exist, so an element is only the fallback.
const elifVoice = (() => {
  const recorded = { harf: {}, hece: {}, kelime: {}, yer: {}, cezm: {}, cezmOrnek: {}, tenvin: {}, tenvinOrnek: {}, sedde: {}, seddesiz: {}, seddeOrnek: {},
    ...window.elifRecordings };
  const child = { harf: {}, hece: {}, yer: {}, hareke: {}, tenvin: {}, ...recorded.cocuk };
  const MODES = ['cocuk', 'kayit', 'turkce'];
  const buffers = new Map();
  const elements = new Map();
  let source = null, element = null;
  let run = 0; // every new request cancels the sequence that was playing
  let mode = 'cocuk';
  try { const saved = localStorage.getItem('elif-ses'); if (MODES.includes(saved)) mode = saved; } catch {}
  // A recorded clip in the chosen voice: the girl's when she has it, else the man's; none for 'turkce'.
  const clip = (kind, key) => mode === 'turkce' ? null : (mode === 'cocuk' && child[kind]?.[key]) || recorded[kind]?.[key] || null;
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
      if (step.run) { step.run(); return done(); }
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
  const letterClip = i => clip('harf', i);
  const syllableClip = (i, h) => clip('hece', i + '-' + h);
  const hareke = h => elifData.harekeler[h].name.toLocaleLowerCase('tr');
  // "Be üstün", "Sin cezm", "Be iki üstün" (h: 0-2, 'cezm' or 'tenvin-0' to 'tenvin-2'; i 0 with a cezm is the
  // hemze): the girl says the letter and the mark as two clips; the man's recordings have no mark names, so
  // the device's voice says them.
  const markText = h => h === 'cezm' ? 'cezm' : h === 'sedde' ? 'şedde' : String(h).startsWith('tenvin-') ? elifData.tenvinler[h.slice(7)].name.toLocaleLowerCase('tr') : hareke(h);
  function named(i, h) {
    const hemze = (h === 'cezm' || h === 'sedde') && i === 0;
    const name = hemze ? 'Hemze' : elifData.names[i];
    const nameClip = mode === 'cocuk' && child.harf[hemze ? 'hemze' : i];
    const markClip = mode === 'cocuk' && child.hareke[h];
    if (nameClip && markClip) return [{ src: nameClip, text: name }, { src: markClip, text: markText(h) }];
    return [{ text: name + ' ' + markText(h) }];
  }
  // Bitişik yazılış: "Kelimenin başında / ortasında / sonunda". The example words are harekeli and read
  // syllable by syllable, so they are played as the syllables' own clips.
  const placeClip = f => clip('yer', f);
  const syllableStep = (i, h) => ({ src: syllableClip(i, h), text: elifData.readings[i][h] });
  const placeText = ['', 'Kelimenin başında', 'Kelimenin ortasında', 'Kelimenin sonunda'];
  // Cezm: the syllable in which letter i has the cezm, and Diyanet's five examples (p) in three steps (s).
  const cezmClip = i => clip('cezm', i);
  const exampleClip = (p, s) => clip('cezmOrnek', p + '-' + s);
  // Tenvin: letter i with iki üstün, iki esre or iki ötre (h 0-2), and the word at the top of tenvin cove p.
  const tenvinClip = (i, h) => clip('tenvin', i + '-' + h);
  const tenvinStep = (i, h) => ({ src: tenvinClip(i, h), text: elifData.tenvinReading(i, h) });
  // Şedde: the letter's şedde syllable (bis-se) and the same letters without it (bi-se), both made of the man's
  // clips, and the parts they are made of in the same voice, so the two are heard alike but for the şedde.
  const manClip = (kind, key) => mode === 'turkce' ? null : recorded[kind]?.[key] || null;
  const seddeStep = (i, h) => ({ src: clip('sedde', i + '-' + h), text: elifData.seddeReading(i, h) });
  const seddesizStep = (i, h) => ({ src: clip('seddesiz', i + '-' + h), text: elifData.seddesizReading(i, h) });

  return {
    say: (text, note, after) => sequence([{ text }], note, after),
    // A spoken instruction for children who cannot read yet, always in the device's Turkish voice;
    // `after` goes on (to the letter to listen to) when it has been said, or at once on a device without one.
    instruct: (text, after) => sequence([{ text }], null, after),
    letter: (i, note, after) => sequence([{ src: letterClip(i), text: elifData.names[i] }], note, after),
    syllable: (i, h, note, after) => sequence([{ src: syllableClip(i, h), text: elifData.readings[i][h] }], note, after),
    // An example word read syllable by syllable, right to left; `each` hears the place of the syllable
    // about to be said (and the word's length once it is over).
    word(i, f, note, after, each) {
      const { letters } = elifData.word(i, f);
      sequence(letters.flatMap((l, n) => [{ run: () => each?.(n) }, syllableStep(l.i, l.h)]), note, heard => { each?.(letters.length); after?.(heard); });
    },
    // "Be. Kelimenin başında": a harekeli letter's shape at a place in the word.
    shape: (i, h, f, note, after) => sequence([syllableStep(i, h), ...(f ? [{ src: placeClip(f), text: placeText[f] }] : [])], note, after),
    cezm: (i, note, after) => sequence([{ src: cezmClip(i), text: elifData.cezmReadings[i] }], note, after),
    // "Be esre bi, sin cezm bis": a cezm syllable the way it is chanted in class.
    cezmChant(i, note, after) {
      const { before } = elifData.cezm(i);
      sequence([...named(before.i, before.h), { src: syllableClip(before.i, before.h), text: elifData.readings[before.i][before.h] },
        ...named(i, 'cezm'), { src: cezmClip(i), text: elifData.cezmReadings[i] }], note, after);
    },
    cezmExample: (p, s, note, after) => sequence([{ src: exampleClip(p, s), text: elifData.cezmExampleReadings[p][s] }], note, after),
    tenvin: (i, h, note, after) => sequence([tenvinStep(i, h)], note, after),
    // "Be iki üstün ben": a tenvin the way it is chanted in class; without h, all three in turn.
    tenvinChant(i, h, note, after) {
      sequence([...(h === undefined ? [0, 1, 2] : [h])].flatMap(k => [...named(i, 'tenvin-' + k), tenvinStep(i, k)]), note, after);
    },
    // A mark's name on its own ("iki esre"), in the girl's voice when she has it.
    tenvinName(h, note, after) {
      const markClip = mode === 'cocuk' && child.hareke['tenvin-' + h];
      sequence([markClip ? { src: markClip, text: markText('tenvin-' + h) } : { text: markText('tenvin-' + h) }], note, after);
    },
    sedde: (i, h, note, after) => sequence([seddeStep(i, h)], note, after),
    seddesiz: (i, h, note, after) => sequence([seddesizStep(i, h)], note, after),
    // "Sin şedde: bis, se, bisse": how the şedde syllable is made, then the syllable.
    seddeChant(i, h, note, after) {
      sequence([...named(i, 'sedde'), { src: manClip('cezm', i), text: elifData.cezmReadings[i] },
        { src: manClip('hece', i + '-' + h), text: elifData.readings[i][h] }, seddeStep(i, h)], note, after);
    },
    // A mark's name on its own (h: 'sedde', 'cezm' or a hareke), in the girl's voice when she has it.
    markName(h, note, after) {
      const markClip = mode === 'cocuk' && child.hareke[h];
      sequence([markClip ? { src: markClip, text: markText(h) } : { text: markText(h) }], note, after);
    },
    seddeExample: (p, note, after) => sequence([{ src: clip('seddeOrnek', p), text: elifData.seddeExamples[p].reading }], note, after),
    // The three steps at the top of tenvin cove p (s: 0 the last letter with its hareke, 1 with its tenvin, 2 the word).
    tenvinExample(p, s, note, after) {
      const { i, h, reading } = elifData.tenvinExamples[p];
      sequence([s === 0 ? { src: syllableClip(i, h), text: elifData.readings[i][h] } : s === 1 ? tenvinStep(i, h) :
        { src: clip('tenvinOrnek', p), text: reading }], note, after);
    },
    // "Be üstün be, be esre bi, be ötre bu": the way the harekes are chanted in class.
    chant(i, h, note) {
      const steps = [];
      for (const k of h === undefined ? [0, 1, 2] : [h]) {
        steps.push(...named(i, k), { src: syllableClip(i, k), text: elifData.readings[i][k] });
      }
      sequence(steps, note);
    },
    stop,
    // Fetch and decode a cove's clips ahead of time, so the first tap plays at once.
    // Harf Yağmuru only says letter names, so it leaves the syllables out; a bitişik cove (joined)
    // also wants the syllables of its example words and the three places, a cezm cove (cezm) its cezm
    // syllables and the syllables they start with, a tenvin cove (tenvin) the letters' tenvins.
    preload(letters, namesOnly = false, joined = false, cezm = false, tenvin = false, sedde = false) {
      if (sedde) for (const i of letters) for (const h of [0, 1, 2]) {
        for (const src of [clip('sedde', i + '-' + h), clip('seddesiz', i + '-' + h)]) if (src) decode(src);
      }
      if (tenvin) for (const i of letters) for (const h of [0, 1, 2]) if (tenvinClip(i, h)) decode(tenvinClip(i, h));
      if (joined) for (const f of [1, 2, 3]) if (placeClip(f)) decode(placeClip(f));
      if (mode === 'cocuk' && !namesOnly) for (const src of Object.values(child.hareke)) decode(src);
      if (cezm) for (const i of letters) {
        const { before } = elifData.cezm(i);
        for (const src of [cezmClip(i), syllableClip(before.i, before.h)]) if (src) decode(src);
      }
      for (const i of letters) {
        if (letterClip(i)) decode(letterClip(i));
        if (joined) for (const f of [1, 2, 3]) for (const l of elifData.word(i, f).letters) if (syllableClip(l.i, l.h)) decode(syllableClip(l.i, l.h));
        if (!namesOnly) for (const h of [0, 1, 2]) if (syllableClip(i, h)) decode(syllableClip(i, h));
      }
    },
    hasRecordings: () => Object.keys(recorded.harf).length + Object.keys(recorded.hece).length > 0,
    credit: () => [mode === 'cocuk' ? recorded.cocukCredit : '', recorded.credit].filter(Boolean).join(' '),
    mode: () => mode,
    setMode(next) {
      mode = MODES.includes(next) ? next : 'cocuk';
      try { localStorage.setItem('elif-ses', mode); } catch {}
    }
  };
})();
