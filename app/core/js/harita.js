// Keşif Haritası: the islands of the 1st to 4th grades as one map in three levels, like Elif Ba Adası's map
// (islands/elif-ba/map.js) is for preschool:
//  1. The bays (koylar), one for every subject of the player's grade: Çarpım Koyu, Din Bilgisi Koyu …
//  2. A bay: its islands (adalar) joined by bridges. Çarpım Koyu's six islands are its timed rounds; a question
//     island's are the textbook's units, the extras and the mock exam.
//  3. An island: its stations (duraklar) along a path. Tapping one opens its game.
// Tapping a bay or an island zooms into it, ‹ zooms back out. The player's own icon stands where they are and
// walks on to the next station, or the next island, when one is done.
//
// Each subject registers its bay with kesifHaritasi.koy({...}) and the map asks it what is open every time it
// draws (so it never keeps its own copy of the progress):
//   id, kart     the bay's id and the catalog card whose data-grades say which grades see it
//   ad, lead     the bay's name and what is learned there; simge: its sign; tema: carpim | din | fen | sosyal | ingilizce
//   hazirla()    load the active player's progress (called before anything else is asked)
//   adalar()     [{ ad, kisa, simge, durum, not }]: durum is done | now | open | locked
//   duraklar(k)  the stations of island k: [{ simge, resim?, ad, etiket, durum, not }] (resim: a picture in place of the sign)
//   ac(k, n)     open the game of station n of island k
//   kilit(k)     what to say when a locked island is tapped
//   panel(level, k)  a node shown under the map: what to do next, progress, notes
//   yakinda()    true while the bay has nothing to play yet: it says "Yakında" instead of its island count
//   araclar      true: the header's Çarpım tools (statistics, stars) are shown inside the bay
const kesifHaritasi = (() => {
  const { r1, curve, pathOf, palm, lighthouse, rainbow, boat, moon, gulls, cloud, twinkle, mosque, waves, sea, compass, whale } = haritaSanat;
  const W = 400, H = 680;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const pct = (v, of) => (v / of * 100).toFixed(2) + '%';
  const spot = ([x, y]) => ({ left: pct(x, W), top: pct(y, H) });
  const wait = ms => new Promise(resolve => setTimeout(resolve, calm.matches ? 0 : ms));
  const esc = text => String(text ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const defs = [];
  let list = [];                  // the bays of the player's grade
  let level = 'koylar', bay = 0, isle = 0, owner = null;
  const at = new Map();           // the island the player stands on in each bay (bay id → island)
  const seen = new Map();         // the states a place had when it was last drawn
  let moving = false;

  /* ---------- Layout ---------- */
  // The bays sit left and right, up the map; a single bay sits in the middle.
  const bayAt = (b, n) => n === 1 ? [200, 330] : [b % 2 ? 292 : 108, Math.round(540 - b * 395 / (n - 1))];
  // A bay's islands snake up in rows of three, from the bottom left.
  function islePlaces(count) {
    const rows = Math.ceil(count / 3), gap = rows > 1 ? Math.min(185, 440 / (rows - 1)) : 0, bottom = 400 + gap * (rows - 1) / 2;
    return Array.from({ length: count }, (_, n) => {
      const row = Math.floor(n / 3), col = n % 3;
      return [[78, 200, 322][row % 2 ? 2 - col : col], Math.round(bottom - row * gap + (col === 1 ? -24 : 10))];
    });
  }
  // An island's stations zigzag up its path.
  function stationPlaces(count) {
    const span = Math.min(400, (count - 1) * 100);
    return Array.from({ length: count }, (_, n) => count === 1 ? [200, 420] :
      [n % 2 ? 280 : 120, Math.round(400 + span / 2 - n * span / (count - 1))]);
  }
  const ISLAND = 'M200 150C292 148 356 204 360 298C364 378 372 468 336 550C302 626 236 654 176 650C110 646 52 608 40 530C28 448 46 378 42 308C38 218 108 152 200 150Z';
  const seas = {
    carpim: ['#8fe3ee', '#62c9dd', '#3cb0c8'], din: ['#a6ecdf', '#6fd2d0', '#35adbf'],
    fen: ['#6c6fbf', '#5aa9d6', '#3cb0c8'], sosyal: ['#b5eccb', '#62c9c4', '#2f9fb8'], ingilizce: ['#c9e4ff', '#7cc0ec', '#3a96c8']
  };
  const sparkles = points => '<g class="map-sparkles" fill="#fff">' + points.map(twinkle).join('') + '</g>';

  /* ---------- Level 1: the bays ---------- */
  function bayArt(def, b, n, count) {
    const [x, y] = bayAt(b, n);
    const side = n === 1 ? 1 : b % 2 ? 1 : -1;
    const decor = {
      carpim: palm(side * 66, -8, 1.05, side > 0) + boat(-side * 46, -26, .9, side > 0) + gulls(side * 18, -52),
      din: mosque(side * 42, -14) + moon(-side * 52, -46, .8) + palm(-side * 70, -6, .85, side < 0),
      fen: lighthouse(side * 50, -18) + twinkle([-side * 40, -54], 0) + twinkle([side * 6, -62], 2) + palm(-side * 66, -8, .9, side < 0),
      sosyal: palm(side * 66, -8, 1.05, side > 0) + palm(side * 46, -16, .8, side < 0) + boat(-side * 58, -22, .85, side < 0),
      ingilizce: rainbow(side * 4, -30, .9) + boat(side * 60, -18, .85, side > 0) + palm(-side * 68, -8, .9, side < 0)
    }[def.tema] || palm(side * 60, -12, 1.05, side > 0);
    const dots = Array.from({ length: count }, (_, k) => [count > 1 ? r1(-50 + k * 100 / (count - 1)) : 0, r1(12 - 9 * Math.sin(Math.PI * (count > 1 ? k / (count - 1) : .5)))]);
    return '<g class="kh-bay-art" data-b="' + b + '" transform="translate(' + x + ' ' + y + ')"><g class="kh-bay-in" style="--n:' + b + '">' +
      '<ellipse class="kh-halo" rx="98" ry="52" fill="none" stroke="#ffe38a" stroke-width="5"/>' +
      '<ellipse rx="94" ry="48" fill="#a8ecf2" opacity=".75"/><ellipse rx="80" ry="38" fill="#f3d892"/>' +
      '<path d="M-76-4C-70-34 70-34 76-4C58-22-58-22-76-4Z" fill="#9fd88a"/>' +
      '<path d="M-60 8C-60-12 60-12 60 8C60 22 32 26 14 28Q9 34 10 44H-10Q-9 34-14 28C-32 26-60 22-60 8Z" fill="#8fe0ea"/>' +
      (count > 1 ? '<polyline class="kh-dot-lane" points="' + dots.map(p => p.join(' ')).join(' ') + '"/>' : '') +
      dots.map(([dx, dy], k) => '<g class="kh-dot" data-k="' + k + '" transform="translate(' + dx + ' ' + dy + ')"><circle r="6.2" class="kh-dot-sand"/>' +
        '<circle r="3.2" cy="-1.3" class="kh-dot-top"/></g>').join('') + decor + '</g></g>';
  }
  function baysScene() {
    const n = list.length;
    return '<svg class="kh-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('kh-sea-bays', ['#7fd6e6', '#6fcde0', '#3cb0c8'], W, H) +
      waves([[250, 30], [40, 120], [190, 200], [370, 250], [24, 330], [200, 300], [360, 400], [196, 470], [30, 520], [370, 580], [200, 650], [40, 668]]) +
      sparkles([[230, 90], [30, 220], [380, 470], [180, 400], [20, 590], [270, 640]]) +
      // the harbour the boats leave from, at the bottom of the map
      '<g class="kh-harbour"><path d="M0 640Q100 618 200 632T400 628V680H0Z" fill="#f3d892"/><path d="M0 656Q120 640 230 652T400 650V680H0Z" fill="#9fd88a"/>' +
      palm(40, 648, 1.1) + palm(364, 646, 1, true) + '</g>' +
      list.map((def, b) => bayArt(def, b, n, def.adalar().length)).join('') + compass(352, 52) + '</svg>' +
      list.map((def, b) => { const [x, y] = bayAt(b, n); return '<button type="button" class="kh-bay" data-b="' + b + '" data-cue style="--n:' + b + ';left:' + pct(x - 92, W) + ';top:' + pct(y - 58, H) +
        ';width:' + pct(184, W) + ';height:' + pct(150, H) + '"><span class="kh-bay-sign" aria-hidden="true">' + esc(def.simge) + '</span>' +
        '<span class="kh-bay-label"><span class="kh-bay-name"><i class="kh-badge" aria-hidden="true"></i>' + esc(def.ad) + '</span>' +
        '<small>' + esc(def.lead) + '</small><em></em></span></button>'; }).join('') + me();
  }

  /* ---------- Level 2: a bay and its islands ---------- */
  function isleArt(def, [x, y], k) {
    const flip = k % 2 ? ' scale(-1 1)' : '';
    const extra = { din: k % 3 === 1 ? moon(-34, -34, .55) : '', fen: k % 3 === 2 ? twinkle([-30, -36], k) : '', carpim: k % 3 === 2 ? gulls(-18, -40, .8) : '', sosyal: '', ingilizce: k % 3 === 1 ? gulls(-18, -40, .8) : '' }[def.tema] || '';
    return '<g class="kh-isle-art" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="kh-isle-in" style="--n:' + k + '">' +
      '<ellipse class="kh-halo" rx="58" ry="36" fill="none" stroke="#ffe38a" stroke-width="5"/>' +
      '<ellipse rx="55" ry="33" fill="#a8ecf2" opacity=".75"/><ellipse rx="45" ry="26" fill="#f3d892"/>' +
      '<g transform="' + flip.trim() + '"><path d="M-32-4C-28-19 0-24 19-17c13 6 9 17-6 19C-8 5-34 7-32-4Z" fill="#9fd88a"/>' + palm(24, -10, .9) + '</g>' + extra + '</g></g>';
  }
  function bayScene(def) {
    const islands = def.adalar(), spots = islePlaces(islands.length);
    const headlands = '<g><path d="M0 0H138C120 26 92 40 60 52 34 62 14 86 0 118Z" fill="#f3d892"/><path d="M0 0H124C106 18 80 30 52 40 30 48 12 66 0 92Z" fill="#9fd88a"/>' +
      '<path d="M400 0H262C282 22 312 30 342 40 370 50 388 74 400 104Z" fill="#f3d892"/><path d="M400 0H276C294 14 320 22 348 30 372 38 390 56 400 80Z" fill="#9fd88a"/>' +
      palm(30, 50, 1.1) + palm(372, 40, 1.05, true) + '</g>';
    const theme = {
      carpim: lighthouse(370, 620, 1) + gulls(110, 150) + gulls(300, 640, .9) + boat(40, 640, 1.4),
      din: moon(344, 150, 1.3) + sparkles([[60, 160], [250, 120], [370, 330], [30, 450]]) + mosque(360, 650),
      fen: moon(56, 150, 1.2) + sparkles([[120, 120], [290, 100], [60, 260], [240, 190], [370, 300], [30, 470], [350, 520]]) + lighthouse(370, 650, 1),
      sosyal: compass(52, 630) + boat(350, 150, 1.5, true) + gulls(140, 140),
      ingilizce: rainbow(300, 170, 1.2) + whale(70, 600) + boat(350, 640, 1.3, true) + gulls(130, 150)
    }[def.tema] || '';
    const bridges = spots.slice(0, -1).map((p, k) => '<g class="kh-bridge" data-k="' + k + '"><path class="kh-rails" d="M' + p.join(' ') + 'L' + spots[k + 1].join(' ') +
      '"/><path class="kh-panes" d="M' + p.join(' ') + 'L' + spots[k + 1].join(' ') + '"/></g>').join('');
    return '<svg class="kh-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('kh-sea-' + def.id, seas[def.tema] || seas.carpim, W, H) +
      waves([[250, 170], [60, 300], [330, 410], [150, 560], [40, 520], [300, 672], [370, 330], [120, 668]]) + theme + headlands +
      bridges + spots.map((p, k) => isleArt(def, p, k)).join('') + '</svg>' +
      islands.map((island, k) => '<button type="button" class="kh-isle" data-k="' + k + '" data-cue style="--n:' + k + ';left:' + pct(spots[k][0], W) + ';top:' + pct(spots[k][1], H) +
        '"><span class="kh-badge" aria-hidden="true"></span><span class="kh-isle-sign" aria-hidden="true">' + esc(island.simge) + '</span>' +
        '<span class="kh-isle-name">' + esc(island.kisa || island.ad) + '<small></small></span></button>').join('') +
      me() + header('Koylara dön');
  }

  /* ---------- Level 3: an island and its stations ---------- */
  function isleScene(def, k) {
    const stations = def.duraklar(k), spots = stationPlaces(stations.length);
    const trail = pathOf(curve([[200, 668], ...spots]));
    const decor = { din: moon(334, 110, 1.4) + mosque(330, 640), fen: moon(70, 110, 1.3) + sparkles([[160, 90], [270, 70], [20, 260], [384, 330]]),
      carpim: gulls(80, 118, 1.3) + gulls(320, 100) + boat(360, 640, 1.4, true), sosyal: compass(352, 110) + boat(46, 640, 1.4),
      ingilizce: rainbow(320, 120, 1.1) + gulls(80, 118, 1.2) + boat(46, 640, 1.4) }[def.tema] || '';
    return '<svg class="kh-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('kh-sea-isle', seas[def.tema] || seas.carpim, W, H) +
      waves([[60, 130], [300, 90], [20, 400], [370, 420], [40, 660], [330, 668], [240, 120]]) +
      '<path d="' + ISLAND + '" fill="#e9fbff" opacity=".45" stroke="#e9fbff" stroke-width="44" stroke-linejoin="round"/>' +
      '<path d="' + ISLAND + '" fill="#a8ecf2" stroke="#a8ecf2" stroke-width="22" stroke-linejoin="round"/>' +
      '<path d="' + ISLAND + '" fill="#f3d892"/>' +
      '<path d="' + ISLAND + '" fill="#9fd88a" transform="translate(200 400) scale(.8 .82) translate(-200 -404)"/>' +
      '<g fill="#86c96e">' + [[110, 330], [292, 410], [150, 520], [250, 260], [300, 540]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="16" ry="6"/>').join('') + '</g>' +
      '<g>' + [[96, 420, '#ff9a8b'], [306, 316, '#ffd863'], [226, 600, '#ff9a8b'], [160, 230, '#fff'], [318, 486, '#fff']].map(([x, y, c]) =>
        '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + c + '"/><circle cx="' + (x + 8) + '" cy="' + (y + 3) + '" r="3" fill="' + c + '"/>').join('') + '</g>' +
      '<path class="kh-trail" d="' + trail + '"/><path class="kh-trail-dots" d="' + trail + '"/>' +
      palm(62, 300, 1.5) + palm(344, 360, 1.4, true) + palm(80, 590, 1.3, true) + palm(326, 600, 1.2) + palm(236, 182, 1.1) + decor + '</svg>' +
      stations.map((station, n) => '<button type="button" class="kh-station" data-n="' + n + '" style="--n:' + n + ';left:' + pct(spots[n][0], W) + ';top:' + pct(spots[n][1], H) + '">' +
        '<span class="kh-station-icon' + (station.resim ? ' resim' : '') + '" aria-hidden="true">' + (station.resim ? '<img src="' + esc(station.resim) + '" alt="" draggable="false">' : esc(station.simge)) + '</span><span class="kh-station-state" aria-hidden="true"></span>' +
        '<span class="kh-station-name">' + esc(station.ad) + '<small></small></span></button>').join('') +
      me() + header('Koya dön');
  }

  const me = () => '<div class="kh-me" aria-hidden="true"><span><b>' + esc(activeProfile?.icon || '⛵') + '</b></span></div>';
  const header = back => '<button type="button" class="kh-back btn-round is-back" aria-label="' + back + '"></button><div class="kh-title"></div>';

  /* ---------- Drawing ---------- */
  const sceneOf = name => host.querySelector('.kh-scene[data-level="' + name + '"]');
  let host = null;
  function frame() {
    if (host) return;
    host = $('kesif-map');
    host.innerHTML = ['koylar', 'koy', 'ada'].map(name => '<div class="kh-scene" data-level="' + name + '"' + (name === 'koylar' ? '' : ' hidden') + '></div>').join('') +
      '<p class="kh-hint" role="status" hidden></p>';
  }
  const current = () => list[bay];
  const badge = (state, number) => state === 'done' ? '✓' : state === 'locked' ? '🔒' : String(number);
  const stateWord = state => ({ done: ', tamamlandı', now: ', sıradaki', open: '', locked: ', kilitli' })[state] || '';
  function stand(name, point, animate) {
    const marker = sceneOf(name).querySelector('.kh-me');
    if (!marker || !point) return;
    const from = marker.style.left ? [parseFloat(marker.style.left) / 100 * W, parseFloat(marker.style.top) / 100 * H] : null;
    Object.assign(marker.style, spot(point));
    if (animate && from && !calm.matches && (Math.abs(from[0] - point[0]) > 1 || Math.abs(from[1] - point[1]) > 1)) {
      const mid = [(from[0] + point[0]) / 2, Math.min(from[1], point[1]) - 40];
      marker.classList.add('hopping');
      marker.animate([spot(from), spot(mid), spot(point)], { duration: 900, easing: 'ease-in-out' }).finished
        .catch(() => {}).then(() => marker.classList.remove('hopping'));
    }
  }
  // Pops what became done since the place was last drawn, where the child can see it.
  // A place out of sight keeps the states it was last seen with, so it cheers once it is shown.
  function cheer(root, selector, key, states) {
    const before = seen.get(key);
    if (root.hidden) { if (!before) seen.set(key, states); return []; }
    seen.set(key, states);
    if (!before || document.querySelector('dialog[open]')) return [];
    const fresh = states.map((s, i) => s === 'done' && before[i] !== 'done' ? i : -1).filter(i => i >= 0);
    setTimeout(() => fresh.forEach(i => {
      const node = root.querySelector(selector + '[data-' + (selector === '.kh-station' ? 'n' : 'k') + '="' + i + '"]');
      if (!node) return;
      fx.bump(node, 'fresh');
      fx.burst(node, { count: 14, spread: 90 });
      playCue('star', { gain: 0.5 });
    }), 250);
    return fresh;
  }
  function paintBays() {
    const root = sceneOf('koylar');
    list.forEach((def, b) => {
      const islands = def.adalar();
      const done = islands.filter(i => i.durum === 'done').length;
      const state = done === islands.length ? 'done' : done || islands.some(i => i.durum === 'now') ? 'current' : 'open';
      const button = root.querySelector('.kh-bay[data-b="' + b + '"]');
      button.className = 'kh-bay ' + state + (b === bay ? ' here' : '');
      button.querySelector('.kh-badge').textContent = state === 'done' ? '✓' : b + 1;
      const soon = def.yakinda?.();
      button.querySelector('em').textContent = soon ? 'Yakında' : done + ' / ' + islands.length + ' ada';
      button.setAttribute('aria-label', def.ad + ', ' + def.lead + ', ' + (soon ? 'yakında' : done + ' / ' + islands.length + ' ada tamamlandı'));
      root.querySelector('.kh-bay-art[data-b="' + b + '"]').setAttribute('class', 'kh-bay-art ' + state);
      islands.forEach((island, k) => root.querySelector('.kh-bay-art[data-b="' + b + '"] .kh-dot[data-k="' + k + '"]').setAttribute('class', 'kh-dot ' + island.durum));
    });
    const [x, y] = bayAt(bay, list.length);
    stand('koylar', [x + (list.length === 1 || bay % 2 ? -64 : 64), y + 14], false);
  }
  function paintBay(animate) {
    const def = current(), root = sceneOf('koy');
    const islands = def.adalar(), spots = islePlaces(islands.length);
    islands.forEach((island, k) => {
      const button = root.querySelector('.kh-isle[data-k="' + k + '"]');
      button.className = 'kh-isle ' + island.durum + (k === isle ? ' here' : '');
      button.querySelector('.kh-badge').textContent = badge(island.durum, k + 1);
      button.querySelector('small').textContent = island.not || '';
      button.setAttribute('aria-label', (k + 1) + '. ' + island.ad + (island.not ? ', ' + island.not : '') + stateWord(island.durum));
      button.setAttribute('aria-disabled', String(island.durum === 'locked'));
      root.querySelector('.kh-isle-art[data-k="' + k + '"]').setAttribute('class', 'kh-isle-art ' + island.durum);
      const way = root.querySelector('.kh-bridge[data-k="' + k + '"]');
      if (way) way.setAttribute('class', 'kh-bridge ' + (island.durum === 'done' ? 'crossed' : islands[k + 1]?.durum === 'locked' ? 'locked' : 'open'));
    });
    const title = root.querySelector('.kh-title');
    const done = islands.filter(i => i.durum === 'done').length;
    title.innerHTML = '<strong>' + esc(def.ad) + '</strong><small>' + esc(def.lead) + ' · ' + (def.yakinda?.() ? 'Yakında' : done + ' / ' + islands.length + ' ada') + '</small>';
    cheer(root, '.kh-isle', 'b:' + def.id, islands.map(i => i.durum));
    stand('koy', [spots[isle][0] + 40, spots[isle][1] - 2], animate);
  }
  function paintIsle(animate) {
    const def = current(), root = sceneOf('ada');
    const island = def.adalar()[isle], stations = def.duraklar(isle), spots = stationPlaces(stations.length);
    stations.forEach((station, n) => {
      const button = root.querySelector('.kh-station[data-n="' + n + '"]');
      button.className = 'kh-station ' + station.durum;
      button.querySelector('.kh-station-state').textContent = station.durum === 'done' ? '✓' : station.durum === 'now' ? '▶' : station.durum === 'locked' ? '🔒' : '';
      button.querySelector('small').textContent = station.not || '';
      button.setAttribute('aria-label', (station.etiket || station.ad) + (station.not ? ', ' + station.not : '') + stateWord(station.durum));
      button.setAttribute('aria-disabled', String(station.durum === 'locked'));
      button.toggleAttribute('data-cue', station.durum === 'locked');
    });
    // (a sign that is a number, like Çarpım Koyu's seconds, is already in the island's name)
    root.querySelector('.kh-title').innerHTML = '<strong>' + (/\d/.test(island.simge) ? '' : esc(island.simge) + ' ') + esc(island.ad) + '</strong>' + (island.not ? '<small>' + esc(island.not) + '</small>' : '');
    const states = stations.map(s => s.durum);
    const before = seen.get('i:' + def.id + ':' + isle);
    cheer(root, '.kh-station', 'i:' + def.id + ':' + isle, states);
    const now = states.indexOf('now');
    const target = now >= 0 ? now : states.lastIndexOf('done') >= 0 ? states.lastIndexOf('done') : 0;
    stand('ada', [spots[target][0] + (spots[target][0] < 200 ? 58 : -58), spots[target][1] + 4], animate);
    // The island just finished: back out to the bay, where the player walks on to the next island.
    if (animate && before && before.some(s => s !== 'done') && states.every(s => s === 'done') && !document.querySelector('dialog[open]')) {
      setTimeout(() => { if (level === 'ada' && !moving && !document.querySelector('dialog[open]')) leaveIsle(true); }, 1600);
    }
  }
  function paintPanel() {
    const panel = $('kesif-panel');
    const def = level === 'koylar' ? null : current();
    const node = def?.panel?.(level, isle);
    panel.replaceChildren(...(node ? [].concat(node) : []));
    panel.hidden = !node;
    $('game-tools').hidden = !(def && def.araclar);
  }
  function draw(animate = false) {
    if (!list.length) return;
    for (const def of list) def.hazirla?.();
    paintBays();
    if (level !== 'koylar') paintBay(animate && level === 'koy');
    if (level === 'ada') paintIsle(animate);
    paintPanel();
  }

  /* ---------- Moves ---------- */
  async function zoom(from, to, [x, y], inward) {
    const a = sceneOf(from), b = sceneOf(to);
    level = to;
    b.hidden = false;
    a.style.transformOrigin = b.style.transformOrigin = pct(x, W) + ' ' + pct(y, H);
    b.classList.add('arriving');
    if (!calm.matches) {
      const timing = { duration: 680, easing: 'cubic-bezier(.6, 0, .25, 1)' };
      const big = 'scale(3.2)', small = 'scale(.28)';
      await Promise.all([
        a.animate([{ transform: 'none', opacity: 1 }, { opacity: 1, offset: .3 }, { transform: inward ? big : small, opacity: 0 }], timing).finished,
        b.animate([{ transform: inward ? small : big, opacity: 0 }, { opacity: 0, offset: .25 }, { transform: 'none', opacity: 1 }], timing).finished
      ]).catch(() => {});
    }
    a.hidden = true;
    setTimeout(() => b.classList.remove('arriving'), 900);
  }
  const busy = async task => { if (moving) return; moving = true; try { await task(); } finally { moving = false; } };
  // The island the player stands on when entering a bay: where they were, else the one to do.
  function startIsle(def) {
    const islands = def.adalar();
    const now = islands.findIndex(i => i.durum === 'now');
    const was = at.get(def.id);
    return Number.isInteger(was) && was < islands.length ? was : now >= 0 ? now : 0;
  }
  const enterBay = b => busy(async () => {
    bay = b;
    const def = current();
    def.hazirla?.();
    isle = startIsle(def);
    const root = sceneOf('koy');
    root.innerHTML = bayScene(def);
    root.setAttribute('aria-label', def.ad);
    root.querySelectorAll('.kh-isle').forEach(button => { button.onclick = () => tapIsle(Number(button.dataset.k)); });
    root.querySelector('.kh-back').onclick = () => leaveBay();
    seen.delete('b:' + def.id);
    paintBay(false);
    paintPanel();
    playCue('splash', { gain: 0.5 });
    await zoom('koylar', 'koy', bayAt(b, list.length), true);
    paintPanel();
    root.querySelector('.kh-isle.here')?.focus({ preventScroll: true });
  });
  const leaveBay = () => busy(async () => {
    paintBays();
    await zoom('koy', 'koylar', bayAt(bay, list.length), false);
    paintPanel();
    sceneOf('koylar').querySelector('.kh-bay.here')?.focus({ preventScroll: true });
  });
  const enterIsle = k => busy(async () => {
    const def = current();
    // The player walks over the bridges to the island first.
    if (k !== isle) {
      const spots = islePlaces(def.adalar().length);
      isle = k;
      at.set(def.id, k);
      stand('koy', [spots[k][0] + 40, spots[k][1] - 2], true);
      paintBay(false);
      await wait(700);
    }
    isle = k;
    at.set(def.id, k);
    const root = sceneOf('ada');
    root.innerHTML = isleScene(def, k);
    root.setAttribute('aria-label', def.adalar()[k].ad);
    root.querySelectorAll('.kh-station').forEach(button => { button.onclick = () => tapStation(Number(button.dataset.n)); });
    root.querySelector('.kh-back').onclick = () => leaveIsle();
    seen.delete('i:' + def.id + ':' + k);
    paintIsle(false);
    playCue('pop', { gain: 0.6 });
    await zoom('koy', 'ada', islePlaces(def.adalar().length)[k], true);
    paintPanel();
    (sceneOf('ada').querySelector('.kh-station.now') || sceneOf('ada').querySelector('.kh-station'))?.focus({ preventScroll: true });
  });
  // Back to the bay; after an island is finished, the player then goes on to the island to do next.
  const leaveIsle = (finished = false) => busy(async () => {
    const def = current();
    paintBay(false);
    await zoom('ada', 'koy', islePlaces(def.adalar().length)[isle], false);
    paintPanel();
    paintBay(true);
    if (finished) {
      playCue('island');
      const next = def.adalar().findIndex(i => i.durum === 'now');
      if (next >= 0 && next !== isle) {
        await wait(900);
        isle = next;
        at.set(def.id, next);
        paintBay(true);
        paintPanel();
      }
    }
    sceneOf('koy').querySelector('.kh-isle.here')?.focus({ preventScroll: true });
  });
  let hintTimer;
  function hint(text) {
    const node = host.querySelector('.kh-hint');
    node.textContent = text;
    node.hidden = false;
    fx.bump(node, 'show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { node.hidden = true; }, 2600);
  }
  function tapIsle(k) {
    if (moving) return;
    const def = current(), island = def.adalar()[k];
    if (island.durum === 'locked') {
      playCue('oops');
      fx.bump(sceneOf('koy').querySelector('.kh-isle[data-k="' + k + '"]'), 'denied');
      hint('🔒 ' + (def.kilit?.(k) || 'Bu ada henüz kilitli'));
      return;
    }
    enterIsle(k);
  }
  function tapStation(n) {
    if (moving) return;
    const def = current(), station = def.duraklar(isle)[n];
    if (station.durum === 'locked') {
      playCue('oops');
      fx.bump(sceneOf('ada').querySelector('.kh-station[data-n="' + n + '"]'), 'denied');
      hint('🔒 ' + (station.kilit || 'Önce sıradaki durağı bitir'));
      return;
    }
    playCue('tap', { gain: 0.6 });
    def.ac(isle, n);
  }

  /* ---------- Public ---------- */
  // Shows the map in Keşif Limanı when the player's grade has bays on it; false when it has none.
  function goster() {
    list = defs.filter(def => availableForPlayer($(def.kart)));
    $('kesif').hidden = !list.length;
    if (!list.length) { $('game-tools').hidden = true; return false; }
    frame();
    const who = activeProfile.id + '|' + activeProfile.grade + '|' + list.map(d => d.id).join();
    if (who !== owner) {
      owner = who;
      at.clear();
      seen.clear();
      level = 'koylar';
      bay = 0;
      for (const name of ['koy', 'ada']) sceneOf(name).hidden = true;
      sceneOf('koylar').hidden = false;
    }
    for (const def of list) def.hazirla?.();
    const root = sceneOf('koylar');
    root.innerHTML = baysScene();
    root.setAttribute('aria-label', 'Koylar');
    root.querySelectorAll('.kh-bay').forEach(button => { button.onclick = () => { if (!moving) enterBay(Number(button.dataset.b)); }; });
    draw(false);
    return true;
  }
  // Draws again after a game: what was just done pops, and the player walks on.
  function yenile() {
    if (!host || $('kesif').hidden || $('catalog').hidden || !list.length) return;
    draw(true);
  }
  const koy = def => { defs.push(def); };
  // Pieces for the panels: the big "next" button, a box of text, a quiet button.
  function node(tag, className, html) {
    const element = document.createElement(tag);
    element.className = className;
    element.innerHTML = html;
    return element;
  }
  const parca = {
    sonraki(icon, ust, ad, action) {
      const button = node('button', 'kh-next', '<span class="kh-next-icon" aria-hidden="true">' + esc(icon) + '</span><span><small>' + esc(ust) + '</small>' + esc(ad) +
        '</span><span aria-hidden="true">▶</span>');
      button.type = 'button';
      button.onclick = action;
      return button;
    },
    kutu: html => node('div', 'kh-box', html),
    dugme(label, action) {
      const button = node('button', 'kh-quiet', esc(label));
      button.type = 'button';
      button.onclick = action;
      return button;
    },
    olcer: share => '<span class="kh-meter" aria-hidden="true"><i style="width:' + Math.round(share * 100) + '%"></i></span>'
  };
  return { koy, goster, yenile, parca, level: () => level };
})();
