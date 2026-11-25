// Elif Ba Adası: an island in sections. Section 1 teaches the letters, section 2 the harekes, section 3
// how the letters are written joined (bitişik yazılış); the later sections (cezm, tenvin, şedde, ...) are
// announced and open in coming releases. Letters and sections are in data.js; the listening games
// (Harf Yağmuru, Hece Balonları, Şekil Yağmuru) in games/listening.js, the mixed game at the end of
// every cove (Cam Köprü) in games/bridge.js.
(() => {
  const { glyphs, names, harekeler, coves, LETTER_COVES, coveTopic, sections, sameSound, syllable, coveLetters, coveGlyphs, twins, places,
    joinsNext, shape, word, mastery } = elifData;
  // A syllable is named by its letter and hareke ("Be üstün"); its Turkish reading is never written.
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const syllableName = (i, h) => names[i] + ' ' + hareke(h);
  const voice = elifVoice;
  const dialog = $('elif-game');
  const records = new Map();
  let progress, section = null, cove = 0;
  // The cove the turtle stands on in the map (null: the cove being learned, set on arrival).
  let mapCove = null;
  let round, turn, earned;

  /* ---------- Progress ---------- */
  const storeKey = id => 'elif-ba-v2-' + id;
  // yagmur (Harf Yağmuru), balon (Hece Balonları), sekil (Şekil Yağmuru) and kopru (Cam Köprü): the
  // game's best score, the most hearts (stars) a section was finished with, whether it was ever finished
  // with all three, and the coves whose game step was played to the end (koylar).
  const parts = ['harf', 'hareke', 'bitisik'];
  const gameNames = ['yagmur', 'balon', 'sekil', 'kopru'];
  const blankGame = () => ({ rekor: 0, yildiz: 0, tamam: false, koylar: Array(coves.length).fill(false) });
  function blank() {
    // balik: the letters whose fish the player has already seen arrive in the Akvaryum.
    return { harf: Array(28).fill(0), hareke: Array(28).fill(0), bitisik: Array(28).fill(0), tanisma: false,
      yagmur: blankGame(), balon: blankGame(), sekil: blankGame(), kopru: blankGame(), balik: Array(28).fill(false) };
  }
  function load(id) {
    if (records.has(id)) return records.get(id);
    const saved = readRecord(storeKey(id));
    const record = blank();
    if (saved && typeof saved === 'object') {
      for (const part of parts) {
        if (Array.isArray(saved[part])) saved[part].slice(0, 28).forEach((n, i) => {
          if (Number.isInteger(n) && n > 0) record[part][i] = n;
        });
      }
      record.tanisma = saved.tanisma === true;
      if (Array.isArray(saved.balik)) saved.balik.slice(0, 28).forEach((on, i) => { record.balik[i] = on === true; });
      for (const name of gameNames) {
        const game = saved[name];
        if (!game || typeof game !== 'object') continue;
        if (Number.isInteger(game.rekor) && game.rekor > 0) record[name].rekor = game.rekor;
        // Stars from before the fifteen-letter section (0.9.0 had ten-letter rounds) do not count.
        if ('tamam' in game) {
          if (Number.isInteger(game.yildiz) && game.yildiz > 0) record[name].yildiz = Math.min(3, game.yildiz);
          record[name].tamam = game.tamam === true;
        }
        if (Array.isArray(game.koylar)) game.koylar.slice(0, coves.length).forEach((on, k) => { record[name].koylar[k] = on === true; });
      }
      // Players from before the games were steps of the path: a game step counts as played
      // when a later step is already done, so nobody is sent back.
      const done = (part, k) => k < 7 && coveLetters(k).every(i => record[part][i] >= mastery);
      for (let k = 0; k < 7; k++) {
        if (done('hareke', k) || done('harf', k + 1)) record.yagmur.koylar[k] = true;
        if (done('harf', k + 1)) record.balon.koylar[k] = true;
        // Cam Köprü came in 0.14.0 as the last step of a cove: coves already left behind have crossed it.
        if (done('harf', k + 1)) record.kopru.koylar[k] = true;
      }
    } else {
      // Version 0.1 kept the letters found in the matching game as a list of indexes.
      const old = readRecord('elif-ba-' + id);
      // It listed ه before و, so those two indexes trade places.
      const moved = i => i === 25 ? 26 : i === 26 ? 25 : i;
      if (Array.isArray(old)) for (const i of old) if (Number.isInteger(i) && i >= 0 && i < 28) record.harf[moved(i)] = 1;
    }
    records.set(id, record);
    return record;
  }
  let storageNote = '';
  function save() {
    try {
      localStorage.setItem(storeKey(activeProfile.id), JSON.stringify(progress));
      localStorage.removeItem('elif-ba-' + activeProfile.id);
      storageNote = '';
    } catch { storageNote = 'İlerlemen yalnızca bu oturumda saklanabildi.'; }
  }
  const mastered = (part, i, record = progress) => record[part][i] >= mastery;
  const masteredCount = (part, record = progress) => record[part].filter(n => n >= mastery).length;
  const coveDone = (part, k) => coveLetters(k).every(i => mastered(part, i));
  // The island is one path, cove by cove: the cove's letters, Harf Yağmuru, (before the first
  // harekes: meeting the harekes), the same letters with harekes, Hece Balonları, and Cam Köprü,
  // the mixed game that crosses over to the next cove. A bitişik yazılış cove has the shapes of its
  // letters, Şekil Yağmuru and Cam Köprü. Only the first step not yet done can be started; every step
  // done stays open to replay.
  const steps = coves.flatMap((_, k) => coveTopic(k) === 'bitisik' ? [
    { part: 'bitisik', cove: k },
    { game: 'sekil', cove: k },
    { game: 'kopru', cove: k }
  ] : [
    { part: 'harf', cove: k },
    { game: 'yagmur', cove: k },
    ...(k === 0 ? [{ intro: true, cove: 0 }] : []),
    { part: 'hareke', cove: k },
    { game: 'balon', cove: k },
    { game: 'kopru', cove: k }
  ]);
  const stepDone = step => step.intro ? progress.tanisma : step.game ? progress[step.game].koylar[step.cove] : coveDone(step.part, step.cove);
  const nextStep = () => steps.find(step => !stepDone(step)) || null;
  const stepOpen = step => devAll() || stepDone(step) || step === nextStep();
  const coveOpen = (part, k) => stepOpen(steps.find(step => step.part === part && step.cove === k));
  const stepIcon = step => step.intro ? '✨' : step.game ? games[step.game].icon : prizeOf(step.part);
  const stepName = step => step.intro ? 'Harekelerle tanış' : step.game ? games[step.game].name : sections.find(s => s.id === step.part).title;
  const stepLabel = step => coves[step.cove] + ' · ' + stepName(step);
  // A step in another cove: the turtle first walks there on the map.
  function goTo(step) {
    if (elifMap.walking()) return;
    if (mapCove !== null && step.cove !== mapCove) {
      showHub();
      visit(step.cove, () => goTo(step));
      return;
    }
    if (step.intro) { showHub(); startIntro(); return; }
    if (step.game) { showHub(); openGame(step.game, step.cove); return; }
    openSection(step.part, step.cove);
  }

  window.elifBaSummary = id => {
    const record = load(id);
    return { harf: masteredCount('harf', record), hareke: masteredCount('hareke', record), bitisik: masteredCount('bitisik', record),
      rekor: record.yagmur.rekor, tamam: record.yagmur.tamam, balon: { ...record.balon }, sekil: { ...record.sekil },
      kopru: { ...record.kopru, gecilen: record.kopru.koylar.filter(Boolean).length, koy: coves.length },
      any: parts.some(part => record[part].some(Boolean)) || record.tanisma || gameNames.some(name => record[name].rekor > 0) };
  };
  window.resetElifBa = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); localStorage.removeItem('elif-ba-' + id); } catch {}
    if (activeProfile?.id === id && !$('elif-view').hidden) { progress = records.get(id); mapCove = null; showHub(); }
  };

  /* ---------- Helpers ---------- */
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const pick = items => items[Math.floor(Math.random() * items.length)];
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const glyphHtml = text => '<b lang="ar" dir="rtl">' + text + '</b>';
  const prizeOf = part => sections.find(s => s.id === part).prize;
  function setTitle(text) { document.title = text + ' · Bilgi Adası'; }

  /* ---------- Hub: the island's sections ---------- */
  function drawShells() {
    // The corals of bitişik yazılış join in once the harekes of every letter are done.
    const corals = masteredCount('hareke') === 28 || masteredCount('bitisik') > 0;
    $('elif-shells').textContent = '🐚 ' + masteredCount('harf') + '/28 · 🦪 ' + masteredCount('hareke') + '/28' +
      (corals ? ' · 🪸 ' + masteredCount('bitisik') + '/28' : '');
  }
  function showHub() {
    voice.stop();
    section = null;
    $('elif-hub').hidden = false;
    $('elif-section').hidden = true;
    drawShells();
    const next = nextStep();
    const nextCove = next ? next.cove : coves.length - 1;
    if (mapCove === null) mapCove = nextCove;
    drawMap(next, nextCove);
    if (!elifMap.walking()) elifMap.place(mapCove);
    drawCove(mapCove, next);
    $('elif-next-step').hidden = !next;
    if (next) {
      $('elif-next-step').innerHTML = '<span class="elif-next-icon" aria-hidden="true">' + stepIcon(next) + '</span><span><small>Sıradaki</small>' +
        stepLabel(next) + '</span><span class="elif-next-go" aria-hidden="true">▶</span>';
      $('elif-next-step').onclick = () => goTo(next);
    }
    $('elif-done').hidden = !!next;
    drawAquariumCard();
    if (!elifMap.walking()) $('elif-hub-note').textContent = '';
    setTitle('Elif Ba Adası');
  }
  // Akvaryum: a fish for every letter whose harekes are learned. Fish not seen yet arrive when it opens.
  const fishLetters = () => glyphs.map((_, i) => i).filter(i => mastered('hareke', i));
  function drawAquariumCard() {
    const have = fishLetters();
    const fresh = have.filter(i => !progress.balik[i]);
    const card = $('elif-aquarium-open');
    card.classList.toggle('fresh', fresh.length > 0);
    card.innerHTML = '<span class="elif-aq-fish" aria-hidden="true">' + (have.length ? have.slice(-3) : [1, 13, 23]).map(i => elifAquarium.fishSvg(i, 'hub-aq', false)).join('') +
      '</span><span class="elif-aq-text"><strong>Akvaryum</strong><small>' + (have.length ? have.length + ' / 28 balık' : 'Harekeleri öğren, balıklar gelsin') +
      '</small></span>' + (fresh.length ? '<span class="elif-aq-new">✨ ' + fresh.length + ' yeni</span>' : '') + '<span class="elif-aq-go" aria-hidden="true">▶</span>';
    card.setAttribute('aria-label', 'Akvaryum, ' + have.length + ' balık' + (fresh.length ? ', ' + fresh.length + ' yeni balık' : ''));
    card.onclick = () => {
      if (elifMap.walking()) return;
      voice.stop();
      elifAquarium.open({ have, fresh, onClose: () => { if (!$('elif-view').hidden && !section) showHub(); } });
      for (const i of fresh) progress.balik[i] = true;
      if (fresh.length) save();
    };
  }
  // The map: coves done, the cove being learned, coves still locked, and the bridges crossed.
  const coveState = (k, next, nextCove) => k < nextCove || !next ? 'done' : k === nextCove ? 'current' : 'locked';
  function drawMap(next, nextCove) {
    // devAll (the "admin" player): no cove is drawn locked, as none is.
    const state = k => { const now = coveState(k, next, nextCove); return now === 'locked' && devAll() ? 'current' : now; };
    elifMap.update({ state, crossed: k => progress.kopru.koylar[k], selected: mapCove });
  }
  elifMap.build($('elif-map'), k => {
    const next = nextStep();
    if (coveState(k, next, next ? next.cove : coves.length - 1) === 'locked' && !devAll()) {
      playCue('oops');
      fx.bump($('elif-map').querySelector('.elif-isle[data-k="' + k + '"]'), 'denied');
      $('elif-hub-note').textContent = '🔒 ' + coves[k] + ' kilitli. Önce sıradaki adımı bitir: ' + stepLabel(next) + '.';
      return;
    }
    // Tapping the cove the turtle already stands on points at its next step on the pier.
    visit(k, () => {
      const first = $('elif-map').querySelector('.elif-dock-step.now');
      if (first) fx.bump(first, 'nudge');
    });
  });
  // The turtle walks over the bridges to cove k, then `then` goes on (opens a step, shows the cove).
  function visit(k, then) {
    if (elifMap.walking()) return;
    if (k === mapCove) { then?.(); return; }
    const map = $('elif-map');
    const box = map.getBoundingClientRect();
    if (box.top < 0 || box.bottom > innerHeight) map.scrollIntoView({ block: 'center', behavior: 'smooth' });
    $('elif-hub-note').textContent = '🐢 ' + coves[k] + "'na " + (k > mapCove ? 'yürüyor' : 'geri dönüyor') + '…';
    elifMap.walk(k).then(() => {
      mapCove = k;
      if ($('elif-view').hidden || !$('elif-section').hidden) return; // the child left meanwhile
      playCue('key');
      showHub();
      setTimeout(() => { if (!$('elif-view').hidden && !section) then?.(); }, 250);
    });
  }
  // The steps of the cove the turtle stands on, as round picture buttons on the pier below the map.
  function drawCove(k, next) {
    elifMap.dock(steps.filter(s => s.cove === k).map(step => {
      const done = stepDone(step);
      const now = step === next || (!done && devAll());
      const button = el('button', 'elif-dock-step' + (done ? ' done' : now ? ' now' : ' locked') + (step.game ? ' game' : ''),
        '<span class="elif-dock-icon" aria-hidden="true">' + stepIcon(step) + '</span><span class="elif-dock-state" aria-hidden="true">' +
        (done ? '✓' : now ? '▶' : '🔒') + '</span>');
      button.setAttribute('aria-label', stepLabel(step) + (done ? ', tamamlandı' : now ? ', sıradaki' : ', kilitli'));
      if (done || now) button.onclick = () => goTo(step);
      else {
        button.dataset.cue = '';
        button.setAttribute('aria-disabled', 'true');
        button.onclick = () => {
          playCue('oops');
          fx.bump(button, 'denied');
          // the step to do first bounces on the pier
          const first = $('elif-map').querySelector('.elif-dock-step.now');
          if (first) fx.bump(first, 'nudge');
          $('elif-hub-note').textContent = '🔒 Önce sıradaki adımı bitir: ' + stepName(next) + '.';
        };
      }
      return button;
    }), (k + 1) + '. ' + coves[k] + ' adımları');
  }

  /* ---------- A section: coves and letter cards ---------- */
  function openSection(id, at) {
    section = id;
    const info = sections.find(s => s.id === id);
    $('elif-hub').hidden = true;
    $('elif-section').hidden = false;
    $('elif-section-title').textContent = info.title;
    cove = at;
    drawSection();
    setTitle(coves[cove] + ' · ' + info.title + ' · Elif Ba Adası');
    $('elif-section-title').focus();
  }
  function drawSection() {
    const part = section;
    const info = sections.find(s => s.id === part);
    $('elif-section-title').innerHTML = '<small>' + coves[cove] + '</small>' + info.title;
    $('elif-section-count').textContent = info.prize + ' ' + masteredCount(part) + ' / 28';
    drawShells();
    const letters = coveLetters(cove);
    voice.preload(letters, false, part === 'bitisik');
    // The guide is said aloud the first time a section is opened, and again from its turtle button;
    // the written words are for the grown-ups.
    const guide = guides[part];
    $('elif-guide').innerHTML = '';
    const tell = el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>');
    tell.setAttribute('aria-label', 'Ne yapacağımı söyle');
    tell.onclick = () => voice.instruct(guide);
    $('elif-guide').append(tell, el('span', '', guide));
    if (!told.has(part)) { told.add(part); voice.instruct(guide); }
    $('elif-cards').className = 'elif-cards ' + (part === 'harf' ? 'letters' : part === 'hareke' ? 'syllables' : 'shapes');
    $('elif-cards').replaceChildren(...letters.map(i => part === 'harf' ? letterCard(i) : part === 'hareke' ? syllableCard(i) : shapeCard(i)));
    $('elif-play').textContent = coveDone(part, cove) ? '↻ Yeniden oyna' : '▶ Oyna';
    $('elif-note').textContent = '';
  }
  const guides = {
    harf: 'Harflere dokun, adlarını dinle. Hazır olunca aşağıdaki yeşil oyna düğmesine bas.',
    hareke: 'Hecelere dokun, okunuşlarını dinle. Nota düğmesi üç harekeyi sırayla okur. Hazır olunca yeşil oyna düğmesine bas.',
    bitisik: 'Harfler kelimede yan yana gelince birbirine bağlanır ve şekilleri biraz değişir. Kelimeler sağdan sola okunur. ' +
      'Şekillere ve kelimelere dokun, dinle. Kırmızı harf, öğrendiğin harf. Hazır olunca yeşil oyna düğmesine bas.'
  };
  const told = new Set(); // the sections whose guide was said in this visit
  function letterCard(i) {
    const button = el('button', 'elif-tile tone-' + i % 4);
    button.innerHTML = glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong><small aria-hidden="true">' +
      (mastered('harf', i) ? '🐚' : '♪') + '</small>';
    button.setAttribute('aria-label', names[i] + ' harfini dinle');
    button.onclick = () => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
      $('elif-note').textContent = names[i];
      voice.letter(i, $('elif-note'));
    };
    return button;
  }
  function syllableCard(i) {
    const card = el('div', 'elif-syllables tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong>' +
      '<small aria-hidden="true">' + (mastered('hareke', i) ? '🦪' : '') + '</small>');
    const chant = el('button', 'elif-chant', '♪');
    chant.setAttribute('aria-label', names[i] + ' üstün, esre, ötre okunuşunu dinle');
    chant.onclick = () => { $('elif-note').textContent = [0, 1, 2].map(h => syllableName(i, h)).join(' · '); voice.chant(i, undefined, $('elif-note')); };
    head.append(chant);
    const row = el('div', 'elif-syllable-row');
    for (const h of [0, 1, 2]) {
      const button = el('button', 'elif-syllable', glyphHtml(syllable(i, h)) + '<span>' + hareke(h) + '</span>');
      button.setAttribute('aria-label', syllableName(i, h) + ', dinle');
      button.onclick = () => {
        for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
        button.classList.add('selected');
        $('elif-note').textContent = syllableName(i, h);
        voice.syllable(i, h, $('elif-note'));
      };
      row.append(button);
    }
    card.append(head, row);
    return card;
  }
  // Bitişik yazılış: the letter, then a column for each place in the word (right to left: start,
  // middle, end) with the letter's shape there and Diyanet's example word, the letter coloured in it.
  const placeLower = f => places[f].toLocaleLowerCase('tr');
  const inWord = ['', 'kelimenin başında', 'kelimenin ortasında', 'kelimenin sonunda'];
  // A place in the word as a picture: three boxes for its letters, right to left, the place's box coloured.
  const placeIcon = f => '<span class="elif-place" aria-hidden="true">' + [1, 2, 3].map(g => '<i' + (g === f ? ' class="on"' : '') + '></i>').join('') + '</span>';
  // What to do in each kind of question, said aloud (the children cannot read yet).
  const howTo = {
    listen: 'Dinle. Duyduğun harfi bul.',
    sound: 'Bu harfin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'ses-hece': 'Dinle. Duyduğun heceyi bul.',
    'hece-ses': 'Bu hecenin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'sekil-harf': 'Bu şekil hangi harfin? Harfi bul.',
    'dinle-sekil': 'Dinle. Harfin bu şeklini bul.',
    yer: 'Kırmızı harf kelimenin neresinde? Başında mı, ortasında mı, sonunda mı? Kelimeler sağdan sola okunur.'
  };
  function shapeCard(i) {
    const card = el('div', 'elif-shapes tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong>' +
      '<small aria-hidden="true">' + (mastered('bitisik', i) ? '🪸' : '') + '</small>');
    const listen = el('button', 'elif-chant', '♪');
    listen.setAttribute('aria-label', names[i] + ' harfini dinle');
    listen.onclick = () => { $('elif-note').textContent = names[i]; voice.letter(i, $('elif-note')); };
    head.append(listen);
    const row = el('div', 'elif-shape-row');
    row.dir = 'rtl';
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    for (const f of [1, 2, 3]) {
      const column = el('div', 'elif-shape-col');
      column.dir = 'ltr';
      const form = el('button', 'elif-syllable', glyphHtml(shape(i, f)) + placeIcon(f));
      form.setAttribute('aria-label', names[i] + ', ' + inWord[f] + ', dinle');
      form.onclick = () => { select(form); $('elif-note').textContent = names[i] + ' ' + inWord[f]; voice.shape(i, f, $('elif-note')); };
      const sample = el('button', 'elif-word', wordHtml(i, f));
      sample.setAttribute('aria-label', names[i] + ' ' + inWord[f] + ': örnek kelimeyi dinle');
      sample.onclick = () => { select(sample); $('elif-note').textContent = 'Kelimenin harfleri sağdan sola okunuyor.'; voice.word(i, f, $('elif-note')); };
      column.append(form, sample);
      row.append(column);
    }
    card.append(head, row);
    if (!joinsNext(i)) {
      // Said aloud, too: the letter does not join the one after it.
      const sentence = names[i] + ' kendinden sonraki harfe bağlanmaz.';
      const apart = el('button', 'elif-apart', '<span aria-hidden="true">🔊</span> ' + glyphHtml(glyphs[i] + glyphs[1]) + '<span>' + sentence + '</span>');
      apart.onclick = () => { $('elif-note').textContent = sentence; voice.instruct(sentence); };
      card.append(apart);
    }
    return card;
  }
  // An example word with its letter coloured. The coloured letter keeps its joins to its neighbours
  // through zero-width joiners, so it looks the same as in the plain word.
  const ZWJ = '\u200d';
  const joinsAfter = c => !'اأإآدذرزوؤةء '.includes(c);
  function wordHtml(i, f) {
    const { text, marks } = word(i, f);
    let html = '';
    Array.from(text).forEach((c, n) => {
      if (!marks.includes(n)) { html += c; return; }
      const before = n > 0 && text[n - 1] !== ' ' && joinsAfter(text[n - 1]) && c !== 'ء';
      const after = n < text.length - 1 && text[n + 1] !== ' ' && joinsAfter(c);
      html += (before ? ZWJ : '') + '<span class="elif-mark">' + (before ? ZWJ : '') + c + (after ? ZWJ : '') + '</span>' + (after ? ZWJ : '');
    });
    return '<b lang="ar" dir="rtl">' + html + '</b>';
  }

  /* ---------- The games: Harf Yağmuru, Hece Balonları, Şekil Yağmuru and Cam Köprü ---------- */
  // Each cove has all three as steps of the path: Harf Yağmuru after its letters rains every letter
  // learned so far, Hece Balonları after its harekes flies those letters' syllables (letter * 3 + hareke),
  // and Cam Köprü mixes both on the bridge to the next cove.
  const games = {
    yagmur: {
      kind: 'harf', name: 'Harf Yağmuru', icon: '🌧️', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => mastered('harf', i))
    },
    balon: {
      kind: 'hece', name: 'Hece Balonları', icon: '🎈', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => mastered('hareke', i)).flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2])
    },
    sekil: {
      kind: 'sekil', name: 'Şekil Yağmuru', icon: '☔', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => mastered('bitisik', i))
    },
    kopru: { name: 'Cam Köprü', icon: '🌉', tag: 'Karma' }
  };
  // The bridge of the last cove leads on to the cove that is coming next.
  const destination = k => k < coves.length - 1 ? { to: coves[k + 1], toDative: coves[k + 1] + "'na" } :
    { to: 'Sıradaki koy', toDative: 'sıradaki koya' };
  // A cove's game plays with everything learned up to and including that cove.
  function openGame(id, k) {
    const info = games[id];
    const step = steps.find(s => s.game === id && s.cove === k);
    if (!stepOpen(step)) return;
    voice.stop();
    const result = ({ score, stars, finished }) => {
      const record = progress[id];
      record.rekor = Math.max(record.rekor, score);
      if (finished) {
        record.yildiz = Math.max(record.yildiz, stars);
        if (stars === 3) record.tamam = true;
        record.koylar[k] = true; // played to the end: the path goes on
      }
      save();
    };
    // After a game played to the end, the result card leads on to the next step.
    const next = () => {
      const after = nextStep();
      return after ? { label: stepIcon(after) + ' ' + stepName(after), go: () => goTo(after) } : null;
    };
    const onClose = () => {
      if ($('elif-view').hidden) return;
      if (section) drawSection(); else showHub();
    };
    // The letter groups up to this cove's: the coves of a topic go through the same groups of four again.
    const upTo = i => Math.floor((id === 'balon' ? Math.floor(i / 3) : i) / 4) <= k % LETTER_COVES;
    if (id === 'kopru') {
      const joined = coveTopic(k) === 'bitisik';
      elifBridgeGame.open({
        // In a bitişik cove the bridge has the joined shapes of the letters learned so far, and a few
        // harekeli syllables of all the letters for review.
        letters: glyphs.map((_, i) => i).filter(i => upTo(i) && (!joined || mastered('bitisik', i))),
        recent: coveLetters(k), joined, known: glyphs.map((_, i) => i), from: coves[k], ...destination(k),
        best: () => progress.kopru, onResult: result, next, onClose
      });
      return;
    }
    const recent = coveLetters(k);
    elifListeningGame.open({
      kind: info.kind,
      letters: info.items().filter(upTo),
      recent: id === 'balon' ? recent.flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2]) : recent,
      best: () => progress[id],
      onResult: result, next, onClose
    });
  }

  /* ---------- Rounds ---------- */
  function choicesFor(target, count, pool) {
    return shuffled([target, ...shuffled(pool.filter(i => i !== target)).slice(0, count - 1)]);
  }
  // From the second cove on, every round mixes the new letters with the earlier coves' letters:
  // earlier letters turn up among the choices and get questions of their own for review.
  const REVIEW = 4;
  const earlierLetters = k => Array.from({ length: k * 4 }, (_, i) => i);
  const review = k => shuffled(earlierLetters(k)).slice(0, REVIEW);
  function letterPool(k) {
    return [...coveLetters(k), ...shuffled(earlierLetters(k)).slice(0, 3)];
  }
  function harfRound(k) {
    const own = coveLetters(k);
    const questions = [];
    for (const target of shuffled(own)) questions.push({ type: 'listen', target, choices: choicesFor(target, 4, letterPool(k)) });
    for (const target of shuffled(own)) questions.push({ type: 'sound', target, choices: choicesFor(target, 3, own) });
    // review: an earlier letter among the new ones
    for (const target of review(k)) questions.push({ type: 'listen', target, choices: choicesFor(target, 4, [...own, ...earlierLetters(k)]) });
    return spread(questions);
  }
  // A syllable and the ones it is told apart from: first the same letter with the other
  // harekes, then syllables of other letters, never two that sound alike.
  function syllableChoices(target, h, k, count) {
    const picked = [[target, h], ...[0, 1, 2].filter(x => x !== h).map(x => [target, x])];
    const others = shuffled(letterPool(k).filter(i => i !== target).flatMap(i => [0, 1, 2].map(x => [i, x])));
    for (const [i, x] of others) {
      if (picked.length >= count) break;
      if (!picked.some(([j, y]) => sameSound(i, x, j, y))) picked.push([i, x]);
    }
    return shuffled(picked.slice(0, count));
  }
  // Each letter of the cove twice, with no Turkish reading written anywhere: a syllable is heard
  // and the harekeli letter found (ses-hece), a harekeli letter is shown and its sound found
  // among the sounds of its three harekes (hece-ses).
  function harekeRound(k) {
    const own = shuffled(coveLetters(k));
    const marks = shuffled([0, 1, 2, 0, 1, 2, pick([0, 1, 2]), pick([0, 1, 2])]);
    const questions = [];
    own.forEach((target, n) => {
      questions.push({ type: 'ses-hece', target, h: marks[n], choices: syllableChoices(target, marks[n], k, 4) });
      questions.push({ type: 'hece-ses', target, h: marks[n + 4], choices: syllableChoices(target, marks[n + 4], k, 3) });
    });
    // review: earlier letters with their harekes, both ways
    review(k).forEach((target, n) => {
      const h = pick([0, 1, 2]);
      questions.push(n % 2 ? { type: 'hece-ses', target, h, choices: syllableChoices(target, h, k, 3) } :
        { type: 'ses-hece', target, h, choices: syllableChoices(target, h, k, 4) });
    });
    return spread(questions);
  }
  function introRound() {
    // Only letters the child already knows, two questions for each hareke: one letter at a
    // time, read with its three harekes.
    const known = Array.from({ length: 28 }, (_, i) => i).filter(i => mastered('harf', i));
    const letters = shuffled(known.length ? known : coveLetters(0));
    return spread([0, 1, 2, 0, 1, 2].map((h, n) => ({ type: n < 3 ? 'hece-ses' : 'ses-hece', target: letters[n % letters.length], h,
      choices: shuffled([0, 1, 2]).map(x => [letters[n % letters.length], x]) })));
  }
  // Bitişik yazılış: every letter of the cove three times, each time at another place in the word. Its
  // shape is shown and the letter found among letters alone (sekil-harf); the letter and its place are
  // heard and its shape found among other letters' shapes at the same place (dinle-sekil); an example
  // word shows the letter coloured and the child says where in the word it is (yer). From the second
  // bitişik cove on, letters of the earlier ones come back for review.
  function shapeChoices(target, k) {
    const twinsOf = twins(target);
    const order = [...shuffled(twinsOf), ...shuffled(coveLetters(k)), ...shuffled(glyphs.map((_, i) => i))];
    const picked = [target];
    for (const i of order) if (picked.length < 4 && !picked.includes(i)) picked.push(i);
    return shuffled(picked);
  }
  const shapeQuestion = (type, target, f, k) => type === 'yer' ? { type, target, f, choices: shuffled([1, 2, 3]) } :
    { type, target, f, choices: shapeChoices(target, k) };
  function bitisikRound(k) {
    const questions = [];
    for (const target of coveLetters(k)) {
      const at = shuffled([1, 2, 3]);
      ['sekil-harf', 'dinle-sekil', 'yer'].forEach((type, n) => questions.push(shapeQuestion(type, target, at[n], k)));
    }
    const first = k - k % LETTER_COVES; // the first cove of the topic
    const earlier = Array.from({ length: (k - first) * 4 }, (_, i) => i);
    shuffled(earlier).slice(0, REVIEW).forEach((target, n) =>
      questions.push(shapeQuestion(['sekil-harf', 'dinle-sekil', 'yer'][n % 3], target, pick([1, 2, 3]), k)));
    return spread(questions);
  }
  // Keep the same letter from coming up twice in a row.
  function spread(questions) {
    const result = shuffled(questions);
    for (let i = 1; i < result.length; i++) {
      if (result[i].target !== result[i - 1].target) continue;
      const j = result.findIndex((q, n) => n > i && q.target !== result[i - 1].target);
      if (j > 0) [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function startRound(kind) {
    round = { kind, part: kind === 'intro' ? 'hareke' : section, cove, wasDone: kind === 'cove' && coveDone(section, cove), questions:
      kind === 'intro' ? introRound() : section === 'harf' ? harfRound(cove) : section === 'hareke' ? harekeRound(cove) : bitisikRound(cove),
      right: 0, missed: new Set() };
    turn = 0;
    earned = [];
    if (!dialog.open) dialog.showModal();
    ask();
  }
  $('elif-play').onclick = () => { if (coveOpen(section, cove)) { playCue('start'); startRound('cove'); } };

  function header(total) {
    const label = round.kind === 'intro' ? 'Harekelerle tanışma' : coves[round.cove];
    return '<p class="elif-step">' + label + ' · ' + (turn + 1) + ' / ' + total + '</p><ol class="elif-dots" aria-hidden="true">' +
      round.questions.map((_, n) => '<li class="' + (round.missed.has(n) ? 'miss' : n < turn ? 'done' : n === turn ? 'now' : '') +
        '"></li>').join('') + '</ol>';
  }
  function ask() {
    const q = round.questions[turn];
    const total = round.questions.length;
    const stage = $('elif-stage');
    stage.innerHTML = header(total);
    const prompt = el('h2', '', '');
    prompt.id = 'elif-prompt';
    prompt.tabIndex = -1;
    const response = el('p', '', '');
    response.id = 'elif-response';
    response.setAttribute('role', 'status');
    const next = el('button', 'elif-action', '');
    next.id = 'elif-next';
    next.hidden = true;
    const letterQuestion = q.type === 'listen' || q.type === 'sound';
    const joined = ['sekil-harf', 'dinle-sekil', 'yer'].includes(q.type);
    // A bitişik question says the letter and its place ("Be. Kelimenin başında"); the example word can be heard on its own.
    const play = () => joined ? voice.shape(q.target, q.f, response) : letterQuestion ? voice.letter(q.target, response) :
      voice.syllable(q.target, q.h, response);
    const speaker = () => {
      const button = el('button', 'elif-speaker', '<span aria-hidden="true">🔊</span><small>Tekrar dinle</small>');
      button.setAttribute('aria-label', 'Sesi tekrar dinle');
      button.onclick = play;
      return button;
    };
    const grid = el('div', 'elif-choices');
    grid.id = 'elif-choices';
    let rightButton = null;
    const answer = q.type === 'yer' ? places[q.f] : q.type === 'dinle-sekil' ? names[q.target] + ', ' + placeLower(q.f) :
      letterQuestion || joined ? names[q.target] : syllableName(q.target, q.h);
    // The children cannot read yet: what to do is said aloud the first time a kind of question comes
    // in a round, and the turtle button says it again. Listening questions then play their sound.
    let autoplay = false;
    round.told ||= new Set();
    const fresh = !round.told.has(q.type);
    round.told.add(q.type);
    const tell = then => voice.instruct(howTo[q.type], () => { if (dialog.open && round.questions[turn] === q) then?.(); });
    const howto = el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>');
    howto.setAttribute('aria-label', 'Ne yapacağımı tekrar söyle');
    howto.onclick = () => tell(autoplay ? play : null);
    stage.append(howto);

    if (q.type === 'listen') {
      prompt.textContent = 'Dinle ve harfi bul';
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(glyphs[i]), n, i === q.target, () => names[i] + ' değil.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'sound') {
      prompt.textContent = 'Bu harfin adı hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(glyphs[q.target])));
      soundChoices(q.choices.map(i => [() => voice.letter(i, response), i === q.target]), stage, response, 'Bu ses başka bir harfin.');
    } else if (q.type === 'ses-hece') {
      // From the sound to the letter: the syllable is only heard, the harekeli letter is to be found.
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add(q.choices.length === 3 ? 'three' : 'four');
      q.choices.forEach(([i, h], n) => grid.append(choice(glyphHtml(syllable(i, h)), n, i === q.target && h === q.h,
        () => 'Bu ' + syllableName(i, h) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'hece-ses') {
      // From the letter to the sound: the harekeli letter is shown, its sound is to be found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(syllable(q.target, q.h))));
      soundChoices(q.choices.map(([i, h]) => [() => voice.syllable(i, h, response), i === q.target && h === q.h]), stage, response,
        'Bu ses başka bir hecenin.');
    } else if (q.type === 'sekil-harf') {
      // A shape is shown: which letter is it?
      prompt.textContent = 'Bu hangi harf?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(shape(q.target, q.f))));
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(glyphs[i]), n, i === q.target, () => 'Bu şekil ' + names[i] + ' değil.')));
      stage.append(grid);
    } else if (q.type === 'dinle-sekil') {
      // The letter and its place are heard: which shape is it?
      prompt.innerHTML = 'Dinle ve harfin şeklini bul ' + placeIcon(q.f);
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(shape(i, q.f)), n, i === q.target, () => 'Bu ' + names[i] + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'yer') {
      // An example word with the letter coloured: where in the word is it? The places run right to left.
      prompt.textContent = 'Kırmızı harf kelimenin neresinde?';
      const sample = el('button', 'elif-big elif-word-big', wordHtml(q.target, q.f) + '<small aria-hidden="true">🔊</small>');
      sample.setAttribute('aria-label', 'Kelimenin harflerini dinle');
      sample.onclick = () => voice.word(q.target, q.f, response);
      // The choices are pictures, not words: three boxes for the letters of a word, right to left,
      // the box of the place coloured like the letter in the word.
      grid.classList.add('three', 'places');
      grid.dir = 'rtl';
      q.choices.sort((a, b) => a - b).forEach((f, n) => grid.append(choice(placeIcon(f), n, f === q.f,
        () => names[q.target] + ' ' + placeLower(f) + ' değil.', places[f])));
      stage.append(prompt, sample, el('p', 'elif-rtl', '<span aria-hidden="true">⬅</span>'), grid);
    }
    stage.append(response, next);
    prompt.focus();
    if (fresh) tell(autoplay ? play : null); else if (autoplay) play();

    function choice(html, n, right, wrongText, label) {
      const button = el('button', 'elif-choice tone-' + n % 4, html);
      button.dataset.cue = '';
      button.setAttribute('aria-label', label || (n + 1) + '. seçenek');
      if (right) rightButton = button;
      button.onclick = () => right ? correct(button) : wrong(button, wrongText());
      return button;
    }
    // As on Çarpım Adası: the first mistake ends the round. The right answer is shown
    // and read out, then the round starts again from the beginning with new questions.
    function wrong(button, text) {
      round.missed.add(turn);
      for (const item of stage.querySelectorAll('.elif-choice, .elif-sound, #elif-choose, .elif-speaker')) item.disabled = true;
      playCue('retry');
      fx.bump(button, 'missed');
      button.classList.add('chosen-wrong');
      rightButton?.classList.add('matched');
      stage.querySelector('.elif-dots li.now')?.classList.replace('now', 'miss');
      response.textContent = 'Ah, bu kez olmadı! ' + text + ' Doğrusu: ' + answer + '. Tur baştan başlıyor.';
      setTimeout(() => { if (dialog.open && round.questions[turn] === q) {
        if (round.kind === 'intro') voice.chant(q.target, q.h); else play();
      } }, 600);
      next.hidden = false;
      next.textContent = '↻';
      next.setAttribute('aria-label', 'Tekrar dene');
      next.focus();
      next.onclick = () => {
        voice.stop();
        playCue('start');
        if (round.kind === 'intro') {
          round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
          turn = 0;
          ask();
        } else startRound('cove');
      };
    }
    function correct(button) {
      for (const item of stage.querySelectorAll('.elif-choice, .elif-sound, #elif-choose')) item.disabled = true;
      button?.classList.add('matched');
      playCue('correct');
      if (button) fx.burst(button, { symbols: [prizeOf(round.part), '✦', '★'] });
      round.right++;
      let message = '✓ Doğru!';
      if (round.kind === 'intro') message += ' Bu ' + syllableName(q.target, q.h) + '.';
      else if (round.part === 'harf') message += ' Bu ' + names[q.target] + '.';
      else if (joined) message += ' ' + names[q.target] + ' ' + inWord[q.f] + '.';
      else message += ' Bu ' + syllableName(q.target, q.h) + '.';
      response.textContent = message;
      if (round.kind === 'intro') voice.chant(q.target, q.h);
      else if (q.type === 'hece-ses' || q.type === 'sound' || joined) play();
      next.hidden = false;
      next.textContent = turn === total - 1 ? '🏁' : '▶';
      next.setAttribute('aria-label', turn === total - 1 ? 'Sonucu gör' : 'Sıradaki soru');
      next.focus();
      next.onclick = () => { voice.stop(); turn++; turn === total ? finish() : ask(); };
    }
    // Sound options: tap to listen, then confirm the one that matches the letter.
    function soundChoices(options, host, note, wrongText) {
      const row = el('div', 'elif-sounds');
      let selected = null;
      const choose = el('button', 'elif-action', '✓ Bu ses');
      choose.id = 'elif-choose';
      choose.disabled = true;
      choose.dataset.cue = '';
      options.forEach(([listen, right], n) => {
        const button = el('button', 'elif-sound tone-' + n % 4, '<span aria-hidden="true">🔊</span><small>' + (n + 1) + '</small>');
        button.setAttribute('aria-label', (n + 1) + '. sesi dinle');
        button.setAttribute('aria-pressed', 'false');
        button.onclick = () => {
          for (const other of row.children) other.setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-pressed', 'true');
          selected = { button, right };
          choose.disabled = false;
          note.textContent = (n + 1) + '. ses seçildi. Doğruysa “Bu ses”e dokun.';
          listen();
        };
        if (right) rightButton = button;
        row.append(button);
      });
      choose.onclick = () => {
        if (!selected) return;
        if (selected.right) return correct(selected.button);
        selected.button.setAttribute('aria-pressed', 'false');
        wrong(selected.button, wrongText);
      };
      host.append(row, choose);
    }
  }

  function finish() {
    const total = round.questions.length;
    const stage = $('elif-stage');
    const perfect = round.missed.size === 0;
    const misses = total + ' sorudan ' + round.missed.size + ' tanesinde hata oldu.';
    const retry = '<div class="elif-prize" aria-hidden="true">🔁</div><h2 id="elif-prompt" tabindex="-1">Bir daha deneyelim!</h2>';
    if (round.kind === 'intro') {
      if (perfect) {
        progress.tanisma = true;
        save();
      }
      stage.innerHTML = perfect ? '<div class="elif-prize" aria-hidden="true">✨</div><h2 id="elif-prompt" tabindex="-1">Harekelerle tanıştın!</h2>' +
        '<p>Üstün <b lang="ar">◌َ</b>, esre <b lang="ar">◌ِ</b> ve ötre <b lang="ar">◌ُ</b> ile tanıştın. Şimdi öğrendiğin harfleri ' +
        'harekeleriyle okuyalım.</p>' + (storageNote ? '<p>' + storageNote + '</p>' : '') +
        '<button class="elif-action" id="elif-continue">▶ Devam: 🦪 Harekeler</button>' :
        retry + '<p>' + misses + ' Harekelere geçmek için hepsini ilk denemede bilmelisin.</p>' +
        '<button class="elif-action" id="elif-continue">↻ Tekrar dene</button>';
      playCue(perfect ? 'island' : 'retry');
      if (perfect) fx.confetti(dialog);
    } else {
      const part = round.part;
      const before = coveDone(part, round.cove);
      // Only a round without a single mistake passes the cove and gives its prizes.
      if (perfect) {
        for (const i of coveLetters(round.cove)) {
          if (!mastered(part, i)) earned.push(i);
          progress[part][i] = Math.max(progress[part][i], mastery);
        }
        save();
      }
      const done = coveDone(part, round.cove);
      const step = nextStep();
      const prizes = earned.map(i => '<span class="elif-won" lang="ar">' + (part === 'bitisik' ? shape(i, 2) : glyphs[i]) + '</span>').join('');
      if (!done) {
        stage.innerHTML = retry + '<p>' + misses + ' Koyu geçmek için bütün soruları ilk denemede bilmelisin. Harfleri bir kez daha dinle ve tekrar oyna.</p>' +
          '<button class="elif-action" id="elif-continue">↻ Tekrar oyna</button>';
        playCue('retry');
      } else {
        const heading = before ? (perfect ? 'Hepsi doğru!' : 'Güzel çalıştın!') : !step ? 'Yolun sonuna geldin!' :
          part === 'harf' ? coves[round.cove] + ' harflerini öğrendin!' : part === 'hareke' ? coves[round.cove] + ' harekeleri tamam!' :
          coves[round.cove] + ' şekilleri tamam!';
        let text = perfect ? 'Bütün soruları ilk denemede bildin.' : misses;
        if (before) { /* a replay: nothing to announce */ }
        else if (!step) text += ' Sıradaki bölümler yakında geliyor.';
        else if (step.game) text += ' Şimdi oyun zamanı: ' + games[step.game].name + '!';
        else if (step.intro) text += ' Şimdi harekelerle tanışalım.';
        else if (step.part === 'hareke') text += ' Şimdi bu harfleri harekeleriyle okuyalım.';
        else if (step.part === 'bitisik') text += ' Sırada harflerin bitişik yazılışı var: ' + coves[step.cove] + '.';
        else text += ' Sırada yeni harfler var: ' + coves[step.cove] + '.';
        stage.innerHTML = '<div class="elif-prize" aria-hidden="true">' + prizeOf(part) + '</div><h2 id="elif-prompt" tabindex="-1">' +
          heading + '</h2>' + (prizes ? '<div class="elif-won-row">' + prizes + '</div>' : '') + '<p>' + text + '</p>' +
          (storageNote ? '<p>' + storageNote + '</p>' : '') + '<button class="elif-action" id="elif-continue"></button>';
        $('elif-continue').textContent = before || !step ? '‹ Yola dön' : '▶ Devam: ' + stepIcon(step) + ' ' + stepName(step);
        playCue(perfect ? 'island' : 'correct');
        if (perfect) fx.confetti(dialog);
      }
    }
    $('elif-prompt').focus();
    voice.instruct($('elif-prompt').textContent);
    $('elif-continue').onclick = () => {
      if (round.kind === 'intro' && !progress.tanisma) {
        round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
        turn = 0;
        ask();
        return;
      }
      if (round.kind === 'cove' && !coveDone(round.part, round.cove)) { startRound('cove'); return; }
      // A step done for the first time leads straight on to the next one; a replay back to the path.
      const step = nextStep();
      const replay = round.kind === 'cove' && round.wasDone;
      dialog.close();
      if (step && !replay) goTo(step); else showHub();
    };
  }

  /* ---------- Hareke introduction ---------- */
  function startIntro() {
    let slide = 0;
    round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
    turn = 0;
    earned = [];
    dialog.showModal();
    const show = () => {
      const info = harekeler[slide];
      $('elif-stage').innerHTML = '<p class="elif-step">Harekelerle tanışma · ' + (slide + 1) + ' / 3</p>' +
        '<h2 id="elif-prompt" tabindex="-1">' + info.name + '</h2><button class="elif-big mark-' + slide + '" id="elif-demo" aria-label="Dinle">' +
        glyphHtml(syllable(1, slide)) + '</button><p class="elif-lesson"><b>' + info.place + '.</b> Harfe dokun ve dinle: ' +
        '<b>' + syllableName(1, slide) + '</b>.</p>' +
        '<div class="elif-examples">' + [1, 2, 3].map(i => '<button class="elif-syllable" data-i="' + i + '">' + glyphHtml(syllable(i, slide)) +
        '<span>' + names[i] + '</span></button>').join('') + '</div><p id="elif-response" role="status"></p>' +
        '<button class="elif-action" id="elif-next">▶ ' + (slide < 2 ? 'Sonraki hareke' : 'Şimdi sen bul') + '</button>';
      $('elif-prompt').focus();
      const note = $('elif-response');
      // Said aloud for children who cannot read yet: the hareke's name, where it sits, then the chant.
      const lesson = () => voice.instruct(info.name + '. ' + info.place + '. Harfe dokun ve dinle.', () => voice.chant(1, slide, note));
      $('elif-stage').prepend(el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>'));
      $('elif-stage').querySelector('.elif-howto').onclick = lesson;
      $('elif-stage').querySelector('.elif-howto').setAttribute('aria-label', 'Tekrar anlat');
      $('elif-demo').onclick = () => voice.chant(1, slide, note);
      for (const button of $('elif-stage').querySelectorAll('.elif-examples button')) {
        button.onclick = () => voice.syllable(Number(button.dataset.i), slide, note);
      }
      lesson();
      $('elif-next').onclick = () => { voice.stop(); if (slide < 2) { slide++; show(); } else ask(); };
    };
    show();
  }

  /* ---------- Entry and leaving ---------- */
  $('elif-card').onclick = () => {
    if (!availableForPlayer($('elif-card'))) return;
    progress = load(activeProfile.id);
    mapCove = null;
    told.clear();
    $('catalog').hidden = true;
    $('elif-view').hidden = false;
    showHub();
    $('elif-title').focus();
    window.speechSynthesis?.getVoices();
  };
  $('elif-up').onclick = () => { showHub(); $('elif-title').focus(); };
  $('elif-back').onclick = () => { voice.stop(); showCatalog(); };
  $('player').addEventListener('click', () => voice.stop());
  $('elif-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // already reopened for the next step (the hareke introduction)
    voice.stop();
    if ($('elif-view').hidden) return;
    if (section) drawSection(); else showHub();
  });
})();
