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
    '👏', '🔍', '💃', '📥', '🥄', '🖼️', '👨‍👩‍👧‍👦', '🧑‍🤝‍🧑', '🤵', '🌸', '👱‍♂️', '👱‍♀️', '🖍️', '🧑‍🏫', '🧑‍🎓', '📅',
    '✨', '🥳', '💬', '🔤', '🙇', '👥', '👥📝']);
  // A picture of two things (👩‍🏫☕ teacher’s room, 🛏️🌙 bedroom) is drawn smaller so it fits a card or a balloon.
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter() : null;
  const pic = emo => '<span class="og-emo' + ((seg ? [...seg.segment(emo)].length : 1) > 1 ? ' iki' : '') + '" aria-hidden="true">' + emo + '</span>';
  const resimli = w => !!w.emo && !SOYUT.has(w.emo) && !/[.!?]/.test(w.en) && w.en.split(' ').length <= 3;
  const renk = w => RENKLER.find(r => r[0] === w.en.toLowerCase());

  /* ---------- helpers ---------- */
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
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
          const card = button('og-picture', pic(w.emo), 'Resim');
          card.onclick = async () => {
            if (w === item) {
              for (const other of grid.children) other.disabled = true;
              card.classList.add('right');
              sparkle(card, { count: 14, spread: 80 });
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

  /* ---------- moving pictures ----------
     The games' movement (balloons, the train, the brush) is drawn frame by frame here, not with CSS animations: the
     app shortens every CSS animation to nothing when the device asks for less motion (base.css), and these movements
     are the game itself. */
  const frames = (draw, alive) => {
    let last = performance.now(), id = 0, on = true;
    const step = now => {
      if (!on || !alive()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt, now / 1000);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => { on = false; cancelAnimationFrame(id); };
  };
  // A timed movement: draw(k) with k going 0 → 1 over ms, eased.
  const tween = (ms, draw, ease = k => k, alive = () => true) => new Promise(resolve => {
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      draw(ease(k));
      if (k < 1 && alive()) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
  const easeIn = k => k * k * k, easeOut = k => 1 - Math.pow(1 - k, 3), easeInOut = k => k * k * (3 - 2 * k);
  // Pieces flying out of a point of host (a popped balloon, a splash of paint).
  function pieces(host, px, py, { colours, count = 12, spread = 70, size = 12, fall = 40, symbols = null }) {
    for (let i = 0; i < count; i++) {
      const piece = el('i', 'og-piece' + (symbols ? ' sym' : ''));
      if (symbols) piece.textContent = symbols[i % symbols.length];
      else { piece.style.background = colours[i % colours.length]; piece.style.width = piece.style.height = size * (0.6 + Math.random() * 0.7) + 'px'; }
      if (symbols) piece.style.color = colours[i % colours.length];
      piece.style.left = px + 'px';
      piece.style.top = py + 'px';
      host.append(piece);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6, d = spread * (0.5 + Math.random() * 0.7);
      const dx = Math.cos(angle) * d, dy = Math.sin(angle) * d;
      piece.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx * 0.8 + 'px), calc(-50% + ' + dy * 0.8 + 'px)) rotate(' + (Math.random() * 360 - 180) + 'deg) scale(1)', opacity: 1, offset: 0.55 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + (dy + fall) + 'px)) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.5)', opacity: 0 }
      ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.15,.7,.4,1)' }).finished.then(() => piece.remove(), () => piece.remove());
    }
  }
  // Stars flying out of a node (fx.burst stays still when the device asks for less motion; the games do not).
  const sparkle = (node, { count = 12, symbols = ['★', '✦', '•'], spread = 80 } = {}) => {
    const host = node?.closest('.og-game');
    if (!host) return;
    const at = relTo(node, host);
    pieces(host, at.x, at.y, { colours: ['#ffcf62', '#f39a3d', '#53a981', '#ef6f6c', '#7cc6e8', '#b197fc'], symbols, count, spread, fall: 12 });
  };
  const relTo = (node, host) => {
    const r = node.getBoundingClientRect(), h = host.getBoundingClientRect();
    return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2, w: r.width, h: r.height };
  };

  /* ---------- 🎈 Balon Patlat (also Yanlış Avı's, with the meaning written under the picture) ----------
     Balloons rise through the sky swaying on their strings, and come up again from below until the right one is popped. */
  async function balonlar(x, items, { yazili = false } = {}) {
    const colours = ['#ff6b6b', '#ffa94d', '#4dabf7', '#9775fa', '#51cf66', '#f783ac', '#ffd43b'];
    for (const [n, item] of items.entries()) {
      if (!x.live.on) return;
      x.game.innerHTML = '';
      const talk = voiceRow(x, item.en);
      const sky = el('div', 'og-sky', '<i class="og-sun"></i><i class="og-hill back"></i><i class="og-hill"></i>');
      x.game.append(talk, sky);
      const clouds = [0.08, 0.3, 0.55].map((top, i) => {
        const node = el('i', 'og-cloud');
        node.style.top = top * 100 + '%';
        node.style.scale = String(0.7 + i * 0.25);
        sky.append(node);
        return { node, x: Math.random() * 300 - 60, v: 6 + i * 5 };
      });
      let first = true;
      await new Promise(resolve => {
        let over = false;
        const set = yazili ? balloonSet(x, item) : choices(x.c, item, 4);
        const W = sky.clientWidth, H = sky.clientHeight;
        const lanes = shuffled(set.map((_, i) => i));
        const starts = shuffled([0.12, 0.62, 0.36, 0.84].slice(0, set.length));
        const balloons = set.map((w, i) => {
          const colour = colours[(i + n * 2) % colours.length];
          const node = button('og-balloon', '<span class="og-bbody"><i class="og-shine"></i>' + (w.emo ? '<span class="og-bpic">' + pic(w.emo) + '</span>' : '') +
            (yazili ? '<small>' + esc(w.tr) + '</small>' : '') + '</span><i class="og-knot"></i><svg class="og-string" viewBox="0 0 24 70" aria-hidden="true"><path d="M12 0Q12 35 12 70"/></svg>',
            yazili ? w.tr : 'Balon');
          node.style.setProperty('--c', colour);
          sky.append(node);
          const bw = node.offsetWidth, bh = node.offsetHeight;
          const lane = W / set.length;
          return { w, node, colour, bw, bh, path: node.querySelector('path'), body: node.querySelector('.og-bbody'),
            x0: lane * (lanes[i] + 0.5) - bw / 2, y: starts[i] * (H - bh * 0.55), speed: H / (9 + Math.random() * 3),
            f: 1.1 + Math.random() * 0.6, phase: Math.random() * 6, state: 'fly' };
        });
        const stop = frames((dt, t) => {
          const h = sky.clientHeight;
          for (const b of balloons) {
            if (b.state === 'gone' || b.state === 'popped') continue;
            b.y -= b.speed * dt * (b.state === 'away' ? 5 : 1);
            if (b.y < -b.bh - 10) {
              if (b.state === 'away') { b.state = 'gone'; b.node.remove(); continue; }
              b.y = h + 6;
            }
            const sway = Math.sin(t * b.f + b.phase);
            const bx = Math.max(4, Math.min(sky.clientWidth - b.bw - 4, b.x0 + sway * 9));
            b.node.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px) rotate(' + (sway * 6).toFixed(1) + 'deg)';
            b.path.setAttribute('d', 'M12 0Q' + (12 - sway * 10).toFixed(1) + ' 35 ' + (12 + sway * 4).toFixed(1) + ' 70');
          }
          for (const c of clouds) {
            c.x += c.v * dt;
            if (c.x > sky.clientWidth + 20) c.x = -140;
            c.node.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
          }
        }, () => sky.isConnected && x.live.on);
        // The balloon bursts into pieces and its string falls.
        const pop = (b, big) => {
          b.state = 'popped';
          b.node.disabled = true;
          const at = relTo(b.body, sky);
          playCue('pop');
          pieces(sky, at.x, at.y, { colours: [b.colour, b.colour, '#ffffff'], count: big ? 16 : 10, spread: big ? 90 : 60, size: 13 });
          const word = el('b', 'og-popword', big ? 'POP!' : 'pop');
          word.style.left = at.x + 'px';
          word.style.top = at.y + 'px';
          sky.append(word);
          word.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, offset: 0.3 },
            { transform: 'translate(-50%,-90%) scale(1)', opacity: 0 }], { duration: 800, easing: 'ease-out' }).finished.then(() => word.remove(), () => word.remove());
          b.body.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0 }], { duration: 140, fill: 'forwards' });
          b.node.querySelector('.og-knot').style.visibility = 'hidden';
          b.node.querySelector('.og-string').animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateY(160px) rotate(40deg)', opacity: 0 }],
            { duration: 900, easing: 'ease-in', fill: 'forwards' });
        };
        for (const b of balloons) {
          b.node.onclick = async () => {
            if (over || b.state !== 'fly') return;
            if (b.w === item) {
              over = true;
              pop(b, true);
              x.sonuc(item, first);
              for (const other of balloons) if (other.state === 'fly') { other.state = 'away'; other.node.disabled = true; }
              await x.praise(item.en);
              await x.wait(700);
              stop();
              resolve();
            } else {
              first = false;
              pop(b, false);
              await x.oops(item.en);
            }
          };
        }
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
        const node = button('og-mem', '<span class="og-back" aria-hidden="true">❓</span><span class="og-face" aria-hidden="true">' + (card.sound ? '🔊' : pic(card.item.emo)) + '</span>',
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
            sparkle(b.node, { count: 10, spread: 60 });
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

  /* ---------- 🎨 Sihirli Boyama ----------
     A brush sweeps over the picture row by row, and only where it has passed is the picture painted. */
  let maskNo = 0;
  // A brush whose tip is at 0,0: wooden handle, metal band, bristles wet with the paint.
  const FIRCA = '<path class="og-handle" d="M-4.5 -25 L-3 -66 Q0 -71 3 -66 L4.5 -25Z"/><rect class="og-ferrule" x="-6" y="-27" width="12" height="9" rx="2"/>' +
    '<path class="og-bristle" d="M-6 -18 L6 -18 L5 -6 Q1 3 0 3 Q-1 3 -5 -6Z"/><path class="og-wet" d="M-5.4 -11 L5.4 -11 L5 -6 Q1 3 0 3 Q-1 3 -5 -6Z"/>';
  // Rows back and forth over the box, gently wavy like a hand's strokes.
  function strokes(box, gap) {
    const x0 = box.x - 2, x1 = box.x + box.width + 2;
    const rows = Math.max(2, Math.ceil((box.height + 4) / gap));
    const step = (box.height + 4) / rows;
    let y = box.y - 2 + step / 2, d = 'M' + x0.toFixed(1) + ' ' + y.toFixed(1);
    for (let r = 0; r < rows; r++) {
      const right = r % 2 === 0, from = right ? x0 : x1, to = right ? x1 : x0, q = (to - from) / 4;
      for (let s = 0; s < 4; s++) d += 'Q' + (from + q * (s + 0.5)).toFixed(1) + ' ' + (y + (s % 2 ? 3 : -3)).toFixed(1) + ' ' + (from + q * (s + 1)).toFixed(1) + ' ' + y.toFixed(1);
      if (r < rows - 1) { const ny = y + step; d += 'Q' + (to + (right ? 9 : -9)).toFixed(1) + ' ' + ((y + ny) / 2).toFixed(1) + ' ' + to.toFixed(1) + ' ' + ny.toFixed(1); y = ny; }
    }
    return d;
  }
  async function boya(x, items) {
    for (const item of items) {
      if (!x.live.on) return;
      const colour = renk(item);
      const thing = any(Object.keys(RESIMLER));
      const line = boyaCumle(thing, colour[0]);
      const id = 'og-mask-' + (++maskNo);
      x.game.innerHTML = '';
      const talk = voiceRow(x, line);
      const art = el('div', 'og-art', '<svg viewBox="-12 -12 184 154" role="img" aria-label="' + RESIMLER[thing][0] + '"><defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="-20" y="-20" width="200" height="170">' +
        '<path class="og-stroke" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>' +
        // white underneath, the paint where the brush has been, the outlines on top, then the brush
        '<g class="og-white">' + RESIMLER[thing][1] + '</g><g class="og-paint" mask="url(#' + id + ')">' + RESIMLER[thing][1] + '</g>' +
        '<g class="og-ink">' + RESIMLER[thing][1] + '</g><g class="og-brush" opacity="0"><g class="og-brush-tilt">' + FIRCA + '</g></g></svg>');
      const pots = el('div', 'og-pots');
      x.game.append(talk, art, pots);
      let first = true;
      const svg = art.querySelector('svg'), stroke = art.querySelector('.og-stroke'), paintG = art.querySelector('.og-paint');
      const brush = art.querySelector('.og-brush'), tilt = art.querySelector('.og-brush-tilt');
      const box = art.querySelector('.og-white').getBBox();
      const gap = 17;
      // the brush's way, as points; the paint is the part of it the brush has gone along (drawn anew every frame)
      const guide = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      guide.setAttribute('d', strokes(box, gap));
      art.querySelector('defs').append(guide);
      const L = guide.getTotalLength();
      const way = Array.from({ length: Math.ceil(L / 2) + 1 }, (_, i) => guide.getPointAtLength(Math.min(L, i * 2)));
      stroke.setAttribute('stroke-width', String(gap + 9));
      const reveal = k => {
        const n = Math.round(k * (way.length - 1));
        let d = 'M' + way[0].x.toFixed(1) + ' ' + way[0].y.toFixed(1);
        for (let i = 1; i <= n; i++) d += 'L' + way[i].x.toFixed(1) + ' ' + way[i].y.toFixed(1);
        stroke.setAttribute('d', n ? d : 'M0 0');
        return way[n];
      };
      reveal(0);
      const setColour = fill => {
        art.querySelectorAll('.og-paint .p').forEach(part => { part.style.fill = fill; });
        art.querySelectorAll('.og-bristle, .og-wet').forEach(part => { part.style.fill = fill; });
      };
      const alive = () => svg.isConnected && x.live.on;
      // The brush comes down onto the picture, sweeps the rows and lifts off.
      async function paintAll(ms) {
        const start = way[0];
        brush.setAttribute('opacity', '1');
        await tween(260, k => brush.setAttribute('transform', 'translate(' + (start.x + 30 * (1 - k)).toFixed(1) + ' ' + (start.y - 40 * (1 - k)).toFixed(1) + ')'), easeOut, alive);
        playCue('tap', { gain: 0.4 });
        await tween(ms, k => {
          const p = reveal(k);
          brush.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
          tilt.setAttribute('transform', 'rotate(' + (28 + Math.sin(k * 70) * 9).toFixed(1) + ') scale(.95)');
        }, k => k, alive);
        const end = way[way.length - 1];
        await tween(240, k => { brush.setAttribute('transform', 'translate(' + (end.x + 30 * k).toFixed(1) + ' ' + (end.y - 40 * k).toFixed(1) + ')'); brush.setAttribute('opacity', String(1 - k)); }, easeIn, alive);
      }
      await new Promise(resolve => {
        const options = shuffled([colour, ...shuffled(RENKLER.filter(r => r !== colour)).slice(0, 5)]);
        pots.append(...options.map(r => {
          const pot = button('og-pot', '<i class="og-blob"></i>', r[1]);
          pot.style.setProperty('--c', r[2]);
          pot.onclick = async () => {
            for (const p of pots.children) p.disabled = true;
            pot.classList.add('chosen');
            setColour(r[2]);
            paintG.style.opacity = '1';
            reveal(0);
            x.say(r[0]);
            await paintAll(r === colour ? 2600 : 1500);
            if (!alive()) return resolve();
            if (r === colour) {
              x.sonuc(item, first);
              art.classList.add('done');
              const at = relTo(svg, art);
              pieces(art, at.x, at.y, { colours: [r[2], '#ffd43b', '#ff8fd0', '#74c0fc'], symbols: ['✦', '★', '✦', '•'], count: 18, spread: 130, fall: 10 });
              fx.confetti?.(x.game.closest('dialog'), { count: 60 });
              await x.praise('The ' + thing + ' is ' + colour[0] + '!');
              await x.wait(1400);
              resolve();
            } else {
              first = false;
              await x.oops(line);
              // the wrong paint is washed away
              await tween(450, k => { paintG.style.opacity = String(1 - k); }, k => k, alive);
              reveal(0);
              paintG.style.opacity = '1';
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
          (to.top + 20 - from.top) + 'px) scale(.4)', opacity: 0.2 }], { duration: 700, easing: 'ease-in' }).finished.then(() => node.classList.add('in'));
        await x.wait(650);
        basket.classList.add('got');
        sparkle(basket, { symbols: [target.emo, '✦', '❤️'], count: 12, spread: 80 });
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

  /* ---------- 🚂 Kelime Treni ----------
     The train rolls in with empty wagons, puffing; every word flies into its wagon; when the sentence is right the
     whistle blows and the train drives off, its wheels turning. It faces left so the wagons read in order behind it. */
  const wheel = (cx, cy, r) => '<g class="og-wheel" data-c="' + cx + ' ' + cy + '"><circle class="og-tyre" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' +
    '<path class="og-spoke" d="M' + (cx - r * 0.78) + ' ' + cy + 'H' + (cx + r * 0.78) + 'M' + cx + ' ' + (cy - r * 0.78) + 'V' + (cy + r * 0.78) +
    'M' + (cx - r * 0.55) + ' ' + (cy - r * 0.55) + 'L' + (cx + r * 0.55) + ' ' + (cy + r * 0.55) + 'M' + (cx - r * 0.55) + ' ' + (cy + r * 0.55) + 'L' + (cx + r * 0.55) + ' ' + (cy - r * 0.55) + '"/>' +
    '<circle class="og-hub" cx="' + cx + '" cy="' + cy + '" r="' + r * 0.25 + '"/></g>';
  const LOKOMOTIF = '<svg class="og-loco" viewBox="0 0 124 96" aria-hidden="true">' +
    '<path class="og-catcher" d="M16 70 L2 86 H20Z"/>' +
    '<rect class="og-boiler" x="14" y="38" width="62" height="34" rx="10"/><rect class="og-band" x="34" y="38" width="5" height="34"/><rect class="og-band" x="56" y="38" width="5" height="34"/>' +
    '<circle class="og-lamp" cx="14" cy="50" r="6"/>' +
    '<path class="og-chimney" d="M24 38 V18 H20 V10 H42 V18 H38 V38Z"/>' +
    '<circle class="og-dome" cx="48" cy="38" r="7"/>' +
    '<rect class="og-cab" x="74" y="18" width="44" height="54" rx="4"/><rect class="og-roof" x="70" y="10" width="52" height="10" rx="4"/>' +
    '<rect class="og-window" x="84" y="26" width="24" height="18" rx="4"/>' +
    '<rect class="og-base" x="8" y="70" width="114" height="8" rx="3"/>' +
    wheel(32, 82, 10) + wheel(56, 82, 10) + wheel(96, 78, 15) +
    '<path class="og-rod" d="M32 82 L96 78"/></svg>';
  async function tren(x, items) {
    const wagonColours = ['#ff8787', '#ffc078', '#8ce99a', '#74c0fc', '#b197fc', '#faa2c1', '#ffe066'];
    for (const item of items) {
      if (!x.live.on) return;
      const words = item.en.split(' ');
      x.game.innerHTML = '';
      const talk = voiceRow(x, item.en);
      const meaning = el('p', 'og-meaning', '“' + esc(item.tr) + '”');
      const track = el('div', 'og-track', '<i class="og-rails"></i>');
      const train = el('div', 'og-train');
      train.innerHTML = LOKOMOTIF + words.map((w, i) => '<span class="og-wagon" style="--c:' + wagonColours[i % wagonColours.length] + '"><i class="og-coupler"></i>' +
        '<b class="og-word" aria-hidden="true" lang="en">' + esc(w) + '</b>' +
        '<svg class="og-ww l" viewBox="0 0 20 20" aria-hidden="true">' + wheel(10, 10, 8.5) + '</svg><svg class="og-ww r" viewBox="0 0 20 20" aria-hidden="true">' + wheel(10, 10, 8.5) + '</svg></span>').join('');
      track.append(train);
      const chips = el('div', 'og-chips');
      x.game.append(talk, meaning, track, chips);
      const alive = () => track.isConnected && x.live.on;
      // The whole train fits the track: a long sentence makes it smaller.
      const scale = Math.min(1, (track.clientWidth - 12) / train.offsetWidth);
      const trainH = train.offsetHeight;
      track.style.height = Math.ceil(trainH * scale + 22) + 'px';
      const wheels = [...train.querySelectorAll('.og-loco .og-wheel')], small = [...train.querySelectorAll('.og-ww')];
      const chimney = train.querySelector('.og-chimney');
      let pos = track.clientWidth + 20, bob = 0;
      const place = (px, t = 0) => {
        pos = px;
        bob = Math.sin(t * 22) * 1.2;
        train.style.transform = 'translate(' + px.toFixed(1) + 'px,' + bob.toFixed(1) + 'px) scale(' + scale + ')';
        const turn = px * 2.2;   // the wheels turn as far as the train rolls
        for (const w of wheels) w.setAttribute('transform', 'rotate(' + turn.toFixed(1) + ' ' + w.dataset.c + ')');
        for (const w of small) w.style.transform = 'rotate(' + (turn * 1.6).toFixed(1) + 'deg)';
      };
      const puff = (big = false) => {
        if (!alive()) return;
        const at = relTo(chimney, track);
        const p = el('i', 'og-puff');
        p.style.left = at.x + 'px';
        p.style.top = (at.y - at.h / 2) + 'px';
        track.append(p);
        const drift = 20 + Math.random() * 25;
        p.animate([{ transform: 'translate(-50%,-50%) scale(.35)', opacity: 0.95 },
          { transform: 'translate(calc(-50% + ' + drift + 'px), calc(-50% - ' + (big ? 46 : 34) + 'px)) scale(' + (big ? 2.1 : 1.6) + ')', opacity: 0 }],
          { duration: big ? 1300 : 1600, easing: 'ease-out' }).finished.then(() => p.remove(), () => p.remove());
      };
      place(pos);
      // it rolls in
      let lastPuff = 0;
      const roll = (from, to, ms, ease, puffEvery) => tween(ms, k => {
        const now = performance.now();
        place(from + (to - from) * k, now / 1000);
        if (now - lastPuff > puffEvery) { lastPuff = now; puff(puffEvery < 300); }
      }, ease, alive);
      await roll(pos, 6, 1700, easeOut, 260);
      place(6);
      const idle = setInterval(() => puff(), 1200);
      let placed = 0, first = true;
      await new Promise(resolve => {
        const fill = async chip => {
          if (chip.disabled) return;
          if (chip.textContent === words[placed]) {
            const wagon = train.querySelectorAll('.og-wagon')[placed++];
            chip.disabled = true;
            playCue('tap');
            // the word flies into its wagon
            const from = chip.getBoundingClientRect(), to = wagon.getBoundingClientRect();
            const fly = chip.animate([{ transform: 'none' }, { transform: 'translate(' + (to.left + to.width / 2 - from.left - from.width / 2) + 'px,' +
              (to.top + to.height / 2 - from.top - from.height / 2) + 'px) scale(' + Math.max(0.5, scale * 0.85) + ')', opacity: 0.4 }], { duration: 380, easing: 'ease-in' });
            const last = placed === words.length;
            if (last) for (const c of chips.children) c.disabled = true;
            await fly.finished.catch(() => {});
            chip.classList.add('used');
            wagon.classList.add('full');
            wagon.querySelector('.og-word').removeAttribute('aria-hidden');
            wagon.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' });
            if (last) {
              clearInterval(idle);
              x.sonuc(item, first);
              x.react(true, '🎉');
              playCue('island');
              await x.say(item.en);
              // a little jolt back, then away to the left, faster and faster
              await roll(6, 16, 260, easeOut, 1000);
              await roll(16, -(train.offsetWidth * scale + 40), 2600, easeIn, 150);
              await x.praise();
              await x.wait(500);
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
          draggable(chip, { drop: under => { if (under?.closest('.og-track')) fill(chip); }, tap: () => fill(chip) });
          return chip;
        }));
        x.wait(300).then(() => x.say(item.en));
      });
      clearInterval(idle);
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
              sparkle(b, { count: 12, spread: 70 });
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
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
