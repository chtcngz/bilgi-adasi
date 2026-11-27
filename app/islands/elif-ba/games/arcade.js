// The other games of an islet's game step: the child picks one of them or the step's own Harf Yağmuru,
// balloons (listening.js) in game.js's picker, and whichever is played to the end passes the step. Each game
// (yengec.js, kabuk.js, olta.js, sepet.js) registers itself here and draws its own scene on the stage; this
// file gives them the rest: the top bar (hearts, the speaker, the score and a slot for every turn), the turtle
// that says what to find, the countdown, the start, pause and result cards, the game clock and the record.
//
// A game is a "target" game (the turtle says an item of the plan, the child finds it: right() / wrong()) or a
// "free" one, which runs its own turns and calls piece() for each one done and finish() at the end.
// A registered game: { id, name, icon, title, flow: 'target' | 'free', hearts, turns, intro(kind) and say(kind)
// (the start card's text and its spoken form), first (the prompt of the first turn), and the hooks it needs:
// build(api) once per opening, reset(api) for every new game, play(api) after the countdown, target(api, item)
// for every new item to find, tick(api, dt) every frame while it plays, halt(api) when it ends, listen(api)
// for the speaker button of a free game, stars(api) and resultText(stars) for a free game's stars and the words
// under them, sample(api) for the start card's art, plan(api) for its own turns, speak(item, note, end) for its own
// way of saying an item, extend(kind, id) for items of its own beside the kind's }.
const elifArcade = (() => {
  const { heart: heartSvg, speaker: speakerSvg, star: starPath } = elifArt;
  const voice = elifVoice;
  const dialog = $('elif-arcade');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const HEARTS = 3;
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
  const chord = [1, 1.26, 1.5];
  const games = {};
  const pick = items => items[Math.floor(Math.random() * items.length)];
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  dialog.innerHTML = '<div class="rain-scene arc-scene">' +
    '<div class="arc-stage"></div>' +
    '<p class="rain-prompt" aria-hidden="true"></p>' +
    '<div class="rain-turtle arc-turtle" aria-hidden="true"><div class="rain-turtle-body">' + elifArt.turtle('arc') + '</div>' +
      '<div class="rain-bubble">' + speakerSvg + '<span></span></div></div>' +
    '<div class="rain-hud">' +
      '<div class="rain-left"><button type="button" class="rain-close btn-round" aria-label="Oyundan çık"></button>' +
      '<span class="rain-hearts" role="img"></span></div>' +
      '<button type="button" class="rain-listen" data-cue aria-label="Tekrar dinle">' + speakerSvg + '</button>' +
      '<div class="rain-score"><small>Puan</small><b>0</b></div>' +
      '<ol class="rain-slots" aria-label="Oyunun sıraları"></ol>' +
    '</div>' +
    '<div class="rain-toast" aria-hidden="true"></div>' +
    '<div class="rain-count" aria-hidden="true"></div>' +
    '<div class="rain-overlay" hidden></div>' +
    '<p class="rain-live" role="status"></p>' +
  '</div>';
  const find = selector => dialog.querySelector(selector);
  const scene = find('.arc-scene');
  const stage = find('.arc-stage');
  const hud = find('.rain-hud');
  const turtle = find('.arc-turtle');
  const bubble = find('.rain-bubble');
  const listenButton = find('.rain-listen');
  const heartBox = find('.rain-hearts');
  const slotBox = find('.rain-slots');
  const scoreBox = find('.rain-score b');
  const prompt = find('.rain-prompt');
  const toast = find('.rain-toast');
  const counter = find('.rain-count');
  const overlay = find('.rain-overlay');
  const live = find('.rain-live');

  let options = null, mode = null, kind = null, game = null, state = 'idle', rounds = 0, followUp = null;
  let talkToken = 0, talking = false, lastTalk = -9, moodTimer = 0, promptToken = 0, pendingDone = null;
  // The voice writes its "no Turkish voice here" note into this; the turtle's bubble then shows the name.
  const unheard = {};
  const glyph = (item, text = kind.text(item)) => '<b lang="ar" dir="rtl">' + text + '</b>';

  /* ---------- Game clock ---------- */
  // Everything that moves or waits runs on this clock, so a paused game stands still.
  let clock = 0, last = 0, frameId = 0, paused = false, timers = [], session = 0;
  function after(seconds, fn) { const mine = session; timers.push({ at: clock + seconds, fn: () => { if (mine === session) fn(); } }); }
  function frame(now) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (paused) return;
    clock += dt;
    for (let i = 0; i < timers.length; i++) {
      if (timers[i].at > clock) continue;
      timers.splice(i--, 1)[0].fn();
    }
    if (state !== 'play') return;
    if (mode.flow === 'target' && !talking && !game.listening && clock - lastTalk > 7) narrate();
    mode.tick?.(api, dt);
  }
  function startClock() {
    if (frameId) return;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }
  function stopClock() { cancelAnimationFrame(frameId); frameId = 0; }

  /* ---------- Layout ---------- */
  // The stage starts under the top bar: --ceil is its height, for the games' scenes and the prompt.
  function measure() {
    if (!scene.clientWidth) return;
    scene.style.setProperty('--ceil', hud.offsetTop + hud.offsetHeight + 'px');
    if (state !== 'idle') mode?.resize?.(api);
  }
  const watch = new ResizeObserver(() => { if (dialog.open) measure(); });
  watch.observe(scene);
  watch.observe(hud);

  /* ---------- Turns ---------- */
  // The newest cove's items, each of them in about the same number of turns (a letter's syllables share
  // its turns). The turns go in rounds: every letter once a round, in a new order each time, and two other
  // letters always come before a letter comes again.
  function plan(items, recent, count) {
    let fresh = recent.filter(i => items.includes(i));
    if (!fresh.length) fresh = items;
    const groups = new Map();
    for (const i of fresh) groups.set(kind.letter(i), [...(groups.get(kind.letter(i)) || []), i]);
    const keys = [...groups.keys()];
    const laps = Math.ceil(count / keys.length);
    const turns = new Map(keys.map(g => {
      const own = groups.get(g);
      const list = Array.from({ length: laps }, (_, n) => own[n % own.length]);
      let mixed = shuffled(list);
      for (let tries = 0; tries < 60 && mixed.some((x, n) => n && x === mixed[n - 1]); tries++) mixed = shuffled(list);
      return [g, mixed];
    }));
    const gap = Math.min(2, keys.length - 1);
    const order = [];
    for (let lap = 0; lap < laps; lap++) {
      const tooSoon = round => round.some((g, n) => order.slice(order.length - gap + n).includes(g));
      let round = shuffled(keys);
      for (let tries = 0; tries < 200 && order.length && tooSoon(round); tries++) round = shuffled(keys);
      order.push(...round);
    }
    return order.slice(0, count).map(g => turns.get(g).pop());
  }
  // Something else to show beside the item being played: never one that sounds the same, the one shown last
  // as rarely as can be, and, once a few turns are done, often one of the items most easily mixed up with it.
  function distractor(target, avoid = []) {
    const others = options.letters.filter(i => kind.sound(i) !== kind.sound(target));
    const fresh = others.filter(i => !avoid.includes(i));
    const choices = fresh.length ? fresh : others;
    const alike = kind.alike(target).filter(i => choices.includes(i));
    if (alike.length && game.done >= kind.alikeFrom && Math.random() < kind.alikeChance) return pick(alike);
    return pick(choices.length ? choices : [target]);
  }

  /* ---------- Top bar ---------- */
  function drawHearts() {
    heartBox.hidden = !mode.hearts;
    heartBox.innerHTML = Array.from({ length: HEARTS }, () => '<i class="rain-heart">' + heartSvg + '</i>').join('');
    heartBox.setAttribute('aria-label', HEARTS + ' can');
  }
  function loseHeart() {
    game.hearts--;
    heartBox.children[game.hearts]?.classList.add('lost');
    heartBox.setAttribute('aria-label', game.hearts + ' can');
  }
  function drawSlots() {
    slotBox.innerHTML = Array.from({ length: game.turns }, () => '<li></li>').join('');
    slotBox.style.setProperty('--cols', game.turns > 12 ? Math.ceil(game.turns / 2) : game.turns);
  }
  function markSlot() {
    Array.from(slotBox.children).forEach((slot, n) => slot.classList.toggle('now', n === game.step));
  }
  function addScore(points) {
    game.score += points;
    scoreBox.textContent = game.score;
    if (points) fx.bump(scoreBox.parentNode, 'rain-bump');
  }
  function setPrompt(text, seconds) {
    const mine = ++promptToken;
    prompt.textContent = text;
    if (seconds) after(seconds, () => { if (mine === promptToken) prompt.textContent = ''; });
  }
  const say = text => { live.textContent = text; };
  function mood(name, ms) {
    clearTimeout(moodTimer);
    turtle.classList.remove('happy', 'sad', 'dance');
    if (!name) return;
    void turtle.offsetWidth;
    turtle.classList.add(name);
    if (ms) moodTimer = setTimeout(() => turtle.classList.remove(name), ms);
  }
  function showToast(word, extra) {
    toast.innerHTML = '<b>' + word + '</b>' + (extra ? '<small>' + extra + '</small>' : '');
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  }

  /* ---------- The turtle's voice ---------- */
  function talk(on, name = '') {
    talking = on;
    turtle.classList.toggle('talk', on);
    listenButton.classList.toggle('talk', on);
    bubble.lastChild.textContent = name;
    bubble.classList.toggle('named', !!name);
    bubble.classList.toggle('on', on || !!name);
  }
  function hush() {
    talkToken++;
    voice.stop();
    talk(false);
  }
  // Says the item being played (or, with `item`, another one); `onDone` waits for the end of the saying.
  function narrate(onDone, item = game.target) {
    if (onDone) pendingDone = onDone;
    const token = ++talkToken;
    lastTalk = clock;
    talk(true);
    let over = false;
    const end = heard => {
      if (over || token !== talkToken) return;
      over = true;
      talk(false, heard === false ? kind.name(item) : '');
      const done = pendingDone;
      pendingDone = null;
      done?.();
    };
    (mode.speak || kind.speak)(item, unheard, end);
    // Some phones never report the end of a clip: the game goes on all the same.
    after(4, () => end(true));
  }
  listenButton.onclick = () => {
    if (state !== 'play') return;
    if (mode.flow === 'target') narrate(); else mode.listen?.(api);
  };

  /* ---------- Effects ---------- */
  function centre(el) {
    const box = el.getBoundingClientRect(), base = scene.getBoundingClientRect();
    return { x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top };
  }
  function sparkle(at, spread = 90) {
    if (calm.matches) return;
    const holder = document.createElement('span');
    holder.className = 'rain-fx';
    holder.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
    holder.innerHTML = '<i class="flash"></i>';
    scene.append(holder);
    fx.burst(holder, { count: 12, symbols: ['★', '✦', '●', '✧'], spread });
    setTimeout(() => holder.remove(), 1200);
  }
  function floatPoints(text, at) {
    const tag = document.createElement('span');
    tag.className = 'rain-points';
    tag.textContent = text;
    tag.style.left = Math.max(36, Math.min(scene.clientWidth - 44, at.x + 30)) + 'px';
    tag.style.top = at.y - 30 + 'px';
    scene.append(tag);
    setTimeout(() => tag.remove(), 1000);
  }
  // The item found flies up into its slot.
  function fly(item, at, index, text = kind.text(item)) {
    const slot = slotBox.children[index];
    const mine = session;
    let landed = false;
    const tone = index % 5;
    const land = () => {
      if (landed || mine !== session || !slot?.isConnected) return;
      landed = true;
      slot.className = 'got t' + tone;
      slot.innerHTML = glyph(item, text);
      playCue('key', { gain: 0.45 });
    };
    if (calm.matches || !slot) return land();
    const to = slot.getBoundingClientRect(), base = scene.getBoundingClientRect();
    const x = to.left + to.width / 2 - base.left, y = to.top + to.height / 2 - base.top;
    const piece = document.createElement('b');
    piece.className = 'rain-fly';
    piece.lang = 'ar';
    piece.dir = 'rtl';
    piece.textContent = text;
    scene.append(piece);
    const move = (px, py, scale) => ({ transform: 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px) translate(-50%,-50%) scale(' + scale.toFixed(2) + ')' });
    piece.animate([move(at.x, at.y, 1), { ...move((at.x + x) / 2 + (at.x < x ? -46 : 46), (at.y + y) / 2, 1.05), offset: 0.45 }, move(x, y, 0.4)],
      { duration: 680, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).onfinish = () => { piece.remove(); land(); };
    setTimeout(() => { piece.remove(); land(); }, 1200);
  }

  /* ---------- A game ---------- */
  function reset() {
    session++;
    timers = [];
    paused = false;
    pendingDone = null;
    hush();
    for (const node of scene.querySelectorAll('.rain-fly, .rain-fx, .rain-points')) node.remove();
    dialog.querySelector('.fx-confetti')?.remove();
    counter.classList.remove('show');
    toast.classList.remove('show');
    prompt.textContent = '';
  }
  function newGame(withIntro) {
    reset();
    game = { plan: [], step: 0, target: null, done: 0, completed: [], hearts: HEARTS, score: 0, streak: 0, misses: 0,
      listening: true, first: ++rounds === 1, saved: false, turns: 0 };
    game.plan = mode.plan ? mode.plan(api) : plan(options.letters, options.recent, mode.turns);
    game.turns = mode.flow === 'target' ? game.plan.length : mode.turns;
    drawHearts();
    drawSlots();
    addScore(0);
    state = 'ready';
    measure();
    scene.classList.remove('clear', 'gloom');
    mood(null);
    mode.reset?.(api);
    if (withIntro) intro(); else countdown();
  }
  function countdown() {
    state = 'countdown';
    hideCard();
    startClock();
    const show = (text, cue, go) => {
      counter.textContent = text;
      counter.classList.toggle('go', !!go);
      counter.classList.remove('show');
      void counter.offsetWidth;
      counter.classList.add('show');
      playCue(cue);
    };
    show('3', 'tick-3');
    after(0.7, () => show('2', 'tick-2'));
    after(1.4, () => show('1', 'tick-1'));
    after(2.1, () => {
      show('Başla!', 'start', true);
      state = 'play';
      mode.play?.(api);
      if (mode.flow === 'target') nextTarget(0.8);
    });
  }
  // The next item to find takes over at once; a wrong tap is forgiven until the turtle has said it.
  function nextTarget(delay) {
    game.target = game.plan[game.step];
    game.listening = true;
    markSlot();
    mode.target?.(api, game.target);
    after(delay, () => {
      if (state !== 'play') return;
      if (game.first && !game.done) setPrompt(mode.first);
      else setPrompt('🔊', 1.6);
      narrate(() => { game.listening = false; });
    });
  }
  // The item being played was found: points (more for a streak), praise, and the next one.
  function right(at, text) {
    if (state !== 'play') return;
    const item = game.target;
    game.done++;
    game.streak++;
    game.completed.push(item);
    pendingDone = null;
    hush();
    const points = Math.round(100 * Math.min(2, 1 + 0.1 * (game.streak - 1)) / 10) * 10;
    addScore(points);
    playCue('pop', { rate: chord[(game.streak - 1) % chord.length] });
    after(0.12, () => playCue('correct', { gain: 0.8 }));
    if (at) { sparkle(at); floatPoints('+' + points, at); fly(item, at, game.step, text); }
    showToast(pick(praise), game.streak >= 5 ? '🔥 ' + game.streak + ' seri' : '');
    mood('happy', 1000);
    setPrompt('');
    say(kind.name(item) + ' tamam!');
    game.step++;
    if (game.step === game.plan.length) finish(); else nextTarget(0.9);
  }
  // A wrong one: before the turtle has said the item it only wobbles (false comes back); after, a heart breaks.
  function wrong(name) {
    if (state !== 'play') return false;
    if (game.listening) return false;
    game.streak = 0;
    playCue('oops');
    mood('sad', 850);
    if (!mode.hearts) { game.misses++; return true; }
    loseHeart();
    if (!game.hearts) {
      say('Bu ' + name + '. Canların bitti.');
      lose();
      return true;
    }
    say('Bu ' + name + '. ' + game.hearts + ' can kaldı.');
    after(0.9, () => { if (state === 'play' && mode.flow === 'target') narrate(); });
    return true;
  }
  // A free game's turn done: the item goes into its slot.
  function piece(item, at, text) {
    if (state !== 'play') return;
    game.done++;
    game.streak++;
    game.completed.push(item);
    const points = Math.round(100 * Math.min(2, 1 + 0.1 * (game.streak - 1)) / 10) * 10;
    addScore(points);
    playCue('correct', { gain: 0.8 });
    if (at) { sparkle(at); floatPoints('+' + points, at); fly(item, at, game.step, text); }
    showToast(pick(praise), game.streak >= 4 ? '🔥 ' + game.streak + ' seri' : '');
    mood('happy', 1000);
    game.step++;
    markSlot();
  }
  function miss() {
    game.streak = 0;
    game.misses++;
  }

  /* ---------- The end of a game ---------- */
  function later(ms, fn) {
    const mine = session;
    setTimeout(() => { if (mine === session) fn(); }, ms);
  }
  const starsOf = () => mode.hearts ? game.hearts : mode.stars ? mode.stars(api) : 3;
  // The best score is kept once per game: at its end, or when the child leaves it early; the stars only
  // when the game was played to the end.
  function keep(finished) {
    if (!game || game.saved || !game.score) return;
    game.saved = true;
    options.onResult({ score: game.score, stars: finished ? starsOf() : 0, finished: !!finished });
  }
  function countUp(total, score) {
    const start = performance.now(), mine = session;
    const step = now => {
      if (mine !== session) return;
      const t = Math.min(1, (now - start) / 900);
      total.textContent = Math.round(score * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const recordLine = (record, best) => record ? '<p class="rain-record new">🏆 Yeni rekor!</p>' :
    best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '';
  function finish() {
    if (state !== 'play') return;
    state = 'won';
    setPrompt('');
    hush();
    mode.halt?.(api);
    scene.classList.add('clear');
    const whole = starsOf() === 3;
    mood('dance');
    playCue(whole ? 'victory' : 'island');
    fx.confetti(dialog, whole ? undefined : { count: 70 });
    say(whole ? 'Mükemmel! Oyun tamamlandı.' : 'Oyun tamamlandı.');
    after(1.7, result);
  }
  function result() {
    state = 'result';
    stopClock();
    const stars = starsOf();
    const whole = stars === 3;
    const best = { ...options.best() };
    keep(true);
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const text = mode.hearts ? (whole ? 'Hiç can kaybetmeden oyunu bitirdin!' : 'Oyunu bitirdin ama ' + (HEARTS - stars) +
      ' can kaybettin. Üç yıldız için bir dahaki sefere hiç can kaybetmeden bitirmeyi dene!') :
      mode.resultText(stars);
    const next = options.next?.();
    const unique = [...new Set(game.completed)];
    showCard('<div class="rain-card result"><div class="rain-stars" role="img" aria-label="' + stars + ' yıldız">' + [0, 1, 2].map(n =>
      '<svg viewBox="0 0 24 24" aria-hidden="true"' + (n < stars ? ' class="won" style="--d:' + (0.35 + n * 0.3) + 's"' : '') +
      '><path d="' + starPath + '"/></svg>').join('') + '</div>' +
      '<h2 id="rain-title" tabindex="-1">' + (whole ? 'Mükemmel!' : 'Oyun tamamlandı!') + '</h2><p>' + text + '</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' + recordLine(record, best) +
      '<div class="rain-recap"><p>Bulduklarına dokun, dinle</p><div>' + unique.map((i, n) =>
        '<button type="button" class="rain-chip t' + n % 5 + '" data-cue data-n="' + n + '" aria-label="' + kind.name(i) + ' dinle">' +
        glyph(i) + '<span>' + kind.name(i) + '</span></button>').join('') + '</div></div>' +
      '<div class="rain-actions">' + (next ? '<button type="button" class="rain-go rain-next" data-cue>▶ Devam: ' + next.label + '</button>' +
        '<button type="button" class="rain-back rain-again">↻ Tekrar oyna</button>' :
        '<button type="button" class="rain-go rain-again" data-cue>↻ Tekrar oyna</button><button type="button" class="rain-back">Adaya dön</button>') +
      '</div></div>');
    overlay.querySelector('.rain-again').onclick = () => newGame(false);
    if (next) overlay.querySelector('.rain-next').onclick = () => { followUp = next.go; dialog.close(); };
    else overlay.querySelector('.rain-back').onclick = () => dialog.close();
    for (const chip of overlay.querySelectorAll('.rain-chip')) {
      chip.onclick = () => { fx.bump(chip, 'rain-bump'); (mode.speak || kind.speak)(unique[Number(chip.dataset.n)], unheard); };
    }
    for (let n = 0; n < stars; n++) later(350 + n * 300, () => playCue('star', { rate: chord[n] }));
    countUp(overlay.querySelector('.rain-total b'), game.score);
  }
  // Hearts gone: a short look at the game just played, then it starts again by itself.
  const RESTART = 4.5;
  function lose() {
    state = 'lost';
    pendingDone = null;
    hush();
    setPrompt('');
    mode.halt?.(api);
    scene.classList.add('gloom');
    after(0.4, () => { mood('sad'); playCue('retry'); });
    after(1.4, over);
  }
  function over() {
    state = 'over';
    const best = { ...options.best() };
    keep(false);
    const record = game.score > 0 && game.score > (best.rekor || 0);
    showCard('<div class="rain-card over"><div class="rain-broken" aria-hidden="true">' + heartSvg + '</div>' +
      '<h2 id="rain-title" tabindex="-1">Canların bitti!</h2><p>' + game.done + ' / ' + game.plan.length + ' buldun. Oyun baştan başlıyor!</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' + recordLine(record, best) +
      '<div class="rain-restart" aria-hidden="true"><i style="animation-duration:' + RESTART + 's"></i></div>' +
      '<div class="rain-actions"><button type="button" class="rain-go" data-cue>▶ Hemen başla</button>' +
      '<button type="button" class="rain-back">Adaya dön</button></div></div>');
    overlay.querySelector('.rain-go').onclick = () => newGame(false);
    overlay.querySelector('.rain-back').onclick = () => dialog.close();
    after(RESTART, () => { if (state === 'over') newGame(false); });
    countUp(overlay.querySelector('.rain-total b'), game.score);
  }

  /* ---------- Cards ---------- */
  function showCard(html) {
    overlay.innerHTML = html;
    overlay.hidden = false;
    overlay.scrollTop = 0;
    overlay.querySelector('h2')?.focus({ preventScroll: true });
  }
  function hideCard() {
    overlay.hidden = true;
    overlay.innerHTML = '';
  }
  function intro() {
    state = 'intro';
    const best = options.best();
    const pool = options.letters.filter(i => !kind.decoy?.(i));
    showCard('<div class="rain-card intro"><div class="arc-intro-art" aria-hidden="true">' + (mode.sample?.(api) || '') + '</div>' +
      '<h2 id="rain-title" tabindex="-1">' + mode.title + '</h2><p>' + mode.intro(options.kind) + '</p>' +
      '<ul class="rain-facts"><li><b>' + game.turns + '</b><span>' + (mode.flow === 'free' ? 'çift' : 'tur') + '</span></li>' +
      '<li><b>' + new Set(pool.map(kind.letter)).size + '</b><span>harf</span></li>' +
      '<li><b>' + (mode.hearts ? '3' : '∞') + '</b><span>can</span></li></ul>' +
      '<div class="rain-pool" aria-label="Oyundaki harfler">' + pool.map(i => '<b lang="ar" title="' + kind.name(i) + '">' + kind.text(i) + '</b>').join('') + '</div>' +
      (best.tamam ? '<p class="rain-record">✅ Bu oyunu üç yıldızla bitirdin · 🏆 ' + best.rekor + ' puan</p>' :
        best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      '<button type="button" class="rain-go" data-cue>▶ Başla</button></div>');
    const tell = document.createElement('button');
    tell.type = 'button';
    tell.className = 'rain-tell';
    tell.setAttribute('aria-label', 'Oyunu anlat');
    tell.innerHTML = '<span aria-hidden="true">🐢💬</span>';
    tell.onclick = () => voice.instruct(mode.say(options.kind));
    overlay.querySelector('.rain-card').prepend(tell);
    overlay.querySelector('.rain-go').onclick = () => { voice.stop(); countdown(); };
  }
  function pause() {
    if (paused || !['countdown', 'play'].includes(state)) return;
    paused = true;
    if (talking) pendingDone ||= () => {};
    hush();
    showCard('<div class="rain-card pause"><div class="rain-pause" aria-hidden="true"><i></i><i></i></div><h2 id="rain-title" tabindex="-1">Mola</h2>' +
      '<p>Oyun duraklatıldı. Hazır olunca kaldığın yerden devam et.</p><div class="rain-actions">' +
      '<button type="button" class="rain-go" data-cue>▶ Devam et</button><button type="button" class="rain-back">Oyundan çık</button></div></div>');
    overlay.querySelector('.rain-go').onclick = resume;
    overlay.querySelector('.rain-back').onclick = () => dialog.close();
  }
  function resume() {
    hideCard();
    paused = false;
    last = performance.now();
    if (state === 'play' && mode.flow === 'target') narrate(game.listening ? () => { game.listening = false; } : undefined);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && dialog.open) pause(); });

  find('.rain-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    keep(false);
    reset();
    stopClock();
    hideCard();
    mood(null);
    mode?.halt?.(api);
    state = 'idle';
    const done = options?.onClose;
    const then = followUp;
    followUp = null;
    options = null;
    game = null;
    done?.();
    then?.();
  });

  // What a game sees of the shell.
  const api = {
    stage, scene, calm, after, pick, shuffled, distractor, centre, sparkle, floatPoints, glyph, narrate, hush, say, setPrompt, mood,
    right, wrong, piece, miss, finish, plan,
    get kind() { return kind; },
    get options() { return options; },
    get game() { return game; },
    get clock() { return clock; },
    get playing() { return state === 'play' && !paused; },
    get talking() { return talking; },
    unheard
  };

  return {
    register(entry) { games[entry.id] = entry; },
    // The games' names and icons, for game.js's picker.
    list: () => Object.values(games).map(({ id, name, icon }) => ({ id, name, icon })),
    // What is being played now (for checking the games in a test browser).
    now: () => game && { state, target: game.target, step: game.step, done: game.done, hearts: game.hearts, name: game.target === null ? '' : kind.name(game.target) },
    // game: a registered game's id; kind: harf, hece, sekil, cezm or tenvin (games/kinds.js); letters: the
    // items learned up to this cove; recent: the cove's own, asked most; best(): the player's { rekor, yildiz,
    // tamam } in this game; onResult({ score, stars, finished }) keeps them; next(): optional, { label, go } of
    // the step after the game; onClose().
    open(settings) {
      options = { ...settings, letters: [...new Set([...settings.letters, ...settings.recent])] };
      mode = games[settings.game];
      kind = elifKinds[settings.kind] || elifKinds.harf;
      if (mode.extend) kind = mode.extend(kind, settings.kind);
      rounds = 0;
      scene.dataset.game = mode.id;
      scene.dataset.kind = settings.kind;
      dialog.setAttribute('aria-label', mode.name);
      stage.replaceChildren();
      mode.build?.(api);
      kind.preload(options.letters);
      if (!dialog.open) dialog.showModal();
      newGame(true);
    }
  };
})();
