// English, Ada 1: İlk Adımlar, the first island of the English for Kids site (app/english/, …/bilgi-adasi/english/).
// Every grade sees it there (#eng1-card); Bilgi Adası's own Keşif Limanı does not load it. The game is core/js/quiz.js,
// played as İngilizce Koyu's games (core/js/ingilizce-oyunlari.js). Progress: localStorage 'ingilizce-en1-' + player id
// (the "ingilizce-" prefix is what the cloud copy, core/js/sync.js, already keeps).
soruAdasi({
  kod: 'eng1',
  ad: 'English: İlk Adımlar',
  koy: 'English Koyu',
  lead: 'İngilizce · 8-12 yaş',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'English for Kids, 1. bölüm: İlk Adımlar. Dört istasyon: 👋 Selamlaşma, 🔤 Alfabe, 🔢 Sayılar, ❓ Soru kelimeleri. Her istasyon önce kelimelerini resim ve sesle tanıtır (Keşif Kartı), sonra oyunlarla oynanır: 👂 Dinle ve Bul, 🎈 Balon Patlat, 🃏 Sesli Hafıza, 🚂 Kelime Treni ve 🎴 Bilgi Kartı. 🐢 ile yavaşça da dinleyebilirsin. İlk denemede bilemediğin kelimeler Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır. Yeni bölümler (renkler, aile, okul …) adım adım gelecek.',
  kayit: 'ingilizce-en1-',
  duraklar: english1Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Excellent!', 'Bravo!', 'Fantastic!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true,
  ikinciSans: true,
  istasyonlar: english1Istasyonlar,
  oyunlar: { sepet: [] }
});
