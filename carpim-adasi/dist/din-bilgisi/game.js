// Din Bilgisi Adası: Proje İmam Hatip Ortaokulu 5. sınıf giriş sınavına hazırlık.
// Altı durakta çoktan seçmeli sorular (her turda 10 soru, 3 kalp, bir yarı yarıya jokeri),
// yanlış cevapların toplandığı bir Tekrar Kutusu ve gerçek sınav gibi 20 soruluk bir deneme.
(() => {
  const stops = dinSorular;
  const ROUND = 10, HEARTS = 3, EXAM = 20;
  const letters = ['A', 'B', 'C', 'D'];
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Maşallah!', 'Şahane!'];
  const dialog = $('din-game');
  const records = new Map();
  let progress = null, run = null;

  stops.forEach(stop => stop.sorular.forEach((q, n) => { q.id = stop.id + ':' + n; q.stop = stop; }));
  const byId = new Map(stops.flatMap(stop => stop.sorular.map(q => [q.id, q])));
  const maxStars = stops.length * 3;

  /* ---------- Progress ---------- */
  const storeKey = id => 'din-bilgisi-' + id;
  const blank = () => ({ yildiz: {}, deneme: { en: null, son: null, sayi: 0 }, soru: {} });
  function load(id) {
    if (records.has(id)) return records.get(id);
    const saved = readRecord(storeKey(id));
    const record = blank();
    if (saved && typeof saved === 'object') {
      for (const stop of stops) {
        const n = saved.yildiz?.[stop.id];
        if (Number.isInteger(n) && n > 0) record.yildiz[stop.id] = Math.min(3, n);
      }
      if (saved.deneme && typeof saved.deneme === 'object') Object.assign(record.deneme, saved.deneme);
      for (const [key, row] of Object.entries(saved.soru || {})) if (byId.has(key) && row) record.soru[key] = row;
    }
    records.set(id, record);
    return record;
  }
  let storageNote = '';
  function save() {
    try { localStorage.setItem(storeKey(activeProfile.id), JSON.stringify(progress)); storageNote = ''; }
    catch { storageNote = 'İlerlemen yalnızca bu oturumda saklanabildi.'; }
  }
  const starsOf = stop => progress.yildiz[stop.id] || 0;
  const starTotal = (record = progress) => stops.reduce((sum, stop) => sum + (record.yildiz[stop.id] || 0), 0);
  // The five textbook units are open from the start, so the child can practise the unit
  // the class is on. The exam and the extras open once every unit has at least one star.
  const units = stops.filter(stop => !stop.ekstra);
  const unitsLeft = () => units.filter(stop => !starsOf(stop)).length;
  const examOpen = () => unitsLeft() === 0;
  const stopOpen = k => !stops[k].ekstra || examOpen();
  const lockText = 'Beş ünite en az birer yıldızla bitince açılır';
  const missed = () => [...byId.values()].filter(q => progress.soru[q.id]?.h);
  function note(q, right) {
    const row = progress.soru[q.id] ??= { g: 0, d: 0, y: 0, h: 0 };
    row.g++;
    if (right) { row.d++; row.h = 0; } else { row.y++; row.h = 1; }
  }

  window.dinBilgisiSummary = id => {
    const record = load(id);
    return { yildiz: starTotal(record), toplam: maxStars, deneme: record.deneme.en,
      any: Object.keys(record.yildiz).length > 0 || Object.keys(record.soru).length > 0 || record.deneme.sayi > 0 };
  };
  window.resetDinBilgisi = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); } catch {}
    if (activeProfile?.id === id && !$('din-view').hidden) { progress = records.get(id); showHub(); }
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
  const escape = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // *word* is underlined and bold, like the negatives in the printed exam.
  const rich = text => escape(text).replace(/\*(.+?)\*/g, '<u><b>$1</b></u>');
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const starRow = (n, label = true) => '<span class="din-stars"' + (label ? ' aria-label="' + n + ' / 3 yıldız"' : ' aria-hidden="true"') + '>' +
    [0, 1, 2].map(i => '<i class="' + (i < n ? 'won' : '') + '">★</i>').join('') + '</span>';
  function minutes(ms) {
    const s = Math.round(ms / 1000);
    return (s >= 60 ? Math.floor(s / 60) + ' dk ' : '') + (s % 60) + ' sn';
  }
  // Questions the child missed come first, then the ones never seen, then the least seen.
  function pick(list, count) {
    const rank = q => { const row = progress.soru[q.id]; return !row ? 1 : row.h ? 0 : 2 + row.g; };
    return shuffled(shuffled(list).sort((x, y) => rank(x) - rank(y)).slice(0, count));
  }
  // Questions modelled on a Tevfik İleri entrance exam say which year's exam it was.
  const yearNote = q => q.y ? '<p class="din-year"><span aria-hidden="true">📝</span> Benzeri Tevfik İleri ' + q.y + ' sınavında soruldu.</p>' : '';
  const prepare = q => ({ q, order: shuffled([0, 1, 2, 3]), answer: null, gone: [] });

  /* ---------- Hub ---------- */
  function nextStep() {
    const fresh = stops.findIndex(stop => !stop.ekstra && !starsOf(stop));
    if (fresh >= 0) return { kind: 'durak', k: fresh, label: stops[fresh].simge + ' ' + stops[fresh].ad };
    if (!progress.deneme.sayi) return { kind: 'deneme', label: '🏆 Deneme Sınavı' };
    const extra = stops.findIndex(stop => stop.ekstra && !starsOf(stop));
    if (extra >= 0) return { kind: 'durak', k: extra, label: stops[extra].simge + ' ' + stops[extra].ad };
    if (missed().length) return { kind: 'tekrar', label: '🔁 Tekrar Kutusu' };
    const better = stops.findIndex(stop => starsOf(stop) < 3);
    if (better >= 0) return { kind: 'durak', k: better, label: stops[better].simge + ' ' + stops[better].ad + ' · 3 yıldız için' };
    return { kind: 'deneme', label: '🏆 Deneme Sınavı · rekorunu geliştir' };
  }
  function go(step) {
    if (step.kind === 'durak') startStop(step.k);
    else if (step.kind === 'deneme') startExam();
    else startReview();
  }
  function showHub() {
    $('din-score').textContent = '⭐ ' + starTotal() + ' / ' + maxStars;
    const cards = stops.map((stop, k) => {
      const open = stopOpen(k);
      const stars = starsOf(stop);
      const item = el('li');
      const button = el('button', 'din-stop tone-' + k % 4 + (open ? '' : ' locked') + (stars ? ' done' : ''));
      button.style.setProperty('--i', k);
      button.innerHTML = '<span class="din-stop-icon" aria-hidden="true">' + (open ? stop.simge : '🔒') + '</span>' +
        '<span class="din-stop-text"><small>' + stop.unite + (stop.kitap ? ' <i>📘 Ders kitabı ' + stop.kitap + '</i>' : '') +
        '</small><strong>' + stop.ad + '</strong><span>' + stop.konu + '</span>' +
        (open ? starRow(stars) : '<em>' + lockText + '</em>') + '</span>';
      button.setAttribute('aria-label', stop.unite + ', ' + stop.ad + ': ' + stop.konu + (open ? ', ' + stars + ' yıldız' : ', kilitli'));
      if (!open) {
        button.dataset.cue = '';
        button.onclick = () => {
          playCue('oops');
          fx.bump(button, 'denied');
          $('din-note').textContent = '🔒 ' + stop.ad + ' için önce ' + unitsLeft() + ' ünite daha bitirmelisin.';
        };
      } else button.onclick = () => startStop(k);
      item.append(button);
      return item;
    });
    const exam = el('li', 'din-exam-item');
    const examButton = el('button', 'din-stop din-exam' + (examOpen() ? '' : ' locked'));
    examButton.style.setProperty('--i', stops.length);
    const best = progress.deneme.en;
    examButton.innerHTML = '<span class="din-stop-icon" aria-hidden="true">' + (examOpen() ? '🏆' : '🔒') + '</span>' +
      '<span class="din-stop-text"><small>Hazine Zirvesi</small><strong>Deneme Sınavı</strong><span>Gerçek sınav gibi ' + EXAM +
      ' soru, bütün konulardan karışık</span>' + (!examOpen() ? '<em>' + lockText + '</em>' :
        best === null ? '<b class="din-badge">Henüz girmedin</b>' : '<b class="din-badge">En iyi: ' + best + ' / ' + EXAM + '</b>') + '</span>';
    if (!examOpen()) {
      examButton.dataset.cue = '';
      examButton.onclick = () => {
        playCue('oops');
        fx.bump(examButton, 'denied');
        $('din-note').textContent = '🔒 Deneme sınavı için ' + unitsLeft() + ' ünite daha kaldı.';
      };
    } else examButton.onclick = startExam;
    exam.append(examButton);
    $('din-stops').replaceChildren(...cards, exam);

    const wrong = missed().length;
    $('din-review').hidden = !wrong;
    if (wrong) {
      $('din-review').innerHTML = '<span aria-hidden="true">🔁</span><div><strong>Tekrar Kutusu</strong><small>' + wrong +
        ' soruyu yanlış cevapladın. Doğrusunu bulunca kutudan çıkar.</small></div>';
      const button = el('button', 'din-action quiet', 'Tekrar et');
      button.onclick = startReview;
      $('din-review').append(button);
    }
    const step = nextStep();
    $('din-next').innerHTML = '<span aria-hidden="true">▶</span> <span><small>Sıradaki</small>' + step.label + '</span>';
    $('din-next').onclick = () => go(step);
    $('din-note').textContent = '';
    document.title = 'Din Bilgisi Adası · Bilgi Adası';
  }

  /* ---------- Rounds ---------- */
  function begin(kind, stop, questions) {
    run = { kind, stop, items: questions.map(prepare), turn: 0, right: 0, hearts: HEARTS, joker: kind === 'durak',
      streak: 0, bestStreak: 0, started: performance.now() };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = kind;
    playCue('start');
    ask();
  }
  function startStop(k) {
    if (!stopOpen(k)) return;
    begin('durak', stops[k], pick(stops[k].sorular, ROUND));
  }
  function startReview() {
    const list = missed();
    if (list.length) begin('tekrar', null, shuffled(list).slice(0, ROUND));
  }
  function startExam() {
    if (!examOpen()) return;
    // As many questions from each stop as its `deneme` says, topped up from the units.
    const chosen = stops.flatMap(stop => pick(stop.sorular, stop.deneme || 0));
    const rest = shuffled(units.flatMap(stop => stop.sorular).filter(q => !chosen.includes(q)));
    begin('deneme', null, shuffled([...chosen, ...rest].slice(0, EXAM)));
  }

  const where = () => run.kind === 'deneme' ? '🏆 Deneme Sınavı' : run.kind === 'tekrar' ? '🔁 Tekrar Kutusu' : run.stop.simge + ' ' + run.stop.ad;
  function dots() {
    return '<ol class="dots din-dots" aria-hidden="true">' + run.items.map((item, n) =>
      '<li class="' + (n === run.turn && item.answer === null ? 'now' : item.answer === null ? '' :
        run.kind === 'deneme' ? 'done' : item.answer === 0 ? 'done' : 'miss') + '"></li>').join('') + '</ol>';
  }
  const heartsHtml = () => '<span class="din-hearts" aria-label="' + run.hearts + ' kalp kaldı">' +
    Array.from({ length: HEARTS }, (_, i) => '<i class="' + (i < run.hearts ? '' : 'lost') + '">' + (i < run.hearts ? '❤️' : '🤍') + '</i>').join('') + '</span>';
  const topBar = () => '<div class="din-top"><span class="din-where">' + where() + '</span>' + (run.kind === 'durak' ? heartsHtml() : '') + '</div>';

  function ask() {
    const item = run.items[run.turn];
    const q = item.q;
    const total = run.items.length;
    const stage = $('din-stage');
    dialog.dataset.mood = '';
    stage.innerHTML = topBar() + dots() + '<p class="din-step">Soru ' + (run.turn + 1) + ' / ' + total +
      (run.kind === 'deneme' ? '' : ' · <span>' + (run.kind === 'tekrar' ? q.stop.simge + ' ' + q.stop.ad : q.stop.konu) + '</span>') +
      (run.streak >= 3 ? '<span class="din-streak" title="Üst üste doğru">🔥 ' + run.streak + '</span>' : '') + '</p>' +
      (q.m ? '<div class="din-passage">' + rich(q.m) + '</div>' : '') +
      '<h2 id="din-prompt" tabindex="-1">' + rich(q.s) + '</h2>';
    const grid = el('div', 'din-options');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'din-prompt');
    item.order.forEach((choice, n) => {
      const button = el('button', 'din-option', '<b aria-hidden="true">' + letters[n] + '</b><span>' + rich(q.a[choice]) + '</span>');
      button.dataset.cue = '';
      button.dataset.choice = choice;
      button.setAttribute('aria-label', letters[n] + ') ' + q.a[choice].replace(/\*/g, ''));
      button.onclick = () => run.kind === 'deneme' ? mark(button) : answer(button);
      grid.append(button);
    });
    stage.append(grid);

    const tools = el('div', 'din-tools');
    if (run.kind === 'durak') {
      const joker = el('button', 'din-joker', '<span aria-hidden="true">½</span> Yarı yarıya');
      joker.id = 'din-joker';
      joker.disabled = !run.joker;
      joker.title = run.joker ? 'İki yanlış seçeneği sil (turda bir kez)' : 'Jokerini bu turda kullandın';
      joker.onclick = useJoker;
      tools.append(joker);
    }
    const feedback = el('div', 'din-feedback');
    feedback.id = 'din-feedback';
    feedback.setAttribute('role', 'status');
    const next = el('button', 'primary din-next-q');
    next.id = 'din-continue';
    next.hidden = run.kind !== 'deneme';
    if (run.kind === 'deneme') {
      next.disabled = true;
      next.textContent = run.turn === total - 1 ? '✓ Sınavı bitir' : 'İşaretle ve geç ›';
      next.onclick = confirmMark;
    }
    stage.append(tools, feedback, next);
    $('din-prompt').focus();
  }

  function useJoker() {
    if (!run.joker) return;
    const item = run.items[run.turn];
    if (item.answer !== null) return;
    run.joker = false;
    const wrong = shuffled([1, 2, 3]).slice(0, 2);
    item.gone = wrong;
    for (const button of $('din-stage').querySelectorAll('.din-option')) {
      if (wrong.includes(Number(button.dataset.choice))) { button.disabled = true; button.classList.add('gone'); }
    }
    $('din-joker').disabled = true;
    playCue('island');
    fx.burst($('din-joker'), { symbols: ['½', '✦', '★'], count: 8, spread: 60 });
  }

  // Practice rounds: the answer is checked at once and explained.
  function answer(button) {
    const item = run.items[run.turn];
    if (item.answer !== null) return;
    const q = item.q;
    const choice = Number(button.dataset.choice);
    const right = choice === 0;
    item.answer = choice;
    note(q, right);
    save();
    const buttons = $('din-stage').querySelectorAll('.din-option');
    for (const other of buttons) other.disabled = true;
    const correctButton = [...buttons].find(b => b.dataset.choice === '0');
    correctButton.classList.add('right');
    $('din-joker')?.setAttribute('disabled', '');
    const feedback = $('din-feedback');
    const letter = letters[item.order.indexOf(0)];
    if (right) {
      run.right++;
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      playCue('correct');
      fx.burst(button, { symbols: ['★', '✦', '🌙'] });
      dialog.dataset.mood = 'good';
      feedback.className = 'din-feedback good';
      feedback.innerHTML = '<strong>✓ Doğru! ' + praise[Math.floor(Math.random() * praise.length)] +
        (run.streak >= 3 ? ' <span class="din-fire">🔥 ' + run.streak + ' doğru üst üste!</span>' : '') + '</strong>';
    } else {
      run.streak = 0;
      if (run.kind === 'durak') run.hearts--;
      playCue('retry');
      button.classList.add('wrong');
      fx.bump(button, 'missed');
      dialog.dataset.mood = 'bad';
      feedback.className = 'din-feedback bad';
      feedback.innerHTML = '<strong>✗ Doğru cevap: ' + letter + ') ' + rich(q.a[0]) + '</strong>';
      const hearts = $('din-stage').querySelector('.din-hearts');
      if (hearts) {
        hearts.outerHTML = heartsHtml();
        fx.bump($('din-stage').querySelector('.din-hearts'), 'denied');
      }
    }
    feedback.insertAdjacentHTML('beforeend', '<p><span aria-hidden="true">💡</span> <b>Biliyor muydun?</b> ' + rich(q.b) + '</p>' + yearNote(q));
    $('din-stage').querySelector('.din-dots').outerHTML = dots();
    const next = $('din-continue');
    const over = run.kind === 'durak' && run.hearts === 0;
    const last = run.turn === run.items.length - 1;
    next.hidden = false;
    next.textContent = over ? 'Sonucu gör' : last ? 'Sonucu gör' : 'Sıradaki soru ›';
    next.onclick = () => { if (over || last) finish(); else { run.turn++; ask(); } };
    next.focus({ preventScroll: true });
    feedback.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // The exam: choose, change your mind if you like, then confirm. Results come at the end.
  function mark(button) {
    for (const other of $('din-stage').querySelectorAll('.din-option')) {
      other.classList.toggle('picked', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    }
    $('din-continue').disabled = false;
    playCue('key');
  }
  function confirmMark() {
    const picked = $('din-stage').querySelector('.din-option.picked');
    if (!picked) return;
    const item = run.items[run.turn];
    item.answer = Number(picked.dataset.choice);
    if (item.answer === 0) run.right++;
    note(item.q, item.answer === 0);
    save();
    playCue('tap');
    run.turn++;
    if (run.turn === run.items.length) finish(); else ask();
  }

  /* ---------- Results ---------- */
  function result(html, mood) {
    dialog.dataset.mood = mood;
    $('din-stage').innerHTML = html;
    $('din-result-title')?.focus();
  }
  function buttons(...list) {
    const row = el('div', 'din-result-actions');
    for (const [label, action, quiet] of list) {
      const button = el('button', quiet ? 'din-action quiet' : 'primary', label);
      button.onclick = action;
      row.append(button);
    }
    $('din-stage').append(row);
    row.querySelector('button').focus({ preventScroll: true });
  }
  function finish() {
    if (run.kind === 'deneme') return finishExam();
    const total = run.items.length;
    const storage = storageNote ? '<p class="din-small">' + storageNote + '</p>' : '';
    if (run.kind === 'tekrar') {
      const left = missed().length;
      result('<div class="din-prize" aria-hidden="true">' + (run.right === total ? '🌟' : '🔁') + '</div>' +
        '<h2 id="din-result-title" tabindex="-1">' + (run.right === total ? 'Hepsini düzelttin!' : 'Güzel tekrar!') + '</h2>' +
        '<p class="din-score-big"><b>' + run.right + '</b> / ' + total + ' doğru</p><p>' +
        (left ? 'Tekrar Kutusu’nda ' + left + ' soru kaldı.' : 'Tekrar Kutusu boşaldı. 🎉') + '</p>' + storage, 'win');
      playCue(run.right === total ? 'island' : 'correct');
      if (run.right === total) fx.confetti(dialog, { count: 120 });
      buttons(...(left ? [['🔁 Bir tur daha', startReview]] : []), ['Adaya dön', closeGame, left > 0]);
      return;
    }
    const stop = run.stop;
    const k = stops.indexOf(stop);
    if (run.hearts === 0) {
      result(topBar() + '<div class="din-prize" aria-hidden="true">💔</div><h2 id="din-result-title" tabindex="-1">Kalplerin bitti!</h2>' +
        '<p>' + (run.turn + 1) + ' sorudan ' + run.right + ' tanesini bildin. Yanlış yaptığın sorular Tekrar Kutusu’na eklendi; ' +
        '“Biliyor muydun?” notlarını hatırlayarak yeniden dene.</p>' + storage, 'bad');
      playCue('oops');
      buttons(['↻ Tekrar dene', () => startStop(k)], ['Adaya dön', closeGame, true]);
      return;
    }
    const stars = run.right === total ? 3 : run.right === total - 1 ? 2 : 1;
    const before = starsOf(stop);
    const firstTime = before === 0;
    if (stars > before) progress.yildiz[stop.id] = stars;
    save();
    const all = starTotal() === maxStars;
    const examNow = firstTime && !stop.ekstra && examOpen();
    const left = unitsLeft();
    let text = run.right + ' / ' + total + ' doğru';
    if (run.bestStreak >= 3) text += ' · en uzun seri 🔥 ' + run.bestStreak;
    let extra = stars < 3 ? '<p>3 yıldız için turu hatasız bitir. Jokerini akıllıca kullan!</p>' : '';
    if (firstTime && !stop.ekstra && left) extra += '<p class="din-unlock">Deneme Sınavı’na ' + left + ' ünite kaldı.</p>';
    if (examNow) extra += '<p class="din-unlock">🔓 <b>Deneme Sınavı</b> ve <b>💎 Hazine Mağarası</b> açıldı! Gerçek sınav gibi 20 soru seni bekliyor.</p>';
    if (all) extra += '<p class="din-unlock">🏅 Bütün duraklarda 3 yıldız topladın!</p>';
    result('<div class="din-prize" aria-hidden="true">' + stop.simge + '</div>' +
      '<h2 id="din-result-title" tabindex="-1">' + (stars > before && !firstTime ? 'Yeni rekor!' : stars === 3 ? 'Mükemmel!' : 'Durak tamamlandı!') + '</h2>' +
      '<div class="din-won">' + starRow(stars) + '</div><p class="din-score-big">' + text + '</p>' + extra + storage, 'win');
    playCue(all ? 'victory' : 'island');
    fx.confetti(dialog, { count: stars === 3 ? 180 : 110 });
    fx.burst($('din-stage').querySelector('.din-won'), { count: 12, spread: 100 });
    const step = nextStep();
    buttons(...(step.kind !== 'durak' || step.k !== k ? [['Sıradaki: ' + step.label + ' ›', () => go(step)]] : []),
      ['↻ Tekrar oyna', () => startStop(k), true], ['Adaya dön', closeGame, true]);
  }

  function finishExam() {
    const total = run.items.length;
    const score = run.right;
    const elapsed = performance.now() - run.started;
    const before = progress.deneme.en;
    progress.deneme.son = score;
    progress.deneme.sayi++;
    if (before === null || score > before) progress.deneme.en = score;
    save();
    const emoji = score >= 18 ? '🏆' : score >= 15 ? '🥈' : score >= 10 ? '📚' : '🌱';
    const title = score >= 18 ? 'Sınava hazırsın!' : score >= 15 ? 'Çok iyi gidiyorsun!' : score >= 10 ? 'Güzel bir başlangıç!' : 'Biraz daha çalışalım!';
    const byStop = stops.map(stop => {
      const mine = run.items.filter(item => item.q.stop === stop);
      const good = mine.filter(item => item.answer === 0).length;
      return '<li><span>' + stop.simge + ' ' + stop.konu + '</span><span class="din-bar" aria-hidden="true"><i style="width:' +
        (mine.length ? good / mine.length * 100 : 0) + '%"></i></span><b>' + good + ' / ' + mine.length + '</b></li>';
    }).join('');
    const wrongs = run.items.filter(item => item.answer !== 0).map(item => {
      const q = item.q;
      const yours = letters[item.order.indexOf(item.answer)];
      const right = letters[item.order.indexOf(0)];
      return '<details class="din-review-item"><summary>' + rich(q.s) + '</summary>' + (q.m ? '<div class="din-passage">' + rich(q.m) + '</div>' : '') +
        '<p class="din-yours">Senin cevabın: ' + yours + ') ' + rich(q.a[item.answer]) + '</p><p class="din-right">Doğru cevap: ' + right + ') ' +
        rich(q.a[0]) + '</p><p><span aria-hidden="true">💡</span> ' + rich(q.b) + '</p>' + yearNote(q) + '</details>';
    }).join('');
    result('<div class="din-prize" aria-hidden="true">' + emoji + '</div><h2 id="din-result-title" tabindex="-1">' + title + '</h2>' +
      '<p class="din-score-big"><b>' + score + '</b> / ' + total + ' doğru</p>' +
      '<ul class="facts din-facts"><li><b>' + Math.round(score / total * 100) + '</b><span>puan</span></li><li><b>' + minutes(elapsed) +
      '</b><span>süre</span></li><li><b>' + progress.deneme.en + '</b><span>en iyi</span></li></ul>' +
      (before !== null && score > before ? '<p class="din-unlock">🎉 Yeni rekor! Önceki en iyin ' + before + ' idi.</p>' : '') +
      '<h3 class="din-h3">Konulara göre</h3><ul class="din-by-stop">' + byStop + '</ul>' +
      (wrongs ? '<h3 class="din-h3">Yanlışlarını incele</h3><p class="din-small">Bu sorular Tekrar Kutusu’na eklendi.</p>' + wrongs : '') +
      (storageNote ? '<p class="din-small">' + storageNote + '</p>' : ''), score >= 15 ? 'win' : '');
    playCue(score >= 18 ? 'victory' : score >= 10 ? 'island' : 'correct');
    if (score >= 15) fx.confetti(dialog, { count: score >= 18 ? 220 : 140, duration: 4000 });
    buttons(['↻ Yeni deneme', startExam], ['Adaya dön', closeGame, true]);
  }

  function closeGame() { dialog.close(); }

  /* ---------- Keyboard: 1-4 or A-D answers, Enter goes on ---------- */
  document.addEventListener('keydown', e => {
    if (!dialog.open || !run || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('#din-close, details, summary')) return;
    const key = e.key.toLocaleUpperCase('tr');
    const n = ['1', '2', '3', '4'].indexOf(key) >= 0 ? Number(key) - 1 : letters.indexOf(key);
    if (n < 0) return;
    const button = $('din-stage').querySelectorAll('.din-option')[n];
    if (button && !button.disabled) { e.preventDefault(); button.click(); }
  });

  /* ---------- Entry and leaving ---------- */
  $('din-card').onclick = () => {
    if (!availableForPlayer($('din-card'))) return;
    progress = load(activeProfile.id);
    $('catalog').hidden = true;
    $('din-view').hidden = false;
    showHub();
    $('din-title').focus();
  };
  $('din-back').onclick = showCatalog;
  $('din-close').onclick = closeGame;
  dialog.addEventListener('close', () => {
    run = null;
    dialog.dataset.mood = '';
    for (const canvas of dialog.querySelectorAll('.fx-confetti')) canvas.remove();
    if (!$('din-view').hidden) showHub();
  });
})();
