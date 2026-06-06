/* ============================================================
   Masonite — shared site behavior (Blueprint Workshop)
   ============================================================ */
(function () {
  "use strict";

  // palette/font already applied pre-paint by inline head script; keep in sync
  try {
    var p = localStorage.getItem("masonite-palette");
    var f = localStorage.getItem("masonite-font");
    if (p) document.documentElement.setAttribute("data-palette", p);
    if (f) document.documentElement.setAttribute("data-font", f);
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    /* ---- Sticky nav ---- */
    var nav = document.querySelector(".nav");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-stuck", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---- Mobile nav ---- */
    var toggle = document.querySelector(".nav__toggle");
    var mobile = document.querySelector(".nav__mobile");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      mobile.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { mobile.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); });
      });
    }

    /* ---- Announcement dismiss ---- */
    var announce = document.querySelector(".announce");
    var aClose = document.querySelector(".announce__close");
    if (announce && aClose) {
      try { if (localStorage.getItem("masonite-announce-dismissed") === "1") announce.classList.add("is-hidden"); } catch (e) {}
      aClose.addEventListener("click", function () {
        announce.classList.add("is-hidden");
        try { localStorage.setItem("masonite-announce-dismissed", "1"); } catch (e) {}
      });
    }

    /* ---- Code tabs ---- */
    document.querySelectorAll(".codepanel").forEach(function (panel) {
      var tabs = panel.querySelectorAll(".codetab");
      var panes = panel.querySelectorAll(".codepane");
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () {
          tabs.forEach(function (t) { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
          panes.forEach(function (pn) { pn.classList.remove("active"); });
          tab.classList.add("active"); tab.setAttribute("aria-selected", "true");
          if (panes[i]) { panes[i].classList.add("active"); panes[i].classList.add("just-switched"); setTimeout((function (pn) { return function () { pn.classList.remove("just-switched"); }; })(panes[i]), 300); }
        });
      });
    });

    /* ---- Copy buttons (per code body, copies active pane) ---- */
    var COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    document.querySelectorAll(".codebody").forEach(function (body) {
      var btn = document.createElement("button");
      btn.className = "copy-btn"; btn.type = "button"; btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = COPY + "<span>Copy</span>";
      body.appendChild(btn);
      btn.addEventListener("click", function () {
        var pane = body.querySelector(".codepane.active") || body.querySelector(".codepane") || body;
        var pre = pane.querySelector("pre") || pane;
        var text = pre.getAttribute("data-copy") || pre.innerText;
        var done = function () {
          btn.classList.add("is-copied"); btn.innerHTML = CHECK + "<span>Copied!</span>";
          setTimeout(function () { btn.classList.remove("is-copied"); btn.innerHTML = COPY + "<span>Copy</span>"; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
        else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta); done(); }
      });
    });

    /* ---- Footer accordion (mobile) ---- */
    document.querySelectorAll(".fcol").forEach(function (col, i) {
      var head = col.querySelector(".fcol__head");
      if (!head) return;
      if (i === 0) col.classList.add("is-open");
      head.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 640px)").matches) {
          var open = col.classList.toggle("is-open");
          head.setAttribute("aria-expanded", open ? "true" : "false");
        }
      });
    });

    /* ---- Scroll reveal ---- */
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var risers = document.querySelectorAll("[data-rise]");
    if (reduce || !("IntersectionObserver" in window)) {
      risers.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var settle = function (el) { setTimeout(function () { el.classList.add("settled"); }, 1000); };
      document.querySelectorAll(".hero [data-rise]").forEach(function (el, i) {
        el.style.setProperty("--d", (i * 70) + "ms");
        setTimeout(function () { el.classList.add("is-in"); }, 40);
        settle(el);
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); settle(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      risers.forEach(function (el) { if (!el.closest(".hero")) io.observe(el); });
      setTimeout(function () { risers.forEach(function (el) { el.classList.add("is-in"); el.classList.add("settled"); }); }, 2600);
    }
  });
})();
