/* ==========================================================================
   Lumina Dental — interactions
   ========================================================================== */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header state ---------- */
  const header = $("#header");
  const toTop = $("#toTop");
  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const navToggle = $("#navToggle");
  const navList = $("#navList");
  const navScrim = $("#navScrim");
  const navLinks = $$(".nav__link", navList);

  function setNav(open) {
    if (!navToggle) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (navList) navList.classList.toggle("is-open", open);
    if (navScrim) navScrim.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
  }

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      setNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
  }
  if (navScrim) navScrim.addEventListener("click", () => setNav(false));
  const drawerClose = $(".nav__drawer-close button");
  if (drawerClose) drawerClose.addEventListener("click", () => setNav(false));
  navLinks.forEach((link) =>
    link.addEventListener("click", () => setNav(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setNav(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) setNav(false);
  });

  /* ---------- Scroll spy / active nav link ---------- */
  const sections = ["home", "about", "services", "before-after", "reviews", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + id
            );
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = prefersReducedMotion ? 0 : 1600;
    const start = performance.now();
    const format = (n) => (target >= 1000 ? n.toLocaleString("en-US") : String(n));

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    tick(start);
  }

  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = parseInt(el.dataset.count, 10) + (el.dataset.suffix || "");
    });
  }

  /* ---------- Before / After sliders ---------- */
  const baCards = $$("[data-ba]");

  function setPos(card, pct) {
    pct = Math.max(0, Math.min(100, pct));
    const media = $(".ba-media", card);
    const handle = $(".ba-handle", card);
    if (media) media.style.setProperty("--pos", pct + "%");
    if (handle) {
      handle.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  baCards.forEach((card) => {
    const media = $(".ba-media", card);
    const handle = $(".ba-handle", card);
    if (!media || !handle) return;

    const toPct = (clientX) => {
      const rect = media.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };

    let dragging = false;

    const down = (e) => {
      e.preventDefault();
      dragging = true;
      media.style.cursor = "grabbing";
      setPos(card, toPct(e.clientX));
    };

    const move = (e) => {
      if (!dragging) return;
      setPos(card, toPct(e.clientX));
    };

    const up = () => {
      dragging = false;
      media.style.cursor = "";
    };

    media.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    /* Keyboard support */
    handle.addEventListener("keydown", (e) => {
      let pos = parseFloat(media.style.getPropertyValue("--pos")) || 50;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPos(card, pos - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPos(card, pos + 5);
      } else if (e.key === "Home") {
        e.preventDefault();
        setPos(card, 0);
      } else if (e.key === "End") {
        e.preventDefault();
        setPos(card, 100);
      }
    });

    setPos(card, 50);
  });

  /* ---------- Appointment form ---------- */
  const form = $("#bookingForm");
  const success = $("#bookingSuccess");
  const submitBtn = $("#bookingSubmit");

  const validators = {
    name: (v) => v.trim().length >= 2 || "Please enter your full name",
    phone: (v) =>
      v.replace(/[^\d]/g, "").length >= 7 || "Please enter a valid phone number",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Please enter a valid email address",
    service: (v) => v !== "" || "Please choose a service",
    date: (v) => {
      if (!v) return "Please choose a date";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(v) >= today || "Date must be in the future";
    },
    time: (v) => v !== "" || "Please choose a time slot",
  };

  function validateField(field) {
    const errorEl = field.parentElement.querySelector(".form-error");
    const result = validators[field.name]
      ? validators[field.name](field.value)
      : "";
    const hasError = typeof result === "string" && result.length > 0;
    field.closest(".form-field").classList.toggle("has-error", hasError);
    if (errorEl) errorEl.textContent = hasError ? result : "";
    return !hasError;
  }

  if (form) {
    ["name", "phone", "email", "service", "date", "time"].forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.closest(".form-field").classList.contains("has-error")) {
          validateField(field);
        }
      });
    });

    /* Minimum date = today */
    const dateField = form.elements.date;
    if (dateField) {
      const iso = new Date().toISOString().split("T")[0];
      dateField.min = iso;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = ["name", "phone", "email", "service", "date", "time"];
      const valid = fields
        .map((n) => form.elements[n])
        .filter(Boolean)
        .map(validateField)
        .every(Boolean);

      if (!valid) {
        const firstError = form.querySelector(".has-error input, .has-error select");
        if (firstError) firstError.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      const original = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span> Booking...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.innerHTML = original;

        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        showToast("Appointment requested successfully!");
        form.reset();
      }, 900);
    });

    const againBtn = $("#bookingAgain");
    if (againBtn) {
      againBtn.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        const dateField2 = form.elements.date;
        if (dateField2) {
          const iso = new Date().toISOString().split("T")[0];
          dateField2.min = iso;
        }
      });
    }
  }

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-showing");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-showing"), 4200);
  }

  /* ---------- Back to top ---------- */
  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }
})();
