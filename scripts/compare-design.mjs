import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 540 } });
const base = "/workspace/design/ainsworth-storybook";
for (const [name, source, actual] of [
  [
    "main",
    base + "/drawing-room-day.png",
    "review/screenshots/drawing-day.png",
  ],
  [
    "diary",
    base + "/screens/diary-writing.png",
    "review/screenshots/diary.png",
  ],
  [
    "letter",
    base + "/screens/owl-post-letter.png",
    "review/screenshots/letter.png",
  ],
  ["map", base + "/screens/manor-map.png", "review/screenshots/map.png"],
]) {
  const a = (await readFile(source)).toString("base64"),
    b = (await readFile(actual)).toString("base64");
  await page.setContent(
    `<style>body{margin:0;background:#e9ddc4;font:14px Georgia;color:#273d34}.pair{display:grid;grid-template-columns:1fr 1fr}.pair>div{width:800px}p{height:30px;margin:0;padding:5px 15px;box-sizing:border-box}img{display:block;width:800px;height:500px;object-fit:contain}</style><div class=pair><div><p>Approved source · ${name}</p><img src="data:image/png;base64,${a}"></div><div><p>Rendered implementation · ${name}</p><img src="data:image/png;base64,${b}"></div></div>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({ path: `review/screenshots/comparison-${name}.png` });
}
// Focused rendering comparison: writing text and book spacing at native scale.
await page.setViewportSize({ width: 1600, height: 460 });
const a = (await readFile(base + "/screens/diary-writing.png")).toString(
    "base64",
  ),
  b = (await readFile("review/screenshots/diary.png")).toString("base64");
await page.setContent(
  `<style>body{margin:0;background:#e9ddc4}.pair{display:flex}.crop{position:relative;overflow:hidden;width:800px;height:460px}.crop img{position:absolute;width:1600px;height:1000px;left:-300px;top:-290px}</style><div class=pair><div class=crop><img src="data:image/png;base64,${a}"></div><div class=crop><img src="data:image/png;base64,${b}"></div></div>`,
);
await page
  .locator("img")
  .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
await page.screenshot({
  path: "review/screenshots/comparison-diary-detail.png",
});
await browser.close();
console.log("Saved combined full-view and focused comparison evidence.");
