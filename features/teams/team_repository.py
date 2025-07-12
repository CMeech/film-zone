from typing import List

from features.db.db import fetch_all, fetch_one, execute_modifying_query
from features.teams.team import Team


def get_team_by_id(team_id) -> Team:
    query = """
        SELECT t.id, t.year, t.name, t.logo_path
        FROM Teams t
        WHERE t.id = ?
    """
    result = fetch_one(query, (team_id,))
    return Team(*result)

def get_all_teams() -> List[Team]:
    query = """
        SELECT t.id, t.year, t.name, t.logo_path
        FROM Teams t
    """
    result = fetch_all(query, ())
    return [Team(*team) for team in result]

def create_team(year, name, logo_path) -> Team:
    query = """
        INSERT INTO Teams (year, name, logo_path)
        VALUES (?, ?, ?)
    """
    params = (year, name, logo_path)
    execute_modifying_query(query, params)
    result_query = """
        SELECT t.id, t.year, t.name, t.logo_path
        FROM Teams t
        WHERE t.name = ?
    """
    result_params = (name,)
    result = fetch_one(result_query, result_params)
    return Team(*result)

def get_teams_by_user_id(user_id) -> List[Team]:
    query = """
            SELECT t.id, t.year, t.name, t.logo_path
            FROM Teams t join UserTeams ut on t.id = ut.team_id and ut.user_id = ?
            ORDER BY t.id DESC
            """
    params = (user_id,)
    result = fetch_all(query, params)
    return [Team(*team) for team in result]

def link_team_to_user(team_id, user_id) -> None:
    query = """
        INSERT INTO UserTeams (team_id, user_id)
        VALUES (?, ?)
    """
    params = (team_id, user_id)
    execute_modifying_query(query, params)