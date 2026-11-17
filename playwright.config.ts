import { defineConfig } from "@playwright/test";

const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 로컬에 설치된 브라우저 사용 (Chrome이 있으면 "chrome"으로 바꿔도 된다)
    channel: process.env.PW_CHANNEL ?? "msedge",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: false,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  webServer: {
    // 프로덕션 빌드(npm run build) 후 샘플 모드로 실행
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: { DATA_PROVIDER: "mock" },
    timeout: 60_000,
  },
});
