# Türkçe Şarkı Sözü Yazım Kılavuzu

> **"Söz gümüşse, sükût altındır"** — ama doğru söz, elmastan değerlidir
> Türk çocuklarının beynine, Türk diliyle hitap

---

## Bilişsel Anlambilim (Cognitive Semantics)

### Türkçe Nasıl Düşünür?

```yaml
türkçe_zihin_modeli:

  özne_odaklılık:
    derece: orta
    özellik: |
      Türkçe, eylemi özneye değil fiile yükler.
      "Ben yaptım" değil "Yapıldı" tercih edilebilir.
      Çocuk şarkılarında: "Güneş doğar" (özne) ama aynı zamanda
      "Doğuverir güneş" (fiil vurgulu) doğal.

  kanıtsallık (evidentiality):
    aktif: true
    açıklama: |
      Türkçe, bilginin kaynağını işaretler:
      - "-miş" = duyum, rivayet ("Dünya dönüyormuş")
      - "-di" = doğrudan gözlem ("Dünya döndü")
      Eğitim şarkılarında: Kesin bilgi için "-dır/-dir" kullan
      "Su üç halde bulunur" → "Su üç halde bulunuR"

  uzay_çerçevelemesi:
    tip: göreceli (relative)
    örnek: |
      "Sağ", "sol", "ön", "arka" bedene göre
      Çocuklar için: "Kalbinin olduğu taraf sol"

  zaman_algısı:
    özellik: |
      Türkçe'de zaman fiil sonunda işaretlenir.
      Geniş zaman eğitim için ideal: "-r/-ar/-er"
      "Güneş doğAR, çiçek açAR"
```

### Kültürel Zihin Modelleri

```yaml
kültürel_modeller:

  aile_odaklılık:
    kullanım: |
      "Anne, baba, dede, nine" referansları güçlü
      "Annen gibi sıcak, güneş ışığı"
      "Deden anlatsın, tarih konuşsun"

  doğa_bağlantısı:
    kullanım: |
      Anadolu doğası referansları:
      - Dağlar, ovalar, denizler
      - Mevsimler (özellikle bahar)
      - Hayvanlar (kurt, kartal, arı)

  kolektif_bilinç:
    kullanım: |
      "Biz" vurgusu "Ben"den önce
      "Hep birlikte öğrenelim"
      "El ele, omuz omuza"
```

---

## Dilbilgisel Özellikler (Grammatical Features)

### Sözdizimi (Word Order)

```yaml
temel_yapı: SOV (Özne-Nesne-Yüklem)

şarkı_için_esneklik:
  normal: "Çocuk kitabı okuyor"
  vurgulu: "Kitabı okuyor çocuk"
  şiirsel: "Okuyor kitabı, küçük çocuk"

kural: |
  Yüklem sonda = güçlü bitiş
  Şarkı sonu mutlaka yüklemle bitsin:
  "... ve böylece su döngüsü TAMAMLANIR"
  "... işte matematik böyle YAPILIR"

kafiye_kolaylığı: |
  Yüklem sonda = fiil ekleri kafiye yapar
  "-yor / -lar / -mış / -dır" kolayca kafiye
```

### Soru Yapısı

```yaml
soru_eki: "mı/mi/mu/mü"

eğitim_kullanımı:
  merak_uyandırma: "Ay neden parlıyor BİLİYOR MUSUN?"
  katılım: "Sen de söyle, hazır MISIN?"
  düşündürme: "Peki bu nasıl oluyor DERSİN?"

şarkıda_soru: |
  Nakarat öncesi soru = katılım
  "Hazır mısın? (Hazırım!)
   Başlıyor mu? (Başlıyor!)"
```

---

## Biçimbilimsel Özellikler (Morphological Features)

### Eklemeli Yapı (Agglutination)

```yaml
türkçe_ek_gücü:
  açıklama: |
    Türkçe sondan eklemeli (agglutinative)
    Tek kelime, bir cümle anlamı taşıyabilir

  şarkı_avantajı:
    - Uzun kelimelerde ritim tutturulur
    - Ek tekrarı = doğal kafiye
    - Anlam yoğunluğu = az kelime, çok anlam

örnekler:
  gel:
    - gel-i-yor-um (4 hece, tam bilgi)
    - gel-e-me-y-ecek-ler-miş (7 hece, rivayet + olumsuz + çoğul)

  şarkı_kullanımı: |
    "Gel-DİM, gör-DÜM, öğren-DİM"
    "Koş-TU, uç-TU, kazan-DI"
    Ek tekrarı ritim yaratır!
```

