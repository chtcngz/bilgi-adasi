// İngilizce Adası, 3. sınıf: 3. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 3. sınıf oyuncuları görür (index.html'deki #ing3-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing3',
  ad: 'İngilizce Adası (3. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '3. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her durak oyunlarla oynanır: 👂 Dinle ve Bul, 🎈 Balon Patlat, 🃏 Sesli Hafıza, 🎨 Sihirli Boyama, 🧺 Meyve Sepeti, 🚂 Kelime Treni ve 🎴 Bilgi Kartı. İngilizce kelimeleri doğal bir sesle duyarsın; 🐢 ile yavaşça da dinleyebilirsin. İlk denemede bilemediğin kelimeler Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır. Adalar, bu yıl okullarda okutulan MEB 3. sınıf İngilizce ders kitabının temalarını sırasıyla izler; kitaptaki her bilgi en az bir oyunda soruluyor.',
  kayit: 'ingilizce-3-',
  duraklar: ingilizce3Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true,
  ikinciSans: true,
  oyunlar: { sepet: [] }   // stations are played as games once the questions come
});
