// Akvaryum: every player's own tank, from preschool (Elif Ba Adası) to the 4th grade. Each task the child gets
// done on an island (an island of Çarpım Adası, a round of a question island's stop, an islet of Elif Ba …)
// brings a reward: a fish or an ornament. A tank holds 12 fish and 6 ornaments; the next reward opens a new tank, in the
// next theme. A tap on a fish lets the child give it a name, written above it from then on.
//
// Saved per player in localStorage as akvaryum-<player id> (README: saved-data keys never change):
//   { son: last item number, esya: [{ n, t: 'b' fish | 's' ornament, k: kind, a: tank, s: slot (ornaments),
//     ad: name (fish), g: what earned it, z: when, yeni: 1 until seen }], gorev: { key: 1 },
//     gecmis: 1 once the tasks done before the aquarium came were rewarded, gecmisSayi: how many came then (until shown) }
// gorev remembers tasks that give a reward only once (an island of Çarpım Adası, a stop learned in full).
//
// Islands call akvaryum.odul({ anahtar, neden }) when a task is done and put akvaryum.kart(rewards) on their
// result screen; its 🐠 button opens the tank on top of the game. The header's 🐠 button and the card in
// Keşif Limanı open it too.
const akvaryum = (() => {
  const V = akvaryumVeri, A = akvaryumSanat;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickOne = list => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const escape = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- The player's record ---------- */
  const storeKey = id => 'akvaryum-' + id;
  const records = new Map();
  const blank = () => ({ son: 0, esya: [], gorev: {} });
  function load(id) {
    if (records.has(id)) return records.get(id);
    const record = blank();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey(id))); } catch {}
    if (saved && typeof saved === 'object') {
      for (const e of Array.isArray(saved.esya) ? saved.esya : []) {
        if (!e || !['b', 's'].includes(e.t) || !V.tur(e.k) || !Number.isInteger(e.a) || e.a < 0 || !Number.isInteger(e.n)) continue;
        record.esya.push(e);
      }
      record.son = Math.max(Number(saved.son) || 0, ...record.esya.map(e => e.n));
      if (saved.gorev && typeof saved.gorev === 'object') Object.assign(record.gorev, saved.gorev);
      if (saved.gecmis) record.gecmis = 1;
      if (Number.isInteger(saved.gecmisSayi) && saved.gecmisSayi > 0) record.gecmisSayi = saved.gecmisSayi;
    }
    records.set(id, record);
    return record;
  }
  let storeFailed = false;
  function save(id = activeProfile.id) {
    try { localStorage.setItem(storeKey(id), JSON.stringify(load(id))); storeFailed = false; }
    catch { storeFailed = true; }
  }
  const mine = () => activeProfile ? load(activeProfile.id) : blank();
  const tankCount = record => record.esya.length ? Math.max(...record.esya.map(e => e.a)) + 1 : 1;
  const inTank = (record, a) => record.esya.filter(e => e.a === a);
  const theme = a => V.temalar[a % V.temalar.length];
  const tankName = a => (a + 1) + '. akvaryum · ' + theme(a).ad;

  /* ---------- Rewards ---------- */
  // Big ornaments stand at the back, small ones in front; slot s of a tank has a fixed place on the sand.
  const slots = [{ x: .25, big: true }, { x: .57 }, { x: .77, big: true }, { x: .1 }, { x: .41 }, { x: .91 }];
  function chooseFish(record, here) {
    if (!record.esya.some(e => e.t === 'b')) return 'palyaco';
    const owned = new Set(record.esya.filter(e => e.t === 'b').map(e => e.k));
    const present = here.filter(e => e.t === 'b').map(e => e.k);
    // a lone schooling fish is soon joined by a friend of its kind
    const lonely = V.baliklar.filter(b => b.school && present.filter(k => k === b.id).length === 1);
    if (lonely.length && Math.random() < .45) return lonely[0].id;
    let pool = V.baliklar.filter(b => !present.includes(b.id));
    if (!pool.length) pool = V.baliklar;
    const fresh = pool.filter(b => !owned.has(b.id));
    return pickOne(fresh.length && Math.random() < .75 ? fresh : pool).id;
  }
  function chooseOrnament(record, here, slot) {
    const big = !!slots[slot].big;
    const owned = new Set(record.esya.filter(e => e.t === 's').map(e => e.k));
    const present = here.filter(e => e.t === 's').map(e => e.k);
    const pool = V.susler.filter(s => !!s.big === big && !present.includes(s.id));
    const fresh = pool.filter(s => !owned.has(s.id));
    return pickOne(fresh.length ? fresh : pool).id;
  }
  // One reward for the active player. anahtar: a task that rewards only once; karisik: the first three rewards
  // of the player are fish, then ornaments and fish take turns (Elif Ba Adası). Returns what came, or null.
  function odul({ anahtar, neden = '', karisik = false } = {}) {
    if (!activeProfile) return null;
    const got = grant(load(activeProfile.id), anahtar, neden, karisik);
    if (!got) return null;
    save();
    refresh();
    return got;
  }
  function grant(record, anahtar, neden, karisik = false) {
    if (anahtar && record.gorev[anahtar]) return null;
    let a = tankCount(record) - 1;
    let here = inTank(record, a);
    let fish = here.filter(e => e.t === 'b').length, orn = here.length - fish;
    if (fish >= V.BALIK && orn >= V.SUS) { a++; here = []; fish = orn = 0; }
    const n = fish + orn;
    // every third reward is an ornament (or, karisik, every other one after three fish), as long as the
    // tank has room for its kind
    const all = record.esya.length;
    const turn = karisik ? all >= 3 && (all - 3) % 2 === 0 : n % 3 === 2;
    const ornament = orn < V.SUS && (fish >= V.BALIK || turn);
    const item = { n: ++record.son, t: ornament ? 's' : 'b', a, g: String(neden).slice(0, 60), z: Date.now(), yeni: 1 };
    if (ornament) { item.s = orn; item.k = chooseOrnament(record, here, orn); }
    else { item.k = chooseFish(record, here); item.ad = ''; }
    record.esya.push(item);
    if (anahtar) record.gorev[anahtar] = 1;
    return { item, yeniTank: n === 0 && a > 0 };
  }

  /* ---------- Tasks done before the aquarium came (0.38.0) ---------- */
  // Once per player, the tasks already done bring their rewards, so no child who had played before loses out:
  // every island and mixed stage of Çarpım Adası finished; on a question island the rounds finished on each stop (counted from
  // the right answers given there, nine to a round, at least one for a stop with a star), every stop learned
  // in full and the mock exam if taken. What the aquarium already gave for a task is not given again.
  function gecmis() {
    const record = load(activeProfile.id);
    if (record.gecmis) return;
    record.gecmis = 1;
    let given = 0;
    const give = (anahtar, neden) => { if (grant(record, anahtar, neden)) given++; };
    let carpim = null;
    try { carpim = JSON.parse(localStorage.getItem('carpim-adasi-oyuncu-' + activeProfile.id)); } catch {}
    // the 36 islands of the four rounds, then the mixed stages of Balina Denizi (islands/carpim/game.js)
    const stages = typeof total === 'number' ? total : 36, tables = typeof tableStages === 'number' ? tableStages : 36;
    const stagesDone = Math.max(0, Math.min(stages, Math.floor(Number(carpim?.completed) || 0)));
    for (let i = 0; i < stagesDone; i++) give('carpim:' + i, i >= tables && typeof mixedSeconds !== 'undefined' ? 'Karma Çarpım · ' + mixedSeconds[i - tables] + ' sn' : (i % 9 + 2) + ' Çarpım Adası');
    for (const [kod, island] of Object.entries(window.soruAdalari || {})) {
      const sum = island.summary(activeProfile.id);
      if (!sum.any) continue;
      const had = neden => record.esya.filter(e => e.g === neden).length;
      for (const stop of sum.duraklar) {
        const neden = sum.ad + ' · ' + stop.ad;
        if (stop.yildiz) {
          const rounds = Math.max(1, Math.floor(stop.dogru / 9)) - had(neden);
          for (let r = 0; r < rounds; r++) give(null, neden);
        }
        if (stop.soru && stop.ogrenilen === stop.soru) give(kod + ':' + stop.id + ':tamam', neden + ' bitti');
      }
      if (sum.denemeSayi > 0 && !had(sum.ad + ' · Deneme Sınavı')) give(null, sum.ad + ' · Deneme Sınavı');
    }
    if (given) record.gecmisSayi = given;
    save();
  }

  /* ---------- The reward card on an island's result screen ---------- */
  const picture = item => item.t === 'b' ? A.fish(item.k) : A.ornament(item.k);
  function kart(list) {
    const got = (list || []).filter(Boolean);
    if (!got.length) return '';
    const names = got.map(r => V.tur(r.item.k).ad);
    const fishCame = got.some(r => r.item.t === 'b');
    const newTank = got.find(r => r.yeniTank);
    return '<div class="ak-prize" role="group" aria-label="Kazandığın ödül">' +
      '<div class="ak-prize-pics">' + got.map(r => '<span class="ak-prize-pic ' + (r.item.t === 'b' ? 'fish' : 'orn') + '" style="--ak-sand:' +
        A.themes[theme(r.item.a).id].sand[0] + '">' + picture(r.item) + '</span>').join('') + '</div>' +
      '<div class="ak-prize-text"><small>🎁 ' + (got.length > 1 ? got.length + ' yeni ödül' : 'Yeni ödül') + '</small><strong>' + names.join(' ve ') + '</strong>' +
      '<span>' + (newTank ? '🆕 Yeni akvaryumun açıldı: ' + theme(newTank.item.a).ad + '! ' : 'Akvaryumuna katıldı! ') +
      (fishCame ? 'Ona bir isim ver.' : '') + '</span></div>' +
      '<button type="button" class="ak-prize-go" data-akvaryum-git="' + got[got.length - 1].item.a + '"><span aria-hidden="true">🐠</span> Akvaryuma git</button></div>';
  }
  // A line for a round that brought nothing, so the child knows what a finished task gives.
  const ipucu = text => available() ? '<p class="ak-hint"><span aria-hidden="true">🐠</span> ' + text + '</p>' : '';
  document.addEventListener('click', e => {
    const go = e.target.closest?.('[data-akvaryum-git]');
    if (!go) return;
    const a = Number(go.dataset.akvaryumGit);
    open({ tank: Number.isInteger(a) && go.dataset.akvaryumGit !== '' ? a : null });
  });

  /* ---------- Who has a tank, the header button and the harbour card ---------- */
  // Players whose grade has an island that gives rewards (cards marked data-akvaryum), and anyone with a reward.
  function available() {
    if (!activeProfile) return false;
    if (mine().esya.length) return true;
    return [...document.querySelectorAll('[data-akvaryum]')].some(card => availableForPlayer(card));
  }
  function refresh() {
    if (activeProfile) gecmis();
    const button = $('aquarium-button'), card = $('aquarium-card');
    const show = available();
    if (button) button.hidden = !show;
    if (card) card.hidden = !show;
    if (!show) return;
    prewarm();
    const record = mine();
    const fish = record.esya.filter(e => e.t === 'b');
    const fresh = record.esya.filter(e => e.yeni).length;
    if (button) {
      button.innerHTML = '<span aria-hidden="true">🐠</span><span class="ak-btn-label">Akvaryum</span><b>' + fish.length + '</b>' + (fresh ? '<i class="ak-dot" aria-hidden="true"></i>' : '');
      button.setAttribute('aria-label', 'Akvaryum: ' + fish.length + ' balık' + (fresh ? ', ' + fresh + ' yeni ödül' : ''));
      button.classList.toggle('fresh', fresh > 0);
    }
    if (card) {
      const last = fish.slice(-4).reverse();
      const shown = last.length ? last.map(e => e.k) : ['palyaco', 'neon', 'cerrah'];
      card.classList.toggle('empty', !last.length);
      card.classList.toggle('fresh', fresh > 0);
      card.innerHTML = '<span class="ak-card-tank" aria-hidden="true">' + shown.map((k, i) => '<span class="ak-card-fish" style="--i:' + i + '">' + A.fish(k) + '</span>').join('') +
        '<i class="ak-card-sand"></i></span><span class="ak-card-text"><small>' + (last.length ? fish.length + ' balık · ' + (record.esya.length - fish.length) + ' süs' : 'Görevleri bitir, balıklar gelsin') +
        '</small><strong>' + escape(title()) + '</strong>' + (fresh ? '<em>✨ ' + fresh + ' yeni ödül seni bekliyor</em>' : last.length ? '<em>Balıklarına isim verebilirsin</em>' : '<em>Her görev bir balık ya da süs getirir</em>') +
        '</span><span class="card-arrow" aria-hidden="true">▶</span>';
      card.setAttribute('aria-label', title() + ': ' + fish.length + ' balık' + (fresh ? ', ' + fresh + ' yeni ödül' : ''));
    }
  }
  // "Ali'nin Akvaryumu": the Turkish genitive follows the last vowel of the name.
  function title() {
    const name = (activeProfile?.name || '').trim();
    const lower = name.toLocaleLowerCase('tr');
    const vowels = [...lower].filter(c => 'aeıioöuü'.includes(c));
    if (!vowels.length) return 'Akvaryumum';
    const suffix = { a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün' }[vowels[vowels.length - 1]];
    return name + '’' + ('aeıioöuü'.includes(lower[lower.length - 1]) ? 'n' : '') + suffix + ' Akvaryumu';
  }

  /* ---------- The tank ---------- */
  const dialog = $('akvaryum');
  dialog.innerHTML = '<div class="ak-room">' +
    '<div class="ak-top"><button type="button" class="btn-round ak-close" aria-label="Akvaryumdan çık"></button>' +
      '<button type="button" class="ak-tell" aria-label="Ne yapacağımı söyle" hidden><span aria-hidden="true">🐢💬</span></button>' +
      '<h2 class="ak-title" id="ak-title"></h2>' +
      '<div class="ak-nav"><button type="button" class="ak-prev" aria-label="Önceki akvaryum">‹</button><span class="ak-which"></span>' +
      '<button type="button" class="ak-next" aria-label="Sonraki akvaryum">›</button></div></div>' +
    '<div class="ak-tank"><div class="ak-hood" aria-hidden="true"><i></i></div><div class="ak-water">' +
      '<div class="ak-bg" aria-hidden="true"></div><div class="ak-far" aria-hidden="true"></div><div class="ak-rays" aria-hidden="true"><i></i><i></i></div>' +
      '<div class="ak-plants back" aria-hidden="true"></div><canvas class="ak-floor" aria-hidden="true"></canvas>' +
      '<div class="ak-caustics" aria-hidden="true"><i></i><i></i></div>' +
      '<div class="ak-decor"></div><div class="ak-bubbles" aria-hidden="true"></div><div class="ak-swim"><canvas class="ak-school" aria-hidden="true"></canvas></div>' +
      '<div class="ak-plants front" aria-hidden="true"></div><div class="ak-surface" aria-hidden="true"><i></i></div><div class="ak-glass" aria-hidden="true"></div>' +
      '<p class="ak-say" role="status"></p>' +
    '</div></div>' +
    '<div class="ak-stand"><div class="ak-stand-info"><strong class="ak-tank-name"></strong><span class="ak-counts"></span></div>' +
      '<div class="ak-meter" aria-hidden="true"><i></i></div><p class="ak-help"></p></div>' +
    '<form class="ak-name" hidden autocomplete="off"><span class="ak-name-pic" aria-hidden="true"></span>' +
      '<label class="ak-name-field"><small class="ak-name-kind"></small><input class="ak-name-input" maxlength="14" enterkeyhint="done" spellcheck="false" placeholder="Bir isim yaz"></label>' +
      '<button class="ak-name-ok"><span aria-hidden="true">✓</span> Kaydet</button><button type="button" class="btn-round ak-name-x" aria-label="Vazgeç"></button></form>' +
  '</div>';
  dialog.setAttribute('aria-labelledby', 'ak-title');
  const find = s => dialog.querySelector(s);
  const water = find('.ak-water'), swim = find('.ak-swim'), decorLayer = find('.ak-decor'), bubbleLayer = find('.ak-bubbles');
  const floorCanvas = find('.ak-floor'), say = find('.ak-say'), form = find('.ak-name'), input = find('.ak-name-input');
  // Focusing a fish half out of view would scroll the water (overflow: clip prevents it where supported).
  water.addEventListener('scroll', () => { water.scrollLeft = 0; water.scrollTop = 0; });

  let shown = 0, fish = [], decor = [], crawlers = [], food = [], W = 0, H = 0, FH = 0, k = 1, sandTop = () => 0;
  let frameId = 0, last = 0, sayTimer = 0, naming = null, onClose = null, speak = null, hunger = 0;
  // The device voice reads the tank's lines aloud for a preschool player (sesVer), without the emoji.
  const voiced = () => speak && activeProfile?.grade === 'Okul öncesi';
  const spoken = html => html.replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s.,!?’'-]/gu, '').replace(/\s+/g, ' ').trim();

  // The caustic light is drawn once, the first time a tank opens, and shared by every tank.
  let causticsDrawn = false;
  function drawCaustics() {
    if (causticsDrawn) return;
    causticsDrawn = true;
    const url = A.caustics();
    for (const layer of dialog.querySelectorAll('.ak-caustics i')) layer.style.backgroundImage = url ? 'url(' + url + ')' : 'none';
  }
  // The fish are drawn on one canvas from pictures made once per kind and size (sprites): an SVG per fish,
  // its tail beating by CSS, made every frame a repaint of every fish, too slow on a tablet.
  const school = find('.ak-school');
  const pen = school.getContext('2d');
  const sprites = new Map();
  let dpr = 1;
  // Pictures are made at the size the fish are drawn (copying pixels one to one is cheapest), guessed from the
  // window before the tank is open: the tank is the window less the top bar and the stand.
  function sizeGuess() {
    if (W && H) return k;
    const w = Math.min(innerWidth - (innerWidth > 650 ? 2 * Math.min(44, innerWidth * .03) + 8 : 0), 1280), h = innerHeight - 190;
    return clamp(Math.sqrt(Math.max(1, w * h)) / 520, .66, 1.65);
  }
  const spriteWidth = kind => Math.ceil(V.tur(kind).w * sizeGuess() * 1.1 * Math.min(2, window.devicePixelRatio || 1) / 16) * 16;
  const spriteKey = (kind, part) => kind + ':' + part + ':' + spriteWidth(kind);
  function sprite(kind, part) {
    const width = spriteWidth(kind);
    const key = spriteKey(kind, part);
    let entry = sprites.get(key);
    if (entry) return entry;
    entry = { ready: false, canvas: null };
    sprites.set(key, entry);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([A.fishSprite(kind, part, width)], { type: 'image/svg+xml' }));
    img.onload = () => {
      // drawn once into a bitmap, so every frame only copies pixels
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.max(1, Math.round(width * A.ratio(kind)));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      entry.canvas = canvas;
      entry.ready = true;
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    return entry;
  }

  function build(a) {
    shown = a;
    const record = mine();
    const th = A.themes[theme(a).id];
    const room = find('.ak-room');
    room.dataset.theme = theme(a).id;
    const [w0, w1, w2, w3] = th.water;
    room.style.setProperty('--ak-w0', w0);
    room.style.setProperty('--ak-w1', w1);
    room.style.setProperty('--ak-w2', w2);
    room.style.setProperty('--ak-w3', w3);
    room.style.setProperty('--ak-light', th.light);
    room.style.setProperty('--ak-sand', th.sand[0]);
    find('.ak-far').innerHTML = A.backdrop(th, a + 1);
    // Plants: a seeded row at the back and a tuft at each front corner.
    const r = A.seeded(a * 97 + 13);
    const back = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const x = (i + .2 + r() * .6) / count;
      const kind = th.plants[Math.floor(r() * th.plants.length)];
      const tall = kind[0] === 'val' || kind[0] === 'kabomba';
      back.push({ x, kind, h: tall ? .38 + r() * .3 : .2 + r() * .14, seed: a * 100 + i, d: 5 + r() * 4, delay: r() * 6 });
    }
    find('.ak-plants.back').innerHTML = back.map(p => '<span class="ak-plant" data-x="' + p.x + '" data-h="' + p.h + '" style="--d:' + p.d.toFixed(1) + 's;animation-delay:-' + p.delay.toFixed(1) + 's">' +
      A.plant(p.kind, p.seed) + '</span>').join('');
    const val = th.plants.find(p => p[0] === 'val');
    find('.ak-plants.front').innerHTML = [.02, .985].map((x, i) => '<span class="ak-plant" data-x="' + x + '" data-h="' + (.46 + i * .08) + '" data-front="1" style="--d:' + (6 + i) + 's">' +
      A.plant(val, a * 100 + 50 + i) + '</span>').join('');
    // Ornaments and fish of this tank.
    for (const f of fish) f.node.remove();
    for (const bit of food) bit.node.remove();
    fish = []; food = []; crawlers = []; decor = [];
    decorLayer.innerHTML = '';
    const items = inTank(record, a);
    for (const item of items.filter(e => e.t === 's')) addOrnament(item);
    drawInfo();
    measure();
    layout();
    for (const item of items.filter(e => e.t === 'b')) addFish(item);
    fish.sort((a, b) => a.z - b.z);
  }

  // Sizes follow the tank: k scales the fish, the ornaments follow its width.
  function measure() {
    W = water.clientWidth;
    H = water.clientHeight;
    FH = Math.max(80, H * .2);
    k = clamp(Math.sqrt(W * H) / 520, .66, 1.65);
  }
  const sandY = x => H - FH + sandTop(clamp(x / Math.max(1, W), 0, 1));
  const floors = new Map();
  function layout() {
    if (!W || !H) return;
    const th = A.themes[theme(shown).id];
    const floorKey = shown + ':' + Math.round(W) + 'x' + Math.round(FH);
    const made = floors.get(floorKey) || A.floor(th, shown + 1, W, FH);
    floors.set(floorKey, made);
    sandTop = made.top;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    school.width = Math.round(W * dpr);
    school.height = Math.round(H * dpr);
    floorCanvas.width = made.canvas.width;
    floorCanvas.height = made.canvas.height;
    floorCanvas.getContext('2d')?.drawImage(made.canvas, 0, 0);
    floorCanvas.style.height = FH + 'px';
    find('.ak-caustics').style.height = FH + 'px';
    for (const plant of dialog.querySelectorAll('.ak-plant')) {
      // on a tall phone screen the plants keep to the width of the tank
      const x = Number(plant.dataset.x) * W, h = Math.min(Number(plant.dataset.h) * H, Number(plant.dataset.h) * W * 1.3);
      const front = !!plant.dataset.front;
      plant.style.height = h + 'px';
      plant.style.width = h / 2 + 'px';
      plant.style.left = (x - h / 4) + 'px';
      plant.style.top = ((front ? H + 6 : sandY(x) + FH * .12) - h) + 'px';
    }
    for (const d of decor) placeOrnament(d);
    for (const c of crawlers) c.y = sandY(c.x) + FH * .52;
    makeBubbles();
  }

  /* ---------- Ornaments ---------- */
  function ornamentSize(item) {
    const big = !!V.tur(item.k).big;
    const w = big ? clamp(W * .29, 124, 360) : clamp(W * .105, 54, 112);
    return { w, h: w * A.ornamentRatio(item.k) };
  }
  function addOrnament(item) {
    const info = V.tur(item.k);
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'ak-orn ak-orn-' + item.k + (info.big ? ' big' : '') + (item.yeni ? ' arriving' : '');
    node.innerHTML = A.ornament(item.k);
    node.setAttribute('aria-label', info.ad);
    decorLayer.append(node);
    const d = { item, node, info, x: 0 };
    if (info.crawl) {
      const c = { d, x: 0, y: 0, dir: Math.random() < .5 ? -1 : 1, speed: item.k === 'yengec' ? 26 : 5, walk: item.k !== 'yengec', timer: rand(1, 4) };
      d.crawler = c;
      crawlers.push(c);
    }
    node.onclick = event => { event.stopPropagation(); touchOrnament(d); };
    decor.push(d);
  }
  function placeOrnament(d) {
    const { w, h } = ornamentSize(d.item);
    const slot = slots[d.item.s] || slots[1];
    const x = slot.x * W;
    d.w = w; d.h = h;
    d.node.style.width = w + 'px';
    d.node.style.height = h + 'px';
    if (d.crawler) {
      d.crawler.x = d.crawler.x || x;
      d.crawler.y = sandY(d.crawler.x) + FH * .52;
      d.node.style.left = '0'; d.node.style.top = '0';
      placeCrawler(d.crawler);
      return;
    }
    // big ones stand at the back of the sand, small ones further forward
    const bottom = sandY(x) + FH * (slot.big ? .2 : .55);
    d.x = x;
    d.node.style.left = (x - w / 2) + 'px';
    d.node.style.top = (bottom - h) + 'px';
    d.node.style.zIndex = slot.big ? 1 : 2;
  }
  function placeCrawler(c) {
    const { w, h } = c.d;
    c.d.node.style.transform = 'translate(' + (c.x - w / 2).toFixed(1) + 'px,' + (c.y - h).toFixed(1) + 'px)';
    c.d.node.classList.toggle('flip', c.dir > 0);
    c.d.node.classList.toggle('walk', c.walk);
  }
  function touchOrnament(d) {
    const k = d.item.k;
    playCue('tap');
    sayLine(V.tur(k).ad + (k === 'sandik' ? ': içi altın dolu! ✨' : k === 'yengec' ? ': merhaba! 🦀' : ''));
    d.node.classList.remove('poke'); void d.node.offsetWidth; d.node.classList.add('poke');
    if (['sandik', 'istiridye'].includes(k)) {
      d.node.classList.add('open');
      clearTimeout(d.shut);
      d.shut = setTimeout(() => d.node.classList.remove('open'), 3200);
    }
    const spot = A.bubbleAt(k);
    if (spot) burst(d.x - d.w / 2 + spot.x * d.w, parseFloat(d.node.style.top) + spot.y * d.h, 9);
    if (d.crawler) { d.crawler.walk = false; d.crawler.timer = 2.5; d.node.classList.add('wave'); setTimeout(() => d.node.classList.remove('wave'), 1600); }
  }

  /* ---------- Bubbles ---------- */
  // Streams rising from the ornaments that breathe (and one at the back of every tank) up to the surface.
  function makeBubbles() {
    bubbleLayer.innerHTML = '';
    const sources = [{ x: W * .86, y: sandY(W * .86) + 4, n: 5, size: [3, 7] }];
    for (const d of decor) {
      const spot = A.bubbleAt(d.item.k);
      if (!spot || d.crawler) continue;
      sources.push({ x: d.x - d.w / 2 + spot.x * d.w, y: parseFloat(d.node.style.top) + spot.y * d.h, n: spot.strong ? 16 : 4, size: spot.strong ? [4, 10] : [3, 8], strong: spot.strong });
    }
    for (const s of sources) {
      for (let i = 0; i < s.n; i++) {
        const b = document.createElement('i');
        const t = s.strong ? rand(2.6, 4) : rand(5, 9);
        b.style.left = (s.x + rand(-3, 3)) + 'px';
        b.style.top = s.y + 'px';
        b.style.setProperty('--s', rand(...s.size).toFixed(1) + 'px');
        b.style.setProperty('--t', t.toFixed(2) + 's');
        b.style.setProperty('--w', rand(-10, 10).toFixed(0) + 'px');
        b.style.setProperty('--rise', -(s.y - 4) + 'px');
        b.style.animationDelay = (-rand(0, t)).toFixed(2) + 's';
        bubbleLayer.append(b);
      }
    }
  }
  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i');
      b.className = 'ak-puff';
      b.style.left = (x + rand(-6, 6)) + 'px';
      b.style.top = (y + rand(-4, 4)) + 'px';
      b.style.setProperty('--s', rand(5, 12).toFixed(0) + 'px');
      b.style.setProperty('--up', -Math.min(y, rand(90, 180)) + 'px');
      b.style.animationDelay = (i * .07).toFixed(2) + 's';
      swim.append(b);
      setTimeout(() => b.remove(), 2600);
    }
  }

  /* ---------- Fish ---------- */
  function addFish(item) {
    const sp = V.tur(item.k);
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'ak-fish ak-fish-' + item.k + (item.yeni ? ' new' : '');
    swim.append(node);
    const size = rand(.88, 1.08);
    const z = Math.random();
    const w = sp.w * k * size * (.86 + z * .22);
    const h = w * A.ratio(item.k);
    node.style.width = w + 'px';
    node.style.height = h * (sp.upright ? .9 : .7) + 'px';
    // the pictures it is drawn from: one size per kind and tank size, shared by fish of the same kind
    const geo = A.fishGeometry(item.k);
    const look = { geo, body: sprite(item.k, 'body'), tail: geo.hasTail ? sprite(item.k, 'tail') : null,
      spikes: geo.hasSpikes ? sprite(item.k, 'spikes') : null };
    const arriving = item.yeni && !calm.matches;
    const zone = zoneOf(sp);
    const f = { item, sp, node, label: '', pop: 0, w, h, z,
      x: arriving ? (Math.random() < .5 ? -w : W + w) : rand(zone.x0, zone.x1), y: rand(zone.y0, zone.y1),
      look, beatT: rand(0, 6.3), turn: 1, joy: 0, puff: 0, puffing: 0,
      entering: arriving, vx: 0, vy: 0, dir: 1, speed: sp.speed * rand(.85, 1.15) * Math.max(.7, k), phase: rand(0, 6.3), rest: 0, boost: 0, meal: null, hold: false,
      off: { x: rand(-50, 50) * k, y: rand(-26, 26) * k } };
    f.dir = f.x > W / 2 ? 1 : -1;
    f.turn = f.dir;
    // a new fish darts in from the side
    if (arriving) { f.tx = rand(W * .3, W * .7); f.ty = rand(zone.y0, zone.y1); f.boost = 2.4; } else pickTarget(f);
    node.onclick = event => { event.stopPropagation(); touchFish(f); };
    fish.push(f);
    labelFish(f);
    place(f);
    return f;
  }
  function labelFish(f) {
    const name = f.item.ad || '';
    f.label = naming === f && input.value.trim() ? input.value.trim() : name;
    f.node.setAttribute('aria-label', (name ? name + ', ' : '') + V.tur(f.item.k).ad + (name ? '' : ', isim vermek için dokun'));
  }
  // The water a fish likes: its species' band between the surface and the sand.
  function zoneOf(sp) {
    const top = H * .1, bottom = H - FH * .75;
    return { x0: 30 * k + 10, x1: W - 30 * k - 10, y0: top + (bottom - top) * sp.zone[0], y1: top + (bottom - top) * sp.zone[1] };
  }
  function pickTarget(f, dart = false) {
    const z = zoneOf(f.sp);
    const angle = rand(0, Math.PI * 2);
    const reach = dart ? .6 : rand(.3, .7);
    const go = (pos, delta, low, high) => { const next = pos + delta; return clamp(next < low || next > high ? pos - delta : next, low, high); };
    f.tx = go(f.x, Math.cos(angle) * (z.x1 - z.x0) * reach, z.x0, z.x1);
    f.ty = go(f.y, Math.sin(angle) * (z.y1 - z.y0) * (dart ? .8 : .5), z.y0, z.y1);
    f.rest = !dart && Math.random() < (f.sp.upright ? .55 : .28) ? rand(1, f.sp.upright ? 5 : 3) : 0;
  }
  function place(f) {
    const bob = Math.sin(f.phase) * (f.sp.upright ? 3 : 1.6);
    const pitch = f.sp.upright ? Math.sin(f.phase * .5) * 4 : clamp(-f.dir * f.vy * .7, -16, 16);
    f.bob = bob;
    f.pitch = pitch;
    f.node.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + (f.y + bob).toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + pitch.toFixed(1) + 'deg)';
  }
  function step(dt) {
    const leaders = new Map();
    for (const f of fish) if (f.sp.school && !leaders.has(f.item.k)) leaders.set(f.item.k, f);
    for (const f of fish) {
      f.phase += dt * (f.sp.upright ? 1.4 : 2.2);
      f.boost = Math.max(0, f.boost - dt);
      // the tail beats faster while darting; the fish turns round by narrowing to its edge and widening again
      f.beatT += dt * Math.PI / (f.sp.beat * (f.boost > 0 ? .45 : 1));
      f.turn += clamp(f.dir - f.turn, -dt * 3.6, dt * 3.6);
      f.joy = Math.max(0, f.joy - dt);
      f.pop = Math.max(0, f.pop - dt);
      f.puffing = Math.max(0, f.puffing - dt);
      f.chomp = Math.max(0, (f.chomp || 0) - dt);
      f.lunge = Math.max(0, (f.lunge || 0) - dt);
      f.fed = Math.max(0, (f.fed || 0) - dt * .12);
      f.puff += clamp((f.puffing > 0 ? 1 : 0) - f.puff, -dt * 3, dt * 5);
      let tx = f.tx, ty = f.ty;
      const leader = leaders.get(f.item.k);
      if (f.hold) { tx = W / 2; ty = H * .36; }
      // a hungry fish brings its mouth, not its middle, to the bit
      else if (f.meal) { tx = f.meal.x + f.dir * f.w * .44; ty = f.meal.y - f.h * .04; }
      else if (leader && leader !== f && !f.boost) { tx = leader.x + f.off.x * (leader.dir > 0 ? 1 : -1) + leader.w * .6 * leader.dir; ty = leader.y + f.off.y; f.rest = 0; }
      const dx = tx - f.x, dy = ty - f.y, dist = Math.hypot(dx, dy);
      f.chew = Math.max(0, (f.chew || 0) - dt);
      // after a bite it slows and chews a moment before going for the next flake
      if (f.rest > 0 && !f.meal && !f.boost && !f.hold || f.chew > 0 && !f.hold) {
        f.rest -= dt;
        const drag = Math.exp(-2.4 * dt);
        f.vx *= drag; f.vy *= drag;
      } else {
        const school = leader && leader !== f && !f.meal && !f.hold;
        // it hurries over, slows down to line up, then darts the last bit of the way and snaps
        const near = f.meal ? Math.hypot(mouthX(f) - f.meal.x, mouthY(f) - f.meal.y) : Infinity;
        if (f.meal && near < 34 * k + f.w * .1 && !f.lunge) f.lunge = .28;
        const cruise = f.hold ? 1.2 : f.meal ? (f.lunge ? 3.4 : near < 90 * k ? 1.5 : 2.6) : school ? clamp(dist / 60, .4, 1.8) : 1;
        const want = (cruise + (2.8 - cruise) * Math.min(1, f.boost)) * f.speed * Math.min(1, dist / (60 * k) + (f.meal ? .5 : .12));
        const ax = dist > 1 ? dx / dist * want : 0, ay = dist > 1 ? dy / dist * want * .85 : 0;
        const ease = Math.min(1, dt * (f.boost || f.lunge ? 5 : f.meal ? 2.6 : school ? 1.8 : .8));
        f.vx += (ax - f.vx) * ease;
        f.vy += (ay - f.vy) * ease;
        if (f.meal && near < 9 + f.w * .07) eat(f);
        else if (!f.meal && !f.hold && !school && dist < 16 * k + 4) pickTarget(f);
      }
      // Fish keep a little room between them.
      for (const o of fish) {
        if (o === f) continue;
        const ox = f.x - o.x, oy = f.y - o.y, gap = (f.w + o.w) * .32, d = Math.hypot(ox, oy);
        if (d > 0 && d < gap) { f.vx += ox / d * 30 * dt * (gap - d); f.vy += oy / d * 20 * dt * (gap - d) * .5; }
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      // a fish swimming in from the side is let in; the others stay inside the glass
      if (f.entering && f.x > 0 && f.x < W) f.entering = false;
      if (!f.entering) f.x = clamp(f.x, 0, W);
      f.y = clamp(f.y, H * .07, H - FH * .55);
      // it turns round only once it really swims the other way
      if (f.vx < -4) f.dir = 1;
      else if (f.vx > 4) f.dir = -1;
      place(f);
    }
    for (const c of crawlers) {
      c.timer -= dt;
      if (c.timer <= 0) {
        if (c.d.item.k === 'yengec') { c.walk = !c.walk; c.timer = c.walk ? rand(1.5, 4) : rand(2, 6); if (c.walk && Math.random() < .5) c.dir *= -1; }
        else { c.timer = rand(6, 14); if (Math.random() < .3) c.dir *= -1; }
      }
      if (c.walk) {
        c.x += c.dir * c.speed * k * dt;
        if (c.x < W * .06 || c.x > W * .94) { c.dir *= -1; c.x = clamp(c.x, W * .06, W * .94); }
        c.y = sandY(c.x) + FH * .52;
      }
      placeCrawler(c);
    }
    for (const bit of [...food]) moveFood(bit, dt);
    // fish that see food drifting nearby join in, until they have had their fill
    hunger -= dt;
    if (hunger <= 0 && food.some(b => !b.gulp)) {
      hunger = .45;
      for (const f of fish) if (!f.meal && !f.hold && f.fed < 4 && Math.random() < .5) seek(f, W * .5);
    }
  }
  function frame(now) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (!W) { measure(); layout(); }
    if (!calm.matches) step(dt);
    paint();
  }
  // Every fish of the tank on the canvas, the farthest first.
  function paint() {
    if (!pen) return;
    pen.setTransform(1, 0, 0, 1, 0, 0);
    pen.clearRect(0, 0, school.width, school.height);
    const still = calm.matches;
    for (const f of fish) {
      const { geo, body, tail, spikes } = f.look;
      if (!body.ready) continue;
      const u = f.w / geo.vb[2];
      const at = (x, y) => [(x - geo.vb[0]) * u, (y - geo.vb[1]) * u];
      // a touch makes it jump with joy: a quick swell and settle
      const t = .7 - f.joy;
      const joy = f.joy > 0 ? (t < .3 ? 1 + .16 * Math.sin(t / .3 * Math.PI) : 1 - .04 * Math.sin((t - .3) / .4 * Math.PI)) : 1;
      // a gulp: the head pushes forward and the body swells, then settles with a little shiver
      const c = f.chomp > 0 ? 1 - f.chomp / .36 : 0;
      const gulp = c ? Math.sin(c * Math.PI) * (1 - c * .4) : 0;
      const shiver = c ? Math.sin(c * Math.PI * 5) * (1 - c) * .03 : 0;
      pen.setTransform(dpr, 0, 0, dpr, 0, 0);
      pen.translate(f.x - f.dir * f.w * .05 * gulp, f.y + (f.bob || 0));
      pen.rotate(((f.pitch || 0) + (still ? 0 : shiver * 60)) * Math.PI / 180);
      pen.scale(f.turn * joy * (1 + .1 * gulp), joy * (1 + .13 * gulp));
      pen.translate(-f.w / 2, -f.h / 2);
      if (tail?.ready) {
        const [jx, jy] = at(geo.joint[0], geo.joint[1]);
        const beat = still ? 1 : (1 - Math.cos(f.beatT)) / 2;
        pen.save();
        pen.translate(jx, jy);
        pen.transform(.76 + .24 * beat, Math.tan((-7 + 14 * beat) * Math.PI / 180), 0, 1, 0, 0);
        pen.translate(-jx, -jy);
        pen.drawImage(tail.canvas, 0, 0, f.w, f.h);
        pen.restore();
      }
      // the body sways a little with the tail
      if (!still && !f.sp.upright) {
        const sway = Math.tan(Math.sin(f.beatT * .5) * 1.4 * Math.PI / 180), px = f.w * .3;
        pen.translate(px, 0);
        pen.transform(1, sway, 0, 1, 0, 0);
        pen.translate(-px, 0);
      }
      if (f.puff > 0 && geo.inflate) {
        const [ix, iy] = at(geo.inflate[0], geo.inflate[1]);
        pen.translate(ix, iy);
        pen.scale(1 + .2 * f.puff, 1 + .45 * f.puff);
        pen.translate(-ix, -iy);
      }
      pen.drawImage(body.canvas, 0, 0, f.w, f.h);
      if (f.puff > 0 && spikes?.ready) {
        pen.globalAlpha = f.puff;
        pen.drawImage(spikes.canvas, 0, 0, f.w, f.h);
        pen.globalAlpha = 1;
      }
    }
    // the names, on top of every fish
    for (const f of fish) if (f.label) nameTag(f);
  }
  // A white label with a little point under it, above the fish; a new name pops in.
  function nameTag(f) {
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.round(clamp(W / 70, 13, 16));
    pen.font = '900 ' + size + 'px Nunito, sans-serif';
    const tw = pen.measureText(f.label).width, pw = tw + 20, ph = size + 9;
    const x = f.x, y = f.y + (f.bob || 0) - f.h * .5 - 6;
    const pop = f.pop > 0 ? 1 - .7 * Math.sin(f.pop / .6 * Math.PI / 2) ** 2 : 1;
    pen.translate(x, y);
    pen.scale(pop, pop);
    pen.fillStyle = 'rgba(255,255,255,.94)';
    pen.shadowColor = 'rgba(0,18,34,.3)';
    pen.shadowBlur = 6;
    pen.shadowOffsetY = 2;
    const r = ph / 2, left = -pw / 2, top = -ph - 5;
    pen.beginPath();
    pen.moveTo(left + r, top);
    pen.arcTo(left + pw, top, left + pw, top + ph, r);
    pen.arcTo(left + pw, top + ph, left, top + ph, r);
    pen.lineTo(5, top + ph);
    pen.lineTo(0, 0);
    pen.lineTo(-5, top + ph);
    pen.arcTo(left, top + ph, left, top, r);
    pen.arcTo(left, top, left + pw, top, r);
    pen.closePath();
    pen.fill();
    pen.shadowColor = 'transparent';
    pen.fillStyle = '#12313d';
    pen.textAlign = 'center';
    pen.textBaseline = 'middle';
    pen.fillText(f.label, 0, top + ph / 2 + 1);
  }

  /* ---------- Touches ---------- */
  // quiet: a line that only helps (what to do here) is said only when the 🐢💬 button is tapped.
  function sayLine(text, keep, ms = 3400, quiet = false) {
    say.innerHTML = text;
    say.classList.add('on');
    clearTimeout(sayTimer);
    if (!keep) sayTimer = setTimeout(() => say.classList.remove('on'), ms);
    if (!quiet && voiced()) speak(spoken(text));
  }
  find('.ak-tell').onclick = event => { event.stopPropagation(); if (voiced()) speak(spoken(find('.ak-help').textContent)); };
  function touchFish(f) {
    f.joy = .7;
    if (f.item.k === 'balon') f.puffing = 2.6;
    playCue('pop', { ambient: true });
    burst(f.x - f.dir * f.w * .4, f.y - 4, 4);
    openNaming(f);
  }
  // Naming: the fish swims up to the middle and waits while the child types; its name shows above it.
  function openNaming(f) {
    if (naming && naming !== f) closeNaming();
    naming = f;
    f.hold = true; f.meal = null; f.rest = 0;
    form.hidden = false;
    find('.ak-name-pic').innerHTML = A.fish(f.item.k);
    find('.ak-name-kind').textContent = V.tur(f.item.k).ad + (f.item.ad ? ' · şimdiki adı ' + f.item.ad : ' · henüz adı yok');
    input.value = f.item.ad || '';
    find('.ak-name-ok').innerHTML = '<span aria-hidden="true">✓</span> ' + (f.item.ad ? 'Değiştir' : 'Kaydet');
    sayLine(f.item.ad ? 'Merhaba, ben ' + escape(f.item.ad) + '! 👋' : 'Bu ' + V.tur(f.item.k).ad.toLocaleLowerCase('tr') + ' bir isim bekliyor ✏️', true);
    // A phone opens its keyboard only from the tap itself.
    input.focus({ preventScroll: true });
  }
  function closeNaming() {
    if (!naming) return;
    const f = naming;
    naming = null;
    f.hold = false;
    if (!calm.matches) pickTarget(f);
    labelFish(f);
    form.hidden = true;
    input.blur();
    say.classList.remove('on');
  }
  input.addEventListener('input', () => { if (naming) labelFish(naming); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = naming;
    if (!f) return;
    const name = input.value.replace(/\s+/g, ' ').trim().slice(0, 14);
    if (!name) { input.focus(); fx.bump(input, 'nudge'); return; }
    const was = f.item.ad;
    f.item.ad = name;
    save();
    closeNaming();
    labelFish(f);
    place(f);
    playCue('star');
    burst(f.x, f.y - f.h * .5, 6);
    f.pop = calm.matches ? 0 : .6;
    sayLine(was && was !== name ? 'Artık adı ' + escape(name) + '! ✨' : 'Merhaba ' + escape(name) + '! 🎉');
    if (storeFailed) sayLine('İsim yalnızca bu oturumda saklanabildi.');
  });
  find('.ak-name-x').onclick = closeNaming;
  input.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeNaming(); } });
  dialog.addEventListener('cancel', e => { if (naming) { e.preventDefault(); closeNaming(); } });

  // A tap on the water sprinkles a pinch of food: rings spread on the water, the flakes scatter, then sink slowly,
  // swaying, and settle on the sand. The nearest fish hurry over; each brings its mouth to a flake, darts the
  // last bit of the way and snaps it up: the flake is sucked into its mouth, the fish gulps (a quick swell),
  // a few tiny bubbles rise, and it goes on to the next flake. A fish that has had its fill does a happy wiggle.
  const foodColors = [['#f4a340', '#c4601e'], ['#e8743b', '#a63c1c'], ['#f2c75c', '#c48a1f'], ['#9cbf4a', '#5f8a2a'], ['#d65a4a', '#982e25']];
  const mouthX = f => f.x - f.dir * f.w * .44;
  const mouthY = f => f.y + (f.bob || 0) + f.h * .04;
  water.addEventListener('click', event => {
    if (event.target.closest('button, form')) return;
    if (naming) { closeNaming(); return; }
    const box = water.getBoundingClientRect();
    const x = event.clientX - box.left, y = clamp(event.clientY - box.top, H * .06, H - FH);
    playCue('pop', { ambient: true });
    if (!calm.matches) ripple(x, y);
    const bits = [];
    const n = food.length > 40 ? 3 : 7;
    for (let i = 0; i < n; i++) {
      const node = document.createElement('i');
      const [light, deep] = pickOne(foodColors);
      const size = rand(5, 9) * Math.max(.85, Math.min(1.25, k));
      node.className = 'ak-food' + (Math.random() < .45 ? ' flake' : '');
      node.style.setProperty('--s', size.toFixed(1) + 'px');
      node.style.setProperty('--c1', light);
      node.style.setProperty('--c2', deep);
      swim.append(node);
      const angle = rand(0, Math.PI * 2), speed = rand(25, 70) * Math.max(.8, k);
      const bit = { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * .6 - 12, node, seed: rand(0, 99), age: 0,
        sink: rand(12, 24) * Math.max(.8, k), spin: rand(-90, 90), turn: rand(0, 360), size, scale: .2, gulp: null };
      food.push(bit);
      bits.push(bit);
    }
    const hungry = fish.filter(f => !f.meal && !f.hold).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, 6);
    hungry.forEach((f, i) => { f.meal = bits[i % bits.length]; f.rest = 0; f.fed = Math.min(f.fed || 0, 2); });
    if (!fish.length) sayLine('Henüz yem yiyecek balık yok. Bir görev bitir, ilk balığın gelsin! 🐠');
  });
  // Rings on the water where the food fell in.
  function ripple(x, y) {
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('i');
      ring.className = 'ak-ripple';
      ring.style.left = x + 'px';
      ring.style.top = y + 'px';
      ring.style.animationDelay = (i * .22) + 's';
      swim.append(ring);
      setTimeout(() => ring.remove(), 1400);
    }
  }
  function moveFood(bit, dt) {
    bit.age += dt;
    if (bit.gulp) {
      // sucked into the mouth of the fish that snapped it
      const f = bit.gulp, t = Math.min(1, bit.age / .16);
      bit.x += (mouthX(f) - bit.x) * t;
      bit.y += (mouthY(f) - bit.y) * t;
      bit.scale = 1 - t;
      if (t >= 1) { bit.node.remove(); food = food.filter(other => other !== bit); return; }
    } else {
      bit.scale = Math.min(1, bit.scale + dt * 5);
      const floorY = sandY(bit.x) + FH * .25;
      if (bit.y < floorY) {
        // the sprinkle spreads, slows in the water and the flake sinks, swaying from side to side
        const drag = Math.exp(-3.2 * dt);
        bit.vx *= drag;
        bit.vy = bit.vy * drag + (bit.sink - bit.vy * drag) * (1 - drag);
        bit.x = clamp(bit.x + (bit.vx + Math.sin(bit.age * 2.2 + bit.seed) * 9) * dt, 6, W - 6);
        bit.y = Math.min(floorY, bit.y + bit.vy * dt);
        bit.turn += bit.spin * dt * Math.cos(bit.age * 1.7 + bit.seed);
      } else bit.vx = bit.vy = 0;
      // left on the sand, it melts away after a while
      if (bit.age > 22) bit.node.classList.add('gone');
      if (bit.age > 23) { dropFood(bit); return; }
    }
    bit.node.style.transform = 'translate(' + bit.x.toFixed(1) + 'px,' + bit.y.toFixed(1) + 'px) rotate(' + bit.turn.toFixed(0) + 'deg) scale(' + bit.scale.toFixed(2) + ')';
  }
  // The nearest flake within reach that fewer than two fish are after.
  function seek(f, reach = Infinity) {
    const free = food.filter(b => !b.gulp && fish.filter(o => o.meal === b).length < 2)
      .map(b => ({ b, d: Math.hypot(mouthX(f) - b.x, mouthY(f) - b.y) })).filter(c => c.d < reach).sort((p, q) => p.d - q.d);
    if (!free.length) return false;
    f.meal = free[0].b;
    f.rest = 0;
    return true;
  }
  function dropFood(bit) {
    food = food.filter(other => other !== bit);
    bit.node.remove();
    for (const f of fish) if (f.meal === bit) { f.meal = null; if (!seek(f)) pickTarget(f); }
  }
  function eat(f) {
    const bit = f.meal;
    f.meal = null;
    f.lunge = 0;
    f.chomp = .36;
    f.chew = rand(.35, .7);
    f.fed = (f.fed || 0) + 1;
    bit.gulp = f;
    bit.age = 0;
    // the others after this flake look for another one
    for (const o of fish) if (o.meal === bit) { o.meal = null; if (!seek(o)) pickTarget(o); }
    playCue('pop', { ambient: true, rate: rand(1.5, 1.9), gain: .45 });
    if (!calm.matches) nibble(mouthX(f), mouthY(f));
    if (f.fed < 4 && Math.random() < .9 && seek(f)) return;
    // full: a happy wiggle, then off it swims
    f.joy = .7;
    f.boost = .8;
    f.rest = rand(.4, 1);
    pickTarget(f);
  }
  // Tiny bubbles from the mouth of a fish that just ate.
  function nibble(x, y) {
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('i');
      b.className = 'ak-puff small';
      b.style.left = (x + rand(-3, 3)) + 'px';
      b.style.top = (y + rand(-3, 2)) + 'px';
      b.style.setProperty('--s', rand(3, 6).toFixed(1) + 'px');
      b.style.setProperty('--up', -Math.min(y, rand(40, 80)) + 'px');
      b.style.animationDelay = (.12 + i * .1).toFixed(2) + 's';
      swim.append(b);
      setTimeout(() => b.remove(), 1900);
    }
  }

  /* ---------- The stand: which tank, how full ---------- */
  function drawInfo() {
    const record = mine();
    const count = tankCount(record);
    const here = inTank(record, shown);
    const nFish = here.filter(e => e.t === 'b').length, nOrn = here.length - nFish;
    const room = V.BALIK + V.SUS;
    find('.ak-title').textContent = title();
    find('.ak-tank-name').textContent = tankName(shown);
    find('.ak-counts').innerHTML = '<span>🐟 ' + nFish + ' / ' + V.BALIK + ' balık</span><span>🪸 ' + nOrn + ' / ' + V.SUS + ' süs</span>';
    find('.ak-meter i').style.width = here.length / room * 100 + '%';
    find('.ak-help').textContent = here.length >= room
      ? (shown === count - 1 ? '✅ Bu akvaryum doldu! Bir sonraki ödülle yeni bir akvaryum açılacak.' : '✅ Bu akvaryum dolu.')
      : !record.esya.length ? (activeProfile?.grade === 'Okul öncesi' ? 'Bir adacığı bitirince ilk balığın gelecek. Her adacık bir balık ya da süs getirir.'
        : 'Adalarda bir görevi bitirince ilk balığın gelecek. Her görev bir balık ya da süs getirir.')
        : 'Bir balığa dokun, ona isim ver. Suya dokun, yem at. ' + (room - here.length) + ' ödül sonra bu akvaryum dolacak.';
    find('.ak-which').textContent = (shown + 1) + ' / ' + count;
    find('.ak-nav').hidden = count < 2;
    find('.ak-prev').disabled = shown === 0;
    find('.ak-next').disabled = shown >= count - 1;
  }
  // The rewards of tank a not seen yet have just come in (build() let them swim in or drop down): greet them,
  // and from now on they are at home.
  function welcome(a) {
    const record = mine();
    const came = inTank(record, a).filter(e => e.yeni);
    if (!came.length) return false;
    const names = came.map(e => V.tur(e.k).ad);
    sayLine('✨ ' + (came.length === 1 ? names[0] + ' geldi!' : came.length + ' yeni ödül geldi!') + (came.some(e => e.t === 'b') ? ' Ona dokun, bir isim ver.' : ''));
    playCue('star');
    for (const e of came) delete e.yeni;
    save();
    refresh();
    return true;
  }
  function go(a) {
    closeNaming();
    build(a);
    playCue('splash', { ambient: true });
    if (!welcome(a)) sayLine(tankName(a), false, 3400, true);
  }
  find('.ak-prev').onclick = () => { if (shown > 0) go(shown - 1); };
  find('.ak-next').onclick = () => { if (shown < tankCount(mine()) - 1) go(shown + 1); };

  /* ---------- Opening and closing ---------- */
  // tank: which tank to show (default: the one with new rewards, else the newest).
  function open({ tank = null, kapaninca = null } = {}) {
    if (!activeProfile) return;
    const record = mine();
    const count = tankCount(record);
    const fresh = record.esya.filter(e => e.yeni);
    const a = Number.isInteger(tank) && tank >= 0 && tank < count ? tank : fresh.length ? fresh[fresh.length - 1].a : count - 1;
    onClose = kapaninca;
    find('.ak-tell').hidden = !voiced();
    if (!dialog.open) dialog.showModal();
    closeNaming();
    // The room shows at once and the tank is filled in the next frame, so the tap answers straight away.
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => frameId = requestAnimationFrame(() => {
      frameId = 0;
      if (!dialog.open) return;
      drawCaustics();
      W = 0;
      measure();
      build(a);
      const before = record.gecmisSayi;
      if (before) {
        delete record.gecmisSayi;
        save();
      }
      if (!welcome(a)) {
        if (!record.esya.length) sayLine('Henüz balığın yok. Adalarda bir görevi bitir, ilk balığın gelsin! 🐠', true, 0, true);
        else sayLine('Bir balığa dokun, ona isim ver. Suya dokun, yem at. 🐠', false, 3400, true);
      }
      if (before) sayLine('🎁 Daha önce bitirdiğin görevler için akvaryumuna ' + before + ' ödül geldi! Balıklarına dokun, isim ver.', false, 7000);
      last = performance.now();
      frameId = requestAnimationFrame(frame);
    }));
  }
  // The caustic light and the pictures of the player's fish are made while the page is idle, before the tank opens.
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 300));
  idle(drawCaustics, { timeout: 5000 });
  let warming = false;
  function prewarm() {
    if (warming || !activeProfile) return;
    warming = true;
    // one picture per idle moment, for the kinds the player has now
    const next = () => {
      const kinds = activeProfile ? [...new Set(mine().esya.filter(e => e.t === 'b').map(e => e.k))] : [];
      const job = kinds.flatMap(kind => { const g = A.fishGeometry(kind); return ['body', ...(g.hasTail ? ['tail'] : []), ...(g.hasSpikes ? ['spikes'] : [])].map(part => [kind, part]); })
        .find(([kind, part]) => !sprites.has(spriteKey(kind, part)));
      if (!job) { warming = false; return; }
      sprite(job[0], job[1]);
      idle(next, { timeout: 3000 });
    };
    idle(next, { timeout: 3000 });
  }
  find('.ak-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    closeNaming();
    // ornaments that arrived now lose their sparkle next time
    for (const d of decor) d.node.classList.remove('arriving');
    refresh();
    const done = onClose;
    onClose = null;
    done?.();
  });
  let resizeTimer = 0;
  new ResizeObserver(() => {
    if (!dialog.open) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldW = W, oldH = H;
      measure();
      if (Math.abs(W - oldW) < 2 && Math.abs(H - oldH) < 2) return;
      layout();
      for (const f of fish) { f.x = clamp(f.x * W / Math.max(1, oldW), 0, W); f.y = clamp(f.y * H / Math.max(1, oldH), 0, H); pickTarget(f); }
    }, 120);
  }).observe(water);
  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else if (!frameId) { last = performance.now(); frameId = requestAnimationFrame(frame); }
  });
  $('aquarium-button').onclick = () => { playCue('splash', { ambient: true }); open(); };
  $('aquarium-card').onclick = () => { playCue('splash', { ambient: true }); open(); };

  // Settings and the admin page read a player's tank without opening it.
  const ozet = id => {
    const record = load(id);
    const fishList = record.esya.filter(e => e.t === 'b');
    return { balik: fishList.length, sus: record.esya.length - fishList.length, akvaryum: record.esya.length ? tankCount(record) : 0,
      isimli: fishList.filter(e => e.ad).length, yeni: record.esya.filter(e => e.yeni).length,
      sonBaliklar: fishList.slice(-3).map(e => e.k) };
  };
  // Elif Ba Adası's players cannot read yet: it gives the tank a voice (its device voice) for them.
  const sesVer = fn => { speak = fn; };
  return { odul, kart, ipucu, open, refresh, available, ozet, sesVer };
})();
