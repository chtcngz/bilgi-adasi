// Harf Yağmuru: Elif Ba Adası's listening game. Letters the child has learned rain from the
// clouds without a pause. The turtle says one of them; popping three drops of that letter
// brings the next one at once, and every ten letters make a level: a rainbow and a little
// faster rain, all without the rain stopping. A wrong tap breaks one of three hearts; when
// all three are gone the game starts again from the first level.
const harfYagmuru = (() => {
  const { glyphs, names } = elifData;
  const voice = elifVoice;
  const dialog = $('elif-rain');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const LEVEL = 10; // letters in a level
  const POPS = 3; // drops of a letter to pop before the next letter
  const HEARTS = 3;
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
  // Letters on one skeleton, told apart only by their dots: later turns rain them together.
  const families = [[1, 2, 3], [4, 5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
  const twins = i => (families.find(f => f.includes(i)) || []).filter(j => j !== i);
  // The three pops of a letter climb a major chord.
  const chord = [1, 1.26, 1.5];
  // Drops take 7.6 s to fall at first and a little less with every letter done, never under 3.6 s.
  const fallTime = done => 3.6 + 4 * Math.exp(-done / 16);
  const spawnGap = done => 0.8 + 0.55 * Math.exp(-done / 16);
  const clamp01 = n => Math.min(1, Math.max(0, n));
  const pick = items => items[Math.floor(Math.random() * items.length)];
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const glyph = i => '<b lang="ar" dir="rtl">' + glyphs[i] + '</b>';
  // The voice writes its "no Turkish voice here" note into this; the turtle's bubble shows
  // the letter's name instead, so the game can still be played by reading.
  const unheard = {};

  /* ---------- Artwork ---------- */
  const heartSvg = '<svg viewBox="0 0 32 30" aria-hidden="true">' +
    '<path class="ghost" d="M16 7C14.4 3.2 11.6 1.5 8.6 1.5 4.4 1.5 1.5 4.6 1.5 8.8 1.5 15.6 8.6 21.8 16 28.2 23.4 21.8 30.5 15.6 30.5 8.8 30.5 4.6 27.6 1.5 23.4 1.5 20.4 1.5 17.6 3.2 16 7Z"/>' +
    '<path class="half l" d="M16 7C14.4 3.2 11.6 1.5 8.6 1.5 4.4 1.5 1.5 4.6 1.5 8.8 1.5 15.6 8.6 21.8 16 28.2L14 21 17.4 15 14.2 10Z"/>' +
    '<path class="half r" d="M16 7C17.6 3.2 20.4 1.5 23.4 1.5 27.6 1.5 30.5 4.6 30.5 8.8 30.5 15.6 23.4 21.8 16 28.2L14 21 17.4 15 14.2 10Z"/>' +
    '<ellipse class="shine" cx="8.6" cy="8" rx="3.3" ry="2" transform="rotate(-35 8.6 8)"/></svg>';
  const speakerSvg = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 19h8l11-9v28l-11-9H7z" fill="currentColor" ' +
    'stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><g fill="none" stroke="currentColor" stroke-width="3.6" ' +
    'stroke-linecap="round"><path class="arc" d="M32 18.5c2.6 3 2.6 8 0 11"/><path class="arc" d="M36.5 13.5c5.2 5.8 5.2 15.2 0 21"/>' +
    '<path class="arc" d="M41 8.5c7.8 8.5 7.8 22.5 0 31"/></g></svg>';
  const starPath = 'M12 2.6l2.8 5.9 6.5.8-4.8 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.8-4.5 6.5-.8z';
  // The island's turtle, in the yellow scarf it wears on the cove's picture.
  function turtleSvg() {
    const hex = (cx, cy, r) => 'M' + Array.from({ length: 6 }, (_, k) => {
      const a = Math.PI / 3 * k - Math.PI / 2;
      return (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }).join('L') + 'Z';
    let scutes = '';
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) scutes += hex(48 + col * 27 + (row % 2) * 13.5, 50 + row * 23.4, 13.4);
    }
    const dome = 'M62 128C62 66 96 46 122 46 150 46 176 74 176 128Z';
    return '<svg viewBox="0 0 180 150" aria-hidden="true"><defs>' +
      '<linearGradient id="rain-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a9d5a"/><stop offset="1" stop-color="#22764a"/></linearGradient>' +
      '<radialGradient id="rain-scute" cx=".35" cy=".25" r=".9"><stop offset="0" stop-color="#86d895"/><stop offset="1" stop-color="#4aac66"/></radialGradient>' +
      '<radialGradient id="rain-skin" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d9f7c4"/><stop offset=".65" stop-color="#a9e090"/><stop offset="1" stop-color="#8dcf77"/></radialGradient>' +
      '<clipPath id="rain-dome"><path d="' + dome + '"/></clipPath></defs>' +
      '<path d="' + dome + '" fill="url(#rain-shell)"/>' +
      '<path d="' + scutes + '" fill="url(#rain-scute)" clip-path="url(#rain-dome)"/>' +
      '<ellipse cx="114" cy="61" rx="24" ry="8" fill="#fff" opacity=".25" transform="rotate(-16 114 61)"/>' +
      '<path d="M62 128C62 66 96 46 122 46 150 46 176 74 176 128" fill="none" stroke="#1b6a3e" stroke-width="3"/>' +
      '<ellipse cx="74" cy="117" rx="27" ry="18" fill="url(#rain-skin)"/>' +
      '<g class="flipper"><path d="M42 104C26 102 11 90 6 74 5 67 11 64 16 68 24 79 35 88 50 94Z" fill="url(#rain-skin)" stroke="#6db558" stroke-width="2"/>' +
      '<ellipse cx="20" cy="80" rx="3" ry="2" fill="#86c96e"/><ellipse cx="31" cy="90" rx="2.5" ry="1.8" fill="#86c96e"/></g>' +
      '<path d="M40 100C54 116 88 118 102 102L104 112C90 128 52 126 38 110Z" fill="#f7c948" stroke="#e0a630" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M62 114 82 115 72 133Z" fill="#f2b636" stroke="#e0a630" stroke-width="2" stroke-linejoin="round"/>' +
      '<ellipse cx="56" cy="78" rx="34" ry="29" fill="url(#rain-skin)" stroke="#6db558" stroke-width="2"/>' +
      '<g fill="#86c96e" opacity=".8"><ellipse cx="52" cy="56" rx="6" ry="4"/><ellipse cx="66" cy="54" rx="4" ry="3"/>' +
      '<ellipse cx="40" cy="60" rx="3.5" ry="2.5"/><ellipse cx="75" cy="62" rx="3" ry="2.2"/></g>' +
      '<g class="eyes"><ellipse cx="44" cy="76" rx="9.5" ry="11" fill="#fff"/><ellipse cx="68" cy="75" rx="9" ry="10.5" fill="#fff"/>' +
      '<ellipse cx="43" cy="77.5" rx="7.4" ry="8.6" fill="#5b3418"/><ellipse cx="67" cy="76.5" rx="7" ry="8.2" fill="#5b3418"/>' +
      '<ellipse cx="43" cy="78" rx="4.2" ry="5" fill="#1d120a"/><ellipse cx="67" cy="77" rx="4" ry="4.8" fill="#1d120a"/>' +
      '<circle cx="40" cy="74" r="2.8" fill="#fff"/><circle cx="64" cy="73" r="2.6" fill="#fff"/>' +
      '<circle cx="45.5" cy="81.5" r="1.3" fill="#fff"/><circle cx="69.5" cy="80.5" r="1.2" fill="#fff"/></g>' +
      '<g class="glad" fill="none" stroke="#3a2414" stroke-width="3.5" stroke-linecap="round"><path d="M37 79Q44 70 51 79"/><path d="M61 78Q68 69 75 78"/></g>' +
      '<g fill="#ff9a8b" opacity=".6"><ellipse cx="33" cy="90" rx="6.5" ry="4"/><ellipse cx="80" cy="89" rx="6" ry="3.8"/></g>' +
      '<g class="mouth"><path d="M48 89Q56 101 64 89 56 92 48 89Z" fill="#7c2d2a"/><ellipse cx="56" cy="95.4" rx="4" ry="2.1" fill="#f07b7b"/></g>' +
      '<path class="frown" d="M49 97Q56 91 63 97" fill="none" stroke="#7c2d2a" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  /* ---------- Scene ---------- */
  dialog.innerHTML = '<div class="rain-scene">' +
    '<div class="rain-sky" aria-hidden="true"><i class="rain-sun"></i><i class="rain-rainbow"></i><i class="rain-far one"></i>' +
      '<i class="rain-far two"></i><i class="rain-isle"></i><i class="rain-streaks"></i></div>' +
    '<p class="rain-prompt" aria-hidden="true"></p>' +
    '<div class="rain-field" data-cue></div>' +
    '<div class="rain-sea" aria-hidden="true"><i class="rain-wave back"></i><i class="rain-wave mid"></i>' +
      '<div class="rain-turtle"><div class="rain-turtle-body">' + turtleSvg() + '</div>' +
      '<div class="rain-bubble">' + speakerSvg + '<span></span></div></div><i class="rain-wave front"></i></div>' +
    '<div class="rain-ceiling" aria-hidden="true"><i></i></div>' +
    '<div class="rain-hud">' +
      '<div class="rain-left"><button type="button" class="rain-close" aria-label="Oyundan çık">×</button>' +
      '<span class="rain-hearts" role="img"></span></div>' +
      '<button type="button" class="rain-listen" data-cue aria-label="Harfi tekrar dinle">' + speakerSvg + '</button>' +
      '<div class="rain-score"><small>Puan</small><b>0</b></div>' +
      '<div class="rain-track"><span class="rain-level" role="img"><b>1</b></span><ol class="rain-slots" aria-label="Bu seviyenin harfleri"></ol></div>' +
    '</div>' +
    '<div class="rain-toast" aria-hidden="true"></div>' +
    '<div class="rain-count" aria-hidden="true"></div>' +
    '<div class="rain-overlay" hidden></div>' +
    '<p class="rain-live" role="status"></p>' +
  '</div>';
  const find = selector => dialog.querySelector(selector);
  const scene = find('.rain-scene');
  const field = find('.rain-field');
  const hud = find('.rain-hud');
  const turtle = find('.rain-turtle');
  const bubble = find('.rain-bubble');
  const listen = find('.rain-listen');
  const heartBox = find('.rain-hearts');
  const slotBox = find('.rain-slots');
  const levelBox = find('.rain-level');
  const scoreBox = find('.rain-score b');
  const prompt = find('.rain-prompt');
  const toast = find('.rain-toast');
  const counter = find('.rain-count');
  const overlay = find('.rain-overlay');
  const live = find('.rain-live');

  let options = null, game = null, state = 'idle', drops = [], rounds = 0;
  let width = 0, size = 80, laneX = [], spawnY = 0, surface = 0;
  let talkToken = 0, pendingDone = null, talking = false, lastTalk = -9, lastSplash = -9, moodTimer = 0, promptToken = 0;

  /* ---------- Game clock ---------- */
  // Everything that moves or waits runs on this clock, so a paused game stands still.
  let clock = 0, last = 0, frameId = 0, paused = false, timers = [], session = 0;
  function after(seconds, fn) { timers.push({ at: clock + seconds, fn }); }
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
    if (state === 'raining') {
      if (clock >= game.nextSpawn) spawn();
      // A reminder when the letter has not been heard for a while.
      if (!talking && !game.listening && clock - lastTalk > 7) narrate();
    }
    for (const drop of drops.slice()) fall(drop, dt);
  }
  function startClock() {
    if (frameId) return;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }
  function stopClock() { cancelAnimationFrame(frameId); frameId = 0; }

  /* ---------- Layout ---------- */
  // Drops fall in lanes from just under the clouds to the sea, sized to the screen.
  function measure() {
    width = scene.clientWidth;
    const height = scene.clientHeight;
    if (!width || !height) return;
    const seaHeight = Math.round(Math.max(88, Math.min(170, height * 0.2)));
    scene.style.setProperty('--sea', seaHeight + 'px');
    const top = hud.offsetTop + hud.offsetHeight;
    scene.style.setProperty('--ceil', top + 'px');
    surface = height - seaHeight + 10;
    const lanes = Math.max(3, Math.min(6, Math.round(width / 104)));
    const pad = 8;
    size = Math.round(Math.max(54, Math.min(112, (width - 2 * pad) / (lanes * 1.12), (surface - top) / 3.4)));
    scene.style.setProperty('--drop', size + 'px');
    laneX = Array.from({ length: lanes }, (_, k) => pad + (k + 0.5) * (width - 2 * pad) / lanes);
    spawnY = top + 16 - size;
    for (const drop of drops) {
      drop.lane = Math.min(drop.lane, lanes - 1);
      drop.x = laneX[drop.lane];
      place(drop);
    }
  }
  const watch = new ResizeObserver(() => { if (dialog.open) measure(); });
  watch.observe(scene);
  watch.observe(hud);

  /* ---------- HUD ---------- */
  function drawHearts() {
    heartBox.innerHTML = Array.from({ length: HEARTS }, () => '<i class="rain-heart">' + heartSvg + '</i>').join('');
    heartBox.setAttribute('aria-label', HEARTS + ' can');
  }
  function loseHeart() {
    game.hearts--;
    heartBox.children[game.hearts]?.classList.add('lost');
    heartBox.setAttribute('aria-label', game.hearts + ' can');
  }
  function drawSlots() {
    slotBox.innerHTML = Array.from({ length: LEVEL }, () => '<li></li>').join('');
  }
  // The letter being played: its slot fills in thirds, one for each drop popped.
  function markSlot() {
    Array.from(slotBox.children).forEach((slot, n) => {
      slot.classList.toggle('now', n === game.step);
      if (n === game.step) slot.style.setProperty('--fill', 0);
    });
  }
  function drawLevel(bump) {
    levelBox.firstChild.textContent = game.level;
    levelBox.setAttribute('aria-label', 'Seviye ' + game.level);
    if (bump) fx.bump(levelBox, 'rain-bump');
  }
  function addScore(points) {
    game.score += points;
    scoreBox.textContent = game.score;
    if (points) fx.bump(scoreBox.parentNode, 'rain-bump');
  }
  // A hint above the rain; `seconds` takes it away again unless another one came meanwhile.
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
    listen.classList.toggle('talk', on);
    bubble.lastChild.textContent = name;
    bubble.classList.toggle('named', !!name);
    bubble.classList.toggle('on', on || !!name);
  }
  function hush() {
    talkToken++;
    voice.stop();
    talk(false);
  }
  // Say the letter being played. `onDone` waits for the end of the saying, and a replay asked
  // for meanwhile keeps it waiting instead of losing it.
  function narrate(onDone) {
    if (onDone) pendingDone = onDone;
    const token = ++talkToken;
    lastTalk = clock;
    talk(true);
    let over = false;
    const end = heard => {
      if (over || token !== talkToken) return;
      over = true;
      talk(false, heard === false ? names[game.target] : '');
      const done = pendingDone;
      pendingDone = null;
      done?.();
    };
    voice.letter(game.target, unheard, end);
    after(3.5, () => end(false)); // the voice never reported back: carry on, and show the name
  }
  listen.onclick = () => {
    if (paused || state !== 'raining' || (talking && clock - lastTalk < 0.5)) return;
    narrate();
  };

  /* ---------- A game ---------- */
  // Ten letters for a level: each of the newest cove's letters, then the earlier ones for review
  // (every learned letter while there are no more than ten), never one letter twice in a row.
  function plan(letters, recent, before) {
    const fresh = recent.filter(i => letters.includes(i));
    const list = [...shuffled(fresh), ...shuffled(letters.filter(i => !fresh.includes(i)))].slice(0, LEVEL);
    let bag = [];
    while (list.length < LEVEL) {
      if (!bag.length) bag = shuffled([...letters, ...fresh]);
      list.push(bag.pop());
    }
    const repeats = order => order[0] === before || order.some((x, n) => n > 0 && x === order[n - 1]);
    let order = shuffled(list);
    for (let tries = 0; tries < 80 && repeats(order); tries++) order = shuffled(list);
    return order;
  }
  function reset() {
    session++;
    timers = [];
    paused = false;
    pendingDone = null;
    hush();
    drops = [];
    field.replaceChildren();
    for (const node of scene.querySelectorAll('.rain-fly, .rain-fx, .rain-points')) node.remove();
    dialog.querySelector('.fx-confetti')?.remove();
    counter.classList.remove('show');
    toast.classList.remove('show');
    prompt.textContent = '';
  }
  function newGame(withIntro) {
    reset();
    game = {
      plan: plan(options.letters, options.recent, -1), step: 0, level: 1, target: null, pops: 0,
      done: 0, popped: 0, completed: [], hearts: HEARTS, score: 0, streak: 0, listening: true, first: ++rounds === 1,
      nextSpawn: 0, sinceTarget: 2, lastLane: -1, lastLetter: -1, lastTone: -1, retalk: false, saved: false
    };
    drawHearts();
    drawSlots();
    drawLevel();
    addScore(0);
    measure();
    scene.classList.remove('bow', 'gloom', 'raining');
    mood(null);
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
      // From here on it rains without a pause until the game ends.
      state = 'raining';
      scene.classList.add('raining');
      game.nextSpawn = clock;
      nextLetter(0.8, true); // the turtle speaks once the "Başla!" chime has rung out
    });
  }
  // The next letter takes over at once, so drops of it can already be on their way, but a
  // wrong tap is forgiven until the turtle has said it.
  function nextLetter(delay, mark) {
    game.target = game.plan[game.step];
    game.pops = 0;
    game.listening = true;
    game.sinceTarget = 2; // the next drop is this letter
    if (mark) markSlot();
    after(delay, () => {
      if (state !== 'raining') return;
      if (game.first && !game.done) setPrompt('👆 Duyduğun harften 3 tane patlat');
      else setPrompt('🔊 Yeni harf', 1.8);
      say('Yeni harf. Dinle.');
      narrate(() => { game.listening = false; });
    });
  }

  /* ---------- Rain ---------- */
  function freeLane() {
    const blocked = new Set(drops.filter(d => d.y < spawnY + size * 1.35).map(d => d.lane));
    const all = laneX.map((_, k) => k).filter(k => !blocked.has(k));
    const spread = all.filter(k => k !== game.lastLane);
    return spread.length ? pick(spread) : all.length ? all[0] : -1;
  }
  // The letter being played is never more than two drops away, and up to three of it fall at once.
  function wantTarget() {
    const falling = drops.filter(d => d.letter === game.target && d.state === 'fall').length;
    if (falling >= POPS) return false;
    if (game.sinceTarget >= 2) return true;
    return Math.random() < (falling ? 0.38 : 0.6);
  }
  function distractor() {
    const others = options.letters.filter(i => i !== game.target);
    const fresh = others.filter(i => i !== game.lastLetter);
    const choices = fresh.length ? fresh : others;
    // Look-alike letters (the same shape, other dots) join in once a few letters are done.
    const alike = twins(game.target).filter(i => choices.includes(i));
    if (alike.length && game.done >= 3 && Math.random() < 0.3) return pick(alike);
    return pick(choices);
  }
  function spawn() {
    const lane = freeLane();
    if (lane < 0) { game.nextSpawn = clock + 0.12; return; }
    const target = wantTarget();
    const letter = target ? game.target : distractor();
    let tone;
    do tone = Math.floor(Math.random() * 5); while (tone === game.lastTone);
    const el = document.createElement('button');
    el.type = 'button';
    el.tabIndex = -1;
    el.className = 'rain-drop t' + tone;
    el.setAttribute('aria-label', names[letter]);
    el.innerHTML = '<span class="rain-drop-in"><i class="rain-drop-skin"></i>' + glyph(letter) + '</span>';
    const drop = { el, inner: el.firstChild, letter, lane, tone, x: laneX[lane], y: spawnY, dx: 0, fall: fallTime(game.done),
      phase: Math.random() * 6.3, wobble: 0.9 + Math.random() * 0.6, state: 'fall' };
    el.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      tap(drop);
    });
    field.append(el);
    drops.push(drop);
    place(drop);
    if (!calm.matches) drop.inner.animate([{ transform: 'scale(.55, .75)' }, { transform: 'none' }],
      { duration: 380, easing: 'cubic-bezier(.2, 1.5, .4, 1)' });
    game.lastLane = lane;
    game.lastLetter = letter;
    game.lastTone = tone;
    if (target) game.sinceTarget = 0; else game.sinceTarget++;
    game.nextSpawn = clock + spawnGap(game.done) * (0.85 + Math.random() * 0.3);
  }
  function place(drop) {
    const still = calm.matches;
    drop.dx = still ? 0 : Math.sin(drop.phase * drop.wobble) * Math.min(9, size * 0.1);
    const tilt = still ? 0 : Math.cos(drop.phase * drop.wobble) * 5;
    drop.el.style.transform = 'translate3d(' + (drop.x - size / 2 + drop.dx).toFixed(1) + 'px,' + drop.y.toFixed(1) +
      'px,0) rotate(' + tilt.toFixed(1) + 'deg)';
  }
  function fall(drop, dt) {
    if (drop.state === 'caught') return; // waits in the air for its turn to pop
    // A wrongly tapped letter hurries into the sea.
    drop.y += (surface - spawnY) / drop.fall * dt * (drop.state === 'wrong' ? 2.6 : 1);
    drop.phase += dt;
    place(drop);
    if (drop.y + size * 0.92 >= surface) splash(drop);
  }
  function vanish(drop, how) {
    const el = drop.el;
    drops = drops.filter(d => d !== drop);
    el.style.pointerEvents = 'none';
    if (calm.matches) { el.remove(); return; }
    const motion = {
      sink: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(24%) scale(1.3, .4)', opacity: 0 }],
      fade: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-14%) scale(.5)', opacity: 0 }],
      pop: [{ transform: 'none', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }]
    }[how];
    drop.inner.animate(motion, { duration: how === 'fade' ? 380 : 250, easing: how === 'pop' ? 'ease-out' : 'ease-in', fill: 'forwards' })
      .onfinish = () => el.remove();
    setTimeout(() => el.remove(), 900); // if the animation is cut short
  }
  function splash(drop) {
    const missed = drop.letter === game.target && drop.state === 'fall';
    drop.state = 'gone';
    vanish(drop, 'sink');
    if (!calm.matches) {
      const ring = document.createElement('span');
      ring.className = 'rain-splash';
      ring.style.transform = 'translate(' + (drop.x + drop.dx).toFixed(0) + 'px,' + surface + 'px)';
      ring.innerHTML = '<i class="ring"></i><i class="ring late"></i>' + Array.from({ length: 6 }, (_, k) =>
        '<i style="--dx:' + ((k - 2.5) * (8 + Math.random() * 6)).toFixed(0) + 'px;--dy:' + (-16 - Math.random() * 22).toFixed(0) + 'px"></i>').join('');
      field.append(ring);
      setTimeout(() => ring.remove(), 800);
    }
    if (clock - lastSplash > 0.2) {
      lastSplash = clock;
      playCue('splash', { gain: talking ? 0.3 : 0.6, rate: 0.85 + Math.random() * 0.3, ambient: true });
    }
    // The letter got away: say it again, unless it was just said.
    if (missed && state === 'raining' && !game.listening && clock - lastTalk > 2.5) narrate();
  }

  /* ---------- Taps ---------- */
  function tap(drop) {
    if (paused || state !== 'raining' || drop.state !== 'fall') return;
    if (drop.letter === game.target) popDrop(drop);
    else if (game.listening) forgive(drop);
    else wrong(drop);
  }
  const centre = drop => {
    const box = drop.el.getBoundingClientRect(), base = scene.getBoundingClientRect();
    return { x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top };
  };
  function popDrop(drop) {
    drop.state = 'caught';
    const at = centre(drop);
    game.pops++;
    game.popped++;
    game.streak++;
    // 50 points, up to 30 more for popping it high, and up to double for a long streak.
    const high = 1 - clamp01((drop.y - spawnY) / (surface - spawnY));
    const points = Math.round((50 + 30 * high) * Math.min(2, 1 + 0.1 * (game.streak - 1)) / 10) * 10;
    addScore(points);
    playCue('pop', { rate: chord[game.pops - 1] });
    sparkle(at);
    floatPoints('+' + points, at);
    fly(drop, at, game.step, game.pops);
    vanish(drop, 'pop');
    if (game.pops < POPS) {
      mood('happy', 700);
      say(names[drop.letter] + '. ' + game.pops + ' / ' + POPS);
      narrate(); // the turtle says it again: one more of the same letter
      return;
    }
    completeLetter(drop.letter);
  }
  // Three popped: the drops of this letter still in the air pop by themselves, and the next
  // letter follows while the rain goes on.
  function completeLetter(letter) {
    game.done++;
    game.completed.push(letter);
    pendingDone = null;
    hush();
    addScore(100);
    after(0.12, () => playCue('correct', { gain: 0.8 }));
    drops.filter(d => d.letter === letter && d.state === 'fall').forEach((drop, n) => {
      drop.state = 'caught';
      after(0.18 + n * 0.11, () => chainPop(drop));
    });
    showToast(pick(praise), game.streak >= 5 ? '🔥 ' + game.streak + ' seri' : '');
    mood('happy', 1000);
    setPrompt('');
    say(names[letter] + ' tamam!');
    game.step++;
    if (game.step === LEVEL) levelUp(); else nextLetter(0.75, true);
  }
  function chainPop(drop) {
    if (!drop.el.isConnected) return;
    const at = centre(drop);
    addScore(20);
    playCue('pop', { rate: 2, gain: 0.45 });
    sparkle(at);
    floatPoints('+20', at);
    vanish(drop, 'pop');
  }
  // Ten letters done: the rain goes on, a little faster, under a rainbow.
  function levelUp() {
    game.level++;
    game.step = 0;
    game.plan = plan(options.letters, options.recent, game.completed[game.completed.length - 1]);
    const bonus = 250 * (game.level - 1);
    addScore(bonus);
    showToast('Seviye ' + game.level + '!', '+' + bonus + ' puan');
    say('Seviye ' + game.level + '!');
    playCue('island');
    mood('dance', 1900);
    scene.classList.add('bow');
    after(4, () => scene.classList.remove('bow'));
    fx.confetti(dialog, { count: 70, duration: 2400 });
    // The last letter is still flying to its slot; the new row comes after it lands.
    after(1, () => { drawSlots(); drawLevel(true); markSlot(); });
    nextLetter(1.9, false);
  }
  // Before the turtle has said the new letter, a wrong tap only wobbles the drop.
  function forgive(drop) {
    if (!calm.matches) drop.inner.animate([{ transform: 'none' }, { transform: 'rotate(-10deg)' },
      { transform: 'rotate(8deg)' }, { transform: 'none' }], { duration: 360 });
  }
  function wrong(drop) {
    drop.state = 'wrong';
    drop.el.classList.add('wrong');
    drop.el.style.pointerEvents = 'none';
    drop.inner.insertAdjacentHTML('beforeend', '<em class="rain-tag">' + names[drop.letter] + '</em>');
    if (!calm.matches) drop.inner.animate([{ transform: 'none' }, { transform: 'translateX(-9px) rotate(-7deg)' },
      { transform: 'translateX(8px) rotate(6deg)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 420 });
    game.streak = 0;
    loseHeart();
    playCue('oops');
    mood('sad', 850);
    if (!game.hearts) {
      say('Bu ' + names[drop.letter] + '. Canların bitti.');
      lose();
      return;
    }
    say('Bu ' + names[drop.letter] + '. ' + game.hearts + ' can kaldı.');
    after(0.65, () => { if (state === 'raining') narrate(); });
  }

  /* ---------- Effects ---------- */
  function sparkle(at) {
    if (calm.matches) return;
    const holder = document.createElement('span');
    holder.className = 'rain-fx';
    holder.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
    holder.innerHTML = '<i class="flash"></i>';
    scene.append(holder);
    fx.burst(holder, { count: 12, symbols: ['★', '✦', '●', '✧'], spread: size * 1.1 });
    setTimeout(() => holder.remove(), 1200);
  }
  function floatPoints(text, at) {
    const tag = document.createElement('span');
    tag.className = 'rain-points';
    tag.textContent = text;
    tag.style.left = Math.max(36, Math.min(width - 44, at.x + size * 0.35)) + 'px';
    tag.style.top = at.y - size * 0.4 + 'px';
    scene.append(tag);
    setTimeout(() => tag.remove(), 1000);
  }
  // The popped letter flies up to its slot: the first two fill a third each, the third the slot.
  function fly(drop, at, index, stage) {
    const slot = slotBox.children[index];
    const mine = session;
    let landed = false;
    const land = () => {
      if (landed || mine !== session || !slot?.isConnected) return;
      landed = true;
      if (stage < POPS) {
        slot.style.setProperty('--fill', Math.max(stage, Number(slot.style.getPropertyValue('--fill')) || 0));
        fx.bump(slot, 'tick');
      } else {
        slot.className = 'got t' + drop.tone;
        slot.innerHTML = glyph(drop.letter);
      }
      playCue('key', { gain: 0.45 });
    };
    if (calm.matches || !slot) return land();
    const to = slot.getBoundingClientRect(), base = scene.getBoundingClientRect();
    const x = to.left + to.width / 2 - base.left, y = to.top + to.height / 2 - base.top;
    const piece = document.createElement('b');
    piece.className = 'rain-fly';
    piece.lang = 'ar';
    piece.dir = 'rtl';
    piece.textContent = glyphs[drop.letter];
    scene.append(piece);
    const end = Math.max(0.2, to.width / (size * 0.8));
    const move = (px, py, scale) => ({ transform: 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px) translate(-50%,-50%) scale(' + scale.toFixed(2) + ')' });
    piece.animate([move(at.x, at.y, 1), { ...move((at.x + x) / 2 + (at.x < x ? -46 : 46), (at.y + y) / 2, 1.05), offset: 0.45 }, move(x, y, end)],
      { duration: 680, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).onfinish = () => { piece.remove(); land(); };
    setTimeout(() => { piece.remove(); land(); }, 1200);
  }

  /* ---------- Hearts gone: start again ---------- */
  function lose() {
    state = 'lost';
    pendingDone = null;
    hush();
    setPrompt('');
    scene.classList.remove('raining', 'bow');
    scene.classList.add('gloom');
    after(0.4, () => {
      mood('sad');
      playCue('retry');
      for (const drop of drops.slice()) { drop.state = 'gone'; vanish(drop, 'fade'); }
    });
    after(1.4, over);
  }
  // Best score and level are kept once per game: at its end, or when the child leaves early.
  function keep() {
    if (!game || game.saved || (!game.score && game.level === 1)) return;
    game.saved = true;
    options.onResult({ score: game.score, level: game.level });
  }
  // A short look at the game just played, then it starts again from the first level by itself;
  // "Hemen başla" does not wait, "Adaya dön" leaves.
  const RESTART = 4.5;
  function over() {
    state = 'over';
    const best = { ...options.best() };
    keep();
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const { done } = game;
    const text = (done ? done + ' harfi tamamladın. ' : 'Sesi dikkatle dinle, sonra o harften üç tane patlat. ') +
      'Oyun baştan başlıyor!';
    showCard('<div class="rain-card over"><div class="rain-medal" role="img" aria-label="Seviye ' + game.level + '"><span>' +
      '<small>Seviye</small><b>' + game.level + '</b></span></div>' +
      '<h2 id="rain-title" tabindex="-1">Canların bitti!</h2><p>' + text + '</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' +
      (record ? '<p class="rain-record new">🏆 Yeni rekor!</p>' : best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      '<div class="rain-restart" aria-hidden="true"><i style="animation-duration:' + RESTART + 's"></i></div>' +
      '<div class="rain-actions"><button type="button" class="rain-go" data-cue>▶ Hemen başla</button>' +
      '<button type="button" class="rain-back">Adaya dön</button></div></div>');
    overlay.querySelector('.rain-go').onclick = () => newGame(false);
    overlay.querySelector('.rain-back').onclick = () => dialog.close();
    after(RESTART, () => { if (state === 'over') newGame(false); });
    const total = overlay.querySelector('.rain-total b');
    const score = game.score, start = performance.now(), mine = session;
    const count = now => {
      if (mine !== session) return;
      const t = Math.min(1, (now - start) / 900);
      total.textContent = Math.round(score * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
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
    const sample = shuffled(options.letters).slice(0, 3);
    showCard('<div class="rain-card intro"><div class="rain-intro-art" aria-hidden="true">' + sample.map((i, n) =>
      '<span class="rain-drop t' + [0, 4, 1][n] + '"><span class="rain-drop-in"><i class="rain-drop-skin"></i>' + glyph(i) + '</span></span>').join('') +
      '</div><h2 id="rain-title" tabindex="-1">Harf <em>Yağmuru</em></h2>' +
      '<p>Yağmur hiç durmuyor! Kaplumbağa bir harfin adını söyleyecek: o harften üç tane patlat, kaplumbağa hemen yeni harfi söylesin. ' +
      'Yanlış harfe dokunursan bir canın gider; üçü de biterse oyun baştan başlar.</p>' +
      '<ul class="rain-facts"><li><b>' + options.letters.length + '</b><span>öğrendiğin harf</span></li><li><b>3</b><span>her harften patlat</span></li>' +
      '<li><b>3</b><span>can</span></li></ul>' +
      '<div class="rain-pool" aria-label="Oyundaki harfler">' + options.letters.map(i => '<b lang="ar" title="' + names[i] + '">' + glyphs[i] + '</b>').join('') + '</div>' +
      (best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan · Seviye ' + Math.max(1, best.seviye || 1) + '</p>' : '') +
      '<button type="button" class="rain-go" data-cue>▶ Başla</button></div>');
    overlay.querySelector('.rain-go').onclick = countdown;
  }
  // Leaving the app mid-game pauses it; the child picks up where they were.
  function pause() {
    if (paused || !['countdown', 'raining'].includes(state)) return;
    paused = true;
    if (talking) game.retalk = true;
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
    if (game.retalk || pendingDone) { game.retalk = false; narrate(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && dialog.open) pause(); });

  find('.rain-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    keep();
    reset();
    stopClock();
    hideCard();
    mood(null);
    state = 'idle';
    const done = options?.onClose;
    options = null;
    game = null;
    done?.();
  });

  // letters: learned letters to rain; recent: the newest cove's letters, asked more often;
  // best(): the player's { rekor, seviye }; onResult({ score, level }) keeps them.
  function open(settings) {
    options = settings;
    rounds = 0;
    voice.preload(settings.letters, true);
    if (!dialog.open) dialog.showModal();
    newGame(true);
  }
  return { open };
})();
