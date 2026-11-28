// English, Ada 1: İlk Adımlar (First Steps), the 1. bölüm of the English for Kids topic map. The words of its stations are in
// kelimeler.js; the questions may use only those words (and, in name and age questions, English names and ages from 5 to 20).
// Questions are written only when the owner asks. A question belongs to the etap whose word is its k[0] (app/english/koy.js)
// and comes after that etap's tanıtım kartları.
// Balon sorusu (app/english/balon-sorusu.js): { s: Türkçe soru, a: [doğru, yanlış, yanlış], b: açıklama, k: [İngilizce, Türkçe],
//   balon: { resim (assets/images/english/soru/<resim>.webp), x, y, w, h: the speech bubble, in % of the picture } }.
// Ids are the stop id and the position (ilk:0); only ever append.
const english1Sorular = [
  {"id": "ilk", "ad": "İlk Adımlar", "konu": "Selamlaşma, alfabe, sayılar, soru kelimeleri", "simge": "👣", "unite": "1. Bölüm · First Steps", "sorular": [
    {"s": "Leo okuldan eve geldi. Annesi onu kapıda karşılıyor. Annesi ne der?", "a": ["Welcome!", "Good night!", "Goodbye!"], "b": "Eve gelen birini “Welcome!” (Hoş geldin!) diye karşılarız. “Goodbye!” ayrılırken, “Good night!” gece yatarken söylenir.", "k": ["Welcome!", "Hoş geldin!"], "balon": {"resim": "welcome-leo-ev", "x": 32.1, "y": 4.3, "w": 11.8, "h": 16.2}},
    {"s": "Leo sınıfa giriyor. Öğretmeni onu karşılarken ne der?", "a": ["Welcome!", "Good night!", "Good evening!"], "b": "Öğretmen sınıfa gelen Leo’yu “Welcome!” (Hoş geldin!) diye karşılar. “Good evening!” akşam, “Good night!” gece söylenir.", "k": ["Welcome!", "Hoş geldin!"], "balon": {"resim": "welcome-leo-sinif", "x": 58.4, "y": 15.0, "w": 7.3, "h": 11.1}},
    {"s": "Maya okuldan eve geldi. Annesi onu kapıda karşılıyor. Annesi ne der?", "a": ["Welcome!", "Goodbye!", "See you tomorrow!"], "b": "Eve gelen Maya’ya annesi “Welcome!” (Hoş geldin!) der. “Goodbye!” ve “See you tomorrow!” ayrılırken söylenir.", "k": ["Welcome!", "Hoş geldin!"], "balon": {"resim": "welcome-maya-ev", "x": 36.4, "y": 5.8, "w": 9.0, "h": 12.4}}
  ]}
];
if (typeof window !== 'undefined') (window.englishSorular ||= {})['english-1'] = english1Sorular;
