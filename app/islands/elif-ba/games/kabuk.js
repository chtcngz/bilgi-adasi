// 🐚 Kabuk Hafızası: closed shells lie on the sand. Every item of the board is under two of them: one sings
// it (🔊, the turtle's voice when opened) and one shows it written. The child opens two shells at a time;
// the sound and the writing of the same item make a pearl. No hearts and no hurry: two boards, of four and
// of six pairs; the fewer shells opened in vain, the more stars.
(() => {
  const BOARDS = [4, 6];
  let board = null, cards = [], open = [], round = 0, lastSound = null, busy = false;
  const shellSvg = '<svg viewBox="0 0 100 90" aria-hidden="true"><path class="kb-lid" d="M50 6C24 6 6 30 8 58c1 14 8 22 16 26h52c8-4 15-12 16-26C94 30 76 6 50 6Z"/>' +
    '<g class="kb-ribs" fill="none" stroke-width="3" stroke-linecap="round"><path d="M50 10V80"/><path d="M34 13C24 34 24 60 30 80"/><path d="M66 13c10 21 10 47 4 67"/>' +
    '<path d="M20 26C12 44 12 64 18 78"/><path d="M80 26c8 18 8 38 2 52"/></g><path class="kb-hinge" d="M38 80h24l-4 8H42Z"/></svg>';
  // Items for a board: no two that sound or look the same. The first board has one of each of the cove's
  // letters; the second mixes in what is most easily mixed up with them, then the rest of what is learned.
  function choose(api, count, used) {
    const { kind, options } = api;
    const picked = [];
    const fits = i => !picked.some(p => p === i || kind.sound(p) === kind.sound(i) || kind.text(p) === kind.text(i));
    const add = i => { if (picked.length < count && fits(i)) picked.push(i); };
    const own = api.shuffled(options.recent);
    if (!used.length) {
      const letters = new Set();
      for (const i of own) if (!letters.has(kind.letter(i))) { letters.add(kind.letter(i)); add(i); }
    } else {
      for (const i of api.shuffled(used)) for (const j of api.shuffled(kind.alike(i).filter(j => options.letters.includes(j)))) { add(j); break; }
      for (const i of own) if (!used.includes(i)) add(i);
    }
    for (const i of [...own, ...api.shuffled(options.letters)]) add(i);
    return picked;
  }
  function deal(api) {
    const items = choose(api, BOARDS[round], round ? cards.map(c => c.item) : []);
    cards = api.shuffled(items.flatMap((item, key) => {
      const text = api.kind.text(item);
      return [{ key, item, text, sound: true }, { key, item, text, sound: false }];
    }));
    open = [];
    busy = false;
    board.style.setProperty('--cols', cards.length > 8 ? (board.clientWidth > 640 ? 6 : 4) : 4);
    board.replaceChildren(...cards.map((card, n) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'kb-shell t' + n % 5;
      button.style.setProperty('--n', n);
      button.innerHTML = '<span class="kb-back">' + shellSvg + '</span><span class="kb-face">' +
        (card.sound ? '<span class="kb-sound">' + elifArt.speaker + '</span>' : api.glyph(card.item, card.text)) + '</span>';
      button.setAttribute('aria-label', 'Kapalı kabuk ' + (n + 1));
      button.onclick = () => flip(card, api);
      card.el = button;
      return button;
    }));
  }
  function flip(card, api) {
    if (!api.playing) return;
    if (card.done) { api.kind.speak(card.item, api.unheard); return; }
    if (busy || open.includes(card)) return;
    open.push(card);
    card.el.classList.add('open');
    card.el.setAttribute('aria-label', card.sound ? 'Ses kabuğu' : api.kind.name(card.item));
    playCue('pop', { gain: 0.5 });
    if (card.sound) { lastSound = card.item; api.kind.speak(card.item, api.unheard); }
    if (open.length < 2) return;
    const [a, b] = open;
    busy = true;
    if (a.key === b.key) {
      api.after(0.6, () => {
        for (const c of open) { c.done = true; c.el.classList.add('pearl'); }
        open = [];
        busy = false;
        api.kind.speak(a.item, api.unheard);
        const written = a.sound ? b : a;
        api.piece(a.item, api.centre(written.el), written.text);
        if (cards.every(c => c.done)) {
          if (round === BOARDS.length - 1) api.after(1.2, () => api.finish());
          else api.after(1.4, () => { if (!api.playing) return; round++; api.setPrompt('🐚 Yeni kabuklar!', 2); playCue('start'); deal(api); });
        }
      });
    } else {
      api.after(1.5, () => {
        for (const c of open) { c.el.classList.remove('open'); c.el.setAttribute('aria-label', 'Kapalı kabuk'); }
        open = [];
        busy = false;
        api.miss();
      });
    }
  }

  elifArcade.register({
    id: 'kabuk', name: 'Kabuk Hafızası', icon: '🐚', title: 'Kabuk <em>Hafızası</em>', flow: 'free', hearts: false,
    turns: BOARDS.reduce((a, b) => a + b),
    first: '👆 İki kabuk aç',
    intro: () => 'Kumsalda kapalı kabuklar var. Bir kabuk heceyi söyler 🔊, öteki onu yazılı gösterir. İki kabuk aç: sesi ve yazısı ' +
      'aynı heceyse inci olurlar! Can yok, acele yok. Bütün kabuklar inci olunca yoluna devam edersin.',
    say: () => 'Kabuk Hafızası! İki kabuk aç. Biri heceyi söyler, öteki yazısını gösterir. Sesi ve yazısı aynıysa inci olurlar. Başlamak için yeşil düğmeye bas.',
    sample: () => [0, 1, 2].map(n => '<span class="kb-shell kb-sample t' + [0, 4, 1][n] + (n === 1 ? ' open' : '') + '"><span class="kb-back">' + shellSvg +
      '</span><span class="kb-face"><span class="kb-sound">' + elifArt.speaker + '</span></span></span>').join(''),
    stars: api => api.game.misses <= 8 ? 3 : api.game.misses <= 16 ? 2 : 1,
    resultText: stars => stars === 3 ? 'Bütün kabukları inci yaptın!' : 'Bütün kabukları inci yaptın! Üç yıldız için kabukları daha az boşuna açmayı dene.',
    build(api) {
      api.stage.innerHTML = '<div class="kb-beach" aria-hidden="true"><i class="kb-wave"></i></div><div class="kb-board"></div>';
      board = api.stage.querySelector('.kb-board');
    },
    reset(api) { round = 0; cards = []; open = []; busy = false; lastSound = null; board.replaceChildren(); },
    play(api) { api.setPrompt(this.first, 3); deal(api); },
    listen(api) { if (lastSound !== null) api.kind.speak(lastSound, api.unheard); else elifVoice.instruct('İki kabuk aç. Sesi ve yazısı aynı olanları bul.'); }
  });
})();
