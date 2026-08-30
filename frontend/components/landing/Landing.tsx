"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import EmbeddingMap from "@/playgrounds/embedding-map/EmbeddingMap";
import Confetti from "@/components/fx/Confetti";
import type { PlaygroundEvent } from "@/playgrounds/types";
import { lessonArt, mascotArt, type MascotMood } from "@/lib/art";
import { curriculum, lessonBlurbs } from "@/copy/landing";
import { SITE_URL } from "@/lib/site";

export interface LandingGroup {
  title: string;
  lessons: { id: string; title: string }[];
}

const PLAY = "/play";

const cta =
  "inline-flex items-center rounded-pop border-[3px] border-ink bg-candy-red px-6 py-3 text-lg font-black text-ink shadow-[0_4px_0_var(--color-ink)]";

/** 놓은 단어 수에 따라 노리가 하는 말. 첫 화면의 놀이터가 곧 대화다. */
function heroLine(count: number): { mood: MascotMood; text: string } {
  if (count === 0) return { mood: "point", text: "빛나는 단어를 지도 아무 데나 놓아봐. 어디로 갈까?" };
  if (count === 1) return { mood: "curious", text: "어? 네가 놓은 자리가 아니네. 하나 더 놓아봐." };
  if (count < 4) return { mood: "surprised", text: "자리가 정해져 있는 것 같지? 몇 개 더!" };
  return { mood: "happy", text: "비슷한 것끼리 모이지? 방금 네가 한 걸 아래에서 알려줄게." };
}

