// =========================================================
// AKER OSGB - Site geneli sabitler ve içerik modeli
// =========================================================
// Tüm sayfaların başlık, açıklama, canonical, menü, alt bilgi
// ve yapılandırılmış veri (JSON-LD) üretimi bu dosyadaki
// verilerden yapılır.
//
// Firma bilgileri src/site-bilgi.ts, şubeler src/cms-data.ts
// içindedir: istek anında sayfayı tamamlayan sunucu katmanı da
// onları okur. Şubelerin güncel hali panelden yönetilir; buradaki
// liste veri tabanına ulaşılamadığında görünen yedektir.
// =========================================================

import { DEFAULT_DATA } from '../src/cms-data.ts';
import type { Branch } from '../src/content-types.ts';

export { SITE, type SiteConfig } from '../src/site-bilgi.ts';
export type { Branch } from '../src/content-types.ts';

export interface LinkItem {
  href: string;
  label: string;
}

/** Derleme anındaki şube listesi (yedek); ilk kayıt merkezdir. */
export const BRANCHES: Branch[] = DEFAULT_DATA.branches;

// ---------------------------------------------------------
// Üst menü
// ---------------------------------------------------------
export const NAV: LinkItem[] = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/hizmetlerimiz', label: 'Hizmetlerimiz' },
  { href: '/belgelerimiz', label: 'Belgelerimiz' },
  { href: '/ekibimiz', label: 'Ekibimiz' },
  { href: '/subelerimiz', label: 'Şubelerimiz' },
  { href: '/sss', label: 'S.S.S.' },
  { href: '/iletisim', label: 'İletişim' },
];

// Alt bilgideki hizmet bağlantıları için kısa liste
export const FOOTER_LINKS: LinkItem[] = [
  { href: '/hizmetlerimiz/is-guvenligi-uzmanligi', label: 'İş Güvenliği Uzmanlığı' },
  { href: '/hizmetlerimiz/isyeri-hekimligi', label: 'İşyeri Hekimliği' },
  { href: '/hizmetlerimiz/risk-degerlendirmesi', label: 'Risk Değerlendirmesi' },
  { href: '/hizmetlerimiz/isg-egitimleri', label: 'İSG Eğitimleri' },
  { href: '/hizmetlerimiz/acil-durum-plani', label: 'Acil Durum Planı' },
  { href: '/hizmetlerimiz/ise-giris-saglik-raporu', label: 'İşe Giriş Sağlık Raporu' },
  { href: '/hizmetlerimiz/mobil-saglik-hizmetleri', label: 'Mobil Sağlık Hizmetleri' },
  { href: '/gebze-osgb', label: 'Gebze OSGB' },
  { href: '/dilovasi-osgb', label: 'Dilovası OSGB' },
  { href: '/kocaeli-osgb', label: 'Kocaeli OSGB' },
  { href: '/kariyer', label: 'Kariyer' },
  { href: '/kvkk', label: 'KVKK ve Gizlilik' },
];
