// Çarpım Koyu (once Çarpım Adası): the multiplication tables 2-10 on six islands of Keşif Haritası (core/js/harita.js).
// The first four islands are the timed rounds, 15, 10, 5 and 3 seconds a question, each with the nine tables as its
// stations; the last two are the mixed rounds (5 and 3 s), one station each: every product of 2..9 once. The stages go
// in order (only the next one opens) and finishing an island brings a fish to the player's tank.
// Progress is still saved by stage: stages 0-35 are the four rounds of the nine tables (round × 9 + table), 36 and 37
// the mixed ones. `stage` is the one shown in the game window.
const secondsPerRound = [15, 10, 5, 3];
const TABLES = 9;
const mixedSeconds = [5, 3];
const mixedPairs = [];
for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) mixedPairs.push([a, b]);
const tableStages = TABLES * secondsPerRound.length;
const total = tableStages + mixedSeconds.length;
const ISLANDS = secondsPerRound.length + mixedSeconds.length;
let progress, stage = 0;
let deck = [], answers = [], entry = '', deadline = 0, timer, playing = false;
// The island a stage is on, the stages of an island, and their names.
const islandOf = index => index >= tableStages ? secondsPerRound.length + index - tableStages : Math.floor(index / TABLES);
const islandStages = i => i < secondsPerRound.length ? Array.from({ length: TABLES }, (_, t) => i * TABLES + t) : [tableStages + i - secondsPerRound.length];
const islandSeconds = i => i < secondsPerRound.length ? secondsPerRound[i] : mixedSeconds[i - secondsPerRound.length];
// The islands are named after how fast the child must be: from the slow turtle (15 s) to the cheetah (3 s), then
// the whirlpool and the lightning of the mixed rounds (5 and 3 s).
const islandNames = ['Kaplumbağa', 'Tavşan', 'Ceylan', 'Çita', 'Girdap', 'Şimşek'];
const islandSigns = ['🐢', '🐇', '🦌', '🐆', '🌀', '⚡'];
const islandName = i => islandNames[i] + ' Adası';
// 2’ler, 6’lar …: the suffix follows the number's last vowel.
const tableName = t => (t + 2) + '’' + ['ler', 'ler', 'ler', 'ler', 'lar', 'ler', 'ler', 'lar', 'lar'][t];
const stageLabel = index => index >= tableStages ? islandName(islandOf(index)) : islandName(islandOf(index)) + ' · ' + tableName(index % TABLES);
const isMixed = () => stage >= tableStages;
const table = () => stage % TABLES;
const slot = () => stage;
const limit = () => islandSeconds(islandOf(stage));
const questionCount = () => isMixed() ? mixedPairs.length : 10;
const title = () => isMixed() ? 'Karma Çarpım' : (table() + 2) + ' Çarpım Tablosu';
const scenePosition = () => isMixed() ? '73% 23%' : (table() % 3 * 50) + '% ' + (Math.floor(table() / 3) * 50) + '%';
const stageTag = () => islandName(islandOf(stage)).toLocaleUpperCase('tr') + (isMixed() ? '' : ' · ' + (table() + 1) + ' / ' + TABLES);
// The question of a turn: a table deck holds the second factors, a mixed deck both.
const factors = i => Array.isArray(deck[i]) ? deck[i] : [table() + 2, deck[i]];
function save() {
  try { localStorage.setItem(progressKey(activeProfile), JSON.stringify(progress)); storageFailed = false; }
  catch { storageFailed = true; }
}
let shownStars = null;
const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
const islandDone = i => islandStages(i).every(index => index < progress.completed);
const doneIn = i => islandStages(i).filter(index => index < progress.completed).length;
// The island's stations as stars: one for every table (or the mixed round) done.
function starRow(i) {
  const list = islandStages(i);
  return '<span class="round-stars" aria-label="' + doneIn(i) + ' / ' + list.length + ' tamamlandı">' + list.map(index =>
    '<i class="' + (index < progress.completed ? 'won' : '') + '" aria-hidden="true">★</i>').join('') + '</span>';
}
function dots(done, missed = false, count = questionCount()) {
  return '<ol class="dots' + (count > 10 ? ' many' : '') + '" aria-label="' + done + ' / ' + count + ' doğru">' +
    Array.from({length: count}, (_, i) =>
    '<li class="' + (i < done ? 'done' : i === done ? (missed ? 'miss' : 'now') : '') + '"></li>').join('') + '</ol>';
}
// The stars in the header, and the map behind the game window.
function render() {
  const done = progress.completed;
  $('stars').textContent = '⭐ ' + done + ' yıldız';
  if (shownStars !== null && done > shownStars) fx.bump($('stars'), 'star-bump');
  shownStars = done;
}
// Opens stage `index` in the game window: the next one to play, or the journal of one already done.
function openStage(index) {
  if (index > progress.completed && !devAll()) return;
  stage = Math.min(index, total - 1);
  $('game').showModal();
  if (stage < progress.completed) journal();
  else if (progress.attempt && stage === progress.completed) resumeAttempt();
  else brief();
}
function stop() { playing = false; clearInterval(timer); }
function setMood(mood) {
  $('game').dataset.mood = mood || '';
  for (const canvas of $('game').querySelectorAll('.fx-confetti')) canvas.remove();
}
function screen(heading, body, action, handler, { cue, mood, eyebrow } = {}) {
  stop();
  setMood(mood);
  $('stage').innerHTML = '<div class="eyebrow">' + (eyebrow || stageTag()) +
    '</div><h2 id="gameTitle">' + heading + '</h2>' + body + '<button class="primary" id="next"></button>';
  $('next').textContent = action;
  if (cue) $('next').dataset.cue = cue;
  $('next').onclick = () => { if (cue) playCue(cue); handler(); };
  $('next').focus();
}
function brief() {
  const i = islandOf(stage);
  const scene = '<div class="brief-scene" style="background-position:' + scenePosition() + '"><span>' + islandName(i) + '</span></div>';
  const facts = '<ul class="facts"><li><b>' + questionCount() + '</b><span>soru</span></li><li><b>' + limit() +
    '</b><span>sn / soru</span></li><li><b>' + starRow(i) + '</b><span>ada yıldızları</span></li></ul>';
  const rules = isMixed() ? '<p>2’den 9’a bütün çarpımlar karışık sırayla gelecek. Cevabını yazıp onayla. ' +
    'Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve baştan başlayacaksın. ' +
    'Sorular her seferinde yeni bir sırayla gelir. Bitirince akvaryumuna bir balık gelecek.</p>' :
    '<p>Cevabını yazıp onayla. Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve bu tablonun başından yeniden başlayacaksın. ' +
    'Adadaki dokuz tabloyu bitirince akvaryumuna bir balık gelecek.</p>';
  screen(title(), scene + facts + rules, 'Hazırım, başla', begin, { cue: 'start' });
}
function shuffle(list) {
  for (let i = list.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [list[i],list[j]] = [list[j],list[i]];
  }
  return list;
}
function begin() {
  // Never the same order twice in a row.
  const same = list => list.every((item, i) => String(item) === String(deck[i]));
  const fresh = shuffle(isMixed() ? mixedPairs.map(pair => pair.slice()) : Array.from({length:10}, (_,i) => i+1));
  if (same(fresh)) [fresh[0],fresh[1]] = [fresh[1],fresh[0]];
  deck = fresh; answers = [];
  const stats = stageStats(slot());
  stats.attempts++;
  stats.latest = answers;
  progress.attempt = { deck, entry: '', remaining: limit()*1000 };
  save();
  question();
}
function resumeAttempt() {
  deck = progress.attempt.deck;
  answers = stageStats(slot()).latest;
  question();
}
// A key acts on press and may replace the screen before the finger lifts. On
// touch, the click that follows is aimed at whatever is now under the finger
// (say "Sonraki soru"), so that one click is dropped.
let ghostKey = null, ghostTimer;
addEventListener('pointerdown', () => { ghostKey = null; }, true);
addEventListener('keydown', () => { ghostKey = null; }, true);
addEventListener('click', e => {
  if (!ghostKey) return;
  const origin = ghostKey;
  ghostKey = null;
  if (!origin.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
function question() {
  stop();
  setMood('');
  entry = progress.attempt.entry;
  const [a, b] = factors(answers.length);
  const labels = { Sil: '<span aria-hidden="true">⌫</span>', Onayla: '<span aria-hidden="true">✓</span> Onayla' };
  $('stage').innerHTML = '<div class="eyebrow">' + (isMixed() ? 'KARMA ' + limit() + ' SN' : limit() + ' SANİYE · ' + tableName(table()).toLocaleUpperCase('tr')) +
    ' · SORU ' + (answers.length+1) + ' / ' + questionCount() + '</div>' + dots(answers.length) + '<h2 id="gameTitle">' + title() +
    '</h2><div class="quiz"><div class="clock" id="clock" role="timer"><svg viewBox="0 0 44 44" aria-hidden="true">' +
    '<circle class="ring-track" cx="22" cy="22" r="19"/><circle class="ring" cx="22" cy="22" r="19" pathLength="100"/></svg>' +
    '<span><b id="secs">' + limit() + '</b> sn</span></div><h3 class="equation"><span>' + a + '</span><i>×</i><span>' + b +
    '</span><i>=</i><span id="value" class="slot">?</span></h3></div><div class="pad" id="keys">' +
    [1,2,3,4,5,6,7,8,9,'Sil',0,'Onayla'].map(n => '<button data-k="' + n + '"' +
      (n === 'Sil' ? ' aria-label="Sil" class="erase"' : n === 'Onayla' ? ' class="ok"' : '') + '>' +
      (labels[n] || n) + '</button>').join('') + '</div>';
  // Keys act on press so the digit and its sound come right away; the click
  // that follows a press is skipped, while keyboard activation still works.
  let pressed = null;
  $('keys').onpointerdown = e => {
    const button = e.target.closest('button');
    if (!button || e.button !== 0) return;
    pressed = ghostKey = button;
    clearTimeout(ghostTimer);
    ghostTimer = setTimeout(() => { ghostKey = null; }, 1000);
    key(button.dataset.k);
  };
  $('keys').onclick = e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button === pressed) { pressed = null; return; }
    key(button.dataset.k);
  };
  $('gameTitle').tabIndex = -1;
  $('gameTitle').focus();
  showEntry();
  playing = true;
  deadline = performance.now() + progress.attempt.remaining;
  let shown = Math.ceil(progress.attempt.remaining / 1000);
  const clock = $('clock');
  const tickTo = left => {
    $('secs').textContent = left;
    clock.classList.toggle('urgent', left <= 3);
    if (left <= 3) { playCue('tick-' + left); fx.bump(clock, 'tock'); }
  };
  const drain = () => clock.style.setProperty('--left', Math.max(0, (deadline - performance.now()) / (limit() * 1000)));
  drain();
  tickTo(shown);
  timer = setInterval(() => {
    drain();
    const left = Math.ceil((deadline-performance.now())/1000);
    if (left <= 0) return finish(true);
    if (left === shown) return;
    shown = left;
    tickTo(left);
  }, 75);
}
function showEntry() {
  $('value').textContent = entry || '?';
  $('value').classList.toggle('empty', !entry);
}
function key(k) {
  if (!playing) return;
  if (performance.now() >= deadline) return finish(true);
  if (k === 'Onayla') {
    if (entry.length) return finish(false);
    playCue('oops');
    fx.bump($('value'), 'nudge');
    return;
  }
  if (k === 'Sil') {
    if (!entry) return;
    entry = entry.slice(0,-1);
    playCue('erase');
  } else if (/^\d$/.test(k) && entry.length<3) {
    entry += k;
    playCue('key');
  } else return;
  showEntry();
  fx.bump($('value'), 'pop');
  fx.bump($('keys').querySelector('[data-k="' + k + '"]'), 'pressed');
}
document.addEventListener('keydown', e => {
  if (!playing || !$('game').open || (e.key === 'Enter' && e.target.closest('#switch-game, #close'))) return;
  if (/^\d$/.test(e.key) || ['Enter','Backspace'].includes(e.key)) {
    e.preventDefault();
    if (!e.repeat) key(e.key === 'Enter' ? 'Onayla' : e.key === 'Backspace' ? 'Sil' : e.key);
  }
});
function finish(timeout) {
  if (!playing) return;
  stop();
  const [a, b] = factors(answers.length), product = a*b;
  const correct = !timeout && Number(entry) === product;
  const seconds = timeout ? limit() : Math.round((limit()-(deadline-performance.now())/1000)*10)/10;
  answers.push({a,b,seconds,answer:timeout ? null : Number(entry)});
  countAnswer(stageStats(slot()), answers[answers.length - 1]);
  const equation = '<h3 class="equation result">'+a+' × '+b+' = <b>'+product+'</b></h3>';
  if (!correct) {
    delete progress.attempt;
    playCue('retry');
    progress.reports[slot()] = answers; save(); render();
    const groups = '<div class="groups" aria-hidden="true">' +
      Array.from({length:b}, (_, g) => '<span class="group" style="--i:' + g + '">'+'●'.repeat(Math.min(5,a))+
      (a>5?'<br>'+'●'.repeat(a-5):'')+'</span>').join('')+'</div>';
    const yours = timeout ? '' : '<p class="yours">Senin cevabın <s>' + entry + '</s></p>';
    screen(timeout?'Ah, süre doldu!':'Ah, bu kez olmadı!', dots(answers.length - 1, true) + yours +
      '<p class="answer-label">Doğru cevap</p>' + equation + groups +
      '<p>Her grupta '+a+' tane var. '+b+' grup toplam '+product+' eder. ' + (isMixed() ?
      'Hazır olduğunda baştan başla; sorular yeni bir sırayla gelecek.' : 'Hazır olduğunda aynı tabloyu yeniden dene.') +
      '</p>' + akvaryum.ipucu(islandName(islandOf(stage)) + '’nı bitirince akvaryumuna yeni bir balık gelecek.'),
      'Tekrar dene', begin, { mood: 'bad', cue: 'start' });
    return;
  }
  const last = answers[answers.length - 1];
  if (answers.length < questionCount()) {
    playCue('correct');
    Object.assign(progress.attempt, { entry: '', remaining: limit()*1000 });
    save();
    screen('Doğru! ' + praise[Math.floor(Math.random() * praise.length)], dots(answers.length) + equation +
      '<p class="speed"><span aria-hidden="true">⚡</span> ' + duration(last.seconds) + '’de çözdün · ' +
      (questionCount() - answers.length) + ' soru kaldı</p>', 'Sonraki soru', question, { mood: 'good' });
    fx.burst($('stage').querySelector('.equation'));
    return;
  }
  delete progress.attempt;
  const played = stage, i = islandOf(played), count = questionCount();
  progress.reports[played] = answers;
  progress.completed++;
  save();
  render();
  const victory = progress.completed === total;
  const islandFinished = islandDone(i);
  // Finishing an island brings a fish to the player's tank (once per island).
  const prize = islandFinished ? akvaryum.odul({ anahtar: 'carpim-ada:' + i, neden: 'Çarpım Koyu · ' + islandName(i), balik: true }) : null;
  const next = Math.min(progress.completed, total - 1);
  const message = victory ? 'Altı adanın hepsini bitirdin: dokuz tabloyu dört hızda, sonra 2’den 9’a bütün çarpımları karışık sırayla ' +
      mixedSeconds[mixedSeconds.length - 1] + ' saniye içinde çözdün.' :
    islandFinished ? islandName(i) + '’nı bitirdin! Sırada ' + islandName(islandOf(next)) + ' var: her soru için ' + islandSeconds(islandOf(next)) + ' saniyen olacak.' :
    count + ' işlemi tek denemede doğru çözdün. Sırada ' + tableName(next % TABLES) + ' var. Bu adada ' + (TABLES - doneIn(i)) + ' tablo kaldı.';
  playCue(victory ? 'victory' : 'island');
  stage = next;
  screen(victory ? 'Çarpım ustası!' : islandFinished ? 'Ada tamamlandı!' : 'Tablo tamamlandı!', '<div class="trophy" aria-hidden="true"><span>' +
    (victory ? '🏆' : islandFinished ? '🐟' : '⭐') + '</span></div>' + dots(count, false, count) + '<p class="trophy-stars">' +
    islandName(i) + ' ' + starRow(i) + '</p><p>' + message + '</p>' + (prize ? akvaryum.kart([prize]) : '') +
    (storageFailed ? '<p>İlerlemen yalnızca bu oturumda saklanabildi.</p>' : ''),
    victory || islandFinished ? 'Haritaya dön' : 'Devam et', victory || islandFinished ? () => $('game').close() : brief,
    { mood: 'win', eyebrow: '+1 YILDIZ · ' + progress.completed + ' / ' + total });
  fx.confetti($('game'), { count: victory || islandFinished ? 220 : 140, duration: victory || islandFinished ? 4500 : 3200 });
  fx.burst($('stage').querySelector('.trophy'), { count: 14, spread: 110 });
}
// The answers of a stage already done.
function journal() {
  const rows = progress.reports[stage] || [];
  const list = rows.length ? '<ul class="journal">' + rows.map(x => '<li>' + x.a + ' × ' + x.b + ' = ' + x.a * x.b + ' · ' +
    (x.answer === null ? 'Süre doldu' : x.answer === x.a * x.b ? 'Doğru' : 'Cevabın ' + x.answer) + ' · ' + x.seconds + ' sn</li>').join('') + '</ul>' :
    '<p>Bu aşamanın cevapları kaydedilmemiş.</p>';
  screen(title(), '<p class="trophy-stars">' + islandName(islandOf(stage)) + ' ' + starRow(islandOf(stage)) + '</p><p>✓ Tamamlandı. Son denemen:</p>' + list,
    'Haritaya dön', () => $('game').close(), { eyebrow: 'KEŞİF GÜNLÜĞÜ' });
}
function pauseAttempt() {
  if (!playing) return;
  progress.attempt.entry = entry;
  progress.attempt.remaining = Math.max(0, deadline-performance.now());
  stop();
  save();
}
function leaveGame() {
  pauseAttempt();
  $('game').close();
}
$('close').onclick = leaveGame;
$('game').addEventListener('close', () => { setMood(''); kesifHaritasi.yenile(); });
$('game').addEventListener('cancel', pauseAttempt);
window.addEventListener('pagehide', pauseAttempt);
window.addEventListener('pageshow', e => {
  if (e.persisted && $('game').open && progress?.attempt && $('keys')) resumeAttempt();
});

/* ---------- Çarpım Koyu on Keşif Haritası ---------- */
// The islands finished before the bay came (0.43.0) bring their fish the next time the map shows, once each.
const rewardedIslands = new Set();
function rewardIslands() {
  if (rewardedIslands.has(activeProfile.id)) return;
  rewardedIslands.add(activeProfile.id);
  for (let i = 0; i < ISLANDS; i++) {
    if (islandDone(i)) akvaryum.odul({ anahtar: 'carpim-ada:' + i, neden: 'Çarpım Koyu · ' + islandName(i), balik: true });
  }
}
const stationState = index => index < progress.completed ? 'done' : index === progress.completed ? 'now' : devAll() ? 'open' : 'locked';
kesifHaritasi.koy({
  id: 'carpim', kart: 'multiplication-card', ad: 'Çarpım Koyu', lead: '2’den 10’a çarpım tablosu', simge: '✖️', tema: 'carpim', araclar: true,
  hazirla() { render(); rewardIslands(); },
  adalar: () => Array.from({ length: ISLANDS }, (_, i) => {
    const list = islandStages(i);
    return { ad: islandName(i), kisa: islandNames[i],
      simge: islandSigns[i] + ' ' + islandSeconds(i), not: islandSeconds(i) + ' sn · ' + (list.length > 1 ? doneIn(i) + ' / ' + list.length : 'karma'),
      durum: islandDone(i) ? 'done' : list.includes(progress.completed) ? 'now' : devAll() ? 'open' : 'locked' };
  }),
  duraklar: i => islandStages(i).map(index => i < secondsPerRound.length ?
    { simge: '×' + (index % TABLES + 2), ad: tableName(index % TABLES), etiket: stageLabel(index), durum: stationState(index),
      kilit: 'Önce ' + tableName(progress.completed % TABLES) + ' tablosunu bitir' } :
    { simge: '✖', ad: mixedPairs.length + ' işlem', etiket: stageLabel(index), durum: stationState(index), kilit: 'Önce ' + stageLabel(progress.completed) + '’nı bitir' }),
  ac: (i, n) => openStage(islandStages(i)[n]),
  kilit: () => 'Önce ' + islandName(islandOf(progress.completed)) + '’nı bitir',
  panel(level, i) {
    const { sonraki, kutu, olcer } = kesifHaritasi.parca;
    const done = progress.completed;
    const parts = [];
    if (level === 'ada') {
      const list = islandStages(i);
      if (list.includes(done)) parts.push(sonraki('▶', progress.attempt ? 'Kaldığın yerden' : 'Sıradaki', i < secondsPerRound.length ? tableName(done % TABLES) + ' tablosu' : 'Karma çarpım',
        () => openStage(done)));
      parts.push(kutu('<strong>' + islandName(i) + ' ' + starRow(i) + '</strong><small>' + (i < secondsPerRound.length ?
        'Dokuz tablo, her birinde 10 işlem. Her soru için ' + islandSeconds(i) + ' saniyen var.' :
        '2’den 9’a bütün çarpımlar (' + mixedPairs.length + ' işlem) karışık sırayla. Her soru için ' + islandSeconds(i) + ' saniyen var.') +
        '</small><small>🐟 ' + (islandDone(i) ? 'Bu adanın balığını kazandın.' : 'Adayı bitirince akvaryumuna bir balık gelecek.') + '</small>'));
      return parts;
    }
    if (done < total) parts.push(sonraki('▶', progress.attempt ? 'Kaldığın yerden' : 'Sıradaki', stageLabel(done), () => openStage(done)));
    else parts.push(kutu('<strong>🏆 Çarpım ustası!</strong><small>Altı adanın hepsini bitirdin. Bitirdiğin bir tabloya dokunup son denemene bakabilirsin.</small>'));
    parts.push(kutu('<strong>Keşif günlüğüm · ' + done + ' / ' + total + ' yıldız</strong>' + olcer(done / total) +
      '<small>Altı ada var: önce 15, 10, 5 ve 3 saniyede 2’den 10’a dokuz tablo, sonra 5 ve 3 saniyede karma çarpım. Yalnızca sıradaki tablo açılır.</small>' +
      '<small>🐟 Her adayı bitirince akvaryumuna bir balık gelir.</small>'));
    return parts;
  }
});
