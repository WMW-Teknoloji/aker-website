// =========================================================
// AKER OSGB - Yönetim Paneli
// =========================================================
// İçerik sunucudaki D1 veri tabanında tutulur. Buradan yapılan
// her değişiklik siteye anında yansır.
//
// Kimlik doğrulama sunucu tarafındadır: şifre Pages secret'ında
// saklanır, giriş başarılı olduğunda HttpOnly oturum çerezi verilir.
// Bu dosyada şifre veya token bulunmaz.
// =========================================================

import { api, ApiError } from './api.ts';
import { byId, escapeAttr, escapeHtml, qs, qsa } from './dom.ts';

type FieldType = 'text' | 'textarea' | 'image';

interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  /** Yeni kayıt formunda alanın başlangıç değeri. */
  varsayilan?: string;
  /** Alanın altında görünen kısa açıklama. */
  ipucu?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'image';
  truncate?: boolean;
}

interface CollectionConfig {
  label: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  /** Tablonun üstünde görünen açıklama. */
  aciklama?: string;
}

interface Kayit {
  id: string;
  [alan: string]: string;
}

interface Basvuru {
  id: string;
  olusturuldu: string;
  careerTitle: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  cvFileName: string;
  cvKey: string;
}

const COLLECTIONS: Record<string, CollectionConfig> = {
  slides: {
    label: 'Ana Sayfa Slider',
    fields: [
      { key: 'image', label: 'Görsel', type: 'image' },
      { key: 'alt', label: 'Görsel açıklaması (alt metni)', type: 'text' },
    ],
    columns: [{ key: 'image', label: '', type: 'image' }],
  },
  clients: {
    label: 'Referanslar',
    fields: [
      { key: 'image', label: 'Logo', type: 'image' },
      { key: 'alt', label: 'Firma adı (görsel alt metni)', type: 'text' },
    ],
    columns: [
      { key: 'image', label: '', type: 'image' },
      { key: 'alt', label: 'Firma' },
    ],
  },
  careers: {
    label: 'Kariyer İlanları',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text' },
      { key: 'text', label: 'Açıklama', type: 'textarea' },
      { key: 'cardImage', label: 'Kart Görseli', type: 'image' },
      { key: 'image', label: 'Detay Görseli', type: 'image' },
    ],
    columns: [
      { key: 'cardImage', label: '', type: 'image' },
      { key: 'title', label: 'Başlık' },
      { key: 'text', label: 'Açıklama', truncate: true },
    ],
  },
  documents: {
    label: 'Belgelerimiz',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text' },
      { key: 'image', label: 'Görsel', type: 'image' },
    ],
    columns: [
      { key: 'image', label: '', type: 'image' },
      { key: 'title', label: 'Başlık' },
    ],
  },
  news: {
    label: 'Bizden Haberler',
    fields: [
      { key: 'title', label: 'Başlık', type: 'text' },
      { key: 'text', label: 'Açıklama', type: 'textarea' },
      { key: 'image', label: 'Görsel', type: 'image' },
      { key: 'link', label: 'Haber Linki (URL)', type: 'text' },
    ],
    columns: [
      { key: 'image', label: '', type: 'image' },
      { key: 'title', label: 'Başlık' },
      { key: 'text', label: 'Açıklama', truncate: true },
    ],
  },
  team: {
    label: 'Ekibimiz',
    fields: [
      { key: 'name', label: 'Ad Soyad', type: 'text' },
      { key: 'role', label: 'Unvan', type: 'text' },
      { key: 'photo', label: 'Fotoğraf', type: 'image' },
    ],
    columns: [
      { key: 'photo', label: '', type: 'image' },
      { key: 'name', label: 'Ad Soyad' },
      { key: 'role', label: 'Unvan' },
    ],
  },
  branches: {
    label: 'Şubeler',
    aciklama:
      'Şubeler sitenin alt kısmında, ana sayfadaki iletişim kutusunda, Şubelerimiz ve İletişim sayfalarında görünür. ' +
      'Gebze ve Dilovası sayfaları yalnızca kendi ilçesindeki şubeleri gösterir. Listedeki ilk şube merkez kabul edilir.',
    fields: [
      { key: 'name', label: 'Şube adı', type: 'text', ipucu: 'Örnek: AKER OSGB TOSB Şubesi' },
      { key: 'street', label: 'Adres', type: 'text', ipucu: 'Mahalle, cadde/sokak ve numara. Örnek: TOSB Otomotiv Mah. 1. Cd. No: 10/1-B' },
      { key: 'district', label: 'İlçe', type: 'text', ipucu: 'Örnek: Çayırova' },
      { key: 'city', label: 'İl', type: 'text', varsayilan: 'Kocaeli' },
      { key: 'postalCode', label: 'Posta kodu', type: 'text', ipucu: 'Bilinmiyorsa boş bırakılabilir.' },
      {
        key: 'maps',
        label: 'Harita bağlantısı',
        type: 'text',
        ipucu: 'Boş bırakılırsa adresten otomatik oluşturulur. Google Haritalar’dan kopyalanan https:// bağlantısı da yapıştırılabilir.',
      },
    ],
    columns: [
      { key: 'name', label: 'Şube' },
      { key: 'street', label: 'Adres' },
      { key: 'district', label: 'İlçe' },
    ],
  },
};

