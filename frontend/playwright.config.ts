import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /**
   * 한 번에 하나씩 돌린다.
   *
   * 계정 E2E는 실제 Supabase 프로젝트를 함께 쓴다 -- 시도 제한 버킷이 공유되고,
   * 한 테스트의 뒷정리가 다른 테스트가 쓰는 중인 계정을 지울 수 있다. 게다가
   * dev 서버는 라우트를 요청 시점에 컴파일해서, 여러 워커가 처음 보는 화면을
   * 동시에 열면 트리가 갈아끼워지며 요소가 DOM에서 떨어져 나간다.
   *
   * 테스트가 20개도 안 되므로 직렬로 돌려도 몇 분이면 끝난다.
   */
  workers: 1,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
