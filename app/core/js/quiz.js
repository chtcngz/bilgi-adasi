// Soru adaları (Din Bilgisi, Fen Bilimleri, Sosyal Bilgiler): Keşif Haritası'nda birer koy. Koyun adaları ders
// kitabının üniteleri, ekstra konular ve deneme sınavıdır; bir ünite adasının durakları, ünitenin sorularının
// kitaptaki sırayla bölündüğü parçalardır. Duraklarda çoktan seçmeli sorular (her turda 10 soru, 3 kalp, bir yarı yarıya jokeri),
// yanlış cevapların toplandığı bir Tekrar Kutusu ve gerçek sınav gibi 20 soruluk bir deneme.
// Yıldızlar tek bir turu ölçer; bir ünite adasının bitmesi ise bütün sorularının öğrenilmesidir:
// bir soru iki ayrı turda doğru bilinince (ve son cevabı doğruysa) öğrenilmiş sayılır.
//
// Her ada kendi game.js dosyasında soruAdasi({...}) ile kurulur:
//   kod       sayfadaki kimliklerin öneki: din → #din-game, #din-card …
//             (görünüm core/css/quiz.css'teki ortak .soru-* sınıflarından gelir)
//   ad        "Din Bilgisi Adası" gibi: akvaryum ödüllerinin nedeninde görünür (değişmez, eski ödüller buna bakar)
//   koy, lead, simge, tema   Keşif Haritası'ndaki koyun adı, ne öğrenildiği, işareti ve görünüşü (core/js/harita.js)
//   kaynak    soruların nereden geldiğini anlatan not; koyun altında görünür
//   kayit     ilerlemenin localStorage anahtarı öneki ('din-bilgisi-' + oyuncu kimliği)
//   duraklar  soru bankası (bkz. islands/din-bilgisi/sorular.js)
//   ovgu      doğru cevaptan sonra rastgele seçilen sözler
//   simgeler  doğru cevapta saçılan simgeler
//   ses       İngilizce adalar: 'en-GB'. Sorunun k alanındaki İngilizce kelimeyi cihazın İngilizce sesiyle okur (🔊);
//             d: 1 olan soruda kelime yazılmaz, yalnızca duyulur
//   yanlisAvi true: koyda 🎯 Yanlış Avı adası olur. Tekrar Kutusu'nda YETER (6) yanlış birikince açılır; çocuğun yalnızca
//             yanlış yaptığı kelimeler (k) İngilizce ve Türkçe kartlar olarak eşleştirilir (🧩) ya da balon olarak patlatılır (🎈)
//   ikinciSans true: alıştırma turunda ilk yanlış cevap yalnızca soluklaşır, çocuk bir kez daha dener (soru yine yanlış sayılır)
//   oyunlar   { sepet: [yiyecek kelimeleri] }: duraklar ve Tekrar Kutusu soru soru değil, oyun oyun oynanır
//             (core/js/ingilizce-oyunlari.js: Dinle ve Bul, Balon Patlat, Sesli Hafıza, Sihirli Boyama, Meyve Sepeti,
//             Kelime Treni, Bilgi Kartı); her oyun kendi sorularını sorar, cevaplar yine o sorulara yazılır
// Ayarlar penceresi ilerlemeyi window.soruAdalari[kod] üzerinden okur ve sıfırlar.
// Soru bankası henüz boş olan bir ada (İngilizce Koyu gibi) haritada "Yakında" durur: tek, kilitli bir adası olur.
window.soruAdalari = {};
// islands/<ada>/sira.js (written by tools/kapsam.js from kapsam.md) gives every question its page in the book; a unit is
// cut into stations in that order, so the first station is the unit's first pages. The questions and their ids stay as
// they are (progress is saved against the ids).
function kitapSirasi(bank, pages) {
  for (const stop of bank) (pages[stop.id] || []).forEach((page, n) => { if (stop.sorular[n]) stop.sorular[n].sayfa = page; });
}

