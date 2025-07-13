from features.db.db import fetch_one, execute_modifying_query
from features.players.player import Player

def create_player(name, position, number, birth_year) -> Player:
    query = """
        INSERT INTO Players (name, position, number, birth_year)
        VALUES (?, ?, ?, ?)
    """
    params = (name, position, number, birth_year)
    execute_modifying_query(query, params)
    result_query = """
        SELECT p.id, p.name, p.position, p.number, p.birth_year
        FROM Players p
        WHERE p.name = ? and p.position = ? and p.number = ? and p.birth_year = ?
    """
    result_params = (name, position, number, birth_year)
    result = fetch_one(result_query, result_params)
    return Player(*result)