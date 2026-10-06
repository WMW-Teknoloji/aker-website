// =========================================================
// AKER OSGB - Site geneli sabitler ve içerik modeli
// =========================================================
// Tüm sayfaların başlık, açıklama, canonical, menü, alt bilgi
// ve yapılandırılmış veri (JSON-LD) üretimi bu dosyadaki
// verilerden yapılır. Tek kaynak burasıdır.
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

export interface Branch {
  id: string;
  name: string;
  street: string;
  district: string;
  city: string;
  postalCode: string;
  /** Google Haritalar arama adresi. */
  maps: string;
}

export interface LinkItem {
  href: string;
  label: string;
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

// ---------------------------------------------------------
// Şubeler (NAP - isim, adres, telefon tutarlılığı buradan gelir)
// ---------------------------------------------------------
export const BRANCHES: Branch[] = [
  {
    id: 'merkez',
    name: 'AKER OSGB Merkez Şube',
    street: 'Osman Yılmaz Mah. İstanbul Cad. No: 30 Kardem Plaza Kat: 6',
    district: 'Gebze',
    city: 'Kocaeli',
    postalCode: '41400',
    maps: 'https://www.google.com/maps/search/?api=1&query=Osman%20Y%C4%B1lmaz%20Mah.%20%C4%B0stanbul%20Cad.%20No%3A%2030%20Kardem%20Plaza%20Kat%3A%206%20Gebze%2FKocaeli',
  },
  {
    id: 'sultanorhan',
    name: 'AKER OSGB Sultanorhan Şubesi',
    street: 'Sultan Orhan Mah. İlyasbey Cd. No: 30/B',
    district: 'Gebze',
    city: 'Kocaeli',
    postalCode: '41400',
    maps: 'https://www.google.com/maps/search/?api=1&query=Sultan%20Orhan%2C%20%C4%B0lyasbey%20Cd.%2030%2FB%2C%2041400%20Gebze%2FKocaeli',
  },
  {
    id: 'guzeller',
    name: 'AKER OSGB Güzeller OSB Şubesi',
    street: 'Aşık Veysel Sk. No: 1/1 Güzeller OSB Yönetim Binası',
    district: 'Gebze',
    city: 'Kocaeli',
    postalCode: '41400',
    maps: 'https://www.google.com/maps/search/?api=1&query=A%C5%9F%C4%B1k%20Veysel%20Sk.%20No%3A%201%2F1%20G%C3%BCzeller%20OSB%20Y%C3%B6netim%20Binas%C4%B1%20Gebze%2FKocaeli',
  },
  {
    id: 'mermerciler',
    name: 'AKER OSGB Mermerciler Şubesi',
    street: 'Köseler Mah. 3. Cadde No: 19/C',
    district: 'Dilovası',
    city: 'Kocaeli',
    postalCode: '41455',
    maps: 'https://www.google.com/maps/search/?api=1&query=K%C3%B6seler%20Mah.%203.%20Cadde%20No%3A%2019%2FC%20Dilovas%C4%B1%2FKocaeli',
  },
  {
    id: 'tosb',
    name: 'AKER OSGB TOSB Şubesi',
    street: 'TOSB Otomotiv Mah. 1. Cd. No: 10/1-B',
    district: 'Çayırova',
    city: 'Kocaeli',
    postalCode: '41420',
    maps: 'https://www.google.com/maps/search/?api=1&query=TOSB%20Otomotiv%20Mah.%201.%20Cd.%20No%3A%2010%2F1-B%20%C3%87ay%C4%B1rova%2FKocaeli',
  },
];

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
