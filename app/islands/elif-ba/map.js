// The coves of Elif Ba Adası as a map: islets joined by glass bridges (the Cam Köprü of each cove),
// from Kaplumbağa Koyu at the bottom up to the lighthouse of the seventh cove, where the letters and
// their harekes are done, on to the seven coves of bitişik yazılış above it, under a rainbow at their end,
// and the seven coves of cezm, with sailing boats, up to the moon. The sea is taller
// than the map's window and scrolls: it follows the turtle, which stands on the cove being looked at
// and walks over the bridges, islet by islet, to wherever the child goes: forward to a new cove or
// back to an earlier one. Below the sea, a wooden pier holds the steps of the cove the turtle stands
// on (letters, harekes, games), as round buttons with pictures only.
const elifMap = (() => {
  const { coves, coveGlyphs, coveTopic, LETTER_COVES } = elifData;
  // The frame is W × H: the window on the sea is the top SEA, the pier (PIER high) is below it. The sea
  // itself is W × WORLD; its bottom is shown first.
  const W = 400, H = 672, SEA = 580, PIER = 68, WORLD = 1724;
  const spots = [[84, 1634], [248, 1642], [334, 1544], [180, 1526], [72, 1430], [214, 1392], [326, 1318], [128, 1228],
    [296, 1160], [174, 1076], [80, 990], [214, 930], [334, 836], [176, 718],
    [318, 640], [196, 560], [70, 480], [200, 404], [330, 330], [210, 236], [96, 136]];
  const short = ['Kaplumbağa', 'İnci', 'Mercan', 'Yıldız', 'Yunus', 'Sedef', 'Deniz Feneri', 'Martı',
    'Yengeç', 'Ahtapot', 'Denizatı', 'Balina', 'Pelikan', 'Gökkuşağı',
    'Dalga', 'Yelken', 'Köpük', 'Rüzgâr', 'Pusula', 'Kumsal', 'Ay Işığı'];
  const LIGHTHOUSE = 6;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const left = x => (x / W * 100).toFixed(2) + '%';
  const top = y => (y / WORLD * 100).toFixed(2) + '%';
  // The turtle stands a little above the middle of an islet, on the grass.
  const feet = k => ({ left: left(spots[k][0] - 4), top: top(spots[k][1] - 4) });

  function islet(k) {
    const [x, y] = spots[k];
    const flip = k % 2 ? ' scale(-1 1)' : '';
    const palm = '<g transform="translate(24 -12)"><path d="M0 2C2-8 4-16 2-26" stroke="#9a6a3c" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '<g fill="#41a35c"><path d="M2-26C-8-32-18-30-22-24c8-3 16-3 24-2z"/><path d="M2-26c6-8 18-8 22-2-8-2-14-1-22 2z"/>' +
      '<path d="M2-26c-5 3-10 9-11 16 5-6 8-10 11-16z"/><path d="M2-26c8 3 12 8 14 14-5-5-9-9-14-14z"/></g></g>';
    const lighthouse = '<g class="map-lighthouse" transform="translate(26 -6)"><circle cx="0" cy="-40" r="16" fill="#fff6b8" opacity=".55"/>' +
      '<path d="M-8 2-5.5-34H5.5L8 2Z" fill="#fff" stroke="#b94040" stroke-width="2"/><path d="M-7.2-8H7.2L6.6-17H-6.6ZM-6-25H6L5.6-31H-5.6Z" fill="#e05a5a"/>' +
      '<rect x="-6.5" y="-43" width="13" height="9" rx="2" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/><path d="M-9-43 0-50 9-43Z" fill="#b94040"/></g>';
    // The cove where bitişik yazılış is done has a rainbow over it.
    const rainbow = '<g class="map-rainbow" fill="none" stroke-width="4.5" stroke-linecap="round">' +
      ['#e05a5a', '#f2a93b', '#ffd863', '#41a35c', '#3c8fd8', '#8a5ad8'].map((color, n) => '<path d="M' + (-40 + n * 4.5) + ' -8a' + (40 - n * 4.5) + ' ' + (34 - n * 4.5) +
      ' 0 0 1 ' + (80 - n * 9) + ' 0" stroke="' + color + '"/>').join('') + '</g>';
    const RAINBOW = 2 * LETTER_COVES - 1, LAST = coves.length - 1;
    // The coves of cezm have a sailing boat by them; the last one, Ay Işığı, a moon over it.
    const boat = '<g class="map-boat" transform="translate(' + (k % 2 ? 50 : -58) + ' 10)"><path d="M-12 0H12L7 7H-7Z" fill="#b5652b" stroke="#7a3f17" stroke-width="1.6"/>' +
      '<path d="M0-1V-24" stroke="#7a3f17" stroke-width="1.8"/><path d="M1.5-23 13-4H1.5Z" fill="#fffdf6" stroke="#d8d2c4" stroke-width="1"/>' +
      '<path d="M-1.5-18-9-4H-1.5Z" fill="#ffd863"/></g>';
    const moon = '<g class="map-moon" transform="translate(24 -30)"><circle r="17" fill="#fff6b8" opacity=".45"/>' +
      '<path d="M4-12A13 13 0 1 0 4 12A10 10 0 1 1 4-12Z" fill="#ffe38a" stroke="#c98a1f" stroke-width="1.6"/></g>';
    // The coves of bitişik yazılış have seagulls over them.
    const gulls = '<g class="map-gulls" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M-30-36q5-6 10 0q5-6 10 0"/><path d="M-12-50q4-5 8 0q4-5 8 0"/></g>';
    return '<g class="map-isle" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse class="map-halo" rx="64" ry="40" fill="none" stroke="#ffe38a" stroke-width="5"/>' +
      '<ellipse rx="60" ry="37" fill="#a8ecf2" opacity=".75"/><ellipse class="map-sand" rx="49" ry="29" fill="#f3d892"/>' +
      '<g transform="' + flip.trim() + '"><path class="map-grass" d="M-34-4C-30-20 0-26 20-18c14 6 10 18-6 20C-8 5-36 8-34-4Z" fill="#9fd88a"/>' +
      ([LIGHTHOUSE, RAINBOW, LAST].includes(k) ? '' : palm) + '</g>' + (k === LIGHTHOUSE ? lighthouse : '') + (k === RAINBOW ? rainbow : '') +
      (k === LAST ? moon : '') + (coveTopic(k) === 'bitisik' ? gulls : '') + (coveTopic(k) === 'cezm' ? boat : '') + '</g>';
  }
  function bridge(k) {
    const [x1, y1] = spots[k], [x2, y2] = spots[k + 1];
    const line = 'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"';
    return '<g class="map-bridge" data-k="' + k + '"><line ' + line + ' class="map-rails"/><line ' + line + ' class="map-panes"/></g>';
  }
  // The pier: planks on posts, with a rope along its front. It is drawn in the frame, below the sea.
  const pier = '<g class="map-pier"><g fill="#8a5a2b">' + [44, 132, 268, 356].map(x => '<rect x="' + (x - 5) + '" y="' + (SEA + PIER - 10) + '" width="10" height="26" rx="3"/>').join('') + '</g>' +
    '<rect x="14" y="' + (SEA + 6) + '" width="372" height="' + PIER + '" rx="16" fill="#d9a86a" stroke="#9a6a3c" stroke-width="3"/>' +
    '<g stroke="#b9854c" stroke-width="2">' + [1, 2, 3, 4, 5, 6, 7, 8].map(n => '<line x1="' + (14 + n * 41.3) + '" y1="' + (SEA + 8) + '" x2="' + (14 + n * 41.3) + '" y2="' + (SEA + PIER + 4) + '"/>').join('') + '</g>' +
    '<path d="M18 ' + (SEA + PIER + 4) + 'q46 12 91 0t91 0t91 0t91 0" fill="none" stroke="#f3e2c0" stroke-width="3" stroke-linecap="round"/></g>';
  const wave = ([x, y]) => '<path d="M' + x + ' ' + y + 'q7-6 14 0t14 0"/>';
  const waves = [[250, 40], [40, 70], [340, 110], [150, 200], [40, 300], [300, 250], [120, 340], [370, 420], [280, 470], [30, 580], [130, 640], [250, 640], [40, 660], [330, 750], [60, 820], [290, 930], [124, 900], [340, 1020], [40, 1100], [150, 1160], [30, 1240], [250, 1250], [330, 1200], [372, 1440], [250, 1460], [40, 1530], [120, 1590], [330, 1660], [250, 1500], [140, 1694], [24, 1710], [372, 1714]].map(wave).join('');
  const waveRow = '<g class="map-waves" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55">';

  let host = null, sea = null, turtle = null, dockList = null, buttons = [], at = 0, walking = false;
  // onPick(k): a cove was tapped.
  function build(element, onPick) {
    host = element;
    // An islet's button is as tall in the sea as it was when the whole map was the frame.
    const isleHeight = (0.14 * H / WORLD * 100).toFixed(2) + '%';
    host.innerHTML = '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<rect width="' + W + '" height="' + H + '" rx="26" fill="#3cb0c8"/>' + waveRow + [[200, 666], [110, 668]].map(wave).join('') + '</g>' + pier + '</svg>' +
      '<div class="elif-map-sea" style="height:' + (SEA / H * 100).toFixed(2) + '%"><div class="elif-map-world" style="aspect-ratio:' + W + ' / ' + WORLD + '">' +
      '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + WORLD + '" aria-hidden="true"><defs>' +
      '<linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6e6"/><stop offset=".5" stop-color="#6fcde0"/><stop offset="1" stop-color="#3cb0c8"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + WORLD + '" fill="url(#map-sea)"/>' + waveRow + waves + '</g>' +
      coves.slice(1).map((_, k) => bridge(k)).join('') + coves.map((_, k) => islet(k)).join('') + '</svg>' +
      coves.map((name, k) => '<button type="button" class="elif-isle" data-k="' + k + '" style="left:' + left(spots[k][0]) + ';top:' + top(spots[k][1]) +
        ';height:' + isleHeight + '"><span class="elif-isle-badge" aria-hidden="true"></span><span class="elif-isle-glyphs" lang="ar" dir="rtl" aria-hidden="true">' +
        coveGlyphs(k).join(' ') + '</span><span class="elif-isle-name">' + short[k] + '</span></button>').join('') +
      '<div class="elif-map-turtle" aria-hidden="true"><div class="elif-map-turtle-turn"><div class="elif-map-turtle-body">' +
      elifArt.turtle('map') + '</div></div></div></div></div>' +
      // Arrows at the top and bottom of the window show that more of the sea is there, and scroll to it.
      '<button type="button" class="elif-map-more up" aria-label="Yukarıdaki koylar" hidden>▲</button>' +
      '<button type="button" class="elif-map-more down" aria-label="Aşağıdaki koylar" hidden>▼</button>' +
      '<ol class="elif-map-dock" style="top:' + ((SEA + 6) / H * 100).toFixed(2) + '%;height:' + (PIER / H * 100).toFixed(2) + '%"></ol>';
    sea = host.querySelector('.elif-map-sea');
    buttons = Array.from(host.querySelectorAll('.elif-isle'));
    turtle = host.querySelector('.elif-map-turtle');
    dockList = host.querySelector('.elif-map-dock');
    buttons.forEach((button, k) => { button.onclick = () => onPick(k); });
    const [up, down] = host.querySelectorAll('.elif-map-more');
    up.onclick = () => sea.scrollBy({ top: -sea.clientHeight * 0.7, behavior: calm.matches ? 'auto' : 'smooth' });
    down.onclick = () => sea.scrollBy({ top: sea.clientHeight * 0.7, behavior: calm.matches ? 'auto' : 'smooth' });
    const arrows = () => {
      up.hidden = sea.scrollTop < 8;
      down.hidden = sea.scrollTop > sea.scrollHeight - sea.clientHeight - 8;
    };
    sea.addEventListener('scroll', arrows, { passive: true });
    new ResizeObserver(() => { follow(at, false); arrows(); }).observe(sea);
  }
  // state(k): 'done', 'current' or 'locked'; crossed(k): the bridge from cove k to k + 1 was crossed.
  function update({ state, crossed, selected }) {
    buttons.forEach((button, k) => {
      const now = state(k);
      button.className = 'elif-isle ' + now + (k === selected ? ' selected' : '');
      button.querySelector('.elif-isle-badge').textContent = now === 'done' ? '✓' : now === 'locked' ? '🔒' : k + 1;
      button.setAttribute('aria-label', (k + 1) + '. ' + coves[k] + (now === 'done' ? ', tamamlandı' : now === 'current' ? ', şu an buradasın' : ', kilitli') +
        (k === selected ? ', kaplumbağa burada' : ''));
      button.setAttribute('aria-disabled', String(now === 'locked'));
      const art = host.querySelector('.map-isle[data-k="' + k + '"]');
      art.classList.toggle('locked', now === 'locked');
      art.classList.toggle('current', now === 'current');
      const way = host.querySelector('.map-bridge[data-k="' + k + '"]');
      if (way) way.setAttribute('class', 'map-bridge ' + (crossed(k) ? 'crossed' : now === 'locked' ? 'locked' : 'next'));
    });
  }
  // Scrolls the sea so that cove k is in the window: always to its middle, or (`always` false) only
  // when the islet is not already in view.
  function follow(k, always = true, smooth = false) {
    if (!sea || !sea.clientHeight) return;
    const y = spots[k][1] / WORLD * sea.scrollHeight;
    const margin = 70 / WORLD * sea.scrollHeight;
    if (!always && y - margin >= sea.scrollTop && y + margin <= sea.scrollTop + sea.clientHeight) return;
    sea.scrollTo({ top: y - sea.clientHeight / 2, behavior: smooth && !calm.matches ? 'smooth' : 'auto' });
  }
  function place(k) {
    at = k;
    Object.assign(turtle.style, feet(k));
    follow(k, false);
  }
  // The steps of the cove the turtle stands on, on the pier: `nodes` are their buttons.
  function dock(nodes, label) {
    dockList.setAttribute('aria-label', label);
    dockList.replaceChildren(...nodes.map(node => {
      const item = document.createElement('li');
      item.append(node);
      return item;
    }));
  }
  // Walks from the cove the turtle is on to cove `to`, over every islet in between.
  function walk(to) {
    if (walking || to === at) return Promise.resolve();
    walking = true;
    const path = [];
    for (let k = at; k !== to; k += Math.sign(to - at)) path.push([k, k + Math.sign(to - at)]);
    const each = Math.max(380, 640 - path.length * 40);
    const turn = turtle.querySelector('.elif-map-turtle-turn');
    turtle.classList.add('walking');
    dockList.classList.add('away');
    const step = async ([from, next]) => {
      // the turtle's head is on the left of its picture: turn it round to walk to the right
      turn.classList.toggle('right', spots[next][0] > spots[from][0]);
      Object.assign(turtle.style, feet(next));
      follow(next, false, true);
      if (!calm.matches) await turtle.animate([feet(from), feet(next)], { duration: each, easing: 'ease-in-out' }).finished.catch(() => {});
      at = next;
      playCue('tap', { gain: 0.6 });
    };
    return path.reduce((chain, leg) => chain.then(() => step(leg)), Promise.resolve()).then(() => {
      turtle.classList.remove('walking');
      dockList.classList.remove('away');
      turn.classList.remove('right');
      walking = false;
    });
  }
  return { build, update, place, walk, dock, at: () => at, walking: () => walking };
})();
