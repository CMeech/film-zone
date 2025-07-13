from typing import List

from features.db.db import fetch_all, execute_modifying_query
from features.players.player import Player

def add_player_to_roster(player_id: int, team_id: int) -> None:
    query = """
        INSERT INTO Rosters (player_id, team_id)
        VALUES (?, ?)
    """
    execute_modifying_query(query, (player_id, team_id))

def get_players_by_roster_id(team_id: int) -> List[Player]:
    query = """
            SELECT p.id, p.name, p.position, p.number, p.birth_year
            FROM Rosters r
                JOIN Players p ON r.player_id = p.id
            WHERE r.team_id = ?
            """
    result = fetch_all(query, (team_id,))
    return [Player(*result) for result in result]