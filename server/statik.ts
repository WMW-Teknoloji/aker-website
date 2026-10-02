// =========================================================
// AKER OSGB - Statik dosya servisi
// =========================================================
// Cloudflare Pages'in yaptığı üç işi burada üstleniyoruz:
//   1. `_redirects` kurallarını uygulamak
//   2. `/sayfa` adresini `sayfa.html` dosyasına eşlemek
//      (ve `/sayfa.html` isteğini `/sayfa` adresine 301'lemek)
//   3. `_headers` kurallarındaki başlıkları eklemek
//
// Böylece aynı repo hem Pages'te hem kendi sunucumuzda aynı
// adresleri ve aynı başlıkları üretir.
// =========================================================

import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export interface BaslikKurali {
  desen: RegExp;
  basliklar: [string, string][];
}

export interface YonlendirmeKurali {
  desen: RegExp;
  hedef: string;
  kod: number;
}

const TURLER: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** Yol desenini (örn. `/img/*`) düzenli ifadeye çevirir. */
function desenRegex(desen: string): RegExp {
  const kacis = desen.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${kacis.replace(/\*/g, '(.*)')}$`);
}

/** `_headers` dosyasını okur. Biçim: yol satırı, ardından girintili `Ad: değer` satırları. */
export async function basliklariYukle(kok: string): Promise<BaslikKurali[]> {
  let metin: string;
  try {
    metin = await readFile(path.join(kok, '_headers'), 'utf8');
  } catch {
    return [];
  }

  const kurallar: BaslikKurali[] = [];
  let aktif: BaslikKurali | null = null;

  for (const satir of metin.split('\n')) {
    if (!satir.trim() || satir.trim().startsWith('#')) continue;

    if (!/^\s/.test(satir)) {
      aktif = { desen: desenRegex(satir.trim()), basliklar: [] };
      kurallar.push(aktif);
      continue;
    }

    const ayrac = satir.indexOf(':');
    if (aktif && ayrac > 0) {
      aktif.basliklar.push([satir.slice(0, ayrac).trim(), satir.slice(ayrac + 1).trim()]);
    }
  }

  return kurallar;
}

/** `_redirects` dosyasını okur. Biçim: `kaynak hedef kod`. */
export async function yonlendirmeleriYukle(kok: string): Promise<YonlendirmeKurali[]> {
  let metin: string;
  try {
    metin = await readFile(path.join(kok, '_redirects'), 'utf8');
  } catch {
    return [];
  }

  const kurallar: YonlendirmeKurali[] = [];
  for (const satir of metin.split('\n')) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith('#')) continue;

    const parcalar = temiz.split(/\s+/);
    const kaynak = parcalar[0];
    const hedef = parcalar[1];
    if (!kaynak || !hedef) continue;

    kurallar.push({ desen: desenRegex(kaynak), hedef, kod: Number(parcalar[2] ?? 301) || 301 });
  }

  return kurallar;
}

/** İstenen yol bir yönlendirme kuralına uyuyorsa hedefi döner. */
export function yonlendirmeBul(kurallar: YonlendirmeKurali[], yol: string): { hedef: string; kod: number } | null {
  for (const kural of kurallar) {
    const eslesme = kural.desen.exec(yol);
    if (!eslesme) continue;
    return { hedef: kural.hedef.replace(':splat', eslesme[1] ?? ''), kod: kural.kod };
  }
  return null;
}

/** Yola uyan bütün başlık kurallarını sırayla uygular. */
export function basliklariUygula(kurallar: BaslikKurali[], yol: string, headers: Headers): void {
  for (const kural of kurallar) {
    if (!kural.desen.test(yol)) continue;
    for (const [ad, deger] of kural.basliklar) headers.set(ad, deger);
  }
}

export interface Dosya {
  yol: string;
  boyut: number;
  degisme: number;
  tur: string;
}

async function dosyaMi(yol: string): Promise<Dosya | null> {
  try {
    const bilgi = await stat(yol);
    if (!bilgi.isFile()) return null;
    return {
      yol,
      boyut: bilgi.size,
      degisme: bilgi.mtimeMs,
      tur: TURLER[path.extname(yol).toLowerCase()] ?? 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

/**
 * İstek yolundan dosya bulur. Pages ile aynı sıra:
 * tam dosya, `<yol>.html`, `<yol>/index.html`.
 */
export async function dosyaBul(kok: string, yol: string): Promise<Dosya | null> {
  let temiz: string;
  try {
    temiz = decodeURIComponent(yol);
  } catch {
    return null;
  }
  if (temiz.includes('..') || temiz.includes('\0')) return null;

  const goreli = temiz.replace(/^\/+/, '');
  const taban = path.resolve(kok, goreli);
  if (taban !== path.resolve(kok) && !taban.startsWith(path.resolve(kok) + path.sep)) return null;

  if (temiz === '/' || temiz === '') return dosyaMi(path.join(kok, 'index.html'));

  return (
    (await dosyaMi(taban)) ??
    (await dosyaMi(`${taban}.html`)) ??
    (await dosyaMi(path.join(taban, 'index.html')))
  );
}

/** Dosyayı Response'a çevirir; koşullu istekte 304 döner. */
export function dosyaYaniti(dosya: Dosya, istek: Request, ekBasliklar: Headers): Response {
  const etag = `W/"${dosya.boyut.toString(16)}-${Math.floor(dosya.degisme).toString(16)}"`;
  const headers = new Headers(ekBasliklar);
  headers.set('Content-Type', dosya.tur);
  headers.set('ETag', etag);
  headers.set('Last-Modified', new Date(dosya.degisme).toUTCString());
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

  if (istek.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers });
  }

  if (istek.method === 'HEAD') {
    headers.set('Content-Length', String(dosya.boyut));
    return new Response(null, { status: 200, headers });
  }

  return new Response(Readable.toWeb(createReadStream(dosya.yol)) as ReadableStream, { status: 200, headers });
}
