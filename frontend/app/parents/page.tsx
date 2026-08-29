import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getLesson, listLessonGroups } from "@/lib/content";
import { curriculum, lessonBlurbs } from "@/copy/parents";
import { lessonArt, mascotArt } from "@/lib/art";
import { SITE_URL } from "@/lib/site";
import { popButton } from "@/components/steps/styles";

const FIRST_LESSON = "/lesson/embedding-map";

/**
 * 부모·교사가 검색으로 도착하는 입구. 설계 문서 3장 "SEO 대상은 랜딩 페이지뿐".
 *
 * 아이 화면(/)과 일부러 갈라놓았다. 성취기준 코드 같은 "허락하는 사람"을 위한
 * 말은 여기에만 둔다 -- 놀이터에 뜨는 순간 학습지가 된다(설계 문서 15장 결정 4).
 * 그래서 이 페이지도 순서를 지킨다: 직접 해보기가 먼저, 교육과정 표는 맨 아래.
 */
export const metadata: Metadata = {
  title: "초등 인공지능 교육 놀이터 놀AI — 무료, 회원가입 없음",
  description:
    "초등 5~6학년이 AI 작동 원리를 손으로 만져보는 무료 레슨 16개. 회원가입·개인정보 없음. 실과 성취기준 6실05-04·05 대응. 브라우저에서 바로 시작.",
  alternates: { canonical: "/parents" },
};

