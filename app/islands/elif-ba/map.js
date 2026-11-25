// Elif Ba Adası's map, in three levels shown one at a time in the same frame:
//  1. The bays (koylar), one for every section of the path: Harf, Bitişik and Cezm Koyu, then the bays
//     of the sections still to come, locked under clouds ("Yakında"). A bay shows its name, what is
//     learned there, a little sign of it and its seven islets as dots in its lagoon.
//  2. A bay: its seven islets (the coves of game.js) joined by glass bridges (each islet's Cam Köprü),
//     and at the bay's mouth the boat that sails on to the next bay once the last islet is done.
//  3. An islet: its steps (letters, harekes, games) as round stations along a path across it.
// Tapping a bay or an islet zooms into it, ‹ zooms back out. The turtle walks over the bridges from islet
// to islet and sails from bay to bay. game.js says what is open (render) and what a tap does (the handlers
// given to build); every move is a promise, so game.js can chain them into a journey.
const elifMap = (() => {
  const { coves, coveGlyphs, coveTopic, LETTER_COVES, bays, bayCoves, bayOf } = elifData;
  const W = 400, H = 680;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const pct = (v, of) => (v / of * 100).toFixed(2) + '%';
  const spot = ([x, y]) => ({ left: pct(x, W), top: pct(y, H) });
  const wait = ms => new Promise(resolve => setTimeout(resolve, calm.matches ? 0 : ms));
  const r1 = n => Math.round(n * 10) / 10;

  /* ---------- Paths ---------- */
  // A smooth path through points (Catmull-Rom), as cubic segments [p0, c1, c2, p3].
  function curve(points) {
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      segments.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return segments;
  }
  const pathOf = segments => 'M' + segments[0][0].map(r1).join(' ') + segments.map(([, a, b, c]) => 'C' + [a, b, c].map(p => p.map(r1).join(' ')).join(' ')).join('');
  function along([p0, c1, c2, p3], n) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, u = 1 - t;
      return [0, 1].map(a => u * u * u * p0[a] + 3 * u * u * t * c1[a] + 3 * u * t * t * c2[a] + t * t * t * p3[a]);
    });
  }

  /* ---------- Artwork ---------- */
  const palm = (x, y, s = 1, flip = false) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')">' +
    '<path d="M0 2C2-8 4-16 2-26" stroke="#9a6a3c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
    '<g class="map-fronds" fill="#41a35c"><path d="M2-26C-8-32-18-30-22-24c8-3 16-3 24-2z"/><path d="M2-26c6-8 18-8 22-2-8-2-14-1-22 2z"/>' +
    '<path d="M2-26c-5 3-10 9-11 16 5-6 8-10 11-16z"/><path d="M2-26c8 3 12 8 14 14-5-5-9-9-14-14z"/></g></g>';
  const lighthouse = (x, y, s = 1) => '<g class="map-lighthouse" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="0" cy="-40" r="16" fill="#fff6b8" opacity=".55"/>' +
    '<path d="M-8 2-5.5-34H5.5L8 2Z" fill="#fff" stroke="#b94040" stroke-width="2"/><path d="M-7.2-8H7.2L6.6-17H-6.6ZM-6-25H6L5.6-31H-5.6Z" fill="#e05a5a"/>' +
    '<rect x="-6.5" y="-43" width="13" height="9" rx="2" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/><path d="M-9-43 0-50 9-43Z" fill="#b94040"/></g>';
  const rainbow = (x, y, s = 1) => '<g class="map-rainbow" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke-width="4.5" stroke-linecap="round">' +
    ['#e05a5a', '#f2a93b', '#ffd863', '#41a35c', '#3c8fd8', '#8a5ad8'].map((color, n) => '<path d="M' + (-40 + n * 4.5) + ' -8a' + (40 - n * 4.5) + ' ' + (34 - n * 4.5) +
    ' 0 0 1 ' + (80 - n * 9) + ' 0" stroke="' + color + '"/>').join('') + '</g>';
  const boat = (x, y, s = 1, flip = false) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')"><g class="map-boat">' +
    '<path d="M-12 0H12L7 7H-7Z" fill="#b5652b" stroke="#7a3f17" stroke-width="1.6"/>' +
    '<path d="M0-1V-24" stroke="#7a3f17" stroke-width="1.8"/><path d="M1.5-23 13-4H1.5Z" fill="#fffdf6" stroke="#d8d2c4" stroke-width="1"/>' +
    '<path d="M-1.5-18-9-4H-1.5Z" fill="#ffd863"/></g></g>';
  const moon = (x, y, s = 1) => '<g class="map-moon" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle r="17" fill="#fff6b8" opacity=".45"/>' +
    '<path d="M4-12A13 13 0 1 0 4 12A10 10 0 1 1 4-12Z" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/></g>';
  const gulls = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="map-gulls" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M-10 0q5-6 10 0q5-6 10 0"/><path d="M8-14q4-5 8 0q4-5 8 0"/></g></g>';
  const cloud = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><ellipse rx="34" ry="12" cy="4"/><circle cx="-14" cy="-4" r="13"/>' +
    '<circle cx="8" cy="-9" r="16"/><circle cx="24" cy="0" r="10"/></g>';
  const twinkle = ([x, y], n) => '<path class="map-twinkle" style="--n:' + n + '" d="M' + x + ' ' + (y - 6) + 'l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z"/>';
  const mosque = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="-13" y="-14" width="26" height="15" rx="2" fill="#fff6e6" stroke="#c98a4a" stroke-width="1.6"/>' +
    '<path d="M-11-14a11 11 0 0 1 22 0Z" fill="#7cc6e8" stroke="#3a7fa8" stroke-width="1.6"/><rect x="15" y="-38" width="6" height="39" rx="1.5" fill="#fff6e6" stroke="#c98a4a" stroke-width="1.6"/>' +
    '<path d="M14-38l4-9 4 9Z" fill="#7cc6e8" stroke="#3a7fa8" stroke-width="1.2"/><path d="M-3-6a3 3 0 0 1 6 0v6h-6Z" fill="#c98a4a"/></g>';
  const wave = ([x, y]) => '<path d="M' + x + ' ' + y + 'q7-6 14 0t14 0"/>';
  const waves = list => '<g class="map-waves" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55">' + list.map(wave).join('') + '</g>';
  // The sea of each bay: a bright day in Harf Koyu, a sunny one with a rainbow in Bitişik Koyu, dusk in Cezm Koyu.
  const seas = { harf: ['#8fe3ee', '#62c9dd', '#3cb0c8'], bitisik: ['#a6ecdf', '#6fd2d0', '#35adbf'], cezm: ['#6c6fbf', '#5aa9d6', '#3cb0c8'] };
  const sea = (id, colors) => '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + colors.map((c, n) =>
    '<stop offset="' + n / (colors.length - 1) + '" stop-color="' + c + '"/>').join('') + '</linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + id + ')"/>';

  // The turtle, with a boat it sails in between the bays: the sail behind it, the hull in front.
  const turtleHtml = id => '<div class="elif-map-turtle" aria-hidden="true"><div class="elif-map-turtle-turn">' +
    '<svg class="elif-map-sail" viewBox="0 0 180 150"><path d="M116-50V112" stroke="#7a3f17" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M122-44 178 92H122Z" fill="#fffdf6" stroke="#d8d2c4" stroke-width="3"/><path d="M110-30 50 92H110Z" fill="#ffd863" stroke="#e0a630" stroke-width="3"/>' +
    '<path d="M118-50 146-40 118-30Z" fill="#e05a5a"/></svg>' +
    '<div class="elif-map-turtle-body">' + elifArt.turtle(id) + '</div>' +
    '<svg class="elif-map-hull" viewBox="0 0 180 150"><path d="M-6 108H186L160 150H20Z" fill="#b5652b" stroke="#7a3f17" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M2 122H176" stroke="#ffd863" stroke-width="6"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"><path class="map-wake" d="M-30 150q12-10 24 0t24 0"/>' +
    '<path class="map-wake" d="M168 152q12-10 24 0"/></g></svg></div></div>';
  const header = (back, label) => '<button type="button" class="elif-map-back" aria-label="' + back + '"><svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="elif-map-title" data-cue aria-label="' + label + '"></button>';

  /* ---------- Level 1: the bays ---------- */
  // Every bay's middle; the bays sit left and right of the sea lane that winds up the map between them.
  const BAY = Array.from({ length: bays.length }, (_, b) => [b % 2 ? 300 : 100, Math.round(590 - b * 88.3)]);
  // Where the turtle stands on a bay: on its shore by the lane, where the boat lands.
  const dock = b => [BAY[b][0] + (b % 2 ? -70 : 70), BAY[b][1] + 12];
  // The lane from bay b to bay b + 1.
  const lane = b => [dock(b), [dock(b)[0], dock(b)[1] - 52], [dock(b + 1)[0], dock(b + 1)[1] + 52], dock(b + 1)];
  // The seven islets of a bay as dots in its lagoon.
  const DOTS = Array.from({ length: LETTER_COVES }, (_, n) => [-42 + n * 14, r1(12 - 9 * Math.sin(Math.PI * n / 6))]);
  function bayArt(b) {
    const [x, y] = BAY[b];
    const { id, soon } = bays[b];
    const side = b % 2 ? 1 : -1; // decorations go on the far side from the lane
    const decor = {
      harf: palm(side * 66, -8, 1.05, side > 0) + lighthouse(side * 42, -20),
      bitisik: rainbow(0, -14, 1.2) + palm(side * 60, -12, 1, side > 0) + gulls(-side * 26, -46),
      cezm: moon(side * 46, -50) + twinkle([side * 14, -62], 0) + twinkle([side * 74, -32], 2) + palm(side * 62, -12, 1.1, side > 0) + boat(-side * 30, -18, .9, side > 0),
      okuma: mosque(side * 38, -16) + palm(side * 66, -10, .95, side > 0)
    }[id] || palm(side * 60, -12, 1.05, side > 0) + palm(side * 40, -18, .8, side < 0);
    const dots = soon ? '' : '<polyline class="map-dot-lane" points="' + DOTS.map(p => p.join(' ')).join(' ') + '"/>' +
      DOTS.map(([dx, dy], n) => '<g class="map-dot" data-n="' + n + '" transform="translate(' + dx + ' ' + dy + ')"><circle r="6.6" class="map-dot-sand"/>' +
        '<circle r="3.4" cy="-1.4" class="map-dot-top"/></g>').join('');
    return '<g class="map-bay" data-b="' + b + '" transform="translate(' + x + ' ' + y + ')"><g class="map-bay-in" style="--n:' + b + '">' +
      '<ellipse class="map-halo" rx="98" ry="52" fill="none" stroke="#ffe38a" stroke-width="5"/>' +
      '<ellipse rx="94" ry="48" fill="#a8ecf2" opacity=".75"/><ellipse class="map-sand" rx="80" ry="38" fill="#f3d892"/>' +
      '<path class="map-grass" d="M-76-4C-70-34 70-34 76-4C58-22-58-22-76-4Z" fill="#9fd88a"/>' +
      '<path class="map-lagoon" d="M-56 8C-56-12 56-12 56 8C56 22 30 26 14 28Q9 34 10 44H-10Q-9 34-14 28C-30 26-56 22-56 8Z" fill="#8fe0ea"/>' +
      dots + decor + (soon ? '<g class="map-fog" fill="#fff">' + cloud(-30, -4, 1.1) + cloud(30, 8, .9) + '</g>' : '') + '</g></g>';
  }
  const compass = '<g class="map-compass" transform="translate(352 52)"><circle r="25" fill="#fffdf6" opacity=".9" stroke="#c98a4a" stroke-width="2.4"/>' +
    '<circle r="18" fill="none" stroke="#e8d7b0" stroke-width="1.5"/><g class="map-needle"><path d="M0-21 5 0H-5Z" fill="#e05a5a"/><path d="M0 21 5 0H-5Z" fill="#9ab7c0"/></g>' +
    '<path d="M-21 0 0-4V4ZM21 0 0-4V4Z" fill="#d8c8a2"/><circle r="3" fill="#fff" stroke="#c98a4a" stroke-width="1.5"/></g>';
  const whale = '<g transform="translate(332 640)"><g class="map-whale"><g class="map-spout" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">' +
    '<path d="M-12-16v-12M-12-26c-3-6-8-8-12-6M-12-26c3-6 8-8 12-6"/></g>' +
    '<path d="M-34 2C-34-16 6-20 22-6c6 5 12 0 16-10 4 8 2 16-6 20C14 14-34 16-34 2Z" fill="#3a7fa8"/>' +
    '<path d="M-30 6C-20 12 6 12 18 6C6 14-24 14-30 6Z" fill="#c7e6f2"/><circle cx="-22" cy="-4" r="2.4" fill="#173f40"/></g></g>';
  function baysScene() {
    const lanes = bays.slice(1).map((_, b) => '<path class="map-lane" data-b="' + b + '" d="' + pathOf([lane(b)]) + '"/>').join('');
    return '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('map-sea-bays', ['#7fd6e6', '#6fcde0', '#3cb0c8']) +
      waves([[250, 30], [40, 120], [190, 160], [370, 210], [24, 300], [200, 280], [360, 380], [196, 460], [30, 500], [370, 560], [200, 640], [40, 670], [250, 600]]) +
      '<g class="map-sparkles" fill="#fff">' + [[230, 90], [30, 200], [380, 460], [180, 380], [20, 560], [260, 668]].map(twinkle).join('') + '</g>' +
      lanes + bays.map((_, b) => bayArt(b)).join('') + compass + whale + '</svg>' +
      bays.map((bay, b) => '<button type="button" class="elif-bay" data-b="' + b + '" data-cue style="left:' + pct(BAY[b][0] - 92, W) + ';top:' + pct(BAY[b][1] - 56, H) +
        ';width:' + pct(184, W) + ';height:' + pct(146, H) + '"><span class="elif-bay-sign" lang="ar" dir="rtl" aria-hidden="true">' + bay.sample + '</span>' +
        (bay.soon ? '<span class="elif-bay-soon" aria-hidden="true">Yakında</span>' : '') +
        '<span class="elif-bay-label"><span class="elif-bay-name"><i class="elif-bay-badge" aria-hidden="true"></i>' + bay.name + '</span>' +
        '<small>' + bay.lead + '</small></span></button>').join('') + turtleHtml('map-bays');
  }

  /* ---------- Level 2: a bay and its islets ---------- */
  const ISLE = [[86, 606], [256, 602], [330, 508], [174, 482], [70, 378], [222, 338], [326, 236]];
  const MOUTH = [176, 146]; // the boat to the next bay
  const isleFeet = n => [ISLE[n][0] - 4, ISLE[n][1] - 4];
  function isletArt(k) {
    const n = k % LETTER_COVES;
    const [x, y] = ISLE[n];
    const flip = n % 2 ? ' scale(-1 1)' : '';
    const LIGHTHOUSE = LETTER_COVES - 1, RAINBOW = 2 * LETTER_COVES - 1, LAST = coves.length - 1;
    // The cove where the letters end has a lighthouse, the one where bitişik yazılış ends a rainbow; the coves
    // of bitişik yazılış have seagulls over them, those of cezm a sailing boat, and the last one a moon.
    return '<g class="map-isle" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')"><g class="map-isle-in" style="--n:' + n + '">' +
      '<ellipse class="map-halo" rx="64" ry="40" fill="none" stroke="#ffe38a" stroke-width="5"/>' +
      '<ellipse rx="60" ry="37" fill="#a8ecf2" opacity=".75"/><ellipse class="map-sand" rx="49" ry="29" fill="#f3d892"/>' +
      '<g transform="' + flip.trim() + '"><path class="map-grass" d="M-34-4C-30-20 0-26 20-18c14 6 10 18-6 20C-8 5-36 8-34-4Z" fill="#9fd88a"/>' +
      ([LIGHTHOUSE, RAINBOW, LAST].includes(k) ? '' : palm(24, -12)) + '</g>' + (k === LIGHTHOUSE ? lighthouse(26, -6) : '') +
      (k === RAINBOW ? rainbow(0, 0) : '') + (k === LAST ? moon(24, -30) : '') + (coveTopic(k) === 'bitisik' ? gulls(-20, -42) : '') +
      (coveTopic(k) === 'cezm' ? boat(n % 2 ? 50 : -58, 10) : '') + '</g></g>';
  }
  function bridgeArt(k) {
    const [x1, y1] = ISLE[k % LETTER_COVES], [x2, y2] = ISLE[(k + 1) % LETTER_COVES];
    const line = 'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"';
    return '<g class="map-bridge" data-k="' + k + '"><line ' + line + ' class="map-rails"/><line ' + line + ' class="map-panes"/></g>';
  }
  function bayScene(b) {
    const list = bayCoves(b), id = bays[b].id;
    const next = bays[b + 1];
    // Headlands at the top frame the bay's mouth, where the boat waits.
    const headlands = '<g class="map-headland"><path d="M0 0H138C120 26 92 40 60 52 34 62 14 86 0 118Z" fill="#f3d892"/>' +
      '<path d="M0 0H124C106 18 80 30 52 40 30 48 12 66 0 92Z" fill="#9fd88a"/>' +
      '<path d="M400 0H262C282 22 312 30 342 40 370 50 388 74 400 104Z" fill="#f3d892"/><path d="M400 0H276C294 14 320 22 348 30 372 38 390 56 400 80Z" fill="#9fd88a"/>' +
      palm(30, 50, 1.1) + palm(372, 40, 1.05, true) + palm(92, 26, .8, true) + '</g>';
    const theme = id === 'bitisik' ? rainbow(200, 104, 2.2) + gulls(110, 210) + gulls(300, 140, .9) :
      id === 'cezm' ? '<g class="map-sparkles" fill="#fff">' + [[120, 110], [290, 86], [60, 220], [240, 196], [360, 300], [30, 470]].map(twinkle).join('') + '</g>' :
      lighthouse(374, 96, .9);
    const exitLane = '<path class="map-exit-lane" d="M' + ISLE[6].join(' ') + 'Q' + (MOUTH[0] + 90) + ' ' + (MOUTH[1] + 40) + ' ' + MOUTH.join(' ') + 'T200 -30"/>';
    return '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('map-sea-' + id, seas[id] || seas.harf) +
      waves([[250, 150], [60, 300], [330, 410], [150, 560], [40, 500], [300, 680], [370, 320], [120, 660], [20, 650]]) + theme + headlands + exitLane +
      list.slice(0, -1).map(bridgeArt).join('') + list.map(isletArt).join('') +
      '<g class="map-exit-boat" transform="translate(' + MOUTH.join(' ') + ')">' + boat(0, 0, 2.2) + '</g></svg>' +
      list.map(k => '<button type="button" class="elif-isle" data-k="' + k + '" data-cue style="--n:' + k % LETTER_COVES + ';left:' + pct(ISLE[k % LETTER_COVES][0], W) + ';top:' + pct(ISLE[k % LETTER_COVES][1], H) +
        '"><span class="elif-isle-badge" aria-hidden="true"></span><span class="elif-isle-glyphs" lang="ar" dir="rtl" aria-hidden="true">' +
        coveGlyphs(k).join(' ') + '</span><span class="elif-isle-name">' + coves[k].replace(' Adacığı', '') + '</span></button>').join('') +
      '<button type="button" class="elif-exit" data-cue style="left:' + pct(MOUTH[0], W) + ';top:' + pct(MOUTH[1], H) + '"><span class="elif-exit-badge" aria-hidden="true"></span>' +
      '<span class="elif-exit-name">' + (next ? next.name : 'Yolun sonu') + ' ›</span></button>' +
      turtleHtml('map-bay') + header('Koylar', bays[b].name);
  }

  /* ---------- Level 3: an islet and its steps ---------- */
  // The stations go up the islet in a zigzag, as many as the islet has steps.
  const stationSpots = count => Array.from({ length: count }, (_, n) => [n % 2 ? 272 : 128, Math.round(574 - n * (count > 1 ? 312 / (count - 1) : 0))]);
  // The turtle waits beside a station, on the side towards the middle.
  const beside = ([x, y]) => [x + (x < 200 ? 56 : -56), y + 8];
  const ISLAND = 'M200 150C292 148 356 204 360 298C364 378 372 468 336 550C302 626 236 654 176 650C110 646 52 608 40 530C28 448 46 378 42 308C38 218 108 152 200 150Z';
  function isletScene(k, count) {
    const id = bays[bayOf(k)].id;
    const at = stationSpots(count);
    const trail = pathOf(curve([[200, 660], ...at]));
    const last = at[count - 1];
    const toNext = last[0] < 200 ? [-40, last[1] - 150] : [440, last[1] - 150];
    const decor = (k === LETTER_COVES - 1 ? lighthouse(330, 226, 1.7) : '') + (k === 2 * LETTER_COVES - 1 ? rainbow(200, 152, 3.4) : '') +
      (k === coves.length - 1 ? moon(330, 96, 1.8) : '') + (coveTopic(k) === 'bitisik' ? gulls(80, 118, 1.3) + gulls(320, 160) : '') +
      (coveTopic(k) === 'cezm' ? boat(48, 140, 1.8) + boat(366, 620, 1.4, true) : '');
    return '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + sea('map-sea-islet', seas[id] || seas.harf) +
      waves([[60, 110], [300, 70], [20, 400], [370, 420], [40, 640], [330, 660], [240, 110], [380, 200]]) +
      (id === 'cezm' ? '<g class="map-sparkles" fill="#fff">' + [[160, 90], [260, 120], [20, 260], [384, 330], [90, 50]].map(twinkle).join('') + '</g>' : '') +
      '<path class="map-rails" d="M' + last.join(' ') + 'L' + toNext.join(' ') + '" stroke-width="16"/><path class="map-panes" d="M' + last.join(' ') + 'L' +
        toNext.join(' ') + '" stroke-width="9"/>' +
      '<path d="' + ISLAND + '" fill="#e9fbff" opacity=".45" stroke="#e9fbff" stroke-width="44" stroke-linejoin="round"/>' +
      '<path d="' + ISLAND + '" fill="#a8ecf2" stroke="#a8ecf2" stroke-width="22" stroke-linejoin="round"/>' +
      '<path class="map-sand" d="' + ISLAND + '" fill="#f3d892"/>' +
      '<path d="' + ISLAND + '" fill="#9fd88a" transform="translate(200 400) scale(.8 .82) translate(-200 -404)"/>' +
      '<g fill="#86c96e">' + [[110, 330], [292, 410], [150, 520], [250, 260], [300, 540]].map(([x, y]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="16" ry="6"/>').join('') + '</g>' +
      '<g class="map-flowers">' + [[96, 420, '#ff9a8b'], [306, 316, '#ffd863'], [226, 600, '#ff9a8b'], [160, 230, '#fff'], [318, 486, '#fff']].map(([x, y, c]) =>
        '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + c + '"/><circle cx="' + (x + 8) + '" cy="' + (y + 3) + '" r="3" fill="' + c + '"/>').join('') + '</g>' +
      '<path class="map-trail" d="' + trail + '"/><path class="map-trail-dots" d="' + trail + '"/>' +
      palm(66, 300, 1.6) + palm(340, 360, 1.5, true) + palm(84, 580, 1.4, true) + palm(324, 600, 1.3) + palm(240, 186, 1.2) + decor + '</svg>' +
      at.map((p, n) => '<button type="button" class="elif-station" data-n="' + n + '" style="--n:' + n + ';left:' + pct(p[0], W) + ';top:' + pct(p[1], H) + '">' +
        '<span class="elif-station-icon" aria-hidden="true"></span><span class="elif-station-state" aria-hidden="true"></span><span class="elif-station-name"></span></button>').join('') +
      turtleHtml('map-islet') + header('Koya dön', coves[k]);
  }

  /* ---------- State ---------- */
  let host = null, on = {}, model = null;
  const scene = {};                          // the three levels' elements
  let level = 'bays', shownBay = 0, shownIslet = 0;
  let at = 0;                                // the islet (cove) the turtle stands on; its bay is bayOf(at)
  let station = -1;                          // the station the turtle waits at, in the islet shown
  let doneBefore = [];                       // the islet's stations done when it was last drawn
  let aboard = false;                        // the turtle is in its boat, leaving a bay

  function build(element, handlers) {
    host = element;
    on = handlers;
    host.innerHTML = '<div class="elif-map-scene" data-level="bays"></div><div class="elif-map-scene" data-level="bay" hidden></div>' +
      '<div class="elif-map-scene" data-level="islet" hidden></div>';
    for (const node of host.children) scene[node.dataset.level] = node;
    scene.bays.innerHTML = baysScene();
    scene.bays.setAttribute('aria-label', 'Koylar');
    scene.bays.querySelectorAll('.elif-bay').forEach(button => { button.onclick = () => on.bay(Number(button.dataset.b)); });
  }
  const turtleOf = level => scene[level].querySelector('.elif-map-turtle');
  function put(level, point) { Object.assign(turtleOf(level).style, spot(point)); }

  // Draws the bay shown and its islets anew.
  function openBay(b) {
    shownBay = b;
    if (bayOf(at) !== b) at = bayCoves(b)[0];
    scene.bay.innerHTML = bayScene(b);
    scene.bay.setAttribute('aria-label', bays[b].name);
    scene.bay.querySelectorAll('.elif-isle').forEach(button => { button.onclick = () => on.islet(Number(button.dataset.k)); });
    scene.bay.querySelector('.elif-exit').onclick = () => on.exit(b);
    scene.bay.querySelector('.elif-map-back').onclick = () => on.up();
    const title = scene.bay.querySelector('.elif-map-title');
    title.innerHTML = '<strong>' + bays[b].name + ' 💬</strong><small>' + bays[b].lead + '</small>';
    title.onclick = () => elifVoice.instruct(bays[b].say);
    put('bay', isleFeet(at % LETTER_COVES));
    paintBay();
  }
  function openIslet(k) {
    shownIslet = k;
    const stations = model.stations(k);
    scene.islet.innerHTML = isletScene(k, stations.length);
    scene.islet.setAttribute('aria-label', coves[k]);
    scene.islet.querySelectorAll('.elif-station').forEach(button => { button.onclick = () => on.station(k, Number(button.dataset.n)); });
    scene.islet.querySelector('.elif-map-back').onclick = () => on.up();
    const title = scene.islet.querySelector('.elif-map-title');
    title.innerHTML = '<small>' + coves[k] + ' 💬</small><b lang="ar" dir="rtl">' + coveGlyphs(k).join(' ') + '</b>';
    title.onclick = () => elifVoice.instruct(coves[k]);
    station = -1;
    paintIslet();
  }

  /* ---------- Drawing the states ---------- */
  // model: { bay(b): 'done' | 'current' | 'locked' | 'soon', islet(k): 'done' | 'current' | 'locked', crossed(k),
  //          stations(k): [{ icon, name, label, state: 'done' | 'now' | 'locked' }] }
  function render(next) {
    model = next;
    paintBays();
    if (level !== 'bays') paintBay();
    if (level === 'islet') paintIslet();
  }
  function paintBays() {
    const root = scene.bays;
    bays.forEach((bay, b) => {
      const state = model.bay(b);
      const list = bayCoves(b);
      const done = list.filter(k => model.islet(k) === 'done').length;
      const button = root.querySelector('.elif-bay[data-b="' + b + '"]');
      button.className = 'elif-bay ' + state + (b === bayOf(at) ? ' here' : '');
      button.querySelector('.elif-bay-badge').textContent = state === 'done' ? '✓' : state === 'current' ? b + 1 : '🔒';
      button.setAttribute('aria-label', bay.name + ', ' + bay.lead + ', ' + (state === 'soon' ? 'yakında' : state === 'locked' ? 'kilitli' :
        done + ' / ' + list.length + ' adacık') + (b === bayOf(at) ? ', kaplumbağa burada' : ''));
      button.setAttribute('aria-disabled', String(state === 'locked' || state === 'soon'));
      root.querySelector('.map-bay[data-b="' + b + '"]').setAttribute('class', 'map-bay ' + state);
      list.forEach((k, n) => root.querySelector('.map-bay[data-b="' + b + '"] .map-dot[data-n="' + n + '"]').setAttribute('class', 'map-dot ' + model.islet(k)));
      const way = root.querySelector('.map-lane[data-b="' + (b - 1) + '"]');
      if (way) way.setAttribute('class', 'map-lane ' + (state === 'soon' ? 'soon' : state === 'locked' ? 'locked' : model.bay(b - 1) === 'done' ? 'crossed' : 'locked'));
    });
    if (!moving) put('bays', dock(bayOf(at)));
  }
  function paintBay() {
    const root = scene.bay;
    const list = bayCoves(shownBay);
    for (const k of list) {
      const now = model.islet(k);
      const button = root.querySelector('.elif-isle[data-k="' + k + '"]');
      button.className = 'elif-isle ' + now + (k === at ? ' selected' : '');
      button.querySelector('.elif-isle-badge').textContent = now === 'done' ? '✓' : now === 'locked' ? '🔒' : k % LETTER_COVES + 1;
      button.setAttribute('aria-label', (k % LETTER_COVES + 1) + '. ' + coves[k] + (now === 'done' ? ', tamamlandı' : now === 'current' ? ', şu an buradasın' : ', kilitli') +
        (k === at ? ', kaplumbağa burada' : ''));
      button.setAttribute('aria-disabled', String(now === 'locked'));
      root.querySelector('.map-isle[data-k="' + k + '"]').setAttribute('class', 'map-isle ' + now);
      const way = root.querySelector('.map-bridge[data-k="' + k + '"]');
      if (way) way.setAttribute('class', 'map-bridge ' + (model.crossed(k) ? 'crossed' : now === 'locked' ? 'locked' : 'next'));
    }
    // The boat at the mouth: ready once the last islet is done, unless the next bay is still to come.
    const next = bays[shownBay + 1];
    const ready = model.islet(list[list.length - 1]) === 'done';
    const exit = root.querySelector('.elif-exit');
    const state = !next || next.soon ? 'soon' : ready ? 'ready' : 'locked';
    exit.className = 'elif-exit ' + state;
    exit.querySelector('.elif-exit-badge').textContent = state === 'ready' ? '⛵' : '🔒';
    exit.setAttribute('aria-label', (next ? next.name : 'Yolun sonu') + (state === 'ready' ? ', tekneyle git' : state === 'soon' ? ', yakında' : ', kilitli'));
    root.querySelector('.map-exit-boat').setAttribute('class', 'map-exit-boat ' + state + (aboard ? ' boarded' : ''));
    root.querySelector('.map-exit-lane').setAttribute('class', 'map-exit-lane ' + state);
  }
  // The islet's changes are celebrated only where the child sees them: not behind a game's window.
  const seen = () => level === 'islet' && !moving && host.offsetParent !== null && !document.querySelector('dialog[open]');
  let cheer = 0;
  function paintIslet() {
    const root = scene.islet;
    const stations = model.stations(shownIslet);
    const spots = stationSpots(stations.length);
    stations.forEach((step, n) => {
      const button = root.querySelector('.elif-station[data-n="' + n + '"]');
      button.className = 'elif-station ' + step.state + (step.game ? ' game' : '');
      button.querySelector('.elif-station-icon').textContent = step.icon;
      button.querySelector('.elif-station-state').textContent = step.state === 'done' ? '✓' : step.state === 'now' ? '▶' : '🔒';
      button.querySelector('.elif-station-name').textContent = step.name;
      button.setAttribute('aria-label', step.label + (step.state === 'done' ? ', tamamlandı' : step.state === 'now' ? ', sıradaki' : ', kilitli'));
      button.setAttribute('aria-disabled', String(step.state === 'locked'));
      button.toggleAttribute('data-cue', step.state === 'locked'); // a locked step only says "oops"
    });
    // The turtle waits at the step to do, or at the last one when every step is done.
    const now = stations.findIndex(s => s.state === 'now');
    const target = now >= 0 ? now : stations.length - 1;
    const done = stations.map(s => s.state === 'done');
    if (station < 0) { station = target; doneBefore = done; }
    put('islet', beside(spots[station]));
    clearTimeout(cheer);
    cheer = setTimeout(() => {
      if (!seen()) return;
      // A step just done: its ✓ pops and stars fly out of it; then the turtle walks on to the next one.
      done.forEach((on, n) => {
        if (!on || doneBefore[n]) return;
        const button = root.querySelector('.elif-station[data-n="' + n + '"]');
        fx.bump(button, 'fresh');
        fx.burst(button, { count: 12 });
        playCue('star', { gain: 0.5 });
      });
      doneBefore = done;
      const from = station;
      if (target !== from && !calm.matches) setTimeout(() => stroll(from, target, spots), 500);
      else put('islet', beside(spots[target]));
      station = target;
    }, 120);
  }
  // The turtle walks along the path from one station to another.
  function stroll(from, to, spots) {
    const turtle = turtleOf('islet');
    const step = Math.sign(to - from);
    const points = [];
    for (let n = from; n !== to; n += step) {
      const a = beside(spots[n]), b = beside(spots[n + step]);
      for (let i = 0; i <= 10; i++) points.push([a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10 - Math.sin(Math.PI * i / 10) * 10]);
    }
    const turn = turtle.querySelector('.elif-map-turtle-turn');
    put('islet', points[points.length - 1]);
    turtle.classList.add('walking');
    turn.classList.toggle('right', points[points.length - 1][0] > points[0][0]);
    turtle.animate(points.map(spot), { duration: 700 * Math.abs(to - from), easing: 'ease-in-out' }).finished
      .catch(() => {}).then(() => { turtle.classList.remove('walking'); turn.classList.remove('right'); });
  }

  /* ---------- Moves ---------- */
  let moving = false;
  async function zoom(from, to, [x, y], inward) {
    const a = scene[from], b = scene[to];
    level = to;
    b.hidden = false;
    a.style.transformOrigin = b.style.transformOrigin = pct(x, W) + ' ' + pct(y, H);
    b.classList.add('arriving');
    if (!calm.matches) {
      const timing = { duration: 720, easing: 'cubic-bezier(.6, 0, .25, 1)' };
      const big = 'scale(3.2)', small = 'scale(.28)';
      await Promise.all([
        a.animate([{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { opacity: 1, offset: .3 },
          { transform: inward ? big : small, opacity: 0, filter: 'blur(3px)' }], timing).finished,
        b.animate([{ transform: inward ? small : big, opacity: 0, filter: 'blur(3px)' }, { opacity: 0, offset: .25 },
          { transform: 'none', opacity: 1, filter: 'blur(0)' }], timing).finished
      ]).catch(() => {});
    }
    a.hidden = true;
    setTimeout(() => b.classList.remove('arriving'), 900);
  }
  const busy = async task => { moving = true; try { await task(); } finally { moving = false; } };
  const enterBay = b => busy(async () => {
    openBay(b);
    playCue('splash', { gain: 0.5 });
    await zoom('bays', 'bay', BAY[b], true);
    scene.bay.querySelector('.elif-isle.selected')?.focus({ preventScroll: true });
  });
  const leaveBay = () => busy(async () => {
    put('bays', dock(bayOf(at)));
    turtleOf('bays').classList.toggle('sailing', aboard);
    await zoom('bay', 'bays', BAY[shownBay], false);
    paintBays();
    scene.bays.querySelector('.elif-bay.here')?.focus({ preventScroll: true });
  });
  const enterIslet = k => busy(async () => {
    openIslet(k);
    playCue('pop', { gain: 0.6 });
    await zoom('bay', 'islet', ISLE[k % LETTER_COVES], true);
    (scene.islet.querySelector('.elif-station.now') || scene.islet.querySelector('.elif-station'))?.focus({ preventScroll: true });
  });
  const leaveIslet = () => busy(async () => {
    paintBay();
    await zoom('islet', 'bay', ISLE[shownIslet % LETTER_COVES], false);
    scene.bay.querySelector('.elif-isle.selected')?.focus({ preventScroll: true });
  });
  // Walks over the bridges, islet by islet, to islet k of the bay shown.
  const walk = k => busy(async () => {
    const turtle = turtleOf('bay'), turn = turtle.querySelector('.elif-map-turtle-turn');
    const path = [];
    for (let n = at; n !== k; n += Math.sign(k - at)) path.push([n, n + Math.sign(k - at)]);
    const each = Math.max(380, 640 - path.length * 40);
    turtle.classList.add('walking');
    for (const [from, next] of path) {
      const a = isleFeet(from % LETTER_COVES), b = isleFeet(next % LETTER_COVES);
      turn.classList.toggle('right', b[0] > a[0]); // the turtle's head is on the left of its picture
      put('bay', b);
      if (!calm.matches) await turtle.animate([spot(a), spot(b)], { duration: each, easing: 'ease-in-out' }).finished.catch(() => {});
      at = next;
      playCue('tap', { gain: 0.6 });
    }
    turtle.classList.remove('walking');
    turn.classList.remove('right');
    paintBay();
  });
  // Leaving by the bay's mouth: the turtle walks to the boat, gets in and sails out of the bay.
  const board = () => busy(async () => {
    const turtle = turtleOf('bay');
    const from = isleFeet(at % LETTER_COVES), boatSpot = [MOUTH[0], MOUTH[1] + 6];
    turtle.classList.add('walking');
    put('bay', boatSpot);
    if (!calm.matches) await turtle.animate([spot(from), spot(boatSpot)], { duration: 700, easing: 'ease-in-out' }).finished.catch(() => {});
    turtle.classList.remove('walking');
    aboard = true;
    scene.bay.querySelector('.map-exit-boat').classList.add('boarded');
    turtle.classList.add('sailing');
    playCue('splash', { gain: 0.6 });
    const away = [200, -40];
    put('bay', away);
    if (!calm.matches) await turtle.animate([spot(boatSpot), spot([190, 60]), spot(away)], { duration: 900, easing: 'ease-in' }).finished.catch(() => {});
  });
  // Sails from the turtle's bay to bay b along the lanes, and lands on islet `landing` there.
  const sail = (b, landing) => busy(async () => {
    const turtle = turtleOf('bays'), turn = turtle.querySelector('.elif-map-turtle-turn');
    const from = bayOf(at);
    turtle.classList.add('sailing');
    if (!aboard) { playCue('splash', { gain: 0.6 }); await wait(350); }
    for (let n = from; n !== b; n += Math.sign(b - from)) {
      const forward = b > from;
      const points = along(lane(forward ? n : n - 1), 18);
      if (!forward) points.reverse();
      turn.classList.toggle('right', points[points.length - 1][0] > points[0][0]);
      put('bays', points[points.length - 1]);
      if (!calm.matches) await turtle.animate(points.map(spot), { duration: 1300, easing: 'ease-in-out' }).finished.catch(() => {});
      at = bayCoves(n + Math.sign(b - from))[0];
    }
    at = landing;
    aboard = false;
    await wait(200);
    turtle.classList.remove('sailing');
    turn.classList.remove('right');
    paintBays();
  });
  // A bay reached for the first time: its lock falls away and stars fly out of it.
  const celebrate = b => busy(async () => {
    const button = scene.bays.querySelector('.elif-bay[data-b="' + b + '"]');
    fx.bump(button, 'opened');
    fx.burst(button, { count: 16, spread: 120 });
    playCue('island');
    await wait(900);
  });
  // Shows the bays, with the turtle on islet k, at once (on entering the island).
  function reset(k) {
    at = k;
    level = 'bays';
    aboard = false;
    for (const name of ['bay', 'islet']) scene[name].hidden = true;
    scene.bays.hidden = false;
    if (model) paintBays();
  }
  // Points at a bay, an islet or a station that cannot be opened yet, or at the one to do.
  function nudge(kind, index, className = 'denied') {
    const selector = { bay: '.elif-bay[data-b="' + index + '"]', islet: '.elif-isle[data-k="' + index + '"]', station: '.elif-station[data-n="' + index + '"]',
      exit: '.elif-exit', now: '.elif-station.now' }[kind];
    fx.bump(host.querySelector('.elif-map-scene:not([hidden]) ' + selector), className);
  }
  return {
    build, render, reset, enterBay, leaveBay, enterIslet, leaveIslet, walk, board, sail, celebrate, nudge,
    level: () => level, shown: () => level === 'islet' ? shownIslet : shownBay, at: () => at, moving: () => moving,
    station: n => scene.islet.querySelector('.elif-station[data-n="' + n + '"]')
  };
})();