const ORDER_UP_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"></polyline></svg>';
const ORDER_DOWN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

interface Mesaj {
  id: string;
  olusturuldu: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  mail_gitti: number;
}

interface Abone {
  email: string;
  olusturuldu: string;
}

const state: {
  section: string;
  editingId: string | null;
  kayitlar: Kayit[];
  basvurular: Basvuru[];
  mesajlar: Mesaj[];
  aboneler: Abone[];
} = {
  section: 'slides',
  editingId: null,
  kayitlar: [],
  basvurular: [],
  mesajlar: [],
  aboneler: [],
};

document.addEventListener('DOMContentLoaded', () => {
  void baslat();
});

async function baslat(): Promise<void> {
  initLogin();
  initNav();
  initModal();
  initAppDetailModal();

  // Oturum hâlâ geçerliyse doğrudan panele gir.
  try {
    const { oturum } = await api.oturumVarMi();
    if (oturum) {
      showDashboard();
      await renderSection();
    }
  } catch {
    // Oturum sorgusu başarısızsa giriş ekranı gösterilmeye devam eder.
  }
}

// ---------------------------------------------------------
// Giriş / Çıkış
// ---------------------------------------------------------
function initLogin(): void {
  const loginBtn = byId<HTMLButtonElement>('login-btn');
  const userInput = byId<HTMLInputElement>('login-username');
  const passInput = byId<HTMLInputElement>('login-password');
  const errorBox = byId('login-error');
  if (!loginBtn || !passInput || !errorBox) return;

  const dene = async (): Promise<void> => {
    errorBox.textContent = '';
    loginBtn.disabled = true;
    try {
      await api.girisYap(passInput.value);
      passInput.value = '';
      showDashboard();
      await renderSection();
    } catch (err) {
      errorBox.textContent = err instanceof ApiError ? err.message : 'Giriş yapılamadı.';
    } finally {
      loginBtn.disabled = false;
    }
  };

  loginBtn.addEventListener('click', () => void dene());
  for (const input of [userInput, passInput]) {
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') void dene();
    });
  }

  byId('logout-btn')?.addEventListener('click', () => {
    void api.cikisYap().finally(() => location.reload());
  });
}

function showDashboard(): void {
  const login = byId('login-screen');
  const dashboard = byId('admin-dashboard');
  if (login) login.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';
}

function showLogin(mesaj: string): void {
  const login = byId('login-screen');
  const dashboard = byId('admin-dashboard');
  const errorBox = byId('login-error');
  if (login) login.style.display = 'flex';
  if (dashboard) dashboard.style.display = 'none';
  if (errorBox) errorBox.textContent = mesaj;
}

