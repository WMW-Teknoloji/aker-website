-- =========================================================
-- AKER OSGB - İçerik veri tabanı şeması (Cloudflare D1)
-- =========================================================
-- Kurulum:
--   Lokal:  npm run db:setup
--   Canlı:  npm run db:setup:remote
--
-- Tüm içerik koleksiyonları aynı desende: metin kimlik, sıra
-- numarası ve koleksiyona özgü alanlar. `sira` sütunu panelden
-- yapılan yukarı/aşağı taşımayı saklar.
-- =========================================================

CREATE TABLE IF NOT EXISTS slides (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  image        TEXT NOT NULL,
  alt          TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  image        TEXT NOT NULL,
  alt          TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS careers (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  text         TEXT NOT NULL DEFAULT '',
  cardImage    TEXT NOT NULL DEFAULT '',
  image        TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  image        TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  text         TEXT NOT NULL DEFAULT '',
  image        TEXT NOT NULL DEFAULT '',
  link         TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT '',
  photo        TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Şubeler. Listedeki ilk şube merkezdir (firma şemasının adresi).
-- `maps` boşsa harita bağlantısı adresten üretilir.
CREATE TABLE IF NOT EXISTS branches (
  id           TEXT PRIMARY KEY,
  sira         INTEGER NOT NULL DEFAULT 0,
  name         TEXT NOT NULL,
  street       TEXT NOT NULL,
  district     TEXT NOT NULL,
  city         TEXT NOT NULL,
  postalCode   TEXT NOT NULL DEFAULT '',
  maps         TEXT NOT NULL DEFAULT '',
  guncellendi  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- İş başvuruları. Özgeçmiş dosyası R2'de saklanır, burada yalnızca
-- anahtarı tutulur.
CREATE TABLE IF NOT EXISTS applications (
  id           TEXT PRIMARY KEY,
  olusturuldu  TEXT NOT NULL DEFAULT (datetime('now')),
  careerId     TEXT NOT NULL DEFAULT '',
  careerTitle  TEXT NOT NULL DEFAULT '',
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  cvFileName   TEXT NOT NULL DEFAULT '',
  cvFileType   TEXT NOT NULL DEFAULT '',
  cvKey        TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_applications_tarih ON applications (olusturuldu DESC);

-- İletişim formu mesajları. E-posta gönderimi yapılandırılmamış olsa bile
-- mesaj burada saklanır; hiçbir talep kaybolmaz.
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  olusturuldu  TEXT NOT NULL DEFAULT (datetime('now')),
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  -- E-posta gonderildi mi? 0: gonderilemedi/yapilandirilmadi, 1: gonderildi
  mail_gitti   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_messages_tarih ON messages (olusturuldu DESC);

-- E-posta bülteni aboneleri.
CREATE TABLE IF NOT EXISTS subscribers (
  email        TEXT PRIMARY KEY,
  olusturuldu  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Form gönderimlerinin IP başına hız sınırı. Pencere başlangıcı ve
-- sayaç tutulur; reCAPTCHA yerine gerçek bot koruması budur.
CREATE TABLE IF NOT EXISTS form_limits (
  anahtar      TEXT PRIMARY KEY,
  sayac        INTEGER NOT NULL DEFAULT 0,
  pencere      INTEGER NOT NULL DEFAULT 0
);

-- Başarısız giriş denemeleri (kaba kuvvet sınırlaması).
CREATE TABLE IF NOT EXISTS login_attempts (
  ip           TEXT PRIMARY KEY,
  deneme       INTEGER NOT NULL DEFAULT 0,
  son_deneme   INTEGER NOT NULL DEFAULT 0
);

-- İçerik sürümü. Her yazma işleminde artar; genel sayfaların
-- önbellek anahtarı bu değeri kullanır, böylece kayıt sonrası
-- eski sayfa servis edilmez.
CREATE TABLE IF NOT EXISTS meta (
  anahtar  TEXT PRIMARY KEY,
  deger    TEXT NOT NULL
);

INSERT OR IGNORE INTO meta (anahtar, deger) VALUES ('surum', '1');
