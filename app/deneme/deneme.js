// Deneme Odası: Elif Ba Adası için önerilen oyunların ilk, oynanabilir taslakları.
// Oyuncu profili, yıldız ya da ilerleme kullanmaz; yalnızca akvaryum kendi anahtarında
// (elif-deneme-akvaryum) saklanır. Harf ve hece sesleri oyunun kayıtlarından (elifVoice),
// kelime, harf şekli ve tenvin kayıtları deneme/ses/ klasöründen gelir.
(() => {
  const { glyphs, names, harekeler, syllable, sameSound } = elifData;
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
    const done = () => { if (mine === clipRun) then?.(); };
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
  const sayLetter = (i, then) => { stopClip(); V.letter(i, null, then); };
  const saySyllable = (i, h, then) => { stopClip(); V.syllable(i, h, null, then); };
  const sayText = (text, then) => { stopClip(); V.say(text, null, then); };

  const clips = {
    kelime: ['خَلَقَ', 'فَتَحَ', 'دَخَلَ', 'شَجَرَ', 'جَعَلَ', 'تَرَكَ', 'ثَمَرَ', 'بَلَغَ', 'نَزَلَ', 'كَسَبَ'],
    sekil: ['عبد', 'بعث', 'طبع', 'جعل', 'يجحد', 'الحج', 'هلك', 'فهم', 'وجه', 'فتح', 'كفر', 'نصف']
  };
  const wordClip = w => 'deneme/ses/kelime-' + clips.kelime.indexOf(w) + '.mp3';
  const shapeClip = w => 'deneme/ses/sekil-' + clips.sekil.indexOf(w) + '.mp3';
  const tenvinClip = (i, h) => 'deneme/ses/tenvin-' + String(i).padStart(2, '0') + '-' + h + '.mp3';

  /* ---------- Akvaryum: her başarılı harf için bir balık ---------- */
  const fishKey = 'elif-deneme-akvaryum';
  let fish = [];
  try { fish = (JSON.parse(localStorage.getItem(fishKey)) || []).filter(i => Number.isInteger(i) && i >= 0 && i < 28); } catch {}
  function saveFish() { try { localStorage.setItem(fishKey, JSON.stringify(fish)); } catch {} drawFishCount(); }
  function drawFishCount() { $('fish-count').textContent = '🐠 ' + fish.length + '/28'; }
  function toast(html) {
    const t = $('lab-toast');
    t.innerHTML = html;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  }
  function addFish(i) {
    if (fish.includes(i)) return;
    fish.push(i); saveFish();
    toast('🐠 Akvaryuma yeni balık: ' + ar(glyphs[i]) + ' <span>' + names[i] + '</span>');
  }
  drawFishCount();

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
  const games = [
    {
      id: 'nokta', icon: '🔍', title: 'Nokta Ustası', tag: 'En zor yeri hedefliyor', where: 'Harfler adımı',
      lead: 'Noktasız harf iskeletine deniz taşı noktaları sürükle, harfi canlandır.',
      idea: ['Ekranda noktasız bir harf iskeleti var (ٮ). Kaplumbağa "Te" diyor, çocuk deniz taşı gibi duran noktaları sürükleyip harfin üstüne ya da altına bırakıyor. Doğru yerleşince harf canlanıp kendi adını okuyor.',
        'Çocukların en çok karıştırdığı ب ت ث, ج ح خ, س ش gibi harf ailelerini doğrudan çalıştırıyor. Bu aileler oyunun harf verisinde (elifData.twins) zaten tanımlı.',
        'Yeni kayıt gerekmiyor, mevcut harf sesleri yetiyor.', 'Harfler adımına yeni bir oyun olarak eklenebilir.'],
      start: startDots
    },
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
      id: 'bukalemun', icon: '🦎', title: 'Harf Bukalemunu', tag: 'Bitişik yazılış için', where: 'Bitişik yazılış (Yakında)',
      lead: 'Harf kelimenin başında, ortasında, sonunda başka görünür. Saklanan harfi bul.',
      idea: ['Bir harf kelimenin başında, ortasında ve sonunda farklı görünüyor. Kaplumbağa "Ayn\'ı bul" diyor, çocuk kelimenin içinde saklanan harfe dokunuyor ve o harf parlıyor.',
        'Arşivde bu ders hazır: harfler/sekilleri klasöründe "Kelimenin Başında / Ortasında / Sonunda" kayıtları var.',
        'Şu an "Yakında" görünen Bitişik yazılış bölümünün oyunu olabilir.'],
      start: startChameleon
    },
    {
      id: 'tas', icon: '🐢', title: 'Taş Atlama', tag: 'Hızlı oyunla bulmaca arası', where: 'Tenvin',
      lead: 'Duyduğun heceyi taşın üstünde bul, kaplumbağa yuvasına ulaşsın.',
      idea: ['Kaplumbağa denizdeki taşlardan karşı kıyıya, yuvasına geçmeye çalışıyor. Her adımda bir hece duyuluyor ve doğru taşa basınca ilerliyor. Yanlış taş batıyor ama kaplumbağa yüzüp geri dönüyor.',
        'Hareke ve tenvin farkı için çok uygun: بَ / بً / بٌ yan yana taşlarda durabilir.',
        'Arşivde tenvin dersleri hazır: Fetha, Kesra ve Damme tenvinleri için toplam yaklaşık 270 kayıt.'],
      start: startStones
    },
    {
      id: 'kum', icon: '✏️', title: 'Kumda Yaz', tag: 'En zahmetlisi · sona bırakılabilir', where: 'Harfler',
      lead: 'Parmağınla kesik çizginin üstünden harfi çiz, dalga gelip silsin.',
      idea: ['Çocuk parmağıyla harfi kumun üstünde kesik çizgilerin üzerinden çiziyor, dalga gelip yazıyı siliyor.',
        'Çocuklar çizmeyi çok sever ama bu en zahmetli fikir, çünkü 28 harfin çizim yolları tek tek hazırlanmalı. Sona bırakılabilir.',
        'Bu denemede yalnızca dört harfin (ا ب ت ن) çizim yolu var.'],
      start: startSand
    },
    {
      id: 'akvaryum', icon: '🐠', title: 'Akvaryum', tag: 'Bütün oyunlar için', where: 'Ödül koleksiyonu',
      lead: 'Her tamamlanan harf için koya bir balık gelir; dokununca harfini söyler.',
      idea: ['Kabuk ve inci ödülleri zaten var. Bunlara ek olarak her tamamlanan harf için koya bir deniz canlısı eklenebilir: dokununca o harfi söyleyen bir balık.',
        'Çocuklar için "koleksiyonumu tamamlayayım" duygusu çok güçlü bir motivasyon. Oyunlara her gün geri dönmeyi sağlar.',
        'Bu odadaki oyunlarda başarılan her harf akvaryuma bir balık ekliyor (yalnızca bu sayfada saklanır).'],
      start: startAquarium
    }
  ];

  /* ---------- Ana sayfa ---------- */
  function showHub() {
    stopAll(); clearLater();
    document.title = 'Deneme Odası · Bilgi Adası';
    lab.className = 'lab-hub';
    lab.innerHTML = '<div class="lab-intro"><h1>Deneme <em>Odası</em></h1>' +
      '<p>Elif Ba Adası için önerilen oyunların ilk taslakları. Bu sayfaya oyunun içinden bağlantı yok; ' +
      'buradaki denemeler oyuncuların yıldızlarını ve ilerlemesini etkilemez.</p></div>';
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
     1. Nokta Ustası
     ========================================================= */
  // Üç iskelet; her harf, iskeletin üstüne (ust) ve altına/içine (alt) konan nokta sayısıyla tanımlı.
  const skeletons = {
    be: { path: 'M182 52C186 96 160 106 118 106L84 106C40 106 20 94 22 62', zones: { ust: [100, 40], alt: [100, 140] } },
    ha: { path: 'M58 50C84 40 118 40 150 48 112 58 84 78 76 102 68 132 104 146 150 136', zones: { ust: [104, 20], alt: [118, 104] } },
    sin: { path: 'M184 46L184 74C184 88 160 88 160 66L160 74C160 88 136 88 136 66L136 80C136 122 96 132 62 122 34 112 30 92 34 74', zones: { ust: [160, 14], alt: [100, 150] } }
  };
  const dotLetters = [
    { i: 1, sk: 'be', ust: 0, alt: 1 }, { i: 2, sk: 'be', ust: 2, alt: 0 }, { i: 3, sk: 'be', ust: 3, alt: 0 },
    { i: 4, sk: 'ha', ust: 0, alt: 1 }, { i: 5, sk: 'ha', ust: 0, alt: 0 }, { i: 6, sk: 'ha', ust: 1, alt: 0 },
    { i: 11, sk: 'sin', ust: 0, alt: 0 }, { i: 12, sk: 'sin', ust: 3, alt: 0 }
  ];
  function startDots(screen) {
    const ROUNDS = 8;
    const g = guide('nokta');
    const steps = dotsRow(ROUNDS);
    const board = el('div', 'dot-board');
    const tray = el('div', 'dot-tray');
    const check = el('button', 'lab-primary', '✓ Tamam');
    const note = el('p', 'lab-note');
    screen.append(g.box, steps.row, board, tray, check, note);
    // Sıra: ailelerin hepsinden en az bir harf, aynı harf peş peşe değil.
    const order = [];
    let pool = [];
    while (order.length < ROUNDS) {
      if (!pool.length) pool = shuffled(dotLetters);
      const next = pool.pop();
      if (order.at(-1)?.i !== next.i) order.push(next);
    }
    let round = 0, target, placed, busy = false;
    const say = () => { g.set('<b>' + names[target.i] + '</b> harfini yap!', say); g.talk(true); sayLetter(target.i, () => g.talk(false)); };
    function draw() {
      target = order[round];
      placed = { ust: 0, alt: 0 };
      busy = false;
      steps.mark(round);
      const sk = skeletons[target.sk];
      board.innerHTML = '<svg viewBox="0 0 200 170" class="dot-skeleton" aria-hidden="true"><path d="' + sk.path + '"/></svg>' +
        '<div class="dot-done">' + ar(glyphs[target.i]) + '</div>';
      for (const [zone, [x, y]] of Object.entries(sk.zones)) {
        const z = el('button', 'dot-zone ' + zone);
        z.type = 'button';
        z.dataset.zone = zone;
        z.dataset.cue = '';
        z.setAttribute('aria-label', zone === 'ust' ? 'Harfin üstü' : 'Harfin altı');
        z.style.left = (x / 200 * 100) + '%';
        z.style.top = (y / 170 * 100) + '%';
        z.onclick = event => zoneTap(zone, event.target.tagName === 'I');
        board.append(z);
      }
      drawTray();
      drawZones();
      note.textContent = 'Noktaları sürükle ya da üste/alta dokun. Konan noktaya dokununca geri gelir.';
      say();
    }
    const left = () => 3 - placed.ust - placed.alt;
    function drawTray() {
      tray.innerHTML = '<small>Deniz taşları</small>';
      for (let k = 0; k < left(); k++) {
        const dot = el('span', 'dot-pebble');
        dot.onpointerdown = event => drag(event, dot);
        tray.append(dot);
      }
    }
    function drawZones() {
      board.querySelectorAll('.dot-zone').forEach(z => {
        const n = placed[z.dataset.zone];
        z.className = 'dot-zone ' + z.dataset.zone + ' n' + n;
        z.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
      });
    }
    // Boş yere dokunmak bir taş koyar, konmuş bir taşa dokunmak onu kumsala geri yollar.
    function zoneTap(zone, onDot) {
      if (busy) return;
      if (onDot || (!left() && placed[zone])) { placed[zone]--; playCue('erase'); }
      else if (left()) { placed[zone]++; playCue('key'); }
      else return;
      drawTray(); drawZones(); autoCheck();
    }
    // Sürükle-bırak: taş parmağı izler, bir bölgenin üstünde bırakılırsa oraya yerleşir.
    function drag(event, dot) {
      if (busy) return;
      event.preventDefault();
      const ghost = el('span', 'dot-pebble ghost');
      document.body.append(ghost);
      const move = e => { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; };
      move(event);
      dot.classList.add('lifted');
      const up = e => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        ghost.remove(); dot.classList.remove('lifted');
        const hit = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList?.contains('dot-zone'));
        if (hit && left()) { placed[hit.dataset.zone]++; playCue('key'); drawTray(); drawZones(); autoCheck(); }
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    }
    const same = l => l.sk === target.sk && l.ust === placed.ust && l.alt === placed.alt;
    function autoCheck() { if (placed.ust + placed.alt > 0 && same(target)) judge(); }
    function judge() {
      if (busy) return;
      if (same(target)) {
        busy = true;
        board.classList.add('alive');
        playCue('correct');
        g.mood('happy');
        g.set('Harika! Bu <b>' + names[target.i] + '</b>.', () => sayLetter(target.i));
        wait(350, () => sayLetter(target.i));
        fx.burst(board, { count: 14 });
        addFish(target.i);
        wait(2300, () => {
          board.classList.remove('alive');
          round++;
          if (round < ROUNDS) draw();
          else { steps.mark(ROUNDS); finale(screen, 'Bütün harfleri noktaladın!', () => openGame(games[0])); }
        });
        return;
      }
      const other = dotLetters.find(same);
      playCue('oops');
      g.mood('sad');
      fx.bump(board, 'lab-shake');
      if (other) {
        g.set('Bu <b>' + names[other.i] + '</b> oldu. Kaplumbağa <b>' + names[target.i] + '</b> istedi.', say);
        sayLetter(other.i, () => wait(250, () => sayLetter(target.i)));
      } else {
        g.set('Noktaları say: <b>' + names[target.i] + '</b> nasıl yazılıyor?', say);
        sayLetter(target.i);
      }
    }
    check.onclick = judge;
    draw();
  }

  /* =========================================================
     2. Kabuk Hafızası
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
          addFish(a.it.i);
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
     3. Hece Treni
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
      addFish(parts[0].i);
      g.set('Tren hazır! ' + ar(word()), () => sayWord());
      wait(500, () => {
        playCue('correct');
        sayWord(() => {
          track.classList.add('go');
          playCue('start');
          wait(1800, () => {
            n++;
            if (n < words.length) draw();
            else { steps.mark(words.length); finale(screen, 'Beş treni de yola çıkardın!', () => openGame(games[2])); }
          });
        });
      });
    }
    draw();
  }

  /* =========================================================
     4. Harf Bukalemunu
     ========================================================= */
  const hideouts = [
    { i: 17, words: ['عبد', 'بعث', 'طبع'] },
    { i: 4, words: ['جعل', 'يجحد', 'الحج'] },
    { i: 26, words: ['هلك', 'فهم', 'وجه'] },
    { i: 19, words: ['فتح', 'كفر', 'نصف'] }
  ];
  function startChameleon(screen) {
    const g = guide('bukalemun');
    const rounds = hideouts.flatMap(h => h.words.map(w => ({ i: h.i, w })));
    const steps = dotsRow(rounds.length);
    const card = el('div', 'cham-card');
    const forms = el('div', 'cham-forms');
    const note = el('p', 'lab-note', 'Harf kelimenin neresinde olursa olsun aynı harftir; yalnızca kılık değiştirir.');
    screen.append(g.box, steps.row, card, forms, note);
    let n = 0, busy;
    const where = (k, len) => k === 0 ? 'Kelimenin başında' : k === len - 1 ? 'Kelimenin sonunda' : 'Kelimenin ortasında';
    function draw() {
      const { i, w } = rounds[n];
      busy = false;
      steps.mark(n);
      const letters = Array.from(w);
      // Her harf ayrı bir dokunma alanı; tarayıcı harfleri yine birbirine bağlayarak yazar.
      card.innerHTML = '<div class="cham-word" lang="ar" dir="rtl">' +
        letters.map((ch, k) => '<span data-k="' + k + '">' + ch + '</span>').join('') + '</div>';
      card.querySelectorAll('span').forEach(s => { s.onclick = () => tap(Number(s.dataset.k), s, letters); });
      forms.innerHTML = '<small>Tek başına</small>' + ar(glyphs[i]);
      const ask = () => { g.talk(true); sayLetter(i, () => g.talk(false)); };
      g.mood();
      g.set('<b>' + names[i] + '</b> harfini bul! ' + ar(glyphs[i], 'small'), ask);
      ask();
    }
    function tap(k, s, letters) {
      if (busy) return;
      const { i, w } = rounds[n];
      const tapped = glyphs.indexOf(letters[k]);
      if (letters[k] !== glyphs[i]) {
        playCue('oops'); g.mood('sad');
        s.classList.remove('wrong'); void s.offsetWidth; s.classList.add('wrong');
        if (tapped >= 0) {
          g.set('Bu <b>' + names[tapped] + '</b>. Kaplumbağa <b>' + names[i] + '</b> arıyor.', () => sayLetter(i));
          sayLetter(tapped, () => wait(200, () => sayLetter(i)));
        }
        return;
      }
      busy = true;
      s.classList.add('found');
      playCue('correct'); g.mood('happy');
      addFish(i);
      g.set('Buldun! ' + where(k, letters.length) + '.', () => playClip(shapeClip(w)));
      forms.innerHTML = '<small>Tek başına</small>' + ar(glyphs[i]) + '<small>' + where(k, letters.length) + '</small>' + ar(w);
      wait(400, () => playClip(shapeClip(w), () => wait(1200, next)));
    }
    function next() {
      n++;
      if (n < rounds.length) draw();
      else { steps.mark(rounds.length); finale(screen, 'Bütün bukalemun harfleri buldun!', () => openGame(games[3])); }
    }
    draw();
  }

  /* =========================================================
     5. Taş Atlama
     ========================================================= */
  // Bir taş: aynı harfin üç harekesinden ya da üç tenvininden biri.
  const stoneLetters = [1, 2, 3, 4, 7, 9];
  const tenvinMark = ['ً', 'ٍ', 'ٌ'];
  const tenvinName = ['iki üstün', 'iki esre', 'iki ötre'];
  const stoneText = s => s.t ? glyphs[s.i] + tenvinMark[s.h] + (s.h === 0 ? 'ا' : '') : syllable(s.i, s.h);
  const stoneName = s => names[s.i] + ' ' + (s.t ? tenvinName[s.h] : hareke(s.h));
  function startStones(screen) {
    const STEPS = 7;
    const g = guide('tas');
    const sea = el('div', 'stone-sea');
    const path = el('div', 'stone-path');
    const actions = el('div', 'lab-actions');
    const listen = el('button', 'lab-secondary', '🔊 Heceyi dinle');
    actions.append(listen);
    const note = el('p', 'lab-note', 'Aynı harf; ama bir taşta hareke, ötekinde tenvin var. Kulağını aç!');
    screen.append(g.box, path, sea, actions, note);
    let step = 0, target, busy;
    const speak = (s, then) => s.t ? playClip(tenvinClip(s.i, s.h), then) : saySyllable(s.i, s.h, then);
    const ask = () => { g.talk(true); speak(target, () => g.talk(false)); };
    listen.onclick = ask;
    function drawPath() {
      path.innerHTML = Array.from({ length: STEPS }, (_, k) => '<i class="' + (k < step ? 'got' : k === step ? 'now' : '') + '"></i>').join('') + '<span>🏝️</span>';
    }
    function draw() {
      busy = false;
      drawPath();
      const i = pick(stoneLetters);
      const h = Math.floor(Math.random() * 3);
      const t = Math.random() < 0.55;
      target = { i, h, t };
      // Yanında: aynı sesli harfin öteki türü (بَ ↔ بً) ve bir başka hareke ya da tenvin.
      const twin = { i, h, t: !t };
      const others = [0, 1, 2].filter(x => x !== h).flatMap(x => [{ i, h: x, t: true }, { i, h: x, t: false }]);
      const stones = shuffled([target, twin, pick(others)]);
      sea.innerHTML = '<div class="stone-row"></div><div class="stone-turtle">' + turtleSvg('tas-swim') + '</div><div class="stone-nest">' +
        (step === STEPS - 1 ? '🏝️ Yuva' : '') + '</div>';
      const row = sea.querySelector('.stone-row');
      stones.forEach(s => {
        const b = el('button', 'stone', ar(stoneText(s)));
        b.type = 'button'; b.dataset.cue = '';
        b.onclick = () => jump(s, b);
        row.append(b);
      });
      g.mood();
      g.set('Duyduğun hecenin taşına zıpla!', ask);
      wait(350, ask);
    }
    function jump(s, b) {
      if (busy) return;
      busy = true;
      const turtle = sea.querySelector('.stone-turtle');
      const box = sea.getBoundingClientRect(), r = b.getBoundingClientRect(), tr = turtle.getBoundingClientRect();
      const dx = r.left + r.width / 2 - (tr.left + tr.width / 2), dy = r.top - tr.top - tr.height * 0.35;
      turtle.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      const ok = s.i === target.i && s.h === target.h && s.t === target.t;
      wait(480, () => {
        if (ok) {
          b.classList.add('good');
          playCue('correct'); g.mood('happy');
          g.set('Evet! <b>' + stoneName(target) + '</b>', ask);
          step++;
          if (step === STEPS) addFish(target.i);
          wait(1100, () => {
            if (step < STEPS) draw();
            else { drawPath(); finale(screen, 'Kaplumbağa yuvasına ulaştı!', () => openGame(games[4])); }
          });
        } else {
          b.classList.add('sink');
          turtle.classList.add('swim');
          playCue('splash'); g.mood('sad');
          g.set('Bu taş <b>' + stoneName(s) + '</b> idi, battı. Kaplumbağa yüzüp geri döndü. Tekrar dinle!', ask);
          speak(s);
          wait(900, () => {
            turtle.style.transform = ''; turtle.classList.remove('swim');
            b.disabled = true;
            busy = false;
            wait(600, ask);
          });
        }
      });
    }
    draw();
  }

  /* =========================================================
     6. Kumda Yaz
     ========================================================= */
  // Çizim yolları 200×200 kutuda, yazılış yönünde (sağdan sola, yukarıdan aşağı).
  const tracings = [
    { i: 0, path: 'M104 26C102 70 100 120 98 172', dots: [] },
    { i: 1, path: 'M168 82C176 132 152 140 120 140L82 140C44 140 26 128 30 94', dots: [[100, 172]] },
    { i: 2, path: 'M168 82C176 132 152 140 120 140L82 140C44 140 26 128 30 94', dots: [[86, 104], [114, 104]] },
    { i: 24, path: 'M150 76C168 150 136 166 100 166 60 166 40 140 52 96', dots: [[100, 78]] }
  ];
  function startSand(screen) {
    const g = guide('kum');
    const steps = dotsRow(tracings.length);
    const box = el('div', 'sand-box');
    const actions = el('div', 'lab-actions');
    const clear = el('button', 'lab-secondary', '🌊 Sil, baştan çiz');
    actions.append(clear);
    const note = el('p', 'lab-note', 'Kesik çizginin üstünden parmağınla çiz. Sonra noktaların yerine dokun.');
    screen.append(g.box, steps.row, box, actions, note);
    let n = 0, svg, guidePath, ink, samples, covered, stage, drawing, dotsLeft;
    const NS = 'http://www.w3.org/2000/svg';
    function draw() {
      const t = tracings[n];
      steps.mark(n);
      stage = 'line'; drawing = false;
      box.classList.remove('wave');
      box.innerHTML = '<svg viewBox="0 0 200 200" class="sand-svg"><path class="sand-guide" d="' + t.path + '"/>' +
        '<path class="sand-done" d="' + t.path + '"/><g class="sand-ink"></g><g class="sand-dots"></g>' +
        '<circle class="sand-start" r="7"/></svg><div class="sand-progress"><i></i></div>';
      svg = box.querySelector('svg');
      guidePath = svg.querySelector('.sand-guide');
      ink = svg.querySelector('.sand-ink');
      const len = guidePath.getTotalLength();
      samples = [];
      for (let d = 0; d <= len; d += 4) { const p = guidePath.getPointAtLength(d); samples.push([p.x, p.y]); }
      covered = new Array(samples.length).fill(false);
      const start = svg.querySelector('.sand-start');
      start.setAttribute('cx', samples[0][0]); start.setAttribute('cy', samples[0][1]);
      dotsLeft = t.dots.length;
      const ask = () => { g.talk(true); sayLetter(t.i, () => g.talk(false)); };
      g.mood();
      g.set('<b>' + names[t.i] + '</b> harfini kuma yaz. Yeşil noktadan başla.', ask);
      ask();
      svg.onpointerdown = down;
      svg.onpointermove = move;
      svg.onpointerup = svg.onpointercancel = () => { drawing = false; };
    }
    const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    let line = null;
    function down(e) {
      if (stage !== 'line') return;
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      drawing = true;
      line = document.createElementNS(NS, 'polyline');
      ink.append(line);
      move(e);
    }
    function move(e) {
      if (!drawing || stage !== 'line') return;
      const p = toSvg(e);
      line.setAttribute('points', (line.getAttribute('points') || '') + ' ' + p.x.toFixed(1) + ',' + p.y.toFixed(1));
      samples.forEach(([x, y], k) => { if (!covered[k] && Math.hypot(x - p.x, y - p.y) < 16) covered[k] = true; });
      const share = covered.filter(Boolean).length / covered.length;
      box.querySelector('.sand-progress i').style.width = Math.round(share * 100) + '%';
      if (share >= 0.9) lineDone();
    }
    function lineDone() {
      stage = 'dots'; drawing = false;
      svg.classList.add('traced');
      playCue('key');
      const t = tracings[n];
      if (!dotsLeft) return letterDone();
      g.set('Çok güzel! Şimdi ' + (dotsLeft === 1 ? 'noktasını' : dotsLeft + ' noktasını') + ' koy.', null);
      const dots = svg.querySelector('.sand-dots');
      t.dots.forEach(([x, y]) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 11);
        c.setAttribute('class', 'sand-dot');
        c.onpointerdown = e => {
          e.stopPropagation();
          if (c.classList.contains('on')) return;
          c.classList.add('on'); playCue('key');
          if (--dotsLeft === 0) letterDone();
        };
        dots.append(c);
      });
    }
    function letterDone() {
      stage = 'done';
      const t = tracings[n];
      playCue('correct'); g.mood('happy');
      addFish(t.i);
      g.set('Harika! <b>' + names[t.i] + '</b>', () => sayLetter(t.i));
      sayLetter(t.i);
      wait(1500, () => {
        box.classList.add('wave');
        playCue('splash');
        wait(1300, () => {
          n++;
          if (n < tracings.length) draw();
          else { steps.mark(tracings.length); finale(screen, 'Dört harfi kuma yazdın!', () => openGame(games[5])); }
        });
      });
    }
    clear.onclick = () => { if (stage !== 'done') { box.classList.add('wave'); playCue('splash'); wait(900, draw); } };
    draw();
  }

  /* =========================================================
     7. Akvaryum
     ========================================================= */
  // Balığın gövdesi yüzdüğü yöne döner; üstündeki harf hiç ters dönmez.
  function fishSvg(i) {
    const hue = (i * 47) % 360;
    return '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M92 40L118 18V62Z" fill="hsl(' + hue + ' 75% 62%)"/>' +
      '<ellipse cx="54" cy="40" rx="46" ry="30" fill="hsl(' + hue + ' 80% 72%)"/>' +
      '<path d="M40 12Q56 0 70 12" fill="hsl(' + hue + ' 70% 60%)"/>' +
      '<circle cx="22" cy="34" r="7" fill="#fff"/><circle cx="20" cy="34" r="3.6" fill="#1d2a33"/></svg>';
  }
  function startAquarium(screen) {
    const g = guide('akvaryum');
    const tank = el('div', 'tank');
    const shelf = el('div', 'tank-shelf');
    const actions = el('div', 'lab-actions');
    const fill = el('button', 'lab-secondary', '➕ Hepsini ekle (deneme)');
    const empty = el('button', 'lab-secondary', '🫧 Akvaryumu boşalt');
    actions.append(fill, empty);
    screen.append(g.box, tank, shelf, actions);
    fill.onclick = () => { fish = [...Array(28).keys()]; saveFish(); draw(); };
    empty.onclick = () => { fish = []; saveFish(); draw(); };
    function draw() {
      tank.innerHTML = '<i class="tank-sand"></i><i class="tank-weed a"></i><i class="tank-weed b"></i><i class="tank-bubbles"></i>';
      fish.forEach((i, k) => {
        const f = el('button', 'tank-fish', fishSvg(i) + ar(glyphs[i], 'fish-letter'));
        f.type = 'button'; f.dataset.cue = '';
        f.setAttribute('aria-label', names[i] + ' balığı');
        f.style.setProperty('--y', (8 + ((k * 37) % 70)) + '%');
        f.style.setProperty('--d', (11 + (k * 7) % 9) + 's');
        f.style.setProperty('--delay', -((k * 3.7) % 12) + 's');
        f.style.setProperty('--s', (0.75 + ((k * 13) % 5) / 10).toFixed(2));
        f.onclick = () => { sayLetter(i); playCue('pop'); fx.bump(f, 'lab-wiggle'); g.set('Ben <b>' + names[i] + '</b> balığıyım! ' + ar(glyphs[i], 'small'), () => sayLetter(i)); };
        tank.append(f);
      });
      shelf.innerHTML = glyphs.map((gl, i) => '<span class="' + (fish.includes(i) ? 'got' : '') + '" title="' + names[i] + '">' + ar(gl) + '</span>').join('');
      g.mood(fish.length ? 'happy' : null);
      g.set(fish.length ? 'Akvaryumunda ' + fish.length + ' balık var. Bir balığa dokun!' :
        'Akvaryum boş. Odadaki oyunlarda bir harfi başarınca buraya bir balık gelir.', null);
    }
    draw();
  }

  // Adres #nokta, #kabuk … ise o oyun doğrudan açılır.
  const direct = games.find(g => '#' + g.id === location.hash);
  if (direct) openGame(direct); else showHub();
  addEventListener('hashchange', () => { const g = games.find(x => '#' + x.id === location.hash); if (g) openGame(g); else showHub(); });
})();
