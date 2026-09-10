import json
from pathlib import Path

from build_dictionary import apply_excludes, assign_ids, read_env, select_words


def _row(word, grade=1, pos="명사", field="일반어", meaning="뜻"):
    return {"word": word, "grade": grade, "pos": pos, "field": field, "meaning": meaning}


def test_select_keeps_only_nouns_up_to_max_grade():
    rows = [
        _row("가게", grade=1),
        # 분야 표시는 난이도가 아니다. 고양이가 "전문어(동물)"로 빠지면 안 된다.
        _row("고양이", grade=1, field="전문어(동물)"),
        _row("가까이", grade=1, pos="부사/명사"),
        _row("달리다", grade=1, pos="동사"),
        _row("가건물", grade=4),
        _row("군밤", grade=3),
    ]

    assert [w["word"] for w in select_words(rows, max_grade=3)] == ["가게", "고양이", "군밤"]


def test_select_merges_homographs_keeping_lowest_grade_and_its_meaning():
    rows = [
        _row("가구", grade=3, meaning="집안 식구"),
        _row("가구", grade=1, meaning="집안 살림에 쓰는 기구"),
    ]

    merged = select_words(rows, max_grade=3)

    assert len(merged) == 1
    assert merged[0]["grade"] == 1
    assert merged[0]["meaning"] == "집안 살림에 쓰는 기구"


def test_select_sorts_by_word():
    rows = [_row("나무"), _row("가게"), _row("다리")]

    assert [w["word"] for w in select_words(rows, max_grade=3)] == ["가게", "나무", "다리"]


def test_apply_excludes_drops_listed_words():
    words = [{"word": "가게"}, {"word": "바보"}, {"word": "나무"}]

    assert [w["word"] for w in apply_excludes(words, {"바보"})] == ["가게", "나무"]


def test_assign_ids_keeps_existing_ids_and_appends_new_ones():
    # 작품이 id를 저장하므로, 단어를 빼거나 더해도 남은 단어의 id는 바뀌면 안 된다.
    words = [{"word": "가게"}, {"word": "나무"}, {"word": "새말"}]
    existing = {"가게": 1, "다리": 2, "나무": 3}

    out = assign_ids(words, existing)

    assert [(w["word"], w["id"]) for w in out] == [("가게", 1), ("나무", 3), ("새말", 4)]


def test_assign_ids_starts_at_one_when_nothing_exists():
    out = assign_ids([{"word": "가게"}, {"word": "나무"}], {})

    assert [w["id"] for w in out] == [1, 2]


def test_read_env_strips_quotes_and_skips_comments(tmp_path: Path):
    env_file = tmp_path / ".env.local"
    env_file.write_text(
        '# 주석\nNEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n'
        'SUPABASE_SERVICE_ROLE_KEY="abc"\n\nBROKEN LINE\n',
        encoding="utf-8",
    )

    env = read_env(env_file)

    assert env == {
        "NEXT_PUBLIC_SUPABASE_URL": "https://x.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "abc",
    }


def test_read_source_parses_grade_pos_field_and_first_meaning(tmp_path: Path):
    import openpyxl

    from build_dictionary import SHEET, read_source

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = SHEET
    ws.append(["등급", "어휘", "표준동형어번호수정", "품사", "어종", "원어", "의미", "분야"])
    ws.append(["1등급", "가게", 0, "명사", "고유어", None, "「1」작은 가게.\n「2」노점.", "일반어"])
    # 4등급 시트는 등급 칸에 공백이 붙어 있다("4등급 ")
    ws.append(["4등급 ", "가건물", 0, "명사", "한자어", "假建物", "임시 건물.", "일반어"])
    ws.append([None, None, None, None, None, None, None, None])
    path = tmp_path / "v.xlsx"
    wb.save(path)

    rows = read_source(path)

    assert rows == [
        {"word": "가게", "grade": 1, "pos": "명사", "field": "일반어", "meaning": "「1」작은 가게."},
        {"word": "가건물", "grade": 4, "pos": "명사", "field": "일반어", "meaning": "임시 건물."},
    ]


def test_write_client_json_and_load_existing_ids_roundtrip(tmp_path: Path):
    from build_dictionary import load_existing_ids, write_client_json

    path = tmp_path / "dictionary.json"
    words = [
        {"id": 1, "word": "가게", "grade": 1, "meaning": "x"},
        {"id": 2, "word": "나무", "grade": 2, "meaning": "y"},
    ]

    write_client_json(words, path)

    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["kind"] == "dictionary"
    assert data["words"] == [{"id": 1, "word": "가게"}, {"id": 2, "word": "나무"}]
    assert load_existing_ids(path) == {"가게": 1, "나무": 2}
    assert load_existing_ids(tmp_path / "missing.json") == {}


def test_to_rows_pairs_each_word_with_its_vector():
    import numpy as np

    from build_dictionary import MODEL, to_rows

    words = [{"id": 1, "word": "가게", "grade": 1}, {"id": 2, "word": "나무", "grade": 2}]
    vectors = np.array([[0.5, 0.25], [1.0, 0.0]])

    rows = to_rows(words, vectors)

    assert rows == [
        {"id": 1, "word": "가게", "grade": 1, "model": MODEL, "embedding": [0.5, 0.25]},
        {"id": 2, "word": "나무", "grade": 2, "model": MODEL, "embedding": [1.0, 0.0]},
    ]
