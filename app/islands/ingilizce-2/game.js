// İngilizce Adası, 2. sınıf: 2. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 2. sınıf oyuncuları görür (index.html'deki #ing2-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing2',
  ad: 'İngilizce Adası (2. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '2. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var. 🔊 düğmesi İngilizce kelimeleri cihazın sesiyle okur; “Dinle!” sorularında kelimeyi yalnızca duyarsın. Yanlış cevapladığın sorular Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır: yalnızca yanlış yaptığın kelimelerle eşleştirme ve balon oyunu. Yanlış cevapta bir kez daha deneme hakkın var. 🎡 Oyun Parkı’nda kitabın kelimeleriyle beş oyun seni bekliyor. Adalar, bu yıl okullarda okutulan MEB 2. sınıf İngilizce ders kitabının ünitelerini sırasıyla izler; kitaptaki her bilgi en az bir soruyla soruluyor.',
  kayit: 'ingilizce-2-',
  duraklar: ingilizce2Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true,
  ikinciSans: true,
  // 🎡 Oyun Parkı: the foods of Meyve Sepeti and the sentences of Kelime Treni, all from the book
  oyunParki: {
    sepet: ['apples', 'bananas', 'cherries', 'grapes', 'pears', 'strawberries', 'oranges', 'lemon', 'tomatoes', 'carrots', 'broccoli', 'potatoes',
      'peppers', 'garlic', 'cucumber', 'eggs', 'bread', 'meat', 'chicken', 'milk', 'yoghurt', 'cake', 'ice cream', 'salad'],
    tren: [
      ['What is this?', 'Bu ne?'], ['Who is this boy?', 'Bu çocuk kim?'], ['What’s your name?', 'Adın ne?'], ['How are you?', 'Nasılsın?'],
      ['It’s Saturday today.', 'Bugün Cumartesi.'], ['Come to the board, please!', 'Tahtaya gel lütfen!'], ['What colour is it?', 'Ne renk?'],
      ['Raise your hand, please!', 'Elini kaldır lütfen!'], ['How old are you?', 'Kaç yaşındasın?'], ['I’ve got two eyes.', 'İki gözüm var.'],
      ['It is raining.', 'Yağmur yağıyor.'], ['He is my brother.', 'O benim erkek kardeşim.'], ['Where is the cat?', 'Kedi nerede?'],
      ['A dog has got paws.', 'Köpeğin patileri var.'], ['There is a bed in the bedroom.', 'Yatak odasında bir yatak var.'],
      ['Do you like bananas?', 'Muz sever misin?'], ['Pass the water, please!', 'Suyu uzat lütfen!'], ['I like fish and salad.', 'Balık ve salata severim.']
    ]
  }
});
