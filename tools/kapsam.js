#!/usr/bin/env node
// Checks the question islands against the rule that every island covers its whole textbook.
//
//   node tools/kapsam.js                 every island in app/islands/*/sorular.js
//   node tools/kapsam.js sosyal-bilgiler one island (folder name); add --ayrinti to list the
//                                        questions that no checklist item points to
//
// For each island it
//   1. loads sorular.js the way the game does and checks every stop and question: the fields,
//      four different non-empty options, a balanced *underline*, an exam year that exists,
//      question ids that are unique, and a mock exam of at most 20 questions; an English question may carry
//      k: [English, Turkish, emoji?] (said by 🔊, matched in Yanlış Avı) and d: 1 (asked by ear only);
//   2. reads islands/<ada>/kapsam.md, the checklist drawn from the textbook. Every line that
//      starts with "- " is one point of the book and must end with "→" and the ids of the
//      questions that ask it:  "- s. 13 · T.C. kimlik numarası 11 hanelidir. → birey:0, birey:4"
//      Every id must exist. A point without a question, or an island without a checklist,
//      is an error.
//   3. (İngilizce Koyu) istasyonlar.js: a unit cut into stations has every one of its questions in exactly one station,
//      and every word of a station's Keşif Kartı has its three parts.
//   An island whose bank is still empty (its bay says "Yakında") is skipped until its first question.
// It exits with 1 when something is wrong, so it can guard a commit or a deploy.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const islandsDir = path.join(root, 'app', 'islands');
const args = process.argv.slice(2);
const detail = args.includes('--ayrinti');
const wanted = args.filter(a => !a.startsWith('--'));
const EXAM = 20;
const firstExamYear = 2016;
const thisYear = new Date().getFullYear();

const islands = fs.readdirSync(islandsDir)
  .filter(name => fs.existsSync(path.join(islandsDir, name, 'sorular.js')))
  .filter(name => !wanted.length || wanted.includes(name));
for (const name of wanted) {
  if (!islands.includes(name)) { console.error('Böyle bir soru adası yok: ' + name); process.exit(1); }
}

