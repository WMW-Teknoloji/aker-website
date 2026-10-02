// =========================================================
// AKER OSGB - Kendi sunucumuz için çalıştırıcı
// =========================================================
// Site Cloudflare Pages için yazıldı: statik HTML + Pages
// Functions + D1 + R2. Kendi sunucumuzda (nginx arkasında Node)
// aynı kodu çalıştırmak için eksik üç parça burada tamamlanır:
//
//   functions/**      → aşağıdaki rota tablosu
//   D1 veri tabanı    → server/d1.ts       (node:sqlite)
//   R2 dosya deposu   → server/r2.ts       (yerel dizin)
//   caches.default    → server/onbellek.ts (süreç belleği)
//
// Functions kodunun tek satırı değişmedi; iki ortamda da aynı
// dosyalar çalışır. Statik dosyalar, `_headers` ve `_redirects`
// kuralları server/statik.ts içinde uygulanır.
//
// Çalıştırma:  node server/main.ts        (PORT, varsayılan 8788)
// =========================================================

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { D1VeriTabani } from './d1.ts';
import { R2Deposu } from './r2.ts';
import { onbellekKur } from './onbellek.ts';
import {
  basliklariUygula,
  basliklariYukle,
  dosyaBul,
  dosyaYaniti,
  yonlendirmeBul,
  yonlendirmeleriYukle,
} from './statik.ts';

import { onRequest as middleware } from '../functions/_middleware.ts';
import { onRequest as adminRotasi } from '../functions/api/admin/[[route]].ts';
import { onRequestPost as girisYap } from '../functions/api/auth/login.ts';
import { onRequestDelete as oturumSil, onRequestGet as oturumOku } from '../functions/api/auth/session.ts';
import { onRequestPost as basvuruGonder } from '../functions/api/basvuru.ts';
import { onRequestPost as bultenKaydi } from '../functions/api/bulten.ts';
import { onRequestPost as iletisimGonder } from '../functions/api/contact.ts';
import { onRequestGet as yuklenenGorsel } from '../functions/img/uploads/[[key]].ts';
import type { Ctx, Env } from '../functions/_lib/env.ts';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type Isleyici = (ctx: Ctx) => Promise<Response>;

interface Rota {
  desen: RegExp;
  /** Yakalanan kısım hangi parametre adına yazılacak (catch-all rotalar). */
  param?: string;
  isleyiciler: Partial<Record<string, Isleyici>> & { HEPSI?: Isleyici };
}

const ROTALAR: Rota[] = [
  {
    desen: /^\/api\/admin(?:\/(.*))?$/,
    param: 'route',
    isleyiciler: { HEPSI: adminRotasi },
  },
  { desen: /^\/api\/auth\/login\/?$/, isleyiciler: { POST: girisYap } },
  { desen: /^\/api\/auth\/session\/?$/, isleyiciler: { GET: oturumOku, DELETE: oturumSil } },
  { desen: /^\/api\/basvuru\/?$/, isleyiciler: { POST: basvuruGonder } },
  { desen: /^\/api\/bulten\/?$/, isleyiciler: { POST: bultenKaydi } },
  { desen: /^\/api\/contact\/?$/, isleyiciler: { POST: iletisimGonder } },
  { desen: /^\/img\/uploads\/(.+)$/, param: 'key', isleyiciler: { GET: yuklenenGorsel } },
];

// ---------------------------------------------------------
// Ortam değişkenleri
// ---------------------------------------------------------

/** `.env` veya `.dev.vars` dosyasını okur (AD=değer, # yorum). */
async function ortamDosyasi(dosya: string): Promise<Record<string, string>> {
  let metin: string;
  try {
    metin = await readFile(dosya, 'utf8');
  } catch {
    return {};
  }

  const degerler: Record<string, string> = {};
  for (const satir of metin.split('\n')) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith('#')) continue;
    const esittir = temiz.indexOf('=');
    if (esittir < 1) continue;
    const ad = temiz.slice(0, esittir).trim();
    let deger = temiz.slice(esittir + 1).trim();
    if ((deger.startsWith('"') && deger.endsWith('"')) || (deger.startsWith("'") && deger.endsWith("'"))) {
      deger = deger.slice(1, -1);
    }
    degerler[ad] = deger;
  }
  return degerler;
}