/** Oturum düşmüşse giriş ekranına döner, diğer hataları gösterir. */
function hatayiIsle(err: unknown): void {
  if (err instanceof ApiError && err.status === 401) {
    showLogin('Oturumunuz sona erdi, tekrar giriş yapın.');
    return;
  }
  const content = byId('admin-content');
  const mesaj = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
  if (content) content.innerHTML = `<div class="admin-empty">${escapeHtml(mesaj)}</div>`;
}

// ---------------------------------------------------------
// Gezinme
// ---------------------------------------------------------
function initNav(): void {
  const buttons = qsa<HTMLButtonElement>('.admin-nav-btn');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      for (const other of buttons) other.classList.remove('active');
      btn.classList.add('active');
      state.section = btn.dataset['section'] ?? 'slides';
      void renderSection();
    });
  }
}

// ---------------------------------------------------------
// Bölüm içeriği
// ---------------------------------------------------------
async function renderSection(): Promise<void> {
  const titleEl = byId('admin-section-title');
  const addBtn = byId('add-btn');
  const content = byId('admin-content');
  if (!titleEl || !addBtn || !content) return;

  content.innerHTML = '<div class="admin-empty">Yükleniyor…</div>';

  try {
    if (state.section === 'applications') {
      titleEl.textContent = 'Başvurular';
      addBtn.style.display = 'none';
      const { kayitlar } = await api.listele<Basvuru>('applications');
      state.basvurular = kayitlar;
      renderApplications(content);
      return;
    }

    if (state.section === 'messages') {
      titleEl.textContent = 'İletişim Mesajları';
      addBtn.style.display = 'none';
      const { kayitlar } = await api.listele<Mesaj>('messages');
      state.mesajlar = kayitlar;
      renderMessages(content);
      return;
    }

    if (state.section === 'subscribers') {
      titleEl.textContent = 'Bülten Aboneleri';
      addBtn.style.display = 'none';
      const { kayitlar } = await api.listele<Abone>('subscribers');
      state.aboneler = kayitlar;
      renderSubscribers(content);
      return;
    }

    const config = COLLECTIONS[state.section];
    if (!config) return;

    titleEl.textContent = config.label;
    addBtn.style.display = 'inline-flex';

    const { kayitlar } = await api.listele<Kayit>(state.section);
    state.kayitlar = kayitlar;
    renderTable(content, config);
  } catch (err) {
    hatayiIsle(err);
  }
}

function renderTable(content: HTMLElement, config: CollectionConfig): void {
  const items = state.kayitlar;
  const aciklamaHtml = config.aciklama ? `<p class="admin-section-note">${escapeHtml(config.aciklama)}</p>` : '';
  const countHtml = `${aciklamaHtml}<div class="admin-record-count">Toplam Kayıt Sayısı : ${items.length}</div>`;

  if (items.length === 0) {
    content.innerHTML = `${countHtml}<div class="admin-empty">Henüz içerik eklenmedi.</div>`;
    return;
  }

  const head = config.columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join('');
  const rows = items
    .map((item, index) => {
      const orderCell =
        '<td class="admin-row-order">' +
        `<button class="admin-order-btn" data-action="move-up" data-id="${escapeAttr(item.id)}"${index === 0 ? ' disabled' : ''} aria-label="Yukarı taşı">${ORDER_UP_SVG}</button>` +
        `<button class="admin-order-btn" data-action="move-down" data-id="${escapeAttr(item.id)}"${index === items.length - 1 ? ' disabled' : ''} aria-label="Aşağı taşı">${ORDER_DOWN_SVG}</button>` +
        '</td>';

      const cells = config.columns
        .map((col) => {
          const value = item[col.key] ?? '';
          if (col.type === 'image') return `<td><img class="admin-thumb" src="${escapeAttr(value)}" alt=""></td>`;
          if (col.truncate && value.length > 80) return `<td>${escapeHtml(value.slice(0, 80))}…</td>`;
          return `<td>${escapeHtml(value)}</td>`;
        })
        .join('');

      const actions =
        '<td class="admin-row-actions">' +
        `<button class="admin-icon-btn" data-action="edit" data-id="${escapeAttr(item.id)}">Düzenle</button>` +
        `<button class="admin-icon-btn admin-icon-btn-danger" data-action="delete" data-id="${escapeAttr(item.id)}">Sil</button>` +
        '</td>';

      return `<tr>${orderCell}${cells}${actions}</tr>`;
    })
    .join('');

  content.innerHTML =
    `${countHtml}<table class="admin-table"><thead><tr><th class="admin-order-col"></th>${head}<th></th></tr></thead>` +
    `<tbody>${rows}</tbody></table>`;

  bindRowAction(content, 'move-up', (id) => void tasi(id, -1));
  bindRowAction(content, 'move-down', (id) => void tasi(id, 1));
  bindRowAction(content, 'edit', (id) => openModal(id));
  bindRowAction(content, 'delete', (id) => void silKayit(id));
}

