import Link from "next/link";
import { redirect } from "next/navigation";
import { currentKidId } from "@/lib/auth/current";
import { loadRoom, type RoomArtifact } from "@/lib/room";
import { getDataset, listLessons } from "@/lib/content";
import { account, badgeNames, ui } from "@/copy/ui";
import LogoutButton from "./LogoutButton";
import DeleteRoomButton from "./DeleteRoomButton";
import ArtifactCard, { type ArtifactView } from "./ArtifactCard";
import Image from "next/image";
import { badgeArt, EMPTY_SHELF_ART } from "@/lib/art";

// 세션 쿠키를 읽으므로 요청마다 그린다.
export const dynamic = "force-dynamic";

export default async function RoomPage() {
  const kidId = await currentKidId();
  const room = kidId ? await loadRoom(kidId) : null;

  // 쿠키가 없거나, 서명은 맞는데 계정이 지워진 경우다.
  if (!room) redirect("/join");

  const lessons = listLessons();
  const titleOf = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));
  const views = room.artifacts
    .map((artifact) => toView(artifact, titleOf.get(artifact.lessonId) ?? artifact.lessonId))
    .filter((view): view is ArtifactView => view !== null);
  const done = new Set(room.completedLessons);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-8 lg:max-w-4xl">
      <header className="flex items-center justify-between text-sm font-extrabold">
        <Link href="/">← {ui.landingTitle}</Link>
        <LogoutButton />
      </header>

      <h1 className="text-3xl font-black">
        {room.nickname}의 {account.roomTitle}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{account.roomBadges}</h2>
        {room.badges.length === 0 ? (
          <div className="flex items-center gap-3">
            <Image src={EMPTY_SHELF_ART} alt="" width={72} height={72} className="h-18 w-18" />
            <p className="text-sm text-muted">{account.roomNoBadges}</p>
          </div>
        ) : (
          <ul data-testid="badge-shelf" className="flex flex-wrap gap-2">
            {room.badges.map((badge) => (
              <li
                key={badge}
                data-testid={`badge-${badge}`}
                className="flex items-center gap-2 rounded-pop border-[2.5px] border-ink bg-candy-yellow py-1 pl-2 pr-4 font-extrabold shadow-[0_3px_0_var(--color-ink)]"
              >
                <Image src={badgeArt(badge)} alt="" width={40} height={40} className="h-10 w-10" />
                {badgeNames[badge] ?? badge}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{account.roomArtifacts}</h2>
        {views.length === 0 ? (
          <p className="text-sm text-muted">{account.roomNoArtifacts}</p>
        ) : (
          <ul data-testid="artifact-shelf" className="grid gap-3 sm:grid-cols-2">
            {views.map((view) => (
              <ArtifactCard key={view.id} view={view} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{account.roomProgress}</h2>
        <ul className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                href={`/lesson/${lesson.id}`}
                data-testid={`room-lesson-${lesson.id}`}
                data-done={done.has(lesson.id) ? "true" : undefined}
                className="flex items-center justify-between rounded-pop border-[2.5px] border-ink bg-candy-red px-5 py-3 font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)]"
              >
                <span>
                  {lesson.order}. {lesson.title}
                </span>
                <span>{done.has(lesson.id) ? "✅" : "▶"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex items-center justify-between pt-6 text-xs text-muted">
        <Link href="/privacy" className="underline">개인정보처리방침</Link>
        <DeleteRoomButton />
      </footer>
    </main>
  );
}

/**
 * 저장된 결과물을 화면이 그릴 수 있는 모양으로 바꾼다.
 *
 * 데이터셋이 바뀌어 id가 사라졌을 수 있다. 그런 작품은 조용히 빼고 나머지를
 * 보여준다 -- 예전 작품 하나 때문에 내 방 전체가 죽으면 안 된다.
 */
function toView(artifact: RoomArtifact, lessonTitle: string): ArtifactView | null {
  try {
    const payload = artifact.payload;

    if ("placedIds" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "words") return null;

      const colorOf = new Map(dataset.categories.map((c) => [c.id, c.color]));
      const dots = payload.placedIds
        .map((id) => dataset.words.find((word) => word.id === id))
        .filter((word) => word !== undefined)
        .map((word) => ({
          id: word.id,
          x: word.x,
          y: word.y,
          color: colorOf.get(word.category) ?? "#FFFFFF",
        }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "words", dots, categories: dataset.categories },
      };
    }

    if ("made" in payload) {
      const images = payload.made.map((n) => ({
        id: String(n),
        label: String(n),
        emoji: "💡",
      }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("judged" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "sentiment") return null;

      const images = payload.judged
        .map((id) => dataset.sentences.find((one) => one.id === id))
        .filter((one) => one !== undefined)
        .map((one) => ({ id: one.id, label: one.text, emoji: "🤔" }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("sentences" in payload) {
      const images = payload.sentences.map((words, index) => ({
        id: String(index),
        label: words.join(" "),
        emoji: "📝",
      }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("compared" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "similarity") return null;

      const images = payload.compared
        .map((pair) => {
          const [a, b] = pair.split("|");
          const left = dataset.words.find((w) => w.id === a);
          const right = dataset.words.find((w) => w.id === b);
          if (!left || !right) return undefined;

          return {
            id: pair,
            label: `${left.label} ↔ ${right.label}`,
            emoji: "⚖️",
          };
        })
        .filter((one) => one !== undefined);

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("tried" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "analogy") return null;

      const images = payload.tried
        .map((key) => {
          const [relationId, subjectId] = key.split("|");
          const relation = dataset.relations.find((r) => r.id === relationId);
          const subject = dataset.subjects.find((s) => s.id === subjectId);
          if (!relation || !subject) return undefined;

          return {
            id: key,
            label: `${subject.label} + [${relation.label}]`,
            emoji: subject.emoji,
          };
        })
        .filter((one) => one !== undefined);

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("triedGroupings" in payload) {
      const images = payload.triedGroupings.map((k) => ({
        id: String(k),
        label: `${k}개로`,
        emoji: "🧩",
      }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("itemIds" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "tokens") return null;

      const images = payload.itemIds
        .map((id) => dataset.items.find((item) => item.id === id))
        .filter((item) => item !== undefined)
        .map((item) => ({ id: item.id, label: item.text, emoji: "✂️" }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("soundIds" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "sounds") return null;

      // 화면에 보여줄 모양이 그림 작품과 같아서 같은 카드를 쓴다.
      const images = payload.soundIds
        .map((id) => dataset.sounds.find((sound) => sound.id === id))
        .filter((sound) => sound !== undefined)
        .map((sound) => ({ id: sound.id, label: sound.label, emoji: sound.emoji }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("imageIds" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "pixels") return null;

      const images = payload.imageIds
        .map((id) => dataset.images.find((image) => image.id === id))
        .filter((image) => image !== undefined)
        .map((image) => ({ id: image.id, label: image.label, emoji: image.emoji }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "pixels", images },
      };
    }

    if ("likedIds" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "words") return null;

      const colorOf = new Map(dataset.categories.map((c) => [c.id, c.color]));
      const chips = payload.likedIds
        .map((id) => dataset.words.find((word) => word.id === id))
        .filter((word) => word !== undefined)
        .map((word) => ({
          label: `${word.emoji} ${word.label}`,
          color: colorOf.get(word.category) ?? "#FFFFFF",
        }));

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "likes", chips },
      };
    }

    if ("taught" in payload) {
      const dataset = getDataset(payload.datasetId);
      if (dataset.kind !== "words") return null;

      const wordById = new Map(dataset.words.map((word) => [word.id, word]));
      const boxes = dataset.categories
        .map((category) => ({
          label: category.label,
          color: category.color,
          words: payload.taught
            .filter((t) => t.categoryId === category.id)
            .map((t) => wordById.get(t.wordId))
            .filter((word) => word !== undefined)
            .map((word) => `${word.emoji} ${word.label}`),
        }))
        .filter((box) => box.words.length > 0);

      return {
        id: artifact.id,
        lessonTitle,
        createdAt: artifact.createdAt,
        detail: { kind: "teach", boxes, count: payload.taught.length },
      };
    }

    const dataset = getDataset(payload.datasetId);
    if (dataset.kind !== "passages") return null;

    const questions = payload.questionIds
      .map((id) => dataset.questions.find((question) => question.id === id))
      .filter((question) => question !== undefined)
      .map((question) => question.text);

    return {
      id: artifact.id,
      lessonTitle,
      createdAt: artifact.createdAt,
      detail: { kind: "passages", questions },
    };
  } catch {
    return null;
  }
}
