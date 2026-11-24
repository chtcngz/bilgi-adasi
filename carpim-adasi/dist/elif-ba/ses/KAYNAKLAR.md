# Elif Ba ses kayıtları: kaynaklar

Oyundaki kayıtlarda yalnızca baştaki ve sondaki sessizlik kırpıldı ve ses düzeyi eşitlendi
(`carpim-adasi/tools/elif_sesleri.py`). Kaydı olmayan harf ve heceleri cihazın Türkçe sesi okur.

## Heceler (üstün, esre, ötre)

84 hece, Hugging Face’teki [Pelafalan Huruf Hijaiyah](https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah) veri setinden alındı. Veri seti
Endonezya’nın Kudus şehrindeki Pondok Tahfidz Yanbuul Qur’an hafızlık okulunun MTs/MA öğrencilerinin
okuyuşlarından oluşuyor ve [Academic Free License 3.0](https://opensource.org/license/afl-3-0-php)
ile yayımlanıyor (veri setini hazırlayan: Reinjin).

Oyunda tek bir ses duyulsun diye her hece aynı öğrencinin iki okuyuşundan daha temiz olanından alındı: Fadli, Hamzah_MTS. ع harfinin üç hecesi Hamzah_MTS’ten, diğerleri Fadli’den.

| Harf | Üstün | Esre | Ötre |
|---|---|---|---|
| ا Elif | `Fadli_alif_fathah_1.wav` | `Fadli_alif_kasroh_1.wav` | `Fadli_alif_dommah.wav` |
| ب Be | `Fadli_ba_fathah_1.wav` | `Fadli_ba_kasroh_1.wav` | `Fadli_ba_dommah_1.wav` |
| ت Te | `Fadli_ta_fathah_1.wav` | `Fadli_ta_kasroh_1.wav` | `Fadli_ta_dommah.wav` |
| ث Se | `Fadli_tsa_fathah_1.wav` | `Fadli_tsa_kasroh_1.wav` | `Fadli_tsa_dommah_1.wav` |
| ج Cim | `Fadli_jim_fathah_1.wav` | `Fadli_jim_kasroh.wav` | `Fadli_jim_dommah_1.wav` |
| ح Ha | `Fadli_hah_fathah_1.wav` | `Fadli_hah_kasroh_1.wav` | `Fadli_hah_dommah_1.wav` |
| خ Hı | `Fadli_kha_fathah_1.wav` | `Fadli_kha_kasroh_1.wav` | `Fadli_kha_dommah.wav` |
| د Dal | `Fadli_dal_fathah_1.wav` | `Fadli_dal_kasroh_1.wav` | `Fadli_dal_dommah.wav` |
| ذ Zel | `Fadli_dzal_fathah_1.wav` | `Fadli_dzal_kasroh_1.wav` | `Fadli_dzal_dommah_1.wav` |
| ر Ra | `Fadli_ra_fathah_1.wav` | `Fadli_ra_kasroh_1.wav` | `Fadli_ra_dommah.wav` |
| ز Ze | `Fadli_zay_fathah_1.wav` | `Fadli_zay_kasroh.wav` | `Fadli_zay_dommah.wav` |
| س Sin | `Fadli_sin_fathah_1.wav` | `Fadli_sin_kasroh.wav` | `Fadli_sin_dommah.wav` |
| ش Şın | `Fadli_shin_fathah.wav` | `Fadli_shin_kasroh.wav` | `Fadli_shin_dommah_1.wav` |
| ص Sad | `Fadli_sad_fathah_1.wav` | `Fadli_sad_kasroh.wav` | `Fadli_sad_dommah.wav` |
| ض Dad | `Fadli_dad_fathah_1.wav` | `Fadli_dad_kasroh_1.wav` | `Fadli_dad_dommah.wav` |
| ط Tı | `Fadli_tah_fathah_1.wav` | `Fadli_tah_kasroh_1.wav` | `Fadli_tah_dommah.wav` |
| ظ Zı | `Fadli_zah_fathah.wav` | `Fadli_zah_kasroh.wav` | `Fadli_zah_dommah.wav` |
| ع Ayn | `Hamzah_MTS_ain_fathah.wav` | `Hamzah_MTS_ain_kasroh.wav` | `Hamzah_MTS_ain_dommah.wav` |
| غ Gayn | `Fadli_ghaiin_fathah_1.wav` | `Fadli_ghaiin_kasroh.wav` | `Fadli_ghaiin_dommah.wav` |
| ف Fe | `Fadli_fa_fathah.wav` | `Fadli_fa_kasroh.wav` | `Fadli_fa_dommah.wav` |
| ق Kaf | `Fadli_qaf_fathah.wav` | `Fadli_qaf_kasroh.wav` | `Fadli_qaf_dommah.wav` |
| ك Kef | `Fadli_kaf_fathah_1.wav` | `Fadli_kaf_kasroh.wav` | `Fadli_kaf_dommah_1.wav` |
| ل Lâm | `Fadli_lam_fathah.wav` | `Fadli_lam_kasroh.wav` | `Fadli_lam_dommah_1.wav` |
| م Mim | `Fadli_mim_fathah.wav` | `Fadli_mim_kasroh.wav` | `Fadli_mim_dommah_1.wav` |
| ن Nun | `Fadli_nun_fathah_1.wav` | `Fadli_nun_kasroh_1.wav` | `Fadli_nun_dommah.wav` |
| و Vav | `Fadli_waw_fathah_1.wav` | `Fadli_waw_kasroh_1.wav` | `Fadli_waw_dommah.wav` |
| ه He | `Fadli_Ha_fathah.wav` | `Fadli_Ha_kasroh.wav` | `Fadli_Ha_dommah.wav` |
| ي Ye | `Fadli_ya_fathah.wav` | `Fadli_ya_kasroh.wav` | `Fadli_ya_dommah.wav` |
