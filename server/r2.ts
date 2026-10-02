// =========================================================
// AKER OSGB - R2 karşılığı (yerel disk)
// =========================================================
// Panelden yüklenen görseller ve özgeçmişler Cloudflare'de R2
// kovasında durur. Kendi sunucumuzda karşılığı bir dizindir:
// nesne anahtarı dosya yolu olur, içerik türü ve önbellek
// başlığı yanındaki `.meta` dosyasında saklanır.
//
// Uygulama kodunun kullandığı yüzey küçüktür: put, get, delete
// ve dönen nesnede body / writeHttpMetadata / httpEtag.
// =========================================================

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export interface HttpMetadata {
  contentType?: string;
  cacheControl?: string;
}

export interface R2Nesnesi {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata: HttpMetadata;
  writeHttpMetadata: (headers: Headers) => void;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

/** Anahtarın depo dizini dışına çıkmasını engeller. */
function guvenliYol(kok: string, anahtar: string): string | null {
  if (!anahtar || anahtar.includes('..') || path.isAbsolute(anahtar)) return null;
  const tam = path.resolve(kok, anahtar);
  return tam.startsWith(path.resolve(kok) + path.sep) ? tam : null;
}

export class R2Deposu {
  #kok: string;

  constructor(kok: string) {
    this.#kok = kok;
  }

  async put(anahtar: string, veri: ArrayBuffer | Uint8Array, secenekler?: { httpMetadata?: HttpMetadata }): Promise<void> {
    const yol = guvenliYol(this.#kok, anahtar);
    if (!yol) throw new Error(`gecersiz anahtar: ${anahtar}`);

    const govde = veri instanceof Uint8Array ? veri : new Uint8Array(veri);
    await mkdir(path.dirname(yol), { recursive: true });
    await writeFile(yol, govde);
    await writeFile(
      `${yol}.meta`,
      JSON.stringify({
        httpMetadata: secenekler?.httpMetadata ?? {},
        etag: createHash('md5').update(govde).digest('hex'),
      }),
    );
  }

  async get(anahtar: string): Promise<R2Nesnesi | null> {
    const yol = guvenliYol(this.#kok, anahtar);
    if (!yol) return null;

    let boyut: number;
    try {
      boyut = (await stat(yol)).size;
    } catch {
      return null;
    }

    let meta: { httpMetadata?: HttpMetadata; etag?: string } = {};
    try {
      meta = JSON.parse(await readFile(`${yol}.meta`, 'utf8')) as typeof meta;
    } catch {
      // .meta yoksa varsayılanlarla devam edilir.
    }

    const httpMetadata = meta.httpMetadata ?? {};
    const etag = `"${meta.etag ?? `${boyut}`}"`;

    return {
      get body(): ReadableStream {
        return Readable.toWeb(createReadStream(yol)) as ReadableStream;
      },
      size: boyut,
      httpEtag: etag,
      httpMetadata,
      writeHttpMetadata(headers: Headers): void {
        if (httpMetadata.contentType) headers.set('content-type', httpMetadata.contentType);
        if (httpMetadata.cacheControl) headers.set('cache-control', httpMetadata.cacheControl);
      },
      async arrayBuffer(): Promise<ArrayBuffer> {
        const veri = await readFile(yol);
        return veri.buffer.slice(veri.byteOffset, veri.byteOffset + veri.byteLength) as ArrayBuffer;
      },
    };
  }

  async delete(anahtar: string): Promise<void> {
    const yol = guvenliYol(this.#kok, anahtar);
    if (!yol) return;
    await rm(yol, { force: true });
    await rm(`${yol}.meta`, { force: true });
  }
}
