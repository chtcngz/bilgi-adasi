# Sürüm notları

Sürüm numarası `ANA.ÖZELLİK.DÜZELTME` biçimindedir ve `VERSION` dosyasında tutulur:

- **Yeni özellik** eklenince ortadaki sayı artar, sondaki sıfırlanır: `0.1.0` → `0.2.0`
- **Düzeltme (hotfix)** yapılınca sondaki sayı artar: `0.1.0` → `0.1.1`

Yayınlanan sürüm, oyunun giriş ekranının ve Ayarlar penceresinin altında görünür.

## 0.10.0 · 24.11.2026

Harf Yağmuru artık hiç durmuyor.

- Yağmur, oyun başladıktan sonra hiç kesilmiyor; harfler arasında gökyüzü boşaltılmıyor. Kaplumbağa bir harfi söylüyor, çocuk o harften **3 tane** patlatınca kaplumbağa hemen yeni harfi söylüyor. Havada kalan aynı harf damlaları zincirleme kendiliğinden patlıyor.
- Her patlatmada kaplumbağa harfin adını yeniden söylüyor. Üstteki sıradaki yuva üç parçalı bir halka olarak doluyor, üçüncüde harf yerine oturuyor. Patlatma sesi bir harfin üç damlasında do-mi-sol diye yükseliyor.
- Yeni harf söylenene kadar yanlış damlaya dokunmak can götürmüyor; sonrasında yanlış dokunuş yine bir kalp kırıyor. Harf bir süre duyulmazsa kaplumbağa kendiliğinden hatırlatıyor.
- Her 10 harf bir seviye: yağmur durmadan güneş açıyor, gökkuşağı çıkıyor ve konfeti yağıyor. Seviye puanı ekleniyor ve harfler biraz daha hızlı yağıyor. Üstte seviye rozeti var.
- Üç can var ve seviye atlamak can geri getirmiyor. Üçü de bitince kısa bir özet çıkıyor: ulaşılan seviye madalya olarak, puan ve rekor. Ardından oyun birkaç saniye içinde kendiliğinden 1. seviyeden baştan başlıyor. "Hemen başla" ile beklemeden başlanıyor, "Adaya dön" ile çıkılıyor. Oyundan yarıda çıkılınca da puan rekora sayılıyor.
- Yıldızların yerini en yüksek seviye aldı: ada sayfası, Harfler bölümü ve Ayarlar → İlerleme rekoru ve seviyeyi gösteriyor. Önceki sürümün rekor puanı korunuyor.
- Düzeltme: Telefonda uygulamadan çıkıp geri dönünce mola ekranından "Devam et" denildiğinde sesler gelmiyordu. Ses motoru artık sayfa arka plandayken duraklatılıyor ve geri dönüşteki ilk dokunuşta yeniden kuruluyor. Bu, bütün adaların efekt seslerini ve Elif Ba'nın harf seslerini kapsıyor.

## 0.9.0 · 24.11.2026

Elif Ba Adası'na ilk oyun geldi: **Harf Yağmuru**. Öğrenilen harflerle oynanan bir dinleme oyunu.