export default function Landing({
  dataset,
  groups,
  titles,
}: {
  dataset: unknown;
  groups: LandingGroup[];
  titles: Record<string, string>;
}) {
  const [placed, setPlaced] = useState(0);
  const reduced = useReducedMotion();
  const line = heroLine(placed);

  function onEvent(event: PlaygroundEvent) {
    if (event.type === "placed") setPlaced(Number(event.payload?.count ?? 0));
  }

  // 섹션이 화면에 들어올 때 한 번 떠오른다. 투명도는 건드리지 않는다 -- 스크롤 없이
  // 캡처하거나 움직임 줄임 설정이 뒤늦게 켜지면 섹션이 영영 안 보이는 사고가 난다.
  const rise = reduced
    ? {}
    : {
        initial: { y: 28 },
        whileInView: { y: 0 },
        viewport: { once: true, margin: "-12%" },
        transition: { type: "spring" as const, stiffness: 120, damping: 18 },
      };

  return (
    // break-keep: 한글 제목이 음절 중간("인/공지능")에서 꺾이지 않게 어절 단위로 줄바꿈한다.
    <div className="flex flex-col break-keep">
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="text-2xl font-black">놀AI</span>
          <nav className="flex items-center gap-2 text-sm font-extrabold">
            <a href="#adults" className="hidden px-3 py-2 sm:inline">부모·선생님께</a>
            <Link
              href={PLAY}
              data-testid="landing-start"
              className="rounded-pop border-[2.5px] border-ink bg-candy-yellow px-4 py-2 shadow-[0_3px_0_var(--color-ink)]"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* 첫 화면: 설명 대신 레슨 1의 첫 90초를 그대로 시킨다. */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-16 pt-8 lg:pt-10">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-4xl font-black leading-[1.08] tracking-[-0.02em] lg:text-5xl xl:text-6xl">
              엔트리 다음은, 인공지능 원리를 손으로 만져보는 곳
            </h1>
            <p className="max-w-[60ch] text-lg font-bold text-ink/80 lg:text-xl">
              10~13세가 임베딩·벡터검색·토큰을 글이 아니라 손으로 익힙니다. 아래 지도에 단어를 놓아보세요 — 이게 첫 레슨입니다.
            </p>
          </div>
          <div className="flex items-end gap-3 lg:justify-end">
            <motion.div
              key={line.mood}
              initial={reduced ? false : { scale: 0.7, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="shrink-0"
            >
              <Image src={mascotArt(line.mood)} alt="" width={120} height={120} priority className="h-24 w-24 lg:h-32 lg:w-32" />
            </motion.div>
            <Speech testId="hero-line">{line.text}</Speech>
          </div>
        </div>

        {/* 데스크톱에서는 지도가 접힘 안에 들어오게 폭을 잡는다. 4:3이라 폭이 곧 높이다.
            네 개째 놓는 순간이 이 페이지의 한 장면이다: 색종이가 터지고 테두리가 노랗게 번쩍인다. */}
        <motion.div
          className="relative w-full lg:mx-auto lg:max-w-5xl lg:-rotate-1"
          data-testid="landing-playground"
          animate={placed >= 4 && !reduced ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <EmbeddingMap data={dataset} onEvent={onEvent} onArtifact={() => {}} />
          {placed === 4 && <Confetti key="landing-burst" count={40} />}
        </motion.div>
      </section>

      {/* 이름 붙이기: 방금 한 것이 임베딩이라고 알려준다. 레슨의 name 스텝과 같은 자리. */}
      <motion.section {...rise} className="border-y-[3px] border-ink bg-candy-red">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[auto_1fr] lg:items-center lg:py-20">
          <div className="flex flex-col items-center gap-3">
            <Image src={mascotArt("surprised")} alt="" width={200} height={200} className="h-40 w-40 lg:h-52 lg:w-52" />
            <Speech>어? 네가 놓은 데가 아니지?</Speech>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-balance text-3xl font-black leading-tight lg:text-5xl">
              {placed > 0 ? `네가 놓은 ${placed}개, 전부 컴퓨터가 정한 자리로 갔어.` : "단어가 스스로 자리를 찾아갔지?"}
              <br />
              방금 한 게 <span className="underline decoration-[6px] decoration-ink underline-offset-4">임베딩</span>이야.
            </h2>
            <p className="max-w-[60ch] text-lg font-bold">
              컴퓨터는 말을 숫자 묶음으로 바꿔서 뜻이 비슷한 것끼리 가까이 둡니다. 화면의 자리는 저희가 그린 게 아니라 한국어
              임베딩 모델 <code className="rounded bg-ink px-1.5 py-0.5 text-paper">nlpai-lab/KURE-v1</code>이 계산한 값입니다. 아이가 커서 확인해도
              거짓이 아니어야 하니까요.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 어른이 묻는 두 가지: 코딩이랑 뭐가 다르냐, 아이 정보는 받냐. */}
      <motion.section {...rise} id="adults" className="border-b-[3px] border-ink bg-candy-teal">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <Image src={mascotArt("think")} alt="" width={96} height={96} className="h-20 w-20 shrink-0" />
              <Speech>그래서 코딩이랑 뭐가 달라?</Speech>
            </div>
            <h2 className="text-3xl font-black leading-tight lg:text-4xl">코딩이 아니라, AI가 생각하는 방식</h2>
            <p className="max-w-[60ch] text-lg font-bold">
              블록으로 명령하는 법은 엔트리가 잘 가르칩니다. 놀AI는 그 컴퓨터가 <em>어떻게 아는지</em>를 다룹니다 — 임베딩, 벡터검색,
              학습 데이터, 토큰, 픽셀, 소리, 0과 1. 레슨 16개, 전부 손으로.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <Image src={mascotArt("wave")} alt="" width={96} height={96} className="h-20 w-20 shrink-0" />
              <Speech>이름은 안 물어봐. 골라 쓰는 거야.</Speech>
            </div>
            <h2 className="text-3xl font-black leading-tight lg:text-4xl">아이가 누구인지 묻지 않습니다</h2>
            <ul className="flex max-w-[60ch] list-disc flex-col gap-1 pl-5 text-lg font-bold">
              <li>이름·이메일·전화번호·사진을 받지 않습니다. 닉네임은 목록에서 고르기만 합니다.</li>
              <li>회원가입 없이 16개 전부 할 수 있습니다. 광고·분석 도구도 없습니다.</li>
              <li>“내 방”을 만들면 진도와 배지만 남고, 입장 코드는 복원 불가 형태로만 저장합니다.</li>
            </ul>
            <Link href="/privacy" className="self-start text-base font-extrabold underline underline-offset-4">
              개인정보처리방침 전문 보기
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 레슨 16개. 묶음은 개념이 쌓이는 순서. */}
      <motion.section {...rise} className="border-b-[3px] border-ink bg-candy-yellow">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 lg:py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black leading-tight lg:text-4xl">열여섯 개, 네 묶음</h2>
            <p className="hidden text-base font-bold sm:block">순서대로 하면 개념이 쌓이지만, 아무 데서나 시작해도 됩니다.</p>
          </div>
          {/* 묶음이 그릇이다. 레슨 하나하나를 카드로 감싸면 같은 상자 16개가 되어 버린다 --
              썸네일 그림이 줄의 리듬을 만들고, 줄 사이는 얇은 선만. 묶음마다 살짝 다른 기울기. */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {groups.map((group, g) => (
              <div
                key={group.title}
                className={`rounded-pop border-[3px] border-ink bg-paper p-4 shadow-[0_5px_0_var(--color-ink)] lg:p-5 ${
                  g % 2 === 0 ? "lg:rotate-[0.6deg]" : "lg:-rotate-[0.6deg]"
                }`}
              >
                <h3 className="mb-3 inline-block rounded-full border-[2.5px] border-ink bg-candy-red px-3 py-1 text-lg font-black">{group.title}</h3>
                <ul className="divide-y-[2px] divide-ink/15">
                  {group.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center gap-3 py-2.5">
                      <Image
                        src={lessonArt(lesson.id)}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-[12px] border-[2px] border-ink bg-cream object-cover"
                      />
                      <p className="text-sm font-bold leading-snug text-ink/80">
                        <strong className="block text-base font-black text-ink">{lesson.title}</strong>
                        {lessonBlurbs[lesson.id]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 남은 질문과 교육과정. 표는 맨 아래 -- 놀이터가 학습지로 보이면 안 된다. */}
      <motion.section {...rise} className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-black leading-tight">자주 묻는 것</h2>
            <dl className="flex flex-col gap-4 text-base">
              <Qa q="몇 살부터인가요?">10~13세에 맞춰 만들었습니다. 글을 읽고 말의 뜻을 비교할 수 있으면 됩니다.</Qa>
              <Qa q="한 레슨에 얼마나 걸리나요?">레슨마다 다릅니다. 위의 첫 화면이 첫 레슨의 시작이니 직접 해보시는 게 가장 빠릅니다.</Qa>
              <Qa q="폰으로 되나요?">폰 화면에 맞춰 만들었고, 태블릿·컴퓨터에서도 됩니다. 설치는 필요 없습니다.</Qa>
              <Qa q="수업에서 쓸 수 있나요?">
                학생 계정 발급도, 설치도 없습니다. 학생 기기에서 주소를 열면 바로 시작됩니다. 개인을 알아볼 수 있는 정보를 받지 않게 만들었지만,
                동의 절차가 필요한지는 학교 기준으로 판단해 주세요.
              </Qa>
              <Qa q="아이가 뭘 했는지 볼 수 있나요?">아이가 “내 방”을 만들면 끝낸 레슨과 배지, 놀이터에서 만든 것이 거기 남습니다. 부모용 화면은 따로 없습니다.</Qa>
            </dl>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-black leading-tight">교육과정 대응</h2>
            <p className="text-base font-bold">
              2022 개정 실과 5~6학년 ‘디지털 사회와 인공지능’ 성취기준 다섯 개 중 두 개와 겹칩니다. 체험 중심 대응이며, 6실05-01~03(알고리즘·프로그래밍)은
              다루지 않습니다 — 그건 엔트리가 이미 잘합니다.
            </p>
            <div className="overflow-x-auto rounded-pop border-[2.5px] border-ink bg-paper">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-[2.5px] border-ink text-left">
                    <th className="px-3 py-2">성취기준</th>
                    <th className="px-3 py-2">내용</th>
                    <th className="px-3 py-2">해당 레슨</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculum.map((row, i) => (
                    <tr key={row.code} className={`align-top ${i === 0 ? "border-b-[2px] border-ink/30" : ""}`}>
                      <td className="whitespace-nowrap px-3 py-2 font-black">{row.code}</td>
                      <td className="px-3 py-2 font-bold">{row.summary}</td>
                      <td className="px-3 py-2 font-bold">{row.lessonIds.map((id) => titles[id]).join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 마지막: 시작. 아이 기기로 보낼 주소도 여기. */}
      <section className="border-t-[3px] border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-5 py-14 lg:flex-row lg:items-center lg:justify-between lg:py-16">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Image src={mascotArt("happy")} alt="" width={112} height={112} className="h-24 w-24" />
              <Speech>이제 네 차례야.</Speech>
            </div>
            <div>
              <p className="text-2xl font-black leading-tight lg:text-3xl">먼저 해보시고, 아이에게 주소를 보내주세요.</p>
              <p className="mt-1 font-bold text-paper/80">
                <code className="rounded bg-paper/15 px-1.5 py-0.5">{SITE_URL.replace("https://", "")}</code> — 회원가입 없이 바로 시작됩니다.
              </p>
            </div>
          </div>
          <Link href={PLAY} className={cta}>
            시작하기
          </Link>
        </div>
        <footer className="mx-auto flex max-w-6xl gap-4 px-5 pb-6 text-xs font-bold text-paper/60">
          <Link href="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>
        </footer>
      </section>
    </div>
  );
}

/** 노리의 말풍선. 첫 화면과 섹션마다 같은 모양 -- 노리는 장식이 아니라 내레이터다. */
function Speech({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p
      data-testid={testId}
      className="relative rounded-pop border-[3px] border-ink bg-paper px-4 py-3 text-base font-extrabold text-ink shadow-[0_4px_0_var(--color-ink)]"
    >
      <span aria-hidden className="absolute -left-2 bottom-4 h-4 w-4 rotate-45 border-b-[3px] border-l-[3px] border-ink bg-paper" />
      {children}
    </p>
  );
}

function Qa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-black">{q}</dt>
      <dd className="font-bold text-ink/80">{children}</dd>
    </div>
  );
}
