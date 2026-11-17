import { expect, test } from "@playwright/test";

for (const failure of ["blocked", "quota"] as const) {
  test(`저장소 ${failure}: 관심 등록·이동·해제`, async ({ page }) => {
    await page.addInitScript((mode) => {
      if (mode === "blocked") {
        Object.defineProperty(window, "localStorage", {
          get() { throw new DOMException("Blocked", "SecurityError"); },
        });
      } else {
        Storage.prototype.setItem = () => {
          throw new DOMException("Full", "QuotaExceededError");
        };
      }
    }, failure);
    await page.goto("/stocks/005930");
    await page.getByRole("button", { name: "관심 종목 등록", exact: true }).click();
    await expect(page.getByRole("button", { name: "관심 종목 해제", exact: true }))
      .toHaveAttribute("aria-pressed", "true");
    await page.getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("link", { name: "관심", exact: true }).click();
    await expect(page.getByTestId("stock-row").filter({ visible: true })).toContainText("삼성전자");
    await page.getByRole("button", { name: "삼성전자 관심 해제" }).click();
    await expect(page.getByText("관심 종목이 없어요")).toBeVisible();
  });
}
