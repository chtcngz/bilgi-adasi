// Preschool letter games. Progress lasts only while the game is open.
(() => {
  const { glyphs, names, coves, coveLetters } = elifData;
  const V = elifVoice;
  const lab = $('lab');
  const turtleSvg = id => elifArt.turtle(id);
  const pick = items => items[Math.floor(Math.random() * items.length)];
  function shuffled(items) {
    const r = [...items];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; };
  const ar = (text, cls = '') => '<b lang="ar" dir="rtl" class="ar ' + cls + '">' + text + '</b>';
  const later = [];
  const wait = (ms, fn) => { const t = setTimeout(fn, ms); later.push(t); return t; };
  function clearLater() { while (later.length) clearTimeout(later.pop()); }

  const stopAll = () => V.stop();
  const sayLetter = i => V.letter(i);

  function dotsRow(total) {
    const row = el('ol', 'lab-steps');
    row.innerHTML = Array.from({ length: total }, () => '<li></li>').join('');
    return { row, mark(n) { Array.from(row.children).forEach((li, k) => { li.className = k < n ? 'got' : k === n ? 'now' : ''; }); } };
  }
  function finale(screen, text, again) {
    const box = el('div', 'lab-finale', '<div class="lab-trophy">🏆</div><h2>' + text + '</h2>');
    const replay = el('button', 'lab-primary', '🔁 Tekrar oyna'); replay.onclick = again;
    const home = el('button', 'lab-secondary', '🏠 Deneme Odası'); home.onclick = showHub;
    box.append(replay, home);
    screen.append(box);
    playCue('victory');
    fx.confetti(document.body, { count: 110 });
  }


  const games = [
    { id: 'album', icon: '🐣', title: 'İlk Harf Albümüm', start: startAlbum },
    { id: 'buyutec', icon: '🐢', title: 'Harf Büyüteci', start: startMagnifier },
    { id: 'kabuk', icon: '🐚', title: 'Kabuk Hafızası', start: startShells }
  ];

  function showHub() {
    stopAll(); clearLater();
    document.title = 'Deneme Odası · Bilgi Adası';
    lab.className = 'lab-hub';
    lab.innerHTML = '<div class="lab-intro"><h1>Deneme <em>Odası</em></h1></div>';
    const grid = el('div', 'lab-grid');
    for (const game of games) {
      const card = el('button', 'lab-card');
      card.innerHTML = '<span class="lab-card-icon" aria-hidden="true">' + game.icon +
        '</span><span class="lab-card-text"><strong>' + game.title + '</strong></span><span class="lab-go" aria-hidden="true">▶</span>';
      card.onclick = () => openGame(game);
      grid.append(card);
    }
    lab.append(grid);
    scrollTo(0, 0);
  }

  function openGame(game) {
    stopAll(); clearLater();
    document.title = game.title + ' · Deneme Odası';
    lab.className = 'lab-play lab-' + game.id;
    lab.replaceChildren();
    const bar = el('div', 'lab-bar');
    const back = pictureButton('Odaya dön', '🏠', 'lab-back');
    back.onclick = showHub;
    bar.append(back, el('h1', '', game.icon + ' ' + game.title));
    const screen = el('div', 'lab-screen');
    lab.append(bar, screen);
    scrollTo(0, 0);
    game.start(screen);
  }

  function startShells(screen) {
    const beach = el('div', 'shell-beach');
    beach.style.setProperty('--cols', 3);
    const letters = shuffled(glyphs.map((_, i) => i)).slice(0, 3);
    let first = null, busy = false, pairs = 0;
    for (const i of shuffled([...letters, ...letters])) {
      const card = pictureButton('Kapalı kabuk', '<span class="shell-back" aria-hidden="true"></span><span class="shell-face">' +
        ar(glyphs[i]) + '</span>', 'shell');
      card.dataset.cue = '';
      card.onclick = () => {
        if (busy || card === first?.card) return;
        sayLetter(i);
        if (card.classList.contains('pearl')) return;
        beach.firstElementChild.classList.remove('tap-hint');
        card.classList.add('open');
        card.setAttribute('aria-label', names[i]);
        if (!first) { first = { i, card }; return; }
        const previous = first;
        first = null;
        busy = true;
        const match = previous.i === i;
        wait(match ? 650 : 1500, () => {
          busy = false;
          for (const shell of [previous.card, card]) {
            if (match) shell.classList.add('pearl');
            else {
              shell.classList.remove('open');
              shell.setAttribute('aria-label', 'Kapalı kabuk');
            }
          }
          if (match) {
            playCue('correct');
            fx.burst(card, { count: 8 });
            if (++pairs === letters.length) wait(700, () => finale(screen, '🌟', () => openGame(games.find(g => g.id === 'kabuk'))));
          }
        });
      };
      beach.append(card);
    }
    beach.firstElementChild.classList.add('tap-hint');
    screen.append(beach);
  }

  function pictureButton(label, content, cls = '') {
    const button = el('button', 'picture-button ' + cls, content);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    return button;
  }

  function startAlbum(screen) {
    const steps = dotsRow(coves.length);
    const nest = el('section', 'nest-board');
    const face = pictureButton('Yuvayı keşfet', '🪺', 'nest-face');
    const eggs = el('div', 'egg-row');
    const nav = el('div', 'lab-actions');
    const prev = pictureButton('Önceki koy', '◀');
    const next = pictureButton('Sonraki koy', '▶');
    const opened = new Set();
    nav.append(prev, next);
    nest.append(face, eggs, nav);
    screen.append(steps.row, nest);
    let cove = 0;
    function draw() {
      stopAll();
      steps.mark(cove);
      eggs.replaceChildren();
      const letters = coveLetters(cove);
      const birds = ['🐣', '🐥', '🐤', '🐣'];
      const firstEgg = letters.find(i => !opened.has(i));
      face.innerHTML = '🪺';
      face.setAttribute('aria-label', 'Yuvadaki harfi aç');
      face.onclick = () => eggs.children[Math.max(0, letters.indexOf(firstEgg))].click();
      prev.disabled = cove === 0;
      next.disabled = cove === coves.length - 1;
      for (const [k, i] of letters.entries()) {
        const hatched = '<span aria-hidden="true">' + birds[k] + '</span>' + ar(glyphs[i]);
        const egg = pictureButton(names[i], opened.has(i) ? hatched : '🥚', 'nest-egg');
        egg.classList.toggle('tap-hint', i === firstEgg);
        egg.onclick = () => {
          opened.add(i);
          egg.innerHTML = hatched;
          face.innerHTML = '<span aria-hidden="true">' + birds[k] + '</span>' + ar(glyphs[i]);
          face.setAttribute('aria-label', names[i] + ' harfini tekrar dinle');
          face.onclick = () => sayLetter(i);
          sayLetter(i);
          for (const [n, card] of Array.from(eggs.children).entries()) {
            card.classList.toggle('tap-hint', letters[n] === letters.find(j => !opened.has(j)));
            card.setAttribute('aria-pressed', n === k);
          }
          next.classList.toggle('tap-hint', !next.disabled && letters.every(j => opened.has(j)));
          if (opened.size === glyphs.length && !nest.classList.contains('complete')) {
            nest.classList.add('complete');
            fx.confetti(screen, { count: 35 });
          }
        };
        eggs.append(egg);
      }
      next.classList.toggle('tap-hint', !next.disabled && firstEgg === undefined);
    }
    prev.onclick = () => { cove--; draw(); };
    next.onclick = () => { cove++; draw(); };
    draw();
  }

  function startMagnifier(screen) {
    const families = glyphs.map((_, i) => [i, ...elifData.twins(i)])
      .filter(group => group.length > 1 && group[0] === Math.min(...group));
    const rounds = [[0, 1], ...shuffled(families).slice(0, 5)];
    const steps = dotsRow(rounds.length);
    const board = el('section', 'match-board');
    const turtle = el('div', 'lab-turtle', turtleSvg('match-guide'));
    const model = pictureButton('Harfi dinle', '', 'match-model');
    const guideRow = el('div', 'match-guide');
    guideRow.append(turtle, model);
    const tray = el('div', 'match-tray');
    board.append(guideRow, tray);
    screen.append(steps.row, board);
    let round = 0;
    function draw() {
      const family = rounds[round];
      const target = round === 0 ? 0 : pick(family);
      model.innerHTML = ar(glyphs[target]) + '<small aria-hidden="true">🔊</small>';
      model.onclick = () => sayLetter(target);
      model.classList.remove('matched');
      tray.replaceChildren();
      steps.mark(round);
      for (const i of shuffled(family)) {
        const card = pictureButton(names[i], ar(glyphs[i]), 'match-card');
        const correct = i === target;
        card.classList.toggle('tap-hint', correct && !round);
        card.onclick = () => {
          sayLetter(i);
          if (!correct) {
            card.disabled = true;
            tray.querySelector('[data-match]').classList.add('tap-hint');
            return;
          }
          for (const other of tray.children) other.disabled = true;
          card.classList.remove('tap-hint');
          card.classList.add('matched');
          model.classList.add('matched');
          fx.burst(card, { count: 8 });
          wait(1450, () => {
            if (++round < rounds.length) return draw();
            steps.mark(round);
            board.remove();
            finale(screen, '🌟', () => openGame(games.find(g => g.id === 'buyutec')));
          });
        };
        if (correct) card.dataset.match = '';
        tray.append(card);
      }
      sayLetter(target);
    }
    draw();
  }

  // Unknown or retired links open the room.
  const direct = games.find(g => '#' + g.id === location.hash);
  if (direct) openGame(direct); else showHub();
  addEventListener('hashchange', () => { const g = games.find(x => '#' + x.id === location.hash); if (g) openGame(g); else showHub(); });
})();
