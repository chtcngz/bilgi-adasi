// İngilizce Adası, 2. sınıf: soru bankası. Henüz boş; sorular gelince İngilizce Koyu açılır.
//
// Biçim, Fen Bilimleri ve Sosyal Bilgiler adalarınınkiyle aynıdır (bkz. islands/fen-bilimleri/sorular.js):
// her durak bir ünitedir ({ id, ad, konu, simge, unite, kitap, sorular: [...] }); ekstra konular { ekstra: true }
// bir durağa gider. Her soru { s: kök, a: [doğru, yanlış, yanlış, yanlış], b: açıklama }. Soruların kimliği durak
// kimliği ve sırasıdır (unite1:0); çocukların ilerlemesi bunlara kayıtlıdır: yalnızca sona ekle, silme, sırasını değiştirme.
// İlk soruyu eklemeden önce kapsam.md'yi (ders kitabının sayfa sayfa kontrol listesi) yaz; node tools/kapsam.js
// banka dolunca onu da denetler.
const ingilizce2Sorular = [];
