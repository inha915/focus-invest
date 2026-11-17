import { expect, test, type Page } from "@playwright/test";

/**
 * 반응형 검증: 다양한 휴대폰·태블릿 크기에서 가로 넘침이 없고,
 * 하단 탭과 핵심 요소가 화면 안에 온전히 보이는지 확인한다.
 */
const VIEWPORTS = [
  { name: "galaxy-fold-folded", width: 280, height: 653 },
  { name: "iphone-se-1st", width: 320, height: 568 },
  { name: "galaxy-s", width: 360, height: 780 },
  { name: "iphone-15", width: 393, height: 852 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "landscape-phone", width: 844, height: 390 },
  { name: "tablet", width: 768, height: 1024 },
];

const PAGES = ["/", "/search", "/watchlist", "/ai?code=005930", "/stocks/005930", "/stocks/207940?tab=community", "/community", "/me"];

/** 화면 오른쪽 밖으로 삐져나간 요소 (가로 스크롤 컨테이너 내부는 제외) */
async function overflowReport(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const clipsX = (el: Element | null): boolean => {
      for (let p = el?.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden") return true;
      }
      return false;
    };
    const offenders: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if ((r.right > vw + 1 || r.left < -1) && !clipsX(el) && !el.classList.contains("sr-only")) {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} → ${Math.round(r.left)}..${Math.round(r.right)} (vw ${vw})`);
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, vw, offenders: offenders.slice(0, 5) };
  });
}

for (const vp of VIEWPORTS) {
  test(`반응형 ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      if (path.startsWith("/stocks")) {
        await expect(page.getByTestId("current-price")).toBeVisible();
      }
      const report = await overflowReport(page);
      expect(report.offenders, `${path} 가로 넘침`).toEqual([]);
      expect(report.scrollWidth, `${path} 가로 스크롤`).toBeLessThanOrEqual(report.vw);

      // 하단 탭이 화면 안에 온전히 보인다
      const nav = await page.getByRole("navigation", { name: "주요 메뉴" }).boundingBox();
      expect(nav!.y + nav!.height).toBeLessThanOrEqual(vp.height + 1);
    }

    // 메뉴 드로어도 넘침 없이 열린다
    await page.goto("/");
    await page.getByRole("button", { name: "전체 메뉴" }).filter({ visible: true }).click();
    await expect(page.getByRole("dialog", { name: "전체 메뉴" })).toBeVisible();
    const drawer = await overflowReport(page);
    expect(drawer.offenders, "드로어 가로 넘침").toEqual([]);

    if (process.env.SCREENSHOTS && ["galaxy-fold-folded", "landscape-phone"].includes(vp.name)) {
      await page.keyboard.press("Escape");
      await page.goto("/stocks/005930");
      await expect(page.getByTestId("price-chart")).toBeVisible();
      await page.screenshot({ path: `docs/screenshots/10-${vp.name}.png` });
    }
  });
}
