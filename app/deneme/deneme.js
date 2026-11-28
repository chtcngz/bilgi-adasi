// Deneme Odası: Elif Ba Adası için önerilen oyunların ilk, oynanabilir taslakları.
// Oyuncu profili, yıldız ya da ilerleme kullanmaz, hiçbir şey saklamaz. Harf ve hece sesleri oyunun
// kayıtlarından (elifVoice), Hece Treni'nin kelime kayıtları ve uzun (medli) heceler deneme/ses/ klasöründen gelir.
// Oyuna giren bir taslak buradan çıkarılır (OYUN-ONERILERI.md).
(() => {
  const { glyphs, names, harekeler, syllable, coves, coveLetters, LETTER_COVES } = elifData;
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
  // What a game must undo when it is left (the Papağan's microphone).
  const leaving = [];
  const onLeave = fn => leaving.push(fn);
  function leave() {
    stopAll(); clearLater();
    while (leaving.length) try { leaving.pop()(); } catch {}
  }

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
  // A spoken instruction, in the device's Turkish voice: the children cannot read yet.
  const instruct = (text, then) => { stopClip(); V.instruct(text, guarded(then, 2600 + text.length * 120)); };

  const clips = {
    kelime: ['خَلَقَ', 'فَتَحَ', 'دَخَلَ', 'شَجَرَ', 'جَعَلَ', 'تَرَكَ', 'ثَمَرَ', 'بَلَغَ', 'نَزَلَ', 'كَسَبَ']
  };
  const wordClip = w => 'deneme/ses/kelime-' + clips.kelime.indexOf(w) + '.mp3';
  // Uzatma (med): Diyanet's long syllables from the lessons Fetha'nın, Kesra'nın and Damme'nin Uzatılması
  // (deneme/ses/uzun/NN-H.mp3, sources in kaynak.json there). The short syllable they are compared with is the man's
  // clip of the game (Diyanet's, too), so the two are heard in the same voice and differ only in length.
  const longClip = (i, h) => 'deneme/ses/uzun/' + String(i).padStart(2, '0') + '-' + h + '.mp3';
  const shortClip = (i, h) => window.elifRecordings?.hece?.[i + '-' + h] || null;
  // An elif after the üstün, a ye after the esre, a vav after the ötre (بَا بِي بُو). Diyanet writes the long esre with a
  // vertical esre (ب۪ى), but that mark (U+06EA) breaks the letter in common phone fonts, so the plain spelling is used.
  const longText = (i, h) => h === 0 ? (i === 0 ? 'ءَا' : glyphs[i] + 'َا') : h === 1 ? glyphs[i] + 'ِي' : glyphs[i] + 'ُو';
  const sayShort = (i, h, then) => shortClip(i, h) ? playClip(shortClip(i, h), then) : saySyllable(i, h, then);
  const sayLong = (i, h, then) => playClip(longClip(i, h), then);


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
  const replayOf = id => () => openGame(games.find(g => g.id === id));


  /* ---------- Oyun listesi ---------- */
  // Oyuna girenler denemeden çıkarıldı: Akvaryum (0.16.0), Harf Bukalemunu (0.32.0), Kabuk Hafızası (0.83.0). Nokta Ustası,
  // Taş Atlama ve Kumda Yaz denendi, bırakıldı. `fresh`: 0.93.0'da gelen yeni fikirler, odada önde ve “Yeni” işaretli.
  // `intro` oyunun ne olduğu: Elif Ba'daki gibi kendiliğinden söylenmez, yalnızca 🐢💬 düğmesine dokununca söylenir.
  const games = [
    {
      id: 'uzat', icon: '🍬', title: 'Kısa mı Uzun mu?', fresh: true, where: 'Uzatma (med)',
      intro: 'Kısa mı uzun mu oyunu. Üstünden sonra elif, esreden sonra ye, ötreden sonra vav gelince hece uzun okunur. Dinle, kısa mı uzun mu bul.',
      idea: ['Kaplumbağa bir hece okuyor: ya kısa (بَ) ya uzun (بَا). Çocuk iki karttan birine dokunuyor: kısa kartın altında kısa, uzun kartın altında uzun bir sakız şeridi var. Okumayı bilmeyen çocuk da şeritten anlıyor; harfleri gördükçe uzatan elifi, ye’yi ve vav’ı tanıyor.',
        'Doğru kartta şerit ses boyunca uzuyor (ses uzadıkça sakız uzar). Yanlışta önce dokunulan, sonra doğru hece okunuyor; iki ses arka arkaya duyulunca fark belli oluyor.',
        'Haritada “Yakında” duran Uzatma Koyu’nun ilk oyunu olabilir. Kayıtlar hazır: Diyanet Elifba’nın Fetha’nın, Kesra’nın ve Damme’nin Uzatılması derslerinden 84 uzun hece (بَا بِي بُو …) bayt bayt alındı (deneme/ses/uzun/). Kısa heceler oyundaki aynı Diyanet sesi.',
        'Taslakta 10 tur; her turda başka bir harf, üç hareke sırayla, yarısı kısa yarısı uzun.'],
      start: startLong
    },
    {
      id: 'kalin', icon: '🐘', title: 'Fil mi Kuş mu?', fresh: true, where: 'Harekeler · Uzatma',
      intro: 'Fil mi kuş mu oyunu. Bazı harfler kalın okunur: Hı, Ra, Gayn, Kaf, Sad, Dad, Tı ve Zı. Kalın sesi file, ince sesi kuşa ver.',
      idea: ['Diyanet Elifba harfleri ince ve kalın diye iki gruba ayırıyor: خ ر غ ق ص ض ط ظ kalın okunur (sa, ta, kı), ötekiler ince (se, te, ki). Çocuklar en çok bu ikilileri karıştırıyor: س ile ص, ت ile ط, ك ile ق.',
        'Kaplumbağa bir hece okuyor ve heceyi gösteriyor. Kalın sesse file 🐘, ince sesse kuşa 🐤 veriliyor. Şıklar resim; yazı okumak gerekmiyor.',
        'Yanlışta fil kalın heceyi, kuş onun ince ikizini söylüyor (صَ “sa”, سَ “se”): çocuk iki sesi yan yana duyuyor.',
        'Yeni kayıt gerekmiyor. Harekeler adımına ya da Uzatma Koyu’na (Diyanet ince ve kalın harfleri uzatma derslerinde ayrı okutuyor) oyun olarak eklenebilir. Elif, Ha ve Ayn ince ama Türk kulağına “a” gibi geldiğinden taslakta sorulmuyor; Ra esreyle (ri) ince olduğundan yalnızca üstün ve ötreyle geliyor.'],
      start: startThick
    },
    {
      id: 'papagan', icon: '🦜', title: 'Papağan', fresh: true, where: 'Bütün bölümler · İngilizce Koyu',
      intro: 'Papağan oyunu. Önce kaplumbağayı dinle, sonra mikrofona dokun ve sen de söyle. Papağan iki sesi de tekrar eder.',
      idea: ['Bütün oyunlar duyduğunu bulmayı çalıştırıyor; Elif Ba’nın amacı ise sesli okumak. Bu oyunda çocuk kendisi söylüyor: kaplumbağayı dinliyor, 🎤 düğmesine dokunup söylüyor, sonra papağan önce kaplumbağanın, sonra çocuğun sesini tekrar ediyor.',
        'Puan ya da yanlış yok; çocuk kendi sesini öğretmeninkiyle yan yana duyup karşılaştırıyor. Çocuklar kendi seslerini dinlemeye bayılır. Konuşurken papağanın yanında ses çubukları kıpırdıyor.',
        'Kayıt cihazdan çıkmıyor, hiçbir yere gönderilmiyor ve saklanmıyor. Mikrofon izni verilmezse 🎤 düğmesi 🚫 oluyor, kaplumbağa yine dinlenebiliyor.',
        'Harf, hece ve uzun hece için üç sekme var. Aynı oyun İngilizce Koyu’nda kelimeleri söylemek için de kullanılabilir.'],
      start: startParrot
    },
    {
      id: 'yunus', icon: '🐬', title: 'Yunus Şarkısı', fresh: true, where: 'Harfler · mola oyunu',
      intro: 'Yunus şarkısı. Yunuslar harfleri sırayla söyler, sen de aynı sırayla dokun. Şarkı her seferinde uzar.',
      idea: ['Dört yunusun başında bir koyun dört harfi var. Yunuslar sırayla zıplayıp harflerini söylüyor; çocuk aynı sırayla yunuslara dokunuyor. Şarkı 2 harfle başlıyor, her seferinde bir harf uzuyor (2, 3, 4, 5).',
        'Sesleri sırayla aklında tutmak kelime okumanın temeli: هَلَكَ okunurken üç hece sırayla akılda kalmalı. Oyun bunu harflerle, oyun gibi çalıştırıyor.',
        'Yanlışta doğru yunus parlayıp zıplıyor, şarkı baştan bir daha söyleniyor; can yok.',
        'Yeni kayıt gerekmiyor. Her koyun harfleriyle ya da harekeli hecelerle oynanabilir; İngilizce Koyu’nda kelimelerle de olur.'],
      start: startDolphins
    },
    {
      id: 'fener', icon: '🔦', title: 'Fenerle Ara', fresh: true, where: 'Harfler · Bitişik yazılış',
      intro: 'Fenerle ara. Gece denizin dibinde harfler saklandı. Parmağını gezdir, fenerle ara, duyduğun harfi bul.',
      idea: ['Ekran gece denizi gibi karanlık; harfler kumun üstüne saklanmış. Çocuk parmağını gezdirdikçe bir fener ışığı onu izliyor ve ışığın altındaki harfler görünüyor. Kaplumbağa bir harf söylüyor, çocuk onu bulunca dokunuyor.',
        'Karanlıkta rastgele dokunmak işe yaramıyor: ilk dokunuş yalnızca ışık tutuyor, harf ancak görünürken seçilebiliyor. Bu yüzden çocuk harflere tek tek bakıyor.',
        'Aralarında hep noktadaş eşleri var (ب ت ث): harfi yalnızca şeklinden değil noktasından da tanımak gerekiyor. Yanlış harf adını söylüyor; doğru bulununca deniz aydınlanıyor.',
        'Yeni kayıt gerekmiyor. Bitişik yazılışta şekillerle, İngilizce Koyu’nda resimlerle (karanlık odada “Find the ball!”) de oynanabilir.'],
      start: startTorch
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
    { id: 'album', icon: '🐣', title: 'İlk Harf Albümüm', start: startAlbum },
    { id: 'buyutec', icon: '🐢', title: 'Harf Büyüteci', start: startMagnifier }
  ];

  /* ---------- Ana sayfa ---------- */
  function showHub() {
    leave();
    document.title = 'Deneme Odası · Bilgi Adası';
    lab.className = 'lab-hub';
    lab.innerHTML = '<div class="lab-intro"><h1>Deneme <em>Odası</em></h1></div>';
    const grid = el('div', 'lab-grid');
    // The new ideas first, then the preschool drafts, then the older ideas.
    const ordered = [...games.filter(g => g.fresh), ...games.filter(g => !g.fresh && !g.idea), ...games.filter(g => !g.fresh && g.idea)];
    for (const game of ordered) {
      const card = el('button', 'lab-card' + (game.fresh ? ' is-fresh' : ''));
      card.innerHTML = '<span class="lab-card-icon" aria-hidden="true">' + game.icon +
        '</span><span class="lab-card-text">' + (game.fresh ? '<small>✨ Yeni</small>' : '') + '<strong>' + game.title + '</strong>' +
        (game.where ? '<em>' + game.where + '</em>' : '') + '</span><span class="lab-go" aria-hidden="true">▶</span>';
      card.onclick = () => openGame(game);
      grid.append(card);
    }
    lab.append(grid);
    scrollTo(0, 0);
  }

  function openGame(game) {
    leave();
    document.title = game.title + ' · Deneme Odası';
    lab.className = 'lab-play lab-' + game.id;
    lab.replaceChildren();
    const bar = el('div', 'lab-bar');
    const back = pictureButton('Odaya dön', '🏠', 'lab-back');
    back.onclick = showHub;
    bar.append(back, el('h1', '', game.icon + ' ' + game.title));
    if (game.intro) {
      // What the game is about is said only when asked (🐢💬), as in Elif Ba Adası.
      const info = pictureButton('Bu oyun ne?', '🐢💬', 'lab-info');
      info.onclick = () => instruct(game.intro);
      bar.append(info);
    }
    const screen = el('div', 'lab-screen');
    lab.append(bar);
    if (game.idea) {
      const idea = el('details', 'lab-idea', '<summary>💡 Öneri</summary><ul>' + game.idea.map(text => '<li>' + text + '</li>').join('') + '</ul>');
      lab.append(idea);
    }
    lab.append(screen);
    scrollTo(0, 0);
    game.start(screen);
  }

  /* =========================================================
     Hece Treni
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
            else { steps.mark(words.length); finale(screen, 'Beş treni de yola çıkardın!', replayOf('tren')); }
          });
        });
      });
    }
    draw();
  }

  /* =========================================================
     Harekeyi Giydir
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
            else { steps.mark(ROUNDS); finale(screen, 'Bütün harfleri giydirdin!', replayOf('giydir')); }
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
     İnci Kolye
     ========================================================= */
  function startNecklace(screen) {
    const g = guide('kolye');
    const steps = dotsRow(LETTER_COVES); // the coves of the letters, not those of bitişik yazılış
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
          if (k < LETTER_COVES) draw();
          else { steps.mark(LETTER_COVES); finale(screen, 'Yedi koyun kolyesi tamam: 28 harf sırayla!', replayOf('kolye')); }
        });
      }));
    }
    draw();
  }

  function pictureButton(label, content, cls = '') {
    const button = el('button', 'picture-button ' + cls, content);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    return button;
  }

  function startAlbum(screen) {
    const steps = dotsRow(LETTER_COVES); // the coves of the letters, not those of bitişik yazılış
    const nest = el('section', 'nest-board');
    const face = pictureButton('Yuvayı keşfet', '🪺', 'nest-face');
    const eggs = el('div', 'egg-row');
    const nav = el('div', 'lab-actions');
    const prev = pictureButton('Önceki koy', '◀');
    const next = pictureButton('Sonraki koy', '▶');
    const opened = new Set();
    nav.append(prev, next);
    nest.append(face, eggs, nav);
    screen.append(steps.row, nest);
    let cove = 0;
    function draw() {
      stopAll();
      steps.mark(cove);
      eggs.replaceChildren();
      const letters = coveLetters(cove);
      const birds = ['🐣', '🐥', '🐤', '🐣'];
      const firstEgg = letters.find(i => !opened.has(i));
      face.innerHTML = '🪺';
      face.setAttribute('aria-label', 'Yuvadaki harfi aç');
      face.onclick = () => eggs.children[Math.max(0, letters.indexOf(firstEgg))].click();
      prev.disabled = cove === 0;
      next.disabled = cove === LETTER_COVES - 1;
      for (const [k, i] of letters.entries()) {
        const hatched = '<span aria-hidden="true">' + birds[k] + '</span>' + ar(glyphs[i]);
        const egg = pictureButton(names[i], opened.has(i) ? hatched : '🥚', 'nest-egg');
        egg.classList.toggle('tap-hint', i === firstEgg);
        egg.onclick = () => {
          opened.add(i);
          egg.innerHTML = hatched;
          face.innerHTML = '<span aria-hidden="true">' + birds[k] + '</span>' + ar(glyphs[i]);
          face.setAttribute('aria-label', names[i] + ' harfini tekrar dinle');
          face.onclick = () => sayLetter(i);
          sayLetter(i);
          for (const [n, card] of Array.from(eggs.children).entries()) {
            card.classList.toggle('tap-hint', letters[n] === letters.find(j => !opened.has(j)));
            card.setAttribute('aria-pressed', n === k);
          }
          next.classList.toggle('tap-hint', !next.disabled && letters.every(j => opened.has(j)));
          if (opened.size === glyphs.length && !nest.classList.contains('complete')) {
            nest.classList.add('complete');
            fx.confetti(screen, { count: 35 });
          }
        };
        eggs.append(egg);
      }
      next.classList.toggle('tap-hint', !next.disabled && firstEgg === undefined);
    }
    prev.onclick = () => { cove--; draw(); };
    next.onclick = () => { cove++; draw(); };
    draw();
  }

  function startMagnifier(screen) {
    const families = glyphs.map((_, i) => [i, ...elifData.twins(i)])
      .filter(group => group.length > 1 && group[0] === Math.min(...group));
    const rounds = [[0, 1], ...shuffled(families).slice(0, 5)];
    const steps = dotsRow(rounds.length);
    const board = el('section', 'match-board');
    const turtle = el('div', 'lab-turtle', turtleSvg('match-guide'));
    const model = pictureButton('Harfi dinle', '', 'match-model');
    const guideRow = el('div', 'match-guide');
    guideRow.append(turtle, model);
    const tray = el('div', 'match-tray');
    board.append(guideRow, tray);
    screen.append(steps.row, board);
    let round = 0;
    function draw() {
      const family = rounds[round];
      const target = round === 0 ? 0 : pick(family);
      model.innerHTML = ar(glyphs[target]) + '<small aria-hidden="true">🔊</small>';
      model.onclick = () => sayLetter(target);
      model.classList.remove('matched');
      tray.replaceChildren();
      steps.mark(round);
      for (const i of shuffled(family)) {
        const card = pictureButton(names[i], ar(glyphs[i]), 'match-card');
        const correct = i === target;
        card.classList.toggle('tap-hint', correct && !round);
        card.onclick = () => {
          sayLetter(i);
          if (!correct) {
            card.disabled = true;
            tray.querySelector('[data-match]').classList.add('tap-hint');
            return;
          }
          for (const other of tray.children) other.disabled = true;
          card.classList.remove('tap-hint');
          card.classList.add('matched');
          model.classList.add('matched');
          fx.burst(card, { count: 8 });
          wait(1450, () => {
            if (++round < rounds.length) return draw();
            steps.mark(round);
            board.remove();
            finale(screen, '🌟', replayOf('buyutec'));
          });
        };
        if (correct) card.dataset.match = '';
        tray.append(card);
      }
      sayLetter(target);
    }
    draw();
  }

  /* =========================================================
     Yeni: Kısa mı Uzun mu? (Uzatma)
     ========================================================= */
  // The heard syllable is short (بَ) or long (بَا); the child taps the card with the short or the long band of chewing gum.
  function startLong(screen) {
    const ROUNDS = 10;
    const g = guide('uzat');
    const steps = dotsRow(ROUNDS);
    const pair = el('div', 'long-pair');
    pair.dir = 'rtl';
    screen.append(g.box, steps.row, pair);
    // Every round another letter and the three harekes in turn; half of them short, half long.
    const lengths = shuffled(Array.from({ length: ROUNDS }, (_, n) => n % 2 === 1));
    const order = shuffled([...Array(28).keys()]).slice(0, ROUNDS).map((i, n) => ({ i, h: n % 3, long: lengths[n] }));
    let round = 0, busy = false, told = false, cards = [];
    const play = (long, then) => { const { i, h } = order[round]; (long ? sayLong : sayShort)(i, h, then); };
    // While a card's syllable is heard its band grows: short and quick, or long and slow.
    function sing(card, long, then) {
      card.classList.remove('sing'); void card.offsetWidth; card.classList.add('sing');
      g.talk(true);
      play(long, () => { g.talk(false); then?.(); });
    }
    const ask = () => { if (!busy) { g.talk(true); play(order[round].long, () => g.talk(false)); } };
    function draw() {
      busy = false;
      steps.mark(round);
      const { i, h } = order[round];
      pair.replaceChildren();
      cards = [false, true].map(long => {
        const card = el('button', 'long-card ' + (long ? 'is-long' : 'is-short'),
          ar(long ? longText(i, h) : syllable(i, h)) + '<span class="long-band" aria-hidden="true"><i></i></span>');
        card.type = 'button'; card.dataset.cue = '';
        card.setAttribute('aria-label', long ? 'Uzun' : 'Kısa');
        card.onclick = () => choose(long, card);
        pair.append(card);
        return card;
      });
      g.mood();
      g.set('Kısa mı, uzun mu? Dinle ve doğru karta dokun.', ask);
      if (told) wait(350, ask);
      else { told = true; wait(300, () => instruct('Dinle. Kısa mı, uzun mu? Doğru karta dokun.', ask)); }
    }
    function choose(long, card) {
      if (busy) return;
      const target = order[round];
      const right = cards[target.long ? 1 : 0];
      if (long === target.long) {
        busy = true;
        card.classList.remove('wrong');
        card.classList.add('right');
        g.mood('happy');
        g.set('Harika! ' + ar(target.long ? longText(target.i, target.h) : syllable(target.i, target.h), 'small'), null);
        sing(card, long, () => {
          playCue('correct');
          fx.burst(card, { count: 12 });
          wait(700, () => {
            round++;
            if (round < ROUNDS) draw();
            else { steps.mark(ROUNDS); finale(screen, '🍬 🌟', replayOf('uzat')); }
          });
        });
        return;
      }
      // Wrong: the tapped card is read, then the right one glows and is read; it still has to be tapped.
      busy = true;
      playCue('oops'); g.mood('sad'); fx.bump(card, 'lab-shake');
      card.classList.add('wrong');
      sing(card, long, () => wait(250, () => {
        right.classList.add('hint');
        sing(right, target.long, () => { busy = false; });
      }));
    }
    draw();
  }

  /* =========================================================
     Yeni: Fil mi Kuş mu? (kalın ve ince harfler)
     ========================================================= */
  // Diyanet's Elifba sorts the letters into thin and thick ones (the headings lesson_groups.thin_letters and
  // thick_letters of its Uzatma lessons): خ ر غ ق ص ض ط ظ are read thick. Ra is thin with an esre (ri), so it only
  // comes with an üstün or an ötre. Elif, Ha and Ayn are thin but sound like "a" to a Turkish ear: left out here.
  const THICK = [6, 9, 18, 20, 13, 14, 15, 16];
  const THIN = [1, 2, 3, 4, 7, 8, 10, 11, 12, 19, 21, 22, 23, 24, 25, 26, 27];
  // A thick letter and the thin one it is most often mixed up with (sa / se, da / de, ta / te, za / ze, ka / ke).
  const TWIN = { 13: 11, 14: 7, 15: 2, 16: 10, 20: 21 };
  for (const [a, b] of Object.entries(TWIN)) TWIN[b] = Number(a);
  const isThick = i => THICK.includes(i);
  function startThick(screen) {
    const ROUNDS = 12;
    const g = guide('kalin');
    const steps = dotsRow(ROUNDS);
    const card = el('button', 'thick-card');
    card.type = 'button'; card.dataset.cue = '';
    card.setAttribute('aria-label', 'Heceyi dinle');
    const homes = el('div', 'thick-homes');
    const home = thick => {
      const b = el('button', 'thick-home ' + (thick ? 'is-thick' : 'is-thin'),
        '<span class="thick-animal" aria-hidden="true">' + (thick ? '🐘' : '🐤') + '</span><span class="thick-say"></span>');
      b.type = 'button'; b.dataset.cue = '';
      b.setAttribute('aria-label', thick ? 'Kalın: fil' : 'İnce: kuş');
      b.onclick = () => choose(thick, b);
      return b;
    };
    const fil = home(true), kus = home(false);
    homes.append(fil, kus);
    screen.append(g.box, steps.row, card, homes);
    const order = shuffled([...shuffled(THICK).slice(0, ROUNDS / 2), ...shuffled(THIN).slice(0, ROUNDS / 2)])
      .map(i => ({ i, h: i === 9 ? pick([0, 2]) : pick([0, 1, 2]) }));
    let round = 0, busy = false, told = false;
    const target = () => order[round];
    const ask = () => { if (!busy) { g.talk(true); sayShort(target().i, target().h, () => g.talk(false)); } };
    card.onclick = ask;
    function clear() {
      for (const b of [fil, kus]) { b.classList.remove('hint', 'wrong', 'right', 'sing'); b.querySelector('.thick-say').innerHTML = ''; }
    }
    function draw() {
      busy = false;
      steps.mark(round);
      clear();
      card.className = 'thick-card';
      card.innerHTML = ar(syllable(target().i, target().h));
      g.mood();
      g.set('Kalın mı, ince mi? Kalın sesi file 🐘, ince sesi kuşa 🐤 ver.', ask);
      if (told) wait(350, ask);
      else { told = true; wait(300, () => instruct('Dinle. Kalın mı, ince mi? Kalın sesi file, ince sesi kuşa ver.', ask)); }
    }
    // An animal says a syllable, holding it written above its head.
    function say(b, i, h, then) {
      b.querySelector('.thick-say').innerHTML = ar(syllable(i, h));
      b.classList.remove('sing'); void b.offsetWidth; b.classList.add('sing');
      sayShort(i, h, then);
    }
    function choose(thick, b) {
      if (busy) return;
      const { i, h } = target();
      if (thick === isThick(i)) {
        busy = true;
        clear();
        b.classList.add('right');
        card.classList.add(thick ? 'to-thick' : 'to-thin');
        playCue('key');
        g.mood('happy');
        say(b, i, h, () => {
          playCue('correct');
          fx.burst(b, { count: 10 });
          wait(700, () => {
            round++;
            if (round < ROUNDS) draw();
            else { steps.mark(ROUNDS); finale(screen, '🐘 🐤 🌟', replayOf('kalin')); }
          });
        });
        return;
      }
      // Wrong: the right animal says the syllable; with a twin of the other kind the other animal then says it,
      // so the thick and the thin sound are heard side by side (sa, se). The right animal still has to be tapped.
      busy = true;
      playCue('oops'); g.mood('sad'); fx.bump(b, 'lab-shake');
      b.classList.add('wrong');
      const right = isThick(i) ? fil : kus;
      wait(300, () => say(right, i, h, () => {
        right.classList.add('hint');
        const twin = TWIN[i];
        if (twin === undefined) { busy = false; return; }
        wait(300, () => say(b, twin, h, () => { busy = false; }));
      }));
    }
    draw();
  }

  /* =========================================================
     Yeni: Papağan (söyle ve dinle)
     ========================================================= */
  // The child says what the turtle said into the microphone; the parrot plays the turtle's voice and then the
  // child's. Nothing is scored, sent or kept: the recording lives in memory until the next one or until the game is left.
  function startParrot(screen) {
    const COUNT = 8;
    const kinds = [
      { label: 'ا', item: i => ({ i }) },
      { label: 'بَ', item: (i, n) => ({ i, h: n % 3 }) },
      { label: 'بَا', item: (i, n) => ({ i, h: n % 3, long: true }) }
    ];
    let kind = 1, items = [], at = 0, told = false;
    const g = guide('papagan');
    const tabs = el('div', 'lab-tabs');
    const steps = dotsRow(COUNT);
    const stage = el('div', 'parrot-stage');
    const show = el('button', 'parrot-card');
    show.type = 'button'; show.dataset.cue = '';
    show.setAttribute('aria-label', 'Kaplumbağayı dinle');
    const bird = el('div', 'parrot-bird', '<span aria-hidden="true">🦜</span><i class="parrot-level" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i>');
    stage.append(show, bird);
    const controls = el('div', 'parrot-controls');
    const teacher = pictureButton('Kaplumbağayı dinle', '🐢🔊', 'parrot-teacher');
    const micButton = pictureButton('Mikrofona söyle', '🎤', 'parrot-mic');
    const mine = pictureButton('Kendi sesini dinle', '🦜🔊', 'parrot-mine');
    const next = pictureButton('Sonraki', '▶', 'parrot-next');
    controls.append(teacher, micButton, mine, next);
    screen.append(g.box, tabs, steps.row, stage, controls);
    kinds.forEach((k, n) => {
      const b = el('button', '', ar(k.label));
      b.type = 'button';
      b.onclick = () => { kind = n; build(); };
      tabs.append(b);
    });

    const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    let stream = null, recorder = null, recording = false, childClip = null, meterStop = null;
    onLeave(() => {
      if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; try { recorder.stop(); } catch {} }
      meterStop?.();
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      forget();
    });
    function forget() { if (childClip) { cache.delete(childClip); URL.revokeObjectURL(childClip); childClip = null; } }
    function noMic() {
      micButton.innerHTML = '🚫';
      micButton.disabled = true;
      micButton.classList.remove('tap-hint');
      instruct('Mikrofon açılmadı.');
    }
    // The bars beside the parrot move with the child's voice while it records.
    function meter() {
      const ctx = playCue.context?.();
      if (!ctx || !stream) return () => {};
      let raf = 0, node, analyser;
      try {
        node = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        node.connect(analyser);
        // Some browsers only fill an analyser that leads to the speakers: through a silent gain.
        const mute = ctx.createGain();
        mute.gain.value = 0;
        analyser.connect(mute).connect(ctx.destination);
      } catch { return () => {}; }
      const data = new Uint8Array(analyser.fftSize);
      const bars = [...bird.querySelectorAll('.parrot-level b')];
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        const level = Math.min(1, peak / 60);
        bars.forEach((bar, n) => bar.style.setProperty('--h', Math.max(.12, level * (1 - Math.abs(n - 2) * .22)).toFixed(2)));
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => { cancelAnimationFrame(raf); try { node.disconnect(); } catch {} bars.forEach(bar => bar.style.removeProperty('--h')); };
    }

    const item = () => items[at];
    const text = it => it.h === undefined ? glyphs[it.i] : it.long ? longText(it.i, it.h) : syllable(it.i, it.h);
    function sayTeacher(then) {
      const it = item();
      teacher.classList.add('playing');
      const end = () => { teacher.classList.remove('playing'); g.talk(false); then?.(); };
      g.talk(true);
      if (it.h === undefined) sayLetter(it.i, end); else if (it.long) sayLong(it.i, it.h, end); else sayShort(it.i, it.h, end);
    }
    function sayChild(then) {
      if (!childClip) return then?.();
      bird.classList.add('talk');
      playClip(childClip, () => { bird.classList.remove('talk'); then?.(); });
    }
    function hint(button) {
      for (const b of [teacher, micButton, mine, next]) b.classList.toggle('tap-hint', b === button);
    }
    function build() {
      leaveRecording();
      Array.from(tabs.children).forEach((b, n) => b.classList.toggle('on', n === kind));
      items = shuffled([...Array(28).keys()]).slice(0, COUNT).map((i, n) => kinds[kind].item(i, n));
      at = 0;
      draw();
    }
    function draw() {
      stopAll(); clearLater();
      forget();
      steps.mark(at);
      show.innerHTML = ar(text(item()));
      if (!canRecord) { micButton.innerHTML = '🚫'; micButton.disabled = true; }
      mine.disabled = true;
      // Without a microphone the next card is always open.
      next.disabled = !micButton.disabled;
      hint(micButton.disabled ? next : micButton);
      g.mood();
      g.set('Dinle, sonra 🎤 dokun ve sen de söyle. Papağan ikinizi de tekrar edecek.', () => sayTeacher());
      if (told) wait(300, () => sayTeacher());
      else { told = true; wait(300, () => instruct('Dinle, sonra mikrofona dokun ve sen de söyle. Papağan ikinizi de tekrar edecek.', () => sayTeacher())); }
    }
    function leaveRecording() {
      if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; try { recorder.stop(); } catch {} }
      recording = false;
      micButton.classList.remove('rec');
      meterStop?.(); meterStop = null;
    }
    async function record() {
      if (recording) { recorder?.stop(); return; }
      stopAll();
      if (!stream) {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
        catch { noMic(); next.disabled = false; hint(next); return; }
      }
      const chunks = [];
      try { recorder = new MediaRecorder(stream); } catch { noMic(); next.disabled = false; hint(next); return; }
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        leaveRecording();
        if (!chunks.length) return;
        forget();
        childClip = URL.createObjectURL(new Blob(chunks, { type: chunks[0].type || recorder.mimeType || 'audio/webm' }));
        mine.disabled = false;
        // The parrot repeats both: first the turtle, then the child.
        hint(null);
        wait(250, () => sayTeacher(() => wait(250, () => sayChild(() => { next.disabled = false; hint(next); }))));
      };
      recorder.start();
      recording = true;
      playCue('tap');
      micButton.classList.add('rec');
      hint(null);
      meterStop = meter();
      wait(2600, () => { if (recording) recorder.stop(); });
    }
    teacher.onclick = () => sayTeacher();
    show.onclick = () => sayTeacher();
    mine.onclick = () => sayChild();
    micButton.onclick = record;
    next.onclick = () => {
      leaveRecording();
      at++;
      if (at < COUNT) { playCue('key'); draw(); }
      else { steps.mark(COUNT); finale(screen, '🦜 🌟', () => { screen.querySelector('.lab-finale')?.remove(); build(); }); }
    };
    build();
  }

  /* =========================================================
     Yeni: Yunus Şarkısı (sıra hafızası)
     ========================================================= */
  // The four dolphins of a cove sing a tune of its letters, one after the other; the child taps them in the same order.
  // The tune gets one letter longer every time (2, 3, 4, 5). A mistake shows the right dolphin and sings the tune again.
  function startDolphins(screen) {
    const LENGTHS = [2, 3, 4, 5];
    const g = guide('yunus');
    const steps = dotsRow(LENGTHS.length);
    const sea = el('div', 'dolphin-sea');
    sea.dir = 'rtl';
    screen.append(g.box, steps.row, sea);
    const letters = shuffled(coveLetters(Math.floor(Math.random() * LETTER_COVES)));
    const pods = letters.map((i, n) => {
      const b = el('button', 'dolphin tone-' + n, '<span class="dolphin-body" aria-hidden="true">🐬</span><span class="dolphin-letter">' + ar(glyphs[i]) + '</span>');
      b.type = 'button'; b.dataset.cue = '';
      b.setAttribute('aria-label', names[i]);
      b.onclick = () => tap(n);
      sea.append(b);
      return b;
    });
    let level = 0, tune = [], at = 0, listening = false, told = false;
    const jump = n => { const b = pods[n]; b.classList.remove('jump'); void b.offsetWidth; b.classList.add('jump'); };
    function sing(n, then) {
      if (n >= tune.length) return then?.();
      jump(tune[n]);
      sayLetter(letters[tune[n]], () => wait(220, () => sing(n + 1, then)));
    }
    function play() {
      listening = false;
      sea.classList.add('singing');
      g.talk(true);
      sing(0, () => { g.talk(false); sea.classList.remove('singing'); listening = true; at = 0; });
    }
    function newTune() {
      tune = [];
      while (tune.length < LENGTHS[level]) {
        const n = Math.floor(Math.random() * pods.length);
        if (n !== tune.at(-1)) tune.push(n);
      }
    }
    function start() {
      steps.mark(level);
      newTune();
      g.mood();
      g.set('Yunusları dinle, sonra aynı sırayla dokun.', () => { if (listening) play(); });
      if (told) wait(500, play);
      else { told = true; wait(300, () => instruct('Yunuslar şarkı söylüyor. Dinle, sonra aynı sırayla yunuslara dokun.', play)); }
    }
    function tap(n) {
      if (!listening) return;
      jump(n);
      if (n === tune[at]) {
        sayLetter(letters[n]);
        at++;
        if (at < tune.length) return;
        listening = false;
        g.mood('happy');
        wait(700, () => {
          playCue('correct');
          fx.burst(sea, { count: 12, symbols: ['♪', '♫', '✦'] });
          wait(900, () => {
            level++;
            if (level < LENGTHS.length) start();
            else { steps.mark(LENGTHS.length); finale(screen, '🐬 🎶 🌟', replayOf('yunus')); }
          });
        });
        return;
      }
      // Wrong: the dolphin that should have sung glows and sings, then the whole tune again.
      listening = false;
      playCue('oops'); g.mood('sad'); fx.bump(pods[n], 'lab-shake');
      const right = pods[tune[at]];
      wait(400, () => {
        right.classList.add('hint');
        jump(tune[at]);
        sayLetter(letters[tune[at]], () => wait(700, () => { right.classList.remove('hint'); g.mood(); play(); }));
      });
    }
    start();
  }

  /* =========================================================
     Yeni: Fenerle Ara
     ========================================================= */
  // Letters hide on the dark sea floor; the light follows the finger. A letter can only be chosen while it is lit
  // before the tap, so tapping blindly in the dark only lights the spot.
  function startTorch(screen) {
    const ROUNDS = 8, SHOWN = 6, R = 80;
    const g = guide('fener');
    const steps = dotsRow(ROUNDS);
    const night = el('div', 'torch-night');
    const floor = el('div', 'torch-floor');
    const dark = el('div', 'torch-dark');
    night.append(floor, dark);
    screen.append(g.box, steps.row, night);
    const targets = shuffled([...Array(28).keys()]).slice(0, ROUNDS);
    let round = 0, busy = false, told = false, spots = [];
    let light = { x: -999, y: -999 }, litBefore = new Set();
    const place = (x, y) => {
      light = { x, y };
      night.style.setProperty('--x', x + 'px');
      night.style.setProperty('--y', y + 'px');
    };
    const local = e => { const r = night.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const centre = b => { const r = b.getBoundingClientRect(), n = night.getBoundingClientRect(); return [r.left + r.width / 2 - n.left, r.top + r.height / 2 - n.top]; };
    const lit = b => { const [x, y] = centre(b); return Math.hypot(x - light.x, y - light.y) < R * .85; };
    night.addEventListener('pointermove', e => place(...local(e)));
    night.addEventListener('pointerdown', e => {
      litBefore = new Set(spots.filter(s => lit(s.node)).map(s => s.node));
      place(...local(e));
    });
    const target = () => targets[round];
    const ask = () => { if (!busy) { g.talk(true); sayLetter(target(), () => g.talk(false)); } };
    function draw() {
      busy = false;
      steps.mark(round);
      // The dark comes back at once, so the new letters are not seen while it fades in.
      dark.style.transition = 'none';
      night.classList.remove('dawn');
      void dark.offsetWidth;
      dark.style.transition = '';
      floor.replaceChildren();
      // The letter, its look-alikes and other letters, on a 4 × 3 grid of cells with a little jitter.
      const t = target();
      const shown = [t, ...shuffled(elifData.twins(t))];
      for (const i of shuffled([...Array(28).keys()])) if (shown.length < SHOWN && !shown.includes(i)) shown.push(i);
      const cells = shuffled([...Array(12).keys()]).slice(0, SHOWN);
      spots = shuffled(shown).map((i, n) => {
        const c = cells[n];
        const x = 12.5 + (c % 4) * 25 + (Math.random() - .5) * 10;
        const y = 17 + Math.floor(c / 4) * 33 + (Math.random() - .5) * 12;
        const node = el('button', 'torch-letter', ar(glyphs[i]));
        node.type = 'button'; node.dataset.cue = '';
        node.setAttribute('aria-label', 'Saklı harf');
        node.style.left = x + '%';
        node.style.top = y + '%';
        node.style.setProperty('--turn', ((Math.random() - .5) * 24).toFixed(1) + 'deg');
        // A click without a pointer (the keyboard) needs no light.
        node.onclick = e => choose(i, node, e.detail === 0);
        floor.append(node);
        return { i, node };
      });
      g.mood();
      g.set('Feneri gezdir, duyduğun harfi bul ve dokun.', ask);
      if (told) wait(400, ask);
      else { told = true; wait(300, () => instruct('Karanlıkta harfler saklandı. Parmağını gezdir, fenerle ara. Duyduğun harfi bulunca dokun.', ask)); }
    }
    function choose(i, node, keyboard) {
      if (busy || !(keyboard || litBefore.has(node))) return;
      litBefore.clear();
      if (i === target()) {
        busy = true;
        node.classList.add('right');
        night.classList.add('dawn');
        g.mood('happy');
        playCue('correct');
        fx.burst(node, { count: 12 });
        sayLetter(i, () => wait(900, () => {
          round++;
          if (round < ROUNDS) draw();
          else { steps.mark(ROUNDS); finale(screen, '🔦 🌟', replayOf('fener')); }
        }));
        return;
      }
      // Wrong: the letter says its own name, then the one to find is said again.
      busy = true;
      playCue('oops'); g.mood('sad'); fx.bump(node, 'lab-shake');
      node.classList.add('wrong');
      sayLetter(i, () => wait(300, () => { node.classList.remove('wrong'); busy = false; g.mood(); ask(); }));
    }
    // Before the first touch the light waits in the middle.
    requestAnimationFrame(() => { const r = night.getBoundingClientRect(); place(r.width / 2, r.height / 2); });
    draw();
  }

  // Unknown or retired links (#kabuk) open the room.
  const direct = games.find(g => '#' + g.id === location.hash);
  if (direct) openGame(direct); else showHub();
  addEventListener('hashchange', () => { const g = games.find(x => '#' + x.id === location.hash); if (g) openGame(g); else showHub(); });
})();
