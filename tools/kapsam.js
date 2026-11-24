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
//      question ids that are unique, and a mock exam of at most 20 questions;
//   2. reads islands/<ada>/kapsam.md, the checklist drawn from the textbook. Every line that
//      starts with "- " is one point of the book and must end with "→" and the ids of the
//      questions that ask it:  "- s. 13 · T.C. kimlik numarası 11 hanelidir. → birey:0, birey:4"
//      Every id must exist. A point without a question, or an island without a checklist,
//      is an error.
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
  return context.__bank;
}

const isText = value => typeof value === 'string' && value.trim().length > 0;
const balanced = text => (text.match(/\*/g) || []).length % 2 === 0;

let failed = false;
for (const name of islands) {
  const errors = [];
  const problem = text => errors.push(text);
  let bank;
  try { bank = loadBank(path.join(islandsDir, name, 'sorular.js')); }
  catch (error) { problem('sorular.js yüklenemedi: ' + error.message); }

  const ids = new Map();
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
        for (const key of Object.keys(q)) if (!['s', 'm', 'a', 'b', 'y'].includes(key)) problem(at + ': bilinmeyen alan "' + key + '".');
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
  const used = new Set();
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
      for (const id of refs) {
        if (!ids.has(id)) problem(at + ': "' + id + '" diye bir soru yok.');
        else used.add(id);
      }
    });
    if (!points) problem('kapsam.md içinde madde yok.');
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
