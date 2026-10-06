/* Live filter for the Regional Passport Office list. */
(function () {
  "use strict";
  var finder = document.querySelector("[data-finder]");
  var list = document.getElementById("office-list");
  if (!finder || !list) return;
  finder.hidden = false;

  var input = finder.querySelector("input");
  var count = finder.querySelector("[data-finder-count]");
  var empty = document.querySelector("[data-finder-empty]");
  var items = list.querySelectorAll("[data-office]");
  var timer;

  function normalise(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  }

  function filter() {
    var q = normalise(input.value);
    var shown = 0;
    items.forEach(function (li) {
      var match = !q || li.getAttribute("data-office").indexOf(q) !== -1;
      li.hidden = !match;
      if (match) shown++;
    });
    count.textContent = q
      ? shown + (shown === 1 ? " office matches " : " offices match ") + "“" + input.value.trim() + "”"
      : items.length + " Regional Passport Offices";
    empty.hidden = shown !== 0;
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(filter, 150);
  });
  filter();
})();
