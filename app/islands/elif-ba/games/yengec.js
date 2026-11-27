// 🦀 Yengeç Avı: crabs come up out of holes in the sand, each holding up a sign with a letter (syllable) on
// it, and go back down after a while. The turtle says one; the child taps the crab that has it, and it jumps
// into the bucket. A wrong crab pinches: a heart breaks. Sixteen turns of the cove's items, three hearts.
(() => {
  const HOLES = 6;
  const MAX_UP = 3;
  const crabSvg = '<svg class="yg-body" viewBox="0 0 120 64" aria-hidden="true">' +
    '<g stroke="#b8361f" stroke-width="5" stroke-linecap="round" fill="none"><path d="M30 44 12 52M28 36 8 38M34 50 22 62"/><path d="M90 44l18 8M92 36l20 2M86 50l12 12"/></g>' +
    '<g class="yg-arm l"><path d="M34 30C22 24 16 14 18 2" stroke="#e8553a" stroke-width="7" fill="none" stroke-linecap="round"/></g>' +
    '<g class="yg-arm r"><path d="M86 30C98 24 104 14 102 2" stroke="#e8553a" stroke-width="7" fill="none" stroke-linecap="round"/></g>' +
    '<ellipse cx="60" cy="40" rx="36" ry="22" fill="#ff6b4a" stroke="#b8361f" stroke-width="3"/>' +
    '<ellipse cx="50" cy="31" rx="14" ry="6" fill="#ff9a7d" opacity=".7"/>' +
    '<path d="M50 22V10M70 22V10" stroke="#b8361f" stroke-width="4" stroke-linecap="round"/>' +
    '<g class="yg-eyes"><circle cx="50" cy="9" r="7" fill="#fff" stroke="#b8361f" stroke-width="2"/><circle cx="51" cy="10" r="3.4" fill="#2b2b2b"/>' +
    '<circle cx="70" cy="9" r="7" fill="#fff" stroke="#b8361f" stroke-width="2"/><circle cx="71" cy="10" r="3.4" fill="#2b2b2b"/></g>' +
    '<path class="yg-smile" d="M52 46q8 7 16 0" stroke="#7c2d12" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<circle cx="40" cy="44" r="4" fill="#ffc2b0" opacity=".8"/><circle cx="80" cy="44" r="4" fill="#ffc2b0" opacity=".8"/></svg>';
  const bucketSvg = '<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M20 22Q50-14 80 22" fill="none" stroke="#7a4a1d" stroke-width="5"/>' +
    '<path d="M12 24H88L80 84H20Z" fill="#3fa7d6" stroke="#1d6f94" stroke-width="4" stroke-linejoin="round"/><path d="M14 36H86" stroke="#fff" stroke-width="5" opacity=".6"/>' +
    '<ellipse cx="50" cy="24" rx="38" ry="7" fill="#1d6f94"/></svg>';
  let holes = [], grid = null, nextSpawn = 0, lastHole = -1, sinceTarget = 0;
  const progress = api => api.game.done / api.game.plan.length;
  const upTime = api => 3.8 - 1.1 * progress(api);
  const spawnGap = api => 0.95 - 0.3 * progress(api);

  function hide(hole, api) {
    if (hole.state !== 'up') return;
    hole.state = 'leaving';
    hole.crab.classList.remove('up', 'pinch');
    api.after(0.3, () => { hole.state = 'down'; hole.crab.classList.remove('wrong', 'caught'); hole.tag.textContent = ''; });
  }
  function show(hole, item, api) {
    hole.item = item;
    hole.text = api.kind.text(item);
    hole.sign.innerHTML = api.glyph(item, hole.text);
    hole.crab.setAttribute('aria-label', api.kind.name(item));
    hole.crab.className = 'yg-crab t' + Math.floor(Math.random() * 5);
    void hole.crab.offsetWidth;
    hole.crab.classList.add('up');
    hole.state = 'up';
    hole.downAt = api.clock + upTime(api);
    playCue('key', { gain: 0.25, rate: 1.4 });
  }
  function spawn(api) {
    const up = holes.filter(h => h.state === 'up');
    if (up.length >= MAX_UP) return;
    const free = holes.filter((h, n) => h.state === 'down' && n !== lastHole);
    if (!free.length) return;
    const hole = api.pick(free);
    lastHole = holes.indexOf(hole);
    const target = api.game.target;
    const targetUp = up.some(h => h.item === target);
    const want = !targetUp && (sinceTarget >= 1 || Math.random() < 0.5);
    sinceTarget = want ? 0 : sinceTarget + 1;
    show(hole, want ? target : api.distractor(target, up.map(h => h.item)), api);
  }
  function tap(hole, api) {
    if (!api.playing || hole.state !== 'up') return;
    if (hole.item === api.game.target) {
      hole.state = 'caught';
      hole.crab.classList.add('caught');
      api.right(api.centre(hole.sign), hole.text);
      api.after(0.55, () => { hole.crab.classList.remove('up'); hole.state = 'leaving'; api.after(0.3, () => { hole.state = 'down'; hole.crab.classList.remove('caught'); }); });
      return;
    }
    if (!api.wrong(api.kind.name(hole.item))) {
      if (!api.calm.matches) hole.crab.animate([{ transform: 'none' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], { duration: 320 });
      return;
    }
    hole.crab.classList.add('pinch', 'wrong');
    hole.tag.textContent = api.kind.name(hole.item);
    hole.downAt = api.clock + 0.9;
  }

  elifArcade.register({
    id: 'yengec', name: 'Yengeç Avı', icon: '🦀', title: 'Yengeç <em>Avı</em>', flow: 'target', hearts: true, turns: 16,
    first: '👆 Duyduğunu tutan yengece dokun',
    intro: () => 'Kumdaki deliklerden yengeçler çıkıyor; her biri bir tabela tutuyor. Kaplumbağa bir hece söyleyecek: o heceyi tutan yengece ' +
      'dokun, yengeç kovaya zıplasın! Yanlış yengeç seni çimdikler. 16 yengeci yakalayınca yoluna devam edersin; hiç can kaybetmezsen üç yıldız!',
    say: () => 'Yengeç Avı! Yengeçler kumdan çıkıyor. Kaplumbağa bir hece söyleyecek. O heceyi tutan yengece dokun. Başlamak için yeşil düğmeye bas.',
    sample: api => api.shuffled(api.options.recent).slice(0, 3).map((item, n) => '<span class="yg-sample t' + [0, 4, 1][n] + '"><span class="yg-sign">' +
      api.glyph(item) + '</span>' + crabSvg + '</span>').join(''),
    build(api) {
      api.stage.innerHTML = '<div class="yg-sea" aria-hidden="true"></div><div class="yg-sand" aria-hidden="true"></div><div class="yg-holes"></div>' +
        '<div class="yg-bucket" aria-hidden="true">' + bucketSvg + '</div>';
      grid = api.stage.querySelector('.yg-holes');
      holes = Array.from({ length: HOLES }, () => {
        const box = document.createElement('div');
        box.className = 'yg-hole';
        box.innerHTML = '<i class="yg-pit"></i><div class="yg-mask"><button type="button" class="yg-crab"><span class="yg-sign"></span>' + crabSvg +
          '<em class="yg-tag"></em></button></div><i class="yg-rim"></i>';
        grid.append(box);
        const hole = { box, crab: box.querySelector('.yg-crab'), sign: box.querySelector('.yg-sign'), tag: box.querySelector('.yg-tag'), state: 'down', item: null };
        hole.crab.onpointerdown = event => { event.preventDefault(); tap(hole, api); };
        hole.crab.onclick = event => { if (!event.detail) tap(hole, api); }; // the keyboard
        return hole;
      });
    },
    resize(api) {
      const wide = grid.clientWidth > 600;
      grid.style.setProperty('--cols', wide ? 3 : 2);
      const rows = wide ? 2 : 3, cols = wide ? 3 : 2;
      const w = grid.clientWidth / cols, h = grid.clientHeight / rows;
      grid.style.setProperty('--crab', Math.round(Math.max(70, Math.min(w * 0.82, h * 0.72, 170))) + 'px');
    },
    reset(api) {
      for (const hole of holes) { hole.state = 'down'; hole.crab.className = 'yg-crab'; hole.tag.textContent = ''; }
      sinceTarget = 1;
      lastHole = -1;
      this.resize(api);
    },
    play(api) { nextSpawn = api.clock + 0.4; },
    target(api) { sinceTarget = 1; nextSpawn = Math.min(nextSpawn, api.clock + 0.35); },
    tick(api) {
      for (const hole of holes) if (hole.state === 'up' && api.clock >= hole.downAt) hide(hole, api);
      if (api.clock >= nextSpawn) { spawn(api); nextSpawn = api.clock + spawnGap(api); }
    },
    halt(api) { for (const hole of holes) { hole.state = 'down'; hole.crab.classList.remove('up', 'pinch'); } }
  });
})();
