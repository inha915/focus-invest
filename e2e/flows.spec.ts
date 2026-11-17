import { expect, test, type Page } from "@playwright/test";

/** README용 스크린샷 (SCREENSHOTS=1 일 때만 저장) */
async function shot(page: Page, name: string) {
  if (process.env.SCREENSHOTS) {
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
  }
}

const tab = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name, exact: true });

test("홈 → 종목 상세 → 차트 기간 변경 → 관심 등록·해제 → AI 데모 채팅", async ({ page }) => {
  // 홈: 주요 종목 목록
  await page.goto("/");
  const rows = page.getByTestId("stock-row").filter({ visible: true });
  await expect(rows).toHaveCount(8);
  await expect(page.getByTestId("source-notice")).toContainText("샘플 시세");
  await expect(page.getByTestId("source-notice")).toContainText("기준일 2026.11.13");
  const samsung = rows.filter({ hasText: "삼성전자" }).first();
  await expect(samsung).toContainText("71,800원");
  await expect(samsung).toContainText("+0.70%");
  await expect(samsung).toContainText("거래량");
  await shot(page, "01-home");

  // 종목 상세
  await samsung.getByRole("link").click();
  await expect(page).toHaveURL(/\/stocks\/005930$/);
  await expect(page.getByTestId("current-price")).toHaveText("71,800원");
  await expect(page.getByTestId("price-change")).toHaveText("+500원 (+0.70%)");
  await expect(page.getByTestId("price-change")).toHaveClass(/text-up/);

  // 차트 기간 변경: 1개월 → 3개월 → 6개월
  const chart = page.getByTestId("price-chart");
  await expect(chart).toHaveAttribute("data-points", "23");
  await expect(page.locator(".recharts-area-curve")).toBeVisible();
  await page.getByRole("tab", { name: "3개월" }).click();
  await expect(page.getByRole("tab", { name: "3개월" })).toHaveAttribute("aria-selected", "true");
  await expect(chart).toHaveAttribute("data-points", "66");
  await page.getByRole("tab", { name: "6개월" }).click();
  await expect(chart).toHaveAttribute("data-points", "132");
  await expect(page.getByTestId("chart-meta")).toContainText("일봉 132개");
  await page.getByRole("tab", { name: "1개월" }).click();
  await expect(chart).toHaveAttribute("data-points", "23");

  // 차트 툴팁 (마우스 오버)
  const box = (await page.locator(".recharts-surface").first().boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await expect(page.locator(".recharts-tooltip-wrapper").first()).toContainText("종가");
  await shot(page, "02-detail");

  // 관심 등록
  const watchBtn = page.getByRole("button", { name: "관심 종목 등록" });
  await watchBtn.click();
  await expect(page.getByRole("button", { name: "관심 종목 해제" })).toHaveAttribute("aria-pressed", "true");

  // 관심 탭에서 확인 → 새로고침 후 유지
  await tab(page, "관심").click();
  await expect(page).toHaveURL(/\/watchlist$/);
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toContainText("삼성전자");
  await page.reload();
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(1);
  await shot(page, "03-watchlist");

  // 관심 해제
  await page.getByRole("button", { name: "삼성전자 관심 해제" }).click();
  await expect(page.getByText("관심 종목이 없어요")).toBeVisible();
  await page.reload();
  await expect(page.getByText("관심 종목이 없어요")).toBeVisible();

  // 상세 → AI에게 물어보기
  await page.goto("/stocks/005930");
  await page.getByRole("link", { name: "AI에게 물어보기" }).click();
  await expect(page).toHaveURL(/\/ai\?code=005930$/);
  await expect(page.getByTestId("demo-badge")).toHaveText("데모 채팅");
  await expect(page.getByTestId("stock-context")).toContainText("삼성전자");
  await expect(page.getByTestId("stock-context")).toContainText("005930");

  // 예시 질문 1 (칩 클릭)
  await page.getByRole("button", { name: "삼성전자와 SK하이닉스 비교할 때 뭘 보면 돼?" }).click();
  const answers = page.getByTestId("assistant-bubble");
  await expect(answers).toHaveCount(1);
  await expect(answers.nth(0)).toContainText("예시 응답");
  await expect(answers.nth(0)).toContainText("PER");

  // 예시 질문 2 (직접 입력) → 선택한 종목 반영
  await page.getByLabel("질문 입력").fill("이 종목의 거래량은 어떻게 읽어?");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(answers).toHaveCount(2);
  await expect(answers.nth(1)).toContainText("삼성전자(005930)");
  await shot(page, "04-ai");

  // 범위 밖 질문 → 예시 질문 안내
  await page.getByLabel("질문 입력").fill("내일 주가 오를까?");
  await page.keyboard.press("Enter");
  await expect(answers).toHaveCount(3);
  await expect(answers.nth(2)).toContainText("미리 준비한 질문에만");
  await expect(page.getByRole("button", { name: "이 종목의 거래량은 어떻게 읽어?" })).toBeVisible();
});

test("검색: 종목명과 종목코드, 결과 없음", async ({ page }) => {
  await page.goto("/");
  await tab(page, "검색").click();
  await expect(page).toHaveURL(/\/search$/);
  const input = page.getByLabel("종목명 또는 종목코드 검색");

  await input.fill("하이닉스");
  await expect(page.getByTestId("search-count")).toHaveText("검색 결과 1건");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveAttribute("data-code", "000660");
  await shot(page, "05-search");

  await input.fill("035420");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(1);
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toContainText("NAVER");

  await input.fill("삼성");
  await expect(page.getByTestId("search-count")).toHaveText("검색 결과 2건");

  await input.fill("테슬라");
  await expect(page.getByText("'테슬라' 검색 결과가 없어요")).toBeVisible();
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(0);

  await page.getByRole("button", { name: "검색어 지우기" }).click();
  await expect(page.getByText("검색할 수 있는 종목")).toBeVisible();
});

test("시세 조회 실패 시 오류 표시 후 재시도", async ({ page }) => {
  let fail = true;
  await page.route("**/api/quotes?*", async (route) => {
    if (fail) {
      fail = false;
      return route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "한국투자증권 응답 오류: 테스트", source: "kis" } }),
      });
    }
    return route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("alert").filter({ hasText: "시세를" })).toContainText("시세를 불러오지 못했어요");
  await expect(page.getByRole("alert").filter({ hasText: "시세를" })).toContainText("한국투자증권 응답 오류: 테스트");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(0);
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(8);
});

test("데스크톱 폭에서도 같은 하단 탭 동선", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(8);
  for (const [name, path] of [["검색", "/search"], ["관심", "/watchlist"], ["AI", "/ai"], ["홈", "/"]] as const) {
    await tab(page, name).click();
    await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : path}`));
    await expect(tab(page, name)).toHaveAttribute("aria-current", "page");
  }
  await shot(page, "06-desktop");
});
