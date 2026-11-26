// Soru adaları (Din Bilgisi, Fen Bilimleri, Sosyal Bilgiler): Keşif Haritası'nda birer koy. Koyun adaları ders
// kitabının üniteleri, ekstra konular ve deneme sınavıdır; bir ünite adasının durakları, ünitenin sorularının
// kitaptaki sırayla bölündüğü parçalardır. Duraklarda çoktan seçmeli sorular (her turda 10 soru, 3 kalp, bir yarı yarıya jokeri),
// yanlış cevapların toplandığı bir Tekrar Kutusu ve gerçek sınav gibi 20 soruluk bir deneme.
// Yıldızlar tek bir turu ölçer; bir ünite adasının bitmesi ise bütün sorularının öğrenilmesidir:
// bir soru iki ayrı turda doğru bilinince (ve son cevabı doğruysa) öğrenilmiş sayılır.
//
// Her ada kendi game.js dosyasında soruAdasi({...}) ile kurulur:
//   kod       sayfadaki kimliklerin öneki: din → #din-game, #din-card …
//             (görünüm core/css/quiz.css'teki ortak .soru-* sınıflarından gelir)
//   ad        "Din Bilgisi Adası" gibi: akvaryum ödüllerinin nedeninde görünür (değişmez, eski ödüller buna bakar)
//   koy, lead, simge, tema   Keşif Haritası'ndaki koyun adı, ne öğrenildiği, işareti ve görünüşü (core/js/harita.js)
//   kaynak    soruların nereden geldiğini anlatan not; koyun altında görünür
//   kayit     ilerlemenin localStorage anahtarı öneki ('din-bilgisi-' + oyuncu kimliği)
//   duraklar  soru bankası (bkz. islands/din-bilgisi/sorular.js)
//   ovgu      doğru cevaptan sonra rastgele seçilen sözler
//   simgeler  doğru cevapta saçılan simgeler
// Ayarlar penceresi ilerlemeyi window.soruAdalari[kod] üzerinden okur ve sıfırlar.
window.soruAdalari = {};
function soruAdasi({ kod, ad, koy, lead, simge, tema, kaynak, kayit, duraklar: stops, ovgu: praise, simgeler }) {
  const ROUND = 10, HEARTS = 3, EXAM = 20;
  const letters = ['A', 'B', 'C', 'D'];
  const byKey = name => $(kod + '-' + name);
  const dialog = byKey('game');
  const records = new Map();
  let progress = null, run = null;

  stops.forEach(stop => stop.sorular.forEach((q, n) => { q.id = stop.id + ':' + n; q.stop = stop; }));
  const byId = new Map(stops.flatMap(stop => stop.sorular.map(q => [q.id, q])));
  const maxStars = stops.length * 3;

  /* ---------- Progress ---------- */
  const storeKey = id => kayit + id;
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
  const examOpen = () => devAll() || unitsLeft() === 0;
  const stopOpen = k => !stops[k].ekstra || examOpen();
  const sayilar = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz', 'On'];
  const lockText = (sayilar[units.length] || units.length) + ' ünite en az birer yıldızla bitince açılır';
  const ekstra = stops.find(stop => stop.ekstra);
  const missed = () => [...byId.values()].filter(q => progress.soru[q.id]?.h);
  const LEARNED = 2;
  const learned = (q, record = progress) => { const row = record.soru[q.id]; return !!row && row.d >= LEARNED && !row.h; };
  const learnedIn = (stop, record = progress) => stop.sorular.filter(q => learned(q, record)).length;
  const learnedAll = (record = progress) => [...byId.values()].filter(q => learned(q, record)).length;
  const stopMastered = stop => learnedIn(stop) === stop.sorular.length;
  function note(q, right) {
    const row = progress.soru[q.id] ??= { g: 0, d: 0, y: 0, h: 0 };
    row.g++;
    if (right) { row.d++; row.h = 0; } else { row.y++; row.h = 1; }
  }

  const summary = id => {
    const record = load(id);
    return { ad, yildiz: starTotal(record), toplam: maxStars, deneme: record.deneme.en, denemeSayi: record.deneme.sayi,
      ogrenilen: learnedAll(record), soru: byId.size,
      duraklar: stops.map(stop => ({ id: stop.id, simge: stop.simge, ad: stop.ad, unite: stop.unite, yildiz: record.yildiz[stop.id] || 0,
        ogrenilen: learnedIn(stop, record), soru: stop.sorular.length,
        dogru: stop.sorular.reduce((sum, q) => sum + (Number(record.soru[q.id]?.d) || 0), 0) })),
      any: Object.keys(record.yildiz).length > 0 || Object.keys(record.soru).length > 0 || record.deneme.sayi > 0 };
  };
  const reset = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); } catch {}
    if (activeProfile?.id === id) { progress = records.get(id); kesifHaritasi.yenile(); }
  };
  window.soruAdalari[kod] = { summary, reset, kayit };

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
  const starRow = (n, label = true) => '<span class="soru-stars"' + (label ? ' aria-label="' + n + ' / 3 yıldız"' : ' aria-hidden="true"') + '>' +
    [0, 1, 2].map(i => '<i class="' + (i < n ? 'won' : '') + '">★</i>').join('') + '</span>';
  function minutes(ms) {
    const s = Math.round(ms / 1000);
    return (s >= 60 ? Math.floor(s / 60) + ' dk ' : '') + (s % 60) + ' sn';
  }
  // Questions the child missed come first, then the ones never seen, then the ones not yet
  // learned, and the learned ones last, least seen first.
  function pick(list, count) {
    const rank = q => { const row = progress.soru[q.id]; return !row ? 1 : row.h ? 0 : !learned(q) ? 2 : 3 + row.g / 1000; };
    return shuffled(shuffled(list).sort((x, y) => rank(x) - rank(y)).slice(0, count));
  }
  // Questions modelled on a Tevfik İleri entrance exam say which year's exam it was.
  const yearNote = q => q.y ? '<p class="soru-year"><span aria-hidden="true">📝</span> Benzeri Tevfik İleri ' + q.y + ' sınavında soruldu.</p>' : '';
  const prepare = q => ({ q, order: shuffled([0, 1, 2, 3]), answer: null, gone: [] });

  /* ---------- The bay on Keşif Haritası ---------- */
  // A unit's questions in the book's order, cut into three to six stations of about twenty.
  const partsOf = stop => {
    const n = stop.sorular.length, count = Math.max(3, Math.min(6, Math.round(n / 20)));
    return Array.from({ length: count }, (_, p) => stop.sorular.slice(Math.floor(p * n / count), Math.floor((p + 1) * n / count)));
  };
  const partLearned = part => part.filter(q => learned(q)).length;
  const firstPart = stop => Math.max(0, partsOf(stop).findIndex(part => partLearned(part) < part.length));
  function nextStep() {
    const at = k => ({ kind: 'durak', k, p: firstPart(stops[k]) });
    const fresh = stops.findIndex(stop => !stop.ekstra && !starsOf(stop));
    if (fresh >= 0) return { ...at(fresh), label: stops[fresh].simge + ' ' + stops[fresh].ad };
    if (!progress.deneme.sayi) return { kind: 'deneme', label: '🏆 Deneme Sınavı' };
    const extra = stops.findIndex(stop => stop.ekstra && !starsOf(stop));
    if (extra >= 0) return { ...at(extra), label: stops[extra].simge + ' ' + stops[extra].ad };
    if (missed().length) return { kind: 'tekrar', label: '🔁 Tekrar Kutusu' };
    // the open stop with the largest share of questions still to learn
    const todo = stops.map((stop, k) => ({ k, left: stop.sorular.length - learnedIn(stop), share: 1 - learnedIn(stop) / stop.sorular.length }))
      .filter(s => s.left > 0 && stopOpen(s.k)).sort((a, b) => b.share - a.share)[0];
    if (todo) return { ...at(todo.k), label: stops[todo.k].simge + ' ' + stops[todo.k].ad + ' · ' + todo.left + ' soru kaldı' };
    const better = stops.findIndex(stop => starsOf(stop) < 3);
    if (better >= 0) return { ...at(better), label: stops[better].simge + ' ' + stops[better].ad + ' · 3 yıldız için' };
    return { kind: 'deneme', label: '🏆 Deneme Sınavı · rekorunu geliştir' };
  }
  function go(step) {
    if (step.kind === 'durak') startStop(step.k, step.p);
    else if (step.kind === 'deneme') startExam();
    else startReview();
  }
  const EXAM_ISLE = stops.length; // the mock exam is the bay's last island
  const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  kesifHaritasi.koy({
    id: kod, kart: kod + '-card', ad: koy, lead, simge, tema,
    hazirla() { progress = load(activeProfile.id); },
    adalar() {
      const step = nextStep();
      return [...stops.map((stop, k) => ({ ad: stop.ad, simge: stop.simge, not: starText(starsOf(stop)) + ' ' + learnedIn(stop) + '/' + stop.sorular.length,
        durum: !stopOpen(k) ? 'locked' : stopMastered(stop) ? 'done' : step.kind === 'durak' && step.k === k ? 'now' : 'open' })),
      { ad: 'Deneme Sınavı', simge: '🏆', not: progress.deneme.en === null ? EXAM + ' soru' : 'En iyi ' + progress.deneme.en + '/' + EXAM,
        durum: !examOpen() ? 'locked' : step.kind === 'deneme' ? 'now' : progress.deneme.sayi ? 'done' : 'open' }];
    },
    duraklar(k) {
      if (k === EXAM_ISLE) return [{ simge: '🏆', ad: 'Deneme', etiket: 'Deneme Sınavı', not: progress.deneme.en === null ? EXAM + ' soru' : 'En iyi ' + progress.deneme.en + ' / ' + EXAM,
        durum: progress.deneme.sayi ? 'done' : 'now' }];
      const now = firstPart(stops[k]);
      return partsOf(stops[k]).map((part, p) => {
        const n = partLearned(part);
        return { simge: String(p + 1), ad: (p + 1) + '. durak', etiket: stops[k].ad + ', ' + (p + 1) + '. durak', not: n + ' / ' + part.length,
          durum: n === part.length ? 'done' : p === now ? 'now' : 'open' };
      });
    },
    ac: (k, p) => k === EXAM_ISLE ? startExam() : startStop(k, p),
    kilit: () => lockText,
    panel(level, k) {
      const { sonraki, kutu, dugme, olcer } = kesifHaritasi.parca;
      const parts = [];
      const wrong = missed().length;
      const review = () => {
        if (!wrong) return null;
        const box = kutu('<div class="kh-row"><span aria-hidden="true">🔁</span><div><strong>Tekrar Kutusu</strong><small>' + wrong +
          ' soruyu yanlış cevapladın. Doğrusunu bulunca kutudan çıkar.</small></div></div>');
        box.querySelector('.kh-row').append(dugme('Tekrar et', startReview));
        return box;
      };
      if (level === 'ada' && k === EXAM_ISLE) {
        parts.push(sonraki('🏆', 'Hazine Zirvesi', 'Deneme Sınavı’na gir', startExam));
        parts.push(kutu('<strong>Deneme Sınavı</strong><small>Gerçek sınav gibi ' + EXAM + ' soru, bütün konulardan karışık. Cevaplar sınavın sonunda görünür.</small>' +
          '<small>' + (progress.deneme.en === null ? 'Henüz girmedin.' : 'En iyi: ' + progress.deneme.en + ' / ' + EXAM + ' · ' + progress.deneme.sayi + ' deneme') + '</small>'));
        return parts;
      }
      if (level === 'ada') {
        const stop = stops[k], p = firstPart(stop), n = learnedIn(stop), all = stop.sorular.length;
        parts.push(sonraki('▶', stopMastered(stop) ? 'Yeniden oyna' : 'Sıradaki', stop.ad + ' · ' + (p + 1) + '. durak', () => startStop(k, p)));
        parts.push(kutu('<strong>' + stop.simge + ' ' + stop.ad + ' <span class="soru-stars" aria-label="' + starsOf(stop) + ' / 3 yıldız">' + starRow(starsOf(stop), false) + '</span></strong>' +
          '<small>' + stop.unite + ' · ' + stop.konu + (stop.kitap ? ' · 📘 Ders kitabı ' + stop.kitap : '') + '</small>' + olcer(n / all) +
          '<small>' + (n === all ? '✅ Bütün soruları öğrendin' : '📗 ' + n + ' / ' + all + ' soru öğrenildi') + '. Duraklar ünitenin sorularını kitaptaki sırayla böler; ' +
          'her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var.</small>'));
        const box = review();
        if (box) parts.push(box);
        return parts;
      }
      const step = nextStep(), total = learnedAll();
      parts.push(sonraki('▶', 'Sıradaki', step.label, () => go(step)));
      parts.push(kutu('<strong>' + (total === byId.size ? '🏅 Bütün ' + byId.size + ' soruyu öğrendin!' : '📗 ' + total + ' / ' + byId.size + ' soru öğrenildi') +
        ' · ⭐ ' + starTotal() + ' / ' + maxStars + '</strong>' + olcer(total / byId.size) +
        '<small>Bir soru iki ayrı turda doğru bilinince öğrenilmiş sayılır. Bir ada, bütün soruları öğrenilince biter. ' +
        'Deneme Sınavı' + (ekstra ? ' ve ' + ekstra.simge + ' ' + ekstra.ad : '') + ', ' + lockText.charAt(0).toLocaleLowerCase('tr') + lockText.slice(1) + '.</small>'));
      const box = review();
      if (box) parts.push(box);
      if (kaynak) parts.push(kutu('<small>' + kaynak + '</small>'));
      return parts;
    }
  });

  /* ---------- Rounds ---------- */
  function begin(kind, stop, questions) {
    run = { kind, stop, items: questions.map(prepare), turn: 0, right: 0, hearts: HEARTS, joker: kind === 'durak',
      streak: 0, bestStreak: 0, started: performance.now(), learnedBefore: learnedAll(),
      stopLearnedBefore: stop ? learnedIn(stop) : 0 };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = kind;
    playCue('start');
    ask();
  }
  // A round on station p of stop k (the whole stop without p).
  function startStop(k, p) {
    if (!stopOpen(k)) return;
    const part = Number.isInteger(p) ? partsOf(stops[k])[p] : stops[k].sorular;
    begin('durak', stops[k], pick(part, ROUND));
    run.part = p;
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
    return '<ol class="dots soru-dots" aria-hidden="true">' + run.items.map((item, n) =>
      '<li class="' + (n === run.turn && item.answer === null ? 'now' : item.answer === null ? '' :
        run.kind === 'deneme' ? 'done' : item.answer === 0 ? 'done' : 'miss') + '"></li>').join('') + '</ol>';
  }
  const heartsHtml = () => '<span class="soru-hearts" aria-label="' + run.hearts + ' kalp kaldı">' +
    Array.from({ length: HEARTS }, (_, i) => '<i class="' + (i < run.hearts ? '' : 'lost') + '">' + (i < run.hearts ? '❤️' : '🤍') + '</i>').join('') + '</span>';
  const topBar = () => '<div class="soru-top"><span class="soru-where">' + where() + '</span>' + (run.kind === 'durak' ? heartsHtml() : '') + '</div>';

  function ask() {
    const item = run.items[run.turn];
    const q = item.q;
    const total = run.items.length;
    const stage = byKey('stage');
    dialog.dataset.mood = '';
    stage.innerHTML = topBar() + dots() + '<p class="soru-step">Soru ' + (run.turn + 1) + ' / ' + total +
      (run.kind === 'deneme' ? '' : ' · <span>' + (run.kind === 'tekrar' ? q.stop.simge + ' ' + q.stop.ad : q.stop.konu) + '</span>') +
      (run.streak >= 3 ? '<span class="soru-streak" title="Üst üste doğru">🔥 ' + run.streak + '</span>' : '') + '</p>' +
      (q.m ? '<div class="soru-passage">' + rich(q.m) + '</div>' : '') +
      '<h2 id="' + kod + '-prompt" class="soru-prompt" tabindex="-1">' + rich(q.s) + '</h2>';
    const grid = el('div', 'soru-options');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', kod + '-prompt');
    item.order.forEach((choice, n) => {
      const button = el('button', 'soru-option', '<b aria-hidden="true">' + letters[n] + '</b><span>' + rich(q.a[choice]) + '</span>');
      button.dataset.cue = '';
      button.dataset.choice = choice;
      button.setAttribute('aria-label', letters[n] + ') ' + q.a[choice].replace(/\*/g, ''));
      button.onclick = () => run.kind === 'deneme' ? mark(button) : answer(button);
      grid.append(button);
    });
    stage.append(grid);

    const tools = el('div', 'soru-tools');
    if (run.kind === 'durak') {
      const joker = el('button', 'soru-joker', '<span aria-hidden="true">½</span> Yarı yarıya');
      joker.id = kod + '-joker';
      joker.disabled = !run.joker;
      joker.title = run.joker ? 'İki yanlış seçeneği sil (turda bir kez)' : 'Jokerini bu turda kullandın';
      joker.onclick = useJoker;
      tools.append(joker);
    }
    const feedback = el('div', 'soru-feedback');
    feedback.id = kod + '-feedback';
    feedback.setAttribute('role', 'status');
    const next = el('button', 'primary soru-next-q');
    next.id = kod + '-continue';
    next.hidden = run.kind !== 'deneme';
    if (run.kind === 'deneme') {
      next.disabled = true;
      next.textContent = run.turn === total - 1 ? '✓ Sınavı bitir' : 'İşaretle ve geç ›';
      next.onclick = confirmMark;
    }
    stage.append(tools, feedback, next);
    byKey('prompt').focus();
  }

  function useJoker() {
    if (!run.joker) return;
    const item = run.items[run.turn];
    if (item.answer !== null) return;
    run.joker = false;
    const wrong = shuffled([1, 2, 3]).slice(0, 2);
    item.gone = wrong;
    for (const button of byKey('stage').querySelectorAll('.soru-option')) {
      if (wrong.includes(Number(button.dataset.choice))) { button.disabled = true; button.classList.add('gone'); }
    }
    byKey('joker').disabled = true;
    playCue('island');
    fx.burst(byKey('joker'), { symbols: ['½', '✦', '★'], count: 8, spread: 60 });
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
    const buttons = byKey('stage').querySelectorAll('.soru-option');
    for (const other of buttons) other.disabled = true;
    const correctButton = [...buttons].find(b => b.dataset.choice === '0');
    correctButton.classList.add('right');
    byKey('joker')?.setAttribute('disabled', '');
    const feedback = byKey('feedback');
    const letter = letters[item.order.indexOf(0)];
    if (right) {
      run.right++;
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      playCue('correct');
      fx.burst(button, { symbols: simgeler });
      dialog.dataset.mood = 'good';
      feedback.className = 'soru-feedback good';
      feedback.innerHTML = '<strong>✓ Doğru! ' + praise[Math.floor(Math.random() * praise.length)] +
        (run.streak >= 3 ? ' <span class="soru-fire">🔥 ' + run.streak + ' doğru üst üste!</span>' : '') + '</strong>';
    } else {
      run.streak = 0;
      if (run.kind === 'durak') run.hearts--;
      playCue('retry');
      button.classList.add('wrong');
      fx.bump(button, 'missed');
      dialog.dataset.mood = 'bad';
      feedback.className = 'soru-feedback bad';
      feedback.innerHTML = '<strong>✗ Doğru cevap: ' + letter + ') ' + rich(q.a[0]) + '</strong>';
      const hearts = byKey('stage').querySelector('.soru-hearts');
      if (hearts) {
        hearts.outerHTML = heartsHtml();
        fx.bump(byKey('stage').querySelector('.soru-hearts'), 'denied');
      }
    }
    feedback.insertAdjacentHTML('beforeend', '<p><span aria-hidden="true">💡</span> <b>Biliyor muydun?</b> ' + rich(q.b) + '</p>' + yearNote(q));
    byKey('stage').querySelector('.soru-dots').outerHTML = dots();
    const next = byKey('continue');
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
    for (const other of byKey('stage').querySelectorAll('.soru-option')) {
      other.classList.toggle('picked', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    }
    byKey('continue').disabled = false;
    playCue('key');
  }
  function confirmMark() {
    const picked = byKey('stage').querySelector('.soru-option.picked');
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
    byKey('stage').innerHTML = html;
    byKey('result-title')?.focus();
  }
  function buttons(...list) {
    const row = el('div', 'soru-result-actions');
    for (const [label, action, quiet] of list) {
      const button = el('button', quiet ? 'soru-action quiet' : 'primary', label);
      button.onclick = action;
      row.append(button);
    }
    byKey('stage').append(row);
    row.querySelector('button').focus({ preventScroll: true });
  }
  // What the round added to the questions learned, and the island-wide milestone if reached.
  function learnedNote() {
    const now = learnedAll();
    const gained = now - run.learnedBefore;
    let html = '';
    if (run.stop) {
      const n = learnedIn(run.stop), all = run.stop.sorular.length;
      if (n === all && run.stopLearnedBefore < all) html += '<p class="soru-unlock">✅ ' + run.stop.ad + ' adasının bütün sorularını öğrendin!</p>';
      html += '<p class="soru-learn-line">📗 ' + (gained > 0 ? '+' + gained + ' yeni soru öğrendin · ' : '') + 'Bu adada ' + n + ' / ' + all + ' öğrenildi</p>';
    } else html += '<p class="soru-learn-line">📗 ' + (gained > 0 ? '+' + gained + ' yeni soru öğrendin · ' : '') + 'Koyda ' + now + ' / ' + byId.size + ' öğrenildi</p>';
    if (now === byId.size && run.learnedBefore < byId.size) html += '<p class="soru-unlock">🏅 Koyun bütün ' + byId.size + ' sorusunu öğrendin! Ders kitabının bütün konularını bitirdin.</p>';
    return html;
  }
  function finish() {
    if (run.kind === 'deneme') return finishExam();
    const total = run.items.length;
    const storage = learnedNote() + (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : '');
    if (run.kind === 'tekrar') {
      const left = missed().length;
      // a Tekrar Kutusu round answered without a mistake earns a reward for the tank
      const prize = run.right === total ? akvaryum.odul({ neden: ad + ' · Tekrar Kutusu' }) : null;
      result('<div class="soru-prize" aria-hidden="true">' + (run.right === total ? '🌟' : '🔁') + '</div>' +
        '<h2 id="' + kod + '-result-title" tabindex="-1">' + (run.right === total ? 'Hepsini düzelttin!' : 'Güzel tekrar!') + '</h2>' +
        '<p class="soru-score-big"><b>' + run.right + '</b> / ' + total + ' doğru</p><p>' +
        (left ? 'Tekrar Kutusu’nda ' + left + ' soru kaldı.' : 'Tekrar Kutusu boşaldı. 🎉') + '</p>' +
        (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Bir turu hatasız bitirince akvaryumuna yeni bir balık ya da süs gelir.')) + storage, 'win');
      playCue(run.right === total ? 'island' : 'correct');
      if (run.right === total) fx.confetti(dialog, { count: 120 });
      buttons(...(left ? [['🔁 Bir tur daha', startReview]] : []), ['Haritaya dön', closeGame, left > 0]);
      return;
    }
    const stop = run.stop;
    const k = stops.indexOf(stop), part = run.part;
    if (run.hearts === 0) {
      result(topBar() + '<div class="soru-prize" aria-hidden="true">💔</div><h2 id="' + kod + '-result-title" tabindex="-1">Kalplerin bitti!</h2>' +
        '<p>' + (run.turn + 1) + ' sorudan ' + run.right + ' tanesini bildin. Yanlış yaptığın sorular Tekrar Kutusu’na eklendi; ' +
        '“Biliyor muydun?” notlarını hatırlayarak yeniden dene.</p>' + akvaryum.ipucu('Turu bitirince akvaryumuna yeni bir balık ya da süs gelecek.') + storage, 'bad');
      playCue('oops');
      buttons(['↻ Tekrar dene', () => startStop(k, part)], ['Haritaya dön', closeGame, true]);
      return;
    }
    const stars = run.right === total ? 3 : run.right === total - 1 ? 2 : 1;
    const before = starsOf(stop);
    const firstTime = before === 0;
    if (stars > before) progress.yildiz[stop.id] = stars;
    save();
    const all = learnedAll() === byId.size;
    // A finished round brings a reward to the tank while the stop still has questions to learn; learning
    // every question of the stop brings one more, once.
    const prizes = [];
    if (run.stopLearnedBefore < stop.sorular.length) prizes.push(akvaryum.odul({ neden: ad + ' · ' + stop.ad }));
    if (stopMastered(stop) && run.stopLearnedBefore < stop.sorular.length) prizes.push(akvaryum.odul({ anahtar: kod + ':' + stop.id + ':tamam', neden: ad + ' · ' + stop.ad + ' bitti' }));
    const examNow = firstTime && !stop.ekstra && unitsLeft() === 0;
    const left = unitsLeft();
    let text = run.right + ' / ' + total + ' doğru';
    if (run.bestStreak >= 3) text += ' · en uzun seri 🔥 ' + run.bestStreak;
    let extra = stars < 3 ? '<p>3 yıldız için turu hatasız bitir. Jokerini akıllıca kullan!</p>' :
      !stopMastered(stop) ? '<p>Bu adanın bütün sorularını öğrenmek için tekrar oyna; her turda yeni sorular gelir.</p>' : '';
    if (firstTime && !stop.ekstra && left) extra += '<p class="soru-unlock">Deneme Sınavı’na ' + left + ' ünite kaldı.</p>';
    if (examNow) extra += '<p class="soru-unlock">🔓 <b>Deneme Sınavı</b>' + (ekstra ? ' ve <b>' + ekstra.simge + ' ' + ekstra.ad + '</b>' : '') +
      ' açıldı! Gerçek sınav gibi ' + EXAM + ' soru seni bekliyor.</p>';
    result('<div class="soru-prize" aria-hidden="true">' + stop.simge + '</div>' +
      '<h2 id="' + kod + '-result-title" tabindex="-1">' + (stars > before && !firstTime ? 'Yeni rekor!' : stars === 3 ? 'Mükemmel!' : 'Tur tamamlandı!') + '</h2>' +
      '<div class="soru-won">' + starRow(stars) + '</div><p class="soru-score-big">' + text + '</p>' + extra + akvaryum.kart(prizes) + storage, 'win');
    playCue(all ? 'victory' : 'island');
    fx.confetti(dialog, { count: stars === 3 ? 180 : 110 });
    fx.burst(byKey('stage').querySelector('.soru-won'), { count: 12, spread: 100 });
    const step = nextStep();
    buttons(...(step.kind !== 'durak' || step.k !== k || step.p !== part ? [['Sıradaki: ' + step.label + ' ›', () => go(step)]] : []),
      ['↻ Tekrar oyna', () => startStop(k, part), true], ['Haritaya dön', closeGame, true]);
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
    // the first exam and every new record bring a reward to the tank
    const prize = before === null || score > before ? akvaryum.odul({ neden: ad + ' · Deneme Sınavı' }) : null;
    const emoji = score >= 18 ? '🏆' : score >= 15 ? '🥈' : score >= 10 ? '📚' : '🌱';
    const title = score >= 18 ? 'Sınava hazırsın!' : score >= 15 ? 'Çok iyi gidiyorsun!' : score >= 10 ? 'Güzel bir başlangıç!' : 'Biraz daha çalışalım!';
    const byStop = stops.map(stop => {
      const mine = run.items.filter(item => item.q.stop === stop);
      const good = mine.filter(item => item.answer === 0).length;
      return '<li><span>' + stop.simge + ' ' + stop.konu + '</span><span class="soru-bar" aria-hidden="true"><i style="width:' +
        (mine.length ? good / mine.length * 100 : 0) + '%"></i></span><b>' + good + ' / ' + mine.length + '</b></li>';
    }).join('');
    const wrongs = run.items.filter(item => item.answer !== 0).map(item => {
      const q = item.q;
      const yours = letters[item.order.indexOf(item.answer)];
      const right = letters[item.order.indexOf(0)];
      return '<details class="soru-review-item"><summary>' + rich(q.s) + '</summary>' + (q.m ? '<div class="soru-passage">' + rich(q.m) + '</div>' : '') +
        '<p class="soru-yours">Senin cevabın: ' + yours + ') ' + rich(q.a[item.answer]) + '</p><p class="soru-right">Doğru cevap: ' + right + ') ' +
        rich(q.a[0]) + '</p><p><span aria-hidden="true">💡</span> ' + rich(q.b) + '</p>' + yearNote(q) + '</details>';
    }).join('');
    result('<div class="soru-prize" aria-hidden="true">' + emoji + '</div><h2 id="' + kod + '-result-title" tabindex="-1">' + title + '</h2>' +
      '<p class="soru-score-big"><b>' + score + '</b> / ' + total + ' doğru</p>' +
      '<ul class="facts soru-facts"><li><b>' + Math.round(score / total * 100) + '</b><span>puan</span></li><li><b>' + minutes(elapsed) +
      '</b><span>süre</span></li><li><b>' + progress.deneme.en + '</b><span>en iyi</span></li></ul>' +
      (before !== null && score > before ? '<p class="soru-unlock">🎉 Yeni rekor! Önceki en iyin ' + before + ' idi.</p>' : '') +
      (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Rekorunu geliştirince akvaryumuna yeni bir balık ya da süs gelir.')) +
      '<h3 class="soru-h3">Konulara göre</h3><ul class="soru-by-stop">' + byStop + '</ul>' +
      (wrongs ? '<h3 class="soru-h3">Yanlışlarını incele</h3><p class="soru-small">Bu sorular Tekrar Kutusu’na eklendi.</p>' + wrongs : '') +
      learnedNote() + (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : ''), score >= 15 ? 'win' : '');
    playCue(score >= 18 ? 'victory' : score >= 10 ? 'island' : 'correct');
    if (score >= 15) fx.confetti(dialog, { count: score >= 18 ? 220 : 140, duration: 4000 });
    buttons(['↻ Yeni deneme', startExam], ['Haritaya dön', closeGame, true]);
  }

  function closeGame() { dialog.close(); }

  /* ---------- Keyboard: 1-4 or A-D answers, Enter goes on ---------- */
  document.addEventListener('keydown', e => {
    if (!dialog.open || !run || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('.soru-close, details, summary')) return;
    const key = e.key.toLocaleUpperCase('tr');
    const n = ['1', '2', '3', '4'].indexOf(key) >= 0 ? Number(key) - 1 : letters.indexOf(key);
    if (n < 0) return;
    const button = byKey('stage').querySelectorAll('.soru-option')[n];
    if (button && !button.disabled) { e.preventDefault(); button.click(); }
  });

  /* ---------- Leaving ---------- */
  byKey('close').onclick = closeGame;
  dialog.addEventListener('close', () => {
    run = null;
    dialog.dataset.mood = '';
    for (const canvas of dialog.querySelectorAll('.fx-confetti')) canvas.remove();
    kesifHaritasi.yenile();
  });
}