### Ünlü Uyumu (Vowel Harmony)

```yaml
büyük_ünlü_uyumu:
  kural: Kalın → kalın, ince → ince
  a-ı-o-u (kalın) / e-i-ö-ü (ince)

küçük_ünlü_uyumu:
  kural: Düz → düz, yuvarlak → yuvarlak

şarkı_etkisi:
  avantaj: |
    Ünlü uyumu doğal melodi yaratır
    "Okul-DA, sınıf-TA, masa-DA" (a-a uyumu)
    "Ev-DE, pencere-DE, defter-DE" (e-e uyumu)

  nakarat_tasarımı: |
    Aynı ünlü grubundan kelimeler seç:
    "Sarı-arı-tanı-anı" (a-ı grubu)
    "Gemi-yemi-dedi-geri" (e-i grubu)
```

### Ünsüz Yumuşaması ve Sertleşmesi

```yaml
yumuşama:
  kural: "p-ç-t-k" → "b-c-d-ğ" (ünlü önünde)
  kitap → kitabı, ağaç → ağacı

sertleşme:
  kural: "c-d-g" → "ç-t-k" (ünsüz önünde)

şarkı_dikkat:
  - Doğru çekim = doğal akış
  - Yanlış çekim = dil sürçer
  - "Kitabı okudum" ✓
  - "Kitapı okudum" ✗
```

---

## Sesbilimsel Özellikler (Phonetic Features)

### Hece Yapısı

```yaml
türkçe_hece:
  temel: (C)V(C)(C)
  en_yaygın: CV, CVC

şarkı_hece_ritmi:
  8_heceli_dize: "Gü-neş / do-ğar / her-gün / er-ken"
  7_heceli_dize: "Yıl-dız-lar / par-lar / ge-ce"
  11_heceli_dize: "A-na-do-lu'nun / dağ-la-rın-da / kar / var"

hece_sayma_önemi: |
  Türk şiiri hece ölçüsüne dayanır
  Her dize eşit hece = melodi uyumu
  Çocuk şarkıları: 7-8-11 hece ideal
```

### Vurgu (Stress)

```yaml
türkçe_vurgu:
  genel_kural: Son hece (bazı istisnalar)
  istisna: Yer adları, bazı ekler

şarkı_vurgusu:
  melodi_vurgusu_ile_eşle: |
    "Dünyamız dönüYOR" (son hece vurgulu)
    Melodinin güçlü vuruşu = son hece

  dikkat: |
    Yanlış vurgu = garip ses
    "DÜNyamız" değil "dünyaMIZ"
```

### Ses Tekrarları (Alliteration & Assonance)

```yaml
aliterasyon_örnekler:
  - "Parlak pırıl pırıl"
  - "Sessiz sakin sabah"
  - "Derin deniz dibi"

asonans_örnekler:
  - "Anla, tanı, say" (a tekrarı)
  - "Ev, sen, bel, gel" (e tekrarı)

şarkı_kullanımı: |
  Nakarat: ses tekrarı = akılda kalıcılık
  "Sarı, sıcak, süper güneş
   Sana, bana, herkese eş"
```

---

## Edebi Söz Sanatları (Literary Devices)

> **EN ÖNEMLİ 5 SÖZ SANATI — Çocuk şarkılarında zorunlu kullan!**

### 1. Teşbih (Benzetme/Simile)

```yaml
tanım: |
  Aralarında ortak özellik bulunan iki kavramı karşılaştırma.
  Soyut kavramları somutlaştırır — çocuklar için ZORUNLU.

unsurlar:
  benzeyen: "güneş"
  benzetilen: "top"
  benzetme_edatı: "gibi, kadar, sanki, tıpkı"
  benzetme_yönü: "yuvarlak"

çocuk_şarkısı_örnekleri:
  - "Dünya bir top GİBİ döner" (uzay)
  - "Kalp pompa GİBİ çalışır" (biyoloji)
  - "Beyin bilgisayar GİBİ düşünür" (teknoloji)
  - "Atomlar minik toplar GİBİ" (kimya)

kural: |
  Her soyut kavram için BİR teşbih kullan.
  Çocuğun bildiği şeye benzet: top, oyuncak, hayvan, yemek.
```

