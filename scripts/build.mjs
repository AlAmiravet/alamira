// Builds the three language pages from src/. Run with:  node scripts/build.mjs
// The GitHub workflow runs this automatically on every publish.
//
//   index.html      Arabic  (the main address)
//   fr/index.html   French
//   en/index.html   English
//   sitemap.xml, robots.txt   only when siteUrl is set in src/site.mjs
//
// It also lists the images in the screenshots/ folder (png, jpg, jpeg, webp, avif, gif, svg)
// and writes them straight into the pages, and picks the hero image (assets/hero.jpg, .png, ...).

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../src/site.mjs";
import { renderPage } from "../src/template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

/* Natural size of an image, so the page can reserve the right space before it loads. null if unknown. */
export function imageSize(buf, ext) {
  try {
    if (ext === "png") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (ext === "gif") return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
    if (ext === "jpg" || ext === "jpeg") {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (ext === "webp" && buf.toString("ascii", 0, 4) === "RIFF") {
      const kind = buf.toString("ascii", 12, 16);
      if (kind === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (kind === "VP8L") {
        return {
          w: 1 + (((buf[22] & 0x3f) << 8) | buf[21]),
          h: 1 + (((buf[24] & 0x0f) << 10) | (buf[23] << 2) | ((buf[22] & 0xc0) >> 6))
        };
      }
      if (kind === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    }
    if (ext === "svg") {
      const head = buf.toString("utf8", 0, 2000);
      const tag = (head.match(/<svg\b[^>]*>/i) || [""])[0];
      const vb = tag.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
      if (vb) return { w: Math.round(parseFloat(vb[1])), h: Math.round(parseFloat(vb[2])) };
      const w = tag.match(/\swidth\s*=\s*["']([\d.]+)(?:px)?["']/i);
      const h = tag.match(/\sheight\s*=\s*["']([\d.]+)(?:px)?["']/i);
      if (w && h) return { w: Math.round(parseFloat(w[1])), h: Math.round(parseFloat(h[1])) };
    }
  } catch { /* unknown size: the page still works */ }
  return null;
}

export function listScreenshots(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((file) => {
      const ext = extname(file).slice(1).toLowerCase();
      const size = imageSize(readFileSync(join(dir, file)), ext);
      return { file, w: size?.w, h: size?.h };
    });
}

export function pickHero(assetsDir) {
  for (const ext of ["jpg", "jpeg", "png", "webp", "avif", "svg"]) {
    if (existsSync(join(assetsDir, `hero.${ext}`))) return { path: `assets/hero.${ext}`, placeholder: false };
  }
  return { path: "assets/hero-placeholder.svg", placeholder: true };
}

function main() {
  const shots = listScreenshots(join(root, "screenshots"));
  const hero = pickHero(join(root, "assets"));

  const pages = { ar: "index.html", fr: "fr/index.html", en: "en/index.html" };
  for (const [lang, file] of Object.entries(pages)) {
    const out = join(root, file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, renderPage({ lang, site, shots, heroPath: hero.path }));
  }

  const base = site.siteUrl.replace(/\/+$/, "");
  if (base) {
    const urls = { ar: `${base}/`, fr: `${base}/fr/`, en: `${base}/en/` };
    const alt = Object.entries(urls).map(([l, u]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${u}"/>`).join("\n")
      + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urls.ar}"/>`;
    const entries = Object.values(urls).map((u) => `  <url>\n    <loc>${u}</loc>\n${alt}\n  </url>`).join("\n");
    writeFileSync(join(root, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`);
    writeFileSync(join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  }

  console.log(`built: ${Object.values(pages).join(", ")}`);
  console.log(`screenshots: ${shots.length} image(s)${shots.length ? " -> " + shots.map((s) => s.file).join(", ") : ""}`);
  console.log(`hero image: ${hero.path}${hero.placeholder ? " (placeholder, add assets/hero.jpg to replace it)" : ""}`);
  console.log(base ? `site URL: ${base} (sitemap.xml and robots.txt written)` : "site URL: not set (no hreflang / sitemap yet)");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
