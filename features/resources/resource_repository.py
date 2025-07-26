
from typing import List, Optional

from features.db.db import fetch_all, fetch_one, execute_modifying_query
from features.resources.resource import Resource

def get_resources_by_team_id(team_id: int) -> List[Resource]:
    query = """
            SELECT id, filename, file_path, team_id
            FROM Files
            WHERE team_id = ?
            ORDER BY filename \
            """
    result = fetch_all(query, (team_id,))
    return [Resource(*row) for row in result]

def get_resource_by_id(resource_id: int) -> Optional[Resource]:
    query = """
            SELECT id, filename, file_path, team_id
            FROM Files
            WHERE id = ? \
            """
    result = fetch_one(query, (resource_id,))
    return Resource(*result) if result else None

def create_resource(filename: str, file_path: str, team_id: int) -> Resource:
    query = """
            INSERT INTO Files (filename, file_path, team_id)
            VALUES (?, ?, ?) \
            """
    params = (filename, file_path, team_id)
    execute_modifying_query(query, params)

    result_query = """
                   SELECT id, filename, file_path, team_id
                   FROM Files
                   WHERE file_path = ? AND team_id = ? \
                   """
    result = fetch_one(result_query, (file_path, team_id))
    return Resource(*result)

def delete_resource(resource_id: int) -> bool:
    query = """
            DELETE FROM Files
            WHERE id = ? \
            """
    execute_modifying_query(query, (resource_id,))
    return True