import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const svg = await readFile("public/crest.svg", "utf8");
for (const size of [192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
  );
  await page.screenshot({ path: `public/icon-${size}.png` });
}
await browser.close();
