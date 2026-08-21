import numpy as np
from build_dataset import normalize_coords


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
