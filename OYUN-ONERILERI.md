# Elif Ba Adası · Oyun önerileri

Oynanabilir taslaklar **Deneme Odası**'nda duruyor: `app/deneme/` (yayında `…/deneme/` adresi). Oyunun hiçbir ekranı bu sayfaya bağlantı vermez. Deneme Odası profil, yıldız ya da ilerleme kullanmaz, hiçbir şey saklamaz. Bir oyun doğrudan da açılabilir: `deneme/#uzat`, `#kalin`, `#papagan`, `#yunus`, `#fener`, `#tren`, `#giydir`, `#kolye`, `#album`, `#buyutec`.

Oyuna giren bir taslak Deneme Odası’ndan çıkarılır; burada “Oyunda” diye kalır. Odadaki yeni fikirler önde ve “✨ Yeni” işaretli; her oyunun 🐢💬 düğmesi oyunun ne olduğunu sesli söylüyor, 💡 Öneri kutusu büyükler için.

| Öneri | Durum |
|---|---|
| 🍬 Kısa mı Uzun mu? | Yeni fikir (0.96.0), Deneme Odası’nda · Uzatma (med) |
| 🐘 Fil mi Kuş mu? | Yeni fikir (0.96.0), Deneme Odası’nda · kalın ve ince harfler |
| 🦜 Papağan | Yeni fikir (0.96.0), Deneme Odası’nda · çocuk kendisi söylüyor |
| 🐬 Yunus Şarkısı | Yeni fikir (0.96.0), Deneme Odası’nda · sıra hafızası |
| 🔦 Fenerle Ara | Yeni fikir (0.96.0), Deneme Odası’nda · karanlıkta harf arama |
| 🐣 İlk Harf Albümüm | Deneme Odası’nda · yumurtalardan çıkan 28 sesli harf |
| 🐢 Harf Büyüteci | Deneme Odası’nda · gösterilen harfin eşine dokunma |
| 🐠 Akvaryum | **Oyunda** (0.16.0) |
| 🐚 Kabuk Hafızası | **Oyunda** (0.83.0) · oyun adımlarında seçilebiliyor; taslağı Deneme Odası’ndan çıkarıldı (0.96.0) |
| 🦀 Yengeç Avı, 🎣 Balık Tutma, 🧺 Sepete Topla | **Oyunda** (0.83.0) · oyun adımlarında balon ve yağmur oyunlarının yerine seçilebiliyor |
| 🚂 Hece Treni | Deneme Odası'nda · tren düzeni İngilizce Koyu’nda 🚂 Kelime Treni olarak oyunda, Elif Ba için hâlâ taslak |
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

**Taslak:** Üç seviyesiyle (4, 4 ve 5 çift) Deneme Odası’ndaydı; oyuna girdiği için 0.96.0’da çıkarıldı.

**Oyunda (0.83.0):** Her adacığın oyun adımında, adımın kendi yağmur ya da balon oyunu yerine seçilebiliyor (`games/kabuk.js`). Bir kabuk heceyi söylüyor 🔊, öteki yazısını gösteriyor; sesi ile yazısı eşleşince inci oluyor. İki tahta var (4 ve 6 çift), ikincisinde ilk tahtadakilerin en kolay karışanları da var (bin ile bi, be ile bi). Can yok; boşuna açılan kabuk sayısı yıldızları belirliyor.

## 🦀 Yengeç Avı, 🎣 Balık Tutma, 🧺 Sepete Topla (0.83.0)

Balon ve yağmur oyunlarına üç seçenek daha; üçü de oyun adımlarının seçme ekranında (`games/arcade.js` ortak kabuğu, `yengec.js`, `olta.js`, `sepet.js`).

- **Yengeç Avı:** Kumdaki altı delikten tabelalı yengeçler çıkıp saklanıyor. Kaplumbağa bir hece söylüyor, çocuk o tabelayı tutan yengece dokunuyor. 16 tur, 3 can.
- **Balık Tutma:** Kaplumbağa teknede oltayla bekliyor; altında harfli balıklar yüzüyor. Duyulan hecenin balığına dokununca olta inip balığı tekneye çekiyor; yanlış balık oltadan kaçıyor. 16 tur, 3 can.
- **Sepete Topla:** Bir midye geliyor, kaplumbağa içindekini söylüyor; çocuk onu sürükleyip (ya da sepete dokunup) doğru sepete atıyor. Sepetler adacığın konusuna göre: harf adacıklarında harflerin sepetleri (midye yalnızca ses çıkarıyor), hece ve bitişik adacıklarında üstün, esre, ötre sepetleri, cezm adacıklarında cezimli ve cezimsiz (بِسْ ile بِسَ), tenvin adacıklarında tenvinli ve tenvinsiz (بٍ ile بِ), şedde adacıklarında şeddeli ve şeddesiz (بِسَّ ile بِسَ). Sepetlerin üstünde tek başına işaret değil, Be harfiyle yazılmış heceler var (بَ، بَ بِ بُ، بًا بٍ بٌ …). Yanlış sepette doğru sepet yeşil yanıyor. 16 midye, 3 can.

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

## 🍬 Kısa mı Uzun mu? (yeni fikir, Uzatma)

Kaplumbağa bir hece okuyor: ya kısa (بَ) ya uzun (بَا). Çocuk iki karttan birine dokunuyor: kısa kartın altında kısa, uzun kartın altında uzun pembe bir sakız şeridi var. Okumayı bilmeyen çocuk şeritten anlıyor; harfleri gördükçe uzatan elifi, ye’yi ve vav’ı da tanıyor.