async function tasi(id: string, yon: number): Promise<void> {
  const ids = state.kayitlar.map((k) => k.id);
  const index = ids.indexOf(id);
  const hedef = index + yon;
  if (index === -1 || hedef < 0 || hedef >= ids.length) return;

  [ids[index], ids[hedef]] = [ids[hedef]!, ids[index]!];

  try {
    await api.sirala(state.section, ids);
    await renderSection();
  } catch (err) {
    hatayiIsle(err);
  }
}

async function silKayit(id: string): Promise<void> {
  if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
  try {
    await api.sil(state.section, id);
    await renderSection();
  } catch (err) {
    hatayiIsle(err);
  }
}

function bindRowAction(root: HTMLElement, action: string, handler: (id: string) => void): void {
  for (const btn of qsa<HTMLButtonElement>(`[data-action="${action}"]`, root)) {
    btn.addEventListener('click', () => {
      const id = btn.dataset['id'];
      if (id) handler(id);
    });
  }
}

// ---------------------------------------------------------
// Başvurular
// ---------------------------------------------------------
function renderApplications(content: HTMLElement): void {
  const apps = state.basvurular;
  const countHtml = `<div class="admin-record-count">Toplam Kayıt Sayısı : ${apps.length}</div>`;

  if (apps.length === 0) {
    content.innerHTML = `${countHtml}<div class="admin-empty">Henüz başvuru yok.</div>`;
    return;
  }

  const rows = apps
    .map((app) => {
      const cvCell = app.cvKey
        ? `<a class="admin-cv-link" href="/api/admin/cv/${escapeAttr(app.cvKey)}" target="_blank" rel="noopener">${escapeHtml(app.cvFileName || 'Özgeçmiş')}</a>`
        : escapeHtml(app.cvFileName || '-');

      return (
        '<tr>' +
        `<td>${formatDate(app.olusturuldu)}</td>` +
        `<td>${escapeHtml(app.name)}</td>` +
        `<td>${escapeHtml(app.phone)}</td>` +
        `<td>${escapeHtml(app.email)}</td>` +
        `<td>${escapeHtml(app.careerTitle || '-')}</td>` +
        `<td>${cvCell}</td>` +
        '<td class="admin-row-actions">' +
        `<button class="admin-icon-btn" data-action="view" data-id="${escapeAttr(app.id)}">Detay</button>` +
        `<button class="admin-icon-btn admin-icon-btn-danger" data-action="delete-app" data-id="${escapeAttr(app.id)}">Sil</button>` +
        '</td></tr>'
      );
    })
    .join('');

  content.innerHTML =
    `${countHtml}<table class="admin-table"><thead><tr>` +
    '<th>Tarih</th><th>Ad Soyad</th><th>Telefon</th><th>E-Posta</th><th>İlan</th><th>Özgeçmiş</th><th></th>' +
    `</tr></thead><tbody>${rows}</tbody></table>`;

  bindRowAction(content, 'view', (id) => {
    const app = apps.find((a) => a.id === id);
    if (app) showApplicationDetail(app);
  });

  bindRowAction(content, 'delete-app', (id) => {
    if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return;
    api
      .sil('applications', id)
      .then(() => renderSection())
      .catch(hatayiIsle);
  });
}

