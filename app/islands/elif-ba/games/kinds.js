// What Elif Ba's listening games play with, by kind. An item is a number:
//   harf   a letter (0-27)
//   hece   a harekeli syllable: letter * 3 + hareke (بَ)
//   sekil  the same syllable, shown in a joined shape at a random place in the word (ـبَـ)
//   cezm   the letter with the cezm in its cezm syllable (بِسْ for sin)
//   tenvin a letter with a tenvin: letter * 3 + tenvin (بٍ); from 84 on, the same letter with the hareke
//          alone (84 + letter * 3 + hareke, بِ), a decoy that is never the one to find
// For every kind: how an item is written (text), named (name, "Be iki esre"), heard (speak) and told apart
// by ear (sound: two items with the same sound are never set side by side), its letter (letter), the items
// most easily mixed up with it (alike, offered more often as the game goes on: from the alikeFrom-th turn,
// alikeChance of the time), whether it is a decoy and what to fetch ahead of time (preload). Harf Yağmuru,
// the balloons (listening.js) and the other games of the same step (arcade.js) all use them.
const elifKinds = (() => {
  const { glyphs, names, readings, harekeler, syllable, twins, shape, cezm, cezmReadings, cezmAlike, tenvin, tenvinler, tenvinReading } = elifData;
  const voice = elifVoice;
  const hareke = h => harekeler[h].name.toLocaleLowerCase('tr');
  const lettersOf = items => [...new Set(items)];
  return {
    harf: {
      text: i => glyphs[i], name: i => names[i], sound: i => names[i], letter: i => i,
      speak: (i, note, end) => voice.letter(i, note, end),
      // look-alike letters (the same shape, other dots) join in once a few letters are done
      alike: i => twins(i), alikeFrom: 3, alikeChance: 0.3,
      preload: items => voice.preload(items, true)
    },
    hece: {
      // shown by its letter and hareke ("Be üstün"); the reading only tells syllables that sound alike apart
      text: k => syllable(Math.floor(k / 3), k % 3), sound: k => readings[Math.floor(k / 3)][k % 3], letter: k => Math.floor(k / 3),
      name: k => names[Math.floor(k / 3)] + ' ' + hareke(k % 3),
      speak: (k, note, end) => voice.syllable(Math.floor(k / 3), k % 3, note, end),
      // the same letter with its other harekes is what is to be told apart
      alike: k => [0, 1, 2].map(h => k - k % 3 + h).filter(j => j !== k), alikeFrom: 1, alikeChance: 0.4,
      preload: items => voice.preload(lettersOf(items.map(k => Math.floor(k / 3))))
    },
    sekil: {
      // a harekeli syllable; each time it is written it is at the start, in the middle or at the end of a word
      text: k => shape(Math.floor(k / 3), 1 + Math.floor(Math.random() * 3), k % 3), sound: k => readings[Math.floor(k / 3)][k % 3],
      letter: k => Math.floor(k / 3), name: k => names[Math.floor(k / 3)] + ' ' + hareke(k % 3),
      speak: (k, note, end) => voice.syllable(Math.floor(k / 3), k % 3, note, end),
      // the same letter with its other harekes, and the look-alike letters with the same hareke
      alike: k => [...[0, 1, 2].map(h => k - k % 3 + h).filter(j => j !== k), ...twins(Math.floor(k / 3)).map(i => i * 3 + k % 3)],
      alikeFrom: 2, alikeChance: 0.4,
      preload: items => voice.preload(lettersOf(items.map(k => Math.floor(k / 3))), false, true)
    },
    cezm: {
      // shown as "Be esre, Sin cezm", the way it is chanted
      text: i => cezm(i).text, sound: i => cezmReadings[i].replace(/[’‘]/g, '').replace(/ı/g, 'i'), letter: i => i,
      name: i => { const { before } = cezm(i); return names[before.i] + ' ' + hareke(before.h) + ', ' + (i ? names[i] : 'Hemze') + ' cezm'; },
      speak: (i, note, end) => voice.cezm(i, note, end),
      // syllables that start with the same harekeli letter (bis, bi’) are what is to be told apart
      alike: i => glyphs.map((_, j) => j).filter(j => j !== i && !cezmAlike(i, j) && cezm(j).text.slice(0, 2) === cezm(i).text.slice(0, 2)),
      alikeFrom: 1, alikeChance: 0.4,
      preload: items => voice.preload(items, true, false, true)
    },
    tenvin: {
      text: k => k < 84 ? tenvin(Math.floor(k / 3), k % 3) : syllable(Math.floor((k - 84) / 3), k % 3),
      sound: k => k < 84 ? tenvinReading(Math.floor(k / 3), k % 3) : readings[Math.floor((k - 84) / 3)][k % 3],
      letter: k => Math.floor(k % 84 / 3),
      name: k => k < 84 ? names[Math.floor(k / 3)] + ' ' + tenvinler[k % 3].name.toLocaleLowerCase('tr') : names[Math.floor((k - 84) / 3)] + ' ' + hareke(k % 3),
      speak: (k, note, end) => k < 84 ? voice.tenvin(Math.floor(k / 3), k % 3, note, end) : voice.syllable(Math.floor((k - 84) / 3), k % 3, note, end),
      decoy: k => k >= 84,
      // the same letter with the hareke alone (bi for bin), then its other tenvins
      alike: k => [84 + k, ...[0, 1, 2].map(h => k - k % 3 + h).filter(j => j !== k)], alikeFrom: 1, alikeChance: 0.5,
      preload: items => voice.preload(lettersOf(items.map(k => Math.floor(k % 84 / 3))), false, false, false, true)
    }
  };
})();
