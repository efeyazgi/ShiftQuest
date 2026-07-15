<p align="center">
  <img src="./public/shiftquest-mark.svg" alt="ShiftQuest logo" width="132" />
</p>

<h1 align="center">ShiftQuest</h1>

<p align="center"><strong>Engineer English Arcade</strong><br />Kimya mühendisleri için kariyer temalı, oyunlaştırılmış profesyonel İngilizce pratiği.</p>

ShiftQuest; B1–B2 düzeyindeki öğrencileri ve genç mühendisleri ofis, üretim, toplantı, kalite, güvenlik ve kariyer iletişimi senaryolarına taşır. Kısa görevler XP, coin, unvan ve kelime hâkimiyeti üretir; dashboard ise ezber puanı yerine kullanıcının nerede güçlendiğini gösterir.

> ShiftQuest bir dil öğrenme oyunudur. İçerik gerçek proses işletme, ekipman kullanma, iş güvenliği eğitimi veya mesleki yeterlilik belgesi yerine geçmez. Uygulamadaki kariyer unvanları yalnızca oyun içi ilerlemeyi temsil eder.

## Hızlı başlangıç

Gereksinimler: güncel LTS [Node.js](https://nodejs.org/) sürümü (önerilen Node.js 20+) ve npm.

```bash
npm install
npm run dev
```

Ardından [http://localhost:3000](http://localhost:3000) adresini açın. Harici AI veya TTS anahtarı olmadan da seed senaryolar ve yerleşik fallback'ler ile temel oyun çalışır.

Üretim doğrulamaları:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Oyun akışı

1. Onboarding'de `B1`/`B2`, kariyer alanı, aksan, günlük hedef ve avatar seçilir.
2. İlk harita açılışında bir dakikadan kısa **Quick Start** turu; görevleri, Daily Shift'i, XP/coin'i, Word Vault'u, Performans'ı ve AI/ses ayarlarını gerçek ekran öğeleri üzerinde gösterir.
3. Career Map üzerinden açık bir görev veya Daily Shift başlatılır.
4. Diyalog, cümle kurma, boşluk doldurma, ton kontrolü ve hızlı yanıt gibi adımlar çözülür.
5. Tıklanabilir ifadeler açıklama, telaffuz ve örnek cümle kartını açar; istenen kelimeler Word Vault'a eklenir.
6. Görev sonunda XP/coin, doğruluk, hatalar ve tekrar önerileri kaydedilir.
7. Dashboard; gerçek oturum kayıtlarından güçlü alanları, zorlanılan kelimeleri ve gelişimi hesaplar.

Tur atlanabilir ve profil bazında yalnız bir kez otomatik açılır. Header'daki `?` düğmesinden veya **Ayarlar → ShiftQuest nasıl çalışır?** panelinden yeniden başlatılabilir.

B1 modu daha kısa cümleler, daha fazla Türkçe destek ve daha belirgin seçenekler; B2 modu ise daha yakın çeldiriciler, doğal iş kalıpları ve daha az ipucu kullanır. Hatalar XP düşürmez.

## Sayfalar

| Yol | Ekran | Ne sunar? |
| --- | --- | --- |
| `/` | Landing | Ürün tanıtımı, özellik özeti, kariyer haritası ön izlemesi ve **Start Your Shift** aksiyonu |
| `/onboarding` | Onboarding | Seviye, kariyer odağı, aksan, günlük hedef ve avatar seçimi |
| `/map` | Career Map | Bölge/görev kilitleri, günlük görev, boss noktaları ve oyun içi unvan |
| `/scenario/[id]` | Scenario Player | Diyalog, mini oyun, kelime kartı, TTS, ipucu, XP ve görev ilerlemesi |
| `/results` | Mission Results | XP/coin, doğruluk, yeni kelimeler, düzeltmeler ve sıradaki görev |
| `/dashboard` | Dashboard | XP/çalışma grafikleri, beceri ve kategori analizi, içgörüler ve son aktiviteler |
| `/word-vault` | Word Vault | Kaydedilen ifadeler, filtreler, favoriler, hâkimiyet ve aralıklı tekrar |
| `/settings` | Profile & Settings | Seviye, aksan, hedef, ses/animasyon/tema tercihleri ile veri dışa aktarma/sıfırlama |

Geçersiz veya kilitli senaryo kimlikleri kullanıcıyı oynanabilir içeriğe yönlendirir; boş ve hata durumları sayfa içinde açıklanır.

## Mimari

Uygulama Next.js App Router ve TypeScript üzerinde tek bir web istemcisi olarak çalışır. Temel katmanlar:

```text
app/                  Sayfalar ve sunucu API route'ları
components/           Arcade HUD, senaryo, dashboard ve ortak UI bileşenleri
config/brand.ts        Tek noktadan marka adı, alt başlık ve slogan
data/                 Doğrulanabilir seed senaryolar ve başlangıç kelimeleri
features/game/         Zustand oyun store'u ve kullanıcı aksiyonları
lib/
  providers/           LLM ve TTS adaptörleri ile güvenli fallback'ler
  storage/             Tarayıcı kalıcılığı ve veri sürümleme sınırı
  scoring/             XP, coin, unvan ve performans hesapları
  spaced-repetition/   Kelime tekrar planlama mantığı
  validation/          Harici/seed veriler için şema doğrulama
types/                 Paylaşılan domain tipleri
public/                Özgün marka ve arka plan SVG'leri, web manifesti
```

Veri akışı özetle şöyledir: tipli seed veri veya doğrulanmış provider yanıtı → oyun oturumu → cevap olayı → ilerleme deposu → sonuç ve dashboard türetimleri. UI, provider ayrıntılarını doğrudan bilmez; böylece statik mod ile harici servis modu aynı ekranları kullanır.

Markayı yeniden adlandırmak için metinleri ekran ekran aramak yerine `config/brand.ts` içindeki `brand` nesnesini değiştirin. Metadata ve paylaşım metinlerinde kalan ürün adlarını da aynı değişiklikte gözden geçirin.

## Yerel veri ve kalıcılık

MVP hesap gerektirmez. Onboarding tercihleri, senaryo sonuçları, XP/coin, seri, analitik olaylar, ayarlar ve Word Vault ilerlemesi `features/game/store.ts` içindeki Zustand store üzerinden tarayıcıda kalıcı olarak tutulur. Sürümlü localStorage anahtarı `shiftquest-game-v1`'dir; sayfa yenilemesi veriyi silmez.

- Sunucu tarafında kullanıcı profili veya merkezi hesap senkronizasyonu yoktur.
- Farklı tarayıcı/profil/cihazlar birbirinden bağımsızdır.
- Gizli/geçici tarama, tarayıcı verisini temizleme veya site kotası veriyi kaldırabilir.
- Settings içindeki dışa aktarma, kullanıcıya kendi ilerlemesinin taşınabilir bir kopyasını verir; sıfırlama işlemi yalnızca ShiftQuest verisini hedefler.
- Depo erişimi istemci sınırında tutulduğu için ileride IndexedDB veya uzak PostgreSQL/Supabase adaptörüne geçirilebilir.

## Seed senaryo ekleme

Yeni içerik eklerken mevcut `Scenario` kaydını örnek alın:

1. `data/scenarios.ts` içindeki senaryo kataloğuna benzersiz bir `id` ve URL-uyumlu `slug` ile yeni kayıt ekleyin; kartta kullanılan ifadeler yoksa önce `data/vocabulary.ts` kataloğunu genişletin.
2. Seviye (`B1`/`B2`), kategori, süre, karakterler, en az beş görev adımı, hedef kelimeler, XP ve coin ödülünü doldurun.
3. Her cevap için yalnızca doğru seçeneği değil; kısa Türkçe açıklama ve daha doğal İngilizce alternatifi de sağlayın.
4. Hedef ifadelerin anlam, sözcük türü, IPA, yaklaşık Türkçe telaffuz, iki dilli örnek ve TTS metinlerini kelime kataloğuyla eşleştirin.
5. Senaryoyu `scenarios` merkezi export/katalog listesine ekleyin. `id` değerini sonradan değiştirmeyin; kayıtlı kullanıcı ilerlemesi bu kimliği kullanır.
6. Kilit/açılma koşulu ve harita bölgesi gerekiyorsa kariyer haritası kaydını güncelleyin.
7. `npm run lint` ve `npm run build` ile tipleri, route üretimini ve şemayı doğrulayın; ardından hem B1 hem B2 görünümünü oynayın.

İçerik güvenlik kuralı: kullanıcıya gerçek ekipman çalıştırma, proses parametresi ayarlama veya güvenlik açısından kritik operasyon talimatı vermeyin. Teknik terimleri profesyonel iletişimin bağlamı olarak kullanın.

## AI ve TTS sağlayıcıları

Proje anahtarsız çalışacak şekilde tasarlanmıştır. Kullanıcı provider bağlantısını doğrudan **Ayarlar → AI + Voice Provider Studio** bölümünden yönetebilir:

En kolay ücretsiz-katman kurulumu Google Gemini'dir:

1. Settings içindeki **Google ile hızlı kurulum** bölümünden [Google AI Studio API keys](https://aistudio.google.com/apikey) sayfasını açın ve yeni bir Gemini Auth key oluşturun.
2. **Google'ı otomatik ayarla** düğmesine basın. ShiftQuest AI endpoint'ini, düşük kota tüketimli metin modelini, neural TTS modelini ve iki ses profilini otomatik doldurur.
3. Anahtarı yalnız **Gemini API key** alanına yapıştırın. Ses tarafındaki **AI API anahtarını paylaş** açık olduğunda ikinci kez girmeniz gerekmez.
4. Önce **AI bağlantısını test et**, ardından **English test** ve **Türkçe test** düğmelerini kullanın. AI testi gerçek roleplay + geribildirim şemasını üretir; yalnız anahtarın varlığını kontrol etmez.

Google Gemini ücretsiz katmanı limitsiz değildir; kullanılabilen modeller, kota ve bölge uygunluğu Google hesabına göre değişebilir. Neural servis yanıt vermezse oyun seed/mock içeriğe ve tarayıcı Speech Synthesis sesine geri döner. İleri seviye kullanıcılar `OpenAI-compatible` modunda kendi HTTPS endpoint, model ve voice kimliklerini girebilir.

Arayüzden girilen bilgiler `shiftquest-runtime-providers-v1` adlı ayrı localStorage kaydında tutulur; oyun store'una ve ilerleme JSON export/import dosyasına girmez. Anahtar yalnız provider isteği sırasında aynı-origin API route'una gönderilir, sunucuda kalıcı olarak saklanmaz. Bu yerel kayıt şifreli bir secret vault değildir; paylaşılan cihazda işiniz bittiğinde **Bağlantıları unut** işlemini kullanın.

Deployment yöneticileri aynı sağlayıcıları sunucu ortam değişkenleriyle de tanımlayabilir. Yerel ortam dosyanızı oluşturun:

```bash
Copy-Item .env.example .env.local
```

macOS/Linux karşılığı: `cp .env.example .env.local`.

Genel sağlayıcı sözleşmesi:

```dotenv
# Arayüz runtime ayarı yoksa kullanılan server varsayılanları
LLM_PROVIDER=mock
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

# browser modu Web Speech fallback'ini kullanır
TTS_PROVIDER=browser
TTS_API_KEY=
TTS_BASE_URL=
TTS_MODEL=
TTS_ENGLISH_VOICE=
TTS_TURKISH_VOICE=

# UI'daki özel HTTPS endpoint origin'leri (virgülle ayrılmış)
RUNTIME_PROVIDER_ALLOWED_ORIGINS=
```

- Provider önceliği `geçerli UI runtime ayarı → server environment → mock/browser fallback` şeklindedir.
- `LLM_API_KEY` ve `TTS_API_KEY` environment değerlerini **asla** `NEXT_PUBLIC_` ile başlamayın. Bunlar yalnız sunucu route'larında okunur.
- Runtime base URL yalnız HTTPS olabilir; localhost, IP literal, özel ağlar ve izin listesinin dışındaki origin'ler reddedilir. `https://api.openai.com` ve `https://generativelanguage.googleapis.com` varsayılan olarak izinlidir; başka origin'leri `RUNTIME_PROVIDER_ALLOWED_ORIGINS` ile açıkça ekleyin.
- `LLM_PROVIDER=google-gemini` boş model/base URL değerlerinde `gemini-3.1-flash-lite` ve native Gemini `generateContent` endpoint'ini kullanır. Görev motoru TTS gibi `x-goog-api-key` ile çalıştığından yeni AI Studio Auth key'leri desteklenir.
- `TTS_PROVIDER=google-gemini` boş değerlerde `gemini-3.1-flash-tts-preview` ve `Kore` sesini kullanır; Google'ın PCM16 çıktısı tarayıcı için WAV'a dönüştürülür.
- AI kapalı, hatalı, zaman aşımında veya geçersiz şema döndürdüğünde uygulama seed senaryo/mock feedback'e geri döner.
- TTS kapalı ya da servis erişilemezse tarayıcı Speech Synthesis kullanılır. Ses kalitesi ve mevcut aksanlar işletim sistemi/tarayıcıya göre değişebilir.
- Google LLM çıktısı istekte gönderilen structured-output JSON şemasıyla yönlendirilir, ardından aynı tipli şema sunucuda tekrar doğrulanır; geçersiz yanıt arayüze aktarılmaz.
- Harici TTS kullanıldığında aynı metin/ses/hız bileşimi önbelleğe alınmaya uygundur; böylece gereksiz tekrar çağrıları azaltılır.

Sunucu entegrasyon sınırı `app/api/scenario`, `app/api/feedback`, `app/api/roleplay` ve `app/api/tts` route'larıdır. Runtime credentials yalnız aynı-origin POST isteklerinde kabul edilir; provider ayarları öğrenme prompt'undan ayrılır ve hata cevapları anahtarı ya da ham upstream cevabını içermez.

Desteklenen somut provider adları ve ek değişkenler için `.env.example` dosyasını kaynak kabul edin; bu dosya ile README arasında farklılık olursa `.env.example` geçerlidir.

## Gizlilik, güvenlik ve fallback davranışı

- Varsayılan statik modda öğrenme verisi cihazda kalır; uygulamanın kendi uzak kullanıcı veritabanı yoktur.
- Harici AI etkinse rol yapma girdisi ve değerlendirme için gerekli bağlam seçilen sağlayıcıya gönderilebilir. Üretimde sağlayıcının veri işleme koşullarını ayrıca değerlendirin.
- Harici TTS etkinse seslendirilecek metin sağlayıcıya gönderilir. Parola, kişisel veri veya şirket sırrı içeren metin kullanmayın.
- Kullanıcı girdisi prompt talimatıyla birleştirilmeden ayrı veri olarak ele alınmalı; çıktılar şema doğrulamasından geçmelidir.
- Hata mesajları API anahtarı, ham provider cevabı veya sunucu ayrıntısı göstermez.
- Mikrofon/kayıt özelliği bu MVP'nin parçası değildir; ileride eklenirse açık izin ve ayrı saklama politikası gerekir.
- Uygulama içi ses, efekt ve animasyonlar ayrı kapatılabilir; azaltılmış hareket tercihi desteklenir.

## Bilinen sınırlamalar

- MVP yerel ve tek kullanıcılıdır; oturum açma, bulut yedekleme, cihazlar arası senkronizasyon ve ekip yönetimi yoktur.
- Web manifesti bulunmasına rağmen tam çevrimdışı PWA önbelleği/service worker sağlanmaz. Önceden yüklenmiş statik içerik bağlantı kesintilerinde daha dayanıklıdır; ilk sayfa yüklemesi için ağ gerekebilir.
- Neural TTS ve üretken AI, yapılandırılan üçüncü tarafın kota, gecikme, bölge ve fiyatlandırmasına bağlıdır. Fallback modunda deneyim işlevsel kalır fakat daha sınırlıdır.
- Tarayıcı TTS sesleri tutarlı değildir; bazı cihazlarda istenen American/British/Turkish ses bulunmayabilir.
- Oyun analitiği kişisel öğrenme içgörüsüdür; CEFR sınavı veya profesyonel yetkinlik ölçümü değildir.
- Seed içerik kontrollü bir başlangıç setidir; gerçek iş yeri prosedürleri için kurumunuzun onaylı dokümanlarını izleyin.

## Görsel varlıklar

`public/` altındaki `favicon.svg`, `shiftquest-mark.svg`, `arcade-grid.svg`, `pipeline-pattern.svg` ve `noise.svg` bu proje için özgün olarak oluşturulmuştur. Next.js public yolları sırasıyla `/favicon.svg`, `/shiftquest-mark.svg` vb. şeklindedir. `manifest.webmanifest` uygulama adı, renkleri ve standalone başlangıç davranışını tanımlar.

## Erişilebilirlik notları

Kritik durumlar yalnız renkle anlatılmaz; buton ve formlarda erişilebilir isimler, klavye odağı ve yeterli kontrast hedeflenir. Hareket hassasiyeti olan kullanıcılar için `prefers-reduced-motion` ve Settings içindeki animasyon tercihi dikkate alınır. Yeni mini oyun eklerken sürükle-bırak etkileşimine bir klavye alternatifi de ekleyin.
