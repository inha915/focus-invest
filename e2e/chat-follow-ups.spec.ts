import { expect, test } from "@playwright/test";
import { EXAMPLE_QUESTIONS } from "../src/lib/ai/demo-responder";
import { FOLLOW_UPS } from "../src/lib/ai/follow-ups";

for (const [index, steps] of Object.values(FOLLOW_UPS).entries()) {
  test(`추천 주제 ${index + 1}: 꼬리질문 10개 이어가기`, async ({ page }) => {
    await page.goto("/ai");
    await page.getByRole("button", { name: EXAMPLE_QUESTIONS[index], exact: true }).click();
    const answers = page.getByTestId("assistant-bubble");
    await expect(answers).toHaveCount(1);
    for (const [step, [question, answer]] of steps.entries()) {
      await page.getByRole("button", { name: question, exact: true }).click();
      await expect(answers).toHaveCount(step + 2);
      await expect(answers.last()).toContainText(answer);
      await expect(page.getByRole("button", { name: question, exact: true })).toHaveCount(0);
    }
    for (const question of EXAMPLE_QUESTIONS) {
      await expect(page.getByRole("button", { name: question, exact: true })).toBeVisible();
    }
  });
}
