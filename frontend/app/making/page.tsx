import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { mascotArt, propArt } from "@/lib/art";

/**
 * 놀AI를 어떻게 만들었나. 부모·교사·심사위원이 "AI가 어디까지 관여했나"를 물을 때
 * 링크 하나로 답하는 페이지다. 여기 적은 것은 전부 저장소에서 확인할 수 있다 --
 * 파일 이름을 그대로 적는 이유다. 하지 않은 것도 적는다.
 */
export const metadata: Metadata = {
  title: "놀AI는 이렇게 만들었습니다 — 만든 과정",
  description:
    "임베딩 모델로 미리 계산한 진짜 숫자, 빌드가 막는 콘텐츠 검증, 로컬 GPU로 그린 그림, AI 에이전트와 함께 쓴 글. 놀AI를 만든 과정과 일부러 하지 않은 것.",
  alternates: { canonical: "/making" },
};

export default function MakingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-10 px-5 py-8 leading-relaxed break-keep lg:max-w-2xl">
      <header className="text-sm font-extrabold">
        <Link href="/">← 놀AI</Link>
      </header>

      <section className="flex flex-col gap-4">
        <Image src={mascotArt("think")} alt="" width={112} height={112} className="h-28 w-28" />
        <h1 className="text-3xl font-black leading-tight lg:text-4xl">놀AI는 이렇게 만들었습니다</h1>
        <p className="text-lg font-bold">
          한 사람이 AI 도구와 함께 만들었습니다. 어디에 AI를 썼고, 어디에 <em>일부러 안 썼는지</em>를 적습니다. 아래 파일 이름은 전부
          저장소에 그대로 있습니다.
        </p>
      </section>

      <Section title="1. 화면의 숫자는 미리 계산한 진짜 값입니다">
        <p>
          뜻을 다루는 레슨(비슷한 말끼리 모여라, 가장 가까운 걸 찾아줘, 뜻으로 계산하기 등 11개)의 좌표·거리·순위는 한국어 임베딩 모델{" "}
          <code>nlpai-lab/KURE-v1</code>이 계산했습니다. 이 PC의 GPU에서 단어와 문장을 임베딩하고, 그 거리 행렬을 MDS로 2차원에 내려{" "}
          <code>frontend/datasets/*.json</code>에 넣어 둡니다(<code>tools/embed/build_dataset.py</code>). 기분 맞히기 레슨은 공개 감정 판별 모델{" "}
          <code>matthewburke/korean_sentiment</code>의 실제 판정과 확신도를 씁니다.
        </p>
        <p>
          그래서 아이가 보는 화면에서는 <strong>AI를 호출하지 않습니다.</strong> 서비스가 느려지는 것도, 매번 답이 달라지는 것도 없고, 아이가 커서
          같은 모델을 돌려 봐도 같은 자리가 나옵니다. 좌표를 손으로 고치지 않는다는 규칙은 README에 적혀 있고, 그림·소리·전구 레슨만
          모델 없이 데이터 자체(색값·파형·비트)를 씁니다.
        </p>
      </Section>

      <Section title="2. 레슨은 데이터이고, 틀린 레슨은 빌드가 막습니다">
        <p>
          레슨 16개는 코드가 아니라 <code>frontend/lessons/*.json</code>입니다. 노리의 말, 놀이 목표 횟수, 확인 문제가 전부 여기 있어서
          문구를 고칠 때 코드를 열지 않습니다. 놀이터 12종은 레슨을 모르고 “무엇을 놓았다”는 사건만 올려보내며, 레슨 러너가 그 수를 세어
          다음 단계로 넘깁니다.
        </p>
        <p>
          없는 놀이터를 부르거나, 데이터셋보다 큰 목표를 적거나, 정답이 보기 중 제일 길거나, 아이가 보는 문장에 레슨 번호가 들어가면{" "}
          <strong>빌드가 실패합니다</strong>(<code>frontend/lib/content.ts</code>). 확인 문제의 정답은 데이터셋 값으로 하나씩 검증했습니다 —
          “떡볶이와 떡국에 같이 나오는 조각”은 실제로 같은 번호(175388)입니다.
        </p>
      </Section>

      <Section title="3. 그림은 이 PC에서 직접 그렸습니다">
        <div className="flex flex-wrap items-center gap-3">
          {(["box-open", "scale", "faces", "scissors", "typewriter"] as const).map((name) => (
            <Image key={name} src={propArt(name)} alt="" width={72} height={72} className="h-16 w-16" />
          ))}
        </div>
        <p>
          마스코트 노리의 포즈 7종, 배지 16개, 레슨 썸네일 16장, 단어 그림 52장, 놀이터 소품 5장은 로컬 ComfyUI에서 이미지 모델(Qwen-Image-Edit)로
          뽑았습니다(<code>tools/art/gen.js</code>). 두꺼운 남색 외곽선과 캔디 색 세 가지를 프롬프트에 고정해 한 벌로 보이게 했고, 배경은
          모델이 아니라 네 모서리에서 출발하는 flood fill로 땄습니다(<code>tools/art/cut.js</code>) — 얼굴 안쪽 크림색까지 지워 버리는 사고를
          막기 위해서입니다. 마음에 안 드는 결과는 seed를 바꿔 다시 뽑았고, 부엉이였던 마스코트는 로봇으로 갈아탔습니다.
        </p>
      </Section>

      <Section title="4. 글과 설계는 AI 에이전트와 함께 썼습니다">
        <p>
          코드와 레슨 문구는 Claude Code와 함께 썼습니다. 설계 문서(<code>docs/superpowers/specs/</code>)에 결정과 이유를 날짜와 함께 남기고,
          그 문서를 다음 작업의 근거로 삼는 방식입니다. 첫 화면의 글은 전략·카피·반박 역할을 나눈 에이전트 세 개를 차례로 돌려 썼고,
          반박 단계에서 “첫 레슨의 답을 랜딩이 미리 말해 버린다” 같은 지적이 나와 고쳤습니다. 화면 디자인도 같은 방식으로 리뷰를 받아
          “놓는 순간의 효과가 없다” 같은 지적을 반영했습니다.
        </p>
        <p>
          레슨의 내용 자체 — 무엇을 가르칠지, 어떤 순서로, 어떤 예시로 — 는 사람이 정했고, 실제 값을 재 보고 뒤집은 것이 여럿입니다.
          “반대말은 멀리 있다”는 가정은 모델 값을 재 보니 틀려서 <em>“반대말인데 왜 가까워?”</em>라는 레슨이 됐습니다.
        </p>
      </Section>

      <Section title="5. 일부러 하지 않은 것">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li><strong>아이 화면에서 LLM 호출</strong> — 답이 매번 달라지면 “진짜 숫자”가 아니게 됩니다.</li>
          <li><strong>회원가입·이름·이메일</strong> — 닉네임은 목록에서 고르고, 입장 코드는 복원 불가 형태로만 저장합니다.</li>
          <li><strong>부모 대시보드·점수·경쟁</strong> — 놀이터가 학습지가 되는 순간 아이가 만지기를 멈춥니다.</li>
          <li><strong>코딩 가르치기</strong> — 그건 엔트리가 이미 잘합니다. 놀AI는 그 다음에 옵니다.</li>
        </ul>
      </Section>

      <Section title="6. 아직 없는 것">
        <p>
          아이와 교사가 실제로 써 본 기록, 방문 수 이상의 사용 데이터, 한 레슨에 걸리는 시간의 실측. 이 페이지에 그런 숫자가 없는 것은
          아직 없기 때문입니다. 생기면 여기에 적겠습니다.
        </p>
      </Section>

      <footer className="flex gap-4 pt-4 text-xs font-bold text-muted">
        <Link href="/" className="underline">첫 화면</Link>
        <Link href="/privacy" className="underline">개인정보처리방침</Link>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-black leading-tight">{title}</h2>
      {children}
    </section>
  );
}