export default function ParentsPage() {
  const groups = listLessonGroups();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-12 px-5 py-8 leading-relaxed lg:max-w-2xl">
      <header className="text-sm font-extrabold">
        <Link href="/">← 놀AI</Link>
      </header>

      <section className="flex flex-col gap-5">
        <Image src={mascotArt("wave")} alt="" width={112} height={112} className="h-28 w-28" />
        <h1 className="text-3xl font-black leading-tight">엔트리 다음은, 인공지능 원리를 손으로 만져보는 곳</h1>
        <p className="text-lg">
          블록으로 명령하는 법은 배웠습니다. 그 컴퓨터가 단어끼리 뭐가 비슷한지 어떻게 아는지는 아직 못
          봤을 겁니다. 엔트리·스크래치는 그대로 두셔도 됩니다. 명령하기가 아니라 알아보기 쪽입니다.
        </p>
        <ul className="list-disc pl-5 font-extrabold">
          <li>코딩이 아니라, AI가 생각하는 방식을 다룹니다. 레슨 16개.</li>
          <li>뜻을 다루는 레슨의 좌표와 거리는 한국어 임베딩 모델 KURE-v1이 계산한 값입니다.</li>
          <li>이름·이메일·전화번호를 묻지 않습니다. 계정 없이 전부 할 수 있습니다.</li>
        </ul>
        <div className="flex flex-col gap-2 pt-2">
          <Link href={FIRST_LESSON} className={`${popButton} self-start text-lg`}>
            직접 해보기
          </Link>
          <p className="text-sm text-muted">첫 레슨 · 회원가입 없음 · 10~13세</p>
        </div>
        <p className="text-sm text-muted">
          아이 기기로 보내려면 이 주소를 그대로 보내주세요:{" "}
          <code className="rounded bg-paper px-1">{SITE_URL.replace("https://", "")}</code>
        </p>
      </section>

      <Section title="무엇을 배우나">
        <p>열여섯 개를 네 묶음으로 나눴습니다. 순서대로 하면 개념이 쌓이지만, 아무 데서나 시작해도 됩니다.</p>
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold text-muted">{group.title}</h3>
            <ul className="flex flex-col gap-3">
              {group.lessons.map((lesson) => (
                <li key={lesson.id} className="flex items-start gap-3">
                  <Image
                    src={lessonArt(lesson.id)}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-[10px] border-[2px] border-ink bg-paper object-cover"
                  />
                  <p>
                    <strong>{lesson.title}</strong> — {lessonBlurbs[lesson.id]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h3 className="pt-2 text-lg font-black">화면의 숫자는 손으로 고친 게 아닙니다</h3>
        <p>
          뜻을 다루는 레슨의 좌표와 거리는 한국어 임베딩 모델 <code>nlpai-lab/KURE-v1</code>로 미리 계산했습니다.
          단어가 어디에 놓이는지를 저희가 정한 게 아니라 모델이 그렇게 봤기 때문에 그렇게 보입니다.
          기분 맞히기 레슨은 별도의 공개 감정 판별 모델을 씁니다.
        </p>
      </Section>

      <Section title="자주 묻는 것">
        <dl className="flex flex-col gap-3">
          <Qa q="몇 살부터인가요?">10~13세에 맞춰 만들었습니다. 글을 읽고 말의 뜻을 비교할 수 있으면 됩니다.</Qa>
          <Qa q="한 레슨에 얼마나 걸리나요?">레슨마다 다릅니다. 첫 레슨을 직접 해보시는 게 가장 빠릅니다.</Qa>
          <Qa q="폰으로 되나요?">폰 화면에 맞춰 만들었고, 태블릿·컴퓨터에서도 됩니다. 설치는 필요 없습니다.</Qa>
          <Qa q="아이가 뭘 했는지 볼 수 있나요?">
            아이가 “내 방”을 만들면 끝낸 레슨과 배지, 놀이터에서 만든 것이 거기 남습니다. 부모용 화면은 따로 없습니다.
          </Qa>
        </dl>
      </Section>

      <Section title="아이 정보">
        <p className="font-extrabold">놀AI는 아이가 누구인지 알 수 있는 정보를 받지 않습니다.</p>
        <ul className="list-disc pl-5">
          <li>이름·생년월일·이메일·전화번호·사진·위치를 묻지 않습니다.</li>
          <li>아이가 글을 직접 입력하는 칸이 없습니다. 닉네임도 정해진 목록에서 고르기만 합니다.</li>
          <li>방문 분석 도구, 광고, 소셜 로그인을 쓰지 않습니다.</li>
          <li>“내 방”을 만들지 않으면 서버에 아무것도 저장하지 않습니다. 진도는 아이 기기 안에만 남습니다.</li>
          <li>내 방을 만들면 입장 코드는 복원할 수 없는 형태로만 저장합니다. 그래서 코드를 잃어버리면 저희도 알려드릴 수 없습니다.</li>
        </ul>
        <p>
          <Link href="/privacy" className="underline">개인정보처리방침 전문 보기</Link>
        </p>
      </Section>

      <Section title="수업에서 쓰기">
        <p>계정을 만들지 않아도 열여섯 개 전부 할 수 있습니다. 학생 기기에서 주소를 열면 바로 시작됩니다.</p>
        <ul className="list-disc pl-5">
          <li>학생 계정 발급도, 설치도 없습니다.</li>
          <li>
            아이 이름·이메일 등 개인을 알아볼 수 있는 정보를 받지 않게 만들었습니다. 동의 절차가 필요한지는 학교 기준으로
            판단해 주세요.
          </li>
          <li>
            흐름은 마스코트 노리의 질문 → 직접 조작 → 개념 이름 붙이기 → 확인 문제. 첫 레슨만 조작 전에 결과를 먼저
            맞혀보는 단계가 있습니다.
          </li>
          <li>같은 기기·같은 브라우저면 진도가 이어집니다. 기기를 바꿔 이어가려면 아이가 “내 방”을 만들면 되는데, 필수는 아닙니다.</li>
          <li>어른용 설명 화면은 없습니다. 이 페이지가 전부입니다. 레슨 화면은 아이에게만 말을 겁니다.</li>
        </ul>
      </Section>

      <Section title="교육과정 대응">
        <p>
          2022 개정 실과 5~6학년 ‘디지털 사회와 인공지능’ 영역 성취기준 다섯 개 중 두 개와 겹칩니다. 체험 중심 대응이며,
          사회에 미치는 영향은 ‘없는 건 못 찾아’와 ‘AI랑 기분 맞히기 대결’에서 간접적으로만 다룹니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-[2px] border-ink text-left">
                <th className="py-2 pr-3">성취기준</th>
                <th className="py-2 pr-3">내용</th>
                <th className="py-2">해당 레슨</th>
              </tr>
            </thead>
            <tbody>
              {curriculum.map((row) => (
                <tr key={row.code} className="border-b border-muted/40 align-top">
                  <td className="whitespace-nowrap py-2 pr-3 font-extrabold">{row.code}</td>
                  <td className="py-2 pr-3">{row.summary}</td>
                  <td className="py-2">{row.lessonIds.map((id) => getLesson(id).title).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          나머지 여섯 개는 성취기준 밖 심화입니다. 6실05-01~03(알고리즘·프로그래밍)은 다루지 않습니다. 그건 엔트리가 이미
          잘합니다.
        </p>
      </Section>

      <section className="flex flex-col gap-2 pb-8">
        <Link href={FIRST_LESSON} className={`${popButton} self-start text-lg`}>
          직접 해보기
        </Link>
        <p className="text-sm text-muted">먼저 해보시고, 아이에게 주소를 보내주세요.</p>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function Qa({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-extrabold">{q}</dt>
      <dd>{children}</dd>
    </div>
  );
}
