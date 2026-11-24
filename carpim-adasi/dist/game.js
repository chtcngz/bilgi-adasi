const $ = id => document.getElementById(id);
const ports = [[.16,.252],[.49,.257],[.83,.24],[.16,.571],[.49,.568],[.83,.565],[.16,.894],[.49,.915],[.83,.891]];
const secondsPerRound = [15, 10, 5, 3];
const islands = ['Palmiye Koyu', 'Çam Kumsalı', 'Kaya Geçidi', 'Fener Burnu',
  'Mercan Koyu', 'Çam Limanı', 'Dağ Geçidi', 'Değirmen Adası', 'Hazine Zirvesi'];
const total = islands.length * secondsPerRound.length;
let activeProfile, progress, selected;
let deck = [], answers = [], entry = '', deadline = 0, timer, playing = false;
let storageFailed = false;
const round = () => Math.min(secondsPerRound.length - 1, Math.floor(progress.completed / islands.length));
const slot = () => round() * islands.length + selected;
const limit = () => secondsPerRound[round()];
const title = () => (selected + 2) + ' Çarpım Adası';
function save() {
  try { localStorage.setItem(progressKey(activeProfile), JSON.stringify(progress)); storageFailed = false; }
  catch { storageFailed = true; }
}
let shownStars = null;
const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
const islandRounds = island => secondsPerRound.map((_, r) => r * islands.length + island < progress.completed);
function starRow(island) {
  return '<span class="round-stars" aria-label="' + islandRounds(island).filter(Boolean).length + ' / ' +
    secondsPerRound.length + ' tur tamamlandı">' + islandRounds(island).map(done =>
    '<i class="' + (done ? 'won' : '') + '" aria-hidden="true">★</i>').join('') + '</span>';
}
function dots(done, missed = false) {
  return '<ol class="dots" aria-label="' + done + ' / 10 doğru">' + Array.from({length: 10}, (_, i) =>
    '<li class="' + (i < done ? 'done' : i === done ? (missed ? 'miss' : 'now') : '') + '"></li>').join('') + '</ol>';
}
function render() {
  const done = progress.completed;
  $('stars').textContent = '⭐ ' + done + ' yıldız';
  if (shownStars !== null && done > shownStars) fx.bump($('stars'), 'star-bump');
  shownStars = done;
  $('count').textContent = done + ' / ' + total + ' yıldız';
  $('bar').style.width = done / total * 100 + '%';
  $('pins').replaceChildren(...ports.map(([x,y], i) => {
    const button = document.createElement('button');
    const index = round() * islands.length + i;
    button.className = 'pin ' + (index < done ? 'done ' : '') + (i === selected ? 'active' : '');
    button.style.left = x * 100 + '%'; button.style.top = y * 100 + '%';
    button.style.setProperty('--i', i);
    button.textContent = i + 2;
    const locked = index > done;
    if (index < done) button.insertAdjacentHTML('beforeend', '<span class="pin-star" aria-hidden="true">★</span>');
    if (locked) {
      button.classList.add('locked');
      button.dataset.cue = '';
      button.setAttribute('aria-disabled', 'true');
      button.insertAdjacentHTML('beforeend', '<span class="pin-lock" aria-hidden="true">🔒</span>');
    }
    button.title = islands[i] + ' · ' + (i+2) + ' çarpım tablosu' + (locked ? ' · Kilitli' : '');
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', selected === i);
    button.onclick = () => {
      if (locked) {
        playCue('oops');
        fx.bump(button, 'denied');
        mapHint('🔒 Önce ' + islands[done % islands.length] + ' adasını tamamla');
        return;
      }
      selected = i;
      render();
      openIsland();
    };
    return button;
  }));
  $('mission').innerHTML = '<div class="scene"><span class="scene-name">' + islands[selected] +
    '</span></div><span class="tag">Tur ' + (round()+1) + ' / ' + secondsPerRound.length + ' · Her soru ' +
    limit() + ' sn</span><h2>' + title() + '</h2>' + starRow(selected) +
    '<p>10 karışık işlemi art arda doğru çöz.</p>';
  const scene = $('mission').querySelector('.scene');
  scene.style.backgroundPosition = (selected % 3 * 50) + '% ' + (Math.floor(selected / 3) * 50) + '%';
  $('play').textContent = slot() === done ? (progress.attempt ? '▶  Kaldığın yerden devam et' : '▶  Adaya başla') : 'Keşif günlüğünü aç';
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
  $('stage').innerHTML = '<div class="eyebrow">' + (eyebrow || 'TUR ' + (round()+1) + ' / ' + secondsPerRound.length) +
    '</div><h2 id="gameTitle">' + heading + '</h2>' + body + '<button class="primary" id="next"></button>';
  $('next').textContent = action;
  if (cue) $('next').dataset.cue = cue;
  $('next').onclick = () => { if (cue) playCue(cue); handler(); };
  $('next').focus();
}
function brief() {
  const scene = '<div class="brief-scene" style="background-position:' + (selected % 3 * 50) + '% ' +
    (Math.floor(selected / 3) * 50) + '%"><span>' + islands[selected] + '</span></div>';
  const facts = '<ul class="facts"><li><b>10</b><span>soru</span></li><li><b>' + limit() +
    '</b><span>sn / soru</span></li><li><b>' + starRow(selected) + '</b><span>tur yıldızları</span></li></ul>';
  screen(title(), scene + facts + '<p>Cevabını yazıp onayla. Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve bu adanın başından yeniden başlayacaksın.</p>',
    'Hazırım, başla', begin, { cue: 'start' });
}
function begin() {
  const fresh = Array.from({length:10}, (_,i) => i+1);
  for (let i = fresh.length-1; i>0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [fresh[i],fresh[j]] = [fresh[j],fresh[i]];
  }
  if (fresh.every((n,i) => n === deck[i])) [fresh[0],fresh[1]] = [fresh[1],fresh[0]];
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
function question() {
  stop();
  setMood('');
  entry = progress.attempt.entry;
  const a = selected+2, b = deck[answers.length];
  const labels = { Sil: '<span aria-hidden="true">⌫</span>', Onayla: '<span aria-hidden="true">✓</span> Onayla' };
  $('stage').innerHTML = '<div class="eyebrow">TUR ' + (round()+1) + ' · SORU ' +
    (answers.length+1) + ' / 10</div>' + dots(answers.length) + '<h2 id="gameTitle">' + title() +
    '</h2><div class="quiz"><div class="clock" id="clock" role="timer"><svg viewBox="0 0 44 44" aria-hidden="true">' +
    '<circle class="ring-track" cx="22" cy="22" r="19"/><circle class="ring" cx="22" cy="22" r="19" pathLength="100"/></svg>' +
    '<span><b id="secs">' + limit() + '</b> sn</span></div><h3 class="equation"><span>' + a + '</span><i>×</i><span>' + b +
    '</span><i>=</i><span id="value" class="slot">?</span></h3></div><div class="pad" id="keys">' +
    [1,2,3,4,5,6,7,8,9,'Sil',0,'Onayla'].map(n => '<button data-k="' + n + '"' +
      (n === 'Sil' ? ' aria-label="Sil" class="erase"' : n === 'Onayla' ? ' class="ok"' : '') + '>' +
      (labels[n] || n) + '</button>').join('') + '</div>';
  $('keys').onclick = e => { const button = e.target.closest('button'); if (button) key(button.dataset.k); };
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
  const a = selected+2, b = deck[answers.length], product = a*b;
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
      '<p>Her grupta '+a+' tane var. '+b+' grup toplam '+product+' eder. Hazır olduğunda aynı adayı yeniden dene.</p>',
      'Tekrar dene', begin, { mood: 'bad', cue: 'start' });
    return;
  }
  const last = answers[answers.length - 1];
  if (answers.length < 10) {
    playCue('correct');
    Object.assign(progress.attempt, { entry: '', remaining: limit()*1000 });
    save();
    screen('Doğru! ' + praise[Math.floor(Math.random() * praise.length)], dots(answers.length) + equation +
      '<p class="speed"><span aria-hidden="true">⚡</span> ' + duration(last.seconds) + '’de çözdün · ' +
      (10 - answers.length) + ' soru kaldı</p>', 'Sonraki soru', question, { mood: 'good' });
    fx.burst($('stage').querySelector('.equation'));
    return;
  }
  delete progress.attempt;
  const previousRound = round();
  progress.reports[slot()] = answers;
  progress.completed++;
  save();
  selected = Math.min(progress.completed,total-1) % islands.length;
  render();
  const victory = progress.completed === total;
  const message = victory ? 'Dokuz adanın hepsini dört turda tamamladın. Son turda her işlemi 3 saniye içinde çözdün.' :
    previousRound !== round() ? 'Dokuz adayı tamamladın. Şimdi 2 tablosuna dönüyorsun. Bu turda her soru için '+limit()+' saniyen var.' :
    'On işlemi tek denemede doğru çözdün. Sırada '+title()+' var.';
  const finished = (progress.completed - 1) % islands.length;
  playCue(victory ? 'victory' : 'island');
  screen(victory?'Çarpım ustası!':'Ada tamamlandı!', '<div class="trophy" aria-hidden="true"><span>' +
    (victory ? '🏆' : '⭐') + '</span></div>' + dots(10) + '<p class="trophy-stars">' + islands[finished] + ' ' +
    starRow(finished) + '</p><p>'+message+'</p>' +
    (storageFailed?'<p>İlerlemen yalnızca bu oturumda saklanabildi.</p>':''),
    victory?'Haritaya dön':'Devam et', victory ? ()=>$('game').close() : brief,
    { mood: 'win', eyebrow: '+1 YILDIZ · ' + progress.completed + ' / ' + total });
  fx.confetti($('game'), { count: victory ? 220 : 140, duration: victory ? 4500 : 3200 });
  fx.burst($('stage').querySelector('.trophy'), { count: 14, spread: 110 });
}
function journal() {
  const reports = secondsPerRound.map((s,r) => {
    const rows = progress.reports[r*islands.length+selected];
    if (!rows) return '';
    return '<details '+(r===round()?'open':'')+'><summary>Tur '+(r+1)+' · '+s+' sn</summary><ul>'+
      rows.map(x=>'<li>'+x.a+' × '+x.b+' = '+x.a*x.b+' · '+
        (x.answer===null?'Süre doldu':x.answer===x.a*x.b?'Doğru':'Cevabın '+x.answer)+' · '+x.seconds+' sn</li>').join('')+'</ul></details>';
  }).join('');
  screen(title(), '<p class="trophy-stars">' + islands[selected] + ' ' + starRow(selected) + '</p>' + reports,
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
