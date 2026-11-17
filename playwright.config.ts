import { defineConfig } from "@playwright/test";

const PORT = 3200;
// PW_BASE_URL을 주면 로컬 서버 없이 배포된 사이트를 테스트한다
const REMOTE = process.env.PW_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: REMOTE ?? `http://localhost:${PORT}`,
    // 로컬에 설치된 브라우저 사용 (Chrome이 있으면 "chrome"으로 바꿔도 된다)
    channel: process.env.PW_CHANNEL ?? "msedge",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: false,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  webServer: REMOTE
    ? undefined
    : {
        // 프로덕션 빌드(npm run build) 후 샘플 모드로 실행
        command: `npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        env: { DATA_PROVIDER: "mock" },
        timeout: 60_000,
      },
});
