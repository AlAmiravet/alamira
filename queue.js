// Public queue page. Asks the booking script for today's queue and draws it.
// Shows only what the script returns: queue number, status, time slot, animal.
(function () {
  "use strict";
  var D;
  try { D = JSON.parse(document.getElementById("qdata").textContent); } catch (e) { return; }
  var U = D.ui, W = D.words || {};
  var REFRESH_MS = 20000;
  var $ = function (id) { return document.getElementById(id); };
  var debug = /[?&]debug\b/.test(location.search);
  var timer = null, busy = false, lastFetch = 0;

  var DONE = { "done": 1, "no-show": 1, "cancelled": 1 };

  function tr(v) { v = String(v || "").trim(); return W[v] || v; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function label(item) {
    var parts = [tr(item.animalType), String(item.animalName || "").trim()].filter(Boolean);
    return parts.join(" · ");
  }

  function render(rows) {
    var now = [], wait = [];
    rows.forEach(function (r) {
      var s = String(r.status || "").trim().toLowerCase();
      if (DONE[s]) return;
      (s === "in progress" ? now : wait).push(r);
    });

    var nowBox = $("qNow");
    nowBox.textContent = "";
    if (!now.length) nowBox.appendChild(el("p", "qempty", U.noneNow));
    now.forEach(function (r) {
      var c = el("div", "qcard qcard-now");
      c.appendChild(el("span", "qnum ltr", String(r.queue || "–")));
      var t = el("div", "qtxt");
      t.appendChild(el("b", null, label(r) || U.sProg));
      if (r.time) t.appendChild(el("small", null, tr(r.time)));
      c.appendChild(t);
      nowBox.appendChild(c);
    });

    var list = $("qList");
    list.textContent = "";
    $("qCount").textContent = wait.length ? "(" + wait.length + ")" : "";
    $("qStatus").textContent = wait.length ? "" : U.none;
    $("qStatus").hidden = wait.length > 0;
    wait.forEach(function (r, idx) {
      var c = el("li", "qcard");
      c.appendChild(el("span", "qnum ltr", String(r.queue || "–")));
      var t = el("div", "qtxt");
      t.appendChild(el("b", null, label(r) || (String(r.status).toLowerCase() === "confirmed" ? U.sConfirmed : U.sNew)));
      var meta = [];
      if (r.time) meta.push(tr(r.time));
      meta.push(idx + " " + U.ahead);
      t.appendChild(el("small", null, meta.join(" · ")));
      c.appendChild(t);
      list.appendChild(c);
    });

    var d = new Date();
    $("qUpdated").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function fail(err) {
    var s = $("qStatus");
    s.hidden = false;
    s.textContent = U.err + (debug ? " [" + (err && err.message ? err.message : err) + "]" : "");
    s.classList.add("qerr");
  }

  function load() {
    if (busy) return;
    if (!D.scriptUrl) { fail(new Error("scriptUrl is empty in src/site.mjs")); return; }
    busy = true; lastFetch = Date.now();
    var url = D.scriptUrl + (D.scriptUrl.indexOf("?") === -1 ? "?" : "&") + "action=queue&_=" + Date.now();
    fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (txt) {
        var rows;
        try { rows = JSON.parse(txt); } catch (e) {
          throw new Error("not JSON (old deployment or access not 'Anyone'): " + txt.slice(0, 60).replace(/\s+/g, " "));
        }
        if (!Array.isArray(rows)) throw new Error("unexpected reply");
        $("qStatus").classList.remove("qerr");
        render(rows);
      })
      .catch(fail)
      .then(function () { busy = false; });
  }

  function schedule() {
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden) load(); }, REFRESH_MS);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && Date.now() - lastFetch > 5000) load();
  });
  $("qRefresh").addEventListener("click", load);
  load(); schedule();
})();
