# Bilgi Adası

Bilgi Adası is an island-themed learning game for children from preschool through 4th grade. It is a static site with no build step: `app/index.html` loads plain JS and CSS files in order. Pushing to the `main` branch publishes `app/` to GitHub Pages (`.github/workflows/pages.yml`).

To run it locally:

```sh
cd app && python3 -m http.server 8000   # http://localhost:8000
```

Sounds are loaded with `fetch`, so opening the file directly via `file://` leaves the game silent.

## Folder layout

```
app/                         Published site (GitHub Pages root)
├── index.html               All screens and the script/style load order
├── core/                    Shared infrastructure for every island
│   ├── js/
│   │   ├── app.js           $(), activeProfile, storageFailed: loaded first
│   │   ├── sounds.js        Web Audio cues (playCue), phone audio session
│   │   ├── fx.js            Confetti, burst, bump effects
│   │   ├── profiles.js      Players, grade levels, Keşif Limanı (island catalog)
│   │   ├── stats.js         Çarpım statistics
│   │   ├── quiz.js          Question-island engine: soruAdasi({...})
│   │   └── settings.js      Settings window, progress and reset (loaded last)
│   └── css/
│       ├── base.css         Font, colors, catalog, shared components
│       └── quiz.css         Shared .soru-* look of the question islands
├── assets/                  All media in one place
│   ├── fonts/               Nunito + license
│   ├── images/              Shared images (ada-atlasi.jpg)
│   └── audio/
│       ├── ui/              Effect sounds (tools/make_sounds.py generates them)
│       └── elif-ba/         Elif Ba recordings, section by section
│           ├── harf/NN.mp3          Letter names (00 = Elif)
│           ├── hece/NN-H.mp3        Syllables (H: 0 üstün, 1 esre, 2 ötre)
│           ├── kelime/NN-P.mp3      Bitişik yazılış example words, spelled (P: 1 start, 2 middle, 3 end)
│           ├── yer/P.mp3            "Kelimenin başında / ortasında / sonunda"
│           ├── kayitlar.js          Which clips exist (window.elifRecordings)
│           ├── kaynak.json          Clip ↔ source mapping
│           └── KAYNAKLAR.md         Sources and licenses
├── islands/                 One folder per island
│   ├── carpim/              Çarpım Adası (game.js)
│   ├── elif-ba/             Elif Ba Adası
│   │   ├── data.js          Letters, readings, harekes, joined shapes and example words, coves, look-alike letters, section list
│   │   ├── voice.js         Recording / Turkish speech playback (elifVoice)
│   │   ├── map.js           Map of the coves; the turtle walks between them (elifMap)
│   │   ├── game.js          Hub, Harfler, Harekeler and Bitişik yazılış sections, rounds
│   │   ├── style.css, koy.jpg
│   │   └── games/           Section games
│   │       ├── art.js       Turtle, hearts, speaker and stars shared by the games
│   │       ├── listening.*  Harf Yağmuru (letters), Hece Balonları (syllables), Şekil Yağmuru (joined shapes); its .rain-* kit is shared
│   │       ├── bridge.*     Cam Köprü, the mixed game at the end of every cove
│   │       └── aquarium.*   Akvaryum: a fish for every letter whose harekes are learned
│   ├── din-bilgisi/         Question island: sorular.js + game.js + style.css + ada.svg + kapsam.md
│   ├── fen-bilimleri/       Question island: same pattern
│   └── sosyal-bilgiler/     Question island: same pattern
├── admin/                   Yönetici sayfası: every player's progress on this device and in added backups,
│                            behind a password (only its PBKDF2 hash is in admin.js). Nothing links to it; open …/admin/.
└── deneme/                  Deneme Odası: playable drafts of proposed Elif Ba games (OYUN-ONERILERI.md).
                             Nothing in the game links to it; open …/deneme/.
tools/                       Helper scripts (not published)
├── kapsam.js                Checks every question island against its textbook checklist
├── make_sounds.py           → app/assets/audio/ui/*.wav
└── elif_sesleri.py          → app/assets/audio/elif-ba/ (harf, hece, kayitlar.js)
sources/                     Raw material (not published)
└── elifba-sesleri/          Diyanet Elifba audio library, organized by lesson, plus katalog.json
```

### Rules

