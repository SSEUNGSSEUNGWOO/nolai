import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react의 자동 cleanup은 설정에 의존한다. 명시적으로 건다.
afterEach(() => {
  cleanup();
});

// jsdom은 PointerEvent를 구현하지 않는다. MouseEvent로 대체한다.
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type: string, params: MouseEventInit = {}) {
      super(type, params);
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
