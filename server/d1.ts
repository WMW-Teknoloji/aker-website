// =========================================================
// AKER OSGB - D1 karşılığı (node:sqlite)
// =========================================================
// Functions kodu Cloudflare D1 arayüzünü kullanır: prepare →
// bind → first/all/run ve batch. Kendi sunucumuzda D1 yok;
// burada aynı arayüz yerel bir SQLite dosyası üzerinde
// uygulanır. Uygulama kodu iki ortamda da aynı kalır.
//
// node:sqlite eşzamanlıdır, sorgular anında döner; arayüz
// söz (Promise) döndürdüğü için metotlar `async` yazılmıştır.
// =========================================================

import { DatabaseSync } from 'node:sqlite';

export interface SorguSonucu<T> {
  results: T[];
  success: true;
  meta: { changes: number; last_row_id: number; rows_read: number; rows_written: number };
}

/** SQLite yalnızca null, sayı, metin ve ikili veri kabul eder. */
function degerCevir(deger: unknown): null | number | string | bigint | Uint8Array {
  if (deger === undefined || deger === null) return null;
  if (typeof deger === 'boolean') return deger ? 1 : 0;
  if (typeof deger === 'number' || typeof deger === 'string' || typeof deger === 'bigint') return deger;
  if (deger instanceof Uint8Array) return deger;
  return String(deger);
}

/** BigInt dönen sayaçları güvenli sayıya indirir. */
function sayi(deger: unknown): number {
  return typeof deger === 'bigint' ? Number(deger) : typeof deger === 'number' ? deger : 0;
}

export class D1Sorgu {
  #db: DatabaseSync;
  #sql: string;
  #args: unknown[];

  constructor(db: DatabaseSync, sql: string, args: unknown[] = []) {
    this.#db = db;
    this.#sql = sql;
    this.#args = args;
  }

  /** D1 ile aynı davranış: bağlama yeni bir sorgu nesnesi döndürür. */
  bind(...args: unknown[]): D1Sorgu {
    return new D1Sorgu(this.#db, this.#sql, args);
  }

  #bagli(): (null | number | string | bigint | Uint8Array)[] {
    return this.#args.map(degerCevir);
  }

  async first<T = Record<string, unknown>>(kolon?: string): Promise<T | null> {
    const satir = this.#db.prepare(this.#sql).get(...this.#bagli()) as Record<string, unknown> | undefined;
    if (!satir) return null;
    if (kolon !== undefined) return (satir[kolon] ?? null) as T;
    return satir as T;
  }

  async all<T = Record<string, unknown>>(): Promise<SorguSonucu<T>> {
    const satirlar = this.#db.prepare(this.#sql).all(...this.#bagli()) as T[];
    return {
      results: satirlar,
      success: true,
      meta: { changes: 0, last_row_id: 0, rows_read: satirlar.length, rows_written: 0 },
    };
  }

  async run<T = Record<string, unknown>>(): Promise<SorguSonucu<T>> {
    const sonuc = this.#db.prepare(this.#sql).run(...this.#bagli());
    return {
      results: [],
      success: true,
      meta: {
        changes: sayi(sonuc.changes),
        last_row_id: sayi(sonuc.lastInsertRowid),
        rows_read: 0,
        rows_written: sayi(sonuc.changes),
      },
    };
  }
}

export class D1VeriTabani {
  #db: DatabaseSync;

  constructor(dosya: string) {
    this.#db = new DatabaseSync(dosya);
    // Eşzamanlı okuma sırasında yazma kilidi yaşanmaması için WAL.
    this.#db.exec('PRAGMA journal_mode = WAL');
    this.#db.exec('PRAGMA foreign_keys = ON');
    this.#db.exec('PRAGMA busy_timeout = 5000');
  }

  prepare(sql: string): D1Sorgu {
    return new D1Sorgu(this.#db, sql);
  }

  /** D1 batch: sorgular tek işlemde çalışır, sonuçlar sırayla döner. */
  async batch<T = Record<string, unknown>>(sorgular: D1Sorgu[]): Promise<SorguSonucu<T>[]> {
    const sonuclar: SorguSonucu<T>[] = [];
    this.#db.exec('BEGIN');
    try {
      for (const sorgu of sorgular) sonuclar.push(await sorgu.all<T>());
      this.#db.exec('COMMIT');
    } catch (err) {
      this.#db.exec('ROLLBACK');
      throw err;
    }
    return sonuclar;
  }

  async exec(sql: string): Promise<void> {
    this.#db.exec(sql);
  }

  kapat(): void {
    this.#db.close();
  }
}
