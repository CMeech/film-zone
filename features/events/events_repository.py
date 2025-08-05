
from datetime import date, datetime
from typing import List
from libs.logging.logging import logger

from features.db.db import fetch_all, fetch_one, execute_modifying_query
from features.events.event import Event

def _row_to_dict(row) -> dict:
    return {
        'id': row[0],
        'name': row[1],
        'details': row[2],
        'date': datetime.strptime(row[3], '%Y-%m-%d %H:%M:%S'),
        'location': row[4],
        'duration': row[5],
        'team_id': row[6]
    }

def create_event(name: str, details: str, event_date: date,
                 location: str, duration: int, team_id: int) -> Event:
    query = """
            INSERT INTO Events (name, details, date, location, duration, team_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """
    params = (name, details, event_date, location, duration, team_id)
    execute_modifying_query(query, params)

    result_query = """
                   SELECT id, name, details, date, location, duration, team_id
                   FROM Events
                   WHERE name = ? AND details = ? AND date = ?
                     AND location = ? AND duration = ? AND team_id = ?
                   """
    result = fetch_one(result_query, params)
    return Event.from_dict(_row_to_dict(result))

def get_events_in_range(start: datetime, end: datetime, team_id: int) -> List[Event]:
    query = """
            SELECT id, name, details, date, location, duration, team_id
            FROM events
            WHERE team_id = ?
              AND date >= ?
              AND date < ?
            ORDER BY date
            """
    params = (team_id, start.date(), end.date())
    result = fetch_all(query, params)
    return [Event.from_dict(_row_to_dict(row)) for row in result]

def delete_event(event_id: int, team_id: int) -> bool:
    query = """
            DELETE FROM Events
            WHERE id = ? AND team_id = ?
            """
    params = (event_id, team_id)
    try:
        execute_modifying_query(query, params)
        return True
    except Exception as e:
        logger.error(f"Failed to delete event: {e}")
        return False