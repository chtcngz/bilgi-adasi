// Yönetici sayfası (admin/index.html): every player of every device, read from the cloud copy the game
// keeps (core/js/sync.js), plus this browser's own players and backups added by hand, with everything
// the game keeps about them. It only reads the game's keys; the one key it writes is its own list of
// added backups (bilgi-adasi-yonetici-yedekler).
//
// The page opens with the admin's Google account or Firebase e-mail and password. Firebase checks them, and
// the Firestore rules let only the admin read the devices' documents (cihazlar/*), so no password is kept here.
// Google sign-in uses Google Identity Services with auto_select: when the browser is already signed in to
// Google and that account has signed in here before, the page opens without a click.
const adminCloud = (() => {
  const $ = id => document.getElementById(id);
  const SESSION = 'bilgi-adasi-yonetici-oturum';
  const key = bulutAyar.apiKey;
  const docs = 'https://firestore.googleapis.com/v1/projects/' + bulutAyar.projectId + '/databases/(default)/documents/';
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION)); } catch {}
  const keep = () => { try { sessionStorage.setItem(SESSION, JSON.stringify(session)); } catch {} };
  const errors = {
    INVALID_LOGIN_CREDENTIALS: 'E-posta ya da şifre yanlış.', INVALID_PASSWORD: 'E-posta ya da şifre yanlış.',
    EMAIL_NOT_FOUND: 'E-posta ya da şifre yanlış.', INVALID_EMAIL: 'E-posta adresi geçersiz.',
    USER_DISABLED: 'Bu hesap kapatılmış.', OPERATION_NOT_ALLOWED: 'Firebase’de bu giriş yolu açık değil (Authentication → Sign-in method).',
    INVALID_IDP_RESPONSE: 'Google girişi doğrulanamadı, yeniden deneyin.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Çok fazla deneme yapıldı, biraz sonra yeniden deneyin.'
  };
  async function account(method, body) {
    const reply = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + method + '?key=' + key, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, returnSecureToken: true }) });
    const data = await reply.json().catch(() => ({}));
    if (!reply.ok) {
      const code = String(data.error?.message || reply.status).split(' ')[0];
      throw new Error(errors[code] || 'Giriş yapılamadı (' + code + ').');
    }
    if (!data.idToken) throw new Error('Bu Google hesabı Firebase’deki hesaba bağlanamadı' + (data.email ? ' (' + data.email + ')' : '') + '.');
    session = { email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, bitis: Date.now() + Number(data.expiresIn) * 1000 };
    keep();
  }
  const signIn = (email, password) => account('signInWithPassword', { email, password });
  // credential: the Google ID token Google Identity Services hands the page.
  const signInGoogle = credential => account('signInWithIdp',
    { postBody: 'id_token=' + encodeURIComponent(credential) + '&providerId=google.com', requestUri: location.origin, returnIdpCredential: true });
  // The Web client ID of the project's Google sign-in: from bulut-ayar.js, or else from the project's public
  // auth settings (present once Google is turned on in Firebase → Authentication → Sign-in method).
  async function googleClientId() {
    if (bulutAyar.googleClientId) return bulutAyar.googleClientId;
    try {
      const reply = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=' + key);
      const data = await reply.json();
      return (data.idpConfig || []).find(c => /google/i.test(c.provider) && c.enabled !== false)?.clientId || '';
    } catch { return ''; }
  }
  function loadGoogle() {
    if (window.google?.accounts?.id) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  async function offerGoogle(enter, fail) {
    const clientId = await googleClientId();
    if (!clientId) return;
    try { await loadGoogle(); } catch { return; }
    google.accounts.id.initialize({
      client_id: clientId, auto_select: true, cancel_on_tap_outside: false, use_fedcm_for_prompt: true,
      callback: async reply => {
        $('adm-lock-note').textContent = 'Google ile giriliyor…';
        try { await signInGoogle(reply.credential); enter(); }
        catch (error) { fail(error); }
      }
    });
    google.accounts.id.renderButton($('adm-google'), { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'tr',
      width: Math.min(320, $('adm-lock-form').clientWidth - 56) });
    $('adm-google-box').hidden = false;
    // Signs in on its own when the browser's Google account has signed in here before; otherwise it offers the account.
    google.accounts.id.prompt();
  }
  async function token() {
    if (session.bitis > Date.now() + 60000) return session.idToken;
    const reply = await fetch('https://securetoken.googleapis.com/v1/token?key=' + key, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(session.refreshToken) });
    if (!reply.ok) { signOut(); throw new Error('Oturumun süresi doldu, yeniden giriş yapın.'); }
    const data = await reply.json();
    Object.assign(session, { idToken: data.id_token, refreshToken: data.refresh_token, bitis: Date.now() + Number(data.expires_in) * 1000 });
    keep();
    return session.idToken;
  }
  function signOut() {
    session = null;
    try { sessionStorage.removeItem(SESSION); } catch {}
    // Without this, Google would sign the page straight back in after the reload.
    try { google.accounts.id.disableAutoSelect(); } catch {}
    location.reload();
  }
  // Every device document, decoded: { uid, cihaz, surum, son, oyuncular: { id: ms }, kayitlar: { key: text } }.
  async function devices() {
    const list = [];
    let page = '';
    do {
      const reply = await fetch(docs + 'cihazlar?pageSize=300' + (page ? '&pageToken=' + encodeURIComponent(page) : ''),
        { headers: { Authorization: 'Bearer ' + await token() } });
      if (reply.status === 403) throw new Error('Bu hesabın cihazları okuma izni yok. Firestore kurallarındaki ADMIN_UID bu hesabın UID’si mi?');
      if (reply.status === 404) throw new Error('Firestore veritabanı bulunamadı. Firebase’de Firestore Database oluşturuldu mu?');
      if (!reply.ok) throw new Error('Buluttan okunamadı (' + reply.status + ').');
      const data = await reply.json();
      for (const doc of data.documents || []) {
        const f = doc.fields || {};
        const map = (name, pick) => Object.fromEntries(Object.entries(f[name]?.mapValue?.fields || {}).map(([k, v]) => [k, pick(v)]));
        list.push({ uid: doc.name.split('/').pop(), cihaz: f.cihaz?.stringValue || '', surum: f.surum?.stringValue || '',
          son: Date.parse(f.son?.timestampValue || doc.updateTime) || null,
          oyuncular: map('oyuncular', v => Date.parse(v.timestampValue) || null),
          kayitlar: map('kayitlar', v => v.stringValue ?? null) });
      }
      page = data.nextPageToken || '';
    } while (page);
    return list;
  }
  function open() {
    $('adm-lock').hidden = true;
    $('admin').hidden = false;
    $('adm-user').textContent = session.email;
    $('adm-user-box').hidden = false;
    $('adm-signout').onclick = signOut;
    startAdmin();
  }
  if (session?.refreshToken) queueMicrotask(open);
  else {
    $('adm-lock').hidden = false;
    const fail = error => {
      $('adm-lock-note').textContent = '✗ ' + (navigator.onLine === false ? 'İnternet bağlantısı yok.' : error.message);
    };
    offerGoogle(open, fail);
    $('adm-lock-form').onsubmit = async e => {
      e.preventDefault();
      const button = $('adm-lock-form').querySelector('button');
      button.disabled = true;
      $('adm-lock-note').textContent = '';
      try { await signIn($('adm-email').value.trim(), $('adm-password').value); open(); }
      catch (error) { fail(error); $('adm-password').select(); }
      button.disabled = false;
    };
  }
  return { devices };
})();

