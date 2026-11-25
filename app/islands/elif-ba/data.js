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
  // The first seven coves teach the letters and their harekes, four letters each; from the eighth on,
  // the same groups of four come again to learn how they are written joined (bitişik yazılış).
  const coves = ['Kaplumbağa Koyu', 'İnci Koyu', 'Mercan Koyu', 'Yıldız Koyu', 'Yunus Koyu', 'Sedef Koyu', 'Deniz Feneri Koyu',
    'Martı Koyu', 'Yengeç Koyu', 'Ahtapot Koyu', 'Denizatı Koyu', 'Balina Koyu', 'Pelikan Koyu', 'Gökkuşağı Koyu'];
  const LETTER_COVES = 7;
  const coveTopic = k => k < LETTER_COVES ? 'harf' : 'bitisik';
  const sections = [
    { id: 'harf', title: 'Harfler', lead: '28 harfi tanı, sesinden bul', prize: '🐚', prizeName: 'deniz kabuğu' },
    { id: 'hareke', title: 'Harekeler', lead: 'Üstün, esre ve ötre ile oku', prize: '🦪', prizeName: 'inci' },
    { id: 'bitisik', title: 'Bitişik yazılış', lead: 'Harflerin başta, ortada ve sonda yazılışı', prize: '🪸', prizeName: 'mercan' },
    { id: 'cezm', title: 'Cezm', lead: 'Sessiz harflerle hece kur', soon: true },
    { id: 'tenvin', title: 'Tenvin', lead: 'İki üstün, iki esre, iki ötre', soon: true },
    { id: 'sedde', title: 'Şedde', lead: 'Harfi iki kez oku', soon: true },
    { id: 'med', title: 'Uzatma', lead: 'Med harfleriyle uzun okuma', soon: true },
    { id: 'okuma', title: 'Kelime ve âyet', lead: 'Kısa surelerle cüze hazırlık', soon: true }
  ];
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
  // A cove's letters as the map and the path show them: alone, or in their middle shape in a bitişik cove.
  const coveGlyphs = k => coveLetters(k).map(i => coveTopic(k) === 'bitisik' ? shape(i, 2) : glyphs[i]);
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
  return { glyphs, names, readings, harekeler, coves, LETTER_COVES, coveTopic, sections, sameSound, syllable, coveLetters, coveGlyphs, twins,
    places, joinsNext, shape, word, mastery: 2 };
})();
