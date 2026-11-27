// English, Ada 1 (İlk Adımlar): the words of every station, by the owner's lists. The questions may use only these words
// (and, in name and age questions, English names and ages from 5 to 20). Each word: [English, Türkçe].
// The picture page (app/english/resimler/) lists them by island and station; the pictures chosen for a word are kept in the
// cloud (Firestore resimler/secimler) under "english-1/<station id>/<English>".
(window.englishAdalari ||= []).push({
  id: 'english-1', ad: 'İlk Adımlar', simge: '👣', bolum: '1. Bölüm · First Steps',
  istasyonlar: [
    { id: 'selam', ad: 'Selamlaşma', simge: '👋', baslik: 'Greetings · Selamlaşma, tanışma, nezaket', gruplar: [
      { ad: 'Selamlaşma ve vedalaşma', kelimeler: [
        ['hello', 'merhaba'], ['hi', 'selam'], ['good morning', 'günaydın'], ['good afternoon', 'tünaydın, iyi öğleden sonralar'],
        ['good evening', 'iyi akşamlar'], ['good night', 'iyi geceler'], ['goodbye', 'hoşça kal'], ['bye / bye-bye', 'hoşça kal / bay bay'],
        ['see you', 'görüşürüz'], ['see you later', 'sonra görüşürüz'], ['see you soon', 'yakında görüşürüz'], ['see you tomorrow', 'yarın görüşürüz'],
        ['take care', 'kendine iyi bak'], ['Have a nice day!', 'İyi günler!']] },
      { ad: 'Tanışma', kelimeler: [
        ['name', 'isim, ad'], ['friend', 'arkadaş'], ['meet', 'tanışmak'], ['What’s your name?', 'Adın ne?'], ['My name is …', 'Benim adım …'],
        ['I am … / I’m …', 'Ben …'], ['Nice to meet you.', 'Tanıştığımıza memnun oldum.'], ['Nice to meet you, too.', 'Ben de memnun oldum.'],
        ['Welcome!', 'Hoş geldin!'], ['How are you?', 'Nasılsın?'], ['I am fine, thank you.', 'İyiyim, teşekkür ederim.'], ['I am good.', 'İyiyim.'],
        ['I am great!', 'Harikayım!'], ['I am okay.', 'Fena değilim, iyiyim.'], ['And you?', 'Ya sen?'], ['How old are you?', 'Kaç yaşındasın?'],
        ['I’m … years old.', '… yaşındayım.'], ['This is my friend …', 'Bu benim arkadaşım …']] },
      { ad: 'Nezaket sözcükleri', kelimeler: [
        ['please', 'lütfen'], ['thank you', 'teşekkür ederim'], ['thanks', 'teşekkürler'], ['Thank you very much!', 'Çok teşekkür ederim!'],
        ['you’re welcome', 'rica ederim'], ['sorry', 'pardon, özür dilerim'], ['I am sorry.', 'Özür dilerim.'], ['excuse me', 'affedersiniz'],
        ['yes', 'evet'], ['no', 'hayır']] }
    ] },
    { id: 'alfabe', ad: 'Alfabe', simge: '🔤', baslik: 'Alphabet · Harfler, harf sesleri, heceleme', gruplar: [] },
    { id: 'sayilar', ad: 'Sayılar', simge: '🔢', baslik: 'Numbers · 1–20, sıra sayıları', gruplar: [] },
    { id: 'sorular', ad: 'Soru kelimeleri', simge: '❓', baslik: 'Question Words · who, what, where, when, why, how', gruplar: [] }
  ]
});