### 2. Teşhis (Kişileştirme/Personification)

```yaml
tanım: |
  İnsan dışı varlıklara insan özellikleri verme.
  Çocuklar için EN ETKİLİ sanat — her şey canlı olur!

örnekler:
  - "Güneş GÜLÜMSÜYOR" (doğa)
  - "Yapraklar DANS EDİYOR" (biyoloji)
  - "Su ŞARKI SÖYLÜYEKen akar" (fen)
  - "Rakamlar KONUŞUYOR" (matematik)
  - "Bulut AĞLIYOR, yağmur yağıyor" (hava)

çocuk_şarkısı_kullanımı: |
  Doğa olaylarını kişileştir:
  "Güneş uyanır, 'Günaydın!' der,
   Çiçekler açar, arı gelir"

  Bilimsel kavramları canlandır:
  "Su buharlaşır, 'Hoşça kal!' der,
   Gökyüzüne uçar, bulut olur"

kural: Her dörtlükte EN AZ 1 teşhis kullan.
```

### 3. İstiare (Eğretileme/Metaphor)

```yaml
tanım: |
  Benzetme edatı olmadan, bir şeyi başka bir şey olarak söyleme.
  Teşbihten daha güçlü, daha şiirsel.

tipler:
  açık_istiare: |
    Benzetilen söylenir, benzeyen gizli.
    "Gökyüzündeki TOPLAR" (yıldızlar)
  kapalı_istiare: |
    Benzeyen söylenir, benzetilen gizli.
    "Güneş DOĞDU" (bebek gibi)

çocuk_şarkısı_örnekleri:
  - "Gece örtüsü" (karanlık)
  - "Bilgi denizi" (kitaplar)
  - "Sayı merdiveni" (matematik)
  - "Hafıza sandığı" (beyin)

kural: |
  Nakaratta istiare kullan — akılda kalır!
  "Aç hafıza sandığını, koy içine bilgiyi!"
```

### 4. Tekrar (Yineleme/Repetition)

```yaml
tanım: |
  Aynı ses, kelime veya yapının tekrar edilmesi.
  Şarkılar için EN ÖNEMLİ sanat — ezber yapar!

tipler:
  ses_tekrarı:
    aliterasyon: "Parlak Pırıl Pırıl" (p sesi)
    asonans: "Anla, tanı, say" (a ünlüsü)

  kelime_tekrarı:
    anafor: |
      Dize başlarında tekrar:
      "Su döner, su döngü yapar,
       Su buhar, su bulut olur"
    epifora: |
      Dize sonlarında tekrar (redif):
      "Güneş doğar sabahLEYİN,
       Çiçek açar sabahLEYİN"

  yapı_tekrarı:
    paralelizm: |
      "Gel-DİM, gör-DÜM, öğren-DİM"
      "Oku-YOR, yaz-IYOR, çiz-İYOR"

şarkı_zorunluluğu: |
  - Nakarat: Ana kavramı 4+ kez tekrarla
  - Her dörtlük: En az 1 ses veya kelime tekrarı
  - Redif: Fiil ekleriyle doğal tekrar oluştur
```

### 5. Tezat (Karşıtlık/Antithesis)

```yaml
tanım: |
  Birbirine zıt kavramları yan yana getirme.
  Çocuklar için çok etkili — farkları öğretir!

örnekler:
  - "Gece-gündüz, yaz-kış döner"
  - "Sıcak-soğuk, su değişir"
  - "Büyük-küçük, hepsi atom"
  - "Artı-eksi, elektrik akışı"

çocuk_şarkısı_kullanımı: |
  Zıtlıkları nakarat yap:
  "Sıcakta buhar, soğukta buz,
   Su her halde, harika kız/oğuz!"

  Karşılaştırma öğretimi:
  "Güneş büyük, dünya küçük,
   Ama ikisi de yuvarlak, süslü çiçek"

kural: |
  Her connection şarkısında tezat kullan.
  Zıtlıklar = daha derin anlama.
```

---

## Ahenk Unsurları (Prosodic Elements)

### Ulama (Liaison/Linking)

