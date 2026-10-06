// =========================================================
// AKER OSGB - Sunucu tarafı içerik enjeksiyonu
// =========================================================
// Statik HTML dosyaları, derleme anındaki içerikle birlikte
// repoda durur. Bu katman istek anında D1'deki güncel içeriği
// okuyup HTML'deki işaretli bölgeleri değiştirir.
//
// Neden böyle: içerik tarayıcıda `fetch` ile çekilseydi arama
// motorları boş bölümler görürdü. Burada değiştirildiği için
// hem bot hem ziyaretçi tam HTML alır ve panelden yapılan
// değişiklik anında yansır.
//
// Veri tabanı erişilemezse hiçbir değişiklik yapılmaz; sayfa
// derleme anındaki içerikle servis edilir, site asla boş kalmaz.
// =========================================================

import { loadAll, contentVersion } from './_lib/content.ts';
import {
  renderBranchCards,
  renderCareerCards,
  renderCareerList,
  renderClients,
  renderContactLocations,
  renderDocuments,
  renderFooterBranches,
  renderJobDetail,
  renderKurumSemasi,
  renderNews,
  renderSlides,
  renderTeam,
  sayfaSubeleri,
} from '../src/render.ts';
import type { Ctx } from './_lib/env.ts';
import type { CmsData } from '../src/content-types.ts';

/** HTML işaretleri: <!-- ad:start --> ... <!-- ad:end --> */
type Bolge =
  | 'hero-slaytlar'
  | 'musteriler'
  | 'haberler'
  | 'kariyer'
  | 'kariyer-liste'
  | 'ekip'
  | 'belgeler'
  | 'ilan-detay'
  | 'sube-alt'
  | 'sube-kart'
  | 'sube-iletisim'
  | 'kurum-sema';

/** Hangi sayfada hangi bölgelerin doldurulacağı. */
const SAYFA_BOLGELERI: Record<string, Bolge[]> = {
  '/': ['hero-slaytlar', 'musteriler', 'haberler', 'kariyer'],
  '/kariyer': ['kariyer-liste'],
  '/ekibimiz': ['ekip'],
  '/belgelerimiz': ['belgeler'],
  '/isbasvuru': ['ilan-detay'],
};

/**
 * Şube bilgisi her sayfanın alt kısmında ve firma şemasında var;
 * bu bölgeler bütün sayfalarda denenir. İşareti olmayan sayfada
 * değişiklik yapılmaz.
 */
const SUBE_BOLGELERI: Bolge[] = ['sube-alt', 'sube-kart', 'sube-iletisim', 'kurum-sema'];

/** İçerik enjeksiyonu yapılmayan yollar. */
const ATLANAN_YOLLAR = /^\/(admin|api)(\/|$)/;

function normalizeYol(pathname: string): string {
  if (pathname === '' || pathname === '/index.html') return '/';
  const temiz = pathname.replace(/\.html$/, '');
  return temiz.length > 1 && temiz.endsWith('/') ? temiz.slice(0, -1) : temiz;
}

function icerikUret(bolge: Bolge, data: CmsData, careerId: string | null, yol: string): string | null {
  // Şube tablosu boşsa (henüz tohumlanmamış) derleme anındaki liste kalır.
  if (bolge.startsWith('sube-') || bolge === 'kurum-sema') {
    if (data.branches.length === 0) return null;
  }

  switch (bolge) {
    case 'hero-slaytlar':
      return data.slides.length ? renderSlides(data.slides) : null;
    case 'musteriler':
      return data.clients.length
        ? `      <div class="swiper-wrapper clients-slides-wrapper">\n${renderClients(data.clients)}\n      </div>`
        : null;
    case 'haberler':
      return data.news.length ? `      <div class="bubble-element news-grid">\n${renderNews(data.news)}\n      </div>` : null;
    case 'kariyer':
      return data.careers.length
        ? `      <div class="bubble-element careers-grid">\n${renderCareerCards(data.careers)}\n      </div>`
        : null;
    case 'kariyer-liste':
      return data.careers.length ? `    <ul class="career-list">\n${renderCareerList(data.careers)}\n    </ul>` : null;
    case 'ekip':
      return data.team.length ? `    <div class="bubble-element team-grid">\n${renderTeam(data.team)}\n    </div>` : null;
    case 'belgeler':
      return data.documents.length
        ? `    <div class="bubble-element documents-grid">\n${renderDocuments(data.documents)}\n    </div>`
        : null;
    case 'ilan-detay': {
      const ilan = data.careers.find((c) => c.id === careerId) ?? data.careers[0];
      return ilan ? renderJobDetail(ilan) : null;
    }
    case 'sube-alt':
      return renderFooterBranches(data.branches);
    case 'sube-kart':
      return renderBranchCards(sayfaSubeleri(yol, data.branches));
    case 'sube-iletisim':
      return renderContactLocations(data.branches);
    case 'kurum-sema':
      return renderKurumSemasi(yol, data.branches);
    default:
      return null;
  }
}

