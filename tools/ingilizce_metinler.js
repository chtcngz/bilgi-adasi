#!/usr/bin/env node
// Lists every English line İngilizce Koyu says, for tools/ingilizce_sesler.py, as { a: [...], b: [...] }:
//   a, the main voice: the k[0] of every question of app/islands/ingilizce-*/sorular.js, both halves of a dialogue
//     ("How are you?" / "I’m fine, thank you.") and the lines of the games (praise, "Put the apples in the basket." …);
//   b, the answer voice: the answers said after a right answer (every k[0], a dialogue's answer half, "The fish is blue!").
//   node tools/ingilizce_metinler.js > metinler.json
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const islands = path.join(root, 'app', 'islands');
const texts = new Set(), answers = new Set();
const context = { window: {}, matchMedia: () => ({ matches: false }) };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'app/core/js/ingilizce-oyunlari.js'), 'utf8') + ';globalThis.__o = ingilizceOyunlari; globalThis.__ses = ingilizceSes;', context);

for (const name of fs.readdirSync(islands).filter(n => n.startsWith('ingilizce-'))) {
  const bank = fs.readFileSync(path.join(islands, name, 'sorular.js'), 'utf8');
  const game = fs.readFileSync(path.join(islands, name, 'game.js'), 'utf8');
  const c = { settings: null };
  vm.createContext(c);
  vm.runInContext(bank + ';globalThis.__bank = ' + bank.match(/^const\s+(\w+)\s*=\s*\[/m)[1] + ';' +
    'function soruAdasi(s) { globalThis.settings = s; }' + game, c);
  for (const stop of c.__bank) for (const q of stop.sorular) if (q.k) {
    const text = q.k[0], d = context.__ses.diyalog(text);
    texts.add(text);
    if (d) { texts.add(d[0]); texts.add(d[1]); answers.add(d[1]); } else answers.add(text);
  }
  for (const line of context.__o.metinler((c.settings && c.settings.oyunlar) || {})) texts.add(line);
  for (const line of context.__o.metinlerB()) answers.add(line);
}
process.stdout.write(JSON.stringify({ a: [...texts].sort(), b: [...answers].sort() }, null, 1) + '\n');
