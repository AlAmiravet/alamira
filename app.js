(function () {
  "use strict";

  /* The page texts live in the HTML itself (one page per language). This script only
     handles the booking form, the copy buttons and the screenshot viewer. The few texts
     it needs come from the JSON block with id "i18n" that the build writes into each page. */
  var I;
  try { I = JSON.parse(document.getElementById("i18n").textContent); } catch (e) { return; }
  var ui = I.ui, staff = I.staff;
  var loadedAt = Date.now();
  var state = null;            /* { kind: "sent" | "error" | "demo", data: {...} } */

  function $(id) { return document.getElementById(id); }

  function longDate(iso) {
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString(I.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return iso; }
  }

  /* Only the fields the visitor filled in, as [label, text] pairs */
  function detailRows(d) {
    var rows = [[ui.fOwner, d.owner], [ui.fPhone, d.phone]];
    if (d.ptype) rows.push([ui.fPtype, ui[d.ptype]]);
    if (d.pname) rows.push([ui.fPname, d.pname]);
    rows.push([ui.fReason, ui[d.reason]]);
    if (d.date) rows.push([ui.fDate, longDate(d.date)]);
    if (d.time) rows.push([ui.fTime, ui[d.time]]);
    if (d.notes) rows.push([ui.fNotes, d.notes]);
    return rows;
  }

  var form = $("bookForm");

  function waLink(d) {
    var msg = ui.waGeneric + "\n" + detailRows(d).map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
    return "https://wa.me/213774090745" + form.getAttribute("data-wa") + "?text=" + encodeURIComponent(msg);
  }

  function renderResult() {
    var box = $("result");
    var d = state.data;
    box.classList.toggle("err", state.kind === "error");
    $("resH").textContent = state.kind === "sent" ? ui.resSentH : state.kind === "error" ? ui.resErrH : ui.resDemoH;
    $("resNote").textContent = state.kind === "sent" ? ui.resSentNote : state.kind === "error" ? ui.resErrNote : ui.resDemoNote;
    var list = $("resList");
    list.textContent = "";
    detailRows(d).forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1];
      list.appendChild(dt); list.appendChild(dd);
    });
    $("resWa").href = waLink(d);
    box.hidden = false;
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* Booking form ------------------------------------------------------ */
  var dateInput = $("f-date");
  var submitBtn = $("submitBtn");
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  dateInput.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

  function val(id) { return $(id).value.trim(); }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var data = {
      owner: val("f-owner"), phone: val("f-phone"), ptype: val("f-ptype"), pname: val("f-pname"),
      reason: val("f-reason"), date: val("f-date"), time: val("f-time"), notes: val("f-notes")
    };
    var endpoint = form.getAttribute("data-endpoint");

    if (!endpoint) {
      state = { kind: "demo", data: data };
      renderResult();
      return;
    }

    /* Option names in the clinic's own language, so the sheet reads consistently */
    var body = new URLSearchParams();
    body.set("owner", data.owner);
    body.set("phone", data.phone);
    body.set("ptype", data.ptype ? staff[data.ptype] : "");
    body.set("pname", data.pname);
    body.set("reason", staff[data.reason]);
    body.set("date", data.date);
    body.set("time", data.time ? staff[data.time] : "");
    body.set("notes", data.notes);
    body.set("lang", I.lang);
    body.set("website", val("f-website"));               /* honeypot, must stay empty */
    body.set("elapsed", String(Date.now() - loadedAt));  /* very fast submits are bots */

    submitBtn.disabled = true;
    submitBtn.textContent = ui.sending;

    /* no-cors: the browser cannot read Google's reply, so success means "the request left this device" */
    fetch(endpoint, { method: "POST", mode: "no-cors", body: body })
      .then(function () {
        state = { kind: "sent", data: data };
        form.reset();
      })
      .catch(function () {
        state = { kind: "error", data: data };
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = ui.submit;
        renderResult();
      });
  });

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
