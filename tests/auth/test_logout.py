from libs.cache.cache import add_to_cache, get_value


def set_auth_token(client, token):
    with client.session_transaction() as session:
        session["auth_token"] = token


def test_logout_removes_session_token_cached_profile_and_active_team_cookie(client):
    token = "token-to-revoke"
    profile = {"user": "coach"}
    add_to_cache(token, profile, 7200)
    set_auth_token(client, token)
    client.set_cookie("activeTeamId", "17")

    response = client.get("/auth/logout")

    assert response.status_code == 302
    assert response.headers["Location"] == "/"
    with client.session_transaction() as session:
        assert "auth_token" not in session
    assert get_value(token) is None
    assert any(
        header.startswith("activeTeamId=;") and "Expires=Thu, 01 Jan 1970" in header
        for header in response.headers.getlist("Set-Cookie")
    )


def test_logged_out_token_cannot_be_reused(client):
    token = "copied-token"
    add_to_cache(token, {"user": "coach"}, 7200)
    set_auth_token(client, token)

    client.get("/auth/logout")
    set_auth_token(client, token)

    response = client.get("/dashboard/")

    assert response.status_code == 302
    assert response.headers["Location"] == "/auth/login/access"


def test_repeated_logout_without_token_or_active_team_cookie_is_safe(client):
    first_response = client.get("/auth/logout")
    second_response = client.get("/auth/logout")

    assert first_response.status_code == 302
    assert second_response.status_code == 302
    assert first_response.headers["Location"] == "/"
    assert second_response.headers["Location"] == "/"
