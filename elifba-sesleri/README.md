# Diyanet Elifba sesleri

Kaynak https://kuran.diyanet.gov.tr/elifba

24 Kasım 2026 tarihinde resmî uygulamanın 91 ders sayfasındaki ses eşlemeleri tarandı. Başarılı olarak indirilen 1.912 MP3 toplam 109.115.793 bayttır. Uygulamanın referans verdiği diğer 57 adres sunucuda HTTP 404 döndürmektedir. Bu kayıtlar `katalog.json` içindeki `error` alanıyla bulunabilir.

## Klasörler ve dosya adları

Dosyalar bölüm, konu, ders ve ses türü sırasıyla yerleştirilmiştir.

- `elifba` temel bilgiler, ön söz ve giriş kayıtlarını içerir.
- `tecvid` tecvid uygulamalarını, sûreleri ve ekleri içerir.
- `okuma` harf, kelime ve ayet kayıtlarını içerir.
- `ritmik` birlikte ve ritmik okunan grupları içerir.
- `ders-aciklamasi`, `aciklama`, `baslik` ve `not` öğretici anlatımları içerir.

Dosya adı, okunan metnin ilk 75 karakteri ile kaynaktaki dosya kimliğini birleştirir. Arapça metindeki harekeler korunur. İşaretleme parantezleri ve dosya adında kullanılamayan karakterler temizlenir. Örneğin `ا__btn_1.mp3`, Harfler dersindeki elif kaydıdır. Aynı harfin farklı hareke ve bağlamları ait oldukları ders klasörlerinde bulunur.

## Uygulamada kullanım

`katalog.json` her kaydın göreli dosya yolunu (`file`), okunan tam metnini (`text`), türünü (`kind`), kaynak adresini (`sourceUrl`), kullanıldığı dersleri (`uses`), bayt sayısını (`bytes`) ve SHA-256 özetini (`sha256`) içerir. `uses` içinde aynı kaynak dosyasının farklı metin veya ders eşlemeleri korunmuştur. `error` içeren kaydın yerel ses dosyası bulunmaz.

Dosyaların MP3 başlıkları ve SHA-256 özetleri doğrulanmıştır. Metin eşlemesi Diyanet uygulamasındaki verilerden alınmıştır. Seslerin tamamı tek tek dinlenerek denetlenmemiştir.

Kayıtların kaynağı Diyanet İşleri Başkanlığıdır. Kaynak sayfada tüm hakların saklı olduğu belirtilmektedir.
