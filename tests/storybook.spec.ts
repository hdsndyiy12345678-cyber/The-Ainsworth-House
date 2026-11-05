import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
async function enter(page: any) {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
}
async function go(page: any, name: string) {
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page
    .getByRole("navigation", { name: "저택의 방" })
    .getByRole("button", { name: new RegExp(name) })
    .click();
}
test("all painted rooms, day/night and persistent map in activities", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await enter(page);
  await page.getByRole("button", { name: "설정과 백업" }).click();
  await page.getByLabel("저택의 시간").selectOption("day");
  await page.getByRole("button", { name: "닫기" }).click();
  for (const [name, id] of [
    ["Entrance Hall", "hall"],
    ["Drawing Room", "drawing"],
    ["Owlery", "owlery"],
    ["Bedroom", "bedroom"],
    ["Library", "library"],
    ["Conservatory", "conservatory"],
    ["Mystery Room", "mystery"],
    ["Atelier", "atelier"],
    ["Attic", "attic"],
  ]) {
    await go(page, name);
    await expect(page.locator(".art-plate")).toHaveJSProperty("complete", true);
    await expect(page.locator(".art-plate")).not.toHaveJSProperty(
      "naturalWidth",
      0,
    );
    await page.screenshot({
      path: `test-results/storybook-${id}.png`,
      animations: "disabled",
    });
    expect(
      await page
        .locator(".full-manor")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(1000);
  }
  await go(page, "Drawing Room");
  await page.getByRole("button", { name: "일기장 펼치기" }).click();
  let d = page.getByRole("dialog", { name: "Elena’s Diary" });
  await d.getByRole("button", { name: "새 일기" }).click();
  await d
    .getByLabel("오늘의 제목")
    .fill("Keep this page while looking at the map");
  await d
    .getByRole("button", { name: "저택 지도", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "The Manor Map" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "The Manor Map" })
    .getByRole("button", { name: "닫기" })
    .click();
  await expect(d.getByLabel("오늘의 제목")).toHaveValue(
    "Keep this page while looking at the map",
  );
  await page.screenshot({
    path: "test-results/storybook-diary.png",
    animations: "disabled",
  });
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "설정과 백업" }).click();
  d = page.getByRole("dialog");
  await d.getByLabel("저택의 시간").selectOption("night");
  await d.getByRole("button", { name: "닫기" }).click();
  await expect(page.locator(".art-plate")).toHaveAttribute(
    "src",
    /drawing-night/,
  );
  await page.screenshot({
    path: "test-results/storybook-night.png",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("practice lessons and pixel sketchbooks persist with undo and fill", async ({
  page,
}) => {
  await enter(page);
  await go(page, "Atelier");
  await page.getByRole("button", { name: "픽셀 아트 그리기" }).click();
  let d = page.getByRole("dialog");
  await d.getByRole("button", { name: "채우기", exact: true }).click();
  await d.getByRole("button", { name: "1행 1열 픽셀", exact: true }).click();
  await expect(
    d.getByRole("button", { name: "16행 16열 픽셀", exact: true }),
  ).toHaveCSS("background-color", "rgb(83, 103, 71)");
  await d.getByRole("button", { name: "실행 취소" }).click();
  await expect(
    d.getByRole("button", { name: "16행 16열 픽셀", exact: true }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await d.getByRole("button", { name: "다시 실행" }).click();
  await d.getByRole("button", { name: "새 그림", exact: true }).click();
  await expect(
    d.getByRole("button", { name: "1행 1열 픽셀", exact: true }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(d.getByLabel("내 스케치북")).toHaveValue(/.+/);
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "필기와 커시브 연습" }).click();
  d = page.getByRole("dialog");
  await d.getByRole("button", { name: "단어", exact: true }).click();
  await expect(d.locator(".practice-heading")).toHaveText("Ainsworth");
  await d.getByRole("button", { name: "다음 교본" }).click();
  await expect(d.locator(".practice-heading")).toHaveText("Moonlight");
  await page.screenshot({
    path: "test-results/storybook-practice.png",
    animations: "disabled",
  });
});
test("self-contained review HTML runs without external resources", async ({
  page,
  context,
}) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && r.resourceType() !== "document")
      requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const html = await readFile(resolve("review/ainsworth-preview.html"), "utf8");
  await context.setOffline(true);
  await page.route("**/ainsworth-review.html", (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.route("**/art/**", (route) => route.abort());
  await page.goto("http://127.0.0.1:5173/ainsworth-review.html");
  expect(
    await page.evaluate(async () => {
      const latin = await document.fonts.load(
        '32px "Ainsworth Script"',
        "Ainsworth",
      );
      const korean = await document.fonts.load(
        '32px "Ainsworth Korean"',
        "안녕",
      );
      return (
        latin.length === 1 &&
        korean.length === 1 &&
        [...latin, ...korean].every((f) => f.status === "loaded")
      );
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await go(page, "Drawing Room");
  await expect(page.locator(".art-plate")).toHaveAttribute(
    "src",
    /^data:image\/webp;base64,/,
  );
  await expect(page.locator(".art-plate")).not.toHaveJSProperty(
    "naturalWidth",
    0,
  );
  await page.getByRole("button", { name: "일기장 펼치기" }).click();
  await page.getByRole("button", { name: "새 일기" }).click();
  await page.getByLabel("오늘의 제목").fill("Opened from a real HTML file");
  await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "일기장 펼치기" }).click();
  await expect(page.getByLabel("오늘의 제목")).toHaveValue(
    "Opened from a real HTML file",
  );
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "test-results/standalone-review.png",
    animations: "disabled",
  });
});

test("reply opens a draft addressed to the sender and letter filters remain usable", async ({
  page,
}) => {
  await enter(page);
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  const d = page.getByRole("dialog");
  await d
    .getByRole("button", { name: /A little something for your library/ })
    .click();
  await d.getByRole("button", { name: "답장 쓰기", exact: true }).click();
  await expect(d.getByLabel("수신인")).toHaveValue("hermione");
  await expect(d.getByLabel("제목", { exact: true })).toHaveValue(/^Re:/);
  await d
    .getByLabel("편지 본문")
    .fill(
      "Dear Hermione,\nThank you for thinking of my little conservatory.\nYours, Elena",
    );
  await d.getByRole("button", { name: "임시 저장", exact: true }).click();
  await d.getByRole("button", { name: "편지 찾기", exact: true }).click();
  await d.getByLabel("인물별 대화").selectOption("hermione");
  await d.getByRole("button", { name: /Re: A little something/ }).click();
  await expect(
    d.getByRole("heading", { name: /Re: A little something/ }),
  ).toBeVisible();
});
