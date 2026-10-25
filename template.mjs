// The page layout. One template produces all three language pages (see scripts/build.mjs).
import { T, UI_KEYS, OPTION_KEYS } from "./content.mjs";

const IDX = { en: 0, fr: 1, ar: 2 };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'self'; object-src 'none'";
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Readex+Pro:wght@300..700&display=swap";

export function renderPage({ lang, site, shots, heroPath }) {
  const i = IDX[lang];
  const t = (k) => {
    const e = T[k];
    if (!e) throw new Error("Missing text key: " + k);
    return esc(e[i]);
  };
  const dir = lang === "ar" ? "rtl" : "ltr";
  const ap = lang === "ar" ? "" : "../"; // path back to the site root

  // Links between the three language pages
  const pageHref = {
    ar: lang === "ar" ? "./" : "../",
    fr: lang === "fr" ? "./" : lang === "ar" ? "fr/" : "../fr/",
    en: lang === "en" ? "./" : lang === "ar" ? "en/" : "../en/"
  };
  const base = site.siteUrl.replace(/\/+$/, "");
  const absUrl = { ar: base + "/", fr: base + "/fr/", en: base + "/en/" };
  const seoLinks = base
    ? `  <link rel="canonical" href="${esc(absUrl[lang])}">
  <link rel="alternate" hreflang="ar" href="${esc(absUrl.ar)}">
  <link rel="alternate" hreflang="fr" href="${esc(absUrl.fr)}">
  <link rel="alternate" hreflang="en" href="${esc(absUrl.en)}">
  <link rel="alternate" hreflang="x-default" href="${esc(absUrl.ar)}">
`
    : "";

  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(T.waGeneric[i])}`;
  const waAttrs = `href="${esc(waHref)}" target="_blank" rel="noopener noreferrer"`;
  const ext = `target="_blank" rel="noopener noreferrer"`;

  const langLink = (code, label, full) =>
    `<a href="${pageHref[code]}" hreflang="${code}" lang="${code}" aria-label="${full}"${code === lang ? ' aria-current="page"' : ""}>${label}</a>`;

  const option = (k) => `<option value="${k}">${t(k)}</option>`;
  const optional = `<span class="opt">${t("opt")}</span>`;

  const services = [
    ["vaccine", "s1"], ["surgery", "s2"], ["dental", "s3"], ["lab", "s4"], ["livestock", "s5"], ["boarding", "s6"]
  ].map(([icon, s]) =>
    `        <article class="card"><div class="ico"><img src="${ap}assets/icons/${icon}.svg" alt="" width="26" height="26"></div><h3>${t(s + "t")}</h3><p>${t(s + "d")}</p></article>`
  ).join("\n");

  const vacRows = [["age1", "dose1"], ["age2", "dose2"], ["age3", "dose3Rabies"], ["age4", "boosterRabies"]].map(([age, dose]) =>
    `            <tr><th scope="row">${t(age)}</th><td><b class="ltr">DHPP</b><span>${t(dose)}</span></td><td><b class="ltr">FVRCP</b><span>${t(dose)}</span></td></tr>`
  ).join("\n");

  const reviews = shots.length
    ? `
  <section class="sec alt" id="reviews">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">${t("navReviews")}</p>
        <h2>${t("revH")}</h2>
        <p>${t("revLead")}</p>
      </div>
      <div class="shots">
${shots.map((s) => {
  const src = `${ap}screenshots/${encodeURIComponent(s.file)}`;
  const dims = s.w && s.h ? ` width="${s.w}" height="${s.h}"` : "";
  return `        <figure class="shot"><button type="button" data-full="${esc(src)}"><img src="${esc(src)}" alt="${t("shotAlt")}" loading="lazy" decoding="async"${dims}></button></figure>`;
}).join("\n")}
      </div>
    </div>
  </section>
