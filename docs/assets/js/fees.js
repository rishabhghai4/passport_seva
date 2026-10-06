/* Fee calculator. Fee figures are from the official fee structure
   (passportindia.gov.in/psp/onlineHtml/feeDocument), effective 1 July 2026. */
(function () {
  "use strict";

  var section = document.querySelector("[data-fee-calculator]");
  if (!section) return;
  section.hidden = false;

  var TATKAAL_FEE = 2500;
  var PCC_FEE = 750;
  // [service][passport type][pages]
  var FEES = {
    new:     { minor: { 36: 1750 }, adult: { 36: 2500, 60: 3500 } },
    reissue: { minor: { 36: 1750 }, adult: { 36: 2500, 60: 3500 } },
    change:  { minor: { 36: 1750 }, adult: { 36: 2500, 60: 3500 } },
    lost:    { minor: { 36: 4250 }, adult: { 36: 5000, 60: 6000 } }
  };
  var SERVICE_LABELS = {
    new: "a new passport",
    reissue: "a re-issued passport",
    change: "a passport with changed details",
    lost: "a replacement for a lost, stolen or damaged passport"
  };

  var form = section.querySelector("[data-fee-form]");
  var result = section.querySelector("[data-fee-result]");
  var totalEl = section.querySelector("[data-fee-total]");
  var labelEl = section.querySelector("[data-fee-label]");
  var breakdown = section.querySelector("[data-fee-breakdown]");
  var questions = {};
  section.querySelectorAll("[data-q]").forEach(function (el) {
    questions[el.getAttribute("data-q")] = el;
  });

  var inr = function (n) {
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };
  var value = function (name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  };
  var show = function (name, visible) {
    var el = questions[name];
    if (!el || el.hidden === !visible) return;
    el.hidden = !visible;
    if (!visible) {
      el.querySelectorAll("input").forEach(function (i) { i.checked = false; });
    }
  };

  function row(label, amount, isTotal) {
    return '<div class="summary-list__row' + (isTotal ? " summary-list__row--total" : "") + '">' +
      "<dt>" + label + '</dt><dd class="num">' + amount + "</dd></div>";
  }

  function update() {
    var service = value("service");
    var age = value("age");
    var isPcc = service === "pcc";

    show("age", !!service && !isPcc);
    var teen = age === "15-17";
    show("validity", !isPcc && teen);
    var validity = value("validity");
    var adultBooklet = age === "18-60" || age === "61+" || (teen && validity === "10");
    show("pages", !isPcc && adultBooklet);
    var pages = value("pages");
    var minorBooklet = age === "0-8" || age === "9-14" || (teen && validity === "5");
    var bookletChosen = minorBooklet || (adultBooklet && pages);
    show("scheme", !isPcc && !!bookletChosen);
    var scheme = value("scheme");

    var html = "";
    var total = 0;
    var label = "";

    if (isPcc) {
      total = PCC_FEE;
      label = "for a Police Clearance Certificate. There is no Tatkaal option.";
      html = row("Police Clearance Certificate", inr(PCC_FEE)) + row("Total", inr(total), true);
    } else if (service && bookletChosen && scheme) {
      var type = minorBooklet ? "minor" : "adult";
      var p = minorBooklet ? 36 : Number(pages);
      var base = FEES[service][type][p];
      var rebate = service === "new" && (age === "0-8" || age === "61+") ? Math.round(base * 0.1) : 0;
      var tatkaal = scheme === "tatkaal" ? TATKAAL_FEE : 0;
      total = base - rebate + tatkaal;
      var validityText = minorBooklet ? "5 years or until 18" : "10 years";
      label = "for " + SERVICE_LABELS[service] + ", " + p + " pages, valid for " + validityText +
        (tatkaal ? ", under Tatkaal." : ".");
      html = row("Passport fee (" + p + " pages)", inr(base));
      if (rebate) html += row((age === "0-8" ? "Discount for children aged 8 or under" : "Discount for senior citizens") + " (10%)", "− " + inr(rebate));
      if (tatkaal) html += row("Tatkaal fee", inr(tatkaal));
      html += row("Total", inr(total), true);
    }

    if (html) {
      totalEl.textContent = inr(total);
      labelEl.textContent = label;
      breakdown.innerHTML = html;
      result.hidden = false;
    } else {
      result.hidden = true;
    }
  }

  form.addEventListener("change", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  section.querySelector("[data-fee-reset]").addEventListener("click", function () {
    form.reset();
    update();
    var first = form.querySelector('input[name="service"]');
    if (first) first.focus();
  });
  update();
})();