async function ortamiHazirla(): Promise<{ env: Env; port: number }> {
  const dosyadan = {
    ...(await ortamDosyasi(path.join(KOK, '.dev.vars'))),
    ...(await ortamDosyasi(path.join(KOK, '.env'))),
  };
  const oku = (ad: string): string => process.env[ad] ?? dosyadan[ad] ?? '';

  const veriDizini = oku('VERI_DIZINI') || path.join(KOK, '.veri');
  const dbDosyasi = oku('DB_DOSYASI') || path.join(veriDizini, 'aker.sqlite');
  const medyaDizini = oku('MEDYA_DIZINI') || path.join(veriDizini, 'medya');

  await mkdir(path.dirname(dbDosyasi), { recursive: true });
  await mkdir(medyaDizini, { recursive: true });

  const ilkKurulum = !existsSync(dbDosyasi);
  const db = new D1VeriTabani(dbDosyasi);

  // Veri tabanı yoksa şema ve tohum verisi yüklenir; sunucu boş içerikle açılmaz.
  if (ilkKurulum) {
    for (const ad of ['schema.sql', 'seed.sql']) {
      const yol = path.join(KOK, 'db', ad);
      if (!existsSync(yol)) continue;
      await db.exec(await readFile(yol, 'utf8'));
    }
    console.log(`veri tabani olusturuldu: ${dbDosyasi}`);
  }

  const env = {
    DB: db,
    MEDIA: new R2Deposu(medyaDizini),
    ADMIN_PASSWORD: oku('ADMIN_PASSWORD'),
    SESSION_SECRET: oku('SESSION_SECRET'),
    RESEND_API_KEY: oku('RESEND_API_KEY'),
    CONTACT_TO_EMAIL: oku('CONTACT_TO_EMAIL'),
    MAIL_FROM: oku('MAIL_FROM'),
    SITE_ORIGIN: oku('SITE_ORIGIN') || 'https://akerosgb.com.tr',
  } as unknown as Env;

  return { env, port: Number(oku('PORT')) || 8788 };
}

// ---------------------------------------------------------
// Node isteği ↔ Web Request/Response
// ---------------------------------------------------------

function istegeCevir(req: IncomingMessage): Request {
  // nginx arkasında gerçek şema ve alan adı başlıklardan gelir; oturum
  // çerezinin `Secure` bayrağı ve CSRF denetimi buna bakar.
  const sema = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || 'http';
  const host = (req.headers['host'] as string | undefined) ?? 'localhost';
  const url = new URL(req.url ?? '/', `${sema}://${host}`);

  const headers = new Headers();
  for (const [ad, deger] of Object.entries(req.headers)) {
    if (deger === undefined) continue;
    if (Array.isArray(deger)) for (const tek of deger) headers.append(ad, tek);
    else headers.set(ad, deger);
  }

  const govdesiz = req.method === 'GET' || req.method === 'HEAD';

  return new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body: govdesiz ? undefined : (Readable.toWeb(req) as ReadableStream),
    // @ts-expect-error - Node'da gövdeli istek için gerekli, tip tanımında yok
    duplex: 'half',
  });
}

