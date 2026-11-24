// The coves of Elif Ba Adası as a map: seven islets joined by glass bridges (the Cam Köprü of each
// cove), from Kaplumbağa Koyu at the bottom to the lighthouse at the top. The turtle stands on the
// cove being looked at and walks over the bridges, islet by islet, to wherever the child goes:
// forward to a new cove or back to an earlier one.
const elifMap = (() => {
  const { coves, glyphs, coveLetters } = elifData;
  const W = 400, H = 440;
  const spots = [[84, 370], [248, 378], [334, 280], [180, 262], [72, 166], [214, 128], [326, 54]];
  const short = ['Kaplumbağa', 'İnci', 'Mercan', 'Yıldız', 'Yunus', 'Sedef', 'Deniz Feneri'];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const left = x => (x / W * 100).toFixed(2) + '%';
  const top = y => (y / H * 100).toFixed(2) + '%';
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
    return '<g class="map-isle" data-k="' + k + '" transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse rx="60" ry="37" fill="#a8ecf2" opacity=".75"/><ellipse class="map-sand" rx="49" ry="29" fill="#f3d892"/>' +
      '<g transform="' + flip.trim() + '"><path class="map-grass" d="M-34-4C-30-20 0-26 20-18c14 6 10 18-6 20C-8 5-36 8-34-4Z" fill="#9fd88a"/>' +
      (k === 6 ? '' : palm) + '</g>' + (k === 6 ? lighthouse : '') + '</g>';
  }
  function bridge(k) {
    const [x1, y1] = spots[k], [x2, y2] = spots[k + 1];
    const line = 'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"';
    return '<g class="map-bridge" data-k="' + k + '"><line ' + line + ' class="map-rails"/><line ' + line + ' class="map-panes"/></g>';
  }
  const waves = [[40, 40], [150, 30], [270, 120], [350, 190], [30, 280], [120, 330], [330, 400], [250, 200], [140, 410]]
    .map(([x, y]) => '<path d="M' + x + ' ' + y + 'q7-6 14 0t14 0"/>').join('');

  let host = null, turtle = null, buttons = [], at = 0, walking = false;
  // onPick(k): a cove was tapped.
  function build(element, onPick) {
    host = element;
    host.innerHTML = '<svg class="elif-map-art" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><defs>' +
      '<linearGradient id="map-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fcde0"/><stop offset="1" stop-color="#3cb0c8"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" rx="26" fill="url(#map-sea)"/>' +
      '<g class="map-waves" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55">' + waves + '</g>' +
      coves.slice(1).map((_, k) => bridge(k)).join('') + coves.map((_, k) => islet(k)).join('') + '</svg>' +
      coves.map((name, k) => '<button type="button" class="elif-isle" data-k="' + k + '" style="left:' + left(spots[k][0]) + ';top:' + top(spots[k][1]) + '">' +
        '<span class="elif-isle-badge" aria-hidden="true"></span><span class="elif-isle-glyphs" lang="ar" dir="rtl" aria-hidden="true">' +
        coveLetters(k).map(i => glyphs[i]).join(' ') + '</span><span class="elif-isle-name">' + short[k] + '</span></button>').join('') +
      '<div class="elif-map-turtle" aria-hidden="true"><div class="elif-map-turtle-turn"><div class="elif-map-turtle-body">' +
      elifArt.turtle('map') + '</div></div></div>';
    buttons = Array.from(host.querySelectorAll('.elif-isle'));
    turtle = host.querySelector('.elif-map-turtle');
    buttons.forEach((button, k) => { button.onclick = () => onPick(k); });
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
      host.querySelector('.map-isle[data-k="' + k + '"]').classList.toggle('locked', now === 'locked');
      const way = host.querySelector('.map-bridge[data-k="' + k + '"]');
      if (way) way.setAttribute('class', 'map-bridge ' + (crossed(k) ? 'crossed' : now === 'locked' ? 'locked' : 'next'));
    });
  }
  function place(k) {
    at = k;
    Object.assign(turtle.style, feet(k));
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
    const step = async ([from, next]) => {
      // the turtle's head is on the left of its picture: turn it round to walk to the right
      turn.classList.toggle('right', spots[next][0] > spots[from][0]);
      Object.assign(turtle.style, feet(next));
      if (!calm.matches) await turtle.animate([feet(from), feet(next)], { duration: each, easing: 'ease-in-out' }).finished.catch(() => {});
      at = next;
      playCue('tap', { gain: 0.6 });
    };
    return path.reduce((chain, leg) => chain.then(() => step(leg)), Promise.resolve()).then(() => {
      turtle.classList.remove('walking');
      turn.classList.remove('right');
      walking = false;
    });
  }
  return { build, update, place, walk, at: () => at, walking: () => walking };
})();
