// İngilizce Adası, 2. sınıf: 🔍 Gizli Kelimeler'in resimleri (core/js/ingilizce-oyunlari.js, gizli()). Bir soru "g" ile
// bir resme bağlanır: resim gösterilir, ses "Find the teacher!" der, çocuk resimde öğretmene dokunur.
// yerler: resimde dokunulabilecek her şey. Sıra önemlidir: bir nokta birkaç yerin içindeyse, yanlış dokunuşta ilk yer
// söylenir ("No! This is a pupil."), bu yüzden öndeki kişiler önce, arkadaki binalar ve bütün oda en sonda yazılır.
// Dokunulan noktada en öndeki yer sorulan kelimeyse dokunuş doğrudur; icinde, yerin parçalarıdır (friend: iki çocuğun ikisi de).
// sekil: resmin piksel koordinatlarında şekiller; dört sayı bir dikdörtgendir [x, y, en, boy], daha fazlası bir çokgendir [x1, y1, x2, y2, …].
const ingilizce2Sahneler = {
  oda: { resim: 'assets/images/ingilizce/sahne/ogretmenler-odasi.webp', w: 1248, h: 832, yerler: [
    { en: 'teacher', bul: 'Find the teacher!', bu: 'No! This is a teacher.',
      sekil: [[410, 290, 520, 280, 600, 340, 600, 470, 640, 560, 620, 650, 590, 700, 570, 800, 450, 800, 440, 650, 335, 640, 360, 560, 420, 470]] },
    { en: 'pupil', bul: 'Find the pupil!', bu: 'No! This is a pupil.',
      sekil: [[745, 455, 910, 455, 920, 560, 895, 640, 935, 700, 925, 765, 680, 765, 690, 700, 740, 640, 740, 560]] },
    { en: 'headmistress', bul: 'Find the headmistress!', bu: 'No! This is the headmistress.',
      sekil: [[900, 140, 1060, 140, 1090, 300, 1115, 420, 1100, 540, 1090, 580, 1080, 690, 920, 690, 900, 560, 862, 450, 880, 330, 890, 260]] },
    { en: 'headmaster', bul: 'Find the headmaster!', bu: 'No! This is the headmaster.',
      sekil: [[270, 85, 430, 85, 435, 250, 470, 300, 470, 600, 205, 600, 210, 330, 280, 260]] },
    { en: 'teacher’s room', bul: 'Find the teacher’s room!', bu: 'No! This is the teacher’s room.',
      sekil: [[528, 70, 380, 200], [0, 0, 1248, 832]] }
  ] },
  bahce: { resim: 'assets/images/ingilizce/sahne/bahce-kantin.webp', w: 1248, h: 832, yerler: [
    { en: 'boy', bul: 'Find the boy!', bu: 'No! This is a boy.',
      sekil: [[150, 352, 245, 352, 247, 470, 252, 580, 240, 700, 248, 785, 135, 800, 140, 620, 112, 590, 122, 470, 150, 450]] },
    { en: 'girl', bul: 'Find the girl!', bu: 'No! This is a girl.',
      sekil: [[255, 365, 340, 362, 362, 480, 362, 585, 338, 620, 345, 795, 242, 795, 252, 620, 248, 480]] },
    { en: 'friend', bul: 'Find the friends!', bu: 'No! They are friends.', icinde: ['boy', 'girl'],
      sekil: [[110, 350, 255, 455]] },
    { en: 'garden', bul: 'Find the garden!', bu: 'No! This is the garden.',
      sekil: [[330, 480, 1000, 470, 1248, 520, 1248, 832, 640, 832, 330, 650], [610, 40, 970, 40, 975, 300, 900, 500, 700, 500, 610, 300]] },
    { en: 'classroom', bul: 'Find the classroom!', bu: 'No! This is the classroom.',
      sekil: [[0, 58, 395, 120, 395, 500, 0, 525]] },
    { en: 'canteen', bul: 'Find the canteen!', bu: 'No! This is the canteen.',
      sekil: [[1000, 90, 1248, 90, 1248, 500, 1020, 500, 1020, 280, 968, 280]] }
  ] },
  kutuphane: { resim: 'assets/images/ingilizce/sahne/kutuphane.webp', w: 1248, h: 832, yerler: [
    { en: 'girl', bul: 'Find the girl!', bu: 'No! This is a girl.',
      sekil: [[150, 342, 262, 342, 278, 470, 278, 600, 258, 650, 262, 775, 145, 775, 145, 650, 112, 600, 118, 480]] },
    { en: 'kid', bul: 'Find the kid!', bu: 'No! This is a kid.',
      sekil: [[280, 442, 395, 442, 402, 560, 398, 640, 390, 765, 290, 765, 278, 650, 270, 560]] },
    { en: 'headmaster', bul: 'Find the headmaster!', bu: 'No! This is the headmaster.',
      sekil: [[855, 228, 975, 228, 975, 360, 1005, 420, 1005, 580, 972, 600, 970, 785, 828, 785, 860, 600, 850, 455, 772, 465, 772, 395, 810, 385, 862, 350]] },
    { en: 'headmistress', bul: 'Find the headmistress!', bu: 'No! This is the headmistress.',
      sekil: [[1015, 258, 1138, 258, 1132, 380, 1150, 520, 1112, 560, 1110, 785, 1008, 785, 1008, 560, 995, 470, 1010, 400, 1025, 370]] },
    { en: 'library', bul: 'Find the library!', bu: 'No! This is the library.',
      sekil: [[0, 0, 1248, 832]] }
  ] },
  okul: { resim: 'assets/images/ingilizce/sahne/okul-oyun-alani.webp', w: 1248, h: 832, yerler: [
    { en: 'pupil', bul: 'Find the pupil!', bu: 'No! This is a pupil.',
      sekil: [[150, 452, 272, 452, 278, 560, 290, 600, 278, 690, 290, 775, 172, 775, 178, 690, 150, 645, 158, 540]] },
    { en: 'people', bul: 'Find the people!', bu: 'No! They are people.',
      sekil: [[978, 402, 1182, 402, 1182, 752, 978, 752]] },
    { en: 'playground', bul: 'Find the playground!', bu: 'No! This is the playground.',
      sekil: [[378, 470, 420, 395, 520, 395, 520, 470, 610, 418, 895, 418, 895, 635, 600, 645, 378, 625], [405, 658, 295, 125]] },
    { en: 'lunch hall', bul: 'Find the lunch hall!', bu: 'No! This is the lunch hall.',
      sekil: [[648, 232, 1182, 232, 1182, 512, 648, 512]] },
    { en: 'school', bul: 'Find the school!', bu: 'No! This is the school.',
      sekil: [[355, 40, 420, 40, 445, 130, 600, 250, 600, 505, 60, 505, 60, 250, 260, 180]] }
  ] },
  spor: { resim: 'assets/images/ingilizce/sahne/spor-salonu.webp', w: 1248, h: 832, yerler: [
    { en: 'teacher', bul: 'Find the teacher!', bu: 'No! This is a teacher.',
      sekil: [[600, 135, 805, 135, 805, 260, 765, 300, 800, 420, 760, 460, 752, 700, 768, 752, 582, 742, 612, 470, 560, 405, 538, 350, 590, 345, 615, 300]] },
    { en: 'school uniform', bul: 'Find the school uniform!', bu: 'No! This is a school uniform.',
      sekil: [[1040, 248, 162, 222]] },
    { en: 'school bag', bul: 'Find the school bag!', bu: 'No! This is a school bag.',
      sekil: [[992, 598, 185, 200]] },
    { en: 'sports', bul: 'Find sports!', bu: 'No! This is sports.',
      sekil: [[300, 288, 472, 288, 478, 430, 552, 520, 522, 562, 500, 620, 535, 735, 298, 735, 290, 640, 238, 665, 232, 540, 300, 520],
        [0, 8, 305, 8, 305, 262, 0, 245], [0, 412, 118, 200], [892, 505, 150, 132]] },
    { en: 'sports hall', bul: 'Find the sports hall!', bu: 'No! This is the sports hall.',
      sekil: [[380, 118, 650, 158], [0, 0, 1248, 832]] }
  ] }
};
