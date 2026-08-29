import Link from "next/link";
import type { Metadata } from "next";
import { ui } from "@/copy/ui";

export const metadata: Metadata = { title: "개인정보처리방침 — 놀AI" };

/**
 * 이 문서는 코드가 실제로 하는 일을 적은 것이다. 수집 항목·보관 기간·삭제
 * 방법이 바뀌면 코드와 함께 이 문서도 고친다. 보일러플레이트를 붙이지 않는다 --
 * 하지도 않는 일을 "할 수 있다"고 적으면 읽는 부모에게 거짓말이 된다.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-8 text-sm leading-relaxed lg:max-w-2xl">
      <header className="text-sm font-extrabold">
        <Link href="/">← {ui.landingTitle}</Link>
      </header>

      <h1 className="text-2xl font-black">개인정보처리방침</h1>
      <p className="text-muted">시행일 2026년 8월 23일</p>

      <Section title="한 줄 요약">
        <p>
          놀AI는 <strong>아이가 누구인지 알 수 있는 정보를 받지 않습니다.</strong> 이름·생년월일·이메일·전화번호·사진·위치를
          묻지 않고, 아이가 글을 직접 입력하는 칸이 없습니다. 닉네임은 목록에서 고르기만 합니다.
        </p>
      </Section>

      <Section title="1. 어떤 정보를 저장하나요">
        <p>"내 방"을 만들면 다음만 저장합니다.</p>
        <ul className="list-disc pl-5">
          <li><strong>닉네임</strong> — 정해진 수식어와 캐릭터 목록에서 고른 조합(예: 번개 토끼). 사람 이름이 만들어지지 않도록 목록에 성씨를 넣지 않았습니다.</li>
          <li><strong>입장 코드</strong> — 원문은 저장하지 않고 복원할 수 없는 형태(해시)로만 저장합니다. 잃어버리면 저희도 알려드릴 수 없습니다.</li>
          <li><strong>진도와 배지</strong> — 끝낸 레슨과 받은 배지의 번호.</li>
          <li><strong>작품</strong> — 놀이터에서 고른 항목의 번호(예: 지도에 놓은 단어). 자유롭게 쓴 글은 받지 않으므로 저장되지도 않습니다.</li>
          <li><strong>만든 시각</strong></li>
        </ul>
        <p>내 방을 만들지 않으면 서버에 아무것도 저장하지 않습니다. 진도는 아이의 기기 안(브라우저 저장소)에만 남습니다.</p>
      </Section>

      <Section title="2. 자동으로 생기는 정보">
        <ul className="list-disc pl-5">
          <li><strong>접속 주소(IP)</strong> — 방 만들기·들어가기를 너무 많이 시도하는 것을 막는 데만 씁니다. IP 자체는 저장하지 않고 되돌릴 수 없는 해시만 저장합니다. 호스팅 서비스(Vercel)의 서버 기록에는 통상적인 접속 기록이 짧게 남을 수 있습니다.</li>
          <li><strong>쿠키</strong> — <code>nolai_session</code> 하나. 내 방에 들어간 상태를 기억하며 1년 뒤 만료됩니다. 광고·추적 쿠키는 없습니다.</li>
          <li><strong>브라우저 저장소</strong> — <code>nolai:progress</code>(진도), <code>nolai:muted</code>(음소거 설정). 기기 밖으로 나가지 않습니다.</li>
        </ul>
        <p>방문 분석 도구, 광고, 소셜 로그인을 쓰지 않습니다.</p>
      </Section>

      <Section title="3. 왜 저장하나요">
        <p>아이가 다음에 와서 이어서 하고, 모은 배지와 작품을 다시 보기 위해서입니다. 그 외 목적으로 쓰지 않습니다.</p>
      </Section>

      <Section title="4. 누구에게 맡기나요">
        <p>저장과 운영을 위해 두 회사의 서비스를 씁니다. 이들은 저희 대신 데이터를 보관할 뿐 다른 용도로 쓰지 않습니다.</p>
        <ul className="list-disc pl-5">
          <li><strong>Supabase</strong> — 데이터베이스. 서버는 서울(ap-northeast-2)에 있습니다.</li>
          <li><strong>Vercel</strong> — 웹 호스팅.</li>
        </ul>
        <p>그 밖의 누구에게도 정보를 제공하거나 팔지 않습니다.</p>
      </Section>

      <Section title="5. 얼마나 보관하나요">
        <p>아이(또는 보호자)가 <strong>내 방을 지울 때까지</strong>입니다. 지우면 진도·배지·작품이 함께 즉시 삭제되며 되돌릴 수 없습니다.</p>
      </Section>

      <Section title="6. 지우거나 물어보려면">
        <ul className="list-disc pl-5">
          <li>내 방 아래쪽의 <strong>"내 방 지우기"</strong> 버튼으로 직접 지울 수 있습니다.</li>
          <li>코드를 잃어버려 들어갈 수 없거나 궁금한 점이 있으면 아래 연락처로 알려주세요. 닉네임을 알려주시면 확인 뒤 지워드립니다.</li>
        </ul>
        <p>개인정보 보호책임자: <strong>놀AI 운영자</strong> · 연락처: <strong><a href="mailto:jansseung@gmail.com" className="underline">jansseung@gmail.com</a></strong></p>
      </Section>

      <Section title="7. 만 14세 미만 어린이">
        <p>
          놀AI는 10~13세를 위해 만들어졌습니다. 개인정보 보호법은 만 14세 미만 어린이의 개인정보를 수집할 때 법정대리인의 동의를
          요구합니다. 놀AI는 <strong>개인을 알아볼 수 있는 정보를 받지 않는 방식으로 설계</strong>하여 그런 정보 자체를 수집하지 않습니다.
          보호자께서 아이의 이용을 원하지 않으시면 위 연락처로 알려주시거나 내 방을 지워주세요.
        </p>
      </Section>

      <Section title="8. 안전하게 지키기 위해">
        <ul className="list-disc pl-5">
          <li>모든 통신은 암호화(HTTPS)됩니다.</li>
          <li>데이터베이스는 외부에서 직접 읽을 수 없게 잠겨 있고 서버만 접근합니다.</li>
          <li>입장 코드는 복원할 수 없는 형태로만 저장합니다.</li>
          <li>같은 곳에서 짧은 시간에 너무 많이 시도하면 잠시 막습니다.</li>
        </ul>
      </Section>

      <Section title="9. 바뀌면">
        <p>이 문서가 바뀌면 이 페이지의 시행일을 고치고, 저장하는 항목이 늘어나는 경우에는 첫 화면에 알립니다.</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
