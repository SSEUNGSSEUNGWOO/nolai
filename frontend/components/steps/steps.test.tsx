import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HookStep from "./HookStep";
import NameStep from "./NameStep";
import ChallengeStep from "./ChallengeStep";
import RewardStep from "./RewardStep";

describe("HookStep", () => {
  it("질문을 보여주고 버튼을 누르면 다음으로 넘어간다", () => {
    const onDone = vi.fn();
    render(<HookStep owl="어떻게 알아듣지?" onDone={onDone} />);

    expect(screen.getByText(/어떻게 알아듣지/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "궁금해!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("NameStep", () => {
  it("개념 이름과 설명을 보여준다", () => {
    const onDone = vi.fn();
    render(<NameStep concept="임베딩" body="숫자로 바꿔서 기억해." onDone={onDone} />);

    expect(screen.getByText("임베딩")).toBeInTheDocument();
    expect(screen.getByText(/숫자로 바꿔서/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "알겠어!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("ChallengeStep", () => {
  const props = {
    question: "'호랑이'는 어디에?",
    choices: ["강아지 근처", "자동차 근처"],
    answer: 0,
    explain: "동물이니까!",
  };

  it("정답을 고르면 설명을 보여주고 다음으로 넘어갈 수 있다", () => {
    const onDone = vi.fn();
    render(<ChallengeStep {...props} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "강아지 근처" }));
    expect(screen.getByText(/동물이니까/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("오답을 골라도 진행을 막지 않고 설명을 보여준다", () => {
    const onDone = vi.fn();
    render(<ChallengeStep {...props} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "자동차 근처" }));
    expect(screen.getByText(/동물이니까/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음으로" })).toBeEnabled();
  });
});

describe("RewardStep", () => {
  it("배지 이름을 한글로 보여준다", () => {
    const onDone = vi.fn();
    render(<RewardStep badge="map-explorer" onDone={onDone} />);

    expect(screen.getByText("지도 탐험가")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "좋아!" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
