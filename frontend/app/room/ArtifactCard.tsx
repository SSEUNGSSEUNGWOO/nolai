import type { DatasetCategory } from "@/lib/dataset-schema";

export interface WordsView {
  kind: "words";
  dots: { id: string; x: number; y: number; color: string }[];
  categories: DatasetCategory[];
}

export interface PassagesView {
  kind: "passages";
  questions: string[];
}

export interface ArtifactView {
  id: string;
  lessonTitle: string;
  createdAt: string;
  detail: WordsView | PassagesView;
}

function formatDate(iso: string): string {
  const date = new Date(iso);

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

export default function ArtifactCard({ view }: { view: ArtifactView }) {
  return (
    <li
      data-testid={`artifact-${view.id}`}
      className="flex flex-col gap-2 rounded-pop border-[2.5px] border-ink bg-paper p-3 shadow-[0_3px_0_var(--color-ink)]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-extrabold">{view.lessonTitle}</span>
        <span className="text-xs text-muted">{formatDate(view.createdAt)}</span>
      </div>

      {view.detail.kind === "words" ? (
        <>
          {/* 아이가 놓은 단어만 점으로 다시 그린다. 어느 자리에 무엇이 모였는지가
              그날의 작품이다. */}
          <svg
            viewBox="0 0 100 75"
            className="w-full rounded-md border-2 border-ink bg-cream"
            role="img"
            aria-label={`단어 ${view.detail.dots.length}개를 놓은 지도`}
          >
            {view.detail.dots.map((dot) => (
              <circle
                key={dot.id}
                cx={dot.x * 100}
                cy={dot.y * 75}
                r={3}
                fill={dot.color}
                stroke="var(--color-ink)"
                strokeWidth={1}
              />
            ))}
          </svg>
          <p className="text-xs font-bold text-muted">
            단어 {view.detail.dots.length}개를 놓았어
          </p>
        </>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {view.detail.questions.map((question) => (
              <li key={question} className="text-xs font-bold">
                ❓ {question}
              </li>
            ))}
          </ul>
          <p className="text-xs font-bold text-muted">
            질문 {view.detail.questions.length}개를 찾아봤어
          </p>
        </>
      )}
    </li>
  );
}
