import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const reduced = vi.hoisted(() => ({ value: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => reduced.value };
});

import Confetti from "./Confetti";

describe("Confetti", () => {
  it("입자를 count만큼 그린다", () => {
    reduced.value = false;
    render(<Confetti count={12} />);
    expect(screen.getByTestId("confetti").childElementCount).toBe(12);
  });

  it("움직임을 줄인 기기에서는 아무것도 그리지 않는다", () => {
    // 멀미가 있는 아이에게 색종이 폭발은 재미가 아니다.
    reduced.value = true;
    render(<Confetti />);
    expect(screen.queryByTestId("confetti")).toBeNull();
  });
});
