"use client";

import { useEffect, useState } from "react";

export interface Me {
  nickname: string;
  completedLessons: string[];
}

/**
 * 랜딩은 SEO 대상이라(설계 문서 3장) 정적으로 두고 싶다. 세션은 서버에서
 * 읽어야 하는데 그러면 페이지가 요청마다 그려진다. 그래서 로그인 여부와 진도를
 * 브라우저에서 한 번 물어본다. 첫 화면의 두 곳(계정 버튼, 레슨 목록)이 같은
 * 답을 쓰므로 여기로 모았다 -- 각자 부르면 같은 요청이 두 번 나간다.
 */
export function useMe(): { me: Me | null; loaded: boolean } {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.json())
      .then((data) =>
        setMe(
          data.kid
            ? { nickname: data.kid.nickname, completedLessons: data.kid.completedLessons ?? [] }
            : null,
        ),
      )
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  return { me, loaded };
}
