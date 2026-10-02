// =========================================================
// AKER OSGB - Site davranışı
// =========================================================
// Sayfa içerikleri sunucu tarafında (functions/_middleware.ts)
// HTML'e yazılır. Burada yalnızca etkileşim vardır: kaydırıcılar,
// karuseller, iletişim formu ve iş başvurusu formu.
// =========================================================

import { byId, isValidEmail, qs, qsa, showAlert } from './dom.ts';

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeroSwiper();
  initClientsSwiper();
  initCarousels();
  initContactForm();
  initNewsletterForm();
});

// ---------------------------------------------------------
// Mobil menü (hamburger)
// ---------------------------------------------------------
// Görünürlük CSS'te (.navbar.menu-acik); burada yalnızca sınıf ve
// aria-expanded değiştirilir. Bağlantıya tıklayınca, menü dışına
// tıklayınca, Esc ile ve geniş ekrana dönünce menü kapanır.
function initMobileMenu(): void {
  const navbar = qs<HTMLElement>('.navbar');
  const toggle = qs<HTMLButtonElement>('.navbar-toggle');
  const menu = byId('navbar-menu');
  if (!navbar || !toggle || !menu) return;

  const setOpen = (open: boolean): void => {
    navbar.classList.toggle('menu-acik', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };

  toggle.addEventListener('click', () => setOpen(!navbar.classList.contains('menu-acik')));
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (navbar.classList.contains('menu-acik') && !navbar.contains(e.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('menu-acik')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

// ---------------------------------------------------------
// Kaydırıcılar (Swiper)
// ---------------------------------------------------------
function initHeroSwiper(): void {
  const el = qs('.hero-swiper .swiper');
  if (!el || !window.Swiper) return;

  new window.Swiper(el, {
    loop: true,
    effect: 'fade',
    autoplay: { delay: 4000, disableOnInteraction: false },
    pagination: { el: qs('.swiper-pagination', el), clickable: true },
    navigation: {
      nextEl: qs('.swiper-button-next', el),
      prevEl: qs('.swiper-button-prev', el),
    },
  });
}

function initClientsSwiper(): void {
  const el = qs('.clients-swiper .swiper');
  if (!el || !window.Swiper) return;

  new window.Swiper(el, {
    loop: true,
    slidesPerView: 'auto',
    spaceBetween: 30,
    autoplay: { delay: 0, disableOnInteraction: false },
    speed: 4000,
    allowTouchMove: false,
  });
}

// ---------------------------------------------------------
// Haber ve kariyer karusellerindeki ok butonları
// ---------------------------------------------------------
function initCarousels(): void {
  for (const selector of ['.news-carousel', '.careers-carousel']) {
    const carousel = qs(selector);
    if (carousel) setupArrowScroll(carousel);
  }
}

function setupArrowScroll(carousel: HTMLElement): void {
  const grid = qs('[class$="-grid"]', carousel);
  const prev = qs<HTMLButtonElement>('.nav-prev', carousel);
  const next = qs<HTMLButtonElement>('.nav-next', carousel);
  if (!grid || !prev || !next) return;

  // Her tıklama bir kart kaydırır (kart genişliği ekrana göre değişiyor).
  const amount = (): number => {
    const first = grid.firstElementChild;
    if (!first) return 320;
    return first.getBoundingClientRect().width + (parseFloat(getComputedStyle(grid).columnGap) || 0);
  };
  prev.addEventListener('click', () => grid.scrollBy({ left: -amount(), behavior: 'smooth' }));
  next.addEventListener('click', () => grid.scrollBy({ left: amount(), behavior: 'smooth' }));
}

// ---------------------------------------------------------
// İletişim ve başvuru formu
// ---------------------------------------------------------
function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function initContactForm(): void {
  const form = qs('.contact-form-block');
  if (!form) return;

  const basvuruFormu = form.classList.contains('application-form');
  const submitBtn = qs<HTMLButtonElement>('.submit-btn', form);
  const kvkkCheckbox = qs<HTMLInputElement>('#kvkk-check', form);
  const recaptchaCheckbox = qs<HTMLInputElement>('.recaptcha-checkbox', form);
  const alertBox = qs('.form-alert', form);
  const fileInput = qs<HTMLInputElement>('.file-input-wrap input[type="file"]', form);
  const fileLabel = qs('.file-input-label', form);

  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file && !isPdf(file)) {
        fileInput.value = '';
        fileLabel.textContent = 'Özgeçmiş Yükleyin';
        showAlert(alertBox, 'Lütfen özgeçmişinizi yalnızca PDF formatında yükleyin.');
        return;
      }
      fileLabel.textContent = file ? file.name : 'Özgeçmiş Yükleyin';
    });
  }

  function updateSubmitState(): void {
    if (!submitBtn) return;
    const kvkkOk = !kvkkCheckbox || kvkkCheckbox.checked;
    const recaptchaOk = !recaptchaCheckbox || recaptchaCheckbox.checked;
    submitBtn.disabled = !(kvkkOk && recaptchaOk);
  }

  kvkkCheckbox?.addEventListener('change', updateSubmitState);
  recaptchaCheckbox?.addEventListener('change', updateSubmitState);

  initKvkkModal();

  if (!submitBtn) return;

  submitBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (submitBtn.disabled) return;

    const inputs = qsa<HTMLInputElement>('.field-input', form);
    const [nameInput, phoneInput, emailInput] = inputs;
    const messageInput = qs<HTMLTextAreaElement>('.field-textarea', form);

    if (!nameInput || !phoneInput || !emailInput || !messageInput) return;
    if (!nameInput.value || !phoneInput.value || !emailInput.value || !messageInput.value) {
      showAlert(alertBox, 'Lütfen zorunlu alanları doldurun.');
      return;
    }

    const resetForm = (message: string): void => {
      showAlert(alertBox, message);
      for (const input of inputs) input.value = '';
      messageInput.value = '';
      if (fileInput) fileInput.value = '';
      if (fileLabel) fileLabel.textContent = 'Özgeçmiş Yükleyin';
      if (kvkkCheckbox) kvkkCheckbox.checked = false;
      if (recaptchaCheckbox) recaptchaCheckbox.checked = false;
      submitBtn.disabled = true;
    };

    const honeypot = qs<HTMLInputElement>('.hp-field', form);
    const cvFile = fileInput?.files?.[0] ?? null;

    if (basvuruFormu && cvFile && !isPdf(cvFile)) {
      showAlert(alertBox, 'Lütfen özgeçmişinizi yalnızca PDF formatında yükleyin.');
      return;
    }

    submitBtn.disabled = true;

    const istek = basvuruFormu
      ? (() => {
          const gonderi = new FormData();
          gonderi.append('name', nameInput.value);
          gonderi.append('phone', phoneInput.value);
          gonderi.append('email', emailInput.value);
          gonderi.append('message', messageInput.value);
          gonderi.append('careerId', (form as HTMLElement).dataset['careerId'] ?? ilanKimligi());
          gonderi.append('company_website', honeypot?.value ?? '');
          if (cvFile) gonderi.append('cv', cvFile);
          return fetch('/api/basvuru', { method: 'POST', body: gonderi });
        })()
      : fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameInput.value,
            phone: phoneInput.value,
            email: emailInput.value,
            message: messageInput.value,
            company_website: honeypot?.value ?? '',
          }),
        });

    istek
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        return { ok: res.ok, data };
      })
      .then((result) => {
        if (result.ok && result.data.ok) {
          resetForm(basvuruFormu ? 'Başvurunuz alındı.' : 'Mesajınız başarıyla gönderildi.');
        } else {
          showAlert(alertBox, result.data.error ?? 'Bir hata oluştu, lütfen tekrar deneyin.');
          submitBtn.disabled = false;
        }
      })
      .catch(() => {
        showAlert(alertBox, 'Bağlantı hatası, lütfen tekrar deneyin.');
        submitBtn.disabled = false;
      });
  });
}

