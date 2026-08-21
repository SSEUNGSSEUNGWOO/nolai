import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react의 자동 cleanup은 설정에 의존한다. 명시적으로 건다.
afterEach(() => {
  cleanup();
});
