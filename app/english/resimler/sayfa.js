// Resimler · English (english/resimler/index.html): the owner chooses the pictures of English for Kids' words.
//
// Words: every island's kelimeler.js (window.englishAdalari), shown island › station › group › word. A word has up to six
// pictures (MAX), the first one its main picture; a picture is a token as the game writes it: an emoji, a drawing
// [[name]] (core/js/kelime-resimleri.js, cizimler.js, resimler.js, the island's resimler.js) or an upload [[u-<id>]].
// Pool (🖼️ Tüm resimler): every drawing, the emoji of İngilizce Koyu's questions and a few more, and the uploads, grouped by
// where they are used (this word, the uploads, every English station, every unit of İngilizce Koyu, the rest), with a search
// over the picture's name and the words it is used for.
// Cloud (Firestore, REST): resimler/secimler { json: {"english-1/selam/hello": ["[[y-hello-3]]", "👋"], …} } and
// resimler/yuklenen/liste/{id} { ad, veri (a data: URL of the picture, 1024 px at most), zaman }. Anyone may read them;
// writing needs the admin's account (the Firestore rule: match /resimler/{doc=**} { allow read: if true; allow write: if isAdmin(); }).
// Sign-in is the admin page's (admin/admin.js): Google Identity Services or Firebase e-mail and password.
(() => {
  const $ = id => document.getElementById(id);
  const MAX = 6;
  const KEY = bulutAyar.apiKey;
  const DOCS = 'https://firestore.googleapis.com/v1/projects/' + bulutAyar.projectId + '/databases/(default)/documents/';
  const SESSION = 'bilgi-adasi-yonetici-oturum';
  const KURAL = 'match /resimler/{doc=**} {\n  allow read: if true;\n  allow write: if isAdmin();\n}';
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const low = t => String(t).toLocaleLowerCase('tr');
  const adalar = window.englishAdalari || [];

  let secim = {};                 // word key → [token, …]
  const yuklenen = new Map();     // upload id → { ad, veri }
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION)); } catch {}
  let okunabilir = true;          // false when the cloud refused to read (the rule is missing)

  /* ---------- status ---------- */
  function durum(text, kind = '') {
    const box = $('rs-durum');
    box.textContent = text;
    box.dataset.kind = kind;
  }
  function uyari(html) {
    $('rs-uyari').innerHTML = html;
    $('rs-uyari').hidden = !html;
  }

  /* ---------- sign-in (as admin/admin.js) ---------- */
  const keep = () => { try { sessionStorage.setItem(SESSION, JSON.stringify(session)); } catch {} };
  async function account(method, body) {
    const reply = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + method + '?key=' + KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, returnSecureToken: true }) });
    const data = await reply.json().catch(() => ({}));
    if (!reply.ok) {
      const code = String(data.error?.message || reply.status).split(' ')[0];
      throw new Error(/PASSWORD|CREDENTIALS|EMAIL_NOT_FOUND/.test(code) ? 'E-posta ya da şifre yanlış.' : 'Giriş yapılamadı (' + code + ').');
    }
    if (!data.idToken) throw new Error('Bu Google hesabı Firebase’deki hesaba bağlanamadı.');
    session = { email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, bitis: Date.now() + Number(data.expiresIn) * 1000 };
    keep();
  }
  async function token() {
    if (!session) return null;
    if (session.bitis > Date.now() + 60000) return session.idToken;
    const reply = await fetch('https://securetoken.googleapis.com/v1/token?key=' + KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(session.refreshToken) });
    if (!reply.ok) { cikis(false); throw new Error('Oturumun süresi doldu, yeniden gir.'); }
    const data = await reply.json();
    Object.assign(session, { idToken: data.id_token, refreshToken: data.refresh_token, bitis: Date.now() + Number(data.expires_in) * 1000 });
    keep();
    return session.idToken;
  }
  function cikis(reload = true) {
    session = null;
    try { sessionStorage.removeItem(SESSION); } catch {}
    try { google.accounts.id.disableAutoSelect(); } catch {}
    if (reload) location.reload(); else girisCiz();
  }
  function girisCiz() {
    const box = $('rs-giris');
    box.innerHTML = '';
    if (session) {
      box.innerHTML = '<span>👤 ' + esc(session.email) + '</span>';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rs-btn kucuk';
      b.textContent = 'Çıkış';
      b.onclick = () => cikis();
      box.append(b);
      $('rs-kilit').hidden = true;
    } else {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rs-btn ana kucuk';
      b.textContent = '🔒 Gir';
      b.onclick = () => { $('rs-kilit').hidden = false; $('rs-kilit').scrollIntoView({ block: 'start' }); };
      box.append(b);
    }
  }
  const girdi = () => { girisCiz(); $('rs-kilit-not').textContent = ''; durum('✓ Girildi: değişiklikler buluta kaydedilir', 'iyi'); };
  const girisHata = error => { $('rs-kilit-not').textContent = '✗ ' + (navigator.onLine === false ? 'İnternet bağlantısı yok.' : error.message); };
  async function googleTeklif() {
    const clientId = bulutAyar.googleClientId;
    if (!clientId) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.append(s);
    }).catch(() => null);
    if (!window.google?.accounts?.id) return;
    google.accounts.id.initialize({
      client_id: clientId, auto_select: true, cancel_on_tap_outside: false, use_fedcm_for_prompt: true,
      callback: async reply => {
        $('rs-kilit-not').textContent = 'Google ile giriliyor…';
        try {
          await account('signInWithIdp', { postBody: 'id_token=' + encodeURIComponent(reply.credential) + '&providerId=google.com', requestUri: location.origin, returnIdpCredential: true });
          girdi();
        } catch (error) { girisHata(error); }
      }
    });
    google.accounts.id.renderButton($('rs-google'), { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'tr' });
    if (!session) google.accounts.id.prompt();
  }
  $('rs-form').onsubmit = async e => {
    e.preventDefault();
    try { await account('signInWithPassword', { email: $('rs-email').value.trim(), password: $('rs-sifre').value }); girdi(); }
    catch (error) { girisHata(error); }
  };
  // A change needs the admin's account: without it the sign-in box opens.
  function yazabilir() {
    if (session) return true;
    $('rs-kilit').hidden = false;
    $('rs-kilit-not').textContent = 'Değişiklik yapmak için önce gir.';
    $('rs-kilit').scrollIntoView({ block: 'start', behavior: 'smooth' });
    return false;
  }

  /* ---------- cloud ---------- */
  async function istek(path, options = {}) {
    const t = await token().catch(() => null);
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(t ? { Authorization: 'Bearer ' + t } : {}) };
    const url = DOCS + path + (t ? '' : (path.includes('?') ? '&' : '?') + 'key=' + KEY);
    return fetch(url, { ...options, headers });
  }
  function kuralUyarisi(yaz) {
    uyari('<b>⚠️ Bulut ' + (yaz ? 'yazmaya' : 'okumaya') + ' izin vermedi.</b> Firebase konsolunda (Firestore Database → Rules) kurallara şu blok eklenmeli' +
      (yaz ? ', ve giren hesap yönetici (isAdmin) olmalı' : '') + ':<pre>' + esc(KURAL) + '</pre>');
  }
  async function yukle() {
    durum('☁️ Buluttan okunuyor…');
    try {
      const r = await istek('resimler/secimler');
      if (r.status === 403) { okunabilir = false; kuralUyarisi(false); }
      else if (r.ok) {
        const data = await r.json();
        try { secim = JSON.parse(data.fields?.json?.stringValue || '{}') || {}; } catch { secim = {}; }
      } else if (r.status !== 404) throw new Error(r.status);
      if (okunabilir) {
        let page = '';
        do {
          const l = await istek('resimler/yuklenen/liste?pageSize=100' + (page ? '&pageToken=' + encodeURIComponent(page) : ''));
          if (!l.ok) break;
          const d = await l.json();
          for (const doc of d.documents || []) {
            const f = doc.fields || {};
            yuklenen.set(doc.name.split('/').pop(), { ad: f.ad?.stringValue || 'resim', veri: f.veri?.stringValue || '' });
          }
          page = d.nextPageToken || '';
        } while (page);
      }
      durum(okunabilir ? '☁️ Buluttan okundu' : '✗ Bulut okunamadı', okunabilir ? 'iyi' : 'kotu');
    } catch {
      durum('✗ Buluttan okunamadı' + (navigator.onLine === false ? ' (internet yok)' : ''), 'kotu');
    }
  }
  let saveTimer = 0;
  function kaydet() {
    clearTimeout(saveTimer);
    durum('… kaydedilecek');
    saveTimer = setTimeout(async () => {
      durum('☁️ Kaydediliyor…');
      try {
        const r = await istek('resimler/secimler', { method: 'PATCH', body: JSON.stringify({ fields: {
          json: { stringValue: JSON.stringify(secim) }, degisti: { timestampValue: new Date().toISOString() } } }) });
        if (r.status === 403) { kuralUyarisi(true); throw new Error('izin'); }
        if (!r.ok) throw new Error(r.status);
        durum('✓ Kaydedildi ' + new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' }), 'iyi');
      } catch (error) {
        durum('✗ Kaydedilemedi' + (error.message === 'izin' ? ' (izin yok)' : ''), 'kotu');
      }
    }, 500);
  }

  /* ---------- pictures ---------- */
  const seg = new Intl.Segmenter();
  const emojiler = text => [...seg.segment(String(text || '').replace(/\[\[[a-z0-9-]+\]\]/g, ' '))].map(s => s.segment).filter(g => /\p{Extended_Pictographic}/u.test(g));
  const tokenler = pic => [...(String(pic || '').match(/\[\[[a-z0-9-]+\]\]/g) || []), ...emojiler(pic)];
  const adi = tok => tok.startsWith('[[u-') ? (yuklenen.get(tok.slice(4, -2))?.ad || 'yüklenen') : tok.startsWith('[[') ? tok.slice(2, -2) : tok;
  function resim(tok) {
    if (tok.startsWith('[[u-')) {
      const u = yuklenen.get(tok.slice(4, -2));
      return u ? '<img src="' + esc(u.veri) + '" alt="">' : '<span class="rs-yok">?</span>';
    }
    if (tok.startsWith('[[')) {
      const html = kelimeResimleri.kelimeResmi(tok);
      const webp = html.match(/href="([^"]+\.webp[^"]*)"/);
      return webp ? '<img loading="lazy" src="' + esc(webp[1]) + '" alt="">' : html || '<span class="rs-yok">?</span>';
    }
    return '<span class="rs-emo">' + esc(tok) + '</span>';
  }

  // where every picture is used: token → [label]; and the groups of the pool in their order
  const ing2 = typeof ingilizce2Sorular !== 'undefined' ? ingilizce2Sorular : [];
  const EK = ['👋', '🙋', '🤝', '🌅', '☀️', '🌤️', '🌆', '🌇', '🌙', '🌃', '😊', '🙂', '😀', '😄', '😢', '😔', '🙏', '👍', '👎', '✅', '❌', '🤗', '💖',
    '👧', '👦', '🧒', '👩', '👨', '👫', '🧑‍🤝‍🧑', '🏫', '🎂', '🎈', '🎁'];
  function kullanim() {
    const yer = new Map();
    const ekle = (tok, label) => { if (!yer.has(tok)) yer.set(tok, []); yer.get(tok).push(label); };
    for (const ada of adalar) for (const st of ada.istasyonlar) for (const g of st.gruplar) for (const [en, tr] of g.kelimeler)
      for (const tok of secim[anahtar(ada, st, en)] || []) ekle(tok, 'English · ' + st.ad + ': ' + en + ' (' + tr + ')');
    for (const stop of ing2) for (const q of stop.sorular) if (q.k?.[2]) for (const tok of tokenler(q.k[2])) ekle(tok, 'İngilizce Koyu · ' + stop.ad + ': ' + q.k[0] + ' (' + q.k[1] + ')');
    return yer;
  }
  function hepsi() {
    const set = new Set();
    for (const id of yuklenen.keys()) set.add('[[u-' + id + ']]');
    for (const name of kelimeResimleri.adlar()) set.add('[[' + name + ']]');
    for (const stop of ing2) for (const q of stop.sorular) for (const t of [q.k?.[2], q.s, ...(q.a || [])]) for (const e of emojiler(t)) set.add(e);
    for (const e of EK) set.add(e);
    return [...set];
  }

  /* ---------- the words ---------- */
  const anahtar = (ada, st, en) => ada.id + '/' + st.id + '/' + en;
  let acik = null;   // { ada, st, en, tr } of the word the pool was opened for
  function cizAna() {
    const q = low($('rs-kelime-ara').value.trim());
    const main = $('rs-ana');
    main.innerHTML = '';
    if (!adalar.length) { main.innerHTML = '<p class="rs-not">Kelime listesi yok.</p>'; return; }
    for (const ada of adalar) {
      const sec = document.createElement('section');
      sec.className = 'rs-ada';
      sec.innerHTML = '<h2><span aria-hidden="true">' + esc(ada.simge) + '</span> ' + esc(ada.ad) + ' <small>' + esc(ada.bolum || '') + '</small></h2>';
      for (const st of ada.istasyonlar) {
        const words = st.gruplar.flatMap(g => g.kelimeler);
        const done = words.filter(([en]) => (secim[anahtar(ada, st, en)] || []).length).length;
        const box = document.createElement('details');
        box.className = 'rs-istasyon';
        box.open = words.length > 0;
        box.innerHTML = '<summary><span aria-hidden="true">' + esc(st.simge) + '</span> ' + esc(st.ad) + ' <small>' + esc(st.baslik || '') + '</small>' +
          '<em>' + (words.length ? done + ' / ' + words.length + ' kelimenin resmi var' : 'kelime listesi henüz yok') + '</em></summary>';
        for (const g of st.gruplar) {
          const rows = g.kelimeler.filter(([en, tr]) => !q || low(en).includes(q) || low(tr).includes(q));
          if (!rows.length) continue;
          const h = document.createElement('h3');
          h.textContent = g.ad;
          box.append(h);
          for (const [en, tr] of rows) box.append(satir(ada, st, en, tr));
        }
        sec.append(box);
      }
      main.append(sec);
    }
  }
  function satir(ada, st, en, tr) {
    const key = anahtar(ada, st, en);
    const list = secim[key] || [];
    const row = document.createElement('div');
    row.className = 'rs-satir';
    row.innerHTML = '<div class="rs-kelime"><b>' + esc(en) + '</b><span>' + esc(tr) + '</span><small>' + list.length + ' / ' + MAX + '</small></div><div class="rs-yuvalar"></div><div class="rs-satir-arac"></div>';
    const slots = row.querySelector('.rs-yuvalar');
    for (let i = 0; i < MAX; i++) {
      const tok = list[i];
      const slot = document.createElement('div');
      slot.className = 'rs-yuva' + (tok ? ' dolu' : '') + (i === 0 && tok ? ' ana' : '');
      if (tok) {
        slot.innerHTML = '<div class="rs-resim" title="' + esc(adi(tok)) + '">' + resim(tok) + '</div>' + (i === 0 ? '<i class="rs-ana-etiket">ana</i>' : '') +
          '<div class="rs-yuva-arac"><button type="button" data-a="sol" aria-label="Sola al" ' + (i === 0 ? 'disabled' : '') + '>◀</button>' +
          '<button type="button" data-a="sil" aria-label="Çıkar">✕</button><button type="button" data-a="sag" aria-label="Sağa al" ' + (i === list.length - 1 ? 'disabled' : '') + '>▶</button></div>';
        slot.querySelectorAll('button').forEach(b => { b.onclick = () => oynat(key, i, b.dataset.a); });
      } else {
        slot.innerHTML = '<button type="button" class="rs-bos" aria-label="Resim ekle">＋</button>';
        slot.querySelector('button').onclick = () => havuzAc(ada, st, en, tr);
      }
      slots.append(slot);
    }
    const tools = row.querySelector('.rs-satir-arac');
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'rs-btn';
    all.textContent = '🖼️ Tüm resimler';
    all.onclick = () => havuzAc(ada, st, en, tr);
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'rs-btn';
    up.textContent = '📤 Yükle';
    up.onclick = () => { if (!yazabilir()) return; acik = { ada, st, en, tr }; $('rs-yukle').click(); };
    tools.append(all, up);
    return row;
  }
  function oynat(key, i, what) {
    if (!yazabilir()) return;
    const list = secim[key] || [];
    if (what === 'sil') list.splice(i, 1);
    else {
      const j = what === 'sol' ? i - 1 : i + 1;
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    }
    if (list.length) secim[key] = list; else delete secim[key];
    kaydet();
    cizAna();
  }
  // tapping a picture in the pool: added to the open word, or taken off it when it is already there
  function sec(tok) {
    if (!acik || !yazabilir()) return;
    const key = anahtar(acik.ada, acik.st, acik.en);
    const list = secim[key] || [];
    const at = list.indexOf(tok);
    if (at >= 0) list.splice(at, 1);
    else if (list.length >= MAX) { havuzBaslik('⚠️ En fazla ' + MAX + ' resim: önce birini çıkar.'); return; }
    else list.push(tok);
    if (list.length) secim[key] = list; else delete secim[key];
    kaydet();
    cizAna();
    cizHavuz();
  }

  /* ---------- the pool ---------- */
  function havuzBaslik(extra = '') {
    if (!acik) { $('rs-havuz-kelime').textContent = ''; return; }
    const n = (secim[anahtar(acik.ada, acik.st, acik.en)] || []).length;
    $('rs-havuz-kelime').innerHTML = esc(acik.st.simge + ' ' + acik.st.ad) + ' › <b>' + esc(acik.en) + '</b> (' + esc(acik.tr) + ') · ' + n + ' / ' + MAX + ' resim' +
      (extra ? ' <span class="rs-uyari-kucuk">' + esc(extra) + '</span>' : '');
  }
  function havuzAc(ada, st, en, tr) {
    acik = { ada, st, en, tr };
    $('rs-bul').value = '';
    if (!$('rs-havuz').open) $('rs-havuz').showModal();
    cizHavuz();
    $('rs-bul').focus();
  }
  function cizHavuz() {
    havuzBaslik();
    const yer = kullanim();
    const q = low($('rs-bul').value.trim());
    const mine = acik ? secim[anahtar(acik.ada, acik.st, acik.en)] || [] : [];
    const groups = [];
    const placed = new Set();
    const put = (title, toks) => { const list = toks.filter(t => !placed.has(t)); list.forEach(t => placed.add(t)); groups.push([title, list]); };
    put('Bu kelimenin resimleri', mine);
    put('📤 Yüklediklerin', [...yuklenen.keys()].map(id => '[[u-' + id + ']]'));
    const stations = adalar.flatMap(ada => ada.istasyonlar.map(st => [ada, st]));
    if (acik) stations.sort((a, b) => (b[1] === acik.st) - (a[1] === acik.st));
    for (const [ada, st] of stations) {
      const toks = st.gruplar.flatMap(g => g.kelimeler).flatMap(([en]) => secim[anahtar(ada, st, en)] || []);
      put('English · ' + ada.ad + ' · ' + st.simge + ' ' + st.ad, [...new Set(toks)]);
    }
    for (const stop of ing2) put('İngilizce Koyu (2. sınıf) · ' + stop.simge + ' ' + stop.ad, [...new Set(stop.sorular.flatMap(qq => tokenler(qq.k?.[2])))]);
    const all = hepsi();
    put('Sahibinin çizimleri (henüz kullanılmayan)', all.filter(t => t.startsWith('[[y-')));
    put('Kodla çizilen resimler (harf kartları, sıra rozetleri, sayılar …)', all.filter(t => t.startsWith('[[')));
    put('Emojiler', all);
    const host = $('rs-havuz-icerik');
    host.innerHTML = '';
    let shown = 0;
    for (const [title, toks] of groups) {
      // a picture whose own name matches comes before one that matches by a word it is used for
      const byName = t => low(adi(t)).includes(q);
      const list = toks.filter(t => !q || byName(t) || (yer.get(t) || []).some(l => low(l).includes(q))).sort((a, b) => q ? byName(b) - byName(a) : 0);
      if (!list.length) continue;
      shown += list.length;
      const box = document.createElement('details');
      box.className = 'rs-grup';
      box.open = true;
      box.innerHTML = '<summary>' + esc(title) + ' <em>' + list.length + '</em></summary><div class="rs-izgara"></div>';
      const grid = box.querySelector('.rs-izgara');
      for (const tok of list) {
        const cell = document.createElement('div');
        cell.className = 'rs-hucre' + (mine.includes(tok) ? ' secili' : '');
        const where = yer.get(tok) || [];
        cell.title = adi(tok) + (where.length ? '\n' + where.slice(0, 6).join('\n') + (where.length > 6 ? '\n…' : '') : '');
        // under an emoji, the word it is used for; under a drawing, its name (without the y- of the owner's sheets)
        const label = tok.startsWith('[[') ? adi(tok).replace(/^y-/, '') : (where[0] || '').split(': ').pop().replace(/ \(.*$/, '');
        cell.innerHTML = '<button type="button" class="rs-hucre-sec"><span class="rs-resim">' + resim(tok) + '</span><small>' + esc(label) + '</small></button>' +
          (mine.includes(tok) ? '<i class="rs-tik" aria-hidden="true">✓</i>' : '') +
          (tok.startsWith('[[u-') ? '<button type="button" class="rs-hucre-sil" aria-label="Yüklenen resmi sil" title="Sil">🗑</button>' : '');
        cell.querySelector('.rs-hucre-sec').onclick = () => sec(tok);
        const del = cell.querySelector('.rs-hucre-sil');
        if (del) del.onclick = () => yuklenenSil(tok.slice(4, -2));
        grid.append(cell);
      }
      host.append(box);
    }
    if (!shown) host.innerHTML = '<p class="rs-not">“' + esc($('rs-bul').value) + '” için resim bulunamadı.</p>';
  }
  let findTimer = 0;
  $('rs-bul').oninput = () => { clearTimeout(findTimer); findTimer = setTimeout(cizHavuz, 150); };
  $('rs-havuz-kapat').onclick = () => $('rs-havuz').close();
  $('rs-havuz').addEventListener('click', e => { if (e.target === $('rs-havuz')) $('rs-havuz').close(); });
  $('rs-kelime-ara').oninput = cizAna;

  /* ---------- uploads ---------- */
  // A picture of the owner's: made 1024 px at most on its longer side (WebP; JPEG where the browser cannot write WebP, as
  // Safari), kept as a data: URL in the cloud (a Firestore document holds up to 1 MB).
  function kucult(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * scale));
        c.height = Math.max(1, Math.round(img.naturalHeight * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let data = c.toDataURL('image/webp', 0.85);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', 0.88);
        if (data.length > 900000) data = c.toDataURL('image/jpeg', 0.7);
        resolve(data);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Resim okunamadı: ' + file.name)); };
      img.src = url;
    });
  }
  async function yukleDosyalar(files, word) {
    if (!files.length || !yazabilir()) return;
    for (const file of files) {
      durum('📤 Yükleniyor: ' + file.name);
      try {
        const veri = await kucult(file);
        if (veri.length > 900000) throw new Error('Resim çok büyük: ' + file.name);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const ad = file.name.replace(/\.[^.]+$/, '').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'resim';
        const r = await istek('resimler/yuklenen/liste?documentId=' + id, { method: 'POST', body: JSON.stringify({ fields: {
          ad: { stringValue: ad }, veri: { stringValue: veri }, zaman: { timestampValue: new Date().toISOString() } } }) });
        if (r.status === 403) { kuralUyarisi(true); throw new Error('Yükleme izni yok'); }
        if (!r.ok) throw new Error('Yüklenemedi (' + r.status + ')');
        yuklenen.set(id, { ad, veri });
        if (word) {
          const key = anahtar(word.ada, word.st, word.en);
          const list = secim[key] || [];
          if (list.length < MAX) { list.push('[[u-' + id + ']]'); secim[key] = list; kaydet(); }
        }
        durum('✓ Yüklendi: ' + ad, 'iyi');
      } catch (error) { durum('✗ ' + error.message, 'kotu'); }
    }
    cizAna();
    if ($('rs-havuz').open) cizHavuz();
  }
  $('rs-yukle').onchange = e => { const files = [...e.target.files]; e.target.value = ''; yukleDosyalar(files, acik); };
  $('rs-yukle-havuz').onchange = e => { const files = [...e.target.files]; e.target.value = ''; yukleDosyalar(files, acik); };
  async function yuklenenSil(id) {
    if (!yazabilir()) return;
    const u = yuklenen.get(id);
    if (!confirm('“' + (u?.ad || 'resim') + '” silinsin mi? Seçildiği bütün kelimelerden de çıkar.')) return;
    try {
      const r = await istek('resimler/yuklenen/liste/' + id, { method: 'DELETE' });
      if (r.status === 403) { kuralUyarisi(true); throw new Error('Silme izni yok'); }
      if (!r.ok) throw new Error('Silinemedi (' + r.status + ')');
      yuklenen.delete(id);
      const tok = '[[u-' + id + ']]';
      for (const key of Object.keys(secim)) { secim[key] = secim[key].filter(t => t !== tok); if (!secim[key].length) delete secim[key]; }
      kaydet();
      cizAna();
      cizHavuz();
    } catch (error) { durum('✗ ' + error.message, 'kotu'); }
  }

  /* ---------- start ---------- */
  girisCiz();
  if (!session) $('rs-kilit').hidden = false;
  googleTeklif();
  cizAna();
  yukle().then(cizAna);
})();
