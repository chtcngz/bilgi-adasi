// Harf Yağmuru and Hece Balonları: Elif Ba Adası's listening games. A section is fifteen letters
// (or syllables): the turtle says one, popping three drops (balloons) of it brings the next one at
// once, and the game does not stop until all 45 are popped. A wrong tap breaks one of three hearts.
// Finishing with all three hearts completes the section; losing all three starts it again.
// In Harf Yağmuru letters rain from the clouds into the sea; in Hece Balonları syllables with
// their harekes rise from the sea up into the clouds; in Şekil Yağmuru the letters rain in their
// joined shapes, each drop of a letter in another one (at the start, in the middle, at the end); in Cezm
// Balonları syllables with a cezm rise as balloons.
const elifListeningGame = (() => {
  const { glyphs, names, readings, harekeler, syllable, twins, shape, cezm, cezmReadings, cezmAlike } = elifData;
  const voice = elifVoice;
  const dialog = $('elif-rain');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ROUND = 15; // letters in a section
  const POPS = 3; // drops of a letter to pop before the next letter
  const HEARTS = 3;
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
  // The three pops of a letter climb a major chord.
  const chord = [1, 1.26, 1.5];
  // Drops take 6.6 s to fall at first and a little less with every letter done, never under 3.2 s;
  // a new one comes about every second, a little more often as the game goes on.
  const fallTime = done => 3.2 + 3.4 * Math.exp(-done / 14);
  const spawnGap = done => 0.62 + 0.4 * Math.exp(-done / 14);
  // The bar at the top sets how fast all of that goes, from the snail to the rabbit. Each player
  // keeps their own speed for both games.
  const PACES = [0.6, 0.8, 1, 1.25, 1.5];
  const paceNames = ['Çok yavaş', 'Yavaş', 'Normal', 'Hızlı', 'Çok hızlı'];
  const NORMAL = 2;
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
  // What a game plays with. Harf Yağmuru: letter indexes. Hece Balonları: letter * 3 + hareke.
  const kinds = {
    harf: {
      rising: false, label: 'Harf Yağmuru', title: 'Harf <em>Yağmuru</em>',
      text: i => glyphs[i], name: i => names[i], sound: i => names[i], speak: (i, note, end) => voice.letter(i, note, end),
      // look-alike letters (the same shape, other dots) join in once a few letters are done
      alike: i => twins(i), alikeFrom: 3, alikeChance: 0.3,
      t: { listen: 'Harfi tekrar dinle', slots: 'Bölümün harfleri', first: '👆 Duyduğun harften 3 tane patlat', fresh: '🔊 Yeni harf',
        freshSay: 'Yeni harf. Dinle.', allDone: 'On beş harfin hepsini patlattın.', whole: 'Hiç can kaybetmeden 15 harfin hepsini, 45 damlayı patlattın!',
        partly: '15 harfin hepsini patlattın ama ', recap: 'Patlattığın harfler · dokun, dinle', chip: ' harfini dinle',
        some: ' harfi patlattın. ', none: 'Sesi dikkatle dinle, sonra o harften üç tane patlat. ',
        say: 'Harf Yağmuru! Kaplumbağa bir harf söyleyecek. O harften üç damla patlat. Başlamak için yeşil düğmeye bas.',
        intro: 'Kaplumbağa bir harf söyleyecek: o harften üç tane patlat, hemen yeni harf gelsin. 15 harfi bitirince ' +
          'yoluna devam edersin; hiç can kaybetmezsen üç yıldız! Canların biterse oyun baştan başlar.',
        unit: 'harf', piece: 'damla patlat', pool: 'Oyundaki harfler' }
    },
    hece: {
      rising: true, label: 'Hece Balonları', title: 'Hece <em>Balonları</em>',
      // shown by its letter and hareke ("Be üstün"); the reading only tells syllables that sound alike apart
      text: k => syllable(Math.floor(k / 3), k % 3), sound: k => readings[Math.floor(k / 3)][k % 3],
      name: k => names[Math.floor(k / 3)] + ' ' + harekeler[k % 3].name.toLocaleLowerCase('tr'),
      speak: (k, note, end) => voice.syllable(Math.floor(k / 3), k % 3, note, end),
      // the same letter with its other harekes is what is to be told apart
      alike: k => [0, 1, 2].map(h => k - k % 3 + h).filter(j => j !== k), alikeFrom: 1, alikeChance: 0.4,
      t: { listen: 'Heceyi tekrar dinle', slots: 'Bölümün heceleri', first: '👆 Duyduğun heceden 3 balon patlat', fresh: '🔊 Yeni hece',
        freshSay: 'Yeni hece. Dinle.', allDone: 'On beş hecenin hepsini patlattın.', whole: 'Hiç can kaybetmeden 15 hecenin hepsini, 45 balonu patlattın!',
        partly: '15 hecenin hepsini patlattın ama ', recap: 'Patlattığın heceler · dokun, dinle', chip: ' hecesini dinle',
        some: ' heceyi patlattın. ', none: 'Sesi dikkatle dinle, sonra o heceden üç balon patlat. ',
        say: 'Hece Balonları! Kaplumbağa bir hece okuyacak. O heceden üç balon patlat. Başlamak için yeşil düğmeye bas.',
        intro: 'Kaplumbağa harekeli bir hece okuyacak: o heceden üç balon patlat, hemen yeni hece gelsin. 15 heceyi bitirince ' +
          'yoluna devam edersin; hiç can kaybetmezsen üç yıldız! Canların biterse oyun baştan başlar.',
        unit: 'hece', piece: 'balon patlat', pool: 'Oyundaki heceler' }
    },
    sekil: {
      rising: false, label: 'Şekil Yağmuru', title: 'Şekil <em>Yağmuru</em>',
      // a drop shows the letter at the start, in the middle or at the end of a word, picked when it is made
      text: i => shape(i, 1 + Math.floor(Math.random() * 3)), name: i => names[i], sound: i => names[i],
      speak: (i, note, end) => voice.letter(i, note, end),
      alike: i => twins(i), alikeFrom: 2, alikeChance: 0.4,
      t: { listen: 'Harfi tekrar dinle', slots: 'Bölümün harfleri', first: '👆 Duyduğun harften 3 tane patlat', fresh: '🔊 Yeni harf',
        freshSay: 'Yeni harf. Dinle.', allDone: 'On beş harfin hepsini patlattın.', whole: 'Hiç can kaybetmeden 15 harfin hepsini, 45 damlayı patlattın!',
        partly: '15 harfin hepsini patlattın ama ', recap: 'Patlattığın harfler · dokun, dinle', chip: ' harfini dinle',
        some: ' harfi patlattın. ', none: 'Sesi dikkatle dinle, sonra o harften üç tane patlat. ',
        say: 'Şekil Yağmuru! Harfler bitişik şekilleriyle yağıyor. Kaplumbağa bir harf söyleyecek. Şekli değişse de o harften üç damla patlat. ' +
          'Başlamak için yeşil düğmeye bas.',
        intro: 'Harfler bitişik yazılışlarıyla yağıyor: kelimenin başındaki, ortasındaki ve sonundaki şekilleriyle. Kaplumbağa bir harf ' +
          'söyleyecek: o harften üç tane patlat, şekli değişse de aynı harf! 15 harfi bitirince yoluna devam edersin; hiç can kaybetmezsen ' +
          'üç yıldız! Canların biterse oyun baştan başlar.',
        unit: 'harf', piece: 'damla patlat', pool: 'Oyundaki harfler' }
    },
    cezm: {
      rising: true, label: 'Cezm Balonları', title: 'Cezm <em>Balonları</em>',
      // i: the letter with the cezm. Shown as "Be esre, Sin cezm", the way it is chanted.
      text: i => cezm(i).text, sound: i => cezmReadings[i].replace(/[’‘]/g, '').replace(/ı/g, 'i'),
      name: i => { const { before } = cezm(i); return names[before.i] + ' ' + harekeler[before.h].name.toLocaleLowerCase('tr') + ', ' + (i ? names[i] : 'Hemze') + ' cezm'; },
      speak: (i, note, end) => voice.cezm(i, note, end),
      // syllables that start with the same harekeli letter (bis, bi’) are what is to be told apart
      alike: i => glyphs.map((_, j) => j).filter(j => j !== i && !cezmAlike(i, j) && cezm(j).text.slice(0, 2) === cezm(i).text.slice(0, 2)),
      alikeFrom: 1, alikeChance: 0.4, preload: letters => voice.preload(letters, true, false, true),
      t: { listen: 'Heceyi tekrar dinle', slots: 'Bölümün heceleri', first: '👆 Duyduğun heceden 3 balon patlat', fresh: '🔊 Yeni hece',
        freshSay: 'Yeni hece. Dinle.', allDone: 'On beş hecenin hepsini patlattın.', whole: 'Hiç can kaybetmeden 15 hecenin hepsini, 45 balonu patlattın!',
        partly: '15 hecenin hepsini patlattın ama ', recap: 'Patlattığın heceler · dokun, dinle', chip: ' hecesini dinle',
        some: ' heceyi patlattın. ', none: 'Sesi dikkatle dinle, sonra o heceden üç balon patlat. ',
        say: 'Cezm Balonları! Kaplumbağa cezimli bir hece okuyacak. O heceden üç balon patlat. Başlamak için yeşil düğmeye bas.',
        intro: 'Kaplumbağa cezimli bir hece okuyacak: o heceden üç balon patlat, hemen yeni hece gelsin. 15 heceyi bitirince ' +
          'yoluna devam edersin; hiç can kaybetmezsen üç yıldız! Canların biterse oyun baştan başlar.',
        unit: 'hece', piece: 'balon patlat', pool: 'Oyundaki heceler' }
    }
  };
  let kind = kinds.harf;
  const glyph = (i, text = kind.text(i)) => '<b lang="ar" dir="rtl">' + text + '</b>';
  // The voice writes its "no Turkish voice here" note into this; the turtle's bubble shows
  // the letter's name instead, so the game can still be played by reading.
  const unheard = {};

  const { heart: heartSvg, speaker: speakerSvg, star: starPath } = elifArt;

  /* ---------- Scene ---------- */
  dialog.innerHTML = '<div class="rain-scene">' +
    '<div class="rain-sky" aria-hidden="true"><i class="rain-sun"></i><i class="rain-rainbow"></i><i class="rain-far one"></i>' +
      '<i class="rain-far two"></i><i class="rain-isle"></i><i class="rain-streaks"></i></div>' +
    '<p class="rain-prompt" aria-hidden="true"></p>' +
    '<div class="rain-field" data-cue></div>' +
    '<div class="rain-sea" aria-hidden="true"><i class="rain-wave back"></i><i class="rain-wave mid"></i>' +
      '<div class="rain-turtle"><div class="rain-turtle-body">' + elifArt.turtle('rain') + '</div>' +
      '<div class="rain-bubble">' + speakerSvg + '<span></span></div></div><i class="rain-wave front"></i></div>' +
    '<div class="rain-ceiling" aria-hidden="true"><i></i></div>' +
    '<div class="rain-hud">' +
      '<div class="rain-left"><button type="button" class="rain-close" aria-label="Oyundan çık">×</button>' +
      '<span class="rain-hearts" role="img"></span></div>' +
      '<button type="button" class="rain-listen" data-cue>' + speakerSvg + '</button>' +
      '<div class="rain-score"><small>Puan</small><b>0</b></div>' +
      '<ol class="rain-slots"></ol>' +
      '<label class="rain-pace"><span aria-hidden="true">🐌</span><input type="range" min="0" max="' + (PACES.length - 1) +
        '" step="1" aria-label="Oyun hızı"><span aria-hidden="true">🐇</span><output aria-hidden="true"></output></label>' +
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
  const paceBox = find('.rain-pace');
  const paceInput = paceBox.querySelector('input');
  const paceName = paceBox.querySelector('output');

  let options = null, game = null, state = 'idle', drops = [], rounds = 0, followUp = null;
  let width = 0, size = 80, laneX = [], spawnY = 0, surface = 0, topY = 0;
  let talkToken = 0, pendingDone = null, talking = false, lastTalk = -9, lastSplash = -9, moodTimer = 0, promptToken = 0;
  let pace = 1, paceTimer = 0;

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
    topY = top - size * 0.45; // where a balloon has gone into the clouds
    spawnY = kind.rising ? surface - size * 0.55 : top + 16 - size;
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
    slotBox.innerHTML = Array.from({ length: ROUND }, () => '<li></li>').join('');
  }
  // The letter being played: its slot fills in thirds, one for each drop popped.
  function markSlot() {
    Array.from(slotBox.children).forEach((slot, n) => {
      slot.classList.toggle('now', n === game.step);
      if (n === game.step) slot.style.setProperty('--fill', 0);
    });
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

  /* ---------- Speed ---------- */
  const paceKey = () => 'elif-ba-hiz-' + activeProfile?.id;
  function keptPace() {
    let kept = null;
    try { kept = localStorage.getItem(paceKey()); } catch {}
    const step = Number(kept);
    return kept !== null && Number.isInteger(step) && step >= 0 && step < PACES.length ? step : NORMAL;
  }
  function setPace(step) {
    const was = pace;
    pace = PACES[step];
    paceInput.value = step;
    paceInput.setAttribute('aria-valuetext', paceNames[step]);
    paceBox.style.setProperty('--at', step / (PACES.length - 1));
    paceName.textContent = paceNames[step];
    // The drop waiting to come follows the new speed too.
    if (game && state === 'raining') game.nextSpawn = clock + Math.max(0, game.nextSpawn - clock) * was / pace;
  }
  paceInput.oninput = () => {
    const step = Number(paceInput.value);
    setPace(step);
    try { localStorage.setItem(paceKey(), step); } catch {}
    // The speed's name shows under the bar for a moment.
    paceBox.classList.add('named');
    clearTimeout(paceTimer);
    paceTimer = setTimeout(() => paceBox.classList.remove('named'), 1100);
  };

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
      talk(false, heard === false ? kind.name(game.target) : '');
      const done = pendingDone;
      pendingDone = null;
      done?.();
    };
    kind.speak(game.target, unheard, end);
    after(3.5, () => end(false)); // the voice never reported back: carry on, and show the name
  }
  listen.onclick = () => {
    if (paused || state !== 'raining' || (talking && clock - lastTalk < 0.5)) return;
    narrate();
  };

  /* ---------- A game ---------- */
  // Fifteen letters for a section: each of the newest cove's letters, then the earlier ones for
  // review (every learned letter while there are no more than fifteen), never one twice in a row.
  function plan(letters, recent, before) {
    const fresh = recent.filter(i => letters.includes(i));
    const list = [...shuffled(fresh), ...shuffled(letters.filter(i => !fresh.includes(i)))].slice(0, ROUND);
    let bag = [];
    while (list.length < ROUND) {
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
      plan: plan(options.letters, options.recent, -1), step: 0, target: null, pops: 0,
      done: 0, popped: 0, completed: [], hearts: HEARTS, score: 0, streak: 0, listening: true, first: ++rounds === 1,
      nextSpawn: 0, sinceTarget: 2, lastLane: -1, targetLane: -1, lastLetter: -1, lastTone: -1, retalk: false, saved: false
    };
    drawHearts();
    drawSlots();
    addScore(0);
    measure();
    scene.classList.remove('clear', 'gloom', 'raining');
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
    game.sinceTarget = 2; // the next drop is this letter, and it comes soon
    game.nextSpawn = Math.min(game.nextSpawn, clock + 0.3);
    if (mark) markSlot();
    after(delay, () => {
      if (state !== 'raining') return;
      if (game.first && !game.done) setPrompt(kind.t.first);
      else setPrompt(kind.t.fresh, 1.8);
      say(kind.t.freshSay);
      narrate(() => { game.listening = false; });
    });
  }

  /* ---------- Rain ---------- */
  const flying = () => drops.filter(d => d.letter === game.target && d.state === 'fall');
  // A lane whose start is clear, other than the last one used. The letter being played also keeps
  // away from its own lanes, so its drops (balloons) never line up one above the other.
  function freeLane(target) {
    const blocked = new Set(drops.filter(d => kind.rising ? d.y > spawnY - size * 1.35 : d.y < spawnY + size * 1.35).map(d => d.lane));
    const all = laneX.map((_, k) => k).filter(k => !blocked.has(k));
    let spread = all.filter(k => k !== game.lastLane);
    if (target) {
      const own = new Set([game.targetLane, ...flying().map(d => d.lane)]);
      const apart = spread.filter(k => !own.has(k));
      if (apart.length) spread = apart;
    }
    return spread.length ? pick(spread) : all.length ? all[0] : -1;
  }
  // The letter being played never comes twice in a row: one or two other drops come between,
  // and no more than three of it are in the air at once.
  function wantTarget() {
    if (game.sinceTarget === 0) return false;
    const falling = flying().length;
    if (falling >= POPS) return false;
    return game.sinceTarget >= 2 || Math.random() < (falling ? 0.35 : 0.55);
  }
  function distractor() {
    // Never one that sounds the same as the one being played (sin üstün and se üstün are both "se").
    const others = options.letters.filter(i => kind.sound(i) !== kind.sound(game.target));
    const fresh = others.filter(i => i !== game.lastLetter);
    const choices = fresh.length ? fresh : others;
    const alike = kind.alike(game.target).filter(i => choices.includes(i));
    if (alike.length && game.done >= kind.alikeFrom && Math.random() < kind.alikeChance) return pick(alike);
    return pick(choices);
  }
  function spawn() {
    const target = wantTarget();
    const lane = freeLane(target);
    if (lane < 0) { game.nextSpawn = clock + 0.12; return; }
    const letter = target ? game.target : distractor();
    let tone;
    do tone = Math.floor(Math.random() * 5); while (tone === game.lastTone);
    const el = document.createElement('button');
    el.type = 'button';
    el.tabIndex = -1;
    el.className = 'rain-drop t' + tone;
    el.setAttribute('aria-label', kind.name(letter));
    const text = kind.text(letter);
    el.innerHTML = '<span class="rain-drop-in">' + (kind.rising ? '<i class="rain-string"></i>' : '') + '<i class="rain-drop-skin"></i>' + glyph(letter, text) + '</span>';
    const drop = { el, inner: el.firstChild, letter, text, lane, tone, x: laneX[lane], y: spawnY, dx: 0, fall: fallTime(game.done),
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
    if (target) { game.sinceTarget = 0; game.targetLane = lane; } else game.sinceTarget++;
    game.nextSpawn = clock + spawnGap(game.done) * (0.85 + Math.random() * 0.3) / pace;
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
    // A wrongly tapped letter hurries into the sea (a balloon into the clouds).
    const hurry = (drop.state === 'wrong' ? 2.6 : 1) * pace;
    if (kind.rising) drop.y -= (spawnY - topY) / drop.fall * dt * hurry;
    else drop.y += (surface - spawnY) / drop.fall * dt * hurry;
    drop.phase += dt;
    place(drop);
    if (kind.rising ? drop.y <= topY : drop.y + size * 0.92 >= surface) splash(drop);
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
    if (kind.rising) {
      // A balloon floats away into the clouds without a sound.
      vanish(drop, 'fade');
      if (missed && state === 'raining' && !game.listening && clock - lastTalk > 2.5) narrate();
      return;
    }
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
    // 50 points, up to 30 more for popping it early, and up to double for a long streak.
    const high = 1 - clamp01(kind.rising ? (spawnY - drop.y) / (spawnY - topY) : (drop.y - spawnY) / (surface - spawnY));
    const points = Math.round((50 + 30 * high) * Math.min(2, 1 + 0.1 * (game.streak - 1)) / 10) * 10;
    addScore(points);
    playCue('pop', { rate: chord[game.pops - 1] });
    sparkle(at);
    floatPoints('+' + points, at);
    fly(drop, at, game.step, game.pops);
    vanish(drop, 'pop');
    if (game.pops < POPS) {
      mood('happy', 700);
      say(kind.name(drop.letter) + '. ' + game.pops + ' / ' + POPS);
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
    say(kind.name(letter) + ' tamam!');
    game.step++;
    if (game.step === ROUND) finish(); else nextLetter(0.75, true);
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
  // Before the turtle has said the new letter, a wrong tap only wobbles the drop.
  function forgive(drop) {
    if (!calm.matches) drop.inner.animate([{ transform: 'none' }, { transform: 'rotate(-10deg)' },
      { transform: 'rotate(8deg)' }, { transform: 'none' }], { duration: 360 });
  }
  function wrong(drop) {
    drop.state = 'wrong';
    drop.el.classList.add('wrong');
    drop.el.style.pointerEvents = 'none';
    drop.inner.insertAdjacentHTML('beforeend', '<em class="rain-tag">' + kind.name(drop.letter) + '</em>');
    if (!calm.matches) drop.inner.animate([{ transform: 'none' }, { transform: 'translateX(-9px) rotate(-7deg)' },
      { transform: 'translateX(8px) rotate(6deg)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 420 });
    game.streak = 0;
    loseHeart();
    playCue('oops');
    mood('sad', 850);
    if (!game.hearts) {
      say('Bu ' + kind.name(drop.letter) + '. Canların bitti.');
      lose();
      return;
    }
    say('Bu ' + kind.name(drop.letter) + '. ' + game.hearts + ' can kaldı.');
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
        slot.innerHTML = glyph(drop.letter, drop.text);
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
    piece.textContent = drop.text;
    scene.append(piece);
    const end = Math.max(0.2, to.width / (size * 0.8));
    const move = (px, py, scale) => ({ transform: 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px) translate(-50%,-50%) scale(' + scale.toFixed(2) + ')' });
    piece.animate([move(at.x, at.y, 1), { ...move((at.x + x) / 2 + (at.x < x ? -46 : 46), (at.y + y) / 2, 1.05), offset: 0.45 }, move(x, y, end)],
      { duration: 680, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).onfinish = () => { piece.remove(); land(); };
    setTimeout(() => { piece.remove(); land(); }, 1200);
  }

  /* ---------- The end of a section ---------- */
  // Real time, for the stars of the result card, which play on after the game clock stopped.
  function later(ms, fn) {
    const mine = session;
    setTimeout(() => { if (mine === session) fn(); }, ms);
  }
  // The best score is kept once per game: at its end, or when the child leaves it early; the
  // stars only when the section was played to the end.
  function keep(finished) {
    if (!game || game.saved || !game.score) return;
    game.saved = true;
    options.onResult({ score: game.score, stars: finished ? game.hearts : 0, finished: !!finished });
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

  // All 45 drops popped: the rain stops and the sun comes out.
  function finish() {
    state = 'won';
    setPrompt('');
    // Drops of the last letter still pop one by one; the others fade away.
    for (const drop of drops.slice()) if (drop.state !== 'caught') { drop.state = 'gone'; vanish(drop, 'fade'); }
    scene.classList.remove('raining');
    scene.classList.add('clear');
    const whole = game.hearts === HEARTS;
    mood('dance');
    playCue(whole ? 'victory' : 'island');
    fx.confetti(dialog, whole ? undefined : { count: 70 });
    say(whole ? 'Mükemmel! Bölüm tamamlandı.' : kind.t.allDone);
    after(1.7, result);
  }
  // With all three hearts the section is complete; otherwise it is to be played again.
  function result() {
    state = 'result';
    stopClock();
    const stars = game.hearts;
    const whole = stars === HEARTS;
    const best = { ...options.best() };
    keep(true);
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const text = whole ? kind.t.whole :
      kind.t.partly + (HEARTS - stars) + ' can kaybettin. Üç yıldız için bir dahaki sefere hiç can kaybetmeden bitirmeyi dene!';
    // On the island's path, the game played to the end opens the next step.
    const next = options.next?.();
    const unique = [...new Set(game.completed)];
    showCard('<div class="rain-card result"><div class="rain-stars" role="img" aria-label="' + stars + ' yıldız">' + [0, 1, 2].map(n =>
      '<svg viewBox="0 0 24 24" aria-hidden="true"' + (n < stars ? ' class="won" style="--d:' + (0.35 + n * 0.3) + 's"' : '') +
      '><path d="' + starPath + '"/></svg>').join('') + '</div>' +
      '<h2 id="rain-title" tabindex="-1">' + (whole ? 'Mükemmel!' : 'Bölüm tamamlandı!') + '</h2><p>' + text + '</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' + recordLine(record, best) +
      '<div class="rain-recap"><p>' + kind.t.recap + '</p><div>' + unique.map((i, n) =>
        '<button type="button" class="rain-chip t' + n % 5 + '" data-cue data-letter="' + i + '" aria-label="' + kind.name(i) + kind.t.chip + '">' +
        glyph(i) + '<span>' + kind.name(i) + '</span></button>').join('') + '</div></div>' +
      '<div class="rain-actions">' + (next ? '<button type="button" class="rain-go rain-next" data-cue>▶ Devam: ' + next.label + '</button>' +
        '<button type="button" class="rain-back rain-again">↻ Tekrar oyna</button>' :
        '<button type="button" class="rain-go rain-again" data-cue>↻ Tekrar oyna</button><button type="button" class="rain-back">Adaya dön</button>') +
      '</div></div>');
    overlay.querySelector('.rain-again').onclick = () => newGame(false);
    if (next) overlay.querySelector('.rain-next').onclick = () => { followUp = next.go; dialog.close(); };
    else overlay.querySelector('.rain-back').onclick = () => dialog.close();
    for (const chip of overlay.querySelectorAll('.rain-chip')) {
      chip.onclick = () => { fx.bump(chip, 'rain-bump'); kind.speak(Number(chip.dataset.letter), unheard); };
    }
    for (let n = 0; n < stars; n++) later(350 + n * 300, () => playCue('star', { rate: chord[n] }));
    countUp(overlay.querySelector('.rain-total b'), game.score);
  }

  /* ---------- Hearts gone: start again ---------- */
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
    after(1.4, over);
  }
  // A short look at the game just played, then it starts again from the beginning by itself;
  // "Hemen başla" does not wait, "Adaya dön" leaves.
  const RESTART = 4.5;
  function over() {
    state = 'over';
    const best = { ...options.best() };
    keep(false);
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const text = (game.done ? game.done + ' / ' + ROUND + kind.t.some : kind.t.none) +
      'Oyun baştan başlıyor!';
    showCard('<div class="rain-card over"><div class="rain-broken" aria-hidden="true">' + heartSvg + '</div>' +
      '<h2 id="rain-title" tabindex="-1">Canların bitti!</h2><p>' + text + '</p>' +
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
    const sample = shuffled(options.letters).slice(0, 3);
    showCard('<div class="rain-card intro"><div class="rain-intro-art" aria-hidden="true">' + sample.map((i, n) =>
      '<span class="rain-drop t' + [0, 4, 1][n] + '"><span class="rain-drop-in">' + (kind.rising ? '<i class="rain-string"></i>' : '') +
      '<i class="rain-drop-skin"></i>' + glyph(i) + '</span></span>').join('') +
      '</div><h2 id="rain-title" tabindex="-1">' + kind.title + '</h2>' +
      '<p>' + kind.t.intro + '</p>' +
      '<ul class="rain-facts"><li><b>15</b><span>' + kind.t.unit + '</span></li><li><b>45</b><span>' + kind.t.piece + '</span></li>' +
      '<li><b>3</b><span>can</span></li></ul>' +
      '<div class="rain-pool" aria-label="' + kind.t.pool + '">' + options.letters.map(i => '<b lang="ar" title="' + kind.name(i) + '">' + kind.text(i) + '</b>').join('') + '</div>' +
      (best.tamam ? '<p class="rain-record">✅ Bölümü tamamladın · 🏆 ' + best.rekor + ' puan</p>' :
        best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      '<button type="button" class="rain-go" data-cue>▶ Başla</button></div>');
    // Said aloud for children who cannot read yet; the turtle button says it again.
    const tell = () => voice.instruct(kind.t.say);
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'rain-tell';
    again.setAttribute('aria-label', 'Oyunu anlat');
    again.innerHTML = '<span aria-hidden="true">🐢💬</span>';
    again.onclick = tell;
    overlay.querySelector('.rain-card').prepend(again);
    tell();
    overlay.querySelector('.rain-go').onclick = () => { voice.stop(); countdown(); };
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
    keep(false);
    reset();
    stopClock();
    hideCard();
    mood(null);
    state = 'idle';
    const done = options?.onClose;
    const then = followUp;
    followUp = null;
    options = null;
    game = null;
    done?.();
    then?.();
  });

  // kind: 'harf' (Harf Yağmuru, the default), 'hece' (Hece Balonları), 'sekil' (Şekil Yağmuru) or 'cezm' (Cezm Balonları);
  // letters: learned letters (syllables) to play with; recent: the newest cove's, asked more often;
  // best(): the player's { rekor, yildiz, tamam }; onResult({ score, stars, finished }) keeps them;
  // next(): optional, { label, go } of the step after a game played to the end.
  function open(settings) {
    options = settings;
    kind = kinds[settings.kind] || kinds.harf;
    rounds = 0;
    scene.classList.toggle('balloons', kind.rising);
    dialog.setAttribute('aria-label', kind.label);
    listen.setAttribute('aria-label', kind.t.listen);
    slotBox.setAttribute('aria-label', kind.t.slots);
    setPace(keptPace());
    if (kind.preload) kind.preload(settings.letters);
    else if (kind.rising) voice.preload([...new Set(settings.letters.map(k => Math.floor(k / 3)))]);
    else voice.preload(settings.letters, true);
    if (!dialog.open) dialog.showModal();
    newGame(true);
  }
  return { open };
})();
