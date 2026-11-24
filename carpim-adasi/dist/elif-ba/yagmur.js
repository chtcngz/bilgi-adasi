// Harf Yağmuru: Elif Ba Adası's listening game. The turtle says a letter's name, letters rain
// from the clouds and the child taps that letter before it falls into the sea. A catch brings
// the next letter; a wrong tap costs one of three hearts. Ten catches end the round, and the
// hearts that are left become its stars. Only letters the child has already learned rain.
const harfYagmuru = (() => {
  const { glyphs, names } = elifData;
  const voice = elifVoice;
  const dialog = $('elif-rain');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const TURNS = 10;
  const HEARTS = 3;
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
  // Letters on one skeleton, told apart only by their dots: later turns rain them together.
  const families = [[1, 2, 3], [4, 5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
  const twins = i => (families.find(f => f.includes(i)) || []).filter(j => j !== i);
  // The catch sound climbs a pentatonic scale while a streak lasts.
  const climb = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  const lerp = (a, b, t) => a + (b - a) * t;
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
      '<ol class="rain-slots" aria-label="Yakalanan harfler"></ol>' +
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
  const scoreBox = find('.rain-score b');
  const prompt = find('.rain-prompt');
  const toast = find('.rain-toast');
  const counter = find('.rain-count');
  const overlay = find('.rain-overlay');
  const live = find('.rain-live');

  let options = null, game = null, state = 'idle', drops = [], rounds = 0;
  let width = 0, size = 80, laneX = [], spawnY = 0, surface = 0;
  let talkToken = 0, pendingDone = null, talking = false, lastTalk = -9, lastSplash = -9, moodTimer = 0;

  /* ---------- Game clock ---------- */
  // Everything that moves or waits runs on this clock, so a paused game stands still.
  let clock = 0, last = 0, frameId = 0, paused = false, timers = [], session = 0;
  function after(seconds, fn) { timers.push({ at: clock + seconds, fn }); }
  // Real time, for the result card, which plays on after the game clock has stopped.
  function later(ms, fn) {
    const mine = session;
    setTimeout(() => { if (mine === session) fn(); }, ms);
  }
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
    if (state === 'raining' && clock >= game.nextSpawn) spawn();
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
  function loseHeart(left) {
    heartBox.children[left]?.classList.add('lost');
    heartBox.setAttribute('aria-label', left + ' can');
  }
  function drawSlots() {
    slotBox.innerHTML = Array.from({ length: TURNS }, () => '<li></li>').join('');
  }
  function markSlot() {
    Array.from(slotBox.children).forEach((slot, n) => slot.classList.toggle('now', n === game.turn));
  }
  function setScore(value) {
    scoreBox.textContent = value;
    if (value) fx.bump(scoreBox.parentNode, 'rain-bump');
  }
  const setPrompt = text => { prompt.textContent = text; };
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
  // Say this turn's letter. `onDone` waits for the end of the saying (the rain starts then),
  // and a replay asked for meanwhile keeps it waiting instead of losing it.
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
    if (paused || !['speaking', 'raining'].includes(state) || (talking && clock - lastTalk < 0.5)) return;
    narrate();
  };

  /* ---------- A round ---------- */
  // Ten letters to catch: each of the newest cove's letters, then the earlier ones for review
  // (every learned letter while there are no more than ten), never one letter twice in a row.
  function plan(letters, recent) {
    const fresh = recent.filter(i => letters.includes(i));
    const list = [...shuffled(fresh), ...shuffled(letters.filter(i => !fresh.includes(i)))].slice(0, TURNS);
    let bag = [];
    while (list.length < TURNS) {
      if (!bag.length) bag = shuffled([...letters, ...fresh]);
      list.push(bag.pop());
    }
    let order = shuffled(list);
    for (let tries = 0; tries < 80 && order.some((x, n) => n > 0 && x === order[n - 1]); tries++) order = shuffled(list);
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
  }
  function newRound(withIntro) {
    reset();
    game = {
      plan: plan(options.letters, options.recent), turn: 0, target: null, round: ++rounds,
      hearts: HEARTS, score: 0, streak: 0, caught: [], fall: 7, gap: 1.4, nextSpawn: 0,
      spawned: 0, sinceTarget: 0, targetSeen: false, lastLane: -1, lastLetter: -1, lastTone: -1, retalk: false
    };
    drawHearts();
    drawSlots();
    setScore(0);
    measure();
    scene.classList.remove('clear', 'gloom', 'raining');
    mood(null);
    setPrompt('');
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
    after(2.1, () => { show('Başla!', 'start', true); scene.classList.add('raining'); });
    after(3, startTurn); // the turtle speaks once the "Başla!" chime has rung out
  }
  // Each turn gets a little faster: drops take 7.4 s to fall at first and 4.6 s at the end.
  function startTurn() {
    const t = game.turn / (TURNS - 1);
    game.target = game.plan[game.turn];
    game.fall = lerp(7.4, 4.6, t);
    game.gap = lerp(1.45, 0.95, t);
    game.spawned = 0;
    game.sinceTarget = 0;
    game.targetSeen = false;
    state = 'speaking';
    markSlot();
    setPrompt('🔊 Dinle…');
    say('Dinle.');
    narrate(() => after(0.25, startRain));
  }
  function startRain() {
    if (state !== 'speaking') return;
    state = 'raining';
    game.nextSpawn = clock;
    setPrompt(game.round === 1 && game.turn < 2 ? '👆 Duyduğun harfe dokun' : '');
  }

  /* ---------- Rain ---------- */
  function freeLane() {
    const blocked = new Set(drops.filter(d => d.y < spawnY + size * 1.35).map(d => d.lane));
    const all = laneX.map((_, k) => k).filter(k => !blocked.has(k));
    const spread = all.filter(k => k !== game.lastLane);
    return spread.length ? pick(spread) : all.length ? all[0] : -1;
  }
  // The letter that was said comes as the first or second drop, then at least every third
  // one, and never more than two of it fall at once.
  function wantTarget() {
    const falling = drops.filter(d => d.target && d.state === 'fall').length;
    if (falling >= 2) return false;
    if (!game.targetSeen) return game.spawned >= 1 || Math.random() < 0.5;
    if (!falling && game.sinceTarget >= 2) return true;
    return Math.random() < 0.3;
  }
  function distractor() {
    const others = options.letters.filter(i => i !== game.target);
    const fresh = others.filter(i => i !== game.lastLetter);
    const choices = fresh.length ? fresh : others;
    const alike = twins(game.target).filter(i => choices.includes(i));
    if (alike.length && game.turn >= 3 && Math.random() < 0.35) return pick(alike);
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
    const drop = { el, inner: el.firstChild, letter, lane, target, tone, x: laneX[lane], y: spawnY, dx: 0,
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
    game.spawned++;
    if (target) { game.targetSeen = true; game.sinceTarget = 0; } else game.sinceTarget++;
    game.nextSpawn = clock + game.gap * (0.85 + Math.random() * 0.3);
  }
  function place(drop) {
    const still = calm.matches;
    drop.dx = still ? 0 : Math.sin(drop.phase * drop.wobble) * Math.min(9, size * 0.1);
    const tilt = still ? 0 : Math.cos(drop.phase * drop.wobble) * 5;
    drop.el.style.transform = 'translate3d(' + (drop.x - size / 2 + drop.dx).toFixed(1) + 'px,' + drop.y.toFixed(1) +
      'px,0) rotate(' + tilt.toFixed(1) + 'deg)';
  }
  function fall(drop, dt) {
    // A wrongly tapped letter hurries into the sea.
    drop.y += (surface - spawnY) / game.fall * dt * (drop.state === 'wrong' ? 2.6 : 1);
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
    const missed = drop.target && drop.state === 'fall';
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
    if (missed && state === 'raining' && clock - lastTalk > 2.2) narrate();
  }

  /* ---------- Taps ---------- */
  function tap(drop) {
    if (paused || state !== 'raining' || drop.state !== 'fall') return;
    if (drop.letter === game.target) caught(drop); else wrong(drop);
  }
  function caught(drop) {
    state = 'caught';
    drop.state = 'caught';
    const box = drop.el.getBoundingClientRect(), base = scene.getBoundingClientRect();
    const at = { x: box.left + box.width / 2 - base.left, y: box.top + box.height / 2 - base.top };
    // 100 points, up to 60 more for catching it high, and up to double for a streak.
    game.streak++;
    const high = 1 - Math.min(1, Math.max(0, (drop.y - spawnY) / (surface - spawnY)));
    const points = Math.round((100 + 60 * high) * Math.min(2, 1 + 0.25 * (game.streak - 1)) / 10) * 10;
    game.score += points;
    game.caught.push(drop.letter);
    const slot = game.turn++;
    hush();
    playCue('pop', { rate: climb[Math.min(climb.length - 1, game.streak - 1)] });
    sparkle(at);
    floatPoints('+' + points, { x: Math.max(36, Math.min(width - 44, at.x + size * 0.35)), y: at.y - size * 0.4 });
    fly(drop, at, slot);
    vanish(drop, 'pop');
    for (const other of drops.slice()) { other.state = 'gone'; vanish(other, 'fade'); }
    showToast(pick(praise), game.streak >= 3 ? '🔥 ' + game.streak + ' seri' : '');
    mood('happy', 900);
    setPrompt('');
    setScore(game.score);
    say(names[drop.letter] + '. Doğru!');
    after(1.1, () => game.turn < TURNS ? startTurn() : win());
  }
  function wrong(drop) {
    drop.state = 'wrong';
    drop.el.classList.add('wrong');
    drop.el.style.pointerEvents = 'none';
    drop.inner.insertAdjacentHTML('beforeend', '<em class="rain-tag">' + names[drop.letter] + '</em>');
    if (!calm.matches) drop.inner.animate([{ transform: 'none' }, { transform: 'translateX(-9px) rotate(-7deg)' },
      { transform: 'translateX(8px) rotate(6deg)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 420 });
    game.streak = 0;
    game.hearts--;
    loseHeart(game.hearts);
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
    tag.style.left = at.x + 'px';
    tag.style.top = at.y + 'px';
    scene.append(tag);
    setTimeout(() => tag.remove(), 1000);
  }
  // The caught letter flies up into its place in the row of ten.
  function fly(drop, at, index) {
    const slot = slotBox.children[index];
    const mine = session;
    let landed = false;
    const fill = () => {
      if (landed || mine !== session || !slot) return;
      landed = true;
      slot.className = 'got t' + drop.tone;
      slot.innerHTML = glyph(drop.letter);
      playCue('key', { gain: 0.6 });
    };
    if (calm.matches || !slot) return fill();
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
      { duration: 680, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).onfinish = () => { piece.remove(); fill(); };
    setTimeout(() => { piece.remove(); fill(); }, 1200);
  }

  /* ---------- End of a round ---------- */
  function win() {
    state = 'won';
    scene.classList.remove('raining');
    scene.classList.add('clear');
    mood('dance');
    playCue('victory');
    fx.confetti(dialog);
    say('Harika! On harfin hepsini yakaladın.');
    after(1.6, () => result(true));
  }
  function lose() {
    state = 'lost';
    pendingDone = null;
    hush();
    setPrompt('');
    scene.classList.remove('raining');
    scene.classList.add('gloom');
    after(0.4, () => {
      mood('sad');
      playCue('retry');
      for (const drop of drops.slice()) { drop.state = 'gone'; vanish(drop, 'fade'); }
    });
    after(1.5, () => result(false));
  }
  function result(won) {
    state = 'result';
    stopClock();
    const stars = won ? game.hearts : 0;
    const best = options.best();
    const record = game.score > 0 && game.score > (best.rekor || 0);
    options.onResult({ score: game.score, stars, won });
    const heading = won ? ['Başardın!', 'Çok güzel!', 'Muhteşem!'][stars - 1] : 'Canların bitti!';
    let text;
    if (!won) {
      text = (game.caught.length ? game.caught.length + ' harf yakaladın. ' : '') + 'Sesi dikkatle dinle, sonra o harfe dokun. Bir daha deneyelim mi?';
    } else if (stars === 3) text = 'Hiç yanlış yapmadan on harfi de yakaladın!';
    else text = 'On harfi de yakaladın! ' + (HEARTS - stars === 1 ? 'Bir' : 'İki') + ' kez yanlış harfe dokundun. Şimdi üç yıldızı dene!';
    const unique = [...new Set(game.caught)];
    showCard('<div class="rain-card result' + (won ? '' : ' lost') + '">' +
      (won ? '<div class="rain-stars" role="img" aria-label="' + stars + ' yıldız">' + [0, 1, 2].map(n =>
        '<svg viewBox="0 0 24 24" aria-hidden="true"' + (n < stars ? ' class="won" style="--d:' + (0.35 + n * 0.3) + 's"' : '') +
        '><path d="' + starPath + '"/></svg>').join('') + '</div>' : '<div class="rain-broken" aria-hidden="true">' + heartSvg + '</div>') +
      '<h2 id="rain-title" tabindex="-1">' + heading + '</h2><p>' + text + '</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' +
      (record ? '<p class="rain-record new">🏆 Yeni rekor!</p>' : best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      (unique.length ? '<div class="rain-recap"><p>Yakaladığın harfler · dokun, dinle</p><div>' + unique.map((i, n) =>
        '<button type="button" class="rain-chip t' + n % 5 + '" data-cue data-letter="' + i + '" aria-label="' + names[i] + ' harfini dinle">' +
        glyph(i) + '<span>' + names[i] + '</span></button>').join('') + '</div></div>' : '') +
      '<div class="rain-actions"><button type="button" class="rain-go" data-cue>↻ Tekrar oyna</button>' +
      '<button type="button" class="rain-back">Adaya dön</button></div></div>');
    overlay.querySelector('.rain-go').onclick = () => newRound(false);
    overlay.querySelector('.rain-back').onclick = () => dialog.close();
    for (const chip of overlay.querySelectorAll('.rain-chip')) {
      chip.onclick = () => { fx.bump(chip, 'rain-bump'); voice.letter(Number(chip.dataset.letter), unheard); };
    }
    for (let n = 0; n < stars; n++) later(350 + n * 300, () => playCue('star', { rate: [1, 1.26, 1.5][n] }));
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
      '<p>Kaplumbağa bir harfin adını söyleyecek. Gökten yağan harflerden onu bul, denize düşmeden dokun!</p>' +
      '<ul class="rain-facts"><li><b>' + options.letters.length + '</b><span>öğrendiğin harf</span></li><li><b>3</b><span>can</span></li>' +
      '<li><b>10</b><span>harf yakala</span></li></ul>' +
      '<div class="rain-pool" aria-label="Oyundaki harfler">' + options.letters.map(i => '<b lang="ar" title="' + names[i] + '">' + glyphs[i] + '</b>').join('') + '</div>' +
      (best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      '<button type="button" class="rain-go" data-cue>▶ Başla</button></div>');
    overlay.querySelector('.rain-go').onclick = countdown;
  }
  // Leaving the app mid-round pauses the game; the child picks up where they were.
  function pause() {
    if (paused || !['countdown', 'speaking', 'raining', 'caught'].includes(state)) return;
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
  // best(): the player's { rekor, yildiz, tur }; onResult({ score, stars, won }) keeps them.
  function open(settings) {
    options = settings;
    rounds = 0;
    voice.preload(settings.letters, true);
    if (!dialog.open) dialog.showModal();
    newRound(true);
  }
  return { open };
})();
