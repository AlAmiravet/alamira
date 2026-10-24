const CONFIG = {
  // Optional: an email address that gets a message for every new request. Leave "" for none.
  NOTIFY_EMAIL: "abdallahjtr@proton.me",

  BOOKINGS_SHEET: "Bookings",
  CLIENTS_SHEET: "Clients",

  // Status choices in the dropdown. Translate or change them as you like.
  STATUSES: ["New", "Confirmed", "Done", "No-show", "Cancelled"],

  // Requests sent faster than this after the page loaded are treated as bots.
  MIN_FORM_SECONDS: 3
};

const BOOKING_HEADERS = ["Received", "Status", "Visit date", "Time", "Owner", "Phone", "Animal type", "Animal name", "Reason", "Notes", "Language"];
const CLIENT_HEADERS = ["Phone", "Owner", "Animals", "Bookings", "First request", "Last request"];

/** Opening the web app URL in a browser only shows this line. It never returns any data. */
function doGet() {
  return ContentService.createTextOutput("Booking inbox is running.");
}

/** Run this once from the editor (Run > setup) to create the sheets and grant permissions. */
function setup() {
  getSheet_(CONFIG.BOOKINGS_SHEET, BOOKING_HEADERS);
  getSheet_(CONFIG.CLIENTS_SHEET, CLIENT_HEADERS);
}

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Bots: the hidden "website" field is filled in, or the form was submitted too fast.
  // Answer "ok" so they learn nothing.
  if (p.website) return ok_();
  if (!(Number(p.elapsed) >= CONFIG.MIN_FORM_SECONDS * 1000)) return ok_();

  const b = {
    owner: clean_(p.owner, 80),
    phone: clean_(p.phone, 30),
    ptype: clean_(p.ptype, 40),
    pname: clean_(p.pname, 60),
    reason: clean_(p.reason, 80),
    date: clean_(p.date, 10),
    time: clean_(p.time, 60),
    notes: clean_(p.notes, 500),
    lang: clean_(p.lang, 2)
  };

  const digits = b.phone.replace(/\D/g, "");
  const valid = b.owner && b.reason &&
    digits.length >= 8 && digits.length <= 15 &&
    (b.date === "" || /^\d{4}-\d{2}-\d{2}$/.test(b.date));
  if (!valid) return ContentService.createTextOutput("invalid");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    addBooking_(b, stamp);
    upsertClient_(b, stamp);
  } finally {
    lock.releaseLock();
  }

  notify_(b);
  return ok_();
}

/* ---------- helpers ---------- */

function ok_() {
  return ContentService.createTextOutput("ok");
}

function clean_(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

/** Same client whether they type 0555..., +213 555... or 00213555... */
function normPhone_(phone) {
  let d = String(phone).replace(/\D/g, "");
  if (d.indexOf("00213") === 0) d = "0" + d.slice(5);
  else if (d.indexOf("213") === 0) d = "0" + d.slice(3);
  return d;
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    const head = sh.getRange(1, 1, 1, headers.length);
    head.setNumberFormat("@");
    head.setValues([headers]);
    head.setFontWeight("bold");
    head.setBackground("#CFF3F9");
    sh.setFrozenRows(1);
    sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), headers.length).createFilter();
  }
  return sh;
}

function nextRow_(sh) {
  const row = sh.getLastRow() + 1;
  if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 200);
  return row;
}

function addBooking_(b, stamp) {
  const sh = getSheet_(CONFIG.BOOKINGS_SHEET, BOOKING_HEADERS);
  const row = nextRow_(sh);
  const rng = sh.getRange(row, 1, 1, BOOKING_HEADERS.length);
  // Plain-text cells: keeps phone numbers' leading zero and stops anything typed
  // into the form from being treated as a spreadsheet formula.
  rng.setNumberFormat("@");
  rng.setValues([[stamp, CONFIG.STATUSES[0], b.date, b.time, b.owner, b.phone, b.ptype, b.pname, b.reason, b.notes, b.lang]]);
  sh.getRange(row, 2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.STATUSES, true).setAllowInvalid(true).build()
  );
}

function upsertClient_(b, stamp) {
  const sh = getSheet_(CONFIG.CLIENTS_SHEET, CLIENT_HEADERS);
  const key = normPhone_(b.phone);
  const last = sh.getLastRow();
  let found = -1;
  let rowData = null;

  if (last > 1) {
    const data = sh.getRange(2, 1, last - 1, CLIENT_HEADERS.length).getValues();
    for (let i = 0; i < data.length; i++) {
      if (normPhone_(data[i][0]) === key) { found = i + 2; rowData = data[i]; break; }
    }
  }

  const formats = [["@", "@", "@", "0", "@", "@"]];
  if (found === -1) {
    const row = nextRow_(sh);
    const rng = sh.getRange(row, 1, 1, CLIENT_HEADERS.length);
    rng.setNumberFormats(formats);
    rng.setValues([[b.phone, b.owner, b.pname, 1, stamp, stamp]]);
  } else {
    const animals = String(rowData[2]).split(", ").filter(function (x) { return x; });
    const known = animals.some(function (x) { return x.toLowerCase() === b.pname.toLowerCase(); });
    if (b.pname && !known) animals.push(b.pname);
    const rng = sh.getRange(found, 1, 1, CLIENT_HEADERS.length);
    rng.setNumberFormats(formats);
    rng.setValues([[rowData[0], b.owner, animals.join(", "), Number(rowData[3] || 0) + 1, rowData[4], stamp]]);
  }
}

function notify_(b) {
  if (!CONFIG.NOTIFY_EMAIL) return;
  try {
    const animal = [b.ptype, b.pname].filter(function (x) { return x; }).join(" - ");
    const when = [b.date, b.time].filter(function (x) { return x; }).join(", ");
    const body = [
      "Owner: " + b.owner,
      "Phone: " + b.phone,
      animal ? "Animal: " + animal : "",
      "Reason: " + b.reason,
      when ? "Preferred: " + when : "",
      b.notes ? "Notes: " + b.notes : ""
    ].filter(function (x) { return x; }).join("\n");
    MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, "New booking request: " + b.owner + (b.pname ? " (" + b.pname + ")" : ""), body);
  } catch (err) {
    // A failed email must never lose the booking that is already saved.
  }
}
