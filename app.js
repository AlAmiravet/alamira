(function () {
  "use strict";

  /* The page texts live in the HTML itself (one page per language). This script only
     handles the copy buttons and the screenshot viewer. The few texts
     it needs come from the JSON block with id "i18n" that the build writes into each page. */
  var I;
  try { I = JSON.parse(document.getElementById("i18n").textContent); } catch (e) { return; }
  var ui = I.ui;

  function $(id) { return document.getElementById(id); }

  /* Copy buttons ------------------------------------------------------ */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener("click", function () {
      var src = $(btn.getAttribute("data-copy"));
      var text = src.textContent.trim();
      function done() {
        btn.textContent = ui.copied;
        setTimeout(function () { btn.textContent = label; }, 1600);
      }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(src);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      }
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });

  /* Screenshot viewer ------------------------------------------------- */
  var lightbox = $("lightbox");
  lightbox.addEventListener("click", function () { lightbox.close(); });
  document.querySelectorAll("[data-full]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $("lbImg").src = btn.getAttribute("data-full");
      $("lbImg").alt = ui.shotAlt;
      if (lightbox.showModal) lightbox.showModal();
    });
  });
})();

/* Phones: the menu row slides away when you scroll down and comes back when you scroll up. */
(function () {
  "use strict";
  var top = document.querySelector(".top");
  if (!top || !window.matchMedia) return;
  var narrow = window.matchMedia("(max-width: 899px)");
  var last = window.pageYOffset, lock = 0, ticking = false;

  function update() {
    ticking = false;
    var y = window.pageYOffset;
    if (!narrow.matches || y < 80) { top.classList.remove("menu-away"); last = y; return; }
    if (Date.now() < lock) { last = y; return; }
    if (y > last + 12 && !top.classList.contains("menu-away")) { top.classList.add("menu-away"); lock = Date.now() + 450; }
    else if (y < last - 12 && top.classList.contains("menu-away")) { top.classList.remove("menu-away"); lock = Date.now() + 450; }
    if (Math.abs(y - last) > 12) last = y;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
})();