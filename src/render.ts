// =========================================================
// AKER OSGB - Paylaşılan içerik işaretlemesi
// =========================================================
// Aynı HTML'i iki yer üretir:
//   - tools/build.ts     : statik yedek içerik (derleme anında)
//   - functions/_middleware.ts : veri tabanındaki güncel içerik (istek anında)
// İkisinin görsel olarak birebir aynı olması için işaretleme
// yalnızca burada tanımlanır.
// =========================================================

import type { Branch, Career, CertificateDoc, Client, NewsItem, Slide, TeamMember } from './content-types.ts';
import { IMAGE_SIZES } from './image-sizes.gen.ts';
import { SITE } from './site-bilgi.ts';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Görselin width/height niteliklerini üretir.
 *
 * İki kaynak var: repodaki görsellerin boyutları üretilmiş tablodan,
 * panelden yüklenenlerinki dosya adına gömülü ölçüden (`...-800x600.webp`)
 * okunur. İkisi de yoksa nitelik yazılmaz.
 */
function dims(src: string): string {
  const size = IMAGE_SIZES[src.replace('/img/', '')];
  if (size) return ` width="${size.width}" height="${size.height}"`;

  const yuklenen = /-(\d{1,5})x(\d{1,5})\.[a-z0-9]+$/i.exec(src);
  if (yuklenen) return ` width="${yuklenen[1]}" height="${yuklenen[2]}"`;

  return '';
}

export function renderSlides(slides: Slide[]): string {
  return slides
    .map((slide, index) => {
      const alt = slide.alt?.trim() || 'AKER OSGB tanıtım görseli';
      const priority = index === 0 ? ' fetchpriority="high"' : ' loading="lazy"';
      return `        <div class="swiper-slide"><img src="${esc(slide.image)}" alt="${esc(alt)}"${dims(slide.image)} class="slide-img"${priority} decoding="async"></div>`;
    })
    .join('\n');
}

export function renderClients(clients: Client[]): string {
  return clients
    .map(
      (client) =>
        `        <div class="swiper-slide"><img src="${esc(client.image)}" alt="${esc(client.alt || 'AKER OSGB referansı')}"${dims(client.image)} class="client-logo" loading="lazy" decoding="async"></div>`,
    )
    .join('\n');
}

export function renderNews(news: NewsItem[]): string {
  return news
    .map((item) => {
      const link = item.link?.trim();
      const open = link
        ? `<a class="news-card" href="${esc(link)}" target="_blank" rel="noopener">`
        : '<div class="news-card">';
      const close = link ? '</a>' : '</div>';

      // Bağlantısı olmayan haber kartı tıklanabilir görünmez.
      const okuBagi = link ? '\n              <span class="news-card-link">Haberi oku &rarr;</span>' : '';

      return `        ${open}
          <div class="news-card-shadow">
            <div class="news-card-image" style="background-image: url(&quot;${esc(item.image)}&quot;);" role="img" aria-label="${esc(item.title)}"></div>
            <div class="news-card-body">
              <h3 class="news-card-title">${esc(item.title)}</h3>
              <p class="news-card-text">${esc(item.text)}</p>${okuBagi}
            </div>
          </div>
        ${close}`;
    })
    .join('\n');
}

export function renderCareerCards(careers: Career[]): string {
  return careers
    .map(
      (career) => `        <div class="career-card">
          <div class="career-card-shadow">
            <div class="career-card-image" style="background-image: url(&quot;${esc(career.cardImage)}&quot;);" role="img" aria-label="${esc(career.title)}"></div>
            <div class="career-card-body">
              <h3 class="career-card-title">${esc(career.title)}</h3>
              <p class="career-card-text">${esc(career.text)}</p>
              <a class="career-btn" href="/isbasvuru?id=${encodeURIComponent(career.id)}">Detayları Gör</a>
            </div>
          </div>
        </div>`,
    )
    .join('\n');
}

