// =========================================================
// Hizmet dışındaki içerik sayfaları
// =========================================================
// Her kayıt tek bir HTML sayfası üretir. `blocks` dizisi
// sayfanın gövdesini oluşturur: h2 + paragraf + liste.
// =========================================================

import type { FaqEntry } from './hizmetler.ts';
import type { LinkItem } from '../site.ts';

/** Bir içerik sayfasındaki tek bir bölüm. */
export interface ContentBlock {
  h2: string;
  p?: string[];
  list?: string[];
  links?: LinkItem[];
  /** Gösterilecek şubelerin kimlikleri. */
  branches?: string[];
  /** true ise hizmet kartları listesi basılır. */
  services?: boolean;
  /** true ise telefon/e-posta/WhatsApp listesi basılır. */
  contact?: boolean;
  /** true ise iletişim formu basılır. */
  form?: boolean;
  /** true ise açık pozisyonlar listesi basılır. */
  careers?: boolean;
}

export interface ContentPage {
  /** URL parçası ve dosya adı. */
  slug: string;
  h1: string;
  title: string;
  description: string;
  lead: string;
  blocks?: ContentBlock[];
  /** true ise sayfa FAQPage şemasıyla işaretlenir. */
  faqPage?: boolean;
  faq?: FaqEntry[];
}