- Kaplumbağa bir harfin adını söylüyor, ardından bulutların altından harfler damla damla yağmaya başlıyor. Çocuk duyduğu harfe denize düşmeden dokununca kaplumbağa sıradaki harfi söylüyor. Bir turda 10 harf yakalanıyor ve harfler her seferinde biraz daha hızlı yağıyor.
- Yalnızca öğrenilmiş harfler yağıyor. Son öğrenilen koyun harfleri her turda soruluyor, önceki koyların harfleri tekrar için araya giriyor. Turun ilerleyen bölümünde yalnızca noktalarıyla ayrılan harfler (ب ت ث, ج ح خ…) birlikte yağıyor.
- 3 can var. Yanlış harfe dokununca bir kalp kırılıyor, o harf griye dönüp adını gösteriyor ve kaplumbağa doğru harfi yeniden söylüyor. Yakalanamadan denize düşen harf can götürmüyor; kaplumbağa harfi bir daha söylüyor. Üstteki 🔊 düğmesi harfi istenince tekrarlıyor.
- Her yakalanan harf 100 puan; harfi havadayken erken yakalamak 60 puana kadar, üst üste doğrular (🔥 seri) iki katına kadar ek puan getiriyor. Tur bitince kalan kalpler yıldız oluyor, yağmur dinip gökkuşağı çıkıyor; puan, rekor ve yakalanan harfler (dokununca okunuyor) gösteriliyor.
- Yakalama sesi seri uzadıkça notadan notaya yükseliyor, harfler denize "şıp" diye düşüyor, yıldızlar tek tek çınlıyor. Kaplumbağa konuşurken ağzı oynuyor, doğruda zıplıyor, yanlışta üzülüyor. Yeni sesler `tools/make_sounds.py` ile üretildi.
- Oyun, Kaplumbağa Koyu harfleri öğrenilince açılıyor. Ada sayfasında Harfler bölümünün hemen ardındaki karttan, Harfler bölümünün altından ve bir koyun harfleri bitince sonuç ekranından oyuna gidiliyor.
- Uygulamadan çıkınca oyun duraklıyor ve kaldığı yerden devam ediyor. Ses çalınamayan cihazlarda kaplumbağanın balonunda harfin adı yazıyor.
- Ayarlar → İlerleme bölümünde Harf Yağmuru rekoru da görünüyor; Elif Ba ilerlemesi sıfırlanınca o da sıfırlanıyor.

## 0.8.0 · 24.11.2026

Yeni ada: **Fen Bilimleri Adası** (4. sınıf). Din Bilgisi Adası’yla aynı düzende çalışıyor: ders kitabının ünitelerini izleyen duraklar, her turda 10 soru, 3 kalp ve “yarı yarıya” jokeri, Tekrar Kutusu, öğrenilen soru sayacı ve 20 soruluk Deneme Sınavı.

- İlk yedi durak, bu yıl okullarda okutulan MEB 4. sınıf Fen Bilimleri ders kitabının (Devlet Kitapları, 2026 baskısı) ünitelerini sırasıyla izliyor: 🌋 Yanardağ Tepesi (Yer kabuğu ve Dünya’mızın hareketleri), 🍎 Meyve Bahçesi (Besinlerimiz), 🧲 Mıknatıs Koyu (Kuvvetin etkileri), 🧪 Deney Laboratuvarı (Maddenin özellikleri), 💡 Fener Burnu (Aydınlatma ve ses teknolojileri), ♻️ Yeşil Vadi (İnsan ve çevre), 🔋 Pil Kulesi (Basit elektrik devreleri). 4. sınıf fen bu yıl henüz Maarif Modeli’ne geçmediği için 2018 programının kitabı esas alındı. Tanımlar, örnekler ve sayılar kitaptaki anlatıma göre yazıldı; kartlarda kitabın sayfa aralığı yazıyor. Yedi ünite baştan açık.
- Soruların tarzı, Ankara Tevfik İleri Anadolu İmam Hatip Lisesi’nin 2016-2025 yıllarındaki 9 giriş sınavının fen testleri incelenerek belirlendi (2021 kitapçığı okulun sitesinde yok): tablolar, deney anlatımları, mıknatıs dizilimleri, dara-brüt-net hesapları, D-Y ve I-II-III soruları. Sınav soruları aynen alınmadı. Benzeri bir sınavda çıkmış 142 sorunun açıklamasının altında yılı yazıyor.
- 🔭 Bilim Gözlemevi: kitapta olmayan ama sınavlarda sorulan konular (ısı alışverişi ve termometre, yoğuşma, buharlaştırma ve suda yüzdürmeyle ayırma, madde-cisim, sürat, ekinoks, bilim insanları, mikroskobik canlılar, vücudumuzdaki sistemler…). Yedi ünite bitince Deneme Sınavı ile birlikte açılıyor.
- Toplam 289 soru. Ayarlar → İlerleme bölümünde Fen Bilimleri Adası için ünite ünite yıldızlar ve öğrenilen soru sayısı görünüyor; ilerleme buradan sıfırlanabiliyor.
- Din Bilgisi ve Fen Bilimleri adaları artık aynı oyun motorunu (`soru-adasi.js`) ve görünümü (`soru-adasi.css`) kullanıyor; yeni bir ders adası, soru bankası ve birkaç satırlık ayarla eklenebiliyor. Din Bilgisi Adası’ndaki ilerleme olduğu gibi korunuyor.

## 0.7.0 · 24.11.2026

