import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WordPicker from "./WordPicker";

describe("WordPicker", () => {
  it("치면 사전에서 찾아 보여주고, 누르면 그 단어를 올린다", () => {
    const onPick = vi.fn();
    render(<WordPicker label="왼쪽" value={null} onPick={onPick} />);

    fireEvent.change(screen.getByRole("textbox", { name: "왼쪽" }), { target: { value: "강아" } });
    fireEvent.click(screen.getByRole("button", { name: "강아지" }));

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ word: "강아지" }));
  });

  it("고른 단어가 있으면 그 단어를 보여주고 목록은 닫힌다", () => {
    render(<WordPicker label="왼쪽" value={{ id: 1, word: "가" }} onPick={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "왼쪽" })).toHaveValue("가");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("사전에 없는 글자는 아무 목록도 안 보여준다", () => {
    render(<WordPicker label="왼쪽" value={null} onPick={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: "왼쪽" }), { target: { value: "ㅋㅋㅋ" } });

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
