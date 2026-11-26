// İngilizce oyunları: the mini games of İngilizce Koyu (every grade), opened from quiz.js.
//   Oyun Parkı island:   dinle (Dinle ve Bul), sepet (Meyve Sepeti), boya (Sihirli Boyama), tren (Kelime Treni), hafiza (Sesli Hafıza)
//   Yanlış Avı island:   balon (Balon Patlat), with only the words the child got wrong
// quiz.js calls ingilizceOyunlari.baslat(id, c) with c = {
//   stage      the island's game window to draw in
//   kelimeler  [{ en, tr, emo }]: the island's English words that have a picture (one word per picture)
//   ayar       the island's oyunParki settings: sepet (food words), tren ([English sentence, Turkish] pairs)
//   say(text, yavas)   says English in the device's voice (yavas: the 🐢 slow voice)
//   sonuc(item, dogru) Balon Patlat only: the child answered a wrong question's word (item from c.yanlislar)
//   yanlislar  Balon Patlat only: [{ q, en, tr, emo }] the wrong answers' words
//   bitir(dogru, toplam, not)  the round is over: dogru answers right at the first try out of toplam
// }
// Nothing here needs reading English: every word is heard first, and pictures stand for the words.
const ingilizceOyunlari = (() => {
  const OYUNLAR = [
    { id: 'dinle', simge: '👂', ad: 'Dinle ve Bul', not: 'Duyduğun kelimenin resmine dokun.' },
    { id: 'sepet', simge: '🧺', ad: 'Meyve Sepeti', not: 'Söyleneni tutup sepete sürükle.' },
    { id: 'boya', simge: '🎨', ad: 'Sihirli Boyama', not: 'Resmi söylenen renge boya.' },
    { id: 'tren', simge: '🚂', ad: 'Kelime Treni', not: 'Kelimeleri doğru sırayla vagonlara diz.' },
    { id: 'hafiza', simge: '🃏', ad: 'Sesli Hafıza', not: 'Sesi resmiyle eşleştir.' }
  ];
  const BALON = { id: 'balon', simge: '🎈', ad: 'Balon Patlat', not: 'Duyduğun kelimenin balonunu patlat.' };

  /* ---------- helpers ---------- */
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = text => String(text).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const shuffled = items => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  };
  const later = (ms, fn) => setTimeout(fn, calm.matches ? Math.min(ms, 250) : ms);
  // A big 🔊 and a 🐢 (slow) button that say `text`.
  function voice(c, getText) {
    const row = el('div', 'og-voice');
    const loud = el('button', 'soru-say big', '🔊');
    loud.type = 'button';
    loud.setAttribute('aria-label', 'Dinle');
    loud.onclick = () => { c.say(getText()); fx.bump(loud, 'show'); };
    const slow = el('button', 'soru-say slow', '🐢');
    slow.type = 'button';
    slow.setAttribute('aria-label', 'Yavaş dinle');
    slow.onclick = () => { c.say(getText(), true); fx.bump(slow, 'show'); };
    row.append(loud, slow);
    return row;
  }
  // The frame every game shares: its name, a counter, what to do.
  function frame(c, game, task) {
    c.stage.innerHTML = '<div class="soru-top"><span class="soru-where">' + game.simge + ' ' + game.ad + '</span><span class="og-count"></span></div>' +
      '<h2 class="soru-prompt og-task" tabindex="-1">' + esc(task) + '</h2>';
    const body = el('div', 'og-body');
    c.stage.append(body);
    c.counter = c.stage.querySelector('.og-count');   // this round's own counter: a late timer of an old round cannot touch a new one
    c.stage.querySelector('.og-task').focus();
    return body;
  }
  const count = (c, text) => { c.counter.textContent = text; };
  // Picks n words with different pictures, starting with `first`.
  function pick(list, n, first) {
    const out = first ? [first] : [];
    for (const w of shuffled(list)) {
      if (out.length >= n) break;
      if (!out.some(o => o.en === w.en || o.emo === w.emo)) out.push(w);
    }
    return out;
  }
  // Dragging with a finger or a mouse; a tap without moving counts as a tap.
  function draggable(node, { drop, tap }) {
    node.addEventListener('pointerdown', e => {
      if (node.disabled) return;
      e.preventDefault();
      const x0 = e.clientX, y0 = e.clientY;
      let moved = false;
      node.setPointerCapture(e.pointerId);
      const move = ev => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!moved && Math.hypot(dx, dy) > 8) { moved = true; node.classList.add('og-dragging'); }
        if (moved) node.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.08)';
      };
      const up = ev => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        node.classList.remove('og-dragging');
        node.style.transform = '';
        if (!moved) return tap?.();
        node.style.visibility = 'hidden';
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        node.style.visibility = '';
        drop(under);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  /* ---------- 👂 Dinle ve Bul: hear a word, tap its picture (no writing at all) ---------- */
  function dinle(c, game) {
    const ROUNDS = 8;
    const body = frame(c, game, 'Dinle ve doğru resme dokun');
    let round = 0, right = 0, target = null;
    const talk = voice(c, () => target.en);
    const grid = el('div', 'og-pictures');
    body.append(talk, grid);
    function next() {
      if (round === ROUNDS) return c.bitir(right, ROUNDS);
      round++;
      count(c, round + ' / ' + ROUNDS);
      target = shuffled(c.kelimeler)[0];
      let first = true;
      grid.replaceChildren(...shuffled(pick(c.kelimeler, 4, target)).map(w => {
        const card = el('button', 'og-picture', '<span aria-hidden="true">' + w.emo + '</span>');
        card.type = 'button';
        card.setAttribute('aria-label', 'Resim');
        card.onclick = () => {
          if (w === target) {
            if (first) right++;
            card.classList.add('right');
            for (const other of grid.children) other.disabled = true;
            playCue('correct');
            fx.burst(card, { count: 10, spread: 70 });
            c.say(target.en);
            later(1100, next);
          } else {
            first = false;
            card.classList.add('wrong');
            card.disabled = true;
            playCue('retry');
            fx.bump(card, 'missed');
            later(400, () => c.say(target.en));
          }
        };
        return card;
      }));
      later(300, () => c.say(target.en));
    }
    next();
  }

  /* ---------- 🧺 Meyve Sepeti: "Put the apples in the basket." ---------- */
  function sepet(c, game) {
    const ROUNDS = 5;
    const foods = (c.ayar.sepet || []).map(en => c.kelimeler.find(w => w.en === en)).filter(Boolean);
    const body = frame(c, game, 'Söyleneni tutup sepete sürükle');
    const line = () => 'Put the ' + target.en + ' in the basket.';
    let round = 0, right = 0, target = null, first = true, picked = null;
    const talk = voice(c, line);
    const table = el('div', 'og-table');
    const basket = el('button', 'og-basket', '<span aria-hidden="true">🧺</span><small>Sepet</small>');
    basket.type = 'button';
    basket.onclick = () => { if (picked) put(picked); };
    body.append(talk, table, basket);
    const items = pick(foods, 7);
    table.replaceChildren(...items.map(w => {
      const item = el('button', 'og-food', '<span aria-hidden="true">' + w.emo + '</span>');
      item.type = 'button';
      item.setAttribute('aria-label', w.tr);
      item.word = w;
      draggable(item, {
        drop: under => { if (under?.closest('.og-basket')) put(item); },
        tap: () => {
          picked?.classList.remove('picked');
          picked = picked === item ? null : item;
          picked?.classList.add('picked');
          c.say(w.en);
        }
      });
      return item;
    }));
    const order = shuffled(items).slice(0, ROUNDS);
    function put(item) {
      picked?.classList.remove('picked');
      picked = null;
      if (item.word === target) {
        if (first) right++;
        item.disabled = true;
        item.classList.add('in');
        basket.classList.add('got');
        later(500, () => basket.classList.remove('got'));
        playCue('correct');
        fx.burst(basket, { symbols: [target.emo, '✦'], count: 10, spread: 70 });
        c.say('Yummy! ' + target.en);
        later(1300, next);
      } else {
        first = false;
        playCue('retry');
        fx.bump(item, 'missed');
        later(350, () => c.say(line()));
      }
    }
    function next() {
      if (round === order.length) return c.bitir(right, order.length);
      target = order[round++];
      first = true;
      count(c, round + ' / ' + order.length);
      later(250, () => c.say(line()));
    }
    next();
  }

  /* ---------- 🎨 Sihirli Boyama: "Colour the fish blue." ---------- */
  const RENKLER = [
    ['red', 'kırmızı', '#e5484d'], ['blue', 'mavi', '#3b82f6'], ['yellow', 'sarı', '#facc15'], ['green', 'yeşil', '#22a35a'],
    ['purple', 'mor', '#8b5cf6'], ['pink', 'pembe', '#f472b6'], ['brown', 'kahverengi', '#8b5a2b'], ['orange', 'turuncu', '#f97316'],
    ['black', 'siyah', '#262626'], ['white', 'beyaz', '#ffffff']
  ];
  // Simple outlines: the parts with class p are painted, the rest is drawn in ink.
  const RESIMLER = {
    fish: ['balık', '<path class="p" d="M30 60c18-26 58-30 84-6l22-18v52l-22-18c-26 24-66 20-84-10z"/><circle cx="58" cy="54" r="5" class="ink"/><path class="line" d="M80 42c6 8 6 18 0 26"/>'],
    cat: ['kedi', '<path class="p" d="M40 40l6-26 22 18h24l22-18 6 26c10 12 12 30 4 44-10 18-34 24-44 24s-34-6-44-24c-8-14-6-32 4-44z"/><circle cx="64" cy="62" r="5" class="ink"/><circle cx="96" cy="62" r="5" class="ink"/><path class="ink" d="M74 76h12l-6 7z"/><path class="line" d="M48 80h18M48 88l18-4M112 80H94M112 88l-18-4"/>'],
    apple: ['elma', '<path class="p" d="M80 40c-14-10-44-8-48 24-4 30 18 56 34 56 8 0 10-4 14-4s6 4 14 4c16 0 38-26 34-56-4-32-34-34-48-24z"/><path class="line" d="M80 40c0-10 4-18 10-24"/><path class="leaf" d="M86 26c10-12 26-12 30-6-8 10-20 12-30 6z"/>'],
    umbrella: ['şemsiye', '<path class="p" d="M20 70a60 52 0 0 1 120 0c-10-8-20-8-30 0-10-8-20-8-30 0-10-8-20-8-30 0-10-8-20-8-30 0z"/><path class="line" d="M80 70v42c0 10-14 10-14 0"/><path class="line" d="M80 18v-6"/>'],
    'T-shirt': ['tişört', '<path class="p" d="M58 18l-34 18 12 26 14-6v62h60V56l14 6 12-26-34-18c-4 10-12 16-22 16s-18-6-22-16z"/>'],
    house: ['ev', '<path class="p" d="M30 62L80 22l50 40z"/><path class="p" d="M40 62h80v58H40z"/><path class="door" d="M70 88h20v32H70z"/><path class="win" d="M48 74h14v14H48zM98 74h14v14H98z"/>'],
    hat: ['şapka', '<path class="p" d="M52 30h56v56H52z"/><path class="p" d="M26 86h108c0 10-10 14-20 14H46c-10 0-20-4-20-14z"/><path class="band" d="M52 72h56v10H52z"/>']
  };
  function boya(c, game) {
    const ROUNDS = 5;
    const body = frame(c, game, 'Resmi söylenen renge boya');
    const names = shuffled(Object.keys(RESIMLER));
    let round = 0, right = 0, thing = null, colour = null, first = true;
    const line = () => 'Colour the ' + thing + ' ' + colour[0] + '.';
    const talk = voice(c, line);
    const art = el('div', 'og-art');
    const pots = el('div', 'og-pots');
    body.append(talk, art, pots);
    function paint(fill) { art.querySelectorAll('.p').forEach(part => part.style.fill = fill); }
    function next() {
      if (round === ROUNDS) return c.bitir(right, ROUNDS);
      thing = names[round % names.length];
      round++;
      first = true;
      count(c, round + ' / ' + ROUNDS);
      colour = RENKLER[Math.floor(Math.random() * RENKLER.length)];
      art.innerHTML = '<svg viewBox="0 0 160 130" role="img" aria-label="' + RESIMLER[thing][0] + '">' + RESIMLER[thing][1] + '</svg>';
      const choices = shuffled([colour, ...shuffled(RENKLER.filter(r => r !== colour)).slice(0, 5)]);
      pots.replaceChildren(...choices.map(r => {
        const pot = el('button', 'og-pot');
        pot.type = 'button';
        pot.style.setProperty('--c', r[2]);
        pot.setAttribute('aria-label', r[1]);
        pot.onclick = () => {
          paint(r[2]);
          c.say(r[0]);
          if (r === colour) {
            if (first) right++;
            for (const other of pots.children) other.disabled = true;
            art.classList.add('done');
            playCue('correct');
            fx.burst(art, { symbols: ['✦', '★', '🖌️'], count: 14, spread: 90 });
            later(400, () => c.say('Well done! The ' + thing + ' is ' + colour[0] + '.'));
            later(2300, () => { art.classList.remove('done'); next(); });
          } else {
            first = false;
            pot.disabled = true;
            pot.classList.add('wrong');
            playCue('retry');
            later(700, () => { paint('#fff'); c.say(line()); });
          }
        };
        return pot;
      }));
      later(300, () => c.say(line()));
    }
    next();
  }

  /* ---------- 🚂 Kelime Treni: the words of a sentence, in order, into the wagons ---------- */
  function tren(c, game) {
    const sentences = shuffled(c.ayar.tren || []).slice(0, 4);
    const body = frame(c, game, 'Cümleyi dinle, kelimeleri sırayla vagonlara diz');
    let round = 0, right = 0, sentence = null, words = [], placed = 0, first = true;
    const talk = voice(c, () => sentence[0]);
    const meaning = el('p', 'og-meaning');
    const train = el('div', 'og-train');
    const chips = el('div', 'og-chips');
    body.append(talk, meaning, train, chips);
    function place(chip) {
      if (chip.disabled) return;
      if (chip.textContent === words[placed]) {
        const wagon = train.querySelectorAll('.og-wagon')[placed++];
        wagon.textContent = chip.textContent;
        wagon.classList.add('full');
        chip.disabled = true;
        chip.classList.add('used');
        playCue('tap');
        if (placed === words.length) {
          if (first) right++;
          train.classList.add('go');
          playCue('island');
          fx.burst(train, { symbols: ['💨', '✦'], count: 10, spread: 80 });
          c.say(sentence[0]);
          later(2600, next);
        }
      } else {
        first = false;
        playCue('retry');
        fx.bump(chip, 'missed');
      }
    }
    function next() {
      if (round === sentences.length) return c.bitir(right, sentences.length);
      sentence = sentences[round++];
      count(c, round + ' / ' + sentences.length);
      words = sentence[0].split(' ');
      placed = 0;
      first = true;
      meaning.textContent = '“' + sentence[1] + '”';
      train.className = 'og-train';
      train.replaceChildren(el('span', 'og-engine', '🚂'), ...words.map(() => el('span', 'og-wagon', '')));
      chips.replaceChildren(...shuffled(words.map((w, n) => ({ w, n }))).map(({ w }) => {
        const chip = el('button', 'og-chip', esc(w));
        chip.type = 'button';
        chip.lang = 'en';
        draggable(chip, { drop: under => { if (under?.closest('.og-train')) place(chip); }, tap: () => place(chip) });
        return chip;
      }));
      later(300, () => c.say(sentence[0]));
    }
    next();
  }

  /* ---------- 🃏 Sesli Hafıza: a sound card and its picture card ---------- */
  function hafiza(c, game) {
    const PAIRS = 6;
    const body = frame(c, game, 'Kartları aç: sesi resmiyle eşleştir');
    const words = pick(c.kelimeler, PAIRS);
    let open = [], found = 0, moves = 0, busy = false;
    const grid = el('div', 'og-memory');
    body.append(grid);
    const cards = shuffled(words.flatMap(w => [{ w, sound: true }, { w, sound: false }]));
    grid.replaceChildren(...cards.map(card => {
      const node = el('button', 'og-mem', '<span class="og-back" aria-hidden="true">❓</span><span class="og-face" aria-hidden="true">' + (card.sound ? '🔊' : card.w.emo) + '</span>');
      node.type = 'button';
      node.setAttribute('aria-label', card.sound ? 'Ses kartı' : 'Resim kartı');
      node.onclick = () => {
        if (busy || node.classList.contains('open')) return;
        node.classList.add('open');
        if (card.sound) c.say(card.w.en); else playCue('tap', { gain: 0.6 });
        open.push({ node, card });
        if (open.length < 2) return;
        moves++;
        const [a, b] = open;
        open = [];
        if (a.card.w === b.card.w && a.card.sound !== b.card.sound) {
          found++;
          for (const x of [a, b]) { x.node.classList.add('matched'); x.node.disabled = true; }
          playCue('correct');
          fx.burst(b.node, { count: 8, spread: 60 });
          later(450, () => c.say(a.card.w.en));
          count(c, found + ' / ' + PAIRS);
          if (found === PAIRS) later(1400, () => c.bitir(Math.max(0, PAIRS - Math.max(0, moves - PAIRS - 2)), PAIRS, moves + ' hamlede bitirdin.'));
        } else {
          busy = true;
          later(1100, () => { a.node.classList.remove('open'); b.node.classList.remove('open'); busy = false; });
        }
      };
      return node;
    }));
    count(c, '0 / ' + PAIRS);
  }

  /* ---------- 🎈 Balon Patlat (Yanlış Avı): pop the balloon of the word you hear ---------- */
  function balon(c, game) {
    const body = frame(c, game, 'Duyduğun kelimenin balonunu patlat');
    const items = shuffled(c.yanlislar);
    let round = 0, right = 0, target = null, first = true, over = false;
    const talk = voice(c, () => target.en);
    const sky = el('div', 'og-sky');
    body.append(talk, sky);
    const label = w => (w.emo ? '<span aria-hidden="true">' + w.emo + '</span>' : '') + '<small>' + esc(w.tr) + '</small>';
    const colours = ['#ff7a7a', '#ffb648', '#7cc4ff', '#9b8cff', '#64d39b', '#ff8fd0'];
    function next() {
      if (round === items.length) return c.bitir(right, items.length);
      target = items[round++];
      first = true;
      over = false;
      count(c, round + ' / ' + items.length);
      const others = shuffled([...c.yanlislar, ...c.kelimeler].filter(w => w.en !== target.en && w.tr !== target.tr));
      const set = [target];
      for (const w of others) { if (set.length === 4) break; if (!set.some(s => s.tr === w.tr)) set.push(w); }
      let mine = null;
      sky.replaceChildren(...shuffled(set).map((w, n) => {
        const b = el('button', 'og-balloon', label(w));
        if (w === target) mine = b;
        b.type = 'button';
        b.style.setProperty('--c', colours[(n + round) % colours.length]);
        b.style.setProperty('--x', (6 + n * 24) + '%');
        b.style.setProperty('--d', (n % 2 ? 0.6 : 0) + 's');
        b.setAttribute('aria-label', w.tr);
        b.onclick = () => {
          if (over) return;
          if (w === target) {
            over = true;
            b.classList.add('pop');
            playCue('pop');
            fx.burst(b, { count: 14, spread: 80 });
            if (first) right++;
            c.sonuc(target, first);
            c.say(target.en);
            later(1200, next);
          } else {
            first = false;
            b.classList.add('pop', 'wrong');
            playCue('oops');
            later(300, () => c.say(target.en));
          }
        };
        return b;
      }));
      // the right balloon flew away: it counts as a miss and the next word comes
      mine.addEventListener('animationend', () => {
        if (over) return;
        over = true;
        playCue('retry');
        c.sonuc(target, false);
        later(300, next);
      }, { once: true });
      later(300, () => c.say(target.en));
    }
    next();
  }

  // Pictures that do not show a thing (gestures, faces, symbols): a child cannot tell their word from the picture alone,
  // so the picture games leave them out (Balon Patlat writes the meaning under every balloon and keeps them).
  const SOYUT = new Set(['🙏', '🙋', '🙌', '👋', '👍', '👌', '🤝', '❓', '📍', '➕', '❗', '🔶', '🏷️', '📝', '🆘', '⏳', '⏰', '🔔', '📆', '🗓️',
    '🌞', '🎨', '✅', '🔁', '🗣️', '👄', '🫴', '🤲', '👉', '👆', '👀', '🚶', '🚦', '🏁', '🧍', '🤫', '💖', '🌟', '🥰', '😊', '🙂', '😀', '😄', '😋',
    '🤤', '😔', '🤪', '💦', '🥶', '🥵', '🧓', '🐭', '🐘', '📏', '🤏', '🎉', '📌', '🧩', '👫', '📺', '✍️', '📖', '🎧', '🤗', '🌑', '🎤', '🦘',
    '👏', '🔍', '💃', '📥', '🥄', '🖼️', '👨‍👩‍👧‍👦', '🧑‍🤝‍🧑', '🤵', '🌸', '👱‍♂️', '👱‍♀️', '🖍️', '🧑‍🏫', '🧑‍🎓', '🏛️']);
  const games = { dinle, sepet, boya, tren, hafiza, balon };
  function baslat(id, c) {
    const game = id === 'balon' ? BALON : OYUNLAR.find(g => g.id === id);
    if (id !== 'balon') c.kelimeler = c.kelimeler.filter(w => !SOYUT.has(w.emo));
    games[id](c, game);
  }
  return { OYUNLAR, BALON, baslat };
})();
