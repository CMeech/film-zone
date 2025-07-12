from flask.wrappers import Response

def set_team_header(team_id: int, response: Response):
    response.set_cookie('activeTeamId', str(team_id), httponly=True)