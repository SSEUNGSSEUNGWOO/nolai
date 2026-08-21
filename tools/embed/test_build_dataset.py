import numpy as np
from build_dataset import flag_category_outliers, normalize_coords


def test_normalize_maps_into_unit_box_with_margin():
    raw = np.array([[-10.0, -10.0], [10.0, 10.0], [0.0, 0.0]])
    out = normalize_coords(raw, margin=0.08)

    assert out.min() >= 0.08 - 1e-9
    assert out.max() <= 0.92 + 1e-9


def test_normalize_preserves_relative_order():
    raw = np.array([[0.0, 0.0], [1.0, 0.0], [2.0, 0.0]])
    out = normalize_coords(raw, margin=0.1)

    assert out[0][0] < out[1][0] < out[2][0]


def test_normalize_handles_degenerate_axis():
    # 모든 y가 같을 때 0으로 나누면 안 된다
    raw = np.array([[0.0, 5.0], [1.0, 5.0]])
    out = normalize_coords(raw, margin=0.1)

    assert np.all(np.isfinite(out))
    assert out[0][1] == out[1][1] == 0.5


def _words(categories: list[str]) -> list[dict]:
    return [
        {"id": f"w{i}", "label": f"단어{i}", "category": category}
        for i, category in enumerate(categories)
    ]


def test_flag_category_outliers_finds_nothing_when_all_correct():
    # 두 무리로 뚜렷이 갈라져 있고, 카테고리 표기도 그 무리와 일치한다
    words = _words(["a", "a", "a", "b", "b", "b"])
    coords = np.array(
        [[0.0, 0.0], [1.0, 0.0], [2.0, 0.0], [10.0, 0.0], [11.0, 0.0], [12.0, 0.0]]
    )

    assert flag_category_outliers(words, coords, k=3) == []


def test_flag_category_outliers_catches_mislabeled_word():
    # w3는 실제로는 b 무리(w4, w5, w6) 바로 옆에 있는데 카테고리는 a로 잘못 적혔다.
    # b 무리를 3개로 채워야 k=3 이웃이 전부 b가 되어 판정이 뚜렷해진다.
    words = _words(["a", "a", "a", "a", "b", "b", "b"])
    coords = np.array(
        [
            [0.0, 0.0],
            [1.0, 0.0],
            [2.0, 0.0],
            [19.0, 0.0],
            [20.0, 0.0],
            [21.0, 0.0],
            [22.0, 0.0],
        ]
    )

    outliers = flag_category_outliers(words, coords, k=3)

    assert len(outliers) == 1
    assert outliers[0]["word"]["id"] == "w3"