async function yanitiYaz(yanit: Response, res: ServerResponse): Promise<void> {
  const basliklar: Record<string, string | string[]> = {};
  yanit.headers.forEach((deger, ad) => {
    if (ad.toLowerCase() !== 'set-cookie') basliklar[ad] = deger;
  });
  // Birden çok Set-Cookie başlığı Headers üzerinde tek satıra birleşir;
  // Node'un getSetCookie'si ayrı ayrı verir (tip tanımı Workers'ta yok).
  const cerezler = (yanit.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  if (cerezler.length) basliklar['set-cookie'] = cerezler;

  res.writeHead(yanit.status, basliklar);

  if (!yanit.body) {
    res.end();
    return;
  }

  await new Promise<void>((tamam, hata) => {
    Readable.fromWeb(yanit.body as Parameters<typeof Readable.fromWeb>[0])
      .on('error', hata)
      .on('end', tamam)
      .pipe(res);
  });
}

// ---------------------------------------------------------
// Sunucu
// ---------------------------------------------------------

async function baslat(): Promise<void> {
  const { env, port } = await ortamiHazirla();
  onbellekKur();

  const baslikKurallari = await basliklariYukle(KOK);
  const yonlendirmeler = await yonlendirmeleriYukle(KOK);

  /** İstek bir rotaya uyuyorsa işleyicisini ve parametrelerini döner. */
  function rotaBul(yol: string, metot: string): { isleyici: Isleyici; params: Record<string, string | string[]> } | null {
    for (const rota of ROTALAR) {
      const eslesme = rota.desen.exec(yol);
      if (!eslesme) continue;

      const isleyici = rota.isleyiciler[metot] ?? rota.isleyiciler.HEPSI;
      if (!isleyici) {
        return {
          isleyici: async () =>
            new Response(JSON.stringify({ error: 'method' }), {
              status: 405,
              headers: { 'Content-Type': 'application/json' },
            }),
          params: {},
        };
      }

      const params: Record<string, string | string[]> = {};
      if (rota.param) {
        const yakalanan = eslesme[1] ?? '';
        params[rota.param] = yakalanan ? yakalanan.split('/') : [];
      }
      return { isleyici, params };
    }
    return null;
  }

  async function statikYanit(istek: Request, yol: string): Promise<Response> {
    const dosya = await dosyaBul(KOK, yol);
    if (!dosya) {
      const yoksa = await dosyaBul(KOK, '/404');
      const basliklar = new Headers();
      basliklariUygula(baslikKurallari, yol, basliklar);
      if (!yoksa) return new Response('Bulunamadı', { status: 404, headers: basliklar });

      const yanit = dosyaYaniti(yoksa, istek, basliklar);
      return new Response(yanit.body, { status: 404, headers: yanit.headers });
    }

    const basliklar = new Headers();
    basliklariUygula(baslikKurallari, yol, basliklar);
    return dosyaYaniti(dosya, istek, basliklar);
  }

  async function isle(istek: Request): Promise<Response> {
    const url = new URL(istek.url);
    const yol = url.pathname;

    // 1. `_redirects` kuralları
    const yonlendirme = yonlendirmeBul(yonlendirmeler, yol);
    if (yonlendirme) {
      return new Response(null, {
        status: yonlendirme.kod,
        headers: { Location: `${yonlendirme.hedef}${url.search}` },
      });
    }

    // 2. Pages davranışı: /sayfa.html → /sayfa
    if (yol.endsWith('.html')) {
      return new Response(null, {
        status: 301,
        headers: { Location: `${yol.slice(0, -5)}${url.search}` },
      });
    }

    const rota = rotaBul(yol, istek.method);

    const ctx: Ctx = {
      request: istek,
      env,
      params: rota?.params ?? {},
      next: async () => (rota ? rota.isleyici(ctx) : statikYanit(istek, yol)),
      waitUntil: (soz) => {
        void Promise.resolve(soz).catch((err: unknown) => console.error('arka plan isi basarisiz', err));
      },
    };

    // 3. Middleware her istekte çalışır (Pages'teki sıra), sayfa dışı
    //    yolları olduğu gibi geçirir.
    const yanit = await middleware(ctx);

    const basliklar = new Headers(yanit.headers);
    basliklariUygula(baslikKurallari, yol, basliklar);
    return new Response(yanit.body, { status: yanit.status, statusText: yanit.statusText, headers: basliklar });
  }

  const sunucu = createServer((req, res) => {
    void (async () => {
      try {
        await yanitiYaz(await isle(istegeCevir(req)), res);
      } catch (err) {
        console.error('istek basarisiz', req.method, req.url, err);
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Sunucu hatası');
      }
    })();
  });

  sunucu.listen(port, () => console.log(`AKER OSGB sitesi http://localhost:${port} adresinde`));
}

await baslat();
