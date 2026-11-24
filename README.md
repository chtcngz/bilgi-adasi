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
│           ├── kayitlar.js          Which clips exist (window.elifRecordings)
│           ├── kaynak.json          Clip ↔ source mapping
│           └── KAYNAKLAR.md         Sources and licenses
└── islands/                 One folder per island
    ├── carpim/              Çarpım Adası (game.js)
    ├── elif-ba/             Elif Ba Adası
    │   ├── data.js          Letters, readings, harekes, coves, section list
    │   ├── voice.js         Recording / Turkish speech playback (elifVoice)
    │   ├── game.js          Hub, Harfler and Harekeler sections, rounds
    │   ├── style.css, koy.jpg
    │   └── games/           Section games
    │       └── listening.*  Harf Yağmuru (letters) + Hece Balonları (syllables)
    ├── din-bilgisi/         Question island: sorular.js + game.js + style.css + ada.svg
    └── fen-bilimleri/       Question island: same pattern
tools/                       Helper scripts (not published)
├── make_sounds.py           → app/assets/audio/ui/*.wav
└── elif_sesleri.py          → app/assets/audio/elif-ba/ (harf, hece, kayitlar.js)
sources/                     Raw material (not published)
└── elifba-sesleri/          Diyanet Elifba audio library, organized by lesson, plus katalog.json
```

### Rules

- **`core/` contains only what more than one island uses.** Code that belongs to a single island stays in that island's folder.
- **Every sound lives under `app/assets/audio/`**: effects in `ui/`, and each island's or section's recordings in their own subfolder. The raw, unprocessed library is kept in `sources/` and is not published.
- **Load order matters** because the files are plain scripts: `core/js/app.js` → `sounds` → `fx` → islands and core helpers → `core/js/settings.js` (last).
- **Cache busting:** every `<link>`/`<script>` address in `index.html` ends in `?v=…`. When you change a file, bump its number.
- **Saved-data keys never change.** Progress is kept in localStorage (`carpim-adasi-profiller`, `carpim-adasi-oyuncu-*`, `elif-ba-v2-*`, `din-bilgisi-*` …). Renaming a key wipes the children's progress.

## Adding something new

**A new Elif Ba section** (Cezm, Tenvin, Şedde …):
1. Remove the `soon` flag from the section's entry in `islands/elif-ba/data.js`.
2. Add the section's screen and rounds to `islands/elif-ba/game.js`.
3. Put its recordings under `app/assets/audio/elif-ba/<bölüm>/` and register them in `kayitlar.js`.
4. If it gets a game, add it under `islands/elif-ba/games/`. Listening games can reuse `listening.js` with a new `kind`.

**A new question island** (for example Türkçe):
1. Create `islands/<ada>/sorular.js` (the question bank), `game.js` (a single `soruAdasi({...})` call), `style.css` and `ada.svg`.
2. Add its view, dialog and catalog card to `index.html` using the `#<kod>-…` id pattern, and load its scripts after `core/js/quiz.js`.

**A new island with its own engine:** use `islands/<ada>/` and add its catalog card to `index.html`. If more than one island needs some code, move that code into `core/`.

## Versions

The version number is kept in `VERSION`, and the changes are listed in `CHANGELOG.md`.