/** İş başvurusu sayfasındaki ilan kimliği adres çubuğundan okunur. */
function ilanKimligi(): string {
  return new URLSearchParams(window.location.search).get('id') ?? '';
}

function initKvkkModal(): void {
  const link = byId('kvkk-link');
  const modal = byId('kvkk-modal');
  const close = byId('kvkk-modal-close');
  if (!link || !modal || !close) return;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    modal.classList.add('active');
  });

  close.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.classList.remove('active');
  });
}

// ---------------------------------------------------------
// E-posta bülteni
// ---------------------------------------------------------
function initNewsletterForm(): void {
  const emailInput = qs<HTMLInputElement>('.footer-input');
  const subscribeBtn = qs<HTMLButtonElement>('.footer-subscribe-btn');
  const alertBox = qs('.footer-alert');
  if (!emailInput || !subscribeBtn) return;

  emailInput.addEventListener('input', () => {
    subscribeBtn.disabled = !isValidEmail(emailInput.value);
  });

  subscribeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (subscribeBtn.disabled) return;

    subscribeBtn.disabled = true;

    fetch('/api/bulten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        return { ok: res.ok, data };
      })
      .then((result) => {
        if (result.ok && result.data.ok) {
          showAlert(alertBox, 'Bültenimize kaydınız alındı.');
          emailInput.value = '';
        } else {
          showAlert(alertBox, result.data.error ?? 'Kaydedilemedi, lütfen tekrar deneyin.');
          subscribeBtn.disabled = false;
        }
      })
      .catch(() => {
        showAlert(alertBox, 'Bağlantı hatası, lütfen tekrar deneyin.');
        subscribeBtn.disabled = false;
      });
  });
}
