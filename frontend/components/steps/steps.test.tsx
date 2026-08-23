import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HookStep from "./HookStep";
import NameStep from "./NameStep";
import ChallengeStep from "./ChallengeStep";
import RewardStep from "./RewardStep";
import PredictStep from "./PredictStep";
import RevealStep from "./RevealStep";

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

describe("PredictStep", () => {
  it("고르기 전에는 넘어갈 버튼이 없고, 고르면 고른 번호를 넘긴다", () => {
    const onDone = vi.fn();
    render(<PredictStep question="어디로 갈까?" choices={["강아지 근처", "자동차 근처"]} onDone={onDone} />);

    expect(screen.queryByRole("button", { name: "직접 확인해보자!" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "자동차 근처" }));
    fireEvent.click(screen.getByRole("button", { name: "직접 확인해보자!" }));
    expect(onDone).toHaveBeenCalledWith(1);
  });

  it("맞고 틀림을 말하지 않는다", () => {
    // 놀이에서 직접 확인하는 것이 이 스텝의 전부다.
    render(<PredictStep question="어디로 갈까?" choices={["강아지 근처", "자동차 근처"]} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "자동차 근처" }));
    expect(screen.queryByText(/맞았어|달랐네|틀렸/)).not.toBeInTheDocument();
  });
});

describe("RevealStep", () => {
  const props = { answer: 0, choices: ["강아지 근처", "자동차 근처"], right: "맞지!", wrong: "아니야!" };

  it("맞게 찍었으면 right를 보여준다", () => {
    render(<RevealStep {...props} picked={0} onDone={vi.fn()} />);
    expect(screen.getByTestId("reveal-picked")).toHaveTextContent("강아지 근처");
    expect(screen.getByText("맞지!")).toBeInTheDocument();
  });

  it("틀리게 찍었으면 wrong을 보여주고 그래도 넘어갈 수 있다", () => {
    const onDone = vi.fn();
    render(<RevealStep {...props} picked={1} onDone={onDone} />);
    expect(screen.getByText("아니야!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
