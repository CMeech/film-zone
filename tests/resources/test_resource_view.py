from types import SimpleNamespace

from features.resources import resource_view
from features.resources.resource import Resource
from features.users.role import Role
from libs.cache.cache import add_to_cache


TEAM_ID = 17


def authenticate_client(client):
    profile = SimpleNamespace(
        user=SimpleNamespace(id=3, username="coach", role=Role.COACH),
        team_ids=[TEAM_ID],
        token="resource-route-token",
        active_team_name=None,
        active_team_logo=None,
    )
    add_to_cache(profile.token, profile, 7200)
    with client.session_transaction() as session:
        session["auth_token"] = profile.token
    client.set_cookie("activeTeamId", str(TEAM_ID))


def get_resource(client, resource_id):
    authenticate_client(client)
    return client.get(f"/resources/view/{resource_id}")


def test_missing_resource_returns_404(client, monkeypatch):
    monkeypatch.setattr(
        resource_view.resource_repository,
        "get_resource_by_id",
        lambda resource_id: None,
    )

    response = get_resource(client, 999)

    assert response.status_code == 404


def test_resource_from_another_team_returns_403(client, monkeypatch):
    monkeypatch.setattr(
        resource_view.resource_repository,
        "get_resource_by_id",
        lambda resource_id: Resource(
            id=resource_id,
            filename="opponent.pdf",
            file_path="/unused/opponent.pdf",
            team_id=99,
        ),
    )

    response = get_resource(client, 1)

    assert response.status_code == 403


def test_authorized_pdf_is_served_inline(client, monkeypatch, tmp_path):
    file_path = tmp_path / "practice-plan.pdf"
    file_path.write_bytes(b"%PDF-1.4 test")
    monkeypatch.setattr(
        resource_view.resource_repository,
        "get_resource_by_id",
        lambda resource_id: Resource(
            id=resource_id,
            filename=file_path.name,
            file_path=str(file_path),
            team_id=TEAM_ID,
        ),
    )

    response = get_resource(client, 2)

    assert response.status_code == 200
    assert response.mimetype == "application/pdf"
    assert "attachment" not in response.headers.get("Content-Disposition", "")
    assert response.data == b"%PDF-1.4 test"


def test_authorized_pptx_is_served_as_attachment(client, monkeypatch, tmp_path):
    file_path = tmp_path / "rotation.pptx"
    file_path.write_bytes(b"pptx test")
    monkeypatch.setattr(
        resource_view.resource_repository,
        "get_resource_by_id",
        lambda resource_id: Resource(
            id=resource_id,
            filename=file_path.name,
            file_path=str(file_path),
            team_id=TEAM_ID,
        ),
    )

    response = get_resource(client, 3)

    assert response.status_code == 200
    assert response.mimetype == (
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
    assert response.headers["Content-Disposition"].startswith("attachment;")
    assert response.data == b"pptx test"


def test_missing_stored_file_returns_500_and_is_logged(
    client, monkeypatch, tmp_path, caplog
):
    missing_path = tmp_path / "missing.pdf"
    monkeypatch.setattr(
        resource_view.resource_repository,
        "get_resource_by_id",
        lambda resource_id: Resource(
            id=resource_id,
            filename=missing_path.name,
            file_path=str(missing_path),
            team_id=TEAM_ID,
        ),
    )

    response = get_resource(client, 4)

    assert response.status_code == 500
    assert "Failed to retrieve resource" in caplog.text