/** İşaretli bölgeyi yeni içerikle değiştirir. */
function bolgeyiDegistir(html: string, bolge: string, icerik: string): string {
  const baslangic = `<!-- ${bolge}:start -->`;
  const bitis = `<!-- ${bolge}:end -->`;
  const bas = html.indexOf(baslangic);
  const son = html.indexOf(bitis);
  if (bas === -1 || son === -1 || son < bas) return html;

  return html.slice(0, bas + baslangic.length) + '\n' + icerik + '\n      ' + html.slice(son);
}

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env, next, waitUntil } = ctx;
  const url = new URL(request.url);
  const yol = normalizeYol(url.pathname);

  if ((request.method !== 'GET' && request.method !== 'HEAD') || ATLANAN_YOLLAR.test(yol)) return next();
  const bolgeler = [...(SAYFA_BOLGELERI[yol] ?? []), ...SUBE_BOLGELERI];

  const response = await next();
  const tur = response.headers.get('Content-Type') ?? '';
  if (!response.ok || !tur.includes('text/html')) return response;

  // Veri tabanı bağlanamazsa statik içerik olduğu gibi servis edilir.
  if (!env.DB) return response;

  // `?id=` yalnız ilan sayfasında anlamlı; diğer sayfalarda önbellek
  // anahtarına girmesin (rastgele değerlerle önbellek şişirilemesin).
  const careerId = yol === '/isbasvuru' ? url.searchParams.get('id') : null;

  try {
    const surum = await contentVersion(env);
    // Şablonun (statik HTML) kendi ETag'i de sürüme katılır: yalnız içerik
    // sürümüne bakılırsa yeni yayından sonra tarayıcı 304 alıp eski sayfada,
    // Worker önbelleği de eski şablonda kalır.
    const sablon = (response.headers.get('ETag') ?? '').replace(/^W\//, '').replace(/[^0-9A-Za-z-]/g, '');
    const onbellekAnahtari = new Request(
      `${url.origin}${yol}?v=${surum}&s=${sablon}&ilan=${careerId ?? ''}`,
      { method: 'GET' },
    );
    const onbellek = caches.default;

    // Tarayıcıdaki kopya güncelse gövde yeniden gönderilmez.
    const etag = `W/"icerik-${surum}-${sablon}-${careerId ?? ''}"`;
    if (request.headers.get('If-None-Match') === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'public, no-cache' },
      });
    }

    const kayitli = await onbellek.match(onbellekAnahtari);
    if (kayitli) return kayitli;

    const data = await loadAll(env);
    let html = await response.text();

    for (const bolge of bolgeler) {
      const icerik = icerikUret(bolge, data, careerId, yol);
      if (icerik !== null) html = bolgeyiDegistir(html, bolge, icerik);
    }

    const yeni = new Response(html, {
      status: response.status,
      headers: new Headers(response.headers),
    });
    // Panelden yapılan değişikliğin anında görünmesi için ara sunucular
    // sayfayı saklamaz; hız, içerik sürümüne göre anahtarlanan Worker
    // önbelleğinden ve ETag doğrulamasından gelir.
    yeni.headers.set('Cache-Control', 'public, no-cache, must-revalidate');
    yeni.headers.set('ETag', etag);
    yeni.headers.set('X-Icerik-Surum', surum);
    yeni.headers.delete('Content-Length');

    waitUntil(onbellek.put(onbellekAnahtari, yeni.clone()));
    return yeni;
  } catch (err) {
    console.error('icerik enjeksiyonu basarisiz', err);
    return response;
  }
};