/** /kariyer sayfasındaki ayrıntılı ilan listesi. */
export function renderCareerList(careers: Career[]): string {
  return careers
    .map(
      (career) => `      <li class="career-item">
        <div class="career-item-image"><img src="${esc(career.cardImage)}" alt="${esc(career.title)}"${dims(career.cardImage)} loading="lazy" decoding="async"></div>
        <div class="career-item-body">
          <h3 class="career-item-title">${esc(career.title)}</h3>
          <p class="career-item-text">${esc(career.text)}</p>
          <a class="career-item-btn" href="/isbasvuru?id=${encodeURIComponent(career.id)}">Detayları gör ve başvur</a>
        </div>
      </li>`,
    )
    .join('\n');
}

export function renderDocuments(documents: CertificateDoc[]): string {
  return documents
    .map(
      (doc) => `      <div class="document-card">
        <h2 class="document-title">${esc(doc.title)}</h2>
        <div class="document-image"><img src="${esc(doc.image)}" alt="${esc(doc.title)} belgesi"${dims(doc.image)} class="document-img" loading="lazy" decoding="async"></div>
      </div>`,
    )
    .join('\n');
}

export function renderTeam(team: TeamMember[]): string {
  return team
    .map(
      (member) => `      <div class="team-card">
        <div class="team-photo" style="background-image: url(&quot;${esc(member.photo)}&quot;);" role="img" aria-label="${esc(member.name)}"></div>
        <h2 class="team-name">${esc(member.name)}</h2>
        <div class="team-role">${esc(member.role)}</div>
      </div>`,
    )
    .join('\n');
}

/** İş başvurusu sayfasındaki ilan başlığı, metni ve görseli. */
export function renderJobDetail(career: Career): string {
  return `    <div class="job-image">
      <img src="${esc(career.image)}" alt="${esc(career.title)}"${dims(career.image)} fetchpriority="high" decoding="async">
    </div>

    <h1 class="job-title">${esc(career.title)}</h1>
    <p class="job-text">${esc(career.text)}</p>`;
}

// ---------------------------------------------------------
// Şubeler
// ---------------------------------------------------------
// Şube adresleri dört yerde görünür: her sayfanın alt kısmı,
// ana sayfadaki iletişim kutusu, şube kartları ve firma bilgisi
// (JSON-LD). Listedeki ilk şube merkez kabul edilir.

/** İlçe sayfaları yalnızca kendi ilçesindeki şubeleri gösterir. */
const ILCE_SAYFALARI: Record<string, string> = {
  '/gebze-osgb': 'Gebze',
  '/dilovasi-osgb': 'Dilovası',
};

/** Şubelerin LocalBusiness şemasıyla işaretlendiği sayfalar. */
const SUBE_SEMASI_SAYFALARI = new Set(['/', '/subelerimiz', '/iletisim', '/gebze-osgb', '/dilovasi-osgb', '/kocaeli-osgb']);

const ICON_PIN =
  '<svg viewBox="0 0 24 24" class="location-svg" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';

const tamUrl = (yol: string): string => SITE.origin + (yol.startsWith('/') ? yol : `/${yol}`);

/** "Sokak No: 1, 41400 Gebze/Kocaeli"; posta kodu boşsa atlanır. */
export function tamAdres(b: Branch): string {
  const posta = b.postalCode?.trim();
  return `${b.street}, ${posta ? `${posta} ` : ''}${b.district}/${b.city}`;
}

/** Kayıtlı harita adresi; boşsa adresten bir Google Haritalar araması üretilir. */
export function haritaAdresi(b: Branch): string {
  const kayitli = b.maps?.trim();
  if (kayitli) return kayitli;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.street} ${b.district}/${b.city}`)}`;
}

/** Sayfada gösterilecek şubeler (ilçe sayfalarında süzülür). */
export function sayfaSubeleri(yol: string, subeler: Branch[]): Branch[] {
  const ilce = ILCE_SAYFALARI[yol];
  if (!ilce) return subeler;
  const aranan = ilce.toLocaleLowerCase('tr');
  return subeler.filter((b) => b.district.trim().toLocaleLowerCase('tr') === aranan);
}

