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
//     a question with g       🔍 Gizli Kelimeler (a big picture, ayar.sahneler[g]: "Find the teacher!", tap her)
//     anything else           🃏 Bilgi Kartı (the question itself, with a second try)
//   c = { stage, items: [{ q, en, tr, emo }], havuz: [{ en, tr, emo }] (other pictured words, for wrong choices),
//         ayar: { sepet: [food words], sahneler: { id: picture } }, maskot (the player's icon), sonuc(item, dogru), bitir(), rich(text) }
// ingilizceOyunlari.balon(c): Yanlış Avı's Balon Patlat, with only the words the child got wrong.
// ingilizceOyunlari.metinler(ayar, kelimeler): every English line the games say, for the recording tool.
const ingilizceSes = (() => {
  const BASE = 'assets/audio/ingilizce/';
  const buffers = new Map();
  let current = null, run = 0;
  const context = () => (typeof playCue === 'function' && playCue.context?.()) || null;
  // ses 'b' is the answer voice (am_michael): it says the answer of a dialogue and the right answer after a question
  const clip = (text, slow, ses) => {
    const b = ses === 'b' && !slow && window.ingilizceKayitlarB?.[text];
    const id = b || window.ingilizceKayitlar?.[text];
    return id ? BASE + id + (b ? '-b' : slow ? '-y' : '') + '.mp3?v=' + (window.ingilizceKayitlarSurum || 1) : null;
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
  function deviceVoice(ses) {
    const voices = window.speechSynthesis?.getVoices() || [];
    const en = voices.filter(v => /^en[-_]/i.test(v.lang));
    const score = v => (/natural|neural|enhanced|premium|siri/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/en[-_](gb|us)/i.test(v.lang) ? 1 : 0);
    const best = en.sort((a, b) => score(b) - score(a));
    // the answer voice: another voice of the device when it has one
    return (ses === 'b' ? best[1] : best[0]) || best[0] || null;
  }
  function speakDevice(text, slow, mine, ses) {
    return new Promise(resolve => {
      if (!window.speechSynthesis) return resolve(false);
      const line = new SpeechSynthesisUtterance(text);
      line.lang = 'en-GB';
      const voice = deviceVoice(ses);
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
  async function say(text, slow = false, ses = 'a') {
    if (!text) return false;
    stop();
    const mine = run;
    const src = clip(text, slow, ses);
    const buffer = src ? await decode(src) : null;
    if (mine !== run) return false;
    const audio = context();
    if (!buffer || !audio) return speakDevice(text, slow, mine, ses);
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
  const kayitli = text => !!window.ingilizceKayitlar?.[text];
  // how long a line takes to say, in seconds: its recording's length, or a guess for the device's voice
  async function sure(text, slow = false) {
    const src = clip(text, slow);
    const buffer = src ? await decode(src) : null;
    return buffer ? buffer.duration : (slow ? 0.13 : 0.075) * String(text).length + 0.3;
  }
  // "How are you? I’m fine, thank you." → ["How are you?", "I’m fine, thank you."]: a question and its answer
  const diyalog = text => { const m = String(text).match(/^(.+?\?)\s+(\S.*)$/); return m ? [m[1], m[2]] : null; };
  return { say, stop, hazirla, kayitli, diyalog, sure };
})();

const ingilizceOyunlari = (() => {
  /* ---------- the lines the games say (each one recorded) ---------- */
  const OVGU = ['Well done!', 'Great job!', 'Super!', 'Excellent!', 'Yes! That’s right!', 'Brilliant!', 'Fantastic!'];
  const TEKRAR = ['Try again!', 'Oops! Try again.', 'Listen again.'];
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
    '✨', '🥳', '💬', '🔤', '🙇', '👥', '👥📝', '💯', '😩💧']);
  // A picture of two things (👩‍🏫☕ teacher’s room, 🛏️🌙 bedroom) is drawn smaller so it fits a card or a balloon.
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter() : null;
  // A word's picture: an emoji, two emoji, or a drawing ([[desk]], core/js/kelime-resimleri.js).
  const parts = emo => { const rest = emo.replace(/\[\[[a-z0-9-]+\]\]/g, ''); return (emo.length - rest.length ? emo.match(/\[\[/g).length : 0) + (rest ? (seg ? [...seg.segment(rest)].length : 1) : 0); };
  const pic = emo => '<span class="og-emo' + (parts(emo) > 1 ? ' iki' : '') + '" aria-hidden="true">' + kelimeResimleri.kelimeResmi(emo) + '</span>';
  // a big picture on a card: rounded, a light shadow, a soft colour behind it (always the same one for a picture)
  const KART = ['#fff3bf', '#d3f9d8', '#d0ebff', '#ffe3e3', '#f3d9fa', '#ffe8cc', '#c5f6fa', '#e5dbff'];
  const tint = emo => KART[[...String(emo)].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) >>> 0, 7) % KART.length];
  const resimKarti = emo => '<span class="resim-kart" style="--kb:' + tint(emo) + '">' + pic(emo) + '</span>';
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

  /* ---------- speaking without two lines at once ----------
     Every line goes through a "flow": a new tap starts a new flow, and the lines still waiting in an older one (the rest
     of "Try again! … dog") are dropped, so two lines never run into each other. A dialogue is said by two voices: the
     question in the main voice, a short pause, the answer in the answer voice ('b'). After a right answer the answer is
     said first, in the answer voice, and the praise only after it, so the two voices never run into each other. Moving
     on to the next question (Devam, the next game) drops every line of the question before (sus). */
  function konusmaci(live, react) {
    let flow = 0;
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    async function line(text, id, { slow = false, ses = 'a' } = {}) {
      if (!text || id !== flow || !live.on) return;
      const d = ingilizceSes.diyalog(text);
      if (!d) return ingilizceSes.say(text, slow, ses);
      await ingilizceSes.say(d[0], slow, 'a');
      if (id !== flow || !live.on) return;
      await pause(300);
      if (id !== flow || !live.on) return;
      await ingilizceSes.say(d[1], slow, 'b');
    }
    // a line said now: whatever was being said stops
    const say = (text, slow) => line(text, ++flow, { slow });
    // a row of lines that belong together; a later tap drops the rest
    const seq = () => {
      const id = ++flow;
      const ok = () => id === flow && live.on;
      return { ok, say: (text, opts) => line(text, id, opts), wait: async ms => { await pause(ms); return ok(); } };
    };
    // the answer first, in the answer voice, and only when it has been heard to the end the praise
    const praise = async (word, said = any(OVGU)) => {
      const s = seq();
      react(true, said);
      playCue('correct');
      if (!(await s.wait(250))) return;
      if (word) { await s.say(word, { ses: 'b' }); if (!(await s.wait(400))) return; }
      await s.say(said);
    };
    // silence: whatever is being said or still waiting to be said is dropped (on to the next question)
    const sus = () => { ++flow; ingilizceSes.stop(); };
    const oops = async again => {
      const s = seq();
      react(false, '🤔');
      playCue('retry');
      if (!(await s.wait(200))) return;
      await s.say(any(TEKRAR));
      if (again && (await s.wait(300))) await s.say(again);
    };
    return { say, seq, praise, oops, sus };
  }

  /* ---------- the round: a frame, the mascot, stars, and the games one after another ---------- */
  function tur(c) {
    const live = { on: true };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
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
    const ctx = { c, wait, sonuc, react, live, game, where, ...konusmaci(live, react) };

    // Cut the station's questions into games. A question with a picture of its own (g) is found in that picture.
    const sahneler = c.ayar?.sahneler || {};
    const hidden = c.items.filter(i => i.q?.g && sahneler[i.q.g]?.yerler.some(y => y.en === i.en));
    // a question with a drawn dialogue of its own (r) is always a Bilgi Kartı, asked under that picture
    const pictured = c.items.filter(i => !hidden.includes(i) && !i.q?.r && resimli(i));
    const foods = pictured.filter(i => (c.ayar.sepet || []).includes(i.en));
    const colours = pictured.filter(i => renk(i));
    const words = pictured.filter(i => !foods.includes(i) && !colours.includes(i));
    const sentence = i => !resimli(i) && i.en.split(' ').length >= 3 && i.en.split(' ').length <= 7 && /^[A-Za-z’',.!? -]+$/.test(i.en) &&
      (i.word || i.q.a.some(a => a.replace(/[^a-z]/gi, '').toLowerCase() === i.en.replace(/[^a-z]/gi, '').toLowerCase()));
    const trains = c.items.filter(i => !hidden.includes(i) && !pictured.includes(i) && !i.q?.r && sentence(i));
    const cards = c.items.filter(i => !hidden.includes(i) && !pictured.includes(i) && !trains.includes(i));
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
    for (const g of new Set(hidden.map(i => i.q.g))) {
      const group = hidden.filter(i => i.q.g === g);
      for (let i = 0; i < group.length; i += 4) plan.push(['gizli', group.slice(i, i + 4)]);
    }
    if (foods.length) plan.push(['sepet', foods]);
    if (colours.length) plan.push(['boya', colours]);
    if (trains.length) plan.push(['tren', trains]);
    for (let i = 0; i < cards.length; i += 3) plan.push(['kart', cards.slice(i, i + 3)]);
    const order = shuffled(plan);
    ingilizceSes.hazirla([...OVGU, ...TEKRAR, ...c.items.map(i => i.en), ...hidden.map(i => yerOf(sahneler[i.q.g], i.en).bul)]);

    (async () => {
      for (const [kind, items] of order) {
        if (!live.on) return;
        ctx.sus();
        const info = OYUNLAR[kind];
        where.innerHTML = '<span aria-hidden="true">' + info.simge + '</span> ' + info.ad;
        // straight into the game: its name stays in the corner, nothing is announced first
        playCue('pop', { gain: 0.6 });
        await info.oyna(ctx, items);
        for (const item of items) sonuc(item, false);   // anything a game left unanswered counts as missed
        await wait(400);
      }
      if (!live.on) return;
      react(true, '🎉');
      await ctx.say(BITTI);
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
          const card = button('og-picture', resimKarti(w.emo), 'Resim');
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
        x.wait(300).then(() => { if (first && !grid.querySelector('.right')) x.say(item.en); });
      });
    }
  }
  // 🔊 and 🐢 (slow) for a word
  // (said(slow): also called when a button is tapped, as 🔍 Gizli Kelimeler writes the line it says)
  function voiceRow(x, text, big = true, said = null) {
    const row = el('div', 'og-voice');
    const loud = button('soru-say' + (big ? ' big' : ''), '🔊', 'Dinle');
    loud.onclick = () => { said?.(false); x.say(text); fx.bump(loud, 'show'); };
    const slow = button('soru-say slow', '🐢', 'Yavaş dinle');
    slow.onclick = () => { said?.(true); x.say(text, true); fx.bump(slow, 'show'); };
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

  /* ---------- 🪃 the slingshot under Balon Patlat's sky ----------
     sapan(sky, { hedefler, vur, bitti }): a wooden slingshot at the bottom middle of the sky. The child pulls the ball down
     and to a side (finger, mouse or pen: pointer events, captured, so the pull never breaks off the pad); a dotted line
     shows where it will go, as far as the first balloon in its way, which glows. Let go: the ball flies straight and fast;
     the first balloon it touches is chosen (vur(b)), as if it was tapped. The ball bounces off the sides of the sky (up to
     three times; the aim line shows the bounces too). A miss costs nothing: the ball comes back at
     once. A short pull does not shoot. The balloons stay buttons, so tapping one still chooses it. step(dt) moves the
     ball (called from the sky's frames); aiming() is true while the band is pulled (the balloons slow down then). */
  function sapan(sky, { hedefler, vur, bitti }) {
    const NS = 'http://www.w3.org/2000/svg';
    const make = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
    const svg = make('svg', { class: 'og-sapan', 'aria-hidden': 'true' });
    const dots = make('g', { class: 'og-sapan-dots' });
    const bandBack = make('line', { class: 'og-sapan-band' });
    const fork = make('path', { class: 'og-sapan-fork' });
    const bandFront = make('line', { class: 'og-sapan-band' });
    const ball = make('circle', { class: 'og-sapan-ball', r: 13 });
    const shine = make('circle', { class: 'og-sapan-shine', r: 4 });
    svg.append(dots, bandBack, fork, ball, shine, bandFront);
    const pad = el('div', 'og-sapan-pad');
    pad.setAttribute('aria-hidden', 'true');
    sky.append(svg, pad);
    const MAX = 82, MIN = 20, R = 13;
    let W = 0, H = 0, rest = { x: 0, y: 0 }, tips = [];
    let aiming = false, pull = { x: 0, y: 0 }, flying = null, target = null, back = 0;
    const layout = () => {
      W = sky.clientWidth; H = sky.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      // the ball rests between the fork's tips, high enough that a full pull stays inside the sky
      rest = { x: W / 2, y: H - 104 };
      tips = [{ x: W / 2 - 28, y: H - 106 }, { x: W / 2 + 28, y: H - 106 }];
      fork.setAttribute('d', 'M' + W / 2 + ' ' + (H - 8) + 'V' + (H - 72) + 'M' + tips[0].x + ' ' + tips[0].y + 'Q' + (W / 2 - 22) + ' ' + (H - 74) + ' ' + W / 2 + ' ' + (H - 72) +
        'Q' + (W / 2 + 22) + ' ' + (H - 74) + ' ' + tips[1].x + ' ' + tips[1].y);
    };
    // the balloon's body, in the sky's pixels
    const bodyOf = b => {
      const r = b.body.getBoundingClientRect(), s = sky.getBoundingClientRect();
      return { cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2, rx: r.width / 2, ry: r.height / 2 };
    };
    const live = () => hedefler.filter(b => b.state === 'fly');
    // a point inside a balloon's body (a little wider than it looks, so a near miss counts)
    const inside = (b, px, py, extra = R) => {
      const e = bodyOf(b), dx = (px - e.cx) / (e.rx + extra), dy = (py - e.cy) / (e.ry + extra);
      return dx * dx + dy * dy <= 1;
    };
    const direction = () => {
      const len = Math.hypot(pull.x, pull.y) || 1;
      return { x: -pull.x / len, y: -pull.y / len };
    };
    // where the ball would go, bouncing off the sides of the sky: the first balloon in its way and the points of its path
    const BOUNCES = 3;
    const trace = () => {
      const list = live(), d = direction();
      let px = rest.x, py = rest.y, vx = d.x, vy = d.y, bounces = 0;
      const path = [];
      for (let s = 0; s < 1600; s += 6) {
        px += vx * 6; py += vy * 6;
        if (px < R) { px = 2 * R - px; vx = -vx; if (++bounces > BOUNCES) break; }
        else if (px > W - R) { px = 2 * (W - R) - px; vx = -vx; if (++bounces > BOUNCES) break; }
        if (py < -10) break;
        path.push([px, py]);
        const b = list.find(b => inside(b, px, py, 4));
        if (b) return { hit: b, path };
      }
      return { hit: null, path };
    };
    const draw = () => {
      const bx = flying ? flying.x : rest.x + pull.x, by = flying ? flying.y : rest.y + pull.y;
      const hidden = back > 0;
      ball.setAttribute('cx', bx); ball.setAttribute('cy', by);
      shine.setAttribute('cx', bx - 4); shine.setAttribute('cy', by - 5);
      ball.style.opacity = shine.style.opacity = hidden ? 0 : 1;
      const holdX = flying || hidden ? rest.x : bx, holdY = flying || hidden ? rest.y : by;
      for (const [line, tip] of [[bandBack, tips[0]], [bandFront, tips[1]]]) {
        line.setAttribute('x1', tip.x); line.setAttribute('y1', tip.y); line.setAttribute('x2', holdX); line.setAttribute('y2', holdY);
      }
      dots.replaceChildren();
      let glow = null;
      if (aiming && Math.hypot(pull.x, pull.y) >= MIN) {
        const { hit, path } = trace();
        glow = hit;
        // a dot every 18 px along the path (every third point), smaller further away
        for (let i = 4; i < path.length; i += 3) {
          dots.append(make('circle', { cx: path[i][0], cy: path[i][1], r: Math.max(2.2, 4.5 - i / 45), class: hit ? 'on' : '' }));
        }
      }
      if (glow !== target) {
        target?.node.classList.remove('og-hedef');
        glow?.node.classList.add('og-hedef');
        target = glow;
      }
    };
    const at = e => { const s = sky.getBoundingClientRect(); return { x: e.clientX - s.left, y: e.clientY - s.top }; };
    const setPull = e => {
      const p = at(e);
      let dx = p.x - rest.x, dy = Math.max(p.y - rest.y, -6);
      // always shoot upwards: the pull goes down, at most about 70° to a side
      if (dy < Math.abs(dx) * 0.36) dy = Math.abs(dx) * 0.36;
      const len = Math.hypot(dx, dy);
      if (len > MAX) { dx *= MAX / len; dy *= MAX / len; }
      pull = { x: dx, y: dy };
    };
    let pointer = null;
    pad.addEventListener('pointerdown', e => {
      if (bitti() || flying || back > 0 || pointer !== null) return;
      pointer = e.pointerId;
      try { pad.setPointerCapture(e.pointerId); } catch {}
      aiming = true;
      setPull(e);
      playCue('tap', { gain: 0.35 });
      e.preventDefault();
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === pointer && aiming) { setPull(e); e.preventDefault(); } });
    const release = (e, shoot) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      const strong = Math.hypot(pull.x, pull.y) >= MIN;
      aiming = false;
      if (shoot && strong && !bitti()) {
        const d = direction(), speed = Math.max(1100, H * 3.2);
        flying = { x: rest.x + pull.x, y: rest.y + pull.y, vx: d.x * speed, vy: d.y * speed, bounces: 0 };
        playCue('tap', { gain: 0.8 });
      }
      pull = { x: 0, y: 0 };
    };
    pad.addEventListener('pointerup', e => release(e, true));
    pad.addEventListener('pointercancel', e => release(e, false));
    layout();
    // the ball wobbles once at the start: pull me
    let hint = 0.9;
    return {
      aiming: () => aiming,
      step(dt) {
        if (sky.clientWidth !== W || sky.clientHeight !== H) layout();
        if (hint > 0 && !aiming && !flying) { hint = Math.max(0, hint - dt); pull = { x: Math.sin(hint * 14) * 9 * hint, y: 10 * Math.sin(Math.min(1, hint * 2) * Math.PI) }; if (!hint) pull = { x: 0, y: 0 }; }
        if (back > 0) back = Math.max(0, back - dt);
        if (flying) {
          // small steps, so a fast ball never jumps over a balloon
          const steps = Math.ceil(Math.hypot(flying.vx, flying.vy) * dt / 9) || 1;
          for (let i = 0; i < steps && flying; i++) {
            flying.x += flying.vx * dt / steps; flying.y += flying.vy * dt / steps;
            // the sides of the sky send the ball back (a few times, then it is a miss)
            const wall = flying.x < R ? R : flying.x > W - R ? W - R : null;
            if (wall !== null) {
              flying.x = 2 * wall - flying.x; flying.vx = -flying.vx;
              if (++flying.bounces > BOUNCES) { flying = null; back = 0.2; break; }
              playCue('tap', { gain: 0.3 });
            }
            const b = live().find(b => inside(b, flying.x, flying.y));
            if (b) { flying = null; back = 0.25; vur(b); }
            else if (flying.y < -30 || flying.x < -30 || flying.x > W + 30) { flying = null; back = 0.2; }
          }
        }
        draw();
      },
      remove() { svg.remove(); pad.remove(); }
    };
  }

  /* ---------- 🎈 Balon Patlat (also Yanlış Avı's, with the meaning written under the picture) ----------
     Balloons float up and down the sky swaying on their strings, always in sight, until the right one is popped:
     tapped, or hit with the slingshot's ball (sapan). */
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
        const starts = shuffled([0.1, 0.65, 0.35, 0.9].slice(0, set.length));
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
            x0: lane * (lanes[i] + 0.5) - bw / 2, y: 4, lift: Math.asin(starts[i] * 2 - 1), spin: (Math.PI * 2) / (8 + Math.random() * 4) * (i % 2 ? 1 : -1),
            f: 1.1 + Math.random() * 0.6, phase: Math.random() * 6, state: 'fly' };
        });
        let sling = null;
        const stop = frames((dt, t) => {
          const h = sky.clientHeight;
          // the balloons slow down while the slingshot is pulled, so a child can aim
          const pace = sling?.aiming() ? 0.3 : 1;
          for (const b of balloons) {
            if (b.state === 'gone' || b.state === 'popped') continue;
            if (b.state === 'away') {
              // the round is won: the others fly off
              b.y -= h * 1.2 * dt;
              if (b.y < -b.bh - 10) { b.state = 'gone'; b.node.remove(); continue; }
            } else {
              // they float up and down inside the sky and never leave it, slowing down gently at the top and the bottom
              const top = 4, bottom = Math.max(top, h - b.bh - 70);
              b.lift += b.spin * dt * pace;
              b.y = top + (bottom - top) * (0.5 + 0.5 * Math.sin(b.lift));
            }
            const sway = Math.sin(t * b.f + b.phase);
            const bx = Math.max(10, Math.min(sky.clientWidth - b.bw - 10, b.x0 + sway * 4));
            b.node.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px) rotate(' + (sway * 4).toFixed(1) + 'deg)';
            b.path.setAttribute('d', 'M12 0Q' + (12 - sway * 10).toFixed(1) + ' 35 ' + (12 + sway * 4).toFixed(1) + ' 70');
          }
          for (const c of clouds) {
            c.x += c.v * dt;
            if (c.x > sky.clientWidth + 20) c.x = -140;
            c.node.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
          }
          sling?.step(dt);
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
        // a balloon is chosen by a tap or by the slingshot's ball
        const choose = async b => {
            if (over || b.state !== 'fly') return;
            if (b.w === item) {
              over = true;
              const from = relTo(b.body, sky);
              pop(b, true);
              x.sonuc(item, first);
              for (const other of balloons) if (other.state === 'fly') { other.state = 'away'; other.node.disabled = true; }
              // the balloon's picture grows into the middle of the sky while the answer voice says the word
              const shown = buyut(sky, item, from);
              await x.praise(item.en);
              await x.wait(700);
              await shown.kapat();
              stop();
              resolve();
            } else {
              first = false;
              pop(b, false);
              await x.oops(item.en);
            }
        };
        for (const b of balloons) b.node.onclick = () => choose(b);
        sling = sapan(sky, { hedefler: balloons, vur: choose, bitti: () => over });
        x.wait(300).then(() => { if (!over && first) x.say(item.en); });
      });
    }
  }
  // The right balloon's picture, from where the balloon was to the middle of the sky, growing, with the word under it.
  function buyut(sky, item, from) {
    const card = el('div', 'og-buyuk', (item.emo ? resimKarti(item.emo) : '') + '<b lang="en">' + esc(item.en) + '</b>');
    sky.append(card);
    const dx = from.x - sky.clientWidth / 2, dy = from.y - sky.clientHeight / 2;
    card.animate([
      { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.25)', opacity: 0.4 },
      { transform: 'translate(-50%, -50%) scale(1.08)', opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
    ], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'forwards' });
    sparkle(card, { count: 14, spread: 110 });
    return {
      kapat: () => card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%, -50%) scale(.9)' }], { duration: 250, fill: 'forwards' })
        .finished.then(() => card.remove(), () => card.remove())
    };
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

  /* ---------- 🃏 Sesli Hafıza: a sound card and its picture card ----------
     Both cards say the word when they open. Cards open one after another without waiting: a third tap closes a pair
     that did not match at once, and a found pair is praised while the child goes on. */
  async function hafiza(x, items) {
    x.game.innerHTML = '';
    const grid = el('div', 'og-memory' + (items.length > 3 ? '' : ' small'));
    x.game.append(grid);
    let open = [], found = 0, closing = null;
    await new Promise(resolve => {
      const shut = pair => {
        clearTimeout(closing);
        closing = null;
        for (const o of pair) if (!o.node.classList.contains('matched')) o.node.classList.remove('open');
      };
      grid.append(...shuffled(items.flatMap(item => [{ item, sound: true }, { item, sound: false }])).map(card => {
        const node = button('og-mem', '<span class="og-back" aria-hidden="true">❓</span><span class="og-face" aria-hidden="true">' + (card.sound ? '🔊' : resimKarti(card.item.emo)) + '</span>',
          card.sound ? 'Ses kartı' : 'Resim kartı');
        node.onclick = async () => {
          if (node.classList.contains('open') || node.classList.contains('matched')) return;
          // two cards that did not match are still showing: they close now, and this card opens
          if (open.length === 2) { shut(open); open = []; }
          node.classList.add('open');
          playCue('tap', { gain: 0.5 });
          const said = x.say(card.item.en);   // true when the word was heard to the end
          open.push({ node, card });
          if (open.length < 2) return;
          const [a, b] = open;
          if (a.card.item === b.card.item) {
            open = [];
            for (const n of [a.node, b.node]) { n.classList.add('matched'); n.disabled = true; }
            sparkle(b.node, { count: 10, spread: 60 });
            // matching a word to its picture is knowing it; a miss in a memory game is only memory
            x.sonuc(a.card.item, true);
            found++;
            if (found === items.length) {
              await said;
              await x.praise(a.card.item.en);
              await x.wait(600);
              resolve();
            } else {
              said.then(heard => { if (heard) x.praise(); });   // after the word, unless the child has tapped on
            }
          } else {
            const pair = open;
            closing = setTimeout(() => { if (open === pair) { shut(pair); open = []; } }, 1400);
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
      const node = button('og-food', pic(w.emo), w.tr);
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
        sparkle(basket, { symbols: [kelimeResimleri.cizim(target.emo) ? '★' : target.emo, '✦', '❤️'], count: 12, spread: 80 });
        x.sonuc(target, first);
        // "Yummy!", a pause, then the food in the answer voice: one after the other, never together
        await x.praise(target.en, YUMMY);
        x.react(true, '😋');
        await x.wait(500);
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
      const scene = item.emo ? el('div', 'og-scene', resimKarti(item.emo)) : null;   // what the sentence is about
      const track = el('div', 'og-track', '<i class="og-rails"></i>');
      const train = el('div', 'og-train');
      train.innerHTML = LOKOMOTIF + words.map((w, i) => '<span class="og-wagon" style="--c:' + wagonColours[i % wagonColours.length] + '"><i class="og-coupler"></i>' +
        '<b class="og-word" aria-hidden="true" lang="en">' + esc(w) + '</b>' +
        '<svg class="og-ww l" viewBox="0 0 20 20" aria-hidden="true">' + wheel(10, 10, 8.5) + '</svg><svg class="og-ww r" viewBox="0 0 20 20" aria-hidden="true">' + wheel(10, 10, 8.5) + '</svg></span>').join('');
      track.append(train);
      const chips = el('div', 'og-chips');
      x.game.append(...[talk, scene, meaning, track, chips].filter(Boolean));
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
              // a little jolt back, then away to the left, faster and faster, while the sentence is praised and said
              const drive = (async () => {
                await roll(6, 16, 260, easeOut, 1000);
                await roll(16, -(train.offsetWidth * scale + 40), 2600, easeIn, 150);
              })();
              await x.praise(item.en);
              await drive;
              await x.wait(400);
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
      const sc = sahne(q, x.c.rich, x.c.resimBul);
      card.innerHTML = (q.m ? '<div class="soru-passage">' + x.c.rich(q.m) + '</div>' : '') + (sc ? sc.gorsel : '') +
        '<h3 class="og-q">' + (sc ? sc.metin : (x.c.stem || x.c.rich)(q.s)) + '</h3>';
      // a dialogue asks only its question: the answer is what the child chooses, said afterwards in the answer voice
      const d = ingilizceSes.diyalog(item.en), bare = t => t.replace(/[^a-z]/gi, '').toLowerCase();
      const asked = d ? d[0] : item.en;
      const hear = d ? true : !q.a.some(a => bare(a).includes(bare(item.en)));
      if (hear) card.append(voiceRow(x, asked, false));
      const options = el('div', 'og-options');
      card.append(options);
      const note = el('div', 'og-note');
      card.append(note);
      x.game.append(card);
      let first = true;
      await new Promise(resolve => {
        options.append(...shuffled([0, 1, 2, 3]).map(n => {
          const b = button('og-option', (x.c.secenek || x.c.rich)(q.a[n]));
          b.onclick = async () => {
            if (n === 0) {
              for (const o of options.children) o.disabled = true;
              b.classList.add('right');
              sparkle(b, { count: 12, spread: 70 });
              x.sonuc(item, first);
              note.innerHTML = '<p><span aria-hidden="true">💡</span> ' + x.c.rich(q.b) + '</p>';
              const go = button('primary og-next', 'Devam ▶');
              go.onclick = () => { x.sus(); resolve(); };
              note.append(go);
              // a card under its own picture: the picture shrinks to make room for the explanation and Devam, which is then
              // scrolled into view if the screen is still too short
              card.classList.add('cevaplandi');
              if (q.r) setTimeout(() => go.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 350);
              go.focus({ preventScroll: true });
              x.praise(item.en);
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
        if (hear) x.wait(300).then(() => { if (first && !options.querySelector('.right')) x.say(asked); });
      });
    }
  }

  /* ---------- 🔍 Gizli Kelimeler ----------
     A big picture of a place (ayar.sahneler[q.g], the island's sahneler.js); the voice says "Find the teacher!" and the
     child taps her. A tap is right when the thing in front at that point is the asked word (friend: either child, its
     icinde). A tap on something else
     names it ("No! This is a pupil.") and asks again; the question then counts as missed at the first try. A tap on
     nothing only says "Try again". */
  const yerOf = (scene, en) => scene.yerler.find(y => y.en === en);
  const insideShape = (s, px, py) => {
    if (s.length === 4) return px >= s[0] && px <= s[0] + s[2] && py >= s[1] && py <= s[1] + s[3];
    let inside = false;
    for (let i = 0, j = s.length - 2; i < s.length; j = i, i += 2) {
      const xi = s[i], yi = s[i + 1], xj = s[j], yj = s[j + 1];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  async function gizli(x, items) {
    const scene = x.c.ayar.sahneler[items[0].q.g];
    const whole = s => s.length === 4 && s[0] <= 0 && s[1] <= 0 && s[2] >= scene.w && s[3] >= scene.h;
    const svgNS = 'http://www.w3.org/2000/svg';
    x.game.innerHTML = '';
    const row = el('div', 'og-voice');
    // the line being said, written letter by letter as long as it takes to say it
    const yazi = el('p', 'og-yazi');
    yazi.lang = 'en';
    let typing = 0;
    const yaz = async (text, slow = false) => {
      const mine = ++typing;
      const secs = await ingilizceSes.sure(text, slow);
      if (mine !== typing) return;
      yazi.textContent = '';
      const shown = el('span', 'og-yazi-on'), rest = el('span', 'og-yazi-off', esc(text));
      yazi.append(shown, rest);
      const chars = [...text], step = Math.max(25, secs * 900 / chars.length);
      for (let i = 1; i <= chars.length; i++) {
        if (mine !== typing || !yazi.isConnected) return;
        shown.textContent = chars.slice(0, i).join('');
        rest.textContent = chars.slice(i).join('');
        await x.wait(step);
      }
    };
    const soyle = (text, slow) => { yaz(text, slow); return x.say(text, slow); };
    const box = el('div', 'og-sahne');
    box.style.aspectRatio = scene.w + ' / ' + scene.h;
    box.style.setProperty('--oran', scene.w / scene.h);
    const img = el('img');
    img.src = scene.resim + '?v=1';
    img.alt = '';
    img.draggable = false;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + scene.w + ' ' + scene.h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    box.append(img, svg);
    // a picture marked yazisiz (sahneler.js) is only heard: the line is not written
    x.game.append(...(scene.yazisiz ? [row, box] : [row, yazi, box]));
    // a place's outline (not the whole picture), drawn for a moment: green when right, red when wrong
    const show = (place, cls, ms) => {
      const drawn = place.sekil.filter(s => !whole(s)).map(s => {
        const node = document.createElementNS(svgNS, s.length === 4 ? 'rect' : 'polygon');
        if (s.length === 4) { node.setAttribute('x', s[0]); node.setAttribute('y', s[1]); node.setAttribute('width', s[2]); node.setAttribute('height', s[3]); node.setAttribute('rx', 24); }
        else node.setAttribute('points', s.join(' '));
        node.setAttribute('class', 'og-yer ' + cls);
        svg.append(node);
        return node;
      });
      if (ms) setTimeout(() => drawn.forEach(n => n.remove()), ms);
      return drawn.length;
    };
    // a ring where the finger touched (when the place is the whole picture, or nothing)
    const ring = (px, py, cls) => {
      const node = document.createElementNS(svgNS, 'circle');
      node.setAttribute('cx', px); node.setAttribute('cy', py); node.setAttribute('r', 46);
      node.setAttribute('class', 'og-yer ' + cls);
      svg.append(node);
      setTimeout(() => node.remove(), 1100);
    };
    for (const item of items) {
      if (!x.live.on) return;
      const place = yerOf(scene, item.en);
      row.innerHTML = '';
      row.append(...voiceRow(x, place.bul, true, slow => yaz(place.bul, slow)).children);
      let first = true, busy = false;
      await new Promise(resolve => {
        box.onpointerdown = async e => {
          if (busy || !x.live.on) return;
          const r = img.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width * scene.w, py = (e.clientY - r.top) / r.height * scene.h;
          const hits = scene.yerler.filter(y => y.sekil.some(s => insideShape(s, px, py)));
          // the thing in front is what was touched; a place's own parts (icinde: friend → boy, girl) count as the place
          const top = hits.find(y => !(place.icinde || []).includes(y.en));
          if (top === place) {
            busy = true;
            const own = { ...place, sekil: place.sekil.filter(s => !whole(s)) };
            if (!show(own, 'right')) ring(px, py, 'right');
            const host = el('span', 'og-isaret');
            host.style.left = px / scene.w * 100 + '%';
            host.style.top = py / scene.h * 100 + '%';
            box.append(host);
            sparkle(host, { count: 14, spread: 80 });
            x.sonuc(item, first);
            await x.praise(item.en);
            await x.wait(700);
            host.remove();
            svg.innerHTML = '';
            resolve();
          } else if (hits.length) {
            first = false;
            const other = top || hits[0];
            if (!show({ ...other, sekil: other.sekil.filter(s => insideShape(s, px, py)) }, 'wrong', 1300)) ring(px, py, 'wrong');
            const s = x.seq();
            x.react(false, '🤔');
            playCue('retry');
            if (!(await s.wait(200))) return;
            yaz(other.bu);
            await s.say(other.bu);
            if (await s.wait(300)) { yaz(place.bul); await s.say(place.bul); }
          } else {
            ring(px, py, 'wrong');
            x.oops();
          }
        };
        x.wait(300).then(() => { if (first && !busy) soyle(place.bul); });
      });
    }
    box.onpointerdown = null;
  }

  const OYUNLAR = {
    gizli: { simge: '🔍', ad: 'Gizli Kelimeler', oyna: gizli },
    dinle: { simge: '👂', ad: 'Dinle ve Bul', oyna: dinle },
    balon: { simge: '🎈', ad: 'Balon Patlat', oyna: (x, items) => balonlar(x, items) },
    hafiza: { simge: '🃏', ad: 'Sesli Hafıza', oyna: hafiza },
    boya: { simge: '🎨', ad: 'Sihirli Boyama', oyna: boya },
    sepet: { simge: '🧺', ad: 'Meyve Sepeti', oyna: sepet },
    tren: { simge: '🚂', ad: 'Kelime Treni', oyna: tren },
    kart: { simge: '🎴', ad: 'Bilgi Kartı', oyna: kart }
  };

  // The game lines said in the answer voice ('b'), for tools/ingilizce_sesler.py.
  function metinlerB() {
    const out = new Set();
    for (const thing of Object.keys(RESIMLER)) for (const [colour] of RENKLER) out.add('The ' + thing + ' is ' + colour + '!');
    return [...out];
  }
  // Every English line the games can say, for tools/ingilizce_sesler.py.
  function metinler(ayar = {}) {
    const out = new Set([...OVGU, ...TEKRAR, YUMMY, BITTI]);
    for (const food of ayar.sepet || []) out.add(sepetCumle(food));
    for (const thing of Object.keys(RESIMLER)) for (const [colour] of RENKLER) { out.add(boyaCumle(thing, colour)); out.add('The ' + thing + ' is ' + colour + '!'); }
    for (const [colour] of RENKLER) out.add(colour);
    for (const scene of Object.values(ayar.sahneler || {})) for (const y of scene.yerler) { out.add(y.bul); out.add(y.bu); }
    return [...out];
  }
  /* ---------- the picture above a question (Bilgi Kartı and the question rounds) ----------
     sahne(q, rich, resimBul) gives { gorsel, metin } for a question of İngilizce Koyu, or null:
       a dialogue to answer ("Evet diyerek cevap ver: “Is this a library?”"): the asking child and the question on the
         left, what it is about in the middle, the answering child on the right with ✅/❌ and the answer to choose blank;
       a dialogue to understand (“Who is he?” “He’s my brother.” O kim?): both children and both lines, no picture
         (it would give the answer);
       a word to listen to ("Dinle ve doğru anlamı seç: “desk”"): the word on a big card; "🔊 Dinle …": a big 🎧;
       a word to say ("🏛️📚 Resme bak: …"): the picture, big, in the middle.
       a question with a drawn dialogue of its own (r): that picture, wide, over the question;
     resimBul(text) gives the picture of the island's word named in a text ("Is it a classroom?" → 🟩🪑). */
  const isEnglish = t => !/[çğıöşüÇĞİÖŞÜ]/.test(t) && /[a-z]/i.test(t);
  const sign = /❓|👎|✖️|✔️/gu;
  const big = emo => '<div class="sahne-resim">' + resimKarti(emo) + '</div>';
  const kisi = (yuz, balon, cls = '') => '<div class="sahne-kisi"><span class="sahne-yuz" aria-hidden="true">' + yuz + '</span><span class="sahne-balon' + cls + '" lang="en">' + balon + '</span></div>';
  function sahne(q, rich, resimBul = () => '') {
    const s = q.s, kpic = (q.k?.[2] || '').replace(sign, '').trim();
    let m;
    // a drawn dialogue of its own (r): the picture already holds the question's speech bubble, so the stem keeps only the instruction;
    // a small picture at the start of the stem ("[[y-today-tuesday]] Resme bak: …") gives way to the big one
    if (q.r) {
      m = s.match(/^(Evet diyerek cevap ver|Hayır diyerek cevap ver|Soruya doğru cevabı ver): “[^”]+”$/);
      return { gorsel: '<div class="sahne-foto"><img src="assets/images/ingilizce/' + esc(q.r) + '.webp?v=2" alt="" draggable="false"></div>',
        metin: m ? esc(m[1]) + '.' : rich(s.replace(/^(\S+) (?=\S)/, (all, first) => /\p{Extended_Pictographic}|\[\[/u.test(first) ? '' : all)) };
    }
    if ((m = s.match(/^(Evet diyerek cevap ver|Hayır diyerek cevap ver|Soruya doğru cevabı ver): “([^”]+)”$/)) && q.a.every(isEnglish)) {
      const d = q.k && ingilizceSes.diyalog(q.k[0]);
      const resim = (d && kpic) || resimBul(m[2]) || kpic;
      const cevap = /^Yes,/.test(q.a[0]) ? '✅ Yes, ……' : /^No,/.test(q.a[0]) ? '❌ No, ……' : '……';
      return { gorsel: '<div class="sahne">' + kisi('👧', esc(m[2])) + (resim ? big(resim) : '<div></div>') + kisi('👦', cevap, ' cevap') + '</div>',
        metin: esc(m[1]) + '.' };
    }
    if ((m = s.match(/^“([^”]+\?)” “([^”]+)” (.+)$/)) && isEnglish(m[1]) && isEnglish(m[2]))
      return { gorsel: '<div class="sahne iki">' + kisi('👧', esc(m[1])) + '<div></div>' + kisi('👦', esc(m[2])) + '</div>', metin: rich(m[3]) };
    if ((m = s.match(/^Dinle ve doğru anlamı seç: “([^”]+)”$/)))
      return { gorsel: '<div class="sahne-kart" lang="en"><span aria-hidden="true">🔊</span>' + esc(m[1]) + '</div>', metin: 'Dinle ve doğru anlamı seç.' };
    if (/^🔊 Dinle ve doğru olanı seç\.$/.test(s)) return { gorsel: '<div class="sahne-resim dinle" aria-hidden="true">🎧</div>', metin: 'Dinle ve doğru olanı seç.' };
    if ((m = s.match(/^(\S+) (Resme bak: .+|.+\?)$/)) && /\p{Extended_Pictographic}|\[\[/u.test(m[1])) return { gorsel: big(m[1]), metin: rich(m[2]) };
    return null;
  }

  /* ---------- Keşif Kartı: a station's words before its first round ----------
     kesif(c): c = { stage, kelimeler: [{ en, tr, emo }], maskot, baslik, son (the last button's label), bitti() }.
     One word at a time: a big picture, the English word said (and the Turkish meaning in the device's Turkish voice, when it
     has one), 🔊 and 🐢; tapping the picture bounces it and says the word again. A bar of steps on top with the player's
     icon walking along, and Atla ⏭ to go straight on. Returns a stop function. */
  function trSoyle(text) {
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      const voice = synth?.getVoices().find(v => /^tr/i.test(v.lang));
      if (!synth || !voice || typeof SpeechSynthesisUtterance === 'undefined') return resolve(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR'; u.voice = voice; u.rate = 0.95;
      u.onend = u.onerror = () => resolve(true);
      synth.speak(u);
    });
  }
  function kesif(c) {
    const live = { on: true };
    const words = c.kelimeler, n = words.length;
    let at = 0, flow = 0;
    c.stage.innerHTML = '<div class="og-kesif"><div class="ok-top"><div class="ok-bar" aria-hidden="true">' +
      words.map(() => '<i></i>').join('') + '<b class="ok-me">' + esc(c.maskot || '🦊') + '</b></div></div>' +
      '<p class="ok-baslik">' + esc(c.baslik || '') + '</p><div class="ok-kart" aria-live="polite"></div><div class="ok-alt"></div></div>';
    const root = c.stage.querySelector('.og-kesif'), bar = root.querySelector('.ok-bar'), me = root.querySelector('.ok-me');
    const kart = root.querySelector('.ok-kart'), alt = root.querySelector('.ok-alt');
    const skip = button('ok-atla', 'Atla ⏭', 'Kelimeleri atla, oyuna geç');
    root.querySelector('.ok-top').append(skip);
    const next = button('primary ok-next', '');
    alt.append(next);
    const end = () => { if (!live.on) return; live.on = false; ingilizceSes.stop(); c.bitti(); };
    skip.onclick = end;
    // the word, then its meaning; a newer tap or the next word cuts in
    const say = async (w, slow = false) => {
      const mine = ++flow;
      ingilizceSes.stop();
      await ingilizceSes.say(w.en, slow);
      if (mine !== flow || !live.on) return;
      await wait(250);
      if (mine === flow && live.on) await trSoyle(w.tr);
    };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    function show() {
      const w = words[at];
      [...bar.querySelectorAll('i')].forEach((dot, i) => { dot.className = i < at ? 'done' : i === at ? 'now' : ''; });
      const dot = bar.querySelectorAll('i')[at];
      requestAnimationFrame(() => { me.style.left = dot.offsetLeft + dot.offsetWidth / 2 + 'px'; });
      bar.setAttribute('aria-label', (at + 1) + ' / ' + n);
      kart.innerHTML = '';
      const pic = button('ok-resim', resimKarti(w.emo), w.en + ', yeniden dinle');
      pic.onclick = () => { pic.classList.remove('hop'); void pic.offsetWidth; pic.classList.add('hop'); say(w); };
      const en = el('p', 'ok-en', esc(w.en)); en.lang = 'en';
      const tr = el('p', 'ok-tr', esc(w.tr));
      const row = el('div', 'og-voice');
      const loud = button('soru-say big', '🔊', 'Dinle'); loud.onclick = () => { fx.bump(loud, 'show'); say(w); };
      const slow = button('soru-say slow', '🐢', 'Yavaş dinle'); slow.onclick = () => { fx.bump(slow, 'show'); say(w, true); };
      row.append(loud, slow);
      kart.append(pic, en, tr, row);
      next.innerHTML = at < n - 1 ? 'Sıradaki 👉' : esc(c.son || 'Oyuna Başla! 🚀');
      next.focus({ preventScroll: true });
      say(w);
    }
    next.onclick = () => {
      if (!live.on) return;
      playCue('tap', { gain: 0.6 });
      if (at < n - 1) { at++; show(); } else end();
    };
    ingilizceSes.hazirla(words.map(w => w.en));
    show();
    return () => { live.on = false; ++flow; ingilizceSes.stop(); };
  }

  return { tur, kesif, balonTuru: (c) => turBalon(c), metinler, metinlerB, resimli, SOYUT, sahne };

  // Balon Patlat for Yanlış Avı: one game of balloons over the given words (with written meanings).
  function turBalon(c) {
    const live = { on: true };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    c.stage.innerHTML = '<div class="og-head"><span class="og-mascot" aria-hidden="true"><b>' + esc(c.maskot || '🦊') + '</b><i class="og-bubble"></i></span>' +
      '<span class="og-where"><span aria-hidden="true">🎈</span> Balon Patlat</span><span class="og-stars"></span></div><div class="og-game"></div>';
    const game = c.stage.querySelector('.og-game'), mascot = c.stage.querySelector('.og-mascot'), bubble = c.stage.querySelector('.og-bubble');
    let right = 0;
    const react = (good, word) => { mascot.classList.remove('happy', 'sad'); void mascot.offsetWidth; mascot.classList.add(good ? 'happy' : 'sad'); bubble.textContent = word; };
    const x = { c, wait, live, game, react, ...konusmaci(live, react),
      sonuc: (item, ok) => { if (ok) right++; c.sonuc(item, ok); } };
    ingilizceSes.hazirla([...OVGU, ...TEKRAR, ...c.items.map(i => i.en)]);
    (async () => {
      await balonlar(x, c.items, { yazili: true });
      if (live.on) c.bitir(right, c.items.length);
    })();
    return () => { live.on = false; ingilizceSes.stop(); };
  }
})();
