// English, Ada 1 (İlk Adımlar): the words of every station, by the owner's lists. The questions may use only these words
// (and, in name and age questions, Turkish first names and ages from 5 to 20). A station is cut into etaps (gruplar), each a
// handful of related words; the owner's site opens a station on its etaps (app/english/koy.js).
// Each word: [English, Türkçe, kart?]. kart: { resim } the picture of its tanıtım kartı (assets/images/english/<resim>.webp,
// chosen on app/english/resimler/), or { kartlar: [{ en, tr, resim }] } when the card says something more than the word
// (the names and ages: the boy is Efe, 9; the girl is Ela, 10). The pictures chosen on the picture page are kept in the cloud
// under "english-1/<station id>/<English>": the English of a word must not change, or its pictures are lost.
(window.englishAdalari ||= []).push({
  id: 'english-1', ad: 'İlk Adımlar', simge: '👣', bolum: '1. Bölüm · First Steps',
  istasyonlar: [
    { id: 'selam', ad: 'Selamlaşma', simge: '👋', baslik: 'Greetings · Selamlaşma, tanışma, nezaket', gruplar: [
      { ad: 'Selamlaşma', kelimeler: [
        ['hello', 'merhaba', { resim: 'hello' }], ['hi', 'selam', { resim: 'hi' }], ['good morning', 'günaydın', { resim: 'good-morning' }],
        ['good afternoon', 'tünaydın, iyi öğleden sonralar', { resim: 'good-afternoon' }], ['good evening', 'iyi akşamlar', { resim: 'good-evening' }],
        ['good night', 'iyi geceler', { resim: 'good-night' }], ['Welcome!', 'Hoş geldin!', { resim: 'welcome' }]] },
      { ad: 'Vedalaşma', kelimeler: [
        ['goodbye', 'hoşça kal', { resim: 'goodbye' }],
        ['bye / bye-bye', 'hoşça kal / bay bay', { kartlar: [{ en: 'Bye-bye!', tr: 'Bay bay! Hoşça kal!', resim: 'bye-bye' }] }],
        ['see you', 'görüşürüz', { resim: 'see-you' }], ['see you later', 'sonra görüşürüz', { resim: 'see-you-later' }],
        ['see you soon', 'yakında görüşürüz', { resim: 'see-you-soon' }], ['see you tomorrow', 'yarın görüşürüz', { resim: 'see-you-tomorrow' }],
        ['take care', 'kendine iyi bak', { resim: 'take-care' }], ['Have a nice day!', 'İyi günler!', { resim: 'have-a-nice-day' }]] },
      { ad: 'Tanışma', kelimeler: [
        ['name', 'isim, ad', { resim: 'name' }],
        ['What’s your name?', 'Adın ne?', { kartlar: [{ en: 'What is your name?', tr: 'Adın ne?', resim: 'whats-your-name' }] }],
        ['My name is …', 'Benim adım …', { kartlar: [{ en: 'My name is Efe.', tr: 'Benim adım Efe.', resim: 'my-name-is-leo' },
          { en: 'My name is Ela.', tr: 'Benim adım Ela.', resim: 'my-name-is-maya' }] }],
        ['I am … / I’m …', 'Ben …', { kartlar: [{ en: 'I am Ela.', tr: 'Ben Ela.', resim: 'i-am-maya' }] }],
        ['meet', 'tanışmak', { resim: 'meet' }], ['Nice to meet you.', 'Tanıştığımıza memnun oldum.', { resim: 'nice-to-meet-you' }],
        ['Nice to meet you, too.', 'Ben de memnun oldum.', { resim: 'nice-to-meet-you-too' }]] },
      { ad: 'Hal hatır', kelimeler: [
        ['How are you?', 'Nasılsın?', { resim: 'how-are-you' }],
        ['I am fine, thank you.', 'İyiyim, teşekkür ederim.', { resim: 'i-am-fine-thank-you' }],
        ['I am good.', 'İyiyim.', { resim: 'i-am-good' }], ['I am great!', 'Harikayım!', { resim: 'i-am-great' }],
        ['I am okay.', 'Fena değilim, iyiyim.', { resim: 'i-am-okay' }], ['And you?', 'Ya sen?', { resim: 'and-you' }]] },
      { ad: 'Arkadaş ve yaş', kelimeler: [
        ['friend', 'arkadaş', { resim: 'friend' }],
        ['This is my friend …', 'Bu benim arkadaşım …', { kartlar: [{ en: 'This is my friend Efe.', tr: 'Bu benim arkadaşım Efe.', resim: 'this-is-my-friend-leo' }] }],
        ['How old are you?', 'Kaç yaşındasın?', { resim: 'how-old-are-you' }],
        ['I’m … years old.', '… yaşındayım.', { kartlar: [{ en: 'I’m 9 years old.', tr: '9 yaşındayım.', resim: 'im-9-years-old' }] }],
        ['yes', 'evet', { resim: 'yes' }], ['no', 'hayır', { resim: 'no' }]] },
      { ad: 'Nezaket', kelimeler: [
        ['please', 'lütfen', { resim: 'please' }], ['thank you', 'teşekkür ederim', { resim: 'thank-you' }], ['thanks', 'teşekkürler', { resim: 'thanks' }],
        ['Thank you very much!', 'Çok teşekkür ederim!', { resim: 'thank-you-very-much' }], ['you’re welcome', 'rica ederim', { resim: 'youre-welcome' }],
        ['sorry', 'pardon, özür dilerim', { resim: 'sorry' }], ['I am sorry.', 'Özür dilerim.', { resim: 'i-am-sorry' }], ['excuse me', 'affedersiniz', { resim: 'excuse-me' }]] }
    ] },
    { id: 'alfabe', ad: 'Alfabe', simge: '🔤', baslik: 'Alphabet · Harfler, harf sesleri, heceleme', gruplar: [] },
    { id: 'sayilar', ad: 'Sayılar', simge: '🔢', baslik: 'Numbers · 1–20, sıra sayıları', gruplar: [] },
    { id: 'sorular', ad: 'Soru kelimeleri', simge: '❓', baslik: 'Question Words · who, what, where, when, why, how', gruplar: [] }
  ]
});