export const PAGES: ContentPage[] = [
  // -------------------------------------------------------
  {
    slug: 'hakkimizda',
    h1: 'AKER OSGB Hakkında',
    title: 'Hakkımızda | AKER OSGB Gebze Kocaeli',
    description:
      '2012’den bu yana Gebze, Dilovası ve Kocaeli genelinde ortak sağlık ve güvenlik birimi hizmeti veren AKER OSGB’nin kuruluşu, ekibi ve çalışma yaklaşımı.',
    lead:
      'AKER OSGB, işyerlerinin iş sağlığı ve güvenliği yükümlülüklerini yerine getirmesi için 2012 yılında Gebze’de kuruldu. Bugün beş şubeyle Kocaeli sanayisine hizmet veriyoruz.',
    blocks: [
      {
        h2: 'Kuruluş amacımız',
        p: [
          'AKER OSGB, sağlık kurumu olmamasına rağmen sağlık personeli çalıştırma zorunluluğu bulunan işletmelerin bu ihtiyacını tek noktadan karşılamak için kuruldu. Tecrübeli, genç ve dinamik kadrosuyla 2012 yılında hizmet vermeye başladı.',
          'Ortak Sağlık ve Güvenlik Birimi hizmetleri, işyeri sağlık birimlerine personel tahsisi, afet yönetimi ve işyeri risk analizleri kapsamında kurumlar için çözüm ortağı olmayı hedefliyoruz.',
        ],
      },
      {
        h2: 'Çalışma yaklaşımımız',
        p: [
          'İş sağlığı ve güvenliği, dosya doldurma işi değildir. Yaklaşımımız üç ilkeye dayanır: tespitin sahada yapılması, alınan kararın takip edilmesi ve her adımın kayda geçirilmesi.',
        ],
        list: [
          'Planlı saha ziyareti ve yazılı tespit raporu',
          'Aksiyonların sorumlu ve terminle takibi, kapanış kontrolü',
          'Yasal sürelerin (eğitim, muayene, tatbikat, doküman yenileme) proaktif hatırlatılması',
          'Uzman veya hekim değişiminde hizmetin kesintisiz devamı',
          'Denetim öncesi belge kontrolü ve eksik listesi',
        ],
      },
      {
        h2: 'Belgelerimiz ve yetkilerimiz',
        p: [
          'Şubelerimiz kalite, iş sağlığı ve güvenliği, çevre ve müşteri memnuniyeti yönetim sistemi belgelerine sahiptir. Belgelerin tamamını Belgelerimiz sayfasında görebilirsiniz.',
        ],
        links: [
          { href: '/belgelerimiz', label: 'Belgelerimizi inceleyin' },
          { href: '/ekibimiz', label: 'Ekibimizle tanışın' },
        ],
      },
      {
        h2: 'Hizmet verdiğimiz bölgeler',
        p: [
          'Merkezimiz Gebze’dedir. Gebze, Dilovası, Çayırova, Darıca ve Kocaeli genelindeki organize sanayi bölgelerinde saha hizmeti veriyoruz.',
        ],
        links: [
          { href: '/gebze-osgb', label: 'Gebze OSGB hizmetlerimiz' },
          { href: '/dilovasi-osgb', label: 'Dilovası OSGB hizmetlerimiz' },
          { href: '/kocaeli-osgb', label: 'Kocaeli OSGB hizmetlerimiz' },
        ],
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'gebze-osgb',
    h1: 'Gebze OSGB Hizmetleri',
    title: 'Gebze OSGB | İş Güvenliği Uzmanı ve İşyeri Hekimi | AKER OSGB',
    description:
      'Gebze’de OSGB hizmeti: iş güvenliği uzmanı, işyeri hekimi, risk değerlendirmesi, İSG eğitimi. GOSB, Güzeller OSB ve çevresinde üç şubeyle saha hizmeti.',
    lead:
      'AKER OSGB’nin merkezi Gebze’dedir. Merkez şubemiz, Sultanorhan şubemiz ve Güzeller OSB içindeki şubemizle Gebze’deki işletmelere yerinde İSG hizmeti veriyoruz.',
    blocks: [
      {
        h2: 'Gebze’de neden yerinde OSGB önemli?',
        p: [
          'Gebze, Kocaeli’nin en yoğun sanayi ilçelerinden biridir; otomotiv yan sanayi, kimya, metal işleme, plastik ve lojistik tesisleri yoğun şekilde bulunur. Bu işletmelerin büyük kısmı tehlikeli veya çok tehlikeli sınıfta yer alır ve yüksek görevlendirme süresi gerektirir.',
          'Uzun mesafeden gelen bir uzman, iş kazası veya denetim gibi acil durumlarda sahaya geç ulaşır. Gebze içinde üç şubemizin bulunması, planlı ziyaretlerin aksamamasını ve acil çağrılara aynı gün dönülmesini sağlar.',
        ],
      },
      {
        h2: 'Gebze’deki şubelerimiz',
        branches: ['merkez', 'sultanorhan', 'guzeller'],
      },
      {
        h2: 'Gebze’de sunduğumuz hizmetler',
        services: true,
      },
      {
        h2: 'Hangi bölgelere gidiyoruz?',
        p: [
          'Gebze Organize Sanayi Bölgesi (GOSB), Güzeller Organize Sanayi Bölgesi, Gebze merkez, Sultanorhan, Osman Yılmaz, Tatlıkuyu ve Balçık çevresindeki işletmelere saha hizmeti veriyoruz. Çayırova’daki işletmelere TOSB şubemizden, Darıca’dakilere Gebze şubelerimizden hizmet veriyoruz.',
        ],
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'dilovasi-osgb',
    h1: 'Dilovası OSGB Hizmetleri',
    title: 'Dilovası OSGB | İş Güvenliği ve İşyeri Hekimliği | AKER OSGB',
    description:
      'Dilovası’nda OSGB hizmeti: iş güvenliği uzmanı, işyeri hekimi, risk değerlendirmesi ve İSG eğitimleri. Köseler’deki Mermerciler şubemizle yerinde hizmet.',
    lead:
      'Dilovası, ağır sanayi yoğunluğu nedeniyle çok tehlikeli sınıftaki işyerlerinin yoğun olduğu bir bölgedir. Mermerciler şubemiz Köseler Mahallesi’nde, sanayi tesislerinin içindedir.',
    blocks: [
      {
        h2: 'Dilovası’nda İSG neden daha kritik?',
        p: [
          'Dilovası’nda metal, kimya, boya, döküm ve mermer işleme tesisleri yoğundur. Bu sektörler çoğunlukla çok tehlikeli sınıfta yer alır; bu da çalışan başına ayda en az 40 dakika iş güvenliği uzmanı, 15 dakika işyeri hekimi görevlendirmesi anlamına gelir.',
          'Çok tehlikeli sınıftaki işyerlerinde risk değerlendirmesi en geç 2 yılda bir yenilenir, temel İSG eğitimi yılda bir tekrarlanır ve 10’dan fazla çalışan varsa diğer sağlık personeli görevlendirmesi zorunludur. Takvimi kaçırmamak için hatırlatmayı biz yaparız.',
        ],
      },
      {
        h2: 'Dilovası şubemiz',
        branches: ['mermerciler'],
      },
      {
        h2: 'Dilovası’nda sunduğumuz hizmetler',
        services: true,
      },
      {
        h2: 'Maruziyet ölçümü gerektiren işler',
        p: [
          'Toz, gürültü, kimyasal buhar ve titreşim maruziyeti bulunan tesislerde periyodik muayeneler tetkiklerle desteklenir. Mobil sağlık aracımızla akciğer grafisi, solunum fonksiyon testi ve odyometriyi işyerinizde yapabiliriz.',
        ],
        links: [{ href: '/hizmetlerimiz/mobil-saglik-hizmetleri', label: 'Mobil sağlık hizmetlerimiz' }],
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'kocaeli-osgb',
    h1: 'Kocaeli OSGB Hizmetleri',
    title: 'Kocaeli OSGB | Ortak Sağlık ve Güvenlik Birimi | AKER OSGB',
    description:
      'Kocaeli genelinde OSGB hizmeti. İş güvenliği uzmanı, işyeri hekimi, risk değerlendirmesi, acil durum planı ve İSG eğitimleri. 2012’den beri hizmetteyiz.',
    lead:
      'Kocaeli, Türkiye’nin en yoğun sanayi illerinden biridir. AKER OSGB, 2012’den bu yana ildeki işletmelerin iş sağlığı ve güvenliği yükümlülüklerini yürütüyor.',
    blocks: [
      {
        h2: 'Kocaeli’de işverenin temel yükümlülükleri',
        p: [
          'İşyerinin bulunduğu il fark etmeksizin 6331 sayılı Kanun’un getirdiği yükümlülükler aynıdır. Aşağıdaki başlıklar, denetimlerde en sık sorulan belgelerdir.',
        ],
        list: [
          'Tehlike sınıfına uygun iş güvenliği uzmanı ve işyeri hekimi görevlendirmesi (İSG-KATİP sözleşmesi)',
          'Güncel risk değerlendirmesi ve uygulanmış aksiyon kayıtları',
          'Acil durum planı, ekip listeleri ve yıllık tatbikat raporu',
          'Çalışan İSG eğitim kayıtları ve katılım tutanakları',
          'İşe giriş ve periyodik sağlık raporları',
          'Onaylı defter kayıtları ve İSG kurulu tutanakları (kurul gereken işyerlerinde)',
        ],
      },
      {
        h2: 'Hizmet verdiğimiz ilçeler',
        p: [
          'Merkezimiz Gebze’de, beş şubemiz Gebze, Dilovası ve Çayırova’dadır. Bu konumdan Darıca, Körfez, Derince ve Kocaeli merkeze uzanan hatta saha hizmeti veriyoruz.',
        ],
        links: [
          { href: '/gebze-osgb', label: 'Gebze OSGB' },
          { href: '/dilovasi-osgb', label: 'Dilovası OSGB' },
          { href: '/subelerimiz', label: 'Tüm şubelerimiz' },
        ],
      },
      {
        h2: 'Hizmetlerimiz',
        services: true,
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'subelerimiz',
    h1: 'Şubelerimiz',
    title: 'Şubelerimiz | Gebze, Dilovası ve Çayırova | AKER OSGB',
    description:
      'AKER OSGB şube adresleri ve iletişim bilgileri. Gebze merkez, Sultanorhan, Güzeller OSB, Dilovası Mermerciler ve Çayırova TOSB şubeleri.',
    lead:
      'Gebze’de üç, Dilovası ve Çayırova’da birer olmak üzere beş şubemiz bulunuyor. Tüm şubelerimize aynı telefon numarasından ulaşabilirsiniz: 444 3 375.',
    blocks: [
      {
        h2: 'Şube adreslerimiz',
        branches: ['merkez', 'sultanorhan', 'guzeller', 'mermerciler', 'tosb'],
      },
      {
        h2: 'Hangi şubeye başvurmalıyım?',
        p: [
          'Sözleşme ve teklif süreçleri merkez şubemizden yürütülür. Saha ziyaretleri, işyerinizin konumuna en yakın şubemizden planlanır. Hangi şubeye yazdığınızın bir önemi yoktur; talebiniz merkezden ilgili ekibe yönlendirilir.',
        ],
        links: [{ href: '/iletisim', label: 'İletişim formu ve bilgileri' }],
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'iletisim',
    h1: 'İletişim',
    title: 'İletişim | AKER OSGB Gebze Kocaeli',
    description:
      'AKER OSGB iletişim bilgileri: 444 3 375, info@akerosgb.com.tr. Gebze, Dilovası ve Çayırova şube adresleri, teklif ve bilgi talebi formu.',
    lead:
      'Teklif, bilgi ve saha ziyareti talepleriniz için bize ulaşın. Telefonla, WhatsApp’tan veya formu doldurarak yazabilirsiniz.',
    blocks: [
      {
        h2: 'Doğrudan iletişim',
        contact: true,
      },
      {
        h2: 'Şube adreslerimiz',
        branches: ['merkez', 'sultanorhan', 'guzeller', 'mermerciler', 'tosb'],
      },
      {
        h2: 'Teklif isterken hangi bilgiler gerekir?',
        p: [
          'Size doğru fiyat verebilmemiz için üç bilgi yeterlidir: işyerinizin NACE kodu (veya faaliyet konusu), toplam çalışan sayısı ve işyerinin adresi. Tehlike sınıfı ve görevlendirme süresi bu üç bilgiden hesaplanır.',
        ],
      },
      {
        h2: 'Bize yazın',
        form: true,
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'sss',
    h1: 'Sık Sorulan Sorular',
    title: 'OSGB Hakkında Sık Sorulan Sorular | AKER OSGB',
    description:
      'OSGB, iş güvenliği uzmanı, işyeri hekimi, risk değerlendirmesi ve İSG eğitimi hakkında en sık sorulan soruların yanıtları. AKER OSGB.',
    lead:
      'İş sağlığı ve güvenliği yükümlülükleri hakkında en sık aldığımız soruları burada topladık. Aradığınız yanıt yoksa 444 3 375’ten sorabilirsiniz.',
    faqPage: true,
    faq: [
      {
        q: 'OSGB nedir?',
        a: 'OSGB (Ortak Sağlık ve Güvenlik Birimi), Çalışma ve Sosyal Güvenlik Bakanlığı tarafından yetkilendirilmiş; işyerlerine iş güvenliği uzmanı, işyeri hekimi ve diğer sağlık personeli hizmeti veren kuruluştur.',
      },
      {
        q: 'Hangi işyerleri OSGB ile çalışmak zorunda?',
        a: '6331 sayılı Kanun kapsamındaki bütün işyerleri, çalışan sayısına bakılmaksızın iş güvenliği uzmanı ve işyeri hekimi görevlendirmekle yükümlüdür. Bu personeli bünyesinde bulundurmayan işverenler hizmeti OSGB’den alır.',
      },
      {
        q: 'İşyerimin tehlike sınıfını nasıl öğrenirim?',
        a: 'Tehlike sınıfı, işyerinin SGK’ya bildirilen NACE koduna göre belirlenir ve az tehlikeli, tehlikeli veya çok tehlikeli olabilir. NACE kodunuzu ilettiğinizde sınıfınızı ve buna bağlı asgari görevlendirme sürelerini birlikte hesaplarız.',
      },
      {
        q: 'OSGB hizmet bedeli neye göre belirlenir?',
        a: 'Bedel; çalışan sayısı, tehlike sınıfı ve buna bağlı asgari görevlendirme süresi üzerinden hesaplanır. Çalışan sayısı arttıkça uzman ve hekimin işyerinde bulunması gereken süre de artar.',
      },
      {
        q: 'İSG-KATİP sözleşmesi nedir?',
        a: 'İSG-KATİP, görevlendirmelerin resmî olarak tanımlandığı Bakanlık sistemidir. İşveren ile OSGB arasındaki sözleşme bu sistem üzerinden tanımlanır ve uzman/hekim tarafından onaylanır. Onaysız görevlendirme yasal olarak geçerli sayılmaz.',
      },
      {
        q: 'Risk değerlendirmesi ne zaman yenilenir?',
        a: 'En geç; az tehlikeli sınıfta 6 yılda bir, tehlikeli sınıfta 4 yılda bir, çok tehlikeli sınıfta 2 yılda bir. Ayrıca iş kazası, meslek hastalığı, taşınma, üretim yöntemi değişikliği veya yeni makine alımı durumunda süre beklenmeden yenilenir.',
      },
      {
        q: 'Çalışanlara kaç saat İSG eğitimi verilmeli?',
        a: 'Temel eğitim; az tehlikeli sınıfta en az 8 saat, tehlikeli sınıfta 12 saat, çok tehlikeli sınıfta 16 saattir. Yenileme sırasıyla en geç 3 yılda, 2 yılda ve 1 yılda bir yapılır. Eğitim süresi çalışma süresinden sayılır.',
      },
      {
        q: 'Acil durum tatbikatı zorunlu mu?',
        a: 'Evet. Acil durum planı kapsamında yılda en az bir tatbikat yapılması ve sonrasında değerlendirme raporu düzenlenmesi gerekir.',
      },
      {
        q: 'İşe giriş raporunu aile hekimi düzenleyebilir mi?',
        a: 'Hayır. İşe giriş ve periyodik muayene raporlarını işyeri hekimliği yetkisi bulunan hekim düzenler.',
      },
      {
        q: 'İSG hizmetinin maliyeti çalışana yansıtılabilir mi?',
        a: 'Hayır. İş sağlığı ve güvenliği tedbirlerinin maliyeti hiçbir şekilde çalışanlara yansıtılamaz; tamamı işverene aittir.',
      },
      {
        q: 'OSGB değiştirmek istersem süreç nasıl işler?',
        a: 'Mevcut İSG-KATİP sözleşmesinin sonlandırılması ve yeni sözleşmenin tanımlanması gerekir. Devir sırasında risk değerlendirmesi, eğitim kayıtları ve sağlık dosyalarının eksiksiz teslim alınması önemlidir; bu kontrolü sizin adınıza yaparız.',
      },
      {
        q: 'Sağlık taraması için çalışanları dışarı göndermek zorunda mıyım?',
        a: 'Hayır. Akciğer grafisi, odyometri ve solunum fonksiyon testi gibi tetkikleri mobil sağlık aracımızla işyerinizde yapabiliyoruz.',
      },
    ],
  },

  // -------------------------------------------------------
  {
    slug: 'kariyer',
    h1: 'Kariyer Fırsatları',
    title: 'Kariyer | AKER OSGB İş İlanları',
    description:
      'AKER OSGB açık pozisyonları ve iş başvurusu. Gebze ve Kocaeli bölgesinde iş güvenliği uzmanı, hemşire ve diğer pozisyonlar için başvuru formu.',
    lead:
      'Ekibimize katılmak isteyenler için açık pozisyonlarımız aşağıdadır. Uygun ilan bulamasanız da başvuru formunu doldurarak özgeçmişinizi bize iletebilirsiniz.',
    blocks: [
      { h2: 'Açık pozisyonlar', careers: true },
      {
        h2: 'Başvuru süreci',
        p: [
          'Başvurular İnsan Kaynakları birimimiz tarafından değerlendirilir. Uygun bulunan adaylarla telefonla iletişime geçilir. Özgeçmişinizi PDF formatında yüklemeniz gerekir.',
          'Başvurunuzda paylaştığınız kişisel veriler, yalnızca işe alım süreci kapsamında işlenir. Ayrıntı için KVKK metnimizi inceleyebilirsiniz.',
        ],
        links: [{ href: '/kvkk', label: 'KVKK aydınlatma metni' }],
      },
    ],
  },
];