// ---------------------------------------------------------
// İletişim mesajları
// ---------------------------------------------------------
function renderMessages(content: HTMLElement): void {
  const mesajlar = state.mesajlar;
  const countHtml = `<div class="admin-record-count">Toplam Kayıt Sayısı : ${mesajlar.length}</div>`;

  if (mesajlar.length === 0) {
    content.innerHTML = `${countHtml}<div class="admin-empty">Henüz mesaj yok.</div>`;
    return;
  }

  const rows = mesajlar
    .map(
      (m) =>
        '<tr>' +
        `<td>${formatDate(m.olusturuldu)}</td>` +
        `<td>${escapeHtml(m.name)}</td>` +
        `<td><a href="tel:${escapeAttr(m.phone)}">${escapeHtml(m.phone)}</a></td>` +
        `<td><a href="mailto:${escapeAttr(m.email)}">${escapeHtml(m.email)}</a></td>` +
        `<td>${escapeHtml(m.message.length > 90 ? `${m.message.slice(0, 90)}…` : m.message)}</td>` +
        `<td>${m.mail_gitti ? 'Gönderildi' : 'Yalnızca kayıt'}</td>` +
        '<td class="admin-row-actions">' +
        `<button class="admin-icon-btn" data-action="view-msg" data-id="${escapeAttr(m.id)}">Detay</button>` +
        `<button class="admin-icon-btn admin-icon-btn-danger" data-action="delete-msg" data-id="${escapeAttr(m.id)}">Sil</button>` +
        '</td></tr>',
    )
    .join('');

  content.innerHTML =
    `${countHtml}<table class="admin-table"><thead><tr>` +
    '<th>Tarih</th><th>Ad Soyad</th><th>Telefon</th><th>E-Posta</th><th>Mesaj</th><th>E-Posta Durumu</th><th></th>' +
    `</tr></thead><tbody>${rows}</tbody></table>`;

  bindRowAction(content, 'view-msg', (id) => {
    const mesaj = mesajlar.find((m) => m.id === id);
    if (mesaj) showMessageDetail(mesaj);
  });

  bindRowAction(content, 'delete-msg', (id) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    api
      .sil('messages', id)
      .then(() => renderSection())
      .catch(hatayiIsle);
  });
}

function showMessageDetail(mesaj: Mesaj): void {
  const body = byId('app-detail-body');
  const modal = byId('app-detail-modal');
  if (!body || !modal) return;

  body.innerHTML =
    `<div class="admin-detail-row"><strong>Tarih:</strong> ${formatDate(mesaj.olusturuldu)}</div>` +
    `<div class="admin-detail-row"><strong>Ad Soyad:</strong> ${escapeHtml(mesaj.name)}</div>` +
    `<div class="admin-detail-row"><strong>Telefon:</strong> <a href="tel:${escapeAttr(mesaj.phone)}">${escapeHtml(mesaj.phone)}</a></div>` +
    `<div class="admin-detail-row"><strong>E-Posta:</strong> <a href="mailto:${escapeAttr(mesaj.email)}">${escapeHtml(mesaj.email)}</a></div>` +
    `<div class="admin-detail-row"><strong>Mesaj:</strong><br>${escapeHtml(mesaj.message)}</div>` +
    `<div class="admin-detail-row"><strong>E-Posta Durumu:</strong> ${mesaj.mail_gitti ? 'Bildirim e-postası gönderildi' : 'Bildirim e-postası gönderilmedi (yalnızca kayıt)'}</div>`;

  modal.style.display = 'flex';
}

