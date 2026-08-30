"use client";

import { useRouter } from "next/navigation";
import { account } from "@/copy/ui";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      data-testid="logout"
      className="text-sm font-extrabold text-muted underline"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/play");
        router.refresh();
      }}
    >
      {account.logout}
    </button>
  );
}
