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
  // through the same groups of four again to learn how they are written joined (bitişik yazılış), and
  // the seven after them to read each letter with a cezm. On the map a cove is an islet (adacık), and the
  // seven islets of a section lie together in a bay (koy, see `bays` below).
  const coves = ['Kaplumbağa Adacığı', 'İnci Adacığı', 'Mercan Adacığı', 'Yıldız Adacığı', 'Yunus Adacığı', 'Sedef Adacığı', 'Deniz Feneri Adacığı',
    'Martı Adacığı', 'Yengeç Adacığı', 'Ahtapot Adacığı', 'Denizatı Adacığı', 'Balina Adacığı', 'Pelikan Adacığı', 'Gökkuşağı Adacığı',
    'Dalga Adacığı', 'Yelken Adacığı', 'Köpük Adacığı', 'Rüzgâr Adacığı', 'Pusula Adacığı', 'Kumsal Adacığı', 'Ay Işığı Adacığı'];
  const LETTER_COVES = 7;
  const TOPICS = ['harf', 'bitisik', 'cezm'];
  const coveTopic = k => TOPICS[Math.floor(k / LETTER_COVES)];
  const sections = [
    { id: 'harf', title: 'Harfler', lead: '28 harfi tanı, sesinden bul', prize: '🐚', prizeName: 'deniz kabuğu' },
    { id: 'hareke', title: 'Harekeler', lead: 'Üstün, esre ve ötre ile oku', prize: '🦪', prizeName: 'inci' },
    { id: 'bitisik', title: 'Bitişik yazılış', lead: 'Harflerin başta, ortada ve sonda yazılışı', prize: '🪸', prizeName: 'mercan' },
    { id: 'cezm', title: 'Cezm', lead: 'Sessiz harflerle hece kur', prize: '⭐', prizeName: 'deniz yıldızı' },
    { id: 'tenvin', title: 'Tenvin', lead: 'İki üstün, iki esre, iki ötre', soon: true },
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
    { id: 'tenvin', name: 'Tenvin Koyu', lead: 'İki üstün, iki esre, iki ötre', sample: 'بً', say: 'Tenvin Koyu yakında açılacak.' },
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
  const shape = (i, f) => (f >= 2 ? KASHIDA : '') + glyphs[i] + ((f === 1 || f === 2) && joinsNext(i) ? KASHIDA : '');
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
  // A cove's letters as the map and the path show them: alone, in their middle shape in a bitişik cove,
  // with their cezm in a cezm cove.
  const coveGlyphs = k => coveLetters(k).map(i => coveTopic(k) === 'bitisik' ? shape(i, 2) : coveTopic(k) === 'cezm' ? cezm(i).sakin : glyphs[i]);
  // The example words of Diyanet's Elifba ("Harfler ve Şekilleri"): for every letter one word with it at
  // the start, one in the middle and one at the end. The letter meant is in braces. Its recordings spell
  // the word's letters by name, right to left.
  const words = [
    ['{ا}مر', 'س{ا}ل', 'نب{ا}'], ['{ب}عث', 'ع{ب}د', 'وه{ب}'], ['{ت}رك', 'اع{ت}دوا', 'سك{ت} جن{ة}'], ['{ث}بت', 'م{ث}ل', 'رف{ث}'],
    ['{ج}عل', 'تع{ج}ب', 'الح{ج}'], ['{ح}ذر', 'يج{ح}د', 'فت{ح}'], ['{خ}لق', 'في{خ}رج', 'ونف{خ}'], ['{د}خل', 'ع{د}د', 'وع{د}'],
    ['{ذ}را', 'ك{ذ}لك', 'نب{ذ}'], ['{ر}جع', 'ف{ر}ض', 'ام{ر}'], ['{ز}عم', 'ن{ز}ل', 'بر{ز}'], ['{س}ال', 'ف{س}جد', 'عب{س}'],
    ['{ش}كر', 'ي{ش}عر', 'بط{ش}'], ['{ص}دق', 'ن{ص}ف', 'نك{ص}'], ['{ض}ل', 'ت{ض}ع', 'ببع{ض}'], ['{ط}بع', 'ف{ط}ر', 'خل{ط}'],
    ['{ظ}هر', 'ن{ظ}ر', 'غل{ظ}'], ['{ع}بد', 'ل{ع}ن', 'من{ع}'], ['{غ}ضب', 'ف{غ}فر', 'بل{غ}'], ['{ف}وقع', 'ك{ف}ر', 'خل{ف}'],
    ['{ق}دم', 'س{ق}ر', 'فس{ق}'], ['{ك}سب', 'م{ك}ر', 'من{ك}'], ['{ل}برز', 'خ{ل}ع', 'جع{ل}'], ['{م}ثل', 'يط{م}ع', 'لم{م}'],
    ['{ن}ظر', 'م{ن}ع', 'بط{ن}'], ['{و}عد', 'ع{و}د', 'دل{و}'], ['{ه}لك', 'ف{ه}م', 'وج{ه}'], ['{ي}تيم', 'خ{ي}ر', 'لق{ى}']
  ];
  // word(i, f): the example word of letter i at place f (1-3) as { text, marks }, the indexes of the
  // characters of `text` that are the letter meant.
  function word(i, f) {
    const marks = [];
    let text = '', inside = false;
    for (const part of words[i][f - 1].split(/([{}])/)) {
      if (part === '{' || part === '}') { inside = part === '{'; continue; }
      if (inside) marks.push(text.length);
      text += part;
    }
    return { text, marks };
  }
  // Letters on one skeleton, told apart only by their dots (ب ت ث, ج ح خ …): the games set them side by side.
  const families = [[1, 2, 3], [4, 5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
  const twins = i => (families.find(f => f.includes(i)) || []).filter(j => j !== i);
  return { glyphs, names, readings, harekeler, coves, LETTER_COVES, coveTopic, sections, bays, bayCoves, bayOf, sameSound, syllable, coveLetters, coveGlyphs, twins,
    places, joinsNext, shape, word, SUKUN, cezm, cezmReadings, cezmAlike, cezmFaint, cezmExamples, cezmExampleReadings, mastery: 2 };
})();
