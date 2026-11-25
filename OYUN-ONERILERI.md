# Elif Ba Adası · Oyun önerileri

Oynanabilir taslaklar **Deneme Odası**'nda duruyor: `app/deneme/` (yayında `…/deneme/` adresi). Oyunun hiçbir ekranı bu sayfaya bağlantı vermez. Deneme Odası profil, yıldız ya da ilerleme kullanmaz, hiçbir şey saklamaz. Bir oyun doğrudan da açılabilir: `deneme/#kabuk`, `#tren`, `#giydir`, `#kolye`, `#album`, `#buyutec`.

| Öneri | Durum |
|---|---|
| 🐣 İlk Harf Albümüm | Deneme Odası’nda · yumurtalardan çıkan 28 sesli harf |
| 🐢 Harf Büyüteci | Deneme Odası’nda · gösterilen harfin eşine dokunma |
| 🐠 Akvaryum | **Oyunda** (0.16.0) |
| 🐚 Kabuk Hafızası | Deneme Odası'nda |
| 🚂 Hece Treni | Deneme Odası'nda |
| 🎩 Harekeyi Giydir | Yeni fikir, Deneme Odası'nda |
| 📿 İnci Kolye | Yeni fikir, Deneme Odası'nda |
| 🦎 Harf Bukalemunu | **Oyunda** (0.32.0) · Bitişik yazılış turunda “Harf avı” sorusu |
| 🔍 Nokta Ustası, 🐢 Taş Atlama, ✏️ Kumda Yaz | Denendi, şimdilik bırakıldı (taslakları çıkarıldı) |

## 1. 🔍 Nokta Ustası: en zor yeri hedefliyor

Ekranda noktasız bir harf iskeleti var (ٮ). Kaplumbağa "Te" diyor, çocuk deniz taşı gibi duran noktaları sürükleyip harfin üstüne ya da altına bırakıyor. Doğru yerleşince harf canlanıp kendi adını okuyor.

- Çocukların en çok karıştırdığı ب ت ث, ج ح خ, س ش gibi harf ailelerini doğrudan çalıştırıyor. Bu aileler `data.js` içinde (`families`, `twins`) zaten tanımlı ve `listening.js` bunları kullanıyor.
- Yeni kayıt gerekmiyor, mevcut harf sesleri yetiyor.
- Harfler adımına yeni bir oyun olarak eklenebilir.

**Durum:** Şimdilik bırakıldı; taslağı Deneme Odası'ndan çıkarıldı. Taslakta 8 tur; üç iskelet (ٮ, ح, س) ve sekiz harf. Taş sürüklenebiliyor ya da bölgeye dokunarak konabiliyor. Konan noktalar başka bir harfi oluşturursa kaplumbağa "Bu Se oldu, Te istedi" diyor ve iki harfi de okuyor. Noktasız harfler (ح, س) için "✓ Tamam" düğmesi var.

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

**Oyunda (0.32.0):** Bitişik yazılış turundaki “Kırmızı harf kelimenin neresinde?” sorusunun yerine geldi. Harf tek başına bir baloncukta duruyor; çocuk onu Diyanet Elifba’nın 84 örnek kelimesinden birinde bitişik şekliyle buluyor: kelimede harfe dokunuyor ya da baloncuğu tutup harfin üstüne bırakıyor. Kelimeler çoğu zaman harfin noktadaş eşlerini de içeriyor (ت için ثبت). Yazılı yönerge gerekmiyor: bir el baloncuktan kelimeye gidip yolu gösteriyor. Bulununca baloncuk harfin bitişik şekline dönüşüyor (ت ⬅ تـ) ve kelimenin harfleri sağdan sola, her biri adı söylenirken yanarak okunuyor. Kod: `game.js` içindeki `huntBoard`.

## 5. 🐢 Taş Atlama: hızlı oyunlarla bulmacalar arasında

Kaplumbağa denizdeki taşlardan karşı kıyıya, yuvasına geçmeye çalışıyor. Her adımda bir hece duyuluyor ve doğru taşa basınca ilerliyor. Yanlış taş batıyor ama kaplumbağa yüzüp geri dönüyor.