`
    : "";

  // Data the booking script needs: visitor-language texts, plus option names in the clinic's language
  const sl = IDX[site.staffLang] ?? 0;
  const i18n = {
    lang,
    locale: { en: "en-GB", fr: "fr-FR", ar: "ar-DZ-u-nu-latn" }[lang],
    ui: Object.fromEntries([...UI_KEYS, ...OPTION_KEYS].map((k) => [k, T[k][i]])),
    staff: Object.fromEntries(OPTION_KEYS.map((k) => [k, T[k][sl]]))
  };
  const i18nJson = JSON.stringify(i18n).replace(/</g, "\\u003c");

  const queueHref = "queue/";

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${t("metaTitle")}</title>
  <meta name="description" content="${t("metaDesc")}">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#00BCD4">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
${seoLinks}  <link rel="icon" href="${ap}assets/icons/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="${ap}styles.css">
</head>
<body>

<div class="bg" aria-hidden="true"><span></span><span></span><span></span><span></span></div>

<header class="top" id="top">
  <div class="wrap bar">
    <a class="brand" href="#top">
      <img src="${ap}assets/icons/logo.svg" width="40" height="40" alt="">
      <span><b>${t("brandName")}</b><small>${t("brandSub")}</small></span>
    </a>
    <nav class="links" aria-label="${t("navLabel")}">
      <a href="#services">${t("navServices")}</a>
      <a href="#vaccines">${t("navVaccines")}</a>${shots.length ? `
      <a href="#reviews">${t("navReviews")}</a>` : ""}
      <a href="#contact">${t("navContact")}</a>
      <a href="${queueHref}">${t("navQueue")}</a>
    </nav>
    <nav class="lang" aria-label="${t("langLabel")}">
      ${langLink("ar", "AR", "العربية")}
      ${langLink("fr", "FR", "Français")}
      ${langLink("en", "EN", "English")}
    </nav>
    <a class="btn btn-sm" href="#book">${t("navBook")}</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">${t("heroEyebrow")}</p>
        <h1>${t("heroH1")}</h1>
        <p class="lead">${t("heroLead")}</p>
        <div class="cta-row">
          <a class="btn" href="#book">${t("heroBook")}</a>
          <a class="btn btn-ghost" ${waAttrs}><img class="ic" src="${ap}assets/icons/whatsapp.svg" alt="" width="20" height="20"><span>${t("heroWa")}</span></a>
        </div>
      </div>
      <div class="hero-art">
        <img src="${ap}${esc(heroPath)}" alt="${t("heroAlt")}" fetchpriority="high" decoding="async">
      </div>
    </div>
  </section>

  <section class="sec alt" id="services">
    <div class="wrap">
      <div class="sec-head">
        <p class="eyebrow">${t("navServices")}</p>
        <h2>${t("servicesH")}</h2>
        <p>${t("servicesLead")}</p>
      </div>
      <div class="grid">
${services}
      </div>
    </div>
  </section>

  <section class="sec" id="vaccines">
    <div class="wrap vac">
      <div>
        <div class="sec-head">
          <p class="eyebrow">${t("navVaccines")}</p>
          <h2>${t("vacH")}</h2>
          <p>${t("vacLead")}</p>
        </div>
        <p class="note">${t("vacNote")}</p>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>${t("vacAge")}</th><th>${t("vacDog")}</th><th>${t("vacCat")}</th></tr></thead>
          <tbody>
${vacRows}
          </tbody>
        </table>
      </div>
    </div>
  </section>
${reviews}
  <section class="sec" id="book">
    <div class="wrap book">
      <div>
        <div class="sec-head">
          <p class="eyebrow">${t("navBook")}</p>
          <h2>${t("bookH")}</h2>
          <p>${t("bookLead")}</p>
        </div>
        <a class="btn btn-ghost" ${waAttrs}><img class="ic" src="${ap}assets/icons/whatsapp.svg" alt="" width="20" height="20"><span>${t("heroWa")}</span></a>
      </div>
      <form class="form" id="bookForm" autocomplete="on" data-endpoint="${esc(site.scriptUrl)}" data-wa="${esc(site.whatsapp)}">
        <label class="field" for="f-owner"><span>${t("fOwner")}</span><input id="f-owner" name="owner" type="text" autocomplete="name" maxlength="80" required></label>
        <label class="field" for="f-phone"><span>${t("fPhone")}</span><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" dir="ltr" maxlength="30" pattern="[0-9+ ]{8,30}" required></label>
        <label class="field" for="f-ptype"><span>${t("fPtype")} ${optional}</span>
          <select id="f-ptype" name="ptype">
            <option value="">${t("sel")}</option>
            ${["pDog", "pCat", "pBird", "pRabbit", "pHorse", "pCow", "pCamel", "pSheep", "pGoat", "pOther"].map(option).join("\n            ")}
          </select></label>
        <label class="field" for="f-pname"><span>${t("fPname")} ${optional}</span><input id="f-pname" name="pname" type="text" maxlength="60"></label>
        <label class="field full" for="f-reason"><span>${t("fReason")}</span>
          <select id="f-reason" name="reason" required>
            <option value="">${t("sel")}</option>
            ${["rCheck", "rVacc", "rSurg", "rDent", "rSick"].map(option).join("\n            ")}
          </select></label>
        <label class="field" for="f-date"><span>${t("fDate")} ${optional}</span><input id="f-date" name="date" type="date"></label>
        <label class="field" for="f-time"><span>${t("fTime")} ${optional}</span>
          <select id="f-time" name="time">
            <option value="">${t("sel")}</option>
            ${["tmAm", "tmPm", "tmEve"].map(option).join("\n            ")}
          </select></label>
        <label class="field full" for="f-notes"><span>${t("fNotes")} ${optional}</span><textarea id="f-notes" name="notes" maxlength="500"></textarea></label>
        <div class="hp" aria-hidden="true"><label for="f-website">Website<input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
        <div class="full">
          <button class="btn" id="submitBtn" type="submit">${t("submit")}</button>
          <p class="privacy">${t("privacy")}</p>
        </div>
        <div class="result" id="result" role="status" aria-live="polite" hidden>
          <h3 id="resH"></h3>
          <dl id="resList"></dl>
          <p class="note flush" id="resNote"></p>
          <div class="actions">
            <a class="btn btn-ghost btn-sm" id="resWa" ${waAttrs}>${t("waSend")}</a>
          </div>
        </div>
      </form>
    </div>
  </section>

  <section class="sec alt" id="contact">
    <div class="wrap contact">
      <div>
        <div class="sec-head">
          <p class="eyebrow">${t("navContact")}</p>
          <h2>${t("contactH")}</h2>
          <p>${t("contactLead")}</p>
        </div>
        <h3 class="place"><a href="${esc(site.maps)}" ${ext}><img src="${ap}assets/icons/maps.svg" alt="" width="28" height="28"><span>${esc(site.location)}</span></a></h3>
        <div class="info">
          <div class="info-row"><span class="k">${t("cPhone")}</span><span class="v ltr" id="ph1">${esc(site.phone)}</span>
            <span class="acts"><a href="tel:${esc(site.phoneIntl)}">${t("callLink")}</a><button class="btn-text" type="button" data-copy="ph1">${t("copy")}</button></span></div>
          <div class="info-row"><span class="k">WhatsApp</span><span class="v ltr" id="ph3">${esc(site.whatsappDisplay)}</span>
            <span class="acts"><a ${waAttrs}>${t("openChat")}</a><button class="btn-text" type="button" data-copy="ph3">${t("copy")}</button></span></div>
        </div>
        <div class="social">
          <a class="soc" ${waAttrs}><img src="${ap}assets/icons/whatsapp.svg" alt="" width="24" height="24"><span>WhatsApp</span></a>
          <a class="soc" href="${esc(site.facebook)}" ${ext}><img src="${ap}assets/icons/facebook.svg" alt="" width="24" height="24"><span>Facebook</span></a>
          <a class="soc" href="${esc(site.maps)}" ${ext}><img src="${ap}assets/icons/maps.svg" alt="" width="24" height="24"><span>${t("mapsLabel")}</span></a>
        </div>
      </div>
      <div class="hours">
        <h3>${t("hoursH")}</h3>
        <div class="r"><span>${t("dWeek")}</span><span class="ltr">${esc(site.hours.open)}</span></div>
        <div class="r"><span>${t("dFri")}</span><span>${t("hFri")}</span></div>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap foot">
    <span>${t("footer")}</span>
    <a class="foot-queue" href="${queueHref}">${t("navQueue")}</a>
    <div class="foot-icons">
      <a ${waAttrs} aria-label="WhatsApp"><img src="${ap}assets/icons/whatsapp.svg" alt="" width="24" height="24"></a>
      <a href="${esc(site.facebook)}" ${ext} aria-label="Facebook"><img src="${ap}assets/icons/facebook.svg" alt="" width="24" height="24"></a>
      <a href="${esc(site.maps)}" ${ext} aria-label="${t("mapsLabel")}"><img src="${ap}assets/icons/maps.svg" alt="" width="24" height="24"></a>
    </div>
  </div>
</footer>

<div class="dock">
  <a class="btn" ${waAttrs}><img class="ic ic-white" src="${ap}assets/icons/whatsapp.svg" alt="" width="20" height="20"><span>${t("heroWa")}</span></a>
  <a class="btn btn-ghost" href="tel:${esc(site.phoneIntl)}"><img class="ic" src="${ap}assets/icons/phone.svg" alt="" width="20" height="20"><span>${t("callLink")}</span></a>
</div>

<dialog id="lightbox">
  <img id="lbImg" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
  <button type="button" class="lb-close" id="lbClose">${t("close")}</button>
</dialog>

<script type="application/json" id="i18n">${i18nJson}</script>
<script src="${ap}app.js" defer></script>
</body>
</html>
`;
}
