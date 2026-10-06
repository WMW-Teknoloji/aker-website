// =========================================================
// AKER OSGB - İçerik modeli tipleri
// =========================================================
// Tarayıcıya özgü hiçbir tipe bağlı değildir; hem tarayıcı kodu
// (src/) hem de Node üzerinde çalışan üretici betikler (tools/)
// bu dosyayı kullanabilir.
// =========================================================

export interface Client {
  id: string;
  image: string;
  /** Görselin alt metni; firma adı bilinmiyorsa boş bırakılabilir. */
  alt?: string;
}

export interface Slide {
  id: string;
  image: string;
  /** Görselin alt metni; boşsa genel bir metin kullanılır. */
  alt?: string;
}

export interface Career {
  id: string;
  title: string;
  text: string;
  /** Listede kullanılan küçük görsel. */
  cardImage: string;
  /** İlan detay sayfasındaki büyük görsel. */
  image: string;
}

export interface CertificateDoc {
  id: string;
  title: string;
  image: string;
}

export interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  /** Haberin dış kaynaktaki adresi; boşsa kart bağlantısız basılır. */
  link?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export interface Branch {
  id: string;
  name: string;
  /** Mahalle, cadde/sokak ve numara. */
  street: string;
  district: string;
  city: string;
  /** Boş bırakılabilir; adres satırına yalnızca doluysa yazılır. */
  postalCode: string;
  /** Google Haritalar adresi; boşsa adresten üretilir. */
  maps: string;
}

export interface CmsData {
  clients: Client[];
  slides: Slide[];
  careers: Career[];
  documents: CertificateDoc[];
  news: NewsItem[];
  team: TeamMember[];
  branches: Branch[];
}

export type CollectionName = keyof CmsData;

/** Bir koleksiyonun eleman tipi (örn. ItemOf<'team'> = TeamMember). */
export type ItemOf<K extends CollectionName> = CmsData[K][number];

/** Herhangi bir koleksiyon elemanı. */
export type CmsItem = ItemOf<CollectionName>;

export interface Application {
  id: string;
  /** ISO 8601 tarih damgası. */
  date: string;
  careerId: string;
  careerTitle: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  cvFileName: string;
  cvFileType: string;
  /** Özgeçmişin data: URL biçimindeki içeriği. */
  cvFileData: string;
}
