import { expect, test, type Page } from "@playwright/test";

async function shot(page: Page, name: string) {
  if (process.env.SCREENSHOTS) await page.screenshot({ path: `docs/screenshots/${name}.png` });
}

const tab = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name, exact: true });

/** 화면에 보이는 첫 번째 요소의 위치 */
async function visibleBox(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => (e as HTMLElement).offsetParent !== null);
    const r = el!.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), h: Math.round(r.height) };
  }, selector);
}

test("하단 탭을 오가도 헤더 높이와 제목 위치가 같다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(8);
  const boxes = [];
  for (const name of ["홈", "검색", "관심", "AI"]) {
    await tab(page, name).click();
    await expect(tab(page, name)).toHaveAttribute("aria-current", "page");
    boxes.push({
      name,
      header: await visibleBox(page, "main header"),
      menu: await visibleBox(page, "main header button[aria-label='전체 메뉴']"),
    });
  }
  for (const b of boxes) {
    expect(b.header, b.name).toEqual(boxes[0].header);
    expect(b.menu, b.name).toEqual(boxes[0].menu);
  }
});

test("햄버거 메뉴 → 내 정보 (더미 프로필, 알림 설정 저장)", async ({ page }) => {
  await page.goto("/stocks/000660");
  await expect(page.getByTestId("current-price")).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "전체 메뉴" }).filter({ visible: true }).click();

  const drawer = page.getByRole("dialog", { name: "전체 메뉴" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByTestId("drawer-profile")).toContainText("포커스투자자");
  await expect(drawer.getByRole("link", { name: "SK하이닉스" })).toBeVisible(); // 최근 본 종목
  await shot(page, "07-menu");

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  await page.getByRole("button", { name: "전체 메뉴" }).filter({ visible: true }).click();
  await drawer.getByRole("button", { name: "공지사항" }).click();
  await expect(page.getByRole("status").filter({ hasText: "준비 중" })).toBeVisible();
  await drawer.getByRole("link", { name: "내 정보" }).click();

  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByTestId("profile-name")).toHaveText("포커스투자자");
  await expect(page.getByTestId("data-source")).toHaveText("샘플 시세");
  const sw = page.getByRole("switch", { name: "공지사항 · 이벤트" });
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.getByRole("switch", { name: "공지사항 · 이벤트" })).toHaveAttribute("aria-checked", "true");
  await shot(page, "08-me");
});

test("종목 커뮤니티: 글쓰기 → 새로고침 유지 → 좋아요 → 삭제", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/stocks/005930");
  await page.getByRole("tab", { name: "커뮤니티" }).click();
  await expect(page).toHaveURL(/\/stocks\/005930\?tab=community$/);

  const posts = page.getByTestId("post");
  await expect(posts).toHaveCount(12);
  await expect(page.getByText("데모 커뮤니티예요")).toBeVisible();

  // 말머리 필터
  await page.getByRole("radiogroup", { name: "말머리 필터" }).getByRole("radio", { name: "질문" }).click();
  const questionCount = await posts.count();
  expect(questionCount).toBeLessThan(12);
  await page.getByRole("radiogroup", { name: "말머리 필터" }).getByRole("radio", { name: "전체" }).click();

  // 글쓰기
  await page.getByRole("button", { name: /생각을 나눠 보세요/ }).click();
  await page.getByRole("radiogroup", { name: "말머리 선택" }).getByRole("radio", { name: "질문" }).click();
  await page.getByLabel("게시글 내용").fill("Focus 테스트 글입니다. 다들 공시 어디서 보세요?");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(posts).toHaveCount(13);
  const mine = posts.first();
  await expect(mine).toHaveAttribute("data-mine", "true");
  await expect(mine).toContainText("Focus 테스트 글입니다");
  await expect(mine).toContainText("방금 전");

  // 새로고침 후 유지
  await page.reload();
  await expect(posts).toHaveCount(13);
  await page.getByRole("radiogroup", { name: "정렬" }).getByRole("radio", { name: "최신순" }).click();
  await expect(posts.first()).toHaveAttribute("data-mine", "true");

  // 좋아요 (예시 글)
  const seed = posts.nth(1);
  const likeBtn = seed.getByRole("button", { name: /^좋아요/ });
  const before = Number((await likeBtn.textContent())!.replace(/,/g, ""));
  await likeBtn.click();
  await expect(likeBtn).toHaveAttribute("aria-pressed", "true");
  await expect(likeBtn).toHaveText(String(before + 1));
  await shot(page, "09-community");

  // 내 글 삭제
  await posts.first().getByRole("button", { name: "삭제", exact: true }).click();
  await expect(posts).toHaveCount(12);

  // 시세 탭으로 돌아오면 차트
  await page.getByRole("tab", { name: "시세" }).click();
  await expect(page).toHaveURL(/\/stocks\/005930$/);
  await expect(page.getByTestId("price-chart")).toBeVisible();
});