- Haritada “Yakında” duran Uzatma Koyu’nun ilk oyunu olabilir. Doğru kartta şerit ses boyunca sağdan sola uzuyor. Yanlışta önce dokunulan, sonra doğru hece okunuyor; iki ses arka arkaya duyulunca fark belli oluyor, doğru kart yeşil parlıyor.
- **Kayıtlar hazır:** Diyanet Elifba’nın Fetha’nın, Kesra’nın ve Damme’nin Uzatılması derslerinden 28 harfin üç uzun hecesi, 84 kayıt (بَا, بِي, بُو …) bayt bayt `app/deneme/ses/uzun/NN-H.mp3` olarak alındı (H: 0 üstün, 1 esre, 2 ötre; kaynakları aynı klasördeki `kaynak.json`). Kısa heceler oyundaki aynı Diyanet sesi, böylece iki ses yalnızca uzunlukta ayrılıyor. Uzatma Koyu yapılınca bu kayıtlar `assets/audio/elif-ba/` altına taşınır.
- Diyanet uzun esreyi dikey esreyle yazıyor (ب۪ى); bu işaret (U+06EA) yaygın telefon yazı tiplerinde harfi bozduğu için taslakta düz yazılış (بِي) kullanılıyor.

**Taslakta:** 10 tur; her turda başka bir harf, üç hareke sırayla, yarısı kısa yarısı uzun.

## 🐘 Fil mi Kuş mu? (yeni fikir, kalın ve ince harfler)

Diyanet Elifba harfleri ince ve kalın diye iki gruba ayırıyor (uzatma derslerinde ayrı satırlarda okutuluyor): خ ر غ ق ص ض ط ظ kalın okunur (sa, ta, kı), ötekiler ince (se, te, ki). Çocuklar en çok bu ikilileri karıştırıyor: س ile ص, ت ile ط, ك ile ق.

- Kaplumbağa bir hece okuyor ve heceyi gösteriyor. Kalın sesse file 🐘, ince sesse kuşa 🐤 veriliyor. Şıklar resim; yazı okumak gerekmiyor.
- Yanlışta doğru hayvan heceyi söylüyor, öteki hayvan da onun ikizini (صَ “sa”, سَ “se”): çocuk kalın ve ince sesi yan yana duyuyor. Doğru hayvana yine de dokunmak gerekiyor.
- Yeni kayıt gerekmiyor. Harekeler adımına ya da Uzatma Koyu’na oyun olarak eklenebilir.
- Elif, Ha ve Ayn ince sayılıyor ama Türk kulağına “a” gibi geldiğinden taslakta sorulmuyor; Ra esreyle (ri) ince olduğundan yalnızca üstün ve ötreyle geliyor.

**Taslakta:** 12 tur, yarısı kalın yarısı ince.

## 🦜 Papağan (yeni fikir, söyle ve dinle)

Bütün oyunlar duyduğunu bulmayı çalıştırıyor; Elif Ba’nın amacı ise sesli okumak. Bu oyunda çocuk kendisi söylüyor: kaplumbağayı dinliyor, 🎤 düğmesine dokunup söylüyor, sonra papağan önce kaplumbağanın, sonra çocuğun sesini tekrar ediyor.

- Puan ya da yanlış yok; çocuk kendi sesini öğretmeninkiyle yan yana duyup karşılaştırıyor. Konuşurken papağanın yanındaki ses çubukları kıpırdıyor.
- Kayıt cihazdan çıkmıyor, hiçbir yere gönderilmiyor, saklanmıyor; oyundan çıkınca mikrofon kapanıyor. İzin verilmezse 🎤 düğmesi 🚫 oluyor, kaplumbağa yine dinlenebiliyor.
- Harf (ا), hece (بَ) ve uzun hece (بَا) sekmeleri var; sekmelerde yazı yok, harf var. Aynı oyun İngilizce Koyu’nda kelimeleri söylemek için de kullanılabilir.

**Taslakta:** Her sekmede 8 kart; kayıt 2,6 saniyede kendiliğinden duruyor (ya da 🎤’e yeniden dokununca).

## 🐬 Yunus Şarkısı (yeni fikir, sıra hafızası)

Dört yunusun başında bir koyun dört harfi var. Yunuslar sırayla zıplayıp harflerini söylüyor; çocuk aynı sırayla yunuslara dokunuyor. Şarkı her seferinde bir harf uzuyor.

- Sesleri sırayla akılda tutmak kelime okumanın temeli: هَلَكَ okunurken üç hece sırayla akılda kalmalı. Oyun bunu harflerle çalıştırıyor.
- Yanlışta doğru yunus parlayıp zıplıyor, şarkı baştan bir daha söyleniyor; can yok.
- Yeni kayıt gerekmiyor. Harekeli hecelerle de oynanabilir; İngilizce Koyu’nda kelimelerle de olur.

**Taslakta:** Rastgele bir koyun harfleriyle 2, 3, 4 ve 5 harflik dört şarkı.

## 🔦 Fenerle Ara (yeni fikir)

Ekran gece denizi gibi karanlık; harfler kumun üstüne saklanmış. Çocuk parmağını gezdirdikçe fener ışığı onu izliyor, ışığın altındaki harfler görünüyor. Kaplumbağa bir harf söylüyor, çocuk onu bulunca dokunuyor.

- Karanlıkta rastgele dokunmak işe yaramıyor: ilk dokunuş yalnızca ışık tutuyor, harf ancak dokunmadan önce görünüyorsa seçilebiliyor.
- Aralarında hep noktadaş eşleri var (ب ت ث); harfi noktasından da tanımak gerekiyor. Yanlış harf adını söylüyor; doğru bulununca deniz aydınlanıyor.
- Yeni kayıt gerekmiyor. Bitişik yazılışta şekillerle, İngilizce Koyu’nda resimlerle (karanlık odada “Find the ball!”) de oynanabilir.

**Taslakta:** 8 tur, her turda 6 harf.
