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
- `node tools/kapsam.js` must pass before every commit that touches a question island.
- Question ids are the stop id plus the position, and children's progress is saved against them: only
  ever append questions to the end of a stop; never delete or reorder them.
- Topics an exam asks but the book does not teach go to the island's `ekstra` stop, not to a unit stop.

## Question style

- Turkish, for 9-10 year olds. The first option is the correct one (the game shuffles them). Keep the
  four options of similar length so the longest one is not a giveaway. `*…*` underlines negatives such
  as *değildir*, as the printed exams do.
- `y` is the year of the Tevfik İleri entrance exam that asked a similar question. Never copy exam or
  textbook text word for word; rewrite it in the same style.

## Versions

Every change the children can see bumps `VERSION` and gets a Turkish entry in `CHANGELOG.md`.
