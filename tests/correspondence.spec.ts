import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
async function openMail(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "인트로 건너뛰기" }).click();
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
}
async function writeLetter(page: Page) {
  const d = page.getByRole("dialog");
  await d
    .getByRole("button", { name: /A little something for your library/ })
    .click();
  await d.getByRole("button", { name: "답장 쓰기", exact: true }).click();
  await d
    .getByLabel("편지 본문")
    .fill(
      "Dear Hermione,\nThe conservatory smells of lavender. How is your garden?\nYours, Elena",
    );
  await d.getByRole("button", { name: "보낸 편지로 기록" }).click();
}
async function connect(page: Page) {
  await page.getByText("AI 우편 연결", { exact: true }).click();
  await page.getByLabel("연결 암호", { exact: true }).fill("test-access-code");
  await page.getByRole("button", { name: "연결 확인", exact: true }).click();
  await expect(page.getByText(/연결됨 ·/)).toBeVisible();
}
test("licensed script fonts load for letters and lessons; smaller map and readable markers", async ({
  page,
}) => {
  await openMail(page);
  const d = page.getByRole("dialog");
  await d
    .getByRole("button", { name: /A little something for your library/ })
    .click();
  await expect(
    d.getByRole("button", { name: "필기체 이미지" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(d.locator(".handwriting")).toHaveCSS(
    "font-family",
    /Ainsworth Script/,
  );
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
  await page.screenshot({
    path: "test-results/cursive-letter.png",
    fullPage: true,
    animations: "disabled",
  });
  await d.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page.getByRole("button", { name: "Atelier", exact: true }).click();
  await page.getByRole("button", { name: "필기와 커시브 연습" }).click();
  await expect(d.locator(".ink-guide")).toHaveCSS(
    "font-family",
    /Ainsworth Script/,
  );
  await d.getByRole("button", { name: "단어", exact: true }).click();
  await page.screenshot({
    path: "test-results/cursive-practice.png",
    fullPage: true,
    animations: "disabled",
  });
  await d.getByRole("button", { name: "닫기" }).click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const box = (await page
      .getByRole("button", { name: "저택 지도", exact: true })
      .boundingBox())!;
    await expect(
      page.getByRole("button", { name: "저택 지도", exact: true }),
    ).toHaveCSS("width", width === 390 ? "112px" : "150px");
    expect(box.width).toBeLessThan(width === 390 ? 118 : 156);
    expect(box.height).toBeGreaterThan(44);
  }
  await page.getByRole("button", { name: "방 목록 열기" }).click();
  await page
    .getByRole("navigation", { name: "저택의 방" })
    .getByRole("button", { name: "Entrance Hall", exact: true })
    .click();
  expect(
    await page
      .locator(".fixed-object")
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el, "::before");
        return (
          style.borderTopWidth === "2px" &&
          style.backgroundColor !== "rgba(0, 0, 0, 0)"
        );
      }),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/clear-hotspots-phone.png",
    animations: "disabled",
  });
});

