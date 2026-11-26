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
│   │   ├── harita-sanat.js  Drawings shared by the maps: paths, palms, lighthouses, boats, waves, the sea (haritaSanat)
│   │   ├── harita.js        Keşif Haritası, the 1st-4th grades' map: bays → a bay's islands → an island's stations (kesifHaritasi)
│   │   ├── profiles.js      Players, grade levels, Keşif Limanı (the map, or for preschool the island cards)
│   │   ├── stats.js         Çarpım statistics
│   │   ├── quiz.js          Question-island engine: soruAdasi({...})
│   │   ├── ingilizce-oyunlari.js  İngilizce Koyu's games (a station's round is played as games) and its recorded English voice
│   │   ├── kelime-resimleri.js    Drawn pictures for the words no emoji shows, written [[name]] in a question (kelimeResimleri)
│   │   ├── akvaryum-veri.js Akvaryum: the fish, ornaments and tank themes (names, sizes; the admin page loads it too)
│   │   ├── akvaryum-sanat.js Akvaryum's drawings: fish, ornaments, plants (SVG), sand and caustics (canvas)
│   │   ├── akvaryum.js      Akvaryum: every player's own tank, rewards (akvaryum.odul / akvaryum.kart), naming the fish
│   │   └── settings.js      Settings window, progress and reset (loaded last)
│   └── css/
│       ├── base.css         Font, colors, catalog, shared components
│       ├── harita.css       The maps' living drawings (waves, palms, boats …) and Keşif Haritası (.kh-*)
│       ├── quiz.css         Shared .soru-* look of the question islands' game window
│       ├── ingilizce-oyunlari.css  The .og-* look of İngilizce Koyu's mini games
│       └── akvaryum.css     The tank, the reward card, the header button and the card in Keşif Limanı
├── assets/                  All media in one place
│   ├── fonts/               Nunito + license
│   ├── images/              Shared images (ada-atlasi.jpg)
│   └── audio/
│       ├── ui/              Effect sounds (tools/make_sounds.py generates them)
│       ├── ingilizce/       İngilizce Koyu's English lines in a natural voice (tools/ingilizce_sesler.py): <id>.mp3, slow <id>-y.mp3,
│       │                    kayitlar.js (line → id), KAYNAKLAR.md
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
│   ├── carpim/              Çarpım Koyu (game.js): six islands, tables 2-10 at 15, 10, 5 and 3 s a question (the nine
│   │                        tables are an island's stations), then two mixed islands (5 and 3 s): every product of
│   │                        2-9 once, shuffled on every start
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
│   ├── din-bilgisi/         Question island: sorular.js + game.js + kapsam.md
│   ├── fen-bilimleri/       Question island: same pattern
│   ├── ingilizce-2/ -3/ -4/ İngilizce Koyu, one question island per grade (each grade sees only its own); 2nd grade done, 3rd and 4th still empty
│   └── sosyal-bilgiler/     Question island: same pattern
├── kontrol.html             Resim kontrolü: the owner picks İngilizce Koyu's pictures by hand and copies the choices (not linked)
├── admin/                   Yönetici sayfası: every player of every device, read from the cloud copy; signs in with
│                            the admin's Google account (automatically when the browser is already signed in to it)
│                            or Firebase e-mail and password. Nothing links to it; open …/admin/.
└── deneme/                  Deneme Odası: playable drafts of proposed Elif Ba games (OYUN-ONERILERI.md).
                             Nothing in the game links to it; open …/deneme/.
tools/                       Helper scripts (not published)
├── kapsam.js                Checks every question island against its textbook checklist
├── make_sounds.py           → app/assets/audio/ui/*.wav
├── elif_sesleri.py          → app/assets/audio/elif-ba/ (harf, hece, kayitlar.js)
├── ingilizce_metinler.js    Every English line İngilizce Koyu says (question words and sentences, the games' lines)
└── ingilizce_sesler.py      → app/assets/audio/ingilizce/: records those lines with Kokoro (needs the model, see the file)
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
  `islands/ingilizce-*/sira.js` is rewritten by `node tools/kapsam.js` whenever kapsam.md changes: bump its number too.
- **İngilizce Koyu: six islands × four weeks.** Each theme is an island and each island four stations, *Hafta 1-4*, in the
  book's order; a week opens when the round of the one before has been finished (`progress.bolum`, or when every question
  of the weeks before is learned). After a round: *Sonraki bölüm*, *Tekrar oyna*, *Harita*.
- **İngilizce Koyu: a picture above every question** (`ingilizceOyunlari.sahne`, used by Bilgi Kartı and the question
  rounds): a dialogue to answer is a scene (the asking child and the question, the thing in the middle, the answering
  child with ✅/❌ and the answer blank), a dialogue to understand shows both lines, a word to listen to is a big card or 🎧,
  a word to say is its picture, big. The stems say what to do ("Dinle ve doğru anlamı seç: “desk”", "Evet diyerek cevap
  ver: “Is this a library?”", "Arkadaşını görünce nasıl “merhaba” dersin?").
- **Stations in the book's order (İngilizce Koyu only, set by the owner):** `sira.js` gives every question the first book page that asks it (kapsam.md; the table of
  contents does not count, and an English word asked from the glossary goes to the page of its unit that first uses it).
  `kitapSirasi()` (core/js/quiz.js) puts it on the questions, and a unit is cut into stations in that order, so station 1 is
  the unit's first pages. The bank's own order and the ids do not change. After a round the game offers the next station,
  the one before it and the same one again, never the exam.
- **The cloud is only a copy.** `core/js/sync.js` notices every change to the game's keys (it wraps `Storage.prototype.setItem/removeItem`) and, a few seconds later, writes a snapshot of them to Firestore as `cihazlar/{the device's anonymous uid}`; offline it waits. localStorage stays the game's save and the game never waits for the cloud. A development copy (its version not stamped by the publish workflow) and a browser driven by a program (Playwright, headless Chrome) send nothing: every test run starts with an empty browser and would show on the admin page as one more device. Every device also has a *kimlik* of six letters and digits (`K7Q-X2M`), worked out from its anonymous uid by
  `cihazKimligi` (`core/js/bulut-ayar.js`): nobody gives it, and it never changes while the device keeps its account. The
  admin page names every device by it and filters by it (*Cihaz:* chips, or a device in the players' table; the choice
  stays in the address as `#cihaz=K7Q-X2M,…`), and the game shows it at the bottom of Settings, to tell which tablet is
  which. The admin page hides the documents such copies sent before 0.44.1 (version *geliştirme*) behind a *göster* link. Deleting a player (Settings → Oyuncu, confirmed by typing SİL) sends the change at once, so the player leaves the admin page; when a device has no players left, its document is deleted. The Firestore rules (set in the Firebase console) let a device write only its own document and only the admin account read them:
  ```
  match /cihazlar/{uid}/{doc=**} {
    allow read: if isAdmin() || (request.auth != null && request.auth.uid == uid);
    allow write: if request.auth != null && request.auth.uid == uid;
  }
  match /oyuncular/{kod} {
    allow get, create, update, delete: if request.auth != null;
    allow list: if isAdmin();
  }
  ```
- **Oyuncu kodu.** Every player has a code of eight letters and digits (`kod` in `carpim-adasi-profiller`, shown in
  Settings → Oyuncu with a copy button; players saved before 0.47.0 get one when the page opens). Besides the device's
  document, `sync.js` keeps a document per player, `oyuncular/{kod}`: the player, every key ending in the player's
  id, and when the player last changed something (`degisti`). On another device, *Kim keşfe çıkıyor? → Oyuncu kodum
  var* loads that document: the player keeps the same id, so the keys and the admin page match. When the page opens,
  a player whose document is newer than this device's copy (played elsewhere since) is updated before being chosen;
  the device where the player last played wins. A newer copy that lacks a key this device keeps (an
  island, the aquarium) is not taken: this device's copy goes up as the newest instead, and no key is ever removed by a
  copy from the cloud. The code is the only key to the document (anyone signed in who knows
  it may read and write it, nobody but the admin may list them), so it is shown only in Settings. Deleting a player
  deletes their document too; another device that still has the player sends it again when they play there. The admin
  page lists a player found on several devices once, naming every device.
  Google sign-in on the admin page needs Google turned on in Firebase (Authentication → Sign-in method), and the
  site's address (`https://chtcngz.github.io`) under *Authorized JavaScript origins* of that Web client in Google
  Cloud Console (APIs & Services → Credentials). The client ID is read from Firebase, or from `googleClientId` in
  `core/js/bulut-ayar.js` when set. If the Google account gets a different UID from the old e-mail account,
  `isAdmin()` must name it too.
- **Saved-data keys never change.** Progress is kept in localStorage (`carpim-adasi-profiller`, `carpim-adasi-oyuncu-*`, `elif-ba-v2-*`, `din-bilgisi-*`, `akvaryum-*` …). Renaming a key wipes the children's progress. Every key of a player ends in the player's id, so deleting the player removes them all.

## Keşif Haritası

For the 1st to 4th grades, Keşif Limanı is a map in three levels, like Elif Ba Adası's map is for preschool
(`core/js/harita.js`): the bays (one for every subject of the player's grade: Çarpım Koyu for the 2nd-4th grades, Din
Bilgisi, Fen Bilimleri and Sosyal Bilgiler Koyu for the 4th, and an İngilizce Koyu for each of
the 2nd-4th grades, each with its own grade's book), a bay's islands joined by bridges, and an island's stations
on a path. A tap zooms in, ‹ zooms out; the player's own icon stands on the island and the station to do, and walks on
when one is done. A panel beside the map (under it on phones) has the Sıradaki button, the progress and the notes.

- **Çarpım Koyu** has six islands, named after how fast the child must be: Kaplumbağa, Tavşan, Ceylan and Çita Adası
  (15, 10, 5 and 3 s a question), each with the tables 2-10 as its nine stations, then Girdap and Şimşek Adası (mixed,
  5 and 3 s), one station each. Only the next station opens; a station already done shows its last
  attempt. Finishing an island brings a fish.
- **A question island's bay** has an island for every textbook unit, one for the extras and one for the mock exam (the
  last two open once every unit has a star). A unit's stations cut its questions in the book's order into three to six
  parts of about twenty; a round on a station asks ten of them. A station is done when its questions are learned, an
  island when the whole unit is.

- **İngilizce Koyu** uses the same engine with two options of `soruAdasi`. `ses: 'en-GB'`: a question's `k`
  (`[English, Turkish, emoji?]`) is said in the device's English voice: before the answer when it is not one of the options
  (it would give the answer away), and always after it. A question with `d: 1` is asked by ear only (the word is not written
  unless the device has no English voice). `yanlisAvi: true`: the bay gets a 🎯 Yanlış Avı island after the mock exam. It
  opens once Tekrar Kutusu holds 6 wrong answers; a round lays up to 6 of them out as English and Turkish cards to match
  (one card per word and per meaning). A pair matched on the first try counts as a right answer, so it leaves Tekrar Kutusu;
  a round without a wrong match brings a reward. Yanlış Avı has a second station, 🎈 Balon Patlat (the wrong words float
  up as balloons with their meaning; pop the one you hear). `oyunlar: { sepet }`: a station's round (and a Tekrar Kutusu
  round) is not a quiz but a row of games (`core/js/ingilizce-oyunlari.js`, `ingilizceOyunlari.tur`): its ten questions
  are cut into games and every game answers its own questions through the same `note()`, so learning, stars, Tekrar
  Kutusu and rewards work as before. A word with a picture (`k[2]`, not an abstract one) goes to Dinle ve Bul, Balon
  Patlat or Sesli Hafıza; a colour to Sihirli Boyama; a food listed in `sepet` to Meyve Sepeti; a sentence of 3-7 words
  that the question asks in English to Kelime Treni; anything else is a Bilgi Kartı (the question itself, with a second
  try). A miss in Sesli Hafıza is only memory, so a found pair counts as right. **Pictures (`k[2]`):** every word and every sentence has one, and it shows the thing itself (library 🏛️, not 📚); two words with different meanings never share one. A thing no emoji shows is drawn in `core/js/kelime-resimleri.js` and written `[[name]]` wherever an emoji would stand (k[2] and the texts: `[[desk]] sıra`); `rich()` and the games' `pic()` draw it. In a picture of a part or a person (tail, son) the one meant is in colour and the rest grey; a day is a week card with that day marked. A question's options carry pictures all or none, so a lone bare option does not give the answer away. Games start straight away (no title card); 
  player's icon cheers as a mascot, and every line is awaited before the next. **Two voices, one line at a time:** every line goes through a flow (`konusmaci()`): a new tap drops the lines still waiting in an older one, so two lines never run into each other. After a right answer the praise comes, a pause, then the answer in the answer voice (am_michael, `<id>-b.mp3`, `window.ingilizceKayitlarB`); a dialogue (“How are you? I’m fine, thank you.”) is said by both voices, and a Bilgi Kartı asks only its question half. Sesli Hafıza: both cards say their word, cards open one after another without waiting. The balloons, the train and the brush are moved frame by frame in JS (`frames`, `tween`), and base.css leaves `.og-head`/`.og-game` out of its reduced-motion rule: these movements are the game, and a device asking for less motion used to see no balloons at all. Sihirli Boyama paints only where the brush has gone (a mask path that grows along the brush's way). `ikinciSans: true` gives the classic
  question rounds a second try too. **The voice:** every English line (`tools/ingilizce_metinler.js`) is recorded with
  Kokoro (`tools/ingilizce_sesler.py`, voice af_heart, a normal and a slow 🐢 file; the answers also in am_michael) and played through the game's Web
  Audio context (`ingilizceSes`); a line without a recording falls back to the device's best English voice. When
  questions or game lines change, run the tool again: it records only the new lines and removes the files of lines that
  are gone. The 2nd grade bank was generated from the book in the order of its pages
  (every word gets a "what does it mean", "which is it in English" or "listen" question in turn, with wrong options from the
  same group of words and never two that mean nearly the same); from now on questions are only appended by hand.