test("홈 인기글 → 종목 커뮤니티, 전체 커뮤니티 피드와 댓글", async ({ page }) => {
  await page.goto("/");
  const highlights = page.getByTestId("community-highlights").filter({ visible: true });
  await expect(highlights.getByRole("link")).toHaveCount(3);
  await highlights.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/stocks\/\d{6}\?tab=community$/);
  await expect(page.getByRole("tab", { name: /커뮤니티/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: /커뮤니티/ })).toContainText("12");

  // 전체 피드 (8종목 × 12개)
  await page.goto("/community");
  const posts = page.getByTestId("post").filter({ visible: true });
  await expect(posts).toHaveCount(96);
  await page.getByRole("radiogroup", { name: "종목 필터" }).getByRole("radio", { name: "NAVER" }).click();
  await expect(posts).toHaveCount(12);

  // 댓글: 예시 댓글이 있는 글을 열고 댓글 작성
  // 댓글을 달면 인기순 정렬이 바뀔 수 있으므로 글 id로 고정
  const postId = await posts
    .filter({ has: page.getByRole("button", { name: /^댓글 [1-9]/ }) })
    .first()
    .getAttribute("data-post-id");
  const withComments = page.locator(`[data-post-id="${postId}"]`);
  const btn = withComments.getByRole("button", { name: /^댓글 \d+$/ });
  const before = Number(await btn.textContent());
  await btn.click();
  const thread = withComments.getByTestId("comment-thread");
  await expect(thread.getByTestId("comment")).toHaveCount(before);
  await thread.getByLabel("댓글 입력").fill("좋은 글 감사합니다 (테스트)");
  await thread.getByRole("button", { name: "댓글 등록" }).click();
  await expect(thread.getByTestId("comment")).toHaveCount(before + 1);
  await expect(btn).toHaveText(String(before + 1));
  await shot(page, "11-community-feed");

  // 피드에서 글쓰기 (종목 선택)
  await page.getByRole("button", { name: /생각을 나눠 보세요/ }).click();
  await page.getByLabel("글을 쓸 종목").selectOption("035720");
  await page.getByLabel("게시글 내용").fill("피드에서 쓴 카카오 테스트 글");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(posts.first()).toContainText("피드에서 쓴 카카오 테스트 글");
  await expect(posts.first()).toContainText("카카오");
});

test("화면 전환에 View Transition이 적용된다", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: number };
    w.__vt = 0;
    const orig = document.startViewTransition?.bind(document);
    if (orig) {
      document.startViewTransition = ((arg: Parameters<typeof orig>[0]) => {
        w.__vt += 1;
        return orig(arg);
      }) as typeof document.startViewTransition;
    }
  });
  await page.goto("/");
  await expect(page.getByTestId("stock-row").filter({ visible: true })).toHaveCount(8);
  const count = () => page.evaluate(() => (window as unknown as { __vt: number }).__vt);

  await page.getByTestId("stock-row").filter({ visible: true }).first().getByRole("link").click();
  await expect(page).toHaveURL(/\/stocks\//);
  await expect.poll(count).toBeGreaterThanOrEqual(1);

  const afterForward = await count();
  await tab(page, "검색").click();
  await expect(page).toHaveURL(/\/search$/);
  await expect.poll(count).toBeGreaterThan(afterForward);
});
