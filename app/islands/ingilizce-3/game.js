// İngilizce Adası, 3. sınıf: 3. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 3. sınıf oyuncuları görür (index.html'deki #ing3-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing3',
  ad: 'İngilizce Adası (3. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '3. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var. 🔊 düğmesi İngilizce kelimeleri cihazın sesiyle okur; “Dinle!” sorularında kelimeyi yalnızca duyarsın. Yanlış cevapladığın sorular Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır: yalnızca yanlış yaptığın kelimeleri anlamlarıyla eşleştirirsin. Adalar, bu yıl okullarda okutulan MEB 3. sınıf İngilizce ders kitabının ünitelerini sırasıyla izler; kitaptaki her bilgi en az bir soruyla soruluyor.',
  kayit: 'ingilizce-3-',
  duraklar: ingilizce3Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true
});