- **A question island whose bank is still empty** (İngilizce Koyu's 3rd and 4th grade, until their questions are written) shows its
  bay with *Yakında* and a single locked island; its Settings → Progress section stays hidden, the admin page leaves it
  out, and `node tools/kapsam.js` skips it until its first question (then its `kapsam.md` is required like any other).

Each bay is registered by its island (`kesifHaritasi.koy({...})`), which the map asks what is open every time it draws.

## Akvaryum

Every player, from preschool to the 4th grade, has an aquarium of their own. Each task the child gets done brings a reward, a fish or an
ornament: an islet of Elif Ba Adası finished (its Cam Köprü crossed; the first three rewards are fish, then ornaments and
fish take turns: `karisik` in `akvaryum.odul`; islets finished before 0.41.0 are rewarded the next time the map shows), an island of Çarpım Koyu (always a fish: `balik` in `akvaryum.odul`, once per island; islands finished before 0.43.0 are rewarded the next time the map shows), a round finished on a question island's stop that
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
already done: every island of Çarpım Koyu finished, the rounds finished on each stop of a question island (counted
from the right answers given there, nine to a round), every stop learned in full, and the mock exam if taken.

The fish are drawn on one canvas (`.ak-school`) from pictures made once per kind (each fish's SVG turned into a
bitmap while the page is idle); an empty button over each fish is what a tap or the keyboard reaches. The water has
no blend modes or blur filters: on tablets they made the whole tank repaint every frame and the page froze.

It is saved as `akvaryum-<player id>`: the items in the order they came, each with its kind, its tank, its name and
what earned it. Item kinds are ids in `core/js/akvaryum-veri.js`; never rename one. The tank opens from the 🐠 button
in the header, from its card in Keşif Limanı and from the reward card on a result screen. Players whose grade has no
island that gives rewards (catalog cards and bays marked `data-akvaryum` in `index.html`) do not see it.

## Adding something new

**Elif Ba is for children who cannot read yet.** Every instruction can be heard from a 🐢💬 button (`elifVoice.instruct`); the introductions of games and sections are said only when it is tapped, a question's instructions also when they first come; choices are letters, sounds or pictures, never words (see `CLAUDE.md`).

**A new Elif Ba section** (Tenvin, Şedde …):
Elif Ba is a single path (the `steps` list in `game.js`). The first seven coves (`LETTER_COVES` in `data.js`) teach the letters, four each: Harfler → Harf Yağmuru → Harekeler → Hece Balonları → Cam Köprü; the first cove also has Harekelerle tanış before Harekeler. From the eighth cove on (`coveTopic(k)` is `bitisik`), the same groups of four come again for bitişik yazılış: Bitişik yazılış → Şekil Yağmuru → Cam Köprü, with the panes in the harekeli letters' joined shapes (ـبَـ). There are seven of them, Martı Adacığı (ا ب ت ث) to Gökkuşağı Adacığı (ن و ه ي). The children know the harekes by then, so nothing in these coves is shown without one: the example words of all 28 letters in `data.js` are fully harekeli three-letter words with no cezm, şedde or tenvin (كَتَبَ), read syllable by syllable from the syllables' own recordings (Diyanet's harekesiz example words and their recordings in `kelime/` are no longer used). From the fifteenth cove on (`cezm`), the groups of four come a third time: Cezm → Cezm Balonları → Cam Köprü, Dalga Adacığı to Ay Işığı Adacığı, with Diyanet's cezm syllable of each letter (`cezm(i)` in `data.js`: بِسْ for sin), so the path has 21 coves. Cam Köprü only ever shows harekeli letters: syllables in a letter cove, joined harekeli shapes in a bitişik cove, cezm syllables (and nothing else) in a cezm cove. In a letter cove's bridge no row is about the letter of either of the two rows before, and no hareke is asked three rows running. `coveTopic(k)` gives a cove's section from `TOPICS`; a new section of seven coves adds its id there. Cam Köprü is the cove's mixed (Karma) game and crosses over to the next cove. Only the next step can be opened, and from the second cove on every round mixes in letters from the earlier coves.

On the map a cove is an islet (adacık), and the seven islets of a section lie in one bay (koy): Harf Koyu, Bitişik Koyu, Cezm Koyu (`bays` in `data.js`; `bayCoves(b)` and `bayOf(k)` go between them). The map (`map.js`) has three levels in one frame, and a tap zooms from one into the next: the bays, each with its name, what is learned there, a little sign of it and its seven islets as dots in its lagoon; a bay, its seven islets joined by glass bridges and, at its mouth, the boat to the next bay; and an islet, its steps as round picture stations on a path. The bays of the sections still to come (Tenvin, Şedde, Uzatma, Âyet) stand on the map under clouds, locked and *Yakında*, while their section in `sections` is `soon`. The turtle stands on the islet being looked at; it walks over the bridges between islets and, once a bay's last islet is done, boards the boat at the bay's mouth and sails along the sea lane to the next bay, which opens with a celebration. A step in another islet (the Sıradaki button, Devam after a step) is reached the same way, then opens. ‹ zooms back out one level; tapping a bay's or an islet's name says it aloud. `game.js` gives the map what is open (`render`) and what a tap does (the handlers of `build`); the moves are promises that `game.js` chains into a journey (`bring`, `reachBay`). Each level has a fixed layout of 400 × 680: `BAY`, `ISLE` and the stations (`stationSpots`) in `map.js`.

To add a section:
1. Remove the `soon` flag from the section's entry in `islands/elif-ba/data.js` (its bay on the map opens: give it a `say` that tells what is learned there and its id in `TOPICS`), add its steps to the `steps` list in `game.js`, and delete its line from `YAPILACAKLAR.md`. A new bay needs its sea colours in `seas` and its decorations in `bayArt` (`map.js`).
2. Add the section's screen and rounds to `islands/elif-ba/game.js`.
3. Put its recordings under `app/assets/audio/elif-ba/<bölüm>/` and register them in `kayitlar.js`.
4. If it gets a game, add it under `islands/elif-ba/games/`. Listening games can reuse `listening.js` with a new `kind`; a new game can take its top bar, hearts and cards from the `.rain-*` classes of `listening.css` and its turtle from `art.js`, as `bridge.js` does.

**A new question island** (for example Türkçe, or Hayat Bilgisi for the 1st-3rd grades):
1. Get the textbook the schools use this year and write `islands/<ada>/kapsam.md`: every point of the book, unit by unit, with its page.
2. Create `islands/<ada>/sorular.js` (the question bank) and `game.js` (a single `soruAdasi({...})` call, with the bay's name, sign and look for Keşif Haritası). Write questions until every checklist line ends with the ids of the questions that ask it, and run `node tools/kapsam.js <ada>` until it passes.
3. Add its game dialog, its bay's `<span id="<kod>-card" data-koy …>` (`data-grades` says which grades see it, `data-akvaryum` that it fills the aquarium) and its Settings → Progress section to `index.html` using the `#<kod>-…` id pattern, and load its scripts after `core/js/quiz.js`. `soruAdasi` puts its bay on the map (the units, the extras and the mock exam as islands; a unit's questions, cut in the book's order into three to six stations) and gives the aquarium its rewards.

**A new island with its own engine:** use `islands/<ada>/`. For the 1st to 4th grades, give it a bay on Keşif Haritası: its `<span data-koy data-grades=…>` in `index.html` and a `kesifHaritasi.koy({...})` call (its islands, each island's stations and what a tap on one opens; see the top of `core/js/harita.js`). For preschool, add a catalog card to `index.html`. If more than one island needs some code, move that code into `core/`. To fill the aquarium, mark the card `data-akvaryum`, call `akvaryum.odul({ anahtar, neden })` when the child gets a task done (`anahtar` for a task that rewards only once) and put `akvaryum.kart([reward])` on the result screen.

## Versions

The version number is kept in `VERSION`, and the changes are listed in `CHANGELOG.md`.
