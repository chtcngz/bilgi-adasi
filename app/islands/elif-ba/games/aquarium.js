// Akvaryum: Elif Ba Adası's collection. Every letter whose harekes are learned (the Harekeler step)
// brings a fish to the tank; it carries the letter with a hareke and says that syllable when touched,
// moving on to the next hareke each time. The fish wander slowly on their own, turn round gently,
// and swim over to the food a tap on the water drops. Nothing here is scored.
const elifAquarium = (() => {
  const { glyphs, names, harekeler, syllable } = elifData;
  const voice = elifVoice;
  const dialog = $('elif-aquarium');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- The fish ---------- */
  // Four kinds of fish, each letter always the same kind and colours. They face left (head at x 0).
  const palettes = [
    ['#ffb347', '#ff7a2f', '#fff3e0'], ['#7fd6ff', '#2f8fe0', '#e8f7ff'], ['#ffd84d', '#f0a400', '#fffbe6'],
    ['#ff8fb4', '#e2537f', '#fff0f5'], ['#8be3b5', '#2fa771', '#eafff4'], ['#c3a6ff', '#7b5ce0', '#f4efff'],
    ['#ff8a80', '#e04a3f', '#fff1ef'], ['#7ee8e0', '#1fa8a0', '#e9fffd']
  ];
  const kinds = ['round', 'long', 'angel', 'clown'];
  // Speed, vertical range and tail cadence shape each species' swimming rhythm.
  const swim = {
    round: { speed: 19, rise: .13, beat: .76, wave: 2 },
    long:  { speed: 32, rise: .09, beat: .32, wave: 1 },
    angel: { speed: 20, rise: .34, beat: .94, wave: 4 },
    clown: { speed: 26, rise: .20, beat: .45, wave: 5 }
  };
  // `prefix` keeps the gradients of the hub's little fish apart from the tank's (a gradient inside a closed dialog does not paint).
  function fishSvg(i, prefix = 'aq', badge = true) {
    const [light, deep, pale] = palettes[(i * 3) % palettes.length];
    const kind = kinds[i % kinds.length];
    const id = prefix + i;
    const grad = '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + light + '"/>' +
      '<stop offset=".42" stop-color="' + deep + '"/><stop offset=".78" stop-color="' + light + '"/><stop offset="1" stop-color="' + pale + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + deep + '"/><stop offset="1" stop-color="' + light + '" stop-opacity=".55"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><path d="BODY"/></clipPath></defs>';
    const shapes = {
      round: { body: 'M8 50C8 26 34 12 62 12 92 12 112 32 116 50 112 68 92 88 62 88 34 88 8 74 8 50Z', tail: 'M112 50L148 24C140 40 140 60 148 76Z',
        top: 'M42 18C54 0 86 -2 100 26Z', low: 'M58 84C64 98 80 98 86 82Z', eye: [32, 42], badge: [64, 52, 24] },
      long: { body: 'M4 50C14 40 40 23 72 25S108 42 124 46L124 54C108 56 102 73 73 74S17 63 4 50Z', tail: 'M118 46Q132 43 151 26Q149 40 138 50Q148 60 151 73Q129 56 118 54Z',
        top: 'M56 28C70 12 92 12 104 30Z', low: 'M66 72C72 84 86 84 90 72Z', eye: [24, 44], badge: [70, 51, 21] },
      angel: { body: 'M10 50C24 26 46 14 66 14 90 14 108 34 112 50 108 66 90 86 66 86 46 86 24 74 10 50Z', tail: 'M108 50L140 30 134 50 140 70Z',
        top: 'M43 24Q60 18 95 -11Q87 9 103 32Z', low: 'M44 77Q61 86 94 105Q86 86 103 70Z', eye: [30, 44], badge: [64, 51, 23] },
      clown: { body: 'M8 50C8 28 32 16 60 16 90 16 110 34 114 50 110 66 90 84 60 84 32 84 8 72 8 50Z', tail: 'M110 50L144 28C138 42 138 58 144 72Z',
        top: 'M46 20C58 4 86 4 98 26Z', low: 'M56 80C62 94 78 94 82 80Z', eye: [30, 43], badge: [64, 51, 22] }
    };
    const s = shapes[kind];
    const pattern = kind === 'clown'
      ? '<path clip-path="url(#' + id + 'c)" d="M42 12Q56 46 40 86M86 18Q77 49 91 82" fill="none" stroke="' + pale + '" stroke-width="9"/>'
      : kind === 'angel'
        ? '<g clip-path="url(#' + id + 'c)" fill="' + pale + '" opacity=".5"><path d="M46 0l8 0-10 100h-8z"/><path d="M80 0l8 0-10 100h-8z"/></g>'
        : '<g clip-path="url(#' + id + 'c)" fill="' + pale + '" opacity=".45"><circle cx="90" cy="34" r="5"/><circle cx="100" cy="52" r="4"/>' +
          '<circle cx="88" cy="68" r="5"/><circle cx="48" cy="26" r="3.5"/></g>';
    const [ex, ey] = s.eye;
    const [bx, by, br] = s.badge;
    return '<svg viewBox="-4 -16 160 132" aria-hidden="true">' + grad.replace('BODY', s.body) + '<g class="aq-silhouette">' +
      '<g class="aq-tail"><path d="' + s.tail + '" fill="url(#' + id + 'f)"/><path d="' + s.tail + '" fill="none" stroke="' + deep + '" stroke-opacity=".4" stroke-width="1.5"/></g>' +
      '<path class="aq-fin" d="' + s.top + '" fill="url(#' + id + 'f)" opacity=".9"/>' +
      '<path class="aq-fin low" d="' + s.low + '" fill="url(#' + id + 'f)" opacity=".85"/>' +
      '<path d="' + s.body + '" fill="url(#' + id + 'b)"/>' + pattern +
      '<path d="' + s.body + '" fill="none" stroke="' + deep + '" stroke-opacity=".35" stroke-width="2"/>' +
      '<g clip-path="url(#' + id + 'c)" fill="none" stroke="' + pale + '" opacity=".48"><path d="M40 33Q70 18 103 39M81 54q5 5 9 0m2 4q5 5 9 0m-19 3q5 5 9 0"/></g>' +
      '<path class="aq-pectoral" d="M40 54q11 1 17 16-15 2-17-16Z" fill="url(#' + id + 'f)" stroke="' + deep + '" stroke-width="1"/>' +
      '<path d="M' + (ex + 14) + ' ' + (ey - 14) + 'Q' + (ex + 22) + ' ' + ey + ' ' + (ex + 14) + ' ' + (ey + 16) + '" fill="none" stroke="' + deep + '" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="' + ex + '" cy="' + ey + '" r="6.8" fill="' + pale + '"/><circle cx="' + (ex - 1) + '" cy="' + ey + '" r="4.7" fill="#172e39"/>' +
      '<circle cx="' + (ex - 4) + '" cy="' + (ey - 2) + '" r="2" fill="#fff"/>' +
      '<path d="M' + (ex - 22) + ' ' + (ey + 14) + 'q4 3 8 0" fill="none" stroke="#1d2a33" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/></g>' +
      (badge ? '<g class="aq-badge" style="--turn-offset:' + (152 - 2 * bx) + 'px"><circle cx="' + bx + '" cy="' + by + '" r="' + br + '" fill="#fff9e9"/><g transform="translate(' + bx + ' ' + by + ')"><g class="aq-reading"><text class="aq-letter" lang="ar" direction="rtl" data-radius="' + br + '"></text></g></g></g>' : '') +
      '</svg>';
  }

  /* ---------- Scene ---------- */
  const weed = (x, h, c, d) => '<path class="aq-weed" style="--d:' + d + 's" d="M' + x + ' 300C' + (x - 14) + ' ' + (300 - h * .3) + ' ' + (x + 14) + ' ' +
    (300 - h * .6) + ' ' + x + ' ' + (300 - h) + '" stroke="' + c + '" stroke-width="9" fill="none" stroke-linecap="round"/>';
  dialog.innerHTML = '<div class="aq-scene"><div class="aq-world">' +
    '<div class="aq-water" aria-hidden="true"><i class="aq-rays"></i><i class="aq-caustics"></i><i class="aq-motes"></i></div>' +
    '<svg class="aq-floor" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="aq-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dca0"/><stop offset="1" stop-color="#d9b46a"/></linearGradient></defs>' +
      '<path d="M0 250C120 232 220 244 340 236 470 228 590 248 800 232V300H0Z" fill="#c9a35d" opacity=".55"/>' +
      weed(60, 190, '#2f9a5a', 6) + weed(84, 140, '#3fb36a', 7.5) + weed(712, 210, '#2f9a5a', 7) + weed(740, 150, '#4fc07a', 5.5) + weed(470, 110, '#3fb36a', 6.5) +
      '<g class="aq-coral"><path d="M600 262c-6-30 2-52 10-70M610 230c10-12 20-16 30-16M606 210c-14-8-22-20-24-34" stroke="#ff8a80" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path d="M170 262c4-26 0-40-8-54M168 236c-12-6-18-14-20-26M168 230c10-8 22-8 30-4" stroke="#ff9fc0" stroke-width="9" fill="none" stroke-linecap="round"/></g>' +
      '<path d="M0 262C150 246 260 268 400 258 560 248 650 270 800 254V300H0Z" fill="url(#aq-sand)"/>' +
      '<g class="aq-chest"><rect x="300" y="236" width="62" height="34" rx="5" fill="#8a5a2b"/><path d="M300 240c0-18 62-18 62 0z" fill="#a06a35"/>' +
      '<rect x="300" y="246" width="62" height="5" fill="#e0b84a"/><rect x="326" y="244" width="10" height="12" rx="2" fill="#e0b84a"/></g>' +
      '<ellipse cx="520" cy="270" rx="26" ry="11" fill="#9aa8ad"/><ellipse cx="548" cy="274" rx="16" ry="8" fill="#b6c2c6"/>' +
      '<path d="M236 274c4-14 26-14 30 0z" fill="#ffd9c7"/><path d="M240 274l11-12 11 12" stroke="#f0a88a" stroke-width="2" fill="none"/>' +
      '<circle cx="430" cy="280" r="5" fill="#fff6dd"/><circle cx="660" cy="284" r="4" fill="#fff6dd"/><circle cx="120" cy="282" r="4" fill="#e9d3a0"/>' +
    '</svg>' +
    '<div class="aq-bubbles" aria-hidden="true"></div>' +
    '<div class="aq-tank" data-cue></div>' +
    '</div>' +
    '<div class="aq-top"><button type="button" class="aq-close" aria-label="Akvaryumdan çık">×</button>' +
      '<h2 class="aq-title">Akvaryum <span></span></h2></div>' +
    '<p class="aq-say" role="status"></p>' +
    '<div class="aq-shelf"></div>' +
  '</div>';
  const find = selector => dialog.querySelector(selector);
  const scene = find('.aq-scene');
  const tank = find('.aq-tank');
  const say = find('.aq-say');
  const shelf = find('.aq-shelf');
  const count = find('.aq-title span');
  const bubbles = find('.aq-bubbles');

  // Bubbles rising from the chest and from two stones.
  for (let k = 0; k < 14; k++) {
    const b = document.createElement('i');
    const spot = [0.415, 0.42, 0.66, 0.1][k % 4];
    b.style.left = (spot * 100 + rand(-1.5, 1.5)) + '%';
    b.style.setProperty('--s', rand(5, 13).toFixed(0) + 'px');
    b.style.setProperty('--t', rand(6, 11).toFixed(1) + 's');
    b.style.setProperty('--w', rand(-14, 14).toFixed(0) + 'px');
    b.style.animationDelay = (-rand(0, 11)).toFixed(1) + 's';
    bubbles.append(b);
  }

  /* ---------- Swimming ---------- */
  let fish = [], food = [], frameId = 0, last = 0, w = 0, h = 0, options = null, sayTimer = 0;
  function measure() {
    w = tank.clientWidth;
    h = tank.clientHeight;
  }
  new ResizeObserver(() => { if (dialog.open) measure(); }).observe(tank);
  // The water a fish may swim in: under the title, over the sand and the letters' shelf.
  const area = () => ({ x0: 40, x1: w - 40, y0: h * 0.16, y1: h * 0.7 });
  const burstSpeed = 2.85;
  const burstDuration = 3.2;
  const pickTarget = (f, dart = false) => {
    const a = area();
    const angle = rand(0, Math.PI * 2);
    const dx = Math.cos(angle) * (a.x1 - a.x0) * rand(.35, .7);
    const dy = Math.sin(angle) * (a.y1 - a.y0) * (dart ? .7 : .35 + f.swim.rise);
    // Turn inward when the chosen route would run into the glass.
    const target = (pos, delta, low, high) => {
      const next = pos + delta;
      return Math.max(low, Math.min(high, next < low || next > high ? pos - delta : next));
    };
    f.tx = target(f.x, dx, a.x0, a.x1);
    f.ty = target(f.y, dy, a.y0, a.y1);
    f.rest = !dart && Math.random() < 0.3 ? rand(1.2, 3.5) : 0;
  };
  function addFish(i, h0, arriving) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'aq-fish' + (arriving ? ' new' : '');
    node.dataset.cue = '';
    node.setAttribute('aria-label', names[i] + ' balığı');
    node.innerHTML = '<span class="aq-body">' + fishSvg(i) + '</span>';
    tank.append(node);
    const a = area();
    const size = rand(0.78, 1.08);
    const kind = kinds[i % kinds.length];
    const profile = swim[kind];
    const f = {
      i, h: h0, node, size,
      x: arriving && !calm.matches ? (Math.random() < 0.5 ? -120 : w + 120) : rand(a.x0, a.x1), y: rand(a.y0, a.y1),
      kind, swim: profile, vx: 0, vy: 0, dir: 1, speed: profile.speed * rand(.88, 1.12), phase: rand(0, 6.3), rest: 0, boost: 0
    };
    node.style.setProperty('--size', size.toFixed(2));
    node.style.setProperty('--beat', profile.beat + 's');
    node.style.setProperty('--delay', -f.phase + 's');
    node.style.zIndex = Math.round(size * 100);
    f.tx = arriving ? rand(w * 0.3, w * 0.7) : f.x;
    f.ty = f.y;
    if (!arriving) pickTarget(f);
    drawLetter(f);
    node.onclick = event => { event.stopPropagation(); touch(f); };
    fish.push(f);
    place(f);
    return f;
  }
  const pen = document.createElement('canvas').getContext('2d');
  function drawLetter(f) {
    const label = f.node.querySelector('.aq-letter');
    label.textContent = syllable(f.i, f.h);
    const style = getComputedStyle(label);
    pen.font = style.fontSize + ' ' + style.fontFamily;
    pen.direction = 'rtl';
    pen.textAlign = 'start';
    const ink = pen.measureText(label.textContent);
    const width = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    const height = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    const scale = label.dataset.radius * 1.72 / Math.max(1, Math.hypot(width, height));
    const x = (ink.actualBoundingBoxLeft - ink.actualBoundingBoxRight) / 2;
    const y = (ink.actualBoundingBoxAscent - ink.actualBoundingBoxDescent) / 2;
    label.setAttribute('transform', 'scale(' + scale + ') translate(' + x + ' ' + y + ')');
  }
  function place(f) {
    const bob = Math.sin(f.phase) * f.swim.wave;
    const pitch = Math.max(-14, Math.min(14, -f.dir * f.vy * .65));
    f.node.style.transform = 'translate(' + f.x.toFixed(1) + 'px,' + (f.y + bob).toFixed(1) + 'px) translate(-50%, -50%) rotate(' + pitch.toFixed(1) + 'deg)';
    f.node.classList.toggle('right', f.dir < 0);
  }
  function step(dt) {
    for (const f of fish) {
      f.phase += dt * (f.kind === 'clown' ? 3 : 1.6);
      f.boost = Math.max(0, f.boost - dt);
      f.node.classList.toggle('darting', f.boost > 0);
      if (f.rest > 0 && !f.meal && !f.boost) { f.rest -= dt; const drag = Math.exp(-2.5 * dt); f.vx *= drag; f.vy *= drag; }
      else {
        const tx = f.meal ? f.meal.x : f.tx, ty = f.meal ? f.meal.y : f.ty;
        const dx = tx - f.x, dy = ty - f.y, dist = Math.hypot(dx, dy);
        // Slender fish alternate a tail-powered sprint with a glide.
        const pace = f.kind === 'long' ? 1 + .85 * Math.sin(f.phase) : 1;
        const cruise = f.meal ? 1.9 : pace;
        const want = (cruise + (burstSpeed - cruise) * Math.min(1, f.boost)) * f.speed * Math.min(1, dist / 60 + 0.15);
        const ax = dist > 1 ? dx / dist * want : 0, ay = dist > 1 ? dy / dist * want * .88 : 0;
        // easing towards the wanted speed makes the turns wide and slow
        const ease = Math.min(1, dt * (f.boost ? 4 : f.meal || f.kind === 'long' ? 1.6 : 0.7));
        f.vx += (ax - f.vx) * ease;
        f.vy += (ay - f.vy) * ease;
        if (f.meal && dist < 14) eat(f);
        else if (!f.meal && dist < 18) pickTarget(f);
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      // it turns only once it really swims the other way, so it does not flicker
      if (f.vx < -3) f.dir = 1;
      else if (f.vx > 3) f.dir = -1;
      place(f);
    }
    for (const bit of food) {
      bit.y = Math.min(h * 0.74, bit.y + dt * 16);
      bit.x += Math.sin((bit.y + bit.seed) / 14) * dt * 6;
      bit.node.style.transform = 'translate(' + bit.x + 'px,' + bit.y + 'px)';
      bit.age += dt;
      if (bit.age > 14) dropFood(bit);
    }
  }
  function frame(now) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!w) measure();
    if (calm.matches) return;
    step(dt);
  }

  /* ---------- Touches ---------- */
  function sayLine(text) {
    say.innerHTML = text;
    say.classList.add('on');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove('on'), 3200);
  }
  function touch(f) {
    voice.syllable(f.i, f.h);
    sayLine('<b lang="ar" dir="rtl">' + syllable(f.i, f.h) + '</b> ' + names[f.i] + ' ' + hareke(f.h));
    f.node.classList.remove('joy'); void f.node.offsetWidth; f.node.classList.add('joy');
    puff(f.x - f.dir * 50, f.y - 6, 5);
    // a little dash away, and the next touch says the next hareke
    if (!calm.matches) {
      f.boost = burstDuration;
      pickTarget(f, true);
      const dx = (f.meal?.x ?? f.tx) - f.x, dy = (f.meal?.y ?? f.ty) - f.y;
      const impulse = f.speed * 2.5 / Math.max(1, Math.hypot(dx, dy));
      f.vx = dx * impulse;
      f.vy = dy * impulse;
    }
    f.h = (f.h + 1) % 3;
    setTimeout(() => drawLetter(f), 900);
  }
  // A few bubbles where a fish was touched.
  function puff(x, y, n) {
    for (let k = 0; k < n; k++) {
      const b = document.createElement('i');
      b.className = 'aq-puff';
      b.style.left = (x + rand(-8, 8)) + 'px';
      b.style.top = (y + rand(-8, 8)) + 'px';
      b.style.setProperty('--s', rand(6, 14).toFixed(0) + 'px');
      b.style.animationDelay = (k * 0.08).toFixed(2) + 's';
      tank.append(b);
      setTimeout(() => b.remove(), 2200);
    }
  }
  // A tap on the water drops a pinch of food; the nearest fish swim over to eat it.
  tank.addEventListener('click', event => {
    if (event.target !== tank) return;
    const box = tank.getBoundingClientRect();
    const x = event.clientX - box.left, y = Math.min(h * 0.6, event.clientY - box.top);
    playCue('pop', { ambient: true });
    for (let k = 0; k < 3; k++) {
      const node = document.createElement('i');
      node.className = 'aq-food';
      tank.append(node);
      const bit = { x: x + rand(-16, 16), y: y + rand(-6, 6), node, seed: rand(0, 99), age: 0 };
      food.push(bit);
    }
    const hungry = fish.filter(f => !f.meal).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, 3);
    hungry.forEach((f, k) => { f.meal = food[food.length - 1 - k] || null; f.rest = 0; });
  });
  function dropFood(bit) {
    food = food.filter(other => other !== bit);
    bit.node.remove();
    for (const f of fish) if (f.meal === bit) { f.meal = null; pickTarget(f); }
  }
  function eat(f) {
    const bit = f.meal;
    puff(bit.x, bit.y, 2);
    dropFood(bit);
    // a fish whose bit was eaten by another goes for the next one, if any is left
    f.meal = null;
    const next = food.find(b => !fish.some(o => o.meal === b));
    if (next && Math.random() < 0.6) f.meal = next;
    else { f.rest = rand(0.5, 1.5); pickTarget(f); }
  }

  /* ---------- The shelf: the 28 letters ---------- */
  function drawShelf(have) {
    shelf.innerHTML = '';
    glyphs.forEach((g, i) => {
      const got = have.includes(i);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'aq-slot' + (got ? ' got' : '');
      b.innerHTML = '<b lang="ar" dir="rtl">' + g + '</b>';
      b.setAttribute('aria-label', names[i] + (got ? ' balığı' : ', henüz balığı yok'));
      b.onclick = () => {
        const f = fish.find(x => x.i === i);
        if (f) {
          // the fish swims to the middle of the tank and says its syllable
          f.tx = w / 2; f.ty = h * 0.42; f.meal = null; f.rest = 0;
          touch(f);
          f.tx = w / 2; f.ty = h * 0.42;
        } else {
          playCue('oops');
          sayLine('🔒 ' + names[i] + ' harfinin harekelerini öğren, balığı gelsin.');
        }
      };
      shelf.append(b);
    });
  }

  /* ---------- Opening and closing ---------- */
  // have: letters with a fish; fresh: those among them that arrive now (they swim in from the side).
  function open(settings) {
    options = settings;
    const { have, fresh = [] } = settings;
    if (!dialog.open) dialog.showModal();
    measure();
    for (const f of fish) f.node.remove();
    for (const bit of food) bit.node.remove();
    fish = []; food = [];
    count.textContent = have.length + ' / 28';
    have.forEach(i => addFish(i, (i * 2) % 3, fresh.includes(i)));
    drawShelf(have);
    say.classList.remove('on');
    if (!have.length) {
      sayLine('Harekeler adımında bir harfi bitirince buraya onun balığı gelir. 🐠');
      clearTimeout(sayTimer);
    } else if (fresh.length) {
      sayLine('✨ ' + (fresh.length === 1 ? names[fresh[0]] + ' balığı geldi!' : fresh.length + ' yeni balık geldi!'));
      playCue('star');
    } else sayLine('Bir balığa dokun, harfini okusun. Suya dokunursan yem atarsın.');
    last = performance.now();
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(frame);
  }
  find('.aq-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    voice.stop();
    const done = options?.onClose;
    options = null;
    done?.();
  });
  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else if (!frameId) { last = performance.now(); frameId = requestAnimationFrame(frame); }
  });
  return { open, fishSvg };
})();
