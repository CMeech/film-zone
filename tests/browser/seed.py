"""Reset and seed the disposable Playwright database and resource directory."""

import hashlib
import os
import sqlite3
from pathlib import Path


DB_FILE = Path(os.environ["DB_FILE"])
RESOURCE_ROOT = Path("/app/tests/browser/fixtures")

if DB_FILE.name != "stats-playwright.db":
    raise RuntimeError(f"Refusing to seed unexpected database: {DB_FILE}")

connection = sqlite3.connect(DB_FILE)
try:
    connection.execute("PRAGMA foreign_keys = OFF")
    for table in (
        "Games", "Events", "Announcements", "Files", "Rosters",
        "Players", "UserTeams", "Teams", "Users",
    ):
        connection.execute(f"DELETE FROM {table}")

    legacy_hash = lambda value: hashlib.sha256(value.encode()).hexdigest()
    connection.executemany(
        "INSERT INTO Users (id, password_hash, username, role, display_name) VALUES (?, ?, ?, ?, ?)",
        [
            (1, legacy_hash("admin-pass"), "browser-admin", "admin", "Browser Admin"),
            (2, legacy_hash("coach-pass"), "browser-coach", "coach", "Browser Coach"),
            (3, legacy_hash("player-access"), None, "player", "Falcons Players"),
        ],
    )
    connection.executemany(
        "INSERT INTO Teams (id, year, name, logo_path) VALUES (?, ?, ?, ?)",
        [
            (101, 2026, "Falcons Varsity", None),
            (102, 2026, "Falcons Junior Varsity", None),
        ],
    )
    connection.executemany(
        "INSERT INTO UserTeams (user_id, team_id) VALUES (?, ?)",
        [(1, 101), (1, 102), (2, 101), (3, 101), (3, 102)],
    )
    players = [
        (201, "Alex Morgan", 3, "Setter", 2009),
        (202, "Jordan Lee", 7, "Outside", 2008),
        (203, "Sam Rivera", 12, "Middle", 2009),
    ]
    connection.executemany(
        "INSERT INTO Players (id, name, number, position, birth_year) VALUES (?, ?, ?, ?, ?)",
        players,
    )
    connection.executemany(
        "INSERT INTO Rosters (team_id, player_id) VALUES (101, ?)",
        [(player[0],) for player in players],
    )
    connection.executemany(
        "INSERT INTO Announcements (id, author, message, date, team_id, title) VALUES (?, ?, ?, ?, ?, ?)",
        [
            (301, "browser-coach", "Bring both jerseys and a water bottle.", "2026-08-15", 101, "Tournament reminder"),
            (302, "browser-coach", "Practice starts thirty minutes earlier.", "2026-08-14", 101, "Schedule update"),
        ],
    )
    connection.executemany(
        "INSERT INTO Events (id, name, details, date, location, duration, team_id, event_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (401, "Practice", "Serve receive and transition", "2026-08-19 17:30:00", "North Gym", 120, 101, "Practice"),
            (402, "Falcons vs Tigers", "League match", "2026-08-22 19:00:00", "Home Gym", 120, 101, "Game"),
        ],
    )
    connection.execute(
        "INSERT INTO Games (id, game_data, opponent_name, is_home, final_score, event_id, team_id, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (501, None, "Tigers", 1, "3-1", 402, 101, "https://example.test/film"),
    )

    resource_path = RESOURCE_ROOT / "team-guide.pdf"
    connection.execute(
        "INSERT INTO Files (id, filename, file_path, team_id) VALUES (?, ?, ?, ?)",
        (601, "team-guide.pdf", str(resource_path), 101),
    )
    connection.commit()
finally:
    connection.close()
