from flask import current_app
from flask.wrappers import Response


ACTIVE_TEAM_COOKIE = 'activeTeamId'
ACTIVE_TEAM_COOKIE_PATH = '/'


def _cookie_settings():
    return {
        'httponly': True,
        'secure': current_app.config.get('SESSION_COOKIE_SECURE', False),
        'samesite': current_app.config.get('SESSION_COOKIE_SAMESITE'),
        'path': ACTIVE_TEAM_COOKIE_PATH,
    }

def set_team_header(team_id: int, response: Response):
    response.set_cookie(ACTIVE_TEAM_COOKIE, str(team_id), **_cookie_settings())


def expire_team_header(response: Response):
    response.delete_cookie(ACTIVE_TEAM_COOKIE, **_cookie_settings())
