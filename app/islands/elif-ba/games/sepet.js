// 🧺 Sepete Topla: a mussel comes up on the sand and the turtle says what is in it; the child carries it
// (or taps a basket) into the right basket. The baskets sort what the islet teaches: in a letter islet the
// mussel only sings (🔊) and goes into its letter's basket; syllables and joined shapes go into the üstün,
// esre or ötre basket; in a cezm islet the syllable with its cezm (بِسْ) and the same letters with a hareke
// (بِسَ) go into two baskets, in a tenvin islet the tenvin (بٍ) and the hareke alone (بِ), in a şedde islet the
// şedde syllable (بِسَّ) and the same letters without it (بِسَ). A wrong basket
// breaks a heart and the right one lights up. Sixteen mussels, three hearts.
(() => {
  const { names, harekeler, readings, cezm, syllable, tenvin, SEDDE, SUKUN } = elifData;
  const voice = elifVoice;
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  // A basket's label: Be, the letter the harekes were first met with, written the basket's way (بَ for üstün, بٌ بٍ بًا for
  // tenvinli), never a mark on its own.
  const label = (texts, small) => '<b lang="ar" dir="rtl" class="sp-mark' + (small ? ' small' : '') + '">' + texts.join(' ') + '</b>';
  const be = h => syllable(1, h);
  const basketSvg = '<svg viewBox="0 0 120 96" aria-hidden="true"><path class="sp-handle" d="M22 40C22 4 98 4 98 40" fill="none" stroke-width="7" stroke-linecap="round"/>' +
    '<path class="sp-body" d="M8 38H112L100 92H20Z"/><g class="sp-weave" fill="none" stroke-width="3"><path d="M12 52H108M15 66H105M18 80H102"/>' +
    '<path d="M30 40l4 50M50 40l2 50M70 40l-2 50M90 40l-4 50"/></g><rect class="sp-rim" x="4" y="32" width="112" height="12" rx="6"/></svg>';
  const musselSvg = '<svg viewBox="0 0 120 100" aria-hidden="true"><path class="sp-shell" d="M60 4C26 4 4 30 6 58c2 24 24 38 54 38s52-14 54-38C116 30 94 4 60 4Z"/>' +
    '<path class="sp-inside" d="M60 14C32 14 16 34 17 57c1 19 19 29 43 29s42-10 43-29C104 34 88 14 60 14Z"/></svg>';
  let shelf = null, row = null, baskets = [], mussel = null, busy = false;

  // The baskets of each kind: the label on their front, their name and what goes in them.
  function basketsFor(api) {
    const id = api.options.kind;
    if (id === 'harf') return api.options.recent.slice(0, 4).map(i => ({ html: api.glyph(i), name: names[i], test: k => k === i }));
    const harekeli = label([0, 1, 2].map(be), true);
    if (id === 'hece' || id === 'sekil') return [0, 1, 2].map(h => ({ html: label([be(h)]), name: harekeler[h].name, test: k => k % 3 === h }));
    if (id === 'cezm') return [{ html: label(['ب' + SUKUN]), name: 'Cezimli', test: k => k < 100 }, { html: harekeli, name: 'Cezimsiz', test: k => k >= 100 }];
    if (id === 'sedde') return [{ html: label([0, 1, 2].map(h => be(h) + SEDDE), true), name: 'Şeddeli', test: k => k < 84 }, { html: harekeli, name: 'Şeddesiz', test: k => k >= 84 }];
    return [{ html: label([0, 1, 2].map(h => tenvin(1, h)), true), name: 'Tenvinli', test: k => k < 84 }, { html: harekeli, name: 'Tenvinsiz', test: k => k >= 84 }];
  }
  // Carrying the mussel: it follows the finger and drops into the basket under it; a tap says it again.
  function grab(event, api) {
    if (!api.playing || busy || !mussel) return;
    event.preventDefault();
    const el = mussel.el;
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    el.setPointerCapture?.(event.pointerId);
    el.onpointermove = e => {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 10) return;
      moved = true;
      el.classList.add('dragging');
      el.style.translate = dx + 'px ' + dy + 'px';
      const under = basketAt(e.clientX, e.clientY);
      for (const b of baskets) b.el.classList.toggle('over', b === under);
    };
    el.onpointerup = el.onpointercancel = e => {
      el.onpointermove = el.onpointerup = el.onpointercancel = null;
      for (const b of baskets) b.el.classList.remove('over');
      if (!moved) { el.classList.remove('dragging'); api.narrate(); return; }
      const under = e.type === 'pointerup' ? basketAt(e.clientX, e.clientY) : null;
      if (under) drop(under, api); else home(true);
    };
  }
  function basketAt(x, y) {
    return baskets.find(b => {
      const r = b.el.getBoundingClientRect();
      return x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 20 && y <= r.bottom + 8;
    }) || null;
  }
  function home(animate) {
    if (!mussel) return;
    const el = mussel.el;
    el.classList.remove('dragging');
    el.classList.toggle('returning', animate);
    el.style.translate = '';
  }
  function drop(basket, api) {
    if (!api.playing || busy || !mussel) return;
    const item = api.game.target;
    if (basket.test(item)) {
      busy = true;
      const el = mussel.el, text = mussel.text;
      const from = el.getBoundingClientRect(), to = basket.el.getBoundingClientRect();
      const dx = (to.left + to.right) / 2 - (from.left + from.right) / 2, dy = (to.top + to.bottom) / 2 - (from.top + from.bottom) / 2;
      const was = el.style.translate || '0px 0px';
      el.classList.remove('dragging', 'returning');
      el.classList.add('going');
      el.style.translate = (parseFloat(was) + dx).toFixed(0) + 'px ' + (parseFloat(was.split(' ')[1] || 0) + dy).toFixed(0) + 'px';
      api.after(0.35, () => {
        el.remove();
        mussel = null;
        busy = false;
        fx.bump(basket.el, 'rain-bump');
        basket.el.classList.add('got');
        api.after(0.5, () => basket.el.classList.remove('got'));
        api.right(api.centre(basket.el), text);
      });
      return;
    }
    if (!api.wrong(basket.name + ' sepeti')) { home(true); return; }
    home(true);
    if (!api.calm.matches) basket.el.animate([{ transform: 'none' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], { duration: 420 });
    const rightOne = baskets.find(b => b.test(item));
    rightOne?.el.classList.add('hint');
    api.after(1.4, () => rightOne?.el.classList.remove('hint'));
  }

  elifArcade.register({
    id: 'sepet', name: 'Sepete Topla', icon: '🧺', title: 'Sepete <em>Topla</em>', flow: 'target', hearts: true, turns: 16,
    first: '👆 Midyeyi doğru sepete taşı',
    intro: kind => 'Kumsala midyeler geliyor. Kaplumbağa midyenin içindekini söyleyecek. Midyeyi tut ve doğru sepete taşı; istersen sepete dokun. ' +
      ({ harf: 'Her harfin kendi sepeti var.', hece: 'Üstün, esre ve ötrenin ayrı sepetleri var.', sekil: 'Üstün, esre ve ötrenin ayrı sepetleri var.',
        cezm: 'Cezimli heceler bir sepete, cezimsizler öteki sepete.', tenvin: 'Tenvinli heceler bir sepete, tenvinsizler öteki sepete.',
        sedde: 'Şeddeli heceler bir sepete, şeddesizler öteki sepete.' })[kind] +
      ' 16 midyeyi toplayınca yoluna devam edersin; hiç can kaybetmezsen üç yıldız!',
    say: kind => 'Sepete Topla! Kaplumbağa midyenin içindekini söyleyecek. Midyeyi doğru sepete taşı. ' +
      ({ harf: 'Her harfin kendi sepeti var.', hece: 'Üstün sepeti, esre sepeti, ötre sepeti.', sekil: 'Üstün sepeti, esre sepeti, ötre sepeti.',
        cezm: 'Cezimli sepet ve cezimsiz sepet.', tenvin: 'Tenvinli sepet ve tenvinsiz sepet.', sedde: 'Şeddeli sepet ve şeddesiz sepet.' })[kind] +
      ' Başlamak için yeşil düğmeye bas.',
    sample: api => basketsFor(api).slice(0, 3).map((b, n) => '<span class="sp-basket sp-sample t' + [0, 4, 1][n] + '">' + basketSvg +
      '<span class="sp-label">' + b.html + '</span></span>').join(''),
    // Cezimsiz twins of the cezm syllables: 100 + letter * 3 + hareke, the letter with that hareke in place of its cezm (بِسَ).
    extend(base, id) {
      if (id !== 'cezm') return base;
      const alt = k => ({ i: Math.floor((k - 100) / 3), x: (k - 100) % 3 });
      return { ...base,
        text: k => k < 100 ? base.text(k) : cezm(alt(k).i).text.slice(0, -1) + harekeler[alt(k).x].mark,
        name: k => { if (k < 100) return base.name(k); const { i, x } = alt(k), b = cezm(i).before; return names[b.i] + ' ' + hareke(b.h) + ', ' + (i ? names[i] : 'Hemze') + ' ' + hareke(x); },
        sound: k => { if (k < 100) return base.sound(k); const { i, x } = alt(k), b = cezm(i).before; return readings[b.i][b.h] + readings[i][x]; },
        letter: k => k < 100 ? k : alt(k).i,
        speak: (k, note, end) => {
          if (k < 100) return base.speak(k, note, end);
          const { i, x } = alt(k), b = cezm(i).before;
          voice.syllable(b.i, b.h, note, () => voice.syllable(i, x, note, end));
        } };
    },
    // Half the mussels of a cezm, tenvin or şedde islet lose their cezm (tenvin, şedde): بِسْ becomes بِسَ, بٍ becomes بِ, بِسَّ becomes بِسَ.
    plan(api) {
      const id = api.options.kind;
      const base = api.plan(api.options.letters.filter(k => !api.kind.decoy?.(k)), api.options.recent, 16);
      if (id !== 'cezm' && id !== 'tenvin' && id !== 'sedde') return base;
      const flip = new Set(api.shuffled(base.map((_, n) => n)).slice(0, base.length / 2));
      return base.map((k, n) => !flip.has(n) ? k : id === 'cezm' ? 100 + k * 3 + Math.floor(Math.random() * 3) : 84 + k);
    },
    build(api) {
      api.stage.innerHTML = '<div class="sp-beach" aria-hidden="true"><i class="sp-wave"></i></div><div class="sp-shelf"></div><div class="sp-baskets"></div>';
      shelf = api.stage.querySelector('.sp-shelf');
      row = api.stage.querySelector('.sp-baskets');
    },
    reset(api) {
      mussel?.el.remove();
      mussel = null;
      busy = false;
      baskets = basketsFor(api).map((b, n) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'sp-basket t' + [0, 4, 1, 3][n];
        el.innerHTML = basketSvg + '<span class="sp-label">' + b.html + '</span>';
        el.setAttribute('aria-label', b.name + ' sepeti');
        const basket = { ...b, el };
        el.onclick = () => drop(basket, api);
        return basket;
      });
      row.replaceChildren(...baskets.map(b => b.el));
      row.style.setProperty('--n', baskets.length);
    },
    target(api, item) {
      mussel?.el.remove();
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'sp-mussel';
      const sound = api.options.kind === 'harf';
      const text = api.kind.text(item);
      el.innerHTML = musselSvg + '<span class="sp-pearl">' + (sound ? '<span class="sp-sound">' + elifArt.speaker + '</span>' : api.glyph(item, text)) + '</span>';
      el.setAttribute('aria-label', sound ? 'Midye: dinle, sonra sepetine taşı' : api.kind.name(item));
      el.onpointerdown = event => grab(event, api);
      el.onclick = event => { if (!event.detail) api.narrate(); };
      shelf.replaceChildren(el);
      mussel = { el, text };
    },
    halt() { busy = false; }
  });
})();
