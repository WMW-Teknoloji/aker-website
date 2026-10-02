// =========================================================
// AKER OSGB - Sayfa üreticisi
// =========================================================
// İki iş yapar:
//   1. İçerik sayfalarını (hizmet, lokasyon, SSS, iletişim...)
//      site.ts ve content/ altındaki verilerden üretir.
//   2. Elle yazılmış sayfalardaki (index, belgelerimiz, ekibimiz,
//      isbasvuru) <!-- head:start --> ... gibi işaretli blokları
//      aynı kaynaktan güncelleyerek tutarlılığı korur.
// Ayrıca sitemap.xml dosyasını yazar.
//
// Kullanım: node tools/build.ts   (veya: npm run pages)
// =========================================================

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, BRANCHES, NAV, FOOTER_LINKS, type Branch } from './site.ts';
import { SERVICES, type FaqEntry, type Service } from './content/hizmetler.ts';
import { PAGES, type ContentBlock } from './content/sayfalar.ts';
import { KVKK_PARAGRAFLARI } from './content/kvkk.ts';
import { DEFAULT_DATA } from '../src/cms-data.ts';
import {
  renderCareerCards,
  renderCareerList,
  renderClients,
  renderDocuments,
  renderJobDetail,
  renderNews,
  renderSlides,
  renderTeam,
} from '../src/render.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface ImageSize {
  width: number;
  height: number;
}

const SIZES = JSON.parse(readFileSync(path.join(ROOT, 'tools', 'image-sizes.json'), 'utf8')) as Record<
  string,
  ImageSize
>;

/**
 * CSS/JS adresine içerik özeti ekler (`/css/style.css?v=1a2b3c4d`).
 * _headers bu dosyaları bir gün önbelleğe aldırıyor; dosya değişince
 * adres de değiştiği için tarayıcı eski sürümde kalmaz.
 */
function assetUrl(rel: string): string {
  const hash = createHash('sha256').update(readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 8);
  return `/${rel}?v=${hash}`;
}

const BRANCH_BY_ID: Record<string, Branch> = Object.fromEntries(BRANCHES.map((b) => [b.id, b]));

/** Merkez şube; Organization şemasının adresi buradan gelir. */
const HQ: Branch = BRANCHES[0]!;

/** Sayfa yolu ve başlıktan oluşan kırıntı öğesi. */
interface Crumb {
  href: string;
  label: string;
}

/** Bir sayfanın üretim için gereken bütün bilgileri. */
interface PageSpec {
  path: string;
  file: string;
  title: string;
  description: string;
  h1?: string;
  lead?: string;
  ogTitle?: string;
  ogType?: string;
  breadcrumb?: Crumb[];
  schema?: Record<string, unknown>[];
  priority?: string;
  noindex?: boolean;
  skipSitemap?: boolean;
  cta?: boolean;
}

// ---------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------
const esc = (s: unknown): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface ImgOptions {
  alt: string;
  className?: string;
  lazy?: boolean;
}

function img(name: string, { alt, className, lazy = true }: ImgOptions): string {
  const file = `${name}.webp`;
  const size = SIZES[file];
  const dims = size ? ` width="${size.width}" height="${size.height}"` : '';
  const cls = className ? ` class="${className}"` : '';
  const loading = lazy ? ' loading="lazy" decoding="async"' : ' decoding="async"';
  return `<img src="/img/${file}" alt="${esc(alt)}"${dims}${cls}${loading}>`;
}

const abs = (p: string): string => (p.startsWith('http') ? p : SITE.origin + (p.startsWith('/') ? p : `/${p}`));
const fullAddress = (b: Branch): string => `${b.street}, ${b.postalCode} ${b.district}/${b.city}`;

// ---------------------------------------------------------
// JSON-LD parçaları
// ---------------------------------------------------------
function organizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.fullName,
    url: SITE.origin + '/',
    logo: {
      '@type': 'ImageObject',
      url: abs('/img/aker-osgb-logo.webp'),
      width: SIZES['aker-osgb-logo.webp']?.width,
      height: SIZES['aker-osgb-logo.webp']?.height,
    },
    foundingDate: SITE.founded,
    email: SITE.email,
    telephone: SITE.phone,
    sameAs: SITE.social,
    address: {
      '@type': 'PostalAddress',
      streetAddress: HQ.street,
      addressLocality: HQ.district,
      addressRegion: HQ.city,
      postalCode: HQ.postalCode,
      addressCountry: 'TR',
    },
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