function soruAdasi({ kod, ad, koy, lead, simge, tema, kaynak, kayit, duraklar: stops, ovgu: praise, simgeler, ses, yanlisAvi, ikinciSans, oyunlar, istasyonlar }) {
  const ROUND = 10, HEARTS = 3, EXAM = 20;
  const letters = ['A', 'B', 'C', 'D'];
  const byKey = name => $(kod + '-' + name);
  const dialog = byKey('game');
  const records = new Map();
  let progress = null, run = null;

  stops.forEach(stop => stop.sorular.forEach((q, n) => { q.id = stop.id + ':' + n; q.stop = stop; }));
  const byId = new Map(stops.flatMap(stop => stop.sorular.map(q => [q.id, q])));
  const maxStars = stops.length * 3;
  const hazir = byId.size > 0;

  /* ---------- Progress ---------- */
  const storeKey = id => kayit + id;
  // bolum: İngilizce Koyu's weeks finished in each unit ({ okul: 2 } = Hafta 1 and 2 are done, Hafta 3 is open);
  // istasyon: the same for a unit cut into stations (istasyonlar.js); tanitim: the stations whose Keşif Kartı was seen ({ 'okul:3': 1 })
  const blank = () => ({ yildiz: {}, deneme: { en: null, son: null, sayi: 0 }, soru: {}, oyun: {}, bolum: {}, istasyon: {}, tanitim: {} });
  const ist = stop => istasyonlar?.[stop.id] || null;
  function load(id) {
    if (records.has(id)) return records.get(id);
    const saved = readRecord(storeKey(id));
    const record = blank();
    if (saved && typeof saved === 'object') {
      for (const stop of stops) {
        const n = saved.yildiz?.[stop.id];
        if (Number.isInteger(n) && n > 0) record.yildiz[stop.id] = Math.min(3, n);
      }
      if (saved.deneme && typeof saved.deneme === 'object') Object.assign(record.deneme, saved.deneme);
      // Oyun Parkı: the best round of each game ({ dinle: 7, … })
      for (const [game, best] of Object.entries(saved.oyun || {})) if (Number.isInteger(best) && best >= 0) record.oyun[game] = best;
      for (const [key, row] of Object.entries(saved.soru || {})) if (byId.has(key) && row) record.soru[key] = row;
      for (const stop of stops) { const n = saved.bolum?.[stop.id]; if (Number.isInteger(n) && n > 0) record.bolum[stop.id] = n; }
      // a unit cut into stations: its stations finished; a player who finished weeks before the stations came gets
      // the same share of the stations (2 of 4 weeks → 5 of 9 stations), once
      for (const stop of stops) {
        const list = ist(stop);
        if (!list) continue;
        const n = saved.istasyon?.[stop.id], weeks = record.bolum[stop.id];
        if (Number.isInteger(n) && n > 0) record.istasyon[stop.id] = Math.min(list.length, n);
        else if (!saved.istasyon?.[stop.id] && weeks) record.istasyon[stop.id] = Math.min(list.length, Math.round(weeks * list.length / 4));
      }
      for (const [key, seen] of Object.entries(saved.tanitim || {})) if (seen) record.tanitim[key] = 1;
    }
    records.set(id, record);
    return record;
  }
  let storageNote = '';
  function save() {
    try { localStorage.setItem(storeKey(activeProfile.id), JSON.stringify(progress)); storageNote = ''; }
    catch { storageNote = 'İlerlemen yalnızca bu oturumda saklanabildi.'; }
  }
  const starsOf = stop => progress.yildiz[stop.id] || 0;
  const starTotal = (record = progress) => stops.reduce((sum, stop) => sum + (record.yildiz[stop.id] || 0), 0);
  // The five textbook units are open from the start, so the child can practise the unit
  // the class is on. The exam and the extras open once every unit has at least one star.
  const units = stops.filter(stop => !stop.ekstra);
  const unitsLeft = () => units.filter(stop => !starsOf(stop)).length;
  const examOpen = () => devAll() || unitsLeft() === 0;
  const stopOpen = k => !stops[k].ekstra || examOpen();
  const sayilar = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz', 'On'];
  const lockText = (sayilar[units.length] || units.length) + ' ünite en az birer yıldızla bitince açılır';
  const ekstra = stops.find(stop => stop.ekstra);
  const missed = () => [...byId.values()].filter(q => progress.soru[q.id]?.h);
  const LEARNED = 2;
  const learned = (q, record = progress) => { const row = record.soru[q.id]; return !!row && row.d >= LEARNED && !row.h; };
  const learnedIn = (stop, record = progress) => stop.sorular.filter(q => learned(q, record)).length;
  const learnedAll = (record = progress) => [...byId.values()].filter(q => learned(q, record)).length;
  const stopMastered = stop => learnedIn(stop) === stop.sorular.length;
  function note(q, right) {
    const row = progress.soru[q.id] ??= { g: 0, d: 0, y: 0, h: 0 };
    row.g++;
    if (right) { row.d++; row.h = 0; } else { row.y++; row.h = 1; }
  }

  const summary = id => {
    const record = load(id);
    return { ad, yildiz: starTotal(record), toplam: maxStars, deneme: record.deneme.en, denemeSayi: record.deneme.sayi,
      ogrenilen: learnedAll(record), soru: byId.size,
      duraklar: stops.map(stop => ({ id: stop.id, simge: stop.simge, ad: stop.ad, unite: stop.unite, yildiz: record.yildiz[stop.id] || 0,
        ogrenilen: learnedIn(stop, record), soru: stop.sorular.length,
        dogru: stop.sorular.reduce((sum, q) => sum + (Number(record.soru[q.id]?.d) || 0), 0) })),
      any: Object.keys(record.yildiz).length > 0 || Object.keys(record.soru).length > 0 || record.deneme.sayi > 0 };
  };
  const reset = id => {
    records.set(id, blank());
    try { localStorage.removeItem(storeKey(id)); } catch {}
    if (activeProfile?.id === id) { progress = records.get(id); kesifHaritasi.yenile(); }
  };
  window.soruAdalari[kod] = { summary, reset, kayit, hazir };

  /* ---------- Helpers ---------- */
  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const escape = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // *word* is underlined and bold, like the negatives in the printed exam.
  // [[name]] in a text is a drawn picture (core/js/kelime-resimleri.js), for a word no emoji shows
  const rich = text => kelimeResimleri.resimliMetin(escape(text).replace(/\*(.+?)\*/g, '<u><b>$1</b></u>'));
  // an option that starts with a picture ("🍎 elma", "[[desk]] sıra"): the picture on a small card before the words
  const LEAD = /^((?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[0-9#*]\ufe0f?\u20e3|\[\[[a-z0-9-]+\]\])(?:[\u200d\ufe0f\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}|[0-9#*]\ufe0f?\u20e3|\[\[[a-z0-9-]+\]\])*) (.+)$/u;
  const secenek = text => { const m = String(text).match(LEAD); return m ? '<span class="secenek-resim" aria-hidden="true">' + rich(m[1]) + '</span>' + rich(m[2]) : rich(text); };
  // A question that quotes a sentence and then asks about it ("“A big brown bear bakes some bread.” Ayı ne yapıyor?"):
  // the sentence on its own line, the question under it, smaller and in another colour.
  const stem = text => {
    const m = String(text).match(/^(.*?“([^”]+)”)\s+([A-ZÇĞİÖŞÜ].*)$/);
    if (!m || m[2].trim().split(/\s+/).length < 3 || /[çğıöşüÇĞİÖŞÜ]/.test(m[2])) return rich(text);   // an English sentence of three words or more
    return '<span class="soru-quote">' + rich(m[1]) + '</span><span class="soru-ask">' + rich(m[3]) + '</span>';
  };
  const el = (tag, className, html) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const starRow = (n, label = true) => '<span class="soru-stars"' + (label ? ' aria-label="' + n + ' / 3 yıldız"' : ' aria-hidden="true"') + '>' +
    [0, 1, 2].map(i => '<i class="' + (i < n ? 'won' : '') + '">★</i>').join('') + '</span>';
  function minutes(ms) {
    const s = Math.round(ms / 1000);
    return (s >= 60 ? Math.floor(s / 60) + ' dk ' : '') + (s % 60) + ' sn';
  }
  // Questions the child missed come first, then the ones never seen, then the ones not yet
  // learned, and the learned ones last, least seen first.
  function pick(list, count) {
    const rank = q => { const row = progress.soru[q.id]; return !row ? 1 : row.h ? 0 : !learned(q) ? 2 : 3 + row.g / 1000; };
    return shuffled(shuffled(list).sort((x, y) => rank(x) - rank(y)).slice(0, count));
  }
  // Questions modelled on a Tevfik İleri entrance exam say which year's exam it was.
  const yearNote = q => q.y ? '<p class="soru-year"><span aria-hidden="true">📝</span> Benzeri Tevfik İleri ' + q.y + ' sınavında soruldu.</p>' : '';
  const prepare = q => ({ q, order: shuffled([0, 1, 2, 3]), answer: null, gone: [] });

  /* ---------- English voice (ses) ---------- */
  const speech = ses && window.speechSynthesis ? window.speechSynthesis : null;
  const voiceFor = () => {
    const voices = speech.getVoices(), lang = v => v.lang.replace('_', '-').toLowerCase();
    return voices.find(v => lang(v) === ses.toLowerCase()) || voices.find(v => lang(v).startsWith('en')) || null;
  };
  // Voices load late on some browsers: while the list is still empty, the device is given the benefit of the doubt.
  const canSpeak = text => (text && typeof ingilizceSes !== 'undefined' && ingilizceSes.kayitli(text)) || (!!speech && (!speech.getVoices().length || !!voiceFor()));
  // The natural recordings of core/js/ingilizce-oyunlari.js when there are any, the device's voice otherwise.
  function say(text, slow) {
    if (!ses || !text) return Promise.resolve();
    if (typeof ingilizceSes !== 'undefined') return ingilizceSes.say(text, slow);
    if (!speech) return Promise.resolve();
    speech.cancel();
    const line = new SpeechSynthesisUtterance(text);
    line.lang = ses;
    const voice = voiceFor();
    if (voice) line.voice = voice;
    line.rate = slow ? 0.5 : 0.82;   // 🐢: slowly, for a word that is hard to catch
    speech.speak(line);
  }
  speech?.getVoices();
  const bare = text => String(text).toLocaleLowerCase('en').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  // The English word may be said before the answer only when it is not one of the options (it would give the answer away).
  const sayFirst = q => !!(ses && q.k && (q.d || !q.a.some(option => bare(option).includes(bare(q.k[0])))));
  const sayButton = (q, big) => '<span class="soru-says"><button type="button" class="soru-say' + (big ? ' big' : '') + '" data-say aria-label="Dinle: İngilizce söylenişi" title="Dinle">🔊</button>' +
    '<button type="button" class="soru-say slow" data-say-slow aria-label="Yavaş dinle" title="Yavaş dinle">🐢</button></span>';
  const bindSay = (root, text) => {
    root.querySelectorAll('[data-say]').forEach(button => { button.onclick = () => { say(text); fx.bump(button, 'show'); }; });
    root.querySelectorAll('[data-say-slow]').forEach(button => { button.onclick = () => { say(text, true); fx.bump(button, 'show'); }; });
  };

  /* ---------- The bay on Keşif Haritası ---------- */
  // A unit's questions in the book's order (their pages, kitapSirasi), cut into three to six stations of about twenty.
  const inOrder = new Map();
  const bookOrder = stop => {
    if (!inOrder.has(stop)) inOrder.set(stop, stop.sorular.map((q, n) => [q, n]).sort((a, b) => (a[0].sayfa ?? 0) - (b[0].sayfa ?? 0) || a[1] - b[1]).map(x => x[0]));
    return inOrder.get(stop);
  };
  // İngilizce Koyu (a bay played as games): every unit is four weeks, Hafta 1-4, opened one after another
  const haftali = !!oyunlar;
  // the weeks finished: those whose round was finished, and at least the first weeks already learned before weeks came
  const doneParts = stop => {
    let learnedWeeks = 0;
    for (const part of partsOf(stop)) { if (partLearned(part) < part.length) break; learnedWeeks++; }
    return Math.max((ist(stop) ? progress.istasyon : progress.bolum)?.[stop.id] || 0, learnedWeeks);
  };
  const partOpen = (k, p) => !haftali || devAll() || p <= doneParts(stops[k]);
  const partName = (p, stop) => ist(stop)?.[p] ? ist(stop)[p].baslik : haftali ? 'Hafta ' + (p + 1) : (p + 1) + '. durak';
  const partsOf = stop => {
    // a unit cut into stations by topic (istasyonlar.js), each station its own questions
    if (ist(stop)) return ist(stop).map(s => s.sorular.map(n => stop.sorular[n]).filter(Boolean));
    const list = bookOrder(stop), n = list.length, count = haftali ? 4 : Math.max(3, Math.min(6, Math.round(n / 20)));
    return Array.from({ length: count }, (_, p) => list.slice(Math.floor(p * n / count), Math.floor((p + 1) * n / count)));
  };
  const partLearned = part => part.filter(q => learned(q)).length;
  const firstPart = stop => Math.max(0, partsOf(stop).findIndex(part => partLearned(part) < part.length));
  function nextStep() {
    const at = k => ({ kind: 'durak', k, p: haftali ? Math.min(doneParts(stops[k]), partsOf(stops[k]).length - 1) : firstPart(stops[k]) });
    const fresh = stops.findIndex(stop => !stop.ekstra && !starsOf(stop));
    if (fresh >= 0) return { ...at(fresh), label: stops[fresh].simge + ' ' + stops[fresh].ad };
    if (!progress.deneme.sayi) return { kind: 'deneme', label: '🏆 Deneme Sınavı' };
    const extra = stops.findIndex(stop => stop.ekstra && !starsOf(stop));
    if (extra >= 0) return { ...at(extra), label: stops[extra].simge + ' ' + stops[extra].ad };
    if (missed().length) return { kind: 'tekrar', label: '🔁 Tekrar Kutusu' };
    // the open stop with the largest share of questions still to learn
    const todo = stops.map((stop, k) => ({ k, left: stop.sorular.length - learnedIn(stop), share: 1 - learnedIn(stop) / stop.sorular.length }))
      .filter(s => s.left > 0 && stopOpen(s.k)).sort((a, b) => b.share - a.share)[0];
    if (todo) return { ...at(todo.k), label: stops[todo.k].simge + ' ' + stops[todo.k].ad + ' · ' + todo.left + ' soru kaldı' };
    const better = stops.findIndex(stop => starsOf(stop) < 3);
    if (better >= 0) return { ...at(better), label: stops[better].simge + ' ' + stops[better].ad + ' · 3 yıldız için' };
    return { kind: 'deneme', label: '🏆 Deneme Sınavı · rekorunu geliştir' };
  }
  function go(step) {
    if (step.kind === 'durak') startStop(step.k, step.p);
    else if (step.kind === 'deneme') startExam();
    else startReview();
  }
  const EXAM_ISLE = stops.length; // the mock exam comes after the stops
  const HUNT_ISLE = yanlisAvi ? stops.length + 1 : -1; // Yanlış Avı, after the exam
  const YETER = 6, CIFT = 6;          // wrong answers that open Yanlış Avı; pairs in one of its rounds
  const huntCount = () => missed().filter(q => q.k).length;
  const huntOpen = () => yanlisAvi && huntCount() >= YETER;
  const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  kesifHaritasi.koy({
    id: kod, kart: kod + '-card', ad: koy, lead, simge, tema,
    hazirla() { progress = load(activeProfile.id); },
    yakinda: () => !hazir,
    adalar() {
      if (!hazir) return [{ ad: 'Yakında', simge: '🚧', not: 'Sorular hazırlanıyor', durum: 'locked' }];
      const step = nextStep();
      return [...stops.map((stop, k) => ({ ad: stop.ad, simge: stop.simge, not: starText(starsOf(stop)) + ' ' + learnedIn(stop) + '/' + stop.sorular.length,
        durum: !stopOpen(k) ? 'locked' : stopMastered(stop) ? 'done' : step.kind === 'durak' && step.k === k ? 'now' : 'open' })),
      { ad: 'Deneme Sınavı', simge: '🏆', not: progress.deneme.en === null ? EXAM + ' soru' : 'En iyi ' + progress.deneme.en + '/' + EXAM,
        durum: !examOpen() ? 'locked' : step.kind === 'deneme' ? 'now' : progress.deneme.sayi ? 'done' : 'open' },
      ...(yanlisAvi ? [{ ad: 'Yanlış Avı', simge: '🎯', not: huntCount() ? huntCount() + ' yanlış' : 'Yanlış yok',
        durum: huntOpen() ? 'open' : learnedAll() === byId.size ? 'done' : 'locked' }] : [])];
    },
    duraklar(k) {
      if (k === HUNT_ISLE) return [{ simge: '🧩', ad: 'Eşleştir', etiket: 'Yanlış Avı: Eşleştir', not: huntCount() + ' yanlış', durum: 'now' },
        { simge: '🎈', ad: 'Balon Patlat', etiket: 'Yanlış Avı: Balon Patlat', not: huntCount() + ' yanlış', durum: 'open' }];
      if (k === EXAM_ISLE) return [{ simge: '🏆', ad: 'Deneme', etiket: 'Deneme Sınavı', not: progress.deneme.en === null ? EXAM + ' soru' : 'En iyi ' + progress.deneme.en + ' / ' + EXAM,
        durum: progress.deneme.sayi ? 'done' : 'now' }];
      const parts = partsOf(stops[k]);
      const now = haftali ? Math.min(doneParts(stops[k]), parts.length - 1) : firstPart(stops[k]);
      return parts.map((part, p) => {
        const n = partLearned(part);
        // a week is done once its round has been finished; the next week opens then
        const done = haftali ? p < doneParts(stops[k]) : n === part.length;
        const s = ist(stops[k])?.[p];
        return { simge: s ? s.simge : String(p + 1), resim: s?.resim, ad: s ? s.ad : partName(p), etiket: stops[k].ad + ', ' + partName(p, stops[k]), not: n + ' / ' + part.length,
          durum: !partOpen(k, p) ? 'locked' : done ? 'done' : p === now ? 'now' : 'open',
          kilit: 'Önce ' + partName(p - 1, stops[k]) + ' bitmeli' };
      });
    },
    ac: (k, p) => k === HUNT_ISLE ? (p === 1 ? startBalloons() : startHunt()) : k === EXAM_ISLE ? startExam() : startStop(k, p),
    kilit: k => !hazir ? 'Bu koyun soruları hazırlanıyor. Yakında!' : k === HUNT_ISLE ?
      'Yanlış Avı, Tekrar Kutusu’nda en az ' + YETER + ' yanlış birikince açılır (şimdi ' + huntCount() + ')' : lockText,
    panel(level, k) {
      const { sonraki, kutu, dugme, olcer } = kesifHaritasi.parca;
      const parts = [];
      if (!hazir) return [kutu('<strong>🚧 Yakında</strong><small>' + koy + '’nun soruları hazırlanıyor. Hazır olunca adalar burada açılacak.</small>')];
      const wrong = missed().length;
      const review = () => {
        if (!wrong) return null;
        const box = kutu('<div class="kh-row"><span aria-hidden="true">🔁</span><div><strong>Tekrar Kutusu</strong><small>' + wrong +
          ' soruyu yanlış cevapladın. Doğrusunu bulunca kutudan çıkar.</small></div></div>');
        box.querySelector('.kh-row').append(dugme('Tekrar et', startReview));
        if (huntOpen()) {
          const row = el('div', 'kh-row', '<span aria-hidden="true">🎯</span><div><strong>Yanlış Avı</strong><small>Yanlış yaptığın kelimeleri anlamlarıyla eşleştir.</small></div>');
          row.append(dugme('🧩 Eşleştir', startHunt), dugme('🎈 Balon', startBalloons));
          box.append(row);
        }
        return box;
      };
      if (level === 'ada' && k === HUNT_ISLE) {
        parts.push(sonraki('🧩', 'Yanlış Avı', 'Yanlışlarını eşleştir', startHunt));
        parts.push(kutu('<strong>🎯 Yanlış Avı</strong><small>Yalnızca yanlış yaptığın kelimeler ve kalıplar gelir. 🧩 Eşleştir: İngilizce kartı Türkçesiyle eşleştir; ' +
          'İngilizce karta dokununca söylenişini duyarsın. 🎈 Balon Patlat: duyduğun kelimenin balonunu, uçup gitmeden patlat. ' +
          'İlk denemede bulduğun kelime Tekrar Kutusu’ndan çıkar.</small>' +
          '<small>Tekrar Kutusu’nda ' + huntCount() + ' yanlış var; oyun en az ' + YETER + ' yanlışla açılır.</small>'));
        return parts;
      }
      if (level === 'ada' && k === EXAM_ISLE) {
        parts.push(sonraki('🏆', 'Hazine Zirvesi', 'Deneme Sınavı’na gir', startExam));
        parts.push(kutu('<strong>Deneme Sınavı</strong><small>Gerçek sınav gibi ' + EXAM + ' soru, bütün konulardan karışık. Cevaplar sınavın sonunda görünür.</small>' +
          '<small>' + (progress.deneme.en === null ? 'Henüz girmedin.' : 'En iyi: ' + progress.deneme.en + ' / ' + EXAM + ' · ' + progress.deneme.sayi + ' deneme') + '</small>'));
        return parts;
      }
      if (level === 'ada') {
        const stop = stops[k], p = firstPart(stop), n = learnedIn(stop), all = stop.sorular.length;
        const q = haftali ? Math.min(doneParts(stop), partsOf(stop).length - 1) : p;
        parts.push(sonraki('▶', stopMastered(stop) ? 'Yeniden oyna' : 'Sıradaki', stop.ad + ' · ' + (ist(stop) ? partName(q, stop) : (q + 1) + '. durak'), () => startStop(k, q)));
        parts.push(kutu('<strong>' + stop.simge + ' ' + stop.ad + ' <span class="soru-stars" aria-label="' + starsOf(stop) + ' / 3 yıldız">' + starRow(starsOf(stop), false) + '</span></strong>' +
          '<small>' + stop.unite + ' · ' + stop.konu + (stop.kitap ? ' · 📘 Ders kitabı ' + stop.kitap : '') + '</small>' + olcer(n / all) +
          '<small>' + (n === all ? '✅ Bütün soruları öğrendin' : '📗 ' + n + ' / ' + all + ' soru öğrenildi') + (ist(stop) ? '. Ünite ' + ist(stop).length + ' istasyona ayrılır, her biri bir konunun kelimeleri; ' : '. Duraklar ünitenin sorularını kitaptaki sırayla böler; ') +
          'her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var.</small>'));
        // a unit cut into stations: every open station's Keşif Kartı, to see its words again
        if (ist(stop) && oyunlar) {
          const words = kutu('<strong>📖 Kelimeleri Gör</strong><small>İstasyonun kelimelerini resim ve sesle yeniden gör.</small><div class="kh-row kh-kelimeler"></div>');
          const row = words.querySelector('.kh-kelimeler');
          ist(stop).forEach((s, n) => { if (partOpen(k, n)) row.append(dugme(s.simge + ' ' + s.ad, () => tanit(k, n, null))); });
          parts.push(words);
        }
        const box = review();
        if (box) parts.push(box);
        return parts;
      }
      const step = nextStep(), total = learnedAll();
      parts.push(sonraki('▶', 'Sıradaki', step.label, () => go(step)));
      parts.push(kutu('<strong>' + (total === byId.size ? '🏅 Bütün ' + byId.size + ' soruyu öğrendin!' : '📗 ' + total + ' / ' + byId.size + ' soru öğrenildi') +
        ' · ⭐ ' + starTotal() + ' / ' + maxStars + '</strong>' + olcer(total / byId.size) +
        '<small>Bir soru iki ayrı turda doğru bilinince öğrenilmiş sayılır. Bir ada, bütün soruları öğrenilince biter. ' +
        'Deneme Sınavı' + (ekstra ? ' ve ' + ekstra.simge + ' ' + ekstra.ad : '') + ', ' + lockText.charAt(0).toLocaleLowerCase('tr') + lockText.slice(1) + '.</small>'));
      const box = review();
      if (box) parts.push(box);
      if (kaynak) parts.push(kutu('<small>' + kaynak + '</small>'));
      return parts;
    }
  });

  /* ---------- Rounds ---------- */
  function begin(kind, stop, questions) {
    run = { kind, stop, items: questions.map(prepare), turn: 0, right: 0, hearts: HEARTS, joker: kind === 'durak',
      streak: 0, bestStreak: 0, started: performance.now(), learnedBefore: learnedAll(),
      stopLearnedBefore: stop ? learnedIn(stop) : 0 };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = kind;
    playCue('start');
    ask();
  }
  // A round on station p of stop k (the whole stop without p).
  function startStop(k, p) {
    if (!stopOpen(k) || (Number.isInteger(p) && !partOpen(k, p))) return;
    const part = Number.isInteger(p) ? partsOf(stops[k])[p] : stops[k].sorular;
    if (oyunlar) {
      const play = () => startGame('durak', stops[k], pick(part, ROUND), p);
      // a station's words come first, the first time it is opened (Keşif Kartı)
      if (Number.isInteger(p) && ist(stops[k])?.[p] && !progress.tanitim?.[stops[k].id + ':' + p]) return tanit(k, p, play);
      return play();
    }
    begin('durak', stops[k], pick(part, ROUND));
    run.part = p;
  }
  function startReview() {
    const list = missed();
    if (!list.length) return;
    if (oyunlar) return startGame('tekrar', null, shuffled(list).slice(0, ROUND));
    begin('tekrar', null, shuffled(list).slice(0, ROUND));
  }
  // İngilizce Koyu: the round's questions played as games (core/js/ingilizce-oyunlari.js). Every game answers its own
  // questions, so learning, stars, Tekrar Kutusu and the rewards work as in a question round; finish() ends it.
  // a question about the word itself: heard, its meaning asked, or the word to choose among the options
  const wordQuestion = q => !!q.k && (q.d === 1 || q.s === 'Dinle ve doğru anlamı seç: “' + q.k[0] + '”' || q.a.some(a => bare(a) === bare(q.k[0])));
  // the picture of the island's word named in a sentence ("Is it a classroom?" → 🟩🪑), the longest name first
  const resimBul = text => {
    const t = ' ' + bare(text) + ' ';
    return pictureWords().filter(w => t.includes(' ' + bare(w.en) + ' ')).sort((a, b) => b.en.length - a.en.length)[0]?.emo || '';
  };
  const asItem = q => ({ q, en: q.k[0], tr: q.k[1], emo: q.k[2] || '', word: wordQuestion(q) });
  function startGame(kind, stop, questions, part) {
    questions = questions.filter(q => q.k);
    run = { kind, stop, part, items: questions.map(prepare), turn: 0, right: 0, hearts: HEARTS, streak: 0, bestStreak: 0,
      started: performance.now(), learnedBefore: learnedAll(), stopLearnedBefore: stop ? learnedIn(stop) : 0 };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = 'oyun';
    dialog.dataset.mood = '';
    playCue('start');
    const mine = run;
    run.cancel = ingilizceOyunlari.tur({
      stage: byKey('stage'), items: questions.map(asItem), havuz: pictureWords(), ayar: oyunlar, maskot: activeProfile?.icon, rich, stem, resimBul, secenek,
      sonuc: (item, ok) => {
        if (run !== mine) return;
        note(item.q, ok);
        save();
        if (ok) { run.right++; run.streak++; run.bestStreak = Math.max(run.bestStreak, run.streak); } else run.streak = 0;
      },
      bitir: () => { if (run === mine) finish(); }
    });
  }
  // Keşif Kartı: the words of station p of stop k, one by one (picture, English said, Turkish meaning). Then `sonra`
  // (the round), or back to the map when it was opened from 📖 Kelimeleri Gör. Seen once, the station's round starts at once.
  function tanit(k, p, sonra) {
    const stop = stops[k], s = ist(stop)[p], key = stop.id + ':' + p;
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = 'oyun';
    dialog.dataset.mood = '';
    const mine = run = { kind: 'tanitim' };
    run.cancel = ingilizceOyunlari.kesif({
      stage: byKey('stage'), maskot: activeProfile?.icon, baslik: s.simge + ' ' + s.baslik,
      kelimeler: s.kelimeler.map(([en, tr, emo]) => ({ en, tr, emo })), son: sonra ? 'Oyuna Başla! 🚀' : '✓ Tamam',
      bitti: () => {
        if (run !== mine) return;
        (progress.tanitim ||= {})[key] = 1;
        save();
        if (sonra) sonra(); else closeGame();
      }
    });
  }
  function startExam() {
    if (!examOpen()) return;
    // As many questions from each stop as its `deneme` says, topped up from the units.
    // 🔍 Gizli Kelimeler questions (g) are played only on their picture, in the unit's rounds: never in the exam
    const examable = list => list.filter(q => !q.g);
    const chosen = stops.flatMap(stop => pick(examable(stop.sorular), stop.deneme || 0));
    const rest = shuffled(examable(units.flatMap(stop => stop.sorular)).filter(q => !chosen.includes(q)));
    begin('deneme', null, shuffled([...chosen, ...rest].slice(0, EXAM)));
  }

  const where = () => run.kind === 'deneme' ? '🏆 Deneme Sınavı' : run.kind === 'tekrar' ? '🔁 Tekrar Kutusu' : run.kind === 'avi' ? '🎯 Yanlış Avı' :
    run.kind === 'park' ? '🎡 Oyun Parkı' :
    run.stop.simge + ' ' + run.stop.ad;
  function dots() {
    return '<ol class="dots soru-dots" aria-hidden="true">' + run.items.map((item, n) =>
      '<li class="' + (n === run.turn && item.answer === null ? 'now' : item.answer === null ? '' :
        run.kind === 'deneme' ? 'done' : item.answer === 0 && !item.tried ? 'done' : 'miss') + '"></li>').join('') + '</ol>';
  }
  const heartsHtml = () => '<span class="soru-hearts" aria-label="' + run.hearts + ' kalp kaldı">' +
    Array.from({ length: HEARTS }, (_, i) => '<i class="' + (i < run.hearts ? '' : 'lost') + '">' + (i < run.hearts ? '❤️' : '🤍') + '</i>').join('') + '</span>';
  const topBar = () => '<div class="soru-top"><span class="soru-where">' + where() + '</span>' + (run.kind === 'durak' ? heartsHtml() : '') + '</div>';

  function ask() {
    const item = run.items[run.turn];
    const q = item.q;
    const total = run.items.length;
    const stage = byKey('stage');
    dialog.dataset.mood = '';
    // İngilizce Koyu: a dialogue scene, the word's picture or card above the question (ingilizceOyunlari.sahne)
    const sc = oyunlar ? ingilizceOyunlari.sahne(q, rich, resimBul) : null;
    // a dialogue is heard only up to its question: the answer is what the child chooses
    const heard = q.k ? (ingilizceSes.diyalog(q.k[0])?.[0] || q.k[0]) : '';
    stage.innerHTML = topBar() + dots() + '<p class="soru-step">Soru ' + (run.turn + 1) + ' / ' + total +
      (run.kind === 'deneme' ? '' : ' · <span>' + (run.kind === 'tekrar' ? q.stop.simge + ' ' + q.stop.ad : q.stop.konu) + '</span>') +
      (run.streak >= 3 ? '<span class="soru-streak" title="Üst üste doğru">🔥 ' + run.streak + '</span>' : '') + '</p>' +
      (q.m ? '<div class="soru-passage">' + rich(q.m) + '</div>' : '') + (sc ? sc.gorsel : '') +
      '<h2 id="' + kod + '-prompt" class="soru-prompt" tabindex="-1">' + (sc ? sc.metin : stem(q.s)) + (sayFirst(q) && !q.d ? ' ' + sayButton(q) : '') + '</h2>' +
      // a listening question: the word is only heard, and written only when the device has no English voice
      (sayFirst(q) && q.d ? '<div class="soru-listen">' + sayButton(q, true) + (canSpeak(q.k[0]) ? '' : '<span class="soru-heard">“' + escape(q.k[0]) + '”</span>') + '</div>' : '');
    if (q.k) bindSay(stage, heard);
    if (sayFirst(q)) setTimeout(() => { if (run && run.items[run.turn] === item && item.answer === null) say(heard); }, 350);
    const grid = el('div', 'soru-options');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', kod + '-prompt');
    item.order.forEach((choice, n) => {
      const button = el('button', 'soru-option', '<b aria-hidden="true">' + letters[n] + '</b><span>' + secenek(q.a[choice]) + '</span>');
      button.dataset.cue = '';
      button.dataset.choice = choice;
      button.setAttribute('aria-label', letters[n] + ') ' + q.a[choice].replace(/\*/g, ''));
      button.onclick = () => run.kind === 'deneme' ? mark(button) : answer(button);
      grid.append(button);
    });
    stage.append(grid);

    const tools = el('div', 'soru-tools');
    if (run.kind === 'durak') {
      const joker = el('button', 'soru-joker', '<span aria-hidden="true">½</span> Yarı yarıya');
      joker.id = kod + '-joker';
      joker.disabled = !run.joker;
      joker.title = run.joker ? 'İki yanlış seçeneği sil (turda bir kez)' : 'Jokerini bu turda kullandın';
      joker.onclick = useJoker;
      tools.append(joker);
    }
    const feedback = el('div', 'soru-feedback');
    feedback.id = kod + '-feedback';
    feedback.setAttribute('role', 'status');
    const next = el('button', 'primary soru-next-q');
    next.id = kod + '-continue';
    next.hidden = run.kind !== 'deneme';
    if (run.kind === 'deneme') {
      next.disabled = true;
      next.textContent = run.turn === total - 1 ? '✓ Sınavı bitir' : 'İşaretle ve geç ›';
      next.onclick = confirmMark;
    }
    stage.append(tools, feedback, next);
    byKey('prompt').focus();
  }

  function useJoker() {
    if (!run.joker) return;
    const item = run.items[run.turn];
    if (item.answer !== null) return;
    run.joker = false;
    const wrong = shuffled([1, 2, 3]).slice(0, 2);
    item.gone = wrong;
    for (const button of byKey('stage').querySelectorAll('.soru-option')) {
      if (wrong.includes(Number(button.dataset.choice))) { button.disabled = true; button.classList.add('gone'); }
    }
    byKey('joker').disabled = true;
    playCue('island');
    fx.burst(byKey('joker'), { symbols: ['½', '✦', '★'], count: 8, spread: 60 });
  }

  // Practice rounds: the answer is checked at once and explained.
  function answer(button) {
    const item = run.items[run.turn];
    if (item.answer !== null) return;
    const q = item.q;
    const choice = Number(button.dataset.choice);
    const right = choice === 0;
    // İkinci şans: the first wrong answer only fades and the child tries again. The question counts as missed all the
    // same (it goes to Tekrar Kutusu and costs a heart); a last heart is not risked on it.
    if (ikinciSans && !right && !item.tried && !(run.kind === 'durak' && run.hearts <= 1)) {
      item.tried = true;
      note(q, false);
      save();
      run.streak = 0;
      if (run.kind === 'durak') {
        run.hearts--;
        byKey('stage').querySelector('.soru-hearts').outerHTML = heartsHtml();
        fx.bump(byKey('stage').querySelector('.soru-hearts'), 'denied');
      }
      button.disabled = true;
      button.classList.add('wrong', 'gone');
      fx.bump(button, 'missed');
      playCue('retry');
      dialog.dataset.mood = 'bad';
      const box = byKey('feedback');
      box.className = 'soru-feedback bad';
      box.innerHTML = '<strong>🤔 Olmadı, bir daha dene!</strong>' + (sayFirst(q) ? '<p>🔊 ya da 🐢 ile yeniden dinleyebilirsin.</p>' : '');
      if (sayFirst(q)) setTimeout(() => say(q.k[0], true), 600);
      return;
    }
    item.answer = choice;
    // a right answer at the second try is not a right answer: the question stays in Tekrar Kutusu
    if (!(item.tried && right)) note(q, right);
    save();
    const buttons = byKey('stage').querySelectorAll('.soru-option');
    for (const other of buttons) other.disabled = true;
    const correctButton = [...buttons].find(b => b.dataset.choice === '0');
    correctButton.classList.add('right');
    byKey('joker')?.setAttribute('disabled', '');
    const feedback = byKey('feedback');
    const letter = letters[item.order.indexOf(0)];
    if (right && item.tried) {
      playCue('correct');
      fx.burst(button, { symbols: simgeler, count: 8 });
      dialog.dataset.mood = 'good';
      feedback.className = 'soru-feedback good';
      feedback.innerHTML = '<strong>✓ Buldun! İkinci denemede doğru.</strong>';
    } else if (right) {
      run.right++;
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      playCue('correct');
      fx.burst(button, { symbols: simgeler });
      dialog.dataset.mood = 'good';
      feedback.className = 'soru-feedback good';
      feedback.innerHTML = '<strong>✓ Doğru! ' + praise[Math.floor(Math.random() * praise.length)] +
        (run.streak >= 3 ? ' <span class="soru-fire">🔥 ' + run.streak + ' doğru üst üste!</span>' : '') + '</strong>';
    } else {
      run.streak = 0;
      if (run.kind === 'durak' && !item.tried) run.hearts--;
      playCue('retry');
      button.classList.add('wrong');
      fx.bump(button, 'missed');
      dialog.dataset.mood = 'bad';
      feedback.className = 'soru-feedback bad';
      feedback.innerHTML = '<strong>✗ Doğru cevap: ' + letter + ') ' + rich(q.a[0]) + '</strong>';
      const hearts = byKey('stage').querySelector('.soru-hearts');
      if (hearts) {
        hearts.outerHTML = heartsHtml();
        fx.bump(byKey('stage').querySelector('.soru-hearts'), 'denied');
      }
    }
    feedback.insertAdjacentHTML('beforeend', '<p><span aria-hidden="true">💡</span> <b>Biliyor muydun?</b> ' + rich(q.b) + '</p>' + yearNote(q));
    if (ses && q.k) {
      // after the answer the English is always heard (and written, for a listening question)
      feedback.insertAdjacentHTML('beforeend', '<p class="soru-said">' + sayButton(q) + ' <span lang="en">' + escape(q.k[0]) + '</span> · ' + escape(q.k[1]) + '</p>');
      bindSay(feedback, q.k[0]);
      run.sayLater = setTimeout(() => say(q.k[0]), right ? 250 : 500);
    }
    byKey('stage').querySelector('.soru-dots').outerHTML = dots();
    const next = byKey('continue');
    const over = run.kind === 'durak' && run.hearts === 0;
    const last = run.turn === run.items.length - 1;
    next.hidden = false;
    next.textContent = over ? 'Sonucu gör' : last ? 'Sonucu gör' : 'Sıradaki soru ›';
    // nothing of this question is heard over the next one
    next.onclick = () => { clearTimeout(run.sayLater); if (typeof ingilizceSes !== 'undefined') ingilizceSes.stop(); if (over || last) finish(); else { run.turn++; ask(); } };
    next.focus({ preventScroll: true });
    feedback.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // The exam: choose, change your mind if you like, then confirm. Results come at the end.
  function mark(button) {
    for (const other of byKey('stage').querySelectorAll('.soru-option')) {
      other.classList.toggle('picked', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    }
    byKey('continue').disabled = false;
    playCue('key');
  }
  function confirmMark() {
    const picked = byKey('stage').querySelector('.soru-option.picked');
    if (!picked) return;
    const item = run.items[run.turn];
    item.answer = Number(picked.dataset.choice);
    if (item.answer === 0) run.right++;
    note(item.q, item.answer === 0);
    save();
    playCue('tap');
    run.turn++;
    if (run.turn === run.items.length) finish(); else ask();
  }

  /* ---------- Results ---------- */
  function result(html, mood) {
    dialog.dataset.mood = mood;
    byKey('stage').innerHTML = html;
    byKey('result-title')?.focus();
  }
  function buttons(...list) {
    const row = el('div', 'soru-result-actions');
    for (const [label, action, quiet] of list) {
      const button = el('button', quiet ? 'soru-action quiet' : 'primary', label);
      button.onclick = action;
      row.append(button);
    }
    byKey('stage').append(row);
    row.querySelector('button').focus({ preventScroll: true });
  }
  // What the round added to the questions learned, and the island-wide milestone if reached.
  function learnedNote() {
    const now = learnedAll();
    const gained = now - run.learnedBefore;
    let html = '';
    if (run.stop) {
      const n = learnedIn(run.stop), all = run.stop.sorular.length;
      if (n === all && run.stopLearnedBefore < all) html += '<p class="soru-unlock">✅ ' + run.stop.ad + ' adasının bütün sorularını öğrendin!</p>';
      html += '<p class="soru-learn-line">📗 ' + (gained > 0 ? '+' + gained + ' yeni soru öğrendin · ' : '') + 'Bu adada ' + n + ' / ' + all + ' öğrenildi</p>';
    } else html += '<p class="soru-learn-line">📗 ' + (gained > 0 ? '+' + gained + ' yeni soru öğrendin · ' : '') + 'Koyda ' + now + ' / ' + byId.size + ' öğrenildi</p>';
    if (now === byId.size && run.learnedBefore < byId.size) html += '<p class="soru-unlock">🏅 Koyun bütün ' + byId.size + ' sorusunu öğrendin! Ders kitabının bütün konularını bitirdin.</p>';
    return html;
  }
  function finish() {
    if (run.kind === 'deneme') return finishExam();
    const total = run.items.length;
    const storage = learnedNote() + (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : '');
    if (run.kind === 'tekrar') {
      const left = missed().length;
      // a Tekrar Kutusu round answered without a mistake earns a reward for the tank
      const prize = run.right === total ? akvaryum.odul({ neden: ad + ' · Tekrar Kutusu' }) : null;
      result('<div class="soru-prize" aria-hidden="true">' + (run.right === total ? '🌟' : '🔁') + '</div>' +
        '<h2 id="' + kod + '-result-title" tabindex="-1">' + (run.right === total ? 'Hepsini düzelttin!' : 'Güzel tekrar!') + '</h2>' +
        '<p class="soru-score-big"><b>' + run.right + '</b> / ' + total + ' doğru</p><p>' +
        (left ? 'Tekrar Kutusu’nda ' + left + ' soru kaldı.' : 'Tekrar Kutusu boşaldı. 🎉') + '</p>' +
        (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Bir turu hatasız bitirince akvaryumuna yeni bir balık ya da süs gelir.')) + storage, 'win');
      playCue(run.right === total ? 'island' : 'correct');
      if (run.right === total) fx.confetti(dialog, { count: 120 });
      buttons(...(left ? [['🔁 Bir tur daha', startReview]] : []), ['Haritaya dön', closeGame, left > 0]);
      return;
    }
    const stop = run.stop;
    const k = stops.indexOf(stop), part = run.part;
    if (run.hearts === 0) {
      result(topBar() + '<div class="soru-prize" aria-hidden="true">💔</div><h2 id="' + kod + '-result-title" tabindex="-1">Kalplerin bitti!</h2>' +
        '<p>' + (run.turn + 1) + ' sorudan ' + run.right + ' tanesini bildin. Yanlış yaptığın sorular Tekrar Kutusu’na eklendi; ' +
        '“Biliyor muydun?” notlarını hatırlayarak yeniden dene.</p>' + akvaryum.ipucu('Turu bitirince akvaryumuna yeni bir balık ya da süs gelecek.') + storage, 'bad');
      playCue('oops');
      buttons(['↻ Tekrar dene', () => startStop(k, part)], ['Haritaya dön', closeGame, true]);
      return;
    }
    const stars = run.right === total ? 3 : run.right === total - 1 ? 2 : 1;
    const before = starsOf(stop);
    const firstTime = before === 0;
    if (stars > before) progress.yildiz[stop.id] = stars;
    // İngilizce Koyu: a finished round finishes its week and opens the next one
    if (haftali && Number.isInteger(part) && doneParts(stop) < part + 1) (ist(stop) ? (progress.istasyon ||= {}) : (progress.bolum ||= {}))[stop.id] = part + 1;
    save();
    const all = learnedAll() === byId.size;
    // A finished round brings a reward to the tank while the stop still has questions to learn; learning
    // every question of the stop brings one more, once.
    const prizes = [];
    if (run.stopLearnedBefore < stop.sorular.length) prizes.push(akvaryum.odul({ neden: ad + ' · ' + stop.ad }));
    if (stopMastered(stop) && run.stopLearnedBefore < stop.sorular.length) prizes.push(akvaryum.odul({ anahtar: kod + ':' + stop.id + ':tamam', neden: ad + ' · ' + stop.ad + ' bitti' }));
    const examNow = firstTime && !stop.ekstra && unitsLeft() === 0;
    const left = unitsLeft();
    let text = run.right + ' / ' + total + ' doğru';
    if (run.bestStreak >= 3) text += ' · en uzun seri 🔥 ' + run.bestStreak;
    let extra = stars < 3 ? (oyunlar ? '<p>3 yıldız için bütün oyunları ilk denemede bil!</p>' : '<p>3 yıldız için turu hatasız bitir. Jokerini akıllıca kullan!</p>') :
      !stopMastered(stop) ? '<p>Bu adanın bütün sorularını öğrenmek için tekrar oyna; her turda yeni sorular gelir.</p>' : '';
    if (firstTime && !stop.ekstra && left) extra += '<p class="soru-unlock">Deneme Sınavı’na ' + left + ' ünite kaldı.</p>';
    if (examNow) extra += '<p class="soru-unlock">🔓 <b>Deneme Sınavı</b>' + (ekstra ? ' ve <b>' + ekstra.simge + ' ' + ekstra.ad + '</b>' : '') +
      ' açıldı! Gerçek sınav gibi ' + EXAM + ' soru seni bekliyor.</p>';
    result('<div class="soru-prize" aria-hidden="true">' + stop.simge + '</div>' +
      '<h2 id="' + kod + '-result-title" tabindex="-1">' + (stars > before && !firstTime ? 'Yeni rekor!' : stars === 3 ? 'Mükemmel!' : 'Tur tamamlandı!') + '</h2>' +
      '<div class="soru-won">' + starRow(stars) + '</div><p class="soru-score-big">' + text + '</p>' + extra + akvaryum.kart(prizes) + storage, 'win');
    playCue(all ? 'victory' : 'island');
    fx.confetti(dialog, { count: stars === 3 ? 180 : 110 });
    fx.burst(byKey('stage').querySelector('.soru-won'), { count: 12, spread: 100 });
    // after a round: this one again, the map, or the next part of the book (never straight to the exam)
    const later = nearPart(k, part, 1);
    buttons(...(later ? [['Sonraki ' + (haftali ? 'bölüm' : 'durak') + ': ' + later.label + ' ›', () => startStop(later.k, later.p)]] : []),
      ['↻ Tekrar oyna', () => startStop(k, part), !!later], ['🗺️ Harita', closeGame, true]);
  }
  // The station `step` away from station p of stop k, through the units in the book's order (an extra stop only
  // when it is open); null at either end.
  function nearPart(k, p, step) {
    const count = j => partsOf(stops[j]).length;
    let j = k, q = Number.isInteger(p) ? p + step : (step > 0 ? count(k) : -1);
    while (q < 0 || q >= count(j)) {
      j += step;
      if (j < 0 || j >= stops.length) return null;
      if (!stopOpen(j)) continue;
      q = step > 0 ? 0 : count(j) - 1;
    }
    return { k: j, p: q, label: stops[j].simge + ' ' + stops[j].ad + ' · ' + partName(q, stops[j]) };
  }

  function finishExam() {
    const total = run.items.length;
    const score = run.right;
    const elapsed = performance.now() - run.started;
    const before = progress.deneme.en;
    progress.deneme.son = score;
    progress.deneme.sayi++;
    if (before === null || score > before) progress.deneme.en = score;
    save();
    // the first exam and every new record bring a reward to the tank
    const prize = before === null || score > before ? akvaryum.odul({ neden: ad + ' · Deneme Sınavı' }) : null;
    const emoji = score >= 18 ? '🏆' : score >= 15 ? '🥈' : score >= 10 ? '📚' : '🌱';
    const title = score >= 18 ? 'Sınava hazırsın!' : score >= 15 ? 'Çok iyi gidiyorsun!' : score >= 10 ? 'Güzel bir başlangıç!' : 'Biraz daha çalışalım!';
    const byStop = stops.map(stop => {
      const mine = run.items.filter(item => item.q.stop === stop);
      const good = mine.filter(item => item.answer === 0).length;
      return '<li><span>' + stop.simge + ' ' + stop.konu + '</span><span class="soru-bar" aria-hidden="true"><i style="width:' +
        (mine.length ? good / mine.length * 100 : 0) + '%"></i></span><b>' + good + ' / ' + mine.length + '</b></li>';
    }).join('');
    const wrongs = run.items.filter(item => item.answer !== 0).map(item => {
      const q = item.q;
      const yours = letters[item.order.indexOf(item.answer)];
      const right = letters[item.order.indexOf(0)];
      return '<details class="soru-review-item"><summary>' + rich(q.s) + (q.d ? ' <span lang="en">(🔊 “' + escape(q.k[0]) + '”)</span>' : '') + '</summary>' + (q.m ? '<div class="soru-passage">' + rich(q.m) + '</div>' : '') +
        '<p class="soru-yours">Senin cevabın: ' + yours + ') ' + rich(q.a[item.answer]) + '</p><p class="soru-right">Doğru cevap: ' + right + ') ' +
        rich(q.a[0]) + '</p><p><span aria-hidden="true">💡</span> ' + rich(q.b) + '</p>' + yearNote(q) + '</details>';
    }).join('');
    result('<div class="soru-prize" aria-hidden="true">' + emoji + '</div><h2 id="' + kod + '-result-title" tabindex="-1">' + title + '</h2>' +
      '<p class="soru-score-big"><b>' + score + '</b> / ' + total + ' doğru</p>' +
      '<ul class="facts soru-facts"><li><b>' + Math.round(score / total * 100) + '</b><span>puan</span></li><li><b>' + minutes(elapsed) +
      '</b><span>süre</span></li><li><b>' + progress.deneme.en + '</b><span>en iyi</span></li></ul>' +
      (before !== null && score > before ? '<p class="soru-unlock">🎉 Yeni rekor! Önceki en iyin ' + before + ' idi.</p>' : '') +
      (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Rekorunu geliştirince akvaryumuna yeni bir balık ya da süs gelir.')) +
      '<h3 class="soru-h3">Konulara göre</h3><ul class="soru-by-stop">' + byStop + '</ul>' +
      (wrongs ? '<h3 class="soru-h3">Yanlışlarını incele</h3><p class="soru-small">Bu sorular Tekrar Kutusu’na eklendi.</p>' + wrongs : '') +
      learnedNote() + (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : ''), score >= 15 ? 'win' : '');
    playCue(score >= 18 ? 'victory' : score >= 10 ? 'island' : 'correct');
    if (score >= 15) fx.confetti(dialog, { count: score >= 18 ? 220 : 140, duration: 4000 });
    buttons(['↻ Yeni deneme', startExam], ['Haritaya dön', closeGame, true]);
  }

  /* ---------- Yanlış Avı: the wrong answers' words, matched English ↔ Turkish ---------- */
  function startHunt() {
    if (!huntOpen()) return;
    // one card per English word and per meaning, so every card has exactly one partner
    const seenEn = new Set(), seenTr = new Set(), pairs = [];
    for (const q of shuffled(missed().filter(q => q.k))) {
      const en = bare(q.k[0]), tr = q.k[1].toLocaleLowerCase('tr');
      if (seenEn.has(en) || seenTr.has(tr)) continue;
      seenEn.add(en); seenTr.add(tr);
      pairs.push(q);
      if (pairs.length === CIFT) break;
    }
    run = { kind: 'avi', stop: null, items: pairs.map(q => ({ q, miss: false, done: false })), picked: null, mistakes: 0,
      learnedBefore: learnedAll(), started: performance.now() };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = 'avi';
    dialog.dataset.mood = '';
    playCue('start');
    const stage = byKey('stage');
    stage.innerHTML = '<div class="soru-top"><span class="soru-where">🎯 Yanlış Avı</span><span class="soru-hunt-left"></span></div>' +
      '<h2 id="' + kod + '-prompt" class="soru-prompt" tabindex="-1">Kelimeyi anlamıyla eşleştir</h2>' +
      '<p class="soru-small">Önce bir karta, sonra eşine dokun. İngilizce kartlar 🔊 söylenişini de okur.</p>';
    const board = el('div', 'soru-hunt');
    const column = (side, order) => {
      const list = el('div', 'soru-hunt-col');
      for (const n of order) {
        const q = run.items[n].q;
        const icon = side === 'en' ? '🔊' : q.k[2];
        const card = el('button', 'soru-card ' + side, (icon ? '<i aria-hidden="true">' + kelimeResimleri.kelimeResmi(icon) + '</i>' : '') +
          '<span' + (side === 'en' ? ' lang="en"' : '') + '>' + escape(side === 'en' ? q.k[0] : q.k[1]) + '</span>');
        card.type = 'button';
        card.dataset.n = n;
        card.dataset.side = side;
        card.onclick = () => pickCard(card);
        list.append(card);
      }
      return list;
    };
    const order = run.items.map((_, n) => n);
    board.append(column('en', shuffled(order)), column('tr', shuffled(order)));
    stage.append(board);
    huntLeft();
    byKey('prompt').focus();
  }
  function huntLeft() {
    const left = run.items.filter(item => !item.done).length;
    byKey('stage').querySelector('.soru-hunt-left').textContent = left + ' çift kaldı';
  }
  function pickCard(card) {
    if (card.disabled) return;
    const item = run.items[Number(card.dataset.n)];
    if (card.dataset.side === 'en') say(item.q.k[0]);
    const other = run.picked;
    if (!other || other === card || other.dataset.side === card.dataset.side) {
      other?.classList.remove('picked');
      run.picked = other === card ? null : card;
      run.picked?.classList.add('picked');
      if (run.picked && card.dataset.side !== 'en') playCue('tap', { gain: 0.6 });
      return;
    }
    run.picked = null;
    other.classList.remove('picked');
    if (other.dataset.n === card.dataset.n) {
      item.done = true;
      for (const c of [card, other]) { c.classList.add('matched'); c.disabled = true; }
      playCue('correct');
      fx.burst(card, { symbols: simgeler, count: 10, spread: 70 });
      if (card.dataset.side !== 'en') say(item.q.k[0]);
      huntLeft();
      if (run.items.every(x => x.done)) setTimeout(finishHunt, 700);
    } else {
      // both cards were guessed wrong: their words stay in Tekrar Kutusu
      run.mistakes++;
      for (const c of [card, other]) {
        run.items[Number(c.dataset.n)].miss = true;
        c.classList.add('wrong');
        fx.bump(c, 'missed');
        setTimeout(() => c.classList.remove('wrong'), 600);
      }
      playCue('retry');
    }
  }
  function finishHunt() {
    if (!run || run.kind !== 'avi') return;
    for (const item of run.items) note(item.q, !item.miss);
    save();
    const total = run.items.length, clean = run.items.filter(item => !item.miss).length;
    const prize = clean === total ? akvaryum.odul({ neden: ad + ' · Yanlış Avı' }) : null;
    const left = huntCount();
    result('<div class="soru-prize" aria-hidden="true">' + (clean === total ? '🎯' : '🧩') + '</div>' +
      '<h2 id="' + kod + '-result-title" tabindex="-1">' + (clean === total ? 'Hepsini ilk denemede buldun!' : 'Bütün çiftleri buldun!') + '</h2>' +
      '<p class="soru-score-big"><b>' + clean + '</b> / ' + total + ' ilk denemede</p>' +
      '<p>' + (clean ? clean + ' kelime Tekrar Kutusu’ndan çıktı. ' : '') + (missed().length ? 'Tekrar Kutusu’nda ' + missed().length + ' soru kaldı.' : 'Tekrar Kutusu boşaldı. 🎉') + '</p>' +
      (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Bir turu hiç yanlış eşleştirmeden bitirince akvaryumuna yeni bir balık ya da süs gelir.')) +
      learnedNote() + (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : ''), 'win');
    playCue(clean === total ? 'island' : 'correct');
    fx.confetti(dialog, { count: clean === total ? 150 : 90 });
    buttons(...(left >= YETER ? [['🎯 Bir tur daha', startHunt]] : []), ...(missed().length ? [['🔁 Tekrar Kutusu', startReview, left >= YETER]] : []),
      ['Haritaya dön', closeGame, true]);
  }

  /* ---------- the words of İngilizce Koyu's games ---------- */
  // The island's words that have a picture, one word per picture (a picture shared by several words, like 📅, is left out).
  let pictured = null;
  function pictureWords() {
    if (pictured) return pictured;
    const byEmoji = new Map();
    for (const q of byId.values()) {
      if (!q.k || !q.k[2] || /[.!?]/.test(q.k[0]) || q.k[0].split(' ').length > 3) continue;
      const list = byEmoji.get(q.k[2]) || [];
      if (!list.some(w => w.en === q.k[0])) list.push({ en: q.k[0], tr: q.k[1], emo: q.k[2] });
      byEmoji.set(q.k[2], list);
    }
    // words that share a picture and a meaning (orange, oranges) are one word; different meanings make the picture unclear
    return (pictured = [...byEmoji.values()].filter(list => list.every(w => w.tr === list[0].tr)).map(list => list[list.length - 1]));
  }
  // Yanlış Avı's 🎈 Balon Patlat: the wrong answers' words float up as balloons, each with its meaning written under it.
  function startBalloons() {
    if (!huntOpen()) return;
    const seen = new Set();
    const items = shuffled(missed().filter(q => q.k)).filter(q => !seen.has(bare(q.k[0])) && seen.add(bare(q.k[0]))).slice(0, CIFT).map(asItem);
    run = { kind: 'avi', stop: null, learnedBefore: learnedAll() };
    if (!dialog.open) dialog.showModal();
    dialog.dataset.mode = 'oyun';
    dialog.dataset.mood = '';
    playCue('start');
    const mine = run;
    run.cancel = ingilizceOyunlari.balonTuru({
      stage: byKey('stage'), items, havuz: pictureWords(), maskot: activeProfile?.icon, rich,
      sonuc: (item, ok) => { if (run === mine) { note(item.q, ok); save(); } },
      bitir: (right, total) => { if (run === mine) finishBalloons(right, total); }
    });
  }
  function finishBalloons(right, total) {
    const prize = right === total ? akvaryum.odul({ neden: ad + ' · Balon Patlat' }) : null;
    const stars = right === total ? 3 : right >= total - 2 ? 2 : 1;
    result('<div class="soru-prize" aria-hidden="true">🎈</div>' +
      '<h2 id="' + kod + '-result-title" tabindex="-1">' + (stars === 3 ? 'Hepsini ilk denemede patlattın!' : 'Balonlar bitti, aferin!') + '</h2>' +
      '<div class="soru-won">' + starRow(stars) + '</div><p class="soru-score-big"><b>' + right + '</b> / ' + total + ' ilk denemede</p>' +
      '<p>' + (missed().length ? 'Tekrar Kutusu’nda ' + missed().length + ' soru kaldı.' : 'Tekrar Kutusu boşaldı. 🎉') + '</p>' + learnedNote() +
      (prize ? akvaryum.kart([prize]) : akvaryum.ipucu('Bütün balonları ilk denemede patlatınca akvaryumuna yeni bir balık ya da süs gelir.')) +
      (storageNote ? '<p class="soru-small">' + storageNote + '</p>' : ''), 'win');
    playCue(stars === 3 ? 'victory' : 'island');
    fx.confetti(dialog, { count: stars === 3 ? 170 : 100 });
    buttons(...(huntOpen() ? [['🎈 Bir tur daha', startBalloons]] : []), ...(missed().length ? [['🔁 Tekrar Kutusu', startReview, huntOpen()]] : []),
      ['Haritaya dön', closeGame, true]);
  }

  function closeGame() { dialog.close(); }

  /* ---------- Keyboard: 1-4 or A-D answers, Enter goes on ---------- */
  document.addEventListener('keydown', e => {
    if (!dialog.open || !run || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('.soru-close, details, summary')) return;
    const key = e.key.toLocaleUpperCase('tr');
    const n = ['1', '2', '3', '4'].indexOf(key) >= 0 ? Number(key) - 1 : letters.indexOf(key);
    if (n < 0) return;
    const button = byKey('stage').querySelectorAll('.soru-option')[n];
    if (button && !button.disabled) { e.preventDefault(); button.click(); }
  });

  /* ---------- Leaving ---------- */
  byKey('close').onclick = closeGame;
  dialog.addEventListener('close', () => {
    run?.cancel?.();
    run = null;
    if (typeof ingilizceSes !== 'undefined') ingilizceSes.stop();
    speech?.cancel();
    dialog.dataset.mood = '';
    for (const canvas of dialog.querySelectorAll('.fx-confetti')) canvas.remove();
    kesifHaritasi.yenile();
  });
}
