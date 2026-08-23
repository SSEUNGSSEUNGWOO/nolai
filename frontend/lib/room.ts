import "server-only";

import { serverSupabase } from "@/lib/supabase";
import type { ArtifactPayload } from "./artifact";

export interface RoomArtifact {
  id: string;
  lessonId: string;
  payload: ArtifactPayload;
  createdAt: string;
}

export interface Room {
  nickname: string;
  completedLessons: string[];
  badges: string[];
  artifacts: RoomArtifact[];
}

/** 계정이 지워졌거나 id가 엉뚱하면 null. 화면은 로그아웃 상태로 그린다. */
export async function loadRoom(kidId: string): Promise<Room | null> {
  const db = serverSupabase();

  const { data: kid, error: kidError } = await db
    .from("kids")
    .select("nickname")
    .eq("id", kidId)
    .maybeSingle();

  if (kidError) throw kidError;
  if (!kid) return null;

  const [progress, badges, artifacts] = await Promise.all([
    db.from("progress").select("lesson_id").eq("kid_id", kidId).eq("status", "done"),
    db.from("badges").select("badge_id").eq("kid_id", kidId).order("earned_at"),
    // 작품은 최신 것부터. 한 레슨을 여러 번 하면 여러 개가 쌓인다.
    db
      .from("artifacts")
      .select("id, lesson_id, payload, created_at")
      .eq("kid_id", kidId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (progress.error) throw progress.error;
  if (badges.error) throw badges.error;
  if (artifacts.error) throw artifacts.error;

  return {
    nickname: kid.nickname as string,
    completedLessons: (progress.data ?? []).map((row) => row.lesson_id as string),
    badges: (badges.data ?? []).map((row) => row.badge_id as string),
    artifacts: (artifacts.data ?? []).map((row) => ({
      id: row.id as string,
      lessonId: row.lesson_id as string,
      payload: row.payload as ArtifactPayload,
      createdAt: row.created_at as string,
    })),
  };
}

/**
 * 레슨 완료를 기록한다. 같은 레슨을 다시 끝내도 안전하다.
 *
 * 설계 문서 11장의 "진도는 되돌아가지 않는다"를 지킨다 -- upsert라 done이
 * 다시 done으로 덮이기만 하고 사라지지 않는다.
 */
export async function completeLesson(
  kidId: string,
  lessonId: string,
  badgeId: string,
): Promise<void> {
  const db = serverSupabase();

  const { error: progressError } = await db.from("progress").upsert(
    {
      kid_id: kidId,
      lesson_id: lessonId,
      status: "done",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "kid_id,lesson_id" },
  );
  if (progressError) throw progressError;

  if (!badgeId) return;

  // 이미 받은 배지를 다시 넣어도 earned_at이 바뀌면 안 된다. 처음 받은 때가
  // 기록으로서 의미가 있다.
  const { error: badgeError } = await db
    .from("badges")
    .upsert({ kid_id: kidId, badge_id: badgeId }, {
      onConflict: "kid_id,badge_id",
      ignoreDuplicates: true,
    });
  if (badgeError) throw badgeError;
}

/**
 * 아이가 만든 결과물을 남긴다.
 *
 * 같은 레슨을 다시 해도 덮어쓰지 않고 새로 쌓는다 -- 두 번째로 놓은 지도는
 * 첫 번째와 다른 작품이다. 내 방은 최근 것부터 보여준다.
 *
 * payload는 lib/artifact.ts의 parseArtifact를 통과한 것만 들어온다. 그래야
 * jsonb 칸에 자유 텍스트가 들어올 경로가 없다.
 */
export async function saveArtifact(
  kidId: string,
  lessonId: string,
  payload: ArtifactPayload,
): Promise<void> {
  const { error } = await serverSupabase()
    .from("artifacts")
    .insert({ kid_id: kidId, lesson_id: lessonId, payload });

  if (error) throw error;
}

/** kids 한 행을 지운다. progress·badges·artifacts는 on delete cascade가 따라 지운다. */
export async function deleteKid(kidId: string): Promise<void> {
  const { error } = await serverSupabase().from("kids").delete().eq("id", kidId);
  if (error) throw error;
}