// ---------------------------------------------------------
// Bülten aboneleri
// ---------------------------------------------------------
function renderSubscribers(content: HTMLElement): void {
  const aboneler = state.aboneler;
  const ustBilgi =
    `<div class="admin-record-count">Toplam Kayıt Sayısı : ${aboneler.length}` +
    (aboneler.length
      ? ' &nbsp;·&nbsp; <a class="admin-cv-link" href="/api/admin/subscribers/csv">CSV olarak indir</a>'
      : '') +
    '</div>';

  if (aboneler.length === 0) {
    content.innerHTML = `${ustBilgi}<div class="admin-empty">Henüz abone yok.</div>`;
    return;
  }

  const rows = aboneler
    .map(
      (a) =>
        '<tr>' +
        `<td><a href="mailto:${escapeAttr(a.email)}">${escapeHtml(a.email)}</a></td>` +
        `<td>${formatDate(a.olusturuldu)}</td>` +
        '<td class="admin-row-actions">' +
        `<button class="admin-icon-btn admin-icon-btn-danger" data-action="delete-sub" data-id="${escapeAttr(a.email)}">Sil</button>` +
        '</td></tr>',
    )
    .join('');

  content.innerHTML =
    `${ustBilgi}<table class="admin-table"><thead><tr><th>E-Posta</th><th>Kayıt Tarihi</th><th></th></tr></thead>` +
    `<tbody>${rows}</tbody></table>`;

  bindRowAction(content, 'delete-sub', (email) => {
    if (!confirm('Bu aboneyi silmek istediğinize emin misiniz?')) return;
    api
      .sil('subscribers', email)
      .then(() => renderSection())
      .catch(hatayiIsle);
  });
}

function initAppDetailModal(): void {
  byId('app-detail-close')?.addEventListener('click', () => {
    const modal = byId('app-detail-modal');
    if (modal) modal.style.display = 'none';
  });
}

function showApplicationDetail(app: Basvuru): void {
  const body = byId('app-detail-body');
  const modal = byId('app-detail-modal');
  if (!body || !modal) return;

  const cvSatiri = app.cvKey
    ? `<div class="admin-detail-row admin-cv-preview-row">
         <strong>Özgeçmiş:</strong>
         <a class="admin-icon-btn" href="/api/admin/cv/${escapeAttr(app.cvKey)}" target="_blank" rel="noopener">Yeni Sekmede Aç</a>
         <iframe src="/api/admin/cv/${escapeAttr(app.cvKey)}" class="admin-cv-preview-frame" title="Özgeçmiş önizleme"></iframe>
       </div>`
    : '<div class="admin-detail-row"><strong>Özgeçmiş:</strong> yüklenmemiş</div>';

  body.innerHTML =
    `<div class="admin-detail-row"><strong>Tarih:</strong> ${formatDate(app.olusturuldu)}</div>` +
    `<div class="admin-detail-row"><strong>Ad Soyad:</strong> ${escapeHtml(app.name)}</div>` +
    `<div class="admin-detail-row"><strong>Telefon:</strong> ${escapeHtml(app.phone)}</div>` +
    `<div class="admin-detail-row"><strong>E-Posta:</strong> ${escapeHtml(app.email)}</div>` +
    `<div class="admin-detail-row"><strong>İlan:</strong> ${escapeHtml(app.careerTitle || '-')}</div>` +
    `<div class="admin-detail-row"><strong>Mesaj:</strong><br>${escapeHtml(app.message)}</div>` +
    cvSatiri;

  modal.style.display = 'flex';
}

// ---------------------------------------------------------
// Ekle / Düzenle modalı
// ---------------------------------------------------------
function initModal(): void {
  byId('add-btn')?.addEventListener('click', () => openModal(null));
  byId('modal-cancel')?.addEventListener('click', closeModal);
  byId('modal-save')?.addEventListener('click', (event) => {
    event.preventDefault();
    void saveModal();
  });
}

/** Görsel alanının seçilen dosyasını yükleyip yolunu saklar. */
const yuklenenYollar = new Map<string, string>();

