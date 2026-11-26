// İngilizce Adası, 4. sınıf: 4. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 4. sınıf oyuncuları görür (index.html'deki #ing4-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing4',
  ad: 'İngilizce Adası (4. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '4. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her durak oyunlarla oynanır: 👂 Dinle ve Bul, 🎈 Balon Patlat, 🃏 Sesli Hafıza, 🎨 Sihirli Boyama, 🧺 Meyve Sepeti, 🚂 Kelime Treni ve 🎴 Bilgi Kartı. İngilizce kelimeleri doğal bir sesle duyarsın; 🐢 ile yavaşça da dinleyebilirsin. İlk denemede bilemediğin kelimeler Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır. Adalar, bu yıl okullarda okutulan MEB 4. sınıf İngilizce ders kitabının temalarını sırasıyla izler; kitaptaki her bilgi en az bir oyunda soruluyor.',
  kayit: 'ingilizce-4-',
  duraklar: ingilizce4Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true,
  ikinciSans: true,
  oyunlar: { sepet: [] }   // stations are played as games once the questions come
});
