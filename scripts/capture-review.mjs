import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const out = "review/screenshots";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("http://127.0.0.1:5173/#drawing");
await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
const close = () =>
  page.getByRole("dialog").getByRole("button", { name: "닫기" }).click();
await page.getByRole("button", { name: "설정과 백업" }).click();
await page.getByLabel("저택의 시간").selectOption("day");
await close();
await page.locator(".art-plate").evaluate((img) => img.decode());
await page.screenshot({
  path: out + "/drawing-day.png",
  animations: "disabled",
});
await page.getByRole("button", { name: "Explore the house" }).click();
await page.screenshot({ path: out + "/map.png", animations: "disabled" });
await close();
await page.getByRole("button", { name: "일기장 펼치기" }).click();
await page.getByRole("button", { name: "새 일기" }).click();
await page.getByLabel("오늘의 제목").fill("A quiet corner of the house");
await page
  .getByLabel("일기 본문")
  .fill(
    "Dear diary,\nThe rain has made everything quieter.\nI spent the afternoon by the window,\nwith a warm cup of tea and Miso asleep beside me.",
  );
await page.screenshot({ path: out + "/diary.png", animations: "disabled" });
await close();
await page.getByRole("button", { name: "우편함 들여다보기" }).click();
await page
  .getByRole("dialog")
  .getByRole("button", { name: /A little something for your library/ })
  .click();
await page.screenshot({ path: out + "/letter.png", animations: "disabled" });
await close();
await page.getByRole("button", { name: "설정과 백업" }).click();
await page.screenshot({ path: out + "/settings.png", animations: "disabled" });
await page.getByLabel("저택의 시간").selectOption("night");
await close();
await page.locator(".art-plate").evaluate((img) => img.decode());
await page.screenshot({
  path: out + "/drawing-night.png",
  animations: "disabled",
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: out + "/phone.png", animations: "disabled" });
await page.setViewportSize({ width: 800, height: 1280 });
await page.screenshot({
  path: out + "/tablet-portrait.png",
  animations: "disabled",
});
await browser.close();
console.log("Saved real browser screenshots to", out);
