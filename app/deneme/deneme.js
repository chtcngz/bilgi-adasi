// Deneme Odası: Elif Ba Adası için önerilen oyunların ilk, oynanabilir taslakları.
// Oyuncu profili, yıldız ya da ilerleme kullanmaz, hiçbir şey saklamaz. Harf ve hece sesleri oyunun
// kayıtlarından (elifVoice), Hece Treni'nin kelime kayıtları deneme/ses/ klasöründen gelir.
(() => {
  const { glyphs, names, harekeler, syllable, sameSound, coves, coveLetters } = elifData;
  const V = elifVoice;
  const lab = $('lab');
  const turtleSvg = id => elifArt.turtle(id);
  const pick = items => items[Math.floor(Math.random() * items.length)];
  function shuffled(items) {
    const r = [...items];
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; };
  const ar = (text, cls = '') => '<b lang="ar" dir="rtl" class="ar ' + cls + '">' + text + '</b>';
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const later = [];
  const wait = (ms, fn) => { const t = setTimeout(fn, ms); later.push(t); return t; };
  function clearLater() { while (later.length) clearTimeout(later.pop()); }

  /* ---------- Ses: oyunun kayıtları ve deneme/ses/ ---------- */
  const cache = new Map();
  let clipRun = 0, clipNode = null, clipEl = null;
  function stopClip() {
    clipRun++;
    if (clipNode) { clipNode.onended = null; try { clipNode.stop(); } catch {} clipNode = null; }
    if (clipEl) { clipEl.pause(); clipEl = null; }
  }
  function stopAll() { stopClip(); V.stop(); }
  function playClip(src, then) {
    V.stop(); stopClip();
    const mine = clipRun;
    const next = guarded(then, 6000);
    const done = () => { if (mine === clipRun) next?.(); };
    const ctx = playCue.context?.();
    const viaElement = () => {
      const a = new Audio(src); clipEl = a;
      a.onended = done; a.onerror = done;
      a.play()?.catch(done);
    };
    if (!ctx) return viaElement();
    if (!cache.has(src)) cache.set(src, fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
      .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej))).catch(() => { cache.delete(src); return null; }));
    Promise.all([ctx.state === 'running' ? null : ctx.resume().catch(() => {}), cache.get(src)]).then(([, buf]) => {
      if (mine !== clipRun) return;
      if (!buf || ctx.state !== 'running') return viaElement();
      const n = ctx.createBufferSource();
      n.buffer = buf; n.connect(ctx.destination);
      n.onended = () => { n.disconnect(); if (clipNode === n) { clipNode = null; done(); } };
      clipNode = n; n.start();
    });
  }
  // Ses hiç çalınamazsa (cihazda Türkçe ses yoksa) oyun beklemede kalmasın: en geç birkaç saniye sonra devam edilir.
  function guarded(then, ms = 3000) {
    if (!then) return undefined;
    let over = false;
    const go = () => { if (!over) { over = true; then(); } };
    wait(ms, go);
    return go;
  }
  const sayLetter = (i, then) => { stopClip(); V.letter(i, null, guarded(then)); };
  const saySyllable = (i, h, then) => { stopClip(); V.syllable(i, h, null, guarded(then)); };
  const sayText = (text, then) => { stopClip(); V.say(text, null, guarded(then)); };

  const clips = {
    kelime: ['خَلَقَ', 'فَتَحَ', 'دَخَلَ', 'شَجَرَ', 'جَعَلَ', 'تَرَكَ', 'ثَمَرَ', 'بَلَغَ', 'نَزَلَ', 'كَسَبَ']
  };
  const wordClip = w => 'deneme/ses/kelime-' + clips.kelime.indexOf(w) + '.mp3';


  /* ---------- Ortak parçalar ---------- */
  // Kaplumbağa ve konuşma balonu; balona dokununca yönerge tekrar okunur.
  function guide(id) {
    const box = el('div', 'lab-guide');
    box.innerHTML = '<div class="lab-turtle">' + turtleSvg('lab-' + id) + '</div><button type="button" class="lab-bubble" data-cue>' +
      elifArt.speaker + '<span></span></button>';
    const bubble = box.querySelector('.lab-bubble');
    let again = null;
    bubble.onclick = () => again?.();
    return {
      box,
      set(text, replay) { bubble.querySelector('span').innerHTML = text; again = replay || null; bubble.classList.toggle('mute', !replay); },
      mood(name) {
        const t = box.querySelector('.lab-turtle');
        t.classList.remove('happy', 'sad'); void t.offsetWidth;
        if (name) t.classList.add(name);
      },
      talk(on) { box.classList.toggle('talk', on); }
    };
  }
  function dotsRow(total) {
    const row = el('ol', 'lab-steps');
    row.innerHTML = Array.from({ length: total }, () => '<li></li>').join('');
    return { row, mark(n) { Array.from(row.children).forEach((li, k) => { li.className = k < n ? 'got' : k === n ? 'now' : ''; }); } };
  }
  function finale(screen, text, again) {
    const box = el('div', 'lab-finale', '<div class="lab-trophy">🏆</div><h2>' + text + '</h2>');
    const replay = el('button', 'lab-primary', '🔁 Tekrar oyna'); replay.onclick = again;
    const home = el('button', 'lab-secondary', '🏠 Deneme Odası'); home.onclick = showHub;
    box.append(replay, home);
    screen.append(box);
    playCue('victory');
    fx.confetti(document.body, { count: 110 });
  }


  /* ---------- Oyun listesi ---------- */
  // Akvaryum 0.16.0'da oyuna girdi; Nokta Ustası, Harf Bukalemunu, Taş Atlama ve Kumda Yaz denemeden çıkarıldı.
  const games = [
    {
      id: 'kabuk', icon: '🐚', title: 'Kabuk Hafızası', tag: 'Küçükler için en kolayı', where: 'Mola oyunu',
      lead: 'Kapalı kabukları aç, sesini dinle, aynı iki harfi bul ve inci yap.',
      idea: ['Kumsalda kapalı deniz kabukları var. Çocuk iki kabuk açıyor ve her açılan kabuk sesini çıkarıyor. Aynı iki harfi bulunca kabuklar inci oluyor.',
        'Zorluk adım adım artabilir: önce harf ile aynı harfi, sonra harf ile 🔊 sesini, en sonda harekeli hece ile okunuşunu eşleştirmek.',
        'Okul öncesi çocuklar bu oyunu çok sever. Can kaybı yok, bu yüzden rahatlatıcı bir mola olur.', 'Yapması en hızlı oyun bu.'],
      start: startShells
    },
    {
      id: 'tren', icon: '🚂', title: 'Hece Treni', tag: 'Kelime okumaya köprü', where: 'Cezm · Kelime ve âyet',
      lead: 'Kelimenin hece vagonlarını sağdan sola lokomotife tak, tren kalksın.',
      idea: ['Kaplumbağa bir kelime okuyor, örneğin خَلَقَ. Çocuk hece vagonlarını doğru sırayla, sağdan sola lokomotife takıyor. Tren kalkınca kelimenin Diyanet kaydı çalıyor.',
        'Okuma yönünü (sağdan sola) oyunla öğretiyor. Elifba\'da çocukların takıldığı yerlerden biri de bu.',
        'Arşivde zaten kelime kayıtları var: Fetha uygulamasında فَتَحَ, خَلَقَ, دَخَلَ, شَجَرَ gibi yaklaşık 100 kelime; Cezm dersinde de وِرَ → وِرْ → وِرْدًا gibi adım adım kayıtlar.',
        'İleride Cezm ve "Kelime ve âyet" bölümlerinin oyunu olur.'],
      start: startTrain
    },
    {
      id: 'giydir', icon: '🎩', title: 'Harekeyi Giydir', tag: 'Yeni fikir', where: 'Harekeler adımı',
      lead: 'Kaplumbağa bir hece söylüyor; harfe doğru harekeyi giydir.',
      idea: ['Ekranda harekesiz bir harf var. Kaplumbağa bir hece söylüyor (örneğin "Be ötre"), çocuk üstün, esre ve ötreden doğrusunu harfe giydiriyor: üstün ve ötre şapka gibi harfin üstüne, esre ayakkabı gibi altına oturuyor.',
        'Hece Balonları sesten heceyi buldurur; bu oyun tersini yapar ve harekeyi çocuğun kendisine kurdurur. Harekenin harfin neresine konduğunu da öğretir.',
        'Yanlış hareke giydirilince o hece okunur ("Bu Be esre oldu"), çocuk iki sesin farkını duyar.',
        'Yeni kayıt gerekmiyor; mevcut 84 hece kaydı yetiyor. Harekeler adımına ikinci oyun olarak eklenebilir.'],
      start: startDress
    },
    {
      id: 'kolye', icon: '📿', title: 'İnci Kolye', tag: 'Yeni fikir', where: 'Harfler · koy sonu',
      lead: 'Koyun dört harfini Elif Ba sırasıyla ipe diz, kolyeyi tamamla.',
      idea: ['Her koyun dört harfi, Elif Ba sırasıyla bir inci kolyeye diziliyor. İpin başında bir önceki koyun son harfi duruyor (örneğin د), çocuk sıradaki inciyi (ذ) bulup takıyor.',
        'Elif Ba sırası derste ezberlenir ve çocuklar harfleri sırayla sayarak hatırlar; oyun bu sırayı koylarla birlikte öğretir.',
        'Aralarına başka koylardan iki "şaşırtmaca" inci karışıyor. Her inciye dokununca adı okunur; kolye tamamlanınca dört harf sırayla okunur.',
        'Yeni kayıt gerekmiyor. Her koyun Harfler adımının sonuna ya da Cam Köprü\'den önceye küçük bir bulmaca olarak eklenebilir.'],
      start: startNecklace
    },
    {
      id: 'dedektif', icon: '🔎', title: 'Harf Dedektifi', tag: 'Kelime içinde harf', where: 'Bitişik yazılış',
      lead: 'İpucunu oku, kelimeyi sağdan sola izle ve aranan harfi bul.',
      idea: ['Aynı harf kelimenin içinde farklı görünebilir. Çocuk bir kelimeyi bütün olarak görür ve verilen konumdaki harfi tek başına yazılan üç harf arasından seçer.',
        'Çözümde kelime yerinde kalır. Aranan harf renklenir ve harfin adı dinlenebilir.'],
      start: screen => startWorkshop(screen, false)
    },
    {
      id: 'bag', icon: '🧵', title: 'Bağ Atölyesi', tag: 'Harfleri birleştir', where: 'Bitişik yazılış',
      lead: 'İki harfi incele. Yan yana geldiklerinde aralarında çizgi oluşacak mı?',
      idea: ['İki harf önce ayrı kartlarda görülür. Çocuk aralarında bağ oluşup oluşmayacağını tahmin eder.',
        'Çözümde iki harf birlikte yazılır. Aynı iki harfin yer değiştirdiği tur çiftleri, okuma yönünün bağı nasıl değiştirdiğini gösterir.'],
      start: screen => startWorkshop(screen, true)
    },
    {
      id: 'album', icon: '📖', title: 'İlk Harf Albümüm', tag: 'İlk tanışma', where: 'Harfler',
      lead: 'Bir koy seç. Dört harfin kartlarını aç, adlarını dinle ve şekillerini incele.',
      idea: ['Her sayfada dört harf var. Kartı açınca harf büyür, adı duyulur ve şekline dair küçük bir gözlem görünür.',
        'Çocuk istediği karta dönebilir. Yedi sayfada 28 harfin hepsini kendi hızında keşfeder.'],
      start: startAlbum
    },
    {
      id: 'buyutec', icon: '🔬', title: 'Harf Büyüteci', tag: 'Benzer harfleri ayırt et', where: 'Harfler',
      lead: 'Önce benzer harflerle tanış. Sonra şekil ipucunu dinleyip gizli harfi bul.',
      idea: ['Her turda benzer gövdeli iki ya da üç harf yan yana durur. Kartlara dokunarak adlarını dinleyebilirsin.',
        'Bulmacayı açınca adlar gizlenir. Noktanın yeri veya sayısı hangi harfi aradığını söyler.'],
      start: startMagnifier
    }
  ];

  /* ---------- Ana sayfa ---------- */
  function showHub() {
    stopAll(); clearLater();
    document.title = 'Deneme Odası · Bilgi Adası';
    lab.className = 'lab-hub';
    lab.innerHTML = '<div class="lab-intro"><h1>Deneme <em>Odası</em></h1>' +
      '<p>Elif Ba Adası için önerilen oyunların ilk taslakları. Bu sayfaya oyunun içinden bağlantı yok; ' +
      'buradaki denemeler oyuncuların yıldızlarını ve ilerlemesini etkilemez.</p>' +
      '<p class="lab-live">🐠 <b>Akvaryum</b> oyuna girdi: Elif Ba Adası\'nda, Harekeler adımında öğrenilen her harf için bir balık geliyor.</p></div>';
    const grid = el('div', 'lab-grid');
    games.forEach((g, n) => {
      const card = el('button', 'lab-card');
      card.innerHTML = '<span class="lab-card-icon">' + g.icon + '</span><span class="lab-card-text"><small>' + (n + 1) + ' · ' + g.tag +
        '</small><strong>' + g.title + '</strong><span>' + g.lead + '</span><em>📍 ' + g.where + '</em></span><span class="lab-go">▶</span>';
      card.onclick = () => openGame(g);
      grid.append(card);
    });
    lab.append(grid);
    scrollTo(0, 0);
  }
  function openGame(g) {
    stopAll(); clearLater();
    document.title = g.title + ' · Deneme Odası';
    lab.className = 'lab-play lab-' + g.id;
    lab.innerHTML = '';
    const bar = el('div', 'lab-bar');
    const back = el('button', 'lab-back', '← Odaya dön'); back.onclick = showHub;
    bar.append(back, el('h1', '', g.icon + ' ' + g.title));
    const idea = el('details', 'lab-idea', '<summary>💡 Öneri</summary><ul>' + g.idea.map(t => '<li>' + t + '</li>').join('') + '</ul>');
    const screen = el('div', 'lab-screen');
    lab.append(bar, idea, screen);
    scrollTo(0, 0);
    g.start(screen);
  }


  /* =========================================================
     1. Kabuk Hafızası
     ========================================================= */
  function startShells(screen) {
    const levels = [
      { name: 'Harf · Harf', hint: 'Aynı iki harfi bul.', pairs: 4 },
      { name: 'Harf · 🔊 Ses', hint: 'Harfi ve onun sesini bul.', pairs: 4 },
      { name: 'Hece · 🔊 Ses', hint: 'Harekeli heceyi ve okunuşunu bul.', pairs: 5 }
    ];
    let level = 0;
    const g = guide('kabuk');
    const tabs = el('div', 'lab-tabs');
    const beach = el('div', 'shell-beach');
    const note = el('p', 'lab-note');
    screen.append(g.box, tabs, beach, note);
    levels.forEach((lv, k) => {
      const b = el('button', '', (k + 1) + '. ' + lv.name);
      b.onclick = () => { level = k; build(); };
      tabs.append(b);
    });
    let open = [], found = 0, cards = [], moves = 0;
    function build() {
      clearLater(); stopAll();
      Array.from(tabs.children).forEach((b, k) => b.classList.toggle('on', k === level));
      const lv = levels[level];
      // Seçilen öğeler: harf indeksi ya da (harf, hareke). Aynı okunan heceler aynı tahtada olmaz.
      let items = [];
      if (level < 2) items = shuffled([...Array(28).keys()]).slice(0, lv.pairs).map(i => ({ i }));
      else {
        for (const i of shuffled([...Array(28).keys()])) {
          const h = Math.floor(Math.random() * 3);
          if (items.some(o => o.i === i || sameSound(o.i, o.h, i, h))) continue;
          items.push({ i, h });
          if (items.length === lv.pairs) break;
        }
      }
      const face = it => it.h === undefined ? glyphs[it.i] : syllable(it.i, it.h);
      cards = shuffled(items.flatMap((it, key) => [
        { key, it, show: face(it) },
        { key, it, show: level === 0 ? face(it) : null }
      ]));
      open = []; found = 0; moves = 0;
      beach.innerHTML = '';
      beach.style.setProperty('--cols', cards.length > 8 ? 5 : 4);
      cards.forEach((c, n) => {
        const b = el('button', 'shell');
        b.type = 'button';
        b.dataset.cue = '';
        b.innerHTML = '<span class="shell-back" aria-hidden="true"></span><span class="shell-face">' +
          (c.show ? ar(c.show) : '<span class="shell-sound">' + elifArt.speaker + '</span>') + '</span>';
        b.setAttribute('aria-label', 'Kapalı kabuk ' + (n + 1));
        b.onclick = () => flip(c, b);
        c.node = b;
        beach.append(b);
      });
      g.mood();
      g.set(lv.hint + ' Bir kabuğa dokun.', null);
      note.textContent = 'Can yok, acele yok. Kabuklar açılınca sesini çıkarır.';
    }
    const speak = (c, then) => c.it.h === undefined ? sayLetter(c.it.i, then) : saySyllable(c.it.i, c.it.h, then);
    function flip(c, b) {
      if (c.done) { speak(c); return; }
      if (open.includes(c) || open.length === 2) return;
      open.push(c);
      b.classList.add('open');
      playCue('pop');
      speak(c);
      if (open.length < 2) return;
      moves++;
      const [a, d] = open;
      if (a.key === d.key) {
        wait(700, () => {
          for (const x of open) { x.done = true; x.node.classList.add('pearl'); }
          open = [];
          found++;
          playCue('correct');
          g.mood('happy');
          fx.burst(d.node, { count: 10, symbols: ['✦', '•', '○'] });
          g.set('İnci oldu! ' + (a.it.h === undefined ? '<b>' + names[a.it.i] + '</b>' : '<b>' + names[a.it.i] + ' ' + hareke(a.it.h) + '</b>'), () => speak(a));
          if (found === cards.length / 2) wait(900, () => {
            g.set(moves + ' denemede bütün kabukları inci yaptın!', null);
            finale(screen, 'Bütün kabuklar inci oldu!', build);
          });
        });
      } else {
        wait(1500, () => {
          for (const x of open) x.node.classList.remove('open');
          open = [];
        });
      }
    }
    build();
  }

  /* =========================================================
     2. Hece Treni
     ========================================================= */
  // Bir kelimeyi harf + hareke hecelerine böler.
  function syllables(word) {
    const parts = [];
    for (const ch of word) {
      if (/[ً-ْ]/.test(ch) && parts.length) parts[parts.length - 1] += ch;
      else parts.push(ch);
    }
    return parts.map(text => ({ text, i: glyphs.indexOf(text[0]) }));
  }
  function startTrain(screen) {
    const g = guide('tren');
    const words = shuffled(clips.kelime).slice(0, 5);
    const steps = dotsRow(words.length);
    const track = el('div', 'train-track');
    const yard = el('div', 'train-yard');
    const note = el('p', 'lab-note', '⬅ Arapça <b>sağdan sola</b> okunur: ilk hece lokomotifin hemen arkasına takılır.');
    const actions = el('div', 'lab-actions');
    const again = el('button', 'lab-secondary', '🔊 Kelimeyi dinle');
    actions.append(again);
    screen.append(g.box, steps.row, track, yard, actions, note);
    let n = 0, parts, at, busy;
    const word = () => words[n];
    const sayWord = then => { g.talk(true); playClip(wordClip(word()), () => { g.talk(false); then?.(); }); };
    again.onclick = () => sayWord();
    function draw() {
      steps.mark(n);
      parts = syllables(word());
      at = 0; busy = false;
      track.classList.remove('go');
      // Sağda lokomotif, solunda boş vagon yerleri (dir=rtl).
      track.innerHTML = '<div class="train" dir="rtl"><span class="loco" aria-hidden="true">🚂</span>' +
        parts.map(() => '<span class="slot"></span>').join('') + '</div><div class="rails"></div>';
      yard.innerHTML = '';
      shuffled(parts.map((p, k) => ({ ...p, k }))).forEach(p => {
        const w = el('button', 'wagon', ar(p.text));
        w.type = 'button'; w.dataset.cue = '';
        w.onclick = () => tap(p, w);
        yard.append(w);
      });
      g.mood();
      g.set('Kelimeyi dinle, vagonları sırayla tak.', () => sayWord());
      wait(400, () => sayWord());
    }
    function tap(p, w) {
      if (busy || w.disabled) return;
      saySyllable(p.i, 0);
      if (p.text !== parts[at].text) {
        playCue('oops'); g.mood('sad'); fx.bump(w, 'lab-shake');
        g.set('Bu sıradaki hece değil. Kelimeyi bir daha dinle.', () => sayWord());
        return;
      }
      w.disabled = true; w.classList.add('used');
      const slot = track.querySelectorAll('.slot')[at];
      slot.innerHTML = ar(p.text);
      slot.classList.add('on');
      playCue('key');
      at++;
      if (at < parts.length) { g.mood('happy'); g.set('Güzel! Sıradaki vagon hangisi?', () => sayWord()); return; }
      busy = true;
      g.set('Tren hazır! ' + ar(word()), () => sayWord());
      wait(500, () => {
        playCue('correct');
        sayWord(() => {
          track.classList.add('go');
          playCue('start');
          wait(1800, () => {
            n++;
            if (n < words.length) draw();
            else { steps.mark(words.length); finale(screen, 'Beş treni de yola çıkardın!', () => openGame(games[1])); }
          });
        });
      });
    }
    draw();
  }

  /* =========================================================
     3. Harekeyi Giydir
     ========================================================= */
  function startDress(screen) {
    const ROUNDS = 8;
    const g = guide('giydir');
    const steps = dotsRow(ROUNDS);
    const stage = el('div', 'dress-stage');
    const marks = el('div', 'dress-marks');
    const actions = el('div', 'lab-actions');
    const listen = el('button', 'lab-secondary', '🔊 Heceyi dinle');
    actions.append(listen);
    const note = el('p', 'lab-note', 'Üstün ve ötre harfin üstüne, esre altına giyilir.');
    screen.append(g.box, steps.row, stage, marks, actions, note);
    // Sıra: her tur başka bir harf, üç hareke dengeli dağılsın.
    const order = shuffled([...Array(28).keys()]).slice(0, ROUNDS).map((i, k) => ({ i, h: k % 3 }));
    order.forEach(o => { o.h = (o.h + Math.floor(Math.random() * 3)) % 3; });
    let round = 0, busy = false;
    const target = () => order[round];
    const ask = () => { g.talk(true); saySyllable(target().i, target().h, () => g.talk(false)); };
    listen.onclick = ask;
    function bare() { stage.innerHTML = '<div class="dress-letter">' + ar(glyphs[target().i]) + '</div>'; }
    function draw() {
      busy = false;
      steps.mark(round);
      bare();
      marks.innerHTML = '';
      [0, 1, 2].forEach(k => {
        const b = el('button', 'dress-mark ' + (k === 1 ? 'low' : 'high'), ar('◌' + harekeler[k].mark) + '<span>' + hareke(k) + '</span>');
        b.type = 'button'; b.dataset.cue = '';
        b.onclick = () => wear(k, b);
        marks.append(b);
      });
      g.mood();
      g.set('Dinle ve harfe doğru harekeyi giydir!', ask);
      wait(350, ask);
    }
    function wear(k, b) {
      if (busy) return;
      busy = true;
      const { i, h } = target();
      stage.innerHTML = '<div class="dress-letter worn ' + (k === 1 ? 'low' : 'high') + '">' + ar(syllable(i, k)) + '</div>';
      playCue('key');
      if (k === h) {
        g.mood('happy');
        g.set('Harika! <b>' + names[i] + ' ' + hareke(h) + '</b>', ask);
        saySyllable(i, h, () => {
          playCue('correct');
          fx.burst(stage, { count: 12 });
          wait(900, () => {
            round++;
            if (round < ROUNDS) draw();
            else { steps.mark(ROUNDS); finale(screen, 'Bütün harfleri giydirdin!', () => openGame(games[2])); }
          });
        });
      } else {
        g.mood('sad');
        fx.bump(b, 'lab-shake');
        g.set('Bu <b>' + names[i] + ' ' + hareke(k) + '</b> oldu. Kaplumbağa ne dedi, bir daha dinle.', ask);
        saySyllable(i, k, () => wait(300, () => {
          playCue('oops');
          bare();
          busy = false;
          ask();
        }));
      }
    }
    draw();
  }

  /* =========================================================
     4. İnci Kolye
     ========================================================= */
  function startNecklace(screen) {
    const g = guide('kolye');
    const steps = dotsRow(coves.length);
    const title = el('h2', 'neck-title');
    const string = el('div', 'neck-string');
    const tray = el('div', 'neck-tray');
    const note = el('p', 'lab-note', 'İnciler sağdan sola, Elif Ba sırasıyla dizilir. İnciye dokununca adını duyarsın.');
    screen.append(g.box, steps.row, title, string, tray, note);
    let k = 0, at = 0, busy = false, letters = [];
    const chain = (list, then, n = 0) => n < list.length ? sayLetter(list[n], () => wait(120, () => chain(list, then, n + 1))) : then?.();
    function draw() {
      busy = false;
      at = 0;
      steps.mark(k);
      letters = coveLetters(k);
      const start = k > 0 ? letters[0] - 1 : null;
      title.textContent = (k + 1) + '. ' + coves[k];
      string.innerHTML = '<i class="neck-cord"></i>' + (start !== null ? '<span class="pearl start">' + ar(glyphs[start]) + '</span>' : '<span class="pearl clasp">🪝</span>') +
        letters.map(() => '<span class="pearl empty"></span>').join('');
      const others = shuffled([...Array(28).keys()].filter(i => !letters.includes(i) && i !== start)).slice(0, 2);
      tray.innerHTML = '';
      shuffled([...letters, ...others]).forEach(i => {
        const b = el('button', 'pearl loose', ar(glyphs[i]));
        b.type = 'button'; b.dataset.cue = '';
        b.onclick = () => pick(i, b);
        tray.append(b);
      });
      const ask = () => start !== null
        ? (g.talk(true), sayLetter(start, () => g.talk(false)))
        : (g.talk(true), sayText('Elif', () => g.talk(false)));
      g.mood();
      g.set(start !== null ? '<b>' + names[start] + '</b> harfinden sonra hangisi gelir? Kolyeyi tamamla!' : 'Elif Ba <b>Elif</b> ile başlar. Kolyeyi tamamla!', ask);
      wait(300, ask);
    }
    function pick(i, b) {
      if (busy || b.disabled) return;
      sayLetter(i);
      if (i !== letters[at]) {
        playCue('oops'); g.mood('sad'); fx.bump(b, 'lab-shake');
        const before = at ? letters[at - 1] : k > 0 ? letters[0] - 1 : null;
        g.set(before !== null ? '<b>' + names[before] + '</b> harfinden sonra bu gelmez. Bir daha düşün!' : 'Elif Ba bununla başlamaz. Bir daha düşün!', null);
        return;
      }
      b.disabled = true; b.classList.add('used');
      const spot = string.querySelectorAll('.pearl.empty')[0];
      spot.className = 'pearl on';
      spot.innerHTML = ar(glyphs[i]);
      playCue('key'); g.mood('happy');
      at++;
      if (at < letters.length) { g.set('Güzel! Sonra hangisi?', null); return; }
      busy = true;
      g.set('Kolye tamam! Dinle: ' + letters.map(x => ar(glyphs[x], 'small')).reverse().join(' '), () => chain(letters));
      wait(400, () => chain(letters, () => {
        playCue('correct');
        fx.burst(string, { count: 14, symbols: ['✦', '•', '○'] });
        wait(1200, () => {
          k++;
          if (k < coves.length) draw();
          else { steps.mark(coves.length); finale(screen, 'Yedi koyun kolyesi tamam: 28 harf sırayla!', () => openGame(games[3])); }
        });
      }));
    }
    draw();
  }

  // Each word contains three letters. The index follows Arabic reading order.
  const clues = [
    ['قلم', 'kalem', 0, 'فغ'], ['جبل', 'dağ', 1, 'تن'], ['قمر', 'ay', 2, 'زد'],
    ['نهر', 'ırmak', 0, 'بت'], ['سمك', 'balık', 1, 'هع'], ['شمس', 'güneş', 2, 'شص'],
    ['عسل', 'bal', 0, 'غح'], ['تمر', 'hurma', 1, 'فه'], ['بيت', 'ev', 2, 'ثب']
  ];
  const joins = ['با', 'لد', 'سر', 'نذ', 'مز', 'كو'];
  const breaks = 'ادذرزو';
  const letterName = ch => names[glyphs.indexOf(ch)];

  function startWorkshop(screen, joining) {
    const game = games.find(item => item.id === (joining ? 'bag' : 'dedektif'));
    const rounds = joining
      ? shuffled(joins).slice(0, 3).flatMap(pair => shuffled([pair, [...pair].reverse().join('')]))
      : [0, 1, 2].flatMap(pos => shuffled(clues.filter(row => row[2] === pos)).slice(0, 2));
    const steps = dotsRow(rounds.length);
    const sheet = el('section', 'work-sheet');
    const prompt = el('h2', 'work-prompt');
    prompt.tabIndex = -1;
    const sample = el('div', 'work-sample');
    sample.dir = 'rtl';
    const caption = el('p', 'work-caption');
    const choices = el('div', 'work-choices');
    const feedback = el('p', 'work-feedback');
    feedback.setAttribute('role', 'status');
    const next = el('button', 'lab-primary');
    sheet.append(prompt, sample, caption, choices, feedback, next);
    screen.append(steps.row, sheet);
    let round = 0;

    function draw() {
      steps.mark(round);
      const item = rounds[round];
      const [word, meaning, pos, distractors] = joining ? [] : item;
      const place = ['ilk', 'ortadaki', 'son'][pos];
      const connected = joining && !breaks.includes(item[0]);
      const target = joining ? (connected ? 'Bağlanır' : 'Ayrı kalır') : word[pos];
      const options = joining ? ['Bağlanır', 'Ayrı kalır'] : shuffled([target, ...distractors]);
      prompt.textContent = joining ? 'Bu iki harf birbirine bağlanır mı?' : 'Kelimedeki ' + place + ' harf hangisi?';
      sample.innerHTML = joining ? [...item].map(ch => ar(ch, 'tile')).join('') : ar(word);
      caption.textContent = joining ? 'Sağdan sola oku. Önce ' + letterName(item[0]) + ', sonra ' + letterName(item[1]) + '.' : 'Kelimenin anlamı · ' + meaning;
      choices.replaceChildren();
      feedback.textContent = '';
      next.hidden = true;
      options.forEach(option => {
        const button = el('button', 'work-choice', joining ? option : ar(option));
        if (!joining) button.setAttribute('aria-label', letterName(option));
        button.onclick = () => {
          if (option !== target) {
            if (joining) {
              feedback.textContent = 'İlk harfe bak. Elif, Dal, Zel, Ra, Ze ve Vav kendilerinden sonraki harfe bağlanmaz. Tekrar dene.';
            } else {
              const location = ['sağ ucuna', 'ortasına', 'sol ucuna'][pos];
              feedback.textContent = 'Seçtiğin harf ' + letterName(option) + '. Kelimenin ' + location + ' bir daha bak.';
            }
            button.disabled = true;
            playCue('retry');
            return;
          }
          for (const choice of choices.children) choice.disabled = true;
          button.classList.add('solved');
          if (joining) {
            sample.innerHTML = ar(item);
            feedback.textContent = letterName(item[0]) + (connected ? ' sonraki harfe bağlanır. İki harfin arasındaki çizgiyi izle.' : ' sonraki harfe bağlanmaz. İki harfin arasında boşluk kalır.');
          } else {
            sample.innerHTML = ar([...word].map((ch, index) => index === pos ? '<mark>' + ch + '</mark>' : ch).join(''));
            feedback.textContent = 'Buldun! ' + letterName(target) + ' bu kelimenin ' + place + ' harfi.';
            sayLetter(glyphs.indexOf(target));
          }
          if (joining) playCue('correct');
          next.hidden = false;
          next.focus();
        };
        choices.append(button);
      });
      next.textContent = round === rounds.length - 1 ? 'Turu tamamla' : 'Sıradaki bulmaca →';
      if (round > 0) prompt.focus();
    }
    next.onclick = () => {
      stopAll();
      if (++round < rounds.length) return draw();
      steps.mark(round);
      sheet.remove();
      finale(screen, joining ? 'Altı harf çiftinin bağını çözdün!' : 'Altı gizli harfi de buldun!', () => openGame(game));
    };
    draw();
  }

  // Shape cues describe isolated letters in the order used by elifData.
  const shapeHints = [
    'Tek bir uzun çizgi gibi durur.', 'Altında bir nokta var.', 'Üstünde iki nokta var.', 'Üstünde üç nokta var.',
    'Kıvrımının içinde bir nokta var.', 'Geniş bir kıvrımı var. Noktası yok.', 'Kıvrımının üstünde bir nokta var.',
    'Kısa, köşeli bir çizgi. Noktası yok.', 'Köşeli çizginin üstünde bir nokta var.',
    'Kuyruğu aşağı kıvrılır. Noktası yok.', 'Kıvrılan kuyruğunun üstünde bir nokta var.',
    'Küçük dişleri var. Noktası yok.', 'Küçük dişlerinin üstünde üç nokta var.',
    'Geniş, kapalı bir gözü var. Noktası yok.', 'Geniş, kapalı gözünün üstünde bir nokta var.',
    'Kapalı gövdesinden uzun bir çizgi yükselir. Noktası yok.', 'Uzun çizgisinin yanında bir nokta var.',
    'Üstte küçük bir kıvrımı var. Noktası yok.', 'Üstteki küçük kıvrımın üzerinde bir nokta var.',
    'Yuvarlak başının üstünde bir nokta var.', 'Yuvarlak başının üstünde iki nokta var.',
    'Gövdesinin içinde küçük bir işaret var.', 'Uzun çizgisi altta sola kıvrılır.',
    'Küçük bir başı ve aşağı inen bir kuyruğu var.', 'Çanağının içinde bir nokta var.',
    'Yuvarlak başından kıvrık bir kuyruk uzanır.', 'Küçük bir halka gibi durur.', 'Kıvrımının altında iki nokta var.'
  ];

  function startAlbum(screen) {
    const label = el('label', 'album-picker', 'Hangi koyu keşfedelim? ');
    const select = el('select', '');
    coves.forEach((name, k) => select.add(new Option((k + 1) + '. ' + name, k)));
    label.append(select);
    const shelf = el('div', 'work-choices');
    const page = el('div', 'work-sheet');
    const face = el('div', 'work-sample');
    const title = el('h2', '');
    const hint = el('p', 'work-caption');
    const listen = el('button', 'lab-secondary', '🔊 Adını dinle');
    page.append(face, title, hint, listen);
    screen.append(label, shelf, page);
    function draw() {
      stopAll();
      shelf.replaceChildren();
      const letters = coveLetters(Number(select.value));
      function open(i) {
        face.innerHTML = ar(glyphs[i]);
        title.textContent = names[i];
        hint.textContent = shapeHints[i];
        listen.onclick = () => sayLetter(i);
        Array.from(shelf.children).forEach((b, k) => b.setAttribute('aria-pressed', letters[k] === i));
      }
      letters.forEach(i => {
        const b = el('button', 'work-choice', ar(glyphs[i]));
        b.setAttribute('aria-label', names[i]);
        b.onclick = () => { open(i); sayLetter(i); };
        shelf.append(b);
      });
      open(letters[0]);
    }
    select.onchange = draw;
    draw();
  }

  function startMagnifier(screen) {
    const families = glyphs.map((_, i) => [i, ...elifData.twins(i)])
      .filter(group => group.length > 1 && group[0] === Math.min(...group));
    const rounds = shuffled(families).slice(0, 4);
    const steps = dotsRow(rounds.length);
    const sheet = el('section', 'work-sheet');
    const title = el('h2', 'work-prompt');
    const choices = el('div', 'work-choices');
    const note = el('p', 'work-feedback');
    note.setAttribute('role', 'status');
    const listen = el('button', 'lab-secondary', '🔊 İpucunu dinle');
    const action = el('button', 'lab-primary');
    const actions = el('div', 'lab-actions');
    actions.append(listen, action);
    sheet.append(title, choices, note, actions);
    screen.append(steps.row, sheet);
    let round = 0;
    function draw() {
      stopAll();
      const family = rounds[round];
      const target = pick(family);
      steps.mark(round);
      title.textContent = 'Harfleri karşılaştır';
      note.textContent = 'Her karta dokun. Harfin adını dinlerken şekline bak.';
      listen.hidden = true;
      function cards(quiz) {
        choices.replaceChildren();
        for (const i of quiz ? shuffled(family) : family) {
          const b = el('button', 'work-choice', ar(glyphs[i]) + (quiz ? '' : '<small>' + names[i] + '</small>'));
          b.setAttribute('aria-label', names[i]);
          b.onclick = () => {
            sayLetter(i);
            if (!quiz || i !== target) {
              note.textContent = names[i] + ' · ' + shapeHints[i] + (quiz ? ' İpucuna bir daha bak.' : '');
              if (quiz) b.disabled = true;
              return;
            }
            for (const card of choices.children) card.disabled = true;
            b.classList.add('solved');
            note.textContent = 'Buldun! ' + names[i] + ' · ' + shapeHints[i];
            listen.hidden = true;
            action.hidden = false;
            action.textContent = round + 1 === rounds.length ? 'Turu tamamla' : 'Yeni harf ailesi →';
            action.onclick = () => {
              if (++round < rounds.length) return draw();
              stopAll();
              steps.mark(round);
              sheet.remove();
              finale(screen, 'Dört harf ailesini keşfettin!', () => openGame(games.find(g => g.id === 'buyutec')));
            };
            action.focus();
          };
          choices.append(b);
        }
      }
      cards(false);
      action.hidden = false;
      action.textContent = 'Bulmacayı aç';
      action.onclick = () => {
        title.textContent = shapeHints[target];
        note.textContent = 'Bu ipucu hangi harfi anlatıyor?';
        action.hidden = true;
        listen.hidden = false;
        listen.onclick = () => sayText(shapeHints[target]);
        listen.focus();
        listen.onclick();
        cards(true);
      };
    }
    draw();
  }

  // Adres #kabuk, #tren … ise o oyun doğrudan açılır.
  const direct = games.find(g => '#' + g.id === location.hash);
  if (direct) openGame(direct); else showHub();
  addEventListener('hashchange', () => { const g = games.find(x => '#' + x.id === location.hash); if (g) openGame(g); else showHub(); });
})();
