"use client";

import { useRouter } from "next/navigation";
import { account } from "@/copy/ui";
import { clearProgress } from "@/lib/local-progress";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      data-testid="logout"
      className="text-sm font-extrabold text-muted underline"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" }).catch(() => {});
        clearProgress();
        router.push("/play");
        router.refresh();
      }}
    >
      {account.logout}
    </button>
  );
}
