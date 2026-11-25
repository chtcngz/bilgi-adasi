// Çarpım Adası: 2'den 10'a çarpım tablosu, dokuz ada ve her adada giderek kısalan dört süre turu; dört tur
// bitince Balina Denizi'nde iki karma bölüm (5 ve 3 sn): 2'den 9'a bütün çarpımlar karışık.
const ports = [[.16,.252],[.49,.257],[.83,.24],[.16,.571],[.49,.568],[.83,.565],[.16,.894],[.49,.915],[.83,.891]];
const secondsPerRound = [15, 10, 5, 3];
const islands = ['Palmiye Koyu', 'Çam Kumsalı', 'Kaya Geçidi', 'Fener Burnu',
  'Mercan Koyu', 'Çam Limanı', 'Dağ Geçidi', 'Değirmen Adası', 'Hazine Zirvesi'];
// Stages 0-35 are the four rounds of the nine tables; the two mixed stages follow them. Their pin is the whale
// (`selected` is MIXED while it is chosen). A mixed stage asks every product of 2..9 once, smaller factor first
// (3 × 4, never 4 × 3 as well), in a new order on every start.
const mixedSeconds = [5, 3];
const MIXED = islands.length;
const mixedPort = [.655, .33];
const mixedPlace = 'Balina Denizi';
const mixedPairs = [];
for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) mixedPairs.push([a, b]);
const tableStages = islands.length * secondsPerRound.length;
const total = tableStages + mixedSeconds.length;
let progress, selected;
let deck = [], answers = [], entry = '', deadline = 0, timer, playing = false;
const round = () => Math.min(secondsPerRound.length - 1, Math.floor(progress.completed / islands.length));
const mixedRound = () => Math.min(mixedSeconds.length - 1, Math.max(0, progress.completed - tableStages));
const isMixed = () => selected === MIXED;
const slot = () => isMixed() ? tableStages + mixedRound() : round() * islands.length + selected;
const limit = () => isMixed() ? mixedSeconds[mixedRound()] : secondsPerRound[round()];
const questionCount = () => isMixed() ? mixedPairs.length : 10;
const title = () => isMixed() ? 'Karma Çarpım' : (selected + 2) + ' Çarpım Adası';
// The pin a stage belongs to, the place shown for a pin, and a stage's name in lists.
const stageIsland = index => index >= tableStages ? MIXED : index % islands.length;
const placeName = island => island === MIXED ? mixedPlace : islands[island];
const stageLabel = index => index >= tableStages ? 'Karma · ' + mixedSeconds[index - tableStages] + ' sn' :
  (index % islands.length + 2) + ' · ' + islands[index % islands.length];
const scenePosition = island => island === MIXED ? '73% 23%' : (island % 3 * 50) + '% ' + (Math.floor(island / 3) * 50) + '%';
const stageTag = () => isMixed() ? 'KARMA BÖLÜM ' + (mixedRound()+1) + ' / ' + mixedSeconds.length :
  'TUR ' + (round()+1) + ' / ' + secondsPerRound.length;
// The question of a turn: a table deck holds the second factors, a mixed deck both.
const factors = i => Array.isArray(deck[i]) ? deck[i] : [selected + 2, deck[i]];
function save() {
  try { localStorage.setItem(progressKey(activeProfile), JSON.stringify(progress)); storageFailed = false; }
  catch { storageFailed = true; }
}
let shownStars = null;
const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
const islandRounds = island => island === MIXED ?
  mixedSeconds.map((_, r) => tableStages + r < progress.completed) :
  secondsPerRound.map((_, r) => r * islands.length + island < progress.completed);
