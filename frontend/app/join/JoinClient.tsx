"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { randomNicknames } from "@/lib/auth/nickname";
import { readProgress } from "@/lib/local-progress";
import { account, ui } from "@/copy/ui";
import { popButton } from "@/components/steps/styles";
import OwlBubble from "@/components/OwlBubble";

export default function JoinClient({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<string[]>(initial);
  const [issued, setIssued] = useState<{ nickname: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);


  async function join(nickname: string) {
    setBusy(true);
    setError(null);

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    const data = await response.json();

    if (!response.ok) {
      setBusy(false);
      // 오류를 뭉뚱그리면 "이름이 찼다"와 "너무 많이 시도했다"가 구별되지 않아
      // 아이가 다른 이름을 골라도 계속 같은 말을 듣는다.
      setError(
        data.error === "nickname_full"
          ? account.nicknameFull
          : response.status === 429
            ? account.loginThrottled
            : account.signupFailed,
      );
      // 이름이 찼을 때만 다시 뽑는다. 시도 제한이면 같은 이름으로 재시도해야 한다.      if (data.error === "nickname_full") setCandidates(randomNicknames(3));
      return;
    }

    // 계정을 만들기 전에 논 진도를 옮긴다. 실패해도 가입 자체는 성공이므로
    // 막지 않는다 -- 아이는 코드부터 받아야 한다.
    const local = readProgress();
    if (local.completedLessons.length > 0) {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons: local.completedLessons }),
      }).catch(() => {});
    }

    setIssued({ nickname: data.nickname, code: data.code });
    setBusy(false);
  }

  function saveAsImage() {
    if (!issued) return;

    // 아이가 코드를 잃으면 복구 수단이 없다(개인정보를 받지 않으므로).
    // 설계 문서 4장이 완화책으로 요구한 저장 버튼이다.
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 420;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#FFF3D6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1F2430";
    context.lineWidth = 10;
    context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    context.fillStyle = "#1F2430";
    context.textAlign = "center";
    context.font = "bold 40px sans-serif";
    context.fillText("놀AI 비밀코드", canvas.width / 2, 110);
    context.font = "bold 44px sans-serif";
    context.fillText(issued.nickname, canvas.width / 2, 195);
    context.font = "bold 96px monospace";
    context.fillText(issued.code, canvas.width / 2, 300);
    context.font = "bold 22px sans-serif";
    context.fillText("이 코드가 있어야 다른 기기에서 들어올 수 있어요", canvas.width / 2, 360);

    const link = document.createElement("a");
    link.download = `놀AI-${issued.nickname}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (issued) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
        <h1 className="text-2xl font-black">{account.codeTitle}</h1>
        <OwlBubble text={account.codeOwl} />

        <div
          ref={cardRef}
          className="flex flex-col items-center gap-3 rounded-pop border-[3px] border-ink bg-paper py-8 shadow-[0_4px_0_var(--color-ink)]"
        >
          <span data-testid="issued-nickname" className="text-lg font-extrabold">{issued.nickname}</span>
          <span
            data-testid="issued-code"
            className="font-mono text-5xl font-black tracking-widest"
          >
            {issued.code}
          </span>
        </div>

        <p className="rounded-pop border-[2.5px] border-ink bg-candy-yellow px-4 py-3 text-sm font-extrabold">
          ⚠ {account.codeWarning}
        </p>

        <button type="button" className={popButton} onClick={saveAsImage}>
          {account.saveImage}
        </button>
        <button
          type="button"
          className={popButton}
          onClick={() => router.push("/room")}
        >
          {account.toRoom}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/">← {ui.landingTitle}</Link>
      </header>

      <h1 className="text-2xl font-black">{account.joinTitle}</h1>
      <OwlBubble text={account.joinOwl} />

      {error && (
        <p className="rounded-pop border-[2.5px] border-ink bg-candy-red px-4 py-3 text-sm font-extrabold">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {candidates.map((nickname) => (
          <button
            key={nickname}
            type="button"
            data-testid={`nickname-${nickname}`}
            disabled={busy}
            onClick={() => join(nickname)}
            className="rounded-pop border-[2.5px] border-ink bg-candy-teal px-5 py-4 text-lg font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)] disabled:opacity-50"
          >
            {nickname}
          </button>
        ))}
      </div>

      <button
        type="button"
        data-testid="reroll"
        disabled={busy}
        onClick={() => setCandidates(randomNicknames(3))}
        className="text-sm font-extrabold text-muted underline disabled:opacity-50"
      >
        {account.reroll}
      </button>
    </main>
  );
}
