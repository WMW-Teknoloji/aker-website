# AKER OSGB Sitesi — Nerede Kaldık

Son güncelleme: 2026-09-16
Dal: `master`

## Son oturum (2026-09-16) — alan adı Cloudflare'e taşındı

`akerosgb.com.tr` Bubble'dan koparıldı; site, WMW'nin diğer siteleriyle aynı Cloudflare
hesabındaki `aker-website` Pages projesinden yayınlanacak. Bu oturumda Cloudflare
tarafının tamamı hazırlandı. **Kod ve içerik değişmedi.**

- Bölge hesaba eklendi: `b3e7e430a716162af1e61c61baae2dba`, durum `pending`.
  Nameserver çifti: `hera.ns.cloudflare.com`, `kayden.ns.cloudflare.com`.
- Eski bölgedeki posta kayıtları birebir girildi: MX `mail.trmail.com.tr` (öncelik 10),
  TXT `v=spf1 a mx include:relay.mailbaby.net ~all`, CNAME `mail` → `mail.trmail.com.tr`,
  CNAME `autodiscover` → `autodiscover.trmail.com.tr`. Dördü de proxy kapalı (gri bulut).
- Resend kayıtları girildi (`send.akerosgb.com.tr`): DKIM TXT, SPF TXT, MX, CNAME.
- `@` ve `www` → `aker-website.pages.dev` (proxy açık), ikisi de Pages projesine custom
  domain olarak tanımlandı; durum `initializing`, bölge Active olunca sertifika çıkar.
- Zone ayarları: SSL `strict`, Always Use HTTPS açık, Automatic HTTPS Rewrites açık.
- `npm run typecheck` ve `npm run check` temiz; site yeniden deploy edildi (`915d2ef1`).

Kullanıcıya verilen adım adım kılavuz (Artifact):
https://claude.ai/artifact/B7UHv2c6rsxGeZEgfpvzmM

Kullanılan API token `~/.cf-aker-token` dosyasında ve **2026-09-24'te sona eriyor**;
sonrasında yeni token üretilmeli (Account: Cloudflare Pages Edit + Account Settings Read;
Zone: Zone Edit, DNS Edit, Zone Settings Edit — hepsi "All zones").

### ⛔ EN KRİTİK ENGEL: nameserver değişimi — panel şifresi AKER'de

