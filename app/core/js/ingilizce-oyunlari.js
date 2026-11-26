// İngilizce oyunları: İngilizce Koyu (every grade) is played as games, not as a quiz.
//
// ingilizceSes: the English voice. Every English word and sentence of the island was recorded once with a natural
//   voice (Kokoro, tools/ingilizce_sesler.py → app/assets/audio/ingilizce/, listed in window.ingilizceKayitlar);
//   a text that has no recording is read by the device's own English voice. say() returns a promise that ends when
//   the line has been heard, so nothing is cut off and the game waits for it.
//
// ingilizceOyunlari.tur(c): a station's round. The station's questions are cut into short games, each one asking
//   its own questions in its own way, and every question is answered exactly once (c.sonuc):
//     a word with a picture   👂 Dinle ve Bul (hear it, tap its picture), 🎈 Balon Patlat (pop its balloon),
//                             🃏 Sesli Hafıza (a sound card and its picture card)
//     a colour                🎨 Sihirli Boyama ("Colour the fish blue.")
//     a food                  🧺 Meyve Sepeti ("Put the apples in the basket." – drag it into the basket)
//     a sentence              🚂 Kelime Treni (its words, in order, into the wagons; the train then leaves)
//     anything else           🃏 Bilgi Kartı (the question itself, with a second try)
//   c = { stage, items: [{ q, en, tr, emo }], havuz: [{ en, tr, emo }] (other pictured words, for wrong choices),
//         ayar: { sepet: [food words] }, maskot (the player's icon), sonuc(item, dogru), bitir(), rich(text) }
// ingilizceOyunlari.balon(c): Yanlış Avı's Balon Patlat, with only the words the child got wrong.
// ingilizceOyunlari.metinler(ayar, kelimeler): every English line the games say, for the recording tool.
const ingilizceSes = (() => {
  const BASE = 'assets/audio/ingilizce/';
  const buffers = new Map();
  let current = null, run = 0;
  const context = () => (typeof playCue === 'function' && playCue.context?.()) || null;
  const clip = (text, slow) => {
    const id = window.ingilizceKayitlar?.[text];
    return id ? BASE + id + (slow ? '-y' : '') + '.mp3?v=' + (window.ingilizceKayitlarSurum || 1) : null;
  };
  function decode(src) {
    const audio = context();
    if (!audio) return Promise.resolve(null);
    if (!buffers.has(src)) {
      buffers.set(src, fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))
        .then(data => new Promise((resolve, reject) => audio.decodeAudioData(data, resolve, reject)))
        .catch(() => { buffers.delete(src); return null; }));
    }
    return buffers.get(src);
  }
  // Fetches the next lines ahead, so they play at once.
  const hazirla = texts => { for (const t of texts) { const src = clip(t); if (src) decode(src); } };
  function stop() {
    run++;
    if (current) { try { current.onended = null; current.stop(); } catch {} current = null; }
    window.speechSynthesis?.cancel();
  }
  // The device's own voice, the best English one it has (the "natural", "neural" and "enhanced" voices first).
  function deviceVoice() {
    const voices = window.speechSynthesis?.getVoices() || [];
    const en = voices.filter(v => /^en[-_]/i.test(v.lang));
    const score = v => (/natural|neural|enhanced|premium|siri/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/en[-_](gb|us)/i.test(v.lang) ? 1 : 0);
    return en.sort((a, b) => score(b) - score(a))[0] || null;
  }
  function speakDevice(text, slow, mine) {
    return new Promise(resolve => {
      if (!window.speechSynthesis) return resolve(false);
      const line = new SpeechSynthesisUtterance(text);
      line.lang = 'en-GB';
      const voice = deviceVoice();
      if (voice) line.voice = voice;
      line.rate = slow ? 0.55 : 0.85;
      let over = false;
      const end = () => { if (!over) { over = true; clearTimeout(guard); resolve(mine === run); } };
      const guard = setTimeout(end, 1500 + text.length * 110);   // some phones never report the end
      line.onend = end;
      line.onerror = end;
      speechSynthesis.speak(line);
    });
  }
  async function say(text, slow = false) {
    if (!text) return false;
    stop();
    const mine = run;
    const src = clip(text, slow);
    const buffer = src ? await decode(src) : null;
    if (mine !== run) return false;
    const audio = context();
    if (!buffer || !audio) return speakDevice(text, slow, mine);
    if (audio.state === 'suspended') { try { await audio.resume(); } catch {} }
    return new Promise(resolve => {
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const gain = audio.createGain();
      gain.gain.value = 1.0;
      source.connect(gain).connect(audio.destination);
      current = source;
      let over = false;
      // some devices never report the end: the game goes on when the clip's time is up all the same
      const end = () => { if (over) return; over = true; clearTimeout(guard); if (current === source) current = null; resolve(mine === run); };
      const guard = setTimeout(end, buffer.duration * 1000 / (source.playbackRate.value || 1) + 600);
      source.onended = end;
      source.start();
    });
  }
  // Several lines one after another ("Well done!" then the word).
  async function says(...texts) {
    for (const t of texts) { if (t && (await say(t)) === false && !window.ingilizceKayitlar) break; }
  }
  const kayitli = text => !!window.ingilizceKayitlar?.[text];
  return { say, says, stop, hazirla, kayitli };
})();