Din Bilgisi Adası artık ders kitabının tamamını kapsıyor ve ancak bütün sorular öğrenilince bitiyor.

- **Öğrenildi sayacı:** Bir soru iki ayrı turda doğru bilinince (ve son cevabı doğruysa) öğrenilmiş sayılıyor. Her durak kartında “📗 28 / 57 soru öğrenildi” çubuğu, adanın üstünde de genel ilerleme var. Durak, bütün soruları öğrenilince ✅ ile işaretleniyor; ada, 286 sorunun hepsi öğrenilince bitiyor. Yıldızlar yine tek turun başarısını gösteriyor.
- Turlarda sırayla önce yanlış yapılan, sonra hiç görülmemiş, sonra henüz öğrenilmemiş sorular geliyor. “Sıradaki” düğmesi en çok sorusu kalan durağı gösteriyor. Tur sonunda kaç yeni soru öğrenildiği yazıyor.
- **40 yeni soru:** Ders kitabından çıkarılan 194 maddelik kontrol listesinde sorulmayan 37 madde vardı (din ve peygamber kelimelerinin anlamı, hamt, helal, dilek cümleleri, ibadet tanımı, Kur’an okumanın ibadet olması, cüz gülü, sevgi tanımı, Haşimoğulları, Ümmü Eymen, Varaka b. Nevfel, Boykot, Medine Sözleşmesi, Hudeybiye, Hane-i Saadet, Peygamberimizin çocukları, çevre kirliliği…). Artık 194 maddenin hepsi en az bir soruyla soruluyor. Toplam soru sayısı 286.
- **Ayarlar → İlerleme:** Din Bilgisi Adası için ünite ünite yıldızlar ve öğrenilen soru sayısı görünüyor.
- Ada başlığındaki ve katalog kartındaki “İmam Hatip’e hazırlık” ifadesi kaldırıldı.

## 0.6.0 · 24.11.2026

Yeni ada: **Din Bilgisi Adası** (4. sınıf). 4. sınıfın Din Kültürü ve Ahlak Bilgisi konularını pekiştirir ve 5. sınıfa geçişteki Proje İmam Hatip Ortaokulu giriş sınavına hazırlar.

- İlk beş durak, okullarda okutulan MEB 4. sınıf ders kitabının (Türkiye Yüzyılı Maarif Modeli, Ekim 2026 güncellemesi) ünitelerini sırasıyla izliyor: ⚓ Selam Limanı (Günlük hayattaki dinî ifadeler, Sübhaneke), 🌷 İman Bahçesi (İslam’ı tanıyalım, Amentü), 🌳 İyilik Ormanı (Güzel ahlak, Fatiha), ⛰️ Hira Tepesi (Hz. Muhammed’i tanıyalım, Salli-Barik), ⛲ Abdest Çeşmesi (Din ve temizlik). Kavramlar, tanımlar, ayet ve hadisler kitaptaki anlatıma göre yazıldı; kartlarda kitabın sayfa aralığı yazıyor. Beş ünite baştan açık, çocuk okulda hangi ünitedeyse oradan başlayabiliyor.
- Soruların tarzı, Ankara Tevfik İleri Anadolu İmam Hatip Lisesi’nin 2016-2025 yıllarındaki 9 giriş sınavının Din Kültürü testleri incelenerek belirlendi: okuma metinli sorular, ayet ve hadis yorumları, “hangisi değildir”, öğrenci cevapları, eşleştirme, sıralama ve I-II-III-IV soruları. Sınav soruları aynen alınmadı, aynı tarzda yeniden yazıldı. Benzeri bir sınavda çıkmış 83 sorunun açıklamasının altında hangi yılın sınavında sorulduğu yazıyor.
- 💎 Hazine Mağarası: kitapta olmayan ama sınavlarda sorulan konular (namazın bölümleri, cami, fidye, dört büyük melek, kısa sureler, Dört Halife, peygamberlerin meslekleri, mahremiyet…). Beş ünite bitince açılıyor.
- Toplam 246 çoktan seçmeli soru. Her turda 10 soru, 3 kalp ve bir “yarı yarıya” jokeri var. Her cevaptan sonra “Biliyor muydun?” notu konuyu kısaca anlatıyor. Üst üste doğrular 🔥 seri olarak sayılıyor. Hatasız tur 3, bir yanlış 2, iki yanlış 1 yıldız veriyor.
- Yanlış cevaplanan sorular **Tekrar Kutusu**’na giriyor ve doğrusu bulunana kadar orada kalıyor. Yeni turlarda önce yanlışlar ve görülmemiş sorular geliyor.
- Beş ünite en az birer yıldızla bitince **Deneme Sınavı** açılıyor: gerçek sınav gibi her üniteden ve ekstralardan karışık 20 soru. Sonuçta puan, süre, en iyi skor, konulara göre doğrular ve açıklamalı yanlış listesi gösteriliyor.
- Ayarlar → İlerleme bölümünden Din Bilgisi Adası ilerlemesi sıfırlanabiliyor.