function openModal(id: string | null): void {
  const config = COLLECTIONS[state.section];
  if (!config) return;

  state.editingId = id;
  yuklenenYollar.clear();

  const item = id ? state.kayitlar.find((k) => k.id === id) : undefined;

  const titleEl = byId('modal-title');
  const form = byId('admin-form');
  const modal = byId('admin-modal');
  if (!titleEl || !form || !modal) return;

  titleEl.textContent = id ? 'Düzenle' : 'Yeni Ekle';

  form.innerHTML = config.fields
    .map((field) => {
      const value = item ? (item[field.key] ?? '') : (field.varsayilan ?? '');
      const ipucu = field.ipucu ? `<div class="admin-field-ipucu">${escapeHtml(field.ipucu)}</div>` : '';

      if (field.type === 'textarea') {
        return `<div class="admin-field"><label for="alan-${field.key}">${escapeHtml(field.label)}</label><textarea id="alan-${field.key}" name="${field.key}">${escapeHtml(value)}</textarea></div>`;
      }

      if (field.type === 'image') {
        const preview = value
          ? `<img class="admin-image-preview" src="${escapeAttr(value)}" alt="">`
          : '<div class="admin-image-preview admin-image-preview-empty">Görsel yok</div>';
        return (
          `<div class="admin-field" data-image-field="${field.key}">` +
          `<label for="alan-${field.key}">${escapeHtml(field.label)}</label>${preview}` +
          `<input type="file" id="alan-${field.key}" accept="image/*" data-field="${field.key}">` +
          `<input type="hidden" name="${field.key}" value="${escapeAttr(value)}">` +
          '<div class="admin-field-durum"></div></div>'
        );
      }

      return `<div class="admin-field"><label for="alan-${field.key}">${escapeHtml(field.label)}</label><input type="text" id="alan-${field.key}" name="${field.key}" value="${escapeAttr(value)}">${ipucu}</div>`;
    })
    .join('');

  for (const input of qsa<HTMLInputElement>('input[type="file"]', form)) {
    input.addEventListener('change', () => void gorselSec(input));
  }

  modal.style.display = 'flex';
}

async function gorselSec(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  const alan = input.dataset['field'] ?? '';
  const kapsayici = input.closest('.admin-field');
  const durum = kapsayici ? qs('.admin-field-durum', kapsayici) : null;
  if (!file || !kapsayici) return;

  if (durum) durum.textContent = 'Yükleniyor…';

  try {
    const yol = await api.gorselYukle(file);
    yuklenenYollar.set(alan, yol);

    const gizli = qs<HTMLInputElement>(`input[type="hidden"][name="${alan}"]`, kapsayici);
    if (gizli) gizli.value = yol;

    const onizleme = kapsayici.querySelector('.admin-image-preview');
    if (onizleme instanceof HTMLImageElement) {
      onizleme.src = yol;
    } else if (onizleme) {
      const img = document.createElement('img');
      img.className = 'admin-image-preview';
      img.alt = '';
      img.src = yol;
      onizleme.replaceWith(img);
    }

    if (durum) durum.textContent = 'Yüklendi.';
  } catch (err) {
    if (durum) durum.textContent = err instanceof Error ? err.message : 'Yüklenemedi.';
    input.value = '';
  }
}

function closeModal(): void {
  const modal = byId('admin-modal');
  if (modal) modal.style.display = 'none';
}

async function saveModal(): Promise<void> {
  const config = COLLECTIONS[state.section];
  const form = byId('admin-form');
  const saveBtn = byId<HTMLButtonElement>('modal-save');
  if (!config || !form) return;

  const kayit: Record<string, string> = {};
  for (const field of config.fields) {
    const input = qs<HTMLInputElement | HTMLTextAreaElement>(`[name="${field.key}"]`, form);
    kayit[field.key] = yuklenenYollar.get(field.key) ?? input?.value ?? '';
  }

  if (saveBtn) saveBtn.disabled = true;

  try {
    if (state.editingId) await api.guncelle(state.section, state.editingId, kayit);
    else await api.ekle(state.section, kayit);

    closeModal();
    await renderSection();
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      alert(err.message);
    } else {
      hatayiIsle(err);
      closeModal();
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

// ---------------------------------------------------------
function formatDate(isoString: string): string {
  // D1 'YYYY-MM-DD HH:MM:SS' biçiminde UTC döndürür.
  const normalize = isoString.includes('T') ? isoString : `${isoString.replace(' ', 'T')}Z`;
  const date = new Date(normalize);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
