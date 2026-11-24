// Elif Ba Adası: an island in sections. Section 1 teaches the letters, section 2 the harekes,
// the later sections (cezm, tenvin, şedde, ...) are announced and open in coming releases. Letters and
// sections are in data.js; the listening games (Harf Yağmuru, Hece Balonları) in games/listening.js,
// the mixed game at the end of every cove (Cam Köprü) in games/bridge.js.
(() => {
  const { glyphs, names, harekeler, coves, sections, sameSound, syllable, coveLetters, mastery } = elifData;
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
  // yagmur (Harf Yağmuru), balon (Hece Balonları) and kopru (Cam Köprü): the game's best score,
  // the most hearts (stars) a section was finished with, whether it was ever finished with all
  // three, and the coves whose game step was played to the end (koylar).
  const gameNames = ['yagmur', 'balon', 'kopru'];
  const blankGame = () => ({ rekor: 0, yildiz: 0, tamam: false, koylar: Array(7).fill(false) });
  function blank() {
    return { harf: Array(28).fill(0), hareke: Array(28).fill(0), tanisma: false, yagmur: blankGame(), balon: blankGame(), kopru: blankGame() };
  }
  function load(id) {
    if (records.has(id)) return records.get(id);
    const saved = readRecord(storeKey(id));
    const record = blank();
    if (saved && typeof saved === 'object') {
      for (const part of ['harf', 'hareke']) {
        if (Array.isArray(saved[part])) saved[part].slice(0, 28).forEach((n, i) => {
          if (Number.isInteger(n) && n > 0) record[part][i] = n;
        });
      }
      record.tanisma = saved.tanisma === true;
      for (const name of gameNames) {
        const game = saved[name];
        if (!game || typeof game !== 'object') continue;
        if (Number.isInteger(game.rekor) && game.rekor > 0) record[name].rekor = game.rekor;
        // Stars from before the fifteen-letter section (0.9.0 had ten-letter rounds) do not count.
        if ('tamam' in game) {
          if (Number.isInteger(game.yildiz) && game.yildiz > 0) record[name].yildiz = Math.min(3, game.yildiz);
          record[name].tamam = game.tamam === true;
        }
        if (Array.isArray(game.koylar)) game.koylar.slice(0, 7).forEach((on, k) => { record[name].koylar[k] = on === true; });
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
  // the mixed game that crosses over to the next cove. Only the first step not yet done can be
  // started; every step done stays open to replay.
  const steps = coves.flatMap((_, k) => [
    { part: 'harf', cove: k },
    { game: 'yagmur', cove: k },
    ...(k === 0 ? [{ intro: true, cove: 0 }] : []),
    { part: 'hareke', cove: k },
    { game: 'balon', cove: k },
    { game: 'kopru', cove: k }
  ]);
  const stepDone = step => step.intro ? progress.tanisma : step.game ? progress[step.game].koylar[step.cove] : coveDone(step.part, step.cove);
  const nextStep = () => steps.find(step => !stepDone(step)) || null;
  const stepOpen = step => stepDone(step) || step === nextStep();
  const coveOpen = (part, k) => stepOpen(steps.find(step => step.part === part && step.cove === k));
  const stepIcon = step => step.intro ? '✨' : step.game ? games[step.game].icon : prizeOf(step.part);
  const stepName = step => step.intro ? 'Harekelerle tanış' : step.game ? games[step.game].name : step.part === 'harf' ? 'Harfler' : 'Harekeler';
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
    return { harf: masteredCount('harf', record), hareke: masteredCount('hareke', record), rekor: record.yagmur.rekor, tamam: record.yagmur.tamam,
      balon: { ...record.balon }, kopru: { ...record.kopru, gecilen: record.kopru.koylar.filter(Boolean).length },
      any: record.harf.some(Boolean) || record.hareke.some(Boolean) || record.tanisma || gameNames.some(name => record[name].rekor > 0) };
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
    $('elif-shells').textContent = '🐚 ' + masteredCount('harf') + '/28 · 🦪 ' + masteredCount('hareke') + '/28';
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
    $('elif-soon').replaceChildren(...sections.filter(info => info.soon).map(info =>
      el('li', '', '<strong>' + info.title + '</strong><span>' + info.lead + '</span>')));
    $('elif-next-step').hidden = !next;
    if (next) {
      $('elif-next-step').innerHTML = '<span class="elif-next-icon" aria-hidden="true">' + stepIcon(next) + '</span><span><small>Sıradaki</small>' +
        stepLabel(next) + '</span><span class="elif-next-go" aria-hidden="true">▶</span>';
      $('elif-next-step').onclick = () => goTo(next);
    }
    $('elif-done').hidden = !!next;
    if (!elifMap.walking()) $('elif-hub-note').textContent = '';
    setTitle('Elif Ba Adası');
  }
  // The map: coves done, the cove being learned, coves still locked, and the bridges crossed.
  const coveState = (k, next, nextCove) => k < nextCove || !next ? 'done' : k === nextCove ? 'current' : 'locked';
  function drawMap(next, nextCove) {
    elifMap.update({ state: k => coveState(k, next, nextCove), crossed: k => progress.kopru.koylar[k], selected: mapCove });
  }
  elifMap.build($('elif-map'), k => {
    const next = nextStep();
    if (coveState(k, next, next ? next.cove : coves.length - 1) === 'locked') {
      playCue('oops');
      fx.bump($('elif-map').querySelector('.elif-isle[data-k="' + k + '"]'), 'denied');
      $('elif-hub-note').textContent = '🔒 ' + coves[k] + ' kilitli. Önce sıradaki adımı bitir: ' + stepLabel(next) + '.';
      return;
    }
    visit(k, () => $('elif-path').scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
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
  // The steps of the cove the turtle stands on.
  function drawCove(k, next) {
    const nextCove = next ? next.cove : coves.length - 1;
    const state = coveState(k, next, nextCove);
    const item = el('li', 'elif-stop ' + (state === 'current' ? 'current' : 'done'));
    item.append(el('div', 'elif-stop-head', '<span class="elif-stop-glyphs" lang="ar" dir="rtl" aria-hidden="true">' +
      coveLetters(k).map(i => glyphs[i]).join(' ') + '</span><strong>' + (k + 1) + '. ' + coves[k] + '</strong>' +
      (state === 'done' ? '<span class="elif-stop-done">✓ Tamam</span>' : '')));
    const list = el('ol', 'elif-steps');
    for (const step of steps.filter(s => s.cove === k)) {
      const done = stepDone(step);
      const now = step === next;
      const button = el('button', 'elif-step-node' + (done ? ' done' : now ? ' now' : ' locked') + (step.game ? ' game' : ''),
        '<span class="elif-step-icon" aria-hidden="true">' + stepIcon(step) + '</span><span class="elif-step-name">' + stepName(step) +
        (step.game ? '<small>' + games[step.game].tag + '</small>' : '') + '</span><span class="elif-step-state" aria-hidden="true">' +
        (done ? '✓' : now ? '▶' : '🔒') + '</span>');
      button.setAttribute('aria-label', stepLabel(step) + (done ? ', tamamlandı' : now ? ', sıradaki' : ', kilitli'));
      if (done || now) button.onclick = () => goTo(step);
      else {
        button.dataset.cue = '';
        button.setAttribute('aria-disabled', 'true');
        button.onclick = () => {
          playCue('oops');
          fx.bump(button, 'denied');
          $('elif-hub-note').textContent = '🔒 Önce sıradaki adımı bitir: ' + stepName(next) + '.';
        };
      }
      const li = el('li');
      li.append(button);
      list.append(li);
    }
    item.append(list);
    $('elif-path').replaceChildren(item);
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
    voice.preload(letters);
    $('elif-guide').textContent = part === 'harf' ? '1. Harflere dokun, adlarını dinle.\n2. Hazır olunca “Oyna”ya bas.' :
      '1. Hecelere dokun, okunuşlarını dinle. ♪ üç harekeyi sırayla okur.\n2. Hazır olunca “Oyna”ya bas.';
    $('elif-cards').className = 'elif-cards ' + (part === 'harf' ? 'letters' : 'syllables');
    $('elif-cards').replaceChildren(...letters.map(i => part === 'harf' ? letterCard(i) : syllableCard(i)));
    $('elif-play').textContent = coveDone(part, cove) ? '↻ Yeniden oyna' : '▶ Oyna';
    $('elif-note').textContent = '';
  }
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
  /* ---------- The games: Harf Yağmuru, Hece Balonları and Cam Köprü ---------- */
  // Each cove has all three as steps of the path: Harf Yağmuru after its letters rains every letter
  // learned so far, Hece Balonları after its harekes flies those letters' syllables (letter * 3 + hareke),
  // and Cam Köprü lays harekeli syllables of this cove and the earlier ones on the bridge to the next cove.
  const games = {
    yagmur: {
      kind: 'harf', name: 'Harf Yağmuru', icon: '🌧️', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => mastered('harf', i))
    },
    balon: {
      kind: 'hece', name: 'Hece Balonları', icon: '🎈', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => mastered('hareke', i)).flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2])
    },
    kopru: { name: 'Cam Köprü', icon: '🌉', tag: 'Karma' }
  };
  // The bridge of the last cove leads to the lighthouse itself.
  const destination = k => k < coves.length - 1 ? { to: coves[k + 1], toDative: coves[k + 1] + "'na" } :
    { to: 'Deniz Feneri', toDative: "Deniz Feneri'ne" };
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
    if (id === 'kopru') {
      elifBridgeGame.open({
        letters: glyphs.map((_, i) => i).filter(i => Math.floor(i / 4) <= k),
        recent: coveLetters(k), from: coves[k], ...destination(k),
        best: () => progress.kopru, onResult: result, next, onClose
      });
      return;
    }
    const upTo = i => Math.floor((id === 'balon' ? Math.floor(i / 3) : i) / 4) <= k;
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
      kind === 'intro' ? introRound() : section === 'harf' ? harfRound(cove) : harekeRound(cove), right: 0, missed: new Set() };
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
    const play = () => letterQuestion ? voice.letter(q.target, response) : voice.syllable(q.target, q.h, response);
    const speaker = () => {
      const button = el('button', 'elif-speaker', '<span aria-hidden="true">🔊</span><small>Tekrar dinle</small>');
      button.setAttribute('aria-label', 'Sesi tekrar dinle');
      button.onclick = play;
      return button;
    };
    const grid = el('div', 'elif-choices');
    grid.id = 'elif-choices';
    let rightButton = null;
    const answer = letterQuestion ? names[q.target] : syllableName(q.target, q.h);

    if (q.type === 'listen') {
      prompt.textContent = 'Dinle ve harfi bul';
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(glyphs[i]), n, i === q.target, () => names[i] + ' değil.')));
      stage.append(prompt, speaker(), grid);
      play();
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
      play();
    } else if (q.type === 'hece-ses') {
      // From the letter to the sound: the harekeli letter is shown, its sound is to be found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(syllable(q.target, q.h))));
      soundChoices(q.choices.map(([i, h]) => [() => voice.syllable(i, h, response), i === q.target && h === q.h]), stage, response,
        'Bu ses başka bir hecenin.');
    }
    stage.append(response, next);
    prompt.focus();

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
      next.textContent = '↻ Tekrar dene';
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
      else message += ' Bu ' + syllableName(q.target, q.h) + '.';
      response.textContent = message;
      if (round.kind === 'intro') voice.chant(q.target, q.h);
      else if (q.type === 'hece-ses' || q.type === 'sound') play();
      next.hidden = false;
      next.textContent = turn === total - 1 ? 'Sonucu gör' : 'Sıradaki';
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
      host.append(el('p', 'elif-hint', 'Seslere dokun, dinle, doğru olanı seç.'), row, choose);
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
        '<button class="elif-action" id="elif-continue">Tekrar dene</button>';
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
      const prizes = earned.map(i => '<span class="elif-won" lang="ar">' + glyphs[i] + '</span>').join('');
      if (!done) {
        stage.innerHTML = retry + '<p>' + misses + ' Koyu geçmek için bütün soruları ilk denemede bilmelisin. Harfleri bir kez daha dinle ve tekrar oyna.</p>' +
          '<button class="elif-action" id="elif-continue">Tekrar oyna</button>';
        playCue('retry');
      } else {
        const heading = before ? (perfect ? 'Hepsi doğru!' : 'Güzel çalıştın!') : !step ? 'Bütün harfleri harekeleriyle okudun!' :
          part === 'harf' ? coves[round.cove] + ' harflerini öğrendin!' : coves[round.cove] + ' harekeleri tamam!';
        let text = perfect ? 'Bütün soruları ilk denemede bildin.' : misses;
        if (before) { /* a replay: nothing to announce */ }
        else if (!step) text += ' Sıradaki bölümler yakında geliyor.';
        else if (step.game) text += ' Şimdi oyun zamanı: ' + games[step.game].name + '!';
        else if (step.intro) text += ' Şimdi harekelerle tanışalım.';
        else if (step.part === 'hareke') text += ' Şimdi bu harfleri harekeleriyle okuyalım.';
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
        '<button class="elif-action" id="elif-next">' + (slide < 2 ? 'Sonraki hareke' : 'Şimdi sen bul') + '</button>';
      $('elif-prompt').focus();
      const note = $('elif-response');
      $('elif-demo').onclick = () => voice.chant(1, slide, note);
      for (const button of $('elif-stage').querySelectorAll('.elif-examples button')) {
        button.onclick = () => voice.syllable(Number(button.dataset.i), slide, note);
      }
      voice.chant(1, slide, note);
      $('elif-next').onclick = () => { voice.stop(); if (slide < 2) { slide++; show(); } else ask(); };
    };
    show();
  }

  /* ---------- Entry and leaving ---------- */
  $('elif-card').onclick = () => {
    if (!availableForPlayer($('elif-card'))) return;
    progress = load(activeProfile.id);
    mapCove = null;
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
