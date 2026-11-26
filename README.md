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
│   │   ├── bulut-ayar.js    The Firebase project (public values)
│   │   ├── sync.js          Bulut kaydı: copies every saved change to Firestore (cihazlar/{device uid})
│   │   ├── sounds.js        Web Audio cues (playCue), phone audio session
│   │   ├── fx.js            Confetti, burst, bump effects
│   │   ├── profiles.js      Players, grade levels, Keşif Limanı (island catalog)
│   │   ├── stats.js         Çarpım statistics
│   │   ├── quiz.js          Question-island engine: soruAdasi({...})
│   │   ├── akvaryum-veri.js Akvaryum: the fish, ornaments and tank themes (names, sizes; the admin page loads it too)
│   │   ├── akvaryum-sanat.js Akvaryum's drawings: fish, ornaments, plants (SVG), sand and caustics (canvas)
│   │   ├── akvaryum.js      Akvaryum: every player's own tank, rewards (akvaryum.odul / akvaryum.kart), naming the fish
│   │   └── settings.js      Settings window, progress and reset (loaded last)
│   └── css/
│       ├── base.css         Font, colors, catalog, shared components
│       ├── quiz.css         Shared .soru-* look of the question islands
│       └── akvaryum.css     The tank, the reward card, the header button and the card in Keşif Limanı
├── assets/                  All media in one place
│   ├── fonts/               Nunito + license
│   ├── images/              Shared images (ada-atlasi.jpg)
│   └── audio/
│       ├── ui/              Effect sounds (tools/make_sounds.py generates them)
│       └── elif-ba/         Elif Ba recordings, section by section
│           ├── harf/NN.mp3          Letter names (00 = Elif)
│           ├── hece/NN-H.mp3        Syllables (H: 0 üstün, 1 esre, 2 ötre)
│           ├── kelime/NN-P.mp3      Bitişik yazılış example words, spelled (P: 1 start, 2 middle, 3 end)
│           ├── cezm/NN.mp3          The syllable in which letter NN has the cezm (00: a hemze)
│           ├── cezm-ornek/P-S.mp3   Diyanet's five cezm examples (S: 0 without the cezm, 1 with it, 2 the word)
│           ├── yer/P.mp3            "Kelimenin başında / ortasında / sonunda"
│           ├── cocuk/               The girl's voice (Settings → Elif Ba sesleri, the default): harf/NN.mp3 (+ hemze),
│           │                        hece/NN-H.mp3, yer/P.mp3 and hareke/ (üstün, esre, ötre, cezm names); what she
│           │                        has not recorded is played from the man's clips above
│           ├── kayitlar.js          Which clips exist (window.elifRecordings)
│           ├── kaynak.json          Clip ↔ source mapping
│           └── KAYNAKLAR.md         Sources and licenses
├── islands/                 One folder per island
│   ├── carpim/              Çarpım Adası (game.js): tables 2-10 in four rounds (15, 10, 5, 3 s), then two mixed
│   │                        stages (5 and 3 s) on the whale: every product of 2-9 once, shuffled on every start
│   ├── elif-ba/             Elif Ba Adası
│   │   ├── data.js          Letters, readings, harekes, joined shapes and example words, coves (islets), bays, look-alike letters, section list
│   │   ├── voice.js         Recording / Turkish speech playback (elifVoice)
│   │   ├── map.js           The map in three levels: bays → a bay's islets → an islet's steps; the turtle walks and sails (elifMap)
│   │   ├── game.js          Hub, Harfler, Harekeler, Bitişik yazılış and Cezm sections, rounds
│   │   ├── style.css, koy.jpg
│   │   └── games/           Section games
│   │       ├── art.js       Turtle, hearts, speaker and stars shared by the games
│   │       ├── listening.*  Harf Yağmuru (letters), Hece Balonları (syllables), Şekil Yağmuru (joined shapes), Cezm Balonları; its .rain-* kit is shared
│   │       ├── bridge.*     Cam Köprü, the mixed game at the end of every cove
│   ├── din-bilgisi/         Question island: sorular.js + game.js + style.css + ada.svg + kapsam.md
│   ├── fen-bilimleri/       Question island: same pattern
│   └── sosyal-bilgiler/     Question island: same pattern
├── admin/                   Yönetici sayfası: every player of every device, read from the cloud copy; signs in with
│                            the admin's Google account (automatically when the browser is already signed in to it)
│                            or Firebase e-mail and password. Nothing links to it; open …/admin/.
└── deneme/                  Deneme Odası: playable drafts of proposed Elif Ba games (OYUN-ONERILERI.md).
                             Nothing in the game links to it; open …/deneme/.