test("explicit consent, selected context only, reload recovery and one unread AI reply", async ({
  page,
}) => {
  let posted: any,
    posts = 0,
    arrived = false;
  await page.route("**/api/ai/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("status"))
      return route.fulfill({
        json: {
          configured: true,
          model: "gpt-4.1-mini",
          maxTokens: 900,
          dailyLimit: 20,
        },
      });
    if (path.endsWith("usage"))
      return route.fulfill({ json: { used: 0, limit: 20 } });
    if (route.request().method() === "POST") {
      posts++;
      posted = route.request().postDataJSON();
      return route.fulfill({
        status: 202,
        json: { id: posted.id, status: "generating" },
      });
    }
    return route.fulfill({
      json: {
        id: posted.id,
        status: arrived ? "delivered" : "generating",
        ...(arrived
          ? {
              result: {
                subject: "Lavender by the window",
                body: "Dear Elena,\nI have been tending the herbs too. Did your lavender survive the rain?\nYours, Hermione",
              },
            }
          : {}),
      },
    });
  });
  await openMail(page);
  await connect(page);
  await writeLetter(page);
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "AI 답장 요청", exact: true }).click();
  await expect(d.getByRole("checkbox")).not.toBeChecked();
  expect(posts).toBe(0);
  for (const [width, height] of [
    [390, 844],
    [800, 1280],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    expect(await d.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
      true,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await d.locator(".ai-consent").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/ai-consent-${width}.png`,
      animations: "disabled",
    });
  }
  await d.getByRole("button", { name: "전송 취소" }).click();
  expect(posts).toBe(0);
  await d.getByRole("button", { name: "AI 답장 요청", exact: true }).click();
  await d
    .getByRole("button", { name: "확인한 내용으로 OpenAI에 전송" })
    .click();
  await expect(d.getByText("상대가 답장을 쓰고 있어요")).toBeVisible();
  expect(posted.person.name).toBe("Hermione Granger");
  expect(posted.letters).toHaveLength(1);
  expect(posted.letters[0].body).toContain("lavender");
  expect(Object.keys(posted).sort()).toEqual([
    "date",
    "id",
    "letters",
    "person",
  ]);
  await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
  arrived = true;
  await page.reload();
  await expect(page.getByText(/부엉이가 새 답장을 가져왔어요/)).toBeVisible();
  expect(posts).toBe(1);
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  await expect(
    d.getByRole("button", { name: /받은 편지.*새 편지 1/ }),
  ).toBeVisible();
  await d.getByRole("button", { name: /Lavender by the window/ }).click();
  await expect(d.getByText("AI 창작 답장 · 도착함")).toBeVisible();
  await expect(d.locator(".handwriting")).toContainText(
    "Did your lavender survive",
  );
  await page.screenshot({
    path: "test-results/ai-arrived-letter.png",
    animations: "disabled",
  });
  await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  await expect(
    d.getByRole("button", { name: /Lavender by the window/ }),
  ).toHaveCount(1);
  expect(posts).toBe(1);
});

test("ambiguous network error resumes with same request ID and failed replies need new consent", async ({
  page,
}) => {
  let first: any,
    posts: any[] = [];
  await page.route("**/api/ai/**", async (route) => {
    if (route.request().url().endsWith("status"))
      return route.fulfill({ json: { configured: true } });
    if (route.request().url().endsWith("usage"))
      return route.fulfill({ json: { used: 0, limit: 20 } });
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      posts.push(data);
      first ||= data;
      if (posts.length === 1) return route.abort("failed");
      return route.fulfill({
        json: {
          id: data.id,
          status: "failed",
          error: "OpenAI 사용량 한도에 도달했어요.",
        },
      });
    }
  });
  await openMail(page);
  await connect(page);
  await writeLetter(page);
  await page.getByRole("button", { name: "AI 답장 요청", exact: true }).click();
  await page
    .getByRole("button", { name: "확인한 내용으로 OpenAI에 전송" })
    .click();
  await expect(page.getByText("전송 상태 확인이 필요해요")).toBeVisible();
  await page.getByRole("button", { name: "전송 상태 다시 확인" }).click();
  await expect(
    page.getByText("OpenAI 사용량 한도에 도달했어요."),
  ).toBeVisible();
  expect(posts).toHaveLength(2);
  expect(posts[1]).toEqual(first);
  await page.getByRole("button", { name: "새 답장 요청 검토" }).click();
  expect(posts).toHaveLength(2);
  await page.getByRole("button", { name: "전송 취소" }).click();
  expect(posts).toHaveLength(2);
  await expect(
    page.getByRole("heading", { name: /Re: A little something/ }),
  ).toBeVisible();
});

test("expired uncertain sends only look up the old ID instead of billing again", async ({
  page,
}) => {
  let posts = 0,
    lookups = 0;
  await page.route("**/api/ai/**", async (route) => {
    if (route.request().method() === "POST") {
      posts++;
      return route.abort();
    }
    lookups++;
    return route.fulfill({
      status: 404,
      json: {
        error: "서버의 답장 보관 기간(24시간)이 지났거나 전송 기록이 없어요.",
      },
    });
  });
  await openMail(page);
  await writeLetter(page);
  await expect(page.getByText("모든 순간이 저장되었어요")).toBeVisible();
  const id = randomUUID();
  await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("ainsworth-house");
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("snapshots", "readwrite"),
        store = tx.objectStore("snapshots");
      const get = store.get("home");
      get.onsuccess = () => {
        const row = get.result,
          value = row.value,
          letter = value.letters.find(
            (l: { folder: string }) => l.folder === "sent",
          );
        value.mailJobs = [
          {
            id,
            letterId: letter.id,
            endpoint: "",
            submitted: false,
            phase: "sending",
            createdAt: new Date(Date.now() - 90000000).toISOString(),
            request: {
              id,
              date: letter.date,
              person: value.residents.find(
                (p: { id: string }) => p.id === letter.person,
              ),
              letters: [
                {
                  subject: letter.subject,
                  body: letter.body,
                  direction: "outgoing",
                },
              ],
            },
          },
        ];
        store.put(row);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, id);
  await page.reload();
  await page.getByRole("button", { name: "우편함 들여다보기" }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: /보낸 편지/ }).click();
  await d.getByRole("button", { name: /Re: A little something/ }).click();
  await expect(d.getByText(/서버의 답장 보관 기간/)).toBeVisible();
  expect(posts).toBe(0);
  expect(lookups).toBe(1);
  await expect(
    d.getByRole("button", { name: "새 답장 요청 검토" }),
  ).toBeVisible();
});