- Hareke ve tenvin farkı için çok uygun: بَ / بً / بٌ yan yana taşlarda durabilir.
- Arşivde tenvin dersleri hazır: Fetha, Kesra ve Damme tenvinleri için toplam yaklaşık 270 kayıt.

**Durum:** Şimdilik bırakıldı; taslağı çıkarıldı. Taslakta 7 taş; ب ت ث ج د ر harflerinin üç tenvini ve oyunun mevcut hece kayıtları. Her sırada duyulan hecenin "ikizi" (aynı sesli harfin hareke ya da tenvin hali) mutlaka var.

## 6. ✏️ Kumda Yaz

Çocuk parmağıyla harfi kumun üstünde kesik çizgilerin üzerinden çiziyor, dalga gelip yazıyı siliyor. Çocuklar çizmeyi çok sever ama bu en zahmetli fikir, çünkü 28 harfin çizim yolları tek tek hazırlanmalı. Sona bırakılabilir.

**Durum:** Şimdilik bırakıldı; taslağı çıkarıldı. Taslakta 4 harf (ا ب ت ن) vardı. Çizginin %90'ı kapanınca harf tamamlanıyor, sonra noktalar konuyor.

## 🐠 Bütün oyunlar için: Akvaryum

Kabuk ve inci ödülleri zaten var. Bunlara ek olarak her tamamlanan harf için koya bir deniz canlısı eklenebilir: dokununca o harfi söyleyen bir balık. Çocuklar için "koleksiyonumu tamamlayayım" duygusu çok güçlü bir motivasyon. Oyunlara her gün geri dönmeyi sağlar.

**Oyunda (0.16.0):** Elif Ba Adası'nın ana sayfasında bir Akvaryum kartı var. Harekeler adımında öğrenilen her harf (🦪) için akvaryuma bir balık geliyor. Balıkların üstünde harekeli harf yazıyor; dokununca o heceyi okuyor ve sonraki dokunuşta öteki harekeye geçiyor. Balıklar yavaşça, kendi başlarına yüzüyor; suya dokununca yem düşüyor ve yakındaki balıklar yemeğe geliyor. Yeni gelen balıklar akvaryum açılınca yandan yüzerek giriyor. Kod: `islands/elif-ba/games/aquarium.*`.

## 🎩 Harekeyi Giydir (yeni fikir)

Ekranda harekesiz bir harf var. Kaplumbağa bir hece söylüyor (örneğin "Be ötre"), çocuk üstün, esre ve ötreden doğrusunu harfe giydiriyor: üstün ve ötre şapka gibi harfin üstüne, esre ayakkabı gibi altına oturuyor.

- Hece Balonları sesten heceyi buldurur; bu oyun tersini yapar ve harekeyi çocuğun kendisine kurdurur. Harekenin harfin neresine konduğunu da öğretir.
- Yanlış hareke giydirilince o hece okunur ("Bu Be esre oldu"), çocuk iki sesin farkını duyar.
- Yeni kayıt gerekmiyor; mevcut 84 hece kaydı yetiyor. Harekeler adımına ikinci oyun olarak eklenebilir.

**Taslakta:** 8 tur, her turda başka bir harf.

## 📿 İnci Kolye (yeni fikir)

Her koyun dört harfi, Elif Ba sırasıyla bir inci kolyeye diziliyor. İpin başında bir önceki koyun son harfi duruyor (örneğin د), çocuk sıradaki inciyi (ذ) bulup takıyor.

- Elif Ba sırası derste ezberlenir ve çocuklar harfleri sırayla sayarak hatırlar; oyun bu sırayı koylarla birlikte öğretir.
- Aralarına başka koylardan iki "şaşırtmaca" inci karışıyor. Her inciye dokununca adı okunur; kolye tamamlanınca dört harf sırayla okunur.
- Yeni kayıt gerekmiyor. Her koyun Harfler adımının sonuna ya da Cam Köprü'den önceye küçük bir bulmaca olarak eklenebilir.

**Taslakta:** Yedi koyun yedi kolyesi, 28 harfin hepsi.
