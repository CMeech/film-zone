from types import SimpleNamespace
from pathlib import Path

from features.users.role import Role
from libs.cache.cache import add_to_cache


def _authenticate(client):
    profile = SimpleNamespace(
        user=SimpleNamespace(id=1, username="set-explorer-player", role=Role.PLAYER),
        team_ids=[],
        active_team_name=None,
        active_team_logo=None,
        token="set-explorer-token",
    )
    add_to_cache(profile.token, profile, 7200)
    with client.session_transaction() as session:
        session["auth_token"] = profile.token


def test_set_explorer_requires_authentication(client):
    response = client.get("/set-explorer/")

    assert response.status_code == 302
    assert "/auth/login" in response.headers["Location"]


def test_player_can_load_set_explorer_without_active_team(app, client):
    _authenticate(client)
    app.jinja_loader.searchpath.append(str(Path(__file__).parents[2] / "templates"))

    response = client.get("/set-explorer/")

    assert response.status_code == 200
    assert b'id="set-explorer-scene"' in response.data
    assert b"js/components/set-explorer/set-explorer.js" in response.data