Alan adı METUnic'te (ODTÜ Geliştirme Vakfı BT) **AKER şirketi adına** kayıtlı; müşteri
paneli `https://app.metunic.com.tr/client/login/`. Nameserver'lar hâlâ
`ns1/ns2.elitesistem.com` (DNS'i Elite Sistem yönetiyor, Worldstream sunucuları).
Panel şifresi AKER'de, bizde yok — 2026-09-16'da kullanıcının yöneticisine iletildi.

Bu tek kayıt değişmeden site ziyaretçiye görünmez. Değişince geçiş kendiliğinden olur;
Cloudflare tarafında yapılacak başka işlem yok. Alan adı whois'te transfere kilitli,
ancak bu nameserver değişimini engellemez.

## Durum özeti

Bu repodaki statik site **henüz ziyaretçiye görünmüyor**. `akerosgb.com.tr`, nameserver
değişimine kadar Bubble uygulamasını sunmaya devam ediyor (`X-Powered-By: Express`,
`X-Bubble-Perf`, `Set-Cookie: osgbaker_live_*`). Cloudflare tarafı hazır; eksik olan tek
şey registrar panelindeki nameserver kaydı.

Yapılanlar: teknik SEO altyapısı, semantik HTML, yapılandırılmış veri, görsellerin
repoya taşınması, performans temizliği, 19 yeni içerik sayfası, TypeScript geçişi ve
yönetim panelinin gerçek (sunucu tabanlı) panele dönüştürülmesi.

## Bu turda yapılanlar

### 1. Görseller Bubble CDN'den çıkarıldı
- 105 görsel indirildi, WebP'ye çevrildi, `img/` altına konuldu (toplam ~2,5 MB).
- Tüm HTML ve `src/cms-data.ts` referansları yerel yollara çevrildi.
- Flowick logosu 182 KB'lık SVG yerine 9,7 KB PNG olarak yeniden üretildi.
- Bubble CDN bağımlılığı sıfırlandı (tek istisna kalmadı).

Betikler: `tools/fetch-images.ts`, `tools/image-info.ts`

### 2. Teknik SEO
- `lang="en"` → `lang="tr"` (tüm sayfalar).
- Her sayfada canonical, benzersiz title ve description, OG/Twitter etiketleri,
  `max-image-preview:large`.
- `robots.txt` (yapay zekâ botları açık), `sitemap.xml` (22 adres) eklendi.
- `_headers` (güvenlik başlıkları + önbellek) ve `_redirects` (eski takma adlar) eklendi.
- `404.html` eklendi.
- Ana sayfa açıklaması 700+ karakterden 150 karaktere indirildi.

### 3. Semantik HTML
- Ana sayfada üç adet `h1` vardı; tek `h1`'e indirildi, bölüm başlıkları `h2` yapıldı.
- `header` / `nav` / `main` / `section` / `footer` elementleri kullanıldı.
- Form alanlarına `label` bağlandı, `skip-link` eklendi.
- Kırık `/static/icon_libraries/...` referansları (repoda olmayan dosyalar) satır içi
  SVG ile değiştirildi.

### 4. Yapılandırılmış veri (JSON-LD)
- Her sayfada `Organization` + `WebSite` + `BreadcrumbList`.
- Ana sayfa, şube ve lokasyon sayfalarında dört şube için `LocalBusiness`.
- Hizmet sayfalarında `Service` ve `FAQPage`.
- `/sss` sayfasında 12 soruluk `FAQPage`.

### 5. Performans
- Kullanılmayan 4 ikon font CDN'i kaldırıldı (mono-icons, remixicon, iconoir, css.gg).
- Kullanılmayan Bubble WhatsApp eklentisi betiği kaldırıldı.
- Tüm görsellere `width`/`height`/`loading`/`decoding` eklendi; hero görseline
  `fetchpriority="high"`.
- YouTube gömüsü `youtube-nocookie` + `loading="lazy"` yapıldı.
- Font çağrısı `display=swap` + `preconnect` ile yenilendi.
- Betikler `defer` ile yükleniyor.

### 6. İçerik HTML'e gömüldü
Haberler, kariyer ilanları, ekip, belgeler, hero ve müşteri logoları önceden yalnızca
JS ile basılıyordu; HTML'de boş `div` vardı. Artık içerik HTML'de: derleme anında statik
yedek olarak yazılıyor, istek anında ise middleware güncel veri tabanı içeriğiyle
değiştiriyor (bkz. 9. madde).

### 7. Yeni sayfalar (19)
- `/hizmetlerimiz` + 8 hizmet sayfası
- `/gebze-osgb`, `/dilovasi-osgb`, `/kocaeli-osgb`
- `/hakkimizda`, `/subelerimiz`, `/iletisim`, `/sss`, `/kariyer`, `/kvkk`, `/404`

### 8. TypeScript'e geçiş

Tarayıcı kodu, üretici betikler ve Cloudflare Functions TypeScript'e taşındı.
HTML ve CSS dosyaları statik kalmaya devam ediyor.

```
src/            tarayıcı kaynak kodu (TypeScript)
  content-types.ts  içerik modeli tipleri (tarayıcıdan bağımsız)
  types.ts          tarayıcı arayüzleri + window global tanımları
  cms-data.ts       tohum içeriği (veri tabanı ilk kurulurken yüklenir)
  image-sizes.gen.ts  görsel boyutları (üretilir)
  render.ts         paylaşılan içerik işaretlemesi (build + middleware)
  api.ts            yönetim API istemcisi
  dom.ts            küçük DOM yardımcıları
  script.ts         site davranışı
  admin.ts          yönetim paneli
js/             esbuild çıktısı (script.js, admin.js) - REPOYA DAHİL
db/             D1 şeması ve tohum verisi
functions/      Cloudflare Pages Functions (.ts)
tools/          üretici betikler (.ts, Node 24 tip sıyırma ile çalışır)
```

Üç ayrı tsconfig var, çünkü üç ortamın global tipleri farklı:
`tsconfig.json` (DOM), `tsconfig.tools.json` (Node), `tsconfig.functions.json` (Workers).

### 9. Yönetim paneli gerçek panele dönüştürüldü

Panel önceden `localStorage` kullanıyordu: sahibin girdiği içerik yalnızca kendi
tarayıcısında görünüyor, siteye hiç yansımıyordu. Ayrıca şifre istemci kodunda düz
metin duruyordu. İkisi de çözüldü.

**Veri akışı**

```
Ziyaretçi -> Cloudflare Edge -> statik HTML + D1'deki güncel içerik -> tam HTML
Sahip     -> /admin -> API -> D1'e yaz -> içerik sürümü artar -> sayfa anında tazelenir
```

- İçerik `D1` veri tabanında (`db/schema.sql`), görseller ve özgeçmişler `R2`'de.
- `functions/_middleware.ts` statik HTML'deki işaretli bölgeleri istek anında
  veri tabanı içeriğiyle değiştirir. İçerik tarayıcıda çekilmediği için **SEO bozulmaz**;
  bot da ziyaretçi de tam HTML alır.
- Veri tabanına ulaşılamazsa sayfa derleme anındaki içerikle servis edilir; site boş kalmaz.
- Her yazma işleminde `meta.surum` artar. Sayfa önbelleği bu sürüme göre anahtarlanır,
  böylece kayıttan sonra bayat sayfa servis edilmez. Yanıtta `ETag` döner, değişmemiş
  sayfalar 304 ile geçilir.

**Kimlik doğrulama**

- Şifre koddan çıktı, `ADMIN_PASSWORD` secret'ında.
- Giriş başarılı olduğunda HMAC-SHA256 imzalı `HttpOnly` + `SameSite=Strict` çerez, 8 saat.
- Tüm `/api/admin/*` uçları çerez ister; yazma isteklerinde ayrıca Origin denetimi (CSRF).
- IP başına 8 hatalı denemeden sonra 15 dakika kilit.

**Yeni uçlar**

| Uç | İş |
|---|---|
| `POST /api/auth/login` | giriş |
| `GET/DELETE /api/auth/session` | oturum sorgusu / çıkış |
| `GET/POST /api/admin/<koleksiyon>` | listele / ekle |
| `PUT/DELETE /api/admin/<koleksiyon>/<id>` | güncelle / sil |
| `POST /api/admin/<koleksiyon>/sira` | sıralama |
| `POST /api/admin/upload` | görsel yükleme (R2) |
| `GET /api/admin/applications` | başvurular |
| `GET /api/admin/cv/<anahtar>` | özgeçmiş (yalnızca oturumla) |
| `POST /api/basvuru` | iş başvurusu (herkese açık) |
| `GET /img/uploads/<anahtar>` | yüklenen görsel |

**Yan etkiler**

- Başvurular artık tarayıcıda değil veri tabanında; özgeçmiş R2'ye PDF olarak yükleniyor.
- KVKK metni her sayfada açılan kutucuktan çıkarılıp `/kvkk` sayfasına taşındı
  (iki sayfada ~10 KB tasarruf, aynı metnin site içinde tekrarı kalktı).
- Panelden `jszip`, `docx-preview`, `xlsx` CDN bağımlılıkları kaldırıldı; özgeçmiş
  önizlemesi PDF olduğu için tarayıcının kendi görüntüleyicisi yeterli.
- `js/data.js` kaldırıldı; genel sayfalar artık içerik için JavaScript çalıştırmıyor.

## Nasıl çalışıyor

Sayfaların ortak bölümleri (head, menü, alt bilgi, WhatsApp butonu, hizmet listesi)
tek kaynaktan üretilir. HTML dosyalarındaki `<!-- head:start -->` gibi işaretlerin
arası derleme sırasında doldurulur.

```
npm install            # bir kez: typescript, esbuild, tip paketleri
cp .dev.vars.example .dev.vars   # şifre ve oturum anahtarını doldurun
npm run db:setup       # lokal D1: şema + tohum verisi

npm run dev:full       # wrangler pages dev - API ve veri tabanı dahil TAM site
npm run e2e            # 36 uçtan uca sınama (dev:full açıkken)

npm run verify         # tip denetimi + derleme + SEO denetimi
npm run typecheck      # üç tsconfig için tip denetimi
npm run bundle         # src/*.ts -> js/*.js (esbuild)
npm run pages          # statik sayfaları ve sitemap.xml'i üretir
npm run check          # alt, canonical, h1, kırık bağlantı, JSON-LD denetimi
npm run db:seed        # src/cms-data.ts -> db/seed.sql
npm run dev            # yalnızca statik önizleme (API yok, hızlı)
```

İçeriği değiştirmek için:
- Site geneli bilgi (telefon, adres, menü): `tools/site.ts`
- Hizmet sayfaları: `tools/content/hizmetler.ts`
- Diğer sayfalar: `tools/content/sayfalar.ts`
- Haber/ekip/belge/ilan/referans verisi: `src/cms-data.ts`

Değişiklikten sonra **mutlaka `npm run build` çalıştırılmalı**, yoksa üretilen HTML ve
`js/` çıktısı güncellenmez.

**Cloudflare Pages'te build komutu tanımlanmamalıdır.** Derleme lokalde yapılır,
çıktı (`js/*.js` ve üretilen HTML) repoya commit edilir; Pages dosyaları olduğu gibi
sunar. Böylece deploy davranışı TypeScript öncesiyle aynı kalır.

## SIRADAKİ: Canlıya alma

0. ~~Veri tabanı, depo ve gizli değerler~~ — **TAMAMLANDI 2026-08-03**:
   - D1 `aker-website` oluşturuldu (`e4e73ca8-8ac6-4fa3-9511-3686e45ac3ef`), şema + tohum yüklendi
   - R2 kovası `aker-website-media` oluşturuldu
   - `ADMIN_PASSWORD` ve `SESSION_SECRET` Pages secret olarak tanımlandı
   - Site `aker-website` Pages projesine deploy edildi (production branch: `master`)
   - ~~**Eksik:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `MAIL_FROM`~~ — **2026-08-04
     itibarıyla üçü de tanımlı** (bkz. "Canlı secret durumu"). Değerleri ve
     çalıştığı doğrulanmadı.

1. ~~Cloudflare Pages projesi bağlanır~~ — **TAMAMLANDI**. Deploy komutu:

   ```
   npm run verify
   npx wrangler pages deploy . --project-name aker-website --branch master
   ```
   > **Not:** `aker-website.pages.dev` bu ofisin ağından açılmıyor (TLS SNI engeli).
   > Doğrulama dışarıdan bir vekil sunucu üzerinden yapıldı. Panel ancak alan adı
   > bağlandıktan sonra buradan kullanılabilir.

2. ~~`akerosgb.com.tr` DNS'i Bubble'dan Pages'e çevrilir~~ — **Cloudflare tarafı
   TAMAMLANDI 2026-09-16**: bölge kuruldu, kayıtlar girildi, `@` ve `www` Pages projesine
   custom domain olarak bağlandı. **Kalan:** registrar panelinde (METUnic) nameserver
   `hera.ns.cloudflare.com` + `kayden.ns.cloudflare.com` yapılacak — şifre AKER'de.
   Bubble'daki sayfa yapısı ile yeni yapı birebir aynı (`/`, `/belgelerimiz`,
   `/ekibimiz`, `/isbasvuru` — canlıda kontrol edildi, başka sayfa yok), ek 301 gerekmiyor.