## 0.5.1 · 24.11.2026

- Elif Ba Adası'nda yanlış cevap artık Çarpım Adası'ndaki gibi işliyor: ilk yanlışta tur hemen bitiyor. Yanlış seçilen kırmızı, doğrusu yeşil gösteriliyor ve doğru cevap seslendiriliyor; "Tekrar dene" ile tur yeni sorularla baştan başlıyor. Koy yine yalnızca hatasız bir turla geçiliyor.

## 0.5.0 · 24.11.2026

- Elif Ba Adası'nda bir koy artık yalnızca hatasız bir turla geçiliyor. Yanlış cevapta çocuk doğrusunu bulana kadar denemeye devam ediyor; ama turda bir tane bile hata varsa sonunda "Bir daha deneyelim!" ekranı çıkıyor ve tur tekrarlanıyor. Kabuklar ve inciler hatasız turda, koyun dört harfi için birlikte kazanılıyor.
- Aynı kural harekelerle tanışma dersinin sorularında da geçerli.
- Turun ilerleme noktalarında hatalı sorular kırmızı görünüyor.

## 0.4.2 · 24.11.2026

- Düzeltme: Elif Ba Adası'nda kayıtlı harf ve hece sesleri bazı telefonlarda çalmıyordu. Kayıtlar artık oyunun efekt sesleriyle aynı yoldan (Web Audio) çalınıyor. Telefonun sessiz anahtarı açıkken de duyuluyor ve "Be üstün be" tekrarında hece kesilmeden geliyor.

## 0.4.1 · 24.11.2026

- Elif Ba Adası'nda 28 harfin adı da artık gerçek bir sesle, Türkçe Elif-Ba usulüyle okunuyor (Elif, Be, Te, Se…). Kayıtlar Internet Archive'daki "elifba_harfler_ses" kaydından alındı; kaynak bilgisi `elif-ba/ses/KAYNAKLAR.md` dosyasında.
- Ayarlar → Ses bölümünde "Türkçe okunuş" seçilirse harf adlarını ve heceleri yine cihazın sesi okuyor.

## 0.4.0 · 24.11.2026

Elif Ba Adası'nda harfler ve harekeler artık iç içe ilerliyor:

- Bir koyun dört harfi öğrenilince aynı harflerin harekeleri açılıyor. Yeni koyun harflerine, önceki koyun harekeleri bitmeden geçilmiyor. Sıra: Kaplumbağa Koyu harfleri → harekelerle tanışma → Kaplumbağa Koyu harekeleri → İnci Koyu harfleri → …
- Harekeler bölümü, 28 harfin hepsini beklemeden ilk koyun harfleri öğrenilince açılıyor.
- Ada sayfasında "Sıradaki" düğmesi çocuğu bir sonraki adıma götürüyor. Kilitli bir koya dokununca neyin önce yapılması gerektiği yazıyor; bölüm sayfasında sıradaki adım diğer bölümdeyse oraya giden bir düğme çıkıyor.
- Bir koy bitince sonuç ekranı doğrudan sıradaki adıma yönlendiriyor; ilk koydan sonra harekelerle tanışma dersi kendiliğinden başlıyor.
- Harekelerle tanışma dersi yalnızca öğrenilmiş harflerle yapılıyor.
- Daha önce birçok harfi öğrenmiş olan oyuncuların bitirdiği koylar açık kalıyor; kaldıkları yerden harekelerle devam ediyorlar.

## 0.3.0 · 24.11.2026