- **The whole textbook is asked.** Every question island that follows a textbook, for every grade (1st, 2nd, 3rd and 4th grade islands alike), covers the whole book: when the child has learned every question of the island, nothing in the book is left unlearned. To make sure of it, each island keeps `islands/<ada>/kapsam.md`, a checklist drawn from the book page by page: every definition, concept, event, date, person, place and example is one line (so is every glossary word, the front pages, the chronology and the maps at the back), and the line ends with the ids of the questions that ask it (`- s. 13 · … → birey:0, birey:4`). A point with no question gets a new question before the island ships. `node tools/kapsam.js` must pass: it fails on a point without a question, on an id that does not exist, on an island without a checklist, and on a malformed question (four different options, a balanced `*underline*`, a real exam year). Points that the book only mentions in passing still get a question; topics outside the book go to the island's extra stop.
- **`core/` contains only what more than one island uses.** Code that belongs to a single island stays in that island's folder.
- **Every sound lives under `app/assets/audio/`**: effects in `ui/`, and each island's or section's recordings in their own subfolder. The raw, unprocessed library is kept in `sources/` and is not published.
- **Load order matters** because the files are plain scripts: `core/js/app.js` → `sounds` → `fx` → islands and core helpers → `core/js/settings.js` (last).
- **Cache busting:** every `<link>`/`<script>` address in `index.html` ends in `?v=…`. When you change a file, bump its number.
- **Saved-data keys never change.** Progress is kept in localStorage (`carpim-adasi-profiller`, `carpim-adasi-oyuncu-*`, `elif-ba-v2-*`, `din-bilgisi-*` …). Renaming a key wipes the children's progress.

## Adding something new

**Elif Ba is for children who cannot read yet.** Every instruction is spoken (`elifVoice.instruct`) and repeated by a 🐢💬 button, choices are letters, sounds or pictures, never words (see `CLAUDE.md`).

**A new Elif Ba section** (Cezm, Tenvin, Şedde …):
Elif Ba is a single path (the `steps` list in `game.js`). The first seven coves (`LETTER_COVES` in `data.js`) teach the letters, four each: Harfler → Harf Yağmuru → Harekeler → Hece Balonları → Cam Köprü; the first cove also has Harekelerle tanış before Harekeler. From the eighth cove on (`coveTopic(k)` is `bitisik`), the same groups of four come again for bitişik yazılış: Bitişik yazılış → Şekil Yağmuru → Cam Köprü, with the panes in the letters' joined shapes. Martı Koyu (ا ب ت ث) is the first of them; the next bitişik cove needs only its name in `coves` and on the map (`spots`, `short` in `map.js`) and its example-word recordings in `kelime/` and `kayitlar.js` (the words of all 28 letters are already in `data.js`). Cam Köprü is the cove's mixed (Karma) game and crosses over to the next cove. Only the next step can be opened, and from the second cove on every round mixes in letters from the earlier coves. The hub shows the coves as a map (`map.js`): the turtle stands on one cove, the steps below are that cove's, and it walks over the bridges before a step in another cove opens. To add a section:
1. Remove the `soon` flag from the section's entry in `islands/elif-ba/data.js`, and add its steps to the `steps` list in `game.js`.
2. Add the section's screen and rounds to `islands/elif-ba/game.js`.
3. Put its recordings under `app/assets/audio/elif-ba/<bölüm>/` and register them in `kayitlar.js`.
4. If it gets a game, add it under `islands/elif-ba/games/`. Listening games can reuse `listening.js` with a new `kind`; a new game can take its top bar, hearts and cards from the `.rain-*` classes of `listening.css` and its turtle from `art.js`, as `bridge.js` does.

**A new question island** (for example Türkçe, or Hayat Bilgisi for the 1st-3rd grades):
1. Get the textbook the schools use this year and write `islands/<ada>/kapsam.md`: every point of the book, unit by unit, with its page.
2. Create `islands/<ada>/sorular.js` (the question bank), `game.js` (a single `soruAdasi({...})` call), `style.css` and `ada.svg`. Write questions until every checklist line ends with the ids of the questions that ask it, and run `node tools/kapsam.js <ada>` until it passes.
3. Add its view, dialog, catalog card (`data-grades` says which grades see it) and its Settings → Progress section to `index.html` using the `#<kod>-…` id pattern, and load its scripts after `core/js/quiz.js`.

**A new island with its own engine:** use `islands/<ada>/` and add its catalog card to `index.html`. If more than one island needs some code, move that code into `core/`.

## Versions

The version number is kept in `VERSION`, and the changes are listed in `CHANGELOG.md`.
