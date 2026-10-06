// =========================================================
// AKER OSGB - İçerik koleksiyonları (D1)
// =========================================================
// Koleksiyon tanımları hem yönetim API'si hem de genel sayfaları
// üreten middleware tarafından kullanılır. Alan listesi burada
// tanımlıdır; API yalnızca bu alanları kabul eder.
// =========================================================

import type { Env } from './env.ts';
import type { CmsData } from '../../src/content-types.ts';

export type CollectionName = keyof CmsData;

export interface FieldSpec {
  name: string;
  /** Hata mesajlarında görünen ad; yoksa alan adı kullanılır. */
  label?: string;
  /** Kabul edilen en fazla karakter sayısı. */
  max: number;
  /** Boş bırakılabilir mi? */
  optional?: boolean;
  /** Değer bir görsel yolu mu? (biçim denetimi yapılır) */
  isPath?: boolean;
  /** Değer bir https bağlantısı mı? (boşsa denetlenmez) */
  isUrl?: boolean;
}

export interface CollectionSpec {
  table: CollectionName;
  label: string;
  fields: FieldSpec[];
}

export const COLLECTIONS: Record<CollectionName, CollectionSpec> = {
  slides: {
    table: 'slides',
    label: 'Ana Sayfa Slider',
    fields: [
      { name: 'image', max: 500, isPath: true },
      { name: 'alt', max: 200, optional: true },
    ],
  },
  clients: {
    table: 'clients',
    label: 'Referanslar',
    fields: [
      { name: 'image', max: 500, isPath: true },
      { name: 'alt', max: 200, optional: true },
    ],
  },
  careers: {
    table: 'careers',
    label: 'Kariyer İlanları',
    fields: [
      { name: 'title', max: 200 },
      { name: 'text', max: 4000, optional: true },
      { name: 'cardImage', max: 500, isPath: true, optional: true },
      { name: 'image', max: 500, isPath: true, optional: true },
    ],
  },
  documents: {
    table: 'documents',
    label: 'Belgelerimiz',
    fields: [
      { name: 'title', max: 200 },
      { name: 'image', max: 500, isPath: true, optional: true },
    ],
  },
  news: {
    table: 'news',
    label: 'Bizden Haberler',
    fields: [
      { name: 'title', max: 200 },
      { name: 'text', max: 4000, optional: true },
      { name: 'image', max: 500, isPath: true, optional: true },
      { name: 'link', max: 500, optional: true },
    ],
  },
  team: {
    table: 'team',
    label: 'Ekibimiz',
    fields: [
      { name: 'name', max: 120 },
      { name: 'role', max: 160, optional: true },
      { name: 'photo', max: 500, isPath: true, optional: true },
    ],
  },
  branches: {
    table: 'branches',
    label: 'Şubeler',
    fields: [
      { name: 'name', label: 'Şube adı', max: 120 },
      { name: 'street', label: 'Adres', max: 300 },
      { name: 'district', label: 'İlçe', max: 60 },
      { name: 'city', label: 'İl', max: 60 },
      { name: 'postalCode', label: 'Posta kodu', max: 10, optional: true },
      { name: 'maps', label: 'Harita bağlantısı', max: 1000, isUrl: true, optional: true },
    ],
  },
};

export function isCollection(value: string): value is CollectionName {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, value);
}

/** Bir koleksiyonun kayıtlarını sıra numarasına göre döner. */
export async function listItems(env: Env, name: CollectionName): Promise<Record<string, string>[]> {
  const spec = COLLECTIONS[name];
  const columns = ['id', ...spec.fields.map((f) => f.name)].join(', ');
  const result = await env.DB.prepare(`SELECT ${columns} FROM ${spec.table} ORDER BY sira ASC, id ASC`).all();
  return (result.results ?? []) as Record<string, string>[];
}

/** Genel sayfaların ihtiyaç duyduğu bütün içeriği tek seferde okur. */
export async function loadAll(env: Env): Promise<CmsData> {
  const sonuclar = await env.DB.batch([
    env.DB.prepare('SELECT id, image, alt FROM slides ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, image, alt FROM clients ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, title, text, cardImage, image FROM careers ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, title, image FROM documents ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, title, text, image, link FROM news ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, name, role, photo FROM team ORDER BY sira ASC, id ASC'),
    env.DB.prepare('SELECT id, name, street, district, city, postalCode, maps FROM branches ORDER BY sira ASC, id ASC'),
  ]);

  const satirlar = <T>(index: number): T[] => (sonuclar[index]?.results ?? []) as T[];

  return {
    slides: satirlar<CmsData['slides'][number]>(0),
    clients: satirlar<CmsData['clients'][number]>(1),
    careers: satirlar<CmsData['careers'][number]>(2),
    documents: satirlar<CmsData['documents'][number]>(3),
    news: satirlar<CmsData['news'][number]>(4),
    team: satirlar<CmsData['team'][number]>(5),
    branches: satirlar<CmsData['branches'][number]>(6),
  };
}

/** İçerik sürümü; önbellek anahtarı olarak kullanılır. */
export async function contentVersion(env: Env): Promise<string> {
  const row = await env.DB.prepare("SELECT deger FROM meta WHERE anahtar = 'surum'").first<{ deger: string }>();
  return row?.deger ?? '1';
}

/** Her yazma işleminden sonra çağrılır; önbelleği geçersiz kılar. */
export async function bumpVersion(env: Env): Promise<void> {
  await env.DB.prepare(
    "UPDATE meta SET deger = CAST(CAST(deger AS INTEGER) + 1 AS TEXT) WHERE anahtar = 'surum'",
  ).run();
}

/** Yeni kayıtlar için kimlik üretir. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