function startAdmin() {
  const $ = id => document.getElementById(id);
  const BACKUPS = 'bilgi-adasi-yonetici-yedekler';
  // The game's saved-data keys (README: they never change).
  const PROFILES = 'carpim-adasi-profiller';
  const prefixes = ['carpim-adasi-', 'elif-ba-', 'din-bilgisi-', 'fen-bilimleri-', 'sosyal-bilgiler-', 'carpim-ses', 'elif-ses'];
  // Çarpım Adası's islands and rounds, as in islands/carpim/game.js.
  const carpimIslands = ['Palmiye Koyu', 'Çam Kumsalı', 'Kaya Geçidi', 'Fener Burnu',
    'Mercan Koyu', 'Çam Limanı', 'Dağ Geçidi', 'Değirmen Adası', 'Hazine Zirvesi'];
  const carpimSeconds = [15, 10, 5, 3];
  const carpimTotal = carpimIslands.length * carpimSeconds.length;
  // Question islands, as in their game.js files. The banks are top-level consts, not window properties.
  const quizzes = [
    { kod: 'din', ad: 'Din Bilgisi Adası', simge: '🌙', kayit: 'din-bilgisi-', duraklar: typeof dinSorular !== 'undefined' && dinSorular },
    { kod: 'fen', ad: 'Fen Bilimleri Adası', simge: '🔬', kayit: 'fen-bilimleri-', duraklar: typeof fenSorular !== 'undefined' && fenSorular },
    { kod: 'sosyal', ad: 'Sosyal Bilgiler Adası', simge: '🗺️', kayit: 'sosyal-bilgiler-', duraklar: typeof sosyalSorular !== 'undefined' && sosyalSorular }
  ].filter(q => Array.isArray(q.duraklar));
  const gradeIslands = {
    'Okul öncesi': ['elif'], '1. sınıf': [], '2. sınıf': ['carpim'], '3. sınıf': ['carpim'],
    '4. sınıf': ['carpim', 'din', 'fen', 'sosyal']
  };
  const E = elifData;

  /* ---------- Helpers ---------- */
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const parse = text => { try { return JSON.parse(text); } catch { return null; } };
  const num = n => Number.isFinite(n) ? n : 0;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  function ago(ms) {
    const m = Math.round((Date.now() - ms) / 60000);
    return m < 1 ? 'az önce' : m < 60 ? m + ' dk önce' : m < 1440 ? Math.round(m / 60) + ' saat önce' : Math.round(m / 1440) + ' gün önce';
  }
  const dateText = ms => new Date(ms).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  function seconds(s) {
    s = Math.round(num(s));
    return (s >= 60 ? Math.floor(s / 60) + ' dk ' : '') + (s % 60) + ' sn';
  }
  function meter(done, total) {
    const bar = el('span', 'adm-meter');
    bar.setAttribute('aria-hidden', 'true');
    const fill = el('i');
    fill.style.width = pct(done, total) + '%';
    bar.append(fill);
    return bar;
  }
  // A labelled number: "12 / 40 · öğrenilen soru".
  function stat(value, label) {
    const box = el('div', 'adm-stat');
    box.append(el('b', '', value), el('small', '', label));
    return box;
  }
  function table(head, rows, className) {
    const wrap = el('div', 'adm-table-wrap');
    const t = el('table', 'adm-table' + (className ? ' ' + className : ''));
    const tr = el('tr');
    for (const h of head) tr.append(el('th', '', h));
    const thead = el('thead');
    thead.append(tr);
    const tbody = el('tbody');
    for (const row of rows) {
      const line = el('tr');
      if (row.className) line.className = row.className;
      for (const cell of row.cells || row) {
        const td = el('td');
        if (cell instanceof Node) td.append(cell); else td.textContent = cell;
        line.append(td);
      }
      tbody.append(line);
    }
    t.append(thead, tbody);
    wrap.append(t);
    return wrap;
  }
  function fold(title, ...content) {
    const box = el('details', 'adm-fold');
    box.append(el('summary', '', title), ...content);
    return box;
  }

  /* ---------- Sources: this browser and added backups ---------- */
  // A source is a set of saved keys: { id, label, local, records: { key: text } }.
  function localRecords() {
    const records = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (prefixes.some(p => key.startsWith(p))) records[key] = localStorage.getItem(key);
      }
    } catch {}
    return records;
  }
  function readBackups() {
    try { return parse(localStorage.getItem(BACKUPS)) || []; } catch { return []; }
  }
  function writeBackups(list) {
    try { localStorage.setItem(BACKUPS, JSON.stringify(list)); return true; } catch { return false; }
  }
  // Cloud devices first, most recently played first; this browser only if it is not in the cloud yet.
  let cloud = [], cloudError = '', loading = true;
  const thisUid = (() => { try { return JSON.parse(localStorage.getItem('bilgi-adasi-bulut'))?.uid || null; } catch { return null; } })();
  const sources = () => [
    ...cloud.slice().sort((a, b) => (b.son || 0) - (a.son || 0)).map(d => ({ id: d.uid, cloud: true, mine: d.uid === thisUid,
      label: d.cihaz || 'Cihaz', last: d.son, version: d.surum, played: d.oyuncular, records: d.kayitlar })),
    // This browser, unless it is already in the cloud or has no players.
    ...(cloud.some(d => d.uid === thisUid) || !(parse(localRecords()[PROFILES]) || []).length ? [] :
      [{ id: 'local', label: 'Bu cihaz', local: true, records: localRecords() }]),
    ...readBackups().map(b => ({ id: b.id, label: b.ad || 'Yedek', when: b.tarih, added: b.eklendi, device: b.cihaz, records: b.kayitlar || {} }))
  ];
  async function loadCloud() {
    loading = true;
    cloudError = '';
    $('adm-refresh').disabled = true;
    draw();
    try { cloud = await adminCloud.devices(); }
    catch (error) { cloudError = navigator.onLine === false ? 'İnternet bağlantısı yok.' : error.message; }
    loading = false;
    $('adm-refresh').disabled = false;
    draw();
  }

  /* ---------- Çarpım Adası ---------- */
  function carpim(record) {
    const box = el('section', 'adm-island');
    box.append(el('h3', '', '✖️ Çarpım Adası'));
    box.ozet = '✖️ –';
    if (!record) { box.append(el('p', 'adm-empty', 'Henüz oynamadı.')); return box; }
    const done = Math.max(0, Math.min(carpimTotal, num(record.completed)));
    const round = Math.min(carpimSeconds.length - 1, Math.floor(done / carpimIslands.length));
    const stats = record.stats || {};
    const all = Object.values(stats).reduce((sum, s) => {
      for (const k of ['attempts', 'correct', 'wrong', 'timeout', 'seconds']) sum[k] += num(s?.[k]);
      return sum;
    }, { attempts: 0, correct: 0, wrong: 0, timeout: 0, seconds: 0 });
    const answered = all.correct + all.wrong + all.timeout;
    const stats1 = el('div', 'adm-stats');
    stats1.append(
      stat(done + ' / ' + carpimTotal, 'yıldız'),
      stat(done >= carpimTotal ? 'Bitti 🎉' : 'Tur ' + (round + 1) + ' · ' + (done % carpimIslands.length + 2) + ' tablosu', 'şu an'),
      stat(String(all.attempts), 'deneme'),
      stat(pct(all.correct, answered) + '%', 'doğru (' + all.correct + ' / ' + answered + ')'),
      stat(String(all.wrong), 'yanlış'),
      stat(String(all.timeout), 'süre doldu'),
      stat(seconds(all.seconds), 'toplam süre'));
    box.append(meter(done, carpimTotal), stats1);
    box.ozet = '✖️ ' + done + ' / ' + carpimTotal + ' ⭐';
    if (record.attempt) box.append(el('p', 'adm-note', '⏸ Yarıda bırakılmış bir deneme var.'));
    // One row per stage the child reached.
    const rows = [];
    for (let index = 0; index < carpimTotal; index++) {
      const s = stats[index];
      if (!s && index > done) continue;
      const r = Math.floor(index / carpimIslands.length), i = index % carpimIslands.length;
      const resp = num(s?.correct) + num(s?.wrong) + num(s?.timeout);
      rows.push({ className: index < done ? 'ok' : '', cells: [
        'Tur ' + (r + 1) + ' (' + carpimSeconds[r] + ' sn)', (i + 2) + ' · ' + carpimIslands[i],
        index < done ? '✅' : index === done ? '▶ sıradaki' : '',
        String(num(s?.attempts)), resp ? pct(num(s?.correct), resp) + '%' : '–',
        String(num(s?.wrong)), String(num(s?.timeout)), s ? seconds(s.seconds) : '–'
      ] });
    }
    box.append(fold('Ada ada sonuçlar', table(['Tur', 'Tablo', 'Durum', 'Deneme', 'Doğru', 'Yanlış', 'Süre doldu', 'Süre'], rows)));
    // The last attempt of every stage, answer by answer.
    const last = [];
    for (const [index, s] of Object.entries(stats)) {
      const list = Array.isArray(s?.latest) ? s.latest : [];
      if (!list.length) continue;
      const i = index % carpimIslands.length, r = Math.floor(index / carpimIslands.length);
      for (const row of list) {
        const right = row.answer === row.a * row.b;
        last.push({ className: right ? 'ok' : 'bad', cells: [
          'Tur ' + (r + 1) + ' · ' + (i + 2), row.a + ' × ' + row.b, row.answer === null ? '⏱ süre doldu' : String(row.answer),
          right ? '✓' : String(row.a * row.b), num(row.seconds).toFixed(1) + ' sn'] });
      }
    }
    if (last.length) box.append(fold('Son denemelerdeki cevaplar (' + last.length + ')', table(['Ada', 'Soru', 'Cevabı', 'Doğrusu', 'Süre'], last, 'adm-compact')));
    // Multiplications missed most, over the last attempts.
    const missed = new Map();
    for (const s of Object.values(stats)) for (const row of s?.latest || []) {
      if (row.answer === row.a * row.b) continue;
      const key = Math.min(row.a, row.b) + ' × ' + Math.max(row.a, row.b);
      missed.set(key, (missed.get(key) || 0) + 1);
    }
    if (missed.size) {
      const top = [...missed].sort((a, b) => b[1] - a[1]).slice(0, 12);
      const chips = el('p', 'adm-chips');
      for (const [k, n] of top) chips.append(el('span', 'adm-chip bad', k + (n > 1 ? ' (' + n + ')' : '')));
      box.append(el('h4', '', 'En çok zorlandığı işlemler'), chips);
    }
    return box;
  }

  /* ---------- Elif Ba Adası ---------- */
  function elif(record) {
    const box = el('section', 'adm-island');
    box.append(el('h3', '', '🐢 Elif Ba Adası'));
    box.ozet = '🐢 –';
    if (!record) { box.append(el('p', 'adm-empty', 'Henüz oynamadı.')); return box; }
    const arr = part => Array.from({ length: 28 }, (_, i) => num(record[part]?.[i]));
    const parts = { harf: arr('harf'), hareke: arr('hareke'), bitisik: arr('bitisik'), cezm: arr('cezm') };
    const count = part => parts[part].filter(n => n >= E.mastery).length;
    const game = name => record[name] && typeof record[name] === 'object' ? record[name] : {};
    const koylar = name => (game(name).koylar || []).filter(Boolean).length;
    // The step the child is on, in the island's path (islands/elif-ba/game.js).
    const coveDone = (part, k) => E.coveLetters(k).every(i => parts[part][i] >= E.mastery);
    const steps = E.coves.flatMap((name, k) => E.coveTopic(k) === 'bitisik'
      ? [['Bitişik yazılış', () => coveDone('bitisik', k)], ['Şekil Yağmuru', () => game('sekil').koylar?.[k]], ['Cam Köprü', () => game('kopru').koylar?.[k]]]
        .map(([label, done]) => ({ label: name + ' · ' + label, done }))
      : E.coveTopic(k) === 'cezm'
      ? [['Cezm', () => coveDone('cezm', k)], ['Cezm Balonları', () => game('cezmbalon').koylar?.[k]], ['Cam Köprü', () => game('kopru').koylar?.[k]]]
        .map(([label, done]) => ({ label: name + ' · ' + label, done }))
      : [['Harfler', () => coveDone('harf', k)], ['Harf Yağmuru', () => game('yagmur').koylar?.[k]],
        ...(k === 0 ? [['Harekelerle tanış', () => record.tanisma === true]] : []),
        ['Harekeler', () => coveDone('hareke', k)], ['Hece Balonları', () => game('balon').koylar?.[k]], ['Cam Köprü', () => game('kopru').koylar?.[k]]]
        .map(([label, done]) => ({ label: name + ' · ' + label, done })));
    const next = steps.find(s => !s.done());
    const doneSteps = steps.filter(s => s.done()).length;
    const stats1 = el('div', 'adm-stats');
    stats1.append(
      stat(doneSteps + ' / ' + steps.length, 'adım'),
      stat(next ? next.label : 'Hepsi bitti 🎉', 'şu an'),
      stat(count('harf') + ' / 28', '🐚 harf'),
      stat(count('hareke') + ' / 28', '🦪 hareke'),
      stat(count('bitisik') + ' / 28', '🪸 bitişik'),
      stat(count('cezm') + ' / 28', '⭐ cezm'),
      stat((record.balik || []).filter(Boolean).length + ' / 28', '🐟 akvaryum'));
    box.append(meter(doneSteps, steps.length), stats1);
    box.ozet = '🐢 ' + doneSteps + ' / ' + steps.length + ' adım';
    // Every letter: how many times it was answered right in each section (learned at E.mastery).
    const letters = E.glyphs.map((g, i) => {
      const cell = n => { const c = el('span', n >= E.mastery ? 'adm-chip ok' : n ? 'adm-chip half' : 'adm-chip', String(n)); return c; };
      const glyph = el('span', 'adm-ar', g);
      return [glyph, E.names[i], cell(parts.harf[i]), cell(parts.hareke[i]), cell(parts.bitisik[i]), cell(parts.cezm[i])];
    });
    box.append(fold('Harf harf durum', el('p', 'adm-small', 'Sayılar harfin o bölümde kaç kez doğru bilindiğini gösterir; ' + E.mastery + ' ve üstü öğrenildi sayılır.'),
      table(['Harf', 'Adı', '🐚 Harf', '🦪 Hareke', '🪸 Bitişik', '⭐ Cezm'], letters, 'adm-compact')));
    const games = [['yagmur', '🌧️ Harf Yağmuru'], ['balon', '🎈 Hece Balonları'], ['sekil', '☔ Şekil Yağmuru'], ['cezmbalon', '🎐 Cezm Balonları'], ['kopru', '🌉 Cam Köprü']]
      .map(([id, name]) => {
        const g = game(id);
        return [name, String(num(g.rekor)), '★'.repeat(num(g.yildiz)) + '☆'.repeat(3 - Math.min(3, num(g.yildiz))),
          g.tamam ? '✅' : '–', koylar(id) + ' / ' + E.coves.length,
          (g.koylar || []).map((on, k) => on ? E.coves[k].replace(' Koyu', '') : '').filter(Boolean).join(', ') || '–'];
      });
    box.append(fold('Oyunlar', table(['Oyun', 'Rekor', 'En iyi', 'Tamamı', 'Koy', 'Oynanan koylar'], games)));
    box.append(el('p', 'adm-small', 'Harekelerle tanışma: ' + (record.tanisma ? 'yapıldı ✓' : 'henüz yapılmadı')));
    return box;
  }

  /* ---------- Question islands ---------- */
  function quiz(info, record) {
    const box = el('section', 'adm-island');
    box.append(el('h3', '', info.simge + ' ' + info.ad));
    box.ozet = info.simge + ' –';
    if (!record) { box.append(el('p', 'adm-empty', 'Henüz oynamadı.')); return box; }
    const rows = record.soru || {};
    const learned = row => !!row && num(row.d) >= 2 && !row.h;
    const all = info.duraklar.flatMap(stop => stop.sorular.map((q, n) => ({ q, id: stop.id + ':' + n, stop })));
    const seen = all.filter(x => rows[x.id]);
    const totals = seen.reduce((s, x) => { s.g += num(rows[x.id].g); s.d += num(rows[x.id].d); s.y += num(rows[x.id].y); return s; }, { g: 0, d: 0, y: 0 });
    const learnedN = all.filter(x => learned(rows[x.id])).length;
    const missed = all.filter(x => rows[x.id]?.h);
    const stars = info.duraklar.reduce((s, stop) => s + Math.min(3, num(record.yildiz?.[stop.id])), 0);
    const exam = record.deneme || {};
    const stats1 = el('div', 'adm-stats');
    stats1.append(
      stat(learnedN + ' / ' + all.length, 'öğrenilen soru'),
      stat(seen.length + ' / ' + all.length, 'görülen soru'),
      stat(stars + ' / ' + info.duraklar.length * 3, '⭐ yıldız'),
      stat(pct(totals.d, totals.g) + '%', 'doğru (' + totals.d + ' / ' + totals.g + ' cevap)'),
      stat(String(missed.length), '🔁 tekrar kutusunda'),
      stat(exam.sayi ? num(exam.en) + ' / 20' : '–', '🏆 deneme en iyi' + (exam.sayi ? ' (son ' + num(exam.son) + ', ' + exam.sayi + ' kez)' : '')));
    box.append(meter(learnedN, all.length), stats1);
    box.ozet = info.simge + ' ' + learnedN + ' / ' + all.length + ' soru';
    const stopRows = info.duraklar.map(stop => {
      const list = all.filter(x => x.stop === stop);
      const l = list.filter(x => learned(rows[x.id])).length;
      const s = list.filter(x => rows[x.id]).length;
      const y = Math.min(3, num(record.yildiz?.[stop.id]));
      const bar = el('span', 'adm-cellbar');
      bar.append(meter(l, list.length), el('small', '', l + ' / ' + list.length));
      return { className: l === list.length ? 'ok' : '', cells: [stop.simge + ' ' + stop.ad, stop.unite || '', '★'.repeat(y) + '☆'.repeat(3 - y), bar, String(s)] };
    });
    box.append(fold('Durak durak', table(['Durak', 'Ünite', 'Yıldız', 'Öğrenilen', 'Görülen'], stopRows)));
    // Every question the child has seen, the hardest first.
    const qRows = seen
      .sort((a, b) => (num(rows[b.id].h) - num(rows[a.id].h)) || (num(rows[b.id].y) - num(rows[a.id].y)))
      .map(x => {
        const r = rows[x.id];
        const state = r.h ? '🔁 yanlış' : learned(r) ? '✅ öğrendi' : '… sürüyor';
        const text = el('span', 'adm-q');
        text.append(el('b', '', x.q.s.replace(/\*/g, '')), el('small', '', 'Doğrusu: ' + x.q.a[0]));
        return { className: r.h ? 'bad' : learned(r) ? 'ok' : '', cells: [x.stop.simge + ' ' + x.id, text, String(num(r.g)), String(num(r.d)), String(num(r.y)), state] };
      });
    if (qRows.length) box.append(fold('Soru soru (' + qRows.length + ' görülen soru, önce yanlışlar)',
      table(['No', 'Soru', 'Sorulma', 'Doğru', 'Yanlış', 'Durum'], qRows, 'adm-compact')));
    return box;
  }

  /* ---------- Players ---------- */
  // A player is one closed row (name, grade, last played and a line per island); a click opens the details.
  const opened = new Set();
  const playerId = (sourceId, profile) => 'oyuncu-' + sourceId + '-' + profile.id;
  function player(profile, records, last, sourceId) {
    const read = key => records[key] === undefined ? null : parse(records[key]);
    const card = el('details', 'adm-player');
    card.id = playerId(sourceId, profile);
    card.open = opened.has(card.id);
    card.ontoggle = () => { if (card.open) opened.add(card.id); else opened.delete(card.id); };
    const head = el('summary', 'adm-player-head');
    const face = el('span', 'adm-face', profile.icon || '🙂');
    const text = el('div', 'adm-player-text');
    const chips = el('p', 'adm-chips');
    text.append(el('h2', '', profile.name || '(adsız)'), el('p', 'adm-small', (profile.grade || '?') +
      (last ? ' · son oynama ' + dateText(last) + ' (' + ago(last) + ')' : '')), chips);
    head.append(face, text, el('span', 'adm-open', '▾'));
    card.append(head);
    card.append(el('p', 'adm-small', 'Oyuncu kimliği ' + profile.id));
    const data = {
      carpim: read('carpim-adasi-oyuncu-' + profile.id),
      elif: read('elif-ba-v2-' + profile.id) || (read('elif-ba-' + profile.id) ? { harf: [] } : null)
    };
    for (const info of quizzes) data[info.kod] = read(info.kayit + profile.id);
    // The islands of the player's grade, and any other island they have progress on.
    const shown = new Set([...(gradeIslands[profile.grade] || []), ...Object.keys(data).filter(k => data[k])]);
    if (!shown.size) card.append(el('p', 'adm-empty', 'Bu sınıfa açık ada yok ve kayıtlı ilerleme bulunmuyor.'));
    if (shown.has('elif')) card.append(elif(data.elif));
    if (shown.has('carpim')) card.append(carpim(data.carpim));
    for (const info of quizzes) if (shown.has(info.kod)) card.append(quiz(info, data[info.kod]));
    for (const box of card.querySelectorAll('.adm-island')) chips.append(el('span', 'adm-chip', box.ozet));
    // Raw saved data, for anything the summaries leave out.
    const raw = Object.keys(records).filter(k => k.endsWith(profile.id)).sort();
    if (raw.length) card.append(fold('Ham kayıt (' + raw.length + ' anahtar)', ...raw.map(key => {
      const pre = el('pre', 'adm-raw');
      pre.textContent = key + '\n' + JSON.stringify(parse(records[key]), null, 1);
      return pre;
    })));
    return card;
  }

  function sourceBlock(source) {
    const block = el('section', 'adm-source');
    const head = el('div', 'adm-source-head');
    const title = el('div');
    title.append(el('h2', '', source.cloud ? '☁️ ' + source.label + (source.mine ? ' (bu cihaz)' : '') :
      source.local ? '📱 Bu cihaz (henüz buluta gönderilmedi)' : '📦 Elle eklenen yedek: ' + source.label));
    const meta = [];
    if (source.last) meta.push('son kayıt ' + dateText(source.last) + ' (' + ago(source.last) + ')');
    if (source.version) meta.push('sürüm ' + source.version);
    if (source.cloud) meta.push('cihaz kimliği ' + source.id.slice(0, 8));
    if (source.when) meta.push('yedek alındı ' + dateText(source.when));
    if (source.added) meta.push('eklendi ' + dateText(source.added));
    if (source.device) meta.push(source.device);
    if (meta.length) title.append(el('p', 'adm-small', meta.join(' · ')));
    head.append(title);
    if (!source.local && !source.cloud) {
      const remove = el('button', 'adm-button small', '✕ Kaldır');
      remove.type = 'button';
      remove.onclick = () => {
        if (!confirm(source.label + ' yedeği bu sayfadan kaldırılsın mı? Oyundaki oyuncular değişmez.')) return;
        writeBackups(readBackups().filter(b => b.id !== source.id));
        draw();
      };
      head.append(remove);
    }
    block.append(head);
    const profiles = parse(source.records[PROFILES]);
    const list = Array.isArray(profiles) ? profiles.filter(p => p && p.id) : [];
    if (!list.length) { block.append(el('p', 'adm-empty', 'Kayıtlı oyuncu yok.')); return block; }
    // A quick overview, then every player in full.
    block.append(el('p', 'adm-small', list.length + ' oyuncu'));
    const grid = el('div', 'adm-players');
    for (const profile of list) grid.append(player(profile, source.records, source.played?.[profile.id], source.id));
    block.append(grid);
    return block;
  }

  // One table of every player on every device, then each device in full.
  function overview(all) {
    const rows = [];
    for (const source of all) {
      const list = (parse(source.records[PROFILES]) || []).filter(p => p && p.id);
      for (const p of list) {
        const last = source.played?.[p.id];
        const go = el('button', 'adm-link', (p.icon || '') + ' ' + (p.name || '?'));
        go.type = 'button';
        go.onclick = () => {
          const card = document.getElementById(playerId(source.id, p));
          if (!card) return;
          card.open = true;
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        rows.push({ last: last || 0, cells: [go, p.grade || '?',
          source.cloud ? source.label : source.local ? 'Bu cihaz' : 'Yedek', last ? dateText(last) + ' (' + ago(last) + ')' : '–'] });
      }
    }
    rows.sort((a, b) => b.last - a.last);
    const box = el('section', 'adm-source');
    box.append(el('h2', '', '👧🧒 Bütün oyuncular (' + rows.length + ')'));
    if (rows.length) box.append(table(['Oyuncu', 'Sınıf', 'Cihaz', 'Son oynama'], rows));
    return box;
  }
  function draw() {
    const all = sources();
    const status = el('p', cloudError ? 'adm-note bad' : 'adm-small');
    status.textContent = loading ? '☁️ Buluttan okunuyor…' : cloudError ? '✗ ' + cloudError :
      '☁️ Bulutta ' + cloud.length + ' cihaz · ' + dateText(Date.now()) + ' itibarıyla';
    $('adm-sources').replaceChildren(status, overview(all), ...all.map(sourceBlock));
  }

  /* ---------- Backups ---------- */
  function deviceName() {
    const ua = navigator.userAgent;
    const os = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' :
      /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Cihaz';
    const browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' :
      /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı';
    return os + ' · ' + browser;
  }
  $('adm-export').onclick = () => {
    const records = localRecords();
    const names = (parse(records[PROFILES]) || []).map(p => p.name).filter(Boolean);
    const backup = { uygulama: 'bilgi-adasi', surum: 1, tarih: Date.now(), cihaz: deviceName(), oyuncular: names, kayitlar: records };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    const day = new Date().toISOString().slice(0, 10);
    a.download = 'bilgi-adasi-' + (names.join('-') || 'yedek').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9-]+/g, '') + '-' + day + '.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $('adm-note').textContent = '✓ Yedek indirildi (' + (names.length ? names.join(', ') : 'oyuncu yok') + ').';
  };
  $('adm-import').onchange = async e => {
    const files = [...e.target.files];
    e.target.value = '';
    const list = readBackups();
    const added = [], failed = [];
    for (const file of files) {
      const data = parse(await file.text());
      if (!data || data.uygulama !== 'bilgi-adasi' || !data.kayitlar || typeof data.kayitlar !== 'object') { failed.push(file.name); continue; }
      const kayitlar = {};
      for (const [key, value] of Object.entries(data.kayitlar)) {
        if (typeof value === 'string' && prefixes.some(p => key.startsWith(p))) kayitlar[key] = value;
      }
      const ad = (data.oyuncular || []).join(', ') || file.name.replace(/\.json$/, '');
      // The same device backed up again replaces its older copy (same players and device).
      const same = list.findIndex(b => b.ad === ad && b.cihaz === data.cihaz);
      const entry = { id: String(Date.now()) + Math.random().toString(36).slice(2, 6), ad, cihaz: String(data.cihaz || ''),
        tarih: Number(data.tarih) || null, eklendi: Date.now(), kayitlar };
      if (same >= 0) list.splice(same, 1, entry); else list.push(entry);
      added.push(ad);
    }
    const stored = writeBackups(list);
    $('adm-note').textContent = (added.length ? '✓ Eklendi: ' + added.join(' · ') + '. ' : '') +
      (failed.length ? '✗ Bilgi Adası yedeği değil: ' + failed.join(', ') + '. ' : '') +
      (added.length && !stored ? 'Tarayıcı yedeği saklayamadı (yer kalmamış olabilir).' : '');
    draw();
  };

  $('adm-refresh').onclick = loadCloud;
  loadCloud();
}