function websiteNode(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    url: SITE.origin + '/',
    name: SITE.name,
    inLanguage: 'tr-TR',
    publisher: { '@id': `${SITE.origin}/#organization` },
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
    image: abs('/img/aker-osgb-logo.webp'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.street,
      addressLocality: b.district,
      addressRegion: b.city,
      postalCode: b.postalCode,
      addressCountry: 'TR',
    },
    hasMap: b.maps,
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kocaeli' },
      { '@type': 'AdministrativeArea', name: b.district },
    ],
  };
}

function breadcrumbNode(trail: Crumb[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE.origin}/#breadcrumb`,
    itemListElement: trail.map((item: Crumb, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: abs(item.href),
    })),
  };
}

function faqNode(faq: FaqEntry[]): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f: FaqEntry) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function serviceNode(service: Service): Record<string, unknown> {
  return {
    '@type': 'Service',
    '@id': `${SITE.origin}/hizmetlerimiz/${service.slug}#service`,
    name: service.h1,
    serviceType: service.nav,
    description: service.short,
    provider: { '@id': `${SITE.origin}/#organization` },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kocaeli' },
      { '@type': 'AdministrativeArea', name: 'Gebze' },
      { '@type': 'AdministrativeArea', name: 'Dilovası' },
    ],
    url: `${SITE.origin}/hizmetlerimiz/${service.slug}`,
  };
}

// ---------------------------------------------------------
// <head> bloğu
// ---------------------------------------------------------
function headBlock(page: PageSpec): string {
  const canonical = abs(page.path);
  const ogImage = abs('/' + SITE.ogImage);
  const graph = [organizationNode(), websiteNode(), ...(page.schema || [])];
  if (page.breadcrumb && page.breadcrumb.length > 1) graph.push(breadcrumbNode(page.breadcrumb));

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="${esc(SITE.legalName)}">

<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:locale" content="${SITE.locale}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="${SITE.ogImageSize.width}">
<meta property="og:image:height" content="${SITE.ogImageSize.height}">
<meta property="og:image:alt" content="AKER OSGB logosu">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.ogTitle || page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${ogImage}">

<link rel="icon" type="image/webp" href="/img/favicon-kaynak.webp">
<link rel="apple-touch-icon" href="/img/favicon-kaynak.webp">
<meta name="theme-color" content="#0205d3">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap">
<link rel="stylesheet" href="${assetUrl('css/style.css')}">
<link rel="stylesheet" href="${assetUrl('css/content.css')}">

<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}
</script>`;
}

// ---------------------------------------------------------
// Menü ve alt bilgi
// ---------------------------------------------------------
function navBlock(currentPath: string): string {
  const links = NAV.map((item) => {
    const active = item.href === currentPath ? ' active' : '';
    const aria = item.href === currentPath ? ' aria-current="page"' : '';
    return `            <a class="nav-link${active}" href="${item.href}"${aria}>${item.label}</a>`;
  }).join('\n');

  return `<header class="bubble-element navbar floating-group">
  <nav class="navbar-inner" aria-label="Ana menü">
    <div class="navbar-row">
      <div class="navbar-links">
        <a href="/" class="navbar-logo" aria-label="AKER OSGB ana sayfa">${img('aker-osgb-logo', {
          alt: 'AKER OSGB logosu',
          className: 'navbar-logo-img',
          lazy: false,
        })}</a>
        <button type="button" class="navbar-toggle" aria-label="Menüyü aç" aria-expanded="false" aria-controls="navbar-menu">
          <span class="navbar-toggle-bar"></span>
          <span class="navbar-toggle-bar"></span>
          <span class="navbar-toggle-bar"></span>
        </button>
        <div class="navbar-menu" id="navbar-menu">
${links}
            <a class="navbar-flowick-icon" href="https://flowickbpm.com" target="_blank" rel="noopener" title="Flowick BPM'e giriş"><img src="/img/flowick-logo.png" alt="Flowick BPM" width="128" height="128" class="navbar-flowick-img" loading="lazy" decoding="async"></a>
            <a class="nav-link" href="https://flowickbpm.com" target="_blank" rel="noopener">Flowick BPM</a>
        </div>
      </div>
    </div>
  </nav>
