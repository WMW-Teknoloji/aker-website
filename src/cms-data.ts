// =========================================================
// AKER OSGB - Varsayılan içerik (CMS)
// =========================================================
// Sitede görünen haber, ilan, ekip, belge, referans ve slider
// içeriğinin tek kaynağı. Hem tarayıcı kodu (src/data.ts) hem de
// sayfa üreticisi (tools/build.ts) buradan okur.
//
// İçerik değiştirildikten sonra `npm run build` çalıştırılmalıdır;
// aksi hâlde üretilen HTML güncellenmez.
// =========================================================

import type { CmsData } from './content-types.ts';

export const DEFAULT_DATA: CmsData = {
  clients: [
    { id: 'client-1', image: '/img/client-1.webp', alt: 'Weber logosu' },
    { id: 'client-2', image: '/img/client-2.webp', alt: 'Voestalpine logosu' },
    { id: 'client-3', image: '/img/client-3.webp', alt: 'Vivotech logosu' },
    { id: 'client-4', image: '/img/client-4.webp', alt: 'TOSB logosu' },
    { id: 'client-5', image: '/img/client-5.webp', alt: 'TemkaCam logosu' },
    { id: 'client-6', image: '/img/client-6.webp', alt: 'Tayaş logosu' },
    { id: 'client-7', image: '/img/client-7.webp', alt: 'Sönmez trafo logosu' },
    { id: 'client-8', image: '/img/client-8.webp', alt: 'Smart Güneş Teknolojileri logosu' },
    { id: 'client-9', image: '/img/client-9.webp', alt: 'Rafex logosu' },
    { id: 'client-10', image: '/img/client-10.svg', alt: 'Pulver logosu' },
    { id: 'client-11', image: '/img/client-11.webp', alt: 'Plastay logosu' },
    { id: 'client-12', image: '/img/client-12.webp', alt: 'Pimtaş logosu' },
    { id: 'client-13', image: '/img/client-13.webp', alt: 'Pimsa automotive logosu' },
    { id: 'client-14', image: '/img/client-14.webp', alt: 'Özmer pastacılık logosu' },
    { id: 'client-15', image: '/img/client-15.webp', alt: 'Opsan logosu' },
    { id: 'client-16', image: '/img/client-16.webp', alt: 'Odeabank logosu' },
    { id: 'client-17', image: '/img/client-17.webp', alt: 'Numarine logosu' },
    { id: 'client-18', image: '/img/client-18.webp', alt: 'Namet logosu' },
    { id: 'client-19', image: '/img/client-19.webp', alt: 'Lineadecor logosu' },
    { id: 'client-20', image: '/img/client-20.webp', alt: 'Kubota logosu' },
    { id: 'client-21', image: '/img/client-21.webp', alt: 'Körfez Döküm logosu' },
    { id: 'client-22', image: '/img/client-22.webp', alt: 'Kocaeli Kobi OSGB logosu' },
    { id: 'client-23', image: '/img/client-23.webp', alt: 'Kocaeli Büyükşehir Belediyesi logosu' },
    { id: 'client-24', image: '/img/client-24.webp', alt: 'Kiğılı logosu' },
    { id: 'client-25', image: '/img/client-25.webp', alt: 'Kc kimya logosu' },
    { id: 'client-26', image: '/img/client-26.webp', alt: 'Kar porselen logosu' },
    { id: 'client-27', image: '/img/client-27.webp', alt: 'Karakaya logosu' },
    { id: 'client-28', image: '/img/client-28.webp', alt: 'Kanca logosu' },
    { id: 'client-29', image: '/img/client-29.webp', alt: 'İnci makina logosu' },
    { id: 'client-30', image: '/img/client-30.webp', alt: 'Hp pelzer pimsa logosu' },
    { id: 'client-31', image: '/img/client-31.svg', alt: 'Hepsiburada logosu' },
    { id: 'client-32', image: '/img/client-32.webp', alt: 'Hasçelik logosu' },
    { id: 'client-33', image: '/img/client-33.webp', alt: 'Golf logosu' },
    { id: 'client-34', image: '/img/client-34.webp', alt: 'Gebze Güzeller OSGB logosu' },
    { id: 'client-35', image: '/img/client-35.webp', alt: 'Gebze belediyesi logosu' },
    { id: 'client-36', image: '/img/client-36.webp', alt: 'Fzk Mühendislik logosu' },
    { id: 'client-37', image: '/img/client-37.webp', alt: 'Fuga logosu' },
    { id: 'client-38', image: '/img/client-38.webp', alt: 'Flormar logosu' },
    { id: 'client-39', image: '/img/client-39.webp', alt: 'Eurotray1 logosu' },
    { id: 'client-40', image: '/img/client-40.webp', alt: 'Egesim logosu' },
    { id: 'client-41', image: '/img/client-41.webp', alt: 'Egger logosu' },
    { id: 'client-42', image: '/img/client-42.webp', alt: 'Darıca belediyesi logosu' },
    { id: 'client-43', image: '/img/client-43.webp', alt: 'Dadaş metal logosu' },
    { id: 'client-44', image: '/img/client-44.webp', alt: 'Corning logosu' },
    { id: 'client-45', image: '/img/client-45.webp', alt: 'Cfn kimya logosu' },
    { id: 'client-46', image: '/img/client-46.webp', alt: 'Çelikel logosu' },
    { id: 'client-47', image: '/img/client-47.webp', alt: 'Beyçelik logosu' },
    { id: 'client-48', image: '/img/client-48.webp', alt: 'Bericap logosu' },
    { id: 'client-49', image: '/img/client-49.webp', alt: 'Başiskele belediyesi logosu' },
    { id: 'client-50', image: '/img/client-50.webp', alt: 'Avansas logosu' },
    { id: 'client-51', image: '/img/client-51.webp', alt: 'Atabay Kimya Sanayi ve Ticaret A.Ş. logosu' },
    { id: 'client-52', image: '/img/client-52.webp', alt: 'Arvato logosu' },
    { id: 'client-53', image: '/img/client-53.webp', alt: 'Anadolu Motor logosu' },
    { id: 'client-54', image: '/img/client-54.webp', alt: 'alba kalıp logosu' }
  ],

  slides: [
    { id: 'slide-1', image: '/img/slide-1.webp' },
    { id: 'slide-2', image: '/img/slide-2.webp' },
    { id: 'slide-3', image: '/img/slide-3.webp' }
  ],

  careers: [
    {
      id: 'career-1',
      title: 'Bizimle Çalışmak İster misiniz?',
      text: 'Gebze-Darıca-Çayırova bölgelerinde ikamet eden, Haftada 5 gün çalışacak Gezici C Sınıfı Uzman arayışımız vardır.',
      cardImage: '/img/career-1-kart.webp',
      image: '/img/career-1.webp'
    },
    {
      id: 'career-2',
      title: 'Bizimle Çalışmak İster misiniz?',
      text: 'Engelli bireylerin iş gücüne katılımını destekliyoruz! Ekibimize katılacak, çalışabilecek durumda engelli raporu olan çalışma arkadaşı arıyoruz. Her bireyin potansiyeline değer veriyor ve fırsat eşitliğini önemsiyoruz. Eğer bu kriterlere uygun olduğunuzu...',
      cardImage: '/img/career-2-kart.webp',
      image: '/img/career-2.webp'
    },
    {
      id: 'career-3',
      title: 'Bizimle Çalışmak İster misiniz?',
      text: 'Kocaeli, Gebze Bölgesi\'nde bulunan bir firmada tercihen bayan, araç kullanabilecek, sahada çalışabilecek HEMŞİRE arayışımız bulunmaktadır.',
      cardImage: '/img/career-3-kart.webp',
      image: '/img/career-3.webp'
    }
  ],

  documents: [
    {
      id: 'doc-1',
      title: 'Kalite Yönetim Sistemi',
      image: '/img/doc-1.webp'
    },
    {
      id: 'doc-2',
      title: 'İş Sağlığı ve Güvenliği Yönetim Sistemi',
      image: '/img/doc-2.webp'
    },
    {
      id: 'doc-3',
      title: 'Çevre Yönetim Sistemi',
      image: '/img/doc-3.webp'
    },
    {
      id: 'doc-4',
      title: 'Müşteri Memnuniyeti Yönetim Sistemi',
      image: '/img/doc-4.webp'
    },
    {
      id: 'doc-5',
      title: 'Çevre Yönetim Sistemi',
      image: '/img/doc-5.webp'
    },
    {
      id: 'doc-6',
      title: 'Çevre Yönetim Sistemi',
      image: '/img/doc-6.webp'
    },
    {
      id: 'doc-7',
      title: 'Kalite Yönetim Sistemi',
      image: '/img/doc-7.webp'
    },
    {
      id: 'doc-8',
      title: 'Müşteri Memnuniyeti Yönetim Sistemi',
      image: '/img/doc-8.webp'
    },
    {
      id: 'doc-9',
      title: 'İş Sağlığı ve Güvenliği Yönetim Sistemi',
      image: '/img/doc-9.webp'
    },
    {
      id: 'doc-10',
      title: 'Çevre Yönetim Sistemi',
      image: '/img/doc-10.webp'
    },
    {
      id: 'doc-11',
      title: 'İş Sağlığı ve Güvenliği Yönetim Sistemi',
      image: '/img/doc-11.webp'
    },
    {
      id: 'doc-12',
      title: 'Kalite Yönetim Sistemi',
      image: '/img/doc-12.webp'
    },
    {
      id: 'doc-13',
      title: 'Müşteri Memnuniyeti Yönetim Sistemi',
      image: '/img/doc-13.webp'
    }
  ],

  news: [
    {
      id: 'news-1',
      title: 'Bilkent de \'Aker\' dedi!',
      text: 'Türkiye\'deki önemli projelerden adından başarıyla söz ettiren Gebze menşeli Aker OSGB, sınırları aşmaya devam ediyor.',
      image: '/img/news-1.webp',
      link: 'https://www.hedefgazetesi.com.tr/bilkent-de-aker-dedi-102310-haberi'
    },
    {
      id: 'news-2',
      title: 'AKER OSGB, Bilkent Üniversitesi\'nde PCR testi yaptı!',
      text: 'Bölgemizin gururu olan ve Türkiye\'de önemli projeler imza atan Aker OSGB, bu sefer Ankara\'da bulunan Bilkent Üniversitesi\'ndeydi.',
      image: '/img/news-2.webp',
      link: 'https://www.daricagazetesi.com.tr/aker-osgb-bilkent-universitesi-nde-pcr-testi-yapti/24396/'
    },
    {
      id: 'news-3',
      title: 'Aker OSGB günde 5 bin korona testi yapıyor',
      text: 'Ortak Sağlık ve Güvenlik Birimi (OSGB) firması Aker OSGB, uluslararası alanda önemli bir başarıya imza atarak Gebze\'de günlük 5 bin Covid-19...',
      image: '/img/news-3.webp',
      link: 'https://www.daricagazetesi.com.tr/aker-osgb-gunde-5-bin-korona-testi-yapiyor/16812/'
    },
    {
      id: 'news-4',
      title: 'Aker OSGB, büyük etkinliklerde boy gösteriyor',
      text: "Bölgemizin gurur veren firmalarından AKER OSGB, İstanbul Lütfi Kırdar Uluslararası Kongre ve Sergi Sarayı'nda düzenlenen etkinliklerde Covid-19 PCR taraması yapmaya başladı.",
      image: '/img/news-4.webp',
      link: 'https://www.daricagazetesi.com.tr/aker-osgb-buyuk-etkinliklerde-boy-gosteriyor/23988/'
    }
  ],

  team: [
    {
      id: 'team-1',
      name: 'EBUBEKİR KAPLAN',
      role: 'İSG KATİP MESUL MÜDÜR',
      photo: '/img/team-1.webp'
    },
    {
      id: 'team-2',
      name: 'EMRE GÜLTEKİN',
      role: 'FİNANS UZMANI',
      photo: '/img/team-2.webp'
    },
    {
      id: 'team-3',
      name: 'Süleyman Atalay',
      role: 'Satın Alma ve İdari İşler Müdürü',
      photo: '/img/team-3.webp'
    },
    {
      id: 'team-4',
      name: 'TAMER ÇEKECEKER',
      role: 'GENEL MÜDÜR',
      photo: '/img/team-4.webp'
    },
    {
      id: 'team-5',
      name: 'ERTUĞRUL IŞIK',
      role: 'YÖNETİM KURUL BAŞKANI',
      photo: '/img/team-5.webp'
    },
    {
      id: 'team-6',
      name: 'ESRA KURT',
      role: 'SÜREÇ YÖNETİM UZMANI',
      photo: '/img/team-6.webp'
    },
    {
      id: 'team-7',
      name: 'DİLAN ŞEN',
      role: 'YÖNETİCİ ASİSTAN',
      photo: '/img/team-7.webp'
    },
    {
      id: 'team-8',
      name: 'NURCAN ÖKTEM',
      role: 'İNSAN KAYNAKLAR SORUMLUSU',
      photo: '/img/team-8.webp'
    },
    {
      id: 'team-9',
      name: 'AHMET HAKAN YEŞİL',
      role: 'SATIŞ PAZARLAMA MÜDÜRÜ',
      photo: '/img/team-9.webp'
    },
    {
      id: 'team-10',
      name: 'ÖMER DEMİRCAN',
      role: 'BİLGİ İŞLEM SORUMLUSU',
      photo: '/img/team-10.webp'
    },
    {
      id: 'team-11',
      name: 'SERAP KAYA',
      role: 'MUHASEBE SORUMLUSU',
      photo: '/img/team-11.webp'
    }
  ],

  // Şubeler: sitenin alt kısmı, şube kartları ve firma bilgisi (JSON-LD).
  // İlk kayıt merkezdir.
  branches: [
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
  ],
};
