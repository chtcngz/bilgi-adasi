# Elif Ba Adası · Oyun önerileri

Bu öneriler henüz oyuna eklenmedi. İlk, oynanabilir taslakları **Deneme Odası**'nda duruyor: `app/deneme/` (yayında `…/deneme/` adresi). Oyunun hiçbir ekranı bu sayfaya bağlantı vermez. Deneme Odası profil, yıldız ya da ilerleme kullanmaz; yalnızca akvaryum kendi anahtarında (`elif-deneme-akvaryum`) saklanır. Bir oyun doğrudan da açılabilir: `deneme/#nokta`, `#kabuk`, `#tren`, `#bukalemun`, `#tas`, `#kum`, `#akvaryum`.

## 1. 🔍 Nokta Ustası: en zor yeri hedefliyor

Ekranda noktasız bir harf iskeleti var (ٮ). Kaplumbağa "Te" diyor, çocuk deniz taşı gibi duran noktaları sürükleyip harfin üstüne ya da altına bırakıyor. Doğru yerleşince harf canlanıp kendi adını okuyor.

- Çocukların en çok karıştırdığı ب ت ث, ج ح خ, س ش gibi harf ailelerini doğrudan çalıştırıyor. Bu aileler `data.js` içinde (`families`, `twins`) zaten tanımlı ve `listening.js` bunları kullanıyor.
- Yeni kayıt gerekmiyor, mevcut harf sesleri yetiyor.
- Harfler adımına yeni bir oyun olarak eklenebilir.

**Taslakta:** 8 tur; üç iskelet (ٮ, ح, س) ve sekiz harf. Taş sürüklenebiliyor ya da bölgeye dokunarak konabiliyor. Konan noktalar başka bir harfi oluşturursa kaplumbağa "Bu Se oldu, Te istedi" diyor ve iki harfi de okuyor. Noktasız harfler (ح, س) için "✓ Tamam" düğmesi var.

## 2. 🐚 Kabuk Hafızası: küçükler için en kolayı

Kumsalda kapalı deniz kabukları var. Çocuk iki kabuk açıyor ve her açılan kabuk sesini çıkarıyor. Aynı iki harfi bulunca kabuklar inci oluyor.

- Zorluk adım adım artabilir: önce harf ile aynı harfi, sonra harf ile 🔊 sesini, en sonda harekeli hece ile okunuşunu eşleştirmek.
- Okul öncesi çocuklar bu oyunu çok sever. Can kaybı yok, bu yüzden rahatlatıcı bir mola olur.
- Yapması en hızlı oyun bu.

**Taslakta:** Üç seviye de var (4, 4 ve 5 çift). Hece seviyesinde aynı okunan iki hece aynı tahtaya gelmiyor.

## 3. 🚂 Hece Treni: kelime okumaya köprü

Kaplumbağa bir kelime okuyor, örneğin خَلَقَ. Çocuk hece vagonlarını doğru sırayla, sağdan sola lokomotife takıyor. Tren kalkınca kelimenin Diyanet kaydı çalıyor.

- Okuma yönünü (sağdan sola) oyunla öğretiyor. Elifba'da çocukların takıldığı yerlerden biri de bu.
- Arşivde zaten kelime kayıtları var: Fetha uygulamasında فَتَحَ, خَلَقَ, دَخَلَ, شَجَرَ gibi yaklaşık 100 kelime; Cezm dersinde de وِرَ → وِرْ → وِرْدًا gibi adım adım kayıtlar.
- İleride Cezm ve "Kelime ve âyet" bölümlerinin oyunu olur.

**Taslakta:** Fetha uygulamasından 10 kelime (`deneme/ses/kelime-*.mp3`), her oyunda rastgele 5'i. Vagona dokununca hecesi okunuyor; sıradaki değilse sallanıyor.

## 4. 🦎 Harf Bukalemunu: bitişik yazılış için

Bir harf kelimenin başında, ortasında ve sonunda farklı görünüyor. Kaplumbağa "Ayn'ı bul" diyor, çocuk kelimenin içinde saklanan harfe dokunuyor ve o harf parlıyor.

- Arşivde bu ders hazır: `harfler/sekilleri` klasöründe "Kelimenin Başında / Ortasında / Sonunda" kayıtları var.
- Şu an "Yakında" görünen Bitişik yazılış bölümünün oyunu olabilir.

**Taslakta:** 4 harf × 3 kelime (ع, ج, ه, ف; başta, ortada, sonda), kayıtlar `deneme/ses/sekil-*.mp3`. Yanlış harfe dokununca o harfin adı okunuyor.

## 5. 🐢 Taş Atlama: hızlı oyunlarla bulmacalar arasında

Kaplumbağa denizdeki taşlardan karşı kıyıya, yuvasına geçmeye çalışıyor. Her adımda bir hece duyuluyor ve doğru taşa basınca ilerliyor. Yanlış taş batıyor ama kaplumbağa yüzüp geri dönüyor.

- Hareke ve tenvin farkı için çok uygun: بَ / بً / بٌ yan yana taşlarda durabilir.
- Arşivde tenvin dersleri hazır: Fetha, Kesra ve Damme tenvinleri için toplam yaklaşık 270 kayıt.

**Taslakta:** 7 taş; ب ت ث ج د ر harflerinin üç tenvini (`deneme/ses/tenvin-*.mp3`) ve oyunun mevcut hece kayıtları. Her sırada duyulan hecenin "ikizi" (aynı sesli harfin hareke ya da tenvin hali) mutlaka var.

## 6. ✏️ Kumda Yaz

Çocuk parmağıyla harfi kumun üstünde kesik çizgilerin üzerinden çiziyor, dalga gelip yazıyı siliyor. Çocuklar çizmeyi çok sever ama bu en zahmetli fikir, çünkü 28 harfin çizim yolları tek tek hazırlanmalı. Sona bırakılabilir.

**Taslakta:** 4 harf (ا ب ت ن). Çizginin %90'ı kapanınca harf tamamlanıyor, sonra noktalar konuyor.

## 🐠 Bütün oyunlar için: Akvaryum

Kabuk ve inci ödülleri zaten var. Bunlara ek olarak her tamamlanan harf için koya bir deniz canlısı eklenebilir: dokununca o harfi söyleyen bir balık. Çocuklar için "koleksiyonumu tamamlayayım" duygusu çok güçlü bir motivasyon. Oyunlara her gün geri dönmeyi sağlar.

**Taslakta:** Deneme Odası'ndaki oyunlarda başarılan her harf akvaryuma bir balık ekliyor. Üst çubukta 🐠 sayacı var; akvaryumda "Hepsini ekle" ve "Boşalt" düğmeleri bulunuyor.
