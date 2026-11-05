import { test, expect } from "@playwright/test";
test("first visit opens the doors and all rooms are reachable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "저택의 문 열기" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "저택의 문 열기" }).click();
  await expect(page.locator(".intro")).toHaveClass(/opening/);
  await expect(page.locator(".intro")).toHaveCount(0);
  await page.getByRole("button", { name: "Explore the house" }).click();
  for (const name of [
    "Drawing Room",
    "Owlery",
    "Elena’s Bedroom",
    "Library",
    "Conservatory",
    "Mystery Room",
    "Atelier",
    "Attic",
    "Entrance Hall",
  ]) {
    await page
      .getByRole("dialog")
      .getByRole("button", { name: new RegExp(name) })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      new RegExp(name),
    );
    await page.getByRole("button", { name: "Explore the house" }).click();
  }
  await page.getByRole("button", { name: "닫기" }).click();
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator(".intro")).toHaveCount(0);
});
test("skip and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await expect(page.locator(".intro")).toHaveCount(0);
  await page.getByRole("button", { name: "응접실로 들어가기" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Drawing Room/,
  );
});
test("responsive manor screenshots", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  for (const [w, h] of [
    [390, 844],
    [800, 1280],
    [1280, 800],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.screenshot({
      path: `test-results/manor-${w}.png`,
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});

test("door animation can be skipped while opening, and reduced motion enters immediately", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "저택의 문 열기" }).click();
  await page.getByRole("button", { name: "문 열림 건너뛰기" }).click();
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("ainsworth-house");
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("snapshots", "readwrite");
        tx.objectStore("snapshots").clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("button", { name: "저택의 문 열기" }).click();
  await expect(page.locator(".intro")).toHaveCount(0);
});
