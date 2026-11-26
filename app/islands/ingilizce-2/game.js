// İngilizce Adası, 2. sınıf: 2. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 2. sınıf oyuncuları görür (index.html'deki #ing2-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing2',
  ad: 'İngilizce Adası (2. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '2. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var. 🔊 düğmesi İngilizce kelimeleri cihazın sesiyle okur; “Dinle!” sorularında kelimeyi yalnızca duyarsın. Yanlış cevapladığın sorular Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır: yalnızca yanlış yaptığın kelimeleri anlamlarıyla eşleştirirsin. Adalar, bu yıl okullarda okutulan MEB 2. sınıf İngilizce ders kitabının ünitelerini sırasıyla izler; kitaptaki her bilgi en az bir soruyla soruluyor.',
  kayit: 'ingilizce-2-',
  duraklar: ingilizce2Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true
});
