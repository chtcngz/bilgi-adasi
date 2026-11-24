// Elif Ba Adası: an island in sections. Section 1 teaches the letters, section 2 the harekes,
// the later sections (cezm, tenvin, şedde, ...) are announced and open in coming releases.
(() => {
  const { glyphs, names, readings, harekeler, coves, sections, sameSound, syllable, coveLetters, mastery } = elifData;
  const voice = elifVoice;
  const dialog = $('elif-game');
  const records = new Map();
  let progress, section = null, cove = 0;
  let round, turn, earned;

  /* ---------- Progress ---------- */
  const storeKey = id => 'elif-ba-v2-' + id;
  function blank() { return { harf: Array(28).fill(0), hareke: Array(28).fill(0), tanisma: false }; }
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
  // The two sections take turns, cove by cove: a cove's letters, then the same letters with
  // harekes, and only then the next cove's new letters. A finished cove always stays open.
  const coveOpen = (part, k) => coveDone(part, k) || (part === 'harf'
    ? k === 0 || (coveDone('harf', k - 1) && coveDone('hareke', k - 1))
    : progress.tanisma && coveDone('harf', k) && (k === 0 || coveDone('hareke', k - 1)));
  const sectionOpen = id => id === 'harf' || (id === 'hareke' && coveDone('harf', 0));
  function lockReason(part, k) {
    if (part === 'harf') return coveDone('harf', k - 1) ? 'Önce ' + coves[k - 1] + ' harflerinin harekelerini öğren, sonra yeni harflere geç.' :
      'Önce ' + coves[k - 1] + ' harflerini öğren.';
    if (!coveDone('harf', k)) return 'Önce Harfler bölümünde ' + coves[k] + ' harflerini öğren.';
    if (!progress.tanisma) return 'Önce harekelerle tanış.';
    return 'Önce ' + coves[k - 1] + ' harekelerini bitir.';
  }
  // The next thing to learn, in the order above.
  function nextStep() {
    for (let k = 0; k < coves.length; k++) {
      if (!coveDone('harf', k)) return { part: 'harf', cove: k };
      if (!progress.tanisma) return { part: 'hareke', cove: k, intro: true };
      if (!coveDone('hareke', k)) return { part: 'hareke', cove: k };
    }
    return null;
  }
  const stepLabel = step => step.intro ? 'Harekelerle tanış' :
    coves[step.cove] + ' · ' + (step.part === 'harf' ? 'harfler' : 'harekeler');
  function goTo(step) {
    if (step.intro) { openSection('hareke', step.cove); startIntro(); return; }
    openSection(step.part, step.cove);
  }

  window.elifBaSummary = id => {
    const record = load(id);
    return { harf: masteredCount('harf', record), hareke: masteredCount('hareke', record), any:
      record.harf.some(Boolean) || record.hareke.some(Boolean) || record.tanisma };
  };
  window.resetElifBa = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); localStorage.removeItem('elif-ba-' + id); } catch {}
    if (activeProfile?.id === id && !$('elif-view').hidden) { progress = records.get(id); showHub(); }
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
    $('elif-sections').replaceChildren(...sections.map((info, n) => {
      const item = el('li');
      const open = !info.soon && sectionOpen(info.id);
      const button = el('button', 'elif-section-card' + (info.soon ? ' soon' : open ? '' : ' locked'));
      button.style.setProperty('--i', n);
      let status;
      if (info.soon) status = '<span class="elif-badge">Yakında</span>';
      else if (!open) status = '<span class="elif-badge">🔒 ' + coves[0] + ' harfleri öğrenilince açılır</span>';
      else {
        const done = masteredCount(info.id);
        status = '<span class="elif-meter" aria-hidden="true"><i style="width:' + done / 28 * 100 + '%"></i></span>' +
          '<span class="elif-badge">' + info.prize + ' ' + done + ' / 28 ' + info.prizeName + '</span>';
      }
      button.innerHTML = '<span class="elif-section-no" aria-hidden="true">' + (n + 1) + '</span><span class="elif-section-text">' +
        '<small>' + (n + 1) + '. bölüm</small><strong>' + info.title + '</strong><span>' + info.lead + '</span>' + status + '</span>';
      if (info.soon || !open) {
        button.dataset.cue = '';
        button.setAttribute('aria-disabled', 'true');
        button.onclick = () => {
          playCue('oops');
          fx.bump(button, 'denied');
          $('elif-hub-note').textContent = info.soon ? info.title + ' bölümü yakında açılacak.' :
            'Harekeler, ' + coves[0] + ' harflerini sesinden tanıyınca açılır.';
        };
      } else button.onclick = () => openSection(info.id);
      item.append(button);
      return item;
    }));
    const step = nextStep();
    $('elif-next-step').hidden = !step;
    if (step) {
      $('elif-next-step').innerHTML = '<span aria-hidden="true">▶</span> <span><small>Sıradaki</small>' + stepLabel(step) + '</span>';
      $('elif-next-step').onclick = () => goTo(step);
    }
    $('elif-hub-note').textContent = '';
    setTitle('Elif Ba Adası');
  }

  /* ---------- A section: coves and letter cards ---------- */
  function openSection(id, at) {
    section = id;
    const info = sections.find(s => s.id === id);
    $('elif-hub').hidden = true;
    $('elif-section').hidden = false;
    $('elif-section-title').textContent = info.title;
    if (at !== undefined) cove = at;
    else {
      // the first cove still to do here, or else the last one that is open
      const todo = coves.findIndex((_, k) => !coveDone(id, k) && coveOpen(id, k));
      const opened = coves.map((_, k) => k).filter(k => coveOpen(id, k));
      cove = todo >= 0 ? todo : opened.length ? opened[opened.length - 1] : 0;
    }
    drawSection();
    setTitle(info.title + ' · Elif Ba Adası');
    $('elif-section-title').focus();
  }
  function drawSection() {
    const part = section;
    const info = sections.find(s => s.id === part);
    $('elif-section-count').textContent = info.prize + ' ' + masteredCount(part) + ' / 28';
    drawShells();
    const needIntro = part === 'hareke' && !progress.tanisma;
    $('elif-intro').hidden = part !== 'hareke';
    if (part === 'hareke') drawIntro();
    $('elif-coves').replaceChildren(...coves.map((name, k) => {
      const open = coveOpen(part, k);
      const done = coveDone(part, k);
      const chip = el('button', 'elif-cove' + (k === cove ? ' current' : '') + (done ? ' done' : '') + (open ? '' : ' locked'));
      chip.innerHTML = '<span class="elif-cove-glyphs" lang="ar" dir="rtl">' + coveLetters(k).map(i => glyphs[i]).join(' ') +
        '</span><small>' + (done ? info.prize + ' ' : open ? '' : '🔒 ') + name + '</small>';
      chip.setAttribute('aria-pressed', String(k === cove));
      chip.setAttribute('aria-label', name + (done ? ', tamamlandı' : open ? '' : ', kilitli'));
      if (!open) chip.dataset.cue = '';
      chip.onclick = () => {
        if (!open) {
          playCue('oops');
          fx.bump(chip, 'denied');
          $('elif-note').textContent = '🔒 ' + lockReason(part, k);
          return;
        }
        voice.stop();
        cove = k;
        drawSection();
      };
      return chip;
    }));
    const letters = coveLetters(cove);
    voice.preload(letters);
    $('elif-guide').textContent = part === 'harf' ? 'Bir harfe dokun, adını dinle. Sonra oyunda sesinden bul.' :
      'Bir heceye dokun, okunuşunu dinle. ♪ düğmesi üç harekeyi sırayla okur.';
    $('elif-cards').className = 'elif-cards ' + (part === 'harf' ? 'letters' : 'syllables');
    $('elif-cards').replaceChildren(...letters.map(i => part === 'harf' ? letterCard(i) : syllableCard(i)));
    const open = coveOpen(part, cove);
    $('elif-play').disabled = !open;
    $('elif-play').textContent = !open ? '🔒 ' + (needIntro ? 'Önce harekelerle tanış' : 'Kilitli') :
      coveDone(part, cove) ? '↻ Yeniden oyna' : '▶ Oyna';
    $('elif-note').textContent = open ? '' : '🔒 ' + lockReason(part, cove);
    // When the next step is in the other section, offer the way there.
    const step = nextStep();
    const elsewhere = step && step.part !== part;
    $('elif-switch').hidden = !elsewhere;
    if (elsewhere) {
      $('elif-switch').textContent = 'Sıradaki: ' + stepLabel(step) + ' ›';
      $('elif-switch').onclick = () => goTo(step);
    }
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
    chant.onclick = () => { $('elif-note').textContent = readings[i].join(' · '); voice.chant(i, undefined, $('elif-note')); };
    head.append(chant);
    const row = el('div', 'elif-syllable-row');
    for (const h of [0, 1, 2]) {
      const button = el('button', 'elif-syllable', glyphHtml(syllable(i, h)) + '<span>' + readings[i][h] + '</span>');
      button.setAttribute('aria-label', names[i] + ' ' + harekeler[h].name + ': ' + readings[i][h]);
      button.onclick = () => {
        for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
        button.classList.add('selected');
        $('elif-note').textContent = names[i] + ' ' + harekeler[h].name.toLocaleLowerCase('tr') + ' ' + readings[i][h];
        voice.syllable(i, h, $('elif-note'));
      };
      row.append(button);
    }
    card.append(head, row);
    return card;
  }
  function drawIntro() {
    const done = progress.tanisma;
    $('elif-intro').innerHTML = '<div class="elif-intro-marks" aria-hidden="true">' +
      harekeler.map((_, h) => '<b lang="ar">' + syllable(1, h) + '</b>').join('') + '</div><div><strong>' +
      (done ? '✓ Harekelerle tanıştın' : 'Harekelerle tanış') + '</strong><span>Üstün, esre ve ötre harfe nasıl ses verir?</span></div>';
    const button = el('button', 'elif-action' + (done ? ' quiet' : ''), done ? 'Tekrar izle' : '▶ Başla');
    button.onclick = startIntro;
    $('elif-intro').append(button);
  }

  /* ---------- Rounds ---------- */
  function choicesFor(target, count, pool) {
    return shuffled([target, ...shuffled(pool.filter(i => i !== target)).slice(0, count - 1)]);
  }
  // Earlier coves supply one review letter, so the child keeps telling new letters from old ones.
  function letterPool(k) {
    const own = coveLetters(k);
    if (k === 0) return own;
    return [...own, pick(Array.from({ length: k * 4 }, (_, i) => i))];
  }
  function harfRound(k) {
    const own = coveLetters(k);
    const pool = letterPool(k);
    const questions = [];
    for (const target of shuffled(own)) questions.push({ type: 'listen', target, choices: choicesFor(target, 4, pool) });
    for (const target of shuffled(own)) questions.push({ type: 'sound', target, choices: choicesFor(target, 3, own) });
    return spread(questions);
  }
  function harekeRound(k) {
    const own = coveLetters(k);
    const later = shuffled(own);
    const questions = [];
    for (const target of shuffled(own)) {
      questions.push({ type: 'hareke-listen', target, h: pick([0, 1, 2]), choices: shuffled([0, 1, 2]) });
    }
    for (const target of later.slice(0, 2)) {
      const h = pick([0, 1, 2]);
      const pool = letterPool(k).flatMap(i => [0, 1, 2].map(x => [i, x]))
        .filter(([i, x]) => !(i === target && x === h) && !sameSound(i, x, target, h));
      const others = [];
      for (const [i, x] of shuffled(pool)) {
        if (others.length === 3) break;
        if (others.some(([j, y]) => sameSound(i, x, j, y))) continue;
        others.push([i, x]);
      }
      questions.push({ type: 'syllable-listen', target, h, choices: shuffled([[target, h], ...others]) });
    }
    for (const target of later.slice(2)) questions.push({ type: 'hareke-name', target, h: pick([0, 1, 2]) });
    return spread(questions);
  }
  function introRound() {
    // Only letters the child already knows, two questions for each hareke.
    const known = Array.from({ length: 28 }, (_, i) => i).filter(i => mastered('harf', i));
    const letters = shuffled(known.length ? known : coveLetters(0));
    return spread([0, 1, 2, 0, 1, 2].map((h, n) => ({ type: 'hareke-name', target: letters[n % letters.length], h })));
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
    round = { kind, part: kind === 'intro' ? 'hareke' : section, cove, questions:
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
    const play = () => q.type === 'listen' || q.type === 'sound' ? voice.letter(q.target, response) : voice.syllable(q.target, q.h, response);
    const speaker = () => {
      const button = el('button', 'elif-speaker', '<span aria-hidden="true">🔊</span><small>Tekrar dinle</small>');
      button.setAttribute('aria-label', 'Sesi tekrar dinle');
      button.onclick = play;
      return button;
    };
    const grid = el('div', 'elif-choices');
    grid.id = 'elif-choices';
    let rightButton = null;
    const answer = q.type === 'hareke-name' ? harekeler[q.h].name + ' (' + harekeler[q.h].place.toLocaleLowerCase('tr') + ')' : q.type === 'listen' || q.type === 'sound' ?
      names[q.target] : readings[q.target][q.h];

    if (q.type === 'listen') {
      prompt.textContent = 'Dinle ve harfi bul';
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(glyphs[i]), n, i === q.target, () => names[i] + ' değil.')));
      stage.append(prompt, speaker(), grid);
      play();
    } else if (q.type === 'sound') {
      prompt.textContent = 'Bu harfin adı hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(glyphs[q.target])));
      soundChoices(q.choices.map(i => [() => voice.letter(i, response), i === q.target]), stage, response);
    } else if (q.type === 'hareke-listen') {
      prompt.textContent = 'Dinle, doğru harekeyi bul';
      grid.classList.add('three');
      q.choices.forEach((h, n) => grid.append(choice(glyphHtml(syllable(q.target, h)), n, h === q.h,
        () => 'Bu ' + harekeler[h].name.toLocaleLowerCase('tr') + ': ' + readings[q.target][h] + ' okunur.')));
      stage.append(prompt, speaker(), grid);
      play();
    } else if (q.type === 'syllable-listen') {
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add('four');
      q.choices.forEach(([i, h], n) => grid.append(choice(glyphHtml(syllable(i, h)), n, i === q.target && h === q.h,
        () => 'Bu ' + readings[i][h] + ' okunur.')));
      stage.append(prompt, speaker(), grid);
      play();
    } else if (q.type === 'hareke-name') {
      prompt.textContent = 'Bu harekenin adı ne?';
      const big = el('button', 'elif-big', glyphHtml(syllable(q.target, q.h)));
      big.setAttribute('aria-label', 'Heceyi dinle');
      big.onclick = play;
      grid.classList.add('three', 'names');
      harekeler.forEach((info, h) => grid.append(choice('<i lang="ar" aria-hidden="true">◌' + info.mark + '</i><span>' + info.name +
        '</span>', h, h === q.h, () => 'Bu ' + info.name.toLocaleLowerCase('tr') + ' değil.', info.name)));
      stage.append(prompt, big, grid);
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
        if (q.type === 'hareke-name') voice.chant(q.target, q.h); else play();
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
      if (round.kind === 'intro') message += ' Bu ' + harekeler[q.h].name.toLocaleLowerCase('tr') + ': ' + readings[q.target][q.h] + '.';
      else if (round.part === 'harf') message += ' Bu ' + names[q.target] + '.';
      else message += ' ' + readings[q.target][q.h] + ' okunur.';
      response.textContent = message;
      if (q.type === 'hareke-name' || q.type === 'sound') round.kind === 'intro' ? voice.chant(q.target, q.h) : play();
      next.hidden = false;
      next.textContent = turn === total - 1 ? 'Sonucu gör' : 'Sıradaki';
      next.focus();
      next.onclick = () => { voice.stop(); turn++; turn === total ? finish() : ask(); };
    }
    // Sound options: tap to listen, then confirm the one that matches the letter.
    function soundChoices(options, host, note) {
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
        wrong(selected.button, 'Bu ses başka bir harfin.');
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
        '<p>Üstün <b lang="ar">◌َ</b> e/a, esre <b lang="ar">◌ِ</b> i/ı, ötre <b lang="ar">◌ُ</b> u okutur. Şimdi öğrendiğin harfleri ' +
        'harekeleriyle okuyalım.</p>' + (storageNote ? '<p>' + storageNote + '</p>' : '') +
        '<button class="elif-action" id="elif-continue">Harekelere başla</button>' :
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
        if (!step) text += ' Sıradaki bölümler yakında geliyor.';
        else if (step.intro) text += ' Yeni harflere geçmeden önce bu harfleri harekeleriyle okumayı öğrenelim.';
        else if (step.part === 'hareke') text += ' Yeni harflere geçmeden önce bu harflerin harekelerini öğrenelim.';
        else text += ' Sırada yeni harfler var: ' + coves[step.cove] + '.';
        stage.innerHTML = '<div class="elif-prize" aria-hidden="true">' + prizeOf(part) + '</div><h2 id="elif-prompt" tabindex="-1">' +
          heading + '</h2>' + (prizes ? '<div class="elif-won-row">' + prizes + '</div>' : '') + '<p>' + text + '</p>' +
          (storageNote ? '<p>' + storageNote + '</p>' : '') + '<button class="elif-action" id="elif-continue"></button>';
        $('elif-continue').textContent = !step ? 'Koya dön' : step.intro ? 'Harekelerle tanış' :
          step.part === 'hareke' ? 'Harekelerine geç' : 'Yeni harflere geç';
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
      const step = nextStep();
      dialog.close();
      if (step && (round.kind === 'intro' || step.part !== round.part || step.cove !== round.cove)) goTo(step);
      else drawSection();
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
        glyphHtml(syllable(1, slide)) + '</button><p class="elif-lesson"><b>' + info.place + '.</b> Harfe <b>' + info.sound +
        '</b> sesi verir: ' + names[1] + ' ' + info.name.toLocaleLowerCase('tr') + ' <b>' + readings[1][slide] + '</b>.</p>' +
        '<div class="elif-examples">' + [1, 2, 3].map(i => '<button class="elif-syllable" data-i="' + i + '">' + glyphHtml(syllable(i, slide)) +
        '<span>' + readings[i][slide] + '</span></button>').join('') + '</div><p id="elif-response" role="status"></p>' +
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
    if (section && !$('elif-view').hidden) drawSection();
  });
})();
