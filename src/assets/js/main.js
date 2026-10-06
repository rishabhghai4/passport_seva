/* Passport Seva — shared behaviour. Progressive enhancement only:
   every page works without JavaScript. */
(function () {
  "use strict";

  var root = document.documentElement;

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) { /* storage blocked: preference lasts for this page only */ }
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    var desktop = window.matchMedia("(min-width: 64em)");
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-collapsed", String(!open));
    };
    var sync = function () {
      if (desktop.matches) {
        toggle.hidden = true;
        nav.removeAttribute("data-collapsed");
      } else {
        toggle.hidden = false;
        setOpen(toggle.getAttribute("aria-expanded") === "true");
      }
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    if (desktop.addEventListener) desktop.addEventListener("change", sync);
    else desktop.addListener(sync);
    sync();
  }

  /* ---------- Text size (GIGW) ---------- */
  var sizeButtons = document.querySelectorAll("[data-text-size]");
  var sizes = ["small", "default", "large", "x-large"];
  function applySize(size) {
    if (sizes.indexOf(size) === -1) size = "default";
    if (size === "default") root.removeAttribute("data-text-size");
    else root.setAttribute("data-text-size", size);
    sizeButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-text-size") === size ||
        (size === "x-large" && b.getAttribute("data-text-size") === "large")));
    });
    store("ps-text-size", size === "default" ? null : size);
  }
  sizeButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var wanted = b.getAttribute("data-text-size");
      var current = root.getAttribute("data-text-size") || "default";
      // A second press of A+ steps up once more.
      if (wanted === "large" && (current === "large" || current === "x-large")) wanted = "x-large";
      applySize(wanted);
    });
  });
  applySize(root.getAttribute("data-text-size") || "default");

  /* ---------- High contrast (GIGW) ---------- */
  var contrast = document.querySelector("[data-contrast-toggle]");
  if (contrast) {
    var syncContrast = function () {
      contrast.setAttribute("aria-pressed", String(root.getAttribute("data-contrast") === "high"));
    };
    contrast.addEventListener("click", function () {
      var on = root.getAttribute("data-contrast") !== "high";
      if (on) root.setAttribute("data-contrast", "high");
      else root.removeAttribute("data-contrast");
      store("ps-contrast", on ? "high" : null);
      syncContrast();
    });
    syncContrast();
  }

  /* ---------- "Is this page useful?" ---------- */
  var feedback = document.querySelector("[data-feedback]");
  if (feedback) {
    var prompt = feedback.querySelector("[data-feedback-prompt]");
    var thanks = feedback.querySelector("[data-feedback-thanks]");
    feedback.querySelectorAll("[data-feedback-answer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var yes = b.getAttribute("data-feedback-answer") === "yes";
        prompt.hidden = true;
        thanks.hidden = false;
        thanks.textContent = yes
          ? "Thank you for your feedback."
          : "Thank you. Use “Report a problem” to tell us what was missing.";
        thanks.setAttribute("tabindex", "-1");
        thanks.focus();
      });
    });
  }

  /* ---------- Accordion: show / hide all ---------- */
  document.querySelectorAll("[data-accordion]").forEach(function (acc) {
    var items = acc.querySelectorAll("details");
    var btn = acc.querySelector("[data-accordion-toggle]");
    if (!btn || !items.length) return;
    btn.hidden = false;
    var label = btn.querySelector("[data-label]");
    var update = function () {
      var allOpen = Array.prototype.every.call(items, function (d) { return d.open; });
      label.textContent = allOpen ? "Hide all sections" : "Show all sections";
      btn.setAttribute("aria-expanded", String(allOpen));
    };
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      items.forEach(function (d) { d.open = open; });
      update();
    });
    items.forEach(function (d) { d.addEventListener("toggle", update); });
    update();
  });

  /* ---------- Saved checklists ---------- */
  document.querySelectorAll("[data-checklist]").forEach(function (list) {
    var key = list.getAttribute("data-checklist");
    var boxes = list.querySelectorAll("input[type=checkbox]");
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { saved = []; }
    boxes.forEach(function (b) {
      b.checked = saved.indexOf(b.value) !== -1;
      b.addEventListener("change", function () {
        var ticked = Array.prototype.filter.call(boxes, function (x) { return x.checked; })
          .map(function (x) { return x.value; });
        store(key, ticked.length ? JSON.stringify(ticked) : null);
      });
    });
    var clear = document.querySelector('[data-checklist-clear="' + key + '"]');
    if (clear) {
      clear.hidden = false;
      clear.addEventListener("click", function () {
        boxes.forEach(function (b) { b.checked = false; });
        store(key, null);
      });
    }
  });

  /* ---------- Print buttons ---------- */
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.hidden = false;
    b.addEventListener("click", function () { window.print(); });
  });
})();
