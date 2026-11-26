// İngilizce Adası, 2. sınıf: 2. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 2. sınıf oyuncuları görür (index.html'deki #ing2-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing2',
  ad: 'İngilizce Adası (2. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '2. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her durak oyunlarla oynanır: 👂 Dinle ve Bul, 🎈 Balon Patlat, 🃏 Sesli Hafıza, 🎨 Sihirli Boyama, 🧺 Meyve Sepeti, 🚂 Kelime Treni, 🔍 Gizli Kelimeler (büyük bir resimde söylenen şeyi bul) ve 🎴 Bilgi Kartı. İngilizce kelimeleri doğal bir sesle duyarsın; 🐢 ile yavaşça da dinleyebilirsin. İlk denemede bilemediğin kelimeler Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır. Adalar, bu yıl okullarda okutulan MEB 2. sınıf İngilizce ders kitabının temalarını sırasıyla izler; kitaptaki her bilgi en az bir oyunda soruluyor.',
  kayit: 'ingilizce-2-',
  duraklar: ingilizce2Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true,
  ikinciSans: true,
  // Stations are played as games; the foods of Meyve Sepeti (all from the book) and the pictures of 🔍 Gizli Kelimeler (sahneler.js)
  oyunlar: {
    sahneler: ingilizce2Sahneler,
    sepet: ['apples', 'bananas', 'cherries', 'grapes', 'pears', 'strawberries', 'oranges', 'lemon', 'tomatoes', 'carrots', 'broccoli', 'potatoes',
      'peppers', 'garlic', 'cucumber', 'eggs', 'bread', 'meat', 'chicken', 'milk', 'yoghurt', 'cake', 'ice cream', 'salad', 'beans', 'water', 'tea', 'coffee']
  }
});
