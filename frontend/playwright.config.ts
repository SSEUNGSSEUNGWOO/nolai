import { defineConfig } from "@playwright/test";

/** E2E 전용 포트. 손으로 띄워둔 개발 서버(3000)와 절대 섞이지 않게 한다. */
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  /**
   * 한 번에 하나씩 돌린다.
   *
   * 계정 E2E는 하나의 DB를 함께 쓴다 -- 시도 제한 버킷이 공유되고, 한 테스트의
   * 뒷정리가 다른 테스트가 쓰는 중인 계정을 지울 수 있다. 게다가 dev 서버는
   * 라우트를 요청 시점에 컴파일해서, 여러 워커가 처음 보는 화면을 동시에 열면
   * 트리가 갈아끼워지며 요소가 DOM에서 떨어져 나간다.
   *
   * 테스트가 20개도 안 되므로 직렬로 돌려도 몇 분이면 끝난다.
   */
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    /**
     * 이 서버는 test 스키마만 본다. 운영 데이터는 public에 있으므로 E2E가
     * 계정을 만들고 지워도 진짜 아이의 데이터에 닿지 못한다.
     */
    env: { SUPABASE_SCHEMA: "test", PORT: String(PORT) },
    /**
     * 이미 떠 있는 서버를 빌리지 않는다. 빌리면 그 서버가 public을 보고 있을
     * 수 있고, 그때 E2E는 조용히 운영 데이터를 지운다. 여기서만큼은 편의보다
     * 안전이 먼저다.
     */
    reuseExistingServer: false,
  },
});