function starRow(island) {
  const rounds = islandRounds(island);
  return '<span class="round-stars" aria-label="' + rounds.filter(Boolean).length + ' / ' + rounds.length +
    (island === MIXED ? ' bölüm' : ' tur') + ' tamamlandı">' + rounds.map(done =>
    '<i class="' + (done ? 'won' : '') + '" aria-hidden="true">★</i>').join('') + '</span>';
}
function dots(done, missed = false, count = questionCount()) {
  return '<ol class="dots' + (count > 10 ? ' many' : '') + '" aria-label="' + done + ' / ' + count + ' doğru">' +
    Array.from({length: count}, (_, i) =>
    '<li class="' + (i < done ? 'done' : i === done ? (missed ? 'miss' : 'now') : '') + '"></li>').join('') + '</ol>';
}
function render() {
  const done = progress.completed;
  $('stars').textContent = '⭐ ' + done + ' yıldız';
  if (shownStars !== null && done > shownStars) fx.bump($('stars'), 'star-bump');
  shownStars = done;
  $('count').textContent = done + ' / ' + total + ' yıldız';
  $('bar').style.width = done / total * 100 + '%';
  const pin = ([x, y], i, index) => {
    const button = document.createElement('button');
    button.className = 'pin ' + (i === MIXED ? 'mixed ' : '') + (index < done ? 'done ' : '') + (i === selected ? 'active' : '');
    button.style.left = x * 100 + '%'; button.style.top = y * 100 + '%';
    button.style.setProperty('--i', i);
    button.textContent = i === MIXED ? '×' : i + 2;
    const locked = index > done && !devAll();
    if (index < done) button.insertAdjacentHTML('beforeend', '<span class="pin-star" aria-hidden="true">★</span>');
    if (locked) {
      button.classList.add('locked');
      button.dataset.cue = '';
      button.setAttribute('aria-disabled', 'true');
      button.insertAdjacentHTML('beforeend', '<span class="pin-lock" aria-hidden="true">🔒</span>');
    }
    button.title = (i === MIXED ? mixedPlace + ' · Karma çarpım (2-9)' : islands[i] + ' · ' + (i+2) + ' çarpım tablosu') +
      (locked ? ' · Kilitli' : '');
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', selected === i);
    button.onclick = () => {
      if (locked) {
        playCue('oops');
        fx.bump(button, 'denied');
        mapHint(i === MIXED ? '🔒 Karma bölüm dört tur bitince açılır' : '🔒 Önce ' + islands[done % islands.length] + ' adasını tamamla');
        return;
      }
      selected = i;
      render();
      openIsland();
    };
    return button;
  };
  $('pins').replaceChildren(...ports.map((port, i) => pin(port, i, round() * islands.length + i)),
    pin(mixedPort, MIXED, tableStages + mixedRound()));
  $('mission').innerHTML = '<div class="scene"><span class="scene-name">' + placeName(selected) +
    '</span></div><span class="tag">' + (isMixed() ? 'Karma bölüm ' + (mixedRound()+1) + ' / ' + mixedSeconds.length :
    'Tur ' + (round()+1) + ' / ' + secondsPerRound.length) + ' · Her soru ' + limit() + ' sn</span><h2>' + title() +
    '</h2>' + starRow(selected) + '<p>' + (isMixed() ? '2’den 9’a bütün çarpımlar karışık sırayla: ' + questionCount() +
    ' işlemi art arda doğru çöz.' : '10 karışık işlemi art arda doğru çöz.') + '</p>';
  const scene = $('mission').querySelector('.scene');
  scene.style.backgroundPosition = scenePosition(selected);
  $('play').textContent = slot() === done ? (progress.attempt ? '▶  Kaldığın yerden devam et' : isMixed() ? '▶  Bölüme başla' : '▶  Adaya başla') : 'Keşif günlüğünü aç';
  $('play').onclick = openIsland;
}
function openIsland() {
  $('game').showModal();
  if (slot() !== progress.completed) journal();
  else if (progress.attempt) resumeAttempt();
  else brief();
}
let hintTimer;
function mapHint(text) {
  const hint = $('map-hint');
  hint.textContent = text;
  hint.hidden = false;
  fx.bump(hint, 'show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { hint.hidden = true; }, 2200);
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
  const scene = '<div class="brief-scene" style="background-position:' + scenePosition(selected) + '"><span>' +
    placeName(selected) + '</span></div>';
  const facts = '<ul class="facts"><li><b>' + questionCount() + '</b><span>soru</span></li><li><b>' + limit() +
    '</b><span>sn / soru</span></li><li><b>' + starRow(selected) + '</b><span>' + (isMixed() ? 'bölüm' : 'tur') +
    ' yıldızları</span></li></ul>';
  const rules = isMixed() ? '<p>2’den 9’a bütün çarpımlar karışık sırayla gelecek. Cevabını yazıp onayla. ' +
    'Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve bölüme baştan başlayacaksın. ' +
    'Sorular her seferinde yeni bir sırayla gelir.</p>' :
    '<p>Cevabını yazıp onayla. Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve bu adanın başından yeniden başlayacaksın.</p>';
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
  $('stage').innerHTML = '<div class="eyebrow">' + (isMixed() ? 'KARMA ' + limit() + ' SN' : 'TUR ' + (round()+1)) +
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
      'Hazır olduğunda bölüme baştan başla; sorular yeni bir sırayla gelecek.' : 'Hazır olduğunda aynı adayı yeniden dene.') +
      '</p>' + akvaryum.ipucu((isMixed() ? 'Bölümü' : 'Adayı') + ' bitirince akvaryumuna yeni bir balık ya da süs gelecek.'),
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
  const stage = slot(), finished = stageIsland(stage), count = questionCount();
  progress.reports[stage] = answers;
  progress.completed++;
  save();
  selected = stageIsland(Math.min(progress.completed,total-1));
  render();
  const victory = progress.completed === total;
  const opened = progress.completed === tableStages;
  const message = victory ? 'Dokuz adanın hepsini dört turda tamamladın, karma bölümlerde de 2’den 9’a bütün çarpımları ' +
      'her biri ' + mixedSeconds[mixedSeconds.length-1] + ' saniye içinde çözdün.' :
    opened ? 'Dokuz adayı dört turda da tamamladın! ' + mixedPlace + '’nde karma bölüm açıldı: 2’den 9’a bütün çarpımlar ' +
      'karışık sırayla gelecek. Her soru için ' + limit() + ' saniyen var.' :
    finished === MIXED ? count + ' karma işlemi art arda doğru çözdün. Son bölümde her soru için ' + limit() + ' saniyen var.' :
    finished === islands.length - 1 ? 'Dokuz adayı tamamladın. Şimdi 2 tablosuna dönüyorsun. Bu turda her soru için '+limit()+' saniyen var.' :
    'On işlemi tek denemede doğru çözdün. Sırada '+title()+' var.';
  // Every island or mixed stage finished brings a fish or an ornament to the player's tank (once per stage).
  const prize = akvaryum.odul({ anahtar: 'carpim:' + stage,
    neden: finished === MIXED ? 'Karma Çarpım · ' + mixedSeconds[stage - tableStages] + ' sn' : (finished + 2) + ' Çarpım Adası' });
  playCue(victory ? 'victory' : 'island');
  screen(victory?'Çarpım ustası!':finished === MIXED?'Bölüm tamamlandı!':'Ada tamamlandı!', '<div class="trophy" aria-hidden="true"><span>' +
    (victory ? '🏆' : opened ? '🐋' : '⭐') + '</span></div>' + dots(count, false, count) + '<p class="trophy-stars">' +
    placeName(finished) + ' ' + starRow(finished) + '</p><p>'+message+'</p>' + akvaryum.kart([prize]) +
    (storageFailed?'<p>İlerlemen yalnızca bu oturumda saklanabildi.</p>':''),
    victory?'Haritaya dön':'Devam et', victory ? ()=>$('game').close() : brief,
    { mood: 'win', eyebrow: '+1 YILDIZ · ' + progress.completed + ' / ' + total });
  fx.confetti($('game'), { count: victory || opened ? 220 : 140, duration: victory || opened ? 4500 : 3200 });
  fx.burst($('stage').querySelector('.trophy'), { count: 14, spread: 110 });
}
function journal() {
  const mixed = isMixed();
  const reports = (mixed ? mixedSeconds : secondsPerRound).map((s,r) => {
    const rows = progress.reports[mixed ? tableStages+r : r*islands.length+selected];
    if (!rows) return '';
    return '<details '+(r===(mixed ? mixedRound() : round())?'open':'')+'><summary>'+(mixed ? 'Bölüm ' : 'Tur ')+(r+1)+
      ' · '+s+' sn</summary><ul>'+
      rows.map(x=>'<li>'+x.a+' × '+x.b+' = '+x.a*x.b+' · '+
        (x.answer===null?'Süre doldu':x.answer===x.a*x.b?'Doğru':'Cevabın '+x.answer)+' · '+x.seconds+' sn</li>').join('')+'</ul></details>';
  }).join('');
  screen(title(), '<p class="trophy-stars">' + placeName(selected) + ' ' + starRow(selected) + '</p>' + reports,
    'Haritaya dön', ()=>$('game').close(), { eyebrow: 'KEŞİF GÜNLÜĞÜ' });
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
$('game').addEventListener('close', () => setMood(''));
$('game').addEventListener('cancel', pauseAttempt);
window.addEventListener('pagehide', pauseAttempt);
window.addEventListener('pageshow', e => {
  if (e.persisted && $('game').open && progress?.attempt && $('keys')) resumeAttempt();
});