tools/                       Helper scripts (not published)
├── kapsam.js                Checks every question island against its textbook checklist
├── make_sounds.py           → app/assets/audio/ui/*.wav
└── elif_sesleri.py          → app/assets/audio/elif-ba/ (harf, hece, kayitlar.js)
elifba-ses-onizleme/          The girl's voice as recorded (also tenvin, şedde, uzatma …, not used yet) with a page to listen to them
sources/                     Raw material (not published)
└── elifba-sesleri/          Diyanet Elifba audio library, organized by lesson, plus katalog.json
```

### Rules

- **The whole textbook is asked.** Every question island that follows a textbook, for every grade (1st, 2nd, 3rd and 4th grade islands alike), covers the whole book: when the child has learned every question of the island, nothing in the book is left unlearned. To make sure of it, each island keeps `islands/<ada>/kapsam.md`, a checklist drawn from the book page by page: every definition, concept, event, date, person, place and example is one line (so is every glossary word, the front pages, the chronology and the maps at the back), and the line ends with the ids of the questions that ask it (`- s. 13 · … → birey:0, birey:4`). A point with no question gets a new question before the island ships. `node tools/kapsam.js` must pass: it fails on a point without a question, on an id that does not exist, on an island without a checklist, and on a malformed question (four different options, a balanced `*underline*`, a real exam year). Points that the book only mentions in passing still get a question; topics outside the book go to the island's extra stop.
- **`core/` contains only what more than one island uses.** Code that belongs to a single island stays in that island's folder.
- **Every sound lives under `app/assets/audio/`**: effects in `ui/`, and each island's or section's recordings in their own subfolder. The raw, unprocessed library is kept in `sources/` and is not published.
- **Load order matters** because the files are plain scripts: `core/js/app.js` → `sounds` → `fx` → islands and core helpers → `core/js/settings.js` (last).
- **One look for back and close buttons** (`core/css/base.css`): a button that goes back to a place with a name is `.btn-back` (a pill with a chevron badge: *Keşif Limanı*, *Yol*); a button that leaves a game, a round or a map level is `.btn-round` (a round icon button, × by default, ‹ with `.is-back`; it has no text, so it needs an `aria-label`). Islands only place them (float, position); they do not restyle them.
- **Cache busting:** every `<link>`/`<script>` address in `index.html` ends in `?v=…`. When you change a file, bump its number.
- **The cloud is only a copy.** `core/js/sync.js` notices every change to the game's keys (it wraps `Storage.prototype.setItem/removeItem`) and, a few seconds later, writes a snapshot of them to Firestore as `cihazlar/{the device's anonymous uid}`; offline it waits. localStorage stays the game's save and the game never waits for the cloud. A development copy (its version not stamped by the publish workflow) and a browser driven by a program (Playwright, headless Chrome) send nothing: every test run starts with an empty browser and would show on the admin page as one more device. The admin page hides the documents such copies sent before 0.42.1 (version *geliştirme*) behind a *göster* link. Deleting a player (Settings → Oyuncu, confirmed by typing SİL) sends the change at once, so the player leaves the admin page; when a device has no players left, its document is deleted. The Firestore rules (set in the Firebase console) let a device write only its own document and only the admin account read them:
  ```
  match /cihazlar/{uid}/{doc=**} {
    allow read: if isAdmin() || (request.auth != null && request.auth.uid == uid);
    allow write: if request.auth != null && request.auth.uid == uid;
  }
  ```
  Google sign-in on the admin page needs Google turned on in Firebase (Authentication → Sign-in method), and the
  site's address (`https://chtcngz.github.io`) under *Authorized JavaScript origins* of that Web client in Google
  Cloud Console (APIs & Services → Credentials). The client ID is read from Firebase, or from `googleClientId` in
  `core/js/bulut-ayar.js` when set. If the Google account gets a different UID from the old e-mail account,
  `isAdmin()` must name it too.
- **Saved-data keys never change.** Progress is kept in localStorage (`carpim-adasi-profiller`, `carpim-adasi-oyuncu-*`, `elif-ba-v2-*`, `din-bilgisi-*`, `akvaryum-*` …). Renaming a key wipes the children's progress. Every key of a player ends in the player's id, so deleting the player removes them all.

## Akvaryum

Every player, from preschool to the 4th grade, has an aquarium of their own. Each task the child gets done brings a reward, a fish or an
ornament: an islet of Elif Ba Adası finished (its Cam Köprü crossed; the first three rewards are fish, then ornaments and
fish take turns: `karisik` in `akvaryum.odul`; islets finished before 0.41.0 are rewarded the next time the map shows), an island of Çarpım Adası (once per island and round) or one of its mixed stages, a round finished on a question island's stop that
still has questions to learn, all the questions of a stop learned (once), a first mock exam or a new record, a
Tekrar Kutusu round without a mistake. Every third reward is an ornament. A tank holds 12 fish and 6 ornaments; the
next reward opens a new tank in the next theme (Mercan Koyu, Yeşil Vadi, Gece Mavisi, Gün Batımı Lagünü, then again).
A tap on a fish lets the child give it a name, written above it from then on; a tap on the water sprinkles food: rings
spread on the water, the flakes scatter and sink, swaying, and the nearest fish come over, bring their mouths to a flake,
dart the last bit, snap it up (it is sucked into the mouth, the fish gulps and a few bubbles rise), chew a moment and go
on to the next flake until they have had their fill. For a preschool player the tank's lines are also said aloud in the
device's voice (`akvaryum.sesVer`, given by Elif Ba), and a 🐢💬 button says what to do there. Its fish also blow letter bubbles
(`akvaryum.harfBalonu`, given by Elif Ba): every 3 s one fish, never the same twice running, blows a clear bubble with
something of the player's current level (letters, then harekeli syllables, then harekeli joined shapes, then cezm
syllables: only the latest section with letters learned, only those letters); a tap pops it and says it, an untouched
one rises and fades at the surface.

Players who had played before the aquarium came get, once (`gecmis` in their record), the rewards of the tasks
already done: every island and mixed stage of Çarpım Adası finished, the rounds finished on each stop of a question island (counted
from the right answers given there, nine to a round), every stop learned in full, and the mock exam if taken.

The fish are drawn on one canvas (`.ak-school`) from pictures made once per kind (each fish's SVG turned into a
bitmap while the page is idle); an empty button over each fish is what a tap or the keyboard reaches. The water has
no blend modes or blur filters: on tablets they made the whole tank repaint every frame and the page froze.

It is saved as `akvaryum-<player id>`: the items in the order they came, each with its kind, its tank, its name and
what earned it. Item kinds are ids in `core/js/akvaryum-veri.js`; never rename one. The tank opens from the 🐠 button
in the header, from its card in Keşif Limanı and from the reward card on a result screen. Players whose grade has no
island that gives rewards (catalog cards marked `data-akvaryum`) do not see it.

## Adding something new

**Elif Ba is for children who cannot read yet.** Every instruction can be heard from a 🐢💬 button (`elifVoice.instruct`); the introductions of games and sections are said only when it is tapped, a question's instructions also when they first come; choices are letters, sounds or pictures, never words (see `CLAUDE.md`).

**A new Elif Ba section** (Tenvin, Şedde …):
Elif Ba is a single path (the `steps` list in `game.js`). The first seven coves (`LETTER_COVES` in `data.js`) teach the letters, four each: Harfler → Harf Yağmuru → Harekeler → Hece Balonları → Cam Köprü; the first cove also has Harekelerle tanış before Harekeler. From the eighth cove on (`coveTopic(k)` is `bitisik`), the same groups of four come again for bitişik yazılış: Bitişik yazılış → Şekil Yağmuru → Cam Köprü, with the panes in the harekeli letters' joined shapes (ـبَـ). There are seven of them, Martı Adacığı (ا ب ت ث) to Gökkuşağı Adacığı (ن و ه ي). The children know the harekes by then, so nothing in these coves is shown without one: the example words of all 28 letters in `data.js` are fully harekeli three-letter words with no cezm, şedde or tenvin (كَتَبَ), read syllable by syllable from the syllables' own recordings (Diyanet's harekesiz example words and their recordings in `kelime/` are no longer used). From the fifteenth cove on (`cezm`), the groups of four come a third time: Cezm → Cezm Balonları → Cam Köprü, Dalga Adacığı to Ay Işığı Adacığı, with Diyanet's cezm syllable of each letter (`cezm(i)` in `data.js`: بِسْ for sin), so the path has 21 coves. Cam Köprü only ever shows harekeli letters: syllables in a letter cove, joined harekeli shapes in a bitişik cove, cezm syllables (and nothing else) in a cezm cove. `coveTopic(k)` gives a cove's section from `TOPICS`; a new section of seven coves adds its id there. Cam Köprü is the cove's mixed (Karma) game and crosses over to the next cove. Only the next step can be opened, and from the second cove on every round mixes in letters from the earlier coves.

On the map a cove is an islet (adacık), and the seven islets of a section lie in one bay (koy): Harf Koyu, Bitişik Koyu, Cezm Koyu (`bays` in `data.js`; `bayCoves(b)` and `bayOf(k)` go between them). The map (`map.js`) has three levels in one frame, and a tap zooms from one into the next: the bays, each with its name, what is learned there, a little sign of it and its seven islets as dots in its lagoon; a bay, its seven islets joined by glass bridges and, at its mouth, the boat to the next bay; and an islet, its steps as round picture stations on a path. The bays of the sections still to come (Tenvin, Şedde, Uzatma, Âyet) stand on the map under clouds, locked and *Yakında*, while their section in `sections` is `soon`. The turtle stands on the islet being looked at; it walks over the bridges between islets and, once a bay's last islet is done, boards the boat at the bay's mouth and sails along the sea lane to the next bay, which opens with a celebration. A step in another islet (the Sıradaki button, Devam after a step) is reached the same way, then opens. ‹ zooms back out one level; tapping a bay's or an islet's name says it aloud. `game.js` gives the map what is open (`render`) and what a tap does (the handlers of `build`); the moves are promises that `game.js` chains into a journey (`bring`, `reachBay`). Each level has a fixed layout of 400 × 680: `BAY`, `ISLE` and the stations (`stationSpots`) in `map.js`.

To add a section:
1. Remove the `soon` flag from the section's entry in `islands/elif-ba/data.js` (its bay on the map opens: give it a `say` that tells what is learned there and its id in `TOPICS`), add its steps to the `steps` list in `game.js`, and delete its line from `YAPILACAKLAR.md`. A new bay needs its sea colours in `seas` and its decorations in `bayArt` (`map.js`).
2. Add the section's screen and rounds to `islands/elif-ba/game.js`.
3. Put its recordings under `app/assets/audio/elif-ba/<bölüm>/` and register them in `kayitlar.js`.
4. If it gets a game, add it under `islands/elif-ba/games/`. Listening games can reuse `listening.js` with a new `kind`; a new game can take its top bar, hearts and cards from the `.rain-*` classes of `listening.css` and its turtle from `art.js`, as `bridge.js` does.

**A new question island** (for example Türkçe, or Hayat Bilgisi for the 1st-3rd grades):
1. Get the textbook the schools use this year and write `islands/<ada>/kapsam.md`: every point of the book, unit by unit, with its page.
2. Create `islands/<ada>/sorular.js` (the question bank), `game.js` (a single `soruAdasi({...})` call), `style.css` and `ada.svg`. Write questions until every checklist line ends with the ids of the questions that ask it, and run `node tools/kapsam.js <ada>` until it passes.
3. Add its view, dialog, catalog card (`data-grades` says which grades see it, `data-akvaryum` that it fills the aquarium) and its Settings → Progress section to `index.html` using the `#<kod>-…` id pattern, and load its scripts after `core/js/quiz.js`. `soruAdasi` already gives the aquarium its rewards.

**A new island with its own engine:** use `islands/<ada>/` and add its catalog card to `index.html`. If more than one island needs some code, move that code into `core/`. To fill the aquarium, mark the card `data-akvaryum`, call `akvaryum.odul({ anahtar, neden })` when the child gets a task done (`anahtar` for a task that rewards only once) and put `akvaryum.kart([reward])` on the result screen.

## Versions

The version number is kept in `VERSION`, and the changes are listed in `CHANGELOG.md`.