function loadBank(file) {
  const code = fs.readFileSync(file, 'utf8');
  const match = code.match(/^const\s+(\w+)\s*=\s*\[/m);
  if (!match) throw new Error('"const …Sorular = [" bulunamadı');
  const context = {};
  vm.createContext(context);
  vm.runInContext(code + '\n;globalThis.__bank = ' + match[1] + ';', context, { filename: file });
  context.__bank.adi = match[1];
  return context.__bank;
}

// sahneler.js (İngilizce Koyu): the pictures of 🔍 Gizli Kelimeler, or null
function loadScenes(file) {
  if (!fs.existsSync(file)) return null;
  const code = fs.readFileSync(file, 'utf8');
  const match = code.match(/^const\s+(\w+)\s*=/m);
  const context = {};
  vm.createContext(context);
  vm.runInContext(code + '\n;globalThis.__scenes = ' + match[1] + ';', context, { filename: file });
  return context.__scenes;
}

// istasyonlar.js (İngilizce Koyu): the stations of a unit, or null
const loadStations = file => loadScenes(file);

const isText = value => typeof value === 'string' && value.trim().length > 0;
const balanced = text => (text.match(/\*/g) || []).length % 2 === 0;

let failed = false;
for (const name of islands) {
  const errors = [];
  const problem = text => errors.push(text);
  let bank;
  try { bank = loadBank(path.join(islandsDir, name, 'sorular.js')); }
  catch (error) { problem('sorular.js yüklenemedi: ' + error.message); }

  // An island whose bank is still empty (a bay that says "Yakında") is checked once its first question comes.
  if (Array.isArray(bank) && !bank.length) { console.log('– ' + name + ': henüz soru yok (haritada “Yakında”); ilk soruyla birlikte kapsam.md de denetlenir.'); continue; }
  const ids = new Map();
  const scenes = loadScenes(path.join(islandsDir, name, 'sahneler.js'));
  if (bank) {
    if (!Array.isArray(bank) || !bank.length) problem('Soru bankası boş.');
    const stopIds = new Set();
    let exam = 0;
    for (const [k, stop] of (bank || []).entries()) {
      const where = 'Durak ' + (k + 1) + (stop.id ? ' (' + stop.id + ')' : '');
      for (const field of ['id', 'ad', 'konu', 'simge', 'unite']) if (!isText(stop[field])) problem(where + ': "' + field + '" eksik.');
      if (stopIds.has(stop.id)) problem(where + ': durak kimliği tekrar ediyor.');
      stopIds.add(stop.id);
      if (stop.deneme !== undefined && !(Number.isInteger(stop.deneme) && stop.deneme >= 0)) problem(where + ': "deneme" bir sayı olmalı.');
      exam += stop.deneme || 0;
      if (!Array.isArray(stop.sorular) || !stop.sorular.length) { problem(where + ': soru yok.'); continue; }
      stop.sorular.forEach((q, n) => {
        const id = stop.id + ':' + n;
        ids.set(id, q);
        const at = id + ' (' + String(q.s || '').slice(0, 40) + '…)';
        for (const key of Object.keys(q)) if (!['s', 'm', 'a', 'b', 'y', 'k', 'd', 'g', 'r'].includes(key)) problem(at + ': bilinmeyen alan "' + key + '".');
        // r: the question is asked with a picture of its own, app/assets/images/ingilizce/<r>.webp (a dialogue drawn with its speech bubbles)
        if (q.r !== undefined && !(typeof q.r === 'string' && /^[a-z0-9/-]+$/.test(q.r) && fs.existsSync(path.join(__dirname, '..', 'app', 'assets', 'images', 'ingilizce', q.r + '.webp')))) problem(at + ': r, assets/images/ingilizce/ altında bir .webp resmi olmalı.');
        // g: a 🔍 Gizli Kelimeler question, played on a picture of sahneler.js that has a place for its word
        if (q.g !== undefined && !(q.k && scenes?.[q.g]?.yerler.some(y => y.en === q.k[0]))) problem(at + ': g, sahneler.js’te k[0] için yeri olan bir resim olmalı.');
        // English islands: k = [English, Turkish, emoji?] is what 🔊 says and Yanlış Avı matches; d: 1 asks it by ear only
        if (q.k !== undefined && !(Array.isArray(q.k) && q.k.length >= 2 && q.k.length <= 3 && q.k.every(isText))) problem(at + ': k, [İngilizce, Türkçe, emoji?] olmalı.');
        if (q.d !== undefined && !(q.d === 1 && q.k)) problem(at + ': d yalnızca 1 olabilir ve k ister.');
        if (!isText(q.s)) problem(at + ': soru kökü (s) eksik.');
        if (!isText(q.b)) problem(at + ': açıklama (b) eksik.');
        if (q.m !== undefined && !isText(q.m)) problem(at + ': metin (m) boş.');
        if (!Array.isArray(q.a) || q.a.length !== 4 || !q.a.every(isText)) problem(at + ': dört seçenek olmalı.');
        else if (new Set(q.a.map(x => x.trim().toLocaleLowerCase('tr'))).size !== 4) problem(at + ': aynı seçenek iki kez yazılmış.');
        for (const text of [q.s, q.m, q.b, ...(q.a || [])]) if (typeof text === 'string' && !balanced(text)) problem(at + ': kapanmamış *altı çizili* yazı.');
        if (q.y !== undefined && !(Number.isInteger(q.y) && q.y >= firstExamYear && q.y <= thisYear)) problem(at + ': sınav yılı (y) ' + firstExamYear + '-' + thisYear + ' arasında olmalı.');
      });
    }
    if (exam > EXAM) problem('Durakların "deneme" toplamı ' + exam + '; deneme sınavı ' + EXAM + ' sorudur.');
  }

  // The checklist: every point of the book must name at least one question that asks it.
  const listFile = path.join(islandsDir, name, 'kapsam.md');
  let points = 0;
  const used = new Set(), page = new Map();
  if (!fs.existsSync(listFile)) problem('Ders kitabı kontrol listesi (kapsam.md) yok. Kural: kitaptaki her bilgi en az bir soruyla sorulur.');
  else {
    fs.readFileSync(listFile, 'utf8').split('\n').forEach((line, n) => {
      const item = line.match(/^\s*- (.*)$/);
      if (!item) return;
      points++;
      const at = 'kapsam.md:' + (n + 1);
      // The ids follow the last arrow, so the text itself may contain arrows (taş → kömürlü ütü).
      const cut = item[1].lastIndexOf('→');
      const refs = cut < 0 ? [] : item[1].slice(cut + 1).split(',').map(x => x.trim()).filter(Boolean);
      if (!refs.length || !refs.every(id => /^[\w-]+:\d+$/.test(id))) {
        problem(at + ': bu bilgiyi soran soru yok (satır “→ durak:sıra” ile bitmeli) → ' + item[1].trim().slice(0, 90));
        return;
      }
      // the table of contents and the title page name what a unit teaches later: they do not place a question
      const where = /^s\. \d+ · (İçindekiler|Kitabın adı)/.test(item[1]) ? null : item[1].match(/^s\. (\d+)/);
      for (const id of refs) {
        if (!ids.has(id)) problem(at + ': "' + id + '" diye bir soru yok.');
        else used.add(id);
        if (where && !(page.get(id) <= +where[1])) page.set(id, +where[1]);
      }
    });
    if (!points) problem('kapsam.md içinde madde yok.');
  }

  // istasyonlar.js: every question of a unit cut into stations is in exactly one station
  const stations = bank && loadStations(path.join(islandsDir, name, 'istasyonlar.js'));
  if (stations) for (const [stopId, list] of Object.entries(stations)) {
    const stop = bank.find(s => s.id === stopId);
    if (!stop) { problem('istasyonlar.js: "' + stopId + '" diye bir durak yok.'); continue; }
    const seen = new Map();
    list.forEach((station, j) => {
      if (!isText(station.ad) || !isText(station.simge) || !Array.isArray(station.kelimeler) || !station.kelimeler.length)
        problem('istasyonlar.js: ' + stopId + ' ' + (j + 1) + '. istasyonun adı, simgesi ya da kelimeleri eksik.');
      for (const w of station.kelimeler || []) if (!Array.isArray(w) || w.length < 3 || w.length > 4 || !w.every(isText))
        problem('istasyonlar.js: ' + stopId + ' ' + (j + 1) + '. istasyonda bir kelime [İngilizce, Türkçe, resim, büyük resim?] değil.');
        else if (w[3] && !fs.existsSync(path.join(__dirname, '..', 'app', 'assets', 'images', 'ingilizce', w[3] + '.webp')))
          problem('istasyonlar.js: ' + stopId + ' ' + (j + 1) + '. istasyonda "' + w[0] + '" için büyük resim yok: ' + w[3] + '.webp');
      for (const n of station.sorular || []) {
        if (!stop.sorular[n]) problem('istasyonlar.js: ' + stopId + ':' + n + ' diye bir soru yok.');
        else if (seen.has(n)) problem('istasyonlar.js: ' + stopId + ':' + n + ' iki istasyonda birden (' + (seen.get(n) + 1) + ' ve ' + (j + 1) + ').');
        seen.set(n, j);
      }
    });
    stop.sorular.forEach((q, n) => { if (!seen.has(n)) problem('istasyonlar.js: ' + stopId + ':' + n + ' hiçbir istasyonda değil → ' + String(q.s).slice(0, 60)); });
  }

  // sira.js (İngilizce Koyu): the book page of every question (the first page that asks it), so the game cuts a unit into stations in
  // the book's order (core/js/quiz.js, kitapSirasi). A question no page asks keeps the page of the one before it.
  // only İngilizce Koyu is ordered this way (set by the owner); the other islands keep their bank's order
  if (bank && page.size && name.startsWith('ingilizce-')) {
    // an English word asked from the glossary at the back is placed where the book first uses it ("clap": s. 18)
    const said = [];
    fs.readFileSync(listFile, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^\s*- s\. (\d+) · (.*)$/);
      if (!m || /^(İçindekiler|Kitabın adı)/.test(m[2])) return;
      const cut = m[2].lastIndexOf('→');
      // only a page of the word's own unit counts (the theme table at the front lists every word)
      const stopsOf = new Set(m[2].slice(cut + 1).split(',').map(x => x.trim().split(':')[0]));
      said.push([+m[1], m[2].slice(0, cut).toLowerCase(), stopsOf]);
    });
    for (const [id, q] of ids) {
      if (!Array.isArray(q.k) || /[.!?]/.test(q.k[0])) continue;
      const word = q.k[0].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(^|[^a-zçğıöşü’\'])' + word + '($|[^a-zçğıöşü’\'])');
      const stop = id.split(':')[0];
      for (const [n, text, stopsOf] of said) if (stopsOf.has(stop) && n < (page.get(id) ?? Infinity) && re.test(text)) page.set(id, n);
    }
    const pages = {};
    for (const stop of bank) {
      let last = 0;
      pages[stop.id] = stop.sorular.map((q, n) => (last = page.get(stop.id + ':' + n) ?? last));
    }
    const out = '// Generated by tools/kapsam.js from kapsam.md: the book page of every question, stop by stop. Do not edit.\n' +
      'kitapSirasi(' + bank.adi + ', ' + JSON.stringify(pages) + ');\n';
    const file = path.join(islandsDir, name, 'sira.js');
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== out) fs.writeFileSync(file, out);
  }

  const loose = [...ids.keys()].filter(id => !used.has(id));
  console.log((errors.length ? '✗ ' : '✓ ') + name + ': ' + ids.size + ' soru, kitaptan ' + points + ' madde' +
    (points ? ', maddelere bağlı ' + used.size + ' soru' : ''));
  for (const text of errors) console.log('    ' + text);
  if (detail && loose.length) {
    console.log('    Hiçbir maddeye bağlı olmayan ' + loose.length + ' soru (sınav ekstraları ya da aynı bilgiyi yeniden soranlar):');
    for (const id of loose) console.log('      ' + id + '  ' + String(ids.get(id).s).slice(0, 80));
  }
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
