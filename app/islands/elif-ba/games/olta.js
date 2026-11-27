// 🎣 Balık Tutma: the turtle sits in a boat with a fishing rod; under it fish swim across the sea, each
// with a letter (syllable) on its side. The turtle says one; the child taps that fish, the hook goes down
// to it and reels it up into the boat. A wrong fish slips off the hook and swims away: a heart breaks.
// Sixteen turns of the cove's items, three hearts.
(() => {
  const MAX_FISH = 6;
  const fishSvg = '<svg viewBox="0 0 100 60" aria-hidden="true"><path class="ol-tail" d="M78 30 98 10V50Z"/>' +
    '<path class="ol-fin" d="M40 8Q52-2 62 9Z"/><path class="ol-fin" d="M44 52Q54 62 62 51Z"/>' +
    '<ellipse class="ol-skin" cx="44" cy="30" rx="40" ry="24"/><path d="M60 12Q68 30 60 48" fill="none" stroke="#0002" stroke-width="3"/>' +
    '<circle cx="18" cy="24" r="6" fill="#fff"/><circle cx="17" cy="24" r="3" fill="#1d2b36"/><path d="M5 34q5 3 9 0" fill="none" stroke="#1d2b36" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const boatSvg = '<svg viewBox="0 0 200 70" aria-hidden="true"><path d="M4 20H196L172 64H28Z" fill="#c8743a" stroke="#7a3f17" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M12 34H188" stroke="#ffd863" stroke-width="7"/><path d="M28 50H172" stroke="#7a3f17" stroke-width="3" opacity=".4"/></svg>';
  let fishes = [], layer = null, lineSvg = null, rodSvg = null, hook = null;
  let W = 0, H = 0, surface = 0, lanes = [], size = 100, tip = { x: 0, y: 0 }, nextSpawn = 0, sinceTarget = 0;
  const progress = api => api.game.done / api.game.plan.length;
  const crossTime = api => 8 - 2.4 * progress(api);
  const spawnGap = api => 1.35 - 0.35 * progress(api);

  function place(fish) {
    fish.el.style.transform = 'translate(' + (fish.x - size / 2).toFixed(1) + 'px,' + (fish.y - size * 0.3).toFixed(1) + 'px)';
  }
  // The fish's mouth, where the hook takes it.
  const mouth = fish => ({ x: fish.x + (fish.dir > 0 ? 0.44 : -0.44) * size, y: fish.y + size * 0.07 });
  function drawLine(end) {
    const line = lineSvg.querySelector('line');
    if (!end) { lineSvg.classList.remove('on'); return; }
    lineSvg.classList.add('on');
    line.setAttribute('x1', tip.x); line.setAttribute('y1', tip.y); line.setAttribute('x2', end.x); line.setAttribute('y2', end.y);
    lineSvg.querySelector('.ol-hook').setAttribute('transform', 'translate(' + end.x.toFixed(1) + ' ' + end.y.toFixed(1) + ')');
  }
  function spawn(api) {
    if (fishes.filter(f => f.state === 'swim').length >= MAX_FISH) return;
    // a lane whose entrance is clear
    const open = lanes.map((lane, n) => n).filter(n => !fishes.some(f => f.lane === n && f.state === 'swim' &&
      (lanes[n].dir > 0 ? f.x < size * 1.6 : f.x > W - size * 1.6)));
    if (!open.length) return;
    const n = api.pick(open);
    const target = api.game.target;
    const swimming = fishes.filter(f => f.state === 'swim');
    const want = !swimming.some(f => f.item === target) && (sinceTarget >= 1 || Math.random() < 0.5);
    sinceTarget = want ? 0 : sinceTarget + 1;
    const item = want ? target : api.distractor(target, swimming.map(f => f.item));
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ol-fish t' + Math.floor(Math.random() * 5) + (lanes[n].dir > 0 ? ' right' : '');
    const text = api.kind.text(item);
    el.innerHTML = '<span class="ol-flip">' + fishSvg + '</span><span class="ol-sign">' + api.glyph(item, text) + '</span><em class="rain-tag"></em>';
    el.setAttribute('aria-label', api.kind.name(item));
    const fish = { el, item, text, lane: n, dir: lanes[n].dir, x: lanes[n].dir > 0 ? -size * 0.6 : W + size * 0.6, y: lanes[n].y, state: 'swim',
      speed: (W + size * 1.2) / crossTime(api) * (0.9 + Math.random() * 0.2) };
    el.onpointerdown = event => { event.preventDefault(); cast(fish, api); };
    el.onclick = event => { if (!event.detail) cast(fish, api); };
    place(fish);
    layer.append(el);
    fishes.push(fish);
  }
  // The hook goes down to the fish tapped; the rest happens in tick.
  function cast(fish, api) {
    if (!api.playing || hook || fish.state !== 'swim') return;
    fish.state = 'hooked';
    fish.el.classList.add('hooked');
    hook = { fish, t: 0, phase: 'down', from: { ...tip } };
    playCue('pop', { rate: 0.8, gain: 0.5 });
  }
  function land(api) {
    const { fish } = hook;
    if (fish.item === api.game.target) {
      hook.phase = 'reel';
      hook.t = 0;
      hook.start = { x: fish.x, y: fish.y };
      playCue('key', { rate: 1.2 });
      return;
    }
    if (!api.wrong(api.kind.name(fish.item))) {
      // before the turtle has said what to find: the fish only wriggles and swims on
      fish.state = 'swim';
      fish.el.classList.remove('hooked');
      hook = null;
      drawLine(null);
      return;
    }
    fish.state = 'flee';
    fish.speed *= 3.2;
    fish.el.classList.remove('hooked');
    fish.el.classList.add('flee');
    fish.el.querySelector('.rain-tag').textContent = api.kind.name(fish.item);
    hook = null;
    drawLine(null);
  }
  function remove(fish) {
    fish.el.remove();
    fishes = fishes.filter(f => f !== fish);
  }

  elifArcade.register({
    id: 'olta', name: 'Balık Tutma', icon: '🎣', title: 'Balık <em>Tutma</em>', flow: 'target', hearts: true, turns: 16,
    first: '👆 Duyduğunun balığına dokun',
    intro: () => 'Kaplumbağa teknesinde balık tutuyor. Her balığın üstünde bir hece var. Kaplumbağa bir hece söyleyecek: o balığa dokun, ' +
      'olta inip balığı tutsun! Yanlış balık oltadan kaçar. 16 balığı tutunca yoluna devam edersin; hiç can kaybetmezsen üç yıldız!',
    say: () => 'Balık Tutma! Kaplumbağa bir hece söyleyecek. O hecenin balığına dokun, olta onu tutsun. Başlamak için yeşil düğmeye bas.',
    sample: api => api.shuffled(api.options.recent).slice(0, 3).map((item, n) => '<span class="ol-sample t' + [0, 4, 1][n] + '"><span class="ol-flip">' +
      fishSvg + '</span><span class="ol-sign">' + api.glyph(item) + '</span></span>').join(''),
    build(api) {
      api.stage.innerHTML = '<div class="ol-sky" aria-hidden="true"></div><div class="ol-water" aria-hidden="true"><i class="ol-ray one"></i><i class="ol-ray two"></i></div>' +
        '<div class="ol-bed" aria-hidden="true"><i class="ol-weed one"></i><i class="ol-weed two"></i><i class="ol-weed three"></i></div>' +
        '<div class="ol-boat" aria-hidden="true">' + boatSvg + '</div>' +
        '<svg class="ol-rod" aria-hidden="true"><path/></svg><div class="ol-fishes"></div>' +
        '<svg class="ol-line" aria-hidden="true"><line/><path class="ol-hook" d="M0 0V7a4 4 0 0 0 8 0V4"/></svg>';
      layer = api.stage.querySelector('.ol-fishes');
      lineSvg = api.stage.querySelector('.ol-line');
      rodSvg = api.stage.querySelector('.ol-rod');
    },
    resize(api) {
      W = api.stage.clientWidth;
      H = api.stage.clientHeight;
      const ceil = parseFloat(getComputedStyle(api.scene).getPropertyValue('--ceil')) || 120;
      surface = Math.round(ceil + Math.min(150, Math.max(110, H * 0.17)));
      api.scene.style.setProperty('--surface', surface + 'px');
      size = Math.round(Math.max(84, Math.min(136, W / 3.6)));
      api.scene.style.setProperty('--fish', size + 'px');
      const bed = 70, top = surface + size * 0.55, bottom = H - bed - size * 0.35;
      const count = Math.max(3, Math.min(5, Math.floor((bottom - top) / (size * 0.78)) + 1));
      lanes = Array.from({ length: count }, (_, n) => ({ y: top + (count > 1 ? n * (bottom - top) / (count - 1) : 0), dir: n % 2 ? -1 : 1 }));
      // The rod: from the turtle's flipper in the boat up and out over the water.
      const turtleBox = api.scene.querySelector('.arc-turtle').getBoundingClientRect(), base = api.stage.getBoundingClientRect();
      const hand = { x: turtleBox.right - base.left - turtleBox.width * 0.22, y: turtleBox.top - base.top + turtleBox.height * 0.62 };
      tip = { x: Math.min(W - 24, hand.x + Math.max(90, W * 0.28)), y: surface - Math.min(96, surface - ceil - 14) };
      rodSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      lineSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      rodSvg.querySelector('path').setAttribute('d', 'M' + hand.x.toFixed(1) + ' ' + hand.y.toFixed(1) + 'Q' + ((hand.x + tip.x) / 2).toFixed(1) + ' ' +
        (tip.y - 6).toFixed(1) + ' ' + tip.x.toFixed(1) + ' ' + tip.y.toFixed(1));
      for (const fish of fishes) { fish.y = lanes[Math.min(fish.lane, lanes.length - 1)].y; place(fish); }
    },
    reset(api) {
      for (const fish of fishes) fish.el.remove();
      fishes = [];
      hook = null;
      sinceTarget = 1;
      this.resize(api);
      drawLine(null);
    },
    play(api) { nextSpawn = api.clock + 0.2; for (let n = 0; n < 3; n++) api.after(n * 0.45, () => { if (api.playing) spawn(api); }); },
    target(api) { sinceTarget = 1; nextSpawn = Math.min(nextSpawn, api.clock + 0.4); },
    tick(api, dt) {
      for (const fish of fishes.slice()) {
        if (fish.state === 'swim' || fish.state === 'flee') {
          fish.x += fish.dir * fish.speed * dt;
          place(fish);
          if (fish.x < -size || fish.x > W + size) remove(fish);
        }
      }
      if (hook) {
        hook.t += dt;
        const { fish } = hook;
        if (hook.phase === 'down') {
          const k = Math.min(1, hook.t / 0.35), m = mouth(fish);
          drawLine({ x: tip.x + (m.x - tip.x) * k, y: tip.y + (m.y - tip.y) * k });
          if (k === 1) land(api);
        } else if (hook.phase === 'reel') {
          const k = Math.min(1, hook.t / 0.6), e = k * k * (3 - 2 * k);
          fish.x = hook.start.x + (tip.x - hook.start.x) * e;
          fish.y = hook.start.y + (tip.y + size * 0.4 - hook.start.y) * e;
          place(fish);
          drawLine(mouth(fish));
          if (k === 1) {
            const at = api.centre(fish.el.querySelector('.ol-sign'));
            remove(fish);
            hook = null;
            drawLine(null);
            api.right(at, fish.text);
          }
        }
      }
      if (api.clock >= nextSpawn) { spawn(api); nextSpawn = api.clock + spawnGap(api); }
    },
    halt() {
      hook = null;
      drawLine(null);
      for (const fish of fishes) if (fish.state === 'swim') { fish.state = 'flee'; fish.speed *= 2; }
    }
  });
})();
