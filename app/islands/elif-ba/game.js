// Elif Ba Adası: an island in sections. Section 1 teaches the letters, section 2 the harekes, section 3
// how the letters are written joined (bitişik yazılış), section 4 the cezm, section 5 the tenvin, section 6 the
// şedde; the later sections (uzatma, ...) open in coming releases. Letters and sections are in data.js; the listening games
// (Harf Yağmuru, Hece Balonları, Şekil Yağmuru, Cezm and Tenvin Balonları) in games/listening.js, the mixed
// game at the end of every cove (Cam Köprü) in games/bridge.js.
(() => {
  const { glyphs, names, readings, harekeler, coves, LETTER_COVES, coveTopic, sections, bays, bayCoves, bayOf, sameSound, syllable, coveLetters, coveGlyphs, twins, places,
    joinsNext, shape, word, cezm, cezmAlike, cezmFaint, cezmExamples, tenvinler, tenvin, tenvinExamples, SEDDE, sedde, seddesiz, seddeLetter,
    seddeExamples, mastery } = elifData;
  // A syllable is named by its letter and hareke ("Be üstün"); its Turkish reading is never written.
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const syllableName = (i, h) => names[i] + ' ' + hareke(h);
  // "Be iki üstün": a letter with a tenvin.
  const tenvinMark = h => tenvinler[h].name.toLocaleLowerCase('tr');
  const tenvinName = (i, h) => names[i] + ' ' + tenvinMark(h);
  // "Sin şedde üstün", and the same letters without the şedde: "Be esre, Sin üstün". In Elif's place the hemze.
  const seddeName = (i, h) => elifKinds.sedde.name(i * 3 + h);
  const seddesizName = (i, h) => elifKinds.sedde.name(84 + i * 3 + h);
  const seddeFaint = i => cezmFaint(i);
  const voice = elifVoice;
  const dialog = $('elif-game');
  const records = new Map();
  let progress, section = null, cove = 0;
  // True on entering the island: the map then shows the bays, with the turtle at the islet being learned.
  let arriving = true;
  let round, turn, earned;

  /* ---------- Progress ---------- */
  const storeKey = id => 'elif-ba-v2-' + id;
  // yagmur (Harf Yağmuru), balon (Hece Balonları), sekil (Şekil Yağmuru), cezmbalon (Cezm Balonları), tenvinbalon (Tenvin
  // Balonları), seddebalon (Şedde Balonları), the games that can be played in their place (yengec, kabuk, olta, sepet: games/arcade.js) and kopru (Cam Köprü): the
  // game's best score, the most hearts (stars) a section was finished with, whether it was ever finished
  // with all three, and the coves whose game step was played to the end (koylar).
  const parts = ['harf', 'hareke', 'bitisik', 'cezm', 'tenvin', 'sedde'];
  const gameNames = ['yagmur', 'balon', 'sekil', 'cezmbalon', 'tenvinbalon', 'seddebalon', 'yengec', 'kabuk', 'olta', 'sepet', 'kopru'];
  // The games a game step can be played with besides its own (games/arcade.js); their records keep the islets played on.
  const otherGames = ['yengec', 'kabuk', 'olta', 'sepet'];
  const blankGame = () => ({ rekor: 0, yildiz: 0, tamam: false, koylar: Array(coves.length).fill(false) });
  function blank() {
    // (Until 0.41.0 a `balik` list kept the letter fish of Elif Ba's own aquarium; the island now fills the
    // shared Akvaryum, core/js/akvaryum.js, and the list is dropped on the next save.)
    return { harf: Array(28).fill(0), hareke: Array(28).fill(0), bitisik: Array(28).fill(0), cezm: Array(28).fill(0), tenvin: Array(28).fill(0),
      sedde: Array(28).fill(0), tanisma: false, yagmur: blankGame(), balon: blankGame(), sekil: blankGame(), cezmbalon: blankGame(), tenvinbalon: blankGame(),
      seddebalon: blankGame(),
      yengec: blankGame(), kabuk: blankGame(), olta: blankGame(), sepet: blankGame(), kopru: blankGame() };
  }
  function load(id) {
    if (records.has(id)) return records.get(id);
    const saved = readRecord(storeKey(id));
    const record = blank();
    if (saved && typeof saved === 'object') {
      for (const part of parts) {
        if (Array.isArray(saved[part])) saved[part].slice(0, 28).forEach((n, i) => {
          if (Number.isInteger(n) && n > 0) record[part][i] = n;
        });
      }
      record.tanisma = saved.tanisma === true;
      for (const name of gameNames) {
        const game = saved[name];
        if (!game || typeof game !== 'object') continue;
        if (Number.isInteger(game.rekor) && game.rekor > 0) record[name].rekor = game.rekor;
        // Stars from before the fifteen-letter section (0.9.0 had ten-letter rounds) do not count.
        if ('tamam' in game) {
          if (Number.isInteger(game.yildiz) && game.yildiz > 0) record[name].yildiz = Math.min(3, game.yildiz);
          record[name].tamam = game.tamam === true;
        }
        if (Array.isArray(game.koylar)) game.koylar.slice(0, coves.length).forEach((on, k) => { record[name].koylar[k] = on === true; });
      }
      // Players from before the games were steps of the path: a game step counts as played
      // when a later step is already done, so nobody is sent back.
      const done = (part, k) => k < 7 && coveLetters(k).every(i => record[part][i] >= mastery);
      for (let k = 0; k < 7; k++) {
        if (done('hareke', k) || done('harf', k + 1)) record.yagmur.koylar[k] = true;
        if (done('harf', k + 1)) record.balon.koylar[k] = true;
        // Cam Köprü came in 0.14.0 as the last step of a cove: coves already left behind have crossed it.
        if (done('harf', k + 1)) record.kopru.koylar[k] = true;
      }
    } else {
      // Version 0.1 kept the letters found in the matching game as a list of indexes.
      const old = readRecord('elif-ba-' + id);
      // It listed ه before و, so those two indexes trade places.
      const moved = i => i === 25 ? 26 : i === 26 ? 25 : i;
      if (Array.isArray(old)) for (const i of old) if (Number.isInteger(i) && i >= 0 && i < 28) record.harf[moved(i)] = 1;
    }
    records.set(id, record);
    return record;
  }
  let storageNote = '';
  function save() {
    try {
      localStorage.setItem(storeKey(activeProfile.id), JSON.stringify(progress));
      localStorage.removeItem('elif-ba-' + activeProfile.id);
      storageNote = '';
    } catch { storageNote = 'İlerlemen yalnızca bu oturumda saklanabildi.'; }
  }
  const mastered = (part, i, record = progress) => record[part][i] >= mastery;
  const masteredCount = (part, record = progress) => record[part].filter(n => n >= mastery).length;
  const coveDone = (part, k) => coveLetters(k).every(i => mastered(part, i));
  // The island is one path, cove by cove: the cove's letters, Harf Yağmuru, (before the first
  // harekes: meeting the harekes), the same letters with harekes, Hece Balonları, and Cam Köprü,
  // the mixed game that crosses over to the next cove. A bitişik yazılış cove has the shapes of its
  // letters, Şekil Yağmuru and Cam Köprü; a cezm cove its letters' cezm syllables, Cezm Balonları and Cam
  // Köprü; a tenvin cove its letters with the three tenvins, Tenvin Balonları and Cam Köprü; a şedde cove its
  // letters' şedde syllables, Şedde Balonları and Cam Köprü. Only the first step not yet done can be started; every
  // step done stays open to replay.
  const steps = coves.flatMap((_, k) => coveTopic(k) === 'sedde' ? [
    { part: 'sedde', cove: k },
    { game: 'seddebalon', cove: k },
    { game: 'kopru', cove: k }
  ] : coveTopic(k) === 'tenvin' ? [
    { part: 'tenvin', cove: k },
    { game: 'tenvinbalon', cove: k },
    { game: 'kopru', cove: k }
  ] : coveTopic(k) === 'bitisik' ? [
    { part: 'bitisik', cove: k },
    { game: 'sekil', cove: k },
    { game: 'kopru', cove: k }
  ] : coveTopic(k) === 'cezm' ? [
    { part: 'cezm', cove: k },
    { game: 'cezmbalon', cove: k },
    { game: 'kopru', cove: k }
  ] : [
    { part: 'harf', cove: k },
    { game: 'yagmur', cove: k },
    ...(k === 0 ? [{ intro: true, cove: 0 }] : []),
    { part: 'hareke', cove: k },
    { game: 'balon', cove: k },
    { game: 'kopru', cove: k }
  ]);
  const stepDone = step => step.intro ? progress.tanisma : step.game ? progress[step.game].koylar[step.cove] : coveDone(step.part, step.cove);
  const nextStep = () => steps.find(step => !stepDone(step)) || null;
  const stepOpen = step => devAll() || stepDone(step) || step === nextStep();
  const coveOpen = (part, k) => stepOpen(steps.find(step => step.part === part && step.cove === k));
  const stepIcon = step => step.intro ? '✨' : step.game ? games[step.game].icon : prizeOf(step.part);
  const stepName = step => step.intro ? 'Harekelerle tanış' : step.game ? games[step.game].step || games[step.game].name : sections.find(s => s.id === step.part).title;
  const stepLabel = step => coves[step.cove] + ' · ' + stepName(step);
  // Opens a step. When the map is not inside the step's islet, the turtle first goes there: out of the
  // islet and the bay it is in, over the sea to the right bay, over the bridges to the islet, and into it.
  function goTo(step) {
    if (journeying) return;
    if (elifMap.level() === 'islet' && elifMap.shown() === step.cove) { open(step); return; }
    showHub();
    journey(() => bring(step.cove)).then(went => {
      if (!went || $('elif-view').hidden || !$('elif-section').hidden) return; // the child left meanwhile
      fx.bump(elifMap.station(steps.filter(s => s.cove === step.cove).indexOf(step)), 'nudge');
      setTimeout(() => { if (!$('elif-view').hidden && !section && !dialog.open) open(step); }, 380);
    });
  }
  function open(step) {
    if (step.intro) { showHub(); startIntro(); return; }
    if (step.game === 'kopru') { showHub(); openGame(step.game, step.cove); return; }
    if (step.game) { showHub(); pickGame(step); return; }
    openSection(step.part, step.cove);
  }

  window.elifBaSummary = id => {
    const record = load(id);
    return { harf: masteredCount('harf', record), hareke: masteredCount('hareke', record), bitisik: masteredCount('bitisik', record),
      cezm: masteredCount('cezm', record), tenvin: masteredCount('tenvin', record), sedde: masteredCount('sedde', record), rekor: record.yagmur.rekor,
      tamam: record.yagmur.tamam, seddebalon: { ...record.seddebalon },
      balon: { ...record.balon }, sekil: { ...record.sekil }, cezmbalon: { ...record.cezmbalon }, tenvinbalon: { ...record.tenvinbalon },
      oyunlar: otherGames.map(id => ({ id, ...(elifArcade.list().find(g => g.id === id) || {}), ...record[id], koylar: undefined,
        oynanan: record[id].koylar.filter(Boolean).length })),
      kopru: { ...record.kopru, gecilen: record.kopru.koylar.filter(Boolean).length, koy: coves.length },
      any: parts.some(part => record[part].some(Boolean)) || record.tanisma || gameNames.some(name => record[name].rekor > 0) };
  };
  window.resetElifBa = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); localStorage.removeItem('elif-ba-' + id); } catch {}
    if (activeProfile?.id === id && !$('elif-view').hidden) { progress = records.get(id); arriving = true; showHub(); }
  };

  /* ---------- Helpers ---------- */
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const pick = items => items[Math.floor(Math.random() * items.length)];
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const glyphHtml = text => '<b lang="ar" dir="rtl">' + text + '</b>';
  const prizeOf = part => sections.find(s => s.id === part).prize;
  function setTitle(text) { document.title = text + ' · Bilgi Adası'; }

  /* ---------- Hub: the island's sections ---------- */
  function drawShells() {
    // The corals of bitişik yazılış join in once the harekes of every letter are done, the sea stars
    // of cezm once bitişik yazılış is, the dolphins of tenvin once cezm is.
    const corals = masteredCount('hareke') === 28 || masteredCount('bitisik') > 0;
    const stars = masteredCount('bitisik') === 28 || masteredCount('cezm') > 0;
    const dolphins = masteredCount('cezm') === 28 || masteredCount('tenvin') > 0;
    const octopuses = masteredCount('tenvin') === 28 || masteredCount('sedde') > 0;
    $('elif-shells').textContent = '🐚 ' + masteredCount('harf') + '/28 · 🦪 ' + masteredCount('hareke') + '/28' +
      (corals ? ' · 🪸 ' + masteredCount('bitisik') + '/28' : '') + (stars ? ' · ⭐ ' + masteredCount('cezm') + '/28' : '') +
      (dolphins ? ' · 🐬 ' + masteredCount('tenvin') + '/28' : '') + (octopuses ? ' · 🐙 ' + masteredCount('sedde') + '/28' : '');
  }
  function showHub() {
    voice.stop();
    section = null;
    $('elif-hub').hidden = false;
    $('elif-section').hidden = true;
    drawShells();
    const next = nextStep();
    if (arriving) { arriving = false; elifMap.reset(next ? next.cove : coves.length - 1); }
    elifMap.render(mapModel(next));
    $('elif-next-step').hidden = !next;
    if (next) {
      $('elif-next-step').innerHTML = '<span class="elif-next-icon" aria-hidden="true">' + stepIcon(next) + '</span><span><small>Sıradaki</small>' +
        stepLabel(next) + '</span><span class="elif-next-go" aria-hidden="true">▶</span>';
      $('elif-next-step').onclick = () => goTo(next);
    }
    $('elif-done').hidden = !!next;
    drawAquariumCard();
    if (!journeying) $('elif-hub-note').textContent = '';
    setTitle('Elif Ba Adası');
  }
  // Akvaryum: the shared one (core/js/akvaryum.js). Every islet finished (its Cam Köprü crossed) brings a reward:
  // the first three are fish, then ornaments and fish take turns. Islets finished before the island filled the
  // aquarium get theirs the next time the map shows, once each (`elif:<islet>`), in order.
  const isletDone = k => steps.filter(step => step.cove === k).every(stepDone);
  function rewardIslets() {
    const got = [];
    for (let k = 0; k < coves.length && isletDone(k); k++) {
      const reward = akvaryum.odul({ anahtar: 'elif:' + k, neden: 'Elif Ba · ' + coves[k], karisik: true });
      if (reward) got.push({ k, reward });
    }
    return got;
  }
  // The children cannot read: the tank's lines are said in the device's Turkish voice.
  akvaryum.sesVer(text => voice.instruct(text));
  // The fish blow bubbles with what the player is learning now, and only that: letters, then harekeli
  // syllables, then harekeli joined shapes, then syllables with a cezm, then letters with a tenvin, of the
  // letters learned in that section (the latest section with any). A popped bubble says its letter or syllable.
  akvaryum.harfBalonu(() => {
    if (!activeProfile) return null;
    const record = load(activeProfile.id);
    const learned = part => glyphs.map((_, i) => i).filter(i => mastered(part, i, record));
    const level = ['sedde', 'tenvin', 'cezm', 'bitisik', 'hareke', 'harf'].find(part => learned(part).length);
    if (!level) return null;
    const i = pick(learned(level)), h = pick([0, 1, 2]);
    if (level === 'harf') return { text: glyphs[i], label: names[i], say: () => voice.letter(i) };
    if (level === 'hareke') return { text: syllable(i, h), label: syllableName(i, h), say: () => voice.syllable(i, h) };
    if (level === 'bitisik') return { text: shape(i, pick([1, 2, 3]), h), label: syllableName(i, h), say: () => voice.syllable(i, h) };
    if (level === 'tenvin') return { text: tenvin(i, h), label: tenvinName(i, h), say: () => voice.tenvin(i, h) };
    if (level === 'sedde') return { text: sedde(i, h), label: seddeName(i, h), say: () => voice.sedde(i, h) };
    return { text: cezm(i).text, label: cezmName(i), say: () => voice.cezm(i) };
  });
  function drawAquariumCard() {
    rewardIslets();
    const tank = akvaryum.ozet(activeProfile.id);
    const card = $('elif-aquarium-open');
    card.classList.toggle('fresh', tank.yeni > 0);
    card.innerHTML = '<span class="elif-aq-fish" aria-hidden="true">' + (tank.sonBaliklar.length ? tank.sonBaliklar : ['palyaco', 'neon', 'cerrah'])
      .map(k => akvaryumSanat.fish(k)).join('') +
      '</span><span class="elif-aq-text"><strong>Akvaryum</strong><small>' + (tank.balik ? tank.balik + ' balık · ' + tank.sus + ' süs' : 'Adacıkları bitir, balıklar gelsin') +
      '</small></span>' + (tank.yeni ? '<span class="elif-aq-new">✨ ' + tank.yeni + ' yeni</span>' : '') + '<span class="elif-aq-go" aria-hidden="true">▶</span>';
    card.setAttribute('aria-label', 'Akvaryum, ' + tank.balik + ' balık' + (tank.yeni ? ', ' + tank.yeni + ' yeni ödül' : ''));
    card.onclick = () => {
      if (journeying) return;
      voice.stop();
      akvaryum.open({ kapaninca: () => { if (!$('elif-view').hidden && !section) showHub(); } });
    };
  }
  /* ---------- The map: bays, their islets and the islets' steps (map.js) ---------- */
  // What the map draws: bays and islets done, the one being learned, those still locked (or, for the bays
  // of the sections still to come, soon), the bridges crossed and every islet's steps.
  function mapModel(next) {
    const nextCove = next ? next.cove : coves.length;
    // devAll (the "admin" player): nothing is drawn locked, as nothing is.
    const islet = k => k < nextCove ? 'done' : k === nextCove || devAll() ? 'current' : 'locked';
    const bay = b => bays[b].soon ? 'soon' : bayCoves(b).every(k => islet(k) === 'done') ? 'done' :
      bayCoves(b).some(k => islet(k) === 'current') ? 'current' : 'locked';
    const stations = k => steps.filter(s => s.cove === k).map(step => {
      const done = stepDone(step);
      return { icon: stepIcon(step), name: stepName(step), label: stepLabel(step), game: !!step.game,
        state: done ? 'done' : step === next || devAll() ? 'now' : 'locked' };
    });
    return { bay, islet, stations, crossed: k => progress.kopru.koylar[k] };
  }
  // Only one journey at a time; taps meanwhile are let go.
  let journeying = false;
  async function journey(task) {
    if (journeying) return false;
    journeying = true;
    const map = $('elif-map');
    const box = map.getBoundingClientRect();
    if (box.top < 0 || box.bottom > innerHeight) map.scrollIntoView({ block: box.height > innerHeight ? 'start' : 'center', behavior: 'smooth' });
    try { await task(); } catch (error) { console.error(error); }
    journeying = false;
    if (!$('elif-hub').hidden) $('elif-hub-note').textContent = '';
    return true;
  }
  const note = text => { $('elif-hub-note').textContent = text; };
  const dative = name => name + "'na";
  // Where the turtle lands in bay b: on the islet being learned if it is there, otherwise on the islet
  // nearest to where it comes from.
  function landing(b) {
    const next = nextStep();
    const list = bayCoves(b);
    if (next && list.includes(next.cove)) return next.cove;
    return b > bayOf(elifMap.at()) ? list[0] : list[list.length - 1];
  }
  // The first steps of a bay not started yet: arriving there opens the bay with a celebration.
  const freshBay = b => nextStep() === steps.find(s => s.cove === bayCoves(b)[0]);
  // From wherever the map is to bay b, sailing there when the turtle is in another bay.
  async function reachBay(b, land = landing(b)) {
    if (elifMap.level() === 'islet') await elifMap.leaveIslet();
    if (elifMap.level() === 'bay' && elifMap.shown() !== b) {
      const from = elifMap.shown();
      // To the next bay through the mouth of this one, in the boat waiting there.
      if (b === from + 1 && elifMap.at() === bayCoves(from).at(-1)) { note('⛵ ' + bays[from].name + "'ndan çıkıyor…"); await elifMap.board(); }
      await elifMap.leaveBay();
    }
    if (elifMap.level() === 'bays') {
      if (bayOf(elifMap.at()) !== b) {
        note('⛵ Kaplumbağa ' + dative(bays[b].name) + ' gidiyor…');
        await elifMap.sail(b, land);
        if (freshBay(b)) { note('🎉 ' + bays[b].name + ' açıldı!'); voice.instruct(bays[b].say); await elifMap.celebrate(b); }
      } else if (!told.has('bay-' + b)) voice.instruct(bays[b].say);
      told.add('bay-' + b);
      await elifMap.enterBay(b);
    }
  }
  // From wherever the map is into islet k.
  async function bring(k) {
    if (elifMap.level() === 'islet' && elifMap.shown() === k) return;
    await reachBay(bayOf(k), k);
    if (elifMap.level() === 'islet') await elifMap.leaveIslet();
    if (elifMap.at() !== k) {
      note('🐢 ' + dative(coves[k]) + ' ' + (k > elifMap.at() ? 'yürüyor' : 'geri dönüyor') + '…');
      await elifMap.walk(k);
      playCue('key');
    }
    await elifMap.enterIslet(k);
  }
  function refuse(kind, index, text, say) {
    playCue('oops');
    elifMap.nudge(kind, index);
    note(text);
    if (say) voice.instruct(say);
  }
  elifMap.build($('elif-map'), {
    // A bay: zooms into it, sailing there first when the turtle is in another one.
    bay(b) {
      if (journeying) return;
      const state = mapModel(nextStep()).bay(b);
      if (state === 'soon') return refuse('bay', b, '🔒 ' + bays[b].name + ' yakında açılacak.', bays[b].say);
      if (state === 'locked') return refuse('bay', b, '🔒 ' + bays[b].name + ' kilitli. Önce sıradaki adımı bitir: ' + stepLabel(nextStep()) + '.',
        'Bu koy kilitli. Önce sıradaki adımı bitir.');
      journey(() => reachBay(b));
    },
    // An islet: the turtle walks over the bridges to it and goes in.
    islet(k) {
      if (journeying) return;
      if (mapModel(nextStep()).islet(k) === 'locked') {
        refuse('islet', k, '🔒 ' + coves[k] + ' kilitli. Önce sıradaki adımı bitir: ' + stepLabel(nextStep()) + '.');
        return;
      }
      journey(() => bring(k));
    },
    // A step inside the islet: done steps open to replay, the next one to do; the others are locked.
    station(k, n) {
      if (journeying) return;
      const step = steps.filter(s => s.cove === k)[n];
      if (stepOpen(step)) { open(step); return; }
      refuse('station', n, '🔒 Önce sıradaki adımı bitir: ' + stepName(nextStep()) + '.');
      elifMap.nudge('now', 0, 'nudge');
    },
    // The boat at a bay's mouth sails to the next bay once the bay's last islet is done.
    exit(b) {
      if (journeying) return;
      const next = bays[b + 1];
      const state = next ? mapModel(nextStep()).bay(b + 1) : 'soon';
      if (state === 'soon') return refuse('exit', 0, '🔒 ' + (next ? next.name : 'Sıradaki koy') + ' yakında açılacak.', next ? next.say : 'Yeni koylar yakında.');
      if (state === 'locked') return refuse('exit', 0, '🔒 ' + dative(next.name) + ' geçmek için önce bu koydaki bütün adacıkları bitir.',
        'Önce bu koydaki bütün adacıkları bitir.');
      journey(async () => {
        if (elifMap.at() !== bayCoves(b).at(-1)) await elifMap.walk(bayCoves(b).at(-1));
        await reachBay(b + 1);
      });
    },
    // ‹ in a bay or an islet: one level out.
    up() {
      if (journeying) return;
      journey(() => elifMap.level() === 'islet' ? elifMap.leaveIslet() : elifMap.leaveBay());
    }
  });

  /* ---------- A section: coves and letter cards ---------- */
  function openSection(id, at) {
    section = id;
    const info = sections.find(s => s.id === id);
    $('elif-hub').hidden = true;
    $('elif-section').hidden = false;
    $('elif-section-title').textContent = info.title;
    cove = at;
    drawSection();
    setTitle(coves[cove] + ' · ' + info.title + ' · Elif Ba Adası');
    $('elif-section-title').focus();
  }
  function drawSection() {
    const part = section;
    const info = sections.find(s => s.id === part);
    $('elif-section-title').innerHTML = '<small>' + coves[cove] + '</small>' + info.title;
    $('elif-section-count').textContent = info.prize + ' ' + masteredCount(part) + ' / 28';
    drawShells();
    const letters = coveLetters(cove);
    voice.preload(letters, false, part === 'bitisik', part === 'cezm' || part === 'sedde', part === 'tenvin', part === 'sedde');
    // The guide is said aloud only when its turtle (info) button is tapped; the written words are for the grown-ups.
    const guide = guides[part];
    $('elif-guide').innerHTML = '';
    const tell = el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>');
    tell.setAttribute('aria-label', 'Ne yapacağımı söyle');
    tell.onclick = () => voice.instruct(guide);
    $('elif-guide').append(tell, el('span', '', guide));
    $('elif-cards').className = 'elif-cards ' + ({ harf: 'letters', hareke: 'syllables', bitisik: 'shapes', cezm: 'cezms', tenvin: 'tenvins', sedde: 'seddes' })[part];
    $('elif-cards').replaceChildren(...(part === 'cezm' ? [cezmLesson(cove)] : part === 'tenvin' ? [tenvinLesson(cove)] : part === 'sedde' ? [seddeLesson(cove)] : []),
      ...letters.map(i => part === 'harf' ? letterCard(i) : part === 'hareke' ? syllableCard(i) : part === 'cezm' ? cezmCard(i) :
        part === 'tenvin' ? tenvinCard(i) : part === 'sedde' ? seddeCard(i) : shapeCard(i)));
    $('elif-play').textContent = coveDone(part, cove) ? '↻ Yeniden oyna' : '▶ Oyna';
    $('elif-note').textContent = '';
  }
  const guides = {
    harf: 'Harflere dokun, adlarını dinle. Hazır olunca aşağıdaki yeşil oyna düğmesine bas.',
    hareke: 'Hecelere dokun, okunuşlarını dinle. Nota düğmesi üç harekeyi sırayla okur. Hazır olunca yeşil oyna düğmesine bas.',
    bitisik: 'Harfler kelimede yan yana gelince birbirine bağlanır ve şekilleri biraz değişir. Harekeleri değişmez. Kelimeler sağdan sola, ' +
      'hece hece okunur. Şekillere ve kelimelere dokun, dinle. Kırmızı harf, öğrendiğin harf. Hazır olunca yeşil oyna düğmesine bas.',
    cezm: 'Harfin üstündeki küçük yuvarlağa cezm denir. Cezimli harfin harekesi yoktur; kendinden önceki harfle birlikte okunur. ' +
      'Be esre bi, sin cezm bis. Hecelere dokun, dinle. Hazır olunca yeşil oyna düğmesine bas.',
    tenvin: 'Harfin üstünde ya da altında iki hareke olursa buna tenvin denir. Tenvin harfin sesine bir n ekler. Be üstün be, be iki üstün ben. ' +
      'Be esre bi, be iki esre bin. Be ötre bu, be iki ötre bun. İki üstünden sonra gelen elif okunmaz. Hecelere dokun, dinle. Hazır olunca yeşil oyna düğmesine bas.',
    sedde: 'Harfin üstündeki küçük dişli işarete şedde denir. Şeddeli harf iki kez okunur: önce kendinden önceki harfle birlikte, cezimli gibi, ' +
      'sonra kendi harekesiyle. Bis, se: bisse. Şeddesiz olsa bise olurdu. Hecelere dokun, dinle. Hazır olunca yeşil oyna düğmesine bas.'
  };
  const told = new Set(); // the bays whose name was said in this visit
  function letterCard(i) {
    const button = el('button', 'elif-tile tone-' + i % 4);
    button.innerHTML = glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong><small aria-hidden="true">' +
      (mastered('harf', i) ? '🐚' : '♪') + '</small>';
    button.setAttribute('aria-label', names[i] + ' harfini dinle');
    button.onclick = () => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
      $('elif-note').textContent = names[i];
      voice.letter(i, $('elif-note'));
    };
    return button;
  }
  function syllableCard(i) {
    const card = el('div', 'elif-syllables tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong>' +
      '<small aria-hidden="true">' + (mastered('hareke', i) ? '🦪' : '') + '</small>');
    const chant = el('button', 'elif-chant', '♪');
    chant.setAttribute('aria-label', names[i] + ' üstün, esre, ötre okunuşunu dinle');
    chant.onclick = () => { $('elif-note').textContent = [0, 1, 2].map(h => syllableName(i, h)).join(' · '); voice.chant(i, undefined, $('elif-note')); };
    head.append(chant);
    const row = el('div', 'elif-syllable-row');
    for (const h of [0, 1, 2]) {
      const button = el('button', 'elif-syllable', glyphHtml(syllable(i, h)) + '<span>' + hareke(h) + '</span>');
      button.setAttribute('aria-label', syllableName(i, h) + ', dinle');
      button.onclick = () => {
        for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
        button.classList.add('selected');
        $('elif-note').textContent = syllableName(i, h);
        voice.syllable(i, h, $('elif-note'));
      };
      row.append(button);
    }
    card.append(head, row);
    return card;
  }
  // Bitişik yazılış: the letter, then a column for each place in the word (right to left: start,
  // middle, end) with the letter's shape there and Diyanet's example word, the letter coloured in it.
  const placeLower = f => places[f].toLocaleLowerCase('tr');
  const inWord = ['', 'kelimenin başında', 'kelimenin ortasında', 'kelimenin sonunda'];
  // A place in the word as a picture: three boxes for its letters, right to left, the place's box coloured.
  const placeIcon = f => '<span class="elif-place" aria-hidden="true">' + [1, 2, 3].map(g => '<i' + (g === f ? ' class="on"' : '') + '></i>').join('') + '</span>';
  // What to do in each kind of question, said aloud (the children cannot read yet).
  const howTo = {
    listen: 'Dinle. Duyduğun harfi bul.',
    sound: 'Bu harfin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'ses-hece': 'Dinle. Duyduğun heceyi bul.',
    'hece-ses': 'Bu hecenin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'sekil-harf': 'Bu şekil hangi hecenin? Tek başına yazılışını bul.',
    'dinle-sekil': 'Dinle. Hecenin bu şeklini bul.',
    bul: 'Bu hece kelimenin içine saklandı. Kelimede onu bul ve üstüne dokun. İstersen heceyi tutup kelimedeki yerine götür.',
    'ses-cezm': 'Dinle. Duyduğun heceyi bul.',
    'cezm-ses': 'Bu hecenin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'cezm-harf': 'Dinle. Hangi harf cezimli? Eksik harfi bul.',
    'ses-tenvin': 'Dinle. Duyduğun heceyi bul. Sonunda n sesi var mı, dikkat et.',
    'tenvin-ses': 'Bu hecenin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'tenvin-bul': 'Hangisi tenvinli? Tenvinli heceyi bul ve dokun.',
    'ses-sedde': 'Dinle. Duyduğun heceyi bul. Harf iki kez okunuyor mu, dikkat et.',
    'sedde-ses': 'Bu hecenin sesi hangisi? Seslere dokun, dinle. Doğru sesi bulunca yeşil tike bas.',
    'sedde-bul': 'Hangisinde şedde var? Şeddeli heceyi bul ve dokun.'
  };
  // The letter's three harekeli syllables over three columns, one for each place in the word (right to
  // left: start, middle, end), each with its shapes there and an example word, the letter coloured in it.
  function shapeCard(i) {
    const card = el('div', 'elif-shapes tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml([0, 1, 2].map(h => syllable(i, h)).join(' ')) + '<strong>' + names[i] + '</strong>' +
      '<small aria-hidden="true">' + (mastered('bitisik', i) ? '🪸' : '') + '</small>');
    const listen = el('button', 'elif-chant', '♪');
    listen.setAttribute('aria-label', names[i] + ' üstün, esre, ötre okunuşunu dinle');
    listen.onclick = () => { $('elif-note').textContent = [0, 1, 2].map(h => syllableName(i, h)).join(' · '); voice.chant(i, undefined, $('elif-note')); };
    head.append(listen);
    const row = el('div', 'elif-shape-row');
    row.dir = 'rtl';
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    for (const f of [1, 2, 3]) {
      const column = el('div', 'elif-shape-col');
      column.dir = 'ltr';
      column.append(el('span', 'elif-shape-place', placeIcon(f)));
      const forms = el('div', 'elif-shape-forms');
      for (const h of [0, 1, 2]) {
        const form = el('button', 'elif-syllable', glyphHtml(shape(i, f, h)));
        form.setAttribute('aria-label', syllableName(i, h) + ', ' + inWord[f] + ', dinle');
        form.onclick = () => { select(form); $('elif-note').textContent = syllableName(i, h) + ' ' + inWord[f]; voice.shape(i, h, f, $('elif-note')); };
        forms.append(form);
      }
      const sample = el('button', 'elif-word', wordHtml(i, f));
      sample.setAttribute('aria-label', names[i] + ' ' + inWord[f] + ': örnek kelimeyi dinle');
      sample.onclick = () => {
        select(sample);
        $('elif-note').textContent = 'Kelime sağdan sola, hece hece okunuyor.';
        const parts = [...sample.querySelectorAll('.elif-word-letter')];
        voice.word(i, f, $('elif-note'), null, n => parts.forEach((part, m) => part.classList.toggle('say', m === n)));
      };
      column.append(forms, sample);
      row.append(column);
    }
    card.append(head, row);
    if (!joinsNext(i)) {
      // Said aloud, too: the letter does not join the one after it.
      const sentence = names[i] + ' kendinden sonraki harfe bağlanmaz.';
      const apart = el('button', 'elif-apart', '<span aria-hidden="true">🔊</span> ' + glyphHtml(syllable(i, 0) + syllable(1, 0)) + '<span>' + sentence + '</span>');
      apart.onclick = () => { $('elif-note').textContent = sentence; voice.instruct(sentence); };
      card.append(apart);
    }
    return card;
  }
  // Cezm: a card for each letter of the cove, read right to left like the letters: the harekeli letter
  // before it, the letter with its cezm, and the syllable they make together (بِ + سْ = بِسْ).
  const cezmName = i => { const { before } = cezm(i); return syllableName(before.i, before.h) + ', ' + (i ? names[i] : 'Hemze') + ' cezm'; };
  function cezmCard(i) {
    const { text, before, sakin } = cezm(i);
    const card = el('div', 'elif-cezm tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(sakin) + '<strong>' + (i ? names[i] : 'Hemze') + '</strong>' +
      '<small aria-hidden="true">' + (mastered('cezm', i) ? '⭐' : '') + '</small>');
    const chant = el('button', 'elif-chant', '♪');
    chant.setAttribute('aria-label', cezmName(i) + ': okunuşunu dinle');
    chant.onclick = () => { $('elif-note').textContent = cezmName(i); voice.cezmChant(i, $('elif-note')); };
    head.append(chant);
    const row = el('div', 'elif-cezm-row');
    row.dir = 'rtl';
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    const first = el('button', 'elif-syllable', glyphHtml(syllable(before.i, before.h)));
    first.setAttribute('aria-label', syllableName(before.i, before.h) + ', dinle');
    first.onclick = () => { select(first); $('elif-note').textContent = syllableName(before.i, before.h); voice.syllable(before.i, before.h, $('elif-note')); };
    const silent = el('button', 'elif-syllable sakin', glyphHtml(sakin));
    silent.setAttribute('aria-label', (i ? names[i] : 'Hemze') + ' cezm');
    // the letter with a cezm has no sound of its own: its name is said, then "cezm"
    silent.onclick = () => { select(silent); $('elif-note').textContent = (i ? names[i] : 'Hemze') + ' cezm'; voice.say((i ? names[i] : 'Hemze') + ' cezm', $('elif-note')); };
    const whole = el('button', 'elif-syllable whole', glyphHtml(text));
    whole.setAttribute('aria-label', cezmName(i) + ': heceyi dinle');
    whole.onclick = () => { select(whole); $('elif-note').textContent = cezmName(i); voice.cezm(i, $('elif-note')); };
    row.append(first, el('span', 'elif-cezm-sign', '+'), silent, el('span', 'elif-cezm-sign', '='), whole);
    card.append(head, row);
    return card;
  }
  // At the top of a cezm cove: one of Diyanet's examples in three steps, the letters without the cezm, with
  // it, and the word they start (اَصَ ← اَصْ ← اَصْلَحَ), each heard on its own.
  function cezmLesson(k) {
    const p = (k - 2 * LETTER_COVES) % cezmExamples.length;
    const card = el('div', 'elif-cezm-lesson');
    const head = el('div', 'elif-syllables-head', '<b lang="ar" dir="rtl" class="elif-cezm-mark">◌ْ</b><strong>Cezm</strong>');
    const play = el('button', 'elif-chant', '♪');
    play.setAttribute('aria-label', 'Üç adımı sırayla dinle');
    const row = el('div', 'elif-cezm-steps');
    row.dir = 'rtl';
    const hear = (n, after) => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      buttons[n].classList.add('selected');
      voice.cezmExample(p, n, $('elif-note'), after);
    };
    const buttons = cezmExamples[p].map((text, n) => {
      const button = el('button', 'elif-syllable step-' + n, glyphHtml(text));
      button.setAttribute('aria-label', ['Cezimsiz', 'Cezimli', 'Kelime'][n] + ', dinle');
      button.onclick = () => hear(n);
      return button;
    });
    // the three one after another
    play.onclick = () => hear(0, () => hear(1, () => hear(2)));
    head.append(play);
    buttons.forEach((button, n) => { if (n) row.append(el('span', 'elif-cezm-sign', '⬅')); row.append(button); });
    card.append(head, row);
    return card;
  }
  // Tenvin: a card for each letter of the cove, with a column for each tenvin, right to left like the letters:
  // the letter with its hareke above, the same letter with the tenvin below (بَ over بًا), so the n it adds is heard.
  function tenvinCard(i) {
    const card = el('div', 'elif-tenvin tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(glyphs[i]) + '<strong>' + names[i] + '</strong>' +
      '<small aria-hidden="true">' + (mastered('tenvin', i) ? '🐬' : '') + '</small>');
    const chant = el('button', 'elif-chant', '♪');
    chant.setAttribute('aria-label', names[i] + ' iki üstün, iki esre, iki ötre okunuşunu dinle');
    chant.onclick = () => { $('elif-note').textContent = [0, 1, 2].map(h => tenvinName(i, h)).join(' · '); voice.tenvinChant(i, undefined, $('elif-note')); };
    head.append(chant);
    const row = el('div', 'elif-tenvin-row');
    row.dir = 'rtl';
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    for (const h of [0, 1, 2]) {
      const column = el('div', 'elif-tenvin-col');
      column.dir = 'ltr';
      const plain = el('button', 'elif-syllable plain', glyphHtml(syllable(i, h)) + '<span>' + hareke(h) + '</span>');
      plain.setAttribute('aria-label', syllableName(i, h) + ', dinle');
      plain.onclick = () => { select(plain); $('elif-note').textContent = syllableName(i, h); voice.syllable(i, h, $('elif-note')); };
      const withTenvin = el('button', 'elif-syllable whole', glyphHtml(tenvin(i, h)) + '<span>' + tenvinMark(h) + '</span>');
      withTenvin.setAttribute('aria-label', tenvinName(i, h) + ', dinle');
      withTenvin.onclick = () => { select(withTenvin); $('elif-note').textContent = tenvinName(i, h); voice.tenvinChant(i, h, $('elif-note')); };
      column.append(plain, el('span', 'elif-tenvin-sign', '⬇'), withTenvin);
      row.append(column);
    }
    card.append(head, row);
    return card;
  }
  // At the top of a tenvin cove: the three tenvin marks, each said when tapped, and one of Diyanet's words
  // ending in a tenvin in three steps: its last letter with the hareke, with the tenvin, and the word
  // (بُ ← بٌ ← كُتُبٌ), each heard on its own.
  function tenvinLesson(k) {
    const p = (k - 3 * LETTER_COVES) % tenvinExamples.length;
    const example = tenvinExamples[p];
    const card = el('div', 'elif-cezm-lesson elif-tenvin-lesson');
    const head = el('div', 'elif-syllables-head', '<strong>Tenvin</strong>');
    const marks = el('div', 'elif-tenvin-marks');
    marks.dir = 'rtl';
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    for (const h of [0, 1, 2]) {
      const mark = el('button', 'elif-syllable mark', '<b lang="ar" dir="rtl">◌' + tenvinler[h].mark + '</b><span>' + tenvinMark(h) + '</span>');
      mark.setAttribute('aria-label', tenvinler[h].name + ', dinle');
      mark.onclick = () => { select(mark); $('elif-note').textContent = tenvinler[h].name; voice.tenvinName(h, $('elif-note')); };
      marks.append(mark);
    }
    head.prepend(marks);
    const play = el('button', 'elif-chant', '♪');
    play.setAttribute('aria-label', 'Üç adımı sırayla dinle');
    const row = el('div', 'elif-cezm-steps');
    row.dir = 'rtl';
    const hear = (n, after) => {
      select(buttons[n]);
      voice.tenvinExample(p, n, $('elif-note'), after);
    };
    const buttons = [syllable(example.i, example.h), tenvin(example.i, example.h), example.word].map((text, n) => {
      const button = el('button', 'elif-syllable step-' + n, glyphHtml(text));
      button.setAttribute('aria-label', ['Tenvinsiz', 'Tenvinli', 'Kelime'][n] + ', dinle');
      button.onclick = () => hear(n);
      return button;
    });
    play.onclick = () => hear(0, () => hear(1, () => hear(2)));
    head.append(play);
    buttons.forEach((button, n) => { if (n) row.append(el('span', 'elif-cezm-sign', '⬅')); row.append(button); });
    card.append(head, row);
    return card;
  }
  // Şedde: a card for each letter of the cove: how its şedde syllable is made, right to left like the letters
  // (بِسْ + سَ = بِسَّ: bis, se, bisse), then the syllable with each hareke (بِسَّ بِسِّ بِسُّ).
  function seddeCard(i) {
    const card = el('div', 'elif-sedde tone-' + i % 4);
    const head = el('div', 'elif-syllables-head', glyphHtml(seddeLetter(i) + SEDDE) + '<strong>' + (i ? names[i] : 'Hemze') + '</strong>' +
      '<small aria-hidden="true">' + (mastered('sedde', i) ? '🐙' : '') + '</small>');
    const chant = el('button', 'elif-chant', '♪');
    chant.setAttribute('aria-label', seddeName(i, 0) + ': nasıl okunduğunu dinle');
    chant.onclick = () => { $('elif-note').textContent = seddeName(i, 0); voice.seddeChant(i, 0, $('elif-note')); };
    head.append(chant);
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    const button = (cls, text, label, hear) => {
      const b = el('button', 'elif-syllable ' + cls, glyphHtml(text));
      b.setAttribute('aria-label', label + ', dinle');
      b.onclick = () => { select(b); $('elif-note').textContent = label; hear(); };
      return b;
    };
    const making = el('div', 'elif-cezm-row');
    making.dir = 'rtl';
    making.append(button('sakin', cezm(i).text, cezmName(i), () => voice.cezm(i, $('elif-note'))), el('span', 'elif-cezm-sign', '+'),
      button('', seddeLetter(i) + harekeler[0].mark, (i ? names[i] : 'Hemze') + ' üstün', () => voice.syllable(i, 0, $('elif-note'))),
      el('span', 'elif-cezm-sign', '='), button('whole', sedde(i, 0), seddeName(i, 0), () => voice.sedde(i, 0, $('elif-note'))));
    const row = el('div', 'elif-syllable-row');
    row.dir = 'rtl';
    for (const h of [0, 1, 2]) {
      const b = button('', sedde(i, h), seddeName(i, h), () => voice.sedde(i, h, $('elif-note')));
      b.insertAdjacentHTML('beforeend', '<span>' + hareke(h) + '</span>');
      row.append(b);
    }
    card.append(head, making, row);
    return card;
  }
  // At the top of a şedde cove: the şedde mark, said when tapped, and one of Diyanet's words with a şedde, its letter
  // coloured, heard when tapped.
  function seddeLesson(k) {
    const p = (k - 4 * LETTER_COVES) % seddeExamples.length;
    const card = el('div', 'elif-cezm-lesson elif-sedde-lesson');
    const head = el('div', 'elif-syllables-head', '<strong>Şedde</strong>');
    const mark = el('button', 'elif-syllable mark', '<b lang="ar" dir="rtl">◌' + SEDDE + '</b><span>şedde</span>');
    mark.setAttribute('aria-label', 'Şedde, dinle');
    const select = button => {
      for (const other of $('elif-cards').querySelectorAll('.selected')) other.classList.remove('selected');
      button.classList.add('selected');
    };
    mark.onclick = () => { select(mark); $('elif-note').textContent = 'Şedde'; voice.markName('sedde', $('elif-note')); };
    head.prepend(mark);
    const sample = el('button', 'elif-word elif-sedde-word', '<b lang="ar" dir="rtl">' + markedWord(seddeExamples[p].word) + '</b>');
    sample.setAttribute('aria-label', 'Şeddeli kelime, dinle');
    sample.onclick = () => { select(sample); $('elif-note').textContent = 'Şeddeli harf kırmızı.'; voice.seddeExample(p, $('elif-note')); };
    const play = el('button', 'elif-chant', '♪');
    play.setAttribute('aria-label', 'Şeddeyi ve kelimeyi dinle');
    play.onclick = () => { select(sample); voice.markName('sedde', $('elif-note'), () => voice.seddeExample(p, $('elif-note'))); };
    head.append(play);
    card.append(head, sample);
    return card;
  }
  // A word with the letter in braces coloured (تَ{بَّ}تْ), its letters kept joined across the coloured one.
  function markedWord(source) {
    const letters = [];
    let at = -1;
    for (const c of source) {
      if (c === '{') { at = letters.length; continue; }
      if (c === '}') continue;
      const i = glyphs.indexOf(c);
      if (i >= 0 || !letters.length) letters.push({ c, i }); else letters.at(-1).c += c;
    }
    return letterSpans(letters, (l, n) => n === at ? 'class="elif-mark"' : '');
  }
  // An example word with its letter coloured, every letter (with its hareke) in a span of its own so it can
  // light up as its syllable is read. Zero-width joiners keep the joins across the spans.
  const ZWJ = '\u200d';
  function letterSpans(letters, attrs) {
    return letters.map((l, n) => {
      const before = n > 0 && joinsNext(letters[n - 1].i);
      const after = n < letters.length - 1 && joinsNext(l.i);
      return '<span ' + attrs(l, n, before, after) + '>' + (before ? ZWJ : '') + l.c + (after ? ZWJ : '') + '</span>';
    }).join('');
  }
  function wordHtml(i, f) {
    const { letters, at } = word(i, f);
    return '<b lang="ar" dir="rtl">' + letterSpans(letters, (l, n) => 'class="elif-word-letter' + (n === at ? ' elif-mark' : '') + '"') + '</b>';
  }
  // Harf avı: the harekeli letter alone is found inside a word, in its joined shape. A letter's place is
  // by Diyanet's convention: the first letter of a word is at its start, the last at its end, whatever
  // shape it takes.
  const placeAt = (letters, n) => n === 0 ? 1 : n === letters.length - 1 ? 3 : 2;
  const exampleWords = glyphs.flatMap((_, i) => [1, 2, 3].map(f => ({ i, f })));
  // A word for letter `target` at place f: any of the 84 example words with the letter there once, those
  // with one of its look-alikes (ب in ثَبَتَ) more often; the letter's own example word is always one of them.
  // q.h is the hareke the letter has in it.
  function huntWord(target, f) {
    const fits = exampleWords.filter(w => {
      const { letters } = word(w.i, w.f);
      const at = letters.flatMap((l, n) => l.i === target ? [n] : []);
      return at.length === 1 && placeAt(letters, at[0]) === f;
    });
    const tricky = fits.filter(w => word(w.i, w.f).letters.some(l => twins(target).includes(l.i)));
    const w = pick(tricky.length && Math.random() < 0.6 ? tricky : [{ i: target, f }, ...fits]);
    return { ...w, h: word(w.i, w.f).letters.find(l => l.i === target).h };
  }
  function huntHtml(letters, target) {
    return letterSpans(letters, (l, n, before, after) => 'class="elif-hunt-letter" data-n="' + n + '" data-i="' + l.i + '" data-h="' + l.h +
      '" data-f="' + placeAt(letters, n) + '" data-form="' + (before && after ? 2 : after ? 1 : before ? 3 : 0) + '"' + (l.i === target ? ' data-right' : ''));
  }

  /* ---------- The games: Harf Yağmuru, Hece Balonları, Şekil Yağmuru and Cam Köprü ---------- */
  // Each cove has all three as steps of the path: Harf Yağmuru after its letters rains every letter
  // learned so far, Hece Balonları after its harekes flies those letters' syllables (letter * 3 + hareke),
  // and Cam Köprü mixes both on the bridge to the next cove. A game step (every one but Cam Köprü) opens a
  // picker: its own game or one of the games of games/arcade.js with the same letters; any of them played to
  // the end passes the step.
  // The admin player (devAll) can open a game before learning its letters: it plays them as if learned.
  const playable = (part, i) => devAll() || mastered(part, i);
  const games = {
    yagmur: {
      kind: 'harf', name: 'Harf Yağmuru', step: 'Harf oyunları', icon: '🌧️', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('harf', i))
    },
    balon: {
      kind: 'hece', name: 'Hece Balonları', step: 'Hece oyunları', icon: '🎈', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('hareke', i)).flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2])
    },
    sekil: {
      kind: 'sekil', name: 'Şekil Yağmuru', step: 'Şekil oyunları', icon: '☔', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('bitisik', i)).flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2])
    },
    cezmbalon: {
      kind: 'cezm', name: 'Cezm Balonları', step: 'Cezm oyunları', icon: '🎐', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('cezm', i))
    },
    // The letters' tenvins (letter * 3 + tenvin) and, as balloons not to pop, the same letters with the hareke
    // alone (84 + letter * 3 + hareke): bin beside bi.
    tenvinbalon: {
      kind: 'tenvin', name: 'Tenvin Balonları', step: 'Tenvin oyunları', icon: '🪁', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('tenvin', i)).flatMap(i => [0, 1, 2].flatMap(h => [i * 3 + h, 84 + i * 3 + h]))
    },
    // The letters' şedde syllables (letter * 3 + hareke) and, as balloons not to pop, the same letters without the
    // şedde (84 + letter * 3 + hareke): bise beside bisse.
    seddebalon: {
      kind: 'sedde', name: 'Şedde Balonları', step: 'Şedde oyunları', icon: '🎏', tag: 'Oyun',
      items: () => glyphs.map((_, i) => i).filter(i => playable('sedde', i)).flatMap(i => [0, 1, 2].flatMap(h => [i * 3 + h, 84 + i * 3 + h]))
    },
    kopru: { name: 'Cam Köprü', icon: '🌉', tag: 'Karma' }
  };
  // The bridge leads to the next islet; from the last islet of a bay to the next bay, and from the last
  // islet of all to the bay that is coming next.
  function destination(k) {
    const next = bays[bayOf(k) + 1];
    if (k < coves.length - 1 && bayCoves(bayOf(k)).at(-1) !== k) return { to: coves[k + 1], toDative: coves[k + 1] + "'na" };
    return next && !next.soon ? { to: next.name, toDative: next.name + "'na" } : { to: 'Sıradaki koy', toDative: 'sıradaki koya' };
  }
  // The picker of a game step: big picture cards, the step's own game first. The children cannot read: the
  // cards are pictures, and the turtle button says what to do.
  const pickDialog = $('elif-pick');
  function pickGame(step) {
    if (!stepOpen(step)) return;
    voice.stop();
    const own = games[step.game];
    const choices = [{ id: 'base', name: own.name, icon: own.icon, record: progress[step.game] },
      ...elifArcade.list().map(g => ({ ...g, record: progress[g.id] }))];
    const stars = n => n ? '<span class="pick-stars" aria-label="' + n + ' yıldız">' + '★'.repeat(n) + '☆'.repeat(3 - n) + '</span>' : '';
    pickDialog.innerHTML = '<div class="pick-card"><button type="button" class="pick-close btn-round" aria-label="Kapat"></button>' +
      '<button type="button" class="elif-howto pick-tell" aria-label="Ne yapacağımı söyle"><span aria-hidden="true">🐢💬</span></button>' +
      '<h2 id="elif-pick-title" tabindex="-1"><small>' + coves[step.cove] + '</small>' + stepName(step) + '</h2>' +
      '<p>Bir oyun seç. Hangisini bitirirsen yoluna devam edersin.</p><div class="pick-list">' + choices.map((g, n) =>
        '<button type="button" class="pick-game tone-' + n % 4 + (n ? '' : ' own') + '" data-id="' + g.id + '" data-cue>' +
        '<span class="pick-icon" aria-hidden="true">' + g.icon + '</span><strong>' + g.name + '</strong>' + stars(g.record.yildiz) + '</button>').join('') +
      '</div></div>';
    pickDialog.querySelector('.pick-close').onclick = () => pickDialog.close();
    pickDialog.querySelector('.pick-tell').onclick = () => voice.instruct('Bir oyun seç. Resimlere dokun. Hangi oyunu bitirirsen yoluna devam edersin.');
    for (const button of pickDialog.querySelectorAll('.pick-game')) {
      button.onclick = () => {
        pickDialog.close();
        openGame(step.game, step.cove, button.dataset.id);
      };
    }
    if (!pickDialog.open) pickDialog.showModal();
    $('elif-pick-title').focus();
  }
  pickDialog.addEventListener('close', () => voice.stop());
  // A cove's game plays with everything learned up to and including that cove. `choice` is the game picked
  // for a game step: 'base' (its own) or one of games/arcade.js; its record is kept under its own name.
  function openGame(id, k, choice = 'base') {
    const info = games[id];
    const step = steps.find(s => s.game === id && s.cove === k);
    if (!stepOpen(step)) return;
    voice.stop();
    const recordId = choice === 'base' ? id : choice;
    // Crossing Cam Köprü finishes the islet: its reward comes on the bridge's result card (as html).
    const result = ({ score, stars, finished }) => {
      const record = progress[recordId];
      record.rekor = Math.max(record.rekor, score);
      if (finished) {
        record.yildiz = Math.max(record.yildiz, stars);
        if (stars === 3) record.tamam = true;
        record.koylar[k] = true; // played to the end: the path goes on
        progress[id].koylar[k] = true;
      }
      save();
      const got = id === 'kopru' && finished ? rewardIslets() : [];
      if (!got.length) return '';
      const items = got.map(g => g.reward.item);
      setTimeout(() => voice.instruct(items.length > 1 ? 'Akvaryumuna ' + items.length + ' yeni ödül geldi!' :
        'Akvaryumuna yeni bir ' + (items[0].t === 'b' ? 'balık' : 'süs') + ' geldi: ' + akvaryumVeri.tur(items[0].k).ad + '!'), 1600);
      return akvaryum.kart(got.map(g => g.reward));
    };
    // After a game played to the end, the result card leads on to the next step.
    const next = () => {
      const after = nextStep();
      return after ? { label: stepIcon(after) + ' ' + stepName(after), go: () => goTo(after) } : null;
    };
    const onClose = () => {
      if ($('elif-view').hidden) return;
      if (section) drawSection(); else showHub();
    };
    // The letter groups up to this cove's: the coves of a topic go through the same groups of four again.
    const bySyllable = id === 'balon' || id === 'sekil' || id === 'tenvinbalon' || id === 'seddebalon';
    const upTo = i => Math.floor((bySyllable ? Math.floor(i % 84 / 3) : i) / 4) <= k % LETTER_COVES;
    if (id === 'kopru') {
      const joined = coveTopic(k) === 'bitisik', withCezm = coveTopic(k) === 'cezm', withTenvin = coveTopic(k) === 'tenvin', withSedde = coveTopic(k) === 'sedde';
      elifBridgeGame.open({
        // In a bitişik cove the bridge has the joined shapes of the letters learned so far, and a few harekeli
        // syllables of all the letters for review; in a cezm cove their cezm syllables, in a tenvin cove their tenvins,
        // in a şedde cove their şedde syllables.
        letters: glyphs.map((_, i) => i).filter(i => upTo(i) && (!joined || playable('bitisik', i)) && (!withCezm || playable('cezm', i)) &&
          (!withTenvin || playable('tenvin', i)) && (!withSedde || playable('sedde', i))),
        recent: coveLetters(k), joined, cezm: withCezm, tenvin: withTenvin, sedde: withSedde, known: glyphs.map((_, i) => i), from: coves[k], ...destination(k),
        best: () => progress.kopru, onResult: result, next, onClose
      });
      return;
    }
    const recent = coveLetters(k);
    const settings = {
      kind: info.kind,
      letters: info.items().filter(upTo),
      recent: bySyllable ? recent.flatMap(i => [i * 3, i * 3 + 1, i * 3 + 2]) : recent,
      best: () => progress[recordId],
      onResult: result, next, onClose
    };
    if (choice === 'base') elifListeningGame.open(settings); else elifArcade.open({ ...settings, game: choice });
  }

  /* ---------- Rounds ---------- */
  function choicesFor(target, count, pool) {
    return shuffled([target, ...shuffled(pool.filter(i => i !== target)).slice(0, count - 1)]);
  }
  // From the second cove on, every round mixes the new letters with the earlier coves' letters:
  // earlier letters turn up among the choices and get questions of their own for review.
  const REVIEW = 4;
  const earlierLetters = k => Array.from({ length: k * 4 }, (_, i) => i);
  const review = k => shuffled(earlierLetters(k)).slice(0, REVIEW);
  function letterPool(k) {
    return [...coveLetters(k), ...shuffled(earlierLetters(k)).slice(0, 3)];
  }
  function harfRound(k) {
    const own = coveLetters(k);
    const questions = [];
    for (const target of shuffled(own)) questions.push({ type: 'listen', target, choices: choicesFor(target, 4, letterPool(k)) });
    for (const target of shuffled(own)) questions.push({ type: 'sound', target, choices: choicesFor(target, 3, own) });
    // review: an earlier letter among the new ones
    for (const target of review(k)) questions.push({ type: 'listen', target, choices: choicesFor(target, 4, [...own, ...earlierLetters(k)]) });
    return spread(questions);
  }
  // A syllable and the ones it is told apart from: first the same letter with the other
  // harekes, then syllables of other letters, never two that sound alike.
  function syllableChoices(target, h, k, count) {
    const picked = [[target, h], ...[0, 1, 2].filter(x => x !== h).map(x => [target, x])];
    const others = shuffled(letterPool(k).filter(i => i !== target).flatMap(i => [0, 1, 2].map(x => [i, x])));
    for (const [i, x] of others) {
      if (picked.length >= count) break;
      if (!picked.some(([j, y]) => sameSound(i, x, j, y))) picked.push([i, x]);
    }
    return shuffled(picked.slice(0, count));
  }
  // Each letter of the cove twice, with no Turkish reading written anywhere: a syllable is heard
  // and the harekeli letter found (ses-hece), a harekeli letter is shown and its sound found
  // among the sounds of its three harekes (hece-ses).
  function harekeRound(k) {
    const own = shuffled(coveLetters(k));
    const marks = shuffled([0, 1, 2, 0, 1, 2, pick([0, 1, 2]), pick([0, 1, 2])]);
    const questions = [];
    own.forEach((target, n) => {
      questions.push({ type: 'ses-hece', target, h: marks[n], choices: syllableChoices(target, marks[n], k, 4) });
      questions.push({ type: 'hece-ses', target, h: marks[n + 4], choices: syllableChoices(target, marks[n + 4], k, 3) });
    });
    // review: earlier letters with their harekes, both ways
    review(k).forEach((target, n) => {
      const h = pick([0, 1, 2]);
      questions.push(n % 2 ? { type: 'hece-ses', target, h, choices: syllableChoices(target, h, k, 3) } :
        { type: 'ses-hece', target, h, choices: syllableChoices(target, h, k, 4) });
    });
    return spread(questions);
  }
  function introRound() {
    // Only letters the child already knows, two questions for each hareke: one letter at a
    // time, read with its three harekes.
    const known = Array.from({ length: 28 }, (_, i) => i).filter(i => mastered('harf', i));
    const letters = shuffled(known.length ? known : coveLetters(0));
    return spread([0, 1, 2, 0, 1, 2].map((h, n) => ({ type: n < 3 ? 'hece-ses' : 'ses-hece', target: letters[n % letters.length], h,
      choices: shuffled([0, 1, 2]).map(x => [letters[n % letters.length], x]) })));
  }
  // Bitişik yazılış: every letter of the cove three times, each time at another place in the word and
  // always with a hareke (the bitişik coves come after the harekes). Its harekeli shape is shown and found
  // among harekeli letters alone (sekil-harf); the syllable and its place are heard and its shape found
  // among other shapes at the same place (dinle-sekil); the harekeli letter alone hides in an example word
  // and is found there in its joined shape (bul). From the second bitişik cove on, letters of the earlier
  // ones come back for review. A choice is a syllable [i, h].
  function shapeChoices(target, h, k, heard) {
    // seen: the look-alikes with the same hareke, then other letters; heard: also the same letter with
    // another hareke, and never two that sound alike (ha for both ح and خ)
    const order = [...shuffled(twins(target)).map(i => [i, h]), ...(heard ? [[target, pick([0, 1, 2].filter(x => x !== h))]] : []),
      ...shuffled(coveLetters(k)).map(i => [i, heard ? pick([0, 1, 2]) : h]), ...shuffled(glyphs.map((_, i) => i)).map(i => [i, h])];
    const picked = [[target, h]];
    for (const [i, x] of order) {
      if (picked.length >= 4) break;
      if (picked.some(([j, y]) => j === i && y === x || heard && sameSound(i, x, j, y))) continue;
      if (!heard && picked.some(([j]) => j === i)) continue;
      picked.push([i, x]);
    }
    return shuffled(picked);
  }
  function shapeQuestion(type, target, f, k) {
    if (type === 'bul') { const w = huntWord(target, f); return { type, target, f, h: w.h, w }; }
    const h = pick([0, 1, 2]);
    return { type, target, f, h, choices: shapeChoices(target, h, k, type === 'dinle-sekil') };
  }
  function bitisikRound(k) {
    const questions = [];
    for (const target of coveLetters(k)) {
      const at = shuffled([1, 2, 3]);
      ['sekil-harf', 'dinle-sekil', 'bul'].forEach((type, n) => questions.push(shapeQuestion(type, target, at[n], k)));
    }
    const first = k - k % LETTER_COVES; // the first cove of the topic
    const earlier = Array.from({ length: (k - first) * 4 }, (_, i) => i);
    shuffled(earlier).slice(0, REVIEW).forEach((target, n) =>
      questions.push(shapeQuestion(['sekil-harf', 'dinle-sekil', 'bul'][n % 3], target, pick([1, 2, 3]), k)));
    return spread(questions);
  }
  // Cezm: every letter of the cove three times. Its cezm syllable is heard and found among written
  // syllables (ses-cezm), shown and its sound found among three sounds (cezm-ses), and heard with the
  // harekeli letter before it shown, the letter with the cezm to be found (cezm-harf). The syllable without
  // its cezm (bi for bis) is among the choices: hearing the cezm is the point. From the second cezm cove on,
  // syllables of the earlier ones come back for review.
  // A choice is a cezm syllable ({ c: i }) or a harekeli syllable ({ i, h }).
  function cezmChoices(target, k, count, sounds) {
    const own = [...coveLetters(k), ...shuffled(cezmEarlier(k))];
    const picked = [{ c: target }];
    if (!cezmFaint(target)) picked.push({ ...cezm(target).before });
    // other cezm syllables, first those that start with the same harekeli letter
    const start = cezm(target).text.slice(0, 2);
    const others = [...shuffled(own.filter(i => cezm(i).text.slice(0, 2) === start)), ...shuffled(own), ...shuffled(glyphs.map((_, i) => i))];
    for (const i of others) {
      if (picked.length >= count) break;
      if (i !== target && !picked.some(c => c.c === i) && !cezmAlike(i, target) && !(sounds && cezmFaint(i))) picked.push({ c: i });
    }
    return shuffled(picked);
  }
  const cezmEarlier = k => Array.from({ length: k % LETTER_COVES * 4 }, (_, i) => i);
  // The letter with the cezm among letters that would not sound the same after the harekeli letter.
  const consonant = i => readings[i][0].replace(/[aeıiouü]/g, '');
  function sakinChoices(target, k) {
    const order = [...shuffled(twins(target)), ...shuffled(coveLetters(k)), ...shuffled(glyphs.map((_, i) => i))];
    const picked = [target];
    for (const i of order) if (picked.length < 4 && !picked.includes(i) && !picked.some(j => consonant(j) === consonant(i))) picked.push(i);
    return shuffled(picked);
  }
  const cezmQuestion = (type, target, k) => type === 'cezm-harf' ? { type, target, choices: sakinChoices(target, k) } :
    { type, target, choices: cezmChoices(target, k, type === 'cezm-ses' ? 3 : 4, type === 'cezm-ses') };
  function cezmRound(k) {
    const questions = [];
    for (const target of coveLetters(k)) for (const type of ['ses-cezm', 'cezm-ses', 'cezm-harf']) questions.push(cezmQuestion(type, target, k));
    shuffled(cezmEarlier(k)).slice(0, REVIEW).forEach((target, n) => questions.push(cezmQuestion(['ses-cezm', 'cezm-ses', 'cezm-harf'][n % 3], target, k)));
    return spread(questions);
  }
  // Tenvin: every letter of the cove three times, once with each tenvin. Its tenvin is heard and found among
  // written syllables (ses-tenvin), shown and its sound found among three sounds (tenvin-ses), and seen among the
  // same letter with each hareke alone, to be found by its two marks (tenvin-bul: بٍ among بَ بِ بُ). The same letter
  // with the hareke alone (bi for bin) is always among the choices: hearing and seeing the tenvin is the point. From the second tenvin cove on, letters of the
  // earlier ones come back for review. A choice is a tenvin ({ i, h, t: true }) or a harekeli syllable ({ i, h }).
  const tenvinEarlier = k => Array.from({ length: k % LETTER_COVES * 4 }, (_, i) => i);
  function tenvinChoices(target, h, count) {
    const [second, third] = shuffled([0, 1, 2].filter(x => x !== h));
    const picked = [{ i: target, h, t: true }, { i: target, h }, { i: target, h: second, t: true }];
    // the fourth: a look-alike letter with the same tenvin (بٍ beside تٍ), else the letter's third tenvin
    const alike = shuffled(twins(target)).filter(j => !sameSound(j, h, target, h)).map(j => ({ i: j, h, t: true }));
    const fourth = alike.length && Math.random() < 0.5 ? alike[0] : { i: target, h: third, t: true };
    return shuffled([...picked, fourth].slice(0, count));
  }
  const tenvinQuestion = (type, target, h) => ({ type, target, h, choices: type === 'tenvin-bul' ?
    shuffled([{ i: target, h, t: true }, ...[0, 1, 2].map(x => ({ i: target, h: x }))]) : tenvinChoices(target, h, type === 'tenvin-ses' ? 3 : 4) });
  function tenvinRound(k) {
    const types = ['ses-tenvin', 'tenvin-ses', 'tenvin-bul'];
    const questions = [];
    for (const target of coveLetters(k)) {
      const marks = shuffled([0, 1, 2]);
      types.forEach((type, n) => questions.push(tenvinQuestion(type, target, marks[n])));
    }
    shuffled(tenvinEarlier(k)).slice(0, REVIEW).forEach((target, n) => questions.push(tenvinQuestion(types[n % 3], target, pick([0, 1, 2]))));
    return spread(questions);
  }
  // Şedde: every letter of the cove three times, once with each hareke. Its şedde syllable is heard and found among
  // written ones (ses-sedde), shown and its sound found among three sounds (sedde-ses), and seen among the same letters
  // without it, to be found by its mark (sedde-bul: بِسَّ among بِسَ بِسِ بِسْ). The same letters without the şedde (bise
  // for bisse) are always among the choices, but in what is heard not for a hemze or ayn, which sound alike with and
  // without it. From the second şedde cove on,
  // letters of the earlier ones come back for review. A choice is { i, h, s }: s 'sedde', 'seddesiz' or 'cezm'.
  const seddeEarlier = k => Array.from({ length: k % LETTER_COVES * 4 }, (_, i) => i);
  function seddeChoices(target, h, count) {
    const [second, third] = shuffled([0, 1, 2].filter(x => x !== h));
    const picked = [{ i: target, h, s: 'sedde' }, seddeFaint(target) ? { i: target, h: third, s: 'sedde' } : { i: target, h, s: 'seddesiz' },
      { i: target, h: second, s: 'sedde' }];
    // the fourth: the cezm syllable it is made of (بِسْ), or a look-alike letter's şedde syllable
    const alike = shuffled(twins(target)).map(j => ({ i: j, h, s: 'sedde' }));
    picked.push(alike.length && Math.random() < 0.5 ? alike[0] : picked.some(c => c.h === third && c.s === 'sedde') ? { i: target, h: 0, s: 'cezm' } :
      Math.random() < 0.5 ? { i: target, h: 0, s: 'cezm' } : { i: target, h: third, s: 'sedde' });
    return shuffled(picked.slice(0, count));
  }
  // "Find the şedde": the şedde syllable, the same letters without it with this hareke and another, and the cezm syllable.
  const seddeSeen = (target, h) => shuffled([{ i: target, h, s: 'sedde' }, { i: target, h, s: 'seddesiz' },
    { i: target, h: pick([0, 1, 2].filter(x => x !== h)), s: 'seddesiz' }, { i: target, h: 0, s: 'cezm' }]);
  const seddeQuestion = (type, target, h) => ({ type, target, h, choices: type === 'sedde-bul' ? seddeSeen(target, h) :
    seddeChoices(target, h, type === 'sedde-ses' ? 3 : 4) });
  function seddeRound(k) {
    const types = ['ses-sedde', 'sedde-ses', 'sedde-bul'];
    const questions = [];
    for (const target of coveLetters(k)) {
      const marks = shuffled([0, 1, 2]);
      types.forEach((type, n) => questions.push(seddeQuestion(type, target, marks[n])));
    }
    shuffled(seddeEarlier(k)).slice(0, REVIEW).forEach((target, n) => questions.push(seddeQuestion(types[n % 3], target, pick([0, 1, 2]))));
    return spread(questions);
  }
  // Keep the same letter from coming up twice in a row.
  function spread(questions) {
    const result = shuffled(questions);
    for (let i = 1; i < result.length; i++) {
      if (result[i].target !== result[i - 1].target) continue;
      const j = result.findIndex((q, n) => n > i && q.target !== result[i - 1].target);
      if (j > 0) [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function startRound(kind) {
    round = { kind, part: kind === 'intro' ? 'hareke' : section, cove, wasDone: kind === 'cove' && coveDone(section, cove), questions:
      kind === 'intro' ? introRound() : section === 'harf' ? harfRound(cove) : section === 'hareke' ? harekeRound(cove) :
        section === 'cezm' ? cezmRound(cove) : section === 'tenvin' ? tenvinRound(cove) : section === 'sedde' ? seddeRound(cove) : bitisikRound(cove),
      right: 0, missed: new Set() };
    turn = 0;
    earned = [];
    if (!dialog.open) dialog.showModal();
    ask();
  }
  $('elif-play').onclick = () => { if (coveOpen(section, cove)) { playCue('start'); startRound('cove'); } };

  function header(total) {
    const label = round.kind === 'intro' ? 'Harekelerle tanışma' : coves[round.cove];
    return '<p class="elif-step">' + label + ' · ' + (turn + 1) + ' / ' + total + '</p><ol class="elif-dots" aria-hidden="true">' +
      round.questions.map((_, n) => '<li class="' + (round.missed.has(n) ? 'miss' : n < turn ? 'done' : n === turn ? 'now' : '') +
        '"></li>').join('') + '</ol>';
  }
  function ask() {
    const q = round.questions[turn];
    const total = round.questions.length;
    const stage = $('elif-stage');
    stage.innerHTML = header(total);
    const prompt = el('h2', '', '');
    prompt.id = 'elif-prompt';
    prompt.tabIndex = -1;
    const response = el('p', '', '');
    response.id = 'elif-response';
    response.setAttribute('role', 'status');
    const next = el('button', 'elif-action', '');
    next.id = 'elif-next';
    next.hidden = true;
    const letterQuestion = q.type === 'listen' || q.type === 'sound';
    const joined = ['sekil-harf', 'dinle-sekil', 'bul'].includes(q.type);
    const withCezm = ['ses-cezm', 'cezm-ses', 'cezm-harf'].includes(q.type);
    const withTenvin = ['ses-tenvin', 'tenvin-ses', 'tenvin-bul'].includes(q.type);
    const withSedde = ['ses-sedde', 'sedde-ses', 'sedde-bul'].includes(q.type);
    // A bitişik question says the letter and its place ("Be. Kelimenin başında"); the example word can be heard on its own.
    const play = () => q.type === 'bul' ? voice.syllable(q.target, q.h, response) : joined ? voice.shape(q.target, q.h, q.f, response) : letterQuestion ? voice.letter(q.target, response) :
      withCezm ? voice.cezm(q.target, response) : withTenvin ? voice.tenvin(q.target, q.h, response) : withSedde ? voice.sedde(q.target, q.h, response) :
      voice.syllable(q.target, q.h, response);
    // A choice of a şedde question ({ i, h, s }): its writing, its name, its sound and its mark alone.
    const seddeText = c => c.s === 'sedde' ? sedde(c.i, c.h) : c.s === 'seddesiz' ? seddesiz(c.i, c.h) : cezm(c.i).text;
    const seddeChoiceName = c => c.s === 'sedde' ? seddeName(c.i, c.h) : c.s === 'seddesiz' ? seddesizName(c.i, c.h) : cezmName(c.i);
    const hearSedde = c => c.s === 'sedde' ? voice.sedde(c.i, c.h, response) : c.s === 'seddesiz' ? voice.seddesiz(c.i, c.h, response) : voice.cezm(c.i, response);
    const seddeRight = c => c.s === 'sedde' && c.i === q.target && c.h === q.h;

    // A choice of a tenvin question: a tenvin ({ i, h, t: true }) or the harekeli syllable ({ i, h }).
    const tenvinText = c => c.t ? tenvin(c.i, c.h) : syllable(c.i, c.h);
    const tenvinChoiceName = c => c.t ? tenvinName(c.i, c.h) : syllableName(c.i, c.h);
    const hearTenvinChoice = c => c.t ? voice.tenvin(c.i, c.h, response) : voice.syllable(c.i, c.h, response);
    const tenvinRight = c => c.t === true && c.i === q.target && c.h === q.h;

    // A choice of a cezm question: a cezm syllable ({ c }) or a harekeli syllable ({ i, h }).
    const cezmText = c => c.c !== undefined ? cezm(c.c).text : syllable(c.i, c.h);
    const cezmChoiceName = c => c.c !== undefined ? cezmName(c.c) : syllableName(c.i, c.h);
    const hearChoice = c => c.c !== undefined ? voice.cezm(c.c, response) : voice.syllable(c.i, c.h, response);
    const speaker = () => {
      const button = el('button', 'elif-speaker', '<span aria-hidden="true">🔊</span><small>Tekrar dinle</small>');
      button.setAttribute('aria-label', 'Sesi tekrar dinle');
      button.onclick = play;
      return button;
    };
    const grid = el('div', 'elif-choices');
    grid.id = 'elif-choices';
    let rightButton = null;
    let hunt = null;
    const answer = q.type === 'dinle-sekil' ? syllableName(q.target, q.h) + ', ' + placeLower(q.f) :
      letterQuestion ? names[q.target] : withCezm ? cezmName(q.target) : withTenvin ? tenvinName(q.target, q.h) : withSedde ? seddeName(q.target, q.h) :
      syllableName(q.target, q.h);
    // The children cannot read yet: what to do is said aloud the first time a kind of question comes
    // in a round, and the turtle button says it again. Listening questions then play their sound.
    let autoplay = false;
    round.told ||= new Set();
    const fresh = !round.told.has(q.type);
    round.told.add(q.type);
    const tell = then => voice.instruct(howTo[q.type], () => { if (dialog.open && round.questions[turn] === q) then?.(); });
    const howto = el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>');
    howto.setAttribute('aria-label', 'Ne yapacağımı tekrar söyle');
    howto.onclick = () => tell(autoplay ? play : null);
    stage.append(howto);

    if (q.type === 'listen') {
      prompt.textContent = 'Dinle ve harfi bul';
      grid.classList.add('four');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(glyphs[i]), n, i === q.target, () => names[i] + ' değil.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'sound') {
      prompt.textContent = 'Bu harfin adı hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(glyphs[q.target])));
      soundChoices(q.choices.map(i => [() => voice.letter(i, response), i === q.target]), stage, response, 'Bu ses başka bir harfin.');
    } else if (q.type === 'ses-hece') {
      // From the sound to the letter: the syllable is only heard, the harekeli letter is to be found.
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add(q.choices.length === 3 ? 'three' : 'four');
      q.choices.forEach(([i, h], n) => grid.append(choice(glyphHtml(syllable(i, h)), n, i === q.target && h === q.h,
        () => 'Bu ' + syllableName(i, h) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'hece-ses') {
      // From the letter to the sound: the harekeli letter is shown, its sound is to be found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(syllable(q.target, q.h))));
      soundChoices(q.choices.map(([i, h]) => [() => voice.syllable(i, h, response), i === q.target && h === q.h]), stage, response,
        'Bu ses başka bir hecenin.');
    } else if (q.type === 'sekil-harf') {
      // A harekeli shape is shown: which harekeli letter alone is it?
      prompt.textContent = 'Bu hangi hece?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(shape(q.target, q.f, q.h))));
      grid.classList.add('four');
      q.choices.forEach(([i, h], n) => grid.append(choice(glyphHtml(syllable(i, h)), n, i === q.target && h === q.h,
        () => 'Bu şekil ' + syllableName(i, h) + ' değil.')));
      stage.append(grid);
    } else if (q.type === 'dinle-sekil') {
      // The syllable and its place are heard: which shape is it?
      prompt.innerHTML = 'Dinle ve hecenin şeklini bul ' + placeIcon(q.f);
      grid.classList.add('four');
      q.choices.forEach(([i, h], n) => grid.append(choice(glyphHtml(shape(i, q.f, h)), n, i === q.target && h === q.h, () => 'Bu ' + syllableName(i, h) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'bul') {
      // Harf avı: the harekeli letter alone floats above a word it hides in. It is found in its joined shape
      // by tapping it in the word, or by carrying it onto it; tapping it says the syllable.
      prompt.textContent = 'Bu heceyi kelimede bul';
      hunt = huntBoard();
      stage.append(prompt, hunt.board);
      autoplay = true;
    } else if (q.type === 'ses-cezm') {
      // The cezm syllable is heard; it is found among written syllables, the one without the cezm among them.
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add(q.choices.length === 3 ? 'three' : 'four', 'cezm');
      q.choices.forEach((c, n) => grid.append(choice(glyphHtml(cezmText(c)), n, c.c === q.target, () => 'Bu ' + cezmChoiceName(c) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'cezm-ses') {
      // The cezm syllable is shown; its sound is found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(cezm(q.target).text)));
      soundChoices(q.choices.map(c => [() => hearChoice(c), c.c === q.target]), stage, response, 'Bu ses başka bir hecenin.');
    } else if (q.type === 'cezm-harf') {
      // The syllable is heard, the harekeli letter it starts with is shown: which letter has the cezm?
      const { before } = cezm(q.target);
      prompt.textContent = 'Dinle: hangi harf cezimli?';
      const gap = el('div', 'elif-big elif-cezm-gap', '<b lang="ar" dir="rtl">' + syllable(before.i, before.h) + '</b><span class="elif-cezm-blank" aria-hidden="true">?</span>');
      gap.dir = 'rtl';
      grid.classList.add('four', 'cezm');
      q.choices.forEach((i, n) => grid.append(choice(glyphHtml(cezm(i).sakin), n, i === q.target, () => 'Bu ' + (i ? names[i] : 'hemze') + '.')));
      stage.append(prompt, gap, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'ses-tenvin') {
      // The tenvin is heard; it is found among written syllables, the letter with the hareke alone among them.
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add(q.choices.length === 3 ? 'three' : 'four', 'cezm');
      q.choices.forEach((c, n) => grid.append(choice(glyphHtml(tenvinText(c)), n, tenvinRight(c), () => 'Bu ' + tenvinChoiceName(c) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'tenvin-ses') {
      // The tenvin is shown; its sound is found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(tenvin(q.target, q.h))));
      soundChoices(q.choices.map(c => [() => hearTenvinChoice(c), tenvinRight(c)]), stage, response, 'Bu ses başka bir hecenin.');
    } else if (q.type === 'tenvin-bul') {
      // The same letter with the tenvin and with each hareke alone: which one has the two marks? Seen, not heard.
      prompt.textContent = 'Tenvinli heceyi bul';
      grid.classList.add('four', 'cezm');
      q.choices.forEach((c, n) => grid.append(choice(glyphHtml(tenvinText(c)), n, tenvinRight(c), () => 'Bu ' + tenvinChoiceName(c) + ', tenvinsiz.')));
      stage.append(prompt, grid);
    } else if (q.type === 'ses-sedde') {
      // The şedde syllable is heard; it is found among written ones, the same letters without the şedde among them.
      prompt.textContent = 'Dinle ve heceyi bul';
      grid.classList.add(q.choices.length === 3 ? 'three' : 'four', 'cezm');
      q.choices.forEach((c, n) => grid.append(choice(glyphHtml(seddeText(c)), n, seddeRight(c), () => 'Bu ' + seddeChoiceName(c) + '.')));
      stage.append(prompt, speaker(), grid);
      autoplay = true;
    } else if (q.type === 'sedde-ses') {
      // The şedde syllable is shown; its sound is found by listening.
      prompt.textContent = 'Bu hecenin sesi hangisi?';
      stage.append(prompt, el('div', 'elif-big', glyphHtml(sedde(q.target, q.h))));
      soundChoices(q.choices.map(c => [() => hearSedde(c), seddeRight(c)]), stage, response, 'Bu ses başka bir hecenin.');
    } else if (q.type === 'sedde-bul') {
      // The şedde syllable among the same letters without it: which one has the şedde? Seen, not heard.
      prompt.textContent = 'Şeddeli heceyi bul';
      grid.classList.add('four', 'cezm');
      q.choices.forEach((c, n) => grid.append(choice(glyphHtml(seddeText(c)), n, seddeRight(c), () => 'Bu ' + seddeChoiceName(c) + ', şeddesiz.')));
      stage.append(prompt, grid);
    }
    stage.append(response, next);
    prompt.focus();
    if (fresh) tell(autoplay ? play : null); else if (autoplay) play();
    hunt?.start(fresh);

    function choice(html, n, right, wrongText, label) {
      const button = el('button', 'elif-choice tone-' + n % 4, html);
      button.dataset.cue = '';
      button.setAttribute('aria-label', label || (n + 1) + '. seçenek');
      if (right) rightButton = button;
      button.onclick = () => right ? correct(button) : wrong(button, wrongText());
      return button;
    }
    // As on Çarpım Adası: the first mistake ends the round. The right answer is shown
    // and read out, then the round starts again from the beginning with new questions.
    function wrong(button, text) {
      round.missed.add(turn);
      for (const item of stage.querySelectorAll('.elif-choice, .elif-sound, #elif-choose, .elif-speaker, .elif-hunt button')) item.disabled = true;
      for (const letter of stage.querySelectorAll('.elif-hunt-letter[data-right]')) letter.classList.add('matched');
      playCue('retry');
      fx.bump(button, 'missed');
      button.classList.add('chosen-wrong');
      rightButton?.classList.add('matched');
      stage.querySelector('.elif-dots li.now')?.classList.replace('now', 'miss');
      response.textContent = 'Ah, bu kez olmadı! ' + text + ' Doğrusu: ' + answer + '. Tur baştan başlıyor.';
      setTimeout(() => { if (dialog.open && round.questions[turn] === q) {
        if (round.kind === 'intro') voice.chant(q.target, q.h); else play();
      } }, 600);
      next.hidden = false;
      next.textContent = '↻';
      next.setAttribute('aria-label', 'Tekrar dene');
      next.focus();
      next.onclick = () => {
        voice.stop();
        playCue('start');
        if (round.kind === 'intro') {
          round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
          turn = 0;
          ask();
        } else startRound('cove');
      };
    }
    function correct(button) {
      for (const item of stage.querySelectorAll('.elif-choice, .elif-sound, #elif-choose, .elif-hunt button')) item.disabled = true;
      button?.classList.add('matched');
      playCue('correct');
      if (button) fx.burst(button, { symbols: [prizeOf(round.part), '✦', '★'] });
      round.right++;
      let message = '✓ Doğru!';
      if (round.kind === 'intro') message += ' Bu ' + syllableName(q.target, q.h) + '.';
      else if (round.part === 'harf') message += ' Bu ' + names[q.target] + '.';
      else if (joined) message += ' ' + syllableName(q.target, q.h) + ' ' + inWord[q.found || q.f] + '.';
      else if (withCezm) message += ' ' + cezmName(q.target) + '.';
      else if (withTenvin) message += ' Bu ' + tenvinName(q.target, q.h) + '.';
      else if (withSedde) message += ' Bu ' + seddeName(q.target, q.h) + '.';
      else message += ' Bu ' + syllableName(q.target, q.h) + '.';
      response.textContent = message;
      if (round.kind === 'intro') voice.chant(q.target, q.h);
      else if (q.type === 'cezm-harf') voice.cezmChant(q.target, response);
      else if (q.type === 'tenvin-bul') voice.tenvinChant(q.target, q.h, response);
      else if (q.type === 'tenvin-ses') play();
      else if (q.type === 'sedde-bul') voice.seddeChant(q.target, q.h, response);
      else if (q.type === 'sedde-ses') play();
      else if (q.type === 'bul') hunt.spell();
      else if (q.type === 'hece-ses' || q.type === 'sound' || q.type === 'cezm-ses' || joined) play();
      next.hidden = false;
      next.textContent = turn === total - 1 ? '🏁' : '▶';
      next.setAttribute('aria-label', turn === total - 1 ? 'Sonucu gör' : 'Sıradaki soru');
      next.focus();
      next.onclick = () => { voice.stop(); turn++; turn === total ? finish() : ask(); };
    }
    // Sound options: tap to listen, then confirm the one that matches the letter.
    function soundChoices(options, host, note, wrongText) {
      const row = el('div', 'elif-sounds');
      let selected = null;
      const choose = el('button', 'elif-action', '✓ Bu ses');
      choose.id = 'elif-choose';
      choose.disabled = true;
      choose.dataset.cue = '';
      options.forEach(([listen, right], n) => {
        const button = el('button', 'elif-sound tone-' + n % 4, '<span aria-hidden="true">🔊</span><small>' + (n + 1) + '</small>');
        button.setAttribute('aria-label', (n + 1) + '. sesi dinle');
        button.setAttribute('aria-pressed', 'false');
        button.onclick = () => {
          for (const other of row.children) other.setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-pressed', 'true');
          selected = { button, right };
          choose.disabled = false;
          note.textContent = (n + 1) + '. ses seçildi. Doğruysa “Bu ses”e dokun.';
          listen();
        };
        if (right) rightButton = button;
        row.append(button);
      });
      choose.onclick = () => {
        if (!selected) return;
        if (selected.right) return correct(selected.button);
        selected.button.setAttribute('aria-pressed', 'false');
        wrong(selected.button, wrongText);
      };
      host.append(row, choose);
    }
    // Harf avı: the letter alone in a bubble above the word. Tapping the bubble says its name; dragging
    // it shows which letter of the word it is over and drops it there; tapping a letter of the word picks
    // it (the letter nearest the finger, so thin letters are easy to hit). A hand shows the way, without
    // a word written: from the bubble into the word, when the question first comes and when nothing happens.
    function huntBoard() {
      const { letters: parts } = word(q.w.i, q.w.f);
      const board = el('div', 'elif-hunt');
      const bubble = el('button', 'elif-hunt-bubble tone-' + q.target % 4, glyphHtml(syllable(q.target, q.h)));
      bubble.setAttribute('aria-label', syllableName(q.target, q.h) + ': dinle, sonra kelimede bul');
      const wordButton = el('button', 'elif-hunt-word', '<b lang="ar" dir="rtl">' + huntHtml(parts, q.target) + '</b>');
      wordButton.setAttribute('aria-label', 'Kelime. Harfi bulunca kelimede üstüne dokun.');
      const hand = el('span', 'elif-hunt-hand', '👆');
      hand.setAttribute('aria-hidden', 'true');
      board.append(bubble, el('span', 'elif-hunt-trail'), wordButton, hand);
      const letters = [...wordButton.querySelectorAll('.elif-hunt-letter')];
      let over = false, hints = 0, idle = 0;
      const alive = () => !over && dialog.open && round.questions[turn] === q;

      // The letter of the word under a point: the one whose box is nearest along the line.
      function letterAt(x, y, slack = 24) {
        const box = wordButton.getBoundingClientRect();
        if (y < box.top - slack || y > box.bottom + slack || x < box.left - slack || x > box.right + slack) return null;
        let best = null, distance = Infinity;
        for (const letter of letters) {
          const r = letter.getBoundingClientRect();
          const d = (x < r.left ? r.left - x : x > r.right ? x - r.right : 0) * 1000 + Math.abs(x - (r.left + r.right) / 2);
          if (d < distance) { distance = d; best = letter; }
        }
        return best;
      }
      const hover = letter => { for (const other of letters) other.classList.toggle('hover', other === letter); };

      function choose(letter) {
        if (!alive()) return;
        over = true;
        clearTimeout(idle);
        hover(null);
        hand.classList.remove('go');
        if (!letter.hasAttribute('data-right')) {
          home(true);
          wrong(letter, 'Bu ' + syllableName(Number(letter.dataset.i), Number(letter.dataset.h)) + '.');
          return;
        }
        q.found = Number(letter.dataset.f);
        // The bubble flies into the word and turns into the letter's joined shape there.
        const from = bubble.getBoundingClientRect(), to = letter.getBoundingClientRect();
        const dx = moved.x + (to.left + to.right) / 2 - (from.left + from.right) / 2;
        const dy = moved.y + (to.top + to.bottom) / 2 - (from.top + from.bottom) / 2;
        bubble.classList.remove('dragging');
        bubble.classList.add('flying');
        bubble.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(.5)';
        setTimeout(() => {
          for (const found of letters) if (found.hasAttribute('data-right')) found.classList.add('found');
          fx.burst(wordButton, { symbols: [prizeOf('bitisik'), '✦', '★'] });
          // Back in its place, the bubble shows what the harekeli letter became: بَ ⬅ ـبَـ
          const form = Number(letter.dataset.form);
          const joinedForm = (form >= 2 ? 'ـ' : '') + parts[Number(letter.dataset.n)].c + (form === 1 || form === 2 ? 'ـ' : '');
          bubble.classList.remove('flying');
          bubble.classList.add('became');
          bubble.style.transform = '';
          bubble.innerHTML = '<span dir="rtl">' + glyphHtml(syllable(q.target, q.h)) + '<i aria-hidden="true">⬅</i>' + glyphHtml(joinedForm) + '</span>';
        }, 380);
        correct(null);
      }
      wordButton.onclick = event => {
        // a keyboard press has no point: it gives no answer
        if (!event.detail) return;
        const letter = letterAt(event.clientX, event.clientY, 0) || letterAt(event.clientX, event.clientY, 60);
        if (letter) choose(letter);
      };

      // Dragging the bubble.
      let drag = null, dragged = false;
      const LIFT = 72;
      const moved = { x: 0, y: 0 };
      function home(animate) {
        moved.x = moved.y = 0;
        bubble.classList.remove('dragging');
        bubble.classList.toggle('returning', animate);
        bubble.style.transform = '';
      }
      bubble.onpointerdown = event => {
        if (!alive() || bubble.disabled) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
        dragged = false;
        bubble.setPointerCapture?.(event.pointerId);
        hand.classList.remove('go');
      };
      bubble.onpointermove = event => {
        if (!drag || event.pointerId !== drag.id || !alive()) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!dragged && Math.hypot(dx, dy) < 10) return;
        if (!dragged) voice.stop();
        dragged = true;
        // the bubble rides a little above the finger, so the letter under the finger stays in sight
        moved.x = dx;
        moved.y = dy - LIFT;
        bubble.classList.remove('returning');
        bubble.classList.add('dragging');
        bubble.style.transform = 'translate(' + moved.x + 'px, ' + moved.y + 'px) scale(.72)';
        hover(letterAt(event.clientX, event.clientY));
      };
      const drop = event => {
        if (!drag || event.pointerId !== drag.id) return;
        drag = null;
        if (!dragged) return;
        const letter = event.type === 'pointerup' && alive() ? letterAt(event.clientX, event.clientY) : null;
        hover(null);
        if (letter) choose(letter); else { home(true); playCue('oops'); }
        setTimeout(() => { dragged = false; }, 0);
      };
      bubble.onpointerup = drop;
      bubble.onpointercancel = drop;
      bubble.onclick = () => { if (!dragged && !over) voice.syllable(q.target, q.h, response); };

      // The hand: from the bubble down into the middle of the word, pressing there.
      function hint() {
        if (!alive() || !board.isConnected) return;
        if (drag) { idle = setTimeout(hint, 4000); return; }
        const b = bubble.getBoundingClientRect(), w = wordButton.getBoundingClientRect(), box = board.getBoundingClientRect();
        hand.style.setProperty('--x0', (b.left + b.right) / 2 - box.left + 'px');
        hand.style.setProperty('--y0', (b.top + b.bottom) / 2 - box.top + 'px');
        hand.style.setProperty('--x1', (w.left + w.right) / 2 - box.left + 'px');
        hand.style.setProperty('--y1', (w.top + w.bottom) / 2 - box.top + 'px');
        hand.classList.remove('go');
        void hand.offsetWidth;
        hand.classList.add('go');
        if (++hints < 4) idle = setTimeout(hint, 9000);
      }
      return {
        board,
        start(fresh) { idle = setTimeout(hint, fresh ? 900 : 7000); },
        // After the right answer: the syllable and its place, then the word read right to left, syllable by
        // syllable, each letter lighting up as its syllable is said.
        spell() {
          const light = n => { for (const letter of letters) letter.classList.toggle('say', letter === letters[n]); };
          voice.shape(q.target, q.h, q.found, response, () => setTimeout(() => voice.word(q.w.i, q.w.f, response, null, light), 250));
        }
      };
    }
  }

  function finish() {
    const total = round.questions.length;
    const stage = $('elif-stage');
    const perfect = round.missed.size === 0;
    const misses = total + ' sorudan ' + round.missed.size + ' tanesinde hata oldu.';
    const retry = '<div class="elif-prize" aria-hidden="true">🔁</div><h2 id="elif-prompt" tabindex="-1">Bir daha deneyelim!</h2>';
    if (round.kind === 'intro') {
      if (perfect) {
        progress.tanisma = true;
        save();
      }
      stage.innerHTML = perfect ? '<div class="elif-prize" aria-hidden="true">✨</div><h2 id="elif-prompt" tabindex="-1">Harekelerle tanıştın!</h2>' +
        '<p>Üstün <b lang="ar">◌َ</b>, esre <b lang="ar">◌ِ</b> ve ötre <b lang="ar">◌ُ</b> ile tanıştın. Şimdi öğrendiğin harfleri ' +
        'harekeleriyle okuyalım.</p>' + (storageNote ? '<p>' + storageNote + '</p>' : '') +
        '<button class="elif-action" id="elif-continue">▶ Devam: 🦪 Harekeler</button>' :
        retry + '<p>' + misses + ' Harekelere geçmek için hepsini ilk denemede bilmelisin.</p>' +
        '<button class="elif-action" id="elif-continue">↻ Tekrar dene</button>';
      playCue(perfect ? 'island' : 'retry');
      if (perfect) fx.confetti(dialog);
    } else {
      const part = round.part;
      const before = coveDone(part, round.cove);
      // Only a round without a single mistake passes the cove and gives its prizes.
      if (perfect) {
        for (const i of coveLetters(round.cove)) {
          if (!mastered(part, i)) earned.push(i);
          progress[part][i] = Math.max(progress[part][i], mastery);
        }
        save();
      }
      const done = coveDone(part, round.cove);
      const step = nextStep();
      const prizes = earned.map((i, n) => '<span class="elif-won" lang="ar">' + (part === 'bitisik' ? shape(i, 2, 0) : part === 'cezm' ? cezm(i).text :
        part === 'tenvin' ? tenvin(i, n % 3) : part === 'sedde' ? sedde(i, n % 3) : glyphs[i]) + '</span>').join('');
      if (!done) {
        stage.innerHTML = retry + '<p>' + misses + ' Adacığı geçmek için bütün soruları ilk denemede bilmelisin. Harfleri bir kez daha dinle ve tekrar oyna.</p>' +
          '<button class="elif-action" id="elif-continue">↻ Tekrar oyna</button>';
        playCue('retry');
      } else {
        const heading = before ? (perfect ? 'Hepsi doğru!' : 'Güzel çalıştın!') : !step ? 'Yolun sonuna geldin!' :
          part === 'harf' ? coves[round.cove] + ' harflerini öğrendin!' : part === 'hareke' ? coves[round.cove] + ' harekeleri tamam!' :
          part === 'cezm' ? coves[round.cove] + ' cezimleri tamam!' : part === 'tenvin' ? coves[round.cove] + ' tenvinleri tamam!' :
          part === 'sedde' ? coves[round.cove] + ' şeddeleri tamam!' :
          coves[round.cove] + ' şekilleri tamam!';
        let text = perfect ? 'Bütün soruları ilk denemede bildin.' : misses;
        if (before) { /* a replay: nothing to announce */ }
        else if (!step) text += ' Sıradaki bölümler yakında geliyor.';
        else if (step.game) text += ' Şimdi oyun zamanı! Bir oyun seç.';
        else if (step.intro) text += ' Şimdi harekelerle tanışalım.';
        else if (step.part === 'hareke') text += ' Şimdi bu harfleri harekeleriyle okuyalım.';
        else if (step.part === 'bitisik') text += ' Sırada harflerin bitişik yazılışı var: ' + coves[step.cove] + '.';
        else if (step.part === 'cezm') text += ' Sırada cezm var: ' + coves[step.cove] + '.';
        else if (step.part === 'tenvin') text += ' Sırada tenvin var: ' + coves[step.cove] + '.';
        else if (step.part === 'sedde') text += ' Sırada şedde var: ' + coves[step.cove] + '.';
        else text += ' Sırada yeni harfler var: ' + coves[step.cove] + '.';
        stage.innerHTML = '<div class="elif-prize" aria-hidden="true">' + prizeOf(part) + '</div><h2 id="elif-prompt" tabindex="-1">' +
          heading + '</h2>' + (prizes ? '<div class="elif-won-row">' + prizes + '</div>' : '') + '<p>' + text + '</p>' +
          (storageNote ? '<p>' + storageNote + '</p>' : '') + '<button class="elif-action" id="elif-continue"></button>';
        $('elif-continue').textContent = before || !step ? '‹ Yola dön' : '▶ Devam: ' + stepIcon(step) + ' ' + stepName(step);
        playCue(perfect ? 'island' : 'correct');
        if (perfect) fx.confetti(dialog);
      }
    }
    $('elif-prompt').focus();
    voice.instruct($('elif-prompt').textContent);
    $('elif-continue').onclick = () => {
      if (round.kind === 'intro' && !progress.tanisma) {
        round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
        turn = 0;
        ask();
        return;
      }
      if (round.kind === 'cove' && !coveDone(round.part, round.cove)) { startRound('cove'); return; }
      // A step done for the first time leads straight on to the next one; a replay back to the path.
      const step = nextStep();
      const replay = round.kind === 'cove' && round.wasDone;
      dialog.close();
      if (step && !replay) goTo(step); else showHub();
    };
  }

  /* ---------- Hareke introduction ---------- */
  function startIntro() {
    let slide = 0;
    round = { kind: 'intro', part: 'hareke', questions: introRound(), right: 0, missed: new Set() };
    turn = 0;
    earned = [];
    dialog.showModal();
    const show = () => {
      const info = harekeler[slide];
      $('elif-stage').innerHTML = '<p class="elif-step">Harekelerle tanışma · ' + (slide + 1) + ' / 3</p>' +
        '<h2 id="elif-prompt" tabindex="-1">' + info.name + '</h2><button class="elif-big mark-' + slide + '" id="elif-demo" aria-label="Dinle">' +
        glyphHtml(syllable(1, slide)) + '</button><p class="elif-lesson"><b>' + info.place + '.</b> Harfe dokun ve dinle: ' +
        '<b>' + syllableName(1, slide) + '</b>.</p>' +
        '<div class="elif-examples">' + [1, 2, 3].map(i => '<button class="elif-syllable" data-i="' + i + '">' + glyphHtml(syllable(i, slide)) +
        '<span>' + names[i] + '</span></button>').join('') + '</div><p id="elif-response" role="status"></p>' +
        '<button class="elif-action" id="elif-next">▶ ' + (slide < 2 ? 'Sonraki hareke' : 'Şimdi sen bul') + '</button>';
      $('elif-prompt').focus();
      const note = $('elif-response');
      // Said aloud for children who cannot read yet: the hareke's name, where it sits, then the chant.
      const lesson = () => voice.instruct(info.name + '. ' + info.place + '. Harfe dokun ve dinle.', () => voice.chant(1, slide, note));
      $('elif-stage').prepend(el('button', 'elif-howto', '<span aria-hidden="true">🐢💬</span>'));
      $('elif-stage').querySelector('.elif-howto').onclick = lesson;
      $('elif-stage').querySelector('.elif-howto').setAttribute('aria-label', 'Tekrar anlat');
      $('elif-demo').onclick = () => voice.chant(1, slide, note);
      for (const button of $('elif-stage').querySelectorAll('.elif-examples button')) {
        button.onclick = () => voice.syllable(Number(button.dataset.i), slide, note);
      }
      lesson();
      $('elif-next').onclick = () => { voice.stop(); if (slide < 2) { slide++; show(); } else ask(); };
    };
    show();
  }

  /* ---------- Entry and leaving ---------- */
  $('elif-card').onclick = () => {
    if (!availableForPlayer($('elif-card'))) return;
    progress = load(activeProfile.id);
    arriving = true;
    told.clear();
    $('catalog').hidden = true;
    $('elif-view').hidden = false;
    showHub();
    $('elif-title').focus();
    window.speechSynthesis?.getVoices();
  };
  $('elif-up').onclick = () => { showHub(); $('elif-title').focus(); };
  $('elif-back').onclick = () => { voice.stop(); showCatalog(); };
  $('player').addEventListener('click', () => voice.stop());
  $('elif-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // already reopened for the next step (the hareke introduction)
    voice.stop();
    if ($('elif-view').hidden) return;
    if (section) drawSection(); else showHub();
  });
})();
