# İngilizce sesler · kaynak

İngilizce Koyu’nun bütün İngilizce kelime ve cümleleri, açık kaynaklı **Kokoro-82M** metinden konuşma modeliyle
(hexgrad, Apache-2.0 lisansı, https://huggingface.co/hexgrad/Kokoro-82M) **af_heart** sesiyle üretildi; ONNX sürümü:
https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX. Kayıtlar `tools/ingilizce_sesler.py` ile yapıldı:

- `<id>.mp3`: normal hızda, `<id>-y.mp3`: 🐢 yavaş okunuş (id, satırın SHA-1’inin ilk 10 hanesi)
- `kayitlar.js`: hangi satırın hangi dosyada olduğu (`window.ingilizceKayitlar`)

Kaydı olmayan bir satırı oyun cihazın kendi İngilizce sesiyle okur.
