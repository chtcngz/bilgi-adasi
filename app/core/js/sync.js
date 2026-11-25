// Bulut kaydı: every change to the game's saved data is also copied to Firebase (Firestore), so the
// Yönetici sayfası (admin/) can show the players of every device. The browser's localStorage stays the
// game's own save; the cloud is only a copy, written one way, and the game never waits for it.
//
// It speaks to Firebase's REST endpoints with fetch, without the Firebase SDK: nothing more to load, and
// with no network (or Firebase down) the game plays as before. Each device signs in anonymously and
// writes one document, cihazlar/{its uid}, holding a snapshot of the game's keys (the Firestore rules let
// a device write only its own document, and only the admin read them).
//
// Loaded right after core/js/app.js and core/js/bulut-ayar.js. Changes are noticed by wrapping Storage.prototype.setItem/removeItem,
// so no island needs to know about the cloud.
const bulut = (() => {
  const config = bulutAyar;
  // The game's saved-data keys (README: they never change). Sound settings stay on the device.
  const prefixes = ['carpim-adasi-', 'elif-ba-', 'din-bilgisi-', 'fen-bilimleri-', 'sosyal-bilgiler-'];
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
  const keep = () => { try { setItem.call(storage, STATE, JSON.stringify(state)); } catch {} };

  let timer = null, busy = false, again = false;

  // A change to a player's key ("din-bilgisi-<id>") marks the player as having played now.
  function touched(key) {
    if (key === 'carpim-adasi-profiller') return;
    let list = [];
    try { list = JSON.parse(read('carpim-adasi-profiller')) || []; } catch {}
    const player = list.find(p => p && p.id && key.endsWith('-' + p.id));
    if (player) state.oyuncular[player.id] = Date.now();
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
    const surum = document.querySelector('meta[name=surum]')?.content || '';
    return { fields: {
      kayitlar: { mapValue: { fields: kayitlar } },
      oyuncular: { mapValue: { fields: oyuncular } },
      cihaz: { stringValue: device() },
      surum: { stringValue: surum.startsWith('__') ? 'geliştirme' : surum },
      son: { timestampValue: new Date().toISOString() }
    } };
  }
  async function send() {
    if (busy) { again = true; return; }
    if (!state.bekliyor) return;
    if (navigator.onLine === false) return; // the 'online' event sends it
    const body = snapshot();
    // A device with nothing saved yet gets no account and no document.
    if (!state.uid && !Object.keys(body.fields.kayitlar.mapValue.fields).length) { state.bekliyor = false; keep(); return; }
    busy = true;
    state.bekliyor = false;
    try {
      const bearer = await token();
      const reply = await fetch(docs + 'cihazlar/' + state.uid, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer },
        body: JSON.stringify(body) });
      if (reply.status === 401 || reply.status === 403) { state.bitis = 0; throw new Error('auth ' + reply.status); }
      if (!reply.ok) throw new Error('write ' + reply.status);
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
  // The first time on a device (or after an update), everything already saved goes up once.
  if (!state.uid || state.bekliyor) { state.bekliyor = true; schedule(2000); }

  return { durum: () => ({ uid: state.uid || null, bekliyor: !!state.bekliyor, gonderildi: state.gonderildi || null, hata: state.hata || null }),
    simdi: () => { state.bekliyor = true; return send(); } };
})();