</header>`;
}

function footerBlock(): string {
  const links = FOOTER_LINKS.map(
    (l) => `        <li><a href="${l.href}">${l.label}</a></li>`
  ).join('\n');

  const branches = BRANCHES.map(
    (b) => `        <li><a href="${b.maps}" target="_blank" rel="noopener"><strong>${b.name}</strong><br>${esc(fullAddress(b))}</a></li>`
  ).join('\n');

  return `<footer class="bubble-element footer-section">
  <div class="footer-top">
    <div class="footer-newsletter">
      <div class="footer-newsletter-title">E-Posta Bültenimize Abone Olun!</div>
      <label class="footer-field-label" for="footer-email">E-Posta (*)</label>
      <input type="email" id="footer-email" placeholder="E-Posta" autocomplete="email" class="footer-input">
      <button class="footer-subscribe-btn" disabled>Abone Ol</button>
      <div class="footer-alert-wrap"><div class="footer-alert"></div></div>
    </div>
    <nav class="footer-nav" aria-label="Alt bilgi menüsü">
      <div class="footer-nav-title">Hizmetler ve Bölgeler</div>
      <ul class="footer-link-list">
${links}
      </ul>
    </nav>
    <div class="footer-branches">
      <div class="footer-nav-title">Şubelerimiz</div>
      <ul class="footer-branch-list">
${branches}
      </ul>
      <div class="footer-contact-line">
        <a href="${SITE.phoneHref}">${SITE.phone}</a> &middot;
        <a href="mailto:${SITE.email}">${SITE.email}</a>
      </div>
    </div>
    <div class="footer-brand">
      <div class="footer-logo">${img('aker-osgb-logo-footer', {
        alt: 'AKER Ortak Sağlık ve Güvenlik Birimi logosu',
        className: 'footer-logo-img',
      })}</div>
      <div class="footer-tagline">Sağlıklı Günler dileriz...</div>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-copyright">&copy; 2012-2026 ${esc(SITE.fullName)}. Tüm hakları saklıdır.</div>
    <div class="footer-powered">
      <div class="footer-powered-logo"><img src="/img/flowick-logo.png" alt="Flowick Teknoloji Hizmetleri A.Ş. logosu" width="128" height="128" class="footer-powered-img" loading="lazy" decoding="async"></div>
      <div class="footer-powered-text">Powered By Flowick Teknoloji Hizmetleri A.Ş.</div>
    </div>
  </div>
</footer>`;
}

function whatsappBlock(): string {
  return `<div class="bubble-element wpp-icon-wrapper">
  <div id="wpplugin" class="floating-wpp">
    <a class="floating-wpp-button wpp-button-bg" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp ile iletişime geçin">
      <svg viewBox="0 0 800 800" width="56" height="56" aria-hidden="true" focusable="false">
        <path d="M787.59 800H12.41C5.556 800 0 793.332 0 785.108V14.892C0 6.667 5.556 0 12.41 0h775.18C794.444 0 800 6.667 800 14.892v770.216c0 8.224-5.556 14.892-12.41 14.892Z" fill="#25d366"/>
        <path fill-rule="evenodd" fill="#fff" d="M508.558 450.429c-5.888-2.946-34.835-17.189-40.233-19.156-5.396-1.965-9.322-2.945-13.247 2.947-3.925 5.894-15.209 19.157-18.644 23.087-3.434 3.929-6.869 4.422-12.757 1.473-5.887-2.946-24.859-9.163-47.349-29.224-17.503-15.613-29.32-34.893-32.754-40.788-3.435-5.895-.367-9.081 2.581-12.016 2.649-2.639 5.889-6.878 8.832-10.316 2.944-3.437 3.925-5.895 5.888-9.822 1.962-3.931.982-7.368-.492-10.315-1.471-2.947-13.247-31.93-18.152-43.72-4.78-11.48-9.634-9.925-13.248-10.107-3.431-.171-7.361-.207-11.285-.207-3.925 0-10.304 1.474-15.702 7.367-5.396 5.895-20.607 20.14-20.607 49.12 0 28.983 21.098 56.979 24.042 60.909 2.945 3.931 41.518 63.401 100.584 88.905 14.047 6.068 25.015 9.69 33.566 12.403 14.104 4.482 26.94 3.849 37.085 2.333 11.312-1.689 34.836-14.242 39.743-27.995 4.906-13.757 4.906-25.545 3.433-28-1.471-2.456-5.396-3.93-11.284-6.878ZM401.126 597.117h-.079c-35.145-.013-69.616-9.456-99.687-27.3l-7.152-4.245-74.128 19.445 19.786-72.274-4.656-7.411c-19.606-31.183-29.962-67.224-29.946-104.232.043-107.987 87.906-195.843 195.94-195.843 52.314.018 101.489 20.417 138.469 57.439 36.978 37.02 57.331 86.229 57.31 138.562-.044 107.996-87.905 195.859-195.857 195.859ZM567.816 234.565C523.327 190.024 464.161 165.484 401.124 165.458c-129.884 0-235.595 105.703-235.647 235.627-.017 41.532 10.834 82.069 31.455 117.807L163.502 641l124.919-32.768c34.418 18.773 73.17 28.669 112.609 28.681h.096c129.871 0 235.59-105.713 235.643-235.639.024-62.965-24.464-122.169-68.953-166.709"/>
      </svg>
    </a>
  </div>
