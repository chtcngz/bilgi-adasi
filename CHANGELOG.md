# Sürüm notları

Sürüm numarası `ANA.ÖZELLİK.DÜZELTME` biçimindedir ve `VERSION` dosyasında tutulur:

- **Yeni özellik** eklenince ortadaki sayı artar, sondaki sıfırlanır: `0.1.0` → `0.2.0`
- **Düzeltme (hotfix)** yapılınca sondaki sayı artar: `0.1.0` → `0.1.1`

Yayınlanan sürüm, oyunun giriş ekranının ve Ayarlar penceresinin altında görünür.

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
