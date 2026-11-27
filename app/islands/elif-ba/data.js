// Elif Ba Adası: letters, their readings with harekes, their joined shapes, coves and the island's sections.
// Readings follow the Turkish Elif-Ba convention (be-bi-bu, sa-sı-su for the thick letters). They are
// only spoken (by the device's Turkish voice when there is no recording) and compared, never shown.
const elifData = (() => {
  const glyphs = Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنوهي');
  const names = ['Elif', 'Be', 'Te', 'Se', 'Cim', 'Ha', 'Hı', 'Dal', 'Zel', 'Ra', 'Ze', 'Sin', 'Şın', 'Sad',
    'Dad', 'Tı', 'Zı', 'Ayn', 'Gayn', 'Fe', 'Kaf', 'Kef', 'Lâm', 'Mim', 'Nun', 'Vav', 'He', 'Ye'];
  // [üstün, esre, ötre]
  const readings = [
    ['e', 'i', 'u'], ['be', 'bi', 'bu'], ['te', 'ti', 'tu'], ['se', 'si', 'su'], ['ce', 'ci', 'cu'],
    ['ha', 'hi', 'hu'], ['ha', 'hı', 'hu'], ['de', 'di', 'du'], ['ze', 'zi', 'zu'], ['ra', 'ri', 'ru'],
    ['ze', 'zi', 'zu'], ['se', 'si', 'su'], ['şe', 'şi', 'şu'], ['sa', 'sı', 'su'], ['da', 'dı', 'du'],
    ['ta', 'tı', 'tu'], ['za', 'zı', 'zu'], ['a', 'i', 'u'], ['ğa', 'ğı', 'ğu'], ['fe', 'fi', 'fu'],
    ['ka', 'kı', 'ku'], ['ke', 'ki', 'ku'], ['le', 'li', 'lu'], ['me', 'mi', 'mu'], ['ne', 'ni', 'nu'],
    ['ve', 'vi', 'vu'], ['he', 'hi', 'hu'], ['ye', 'yi', 'yu']
  ];
  const harekeler = [
    { name: 'Üstün', mark: 'َ', place: 'Harfin üstünde eğik bir çizgi' },
    { name: 'Esre', mark: 'ِ', place: 'Harfin altında eğik bir çizgi' },
    { name: 'Ötre', mark: 'ُ', place: 'Harfin üstünde küçük bir vav' }
  ];
  // The first seven coves teach the letters and their harekes, four letters each; the next seven go
  // through the same groups of four again to learn how they are written joined (bitişik yazılış), the
  // seven after them to read each letter with a cezm, and the seven after those with a tenvin. On the map a
  // cove is an islet (adacık), and the seven islets of a section lie together in a bay (koy, see `bays` below).
  const coves = ['Kaplumbağa Adacığı', 'İnci Adacığı', 'Mercan Adacığı', 'Yıldız Adacığı', 'Yunus Adacığı', 'Sedef Adacığı', 'Deniz Feneri Adacığı',
    'Martı Adacığı', 'Yengeç Adacığı', 'Ahtapot Adacığı', 'Denizatı Adacığı', 'Balina Adacığı', 'Pelikan Adacığı', 'Gökkuşağı Adacığı',
    'Dalga Adacığı', 'Yelken Adacığı', 'Köpük Adacığı', 'Rüzgâr Adacığı', 'Pusula Adacığı', 'Kumsal Adacığı', 'Ay Işığı Adacığı',
    'Şafak Adacığı', 'Midye Adacığı', 'Çapa Adacığı', 'Flamingo Adacığı', 'Kayık Adacığı', 'Lagün Adacığı', 'Güneş Adacığı'];
  const LETTER_COVES = 7;
  const TOPICS = ['harf', 'bitisik', 'cezm', 'tenvin'];
  const coveTopic = k => TOPICS[Math.floor(k / LETTER_COVES)];
  const sections = [
    { id: 'harf', title: 'Harfler', lead: '28 harfi tanı, sesinden bul', prize: '🐚', prizeName: 'deniz kabuğu' },
    { id: 'hareke', title: 'Harekeler', lead: 'Üstün, esre ve ötre ile oku', prize: '🦪', prizeName: 'inci' },
    { id: 'bitisik', title: 'Bitişik yazılış', lead: 'Harflerin başta, ortada ve sonda yazılışı', prize: '🪸', prizeName: 'mercan' },
    { id: 'cezm', title: 'Cezm', lead: 'Sessiz harflerle hece kur', prize: '⭐', prizeName: 'deniz yıldızı' },
    { id: 'tenvin', title: 'Tenvin', lead: 'İki üstün, iki esre, iki ötre', prize: '🐬', prizeName: 'yunus' },
    { id: 'sedde', title: 'Şedde', lead: 'Harfi iki kez oku', soon: true },
    { id: 'med', title: 'Uzatma', lead: 'Med harfleriyle uzun okuma', soon: true },
    { id: 'okuma', title: 'Kelime ve âyet', lead: 'Kısa surelerle cüze hazırlık', soon: true }
  ];
  // The map shows the bays first: one for every section of seven coves (TOPICS), then the bays of the
  // sections still to come, locked and marked "Yakında" while their section is `soon`. `sample` is a
  // little sign of what is learned there, `say` is read aloud for the children who cannot read yet.
  const bays = [
    { id: 'harf', name: 'Harf Koyu', lead: '28 harf ve harekeleri', sample: 'ا ب ت', say: 'Harf Koyu. Harfleri ve harekeleri öğren.' },
    { id: 'bitisik', name: 'Bitişik Koyu', lead: 'Harfler başta, ortada, sonda', sample: 'ـبـ', say: 'Bitişik Koyu. Harflerin bitişik yazılışını öğren.' },
    { id: 'cezm', name: 'Cezm Koyu', lead: 'Cezimli harflerle hece', sample: 'بِسْ', say: 'Cezm Koyu. Cezimli harflerle hece oku.' },
    { id: 'tenvin', name: 'Tenvin Koyu', lead: 'İki üstün, iki esre, iki ötre', sample: 'بًا بٍ بٌ', say: 'Tenvin Koyu. İki üstün, iki esre ve iki ötre ile oku.' },
    { id: 'sedde', name: 'Şedde Koyu', lead: 'Harfi iki kez oku', sample: 'بَّ', say: 'Şedde Koyu yakında açılacak.' },
    { id: 'med', name: 'Uzatma Koyu', lead: 'Med harfleriyle uzun okuma', sample: 'بَا', say: 'Uzatma Koyu yakında açılacak.' },
    { id: 'okuma', name: 'Âyet Koyu', lead: 'Kelime ve kısa sureler', sample: 'بِسْمِ', say: 'Âyet Koyu yakında açılacak.' }
  ].map(bay => ({ ...bay, soon: sections.find(s => s.id === bay.id).soon === true }));
  // A bay's coves (none in a bay still to come) and the bay of cove k.
  const bayCoves = b => b < TOPICS.length ? Array.from({ length: LETTER_COVES }, (_, n) => b * LETTER_COVES + n) : [];
  const bayOf = k => Math.floor(k / LETTER_COVES);
  // Letters whose Turkish readings sound alike are never offered together in a listening question.
  const sameSound = (a, ha, b, hb) => readings[a][ha] === readings[b][hb];
  const syllable = (letter, hareke) => glyphs[letter] + harekeler[hareke].mark;
  const coveLetters = cove => [0, 1, 2, 3].map(offset => cove % LETTER_COVES * 4 + offset);
  // Bitişik yazılış. A letter has four shapes: alone (0), at the start of a word (1), in the middle (2)
  // and at the end (3); the kashida (ـ) shows the side it joins on. Elif, dal, zel, ra, ze and vav never
  // join the letter after them, so their start shape is the letter alone and their middle shape the end one.
  const places = ['Tek başına', 'Başta', 'Ortada', 'Sonda'];
  const apart = new Set([0, 7, 8, 9, 10, 25]);
  const joinsNext = i => !apart.has(i);
  const KASHIDA = 'ـ';
  // With a hareke h the mark sits on the letter, before the kashida that joins it on (ـبَـ).
  const shape = (i, f, h) => (f >= 2 ? KASHIDA : '') + glyphs[i] + (h === undefined ? '' : harekeler[h].mark) +
    ((f === 1 || f === 2) && joinsNext(i) ? KASHIDA : '');
  // Cezm: the letter with a cezm (sükûn, ْ) has no hareke of its own and is read together with the
  // harekeli letter before it (be esre bi, sin cezm: bis). Diyanet's Elifba ("Cezm", Kavrama) has one such
  // syllable for every letter, the letter being the one with the cezm; in Elif's place it is a hemze.
  const SUKUN = 'ْ';
  const cezmTexts = ['بِئْ', 'تِبْ', 'مُتْ', 'هَثْ', 'يَجْ', 'يَحْ', 'سِخْ', 'قَدْ', 'عُذْ', 'صِرْ', 'وَزْ', 'بِسْ', 'خَشْ', 'فَصْ',
    'رِضْ', 'شَطْ', 'تُظْ', 'نَعْ', 'مَغْ', 'غُفْ', 'فَقْ', 'رَكْ', 'زُلْ', 'هُمْ', 'مَنْ', 'اَوْ', 'صِهْ', 'وَىْ'];
  // Their readings, only spoken by the Turkish voice and compared, never shown.
  const cezmReadings = ['bi’', 'tib', 'mut', 'hes', 'yec', 'yah', 'sih', 'kad', '‘uz', 'sır', 'vez', 'bis', 'haş', 'fas',
    'rıd', 'şat', 'tuz', 'ne‘', 'mağ', 'ğuf', 'fak', 'rek', 'zul', 'hum', 'men', 'ev', 'sıh', 'vey'];
  // cezm(i): the syllable in which letter i has the cezm: its text, the harekeli letter before it
  // ({ i, h }) and the letter with its cezm on its own (سْ).
  function cezm(i) {
    const text = cezmTexts[i];
    const before = glyphs.indexOf(text[0] === 'ى' ? 'ي' : text[0]);
    return { text, before: { i: before, h: harekeler.findIndex(x => x.mark === text[1]) }, sakin: text.slice(2) };
  }
  const plain = reading => reading.replace(/[’‘]/g, '').replace(/ı/g, 'i');
  const cezmAlike = (a, b) => plain(cezmReadings[a]) === plain(cezmReadings[b]);
  // A hemze or ayn with a cezm is only a catch in the voice: its syllable is never set beside the same
  // syllable without the cezm (bi’ and bi), which cannot be told apart by ear.
  const cezmFaint = i => i === 0 || i === 17;
  // Diyanet's own five examples of a cezm: the letters without it, with it, then the word they begin.
  const cezmExamples = [['اَصَ', 'اَصْ', 'اَصْلَحَ'], ['وِرَ', 'وِرْ', 'وِرْدًا'], ['يَئِسَ', 'يَئِسْ', 'يَئِسْنَ'], ['فَحُكَ', 'فَحُكْ', 'فَحُكْمُ'],
    ['اِذَ', 'اِذْ', 'اِذْ قَامُوا']];
  const cezmExampleReadings = [['ase', 'as', 'aslaha'], ['vira', 'vir', 'virden'], ['yeise', 'yeis', 'yeisne'], ['fehuke', 'fehuk', 'fehukmu'],
    ['ize', 'iz', 'iz kamu']];
  // Tenvin: two harekes on the letter (iki üstün ً, iki esre ٍ, iki ötre ٌ) add an n to its sound (be: ben,
  // bin, bun). With iki üstün an elif is written after the letter (بًا) and not read; the elif itself and
  // the lâm-elif carry the mark on the elif (اً, لاً), as in Diyanet's Elifba. h: 0 iki üstün, 1 iki esre, 2 iki ötre.
  const tenvinler = [
    { name: 'İki üstün', mark: 'ً' },
    { name: 'İki esre', mark: 'ٍ' },
    { name: 'İki ötre', mark: 'ٌ' }
  ];
  const tenvin = (i, h) => h ? glyphs[i] + tenvinler[h].mark : i === 0 ? 'اً' : i === 22 ? 'لاً' : glyphs[i] + tenvinler[0].mark + 'ا';
  // Its reading (only spoken by the Turkish voice and compared, never shown): the hareke's and an n.
  const tenvinReading = (i, h) => readings[i][h] + 'n';
  // At the top of every tenvin cove one of Diyanet's words ending in a tenvin, in three steps: its last
  // letter with the hareke, with the tenvin, and the word (بُ ← بٌ ← كُتُبٌ). { i, h } is that last letter.
  const tenvinExamples = [
    { word: 'كُتُبٌ', i: 1, h: 2, reading: 'kutubun' }, { word: 'بِاَخٍ', i: 6, h: 1, reading: 'biehin' },
    { word: 'وِزْرٌ', i: 9, h: 2, reading: 'vizrun' }, { word: 'قَصَصًا', i: 13, h: 0, reading: 'kasasan' },
    { word: 'جَنَفًا', i: 19, h: 0, reading: 'cenefen' }, { word: 'فَلَكٍ', i: 21, h: 1, reading: 'felekin' },
    { word: 'سَكَنًا', i: 24, h: 0, reading: 'sekenen' }
  ];
  // A cove's letters as the map and the path show them: alone, in their middle shape with an üstün in a
  // bitişik cove, with their cezm in a cezm cove, with the three tenvins in turn in a tenvin cove.
  const coveGlyphs = k => coveLetters(k).map((i, n) => coveTopic(k) === 'bitisik' ? shape(i, 2, 0) : coveTopic(k) === 'cezm' ? cezm(i).sakin :
    coveTopic(k) === 'tenvin' ? tenvin(i, n % 3) : glyphs[i]);
  // The example words of the bitişik yazılış: for every letter one word with it at the start, one in the
  // middle and one at the end. The bitişik coves come after the harekes and before the cezm, so every
  // letter of a word has a hareke and none has a cezm, a şedde or a tenvin: three-letter words of the
  // Qur'an's Arabic (كَتَبَ, سَمِعَ, خُلِقَ). The letter meant is in braces. A word is read as its syllables,
  // right to left (ke-te-be).
  const words = [
    ['{اِ}رَمَ', 'سَ{اَ}لَ', 'قَرَ{اَ}'], ['{بَ}عَثَ', 'صَ{بَ}رَ', 'كَتَ{بَ}'], ['{تُ}رِكَ', 'فَ{تَ}حَ', 'نَبَ{تَ}'], ['{ثَ}بَتَ', 'كَ{ثُ}رَ', 'لَبِ{ثَ}'],
    ['{جُ}عِلَ', 'رَ{جَ}عَ', 'خَرَ{جَ}'], ['{حَ}مِدَ', 'بَ{حَ}ثَ', 'فَرِ{حَ}'], ['{خُ}لِقَ', 'دَ{خَ}لَ', 'نَفَ{خَ}'], ['{دَ}خَلَ', 'عَ{دَ}لَ', 'وَجَ{دَ}'],
    ['{ذُ}كِرَ', 'كَ{ذَ}بَ', 'نَفَ{ذَ}'], ['{رَ}جَعَ', 'فَ{رِ}حَ', 'نَصَ{رَ}'], ['{زَ}عَمَ', 'نَ{زَ}لَ', 'بَرَ{زَ}'], ['{سَ}مِعَ', 'حَ{سُ}نَ', 'جَلَ{سَ}'],
    ['{شَ}رِبَ', 'نَ{شَ}رَ', 'بَطَ{شَ}'], ['{صَ}بَرَ', 'نَ{صَ}رَ', 'نَقَ{صَ}'], ['{ضُ}رِبَ', 'حَ{ضَ}رَ', 'فَرَ{ضَ}'], ['{طَ}لَبَ', 'قَ{طَ}عَ', 'خَلَ{طَ}'],
    ['{ظَ}لَمَ', 'نَ{ظَ}رَ', 'حَفِ{ظَ}'], ['{عَ}لِمَ', 'جَ{عَ}لَ', 'سَمِ{عَ}'], ['{غَ}فَرَ', 'رَ{غِ}بَ', 'بَلَ{غَ}'], ['{فَ}تَحَ', 'حَ{فِ}ظَ', 'عَرَ{فَ}'],
    ['{قُ}تِلَ', 'سَ{قَ}طَ', 'خَلَ{قَ}'], ['{كُ}تِبَ', 'رَ{كِ}بَ', 'مَلَ{كَ}'], ['{لَ}عِبَ', 'حَ{لَ}فَ', 'عَمِ{لَ}'], ['{مَ}نَعَ', 'حَ{مِ}دَ', 'ظَلَ{مَ}'],
    ['{نُ}صِرَ', 'مَ{نَ}عَ', 'حَسُ{نَ}'], ['{وَ}جَدَ', 'قَ{وِ}يَ', 'سَرُ{وَ}'], ['{هَ}لَكَ', 'ذَ{هَ}بَ', 'فَقِ{هَ}'], ['{يَ}بِسَ', 'غَ{يِ}رَ', 'رَضِ{يَ}']
  ];
  // word(i, f): the example word of letter i at place f (1-3) as { text, letters, at }: its letters one by
  // one ({ c, i, h }: the letter with its hareke as written, the letter and the hareke) and the place in
  // `letters` of the letter meant.
  function word(i, f) {
    const source = words[i][f - 1];
    const letters = [];
    let at = -1;
    for (const c of source) {
      if (c === '{') { at = letters.length; continue; }
      if (c === '}') continue;
      const h = harekeler.findIndex(x => x.mark === c);
      if (h >= 0) { const last = letters.at(-1); last.c += c; last.h = h; continue; }
      letters.push({ c, i: glyphs.indexOf(c), h: -1 });
    }
    return { text: letters.map(l => l.c).join(''), letters, at };
  }
  // Letters on one skeleton, told apart only by their dots (ب ت ث, ج ح خ …): the games set them side by side.
  const families = [[1, 2, 3], [4, 5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
  const twins = i => (families.find(f => f.includes(i)) || []).filter(j => j !== i);
  return { glyphs, names, readings, harekeler, coves, LETTER_COVES, coveTopic, sections, bays, bayCoves, bayOf, sameSound, syllable, coveLetters, coveGlyphs, twins,
    places, joinsNext, shape, word, SUKUN, cezm, cezmReadings, cezmAlike, cezmFaint, cezmExamples, cezmExampleReadings,
    tenvinler, tenvin, tenvinReading, tenvinExamples, mastery: 2 };
})();
