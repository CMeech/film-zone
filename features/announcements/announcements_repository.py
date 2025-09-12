from datetime import date
from typing import List

from features.db.db import fetch_all, fetch_one, execute_modifying_query
from features.announcements.announcement import Announcement

def _row_to_dict(row) -> dict:
    return {
        'id': row[0],
        'author': row[1],
        'author_display_name': row[2],
        'message': row[3],
        'date': row[4],
        'team_id': row[5],
        'title': row[6]
    }

def get_all_announcements() -> List[Announcement]:
    query = """
            SELECT a.id, a.author, u.display_name, a.message, a.date, a.team_id, a.title
            FROM Announcements a
                     JOIN Users u ON a.author = u.username
            """
    result = fetch_all(query, ())
    return [Announcement.from_dict(_row_to_dict(row)) for row in result]

def create_announcement(author: str, message: str, team_id: int, title: str) -> Announcement:
    query = """
            INSERT INTO Announcements (author, title, message, date, team_id)
            VALUES (?, ?, ?, ?, ?)
            """
    current_date = date.today()
    params = (author, title, message, current_date, team_id)
    execute_modifying_query(query, params)
    result_query = """
                   SELECT a.id, a.author, u.display_name, a.message, a.date, a.team_id, a.title
                   FROM Announcements a
                            JOIN Users u ON a.author = u.username
                   WHERE a.author = ? AND a.title = ? AND a.message = ? AND a.date = ? AND a.team_id = ?
                   """
    result = fetch_one(result_query, params)
    return Announcement.from_dict(_row_to_dict(result))

def get_announcements_by_team_id(team_id: int) -> List[Announcement]:
    query = """
            SELECT a.id, a.author, u.display_name, a.message, a.date, a.team_id, a.title
            FROM Announcements a
                     JOIN Users u ON a.author = u.username
            WHERE a.team_id = ?
            ORDER BY a.date DESC
            """
    params = (team_id,)
    result = fetch_all(query, params)
    return [Announcement.from_dict(_row_to_dict(row)) for row in result]

def get_announcements_by_team_id_paginated(team_id: int, page: int, page_size: int) -> dict:
    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count - no need to join for count
    count_query = """
                  SELECT COUNT(*)
                  FROM Announcements a
                  WHERE a.team_id = ?
                  """
    total_count = fetch_one(count_query, (team_id,))[0]

    # Get paginated data
    query = """
            SELECT a.id, a.author, u.display_name, a.message, a.date, a.team_id, a.title
            FROM Announcements a
                     JOIN Users u ON a.author = u.username
            WHERE a.team_id = ?
            ORDER BY a.date DESC, a.id DESC
            LIMIT ? OFFSET ?
            """
    params = (team_id, page_size, offset)
    results = fetch_all(query, params)
    announcements = [Announcement.from_dict(_row_to_dict(row)) for row in results]

    return {
        "total": total_count,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total_count + page_size - 1) // page_size,
        "announcements": [
            {
                "id": ann.id,
                "author": ann.author,
                "title": ann.title,
                "authorDisplayName": ann.author_display_name,
                "message": ann.message,
                "date": ann.date,
                "teamId": ann.team_id
            } for ann in announcements
        ]
    }