- Elif Ba Adası'ndaki 84 hece (üstün, esre ve ötre ile her harf) artık gerçek bir insan sesiyle okunuyor. Kayıtlar, Kudus'taki (Endonezya) Pondok Tahfidz Yanbuul Qur'an hafızlık okulu öğrencilerinin okuyuşlarından oluşan açık lisanslı (AFL-3.0) bir veri setinden alındı. Adada tek bir ses duyulsun diye her hece aynı öğrencinin daha temiz kaydından seçildi. Kaynaklar `elif-ba/ses/KAYNAKLAR.md` dosyasında.
- "Be üstün be" tekrarında harfin ve harekenin adı Türkçe söyleniyor, hece ise kayıttan çalıyor.
- Düzeltme: ه ile و harflerinin adları yer değiştirmişti (ه kartında "Vav" yazıyordu). Sıra artık Elif-Ba'daki gibi: … Nun, Vav, He, Ye. Eski sürümde toplanan kabuklar doğru harfe aktarılıyor.

## 0.2.0 · 24.11.2026

Elif Ba Adası bölümlere ayrıldı:

- **1. bölüm · Harfler:** 7 koyda 28 harf. Kartlara dokunup harfin adı dinleniyor. Oyunda harf gösterilmeden sesi çalınıyor ve çocuk harfi buluyor; ayrıca harf gösteriliyor ve üç ses arasından doğrusu seçiliyor. Önceki koylardan bir harf tekrar olarak araya giriyor. Bir harfi iki kez ilk denemede bilen çocuk o harfin deniz kabuğunu kazanıyor; koyun dört harfi tamamlanınca sonraki koy açılıyor.
- **2. bölüm · Harekeler:** 28 harfin hepsi öğrenilince açılıyor. Önce üstün, esre ve ötre örneklerle tanıtılıyor (“Be üstün be”). Ardından her koyda dinlenen heceye göre doğru harekeyi bulma, farklı harflerin heceleri arasından duyulanı seçme ve harekenin adını söyleme soruları geliyor. Kazanılan ödül inci.
- Sonraki bölümler (bitişik yazılış, cezm, tenvin, şedde, uzatma, kelime ve âyet) haritada “Yakında” olarak görünüyor.
- Sesler önce kayıtlı ses dosyasından çalınıyor, kayıt yoksa cihazın Türkçe sesi okuyor. Gerçek harf kayıtları `carpim-adasi/tools/elif_sesleri.py` ile ekleniyor; Ayarlar → Ses bölümünden kayıt ile Türkçe okunuş arasında geçiş yapılabiliyor.
- Eski sürümde toplanan deniz kabukları yeni ilerlemeye aktarılıyor. Ayarlar → İlerleme bölümünden iki bölümün ilerlemesi birlikte sıfırlanabiliyor.

## 0.1.2 · 24.11.2026

- Yeni oyuncu eklerken pencere sadeleşiyor: oyuncu listesi ve üstteki resim gizleniyor, böylece telefonda klavye açılınca ekran karışmıyor
- Pencere klavyenin üstünde kalıyor, isim kutusu klavyenin altında kaybolmuyor
- Forma "Vazgeç" düğmesi eklendi; oyuncu listesine geri dönülebiliyor

## 0.1.1 · 24.11.2026

- Rakam tuşu sesi, tıklama sesiyle aynı yumuşak baloncuk tınısına geçti; biraz daha ince olduğu için ayırt ediliyor
- Silme tuşu sesi aşağı inen yumuşak bir baloncuk oldu

## 0.1.0 · 24.11.2026

İlk numaralı sürüm. O güne kadar yapılanlar:

- Çarpım Adası: halka sayaçlı soru kartı, 10 adımlık ilerleme, tuş takımı, doğru/yanlış/ada tamamlama ekranları, konfeti ve yıldız efektleri
- Yeni ses efektleri; sesler Web Audio ile gecikmesiz çalıyor, tıklama sesi yumuşak bir baloncuk sesi
- Haritada kilitli adalar ve adaya dokununca doğrudan açılma
- Karşılama ekranı: oyuncu kartları, sınıf ve avatar seçimi
- Ayarlar: oyuncu düzenleme ve silme, ses ayarı, ilerlemeyi haritadan sıfırlama
- Elif Ba Adası'nda ses ve efektler
- Sürüm numarası gösterimi