```yaml
tanım: |
  Ünsüzle biten kelimenin, ünlüyle başlayan kelimeyle birleşmesi.
  Akıcılık ve melodi için KRİTİK!

örnek:
  yazılış: "Sen de gel"
  okunuş: "Sen-de-gel" (3 hece, ulama yok)

  yazılış: "Gel artık"
  okunuş: "Ge-lar-tık" (3 hece, ulama var!)

şarkı_kullanımı: |
  Ulama ile hece sayısını ayarla:
  "Su buhar olur" → "su-bu-ha-ro-lur" (5 hece, ulama)
  Şarkının akıcılığı için ulamayı planla!

dikkat: |
  Hece sayarken ulamayı hesaba kat.
  Ulama = daha akıcı şarkı.
```

### Hece Ölçüsü Kalıpları (Syllable Meter Patterns)

```yaml
yaş_bazlı_hece:
  5-7_yaş:
    tercih: 7 hece (yedili)
    duraklar: 4+3 veya 3+4
    örnek: "Gü-neş / do-ğar / her-gün" (4+3)

  8-10_yaş:
    tercih: 8 hece (sekizli)
    duraklar: 4+4 veya 5+3
    örnek: "Su-lar / a-kar / de-re-den / aşa-ğı" (4+4)

  11-14_yaş:
    tercih: 11 hece (on birli)
    duraklar: 6+5 veya 4+4+3
    örnek: "A-na-do-lu'nun / dağ-la-rın-da / kar-lar" (6+5)

zorunlu_kural: |
  Aynı şarkıda TÜM dizeler aynı hece sayısında olmalı!
  Karışık hece = bozuk melodi = ezberlenemez.
```

### Kafiye ve Redif Kullanımı

```yaml
kafiye_zorunluluğu:
  nakarat: Tam kafiye veya zengin kafiye
  dörtlük: En az yarım kafiye

redif_gücü: |
  Türkçe'nin en güçlü silahı!
  Fiil ekleri doğal redif oluşturur:

  -yor redifi:
  "Su akIYOR, çiçek açIYOR,
   Güneş bakIYOR, kuş uçuYOR"

  -dır redifi:
  "Su sıvıDIR, buz katıDIR,
   Buhar gazDIR, hepsi suDUR"

kafiye_şeması:
  memorization: aaaa veya aabb (kolay)
  connection: abab veya abcb (anlam derinliği)
```

---

## Söz Sanatları (Word Arts)

### Deyimler (Idioms)

```yaml
eğitimde_kullanılabilir_deyimler:

  öğrenme_temalı:
    - "Aklına yat-" (anlamak)
    - "Kulak ver-" (dinlemek)
    - "Gözünü dört aç-" (dikkat etmek)
    - "Kafasına sok-" (öğrenmek)
    - "Dilinin ucunda olmak" (hatırlamaya çalışmak)

  merak_temalı:
    - "Kulaklarını dikmek" (merakla dinlemek)
    - "Gözleri fal taşı gibi açılmak"
    - "Ağzı açık kalmak" (şaşırmak)

  başarı_temalı:
    - "İşi başarmak"
    - "Parmak ısırtmak"
    - "Alnının akıyla çıkmak"

şarkı_entegrasyonu: |
  Literal kullanma, doğal entegre et:
  "Kulak ver, dikkat et,
   Şimdi başlıyor sıra sende!"
```

### Atasözleri (Proverbs)

```yaml
eğitimle_ilgili_atasözleri:

  çalışma:
    - "Damlaya damlaya göl olur"
    - "Emek olmadan yemek olmaz"
    - "Ağaç yaşken eğilir"

  bilgi:
    - "Bilmemek ayıp değil, sormamak ayıp"
    - "İnsan yedisinde ne ise yetmişinde de odur"
    - "Sakla samanı, gelir zamanı"

  sabır:
    - "Acele işe şeytan karışır"
    - "Sabırla koruk helva olur"

şarkı_entegrasyonu: |
  Nakarat olarak kullan veya dönüştür:
  "Damlaya damlaya göl olur,
   Her gün biraz, akıl dolu olur!"
```

### Tekerlemeler ve Ses Oyunları

```yaml
tekerlemeler:
  - "Bir berber bir berbere gel beraber..."
  - "Dal sarkar kartal kalkar..."

çocuk_şarkısı_adaptasyonu:
  matematik: |
    "Bir iki, bir iki,
    Sayılar bizim dili!
    Üç dört, beş altı,
    Matematiğin tadı!"

  fen: |
    "Su su, duru su,
    Buharlaşır uçuşu,
    Bulut olur yağışı,
    Döngü bitmez akışı!"
```

