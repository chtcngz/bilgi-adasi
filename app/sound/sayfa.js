// Sesler (sound/index.html): the Elif Ba clips the owner keeps, and the readings that still need a voice.
//
// Three tabs: 📂 Bölümler (the sections), ✓ Seçilenler (every reading with a chosen clip, to listen to) and
// 🎙 Seslendirilecekler (the readings with none: they get new recordings). Only Harekesiz, Harekeli and Tenvin have rows;
// the other sections (Cezm, Şedde, Uzatma, Kelimeler, Mukattaa, Türkçe sözler) are only titles until they are made again.
// In a section every reading is a row: on the left the girl's clip the game plays now (window.elifRecordings.cocuk,
// assets/audio/elif-ba/kayitlar.js, with elifData from islands/elif-ba/data.js for the writing), on the right the new clips
// cut from the owner's recordings (window.sesListesi, sound/liste.js) of the same letter and hareke.
// The man's clips (Diyanet, elifRecordings.harf …) stay in kayitlar.js and in oyun() below, but are not shown (ERKEK_SESI).
// Choices: those the owner sent are window.sesSecimleri (sound/secimler.js), shown as "Kayıtlı" and not changed here;
// a new one stays in this browser (localStorage): a game clip approved (✓ Onayla) is 'cocuk:hece:1-0' in
// bilgi-adasi-ses-onaylar, a new clip chosen (⇄ Bunu kullan) is its id in bilgi-adasi-ses-secimleri, and
// "Seçimleri kopyala" copies the ones not saved yet.
(() => {
  const $ = id => document.getElementById(id);
  const ONAY = 'bilgi-adasi-ses-onaylar', SECIM = 'bilgi-adasi-ses-secimleri';
  // bump with every new cut of the new clips (tools/ses_kes.py), so no browser plays old ones from its cache
  const SES_V = 2;
  // the man's clips are kept for later; true shows them again beside the girl's
  const ERKEK_SESI = false;
  const G = window.elifRecordings || {};
  const C = G.cocuk || {};
  const D = elifData;     // a top-level const of data.js, not a window property
  const yeni = [...(window.sesListesi?.sesler || []), ...(window.sesAdaylari || [])];
  const KAYIT = window.sesSecimleri || { onay: [], yeni: [] };
  const kayitliOnay = new Set(KAYIT.onay), kayitliYeni = new Set(KAYIT.yeni);
  const low = t => String(t ?? '').toLocaleLowerCase('tr');
  const load = key => { try { return new Set(JSON.parse(localStorage.getItem(key)) || []); } catch { return new Set(); } };
  const onay = load(ONAY), secim = load(SECIM);
  const kaydet = () => { try { localStorage.setItem(ONAY, JSON.stringify([...onay])); localStorage.setItem(SECIM, JSON.stringify([...secim])); } catch {} };
  const onaylandi = id => kayitliOnay.has(id) || onay.has(id);
  const secildi = id => kayitliYeni.has(id) || secim.has(id);
  const dakika = s => Math.floor(s / 60) + ':' + (s % 60).toFixed(1).padStart(4, '0');

  /* ---------- the rows ---------- */
  const name = i => low(D.names[i]);
  const HK = ['üstün', 'esre', 'ötre'], TK = ['iki üstün', 'iki esre', 'iki ötre'];
  const file = src => src.replace(/^assets\/audio\/elif-ba\//, '').replace(/\.mp3.*$/, '');
  // the game's clips of a reading: the girl's (the one the game plays when she has it) and, when ERKEK_SESI, the man's
  function oyun(kind, key) {
    const out = [];
    const girl = C[kind]?.[key], man = G[kind]?.[key];
    if (girl) out.push({ id: 'cocuk:' + kind + ':' + key, ses: 'Kız sesi', src: girl, calan: true, dosya: 'cocuk/' + file(girl).replace(/^cocuk\//, '') });
    if (man && ERKEK_SESI) out.push({ id: 'kayit:' + kind + ':' + key, ses: 'Erkek sesi', src: man, calan: !girl, dosya: file(man) });
    out.bos = girl ? '' : man ? 'kız sesi yok' : 'oyunda yok';
    return out;
  }
  const yeniler = (kat, harf, h) => yeni.filter(s => s.kat === kat && s.harf === harf && (h === undefined || s.h === h));
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
        rows.push({ grup: D.names[i], h, ad: HK[h] + ' ' + name(i), ar: D.syllable(i, h), okunus: D.readings[i][h], oyun: oyun('hece', i + '-' + h), yeni: yeniler('harekeli', i, h) });
      if (i === 0) for (let h = 0; h < 3; h++)
        rows.push({ grup: 'Hemze', h, ad: HK[h] + ' hemze', ar: HEMZE[h], okunus: D.readings[0][h], oyun: oyun('hece', 'hemze-' + h), yeni: yeniler('harekeli', 'hemze', h) });
    });
    return rows;
  }
  function tenvin() {
    const rows = [];
    D.glyphs.forEach((g, i) => {
      for (let h = 0; h < 3; h++)
        rows.push({ grup: D.names[i], h, ad: TK[h] + ' ' + name(i), ar: D.tenvin(i, h), okunus: D.tenvinReading(i, h), oyun: oyun('tenvin', i + '-' + h), yeni: yeniler('tenvin', i, h) });
      if (i === 0) for (let h = 0; h < 3; h++)
        rows.push({ grup: 'Hemze', h, ad: TK[h] + ' hemze', ar: HEMZE_T[h], okunus: D.tenvinReading(0, h), oyun: oyun('tenvin', 'hemze-' + h), yeni: yeniler('tenvin', 'hemze', h) });
    });
    D.tenvinExamples.forEach((x, p) =>
      rows.push({ grup: 'Tenvin örnek kelimeleri', kume: 'Tenvin örnek kelimeleri', ad: 'örnek kelime', ar: x.word, okunus: x.reading, oyun: oyun('tenvinOrnek', p), yeni: yeniler('ornek', p) }));
    return rows;
  }
  // the sections; those without rows are made again later and are only titles for now
  const BOLUMLER = [
    { id: 'harekesiz', ad: 'Harekesiz', ornek: 'ا ب ت', aciklama: 'Harflerin adları ve sesleri', satirlar: harekesiz },
    { id: 'harekeli', ad: 'Harekeli', ornek: 'بَ بِ بُ', aciklama: 'Üstün, esre, ötre', satirlar: harekeli, sutun: HK },
    { id: 'tenvin', ad: 'Tenvin', ornek: 'بًا بٍ بٌ', aciklama: 'İki üstün, iki esre, iki ötre', satirlar: tenvin, sutun: TK },
    { id: 'cezm', ad: 'Cezm', ornek: 'بِسْ' },
    { id: 'sedde', ad: 'Şedde', ornek: 'بِسَّ' },
    { id: 'uzatma', ad: 'Uzatma (med)', ornek: 'بَا' },
    { id: 'kelime', ad: 'Kelimeler', ornek: 'قَالَ' },
    { id: 'mukattaa', ad: 'Mukattaa harfleri', ornek: 'يٰسٓ' },
    { id: 'turkce', ad: 'Türkçe sözler', ornek: '' }
  ];
  for (const b of BOLUMLER) b.rows = b.satirlar ? b.satirlar() : [];
  const DOLU = BOLUMLER.filter(b => b.rows.length);

  /* ---------- states ---------- */
  const onayli = r => r.oyun.some(k => onaylandi(k.id));
  const yenili = r => r.yeni.some(s => secildi(s.id));
  const secili = r => onayli(r) || yenili(r);
  const FILTRELER = [
    { id: 'hepsi', ad: 'Tümü', uyar: () => true },
    { id: 'secili', ad: '✓ Seçilenler', uyar: secili },
    { id: 'bekleyen', ad: '🎙 Seslendirilecekler', uyar: r => !secili(r) }
  ];
  let filtre = 'hepsi';
  const say = (rows, f) => rows.filter(f).length;
  const tumu = () => DOLU.flatMap(b => b.rows);

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
  const arabic = (text, cls = 'ar') => { const e = el('span', cls, text); e.lang = 'ar'; return e; };
  const yeniSrc = n => 'sound/ses/' + n.id + '.mp3?v=' + SES_V;
  function hepsiDugmesi(etiket, kapsam) {
    const b = el('button', 'hepsi', '▶▶');
    b.type = 'button';
    b.title = 'Hepsini sırayla dinle';
    b.setAttribute('aria-label', etiket + ': hepsini sırayla dinle');
    b.onclick = () => sirayla([...kapsam().querySelectorAll('[data-src]')]);
    return b;
  }
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
  // ✓ Onayla / ⇄ Bunu kullan; a choice the owner sent (secimler.js) is "Kayıtlı" and cannot be taken back here
  function secDugmesi(kind, kayitli, on, metin, toggle) {
    const b = el('button', 'sec ' + kind);
    b.type = 'button';
    if (kayitli) {
      b.disabled = true;
      b.setAttribute('aria-pressed', 'true');
      b.textContent = metin[2];
      b.title = 'Kayıtlı seçim (sound/secimler.js)';
      return b;
    }
    const ciz = () => { b.setAttribute('aria-pressed', on()); b.textContent = on() ? metin[1] : metin[0]; };
    b.onclick = () => { toggle(); kaydet(); ciz(); b.dispatchEvent(new CustomEvent('degisti', { bubbles: true })); };
    ciz();
    return b;
  }
  function satir(r) {
    const s = el('div', 'satir');
    const bas = el('div', 'satir-bas');
    const ad = el('div', 'satir-ad');
    ad.append(el('b', '', r.ad));
    if (r.okunus) ad.append(el('span', '', '“' + r.okunus + '”'));
    const rozetler = el('div', 'rozetler');
    bas.append(arabic(r.ar), ad, rozetler, hepsiDugmesi(r.ad, () => s));
    const govde = el('div', 'satir-govde');
    const sol = el('div', 'taraf'), sag = el('div', 'taraf');
    if (!r.oyun.length) sol.append(el('div', 'bos', '— ' + r.oyun.bos));
    for (const k of r.oyun)
      sol.append(klip(k.src, k.ses, k.dosya, k.calan ? 'çalan' : '',
        secDugmesi('s-ok', kayitliOnay.has(k.id), () => onay.has(k.id), ['✓ Onayla', '✓ Onaylı', '✓ Kayıtlı'], () => onay.has(k.id) ? onay.delete(k.id) : onay.add(k.id))));
    if (!r.yeni.length) sag.append(el('div', 'bos', '— yeni kayıt yok'));
    for (const n of r.yeni)
      sag.append(klip(yeniSrc(n), n.ad + (n.okunus && n.okunus !== n.ad ? ' “' + n.okunus + '”' : ''), n.kaynak || n.id + ' · ' + n.dosya + '. kayıt ' + dakika(n.bas), n.not || '',
        secDugmesi('s-yeni', kayitliYeni.has(n.id), () => secim.has(n.id), ['⇄ Bunu kullan', '⇄ Seçildi', '⇄ Kayıtlı'], () => secim.has(n.id) ? secim.delete(n.id) : secim.add(n.id))));
    govde.append(sol, sag);
    s.append(bas, govde);
    const durumCiz = () => {
      s.classList.toggle('onayli', onayli(r));
      s.classList.toggle('yenili', yenili(r));
      s.classList.toggle('bekliyor', !secili(r));
      rozetler.replaceChildren();
      if (onayli(r)) rozetler.append(el('span', 'rozet r-ok', '✓ onaylı'));
      if (yenili(r)) rozetler.append(el('span', 'rozet r-yeni', '⇄ yenisi'));
      if (!secili(r)) rozetler.append(el('span', 'rozet r-bekle', '🎙 seslendirilecek'));
    };
    s.addEventListener('degisti', () => { durumCiz(); filtreCiz(); sekmeCiz(); });
    durumCiz();
    return s;
  }
  // a chosen reading as a small card that plays its clip: the new clip when one is chosen, else the approved game clip
  function kart(r) {
    const n = r.yeni.find(x => secildi(x.id)), k = r.oyun.find(x => onaylandi(x.id));
    const src = n ? yeniSrc(n) : k.src;
    const b = el('button', 'kart');
    b.type = 'button';
    b.dataset.src = src;
    b.title = r.ad + (n ? ' · yeni kayıt (' + n.id + ')' : ' · kız sesi (' + k.dosya + ')');
    b.setAttribute('aria-label', r.ad + ' dinle');
    const yazi = el('span', 'kart-yazi');
    yazi.append(arabic(r.ar), el('small', '', r.okunus || r.ad));
    b.append(el('span', 'oynat', '▶'), yazi);
    if (n) b.append(el('span', 'etiket', 'yeni'));
    b.onclick = () => { sira = null; calan?.el === b ? dur() : cal(src, b); };
    return b;
  }

  /* ---------- the tabs ---------- */
  const SEKMELER = [
    { id: '', ikon: '📂', ad: 'Bölümler' },
    { id: 'secilenler', ikon: '✓', ad: 'Seçilenler', sayi: () => say(tumu(), secili) },
    { id: 'seslendirilecek', ikon: '🎙', ad: 'Seslendirilecekler', sayi: () => say(tumu(), r => !secili(r)) }
  ];
  let sekme = '', bolum = null;
  function sekmeCiz() {
    const box = $('sekmeler');
    box.replaceChildren();
    for (const t of SEKMELER) {
      const b = el('button', 'sekme');
      b.type = 'button';
      b.append(el('span', 'ikon', t.ikon + ' '), t.ad);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', t.id === sekme);
      if (t.sayi) b.append(' ', el('b', '', String(t.sayi())));
      b.onclick = () => { location.hash = t.id; };
      box.append(b);
    }
  }

  function bolumler() {
    const ana = $('ana');
    const yol = el('p', 'yol');
    yol.innerHTML = '<b>✓ Seçilenler:</b> gönderdiğin seçimler (kayıtlı), dinleyebilirsin. ' +
      '<b>🎙 Seslendirilecekler:</b> uygun sesi olmayanlar; bunlara yeni seslendirme yapılacak. ' +
      'Bir bölüme girince solda oyunda çalan kız sesi, sağda yeni kayıtlar.';
    ana.append(yol);
    const grid = el('div', 'kutular');
    for (const b of BOLUMLER) {
      const dolu = b.rows.length > 0;
      const k = el(dolu ? 'button' : 'div', 'kutu' + (dolu ? '' : ' bos-kutu'));
      if (b.ornek) k.append(arabic(b.ornek));
      k.append(el('strong', '', b.ad));
      if (dolu) {
        const n = say(b.rows, secili);
        k.type = 'button';
        k.append(el('span', 'sayi', b.aciklama));
        const c = el('div', 'cubuk');
        const ok = el('i', 'c-ok'); ok.style.width = (100 * n / b.rows.length) + '%';
        c.append(ok);
        const il = el('span', 'ilerleme');
        il.append(el('span', '', '✓ ' + n + ' seçili'), el('span', '', '🎙 ' + (b.rows.length - n) + ' seslendirilecek'));
        k.append(c, il);
        k.onclick = () => { location.hash = b.id; };
      } else k.append(el('span', 'sayi', '🔇 Ses dosyası örneği yok'));
      grid.append(k);
    }
    ana.append(grid);
  }

  // ✓ Seçilenler: a section's letters as cards; harekeli and tenvin one line a letter, a column a hareke
  function secilenler() {
    const ana = $('ana');
    for (const b of DOLU) {
      const rows = b.rows.filter(secili);
      if (!rows.length) continue;
      const blok = el('section', 'blok');
      const h = el('h2', 'grup');
      h.append(b.ad + ' ', el('span', 'sayi', rows.length + ' / ' + b.rows.length), hepsiDugmesi(b.ad, () => blok));
      blok.append(h);
      const harfli = rows.filter(r => r.h !== undefined && !r.kume), diger = rows.filter(r => r.h === undefined || r.kume);
      if (harfli.length) {
        const t = el('div', 'harfler');
        t.append(el('span', 'harfler-bas'), ...b.sutun.map(s => el('span', 'harfler-bas', s)));
        const gruplar = [...new Set(harfli.map(r => r.grup))];
        for (const g of gruplar) {
          t.append(el('span', 'harf-adi', g));
          for (let hh = 0; hh < 3; hh++) {
            const r = harfli.find(x => x.grup === g && x.h === hh);
            t.append(r ? kart(r) : el('span', 'kart-yok'));
          }
        }
        blok.append(t);
      }
      let kume, grid;
      for (const r of diger) {
        if (!grid || r.kume !== kume) {
          kume = r.kume;
          if (kume) blok.append(el('h3', 'alt-grup', kume));
          grid = el('div', 'kartlar');
          blok.append(grid);
        }
        grid.append(kart(r));
      }
      ana.append(blok);
    }
    if (!ana.children.length) ana.append(el('p', 'yok', 'Henüz seçilen ses yok.'));
  }

  // 🎙 Seslendirilecekler: every reading without a chosen clip, as a row with what the game plays now
  function seslendirilecekler() {
    const ana = $('ana');
    const rowsAll = DOLU.map(b => [b, b.rows.filter(r => !secili(r))]).filter(([, rows]) => rows.length);
    if (!rowsAll.length) return ana.append(el('p', 'yok', 'Seslendirilecek ses kalmadı.'));
    ana.append(el('p', 'yol', 'Yeni örneği sağdan dinle. İki kaydı art arda dinlemek için satırdaki ▶▶ düğmesini kullan.'));
    for (const [b, rows] of rowsAll) {
      const h = el('h2', 'grup');
      h.append(b.ad + ' ', el('span', 'sayi', String(rows.length)));
      ana.append(h);
      let kume;
      for (const r of rows) {
        if (r.kume && r.kume !== kume) ana.append(el('h3', 'alt-grup', r.kume));
        kume = r.kume;
        ana.append(satir(r));
      }
    }
  }

  function filtreCiz() {
    if (!bolum?.rows.length) return;
    const box = $('filtreler');
    box.replaceChildren();
    for (const f of FILTRELER) {
      const b = el('button', 'filtre');
      b.type = 'button';
      b.setAttribute('aria-pressed', f.id === filtre);
      b.append(f.ad + ' ', el('b', '', String(say(bolum.rows, f.uyar))));
      b.onclick = () => { filtre = f.id; filtreCiz(); listeCiz(); };
      box.append(b);
    }
  }
  function listeCiz() {
    dur(); sira = null;
    const ana = $('ana');
    ana.replaceChildren();
    if (!bolum.rows.length) return ana.append(el('p', 'yok', '🔇 Bu bölümün ses dosyası örneği yok.'));
    const q = low($('ara').value.trim());
    const f = FILTRELER.find(x => x.id === filtre);
    const rows = bolum.rows.filter(r => f.uyar(r) && (!q || [r.ad, r.okunus, r.ar, r.grup, ...r.yeni.map(s => s.id)].some(t => low(t).includes(q))));
    let grup;
    for (const r of rows) {
      if (r.grup && r.grup !== grup) { grup = r.grup; ana.append(el('h2', 'grup', grup)); }
      ana.append(satir(r));
    }
    if (!rows.length) ana.append(el('p', 'yok', filtre === 'secili' ? 'Bu bölümde henüz seçilen ses yok.' : filtre === 'bekleyen' ? 'Bu bölümde seslendirilecek ses kalmadı.' : 'Bulunamadı.'));
  }
  function goster() {
    dur(); sira = null;
    const hash = location.hash.slice(1);
    bolum = BOLUMLER.find(b => b.id === hash) || null;
    sekme = bolum ? '' : SEKMELER.some(t => t.id === hash) ? hash : '';
    const t = SEKMELER.find(x => x.id === sekme);
    $('arac').hidden = !bolum?.rows.length;
    $('sutunlar').hidden = !(bolum?.rows.length || sekme === 'seslendirilecek');
    $('baslik').textContent = bolum ? bolum.ad : sekme ? t.ikon + ' ' + t.ad : '🔊 Sesler';
    document.title = (bolum ? bolum.ad + ' · ' : sekme ? t.ad + ' · ' : '') + 'Sesler · Elif Ba';
    sekmeCiz();
    $('ana').replaceChildren();
    if (bolum) { filtreCiz(); listeCiz(); }
    else if (sekme === 'secilenler') secilenler();
    else if (sekme === 'seslendirilecek') seslendirilecekler();
    else bolumler();
    scrollTo(0, 0);
  }

  /* ---------- copying the choices not saved yet ---------- */
  $('kopyala').onclick = async () => {
    const satirlar = [];
    let a = 0, y = 0;
    for (const b of DOLU) {
      const parcalar = [];
      for (const r of b.rows) {
        const parca = [];
        for (const k of r.oyun) if (onay.has(k.id) && !kayitliOnay.has(k.id)) { parca.push('✓ ' + k.ses.toLocaleLowerCase('tr') + ' (' + k.dosya + ')'); a++; }
        for (const n of r.yeni) if (secim.has(n.id) && !kayitliYeni.has(n.id)) { parca.push('⇄ ' + n.id); y++; }
        if (parca.length) parcalar.push('- ' + r.ad + (r.ar ? ' (' + r.ar + ')' : '') + ': ' + parca.join(', '));
      }
      if (parcalar.length) satirlar.push('', b.ad + ':', ...parcalar);
    }
    if (!a && !y) return bildir('Kayıtlı seçimlerin dışında yeni seçim yok.');
    const metin = 'Elif Ba sesleri: ' + a + ' onay, ' + y + ' yeni seçim (kayıtlı ' + (kayitliOnay.size + kayitliYeni.size) + ' seçime ek)\n' + satirlar.join('\n');
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
  $('ara').oninput = () => listeCiz();
  addEventListener('hashchange', goster);
  goster();
})();
