// İngilizce Adası, 2. sınıf: the stations of a unit (core/js/quiz.js). A unit listed here is cut into these stations
// instead of four weeks. Each station: ad (its short name on the map), simge, baslik (its full name), kelimeler (the words
// shown on its Keşif Kartı before the first round: [English, Türkçe, picture]) and sorular (the unit's question numbers:
// okul:12 is 12). Every question of the unit belongs to exactly one station: node tools/kapsam.js checks it, so a
// question added to the unit is also added here.
const ingilizce2Istasyonlar = {
  okul: [
    { ad: 'Yerler 1', resim: 'assets/images/ingilizce/istasyon/okul.webp?v=1', simge: '🏫', baslik: 'Okuldaki yerler 1',
      kelimeler: [['teacher’s room', 'öğretmenler odası', '[[y-teachers-room-2]]'], ['library', 'kütüphane', '[[y-library-4]]'], ['school', 'okul', '[[y-school-2]]'], ['canteen', 'kantin', '[[y-canteen-2]]'], ['classroom', 'sınıf', '[[y-classroom-2]]']],
      sorular: [0, 1, 2, 3, 4, 5, 11, 12, 38, 52, 85, 90, 91, 96, 101, 146, 147, 148, 149, 150] },
    { ad: 'Yerler 2', resim: 'assets/images/ingilizce/istasyon/yerler.webp?v=1', simge: '🌳', baslik: 'Okuldaki yerler 2',
      kelimeler: [['garden', 'bahçe', '[[y-garden-3]]'], ['sports hall', 'spor salonu', '[[y-sports-hall-2]]'], ['playground', 'oyun alanı', '[[y-playground-2]]'], ['lunch hall', 'yemekhane', '[[y-lunch-hall-3]]'], ['place', 'yer', '[[y-place-2]]'], ['hall', 'salon', '[[hall]]']],
      sorular: [6, 7, 8, 9, 10, 14, 72, 92, 102, 103, 106, 107, 108, 109, 151, 152, 153, 154, 155] },
    { ad: 'Çocuklar', resim: 'assets/images/ingilizce/istasyon/cocuklar.webp?v=1', simge: '🧒', baslik: 'Çocuklar',
      kelimeler: [['boy', 'erkek çocuk', '[[y-boy-2]]'], ['girl', 'kız çocuk', '[[y-girl-4]]'], ['kid', 'çocuk', '[[y-kid-2]]'], ['friend', 'arkadaş', '[[y-friend-2]]'], ['people', 'insanlar', '[[y-people-2]]'], ['big', 'büyük', '[[y-big-2]]']],
      sorular: [13, 15, 16, 41, 47, 56, 62, 63, 68, 71, 93, 94, 95, 97, 98, 105, 156, 157, 158, 159, 160, 161] },
    { ad: 'Kişiler', resim: 'assets/images/ingilizce/istasyon/kisiler.webp?v=1', simge: '👩‍🏫', baslik: 'Okuldaki kişiler',
      kelimeler: [['pupil', 'öğrenci', '[[y-pupil-2]]'], ['teacher', 'öğretmen', '[[y-teacher-2]]'], ['headmaster', 'erkek okul müdürü', '[[y-headmaster-3]]'], ['headmistress', 'kadın okul müdürü', '[[y-headmistress-3]]'], ['student', 'öğrenci', '[[y-pupil]]']],
      sorular: [17, 18, 19, 37, 39, 40, 42, 43, 44, 49, 83, 86, 87, 88, 89, 99, 100, 104, 110, 162, 163, 164, 165] },
    { ad: 'Günler', resim: 'assets/images/ingilizce/istasyon/takvim.webp?v=1', simge: '📅', baslik: 'Günler',
      kelimeler: [['Monday', 'pazartesi', '[[y-today-monday]]'], ['Tuesday', 'salı', '[[y-today-tuesday]]'], ['Wednesday', 'çarşamba', '[[y-today-wednesday]]'], ['Thursday', 'perşembe', '[[y-today-thursday]]'], ['Friday', 'cuma', '[[y-today-friday]]'], ['Saturday', 'cumartesi', '[[y-today-saturday]]'], ['Sunday', 'pazar', '[[y-today-sunday]]']],
      sorular: [20, 21, 22, 23, 24, 25, 26, 28, 29, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141] },
    { ad: 'Zaman', resim: 'assets/images/ingilizce/istasyon/zaman.webp?v=1', simge: '⏰', baslik: 'Zaman',
      kelimeler: [['day', 'gün', '[[y-day-2]]'], ['today', 'bugün', '[[y-today]]'], ['week', 'hafta', '[[y-week-3]]'], ['start', 'başlamak', '[[y-start-2]]'], ['finish', 'bitirmek', '[[y-finish-2]]'], ['wait', 'beklemek', '[[y-wait-4]]']],
      sorular: [27, 58, 61, 74, 76, 78, 79, 111, 115, 116, 120, 122, 123, 124, 142, 143, 144, 145] },
    { ad: 'Şarkı', resim: 'assets/images/ingilizce/istasyon/sarki.webp?v=1', simge: '🎵', baslik: 'Şarkı ve hareket',
      kelimeler: [['clap', 'alkışlamak', '[[y-clap-2]]'], ['jump', 'zıplamak', '[[y-jump-3]]'], ['sing', 'şarkı söylemek', '[[y-sing-2]]'], ['together', 'birlikte', '[[y-together-4]]']],
      sorular: [30, 31, 32, 33, 53, 54, 55, 57, 67, 73, 77, 113, 114, 117, 118, 119, 125, 126, 127, 166] },
    { ad: 'Sorular', resim: 'assets/images/ingilizce/istasyon/sorular.webp?v=1', simge: '❓', baslik: 'Soru kelimeleri',
      kelimeler: [['what', 'ne', '[[y-what-4]]'], ['who', 'kim', '[[y-who-4]]'], ['where', 'nerede', '[[y-where-3]]'], ['how', 'nasıl', '[[y-how-3]]'], ['excuse me', 'affedersiniz', '[[y-excuse-me-2]]']],
      sorular: [34, 35, 36, 50, 51, 59, 66, 80, 81, 82, 167, 168, 169, 170, 171] },
    { ad: 'Tanışma', resim: 'assets/images/ingilizce/istasyon/tanisma.webp?v=1', simge: '👋', baslik: 'Tanışma ve selamlaşma',
      kelimeler: [['hello', 'merhaba', '[[y-hello-3]]'], ['hi', 'selam', '[[y-hi-3]]'], ['name', 'isim', '[[y-name-2]]'], ['meet', 'tanışmak', '[[y-meet-3]]'], ['fine', 'iyi', '[[y-fine-3]]'], ['thank you', 'teşekkür ederim', '[[y-thank-you-4]]']],
      sorular: [45, 46, 48, 60, 64, 65, 69, 70, 75, 84, 112, 121, 172, 173, 174, 175, 176] }
  ]
};
