from typing import List, Optional
from features.db.db import fetch_all, fetch_one, execute_modifying_query
from features.games.game import Game

def get_all_games_without_data(team_id: int) -> List[Game]:
    # Excludes game_data (NULL) for lightweight listing + includes date for display
    query = """
            SELECT g.id, NULL as game_data, g.opponent_name, g.final_score,
                   g.event_id, g.team_id, g.is_home, g.video_url,
                   e.date
            FROM Games g
                     LEFT JOIN Events e ON e.id = g.event_id
            WHERE g.team_id = ?
            ORDER BY (e.date IS NULL) ASC, e.date DESC, g.id DESC \
            """
    params = (team_id,)
    result = fetch_all(query, params)
    return [Game(*row) for row in result]

def get_game_by_id(game_id: int) -> Optional[Game]:
    query = """
            SELECT g.id, g.game_data, g.opponent_name, g.final_score,
                   g.event_id, g.team_id, g.is_home, g.video_url,
                   e.date
            FROM Games g
                     LEFT JOIN Events e ON e.id = g.event_id
            WHERE g.id = ? \
            """
    result = fetch_one(query, (game_id,))
    return Game(*result) if result else None

def create_game(game_data, opponent_name, final_score,
                event_id, team_id, is_home, video_url) -> Game:
    query = """
            INSERT INTO Games (game_data, opponent_name, final_score,
                               event_id, team_id, is_home, video_url)
            VALUES (?, ?, ?, ?, ?, ?, ?) \
            """
    params = (game_data, opponent_name, final_score, event_id, team_id, is_home, video_url)
    execute_modifying_query(query, params)

    # Fetch last inserted (include date via JOIN)
    result_query = """
                   SELECT g.id, g.game_data, g.opponent_name, g.final_score,
                          g.event_id, g.team_id, g.is_home, g.video_url,
                          e.date
                   FROM Games g
                            LEFT JOIN Events e ON e.id = g.event_id
                   WHERE g.id = (SELECT MAX(id) FROM Games)
                   """
    result = fetch_one(result_query, ())
    return Game(*result)

def update_game_details(game_id: int, event_id: Optional[int], video_url: Optional[str], final_score: Optional[str]) -> None:
    query = """
            UPDATE Games
            SET event_id = ?, video_url = ?, final_score = ?
            WHERE id = ? \
            """
    params = (event_id, video_url, final_score, game_id)
    execute_modifying_query(query, params)

def update_game_data(game_id: int, game_data: str) -> None:
    query = """
            UPDATE Games
            SET game_data = ?
            WHERE id = ? \
    """
    params = (game_data, game_id)
    execute_modifying_query(query, params)

def delete_game(game_id: int) -> None:
    query = """
            DELETE FROM Games
            WHERE id = ? \
            """
    params = (game_id,)
    execute_modifying_query(query, params)
