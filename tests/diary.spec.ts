import { test, expect } from "@playwright/test";
test("diary auto-save, vector drawing, zoom, undo and recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "Drawing Room", exact: true }).click();
  await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
  let d = page.getByRole("dialog");
  await d.getByRole("button", { name: "새 일기" }).click();
  await d.getByLabel("오늘의 제목").fill("Rain at the manor");
  await d
    .getByLabel("일기 본문")
    .fill("Today I found a quiet corner by the fire.");
  await d.locator("input[type=file]").setInputFiles("public/icon-192.png");
  await d.getByRole("button", { name: "손글씨", exact: true }).click();
  let canvas = d.getByLabel("손글씨 캔버스, 펜 또는 손가락으로 쓰기");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 70, { steps: 8 });
  await page.mouse.up();
  await expect(d.getByText(/1획 저장/)).toBeVisible();
  await d.getByLabel("필기 확대").selectOption("2");
  await expect(d.getByText(/1획 저장/)).toBeVisible();
  await d.getByRole("button", { name: "실행 취소" }).click();
  await expect(d.getByText(/0획 저장/)).toBeVisible();
  await d.getByRole("button", { name: "다시 실행" }).click();
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole("button", { name: "일기장 펼치기" }).first().click();
  await expect(d.getByLabel("오늘의 제목")).toHaveValue("Rain at the manor");
  await expect(
    d.getByRole("img", { name: "일기에 첨부한 사진" }),
  ).toHaveJSProperty("naturalWidth", 192);
  await expect(d.getByLabel("일기 본문")).toHaveValue(
    "Today I found a quiet corner by the fire.",
  );
  await d.getByRole("button", { name: "손글씨", exact: true }).click();
  await expect(d.getByText(/1획 저장/)).toBeVisible();
  await d.getByRole("button", { name: "일기를 휴지통으로" }).click();
  await d.getByRole("button", { name: "휴지통 · 복원" }).click();
  await d.getByRole("button", { name: /Rain at the manor/ }).click();
  await d.getByRole("button", { name: "이 일기 복원" }).click();
  await expect(d.getByLabel("오늘의 제목")).toHaveValue("Rain at the manor");
});
test("companion interactions persist after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "Drawing Room", exact: true }).click();
  await page.getByRole("button", { name: "Miso와 교감하기" }).first().click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "먹이 주기" }).click();
  await expect(d.getByRole("progressbar")).toHaveAttribute("value", "16");
  await d.getByRole("button", { name: "먹이 주기" }).click();
  await expect(d.getByRole("progressbar")).toHaveAttribute("value", "16");
  await d.getByLabel("이름", { exact: true }).fill("Fern");
  await d.getByRole("button", { name: "이름 저장" }).click();
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole("button", { name: "Miso와 교감하기" }).first().click();
  await expect(
    d.getByRole("heading", { name: "Fern", exact: true }),
  ).toBeVisible();
  await expect(d.getByRole("progressbar")).toHaveAttribute("value", "16");
});
