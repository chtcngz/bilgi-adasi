// Cam Köprü: Elif Ba Adası's mixed game at the end of every cove. A glass bridge of fifteen rows
// leads over the sea to the next cove, and each row has three glass panes with harekeli letters
// (syllables) on them, of this cove and the earlier ones. The turtle says one; the child taps its pane and the turtle
// hops onto it. A wrong pane cracks and breaks, the turtle falls into the sea and a dolphin throws
// it back onto the last pane it stood on. Three hearts, as in the other games: reaching the far
// shore passes the step, losing all three starts the bridge again. In a cove of bitişik yazılış the
// panes show the harekeli letters in their joined shapes (ـبَـ), with a few syllables alone mixed in for
// review; in a cezm cove every pane is a syllable with a cezm (بِسْ); in a tenvin cove every row asks a letter with a
// tenvin (بٍ), beside the same letter with the hareke alone (بِ) or with another tenvin; in a şedde cove every row asks
// a şedde syllable (بِسَّ), beside the same letters without the şedde (بِسَ) or with another hareke.
const elifBridgeGame = (() => {
  const { glyphs, names, harekeler, syllable, sameSound, twins, shape, places, cezm, cezmAlike, cezmFaint, tenvin, tenvinler } = elifData;
  const seddeKind = elifKinds.sedde;
  const { heart: heartSvg, speaker: speakerSvg, star: starPath } = elifArt;
  const voice = elifVoice;
  const dialog = $('elif-bridge');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ROWS = 15;
  const HEARTS = 3;
  const praise = ['Harika!', 'Süper!', 'Bravo!', 'Aferin!', 'Müthiş!', 'Şahane!'];
  // A run of right panes climbs a major scale.
  const scale = [1, 1.12, 1.26, 1.335, 1.5, 1.68, 1.89, 2];
  const pick = items => items[Math.floor(Math.random() * items.length)];
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /* ---------- Letters and syllables ---------- */
  // An item is a harekeli syllable ({ i, h }), a harekeli letter in its joined shape at a place in the
  // word ({ i, h, f }, f 1-3: start, middle, end), said as the syllable too, a cezm syllable
  // ({ i, c: true }), the one in which letter i has the cezm, said as it is read, or a letter with a tenvin
  // ({ i, h, t: true }, h 0-2: iki üstün, iki esre, iki ötre), or a şedde syllable and the same letters without the
  // şedde ({ i, h, s: 0 or 84 }: the item of games/kinds.js's şedde kind is i * 3 + h + s).
  const isShape = item => item.f !== undefined;
  const isCezm = item => item.c === true;
  const isTenvin = item => item.t === true;
  const isSedde = item => item.s !== undefined;
  const seddeItem = item => item.s + item.i * 3 + item.h;
  const isSyllable = item => !isShape(item) && !isCezm(item) && !isTenvin(item) && !isSedde(item);
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const text = item => isCezm(item) ? cezm(item.i).text : isTenvin(item) ? tenvin(item.i, item.h) : isSedde(item) ? seddeKind.text(seddeItem(item)) :
    isShape(item) ? shape(item.i, item.f, item.h) : syllable(item.i, item.h);
  const cezmName = i => { const { before } = cezm(i); return names[before.i] + ' ' + hareke(before.h) + ', ' + (i ? names[i] : 'Hemze') + ' cezm'; };
  const nameOf = item => isCezm(item) ? cezmName(item.i) : isTenvin(item) ? names[item.i] + ' ' + tenvinler[item.h].name.toLocaleLowerCase('tr') :
    isSedde(item) ? seddeKind.name(seddeItem(item)) :
    names[item.i] + ' ' + hareke(item.h) + (isShape(item) ? ' · ' + places[item.f].toLocaleLowerCase('tr') : '');
  const glyph = item => '<b lang="ar" dir="rtl">' + text(item) + '</b>';
  // The voice writes its "no Turkish voice here" note into this; the turtle's bubble then shows the name.
  const unheard = {};
  const speak = (item, end) => isCezm(item) ? voice.cezm(item.i, unheard, end) : isTenvin(item) ? voice.tenvin(item.i, item.h, unheard, end) :
    isSedde(item) ? seddeKind.speak(seddeItem(item), unheard, end) :
    voice.syllable(item.i, item.h, unheard, end);
  const syllableOf = i => ({ i, h: Math.floor(Math.random() * 3) });
  // Two harekes for each of four letters, each hareke at least twice.
  const twoMarks = () => { const marks = shuffled([0, 1, 2, Math.floor(Math.random() * 3)]); return [marks, marks.map(h => (h + 1 + Math.floor(Math.random() * 2)) % 3)]; };

  // Rows are laid one by one, each picked at random among those that keep the rules; a dead end
  // starts over. If no order keeps them all (it nearly always does), the next, easier rules are
  // tried, and after the last ones the last try is used.
  function arrange(rows, ...rules) {
    let order = [];
    for (const allowed of rules) {
      for (let tries = 0; tries < 300; tries++) {
        const left = shuffled(rows.slice(0, ROWS));
        order = [];
        while (left.length) {
          const at = left.findIndex(row => allowed(order, row));
          if (at < 0) break;
          order.push(left.splice(at, 1)[0]);
        }
        if (!left.length) return order;
        order.push(...left);
      }
    }
    return order;
  }
  // Fifteen rows of harekeli syllables: every letter of the newest cove with two of its harekes, then
  // the earlier coves' letters for review. The first cove, with nothing before it, fills the bridge
  // with its letters' third harekes and then each of them once more. A row is never about the letter of either of
  // the two rows before, and one hareke is never asked three rows running; if no order keeps both, the
  // letter two rows back may come, and then the hareke too, but never the letter of the row before.
  function plan(letters, recent) {
    const fresh = shuffled(recent.filter(i => letters.includes(i)));
    const earlier = letters.filter(i => !fresh.includes(i));
    const [first, second] = twoMarks();
    const rows = fresh.flatMap((i, n) => [{ i, h: first[n] }, { i, h: second[n] }]);
    // the review rows take the harekes in turn, so that no hareke piles up
    let marks = [];
    rows.push(...shuffled(earlier).slice(0, ROWS - rows.length).map(i => {
      if (!marks.length) marks = shuffled([0, 1, 2]);
      return { i, h: marks.pop() };
    }));
    const spare = shuffled(fresh.flatMap(i => [0, 1, 2].map(h => ({ i, h })))
      .filter(s => !rows.some(r => r.i === s.i && r.h === s.h)));
    // still short (the first cove): its letters once more each, so none comes more often than the rules allow
    const again = shuffled(fresh.length ? fresh : letters);
    while (rows.length < ROWS) rows.push(spare.pop() || syllableOf(again[rows.length % again.length]));
    const newLetter = (order, row) => row.i !== order.at(-1)?.i;
    const notTwoBack = (order, row) => row.i !== order.at(-2)?.i;
    const newMark = (order, row) => order.length < 2 || row.h !== order.at(-1).h || row.h !== order.at(-2).h;
    return arrange(rows, (order, row) => newLetter(order, row) && notTwoBack(order, row) && newMark(order, row),
      (order, row) => newLetter(order, row) && newMark(order, row), newLetter);
  }
  // A bitişik bridge: every harekeli letter of the cove at the start, in the middle and at the end of a
  // word, then the earlier bitişik coves' letters, and syllables alone of all the letters to fill the
  // fifteen rows. No letter comes twice in a row, no two syllable rows touch, and it starts with a shape.
  function planJoined(letters, recent, known) {
    const fresh = recent.filter(i => letters.includes(i));
    const rows = fresh.flatMap(i => shuffled([0, 1, 2]).map((h, n) => ({ i, h, f: n + 1 })));
    const earlier = shuffled(letters.filter(i => !fresh.includes(i)));
    while (rows.length < ROWS - 2 && earlier.length) rows.push({ ...syllableOf(earlier.pop()), f: 1 + Math.floor(Math.random() * 3) });
    for (const i of shuffled(known)) if (rows.length < ROWS) rows.push(syllableOf(i));
    return arrange(rows, (order, row) => order.length ? row.i !== order.at(-1).i && !(isSyllable(row) && isSyllable(order.at(-1))) : isShape(row));
  }
  // A cezm bridge: only cezm syllables. Every syllable of the cove twice, then the earlier cezm coves'
  // syllables; the first cezm cove fills the bridge with its own again. No letter comes twice in a row.
  function planCezm(letters, recent) {
    const fresh = recent.filter(i => letters.includes(i));
    const rows = [...fresh, ...fresh].map(i => ({ i, c: true }));
    const earlier = shuffled(letters.filter(i => !fresh.includes(i)));
    while (rows.length < ROWS && earlier.length) rows.push({ i: earlier.pop(), c: true });
    const again = shuffled(fresh.length ? fresh : letters);
    for (let n = 0; rows.length < ROWS; n++) rows.push({ i: again[n % again.length], c: true });
    return arrange(rows, (order, row) => !order.length || row.i !== order.at(-1).i);
  }
  // A tenvin bridge: the rows of a letter cove's bridge (every letter of the cove with two of its tenvins, then
  // the earlier tenvin coves' letters), each letter with a tenvin.
  const planTenvin = (letters, recent) => plan(letters, recent).map(row => ({ ...row, t: true }));
  const planSedde = (letters, recent) => plan(letters, recent).map(row => ({ ...row, s: 0 }));
  // The two wrong panes of a row, never two that sound the same (sin üstün and se üstün are both "se").
  // From the fourth row on, half the rows get the hard ones: a letter that differs only by its dots with
  // the same hareke, or the same letter with another hareke. A shape's wrong panes are shapes at the same place.
  function wrongPanes(target, n, letters) {
    const hard = n >= 3 && Math.random() < 0.5;
    if (isCezm(target)) {
      // the hard panes start with the same harekeli letter (bis, bit) or have a look-alike letter with the
      // cezm; the others are other cezm syllables
      const all = glyphs.map((_, j) => j);
      const start = cezm(target.i).text.slice(0, 2);
      const alike = hard ? shuffled(all.filter(i => cezm(i).text.slice(0, 2) === start || twins(target.i).includes(i))) : [];
      const picked = [];
      for (const i of [...alike, ...shuffled(letters), ...shuffled(all)]) {
        if (picked.length < 2 && i !== target.i && !picked.some(p => p.i === i) && !cezmAlike(i, target.i) &&
          !picked.some(p => cezmAlike(p.i, i))) picked.push({ i, c: true });
      }
      return picked;
    }
    if (isSedde(target)) {
      // beside it always the same letters without the şedde (bi-se for bis-se) or with another hareke, both when hard;
      // the others are other letters' şedde syllables; never two that sound the same (a hemze or ayn with a şedde)
      const own = shuffled([{ i: target.i, h: target.h, s: 84 }, ...[0, 1, 2].filter(h => h !== target.h).map(h => ({ i: target.i, h, s: 0 }))]);
      const others = shuffled(letters.filter(i => i !== target.i).flatMap(i => [0, 1, 2].map(h => ({ i, h, s: 0 }))));
      const everyone = shuffled(glyphs.map((_, i) => i).filter(i => i !== target.i).map(i => ({ i, h: target.h, s: 0 })));
      const same = (p, q) => seddeKind.sound(seddeItem(p)) === seddeKind.sound(seddeItem(q));
      const picked = [];
      for (const pane of [...own.slice(0, hard ? 2 : 1), ...others, ...everyone]) {
        if (picked.length < 2 && ![target, ...picked].some(p => same(p, pane))) picked.push(pane);
      }
      return picked;
    }
    if (isTenvin(target)) {
      // beside it always the same letter with the hareke alone (bi for bin) or with another tenvin, both when hard;
      // the others are other letters' tenvins
      const own = shuffled([{ i: target.i, h: target.h }, ...[0, 1, 2].filter(h => h !== target.h).map(h => ({ i: target.i, h, t: true }))]);
      const others = shuffled(letters.filter(i => i !== target.i).flatMap(i => [0, 1, 2].map(h => ({ i, h, t: true }))));
      const everyone = shuffled(glyphs.map((_, i) => i).filter(i => i !== target.i).map(i => ({ i, h: target.h, t: true })));
      const same = (p, q) => isTenvin(p) === isTenvin(q) && (p.i === q.i && p.h === q.h || sameSound(p.i, p.h, q.i, q.h));
      const picked = [];
      for (const pane of [...own.slice(0, hard ? 2 : 1), ...others, ...everyone]) {
        if (picked.length < 2 && ![target, ...picked].some(p => same(p, pane))) picked.push(pane);
      }
      return picked;
    }
    // a syllable alone always has the same letter with another hareke beside it (both other ones when
    // hard); a shape gets a look-alike or the same letter with another hareke when hard
    const place = isShape(target) ? { f: target.f } : {};
    const otherMarks = shuffled([0, 1, 2].filter(h => h !== target.h)).map(h => ({ i: target.i, h }));
    const alike = isShape(target) ? (hard ? shuffled([...twins(target.i).map(i => ({ i, h: target.h })), ...otherMarks]).slice(0, 1) : []) :
      otherMarks.slice(0, hard ? 2 : 1);
    const others = shuffled(letters.filter(i => i !== target.i).flatMap(i => [0, 1, 2].map(h => ({ i, h }))));
    const everyone = shuffled(glyphs.map((_, i) => i).filter(i => i !== target.i).map(i => ({ i, h: target.h })));
    const picked = [];
    for (const s of [...alike, ...others, ...everyone]) {
      if (picked.length >= 2) break;
      if (![target, ...picked].some(p => p.i === s.i && p.h === s.h || sameSound(p.i, p.h, s.i, s.h))) picked.push({ ...s, ...place });
    }
    return picked;
  }
  function build({ letters, recent, joined, cezm: cezmCove, tenvin: tenvinCove, sedde: seddeCove, known }) {
    const targets = cezmCove ? planCezm(letters, recent) : tenvinCove ? planTenvin(letters, recent) : seddeCove ? planSedde(letters, recent) :
      joined ? planJoined(letters, recent, known) : plan(letters, recent);
    const rows = [];
    targets.forEach((target, n) => {
      let panes;
      // the right pane is not in the same column three rows running
      for (let tries = 0; tries < 12; tries++) {
        panes = shuffled([target, ...wrongPanes(target, n, joined && isSyllable(target) ? known : letters)]);
        const right = panes.indexOf(target);
        if (n < 2 || rows[n - 1].right !== right || rows[n - 2].right !== right) break;
      }
      rows.push({ target, panes, right: panes.indexOf(target), broken: new Set(), els: [] });
    });
    return rows;
  }

  /* ---------- Scene ---------- */
  const shoreWave = side => '<svg class="bridge-foam ' + side + '" viewBox="0 0 120 20" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M0 10Q15 0 30 10T60 10T90 10T120 10V20H0Z" fill="currentColor"/><path d="M0 10Q15 0 30 10T60 10T90 10T120 10" ' +
    'fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".9"/></svg>';
  const chestSvg = '<svg class="bridge-chest" viewBox="0 0 120 104" aria-hidden="true">' +
    '<g class="bridge-chest-shine"><path d="M60 50 30 0H90Z" fill="#fff5b8"/><path d="M60 50 0 14 14 0Z" fill="#fff5b8"/>' +
    '<path d="M60 50 120 14 106 0Z" fill="#fff5b8"/></g>' +
    '<rect x="12" y="50" width="96" height="48" rx="7" fill="#c8743a" stroke="#7a3f17" stroke-width="4"/>' +
    '<path d="M12 62H108" stroke="#7a3f17" stroke-width="3" opacity=".35"/>' +
    '<rect x="26" y="50" width="10" height="48" fill="#f2c14e"/><rect x="84" y="50" width="10" height="48" fill="#f2c14e"/>' +
    '<rect x="51" y="56" width="18" height="20" rx="4" fill="#f7d36a" stroke="#a8781a" stroke-width="3"/><circle cx="60" cy="65" r="3" fill="#7a3f17"/>' +
    '<g class="bridge-chest-lid"><path d="M12 52C12 24 32 14 60 14S108 24 108 52Z" fill="#b5652b" stroke="#7a3f17" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M26 50C26 30 30 22 36 19M94 50C94 30 90 22 84 19" stroke="#f2c14e" stroke-width="9" fill="none"/></g></svg>';
  const cracksSvg = '<svg class="bridge-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" ' +
    'd="M50 50 20 6M50 50 86 12M50 50 97 58M50 50 66 96M50 50 12 84M50 50 3 38M34 28 12 30M72 30 92 38M58 74 80 86M30 66 26 92"/></svg>';
  dialog.innerHTML = '<div class="rain-scene bridge-scene">' +
    '<div class="bridge-world"><div class="bridge-water" aria-hidden="true"></div>' +
      '<div class="bridge-shore to" aria-hidden="true">' + shoreWave('down') + '<span class="bridge-palm one">🌴</span><span class="bridge-palm two">🌴</span>' +
        '<div class="bridge-sign"><small>Hedef</small><b class="bridge-to"></b></div>' + chestSvg + '</div>' +
      '<div class="bridge-shore from" aria-hidden="true">' + shoreWave('up') + '<span class="bridge-shell one">🐚</span><span class="bridge-shell two">⭐</span>' +
        '<div class="bridge-sign"><small>Buradasın</small><b class="bridge-from"></b></div></div>' +
      '<div class="bridge-track"><div class="bridge-frame" aria-hidden="true"><i class="cross"></i><i class="beam one"></i>' +
        '<i class="beam two"></i><i class="rail left"></i><i class="rail right"></i></div><div class="bridge-panes"></div>' +
        '<div class="bridge-turtle" aria-hidden="true"><div class="bridge-turtle-at"><i class="bridge-shadow"></i><div class="bridge-turtle-hop">' +
        '<div class="bridge-turtle-body">' + elifArt.turtle('bridge') + '</div></div></div>' +
        '<div class="bridge-bubble">' + speakerSvg + '<span></span></div></div>' +
        '<span class="bridge-dolphin" aria-hidden="true"><i>🐬</i></span></div>' +
    '</div>' +
    '<p class="rain-prompt" aria-hidden="true"></p>' +
    '<div class="rain-hud">' +
      '<div class="rain-left"><button type="button" class="rain-close btn-round" aria-label="Oyundan çık"></button>' +
      '<span class="rain-hearts" role="img"></span></div>' +
      '<button type="button" class="rain-listen" data-cue aria-label="Tekrar dinle">' + speakerSvg + '</button>' +
      '<div class="rain-score"><small>Puan</small><b>0</b></div>' +
      '<ol class="rain-slots" aria-label="Köprünün sıraları"></ol>' +
    '</div>' +
    '<div class="rain-toast" aria-hidden="true"></div>' +
    '<div class="rain-overlay" hidden></div>' +
    '<p class="rain-live" role="status"></p>' +
  '</div>';
  const find = selector => dialog.querySelector(selector);
  const scene = find('.bridge-scene');
  const world = find('.bridge-world');
  const track = find('.bridge-track');
  const paneBox = find('.bridge-panes');
  const turtle = find('.bridge-turtle');
  const hopper = find('.bridge-turtle-hop');
  const shadow = find('.bridge-shadow');
  const bubble = find('.bridge-bubble');
  const dolphin = find('.bridge-dolphin');
  const chest = find('.bridge-chest');
  const hud = find('.rain-hud');
  const listen = find('.rain-listen');
  const heartBox = find('.rain-hearts');
  const slotBox = find('.rain-slots');
  const scoreBox = find('.rain-score b');
  const prompt = find('.rain-prompt');
  const toast = find('.rain-toast');
  const overlay = find('.rain-overlay');
  const live = find('.rain-live');

  let options = null, game = null, state = 'idle', followUp = null, rounds = 0;
  let talkToken = 0, pendingDone = null, talking = false, moodTimer = 0, promptToken = 0;
  // Sizes, set by measure(): the bridge's width, a pane, a row, the two shores and the top bar.
  const box = { width: 0, height: 0, top: 0, bridge: 0, rail: 0, gap: 0, pane: 0, paneHigh: 0, row: 0, near: 0, far: 0, total: 0 };

  /* ---------- Game clock ---------- */
  // Everything that waits runs on this clock, so a paused game stands still.
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
  }
  function startClock() {
    if (frameId) return;
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  }
  function stopClock() { cancelAnimationFrame(frameId); frameId = 0; }
  // Motion is cut short for players who asked for less of it; the sounds keep their timing.
  const ms = n => calm.matches ? 1 : n;

  /* ---------- Layout ---------- */
  // Track coordinates: x across the bridge, y down from the far shore at the top.
  const rowY = n => box.far + (ROWS - n - 0.5) * box.row;
  const columnX = c => box.rail + box.gap + c * (box.pane + box.gap) + box.pane / 2;
  function spotXY(spot) {
    if (spot.at === 'near') return { x: box.bridge / 2, y: box.total - box.near * 0.5 };
    if (spot.at === 'far') return { x: box.bridge / 2, y: box.far * 0.62 };
    return { x: columnX(spot.col), y: rowY(spot.row) };
  }
  function measure() {
    box.width = scene.clientWidth;
    box.height = scene.clientHeight;
    if (!box.width || !box.height) return;
    box.top = hud.offsetTop + hud.offsetHeight;
    scene.style.setProperty('--ceil', box.top + 'px');
    const room = box.height - box.top;
    box.bridge = Math.min(540, box.width - 24);
    box.rail = Math.round(Math.max(10, Math.min(16, box.bridge * 0.035)));
    box.gap = Math.round(Math.max(9, Math.min(18, box.bridge * 0.04)));
    box.pane = Math.floor((box.bridge - 2 * box.rail - 4 * box.gap) / 3);
    box.paneHigh = Math.round(Math.min(box.pane * 0.86, room / 4.5));
    box.row = box.paneHigh + Math.round(Math.max(12, Math.min(26, box.paneHigh * 0.26)));
    box.near = Math.round(box.row * 1.5);
    box.far = Math.round(box.row * 2.1);
    box.total = box.far + ROWS * box.row + box.near;
    const turtleSize = Math.round(Math.min(box.pane * 0.86, box.paneHigh * 1.15, 128));
    for (const [name, value] of [['bridge', box.bridge], ['rail', box.rail], ['gap', box.gap], ['pane', box.pane],
      ['pane-high', box.paneHigh], ['row', box.row], ['near', box.near], ['far', box.far], ['total', box.total], ['turtle', turtleSize],
      ['drop', box.pane]]) scene.style.setProperty('--' + name, value + 'px');
    if (game) place();
  }
  // Puts every pane, the turtle and the camera where they belong, without animating.
  function place() {
    game.rows.forEach((row, n) => row.els.forEach((el, c) => {
      el.style.transform = 'translate(' + (columnX(c) - box.pane / 2) + 'px,' + (rowY(n) - box.paneHigh / 2) + 'px)';
    }));
    game.pos = spotXY(game.spot);
    turtle.style.transform = 'translate(' + game.pos.x + 'px,' + game.pos.y + 'px)';
    bubble.classList.toggle('left', game.pos.x > box.bridge * 0.6);
    aim(false);
  }
  // The camera keeps the row being asked a little above the middle of the screen, the turtle below it.
  function aim(smooth = true) {
    const focus = game.step < ROWS ? rowY(game.step) : box.far * 0.55;
    const y = box.top + (box.height - box.top) * 0.47 - focus;
    world.classList.toggle('still', !smooth || calm.matches);
    world.style.transform = 'translateY(' + Math.round(y) + 'px)';
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
    slotBox.innerHTML = Array.from({ length: ROWS }, () => '<li></li>').join('');
  }
  function markSlot() {
    Array.from(slotBox.children).forEach((slot, n) => slot.classList.toggle('now', n === game.step));
  }
  function addScore(points) {
    game.score += points;
    scoreBox.textContent = game.score;
    if (points) fx.bump(scoreBox.parentNode, 'rain-bump');
  }
  function setPrompt(words, seconds) {
    const mine = ++promptToken;
    prompt.textContent = words;
    if (seconds) after(seconds, () => { if (mine === promptToken) prompt.textContent = ''; });
  }
  const say = words => { live.textContent = words; };
  function mood(name, wait) {
    clearTimeout(moodTimer);
    turtle.classList.remove('happy', 'sad', 'dance');
    if (!name) return;
    void turtle.offsetWidth;
    turtle.classList.add(name);
    if (wait) moodTimer = setTimeout(() => turtle.classList.remove(name), wait);
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
  // Say the row's letter or syllable; `onDone` waits for the end of the saying.
  function narrate(onDone) {
    if (onDone) pendingDone = onDone;
    const token = ++talkToken;
    const target = game.rows[game.step].target;
    talk(true);
    let over = false;
    const end = heard => {
      if (over || token !== talkToken) return;
      over = true;
      talk(false, heard === false ? nameOf(target) : '');
      const done = pendingDone;
      pendingDone = null;
      done?.();
    };
    speak(target, end);
    after(3.5, () => end(false)); // the voice never reported back: carry on, and show the name
  }
  listen.onclick = () => {
    if (paused || !['ask', 'moving'].includes(state) || !game || game.step >= ROWS) return;
    narrate();
  };

  /* ---------- A game ---------- */
  function reset() {
    session++;
    timers = [];
    paused = false;
    pendingDone = null;
    hush();
    for (const node of scene.querySelectorAll('.bridge-shard, .bridge-ripple, .bridge-sink, .bridge-tag, .rain-fly, .rain-fx, .rain-points')) node.remove();
    dialog.querySelector('.fx-confetti')?.remove();
    for (const el of [hopper, shadow, dolphin, turtle]) el.getAnimations().forEach(a => a.cancel());
    toast.classList.remove('show');
    prompt.textContent = '';
    chest.classList.remove('open');
    scene.classList.remove('gloom', 'won');
  }
  function newGame(withIntro) {
    reset();
    game = {
      rows: build(options), step: 0, hearts: HEARTS, score: 0, streak: 0, crossed: [],
      spot: { at: 'near' }, safe: { at: 'near' }, pos: { x: 0, y: 0 }, listening: true, first: ++rounds === 1, saved: false
    };
    paneBox.replaceChildren(...game.rows.flatMap((row, n) => row.panes.map((item, c) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'bridge-pane t' + (n * 3 + c) % 5;
      el.dataset.cue = '';
      el.disabled = true;
      el.setAttribute('aria-label', nameOf(item));
      el.innerHTML = '<i class="bridge-glass"></i>' + glyph(item) + cracksSvg;
      if (Math.random() < 0.5) el.classList.add('flip');
      el.onclick = () => choose(n, c);
      row.els[c] = el;
      return el;
    })));
    drawHearts();
    drawSlots();
    addScore(0);
    mood(null);
    measure();
    if (withIntro) intro(); else begin();
  }
  function begin() {
    state = 'ready';
    hideCard();
    startClock();
    playCue('start');
    after(0.9, () => ask(true));
  }
  // The row to answer lights up, the turtle says its letter or syllable.
  function ask(fresh) {
    state = 'ask';
    const row = game.rows[game.step];
    game.rows.forEach((other, n) => other.els.forEach((el, c) => {
      el.disabled = n !== game.step || row.broken.has(c);
      el.classList.toggle('active', n === game.step);
    }));
    markSlot();
    aim();
    if (fresh) {
      game.listening = true;
      if (game.first && !game.step) setPrompt('👆 Duyduğun camı bul');
      say('Yeni sıra. Dinle.');
    }
    game.queued = null;
    narrate(heard);
  }
  // The saying of a row's letter has ended: a pane tapped while the turtle was still talking counts now.
  function heard() {
    game.listening = false;
    const c = game.queued;
    game.queued = null;
    if (c !== null && c !== undefined) choose(game.step, c);
  }

  /* ---------- Taps ---------- */
  function choose(n, c) {
    if (paused || state !== 'ask' || n !== game.step) return;
    const row = game.rows[n];
    if (row.broken.has(c)) return;
    // Before the turtle has finished saying it, a tap wobbles the pane and is kept: the turtle
    // hops onto it as soon as the saying ends, so the child never has to tap twice.
    if (game.listening) {
      if (!calm.matches) row.els[c].animate([{ rotate: '0deg' }, { rotate: '-4deg' }, { rotate: '3deg' }, { rotate: '0deg' }], { duration: 320 });
      game.queued = c;
      return;
    }
    state = 'moving';
    pendingDone = null;
    hush();
    setPrompt('');
    for (const el of row.els) el.disabled = true;
    const landing = hop({ row: n, col: c }, 520);
    if (c === row.right) after(landing, () => right(n, c));
    else after(landing, () => wrong(n, c));
  }
  // The turtle jumps to a spot: across the track, and up towards the camera halfway.
  function hop(spot, duration, height = 0.24) {
    const from = game.pos;
    game.spot = spot;
    game.pos = spotXY(spot);
    const to = game.pos;
    turtle.style.transform = 'translate(' + to.x + 'px,' + to.y + 'px)';
    bubble.classList.toggle('left', to.x > box.bridge * 0.6);
    duration = ms(duration);
    if (duration > 1) {
      turtle.animate([{ transform: 'translate(' + from.x + 'px,' + from.y + 'px)' }, { transform: 'translate(' + to.x + 'px,' + to.y + 'px)' }],
        { duration, easing: 'cubic-bezier(.45, .05, .35, 1)' });
      hopper.animate([{ transform: 'none' }, { transform: 'translateY(-' + Math.round(height * 100) + '%) scale(' + (1 + height) + ')', offset: 0.45 },
        { transform: 'none' }], { duration, easing: 'ease-in-out' });
      shadow.animate([{ transform: 'scale(1)', opacity: 0.4 }, { transform: 'scale(.55)', opacity: 0.15, offset: 0.45 },
        { transform: 'scale(1)', opacity: 0.4 }], { duration });
    }
    return duration / 1000;
  }
  const centre = el => {
    const at = el.getBoundingClientRect(), base = scene.getBoundingClientRect();
    return { x: at.left + at.width / 2 - base.left, y: at.top + at.height / 2 - base.top };
  };
  function right(n, c) {
    const row = game.rows[n];
    const el = row.els[c];
    const clean = !row.broken.size;
    game.streak = clean ? game.streak + 1 : 0;
    game.safe = { row: n, col: c };
    el.classList.add('safe');
    row.els.forEach((other, k) => { if (k !== c) other.classList.add('dim'); });
    playCue('glass', { rate: scale[Math.min(scale.length - 1, Math.max(0, game.streak - 1))] });
    const at = centre(el);
    sparkle(at);
    // 100 points for a row crossed without a broken pane, up to double for a long run of them; 50 after one.
    const points = clean ? Math.round(100 * Math.min(2, 1 + 0.1 * (game.streak - 1)) / 10) * 10 : 50;
    addScore(points);
    floatPoints('+' + points, at);
    fly(row.target, at, n);
    game.crossed.push(row.target);
    mood('happy', 800);
    if (game.streak >= 3 && game.streak % 3 === 0) showToast(pick(praise), '🔥 ' + game.streak + ' seri');
    else if (clean && Math.random() < 0.3) showToast(pick(praise));
    say('Doğru! ' + nameOf(row.target) + '.');
    game.step++;
    if (game.step === ROWS) { after(0.5, reachShore); return; }
    after(0.45, () => ask(true));
  }
  function wrong(n, c) {
    const row = game.rows[n];
    const el = row.els[c];
    const item = row.panes[c];
    row.broken.add(c);
    game.streak = 0;
    el.classList.add('cracked');
    playCue('crack');
    mood('sad');
    after(0.42, () => {
      shatter(n, c);
      fall();
      loseHeart();
      say('Bu ' + nameOf(item) + '. Cam kırıldı! ' + (game.hearts ? game.hearts + ' can kaldı.' : 'Canların bitti.'));
    });
    after(1.0, () => {
      ripple(game.pos);
      playCue('splash', { gain: 0.9, rate: 0.8 });
      if (!game.hearts) after(0.5, lose);
      else after(0.45, rescue);
    });
  }
  // The pane breaks into shards, and its letter sinks into the sea.
  function shatter(n, c) {
    const el = game.rows[n].els[c];
    const item = game.rows[n].panes[c];
    playCue('shatter');
    el.classList.add('gone');
    el.disabled = true;
    const x = columnX(c) - box.pane / 2, y = rowY(n) - box.paneHigh / 2;
    const tag = document.createElement('span');
    tag.className = 'bridge-tag';
    tag.textContent = nameOf(item);
    tag.style.transform = 'translate(' + (x + box.pane / 2) + 'px,' + (y + box.paneHigh) + 'px)';
    track.append(tag);
    setTimeout(() => tag.remove(), 2600);
    if (calm.matches) return;
    const sink = document.createElement('b');
    sink.className = 'bridge-sink';
    sink.lang = 'ar';
    sink.dir = 'rtl';
    sink.textContent = text(item);
    sink.style.transform = 'translate(' + (x + box.pane / 2) + 'px,' + (y + box.paneHigh / 2) + 'px)';
    track.append(sink);
    sink.animate([{ transform: sink.style.transform + ' translate(-50%,-50%)', opacity: 1 },
      { transform: sink.style.transform + ' translate(-50%,-50%) scale(.35) rotate(25deg)', opacity: 0 }], { duration: 1100, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => sink.remove(), 1200);
    // eight shards around the middle of the pane
    const rim = [[0, 0], [42, 0], [100, 0], [100, 46], [100, 100], [56, 100], [0, 100], [0, 52]];
    const tint = getComputedStyle(el).getPropertyValue('--mid');
    rim.forEach(([ax, ay], k) => {
      const [bx, by] = rim[(k + 1) % rim.length];
      const shard = document.createElement('i');
      shard.className = 'bridge-shard';
      shard.style.setProperty('--mid', tint);
      shard.style.clipPath = 'polygon(50% 50%,' + ax + '% ' + ay + '%,' + bx + '% ' + by + '%)';
      shard.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      track.append(shard);
      const dx = ((ax + bx) / 2 - 50) / 50, dy = ((ay + by) / 2 - 50) / 50;
      const spin = (Math.random() - 0.5) * 120;
      shard.animate([{ transform: shard.style.transform, opacity: 1 },
        { transform: 'translate(' + (x + dx * box.pane * 0.32) + 'px,' + (y + dy * box.paneHigh * 0.32) + 'px) rotate(' + spin / 3 + 'deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(' + (x + dx * box.pane * 0.5) + 'px,' + (y + dy * box.paneHigh * 0.5 + box.paneHigh * 0.1) + 'px) rotate(' + spin + 'deg) scale(.4)', opacity: 0 }],
      { duration: 850 + Math.random() * 250, easing: 'cubic-bezier(.2, .6, .5, 1)', fill: 'forwards' }).onfinish = () => shard.remove();
      setTimeout(() => shard.remove(), 1400);
    });
  }
  // Through the hole and into the sea.
  function fall() {
    if (calm.matches) { hopper.style.opacity = 0; return; }
    hopper.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-6%) scale(1.05) rotate(-8deg)', opacity: 1, offset: 0.2 },
      { transform: 'translateY(12%) scale(.3) rotate(150deg)', opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'forwards' });
    shadow.animate([{ opacity: 0.4 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
  }
  function ripple(at) {
    const ring = document.createElement('span');
    ring.className = 'bridge-ripple';
    ring.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
    ring.innerHTML = '<i></i><i></i><i></i>';
    track.append(ring);
    setTimeout(() => ring.remove(), 1300);
  }
  // A dolphin jumps up under the turtle and throws it back onto the last pane it stood on.
  function rescue() {
    const from = game.pos;
    for (const el of [hopper, shadow]) el.getAnimations().forEach(a => a.cancel());
    hopper.style.opacity = '';
    dolphin.style.transform = 'translate(' + from.x + 'px,' + from.y + 'px)';
    dolphin.classList.toggle('flip', spotXY(game.safe).x > from.x);
    say('Yunus kaplumbağayı kurtardı!');
    if (!calm.matches) {
      dolphin.animate([
        { transform: dolphin.style.transform + ' translate(-50%,-50%) translateY(40%) scale(.2) rotate(-30deg)', opacity: 0 },
        { transform: dolphin.style.transform + ' translate(-50%,-50%) translateY(-35%) scale(1.15) rotate(-12deg)', opacity: 1, offset: 0.35 },
        { transform: dolphin.style.transform + ' translate(-50%,-50%) translateY(-20%) scale(1.1) rotate(25deg)', opacity: 1, offset: 0.7 },
        { transform: dolphin.style.transform + ' translate(-50%,-50%) translateY(35%) scale(.3) rotate(60deg)', opacity: 0 }
      ], { duration: 1250, easing: 'ease-in-out' });
      hopper.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'translateY(-30%) scale(.6)', opacity: 1 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
    }
    after(0.38, () => {
      hopper.getAnimations().forEach(a => a.cancel());
      if (!calm.matches) hopper.animate([{ transform: 'translateY(-30%) scale(.6)' }, { transform: 'translateY(-55%) scale(1.4) rotate(-10deg)', offset: 0.5 },
        { transform: 'none' }], { duration: 760, easing: 'ease-in-out' });
      const landing = hop(game.safe, 760, 0);
      playCue('pop', { rate: 0.8, gain: 0.6 });
      after(landing + 0.1, () => {
        ripple(from);
        mood(null);
        ask(false);
      });
    });
  }

  /* ---------- Effects ---------- */
  function sparkle(at) {
    if (calm.matches) return;
    const holder = document.createElement('span');
    holder.className = 'rain-fx';
    holder.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
    holder.innerHTML = '<i class="flash"></i>';
    scene.append(holder);
    fx.burst(holder, { count: 12, symbols: ['★', '✦', '●', '✧'], spread: box.pane });
    setTimeout(() => holder.remove(), 1200);
  }
  function floatPoints(words, at) {
    const tag = document.createElement('span');
    tag.className = 'rain-points';
    tag.textContent = words;
    tag.style.left = Math.max(36, Math.min(box.width - 44, at.x + box.pane * 0.3)) + 'px';
    tag.style.top = at.y - box.paneHigh * 0.4 + 'px';
    scene.append(tag);
    setTimeout(() => tag.remove(), 1000);
  }
  // The crossed row's letter flies up into its slot.
  function fly(item, at, index) {
    const slot = slotBox.children[index];
    const mine = session;
    let landed = false;
    const land = () => {
      if (landed || mine !== session || !slot?.isConnected) return;
      landed = true;
      slot.className = 'got t' + index % 5;
      slot.innerHTML = glyph(item);
      playCue('key', { gain: 0.45 });
    };
    if (calm.matches || !slot) return land();
    const to = slot.getBoundingClientRect(), base = scene.getBoundingClientRect();
    const x = to.left + to.width / 2 - base.left, y = to.top + to.height / 2 - base.top;
    const piece = document.createElement('b');
    piece.className = 'rain-fly';
    piece.lang = 'ar';
    piece.dir = 'rtl';
    piece.textContent = text(item);
    scene.append(piece);
    const end = Math.max(0.2, to.width / (box.pane * 0.8));
    const move = (px, py, size) => ({ transform: 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px) translate(-50%,-50%) scale(' + size.toFixed(2) + ')' });
    piece.animate([move(at.x, at.y, 1), { ...move((at.x + x) / 2 + (at.x < x ? -46 : 46), (at.y + y) / 2, 1.05), offset: 0.45 }, move(x, y, end)],
      { duration: 700, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).onfinish = () => { piece.remove(); land(); };
    setTimeout(() => { piece.remove(); land(); }, 1200);
  }

  /* ---------- The far shore ---------- */
  function later(wait, fn) {
    const mine = session;
    setTimeout(() => { if (mine === session) fn(); }, wait);
  }
  function keep(finished) {
    if (!game || game.saved || !game.score) return;
    game.saved = true;
    return options.onResult({ score: game.score, stars: finished ? game.hearts : 0, finished: !!finished });
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

  // Over the last row: the turtle jumps onto the far shore and the chest opens.
  function reachShore() {
    state = 'won';
    for (const row of game.rows) for (const el of row.els) el.classList.remove('active');
    markSlot();
    aim();
    const landing = hop({ at: 'far' }, 760, 0.35);
    after(landing, () => {
      const whole = game.hearts === HEARTS;
      scene.classList.add('won');
      chest.classList.add('open');
      mood('dance');
      playCue(whole ? 'victory' : 'island');
      fx.confetti(dialog, whole ? undefined : { count: 70 });
      if (!calm.matches) {
        const holder = document.createElement('span');
        holder.className = 'rain-fx';
        const at = centre(chest);
        holder.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)';
        scene.append(holder);
        fx.burst(holder, { count: 14, symbols: ['🦪', '🐚', '✦', '★'], spread: box.pane * 1.3 });
        setTimeout(() => holder.remove(), 1300);
      }
      say(options.toDative + ' ulaştın!');
      after(1.8, result);
    });
  }
  function result() {
    state = 'result';
    stopClock();
    const stars = game.hearts;
    const whole = stars === HEARTS;
    const best = { ...options.best() };
    // the islet's reward for the Akvaryum, if crossing it brought one
    const prize = keep(true) || '';
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const words = whole ? 'Hiç cam kırmadan 15 sırayı geçtin ve ' + options.toDative + ' ulaştın!' :
      options.toDative + ' ulaştın ama ' + (HEARTS - stars) + ' cam kırıldı. Üç yıldız için bir dahaki sefere hiç cam kırmadan geçmeyi dene!';
    const next = options.next?.();
    showCard('<div class="rain-card result"><div class="rain-stars" role="img" aria-label="' + stars + ' yıldız">' + [0, 1, 2].map(n =>
      '<svg viewBox="0 0 24 24" aria-hidden="true"' + (n < stars ? ' class="won" style="--d:' + (0.35 + n * 0.3) + 's"' : '') +
      '><path d="' + starPath + '"/></svg>').join('') + '</div>' +
      '<h2 id="rain-title" tabindex="-1">' + (whole ? 'Mükemmel!' : 'Köprüyü geçtin!') + '</h2><p>' + words + '</p>' +
      '<p class="rain-total"><b>0</b> puan</p>' + recordLine(record, best) + prize +
      '<div class="rain-recap"><p>Köprüdeki harfler ve heceler · dokun, dinle</p><div>' + game.crossed.map((item, n) =>
        '<button type="button" class="rain-chip t' + n % 5 + '" data-cue data-n="' + n + '" aria-label="' + nameOf(item) + ' dinle">' +
        glyph(item) + '<span>' + nameOf(item) + '</span></button>').join('') + '</div></div>' +
      '<div class="rain-actions">' + (next ? '<button type="button" class="rain-go rain-next" data-cue>▶ Devam: ' + next.label + '</button>' +
        '<button type="button" class="rain-back rain-again">↻ Tekrar oyna</button>' :
        '<button type="button" class="rain-go rain-again" data-cue>↻ Tekrar oyna</button><button type="button" class="rain-back">Adaya dön</button>') +
      '</div></div>');
    overlay.querySelector('.rain-again').onclick = () => newGame(false);
    if (next) overlay.querySelector('.rain-next').onclick = () => { followUp = next.go; dialog.close(); };
    else overlay.querySelector('.rain-back').onclick = () => dialog.close();
    for (const chip of overlay.querySelectorAll('.rain-chip')) {
      chip.onclick = () => { fx.bump(chip, 'rain-bump'); speak(game.crossed[Number(chip.dataset.n)]); };
    }
    for (let n = 0; n < stars; n++) later(350 + n * 300, () => playCue('star', { rate: [1, 1.26, 1.5][n] }));
    countUp(overlay.querySelector('.rain-total b'), game.score);
  }

  /* ---------- Hearts gone: start again ---------- */
  function lose() {
    state = 'lost';
    pendingDone = null;
    hush();
    setPrompt('');
    scene.classList.add('gloom');
    playCue('retry');
    after(1.2, over);
  }
  const RESTART = 4.5;
  function over() {
    state = 'over';
    const best = { ...options.best() };
    keep(false);
    const record = game.score > 0 && game.score > (best.rekor || 0);
    const words = (game.step ? game.step + ' / ' + ROWS + ' sırayı geçtin. ' : 'Sesi dikkatle dinle, sonra o camı bul. ') + 'Köprü baştan başlıyor!';
    showCard('<div class="rain-card over"><div class="rain-broken" aria-hidden="true">' + heartSvg + '</div>' +
      '<h2 id="rain-title" tabindex="-1">Canların bitti!</h2><p>' + words + '</p>' +
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
    const sample = options.cezm ? [1, 2, 3].map(n => ({ i: options.recent[n] ?? options.recent[0], c: true })) :
      options.tenvin ? [1, 0, 2].map((h, n) => ({ i: options.recent[n] ?? options.recent[0], h, t: true })) :
      options.sedde ? [1, 0, 2].map((h, n) => ({ i: options.recent[n] ?? options.recent[0], h, s: 0 })) :
      options.joined ? [1, 2, 3].map(f => ({ i: options.recent[f] ?? options.recent[0], h: f - 1, f })) :
      [{ i: options.recent[0], h: 1 }, { i: options.recent[1] ?? options.recent[0], h: 0 }, { i: options.recent[2] ?? options.recent[0], h: 2 }];
    showCard('<div class="rain-card intro"><div class="bridge-intro-art" aria-hidden="true">' + sample.map((item, n) =>
      '<span class="bridge-pane t' + [0, 4, 1][n] + '"><i class="bridge-glass"></i>' + glyph(item) + '</span>').join('') +
      '</div><h2 id="rain-title" tabindex="-1">Cam <em>Köprü</em></h2>' +
      '<p>Kaplumbağa ' + options.toDative + ' gitmek için cam köprüden geçecek. Her sırada üç cam var. Kaplumbağa bir ' +
      'hece okuyacak, sen o camı bul.' + (options.joined ? ' Harekeli harfler camlarda bitişik yazılışlarıyla duruyor: kelimenin başındaki, ' +
      'ortasındaki ya da sonundaki şekilleriyle.' : options.cezm ? ' Camlardaki hecelerin hepsi cezimli.' :
      options.tenvin ? ' Okunan hece hep tenvinli; camlarda tenvinsiz heceler de var.' :
      options.sedde ? ' Okunan hece hep şeddeli; camlarda şeddesiz heceler de var.' : ' Camlardaki harflerin hepsi harekeli.') +
      ' Yanlış cam kırılır, kaplumbağa denize düşer! Hiç cam kırmazsan üç yıldız.</p>' +
      '<ul class="rain-facts"><li><b>15</b><span>sıra</span></li><li><b>Karma</b><span>' + (options.joined ? 'şekil ve hece' : options.cezm ? 'cezimli hece' :
      options.tenvin ? 'tenvinli hece' : options.sedde ? 'şeddeli hece' : 'harekeli hece') +
      '</span></li><li><b>3</b><span>can</span></li></ul>' +
      '<div class="rain-pool bridge-pool" aria-label="Köprüdeki harfler">' + options.letters.map(i => '<b lang="ar" title="' + names[i] + '">' +
        (options.joined ? shape(i, 2, 0) : options.cezm ? cezm(i).text : options.tenvin ? tenvin(i, 1) : options.sedde ? seddeKind.text(i * 3) :
          syllable(i, 0)) + '</b>').join('') + '</div>' +
      (best.tamam ? '<p class="rain-record">✅ Köprüyü hiç cam kırmadan geçtin · 🏆 ' + best.rekor + ' puan</p>' :
        best.rekor ? '<p class="rain-record">🏆 Rekorun: ' + best.rekor + ' puan</p>' : '') +
      '<button type="button" class="rain-go" data-cue>▶ Başla</button></div>');
    // The game's introduction is said aloud only when the turtle (info) button is tapped.
    const tell = () => voice.instruct('Cam Köprü! Kaplumbağa bir hece okuyacak. Doğru cama dokun, kaplumbağa üstüne zıplasın. ' +
      (options.joined ? 'Harekeli harfler camlarda bitişik şekilleriyle duruyor. ' : options.cezm ? 'Camlarda cezimli heceler var. Dikkatle dinle. ' :
        options.tenvin ? 'Kaplumbağa tenvinli heceler okuyacak. Sondaki n sesine dikkat et. ' :
        options.sedde ? 'Kaplumbağa şeddeli heceler okuyacak. Şeddeli harf iki kez okunur. ' : '') + 'Yanlış cam kırılır! Başlamak için yeşil düğmeye bas.');
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'rain-tell';
    again.setAttribute('aria-label', 'Oyunu anlat');
    again.innerHTML = '<span aria-hidden="true">🐢💬</span>';
    again.onclick = tell;
    overlay.querySelector('.rain-card').prepend(again);
    overlay.querySelector('.rain-go').onclick = () => { voice.stop(); begin(); };
  }
  // Leaving the app mid-game pauses it; the child picks up where they were.
  function pause() {
    if (paused || !['ready', 'ask', 'moving'].includes(state)) return;
    paused = true;
    hush();
    if (game) game.queued = null;
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
    if (state === 'ask') narrate(game.listening ? heard : undefined);
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

  // letters: the letters learned up to this cove; recent: the cove's own, asked most; joined: a bitişik
  // yazılış cove, whose panes show the harekeli letters' joined shapes, with known: all the letters, for
  // the syllables alone mixed in; cezm: a cezm cove, whose panes show only the letters' cezm syllables; tenvin: a
  // tenvin cove, whose rows ask the letters' tenvins; sedde: a şedde cove, whose rows ask the letters' şedde syllables;
  // from, to, toDative: the cove the bridge starts at and the one it leads to ("İnci Koyu'na");
  // best(): the player's { rekor, yildiz, tamam }; onResult({ score, stars, finished }) keeps them and may
  // return html for the result card (the Akvaryum's reward);
  // next(): optional, { label, go } of the step after the bridge.
  function open(settings) {
    options = settings;
    rounds = 0;
    find('.bridge-from').textContent = settings.from;
    find('.bridge-to').textContent = settings.to;
    voice.preload(settings.letters, false, settings.joined, settings.cezm, settings.tenvin, settings.sedde);
    if (!dialog.open) dialog.showModal();
    newGame(true);
  }
  return { open };
})();
