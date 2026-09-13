from types import SimpleNamespace
from unittest.mock import Mock
from pathlib import Path

import pytest

from features.games import game_view
from features.users.role import Role
from libs.cache.cache import add_to_cache


def authenticate(client, role):
    profile = SimpleNamespace(user=SimpleNamespace(id=1, username='coach', role=role), team_ids=[17], token='game-audit', active_team_name=None, active_team_logo=None)
    add_to_cache(profile.token, profile, 7200)
    with client.session_transaction() as session:
        session['auth_token'] = profile.token
    client.set_cookie('activeTeamId', '17')


@pytest.mark.parametrize('action', ['update', 'update/game_data', 'delete'])
@pytest.mark.parametrize('access', ['anonymous', 'player', 'wrong_team', 'valid'])
def test_game_mutations_enforce_access(client, app, monkeypatch, action, access):
    # Browser coverage checks real CSRF submission; isolate authorization here.
    app.config['WTF_CSRF_ENABLED'] = False
    app.template_folder = str(Path(__file__).resolve().parents[2] / 'templates')
    if access != 'anonymous':
        authenticate(client, Role.PLAYER if access == 'player' else Role.COACH)
    monkeypatch.setattr(game_view.game_repository, 'get_game_by_id', lambda _: SimpleNamespace(team_id=99 if access == 'wrong_team' else 17))
    writes = {}
    for name in ['update_game_details', 'update_game_data', 'delete_game']:
        writes[name] = Mock()
        monkeypatch.setattr(game_view.game_repository, name, writes[name])
    response = client.post(f'/games/{action}/1', json={'game_data': {'sets': []}, 'video_url': '', 'final_score': '3-1'})
    if access == 'valid':
        assert response.status_code == 200
        assert response.json == {'success': True}
        assert sum(write.call_count for write in writes.values()) == 1
    else:
        assert all(write.call_count == 0 for write in writes.values())
        if access == 'wrong_team':
            assert response.status_code == 401
            assert response.json == {'error': 'Unauthorized'}
        elif access == 'anonymous':
            assert response.status_code == 302
        else:
            assert not response.is_json


def test_invalid_stat_document_is_rejected(client, app, monkeypatch):
    app.config['WTF_CSRF_ENABLED'] = False
    authenticate(client, Role.COACH)
    monkeypatch.setattr(game_view.game_repository, 'get_game_by_id', lambda _: SimpleNamespace(team_id=17))
    write = Mock()
    monkeypatch.setattr(game_view.game_repository, 'update_game_data', write)
    response = client.post('/games/update/game_data/1', json={'game_data': {'sets': [{'team': {'player_stats': {'3': {'aces': -1}}}}]}})
    assert response.status_code == 400
    write.assert_not_called()
