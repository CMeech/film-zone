from libs.auth.tokens import generate_access_token


def test_access_tokens_are_opaque_and_unpredictable():
    first = generate_access_token()
    second = generate_access_token()

    assert first != second
    assert len(first) >= 32
    assert len(second) >= 32
