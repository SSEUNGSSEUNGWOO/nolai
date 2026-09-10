import dictionary from "@/datasets/dictionary.json";

/**
 * 단어 실험실 사전. tools/embed/build_dictionary.py가 만든다.
 *
 * 서버와 화면이 같은 파일을 본다. 화면은 자동완성에 쓰고(검색어는 기기 밖으로
 * 나가지 않는다), 서버는 요청에 실려 온 id가 진짜 사전 단어인지 확인하는 데 쓴다.
 * 벡터는 여기 없다 -- DB에만 있다.
 */
export interface DictWord {
  id: number;
  word: string;
}

/** artifacts.lesson_id에 들어가는 값. 레슨이 아니지만 같은 선반에 놓인다. */
export const LAB_ID = "word-lab";
/** 작품 payload의 datasetId. */
export const DICTIONARY_ID = "dictionary";

const words: DictWord[] = dictionary.words;
const byId = new Map(words.map((w) => [w.id, w]));

export function wordOf(id: number): DictWord | undefined {
  return byId.get(id);
}

export function isWordId(id: unknown): id is number {
  return typeof id === "number" && byId.has(id);
}

/**
 * 자동완성. 앞글자가 맞는 것을 먼저, 그다음 글자를 포함하는 것.
 *
 * 사전이 가나다순이라 startsWith 결과도 가나다순이고, "강아지"가 "강아지풀"보다
 * 앞에 온다. 5천 개를 매 타자마다 훑어도 1ms가 안 된다.
 */
export function searchWords(query: string, limit = 8): DictWord[] {
  const q = query.trim();
  if (!q) return [];

  const starts: DictWord[] = [];
  const includes: DictWord[] = [];
  for (const w of words) {
    if (w.word.startsWith(q)) starts.push(w);
    else if (w.word.includes(q)) includes.push(w);
    if (starts.length >= limit) break;
  }

  return [...starts, ...includes].slice(0, limit);
}
