// =========================================================
// AKER OSGB - Firma bilgileri
// =========================================================
// Telefon, e-posta, unvan ve sosyal hesaplar. Hem sayfa üreticisi
// (tools/build.ts) hem de istek anında şube bilgisini basan
// sunucu katmanı (functions/_middleware.ts) buradan okur.
// =========================================================

export interface SiteConfig {
  origin: string;
  name: string;
  legalName: string;
  fullName: string;
  founded: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  locale: string;
  lang: string;
  social: [string, string, string];
  ogImage: string;
  ogImageSize: { width: number; height: number };
}

export const SITE: SiteConfig = {
  origin: 'https://akerosgb.com.tr',
  name: 'AKER OSGB',
  legalName: 'AKER Ortak Sağlık Güvenlik Birimi Dnş. Özel Sağlık Hiz. Tic. Ltd. Şti.',
  fullName: 'AKER Ortak Sağlık ve Güvenlik Birimi',
  founded: '2012',
  phone: '444 3 375',
  phoneHref: 'tel:+904443375',
  whatsapp: '905075010261',
  email: 'info@akerosgb.com.tr',
  locale: 'tr_TR',
  lang: 'tr',
  social: [
    'https://www.facebook.com/AkerOSGBHolding/',
    'https://www.instagram.com/akerholding/',
    'https://www.linkedin.com/company/aker-osgb/',
  ],
  ogImage: 'img/og-gorsel-kaynak.webp',
  ogImageSize: { width: 1200, height: 720 },
};
