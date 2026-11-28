# Bilgi Adası · notes for Claude

Read `README.md` first: folder layout, load order, cache busting and the saved-data rules all live there.
The game, its questions and the changelog are in Turkish; code comments and the README are in English.

## The textbook rule (set by the owner, applies to every grade)

Every question island that follows a school textbook covers the **whole** book, for 1st, 2nd, 3rd and
4th grade islands alike. When a child has learned every question of an island, nothing in the book may
be left unlearned.

- Work from the textbook the schools use in the current school year. If you cannot find it, ask the
  owner for the PDF.
- Write `app/islands/<ada>/kapsam.md` first: the book, page by page, as a checklist. Every definition,
  concept, event, date, person, place and example is one line. The front pages (İstiklal Marşı,
  Gençliğe Hitabe), boxes, news clippings, every glossary (sözlük) word, the chronology and the maps
  at the back count too.
- A glossary word that a unit question already asks points at that question; otherwise it gets a new
  question at the end of the stop of the unit where the word is used. Front pages and back maps that
  belong to no unit go to the first stop or the stop closest in topic, or to `ekstra`.
- Every line ends with `→` and the ids of the questions that ask it (`birey:0` is the first question of
  the stop whose id is `birey`). A fact that only appears in an explanation (`b`) does not count: it
  needs a question that asks it.
- `node tools/kapsam.js` must pass before every commit that touches a question island. For İngilizce Koyu it also rewrites the island's `sira.js`
  (the page of every question, which orders the stations; only the English islands are ordered this way): commit it with the change and bump its `?v=` in `index.html`.
- Question ids are the stop id plus the position, and children's progress is saved against them: only
  ever append questions to the end of a stop; never delete or reorder them.
- Topics an exam asks but the book does not teach go to the island's `ekstra` stop, not to a unit stop.

## English for Kids (set by the owner)

`app/english/` (…/bilgi-adasi/english/) is the English for Kids site: English Koyu only, built from the owner's topic map
(*English for Kids — Konu Haritası*, 13 bölüm). One island per bölüm (`app/islands/english-<n>/`), one station per topic. Until
the owner says otherwise, work only on bölüm 1 (İlk Adımlar: Greetings, Alphabet, Numbers, Question Words).

- **Never write questions unless the owner asks for them.** The owner gives each station's word list; it lives in the island's
  `kelimeler.js` (and `kapsam.md`).
- **A question may use only the words of those lists.** The only extras allowed: English first names, and ages from 5 to 20, in
  questions and answers about names and ages.
- Nobody plays the site yet (only the owner, testing), so questions may keep the stop id `ilk` when they are written again.
- A station is cut into **etaps** of related words (the `gruplar` of `kelimeler.js`; Selamlaşma has 6). Tapping a station opens
  its etaps as small round pictures; an etap shows its **tanıtım kartları** (a big picture, the English, the Turkish, 🔊 🐢), and
  the next etap opens once its last card is reached (`app/english/koy.js`).
- **Balon sorusu** (`app/english/balon-sorusu.js`): a picture whose speech bubble is empty and three English cards to drag into
  it; tapping a card says it. A question belongs to the etap of its word (`k[0]`) and comes after that etap's cards. Its picture
  goes to `assets/images/english/soru/` with the bubble's "?" painted out (the game draws the "?"), and any writing in the
  picture that gives the answer away (a "Welcome" sign) is painted out too. Wrong options are words of the list that are
  clearly wrong in the scene. **In a greeting question (set by the owner) a wrong option is never a greeting that could be
  right in the scene (Hi, Hello) and never a farewell (Goodbye, Bye, See you …)**: the wrong options are the time-of-day
  greetings that the scene's time clearly rules out (in an evening scene Good morning and Good afternoon; Good night and Good
  evening are never wrong options for each other, they are too close). A scene with no clock says the time in its Turkish story ("Öğleden sonra …",
  "Akşam …"). A round of an etap asks at most 6 of its questions (one of every word first), in a new order every time.
- The characters: the boy is **Leo**, 9 years old; the girl is **Maya**, 10. A picture whose bubble needs other words gets them
  with `tools/baloncuk.py` (the owner asks for the bubble's text; e.g. "My name is Leo.", "I’m 9 years old.").
- The owner picks the pictures of the words and of the questions on `…/english/resimler/` (up to six each, first = main; grouped
  bölüm › station › etap › Resimler / Soruları); the choices and uploads are in Firestore `resimler/…`. "Resimleri oyuna işle"
  means: read them (public read) and bring them into the game. A question's new picture needs its bubble measured again and its
  "?" (and any writing that gives the answer away) painted out.

## Elif Ba: the children cannot read yet (set by the owner)

The children who learn the Elif Ba cannot read or write, in Turkish or in Arabic. Design every section and
game of Elif Ba Adası for them:

- Nothing may need reading. Every instruction can be heard (`elifVoice.instruct`, the device's Turkish voice) from a
  🐢💬 (info) button. The introductions of games and sections (what the game or the section is about) are silent by
  default and said only when 🐢💬 is tapped; the instructions of a question are still said when they first come.
  Written text may stay for the grown-ups, except on the steps that teach the marks (below).
- The steps that teach the marks (Harekeler, Cezm, Tenvin, Şedde) name no mark: no 🐢💬 introduction and no written one,
  no Turkish words under the letters, and tapping a card or ♪ plays only Arabic letters and syllables (be, bi, bu; bi,
  bis; be, ben; bis, se, bisse), never "üstün", "iki ötre", "cezm", "şedde". The note line under the cards stays empty.
  (Harekelerle tanış, the lesson that first names the harekes, still says them.)
- Choices are letters, sounds or pictures, never words. A place in a word is a picture of three boxes, right
  to left (`placeIcon`), not "Başta / Ortada / Sonda".
- Buttons carry a symbol (▶ ↻ 🏁 ✓), not only a word; right and wrong are shown by colour, sound and the
  right answer being played.

## Question style

- Turkish, for 9-10 year olds. The first option is the correct one (the game shuffles them). Keep the
  four options of similar length so the longest one is not a giveaway. `*…*` underlines negatives such
  as *değildir*, as the printed exams do.
- `y` is the year of the Tevfik İleri entrance exam that asked a similar question. Never copy exam or
  textbook text word for word; rewrite it in the same style.

## To-do list (set by the owner)

`YAPILACAKLAR.md` lists the work not done yet. When an item is finished and in the game, delete its line (do not
tick it); the changelog records what was done. New planned work the owner asks for goes on the list.

## Going live (set by the owner)

As soon as a piece of work is finished (committed, `node tools/kapsam.js` passing when a question island changed, tried in
the browser), publish it without waiting to be asked: merge it into `main` and push `main`, which deploys `app/` to
GitHub Pages. Work on the session's branch, then bring `main` up to date with it; never rewrite `main`'s history.

## Versions

Every change the children can see bumps `VERSION` and gets a Turkish entry in `CHANGELOG.md`.
