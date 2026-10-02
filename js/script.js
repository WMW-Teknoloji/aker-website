// Bu dosya src/ altındaki TypeScript kaynaklarından üretilir. Elle düzenlemeyin.
"use strict";
(() => {
  // src/dom.ts
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }
  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }
  function byId(id) {
    return document.getElementById(id);
  }
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  function showAlert(box, message) {
    if (!box) return;
    box.textContent = message;
    box.style.display = "block";
    window.setTimeout(() => {
      box.style.display = "none";
    }, 4e3);
  }

  // src/script.ts
  document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    initHeroSwiper();
    initClientsSwiper();
    initCarousels();
    initContactForm();
    initNewsletterForm();
  });
  function initMobileMenu() {
    const navbar = qs(".navbar");
    const toggle = qs(".navbar-toggle");
    const menu = byId("navbar-menu");
    if (!navbar || !toggle || !menu) return;
    const setOpen = (open) => {
      navbar.classList.toggle("menu-acik", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    };
    toggle.addEventListener("click", () => setOpen(!navbar.classList.contains("menu-acik")));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", (e) => {
      if (navbar.classList.contains("menu-acik") && !navbar.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navbar.classList.contains("menu-acik")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1200px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }
  function initHeroSwiper() {
    const el = qs(".hero-swiper .swiper");
    if (!el || !window.Swiper) return;
    new window.Swiper(el, {
      loop: true,
      effect: "fade",
      autoplay: { delay: 4e3, disableOnInteraction: false },
      pagination: { el: qs(".swiper-pagination", el), clickable: true },
      navigation: {
        nextEl: qs(".swiper-button-next", el),
        prevEl: qs(".swiper-button-prev", el)
      }
    });
  }
  function initClientsSwiper() {
    const el = qs(".clients-swiper .swiper");
    if (!el || !window.Swiper) return;
    new window.Swiper(el, {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 30,
      autoplay: { delay: 0, disableOnInteraction: false },
      speed: 4e3,
      allowTouchMove: false
    });
  }
  function initCarousels() {
    for (const selector of [".news-carousel", ".careers-carousel"]) {
      const carousel = qs(selector);
      if (carousel) setupArrowScroll(carousel);
    }
  }
  function setupArrowScroll(carousel) {
    const grid = qs('[class$="-grid"]', carousel);
    const prev = qs(".nav-prev", carousel);
    const next = qs(".nav-next", carousel);
    if (!grid || !prev || !next) return;
    const amount = () => {
      const first = grid.firstElementChild;
      if (!first) return 320;
      return first.getBoundingClientRect().width + (parseFloat(getComputedStyle(grid).columnGap) || 0);
    };
    prev.addEventListener("click", () => grid.scrollBy({ left: -amount(), behavior: "smooth" }));
    next.addEventListener("click", () => grid.scrollBy({ left: amount(), behavior: "smooth" }));
  }
  function isPdf(file) {
    return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  }
  function initContactForm() {
    const form = qs(".contact-form-block");
    if (!form) return;
    const basvuruFormu = form.classList.contains("application-form");
    const submitBtn = qs(".submit-btn", form);
    const kvkkCheckbox = qs("#kvkk-check", form);
    const recaptchaCheckbox = qs(".recaptcha-checkbox", form);
    const alertBox = qs(".form-alert", form);
    const fileInput = qs('.file-input-wrap input[type="file"]', form);
    const fileLabel = qs(".file-input-label", form);
    if (fileInput && fileLabel) {
      fileInput.addEventListener("change", () => {
        var _a;
        const file = (_a = fileInput.files) == null ? void 0 : _a[0];
        if (file && !isPdf(file)) {
          fileInput.value = "";
          fileLabel.textContent = "Özgeçmiş Yükleyin";
          showAlert(alertBox, "Lütfen özgeçmişinizi yalnızca PDF formatında yükleyin.");
          return;
        }
        fileLabel.textContent = file ? file.name : "Özgeçmiş Yükleyin";
      });
    }
    function updateSubmitState() {
      if (!submitBtn) return;
      const kvkkOk = !kvkkCheckbox || kvkkCheckbox.checked;
      const recaptchaOk = !recaptchaCheckbox || recaptchaCheckbox.checked;
      submitBtn.disabled = !(kvkkOk && recaptchaOk);
    }
    kvkkCheckbox == null ? void 0 : kvkkCheckbox.addEventListener("change", updateSubmitState);
    recaptchaCheckbox == null ? void 0 : recaptchaCheckbox.addEventListener("change", updateSubmitState);
    initKvkkModal();
    if (!submitBtn) return;
    submitBtn.addEventListener("click", (event) => {
      var _a, _b, _c;
      event.preventDefault();
      if (submitBtn.disabled) return;
      const inputs = qsa(".field-input", form);
      const [nameInput, phoneInput, emailInput] = inputs;
      const messageInput = qs(".field-textarea", form);
      if (!nameInput || !phoneInput || !emailInput || !messageInput) return;
      if (!nameInput.value || !phoneInput.value || !emailInput.value || !messageInput.value) {
        showAlert(alertBox, "Lütfen zorunlu alanları doldurun.");
        return;
      }
      const resetForm = (message) => {
        showAlert(alertBox, message);
        for (const input of inputs) input.value = "";
        messageInput.value = "";
        if (fileInput) fileInput.value = "";
        if (fileLabel) fileLabel.textContent = "Özgeçmiş Yükleyin";
        if (kvkkCheckbox) kvkkCheckbox.checked = false;
        if (recaptchaCheckbox) recaptchaCheckbox.checked = false;
        submitBtn.disabled = true;
      };
      const honeypot = qs(".hp-field", form);
      const cvFile = (_b = (_a = fileInput == null ? void 0 : fileInput.files) == null ? void 0 : _a[0]) != null ? _b : null;
      if (basvuruFormu && cvFile && !isPdf(cvFile)) {
        showAlert(alertBox, "Lütfen özgeçmişinizi yalnızca PDF formatında yükleyin.");
        return;
      }
      submitBtn.disabled = true;
      const istek = basvuruFormu ? (() => {
        var _a2, _b2;
        const gonderi = new FormData();
        gonderi.append("name", nameInput.value);
        gonderi.append("phone", phoneInput.value);
        gonderi.append("email", emailInput.value);
        gonderi.append("message", messageInput.value);
        gonderi.append("careerId", (_a2 = form.dataset["careerId"]) != null ? _a2 : ilanKimligi());
        gonderi.append("company_website", (_b2 = honeypot == null ? void 0 : honeypot.value) != null ? _b2 : "");
        if (cvFile) gonderi.append("cv", cvFile);
        return fetch("/api/basvuru", { method: "POST", body: gonderi });
      })() : fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          phone: phoneInput.value,
          email: emailInput.value,
          message: messageInput.value,
          company_website: (_c = honeypot == null ? void 0 : honeypot.value) != null ? _c : ""
        })
      });
      istek.then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      }).then((result) => {
        var _a2;
        if (result.ok && result.data.ok) {
          resetForm(basvuruFormu ? "Başvurunuz alındı." : "Mesajınız başarıyla gönderildi.");
        } else {
          showAlert(alertBox, (_a2 = result.data.error) != null ? _a2 : "Bir hata oluştu, lütfen tekrar deneyin.");
          submitBtn.disabled = false;
        }
      }).catch(() => {
        showAlert(alertBox, "Bağlantı hatası, lütfen tekrar deneyin.");
        submitBtn.disabled = false;
      });
    });
  }
  function ilanKimligi() {
    var _a;
    return (_a = new URLSearchParams(window.location.search).get("id")) != null ? _a : "";
  }
  function initKvkkModal() {
    const link = byId("kvkk-link");
    const modal = byId("kvkk-modal");
    const close = byId("kvkk-modal-close");
    if (!link || !modal || !close) return;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      modal.classList.add("active");
    });
    close.addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.remove("active");
    });
  }
  function initNewsletterForm() {
    const emailInput = qs(".footer-input");
    const subscribeBtn = qs(".footer-subscribe-btn");
    const alertBox = qs(".footer-alert");
    if (!emailInput || !subscribeBtn) return;
    emailInput.addEventListener("input", () => {
      subscribeBtn.disabled = !isValidEmail(emailInput.value);
    });
    subscribeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (subscribeBtn.disabled) return;
      subscribeBtn.disabled = true;
      fetch("/api/bulten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value })
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      }).then((result) => {
        var _a;
        if (result.ok && result.data.ok) {
          showAlert(alertBox, "Bültenimize kaydınız alındı.");
          emailInput.value = "";
        } else {
          showAlert(alertBox, (_a = result.data.error) != null ? _a : "Kaydedilemedi, lütfen tekrar deneyin.");
          subscribeBtn.disabled = false;
        }
      }).catch(() => {
        showAlert(alertBox, "Bağlantı hatası, lütfen tekrar deneyin.");
        subscribeBtn.disabled = false;
      });
    });
  }
})();
