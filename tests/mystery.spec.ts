import { test, expect } from "@playwright/test";
test("case can be investigated, resumed and solved with fixed facts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Mystery Room", exact: true }).click();
  await page.getByRole("button", { name: "사건 수사 시작" }).first().click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: /사건 파일 열기/ }).click();
  await d.getByRole("button", { name: "증거 수집", exact: true }).click();
  while (await d.getByRole("button", { name: "이곳 조사하기" }).count())
    await d.getByRole("button", { name: "이곳 조사하기" }).first().click();
  await d.getByRole("button", { name: "용의자와 심문", exact: true }).click();
  while (await d.getByRole("button", { name: "심문하고 진술 기록" }).count())
    await d.getByRole("button", { name: "심문하고 진술 기록" }).first().click();
  await page.waitForTimeout(650);
  await page.reload();
  await page.getByRole("button", { name: "사건 수사 시작" }).first().click();
  await d.getByRole("button", { name: /사건 파일 열기/ }).click();
  await expect(d.getByRole("progressbar")).toHaveAttribute("value", "8");
  await d.getByRole("button", { name: "시간과 알리바이" }).click();
  await expect(
    d.getByText("열쇠 장부가 전시함에 가지 않았다는 진술과 모순됩니다."),
  ).toBeVisible();
  await d.getByRole("button", { name: "추리 보드" }).click();
  await d.getByRole("button", { name: /열쇠 대출 장부/ }).click();
  await d.getByRole("button", { name: /은빛 월장석 가루/ }).click();
  await d.getByRole("button", { name: "선택한 단서 연결" }).click();
  await expect(
    d.getByText(/은빛 월장석 가루 ─── 열쇠 대출 장부/),
  ).toBeVisible();
  await d.getByRole("button", { name: "추론 제출", exact: true }).click();
  await d.getByLabel("누가 가져갔을까요?").selectOption("mara");
  await d
    .getByLabel("수단과 동기")
    .fill("열쇠를 빌려 전시함을 열고 월장석으로 망원경 실험을 했다.");
  await d
    .getByRole("button", { name: "추론 제출", exact: true })
    .last()
    .click();
  await expect(d.getByRole("status")).toContainText("알리바이");
  await d.getByLabel("누가 가져갔을까요?").selectOption("theo");
  await d
    .getByRole("button", { name: "추론 제출", exact: true })
    .last()
    .click();
  await expect(d.getByText("CASE CLOSED")).toBeVisible();
  await d.getByRole("button", { name: "기념 증표를 다락방에 보관" }).click();
  await page.waitForTimeout(650);
  await page.reload();
  await page.getByRole("button", { name: "사건 수사 시작" }).first().click();
  await d.getByRole("button", { name: /해결 기록 다시 읽기/ }).click();
  await d.getByRole("button", { name: "추론 제출", exact: true }).click();
  await expect(d.getByText("CASE CLOSED")).toBeVisible();
});
