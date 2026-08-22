import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MuteButton from "./MuteButton";
import { isMuted } from "@/lib/sound";

beforeEach(() => window.localStorage.clear());

describe("MuteButton", () => {
  it("처음에는 소리가 켜진 상태로 보인다", () => {
    render(<MuteButton />);
    expect(screen.getByTestId("mute")).toHaveAttribute("data-muted", "false");
  });

  it("누르면 음소거가 되고 저장된다", () => {
    render(<MuteButton />);
    fireEvent.click(screen.getByTestId("mute"));

    expect(screen.getByTestId("mute")).toHaveAttribute("data-muted", "true");
    expect(isMuted()).toBe(true);
  });

  it("다시 누르면 소리가 돌아온다", () => {
    render(<MuteButton />);
    fireEvent.click(screen.getByTestId("mute"));
    fireEvent.click(screen.getByTestId("mute"));

    expect(screen.getByTestId("mute")).toHaveAttribute("data-muted", "false");
    expect(isMuted()).toBe(false);
  });

  it("이미 꺼둔 상태로 열면 꺼진 채로 보인다", () => {
    window.localStorage.setItem("nolai:muted", "true");
    render(<MuteButton />);

    expect(screen.getByTestId("mute")).toHaveAttribute("data-muted", "true");
  });

  it("소리를 읽는 사람에게 무슨 버튼인지 알려준다", () => {
    render(<MuteButton />);
    expect(screen.getByRole("button", { name: "소리 끄기" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mute"));
    expect(screen.getByRole("button", { name: "소리 켜기" })).toBeInTheDocument();
  });
});
