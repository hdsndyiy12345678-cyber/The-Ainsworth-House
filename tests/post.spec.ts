import { test, expect } from "@playwright/test";
test("post CRUD, image persistence, profiles and keepsakes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "편지 쓰기" }).click();
  await d.getByLabel("제목", { exact: true }).fill("A quiet afternoon");
  await d
    .getByLabel("편지 본문")
    .fill("Dear Harry,\nThe house is lovely.\nElena");
  await d.locator("input[type=file]").setInputFiles("public/icon-192.png");
  await d.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(
    d.getByText("A quiet afternoon", { exact: true }).last(),
  ).toBeVisible();
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  await d.getByRole("button", { name: /임시 보관/ }).click();
  await d.getByRole("button", { name: /A quiet afternoon/ }).click();
  await expect(
    d.getByRole("img", { name: "A quiet afternoon 첨부 이미지" }),
  ).toBeVisible();
  await expect(
    d.getByRole("img", { name: "A quiet afternoon 첨부 이미지" }),
  ).toHaveJSProperty("naturalWidth", 192);
  await d.getByRole("button", { name: "편지 수정" }).click();
  await d.getByLabel("제목", { exact: true }).fill("An autumn letter");
  await d.getByRole("button", { name: "보낸 편지로 기록" }).click();
  await expect(
    d.getByRole("heading", { name: "An autumn letter" }),
  ).toBeVisible();
  await d.getByRole("button", { name: "침실 추억함에 보관" }).click();
  await d.getByRole("button", { name: "필기체 이미지" }).click();
  await expect(
    d.getByRole("img", { name: "필기체로 표시한 편지" }),
  ).toBeVisible();
  await d.getByRole("button", { name: "편지 보관", exact: true }).click();
  await expect(d.getByText("사용자 작성 · 보관됨")).toBeVisible();
  await d.getByRole("button", { name: "편지 삭제" }).click();
  await d.getByRole("button", { name: "삭제 확인" }).click();
  await expect(
    d.getByRole("heading", { name: "An autumn letter" }),
  ).toHaveCount(0);
  await d.getByRole("button", { name: "인물 수첩" }).click();
  await d.getByRole("button", { name: "새 인물 추가" }).click();
  await d.getByLabel("이름", { exact: true }).fill("Luna Lovegood");
  await d.getByRole("button", { name: "인물 저장" }).click();
  await expect(
    d.getByRole("button", { name: /LL Luna Lovegood/ }),
  ).toBeVisible();
});
