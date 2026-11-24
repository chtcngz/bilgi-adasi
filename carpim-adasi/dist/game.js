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
function render() {
  const done = progress.completed;
  $('stars').textContent = '⭐ ' + done + ' yıldız';
  $('count').textContent = done + ' / ' + total + ' yıldız';
  $('bar').style.width = done / total * 100 + '%';
  $('pins').replaceChildren(...ports.map(([x,y], i) => {
    const button = document.createElement('button');
    const index = round() * islands.length + i;
    button.className = 'pin ' + (index < done ? 'done ' : '') + (i === selected ? 'active' : '');
    button.style.left = x * 100 + '%'; button.style.top = y * 100 + '%';
    button.textContent = i + 2;
    button.title = islands[i] + ' · ' + (i+2) + ' çarpım tablosu';
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', selected === i);
    button.disabled = index > done;
    button.onclick = () => { selected = i; render(); };
    return button;
  }));
  $('mission').innerHTML = '<div class="scene"></div><span class="tag">Tur ' +
    (round()+1) + ' / ' + secondsPerRound.length + ' · Her soru ' + limit() + ' sn</span><h2>' + title() +
    '</h2><p>' + islands[selected] + ' · 10 karışık işlemi art arda doğru çöz.</p>';
  const scene = $('mission').querySelector('.scene');
  scene.style.backgroundPosition = (selected % 3 * 50) + '% ' + (Math.floor(selected / 3) * 50) + '%';
  $('play').textContent = slot() === done ? (progress.attempt ? '▶  Kaldığın yerden devam et' : '▶  Adaya başla') : 'Keşif günlüğünü aç';
  $('play').onclick = () => {
    $('game').showModal();
    if (slot() !== done) journal();
    else if (progress.attempt) resumeAttempt();
    else brief();
  };
}
function stop() { playing = false; clearInterval(timer); }
function screen(heading, body, action, handler) {
  stop();
  $('stage').innerHTML = '<div class="eyebrow">TUR ' + (round()+1) + ' / ' + secondsPerRound.length + '</div><h2 id="gameTitle">' +
    heading + '</h2>' + body + '<button class="primary" id="next"></button>';
  $('next').textContent = action;
  $('next').onclick = handler;
  $('next').focus();
}
function brief() {
  screen(title(), '<p>Her soruda ' + limit() + ' saniyen var. Cevabını yazıp onayla. Yanlış cevapta veya süre dolduğunda doğru işlemi görecek ve bu adanın başından yeniden başlayacaksın.</p>',
    'Hazırım, başla', begin);
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
  entry = progress.attempt.entry;
  const a = selected+2, b = deck[answers.length];
  $('stage').innerHTML = '<div class="eyebrow">TUR ' + (round()+1) + ' · SORU ' +
    (answers.length+1) + ' / 10</div><h2 id="gameTitle">' + title() +
    '</h2><div class="clock">⏱ <span id="secs">' + limit() +
    '</span> sn</div><h3>' + a + ' × ' + b + ' = <span id="value">?</span></h3><div class="pad" id="keys">' +
    [1,2,3,4,5,6,7,8,9,'Sil',0,'Onayla'].map(n=>'<button>'+n+'</button>').join('')+'</div>';
  $('keys').onclick = e => { if (e.target.tagName === 'BUTTON') key(e.target.textContent); };
  $('gameTitle').tabIndex = -1;
  $('gameTitle').focus();
  $('value').textContent = entry || '?';
  playing = true;
  deadline = performance.now() + progress.attempt.remaining;
  let shown = Math.ceil(progress.attempt.remaining / 1000);
  $('secs').textContent = shown;
  if (shown <= 3) playCue('tick');
  timer = setInterval(() => {
    const left = Math.ceil((deadline-performance.now())/1000);
    if (left <= 0) return finish(true);
    if (left === shown) return;
    shown = left;
    $('secs').textContent = left;
    if (left <= 3) playCue('tick');
  }, 75);
}
function key(k) {
  if (!playing) return;
  if (performance.now() >= deadline) return finish(true);
  if (k === 'Onayla') { if (entry.length) finish(false); return; }
  playCue('tap');
  if (k === 'Sil') entry = entry.slice(0,-1);
  else if (/^\d$/.test(k) && entry.length<3) entry += k;
  $('value').textContent = entry || '?';
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
  const equation = '<h3>'+a+' × '+b+' = '+product+'</h3>';
  if (!correct) {
    delete progress.attempt;
    playCue('retry');
    progress.reports[slot()] = answers; save(); render();
    const groups = '<div class="groups" aria-hidden="true">' +
      Array.from({length:b}, () => '<span class="group">'+'●'.repeat(Math.min(5,a))+
      (a>5?'<br>'+'●'.repeat(a-5):'')+'</span>').join('')+'</div>';
    screen(timeout?'Ah, süre doldu!':'Ah, bu kez olmadı!', '<p class="answer-label">Doğru cevap</p>' + equation + groups +
      '<p>Her grupta '+a+' tane var. '+b+' grup toplam '+product+' eder. Hazır olduğunda aynı adayı yeniden dene.</p>',
      'Tekrar dene', begin);
    return;
  }
  playCue(answers.length === 10 ? 'island' : 'correct');
  if (answers.length < 10) {
    Object.assign(progress.attempt, { entry: '', remaining: limit()*1000 });
    save();
    screen('Doğru!', equation, 'Sonraki soru', question);
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
  screen(victory?'🏆 Çarpım ustası!':'⭐ Ada tamamlandı!', '<p>'+message+'</p>' +
    (storageFailed?'<p>İlerlemen yalnızca bu oturumda saklanabildi.</p>':''),
    victory?'Haritaya dön':'Devam et', victory ? ()=>$('game').close() : brief);
}
function journal() {
  const reports = secondsPerRound.map((s,r) => {
    const rows = progress.reports[r*islands.length+selected];
    if (!rows) return '';
    return '<details '+(r===round()?'open':'')+'><summary>Tur '+(r+1)+' · '+s+' sn</summary><ul>'+
      rows.map(x=>'<li>'+x.a+' × '+x.b+' = '+x.a*x.b+' · '+
        (x.answer===null?'Süre doldu':x.answer===x.a*x.b?'Doğru':'Cevabın '+x.answer)+' · '+x.seconds+' sn</li>').join('')+'</ul></details>';
  }).join('');
  screen(title(),reports,'Haritaya dön',()=>$('game').close());
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
$('game').addEventListener('cancel', pauseAttempt);
window.addEventListener('pagehide', pauseAttempt);
window.addEventListener('pageshow', e => {
  if (e.persisted && $('game').open && progress?.attempt && $('keys')) resumeAttempt();
});
