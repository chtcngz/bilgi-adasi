// Akvaryum: what can live in a player's tank. Shared by the game (core/js/akvaryum.js) and the admin page,
// which only needs the names. Saved records keep the ids below, so an id never changes; a name may.
const akvaryumVeri = (() => {
  // Fish. w is the drawn width at full size, in px; zone is the band of water it likes (0 top, 1 bottom);
  // school: several of the same kind swim together.
  const baliklar = [
    { id: 'palyaco', ad: 'Palyaço balığı', w: 84, speed: 30, zone: [.35, .8], beat: .32 },
    { id: 'cerrah', ad: 'Mavi cerrah balığı', w: 104, speed: 40, zone: [.15, .65], beat: .42 },
    { id: 'sari', ad: 'Sarı cerrah balığı', w: 92, speed: 32, zone: [.2, .7], beat: .5 },
    { id: 'melek', ad: 'Melek balığı', w: 84, speed: 22, zone: [.15, .6], beat: .7 },
    { id: 'neon', ad: 'Neon tetra', w: 50, speed: 46, zone: [.3, .75], beat: .2, school: true },
    { id: 'japon', ad: 'Japon balığı', w: 98, speed: 24, zone: [.3, .8], beat: .6 },
    { id: 'beta', ad: 'Beta balığı', w: 96, speed: 18, zone: [.08, .45], beat: .9 },
    { id: 'disk', ad: 'Disk balığı', w: 96, speed: 22, zone: [.2, .65], beat: .6 },
    { id: 'balon', ad: 'Balon balığı', w: 78, speed: 20, zone: [.45, .85], beat: .3 },
    { id: 'kelebek', ad: 'Kelebek balığı', w: 88, speed: 30, zone: [.2, .7], beat: .45 },
    { id: 'lepistes', ad: 'Lepistes', w: 56, speed: 38, zone: [.1, .55], beat: .22, school: true },
    { id: 'grama', ad: 'Kraliyet graması', w: 70, speed: 34, zone: [.4, .85], beat: .3 },
    { id: 'denizati', ad: 'Denizatı', w: 46, speed: 10, zone: [.35, .8], beat: .12, upright: true }
  ];
  // Ornaments. big ones stand at the back of the sand, small ones in front; crawlers walk along it.
  const susler = [
    { id: 'gemi', ad: 'Batık gemi', big: true },
    { id: 'kale', ad: 'Su altı kalesi', big: true },
    { id: 'sandik', ad: 'Hazine sandığı', big: true },
    { id: 'dalgic', ad: 'Dalgıç kaskı', big: true },
    { id: 'amfora', ad: 'Antik testiler', big: true },
    { id: 'mercan', ad: 'Mercan kayalığı', big: true },
    { id: 'kemer', ad: 'Kaya kemeri', big: true },
    { id: 'yildiz', ad: 'Deniz yıldızı' },
    { id: 'istiridye', ad: 'İncili istiridye' },
    { id: 'sakayik', ad: 'Deniz şakayığı' },
    { id: 'yengec', ad: 'Yengeç', crawl: true },
    { id: 'salyangoz', ad: 'Salyangoz', crawl: true },
    { id: 'kestane', ad: 'Deniz kestanesi' },
    { id: 'sarmal', ad: 'Sarmal deniz kabuğu' },
    { id: 'kabarcik', ad: 'Hava taşı' }
  ];
  // Every tank holds this many of each; the next reward then starts a new tank, in the next theme.
  const BALIK = 12, SUS = 6;
  const temalar = [
    { id: 'mercan', ad: 'Mercan Koyu' },
    { id: 'vadi', ad: 'Yeşil Vadi' },
    { id: 'gece', ad: 'Gece Mavisi' },
    { id: 'gunbatimi', ad: 'Gün Batımı Lagünü' }
  ];
  const tur = id => baliklar.find(b => b.id === id) || susler.find(s => s.id === id);
  return { baliklar, susler, temalar, BALIK, SUS, tur };
})();
