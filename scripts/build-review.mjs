// A real, self-contained copy of the production app; never contains user records.
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const base = resolve("dist");
let html = await readFile(base + "/index.html", "utf8");
const jsPath = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)?.[1];
const cssPath = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)?.[1];
if (!jsPath || !cssPath)
  throw Error("Expected a single production JS and CSS bundle");
const art = {};
for (const f of await readdir(base + "/art"))
  if (f.endsWith(".webp"))
    art[f] =
      "data:image/webp;base64," +
      (await readFile(base + "/art/" + f)).toString("base64");
const code = await readFile(base + jsPath, "utf8");
let css = await readFile(base + cssPath, "utf8");
const fontLicenses = {};
for (const name of await readdir(base + "/fonts")) {
  if (name.endsWith("-OFL.txt"))
    fontLicenses[name] = await readFile(base + "/fonts/" + name, "utf8");
}
// Embed the exact licensed fonts used by the app, including the Korean fallback.
for (const name of await readdir(base + "/fonts")) {
  if (!name.endsWith(".woff")) continue;
  const data =
    "data:font/woff;base64," +
    (await readFile(base + "/fonts/" + name)).toString("base64");
  css = css.split(`/fonts/${name}`).join(data);
}
if (css.includes("/fonts/")) throw Error("A review font was not embedded");
const icon =
  "data:image/png;base64," +
  (await readFile(base + "/icon-192.png")).toString("base64");
html = html
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/, "")
  .replace(/<link[^>]+href="[^"]+\.css"[^>]*>/, "")
  .replace(/<link[^>]+rel="(manifest|icon)"[^>]*>/g, "");
html = html
  .replace(
    "</head>",
    () =>
      `<link rel="icon" href="${icon}"/><script type="application/json" id="ainsworth-font-licenses">${JSON.stringify(fontLicenses).replace(/</g, "\\u003c")}</script><style>${css.replace(/<\/style/gi, "<\\/style")}</style></head>`,
  )
  .replace(
    "</body>",
    () =>
      `<script>window.__AINSWORTH_STANDALONE__=true;window.__AINSWORTH_ASSETS__=${JSON.stringify(art)};</script><script type="module">${code.replace(/<\/script/gi, "<\\/script")}</script></body>`,
  );
const embedded = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
if (embedded !== code.replace(/<\/script/gi, "<\\/script"))
  throw Error("Inline bundle was altered during HTML assembly");
await mkdir("review", { recursive: true });
await writeFile("review/ainsworth-preview.html", html);
console.log(
  `Self-contained review HTML: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB, ${Object.keys(art).length} embedded images; no deployment performed.`,
);