const ingilizceOyunlari = (() => {
  /* ---------- the lines the games say (each one recorded) ---------- */
  const OVGU = ['Well done!', 'Great job!', 'Super!', 'Excellent!', 'Yes! That’s right!', 'Brilliant!', 'Fantastic!'];
  const TEKRAR = ['Try again!', 'Oops! Try again.', 'Listen again.'];
  const GIRIS = {
    dinle: 'Listen and find the picture.', balon: 'Listen and pop the balloon!', hafiza: 'Find the pairs!',
    boya: 'Let’s colour!', sepet: 'Let’s fill the basket!', tren: 'All aboard the word train!', kart: 'Let’s play!'
  };
  const YUMMY = 'Yummy!';
  const BITTI = 'Great work! You finished the round!';
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
  const boyaCumle = (thing, colour) => 'Colour the ' + thing + ' ' + colour + '.';
  const sepetCumle = food => 'Put the ' + food + ' in the basket.';
  // Pictures that do not show a thing (gestures, faces, symbols): a child cannot tell their word from the picture alone.
  const SOYUT = new Set(['🙏', '🙋', '🙌', '👋', '👍', '👌', '🤝', '❓', '📍', '➕', '❗', '🔶', '🏷️', '📝', '🆘', '⏳', '⏰', '🔔', '📆', '🗓️',
    '🌞', '🎨', '✅', '🔁', '🗣️', '👄', '🫴', '🤲', '👉', '👆', '👀', '🚶', '🚦', '🏁', '🧍', '🤫', '💖', '🌟', '🥰', '😊', '🙂', '😀', '😄', '😋',
    '🤤', '😔', '🤪', '💦', '🥶', '🥵', '🧓', '🐭', '🐘', '📏', '🤏', '🎉', '📌', '🧩', '👫', '📺', '✍️', '📖', '🎧', '🤗', '🌑', '🎤', '🦘',
    '👏', '🔍', '💃', '📥', '🥄', '🖼️', '👨‍👩‍👧‍👦', '🧑‍🤝‍🧑', '🤵', '🌸', '👱‍♂️', '👱‍♀️', '🖍️', '🧑‍🏫', '🧑‍🎓', '🏛️', '📅']);
  const resimli = w => !!w.emo && !SOYUT.has(w.emo) && !/[.!?]/.test(w.en) && w.en.split(' ').length <= 3;
  const renk = w => RENKLER.find(r => r[0] === w.en.toLowerCase());

  /* ---------- helpers ---------- */
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const any = list => list[Math.floor(Math.random() * list.length)];
  const button = (className, html, label) => { const b = el('button', className, html); b.type = 'button'; if (label) b.setAttribute('aria-label', label); return b; };
  // Words for the wrong choices: other pictures, never one with the same picture or meaning.
  function choices(c, target, n, test = resimli) {
    const out = [target];
    for (const w of shuffled([...c.items.map(i => i), ...c.havuz])) {
      if (out.length >= n) break;
      if (!test(w) || out.some(o => o.en === w.en || o.emo === w.emo || o.tr === w.tr)) continue;
      out.push(w);
    }
    return shuffled(out);
  }
  // Dragging with a finger or a mouse; a tap without moving counts as a tap.
  function draggable(node, { drop, tap }) {
    node.addEventListener('pointerdown', e => {
      if (node.disabled) return;
      e.preventDefault();
      const x0 = e.clientX, y0 = e.clientY;
      let moved = false;
      try { node.setPointerCapture(e.pointerId); } catch {}
      const move = ev => {
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!moved && Math.hypot(dx, dy) > 8) { moved = true; node.classList.add('og-dragging'); }
        if (moved) node.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.12)';
      };
      const up = ev => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        node.classList.remove('og-dragging');
        if (!moved) { node.style.transform = ''; return tap?.(); }
        node.style.visibility = 'hidden';
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        node.style.visibility = '';
        node.style.transform = '';
        drop(under);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  /* ---------- the round: a frame, the mascot, stars, and the games one after another ---------- */
  function tur(c) {
    const live = { on: true };
    const wait = ms => new Promise(resolve => setTimeout(resolve, calm() ? Math.min(ms, 300) : ms));
    const say = async (text, slow) => { if (live.on) await ingilizceSes.say(text, slow); };
    const total = c.items.length;
    let done = 0, right = 0;
    c.stage.innerHTML = '<div class="og-head"><span class="og-mascot" aria-hidden="true"><b>' + esc(c.maskot || '🦊') + '</b><i class="og-bubble"></i></span>' +
      '<span class="og-where"></span><span class="og-stars" aria-live="polite"></span></div><div class="og-game"></div>';
    const where = c.stage.querySelector('.og-where'), game = c.stage.querySelector('.og-game'), stars = c.stage.querySelector('.og-stars');
    const mascot = c.stage.querySelector('.og-mascot'), bubble = c.stage.querySelector('.og-bubble');
    const paintStars = () => {
      stars.innerHTML = Array.from({ length: total }, (_, i) => '<i class="' + (i < right ? 'won' : i < done ? 'miss' : '') + '">★</i>').join('');
      stars.setAttribute('aria-label', done + ' / ' + total + ' soru, ' + right + ' ilk denemede');
    };
    paintStars();
    // the player's own icon cheers or wobbles, with a word in its bubble
    function react(good, word) {
      mascot.classList.remove('happy', 'sad');
      void mascot.offsetWidth;
      mascot.classList.add(good ? 'happy' : 'sad');
      bubble.textContent = word;
    }
    // A question is answered once: right at the first try, or not.
    const answered = new Set();
    function sonuc(item, ok) {
      if (answered.has(item)) return;
      answered.add(item);
      done++;
      if (ok) right++;
      c.sonuc(item, ok);
      paintStars();
      if (ok) fx.bump(stars.children[right - 1], 'fresh');
    }
    const ctx = { c, say, wait, sonuc, react, live, game, where,
      praise: async word => { const p = any(OVGU); react(true, p); playCue('correct'); await say(p); if (word) await say(word); },
      oops: async again => { const t = any(TEKRAR); react(false, '🤔'); playCue('retry'); await say(t); if (again) await say(again); } };

    // Cut the station's questions into games.
    const pictured = c.items.filter(i => resimli(i));
    const foods = pictured.filter(i => (c.ayar.sepet || []).includes(i.en));
    const colours = pictured.filter(i => renk(i));
    const words = pictured.filter(i => !foods.includes(i) && !colours.includes(i));
    const sentence = i => !resimli(i) && i.en.split(' ').length >= 3 && i.en.split(' ').length <= 7 && /^[A-Za-z’',.!? -]+$/.test(i.en) &&
      (i.word || i.q.a.some(a => a.replace(/[^a-z]/gi, '').toLowerCase() === i.en.replace(/[^a-z]/gi, '').toLowerCase()));
    const trains = c.items.filter(i => !pictured.includes(i) && sentence(i));
    const cards = c.items.filter(i => !pictured.includes(i) && !trains.includes(i));
    const plan = [];
    const kinds = shuffled(['dinle', 'balon', 'hafiza']);
    let k = 0;
    for (let i = 0; i < words.length;) {
      const left = words.length - i;
      let kind = kinds[k++ % kinds.length];
      if (kind === 'hafiza' && left < 3) kind = 'dinle';
      const size = kind === 'hafiza' ? Math.min(4, left) : Math.min(left, 3);
      plan.push([kind, words.slice(i, i + size)]);
      i += size;
    }
    if (foods.length) plan.push(['sepet', foods]);
    if (colours.length) plan.push(['boya', colours]);
    if (trains.length) plan.push(['tren', trains]);
    for (let i = 0; i < cards.length; i += 3) plan.push(['kart', cards.slice(i, i + 3)]);
    const order = shuffled(plan);
    ingilizceSes.hazirla([...Object.values(GIRIS), ...OVGU, ...TEKRAR, ...c.items.map(i => i.en)]);

    (async () => {
      for (const [kind, items] of order) {
        if (!live.on) return;
        const info = OYUNLAR[kind];
        where.innerHTML = '<span aria-hidden="true">' + info.simge + '</span> ' + info.ad;
        // a short title card, so every game starts clearly
        game.innerHTML = '<div class="og-intro"><span aria-hidden="true">' + info.simge + '</span><strong>' + info.ad + '</strong><small>' + info.not + '</small></div>';
        playCue('pop', { gain: 0.6 });
        await say(GIRIS[kind]);
        await wait(500);
        if (!live.on) return;
        await info.oyna(ctx, items);
        for (const item of items) sonuc(item, false);   // anything a game left unanswered counts as missed
        await wait(400);
      }
      if (!live.on) return;
      react(true, '🎉');
      await say(BITTI);
      if (live.on) c.bitir(right, total);
    })();
    return () => { live.on = false; ingilizceSes.stop(); };
  }

  /* ---------- 👂 Dinle ve Bul ---------- */
  async function dinle(x, items) {
    for (const item of items) {
      if (!x.live.on) return;
      x.game.innerHTML = '';
      const talk = voiceRow(x, item.en);
      const grid = el('div', 'og-pictures');
      x.game.append(talk, grid);
      let first = true;
      await new Promise(resolve => {
        grid.append(...choices(x.c, item, 4).map(w => {
          const card = button('og-picture', '<span aria-hidden="true">' + w.emo + '</span>', 'Resim');
          card.onclick = async () => {
            if (w === item) {
              for (const other of grid.children) other.disabled = true;
              card.classList.add('right');
              fx.burst(card, { count: 14, spread: 80 });
              x.sonuc(item, first);
              await x.praise(item.en);
              await x.wait(700);
              resolve();
            } else {
              first = false;
              card.classList.add('wrong');
              card.disabled = true;
              fx.bump(card, 'missed');
              await x.oops(item.en);
            }
          };
          return card;
        }));
        x.wait(300).then(() => x.say(item.en));
      });
    }
  }
  // 🔊 and 🐢 (slow) for a word
  function voiceRow(x, text, big = true) {
    const row = el('div', 'og-voice');
    const loud = button('soru-say' + (big ? ' big' : ''), '🔊', 'Dinle');
    loud.onclick = () => { x.say(text); fx.bump(loud, 'show'); };
    const slow = button('soru-say slow', '🐢', 'Yavaş dinle');
    slow.onclick = () => { x.say(text, true); fx.bump(slow, 'show'); };
    row.append(loud, slow);
    return row;
  }

  /* ---------- 🎈 Balon Patlat (also Yanlış Avı's, with the meaning written under the picture) ---------- */
  async function balonlar(x, items, { yazili = false } = {}) {
    const colours = ['#ff7a7a', '#ffb648', '#7cc4ff', '#9b8cff', '#64d39b', '#ff8fd0'];
    for (const [n, item] of items.entries()) {
      if (!x.live.on) return;
      x.game.innerHTML = '';
      const talk = voiceRow(x, item.en);
      const sky = el('div', 'og-sky');
      x.game.append(talk, sky);
      let first = true;
      await new Promise(resolve => {
        let over = false;
        const set = yazili ? balloonSet(x, item) : choices(x.c, item, 4);
        const make = (w, i) => {
          const b = button('og-balloon', (w.emo ? '<span aria-hidden="true">' + w.emo + '</span>' : '') + (yazili ? '<small>' + esc(w.tr) + '</small>' : ''), yazili ? w.tr : 'Balon');
          b.style.setProperty('--c', colours[(i + n) % colours.length]);
          b.style.setProperty('--x', (5 + i * 24) + '%');
          b.style.setProperty('--d', (i % 2 ? -4.5 : 0) - i * 1.1 + 's');   // they start at different heights and keep rising round
          b.onclick = async () => {
            if (over) return;
            if (w === item) {
              over = true;
              b.classList.add('pop');
              playCue('pop');
              fx.burst(b, { count: 16, spread: 90 });
              x.sonuc(item, first);
              for (const other of sky.children) other.classList.add('away');
              await x.praise(item.en);
              await x.wait(600);
              resolve();
            } else {
              first = false;
              b.classList.add('pop', 'wrong');
              playCue('oops');
              await x.oops(item.en);
            }
          };
          return b;
        };
        sky.append(...set.map(make));
        x.wait(300).then(() => x.say(item.en));
      });
    }
  }
  function balloonSet(x, item) {
    const out = [item];
    for (const w of shuffled([...x.c.items, ...x.c.havuz])) {
      if (out.length === 4) break;
      if (out.some(o => o.en === w.en || o.tr === w.tr)) continue;
      out.push(w);
    }
    return shuffled(out);
  }

  /* ---------- 🃏 Sesli Hafıza: a sound card and its picture card ---------- */
  async function hafiza(x, items) {
    x.game.innerHTML = '';
    const grid = el('div', 'og-memory' + (items.length > 3 ? '' : ' small'));
    x.game.append(grid);
    let open = [], found = 0, busy = false;
    await new Promise(resolve => {
      grid.append(...shuffled(items.flatMap(item => [{ item, sound: true }, { item, sound: false }])).map(card => {
        const node = button('og-mem', '<span class="og-back" aria-hidden="true">❓</span><span class="og-face" aria-hidden="true">' + (card.sound ? '🔊' : card.item.emo) + '</span>',
          card.sound ? 'Ses kartı' : 'Resim kartı');
        node.onclick = async () => {
          if (busy || node.classList.contains('open')) return;
          node.classList.add('open');
          playCue('tap', { gain: 0.5 });
          if (card.sound) x.say(card.item.en);
          open.push({ node, card });
          if (open.length < 2) return;
          const [a, b] = open;
          open = [];
          busy = true;
          if (a.card.item === b.card.item) {
            for (const n of [a.node, b.node]) { n.classList.add('matched'); n.disabled = true; }
            fx.burst(b.node, { count: 10, spread: 60 });
            // matching a word to its picture is knowing it; a miss in a memory game is only memory
            x.sonuc(a.card.item, true);
            await x.wait(500);
            await x.praise(a.card.item.en);
            found++;
            busy = false;
            if (found === items.length) { await x.wait(700); resolve(); }
          } else {
            await x.wait(1300);
            a.node.classList.remove('open');
            b.node.classList.remove('open');
            busy = false;
          }
        };
        return node;
      }));
    });
  }

  /* ---------- 🎨 Sihirli Boyama ---------- */
  async function boya(x, items) {
    for (const item of items) {
      if (!x.live.on) return;
      const colour = renk(item);
      const thing = any(Object.keys(RESIMLER));
      const line = boyaCumle(thing, colour[0]);
      x.game.innerHTML = '';
      const talk = voiceRow(x, line);
      const art = el('div', 'og-art', '<svg viewBox="0 0 160 130" role="img" aria-label="' + RESIMLER[thing][0] + '"><defs><clipPath id="og-wipe"><circle cx="80" cy="65" r="0"/></clipPath></defs>' +
        // white underneath, the colour spreading over it, the outlines on top
        '<g class="og-white">' + RESIMLER[thing][1] + '</g><g class="og-paint" clip-path="url(#og-wipe)">' + RESIMLER[thing][1] + '</g>' +
        '<g class="og-ink">' + RESIMLER[thing][1] + '</g></svg><span class="og-brush" aria-hidden="true">🖌️</span>');
      const pots = el('div', 'og-pots');
      x.game.append(talk, art, pots);
      let first = true;
      const wipe = art.querySelector('#og-wipe circle');
      const paint = fill => art.querySelectorAll('.og-paint .p').forEach(part => { part.style.fill = fill; });
      // the colour spreads from the middle with the brush moving over it, so the child sees the picture being painted
      const spread = ms => new Promise(resolve => {
        art.classList.add('painting');
        const t0 = performance.now();
        const step = now => {
          const k = Math.max(0, Math.min(1, (now - t0) / ms));
          wipe.setAttribute('r', String(110 * (1 - Math.pow(1 - k, 2))));
          if (k < 1 && x.live.on) requestAnimationFrame(step); else { art.classList.remove('painting'); resolve(); }
        };
        requestAnimationFrame(step);
      });
      await new Promise(resolve => {
        const options = shuffled([colour, ...shuffled(RENKLER.filter(r => r !== colour)).slice(0, 5)]);
        pots.append(...options.map(r => {
          const pot = button('og-pot', '', r[1]);
          pot.style.setProperty('--c', r[2]);
          pot.onclick = async () => {
            for (const p of pots.children) p.disabled = true;
            pot.classList.add('chosen');
            paint(r[2]);
            wipe.setAttribute('r', '0');
            x.say(r[0]);
            await spread(r === colour ? 1600 : 900);
            if (r === colour) {
              x.sonuc(item, first);
              art.classList.add('done');
              fx.burst(art, { symbols: ['✦', '★', '🖌️', '🎨'], count: 22, spread: 120 });
              fx.confetti?.(x.game.closest('dialog'), { count: 60 });
              await x.praise('The ' + thing + ' is ' + colour[0] + '!');
              await x.wait(1600);
              resolve();
            } else {
              first = false;
              await x.oops(line);
              wipe.setAttribute('r', '0');
              pot.classList.add('wrong');
              for (const p of pots.children) if (!p.classList.contains('wrong')) p.disabled = false;
              pot.classList.remove('chosen');
            }
          };
          return pot;
        }));
        x.wait(300).then(() => x.say(line));
      });
    }
  }

  /* ---------- 🧺 Meyve Sepeti ---------- */
  async function sepet(x, items) {
    x.game.innerHTML = '';
    const table = el('div', 'og-table');
    const basket = button('og-basket', '<span aria-hidden="true">🧺</span><small>Sepet</small>', 'Sepet');
    const talk = el('div', 'og-voice');
    x.game.append(talk, table, basket);
    // the asked foods and a few others on the table
    const foods = [...items];
    for (const w of shuffled(x.c.havuz)) {
      if (foods.length >= Math.max(6, items.length + 3)) break;
      if ((x.c.ayar.sepet || []).includes(w.en) && !foods.some(f => f.en === w.en || f.emo === w.emo)) foods.push(w);
    }
    let picked = null, target = null, first = true, resolveOne = null;
    const nodes = shuffled(foods).map(w => {
      const node = button('og-food', '<span aria-hidden="true">' + w.emo + '</span>', w.tr);
      node.word = w;
      draggable(node, {
        drop: under => { if (under?.closest('.og-basket')) put(node); },
        tap: () => { picked?.classList.remove('picked'); picked = picked === node ? null : node; picked?.classList.add('picked'); x.say(w.en); }
      });
      return node;
    });
    table.append(...nodes);
    basket.onclick = () => { if (picked) put(picked); };
    async function put(node) {
      picked?.classList.remove('picked');
      picked = null;
      if (!target || node.disabled) return;
      if (node.word === target) {
        for (const n of nodes) n.disabled = true;
        // the food flies into the basket
        const from = node.getBoundingClientRect(), to = basket.getBoundingClientRect();
        node.animate([{ transform: 'none' }, { transform: 'translate(' + (to.left + to.width / 2 - from.left - from.width / 2) + 'px,' +
          (to.top + 20 - from.top) + 'px) scale(.4)', opacity: 0.2 }], { duration: calm() ? 1 : 700, easing: 'ease-in' }).finished.then(() => node.classList.add('in'));
        await x.wait(650);
        basket.classList.add('got');
        fx.burst(basket, { symbols: [target.emo, '✦', '❤️'], count: 12, spread: 80 });
        x.sonuc(target, first);
        x.react(true, '😋');
        playCue('correct');
        await x.say(YUMMY);
        await x.say(target.en);
        await x.wait(800);
        basket.classList.remove('got');
        for (const n of nodes) if (!n.classList.contains('in')) n.disabled = false;
        resolveOne();
      } else {
        first = false;
        fx.bump(node, 'missed');
        await x.oops(sepetCumle(target.en));
      }
    }
    for (const item of shuffled(items)) {
      if (!x.live.on) return;
      target = item;
      first = true;
      const line = sepetCumle(item.en);
      talk.replaceChildren(...voiceRow(x, line).children);
      await new Promise(resolve => { resolveOne = resolve; x.wait(250).then(() => x.say(line)); });
    }
  }

  /* ---------- 🚂 Kelime Treni ---------- */
  async function tren(x, items) {
    for (const item of items) {
      if (!x.live.on) return;
      const words = item.en.split(' ');
      x.game.innerHTML = '';
      const talk = voiceRow(x, item.en);
      const meaning = el('p', 'og-meaning', '“' + esc(item.tr) + '”');
      const track = el('div', 'og-track');
      const train = el('div', 'og-train');
      train.append(el('span', 'og-engine', '<span aria-hidden="true">🚂</span>'), ...words.map(() => el('span', 'og-wagon', '')));
      track.append(train);
      const chips = el('div', 'og-chips');
      x.game.append(talk, meaning, track, chips);
      let placed = 0, first = true;
      await new Promise(resolve => {
        const place = async chip => {
          if (chip.disabled) return;
          if (chip.textContent === words[placed]) {
            const wagon = train.querySelectorAll('.og-wagon')[placed++];
            wagon.textContent = chip.textContent;
            wagon.classList.add('full');
            chip.disabled = true;
            chip.classList.add('used');
            playCue('tap');
            if (placed === words.length) {
              for (const c of chips.children) c.disabled = true;
              x.sonuc(item, first);
              playCue('island');
              x.react(true, '🎉');
              // the whole train drives away, puffing
              train.classList.add('go');
              fx.burst(train.querySelector('.og-engine'), { symbols: ['💨', '☁️', '✦'], count: 12, spread: 70 });
              await x.say(item.en);
              await x.praise();
              await x.wait(1200);
              resolve();
            }
          } else {
            first = false;
            fx.bump(chip, 'missed');
            await x.oops();
          }
        };
        chips.append(...shuffled(words).map(w => {
          const chip = button('og-chip', esc(w));
          chip.lang = 'en';
          draggable(chip, { drop: under => { if (under?.closest('.og-track')) place(chip); }, tap: () => place(chip) });
          return chip;
        }));
        x.wait(300).then(() => x.say(item.en));
      });
    }
  }

  /* ---------- 🃏 Bilgi Kartı: the question itself, with a second try ---------- */
  async function kart(x, items) {
    for (const item of items) {
      if (!x.live.on) return;
      const q = item.q;
      x.game.innerHTML = '';
      const card = el('div', 'og-card');
      card.innerHTML = (q.m ? '<div class="soru-passage">' + x.c.rich(q.m) + '</div>' : '') + '<h3 class="og-q">' + x.c.rich(q.s) + '</h3>';
      const hear = !q.a.some(a => a.replace(/[^a-z]/gi, '').toLowerCase().includes(item.en.replace(/[^a-z]/gi, '').toLowerCase()));
      if (hear) card.append(voiceRow(x, item.en, false));
      const options = el('div', 'og-options');
      card.append(options);
      const note = el('div', 'og-note');
      card.append(note);
      x.game.append(card);
      let first = true;
      await new Promise(resolve => {
        options.append(...shuffled([0, 1, 2, 3]).map(n => {
          const b = button('og-option', x.c.rich(q.a[n]));
          b.onclick = async () => {
            if (n === 0) {
              for (const o of options.children) o.disabled = true;
              b.classList.add('right');
              fx.burst(b, { count: 12, spread: 70 });
              x.sonuc(item, first);
              x.react(true, any(OVGU));
              playCue('correct');
              note.innerHTML = '<p><span aria-hidden="true">💡</span> ' + x.c.rich(q.b) + '</p>';
              const go = button('primary og-next', 'Devam ▶');
              go.onclick = () => resolve();
              note.append(go);
              go.focus({ preventScroll: true });
              await x.say(any(OVGU));
              await x.say(item.en);
            } else {
              first = false;
              b.classList.add('wrong');
              b.disabled = true;
              fx.bump(b, 'missed');
              await x.oops();
            }
          };
          return b;
        }));
        if (hear) x.wait(300).then(() => x.say(item.en));
      });
    }
  }

  const OYUNLAR = {
    dinle: { simge: '👂', ad: 'Dinle ve Bul', not: 'Duyduğun kelimenin resmine dokun.', oyna: dinle },
    balon: { simge: '🎈', ad: 'Balon Patlat', not: 'Duyduğun kelimenin balonunu patlat!', oyna: (x, items) => balonlar(x, items) },
    hafiza: { simge: '🃏', ad: 'Sesli Hafıza', not: 'Kartları aç: sesi resmiyle eşleştir.', oyna: hafiza },
    boya: { simge: '🎨', ad: 'Sihirli Boyama', not: 'Resmi söylenen renge boya.', oyna: boya },
    sepet: { simge: '🧺', ad: 'Meyve Sepeti', not: 'Söyleneni tutup sepete sürükle.', oyna: sepet },
    tren: { simge: '🚂', ad: 'Kelime Treni', not: 'Kelimeleri sırayla vagonlara diz.', oyna: tren },
    kart: { simge: '🎴', ad: 'Bilgi Kartı', not: 'Soruyu oku, doğru kartı seç.', oyna: kart }
  };

  // Every English line the games can say, for tools/ingilizce_sesler.py.
  function metinler(ayar = {}) {
    const out = new Set([...OVGU, ...TEKRAR, ...Object.values(GIRIS), YUMMY, BITTI]);
    for (const food of ayar.sepet || []) out.add(sepetCumle(food));
    for (const thing of Object.keys(RESIMLER)) for (const [colour] of RENKLER) { out.add(boyaCumle(thing, colour)); out.add('The ' + thing + ' is ' + colour + '!'); }
    for (const [colour] of RENKLER) out.add(colour);
    return [...out];
  }
  return { tur, balonTuru: (c) => turBalon(c), metinler, resimli, SOYUT };

  // Balon Patlat for Yanlış Avı: one game of balloons over the given words (with written meanings).
  function turBalon(c) {
    const live = { on: true };
    const wait = ms => new Promise(resolve => setTimeout(resolve, calm() ? Math.min(ms, 300) : ms));
    const say = async (text, slow) => { if (live.on) await ingilizceSes.say(text, slow); };
    c.stage.innerHTML = '<div class="og-head"><span class="og-mascot" aria-hidden="true"><b>' + esc(c.maskot || '🦊') + '</b><i class="og-bubble"></i></span>' +
      '<span class="og-where"><span aria-hidden="true">🎈</span> Balon Patlat</span><span class="og-stars"></span></div><div class="og-game"></div>';
    const game = c.stage.querySelector('.og-game'), mascot = c.stage.querySelector('.og-mascot'), bubble = c.stage.querySelector('.og-bubble');
    let right = 0;
    const react = (good, word) => { mascot.classList.remove('happy', 'sad'); void mascot.offsetWidth; mascot.classList.add(good ? 'happy' : 'sad'); bubble.textContent = word; };
    const x = { c, say, wait, live, game, react,
      sonuc: (item, ok) => { if (ok) right++; c.sonuc(item, ok); },
      praise: async word => { const p = any(OVGU); react(true, p); playCue('correct'); await say(p); if (word) await say(word); },
      oops: async again => { const t = any(TEKRAR); react(false, '🤔'); playCue('retry'); await say(t); if (again) await say(again); } };
    ingilizceSes.hazirla([...OVGU, ...TEKRAR, ...c.items.map(i => i.en)]);
    (async () => {
      await say(GIRIS.balon);
      await balonlar(x, c.items, { yazili: true });
      if (live.on) c.bitir(right, c.items.length);
    })();
    return () => { live.on = false; ingilizceSes.stop(); };
  }
})();
