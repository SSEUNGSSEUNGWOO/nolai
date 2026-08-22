import numpy as np
from build_passages import even_angles, flag_tight_races, top_matches


PASSAGE_IDS = ["p1", "p2", "p3", "p4"]


def test_top_matches_orders_by_similarity():
    # 질문 하나: p3가 가장 가깝고 그다음이 p1이다
    similarity = np.array([[0.5, 0.1, 0.9, 0.3]])

    assert top_matches(similarity, PASSAGE_IDS, k=3) == [["p3", "p1", "p4"]]


def test_top_matches_respects_k():
    similarity = np.array([[0.5, 0.1, 0.9, 0.3]])

    assert top_matches(similarity, PASSAGE_IDS, k=1) == [["p3"]]


def test_top_matches_handles_multiple_questions():
    similarity = np.array([[0.9, 0.1, 0.2, 0.3], [0.1, 0.2, 0.3, 0.9]])

    assert top_matches(similarity, PASSAGE_IDS, k=2) == [["p1", "p4"], ["p4", "p3"]]


def test_even_angles_fills_one_turn_without_repeating():
    coords = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0], [0.0, -1.0]])
    angles = even_angles(coords)

    assert sorted(angles) == [0.0, 0.25, 0.5, 0.75]
    assert angles.min() >= 0.0
    assert angles.max() < 1.0


def test_even_angles_keeps_direction_order():
    # 중심에서 본 반시계 방향 순서가 유지돼야 한다. 각도는 한 바퀴를 돌아
    # 0으로 되돌아오므로 크기 비교가 아니라 순환 순서로 확인한다.
    coords = np.array([[2.0, 0.0], [0.0, 2.0], [-2.0, 0.0]])
    angles = even_angles(coords)

    by_angle = list(np.argsort(angles))
    start = by_angle.index(0)
    assert [by_angle[(start + i) % 3] for i in range(3)] == [0, 1, 2]


def test_even_angles_spreads_a_lopsided_cluster():
    # 세 점이 한쪽에 몰려 있어도 간격은 고르게 펴진다
    coords = np.array([[1.0, 0.0], [1.0, 0.01], [1.0, 0.02], [-3.0, 0.0]])
    angles = even_angles(coords)

    assert sorted(angles) == [0.0, 0.25, 0.5, 0.75]


def test_flag_tight_races_silent_when_first_place_is_clear():
    similarity = np.array([[0.9, 0.4, 0.3, 0.2]])

    assert flag_tight_races(similarity, threshold=0.02) == []


def test_flag_tight_races_catches_a_dead_heat():
    similarity = np.array([[0.71, 0.705, 0.3, 0.2]])

    flagged = flag_tight_races(similarity, threshold=0.02)

    assert len(flagged) == 1
    assert flagged[0]["question_index"] == 0
    assert flagged[0]["gap"] < 0.02


def test_flag_tight_races_checks_each_question():
    similarity = np.array([[0.9, 0.4, 0.3, 0.2], [0.5, 0.499, 0.2, 0.1]])

    flagged = flag_tight_races(similarity, threshold=0.02)

    assert [entry["question_index"] for entry in flagged] == [1]
