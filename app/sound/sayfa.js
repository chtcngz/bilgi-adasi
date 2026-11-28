// Sesler (sound/index.html): the game's Elif Ba clips beside the new ones cut from the owner's recordings.
//
// Rows: one reading each (üstün be, Be's name, the cezm syllable بِسْ …). The left side is what the game plays now, read
// from window.elifRecordings (assets/audio/elif-ba/kayitlar.js) with elifData (islands/elif-ba/data.js) for the writing:
// the girl's clip ("cocuk", the game's default voice) and the man's ("kayit", Diyanet). The right side is the new clips
// (window.sesListesi, sound/liste.js): those of a letter (harf, h) sit beside the game's clip of the same letter and
// hareke; the rest get rows of their own. Only the clips the game plays are listed: the bitişik example words
// (elifRecordings.kelime) are not, as the game reads those words syllable by syllable with the harekeli clips.
// Choices (localStorage): a game clip approved (✓ Onayla) is 'cocuk:hece:1-0' in bilgi-adasi-ses-onaylar; a new clip
// chosen (⇄ Bunu kullan) is its id in bilgi-adasi-ses-secimleri (the key the page used before it had the game's clips).
(() => {
  const $ = id => document.getElementById(id);
  const ONAY = 'bilgi-adasi-ses-onaylar', SECIM = 'bilgi-adasi-ses-secimleri';
  // bump with every new cut of the new clips (tools/ses_kes.py), so no browser plays old ones from its cache
  const SES_V = 2;
  const G = window.elifRecordings || {};
  const C = G.cocuk || {};
  const D = elifData;     // a top-level const of data.js, not a window property
  const yeni = (window.sesListesi || { sesler: [] }).sesler;
  const low = t => String(t ?? '').toLocaleLowerCase('tr');
  const load = key => { try { return new Set(JSON.parse(localStorage.getItem(key)) || []); } catch { return new Set(); } };
  const onay = load(ONAY), secim = load(SECIM);
  const kaydet = () => { try { localStorage.setItem(ONAY, JSON.stringify([...onay])); localStorage.setItem(SECIM, JSON.stringify([...secim])); } catch {} };
  const dakika = s => Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0');

  /* ---------- the rows ---------- */
  const name = i => low(D.names[i]);
  const HK = ['üstün', 'esre', 'ötre'], TK = ['iki üstün', 'iki esre', 'iki ötre'];
  const file = src => src.replace(/^assets\/audio\/elif-ba\//, '').replace(/\.mp3.*$/, '');
  // the game's clips of a reading: the girl's (when she has it, it is the one the game plays) and the man's
  function oyun(kind, key) {
    const out = [];
    const girl = C[kind]?.[key], man = G[kind]?.[key];
    if (girl) out.push({ id: 'cocuk:' + kind + ':' + key, ses: 'Kız sesi', src: girl, calan: true, dosya: 'cocuk/' + file(girl).replace(/^cocuk\//, '') });
    if (man) out.push({ id: 'kayit:' + kind + ':' + key, ses: 'Erkek sesi', src: man, calan: !girl, dosya: file(man) });
    return out;
  }
  const yeniler = (kat, harf, h) => yeni.filter(s => s.kat === kat && s.harf === harf && (h === undefined || s.h === h));
  const tekYeni = s => ({ ad: s.ad, ar: s.ar, okunus: s.okunus, grup: s.grup || '', oyun: [], yeni: [s] });
  const HEMZE = ['ءَ', 'ءِ', 'ءُ'], HEMZE_T = ['ءً', 'ءٍ', 'ءٌ'];

  function harekesiz() {
    const rows = [];
    D.glyphs.forEach((g, i) => {
      rows.push({ ad: name(i), ar: g, okunus: name(i), oyun: oyun('harf', i), yeni: yeniler('harf', i) });
      if (i === 0) rows.push({ ad: 'hemze', ar: 'ء', okunus: 'hemze', oyun: oyun('harf', 'hemze'), yeni: yeniler('harf', 'hemze') });
    });
    return rows;
  }
  function harekeli() {
    const rows = [];
    D.glyphs.forEach((g, i) => {
      for (let h = 0; h < 3; h++)
        rows.push({ grup: D.names[i], ad: HK[h] + ' ' + name(i), ar: D.syllable(i, h), okunus: D.readings[i][h], oyun: oyun('hece', i + '-' + h), yeni: yeniler('harekeli', i, h) });
      if (i === 0) for (let h = 0; h < 3; h++)
        rows.push({ grup: 'Hemze', ad: HK[h] + ' hemze', ar: HEMZE[h], okunus: D.readings[0][h], oyun: [], yeni: yeniler('harekeli', 'hemze', h) });
    });
    return rows;
  }
  function tenvin() {
    const rows = [];
    D.glyphs.forEach((g, i) => {
      for (let h = 0; h < 3; h++)
        rows.push({ grup: D.names[i], ad: TK[h] + ' ' + name(i), ar: D.tenvin(i, h), okunus: D.tenvinReading(i, h), oyun: oyun('tenvin', i + '-' + h), yeni: yeniler('tenvin', i, h) });
      if (i === 0) for (let h = 0; h < 3; h++)
        rows.push({ grup: 'Hemze', ad: TK[h] + ' hemze', ar: HEMZE_T[h], okunus: D.tenvinReading(0, h), oyun: [], yeni: yeniler('tenvin', 'hemze', h) });
    });
    D.tenvinExamples.forEach((x, p) =>
      rows.push({ grup: 'Tenvin örnek kelimeleri', ad: 'örnek kelime', ar: x.word, okunus: x.reading, oyun: oyun('tenvinOrnek', p), yeni: [] }));
    return rows;
  }
  function cezm() {
    const rows = [];
    D.glyphs.forEach((g, i) =>
      rows.push({ grup: 'Cezimli heceler', ad: (i ? name(i) : 'hemze') + ' cezm', ar: D.cezm(i).text, okunus: D.cezmReadings[i], oyun: oyun('cezm', i), yeni: [] }));
    D.cezmExamples.forEach((x, p) => x.forEach((text, s) =>
      rows.push({ grup: 'Cezm örnekleri', ad: ['cezimsiz', 'cezimli', 'kelime'][s], ar: text, okunus: D.cezmExampleReadings[p][s], oyun: oyun('cezmOrnek', p + '-' + s), yeni: [] })));
    yeni.filter(s => s.kat === 'cezm').forEach(s => rows.push({ ...tekYeni(s), grup: 'Yeni kayıtların örnekleri' }));
    return rows;
  }
  function sedde() {
    const rows = [];
    D.glyphs.forEach((g, i) => { for (let h = 0; h < 3; h++)
      rows.push({ grup: 'Şeddeli heceler', ad: 'şeddeli ' + (i ? name(i) : 'hemze') + ', ' + HK[h], ar: D.sedde(i, h), okunus: D.seddeReading(i, h), oyun: oyun('sedde', i + '-' + h), yeni: [] }); });
    D.glyphs.forEach((g, i) => { for (let h = 0; h < 3; h++)
      rows.push({ grup: 'Şeddesiz heceler (şeddeli olanla karşılaştırılan)', ad: (i ? name(i) : 'hemze') + ', ' + HK[h] + ', şeddesiz', ar: D.seddesiz(i, h), okunus: D.seddesizReading(i, h), oyun: oyun('seddesiz', i + '-' + h), yeni: [] }); });
    D.seddeExamples.forEach((x, p) =>
      rows.push({ grup: 'Şedde örnek kelimeleri', ad: 'örnek kelime', ar: x.word.replace(/[{}]/g, ''), okunus: x.reading, oyun: oyun('seddeOrnek', p), yeni: [] }));
    yeni.filter(s => s.kat === 'sedde').forEach(s => rows.push({ ...tekYeni(s), grup: 'Yeni kayıtların örnekleri' }));
    return rows;
  }
  const sadeceYeni = kat => () => yeni.filter(s => s.kat === kat).map(tekYeni);
  function turkce() {
    const names = { 0: 'üstün', 1: 'esre', 2: 'ötre', cezm: 'cezm', 'tenvin-0': 'iki üstün', 'tenvin-1': 'iki esre', 'tenvin-2': 'iki ötre', sedde: 'şedde' };
    const rows = Object.keys(C.hareke || {}).map(k => ({ grup: 'İşaret adları', ad: names[k] || k, ar: '', okunus: '', oyun: oyun('hareke', k), yeni: [] }));
    ['kelimenin başında', 'kelimenin ortasında', 'kelimenin sonunda'].forEach((ad, n) =>
      rows.push({ grup: 'Harfin kelimedeki yeri', ad, ar: '', okunus: '', oyun: oyun('yer', n + 1), yeni: [] }));
    return rows;
  }
  const BOLUMLER = [
    { id: 'harekesiz', ad: 'Harekesiz', ornek: 'ا ب ت', aciklama: 'Harflerin adları ve sesleri', satirlar: harekesiz },
    { id: 'harekeli', ad: 'Harekeli', ornek: 'بَ بِ بُ', aciklama: 'Üstün, esre, ötre', satirlar: harekeli },
    { id: 'tenvin', ad: 'Tenvin', ornek: 'بًا بٍ بٌ', aciklama: 'İki üstün, iki esre, iki ötre', satirlar: tenvin },
    { id: 'cezm', ad: 'Cezm', ornek: 'بِسْ', aciklama: 'Cezimli heceler ve örnekler', satirlar: cezm },
    { id: 'sedde', ad: 'Şedde', ornek: 'بِسَّ', aciklama: 'Şeddeli ve şeddesiz heceler, örnekler', satirlar: sedde },
    { id: 'uzatma', ad: 'Uzatma (med)', ornek: 'بَا', aciklama: 'Dikey uzatma, med işareti, uzatma harfleri', satirlar: sadeceYeni('uzatma') },
    { id: 'kelime', ad: 'Kelimeler', ornek: 'قَالَ', aciklama: 'Kelimeyi harf harf kurup okuma', satirlar: sadeceYeni('kelime') },
    { id: 'mukattaa', ad: 'Mukattaa harfleri', ornek: 'يٰسٓ', aciklama: 'Yâsîn, Ayn Sîn Kâf', satirlar: sadeceYeni('mukattaa') },
    { id: 'turkce', ad: 'Türkçe sözler', ornek: '', aciklama: 'İşaret adları ve harfin yeri (kız sesi)', satirlar: turkce }
  ];
  for (const b of BOLUMLER) b.rows = b.satirlar().filter(r => r.oyun.length || r.yeni.length);

  /* ---------- states and filters ---------- */
  const onayli = r => r.oyun.some(k => onay.has(k.id));
  const yenili = r => r.yeni.some(s => secim.has(s.id));
  const FILTRELER = [
    { id: 'hepsi', ad: 'Tümü', uyar: () => true },
    { id: 'onayli', ad: '✓ Onaylananlar', uyar: onayli },
    { id: 'onaysiz', ad: '✗ Onaylanmayanlar', uyar: r => r.oyun.length && !onayli(r) },
    { id: 'yeni', ad: '⇄ Yenisi seçilenler', uyar: yenili }
  ];
  let filtre = 'hepsi';
  function sayilar(rows) {
    const oyunlu = rows.filter(r => r.oyun.length);
    return { oyun: oyunlu.length, yeni: rows.filter(r => r.yeni.length).length, onayli: oyunlu.filter(onayli).length,
      yenili: rows.filter(yenili).length, bekleyen: oyunlu.filter(r => !onayli(r) && !yenili(r)).length };
  }

  /* ---------- playing ---------- */
  let calan = null, sira = null;
  function dur() {
    if (calan) { calan.audio.pause(); calan.el.classList.remove('caliyor'); calan.el.querySelector('.oynat').textContent = '▶'; }
    calan = null;
  }
  function cal(src, el, sonra) {
    dur();
    const audio = new Audio(src);
    calan = { audio, el };
    el.classList.add('caliyor');
    el.querySelector('.oynat').textContent = '■';
    audio.onended = () => { if (calan?.audio === audio) { dur(); sonra?.(); } };
    audio.play().catch(() => { if (calan?.audio === audio) { dur(); bildir('Ses açılamadı'); } });
  }
  function sirayla(els) {
    sira = els.slice();
    const ilerle = () => {
      const el = sira?.shift();
      if (!el) { sira = null; return; }
      cal(el.dataset.src, el, () => setTimeout(() => sira && ilerle(), 300));
    };
    ilerle();
  }
  function bildir(text) {
    $('durum').textContent = text;
    clearTimeout(bildir.t);
    bildir.t = setTimeout(() => $('durum').textContent = '', 2500);
  }

  /* ---------- drawing ---------- */
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  function klip(src, ad, alt, etiket, secButon) {
    const k = el('div', 'klip');
    k.dataset.src = src;
    const b = el('button', 'oynat', '▶');
    b.type = 'button';
    b.setAttribute('aria-label', ad + ' dinle');
    b.onclick = () => { sira = null; calan?.el === k ? dur() : cal(src, k); };
    const yazi = el('div', 'klip-ad');
    const baslik = el('b', '', ad);
    if (etiket) baslik.append(el('span', 'etiket', etiket));
    yazi.append(baslik, el('small', '', alt));
    k.append(b, yazi, secButon);
    return k;
  }
  function secDugmesi(kind, on, metin, toggle) {
    const b = el('button', 'sec ' + kind);
    b.type = 'button';
    const ciz = () => { b.setAttribute('aria-pressed', on()); b.textContent = on() ? metin[1] : metin[0]; };
    b.onclick = () => { toggle(); kaydet(); ciz(); b.dispatchEvent(new CustomEvent('degisti', { bubbles: true })); };
    ciz();
    return b;
  }
  function satir(r) {
    const s = el('div', 'satir');
    const bas = el('div', 'satir-bas');
    const ar = el('span', 'ar', r.ar);
    ar.lang = 'ar';
    const ad = el('div', 'satir-ad');
    ad.append(el('b', '', r.ad));
    if (r.okunus) ad.append(el('span', '', '“' + r.okunus + '”'));
    const rozetler = el('div', 'rozetler');
    const hepsi = el('button', 'hepsi', '▶▶');
    hepsi.type = 'button';
    hepsi.title = 'Hepsini sırayla dinle';
    hepsi.setAttribute('aria-label', r.ad + ': hepsini sırayla dinle');
    hepsi.onclick = () => sirayla([...s.querySelectorAll('.klip')]);
    bas.append(ar, ad, rozetler, hepsi);
    const govde = el('div', 'satir-govde');
    const sol = el('div', 'taraf'), sag = el('div', 'taraf');
    if (!r.oyun.length) sol.append(el('div', 'bos', '— oyunda yok'));
    for (const k of r.oyun)
      sol.append(klip(k.src, k.ses, k.dosya, k.calan ? 'çalan' : '',
        secDugmesi('s-ok', () => onay.has(k.id), ['✓ Onayla', '✓ Onaylı'], () => onay.has(k.id) ? onay.delete(k.id) : onay.add(k.id))));
    if (!r.yeni.length) sag.append(el('div', 'bos', '— yeni kayıt yok'));
    for (const n of r.yeni)
      sag.append(klip('sound/ses/' + n.id + '.mp3?v=' + SES_V, n.ad + (n.okunus && n.okunus !== n.ad ? ' “' + n.okunus + '”' : ''), n.id + ' · ' + n.dosya + '. kayıt ' + dakika(n.bas), n.not || '',
        secDugmesi('s-yeni', () => secim.has(n.id), ['⇄ Bunu kullan', '⇄ Seçildi'], () => secim.has(n.id) ? secim.delete(n.id) : secim.add(n.id))));
    govde.append(sol, sag);
    s.append(bas, govde);
    const durumCiz = () => {
      s.classList.toggle('onayli', onayli(r));
      s.classList.toggle('yenili', yenili(r));
      rozetler.replaceChildren();
      if (onayli(r)) rozetler.append(el('span', 'rozet r-ok', '✓ onaylı'));
      if (yenili(r)) rozetler.append(el('span', 'rozet r-yeni', '⇄ yenisi'));
    };
    s.addEventListener('degisti', () => { durumCiz(); filtreCiz(); });
    durumCiz();
    return s;
  }

  let bolum = null;
  function kutular() {
    const ana = $('ana');
    ana.replaceChildren();
    const yol = el('p', 'yol');
    yol.innerHTML = '<b>1.</b> Bir bölüme gir; solda oyundaki sesler, sağda yeni kayıtlar. <b>2.</b> Oyundaki iyi sesleri <b>✓ Onayla</b>. ' +
      '<b>3.</b> <b>✗ Onaylanmayanlar</b> filtresinde iyi olmayanların yerine sağdan <b>⇄ Bunu kullan</b>. <b>4.</b> <b>📋 Seçimleri kopyala</b> ve bana gönder.';
    ana.append(yol);
    const grid = el('div', 'kutular');
    for (const b of BOLUMLER) {
      const n = sayilar(b.rows);
      const k = el('button', 'kutu');
      k.type = 'button';
      if (b.ornek) { const ar = el('span', 'ar', b.ornek); ar.lang = 'ar'; k.append(ar); }
      k.append(el('strong', '', b.ad), el('span', 'sayi', b.aciklama));
      k.append(el('span', 'sayi', '🎮 Oyunda ' + n.oyun + ' · ✨ Yeni ' + n.yeni));
      if (n.oyun) {
        const c = el('div', 'cubuk');
        const ok = el('i', 'c-ok'); ok.style.width = (100 * n.onayli / n.oyun) + '%';
        const yn = el('i', 'c-yeni'); yn.style.width = (100 * Math.max(0, Math.min(n.oyun - n.onayli, n.yenili)) / n.oyun) + '%';
        c.append(ok, yn);
        k.append(c);
      }
      const il = el('span', 'ilerleme');
      il.append(el('span', '', '✓ ' + n.onayli + ' onaylı'), el('span', '', '⇄ ' + n.yenili + ' yeni seçili'));
      if (n.oyun) il.append(el('span', '', '✗ ' + n.bekleyen + ' bekliyor'));
      k.append(il);
      k.onclick = () => { location.hash = b.id; };
      grid.append(k);
    }
    ana.append(grid);
  }
  function filtreCiz() {
    if (!bolum) return;
    const box = $('filtreler');
    box.replaceChildren();
    for (const f of FILTRELER) {
      const b = el('button', 'filtre');
      b.type = 'button';
      b.setAttribute('aria-pressed', f.id === filtre);
      b.append(f.ad + ' ', el('b', '', String(bolum.rows.filter(r => f.uyar(r)).length)));
      b.onclick = () => { filtre = f.id; filtreCiz(); listeCiz(); };
      box.append(b);
    }
  }
  function listeCiz() {
    dur(); sira = null;
    const ana = $('ana');
    ana.replaceChildren();
    const q = low($('ara').value.trim());
    const f = FILTRELER.find(x => x.id === filtre);
    const rows = bolum.rows.filter(r => f.uyar(r) && (!q || [r.ad, r.okunus, r.ar, r.grup, ...r.yeni.map(s => s.id)].some(t => low(t).includes(q))));
    let grup;
    for (const r of rows) {
      if (r.grup && r.grup !== grup) { grup = r.grup; ana.append(el('h2', 'grup', grup)); }
      ana.append(satir(r));
    }
    if (!rows.length) ana.append(el('p', 'yok', filtre === 'onayli' ? 'Bu bölümde henüz onaylanan ses yok.' : filtre === 'yeni' ? 'Bu bölümde henüz yenisi seçilen ses yok.' : 'Bulunamadı.'));
  }
  function goster() {
    dur(); sira = null;
    bolum = BOLUMLER.find(b => b.id === location.hash.slice(1)) || null;
    $('geri').hidden = !bolum;
    $('arac').hidden = !bolum;
    $('sutunlar').hidden = !bolum;
    $('baslik').textContent = bolum ? bolum.ad : '🔊 Sesler';
    document.title = (bolum ? bolum.ad + ' · ' : '') + 'Sesler · Elif Ba';
    if (bolum) { filtreCiz(); listeCiz(); } else kutular();
    scrollTo(0, 0);
  }

  /* ---------- copying the choices ---------- */
  $('kopyala').onclick = async () => {
    const satirlar = [];
    let a = 0, y = 0;
    for (const b of BOLUMLER) {
      const secili = b.rows.filter(r => onayli(r) || yenili(r));
      if (!secili.length) continue;
      satirlar.push('', b.ad + ':');
      for (const r of secili) {
        const parca = [];
        for (const k of r.oyun) if (onay.has(k.id)) { parca.push('✓ ' + k.ses.toLocaleLowerCase('tr') + ' (' + k.dosya + ')'); a++; }
        for (const n of r.yeni) if (secim.has(n.id)) { parca.push('⇄ ' + n.id); y++; }
        satirlar.push('- ' + r.ad + (r.ar ? ' (' + r.ar + ')' : '') + ': ' + parca.join(', '));
      }
    }
    if (!a && !y) return bildir('Önce ✓ Onayla ya da ⇄ Bunu kullan ile seçim yap.');
    const metin = 'Elif Ba sesleri: ' + a + ' onay, ' + y + ' yeni seçim\n' + satirlar.join('\n');
    try {
      await navigator.clipboard.writeText(metin);
      bildir('✓ Kopyalandı: ' + a + ' onay, ' + y + ' yeni seçim');
    } catch {
      const box = $('kopya');
      box.hidden = false;
      box.value = metin;
      box.select();
    }
  };
  $('geri').onclick = () => { location.hash = ''; };
  $('ara').oninput = () => listeCiz();
  addEventListener('hashchange', goster);
  goster();
})();
