import { redirect } from "next/navigation";

// 부모·교사용 랜딩은 2026-08-30에 첫 화면(/)으로 합쳤다. 이미 나간 링크를 위해 남겨둔다.
export default function ParentsPage() {
  redirect("/");
}