</div>`;
}

// ---------------------------------------------------------
// Gövde blokları
// ---------------------------------------------------------
function branchCard(b: Branch): string {
  return `      <li class="branch-card">
        <h3 class="branch-name">${esc(b.name)}</h3>
        <address class="branch-address">${esc(fullAddress(b))}</address>
        <div class="branch-links">
          <a href="${b.maps}" target="_blank" rel="noopener">Haritada aç</a>
          <a href="${SITE.phoneHref}">${SITE.phone}</a>
        </div>
      </li>`;
}

function serviceCards(): string {
  return `    <ul class="service-card-list">
${SERVICES.map(
    (s) => `      <li class="service-card">
        <div class="service-card-icon">${img(s.icon, { alt: '', className: 'service-card-icon-img' })}</div>
        <h3 class="service-card-title"><a href="/hizmetlerimiz/${s.slug}">${esc(s.nav)}</a></h3>
        <p class="service-card-text">${esc(s.short)}</p>
      </li>`
  ).join('\n')}
    </ul>`;
}

function faqList(faq: FaqEntry[]): string {
  return `    <div class="faq-list">
${faq
    .map(
      (f) => `      <details class="faq-item">
        <summary class="faq-question"><h3>${esc(f.q)}</h3></summary>
        <div class="faq-answer"><p>${esc(f.a)}</p></div>
      </details>`
    )
    .join('\n')}
    </div>`;
}

function contactBlock(): string {
  return `    <ul class="contact-quick-list">
      <li><span class="contact-quick-label">Telefon</span><a class="contact-quick-value" href="${SITE.phoneHref}">${SITE.phone}</a></li>
      <li><span class="contact-quick-label">E-Posta</span><a class="contact-quick-value" href="mailto:${SITE.email}">${SITE.email}</a></li>
      <li><span class="contact-quick-label">WhatsApp</span><a class="contact-quick-value" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">Mesaj gönderin</a></li>
    </ul>`;
}

function contactFormBlock(): string {
  return `    <div class="bubble-element contact-form-block content-form">
      <input type="text" name="company_website" tabindex="-1" autocomplete="off" class="hp-field" aria-hidden="true">
      <div class="contact-field">
        <label class="field-label" for="form-name">Ad Soyad (*)</label>
        <div class="field-input-wrap"><input type="text" id="form-name" placeholder="Ad Soyad" class="field-input" name="name" autocomplete="name"></div>
      </div>
      <div class="contact-field">
        <label class="field-label" for="form-phone">Telefon (*)</label>
        <div class="field-input-wrap"><input type="tel" id="form-phone" placeholder="Telefon" inputmode="tel" class="field-input" name="phone" autocomplete="tel"></div>
      </div>
      <div class="contact-field">
        <label class="field-label" for="form-email">E-Posta (*)</label>
        <div class="field-input-wrap"><input type="email" id="form-email" placeholder="E-Posta" autocomplete="email" class="field-input" name="email"></div>
      </div>
      <div class="contact-field">
        <label class="field-label" for="form-message">Mesajınız (*)</label>
        <textarea id="form-message" placeholder="Mesajınız" class="field-textarea" name="message"></textarea>
      </div>
      <div class="kvkk-row">
        <div class="kvkk-checkbox"><input type="checkbox" id="kvkk-check"><label for="kvkk-check"></label></div>
        <div class="kvkk-text"><a class="kvkk-link" href="/kvkk">KVKK Metni</a>'ni okudum, onaylıyorum.</div>
      </div>
      <div class="recaptcha-box">
        <div class="recaptcha-check-wrap">
          <input type="checkbox" id="recaptcha-check" class="recaptcha-checkbox">
          <label for="recaptcha-check">Ben robot değilim</label>
        </div>
      </div>
      <div class="submit-wrap"><button class="submit-btn" disabled>Gönder</button></div>
      <div class="form-alert-wrap"><div class="form-alert"></div></div>
    </div>`;
}

// Yerel görsel yolundan (/img/x.webp) boyut niteliklerini üretir
function dimsFor(src: string): string {
  const size = SIZES[src.replace('/img/', '')];
  return size ? ` width="${size.width}" height="${size.height}"` : '';
}

function careerCards(): string {
  return `    <!-- kariyer-liste:start -->
    <ul class="career-list">