### Kafiye Tipleri

```yaml
tam_kafiye:
  örnek: "gül - bülbül, yaz - saz"
  kullanım: Nakarat için ideal

yarım_kafiye:
  örnek: "gel - gül, kar - kör"
  kullanım: Dörtlüklerde

zengin_kafiye:
  örnek: "gözlerim - sözlerim, gelirken - giderken"
  kullanım: Anlamlı bağlantılar

redif:
  tanım: Kafiyeden sonra tekrar eden ekler
  örnek: "geliyorum - gidiyorum - biliyorum"
  avantaj: Türkçe'de doğal, çok güçlü

şarkı_tercihi: |
  Memorization: Tam kafiye + redif (kolay ezber)
  Connection: Yarım/zengin kafiye (anlam derinliği)
```

---

## Aruz ve Hece Vezni

### Hece Vezni (Modern Türk Şiiri)

```yaml
yaygın_kalıplar:
  7_hece: "Yedi-lik / dö-nen / tek-er" (halk şiiri)
  8_hece: "Seki-zli / a-kış / gi-der" (türkü)
  11_hece: "On bir-li / büyük / des-tan / dili" (destan)

çocuk_şarkısı_tercihi:
  5-7_yaş: 7-8 hece (kısa, kolay)
  8-10_yaş: 8-11 hece (orta)
  11-14_yaş: 11+ hece (karmaşık)

örnek_7_hece:
  - "Bir va-kit / bah-çe-de" (7)
  - "Gül-ler / aç-mış / ren-ga-renk" (7)
```

---

## Örnek Şarkı Yapısı

### Memorization (Ezber) Şarkısı — Gezegenler

```
[Nakarat - Deyim ile]
Kulak ver, gözünü dört aç!
Dokuz gezegen, sırayla saç:

[Dörtlük 1 - Hece: 8+8+8+8]
Merkür, Venüs, Dünya, Mars,  (8)
Jüpiter en büyük, dev yaramaz! (9→8)
Satürn halkalı, buz Uranüs, (9→8)
Neptün en uzak, mavi nefes!  (8)

[Nakarat]
Damlaya damlaya göl olur,
Her gezegen yerine konulur!
Merkür, Venüs, bir iki üç,
Dünya bizim, harika güç!
```

### Connection (Bağlantı) Şarkısı — Su Döngüsü

```
[Giriş - Bilinen Şey]
Banyoda buhar görürsün,
Cam buğulanır, izini sürürsün,
Bu buhar nereden gelir?
Suyun sırrı burada gizli...

[Nakarat - Temel Kavram]
Buharlaşma! (yukarı uçar)
Yoğuşma! (bulut oluşur)
Yağış! (yere düşer)
Su döngüsü, hiç durmaz, dönüşür!

[Genişleme - Derinleştirme]
Güneş denizi ısıtır,
Su görünmez olur, uçar gider,
Yukarıda soğuk, buz gibi,
Su damlacıkları birleşir.

[Köprü - Gerçek Hayat]
Yarın yağmur yağdığında,
Bir düşün, bu su neredeydi?
Belki denizde, belki derede,
Döngü bitmez, devam eder hep!

[Final - Sentez]
Atasözü der ki bize:
"Damlaya damlaya göl olur"
Su da öyle, döne döne,
Dünyamızı yaşatır durur!
```

---

## Dikkat Edilecekler

```yaml
yapılacaklar:
  ✓ Hece sayısı tutarlı tut
  ✓ Ünlü uyumuna uy
  ✓ Deyim ve atasözlerini doğal kullan
  ✓ Yüklem sonda bitir
  ✓ Ses tekrarlarıyla akılda kalıcılık yarat
  ✓ Çocuğun dünyasından örnekler seç

yapılmayacaklar:
  ✗ İngilizce'den literal çeviri
  ✗ Ünlü uyumunu bozma
  ✗ Yabancı deyim tercümesi
  ✗ Uzun, karmaşık cümleler (küçük yaşlar)
  ✗ Formal/yazı dili (konuşma dili kullan)
```

---

## Versiyon

```yaml
version: 1.0.0
type: language-brain-document
language: Turkish (tr)
author: humanitic
principle: "Önce düşünce, sonra dil"
```
