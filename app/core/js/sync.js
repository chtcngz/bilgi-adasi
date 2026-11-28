// Bulut kaydı: every change to the game's saved data is also copied to Firebase (Firestore), so the
// Yönetici sayfası (admin/) can show the players of every device. The browser's localStorage stays the
// game's own save; the cloud is only a copy, written one way, and the game never waits for it.
//
// It speaks to Firebase's REST endpoints with fetch, without the Firebase SDK: nothing more to load, and
// with no network (or Firebase down) the game plays as before. Each device signs in anonymously and
// writes one document, cihazlar/{its uid}, holding a snapshot of the game's keys (the Firestore rules let
// a device write only its own document, and only the admin read them).
//
// Oyuncu kodu: every player also has a document of their own, oyuncular/{the player's code}, holding the
// player and their keys. Typing the code on another device (Kim keşfe çıkıyor? → Oyuncu kodum var) loads it
// there (yukle), and when the page opens, a player whose document was changed later on another device is
// brought up to date before anyone plays (tazele): the device where the player last played wins.
//
// Deleting a player (Settings → Oyuncu) takes them off this device only: their document stays, so their progress on
// the other devices stays and the code still brings them back. Ticking "Her yerden sil" replaces the document with a
// tombstone ({ silindi }): the code no longer works, and every other device drops the player when the page opens there.
//
// Loaded right after core/js/app.js and core/js/bulut-ayar.js. Changes are noticed by wrapping Storage.prototype.setItem/removeItem,
// so no island needs to know about the cloud.
const bulut = (() => {
  // No child plays a development copy (served locally, so the publish workflow has not stamped its version)
  // or a browser driven by a program (a test run: Playwright, Selenium, headless Chrome). Such a run starts
  // with an empty browser every time, so it would sign up anew and show on the admin page as one more device:
  // it sends nothing.
  const surum = document.querySelector('meta[name=surum]')?.content || '';
  if (surum.startsWith('__') || navigator.webdriver === true || /HeadlessChrome/.test(navigator.userAgent)) {
    return { durum: () => ({ uid: null, bekliyor: false, gonderildi: null, hata: null, kapali: true }),
      simdi: () => Promise.resolve(), oyuncuSilindi: () => Promise.resolve(),
      yukle: () => Promise.reject(new Error('kapali')), tazele: () => Promise.resolve({ guncel: [], silinen: [] }),
      normalize: text => String(text || '').toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/[^A-Z0-9]/g, '') };
  }
  const config = bulutAyar;
  // The game's saved-data keys (README: they never change). Sound settings stay on the device.
  const prefixes = ['carpim-adasi-', 'elif-ba-', 'din-bilgisi-', 'fen-bilimleri-', 'sosyal-bilgiler-', 'ingilizce-', 'akvaryum-'];
  const isGameKey = key => typeof key === 'string' && prefixes.some(p => key.startsWith(p));
  // This device's cloud state: its anonymous account, whether a change still has to be sent,
  // and when each player last changed something (shown as "son oynama" on the admin page).
  const STATE = 'bilgi-adasi-bulut';
  const DELAY = 4000;
  const auth = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + config.apiKey;
  const refresh = 'https://securetoken.googleapis.com/v1/token?key=' + config.apiKey;
  const docs = 'https://firestore.googleapis.com/v1/projects/' + config.projectId + '/databases/(default)/documents/';

  const storage = window.localStorage;
  const setItem = Storage.prototype.setItem;
  const removeItem = Storage.prototype.removeItem;
  const getItem = Storage.prototype.getItem;
  const read = key => { try { return getItem.call(storage, key); } catch { return null; } };
  let state = (() => { try { return JSON.parse(read(STATE)) || {}; } catch { return {}; } })();
  state.oyuncular ||= {};
  // Players whose own document (oyuncular/{code}) still has to be sent.
  state.kirli ||= {};
  // What deleting players left to send, by code: the last copy of a player deleted only here whose last changes had
  // not gone up yet ({ profil, kayitlar, degisti }), and the time a player was deleted everywhere (their tombstone).
  state.birak ||= {};
  state.silinen ||= {};
  const leftToSend = () => Object.keys(state.birak).length + Object.keys(state.silinen).length > 0;
  const keep = () => { try { setItem.call(storage, STATE, JSON.stringify(state)); } catch {} };

  let timer = null, busy = false, again = false;
  // Players being taken off this device: removing their keys is not playing. Codes whose document is a tombstone:
  // never sent again. While tazele reads the players' documents, none is sent, so a copy that is behind does not
  // overwrite a newer one (or a tombstone) before tazele has seen it.
  const leaving = new Set(), tombstoned = new Set();
  let refreshing = false;

  const players = () => { try { return (JSON.parse(read('carpim-adasi-profiller')) || []).filter(p => p && p.id); } catch { return []; } };
  // A change to a player's key ("din-bilgisi-<id>") marks the player as having played now. A change to the
  // list of players (a name, a grade, a new code) sends every player's own document again.
  function touched(key) {
    if (key === 'carpim-adasi-profiller') {
      for (const p of players()) state.kirli[p.id] = true;
      return;
    }
    const player = players().find(p => key.endsWith('-' + p.id));
    if (player && !leaving.has(player.id)) { state.oyuncular[player.id] = Date.now(); state.kirli[player.id] = true; }
  }
  // Every key of a player ends in the player's id (README).
  function playerKeys(id) {
    const keys = [];
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (isGameKey(key) && key !== 'carpim-adasi-profiller' && key.endsWith('-' + id)) keys.push(key);
      }
    } catch {}
    return keys;
  }
  function changed(key) {
    if (!isGameKey(key)) return;
    touched(key);
    state.bekliyor = true;
    keep();
    schedule(DELAY);
  }
  Storage.prototype.setItem = function (key, value) {
    const result = setItem.call(this, key, value);
    if (this === storage) changed(String(key));
    return result;
  };
  Storage.prototype.removeItem = function (key) {
    const result = removeItem.call(this, key);
    if (this === storage) changed(String(key));
    return result;
  };

  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(send, ms);
  }

  /* ---------- Account ---------- */
  async function token() {
    if (state.idToken && state.bitis > Date.now() + 60000) return state.idToken;
    let reply;
    if (state.refreshToken) {
      reply = await fetch(refresh, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(state.refreshToken) });
      if (reply.ok) {
        const data = await reply.json();
        Object.assign(state, { uid: data.user_id, idToken: data.id_token, refreshToken: data.refresh_token,
          bitis: Date.now() + Number(data.expires_in) * 1000 });
        keep();
        return state.idToken;
      }
      // The account is gone (deleted in the console): start a new one.
      if (reply.status !== 400) throw new Error('token ' + reply.status);
    }
    reply = await fetch(auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!reply.ok) throw new Error('signUp ' + reply.status);
    const data = await reply.json();
    Object.assign(state, { uid: data.localId, idToken: data.idToken, refreshToken: data.refreshToken,
      bitis: Date.now() + Number(data.expiresIn) * 1000 });
    keep();
    return state.idToken;
  }

  /* ---------- Sending ---------- */
  function device() {
    const ua = navigator.userAgent;
    const os = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' :
      /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Cihaz';
    const browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' :
      /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı';
    return os + ' · ' + browser;
  }
  function snapshot() {
    const kayitlar = {};
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (isGameKey(key)) kayitlar[key] = { stringValue: read(key) };
      }
    } catch {}
    const oyuncular = {};
    for (const [id, ms] of Object.entries(state.oyuncular)) oyuncular[id] = { timestampValue: new Date(ms).toISOString() };
    return { fields: {
      kayitlar: { mapValue: { fields: kayitlar } },
      oyuncular: { mapValue: { fields: oyuncular } },
      cihaz: { stringValue: device() },
      surum: { stringValue: surum },
      son: { timestampValue: new Date().toISOString() }
    } };
  }
  function playerRecords(id) {
    const kayitlar = {};
    for (const key of playerKeys(id)) kayitlar[key] = read(key);
    return kayitlar;
  }
  // A player's own document: the player (as the list keeps it), their keys, and when they last changed.
  function playerDoc(p, kayitlar = playerRecords(p.id), degisti = state.oyuncular[p.id] || Date.now()) {
    const fields = {};
    for (const [key, value] of Object.entries(kayitlar)) fields[key] = { stringValue: value };
    return { fields: {
      profil: { stringValue: JSON.stringify(p) },
      ad: { stringValue: String(p.name || '') },
      kayitlar: { mapValue: { fields } },
      degisti: { timestampValue: new Date(degisti).toISOString() },
      cihaz: { stringValue: state.uid || '' },
      son: { timestampValue: new Date().toISOString() }
    } };
  }
  // The document of a player deleted everywhere: only when and where.
  const tombstone = ms => ({ fields: {
    silindi: { timestampValue: new Date(ms).toISOString() },
    cihaz: { stringValue: state.uid || '' },
    son: { timestampValue: new Date().toISOString() }
  } });
  const write = async (kod, body, bearer) => {
    const reply = await fetch(docs + 'oyuncular/' + kod, { method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer }, body: JSON.stringify(body) });
    if (!reply.ok) throw new Error('oyuncu ' + reply.status);
  };
  const validCode = kod => typeof kod === 'string' && /^[A-Z0-9]{8}$/.test(kod);
  // The players' own documents. A failure here (the Firestore rules not allowing oyuncular/ yet, say) keeps them
  // waiting for the next change but does not hold back the device's document.
  async function sendPlayers(bearer) {
    const list = players();
    for (const id of Object.keys(state.kirli)) if (!list.some(p => p.id === id)) delete state.kirli[id];
    if (refreshing) return; // tazele sends them when it is done
    for (const p of list) {
      if (!state.kirli[p.id] || !validCode(p.kod)) continue;
      if (tombstoned.has(p.kod)) { delete state.kirli[p.id]; continue; }
      try {
        await write(p.kod, playerDoc(p), bearer);
        delete state.kirli[p.id];
        state.oyuncuHata = null;
      } catch (error) { state.oyuncuHata = String(error.message || error); }
    }
  }
  // What deleting players left: the tombstones, then the last copies, each unless the cloud already has a newer
  // copy or a tombstone. What fails waits for the next change, the 'online' event or the next page open.
  async function sendLeft(bearer) {
    for (const [kod, ms] of Object.entries(state.silinen)) {
      try {
        await write(kod, tombstone(ms), bearer);
        delete state.silinen[kod];
        tombstoned.add(kod);
      } catch (error) { state.oyuncuHata = String(error.message || error); }
    }
    for (const [kod, last] of Object.entries(state.birak)) {
      try {
        const cloud = await fetchPlayer(kod).catch(error => { if (error.message === 'yok') return null; throw error; });
        if (!cloud || (!cloud.silindi && cloud.degisti <= last.degisti)) await write(kod, playerDoc(last.profil, last.kayitlar, last.degisti), bearer);
        delete state.birak[kod];
      } catch (error) { state.oyuncuHata = String(error.message || error); }
    }
  }

  async function send() {
    if (busy) { again = true; return; }
    if (!state.bekliyor) return;
    if (navigator.onLine === false) return; // the 'online' event sends it
    const body = snapshot();
    // Every player deleted: the device's document goes too, so the admin page no longer lists it.
    let players = [];
    try { players = JSON.parse(read('carpim-adasi-profiller')) || []; } catch {}
    const empty = !players.length;
    if (empty) state.oyuncular = {};
    // A device with no players (and nothing in the cloud yet) gets no account and no document.
    const left = leftToSend();
    if (!state.uid && !left && (empty || !Object.keys(body.fields.kayitlar.mapValue.fields).length)) { state.bekliyor = false; keep(); return; }
    busy = true;
    state.bekliyor = false;
    try {
      const bearer = await token();
      const reply = await fetch(docs + 'cihazlar/' + state.uid, empty
        ? { method: 'DELETE', headers: { Authorization: 'Bearer ' + bearer } }
        : { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer },
          body: JSON.stringify(body) });
      if (reply.status === 401 || reply.status === 403) { state.bitis = 0; throw new Error('auth ' + reply.status); }
      if (!reply.ok) throw new Error('write ' + reply.status);
      if (!empty) await sendPlayers(bearer);
      if (left) await sendLeft(bearer);
      state.gonderildi = Date.now();
      state.hata = null;
    } catch (error) {
      state.bekliyor = true;
      state.hata = String(error.message || error);
      // Try again later; a minute, growing to ten while it keeps failing.
      state.deneme = Math.min(10, (state.deneme || 0) + 1);
      schedule(state.deneme * 60000);
    } finally {
      if (!state.hata) state.deneme = 0;
      keep();
      busy = false;
      if (again) { again = false; schedule(DELAY); }
    }
  }

  // Send what is waiting when the page opens, comes back online, or is put away.
  window.addEventListener('online', () => schedule(1000));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && state.bekliyor) send(); });
  // Players saved before codes existed send their own document once.
  if (!state.kodlar) { for (const p of players()) state.kirli[p.id] = true; state.kodlar = 1; state.bekliyor = true; keep(); }
  // The first time on a device (or after an update), everything already saved goes up once.
  if (!state.uid || state.bekliyor || leftToSend()) { state.bekliyor = true; schedule(2000); }

  // A player being deleted: called just before their keys are removed. Only here (herYerden false): if their last
  // changes had not gone up yet, their last copy is kept to go up, so the other devices and the code have everything;
  // their document stays. Everywhere: their document becomes a tombstone. The change goes up right away, once the
  // caller has removed the keys.
  function oyuncuSilindi(p, herYerden) {
    leaving.add(p.id);
    if (validCode(p.kod)) {
      if (herYerden) { state.silinen[p.kod] = Date.now(); delete state.birak[p.kod]; }
      else if (state.kirli[p.id]) state.birak[p.kod] = { profil: { ...p }, kayitlar: playerRecords(p.id), degisti: state.oyuncular[p.id] || Date.now() };
    }
    delete state.oyuncular[p.id];
    delete state.kirli[p.id];
    state.bekliyor = true;
    keep();
    clearTimeout(timer);
    return Promise.resolve().then(send);
  }

  /* ---------- Loading a player by code ---------- */
  async function fetchPlayer(kod) {
    const reply = await fetch(docs + 'oyuncular/' + kod, { headers: { Authorization: 'Bearer ' + await token() } });
    if (reply.status === 404) throw new Error('yok');
    if (reply.status === 403) throw new Error('izin');
    if (!reply.ok) throw new Error('okuma ' + reply.status);
    const f = (await reply.json()).fields || {};
    if (f.silindi) return { silindi: true };
    let profil = null;
    try { profil = JSON.parse(f.profil?.stringValue); } catch {}
    if (!profil || !profil.id) throw new Error('yok');
    const kayitlar = {};
    for (const [key, v] of Object.entries(f.kayitlar?.mapValue?.fields || {})) {
      if (isGameKey(key) && key.endsWith('-' + profil.id) && typeof v.stringValue === 'string') kayitlar[key] = v.stringValue;
    }
    return { profil: { ...profil, kod }, kayitlar, degisti: Date.parse(f.degisti?.timestampValue) || 0 };
  }
  // Writes a player's keys as the cloud has them (without counting it as playing here). A key the cloud lacks is
  // never removed here: a copy that lacks keys is a copy that missed them, and removing them lost a child's progress.
  function apply(doc) {
    const id = doc.profil.id;
    for (const [key, value] of Object.entries(doc.kayitlar)) setItem.call(storage, key, value);
    state.oyuncular[id] = doc.degisti || Date.now();
    delete state.kirli[id];
    state.bekliyor = true;
    keep();
    schedule(DELAY);
  }
  // A code someone typed: "abcd-efgh" → "ABCDEFGH".
  const normalize = text => String(text || '').toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/[^A-Z0-9]/g, '');
  // Loads the player with this code onto the device; resolves with the player (as the list keeps it).
  async function yukle(text) {
    const kod = normalize(text);
    if (!validCode(kod)) throw new Error('kod');
    if (navigator.onLine === false) throw new Error('internet');
    const doc = await fetchPlayer(kod);
    if (doc.silindi) throw new Error('silindi');
    leaving.delete(doc.profil.id);
    apply(doc);
    return doc.profil;
  }
  // When the page opens: the players with a code whose cloud copy is newer (played on another device since) are
  // updated, and the players deleted everywhere on another device are dropped, unless ok(id) says no (the player is
  // already being played). Resolves with { guncel: the updated players, silinen: the players to drop }: profiles.js
  // takes those off the list and removes their keys.
  async function tazele(ok) {
    const result = { guncel: [], silinen: [] };
    if (navigator.onLine === false) return result;
    const list = players().filter(p => validCode(p.kod));
    if (!list.length) return result;
    refreshing = true;
    try {
      for (const p of list) {
        try {
          const doc = await fetchPlayer(p.kod);
          if (doc.silindi) {
            tombstoned.add(p.kod);
            if (ok && !ok(p.id)) continue;
            leaving.add(p.id);
            delete state.oyuncular[p.id];
            delete state.kirli[p.id];
            keep();
            result.silinen.push(p);
            continue;
          }
          if (doc.profil.id !== p.id || doc.degisti <= (state.oyuncular[p.id] || 0)) continue;
          if (ok && !ok(p.id)) continue;
          // The newer copy lacks something this device keeps (an island, the aquarium): it is not this player's whole
          // progress, so it does not replace it. This device's copy goes up instead, as the newest, and the other
          // devices take it from there.
          if (playerKeys(p.id).some(key => !(key in doc.kayitlar))) {
            state.oyuncular[p.id] = Date.now();
            state.kirli[p.id] = true;
            continue;
          }
          apply(doc);
          result.guncel.push(doc.profil);
        } catch {}
      }
    } finally {
      refreshing = false;
      // What waited for tazele goes up now.
      if (Object.keys(state.kirli).length) { state.bekliyor = true; keep(); schedule(DELAY); }
    }
    return result;
  }

  return { durum: () => ({ uid: state.uid || null, bekliyor: !!state.bekliyor, gonderildi: state.gonderildi || null, hata: state.hata || null,
    oyuncuHata: state.oyuncuHata || null }),
    simdi: () => { state.bekliyor = true; return send(); }, oyuncuSilindi, yukle, tazele, normalize };
})();