3. **www → apex yönlendirmesi** Redirect Rule ile kurulmalı — **API token'ıyla
   kurulamadı**: `http_request_dynamic_redirect` fazı "request is not authorized" döndü
   (Transform Rules izni bu fazı kapsamıyor). Panelden elle:
   Cloudflare → akerosgb.com.tr → Rules → Redirect Rules → Create rule; eşleşme
   `Hostname equals www.akerosgb.com.tr`, hedef dinamik ifade
   `concat("https://akerosgb.com.tr", http.request.uri.path)`, 301, query string korunur.
   `_redirects` dosyası alan adı düzeyinde yönlendirme yapamaz; kural kurulmazsa aynı
   içerik iki adreste görünür (Bubble'da yönlendirme ters yöndeydi: apex → www).
4. **`.dev.vars` / Pages ortam değişkenleri**: iletişim formu Resend kullanıyor
   (`functions/api/contact.js`). Anahtar Pages proje ayarlarına girilmeli, yoksa form çalışmaz.
5. Canlıya alındıktan sonra: Search Console + Bing Webmaster kurulumu, sitemap gönderimi,
   Google Business Profile'da NAP'ın `tools/site.ts`'teki adreslerle birebir aynı olması.

## YARININ İLK İŞİ: iletişim formu e-postası

### Canlı secret durumu — 2026-08-04'te ölçüldü

> **DÜZELTME:** Bu bölümde daha önce "canlıda `CONTACT_TO_EMAIL` ve `MAIL_FROM`
> tanımlı değil" yazıyordu. Artık doğru değil.

`npx wrangler pages secret list --project-name aker-website` çıktısı: production
ortamında **beş secret'ın hepsi tanımlı** — `ADMIN_PASSWORD`, `SESSION_SECRET`,
`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `MAIL_FROM`.

Buna rağmen e-posta akışının çalıştığı **doğrulanmış değil**. Üç sebep:

1. **Değerler şifreli.** Wrangler yalnızca "Value Encrypted" gösteriyor;
   `RESEND_API_KEY`'in güncel anahtar mı, `MAIL_FROM`'un hangi adres olduğu
   dışarıdan görülemiyor.
2. **Ortam değişkenleri dağıtım anında bağlanır.** Son dağıtım `ee5bcce`
   (2026-08-03). Secret'lar o dağıtımdan sonra eklendiyse çalışan sürümde yoktur;
   etkili olması için yeniden deploy gerekir.
3. **Alan adı hâlâ Bubble'da.** `akerosgb.com.tr` bu Pages projesine gelmiyor,
   dolayısıyla gerçek form trafiği yok — hata da başarı da gözlemlenemiyor.

Doğrulamanın tek yolu: deploy atıp `pages.dev` üzerinden gerçek gönderim denemek.
**Engel:** `aker-website.pages.dev` bu ağdan açılmıyor (TLS SNI engeli). GET için
`curl https://r.jina.ai/<adres>` vekili çalışıyor ama form POST'u bu yolla atılamaz.
Gönderim testi ya başka bir ağdan ya da alan adı bağlandıktan sonra yapılmalı.

**KARAR (2026-08-04): Resend hesabı = Flowick ile ortak hesap.** AKER için ayrı hesap
açılmadı. Aynı hesap Bubble'daki Flowick BPM uygulamasında ve `flowick-website`
reposunda kullanılıyor; entegrasyon deseni birebir aynı — `flowick-website`
`functions/api/contact.ts:43` ile AKER `functions/_lib/mail.ts:22` ikisi de
`POST https://api.resend.com/emails` + Bearer + `from`/`to`/`reply_to` kullanıyor.
Kod tarafında değişiklik gerekmedi; yalnızca değişken adları farklı
(Flowick `FROM_EMAIL`/`TO_EMAIL`, AKER `MAIL_FROM`/`CONTACT_TO_EMAIL`).

AKER için ayrı bir `RESEND_API_KEY` üretildi ve lokal `.dev.vars`'a girildi
(gitignore'lu; repoya **girmez**). Canlıya Pages secret olarak eklenmesi gerekiyor.

### ✅ ÇÖZÜLDÜ: gönderen alan adı — `send.akerosgb.com.tr`

**`flowick.com` GEÇİCİDİR, canlıya bu adresle ÇIKILMAYACAK** — karar değişmedi.

2026-09-16: alan adı artık bizde olduğu için Flowick'in Resend hesabına
`send.akerosgb.com.tr` alt alan adı eklendi (id `41643ad1-c7e1-490e-9057-61ae7d882aa0`,
bölge `eu-west-1`, durum `not_started`). DKIM/SPF/MX/CNAME kayıtlarının dördü de yeni
Cloudflare bölgesine girildi. Alt alan adında doğrulandığı için **kök SPF kaydına
dokunulmadı** — AKER'in kendi giden postası etkilenmiyor.

Bölge Active olunca sırayla: Resend'de doğrulama tetiklenir, `MAIL_FROM` =
`AKER OSGB <no-reply@send.akerosgb.com.tr>` ve `CONTACT_TO_EMAIL` = `info@akerosgb.com.tr`
Pages secret olarak güncellenir, yeniden deploy edilir, gerçek gönderim denenir.
Lokal `.dev.vars` test için `no-reply@flowick.com` kullanmaya devam edebilir.

### 🚨 TAŞIMADAN ÖNCE OKU: AKER'in mevcut e-postası başka sağlayıcıda

`akerosgb.com.tr` alan adının e-posta hizmeti **Cloudflare'de değil**. 2026-08-04'te
ölçülen canlı DNS kayıtları:

```
MX   10   mail.trmail.com.tr
TXT       "v=spf1 a mx include:relay.mailbaby.net ~all"
```

Yani `info@akerosgb.com.tr` posta kutusu `trmail.com.tr` üzerinde barınıyor.

**Alan adı Cloudflare'e taşınırken bu iki kayıt yeni DNS bölgesine birebir
kopyalanmazsa AKER'in gelen e-postasının tamamı kesilir.** Bu, sitenin çalışmasından
bağımsız ve müşteriye doğrudan zarar veren bir kesintidir; taşıma yapılmadan önce
mevcut bölgedeki tüm kayıtların (MX, TXT/SPF, varsa DKIM ve autodiscover/webmail
A-CNAME kayıtları) dökümü alınmalı, taşıma sonrası birebir doğrulanmalıdır.

Doğrulama komutu (taşımadan önce ve sonra çalıştırılıp çıktılar karşılaştırılmalı):

```bash
nslookup -type=MX  akerosgb.com.tr 1.1.1.1
nslookup -type=TXT akerosgb.com.tr 1.1.1.1
```

**SPF tuzağı:** Bir alan adında yalnızca **tek** `v=spf1` TXT kaydı bulunabilir.
Resend eklenirken mevcut `v=spf1 a mx include:relay.mailbaby.net ~all` kaydının
ÜZERİNE YAZILMAMALI — yazılırsa AKER'in kendi giden postası SPF'ten kalır. Güvenli
yol: Resend doğrulamasını **alt alan adında** yapmak (`send.akerosgb.com.tr`), böylece
kök SPF kaydına hiç dokunulmaz.

### AKER'den cevap gelince yapılacaklar, sırayla

1. Taşımadan önce mevcut DNS bölgesinin tam dökümü alınır (yukarıdaki uyarı).
2. Alan adı taşınır; MX + SPF kayıtlarının aynen geldiği doğrulanır, e-posta
   alımı gerçek bir test mesajıyla sınanır.
3. `akerosgb.com.tr` Resend'e eklenir — tercihen `send.akerosgb.com.tr` alt alan adı.
4. Resend'in ürettiği DKIM ve SPF kayıtları DNS'e girilir (kök SPF'e dokunmadan).
5. Resend'de durum `verified` olana kadar beklenir.
6. `MAIL_FROM` `@akerosgb.com.tr` adresine çevrilir, Pages secret güncellenir,
   yeniden deploy edilir.
7. Gerçek gönderim denemesi yapılır; `info@akerosgb.com.tr` kutusuna düştüğü ve
   spam'e gitmediği doğrulanır.

### Alıcı adresi

**`CONTACT_TO_EMAIL = info@akerosgb.com.tr`** — kullanıcı 2026-08-04'te kesinleştirdi.
İletişim formu, iş başvurusu ve bülten bildirimleri bu adrese düşecek.

Alıcı tarafı için Resend'de **hiçbir kurulum ve anahtar gerekmez**; posta almak
API anahtarı istemez, kutunun var olması yeterlidir. Anahtar yalnızca gönderim için.

Lokal geliştirmede alıcı `developer@flowick.com` olarak kalıyor — AKER'in kutusuna
test mesajı düşmesin diye bilinçli tercih.

Değerler belirlenince:

```
npx wrangler pages secret put CONTACT_TO_EMAIL --project-name aker-website
npx wrangler pages secret put MAIL_FROM --project-name aker-website
npx wrangler pages deploy . --project-name aker-website --branch master
```

Sonrasında gerçek bir gönderim denemesi yapılıp kutuya düştüğü doğrulanmalı.

## AÇIK İŞLER / DIŞ GİRDİ BEKLEYENLER

- **⛔ Nameserver değişimi (EN KRİTİK, AKER'DEN ŞİFRE BEKLENİYOR).** METUnic panelinde
  (`app.metunic.com.tr`) nameserver `hera.ns.cloudflare.com` + `kayden.ns.cloudflare.com`
  yapılacak. Panel AKER adına kayıtlı, şifre bizde yok. Bu yapılmadan site canlıya
  çıkmaz. Posta kayıtları yeni bölgeye önceden girildiği için kesinti beklenmiyor;
  geçişten sonra `info@akerosgb.com.tr` adresine dışarıdan test mesajı atılıp
  doğrulanmalı. Geri dönüş: nameserver'ları eski hâline çevirmek (eski bölge ve Bubble
  uygulaması silinmediği sürece site birkaç saatte geri gelir).
- **Mevzuat rakamlarının doğrulanması (ÖNEMLİ).** Hizmet ve SSS sayfalarındaki süreler
  (görevlendirme dakikaları, risk değerlendirmesi ve eğitim yenileme aralıkları,
  ilkyardımcı oranları, periyodik muayene sıklıkları) 6331 sayılı Kanun ve ilgili
  yönetmeliklere göre yazıldı. Yayına almadan önce AKER'in iş güvenliği uzmanı
  tarafından güncel mevzuata karşı kontrol edilmeli.
- **KVKK metni.** `/kvkk` sayfasındaki metin, sitede zaten var olan firma-firma gizlilik
  sözleşmesidir; web sitesi ziyaretçisi için ayrı bir **aydınlatma metni** değildir.
  Hukukçu incelemesi gerekiyor.
- **Google for Jobs.** `/kariyer` sayfasına `JobPosting` şeması eklenmedi; ilan tarihi
  (`datePosted`) ve geçerlilik süresi (`validThrough`) bilgisi yok. Bu bilgiler alınırsa
  her ilan için ayrı sayfa + şema eklenebilir.
- **Şube koordinatları.** `LocalBusiness` şemasına `geo` eklenmedi (enlem/boylam yok).
  Google Business Profile'dan alınıp `tools/site.ts`'e eklenebilir.
- **Açılış saatleri.** `openingHours` bilgisi yok; şemaya eklenmesi yerel SEO'ya katkı sağlar.
- ~~E-posta bülteni formu sahte~~ — **çözüldü**: abonelikler D1'e yazılıyor, panelde
  "Bülten Aboneleri" bölümü ve CSV dışa aktarım var. Gerçek bir e-posta pazarlama
  servisine bağlanmak istenirse liste CSV olarak alınabilir.
- ~~reCAPTCHA kutusu sahte~~ — **çözüldü**: Google rozeti kaldırıldı, yerine sunucu
  tarafında IP başına hız sınırı kondu (10 dakikada 5 gönderim; iletişim, başvuru
  ve bülten uçlarında). Daha güçlü koruma istenirse Turnstile eklenebilir.
- ~~Müşteri logolarının genel alt metni~~ — **çözüldü**: 9 logonun firma adı
  görsellerden okunup yazıldı.
- ~~Yüklenen görsellerde width/height yok~~ — **çözüldü**: yükleme sırasında görsel
  başlığından boyut okunup dosya adına gömülüyor, sayfa üretilirken niteliğe dönüyor.
- **Cloudflare Access**: panel şifresi artık sunucuda, ancak `/admin` yolunu Access ile
  ikinci bir katmana almak yine de önerilir.

## Doğrulama kaydı (yönetim paneli)

- `npm run e2e` → **36 sınamanın 36'sı geçti**: yetkisiz erişim 401, Origin'siz istek 403,
  yanlış şifre 401, giriş/çıkış, listeleme, ekleme, güncelleme, sıralama, silme,
  görsel yükleme, izinsiz dosya türü reddi, başvuru kaydı, bal küpü filtresi ve
  her değişikliğin genel sayfaya yansıması.
- Tarayıcıda panel sürülerek doğrulandı (headless Chrome, `/admin` üzerinden):
  hatalı şifre reddi, giriş, bölüm geçişi, 11 satırlık tablo, yeni kayıt ekleme,
  düzenleme, silme ve her adımın `/ekibimiz` sayfasına yansıması.
- Önbellek davranışı: yanıt `public, no-cache, must-revalidate` + `ETag`;
  değişmemiş sayfa ikinci istekte **304** dönüyor, kayıttan sonra sürüm artıp
  içerik anında tazeleniyor.

## Doğrulama kaydı (TypeScript geçişi)

- `npm run typecheck` → üç projede de hata yok (strict, `noUncheckedIndexedAccess` açık).
- `npm run build` → bundle'lar derlendi, 22 adresli sitemap üretildi.
- İletişim formu: KVKK + reCAPTCHA onayı olmadan buton kapalı, boş formda istek
  gitmiyor, dolu formda tek istek gidiyor, hata mesajı gösteriliyor.

## Doğrulama kaydı (SEO turu)

- `node tools/seo-check.mjs` → "Sorun bulunamadı" (alt, canonical, lang, h1 sayısı,
  benzersiz title/description, kırık iç bağlantı, JSON-LD geçerliliği).
- 18 adres yerel sunucuda tek tek açıldı; hepsinde tek `h1`, JSON-LD ve benzersiz title.
- Ana sayfa, hizmet detayı ve Gebze sayfası Chrome ile görsel olarak kontrol edildi;
  yerleşim bozulmadı.
