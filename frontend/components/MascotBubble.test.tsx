import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MascotBubble from "./MascotBubble";

describe("MascotBubble", () => {
  it("노리의 이름과 대사를 보여준다", () => {
    render(<MascotBubble text="아무거나 끌어다 놔봐!" />);
    expect(screen.getByText(/노리/)).toBeInTheDocument();
    expect(screen.getByText(/아무거나 끌어다 놔봐!/)).toBeInTheDocument();
  });
});
