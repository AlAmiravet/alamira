// SETTINGS: the details that are not translated. Edit this file, then publish (see README.md).

export const site = {
  // The address the site will have once published, with no slash at the end. Example:
  //   "https://yourname.github.io/al-amira"   or   "https://www.alamira.com"
  // It is needed for search engines to link the three language pages together.
  // Leave "" until you know it.
  siteUrl: "",

  // Paste the Google Apps Script web app URL here (ends with /exec).
  // While empty, the booking form runs in demo mode and sends nothing.
  scriptUrl: "",

  // WhatsApp number in international format, digits only, plus how to show it on the page.
  whatsapp: "213555000002",
  whatsappDisplay: "0555 00 00 02",

  // Phone number shown on the page, and the same number in international format for the Call button.
  phone: "0555 00 00 00",
  phoneIntl: "+213555000000",

  email: "contact@alamira.example",

  // SAMPLE links: replace with the clinic's own pages.
  facebook: "https://www.facebook.com/",
  maps: "https://www.google.com/maps",

  // Opening times (the day names are in content.mjs).
  hours: { week: "08:30 – 18:00", sat: "09:00 – 13:00" },

  // Language of the labels saved in the clinic's Google Sheet: "en", "fr" or "ar".
  staffLang: "en"
};
