"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  NICKNAME_CHARACTERS,
  NICKNAME_MODIFIERS,
} from "@/lib/auth/nickname";
import { CODE_LENGTH } from "@/lib/auth/code-format";
import { readProgress } from "@/lib/local-progress";
import { flushPending } from "@/lib/pending";
import { account, ui } from "@/copy/ui";
import { popButton } from "@/components/steps/styles";
import MascotBubble from "@/components/MascotBubble";
import Image from "next/image";
import { mascotArt } from "@/lib/art";

const selectClass =
  "w-full rounded-pop border-[2.5px] border-ink bg-paper px-3 py-3 text-base font-extrabold text-ink";

export default function LoginPage() {
  const router = useRouter();
  // 닉네임을 글로 치게 하지 않는다. 조합이 1600개라 목록을 통째로 훑게 할 수도
  // 없으므로 수식어와 캐릭터를 따로 고르게 한다. 오타가 날 자리가 없다.
  const [modifier, setModifier] = useState<string>(NICKNAME_MODIFIERS[0]);
  const [character, setCharacter] = useState<string>(NICKNAME_CHARACTERS[0]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);

    // 연결이 끊기면 fetch가 던진다. 잡지 않으면 버튼이 영영 비활성으로 남는다.
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: `${modifier}${character}`, code }),
    }).catch(() => null);

    if (!response) {
      setBusy(false);
      setError(account.loginFailed);
      return;
    }

    if (!response.ok) {
      setBusy(false);
      setError(
        response.status === 429 ? account.loginThrottled : account.loginFailed,
      );
      return;
    }

    // 서버에 못 보낸 레슨 완료(작품 포함)부터 보낸다. 손님 몫과 이 아이 몫만 간다.
    const { kidId } = (await response.json().catch(() => ({}))) as { kidId?: string };
    if (kidId) await flushPending(kidId);

    const local = readProgress();
    if (local.completedLessons.length > 0) {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons: local.completedLessons }),
      }).catch(() => {});
    }

    router.push("/room");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-8">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/play">← {ui.landingTitle}</Link>
      </header>

      <Image src={mascotArt("wave")} alt="" width={128} height={128} priority className="bob mx-auto h-32 w-32" />
      <h1 className="text-2xl font-black">{account.loginTitle}</h1>
      <MascotBubble text={account.loginOwl} />

      {error && (
        <p
          data-testid="login-error"
          className="rounded-pop border-[2.5px] border-ink bg-candy-red px-4 py-3 text-sm font-extrabold"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <select
          aria-label="이름 앞부분"
          data-testid="modifier"
          className={selectClass}
          value={modifier}
          onChange={(event) => setModifier(event.target.value)}
        >
          {NICKNAME_MODIFIERS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          aria-label="이름 뒷부분"
          data-testid="character"
          className={selectClass}
          value={character}
          onChange={(event) => setCharacter(event.target.value)}
        >
          {NICKNAME_CHARACTERS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <input
        aria-label="비밀코드"
        data-testid="code"
        className="w-full rounded-pop border-[2.5px] border-ink bg-paper px-4 py-3 text-center font-mono text-2xl font-black tracking-widest uppercase"
        value={code}
        maxLength={CODE_LENGTH + 2}
        // 아이가 소문자로 쳐도 서버가 흡수한다. 화면에서도 대문자로 보여준다.
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="A2B3C4"
      />

      <button
        type="button"
        data-testid="login-submit"
        className={popButton}
        disabled={busy || code.length === 0}
        onClick={submit}
      >
        {account.loginCta}
      </button>
    </main>
  );
}
