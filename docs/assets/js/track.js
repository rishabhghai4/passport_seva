/* Track form: GOV.UK-style validation (error summary + inline errors).
   Without JavaScript the form submits straight to the official tracker. */
(function () {
  "use strict";

  var form = document.querySelector("[data-track-form]");
  if (!form) return;

  var summary = document.querySelector("[data-error-summary]");
  var summaryList = summary.querySelector("[data-error-list]");
  var result = document.querySelector("[data-track-result]");
  var fileInput = document.getElementById("file-number");
  var day = document.getElementById("dob-day");
  var month = document.getElementById("dob-month");
  var year = document.getElementById("dob-year");
  var baseTitle = document.title;

  function setError(fieldName, message, inputs) {
    var group = form.querySelector('[data-field="' + fieldName + '"]');
    var msg = document.getElementById(fieldName + "-error");
    group.classList.toggle("form-group--error", !!message);
    msg.hidden = !message;
    msg.innerHTML = message ? '<span class="visually-hidden">Error: </span>' + message : "";
    inputs.forEach(function (input) {
      var flagged = !!message && (input.flagged !== false);
      input.classList.toggle("input--error", flagged);
      var ids = (input.getAttribute("aria-describedby") || "").split(" ").filter(function (id) {
        return id && id !== msg.id;
      });
      if (message) ids.push(msg.id);
      if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
      else input.removeAttribute("aria-describedby");
      delete input.flagged;
    });
  }

  function validateFile() {
    var value = fileInput.value.replace(/\s+/g, "").toUpperCase();
    fileInput.value = value;
    if (!value) return "Enter your file number";
    if (value.length !== 15) return "File number must be 15 characters";
    if (!/^[A-Z]{2}[A-Z0-9]{13}$/.test(value)) return "File number must start with 2 letters, followed by letters and numbers only";
    return "";
  }

  function validateDob() {
    var d = day.value.trim(), m = month.value.trim(), y = year.value.trim();
    [day, month, year].forEach(function (i) { i.flagged = false; });
    if (!d && !m && !y) { [day, month, year].forEach(function (i) { i.flagged = true; }); return "Enter your date of birth"; }
    var missing = [];
    if (!d) { missing.push("day"); day.flagged = true; }
    if (!m) { missing.push("month"); month.flagged = true; }
    if (!y) { missing.push("year"); year.flagged = true; }
    if (missing.length) return "Date of birth must include a " + missing.join(" and a ");
    if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) {
      [day, month, year].forEach(function (i) { i.flagged = true; });
      return "Date of birth must be a real date, for example 27 3 1990";
    }
    var date = new Date(Number(y), Number(m) - 1, Number(d));
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) {
      [day, month, year].forEach(function (i) { i.flagged = true; });
      return "Date of birth must be a real date";
    }
    if (date > new Date()) {
      [day, month, year].forEach(function (i) { i.flagged = true; });
      return "Date of birth must be in the past";
    }
    if (Number(y) < 1900) { year.flagged = true; return "Year of birth must be 1900 or later"; }
    return "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fileError = validateFile();
    var dobError = validateDob();
    setError("file-number", fileError, [fileInput]);
    setError("dob", dobError, [day, month, year]);

    var errors = [];
    if (fileError) errors.push({ href: "#file-number", text: fileError });
    if (dobError) {
      var first = [day, month, year].filter(function (i) { return i.classList.contains("input--error"); })[0] || day;
      errors.push({ href: "#" + first.id, text: dobError });
    }

    if (errors.length) {
      summaryList.innerHTML = errors.map(function (err) {
        return '<li><a href="' + err.href + '">' + err.text + "</a></li>";
      }).join("");
      summary.hidden = false;
      result.hidden = true;
      document.title = "Error: " + baseTitle;
      summary.focus();
      return;
    }

    summary.hidden = true;
    document.title = baseTitle;
    form.hidden = true;
    result.querySelector("[data-track-file]").textContent = fileInput.value;
    result.hidden = false;
    result.focus();
  });

  // Error summary links move focus to the field without jumping past its label.
  summary.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link) return;
    var input = document.querySelector(link.getAttribute("href"));
    if (!input) return;
    e.preventDefault();
    var group = input.closest(".form-group");
    (group || input).scrollIntoView();
    input.focus({ preventScroll: true });
  });
})();
