// Elif Ba Adası: letters, their readings with harekes, coves and the island's sections.
// Readings follow the Turkish Elif-Ba convention (be-bi-bu, sa-sı-su for the thick letters).
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
    { name: 'Üstün', mark: 'َ', place: 'Harfin üstünde eğik bir çizgi', sound: 'e ya da a' },
    { name: 'Esre', mark: 'ِ', place: 'Harfin altında eğik bir çizgi', sound: 'i ya da ı' },
    { name: 'Ötre', mark: 'ُ', place: 'Harfin üstünde küçük bir vav', sound: 'u' }
  ];
  const coves = ['Kaplumbağa Koyu', 'İnci Koyu', 'Mercan Koyu', 'Yıldız Koyu', 'Yunus Koyu', 'Sedef Koyu', 'Deniz Feneri Koyu'];
  const sections = [
    { id: 'harf', title: 'Harfler', lead: '28 harfi tanı, sesinden bul', prize: '🐚', prizeName: 'deniz kabuğu' },
    { id: 'hareke', title: 'Harekeler', lead: 'Üstün, esre ve ötre ile oku', prize: '🦪', prizeName: 'inci' },
    { id: 'bitisik', title: 'Bitişik yazılış', lead: 'Harflerin başta, ortada ve sonda yazılışı', soon: true },
    { id: 'cezm', title: 'Cezm', lead: 'Sessiz harflerle hece kur', soon: true },
    { id: 'tenvin', title: 'Tenvin', lead: 'İki üstün, iki esre, iki ötre', soon: true },
    { id: 'sedde', title: 'Şedde', lead: 'Harfi iki kez oku', soon: true },
    { id: 'med', title: 'Uzatma', lead: 'Med harfleriyle uzun okuma', soon: true },
    { id: 'okuma', title: 'Kelime ve âyet', lead: 'Kısa surelerle cüze hazırlık', soon: true }
  ];
  // Letters whose Turkish readings sound alike are never offered together in a listening question.
  const sameSound = (a, ha, b, hb) => readings[a][ha] === readings[b][hb];
  const syllable = (letter, hareke) => glyphs[letter] + harekeler[hareke].mark;
  const coveLetters = cove => [0, 1, 2, 3].map(offset => cove * 4 + offset);
  // Letters on one skeleton, told apart only by their dots (ب ت ث, ج ح خ …): the games set them side by side.
  const families = [[1, 2, 3], [4, 5, 6], [7, 8], [9, 10], [11, 12], [13, 14], [15, 16], [17, 18], [19, 20]];
  const twins = i => (families.find(f => f.includes(i)) || []).filter(j => j !== i);
  return { glyphs, names, readings, harekeler, coves, sections, sameSound, syllable, coveLetters, twins, mastery: 2 };
})();