${renderCareerList(DEFAULT_DATA.careers)}
    </ul>
    <!-- kariyer-liste:end -->`;
}

// ---------------------------------------------------------
// Ana sayfa ve iç sayfalardaki statik içerik blokları
// ---------------------------------------------------------
function servicesGridBlock(): string {
  return `      <ul class="bubble-element services-grid">
${SERVICES.map(
    (s) => `        <li class="service-item">
          <a class="service-item-link" href="/hizmetlerimiz/${s.slug}">
            <span class="service-icon-wrap">
              <span class="service-icon">${img(s.icon, { alt: '', className: 'service-icon-img' })}</span>
            </span>
            <span class="service-label-wrap"><span class="service-label">${esc(s.nav)}</span></span>
          </a>
        </li>`
  ).join('\n')}
      </ul>`;
}

function newsGridBlock(): string {
  return `      <div class="bubble-element news-grid">\n${renderNews(DEFAULT_DATA.news)}\n      </div>`;
}

function careersGridBlock(): string {
  return `      <div class="bubble-element careers-grid">\n${renderCareerCards(DEFAULT_DATA.careers)}\n      </div>`;
}

function clientsBlock(): string {
  return `      <div class="swiper-wrapper clients-slides-wrapper">\n${renderClients(DEFAULT_DATA.clients)}\n      </div>`;
}

function heroSlidesBlock(): string {
  return renderSlides(DEFAULT_DATA.slides);
}

function jobDetailBlock(): string {
  const ilan = DEFAULT_DATA.careers[0];
  return ilan ? renderJobDetail(ilan) : '';
}

function documentsGridBlock(): string {
  return `    <div class="bubble-element documents-grid">\n${renderDocuments(DEFAULT_DATA.documents)}\n    </div>`;
}

function teamGridBlock(): string {
  return `    <div class="bubble-element team-grid">\n${renderTeam(DEFAULT_DATA.team)}\n    </div>`;
}

const ICON_PIN = '<svg viewBox="0 0 24 24" class="location-svg" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>';

function contactInfoBlock(): string {
  const locations = BRANCHES.map(
    (b) => `        <a class="location-item" href="${b.maps}" target="_blank" rel="noopener">
          <div class="location-icon">${ICON_PIN}</div>
          <div class="location-text">
            <div class="location-name">${esc(b.name)}</div>
            <div class="location-address">${esc(fullAddress(b))}</div>
          </div>
        </a>`
  ).join('\n');

  const socials = [
    ['Facebook', SITE.social[0], 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z'],
    ['Instagram', SITE.social[1], 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'],
    ['LinkedIn', SITE.social[2], 'M20.452 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.137 1.445-2.137 2.939v5.667h-3.554V9h3.41v1.561h.05c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'],
  ]
    .map(
      ([label, href, d]) =>
        `            <a class="contact-social-link" href="${href}" target="_blank" rel="noopener" aria-label="${label}"><svg viewBox="0 0 24 24" class="contact-social-svg" aria-hidden="true"><path d="${d}"/></svg></a>`
    )
    .join('\n');

  return `    <div class="bubble-element contact-info-block">
      <div class="contact-info-title-wrap"><h2 class="contact-info-title">İletişim Bilgileri</h2></div>
      <div class="bubble-element contact-locations">
${locations}
      </div>

      <div class="contact-quick-block">
        <div class="contact-quick-details">
          <div class="quick-detail">
            <div class="quick-detail-label">Telefon</div>
            <a class="quick-detail-value" href="${SITE.phoneHref}">${SITE.phone}</a>
          </div>
          <div class="quick-detail">
            <div class="quick-detail-label">E-Posta</div>
            <a class="quick-detail-value" href="mailto:${SITE.email}">${SITE.email}</a>
          </div>
          <div class="contact-social">
${socials}
          </div>
        </div>
      </div>
    </div>`;
}

function renderBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      const parts = [`    <h2>${esc(b.h2)}</h2>`];
      if (b.p) parts.push(...b.p.map((t) => `    <p>${esc(t)}</p>`));
      if (b.list) parts.push(`    <ul class="content-list">\n${b.list.map((i) => `      <li>${esc(i)}</li>`).join('\n')}\n    </ul>`);
      if (b.branches) parts.push(`    <ul class="branch-list">\n${b.branches.map((id) => branchCard(BRANCH_BY_ID[id]!)).join('\n')}\n    </ul>`);
      if (b.services) parts.push(serviceCards());
      if (b.contact) parts.push(contactBlock());
      if (b.form) parts.push(contactFormBlock());
      if (b.careers) parts.push(careerCards());
      if (b.links)
        parts.push(
          `    <p class="content-links">${b.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join(' &middot; ')}</p>`
        );
      return `  <section class="content-section">\n${parts.join('\n')}\n  </section>`;
    })
    .join('\n\n');
}

function breadcrumbHtml(trail: Crumb[]): string {
  if (trail.length < 2) return '';
  const items = trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<li aria-current="page">${esc(t.label)}</li>`
        : `<li><a href="${t.href}">${esc(t.label)}</a></li>`
    )
    .join('\n      ');
  return `  <nav class="breadcrumb" aria-label="Sayfa yolu">
    <ol>
      ${items}
    </ol>
  </nav>`;
}

