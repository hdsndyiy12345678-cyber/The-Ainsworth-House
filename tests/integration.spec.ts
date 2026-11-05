import { existsSync } from "node:fs";
import { test, expect, chromium } from "@playwright/test";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("backup export, corruption rejection and explicit replacement", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "설정과 백업" }).click();
  const d = page.getByRole("dialog");
  const downloading = page.waitForEvent("download");
  await d.getByRole("button", { name: "JSON 백업 내보내기" }).click();
  const download = await downloading;
  const contents = await readFile((await download.path())!, "utf8");
  expect(JSON.parse(contents).version).toBe(1);
  await d.locator("input[type=file]").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(d.getByRole("alert")).toContainText("지원하지 않는 백업");
  const backup = JSON.parse(contents);
  backup.pet.name = "Backup Fern";
  await d.locator("input[type=file]").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(d.getByText(/현재의 모든 기록을 덮어씁니다/)).toBeVisible();
  await d.getByRole("button", { name: "취소", exact: true }).click();
  await expect(d.getByText(/현재의 모든 기록을 덮어씁니다/)).toHaveCount(0);
  await d.locator("input[type=file]").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await d.getByRole("button", { name: "현재 기록을 덮어쓰고 복원" }).click();
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Drawing Room", exact: true }).click();
  await page
    .getByRole("button", { name: "Backup Fern와 교감하기" })
    .first()
    .click();
  await expect(
    d.getByRole("heading", { name: "Backup Fern", exact: true }),
  ).toBeVisible();
});
test("conservatory, collections, library and atelier are functional", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Conservatory", exact: true }).click();
  await page.getByRole("button", { name: "마법 식물 돌보기" }).first().click();
  let d = page.getByRole("dialog");
  for (let i = 0; i < 3; i++)
    await d.getByRole("button", { name: "물 주고 잎 관찰하기" }).click();
  await d.getByRole("button", { name: "떨어진 잎을 압화로 보관" }).click();
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: "초상화의 비밀" }).first().click();
  await d.getByRole("button", { name: "작은 황동 열쇠 보관" }).click();
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Attic", exact: true }).click();
  await page.getByRole("button", { name: "수집품 상자" }).first().click();
  await expect(d.getByRole("heading", { name: "The brass key" })).toBeVisible();
  await expect(
    d.getByRole("heading", { name: "A pressed fern" }),
  ).toBeVisible();
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Atelier", exact: true }).click();
  await page.getByRole("button", { name: "픽셀 아트 그리기" }).first().click();
  await d.getByRole("button", { name: "1행 1열 픽셀", exact: true }).click();
  await expect(
    d.getByRole("button", { name: "1행 1열 픽셀", exact: true }),
  ).toHaveCSS("background-color", "rgb(83, 103, 71)");
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole("button", { name: "픽셀 아트 그리기" }).first().click();
  await expect(
    d.getByRole("button", { name: "1행 1열 픽셀", exact: true }),
  ).toHaveCSS("background-color", "rgb(83, 103, 71)");
});
test("keyboard, browser back and responsive activity layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "저택의 문 열기" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "인트로 건너뛰기" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Drawing Room", exact: true }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Drawing Room",
  );
  await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "새 일기" })
    .click();
  await page.getByLabel("오늘의 제목").fill("A page in the house");
  for (const [w, h] of [
    [390, 844],
    [800, 1280],
    [1280, 800],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.screenshot({
      path: `test-results/diary-${w}.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const d = page.getByRole("dialog");
    expect(
      await d.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBeTruthy();
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("production shell works after going offline", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:4173");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Entrance Hall",
  );
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Drawing Room", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Drawing Room",
  );
  await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
  await page.getByRole("button", { name: "새 일기" }).click();
  await page.getByLabel("오늘의 제목").fill("Written offline");
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
  await expect(page.getByLabel("오늘의 제목")).toHaveValue("Written offline");
});
test("diary survives a full browser restart", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ainsworth-test-"));
  const opts = {
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  };
  let context = await chromium.launchPersistentContext(dir, opts);
  try {
    let page = await context.newPage();
    await page.goto("http://127.0.0.1:5173");
    await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
    await page.getByRole("button", { name: "방 목록 열기" }).click();
    await page
      .getByRole("button", { name: "Drawing Room", exact: true })
      .click();
    await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
    await page.getByRole("button", { name: "새 일기" }).click();
    await page.getByLabel("오늘의 제목").fill("Tomorrow, too");
    await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
    await context.close();
    context = await chromium.launchPersistentContext(dir, opts);
    page = await context.newPage();
    await page.goto("http://127.0.0.1:5173");
    await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
    await expect(page.getByLabel("오늘의 제목")).toHaveValue("Tomorrow, too");
  } finally {
    await context.close();
    await rm(dir, { recursive: true, force: true });
  }
});
