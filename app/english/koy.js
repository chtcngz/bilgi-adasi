// English Koyu (app/english/): the bay of the English for Kids site on Keşif Haritası (core/js/harita.js).
// Its islands and stations come from the islands' kelimeler.js (window.englishAdalari): an island per bölüm of the topic map,
// a station per topic. A station is cut into etaps (its gruplar). Tapping a station opens its etaps as small round pictures on a
// path (the station's dialog, #eng1-game); tapping an etap shows its tanıtım kartları one by one (ingilizceOyunlari.kesif:
// a big picture, the English said, the Turkish meaning). An etap is done once its last card is reached; the next one opens then.
// When the etap has questions (the island's sorular.js, window.englishSorular: those whose k[0] is one of the etap's words),
// they come after the cards (englishBalon, app/english/balon-sorusu.js) and the etap is done once they are all answered.
// A station without words yet stays locked ("Yakında"). Questions are written only when the owner asks.
// Progress: localStorage 'ingilizce-english-' + player id → { etap: { 'english-1/selam': 2 } (etaps done, in order),
// soru: { 'english-1/ilk:0': { d, y } } (first tries right and wrong) }.
(() => {
  const adalar = window.englishAdalari || [];
  const $ = id => document.getElementById(id);
  const dialog = $('eng1-game'), stage = $('eng1-stage');
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const RESIM = name => 'assets/images/english/' + name + '.webp?v=2';
  const KEY = id => 'ingilizce-english-' + id;
  let progress = { etap: {}, soru: {} };
  let cancel = null;

  /* ---------- progress ---------- */
  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY(activeProfile.id))); } catch {}
    progress = { etap: {}, soru: {} };
    for (const [k, n] of Object.entries(saved?.etap || {})) if (Number.isInteger(n) && n > 0) progress.etap[k] = n;
    for (const [k, row] of Object.entries(saved?.soru || {})) if (row && typeof row === 'object') progress.soru[k] = { d: Number(row.d) || 0, y: Number(row.y) || 0 };
  }
  function save() {
    try { localStorage.setItem(KEY(activeProfile.id), JSON.stringify(progress)); } catch { storageFailed = true; }
  }
  const stKey = (ada, st) => ada.id + '/' + st.id;
  const etaplar = st => st.gruplar;
  const done = (ada, st) => Math.min(progress.etap[stKey(ada, st)] || 0, etaplar(st).length);
  const ready = st => etaplar(st).length > 0;
  const finished = (ada, st) => ready(st) && done(ada, st) >= etaplar(st).length;
  const etapOpen = (ada, st, n) => devAll() || n <= done(ada, st);
  // the cards of an etap: a word's own cards, or one card of the word with its picture
  const kartlar = g => g.kelimeler.flatMap(([en, tr, k]) => (k?.kartlar || [{ en, tr, resim: k?.resim }]).filter(c => c.resim));
  const kapak = g => kartlar(g)[0]?.resim;
  // the questions of an etap: the island's questions whose word (k[0]) is one of the etap's words, each with its id (ilk:0)
  function sorulari(ada, g) {
    // "Good morning!" answers the word "good morning": capitals and punctuation do not count
    const bare = t => String(t || '').toLocaleLowerCase('en').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const words = new Set(g.kelimeler.map(w => bare(w[0])));
    return (window.englishSorular?.[ada.id] || []).flatMap(stop => stop.sorular.map((q, n) => ({ ...q, id: ada.id + '/' + stop.id + ':' + n })))
      .filter(q => q.balon && words.has(bare(q.k?.[0])));
  }

  /* ---------- the bay ---------- */
  const stationNow = ada => ada.istasyonlar.findIndex(st => ready(st) && !finished(ada, st));
  kesifHaritasi.koy({
    id: 'eng1', kart: 'eng1-card', ad: 'English Koyu', lead: 'İngilizce · 8-12 yaş', simge: '🇬🇧', tema: 'ingilizce',
    hazirla: load,
    yakinda: () => !adalar.some(ada => ada.istasyonlar.some(ready)),
    adalar: () => adalar.map(ada => {
      const list = ada.istasyonlar.filter(ready);
      const all = list.reduce((sum, st) => sum + etaplar(st).length, 0), got = list.reduce((sum, st) => sum + done(ada, st), 0);
      return { ad: ada.ad, simge: ada.simge, not: got + ' / ' + all + ' etap', durum: list.length && list.every(st => finished(ada, st)) ? 'done' : list.length ? 'now' : 'locked' };
    }),
    duraklar: k => {
      const ada = adalar[k], now = stationNow(ada);
      return ada.istasyonlar.map((st, n) => ({
        simge: st.simge, ad: st.ad, etiket: ada.ad + ', ' + st.ad,
        not: ready(st) ? done(ada, st) + ' / ' + etaplar(st).length + ' etap' : 'Yakında',
        durum: !ready(st) ? 'locked' : finished(ada, st) ? 'done' : n === now ? 'now' : 'open',
        kilit: st.ad + ' istasyonu hazırlanıyor. Yakında!'
      }));
    },
    ac: (k, n) => { if (ready(adalar[k].istasyonlar[n])) openStation(adalar[k], adalar[k].istasyonlar[n]); },
    kilit: () => 'Bu ada hazırlanıyor. Yakında!',
    panel(level, k) {
      const { sonraki, kutu } = kesifHaritasi.parca;
      const ada = adalar[level === 'ada' ? k : 0];
      if (!ada) return null;
      const n = stationNow(ada), st = ada.istasyonlar[n >= 0 ? n : 0];
      const parts = [];
      if (ready(st)) {
        const e = Math.min(done(ada, st), etaplar(st).length - 1);
        parts.push(sonraki('▶', finished(ada, st) ? 'Yeniden bak' : 'Sıradaki', st.simge + ' ' + st.ad + ' · ' + (e + 1) + '. Etap', () => openStation(ada, st)));
      }
      const all = ada.istasyonlar.filter(ready);
      parts.push(kutu('<strong>' + esc(ada.simge + ' ' + ada.ad) + '</strong><small>' + esc(ada.bolum || '') + '</small>' +
        all.map(s => '<small>' + esc(s.simge + ' ' + s.ad) + ': ' + done(ada, s) + ' / ' + etaplar(s).length + ' etap</small>').join('') +
        '<small>Bir istasyona dokununca etapları açılır. Her etap kelimelerini resim ve sesle tanıtır; bir etap bitince sıradaki açılır. ' +
        'Öteki istasyonlar yakında geliyor.</small>'));
      return parts;
    }
  });

  /* ---------- a station: its etaps ---------- */
  function openStation(ada, st, justDone = -1) {
    cancel?.();
    cancel = null;
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = 'oyun';
    const list = etaplar(st), got = done(ada, st);
    const now = Math.min(got, list.length - 1);
    stage.innerHTML = '<div class="en-etaplar"><p class="en-ust">' + esc(ada.simge + ' ' + ada.ad) + '</p><h2 id="eng1-prompt" tabindex="-1">' + esc(st.simge + ' ' + st.ad) + '</h2>' +
      '<p class="en-alt">' + got + ' / ' + list.length + ' etap' + (got >= list.length ? ' · 🎉 Bütün etapları bitirdin!' : '') + '</p>' +
      '<div class="en-yol"><svg class="en-cizgi" viewBox="0 0 100 ' + (list.length * 100) + '" preserveAspectRatio="none" aria-hidden="true"><path d="' +
      list.map((_, n) => (n ? 'L' : 'M') + (n % 2 ? 70 : 30) + ' ' + (n * 100 + 50)).join(' ') + '"/></svg></div></div>';
    const path = stage.querySelector('.en-yol');
    list.forEach((g, n) => {
      const open = etapOpen(ada, st, n), isDone = n < got;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'en-etap ' + (n % 2 ? 'sag' : 'sol') + (isDone ? ' done' : n === now ? ' now' : '') + (open ? '' : ' locked') + (n === justDone ? ' pop' : '');
      b.style.setProperty('--n', n);
      b.dataset.cue = '';
      b.setAttribute('aria-label', (n + 1) + '. Etap, ' + g.ad + (isDone ? ', bitti' : open ? '' : ', kilitli'));
      b.innerHTML = '<span class="en-daire"><img src="' + esc(RESIM(kapak(g))) + '" alt="" draggable="false"><i class="en-durum" aria-hidden="true">' +
        (isDone ? '✓' : open ? n + 1 : '🔒') + '</i>' + (n === now && !isDone ? '<b class="en-ben" aria-hidden="true">' + esc(activeProfile?.icon || '🦊') + '</b>' : '') + '</span>' +
        '<span class="en-ad"><strong>' + (n + 1) + '. Etap</strong><small>' + esc(g.ad) + '</small></span>';
      b.onclick = () => {
        if (!open) { playCue('retry', { gain: 0.5 }); fx.bump(b, 'denied'); return; }
        playCue('tap');
        openEtap(ada, st, n);
      };
      path.append(b);
    });
    if (justDone >= 0) {
      playCue(got >= list.length ? 'island' : 'correct');
      if (typeof fx.confetti === 'function') fx.confetti(dialog);
    }
    requestAnimationFrame(() => stage.querySelector('.en-etap.now, .en-etap.pop')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }

  /* ---------- an etap: its tanıtım kartları ---------- */
  function openEtap(ada, st, n) {
    const g = etaplar(st)[n], questions = sorulari(ada, g);
    const finish = () => {
      cancel = null;
      const first = done(ada, st) === n;
      if (first) { progress.etap[stKey(ada, st)] = n + 1; save(); }
      openStation(ada, st, first ? n : -1);
    };
    cancel = ingilizceOyunlari.kesif({
      stage, maskot: activeProfile?.icon, baslik: (n + 1) + '. Etap · ' + g.ad,
      kelimeler: kartlar(g).map(c => ({ en: c.en, tr: c.tr, foto: RESIM(c.resim) })),
      son: questions.length ? 'Sorulara geç ❓' : n < etaplar(st).length - 1 ? '✓ Etabı bitir' : '🏁 Bitir',
      bitti: skipped => {
        cancel = null;
        // skipping the cards (⏭) goes to the questions when there are any, else back to the etaps without finishing it
        if (!questions.length) { if (skipped) openStation(ada, st); else finish(); return; }
        // the etap's questions in a new order every time, so the same answer does not come three times in a row
        const mixed = [...questions];
        for (let i = mixed.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mixed[i], mixed[j]] = [mixed[j], mixed[i]]; }
        cancel = englishBalon.oyna({
          stage, sorular: mixed, maskot: activeProfile?.icon,
          sonuc: (q, right) => { const row = progress.soru[q.id] ||= { d: 0, y: 0 }; row[right ? 'd' : 'y']++; save(); },
          bitti: finish
        });
      }
    });
  }

  /* ---------- the dialog ---------- */
  $('eng1-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    cancel?.();
    cancel = null;
    if (typeof ingilizceSes !== 'undefined') ingilizceSes.stop();
    for (const canvas of dialog.querySelectorAll('.fx-confetti')) canvas.remove();
    kesifHaritasi.yenile();
  });
})();
