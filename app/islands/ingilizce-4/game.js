// İngilizce Adası, 4. sınıf: 4. sınıf İngilizce ders kitabının üniteleri. Oyun, core/js/quiz.js'tedir.
// Yalnızca 4. sınıf oyuncuları görür (index.html'deki #ing4-card). Soru bankası boşken koy haritada "Yakında" durur.
soruAdasi({
  kod: 'ing4',
  ad: 'İngilizce Adası (4. sınıf)',
  koy: 'İngilizce Koyu',
  lead: '4. sınıf İngilizce',
  simge: '🇬🇧',
  tema: 'ingilizce',
  kaynak: 'Her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokerin var. 🔊 düğmesi İngilizce kelimeleri cihazın sesiyle okur; “Dinle!” sorularında kelimeyi yalnızca duyarsın. Yanlış cevapladığın sorular Tekrar Kutusu’na girer; orada 6 yanlış birikince 🎯 Yanlış Avı açılır: yalnızca yanlış yaptığın kelimeleri anlamlarıyla eşleştirirsin. Adalar, bu yıl okullarda okutulan MEB 4. sınıf İngilizce ders kitabının ünitelerini sırasıyla izler; kitaptaki her bilgi en az bir soruyla soruluyor.',
  kayit: 'ingilizce-4-',
  duraklar: ingilizce4Sorular,
  ovgu: ['Great!', 'Super!', 'Well done!', 'Harika!', 'Bravo!', 'Excellent!'],
  simgeler: ['★', '✦', '🎈'],
  ses: 'en-GB',
  yanlisAvi: true
});
