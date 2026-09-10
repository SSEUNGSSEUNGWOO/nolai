import numpy as np

from build_daily import assign_dates, neighbor_ids, pick_answers


def _unit(rows):
    v = np.array(rows, dtype=float)
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def test_neighbor_ids_returns_closest_first_excluding_self():
    ids = [10, 20, 30, 40]
    vectors = _unit([[1, 0], [0.9, 0.1], [0, 1], [-1, 0]])

    assert neighbor_ids(vectors, ids, index=0, count=2) == [20, 30]


def test_pick_answers_prefers_words_with_rich_neighborhood():
    # 0·1·2는 서로 가깝고(이웃이 풍부), 3은 혼자 멀리 있다
    ids = [1, 2, 3, 4]
    vectors = _unit([[1, 0], [0.95, 0.05], [0.9, 0.1], [0, 1]])
    words = [
        {"id": 1, "word": "강아지", "grade": 1},
        {"id": 2, "word": "고양이", "grade": 1},
        {"id": 3, "word": "호랑이", "grade": 2},
        {"id": 4, "word": "외톨이", "grade": 1},
    ]

    picked = pick_answers(words, vectors, ids, count=3, top=3, max_grade=2, seed=1)

    assert {w["id"] for w in picked} == {1, 2, 3}


def test_pick_answers_skips_single_syllable_and_high_grade():
    ids = [1, 2, 3]
    vectors = _unit([[1, 0], [0.9, 0.1], [0.8, 0.2]])
    words = [
        {"id": 1, "word": "가", "grade": 1},
        {"id": 2, "word": "가게", "grade": 1},
        {"id": 3, "word": "군밤", "grade": 3},
    ]

    assert [w["id"] for w in pick_answers(words, vectors, ids, count=5, top=2, max_grade=2, seed=1)] == [2]


def test_assign_dates_starts_at_given_day_and_is_consecutive():
    dates = assign_dates("2026-09-11", 3)

    assert dates == ["2026-09-11", "2026-09-12", "2026-09-13"]
