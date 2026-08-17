import importlib
from types import SimpleNamespace

from features.teams import team_view
from features.users.role import Role
from libs.auth.set_team import expire_team_header, set_team_header
from libs.cache.cache import add_to_cache, get_value


team_required_module = importlib.import_module("libs.auth.team_required")


def cookie_header(response):
    return next(
        header
        for header in response.headers.getlist("Set-Cookie")
        if header.startswith("activeTeamId=")
    )


def test_production_team_cookie_is_host_only_secure_and_strict(app):
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="Strict",
    )

    with app.test_request_context():
        response = app.make_response("")
        set_team_header(17, response)

    header = cookie_header(response)
    assert header.startswith("activeTeamId=17;")
    assert "HttpOnly" in header
    assert "Secure" in header
    assert "SameSite=Strict" in header
    assert "Path=/" in header
    assert "Domain=" not in header


def test_development_team_cookie_works_without_secure(app):
    app.config.update(
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_SAMESITE="Strict",
    )

    with app.test_request_context():
        response = app.make_response("")
        set_team_header(23, response)

    header = cookie_header(response)
    assert header.startswith("activeTeamId=23;")
    assert "Secure" not in header
    assert "SameSite=Strict" in header


def test_expired_team_cookie_uses_matching_attributes(app):
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    with app.test_request_context():
        response = app.make_response("")
        expire_team_header(response)

    header = cookie_header(response)
    assert header.startswith("activeTeamId=;")
    assert "Expires=Thu, 01 Jan 1970" in header
    assert "HttpOnly" in header
    assert "Secure" in header
    assert "SameSite=Lax" in header
    assert "Path=/" in header
    assert "Domain=" not in header


def authenticated_profile(team_ids=(17,)):
    user = SimpleNamespace(id=3, username="coach", role=Role.ADMIN)
    return SimpleNamespace(
        user=user,
        team_ids=list(team_ids),
        token="team-cookie-token",
        active_team_name=None,
        active_team_logo=None,
    )


def authenticate_client(client, profile):
    add_to_cache(profile.token, profile, 7200)
    with client.session_transaction() as session:
        session["auth_token"] = profile.token


def test_authorized_team_selection_sets_hardened_cookie(
    app, client, monkeypatch
):
    profile = authenticated_profile()
    authenticate_client(client, profile)
    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="Strict",
    )
    monkeypatch.setattr(
        team_view.team_repository,
        "get_teams_by_user_id",
        lambda user_id: [
            SimpleNamespace(id=17, name="Varsity", logo_path="/logo.png")
        ],
    )

    response = client.get("/team/select/17")

    assert response.status_code == 302
    assert response.headers["Location"] == "/dashboard"
    header = cookie_header(response)
    assert "HttpOnly" in header
    assert "Secure" in header
    assert "SameSite=Strict" in header
    assert "Path=/" in header
    assert "Domain=" not in header
    cached_profile = get_value(profile.token)
    assert cached_profile.active_team_name == "Varsity"
    assert cached_profile.active_team_logo == "/logo.png"


def test_unauthorized_team_selection_does_not_set_cookie(client, monkeypatch):
    authenticate_client(client, authenticated_profile())
    monkeypatch.setattr(team_view, "render_template", lambda template: "denied")

    response = client.get("/team/select/99")

    assert response.status_code == 200
    assert not any(
        header.startswith("activeTeamId=")
        for header in response.headers.getlist("Set-Cookie")
    )


def test_malformed_team_cookie_cannot_establish_team_context(client, monkeypatch):
    authenticate_client(client, authenticated_profile())
    client.set_cookie("activeTeamId", "not-a-team")
    monkeypatch.setattr(
        team_required_module,
        "render_template",
        lambda template: "invalid team",
    )

    response = client.get("/announcements/list")

    assert response.status_code == 200
    assert response.data == b"invalid team"