/** Alt bilgideki şube listesi. */
export function renderFooterBranches(subeler: Branch[]): string {
  return subeler
    .map(
      (b) =>
        `        <li><a href="${esc(haritaAdresi(b))}" target="_blank" rel="noopener"><strong>${esc(b.name)}</strong><br>${esc(tamAdres(b))}</a></li>`,
    )
    .join('\n');
}

/** Şubelerimiz, İletişim ve ilçe sayfalarındaki şube kartları. */
export function renderBranchCards(subeler: Branch[]): string {
  return subeler
    .map(
      (b) => `      <li class="branch-card">
        <h3 class="branch-name">${esc(b.name)}</h3>
        <address class="branch-address">${esc(tamAdres(b))}</address>
        <div class="branch-links">
          <a href="${esc(haritaAdresi(b))}" target="_blank" rel="noopener">Haritada aç</a>
          <a href="${SITE.phoneHref}">${SITE.phone}</a>
        </div>
      </li>`,
    )
    .join('\n');
}

/** Ana sayfadaki iletişim kutusunun şube listesi. */
export function renderContactLocations(subeler: Branch[]): string {
  return subeler
    .map(
      (b) => `        <a class="location-item" href="${esc(haritaAdresi(b))}" target="_blank" rel="noopener">
          <div class="location-icon">${ICON_PIN}</div>
          <div class="location-text">
            <div class="location-name">${esc(b.name)}</div>
            <div class="location-address">${esc(tamAdres(b))}</div>
          </div>
        </a>`,
    )
    .join('\n');
}

function organizationNode(merkez: Branch | undefined): Record<string, unknown> {
  const logo = IMAGE_SIZES['aker-osgb-logo.webp'];
  return {
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.fullName,
    url: SITE.origin + '/',
    logo: {
      '@type': 'ImageObject',
      url: tamUrl('/img/aker-osgb-logo.webp'),
      width: logo?.width,
      height: logo?.height,
    },
    foundingDate: SITE.founded,
    email: SITE.email,
    telephone: SITE.phone,
    sameAs: SITE.social,
    ...(merkez
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: merkez.street,
            addressLocality: merkez.district,
            addressRegion: merkez.city,
            ...(merkez.postalCode?.trim() ? { postalCode: merkez.postalCode.trim() } : {}),
            addressCountry: 'TR',
          },
        }
      : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE.phone,
      contactType: 'customer service',
      email: SITE.email,
      areaServed: 'TR',
      availableLanguage: ['Turkish'],
    },
  };
}

function branchNode(b: Branch): Record<string, unknown> {
  return {
    '@type': 'LocalBusiness',
    '@id': `${SITE.origin}/subelerimiz#${b.id}`,
    name: b.name,
    parentOrganization: { '@id': `${SITE.origin}/#organization` },
    url: `${SITE.origin}/subelerimiz`,
    telephone: SITE.phone,
    email: SITE.email,
    image: tamUrl('/img/aker-osgb-logo.webp'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.street,
      addressLocality: b.district,
      addressRegion: b.city,
      ...(b.postalCode?.trim() ? { postalCode: b.postalCode.trim() } : {}),
      addressCountry: 'TR',
    },
    hasMap: haritaAdresi(b),
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kocaeli' },
      { '@type': 'AdministrativeArea', name: b.district },
    ],
  };
}

/**
 * Firma bilgisi ve sayfanın şubeleri (JSON-LD). Sayfanın diğer
 * şemalarından ayrı bir betik etiketidir; şubeler panelden
 * değiştiğinde yalnızca bu etiket yeniden üretilir.
 */
export function renderKurumSemasi(yol: string, subeler: Branch[]): string {
  const graph = [
    organizationNode(subeler[0]),
    ...(SUBE_SEMASI_SAYFALARI.has(yol) ? sayfaSubeleri(yol, subeler).map(branchNode) : []),
  ];
  // Panelden gelen metin "</script>" içerse bile etiketi kapatamasın.
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
