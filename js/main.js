(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled state + mobile menu ---------- */
  function wireHeader() {
    var header = document.getElementById("siteHeader");
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("siteNav");
    if (!header) return;

    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 24); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !nav) return;
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Scroll reveal (staggered per group) ---------- */
  function wireReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    // Stagger siblings inside the same parent
    var groups = new Map();
    items.forEach(function (el) {
      var p = el.parentElement;
      var i = groups.get(p) || 0;
      el.style.setProperty("--rd", Math.min(i * 0.09, 0.45) + "s");
      groups.set(p, i + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  function wireCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || prefersReducedMotion || !("IntersectionObserver" in window)) return;
    function format(v, d) { return d ? v.toFixed(d).replace(".", ",") : String(Math.round(v)); }
    nums.forEach(function (el) { el.textContent = format(0, Number(el.dataset.decimals || 0)); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.dataset.count);
        var decimals = Number(el.dataset.decimals || 0);
        var start = null, dur = 1600;
        function step(ts) {
          if (!start) start = ts;
          var t = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = format(target * eased, decimals);
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        // Safety net: if rAF gets throttled (background tab), land on the real value anyway
        window.setTimeout(function () { el.textContent = format(target, decimals); }, dur + 300);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Reviews carousel (Greviews_design) ---------- */
  function wireReviewsCarousel() {
    var track = document.getElementById("reviewsTrack");
    var prev = document.getElementById("reviewsPrev");
    var next = document.getElementById("reviewsNext");
    if (!track || !prev || !next) return;

    function cardStep() {
      var card = track.querySelector(".review-card");
      return card ? card.getBoundingClientRect().width + 20 : 320;
    }

    function scrollByCard(direction) {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (direction > 0 && atEnd) {
        track.scrollTo({ left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        return;
      }
      track.scrollBy({
        left: cardStep() * direction,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    }

    prev.addEventListener("click", function () { scrollByCard(-1); stopAutoplay(); });
    next.addEventListener("click", function () { scrollByCard(1); stopAutoplay(); });

    var autoplayId = null;
    function startAutoplay() {
      if (prefersReducedMotion || autoplayId) return;
      autoplayId = window.setInterval(function () { scrollByCard(1); }, 4500);
    }
    function stopAutoplay() {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    ["mouseenter", "focusin", "touchstart"].forEach(function (evt) {
      track.addEventListener(evt, stopAutoplay, { passive: true });
    });
    ["mouseleave", "focusout"].forEach(function (evt) {
      track.addEventListener(evt, startAutoplay, { passive: true });
    });

    startAutoplay();
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireHeader();
    wireReveal();
    wireCounters();
    wireReviewsCarousel();
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
