// The public queue page ("today's turn"), one per language: /queue/, /fr/queue/, /en/queue/
import { T, OPTION_KEYS } from "./content.mjs";

const IDX = { en: 0, fr: 1, ar: 2 };

const Q = {
  title: ["Today's queue · Al Amira", "File d'attente du jour · Al Amira", "دور اليوم · الأميرة"],
  h: ["Today's queue", "File d'attente du jour", "دور اليوم"],
  lead: ["Find your number to see how many are ahead of you. The list updates by itself.", "Repérez votre numéro pour savoir combien de personnes vous précèdent. La liste se met à jour toute seule.", "ابحث عن رقمك لتعرف كم شخصًا قبلك. تتحدّث القائمة تلقائيًا."],
  back: ["Back to the website", "Retour au site", "العودة إلى الموقع"],
  now: ["Now being seen", "En consultation", "الدور الحالي"],
  waiting: ["Waiting", "En attente", "في الانتظار"],
  none: ["Nobody in the queue right now.", "Personne dans la file pour le moment.", "لا أحد في قائمة الانتظار حاليًا."],
  noneNow: ["No one is being seen at the moment.", "Aucune consultation en cours.", "لا توجد حالة قيد الفحص الآن."],
  number: ["No.", "N°", "رقم"],
  updated: ["Updated", "Mis à jour", "آخر تحديث"],
  refresh: ["Refresh", "Actualiser", "تحديث"],
  loading: ["Loading…", "Chargement…", "جارٍ التحميل…"],
  err: ["Could not load the queue. Please check your connection, or call us.", "Impossible de charger la file. Vérifiez votre connexion ou appelez-nous.", "تعذّر تحميل القائمة. تحقّق من الاتصال أو اتصل بنا."],
  ahead: ["ahead of you", "avant vous", "قبلك"],
  sNew: ["Waiting", "En attente", "في الانتظار"],
  sConfirmed: ["Confirmed", "Confirmé", "مؤكد"],
  sProg: ["In progress", "En cours", "قيد الفحص"],
  privacy: ["Only queue numbers are shown here, never names or phone numbers.", "Seuls les numéros de passage sont affichés, jamais les noms ni les téléphones.", "تُعرض هنا أرقام الدور فقط، دون أسماء أو أرقام هواتف."],
  noScript: ["This page needs JavaScript to show the queue.", "Cette page nécessite JavaScript pour afficher la file.", "تحتاج هذه الصفحة إلى جافاسكربت لعرض القائمة."]
};
const QKEYS = Object.keys(Q);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'self'; object-src 'none'";
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Readex+Pro:wght@300..700&display=swap";

export function renderQueuePage({ lang, site }) {
  const i = IDX[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";
  const q = (k) => esc(Q[k][i]);
  const ap = lang === "ar" ? "../" : "../../";            // up to the site root
  const home = lang === "ar" ? "../" : "../";             // language home: /, /fr/, /en/
  const qp = { ar: `${ap}queue/`, fr: `${ap}fr/queue/`, en: `${ap}en/queue/` };
  const sl = IDX[site.staffLang] ?? 0;

  // The sheet stores animal types and time slots in the clinic's language; show them in the visitor's
  const words = {};
  for (const k of OPTION_KEYS) words[T[k][sl]] = T[k][i];

  const data = {
    lang,
    scriptUrl: site.scriptUrl,
    locale: { en: "en-GB", fr: "fr-FR", ar: "ar-DZ-u-nu-latn" }[lang],
    ui: Object.fromEntries(QKEYS.map((k) => [k, Q[k][i]])),
    words
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const link = (l, label, name) => `<a href="${qp[l]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ""} aria-label="${name}">${label}</a>`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${q("title")}</title>
  <meta name="robots" content="noindex">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#00BCD4">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <link rel="icon" href="${ap}assets/icons/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="${ap}styles.css">
  <link rel="stylesheet" href="${ap}queue.css">
</head>
<body class="qpage">
<div class="bg" aria-hidden="true"><span></span><span></span><span></span><span></span></div>

<header class="top">
  <div class="wrap bar">
    <a class="brand" href="${home}">
      <img src="${ap}assets/icons/logo.svg" width="40" height="40" alt="">
      <span><b>${esc(T.brandName[i])}</b><small>${esc(T.brandSub[i])}</small></span>
    </a>
    <nav class="lang" aria-label="${esc(T.langLabel[i])}">
      ${link("ar", "AR", "العربية")}
      ${link("fr", "FR", "Français")}
      ${link("en", "EN", "English")}
    </nav>
  </div>
</header>

<main class="wrap qmain" id="main">
  <p class="eyebrow">${q("updated")}: <span id="qUpdated" class="ltr">–</span></p>
  <h1>${q("h")}</h1>
  <p class="qlead">${q("lead")}</p>

  <section class="qnow" aria-labelledby="qNowH">
    <h2 id="qNowH">${q("now")}</h2>
    <div id="qNow" class="qnow-list" aria-live="polite"></div>
  </section>

  <section aria-labelledby="qWaitH">
    <h2 id="qWaitH">${q("waiting")} <span id="qCount" class="qcount"></span></h2>
    <p id="qStatus" class="qstatus" role="status">${q("loading")}</p>
    <ol id="qList" class="qlist"></ol>
  </section>

  <div class="qactions">
    <button type="button" class="btn btn-sm" id="qRefresh">${q("refresh")}</button>
    <a class="btn btn-sm btn-ghost" href="${home}">${q("back")}</a>
  </div>
  <p class="qnote">${q("privacy")}</p>
  <noscript><p class="qnote">${q("noScript")}</p></noscript>
</main>

<script type="application/json" id="qdata">${json}</script>
<script src="${ap}queue.js" defer></script>
</body>
</html>
`;
}