// ---------------------------------------------------------
// Tam sayfa şablonu
// ---------------------------------------------------------
function renderPage(page: PageSpec, bodyHtml: string): string {
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<!-- head:start -->
${headBlock(page)}
<!-- head:end -->
</head>
<body class="content-page">

<!-- wpp:start -->
${whatsappBlock()}
<!-- wpp:end -->

<!-- nav:start -->
${navBlock(page.path)}
<!-- nav:end -->

<main class="content-main" id="icerik">
${breadcrumbHtml(page.breadcrumb || [])}
  <article class="content-article">
    <h1>${esc(page.h1)}</h1>
${page.lead ? `    <p class="content-lead">${esc(page.lead)}</p>` : ''}

${bodyHtml}
  </article>
${page.cta === false ? '' : ctaBlock()}
</main>

<!-- footer:start -->
${footerBlock()}
<!-- footer:end -->

<script src="${assetUrl('js/script.js')}" defer></script>
</body>
</html>
`;
}

function ctaBlock(): string {
  return `  <aside class="content-cta">
    <h2>İşyeriniz için teklif alın</h2>
    <p>NACE kodunuzu, çalışan sayınızı ve adresinizi iletin; tehlike sınıfınıza göre hesaplanmış teklifi aynı gün paylaşalım.</p>
    <div class="content-cta-actions">
      <a class="cta-primary" href="${SITE.phoneHref}">${SITE.phone}</a>
      <a class="cta-secondary" href="/iletisim">İletişim formu</a>
      <a class="cta-secondary" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </aside>`;
}

// ---------------------------------------------------------
// Üretilecek sayfaların toplanması
// ---------------------------------------------------------
const generated: { page: PageSpec; html: string }[] = [];

// Hizmet hub sayfası
{
  const page = {
    path: '/hizmetlerimiz',
    file: 'hizmetlerimiz/index.html',
    h1: 'Hizmetlerimiz',
    title: 'OSGB Hizmetlerimiz | İş Güvenliği ve İşyeri Hekimliği | AKER OSGB',
    description:
      'İş güvenliği uzmanlığı, işyeri hekimliği, risk değerlendirmesi, acil durum planı, İSG eğitimleri ve mobil sağlık hizmetleri. Gebze, Dilovası ve Kocaeli.',
    lead: 'İşyerinizin 6331 sayılı Kanun kapsamındaki bütün yükümlülüklerini tek sözleşmeyle yürütüyoruz. Aşağıdaki başlıklardan ayrıntılara ulaşabilirsiniz.',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/hizmetlerimiz', label: 'Hizmetlerimiz' },
    ],
    schema: SERVICES.map(serviceNode),
    priority: '0.9',
  };
  const body = [
    `  <section class="content-section">\n${serviceCards()}\n  </section>`,
    `  <section class="content-section">
    <h2>Hizmetler nasıl bir arada yürür?</h2>
    <p>${esc(
      'Risk değerlendirmesi sistemin merkezidir: eğitim planı, acil durum planı ve sağlık gözetimi bu dokümanda tespit edilen risklere göre şekillenir. Bu nedenle hizmetleri ayrı ayrı değil, tek bir takvim üzerinden yürütürüz.'
    )}</p>
    <p>${esc(
      'Sözleşme başlangıcında işyerinizin mevcut belgelerini inceleyip eksik listesi çıkarırız. Ardından yasal sürelerin takvimini kurar, her ziyaret öncesi ve sonrasında yazılı rapor bırakırız.'
    )}</p>
  </section>`,
  ].join('\n\n');
  generated.push({ page, html: renderPage(page, body) });
}

// Hizmet detay sayfaları
for (const s of SERVICES) {
  const page = {
    path: `/hizmetlerimiz/${s.slug}`,
    file: `hizmetlerimiz/${s.slug}.html`,
    h1: s.h1,
    title: s.title,
    description: s.description,
    lead: s.intro,
    ogType: 'article',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/hizmetlerimiz', label: 'Hizmetlerimiz' },
      { href: `/hizmetlerimiz/${s.slug}`, label: s.nav },
    ],
    schema: [serviceNode(s), ...(s.faq ? [faqNode(s.faq)] : [])],
    priority: '0.8',
  };

  const related: Service[] = (s.related ?? []).flatMap((slug) => {
    const found = SERVICES.find((x) => x.slug === slug);
    return found ? [found] : [];
  });

  const body = [
    renderBlocks(s.sections),
    s.faq
      ? `  <section class="content-section">\n    <h2>Sık sorulan sorular</h2>\n${faqList(s.faq)}\n  </section>`
      : '',
    related.length
      ? `  <section class="content-section">
    <h2>İlgili hizmetler</h2>
    <ul class="related-list">
${related.map((r) => `      <li><a href="/hizmetlerimiz/${r.slug}">${esc(r.nav)}</a><span>${esc(r.short)}</span></li>`).join('\n')}
    </ul>
  </section>`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  generated.push({ page, html: renderPage(page, body) });
}

// Diğer içerik sayfaları
for (const p of PAGES) {
  const page = {
    path: `/${p.slug}`,
    file: `${p.slug}.html`,
    h1: p.h1,
    title: p.title,
    description: p.description,
    lead: p.lead,
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: `/${p.slug}`, label: p.h1 },
    ],
    schema: [
      ...(p.faqPage && p.faq ? [faqNode(p.faq)] : []),
      ...(['subelerimiz', 'iletisim', 'gebze-osgb', 'dilovasi-osgb', 'kocaeli-osgb'].includes(p.slug)
        ? BRANCHES.filter((b) =>
            p.slug === 'gebze-osgb' ? b.district === 'Gebze' : p.slug === 'dilovasi-osgb' ? b.district === 'Dilovası' : true
          ).map(branchNode)
        : []),
    ],
    priority: ['iletisim', 'hakkimizda', 'gebze-osgb', 'kocaeli-osgb'].includes(p.slug) ? '0.8' : '0.7',
  };

  const body = p.faqPage && p.faq
    ? `  <section class="content-section">\n${faqList(p.faq)}\n  </section>` +
      (p.blocks ? '\n\n' + renderBlocks(p.blocks) : '')
    : renderBlocks(p.blocks || []);

  generated.push({ page, html: renderPage(page, body) });
}

// KVKK sayfası - metin index.html içindeki mevcut sözleşmeden alınır
{
  const paragraphs = KVKK_PARAGRAFLARI.map(
    (t) => `    <p>${esc(t).replace(/\n/g, '<br>')}</p>`,
  ).join('\n');

  const page = {
    path: '/kvkk',
    file: 'kvkk.html',
    h1: 'Gizlilik ve KVKK Metni',
    title: 'Gizlilik ve KVKK Metni | AKER OSGB',
    description:
      'AKER OSGB gizlilik sözleşmesi ve 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki yükümlülüklere ilişkin metin.',
    lead: '',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/kvkk', label: 'Gizlilik ve KVKK' },
    ],
    schema: [],
    priority: '0.3',
    cta: false,
  };
  generated.push({ page, html: renderPage(page, `  <section class="content-section kvkk-text-block">\n${paragraphs}\n  </section>`) });
}

// 404 sayfası
{
  const page = {
    path: '/404',
    file: '404.html',
    h1: 'Sayfa bulunamadı',
    title: 'Sayfa bulunamadı | AKER OSGB',
    description: 'Aradığınız sayfa bulunamadı. AKER OSGB hizmet sayfalarına buradan ulaşabilirsiniz.',
    lead: 'Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Aşağıdaki bağlantılardan devam edebilirsiniz.',
    breadcrumb: [],
    schema: [],
    noindex: true,
    skipSitemap: true,
  };
  generated.push({ page, html: renderPage(page, `  <section class="content-section">\n    <h2>Hizmetlerimiz</h2>\n${serviceCards()}\n  </section>`) });
}

// ---------------------------------------------------------
// Yazma
// ---------------------------------------------------------
for (const { page, html } of generated) {
  const out = path.join(ROOT, page.file);
  const dir = path.dirname(out);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let finalHtml = html;
  if (page.noindex) finalHtml = finalHtml.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  writeFileSync(out, finalHtml, 'utf8');
  console.log(`yazıldı  ${page.file}`);
}

// ---------------------------------------------------------
// Elle yazılmış sayfalardaki ortak blokları güncelle
// ---------------------------------------------------------
export const MANUAL_PAGES: PageSpec[] = [
  {
    file: 'index.html',
    path: '/',
    title: 'AKER OSGB | Gebze ve Kocaeli Ortak Sağlık ve Güvenlik Birimi',
    description:
      'Gebze, Dilovası ve Kocaeli’de OSGB hizmeti. İş güvenliği uzmanı, işyeri hekimi, risk değerlendirmesi ve İSG eğitimleri. 2012’den beri, dört şubeyle.',
    breadcrumb: [{ href: '/', label: 'Ana Sayfa' }],
    schema: [...BRANCHES.map(branchNode), ...SERVICES.map(serviceNode)],
    priority: '1.0',
  },
  {
    file: 'belgelerimiz.html',
    path: '/belgelerimiz',
    title: 'Belgelerimiz | ISO Yönetim Sistemi Belgeleri | AKER OSGB',
    description:
      'AKER OSGB’nin kalite, iş sağlığı ve güvenliği, çevre ve müşteri memnuniyeti yönetim sistemi belgeleri. Güzeller, Köseler ve Sultanorhan şubeleri.',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/belgelerimiz', label: 'Belgelerimiz' },
    ],
    schema: [],
    priority: '0.6',
  },
  {
    file: 'ekibimiz.html',
    path: '/ekibimiz',
    title: 'Ekibimiz | AKER OSGB Kadrosu',
    description:
      'AKER OSGB yönetim kadrosu ve uzman ekibi. İSG, sağlık, insan kaynakları ve süreç yönetimi birimlerinde görev alan ekibimizle tanışın.',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/ekibimiz', label: 'Ekibimiz' },
    ],
    schema: [],
    priority: '0.6',
  },
  {
    file: 'isbasvuru.html',
    path: '/isbasvuru',
    title: 'İş Başvurusu | AKER OSGB Kariyer',
    description:
      'AKER OSGB açık pozisyonları için iş başvuru formu. Özgeçmişinizi PDF olarak yükleyerek başvurunuzu iletin.',
    breadcrumb: [
      { href: '/', label: 'Ana Sayfa' },
      { href: '/kariyer', label: 'Kariyer' },
      { href: '/isbasvuru', label: 'İş Başvurusu' },
    ],
    schema: [],
    priority: '0.5',
  },
];

function injectBlock(src: string, name: string, content: string): string {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(src)) {
    console.log(`  uyarı: ${name} işareti bulunamadı`);
    return src;
  }
  return src.replace(re, `$1\n${content}\n$2`);
}

// Sayfaya özgü statik içerik blokları
const EXTRA_BLOCKS: Record<string, Record<string, () => string>> = {
  'index.html': {
    'hero-slaytlar': heroSlidesBlock,
    hizmetler: servicesGridBlock,
    haberler: newsGridBlock,
    kariyer: careersGridBlock,
    'iletisim-bilgi': contactInfoBlock,
    musteriler: clientsBlock,
  },
  'belgelerimiz.html': { belgeler: documentsGridBlock },
  'ekibimiz.html': { ekip: teamGridBlock },
  'isbasvuru.html': { 'ilan-detay': jobDetailBlock },
};

for (const page of MANUAL_PAGES) {
  const file = path.join(ROOT, page.file);
  let src = readFileSync(file, 'utf8');
  src = injectBlock(src, 'head', headBlock(page));
  src = injectBlock(src, 'nav', navBlock(page.path));
  src = injectBlock(src, 'footer', footerBlock());
  src = injectBlock(src, 'wpp', whatsappBlock());
  for (const [name, fn] of Object.entries(EXTRA_BLOCKS[page.file] || {})) {
    src = injectBlock(src, name, fn());
  }
  // Betik etiketi işaretli blokların dışında; sürümünü burada güncelle.
  src = src.replace(/\/js\/script\.js(\?v=[0-9a-f]+)?"/g, `${assetUrl('js/script.js')}"`);
  writeFileSync(file, src, 'utf8');
  console.log(`güncellendi  ${page.file}`);
}

// ---------------------------------------------------------
// sitemap.xml
// ---------------------------------------------------------
{
  const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
  const entries = [
    ...MANUAL_PAGES.map((p) => ({ path: p.path, priority: p.priority })),
    ...generated.filter((g) => !g.page.skipSitemap).map((g) => ({ path: g.page.path, priority: g.page.priority || '0.6' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
      (e) => `  <url>
    <loc>${abs(e.path)}</loc>
    <lastmod>${today}</lastmod>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>
`;
  writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`\nsitemap.xml: ${entries.length} adres`);
}
